/**
 * FINAL GANTT VIEW
 * ================
 * 
 * A properly working Gantt view that handles empty projects correctly
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Chart } from 'react-google-charts';
import { useParams } from 'react-router-dom';
import { useProjectStore } from '../../../core/stores/ProjectStore';
import GanttToolbar from '../components/GanttToolbar';
import LoadingOverlay from '../../../components/LoadingOverlay';
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
  CircularProgress
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

export default function GanttViewFinal() {
  const { projectId } = useParams();
  const { enqueueSnackbar } = useSnackbar();
  const { 
    projects, 
    currentProject, 
    selectProject, 
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
  
  // Check if we have tasks to display
  const hasTasks = currentProject && currentProject.tasks && currentProject.tasks.length > 0;
  
  // Chart data with proper Google Charts formatting - only when we have tasks
  const chartData = useMemo(() => {
    if (!hasTasks) {
      return null; // No data to display
    }
    
    console.log('Preparing chart data for project:', currentProject.name);
    console.log('Number of tasks:', currentProject.tasks.length);
    
    // Google Charts Gantt column headers
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
    
    try {
      const formattedTasks = currentProject.tasks.map((task, index) => {
        console.log(`Processing task ${index}:`, task);
        
        // Ensure dates are Date objects and valid
        let startDate = task.startDate;
        let endDate = task.endDate;
        
        // Handle date conversion carefully
        if (!(startDate instanceof Date)) {
          startDate = new Date(startDate);
        }
        if (!(endDate instanceof Date)) {
          endDate = new Date(endDate);
        }
        
        // Validate dates
        if (isNaN(startDate.getTime())) {
          console.warn(`Invalid start date for task ${task.id}, using current date`);
          startDate = new Date();
        }
        if (isNaN(endDate.getTime())) {
          console.warn(`Invalid end date for task ${task.id}, using start date + 1 day`);
          endDate = new Date(startDate.getTime() + 86400000);
        }
        
        // Ensure end date is after start date
        if (endDate <= startDate) {
          console.warn(`End date before/equal start date for task ${task.id}, adjusting`);
          endDate = new Date(startDate.getTime() + 86400000);
        }
        
        // Calculate duration in days
        const durationMs = endDate.getTime() - startDate.getTime();
        const durationDays = Math.max(1, Math.round(durationMs / (1000 * 60 * 60 * 24)));
        
        const formattedTask = [
          task.id || `task-${index}`, // Task ID (string)
          task.name || `Task ${index + 1}`, // Task Name (string)
          task.description || null, // Resource (string or null)
          startDate, // Start Date (Date object)
          endDate, // End Date (Date object)
          durationDays, // Duration (number)
          Math.min(100, Math.max(0, task.completion || 0)), // Percent Complete (0-100)
          null // Dependencies (string or null)
        ];
        
        console.log(`Formatted task ${index}:`, formattedTask);
        console.log(`Start date type: ${typeof formattedTask[3]}, Is Date: ${formattedTask[3] instanceof Date}`);
        console.log(`End date type: ${typeof formattedTask[4]}, Is Date: ${formattedTask[4] instanceof Date}`);
        
        return formattedTask;
      });
      
      const finalData = [headers, ...formattedTasks];
      console.log('Final chart data prepared with', formattedTasks.length, 'tasks');
      
      return finalData;
      
    } catch (error) {
      console.error('Error formatting chart data:', error);
      enqueueSnackbar('Erreur lors du formatage des données', { variant: 'error' });
      return null;
    }
  }, [currentProject, hasTasks, enqueueSnackbar]);
  
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
      // Validate input
      if (!newTask.name?.trim()) {
        enqueueSnackbar('Le nom de la tâche est obligatoire', { variant: 'warning' });
        return;
      }
      
      // Ensure dates are valid Date objects
      const startDate = newTask.startDate instanceof Date ? newTask.startDate : new Date(newTask.startDate);
      const endDate = newTask.endDate instanceof Date ? newTask.endDate : new Date(newTask.endDate);
      
      // Validate dates
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        enqueueSnackbar('Dates invalides. Veuillez vérifier les dates.', { variant: 'error' });
        return;
      }
      
      if (endDate <= startDate) {
        enqueueSnackbar('La date de fin doit être après la date de début.', { variant: 'error' });
        return;
      }
      
      console.log('Creating task with validated dates:', { 
        name: newTask.name,
        startDate: startDate.toISOString(), 
        endDate: endDate.toISOString() 
      });
      
      await createTask({
        name: newTask.name.trim(),
        description: newTask.description?.trim() || '',
        startDate: startDate,
        endDate: endDate,
        completion: Math.min(100, Math.max(0, newTask.completion || 0)),
        status: 'NOT_STARTED',
        dependencies: []
      });
      
      setIsAddTaskOpen(false);
      enqueueSnackbar('Tâche créée avec succès', { variant: 'success' });
      
      // Reset form
      setNewTask({
        name: '',
        description: '',
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        completion: 0
      });
      
    } catch (error) {
      console.error('Error creating task:', error);
      enqueueSnackbar('Erreur lors de la création de la tâche: ' + (error.message || 'Erreur inconnue'), { variant: 'error' });
    }
  };

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 20, 200));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 20, 50));
  const handleToday = () => console.log('Navigate to today');
  const handleFilter = () => console.log('Open filter dialog');
  
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
        {hasTasks && chartData ? (
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
              }
            }}
            chartEvents={[
              {
                eventName: 'ready',
                callback: () => {
                  console.log('✅ Gantt chart rendered successfully');
                  enqueueSnackbar('Diagramme Gantt chargé', { 
                    variant: 'success',
                    autoHideDuration: 2000
                  });
                }
              },
              {
                eventName: 'error',
                callback: (error) => {
                  console.error('❌ Chart error:', error);
                  console.error('Chart data causing error:', chartData);
                  const errorMsg = error?.message || error?.toString() || 'Erreur inconnue';
                  enqueueSnackbar(`Erreur du diagramme: ${errorMsg}`, { 
                    variant: 'error',
                    autoHideDuration: 5000
                  });
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
          <Box sx={{ 
            p: 4, 
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%'
          }}>
            <Typography variant="h4" gutterBottom color="primary">
              {currentProject?.name || 'Projet'}
            </Typography>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Aucune tâche définie
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 600 }}>
              Ce projet ne contient aucune tâche pour le moment. 
              Créez votre première tâche pour commencer à planifier votre projet 
              et voir le diagramme de Gantt apparaître.
            </Typography>
            <Button 
              variant="contained" 
              color="primary" 
              size="large"
              onClick={handleAddTask}
              sx={{ px: 4, py: 2 }}
            >
              Créer la première tâche
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
                label="Nom de la tâche *"
                fullWidth
                value={newTask.name}
                onChange={(e) => setNewTask(prev => ({ ...prev, name: e.target.value }))}
                required
                error={!newTask.name?.trim()}
                helperText={!newTask.name?.trim() ? 'Le nom est obligatoire' : ''}
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
                  label="Date de début *"
                  value={newTask.startDate}
                  onChange={(date) => setNewTask(prev => ({ ...prev, startDate: date || new Date() }))}
                  slotProps={{ 
                    textField: { 
                      fullWidth: true,
                      required: true
                    } 
                  }}
                />
              </Grid>
              <Grid item xs={6}>
                <DatePicker
                  label="Date de fin *"
                  value={newTask.endDate}
                  onChange={(date) => setNewTask(prev => ({ ...prev, endDate: date || new Date() }))}
                  slotProps={{ 
                    textField: { 
                      fullWidth: true,
                      required: true
                    } 
                  }}
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
            disabled={!newTask.name?.trim() || !newTask.startDate || !newTask.endDate}
          >
            Créer
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

