/**
 * FIXED GANTT VIEW
 * ================
 * 
 * A properly formatted Gantt view that works with Google Charts
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Chart } from 'react-google-charts';
import { useParams } from 'react-router-dom';
import { useProjectStore } from '../../../core/stores/ProjectStore';
import GanttToolbar from '../components/GanttToolbar';
import LoadingOverlay from '../../../core/components/LoadingOverlay';
import { useSnackbar } from 'notistack';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  TextField, 
  Grid,
  Box,
  Typography,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  OutlinedInput,
  ListItemText,
  Checkbox
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

export default function GanttViewFixed() {
  const { projectId } = useParams();
  const { enqueueSnackbar } = useSnackbar();
  const { 
    projects, 
    currentProject, 
    selectProject, 
    createTask,
    updateTask,
    addDependency,
    removeDependency,
    loading
  } = useProjectStore();
  
  // Local state
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    name: '',
    description: '',
    startDate: new Date(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    completion: 0,
    dependencies: []
  });
  
  // Dependencies management state
  const [isDependencyDialogOpen, setIsDependencyDialogOpen] = useState(false);
  const [selectedTaskForDeps, setSelectedTaskForDeps] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(100);
  
  // Load project when component mounts
  useEffect(() => {
    if (projectId && projects) {
      selectProject(projectId);
    }
  }, [projectId, projects, selectProject]);
  
  // Helper function to create guaranteed valid Date objects
  const createValidDate = (input, fallback = new Date()) => {
    try {
      if (!input) return new Date(fallback);
      
      let date;
      if (input instanceof Date) {
        date = new Date(input.getTime()); // Create new Date instance
      } else {
        date = new Date(input);
      }
      
      // Validate the date
      if (isNaN(date.getTime())) {
        console.warn('Invalid date input, using fallback:', input);
        return new Date(fallback);
      }
      
      return date;
    } catch (error) {
      console.error('Error creating date:', error);
      return new Date(fallback);
    }
  };
  
  // Chart data with Google Charts DataTable format (NO headers in data, using columns definition)
  const chartData = useMemo(() => {
    console.log('🔄 Preparing Google Charts data for project:', currentProject?.name);
    
    if (!currentProject || !currentProject.tasks || currentProject.tasks.length === 0) {
      console.log('📊 No tasks available, creating sample data');
      const sampleStart = createValidDate(new Date());
      const sampleEnd = createValidDate(new Date(Date.now() + 86400000));
      
      // Google Charts format: array of arrays, first element are the column definitions
      return [
        [
          { type: 'string', label: 'Task ID' },
          { type: 'string', label: 'Task Name' },
          { type: 'string', label: 'Resource' },
          { type: 'date', label: 'Start Date' },
          { type: 'date', label: 'End Date' },
          { type: 'number', label: 'Duration' },
          { type: 'number', label: 'Percent Complete' },
          { type: 'string', label: 'Dependencies' }
        ],
        ['sample-task', 'Aucune tâche disponible', null, sampleStart, sampleEnd, 1, 0, null]
      ];
    }
    
    try {
      console.log('📊 Formatting', currentProject.tasks.length, 'tasks with strict validation');
      
      const formattedTasks = currentProject.tasks.map((task, index) => {
        // Create guaranteed valid dates
        const taskStart = createValidDate(task.startDate, new Date());
        const taskEnd = createValidDate(task.endDate, new Date(taskStart.getTime() + 86400000));
        
        // Ensure end date is after start date
        const finalEnd = taskEnd <= taskStart 
          ? new Date(taskStart.getTime() + 86400000)
          : taskEnd;
        
        // Calculate duration in days
        const durationMs = finalEnd.getTime() - taskStart.getTime();
        const durationDays = Math.max(1, Math.round(durationMs / (1000 * 60 * 60 * 24)));
        
        // Format dependencies for Google Charts
        const formattedDependencies = task.dependencies && task.dependencies.length > 0 
          ? task.dependencies.map(dep => dep.taskId || dep).join(',') 
          : null;
        
        const row = [
          String(task.id || `task-${index}`), // Task ID (string)
          String(task.name || `Task ${index + 1}`), // Task Name (string)
          task.description ? String(task.description) : null, // Resource (string or null)
          taskStart, // Start Date (Date object)
          finalEnd, // End Date (Date object)
          durationDays, // Duration (number)
          Math.min(100, Math.max(0, Number(task.completion) || 0)), // Percent Complete (number)
          formattedDependencies // Dependencies (string with comma-separated task IDs)
        ];
        
        // Detailed logging for debugging
        console.log(`✅ Task ${index + 1} formatted:`, {
          id: row[0],
          name: row[1],
          startDate: row[3],
          startDateType: typeof row[3],
          startDateIsDate: row[3] instanceof Date,
          startDateValid: row[3] instanceof Date && !isNaN(row[3].getTime()),
          endDate: row[4],
          endDateType: typeof row[4],
          endDateIsDate: row[4] instanceof Date,
          endDateValid: row[4] instanceof Date && !isNaN(row[4].getTime()),
          duration: row[5],
          durationIsNumber: typeof row[5] === 'number',
          dependencies: row[7],
          dependenciesCount: task.dependencies?.length || 0
        });
        
        return row;
      });
      
      // Google Charts DataTable format with column definitions
      const result = [
        [
          { type: 'string', label: 'Task ID' },
          { type: 'string', label: 'Task Name' },
          { type: 'string', label: 'Resource' },
          { type: 'date', label: 'Start Date' },
          { type: 'date', label: 'End Date' },
          { type: 'number', label: 'Duration' },
          { type: 'number', label: 'Percent Complete' },
          { type: 'string', label: 'Dependencies' }
        ],
        ...formattedTasks
      ];
      
      console.log('✅ Chart data prepared with', formattedTasks.length, 'tasks');
      console.log('📋 First data row sample:', result[1]);
      
      return result;
      
    } catch (error) {
      console.error('❌ Error formatting chart data:', error);
      const errorStart = createValidDate(new Date());
      const errorEnd = createValidDate(new Date(Date.now() + 86400000));
      
      return [
        [
          { type: 'string', label: 'Task ID' },
          { type: 'string', label: 'Task Name' },
          { type: 'string', label: 'Resource' },
          { type: 'date', label: 'Start Date' },
          { type: 'date', label: 'End Date' },
          { type: 'number', label: 'Duration' },
          { type: 'number', label: 'Percent Complete' },
          { type: 'string', label: 'Dependencies' }
        ],
        ['error-task', 'Erreur de chargement', null, errorStart, errorEnd, 1, 0, null]
      ];
    }
  }, [currentProject]);
  
  // Enhanced debug for chart data
  useEffect(() => {
    console.log('📊 Chart data updated:', {
      totalRows: chartData?.length || 0,
      hasColumnDefs: chartData?.[0]?.every(col => typeof col === 'object' && col.type),
      dataRows: chartData?.length > 1 ? chartData.length - 1 : 0
    });
    
    if (chartData && chartData.length > 1) {
      console.log('📋 Column definitions:', chartData[0]);
      console.log('📋 First data row:', chartData[1]);
      console.log('📋 Data types validation:', chartData[1].map((item, index) => {
        const colDef = chartData[0][index];
        const expectedType = colDef?.type;
        const actualType = typeof item;
        const isDate = item instanceof Date;
        const isValid = expectedType === 'date' ? isDate : expectedType === actualType;
        
        return `Col ${index} (${colDef?.label}): expected ${expectedType}, got ${actualType}${isDate ? ' (Date)' : ''} - ${isValid ? '✅' : '❌'}`;
      }));
    }
  }, [chartData]);
  
  // Handlers for toolbar actions
  const handleAddTask = () => {
    setNewTask({
      name: '',
      description: '',
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      completion: 0,
      dependencies: [] // Ensure dependencies is always an array
    });
    setIsAddTaskOpen(true);
  };

  const handleCreateTask = async () => {
    try {
      // Validate task name
      if (!newTask.name || !newTask.name.trim()) {
        enqueueSnackbar('Le nom de la tâche est obligatoire', { variant: 'warning' });
        return;
      }
      
      // Validate dates
      if (!newTask.startDate || !newTask.endDate) {
        enqueueSnackbar('Les dates de début et fin sont obligatoires', { variant: 'warning' });
        return;
      }
      
      if (newTask.endDate <= newTask.startDate) {
        enqueueSnackbar('La date de fin doit être après la date de début', { variant: 'warning' });
        return;
      }
      
      // Format dependencies - ensure dependencies is an array
      const formattedDependencies = (newTask.dependencies || []).map(depId => ({
        taskId: depId,
        type: 'finish-to-start' // Type de dépendance par défaut
      }));
      
      await createTask({
        name: newTask.name.trim(),
        description: newTask.description?.trim() || '',
        startDate: newTask.startDate,
        endDate: newTask.endDate,
        completion: newTask.completion || 0,
        status: 'NOT_STARTED',
        dependencies: formattedDependencies
      });
      
      setIsAddTaskOpen(false);
      setNewTask({
        name: '',
        description: '',
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        completion: 0,
        dependencies: []
      });
      
      enqueueSnackbar('Tâche créée avec succès', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar('Erreur lors de la création de la tâche', { variant: 'error' });
      console.error('Error creating task:', error);
    }
  };
  
  // Handle task selection from chart
  const handleTaskSelect = (taskId) => {
    const task = currentProject?.tasks?.find(t => t.id === taskId);
    if (task) {
      setSelectedTask(task);
      console.log('Tâche sélectionnée:', task);
    }
  };
  
  // Handle dependency management
  const handleManageDependencies = (task) => {
    setSelectedTaskForDeps(task);
    setIsDependencyDialogOpen(true);
  };
  
  const handleAddDependency = async (taskId, dependencyTaskId) => {
    try {
      await addDependency(taskId, {
        taskId: dependencyTaskId,
        type: 'finish-to-start'
      });
      enqueueSnackbar('Dépendance ajoutée avec succès', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar('Erreur lors de l\'ajout de la dépendance', { variant: 'error' });
      console.error('Error adding dependency:', error);
    }
  };
  
  const handleRemoveDependency = async (taskId, dependencyTaskId) => {
    try {
      await removeDependency(taskId, dependencyTaskId);
      enqueueSnackbar('Dépendance supprimée avec succès', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar('Erreur lors de la suppression de la dépendance', { variant: 'error' });
      console.error('Error removing dependency:', error);
    }
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 20, 200));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 20, 50));
  };

  const handleToday = () => {
    console.log('Navigate to today');
  };

  const handleFilter = () => {
    console.log('Open filter dialog');
  };
  
  const handleDependenciesOverview = () => {
    // Show an overview of all dependencies
    if (currentProject && currentProject.tasks && currentProject.tasks.length > 0) {
      const tasksWithDeps = currentProject.tasks.filter(task => task.dependencies && task.dependencies.length > 0);
      if (tasksWithDeps.length > 0) {
        enqueueSnackbar(`${tasksWithDeps.length} tâche(s) avec dépendances trouvée(s)`, { variant: 'info' });
      } else {
        enqueueSnackbar('Aucune dépendance définie dans ce projet', { variant: 'info' });
      }
    } else {
      enqueueSnackbar('Aucune tâche disponible', { variant: 'warning' });
    }
  };
  
  // Show loading overlay while project is loading
  if (loading || !currentProject) {
    return <LoadingOverlay message="Chargement du projet..." />;
  }
  
  return (
    <div className="gantt-container">
      {/* Toolbar */}
      <GanttToolbar 
        onAddTask={handleAddTask}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onToday={handleToday}
        onFilter={handleFilter}
        onDependencies={handleDependenciesOverview}
        zoomLevel={zoomLevel}
      />

      {/* Chart container */}
      <div className="gantt-chart-wrapper" style={{ height: 'calc(100vh - 200px)' }}>
        {chartData && chartData.length > 1 ? (
          <Chart
            chartType="Gantt"
            width="100%"
            height="100%"
            data={chartData}
            options={{
              height: 600,
              gantt: {
                trackHeight: Math.floor(40 * (zoomLevel / 100)),
                criticalPathEnabled: true,
                arrow: {
                  angle: 100,
                  width: 2,
                  color: '#ff0000',
                  radius: 0,
                },
                defaultStartDate: new Date(),
                sortTasks: true,
                labelStyle: {
                  fontName: 'Arial',
                  fontSize: 13
                }
              },
            }}
            chartEvents={[
              {
                eventName: 'ready',
                callback: () => {
                  console.log('✅ Chart ready and rendered successfully');
                  enqueueSnackbar('Diagramme Gantt chargé', { 
                    variant: 'success',
                    autoHideDuration: 2000
                  });
                }
              },
              {
                eventName: 'error',
                callback: (error) => {
                  console.error('❌ Chart error details:', error);
                  console.error('Chart data at error:', chartData);
                  const errorMsg = error?.message || error?.toString() || 'Erreur inconnue';
                  enqueueSnackbar(`Erreur de chargement du diagramme: ${errorMsg}`, { 
                    variant: 'error',
                    autoHideDuration: 5000
                  });
                }
              },
              {
                eventName: 'select',
                callback: ({ chartWrapper }) => {
                  try {
                    const chart = chartWrapper.getChart();
                    const selection = chart.getSelection();
                    
                    if (selection && selection.length > 0 && selection[0].row != null) {
                      const rowIndex = selection[0].row;
                      // Row 0 contains column definitions, data starts at row 1
                      if (rowIndex > 0 && chartData && chartData[rowIndex]) {
                        const taskId = chartData[rowIndex][0];
                        console.log('Tâche sélectionnée dans le graphique:', taskId);
                        handleTaskSelect(taskId);
                      }
                    }
                  } catch (error) {
                    console.error('Erreur lors de la sélection:', error);
                  }
                }
              }
            ]}
            loader={
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
                <CircularProgress />
                <Typography variant="body1" sx={{ ml: 2 }}>
                  Chargement du diagramme...
                </Typography>
              </Box>
            }
          />
        ) : (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h6">Aucune donnée disponible pour le diagramme Gantt</Typography>
            <Button 
              variant="contained" 
              color="primary" 
              sx={{ mt: 2 }}
              onClick={handleAddTask}
            >
              Ajouter une tâche
            </Button>
          </Box>
        )}
      </div>
      
      {/* Task Creation Dialog */}
      <Dialog open={isAddTaskOpen} onClose={() => setIsAddTaskOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Créer une nouvelle tâche</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                label="Nom de la tâche"
                fullWidth
                value={newTask.name}
                onChange={(e) => setNewTask(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Description"
                fullWidth
                multiline
                rows={3}
                value={newTask.description}
                onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
              />
            </Grid>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <Grid item xs={6}>
                <DatePicker
                  label="Date de début"
                  value={newTask.startDate}
                  onChange={(date) => setNewTask(prev => ({ ...prev, startDate: date }))}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Grid>
              <Grid item xs={6}>
                <DatePicker
                  label="Date de fin"
                  value={newTask.endDate}
                  onChange={(date) => setNewTask(prev => ({ ...prev, endDate: date }))}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Grid>
            </LocalizationProvider>
            <Grid item xs={6}>
              <TextField
                label="Progression (%)"
                type="number"
                fullWidth
                value={newTask.completion}
                onChange={(e) => setNewTask(prev => ({ 
                  ...prev, 
                  completion: Math.min(100, Math.max(0, parseInt(e.target.value) || 0)) 
                }))}
                InputProps={{ inputProps: { min: 0, max: 100 } }}
              />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Dépendances</InputLabel>
                <Select
                  multiple
                  value={newTask.dependencies || []}
                  onChange={(e) => setNewTask(prev => ({ ...prev, dependencies: e.target.value || [] }))}
                  input={<OutlinedInput label="Dépendances" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {(selected || []).map((taskId) => {
                        const task = currentProject?.tasks?.find(t => t.id === taskId);
                        return (
                          <Chip 
                            key={taskId} 
                            label={task?.name || taskId} 
                            size="small" 
                          />
                        );
                      })}
                    </Box>
                  )}
                >
                  {currentProject?.tasks?.map((task) => (
                    <MenuItem key={task.id} value={task.id}>
                      <Checkbox checked={(newTask.dependencies || []).includes(task.id)} />
                      <ListItemText primary={task.name} secondary={task.description} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsAddTaskOpen(false)}>Annuler</Button>
          <Button 
            onClick={handleCreateTask} 
            variant="contained" 
            color="primary"
            disabled={!newTask.name || !newTask.startDate || !newTask.endDate}
          >
            Créer
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Task Dependencies Management Dialog */}
      <Dialog 
        open={isDependencyDialogOpen} 
        onClose={() => setIsDependencyDialogOpen(false)} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          Gérer les dépendances - {selectedTaskForDeps?.name}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Dépendances actuelles:
            </Typography>
            
            {selectedTaskForDeps?.dependencies?.length > 0 ? (
              <Box sx={{ mb: 3 }}>
                {selectedTaskForDeps.dependencies.map((dep, index) => {
                  const depTask = currentProject?.tasks?.find(t => t.id === (dep.taskId || dep));
                  return (
                    <Chip
                      key={index}
                      label={depTask?.name || 'Tâche introuvable'}
                      onDelete={() => handleRemoveDependency(selectedTaskForDeps.id, dep.taskId || dep)}
                      color="primary"
                      variant="outlined"
                      sx={{ mr: 1, mb: 1 }}
                    />
                  );
                })}
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Aucune dépendance définie
              </Typography>
            )}
            
            <Typography variant="subtitle1" gutterBottom>
              Ajouter une dépendance:
            </Typography>
            
            <FormControl fullWidth>
              <InputLabel>Sélectionner une tâche</InputLabel>
              <Select
                value=""
                onChange={(e) => {
                  if (e.target.value) {
                    handleAddDependency(selectedTaskForDeps.id, e.target.value);
                  }
                }}
                label="Sélectionner une tâche"
              >
                {currentProject?.tasks
                  ?.filter(task => 
                    task.id !== selectedTaskForDeps?.id && 
                    !selectedTaskForDeps?.dependencies?.some(dep => (dep.taskId || dep) === task.id)
                  )
                  ?.map((task) => (
                    <MenuItem key={task.id} value={task.id}>
                      <ListItemText 
                        primary={task.name} 
                        secondary={`${task.startDate ? new Date(task.startDate).toLocaleDateString() : ''} - ${task.endDate ? new Date(task.endDate).toLocaleDateString() : ''}`}
                      />
                    </MenuItem>
                  ))
                }
              </Select>
            </FormControl>
            
            <Box sx={{ mt: 2 }}>
              <Typography variant="caption" color="text.secondary">
                Note: Les dépendances de type "Finish-to-Start" sont automatiquement appliquées.
                La tâche sélectionnée doit se terminer avant que cette tâche puisse commencer.
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDependencyDialogOpen(false)}>
            Fermer
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Task Details Panel */}
      {selectedTask && (
        <Box 
          sx={{ 
            position: 'fixed', 
            top: 100, 
            right: 20, 
            width: 300, 
            bgcolor: 'background.paper', 
            boxShadow: 3, 
            borderRadius: 1, 
            p: 2,
            zIndex: 1000
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Détails de la tâche</Typography>
            <Button size="small" onClick={() => setSelectedTask(null)}>✕</Button>
          </Box>
          
          <Typography variant="subtitle2" gutterBottom>{selectedTask.name}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {selectedTask.description || 'Aucune description'}
          </Typography>
          
          <Typography variant="caption" display="block">
            Début: {selectedTask.startDate ? new Date(selectedTask.startDate).toLocaleDateString() : 'Non défini'}
          </Typography>
          <Typography variant="caption" display="block">
            Fin: {selectedTask.endDate ? new Date(selectedTask.endDate).toLocaleDateString() : 'Non défini'}
          </Typography>
          <Typography variant="caption" display="block">
            Progression: {selectedTask.completion || 0}%
          </Typography>
          
          {selectedTask.dependencies && selectedTask.dependencies.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="caption" display="block" gutterBottom>
                Dépendances ({selectedTask.dependencies.length}):
              </Typography>
              {selectedTask.dependencies.map((dep, index) => {
                const depTask = currentProject?.tasks?.find(t => t.id === (dep.taskId || dep));
                return (
                  <Chip
                    key={index}
                    label={depTask?.name || 'Tâche introuvable'}
                    size="small"
                    sx={{ mr: 0.5, mb: 0.5 }}
                  />
                );
              })}
            </Box>
          )}
          
          <Box sx={{ mt: 2 }}>
            <Button 
              size="small" 
              variant="outlined" 
              fullWidth
              onClick={() => handleManageDependencies(selectedTask)}
            >
              Gérer les dépendances
            </Button>
          </Box>
        </Box>
      )}
    </div>
  );
}

