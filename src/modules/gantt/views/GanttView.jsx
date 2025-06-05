/**
 * VUE PRINCIPALE DU DIAGRAMME DE GANTT
 * ====================================
 * 
 * Responsabilités :
 * - Affiche le diagramme de Gantt interactif
 * - Gère les interactions utilisateur (zoom, sélection, glisser-déposer)
 * - Synchronise l'état avec le store central
 * 
 * Architecture :
 * - Utilise react-google-charts pour le rendu performant
 * - Se connecte au store via des hooks personnalisés
 * - Implémente une logique de mise à jour optimisée
 */

import React, { useMemo, useEffect, useState, useRef, useCallback } from 'react';
import { Chart } from 'react-google-charts';
import { useParams } from 'react-router-dom';
import { useProjectStore } from '../../../core/stores/ProjectStore';
import GanttToolbar from '../components/GanttToolbar';
import LoadingOverlay from '../../../components/LoadingOverlay';
import { 
  formatGanttData, 
  getGanttColumns, 
  getDefaultGanttOptions, 
  validateGanttData, 
  safeDate 
} from '../utils/ganttFormatter';
import { ErrorBoundary } from '../../../core/utils/ErrorBoundary';
import { useSnackbar } from 'notistack';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  TextField, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem,
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

// Define Google Charts loader as a Promise with better error handling
const loadGoogleCharts = () => {
  return new Promise((resolve, reject) => {
    // Check if the script is already loaded and initialized
    if (window.google && window.google.visualization && window.google.visualization.DataTable) {
      console.log("🔍 Google Charts already loaded and initialized");
      resolve();
      return;
    }
    
    // Check if script tag already exists
    const existingScript = document.querySelector('script[src="https://www.gstatic.com/charts/loader.js"]');
    
    if (existingScript) {
      console.log("🔍 Google Charts script already exists, waiting for it to load...");
      // Script exists but may not be fully loaded yet
      if (window.google && window.google.charts) {
        window.google.charts.load('current', { 
          packages: ['gantt'],
          language: 'fr'
        });
        window.google.charts.setOnLoadCallback(() => {
          console.log("✅ Google Charts loaded via existing script");
          resolve();
        });
      } else {
        // Wait for script to load
        const checkGoogleCharts = setInterval(() => {
          if (window.google && window.google.charts) {
            clearInterval(checkGoogleCharts);
            window.google.charts.load('current', { 
              packages: ['gantt'],
              language: 'fr'
            });
            window.google.charts.setOnLoadCallback(() => {
              console.log("✅ Google Charts loaded after waiting");
              resolve();
            });
          }
        }, 100);
        
        // Timeout after 10 seconds
        setTimeout(() => {
          clearInterval(checkGoogleCharts);
          reject(new Error('Google Charts script load timeout'));
        }, 10000);
      }
      return;
    }
    
    // Create and add the script
    console.log("🔍 Adding Google Charts script to page");
    const script = document.createElement('script');
    script.src = 'https://www.gstatic.com/charts/loader.js';
    script.async = true;
    
    script.onload = () => {
      console.log("🔍 Google Charts script loaded, initializing...");
      if (window.google && window.google.charts) {
        window.google.charts.load('current', { 
          packages: ['gantt'],
          language: 'fr'
        });
        window.google.charts.setOnLoadCallback(() => {
          console.log("✅ Google Charts fully initialized");
          resolve();
        });
      } else {
        const error = new Error('Failed to initialize Google Charts after script load');
        console.error(error);
        reject(error);
      }
    };
    
    script.onerror = (event) => {
      const error = new Error('Failed to load Google Charts script');
      console.error(error, event);
      reject(error);
    };
    
    document.head.appendChild(script);
  });
};

export default function GanttView() {
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
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // One week from now
    completion: 0,
    dependencies: []
  });
  const [zoomLevel, setZoomLevel] = useState(100);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [filterOptions, setFilterOptions] = useState({
    showCompleted: true,
    keyword: '',
    dateRange: null
  });
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [chartError, setChartError] = useState(null);
  const [chartLoading, setChartLoading] = useState(true);
  const [chartRetry, setChartRetry] = useState(0);
  const [googleChartsReady, setGoogleChartsReady] = useState(false);
  const chartRef = useRef(null);
  
  // Initial chart data structure - format expected by Google Charts
  const initialChartData = [
    ['Task ID', 'Task Name', 'Resource', 'Start Date', 'End Date', 'Duration', 'Percent Complete', 'Dependencies'],
    ['dummy', 'Loading...', null, new Date(), new Date(Date.now() + 86400000), null, 0, null]
  ];
  
  // Load Google Charts using Promise-based approach
  useEffect(() => {
    console.log("GanttView component mounted");
    
    let mounted = true;
    let retryCount = 0;
    const maxRetries = 3;
    
    const initializeCharts = async () => {
      try {
        console.log("Starting Google Charts initialization");
        
        // Clear any previous error state
        if (mounted) {
          setChartError(null);
          setChartLoading(true);
        }
        
        await loadGoogleCharts();
        
        if (mounted) {
          console.log("✅ Google Charts successfully loaded and initialized");
          setGoogleChartsReady(true);
          setChartLoading(false);
          
          // Force a redraw after a short delay to ensure Google Charts is fully initialized
          setTimeout(() => {
            if (mounted) {
              console.log("🔄 Forcing chart refresh after initialization");
              setChartRetry(prev => prev + 1);
            }
          }, 500);
        }
      } catch (error) {
        console.error(`❌ Failed to load Google Charts (attempt ${retryCount + 1}/${maxRetries}):`, error);
        
        if (mounted) {
          setChartError("Failed to load Google Charts: " + error.message);
          setChartLoading(false);
          
          // Auto-retry with backoff
          if (retryCount < maxRetries) {
            const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff
            console.log(`🔄 Retrying in ${delay/1000} seconds...`);
            
            setTimeout(() => {
              if (mounted) {
                retryCount++;
                console.log(`🔄 Retry attempt ${retryCount}/${maxRetries}`);
                initializeCharts();
              }
            }, delay);
          }
        }
      }
    };
    
    // Start initialization
    initializeCharts();
    
    // Cleanup function
    return () => {
      mounted = false;
      console.log("GanttView component unmounted");
    };
  }, []);
  
  // Load project when component mounts
  useEffect(() => {
    if (projectId && projects) {
      selectProject(projectId);
    }
  }, [projectId, projects, selectProject]);
  
  // Handlers for toolbar actions
  const handleAddTask = () => {
    setNewTask({
      name: '',
      description: '',
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      completion: 0,
      dependencies: []
    });
    setIsAddTaskOpen(true);
  };

  const handleCreateTask = async () => {
    try {
      // Enhanced date validation and conversion
      let startDate, endDate;
      
      // Convert dates with proper validation
      try {
        if (newTask.startDate === null || newTask.startDate === undefined) {
          enqueueSnackbar('La date de début est requise.', { variant: 'error' });
          return;
        }
        
        if (newTask.endDate === null || newTask.endDate === undefined) {
          enqueueSnackbar('La date de fin est requise.', { variant: 'error' });
          return;
        }
        
        // Ensure we have proper Date objects
        startDate = new Date(newTask.startDate);
        endDate = new Date(newTask.endDate);
        
        // Additional validation for invalid dates
        if (isNaN(startDate.getTime())) {
          enqueueSnackbar('Date de début invalide. Veuillez sélectionner une date valide.', { variant: 'error' });
          return;
        }
        
        if (isNaN(endDate.getTime())) {
          enqueueSnackbar('Date de fin invalide. Veuillez sélectionner une date valide.', { variant: 'error' });
          return;
        }
        
        // Normalize times to avoid timezone issues
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        
      } catch (dateError) {
        console.error('Date conversion error:', dateError);
        enqueueSnackbar('Erreur de format des dates. Veuillez réessayer.', { variant: 'error' });
        return;
      }
      
      // Ensure end date is after start date
      if (endDate <= startDate) {
        enqueueSnackbar('La date de fin doit être postérieure à la date de début.', { variant: 'error' });
        return;
      }
      
      // Validate task name
      if (!newTask.name || newTask.name.trim().length === 0) {
        enqueueSnackbar('Le nom de la tâche est requis.', { variant: 'error' });
        return;
      }
      
      console.log('🔄 Creating task with dates:', {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        startDateType: typeof startDate,
        endDateType: typeof endDate,
        startDateValid: !isNaN(startDate.getTime()),
        endDateValid: !isNaN(endDate.getTime())
      });
      
      await createTask({
        name: newTask.name.trim(),
        description: newTask.description?.trim() || '',
        startDate: startDate,
        endDate: endDate,
        status: 'NOT_STARTED',
        completion: Math.min(100, Math.max(0, newTask.completion || 0)),
        dependencies: newTask.dependencies || []
      });
      
      setIsAddTaskOpen(false);
      enqueueSnackbar('Tâche créée avec succès', { variant: 'success' });
      
      // Reset form
      setNewTask({
        name: '',
        description: '',
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        completion: 0,
        dependencies: []
      });
      
    } catch (error) {
      console.error('❌ Error creating task:', error);
      enqueueSnackbar(`Erreur lors de la création de la tâche: ${error.message}`, { variant: 'error' });
    }
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 20, 200));
    updateChartOptions();
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 20, 50));
    updateChartOptions();
  };

  const handleToday = () => {
    // Scroll to today's tasks
    if (chartRef.current) {
      const today = new Date();
      
      // Update chart options to center on today
      setChartOptions(prev => ({
        ...prev,
        gantt: {
          ...prev.gantt,
          defaultStartDate: new Date(today.setHours(0, 0, 0, 0))
        }
      }));
    }
  };

  const handleFilter = () => {
    setIsFilterOpen(true);
  };

  // Note: We removed this useEffect because the project loading is now handled
  // in the first useEffect (line 74) which calls selectProject

  /**
   * Apply filters to tasks
   */
  const applyFilters = (tasks) => {
    if (!tasks) return [];
    
    return tasks.filter(task => {
      // Filter by completion status
      if (!filterOptions.showCompleted && task.completion === 100) {
        return false;
      }
      
      // Filter by keyword
      if (filterOptions.keyword && 
          !task.name.toLowerCase().includes(filterOptions.keyword.toLowerCase()) &&
          !task.description.toLowerCase().includes(filterOptions.keyword.toLowerCase())) {
        return false;
      }
      
      // Filter by date range
      if (filterOptions.dateRange && filterOptions.dateRange.start && filterOptions.dateRange.end) {
        const taskStart = new Date(task.startDate);
        const taskEnd = new Date(task.endDate);
        const rangeStart = new Date(filterOptions.dateRange.start);
        const rangeEnd = new Date(filterOptions.dateRange.end);
        
        if (taskEnd < rangeStart || taskStart > rangeEnd) {
          return false;
        }
      }
      
      return true;
    });
  };

  /**
   * Formatage des données pour Google Charts
   * Mémoïsé pour éviter des recalculs inutiles
   */
  const chartData = useMemo(() => {
    try {
      // Default chart column headers - MUST be strings, not objects
      const headers = ['Task ID', 'Task Name', 'Resource', 'Start Date', 'End Date', 'Duration', 'Percent Complete', 'Dependencies'];
      
      // Log for debugging purposes
      console.log("📊 Preparing chart data for project:", currentProject?.name);
      console.log("🔍 Project data structure:", JSON.stringify(currentProject, (key, value) => {
        // Handle circular references and Date objects for safe logging
        if (key === 'tasks' && Array.isArray(value)) {
          return `[${value.length} tasks]`;
        } else if (value instanceof Date) {
          return value.toISOString();
        }
        return value;
      }, 2).substring(0, 500) + "...");
      
      // Create safe fallback data
      const fallbackDate1 = new Date();
      const fallbackDate2 = new Date(fallbackDate1.getTime() + 86400000);
      const fallbackData = [
        headers,
        ["dummy-task", "Aucune tâche disponible", null, fallbackDate1, fallbackDate2, null, 0, null]
      ];
      
      // Check if we have a project and tasks
      if (!currentProject) {
        console.log("⚠️ No current project available");
        return fallbackData;
      }
      
      if (!currentProject.tasks || !Array.isArray(currentProject.tasks) || currentProject.tasks.length === 0) {
        console.log("⚠️ No tasks available in current project");
        return fallbackData;
      }
      
      // Double-check task structure
      console.log("🔍 First task structure:", JSON.stringify(currentProject.tasks[0], null, 2));
      
      // Apply filters to tasks
      const filteredTasks = applyFilters(currentProject.tasks);
      console.log("🔍 Filtered tasks:", filteredTasks.length, "of", currentProject.tasks.length);
      
      // Check if we have any tasks after filtering
      if (filteredTasks.length === 0) {
        console.log("⚠️ No tasks after filtering");
        return [
          headers,
          ["dummy-task", "Aucune tâche après filtrage", null, new Date(), new Date(Date.now() + 86400000), null, 0, null]
        ];
      }
      
      try {
        // Format the task data for Gantt chart
        const formattedData = formatGanttData(filteredTasks);
        console.log("✅ Formatted chart data:", formattedData.length, "rows");
        console.log("🔍 First formatted row:", JSON.stringify(formattedData[0]));
        
        // Validate formatted data
        if (!formattedData || !Array.isArray(formattedData) || formattedData.length === 0) {
          console.error("❌ Invalid formatted data");
          return fallbackData;
        }
        
        // Create the final data array with headers
        const finalData = [headers, ...formattedData];
        
        // Validate and fix the data structure
        for (let i = 1; i < finalData.length; i++) {
          const row = finalData[i];
          
          // Ensure each row has the correct number of elements
          while (row.length < headers.length) {
            row.push(null);
          }
          
          // Validate and fix date objects
          if (!(row[3] instanceof Date)) {
            console.warn(`⚠️ Invalid start date in row ${i}, fixing:`, row[3]);
            try {
              // Try to parse the date if it's a string
              if (typeof row[3] === 'string') {
                row[3] = new Date(row[3]);
              } else {
                row[3] = new Date();
              }
            } catch (e) {
              row[3] = new Date();
            }
          }
          
          if (!(row[4] instanceof Date)) {
            console.warn(`⚠️ Invalid end date in row ${i}, fixing:`, row[4]);
            try {
              // Try to parse the date if it's a string
              if (typeof row[4] === 'string') {
                row[4] = new Date(row[4]);
              } else {
                row[4] = new Date(Date.now() + 86400000);
              }
            } catch (e) {
              row[4] = new Date(Date.now() + 86400000);
            }
          }
          
          // Ensure start date is before end date
          if (row[3] > row[4]) {
            console.warn(`⚠️ Start date after end date in row ${i}, swapping`);
            const temp = row[3];
            row[3] = row[4];
            row[4] = temp;
          }
        }
        
        console.log("📊 Final chart data structure:", finalData.length, "rows (including header)");
        return finalData;
      } catch (formatError) {
        console.error("❌ Error in formatGanttData:", formatError);
        
        // Create a basic dataset with the actual tasks but minimal formatting
        const basicFormattedData = filteredTasks.map((task, index) => {
          try {
            // Ensure we have valid dates
            let startDate = task.startDate instanceof Date ? task.startDate : new Date(task.startDate);
            let endDate = task.endDate instanceof Date ? task.endDate : new Date(task.endDate);
            
            // Validate dates and use fallbacks if needed
            if (!(startDate instanceof Date) || isNaN(startDate.getTime())) {
              startDate = new Date();
            }
            
            if (!(endDate instanceof Date) || isNaN(endDate.getTime())) {
              endDate = new Date(startDate.getTime() + 86400000);
            }
            
            // If start date is after end date, swap them
            if (startDate > endDate) {
              const temp = startDate;
              startDate = endDate;
              endDate = temp;
            }
            
            return [
              task.id || `task-${index}`,
              task.name || `Task ${index + 1}`,
              null, // Resource
              startDate,
              endDate,
              null, // Duration
              task.completion || 0,
              null // Dependencies
            ];
          } catch (rowError) {
            console.error(`❌ Error formatting task row ${index}:`, rowError);
            return [
              `task-${index}`,
              `Task ${index + 1} (Error)`,
              null,
              new Date(),
              new Date(Date.now() + 86400000),
              null,
              0,
              null
            ];
          }
        });
        
        return [headers, ...basicFormattedData];
      }
    } catch (error) {
      console.error("❌ Error formatting chart data:", error);
      setChartError("Failed to format chart data: " + error.message);
      
      // Return a minimal valid dataset in case of error
      return [
        ['Task ID', 'Task Name', 'Resource', 'Start Date', 'End Date', 'Duration', 'Percent Complete', 'Dependencies'],
        ["error-task", "Erreur: " + error.message, null, new Date(), new Date(Date.now() + 86400000), null, 0, null]
      ];
    }
  }, [currentProject, filterOptions]);

  /**
   * Handler de mise à jour des tâches
   * @param {string} taskId - ID de la tâche modifiée
   * @param {object} updates - Nouvelles propriétés
   */
  const handleTaskUpdate = async (taskId, updates) => {
    try {
      await updateTask(taskId, updates);
      enqueueSnackbar('Tâche mise à jour', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar('Échec de la mise à jour', { variant: 'error' });
      console.error('Error updating task:', error);
    }
  };

  // Options de configuration du chart
  const [chartOptions, setChartOptions] = useState({
    height: 600,
    gantt: {
      trackHeight: 40,
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
  });
  
  // Chart event handlers
  const handleChartReady = useCallback(() => {
    console.log("✅ Chart is ready and rendered");
    setChartLoading(false);
    
    // Log success to help with debugging
    enqueueSnackbar('Diagramme Gantt chargé avec succès', { 
      variant: 'success',
      autoHideDuration: 2000
    });
  }, [enqueueSnackbar]);

  const handleChartError = useCallback((error) => {
    console.error("❌ Chart error:", error);
    const errorMessage = error?.message || "Unknown error";
    setChartError("Failed to load chart: " + errorMessage);
    setChartLoading(false);
    
    // Log the error for the user
    enqueueSnackbar(`Erreur de chargement du diagramme: ${errorMessage}`, { 
      variant: 'error',
      autoHideDuration: 5000
    });
    
    // Only retry a limited number of times
    if (chartRetry < 2) {
      console.log(`🔄 Retrying chart load (attempt ${chartRetry + 1}/3)...`);
      setTimeout(() => {
        setChartError(null);
        setChartLoading(true);
        setChartRetry(prev => prev + 1);
      }, 2000);
    }
  }, [chartRetry, enqueueSnackbar]);

  // Enhanced debugging to track data flow and chart state
  useEffect(() => {
    console.group("🔍 Chart Data and State Debug");
    console.log("Project data:", currentProject);
    console.log("Chart data:", chartData);
    console.log("Google Charts ready:", googleChartsReady);
    console.log("Chart loading:", chartLoading);
    console.log("Chart error:", chartError);
    console.log("Chart retry count:", chartRetry);
    
    // Validate chart data structure
    if (!chartData) {
      console.error("Chart data is null or undefined");
      console.groupEnd();
      return;
    }
    
    console.log("Chart data length:", chartData.length);
    
    // Validate column headers
    if (chartData.length > 0) {
      console.log("Column headers:", chartData[0]);
      if (!Array.isArray(chartData[0]) || chartData[0].length < 4) {
        console.error("❌ Invalid column headers format:", chartData[0]);
      }
    }
    
    // Validate data rows
    if (chartData.length > 1) {
      console.log("First data row:", chartData[1]);
      
      // Check date fields
      if (chartData[1].length >= 5) {
        const startDate = chartData[1][3];
        const endDate = chartData[1][4];
        
        console.log("Start date:", startDate);
        console.log("End date:", endDate);
        console.log("Start date is Date object:", startDate instanceof Date);
        console.log("End date is Date object:", endDate instanceof Date);
        
        if (!(startDate instanceof Date) || !(endDate instanceof Date)) {
          console.error("❌ Invalid date objects in chart data");
        }
      }
    } else {
      console.warn("No data rows in chart data");
    }
    
    console.groupEnd();
  }, [chartData, currentProject, googleChartsReady, chartLoading, chartError, chartRetry]);

  // Update chart options when zoom level changes
  const updateChartOptions = useCallback(() => {
    setChartOptions(prev => ({
      ...prev,
      gantt: {
        ...prev.gantt,
        trackHeight: Math.floor(40 * (zoomLevel / 100)),
      }
    }));
  }, [zoomLevel]);
  
  // Effect to update chart options when zoom level changes
  useEffect(() => {
    updateChartOptions();
  }, [zoomLevel, updateChartOptions]);

  // Coordinate loading states
  useEffect(() => {
    if (currentProject && googleChartsReady) {
      // Both project and Google Charts are ready, we can render the chart
      console.log("🔄 Project and Google Charts ready, preparing to render chart");
      setChartLoading(false);
    } else if (!currentProject) {
      // Project not loaded yet
      console.log("⏳ Waiting for project to load");
      setChartLoading(true);
    } else if (!googleChartsReady) {
      // Google Charts not loaded yet
      console.log("⏳ Waiting for Google Charts to load");
      setChartLoading(true);
    }
  }, [currentProject, googleChartsReady]);
  
  // Handle retry attempts
  useEffect(() => {
    if (chartRetry > 0) {
      console.log(`🔄 Retry attempt ${chartRetry}, resetting chart state`);
      setChartLoading(true);
      setChartError(null);
      
      // Re-initialize charts
      const initializeCharts = async () => {
        try {
          await loadGoogleCharts();
          setGoogleChartsReady(true);
          setChartLoading(false);
        } catch (error) {
          setChartError("Failed to load Google Charts: " + error.message);
          setChartLoading(false);
        }
      };
      
      initializeCharts();
    }
  }, [chartRetry]);

  // Show loading overlay while project is loading
  if (loading || !currentProject) {
    return <LoadingOverlay message="Chargement du projet..." />;
  }
  
  // Show loading if Google Charts is not yet available
  if (!googleChartsReady && chartRetry === 0) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>Chargement de Google Charts...</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Cette opération peut prendre quelques instants
        </Typography>
      </Box>
    );
  }

  return (
    <div className="gantt-container">
      {/* Barre d'outils avec contrôles d'interaction */}
      <GanttToolbar 
        onAddTask={handleAddTask}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onToday={handleToday}
        onFilter={handleFilter}
        zoomLevel={zoomLevel}
      />

      {/* Conteneur principal du diagramme */}
      <div className="gantt-chart-wrapper" style={{ height: 'calc(100vh - 200px)' }}>
        {chartError && (
          <Box sx={{ 
            p: 2, 
            bgcolor: 'error.light', 
            color: 'error.contrastText',
            borderRadius: 1,
            mb: 2
          }}>
            <Typography variant="h6">Error loading chart</Typography>
            <Typography>{chartError}</Typography>
            <Button 
              variant="contained" 
              color="secondary" 
              sx={{ mt: 2 }}
              onClick={() => {
                setChartError(null);
                setChartLoading(true);
              }}
            >
              Retry
            </Button>
          </Box>
        )}
        
        {chartLoading && !chartError && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress />
            <Typography variant="h6" sx={{ ml: 2 }}>Chargement du diagramme Gantt...</Typography>
          </Box>
        )}
        
        <ErrorBoundary
          fallback={
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="h6" color="error">Une erreur est survenue lors du chargement du diagramme.</Typography>
              <Button 
                variant="contained" 
                color="primary" 
                sx={{ mt: 2 }}
                onClick={() => {
                  setChartError(null);
                  setChartLoading(true);
                  setChartRetry(prev => prev + 1);
                }}
              >
                Réessayer
              </Button>
            </Box>
          }
        >
          {chartData && chartData.length > 1 ? (
            <div>
              {/* Debug info */}
              {process.env.NODE_ENV !== 'production' && (
                <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                  <Typography variant="subtitle2" gutterBottom>Debug Info:</Typography>
                  <Typography variant="body2">Google Charts Ready: {googleChartsReady ? '✅' : '❌'}</Typography>
                  <Typography variant="body2">Chart Loading: {chartLoading ? '⏳' : '✅'}</Typography>
                  <Typography variant="body2">Chart Error: {chartError ? '❌ ' + chartError : 'None'}</Typography>
                  <Typography variant="body2">Data Rows: {chartData.length - 1}</Typography>
                  <Typography variant="body2">Chart Retry Count: {chartRetry}</Typography>
                  
                  <Box sx={{ mt: 1 }}>
                    <Button 
                      size="small" 
                      variant="outlined" 
                      onClick={() => {
                        console.log('🔄 Manual chart refresh triggered');
                        setChartLoading(true);
                        setChartError(null);
                        setChartRetry(prev => prev + 1);
                      }}
                    >
                      Force Refresh
                    </Button>
                  </Box>
                </Box>
              )}
              
              <Chart
                ref={chartRef}
                chartType="Gantt"
                width="100%"
                height="100%"
                data={chartData}
                options={{
                  ...chartOptions,
                  gantt: {
                    ...chartOptions.gantt,
                    innerGridTrack: { fill: '#f5f5f5' },
                    innerGridDarkTrack: { fill: '#e9e9e9' },
                    // Ensure proper date rendering
                    minorGridlines: {
                      units: [{
                        format: 'day',
                        count: 1
                      }]
                    },
                    // Set a reasonable default viewport
                    defaultStartDate: currentProject?.tasks?.[0]?.startDate || new Date()
                  },
                  // Enable chart animations for smoother transitions
                  animation: {
                    startup: true,
                    duration: 500,
                    easing: 'out'
                  }
                }}
                chartEvents={[
                  {
                    eventName: 'ready',
                    callback: () => {
                      console.log('✅ Chart rendered successfully');
                      handleChartReady();
                    }
                  },
                  {
                    eventName: 'error',
                    callback: (error) => {
                      console.error('❌ Chart error event triggered:', error);
                      handleChartError(error);
                    }
                  },
                  {
                    eventName: 'select',
                    callback: ({ chartWrapper }) => {
                      try {
                        console.log('Chart selection event triggered');
                        const chart = chartWrapper.getChart();
                        
                        if (!chart) {
                          console.error('Chart object not available');
                          return;
                        }
                        
                        const selection = chart.getSelection();
                        console.log('Selection:', selection);
                        
                        if (selection && selection.length > 0 && selection[0].row > 0) {
                          // Row 0 is headers, so we need to check if the selected row exists
                          if (selection[0].row < chartData.length) {
                            const taskId = chartData[selection[0].row][0];
                            console.log('Selected task ID:', taskId);
                            
                            if (taskId === 'dummy-task' || taskId === 'dummy' || taskId === 'error-task') {
                              console.log('Special task selected, ignoring');
                              return; // Ignore special tasks
                            }
                            
                            setSelectedTaskId(taskId);
                            
                            // Find the task in the current project
                            const selectedTask = currentProject.tasks.find(t => t.id === taskId);
                            if (selectedTask) {
                              console.log('Found selected task:', selectedTask);
                              enqueueSnackbar(`Tâche sélectionnée: ${selectedTask.name}`, { 
                                variant: 'info',
                                autoHideDuration: 2000
                              });
                            } else {
                              console.warn('Selected task not found in project tasks');
                            }
                          }
                        }
                      } catch (error) {
                        console.error("Error in selection callback:", error);
                      }
                    },
                  },
                ]}
                chartPackages={['gantt']}
                chartLanguage="fr"
                loader={
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
                    <CircularProgress />
                    <Typography variant="body1" sx={{ ml: 2 }}>
                      Chargement du diagramme...
                    </Typography>
                  </Box>
                }
              />
            </div>
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
        </ErrorBoundary>
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
            {/* LocalizationProvider is already provided at App level */}
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
            {/* End of date picker section */}
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
                <InputLabel id="dependencies-label">Dépendances</InputLabel>
                <Select
                  labelId="dependencies-label"
                  multiple
                  value={newTask.dependencies}
                  onChange={(e) => setNewTask(prev => ({ ...prev, dependencies: e.target.value }))}
                  renderValue={(selected) => selected.join(', ')}
                >
                  {currentProject.tasks.map((task) => (
                    <MenuItem key={task.id} value={task.id}>
                      {task.name}
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
      
      {/* Filter Dialog */}
      <Dialog open={isFilterOpen} onClose={() => setIsFilterOpen(false)}>
        <DialogTitle>Filtrer les tâches</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                label="Recherche par mot-clé"
                fullWidth
                value={filterOptions.keyword}
                onChange={(e) => setFilterOptions(prev => ({ ...prev, keyword: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl component="fieldset">
                <div>
                  <Button
                    variant={filterOptions.showCompleted ? "contained" : "outlined"}
                    onClick={() => setFilterOptions(prev => ({ ...prev, showCompleted: !prev.showCompleted }))}
                    sx={{ mr: 1 }}
                  >
                    {filterOptions.showCompleted ? "Masquer terminées" : "Afficher terminées"}
                  </Button>
                </div>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <DatePicker
                label="Date début filtre"
                value={filterOptions.dateRange?.start || null}
                onChange={(date) => setFilterOptions(prev => ({ 
                  ...prev, 
                  dateRange: { ...prev.dateRange || {}, start: date } 
                }))}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </Grid>
            <Grid item xs={6}>
              <DatePicker
                label="Date fin filtre"
                value={filterOptions.dateRange?.end || null}
                onChange={(date) => setFilterOptions(prev => ({ 
                  ...prev, 
                  dateRange: { ...prev.dateRange || {}, end: date } 
                }))}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setFilterOptions({
                showCompleted: true,
                keyword: '',
                dateRange: null
              });
            }}
          >
            Réinitialiser
          </Button>
          <Button onClick={() => setIsFilterOpen(false)} variant="contained" color="primary">
            Appliquer
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
