/**
 * SIMPLIFIED GANTT VIEW
 * ====================
 * 
 * A simplified version of the Gantt view that fixes loading issues
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Chart } from 'react-google-charts';
import { useParams } from 'react-router-dom';
import { useProjectStore } from '../../../core/stores/ProjectStore';
import GanttToolbar from '../components/GanttToolbar';
import LoadingOverlay from '../../../core/components/LoadingOverlay';
// Note: We'll handle data formatting directly in this component for simplicity
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
  Alert
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { v4 as uuidv4 } from 'uuid';

export default function GanttViewSimple() {
  const { projectId } = useParams();
  const { enqueueSnackbar } = useSnackbar();
  const { 
    projects, 
    currentProject, 
    selectProject, 
    updateTask, 
    createTask,
    loading
  } = useProjectStore();
  
  // Local state
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    name: '',
    description: '',
    startDate: new Date(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    completion: 0
  });
  const [zoomLevel, setZoomLevel] = useState(100);
  
  // Load project when component mounts
  useEffect(() => {
    if (projectId && projects) {
      selectProject(projectId);
    }
  }, [projectId, projects, selectProject]);
  
  // Chart state
  const [chartReady, setChartReady] = useState(false);
  const [chartError, setChartError] = useState(null);
  
  // Helper function to create valid Date objects for Google Charts
  const createValidDate = (dateInput, fallbackDate = new Date()) => {
    try {
      if (!dateInput) {
        return new Date(fallbackDate);
      }
      
      let date;
      if (dateInput instanceof Date) {
        date = dateInput;
      } else {
        date = new Date(dateInput);
      }
      
      // Validate the date
      if (isNaN(date.getTime())) {
        console.warn('Invalid date detected, using fallback:', dateInput);
        return new Date(fallbackDate);
      }
      
      // Return a new Date object to ensure it's a proper Date instance
      return new Date(date.getTime());
    } catch (error) {
      console.error('Error creating date:', error);
      return new Date(fallbackDate);
    }
  };
  
  // Chart data with proper Google Charts Gantt format
  const chartData = useMemo(() => {
    console.log('🔄 Building Google Charts Gantt data...');
    
    // Create sample data with guaranteed valid dates
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 86400000);
    const nextWeek = new Date(now.getTime() + 7 * 86400000);
    const tenDays = new Date(now.getTime() + 10 * 86400000);
    
    // Google Charts Gantt format: headers + data rows
    const headers = [
      'Task ID',
      'Task Name', 
      'Resource',
      'Start Date',
      'End Date',
      'Duration',
      'Percent Complete',
      'Dependencies'
    ];
    
    const sampleDataRows = [
      ['sample-1', 'Exemple de tâche 1', 'Équipe A', now, nextWeek, null, 25, null],
      ['sample-2', 'Exemple de tâche 2', 'Équipe B', tomorrow, tenDays, null, 50, null]
    ];
    
    const sampleData = [headers, ...sampleDataRows];
    
    // Validate sample data
    console.log('📊 Sample data validation:');
    sampleDataRows.forEach((row, index) => {
      console.log(`Sample row ${index}:`, {
        taskId: row[0],
        taskName: row[1],
        startDate: row[3],
        startDateIsDate: row[3] instanceof Date,
        startDateValid: row[3] instanceof Date && !isNaN(row[3].getTime()),
        endDate: row[4],
        endDateIsDate: row[4] instanceof Date,
        endDateValid: row[4] instanceof Date && !isNaN(row[4].getTime())
      });
    });
    
    if (!currentProject || !currentProject.tasks || currentProject.tasks.length === 0) {
      console.log('📊 No project tasks found, using sample data');
      return sampleData;
    }
    
    try {
      console.log('📊 Processing', currentProject.tasks.length, 'project tasks');
      
      const formattedTasks = currentProject.tasks.map((task, index) => {
        // Create guaranteed valid dates
        const taskStartDate = createValidDate(task.startDate, now);
        const taskEndDate = createValidDate(task.endDate, new Date(taskStartDate.getTime() + 86400000));
        
        // Ensure end date is after start date
        const finalEndDate = taskEndDate <= taskStartDate 
          ? new Date(taskStartDate.getTime() + 86400000)
          : taskEndDate;
        
        // Create row in proper format
        const row = [
          String(task.id || `task-${index}`),                    // Task ID (string)
          String(task.name || `Tâche ${index + 1}`),             // Task Name (string) 
          String(task.description || ''),                        // Resource (string)
          taskStartDate,                                          // Start Date (Date object)
          finalEndDate,                                           // End Date (Date object)
          null,                                                   // Duration (auto-calculated)
          Math.min(100, Math.max(0, Number(task.completion) || 0)), // Percent Complete (number)
          null                                                    // Dependencies (string or null)
        ];
        
        // Log each row for debugging
        console.log(`✅ Task ${index} formatted:`, {
          taskId: row[0],
          taskName: row[1],
          startDate: row[3],
          startDateType: typeof row[3],
          startDateIsDate: row[3] instanceof Date,
          startDateValid: row[3] instanceof Date && !isNaN(row[3].getTime()),
          endDate: row[4],
          endDateType: typeof row[4],
          endDateIsDate: row[4] instanceof Date,
          endDateValid: row[4] instanceof Date && !isNaN(row[4].getTime())
        });
        
        return row;
      });
      
      const result = [headers, ...formattedTasks];
      console.log('✅ Chart data built successfully:', {
        totalRows: result.length,
        dataRows: formattedTasks.length,
        hasHeaders: result[0] === headers
      });
      return result;
      
    } catch (error) {
      console.error('❌ Error formatting chart data:', error);
      console.log('📊 Falling back to sample data');
      return sampleData;
    }
  }, [currentProject]);
  
  // Handlers for toolbar actions
  const handleAddTask = () => {
    setNewTask({
      name: '',
      description: '',
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      completion: 0
    });
    setIsAddTaskOpen(true);
  };

  const handleCreateTask = async () => {
    try {
      await createTask({
        name: newTask.name,
        description: newTask.description,
        startDate: newTask.startDate,
        endDate: newTask.endDate,
        completion: newTask.completion || 0,
        dependencies: []
      });
      
      setIsAddTaskOpen(false);
      enqueueSnackbar('Tâche créée avec succès', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar('Erreur lors de la création de la tâche', { variant: 'error' });
      console.error('Error creating task:', error);
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
        zoomLevel={zoomLevel}
      />

      {/* Chart container */}
      <div className="gantt-chart-wrapper" style={{ height: 'calc(100vh - 200px)' }}>
        {/* Debug Info */}
        <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
          <Typography variant="subtitle2" gutterBottom>État du Diagramme:</Typography>
          <Typography variant="body2">Données disponibles: {chartData ? `${chartData.length - 1} tâches` : 'Aucune'}</Typography>
          <Typography variant="body2">Erreur: {chartError || 'Aucune'}</Typography>
          <Typography variant="body2">Prêt: {chartReady ? '✅' : '⏳'}</Typography>
        </Box>
        
        {chartError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            <strong>Erreur de chargement:</strong> {chartError}
            <Button 
              size="small" 
              sx={{ ml: 2 }}
              onClick={() => {
                setChartError(null);
                setChartReady(false);
              }}
            >
              Réessayer
            </Button>
          </Alert>
        )}
        
        {chartData && chartData.length > 0 ? (
          <Chart
            chartType="Gantt"
            width="100%"
            height="100%"
            data={chartData}
            options={{
              height: 600,
              gantt: {
                trackHeight: Math.floor(40 * (zoomLevel / 100)),
                criticalPathEnabled: false, // Disable to simplify
                sortTasks: true,
                labelStyle: {
                  fontName: 'Arial',
                  fontSize: 12
                },
                // Simplified options to avoid errors
                innerGridHorizLine: {
                  stroke: '#efefef',
                  strokeWidth: 1
                }
              },
            }}
            chartEvents={[
              {
                eventName: 'ready',
                callback: () => {
                  console.log('✅ Chart ready successfully');
                  setChartReady(true);
                  setChartError(null);
                  enqueueSnackbar('Diagramme Gantt chargé', { 
                    variant: 'success',
                    autoHideDuration: 2000
                  });
                }
              },
              {
                eventName: 'error',
                callback: (error) => {
                  console.error('❌ Chart error event:', error);
                  setChartError(`Erreur Google Charts: ${error?.message || 'Erreur inconnue'}`);
                  setChartReady(false);
                  enqueueSnackbar('Erreur de chargement du diagramme', { 
                    variant: 'error'
                  });
                }
              }
            ]}
            loader={
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
                <CircularProgress size={40} />
                <Typography variant="body1" sx={{ ml: 2 }}>
                  Chargement du diagramme Gantt...
                </Typography>
              </Box>
            }
            onError={(error) => {
              console.error('❌ Chart component error:', error);
              setChartError(`Erreur de rendu: ${error?.message || 'Erreur inconnue'}`);
              setChartReady(false);
            }}
          />
        ) : (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h6">Initialisation du diagramme Gantt</Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>Préparer des données de démonstration...</Typography>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleAddTask}
            >
              Ajouter votre première tâche
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
    </div>
  );
}

