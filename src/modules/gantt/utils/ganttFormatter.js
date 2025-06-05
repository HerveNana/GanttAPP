/**
 * GANTT CHART DATA FORMATTER - Enhanced Date Handling
 * ==================================================
 * 
 * Utility functions for formatting and validating data for Google Charts Gantt
 * 
 * Key Requirements:
 * - Column 3 (Start Date) MUST be a JavaScript Date object
 * - Column 4 (End Date) MUST be a JavaScript Date object  
 * - End date must be after start date
 * - All date objects must have valid getTime() values
 */

/**
 * Safely creates a Date object from various inputs
 * @param {Date|string|number} dateInput - The date input to convert
 * @returns {Date} A valid Date object
 */
export const safeDate = (dateInput) => {
  try {
    // Handle null, undefined, or empty inputs
    if (dateInput === null || dateInput === undefined || dateInput === '') {
      console.warn("No date input provided, using current date");
      return new Date();
    }
    
    // Handle Date objects
    if (dateInput instanceof Date) {
      if (isNaN(dateInput.getTime())) {
        console.warn("Invalid Date object provided, using current date");
        return new Date();
      }
      return new Date(dateInput.getTime()); // Create a new Date object to avoid reference issues
    }
    
    // Handle string inputs with better parsing
    if (typeof dateInput === 'string') {
      const trimmed = dateInput.trim();
      if (trimmed === '') {
        console.warn("Empty date string provided, using current date");
        return new Date();
      }
      
      // Try parsing the string
      const date = new Date(trimmed);
      if (isNaN(date.getTime())) {
        console.warn(`Could not parse date string: "${trimmed}", using current date`);
        return new Date();
      }
      return date;
    }
    
    // Handle number inputs (timestamps)
    if (typeof dateInput === 'number') {
      if (isNaN(dateInput)) {
        console.warn("NaN provided as date input, using current date");
        return new Date();
      }
      
      const date = new Date(dateInput);
      if (isNaN(date.getTime())) {
        console.warn(`Invalid timestamp: ${dateInput}, using current date`);
        return new Date();
      }
      return date;
    }
    
    // Try generic conversion for other types
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) {
      console.warn(`Could not convert input to date: ${dateInput} (type: ${typeof dateInput}), using current date`);
      return new Date();
    }
    
    return date;
  } catch (error) {
    console.error("Error creating date from input:", dateInput, error);
    return new Date();
  }
};

/**
 * Formats task dependencies for Google Charts Gantt format
 * @param {Array} dependencies - Array of task dependencies
 * @returns {string} Formatted dependencies string
 */
export const formatDependencies = (dependencies) => {
  try {
    if (!dependencies || !Array.isArray(dependencies) || dependencies.length === 0) {
      return null;
    }
    
    // Google Charts expects dependencies as a string in the format "taskId1,taskId2,..."
    const validDeps = dependencies
      .filter(dep => {
        if (!dep) return false;
        // Handle both object format {taskId: 'id'} and string format
        const taskId = typeof dep === 'string' ? dep : dep.taskId;
        return taskId && typeof taskId === 'string';
      })
      .map(dep => typeof dep === 'string' ? dep : dep.taskId);
    
    return validDeps.length > 0 ? validDeps.join(',') : null;
  } catch (error) {
    console.error("Error formatting dependencies:", error);
    return null;
  }
};

/**
 * Formats project tasks into Google Charts Gantt data format
 * @param {Array} tasks - Array of project tasks
 * @returns {Array} Formatted data for Google Charts Gantt
 */
export const formatGanttData = (tasks) => {
  try {
    if (!tasks || !Array.isArray(tasks)) {
      console.warn("No tasks provided or tasks is not an array");
      return [];
    }

console.log("🔄 Formatting tasks for Gantt chart:", tasks.length, "tasks");
    
    // Pre-validate the tasks array
    if (tasks.some(task => !task || typeof task !== 'object')) {
      console.error("❌ Invalid tasks detected in array");
      return [];
    }
    
    // Enhanced debugging for task structure
    tasks.forEach((task, index) => {
      console.group(`📋 Task ${index + 1} Debug:`);
      console.log("Task ID:", task.id);
      console.log("Task Name:", task.name);
      console.log("Start Date Type:", typeof task.startDate, task.startDate);
      console.log("End Date Type:", typeof task.endDate, task.endDate);
      console.log("Start Date is Date:", task.startDate instanceof Date);
      console.log("End Date is Date:", task.endDate instanceof Date);
      if (task.startDate instanceof Date) {
        console.log("Start Date Valid:", !isNaN(task.startDate.getTime()));
      }
      if (task.endDate instanceof Date) {
        console.log("End Date Valid:", !isNaN(task.endDate.getTime()));
      }
      console.groupEnd();
    });
    
    const formattedTasks = tasks.map((task) => {
      try {
        if (!task || !task.id) {
          console.warn("Invalid task or missing task ID:", task);
          return null;
        }
        
        let startDate = safeDate(task.startDate);
        let endDate = safeDate(task.endDate);
        
        // Ensure end date is after start date
        if (endDate <= startDate) {
          console.warn(`Task ${task.id} has end date <= start date, adjusting...`);
          // Add at least 1 day to the end date
          endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);
        }
        
        // Final validation of Date objects
        if (!(startDate instanceof Date) || isNaN(startDate.getTime())) {
          console.error(`Invalid start date for task ${task.id}:`, startDate);
          throw new Error(`Invalid start date for task ${task.id}`);
        }
        
        if (!(endDate instanceof Date) || isNaN(endDate.getTime())) {
          console.error(`Invalid end date for task ${task.id}:`, endDate);
          throw new Error(`Invalid end date for task ${task.id}`);
        }
        
        // One more check to ensure end > start
        if (endDate <= startDate) {
          console.error(`End date still not after start date for task ${task.id}`);
          throw new Error(`Invalid date range for task ${task.id}`);
        }
        
        // Create the formatted task row with validated data
        const formattedTask = [
          String(task.id),                          // Task ID (string)
          task.name || "Unnamed Task",              // Task Name (string)
          task.description || '',                   // Resource (string)
          startDate,                                // Start Date (Date object)
          endDate,                                  // End Date (Date object)
          null,                                     // Duration (calculated automatically)
          Math.min(100, Math.max(0, task.completion || 0)), // Percent Complete (0-100)
          formatDependencies(task.dependencies)    // Dependencies (string)
        ];
        
        // Log success for debugging
        console.log(`✅ Successfully formatted task ${task.id}:`, {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        });
        
        return formattedTask;
        
      } catch (error) {
        console.error(`❌ Error formatting task ${task?.id || 'unknown'}:`, error);
        
        // Try to create a fallback task with safe dates
        try {
          const fallbackStart = new Date();
          const fallbackEnd = new Date(Date.now() + 24 * 60 * 60 * 1000);
          
          return [
            task?.id || `error-${Date.now()}`,
            task?.name || 'Error Task',
            '',
            fallbackStart,
            fallbackEnd,
            null,
            0,
            null
          ];
        } catch (fallbackError) {
          console.error(`❌ Failed to create fallback task:`, fallbackError);
          return null;
        }
      }
    }).filter(task => task !== null); // Filter out any null tasks
    
    console.log(`✅ Formatted ${formattedTasks.length} out of ${tasks.length} tasks successfully`);
    return formattedTasks;
  } catch (error) {
    console.error("❌ Critical error in formatGanttData:", error);
    return [];
  }
};

/**
 * Creates the column configuration for the Gantt chart
 * @returns {Array} Column configuration
 */
export const getGanttColumns = () => {
  try {
    // Google Charts expects column headers as simple strings, not objects
    return [
      'Task ID',
      'Task Name',
      'Resource',
      'Start Date',
      'End Date',
      'Duration',
      'Percent Complete',
      'Dependencies'
    ];
  } catch (error) {
    console.error("Error in getGanttColumns:", error);
    return [
      'Task ID',
      'Task Name',
      'Start Date',
      'End Date'
    ];
  }
};

/**
 * Get column types for data table initialization
 * This is used internally by Google Charts
 * @returns {Array} Column types for Google Charts DataTable
 */
export const getColumnTypes = () => {
  return [
    { type: 'string', label: 'Task ID' },
    { type: 'string', label: 'Task Name' },
    { type: 'string', label: 'Resource' },
    { type: 'date', label: 'Start Date' },
    { type: 'date', label: 'End Date' },
    { type: 'number', label: 'Duration' },
    { type: 'number', label: 'Percent Complete' },
    { type: 'string', label: 'Dependencies' }
  ];
};

/**
 * Gets default options for the Gantt chart
 * @returns {Object} Gantt chart options
 */
export const getDefaultGanttOptions = () => {
  try {
    return {
      height: 400,
      gantt: {
        trackHeight: 30,
        barHeight: 20,
        criticalPathEnabled: true,
        criticalPathStyle: {
          stroke: '#e64a19',
          strokeWidth: 2
        },
        arrow: {
          angle: 100,
          width: 2,
          color: '#757575',
          radius: 0
        },
        defaultStartDate: new Date(),
        sortTasks: true,
        innerGridHorizLine: {
          stroke: '#efefef'
        },
        innerGridTrack: {
          fill: '#f8f8f8'
        },
        labelStyle: {
          fontName: 'Roboto',
          fontSize: 14
        }
      }
    };
  } catch (error) {
    console.error("Error in getDefaultGanttOptions:", error);
    return {
      height: 400,
      gantt: {
        trackHeight: 30
      }
    };
  }
};

/**
 * Validates task dates to ensure they're within project bounds
 * @param {Date} startDate - Task start date
 * @param {Date} endDate - Task end date
 * @param {Date} projectStart - Project start date
 * @param {Date} projectEnd - Project end date
 * @returns {boolean} Whether dates are valid
 */
export const validateTaskDates = (startDate, endDate, projectStart, projectEnd) => {
  try {
    const start = safeDate(startDate);
    const end = safeDate(endDate);
    const pStart = projectStart ? safeDate(projectStart) : null;
    const pEnd = projectEnd ? safeDate(projectEnd) : null;

    // Basic validation: end date must be after start date
    const endAfterStart = end > start;
    
    // If project bounds are specified, validate against them
    if (pStart && pEnd) {
      return (
        endAfterStart &&
        start >= pStart &&
        end <= pEnd
      );
    }
    
    // If no project bounds, just check that end is after start
    return endAfterStart;
  } catch (error) {
    console.error("Error validating task dates:", error);
    return false;
  }
};

/**
 * Validates the Gantt data to ensure it matches Google Charts requirements
 * @param {Array} data - The data array to validate
 * @returns {boolean} Whether the data is valid
 */
export const validateGanttData = (data) => {
  try {
    if (!data || !Array.isArray(data) || data.length === 0) {
      console.error("Gantt data is empty or not an array");
      return false;
    }
    
    // Check that we have column headers
    const headers = data[0];
    if (!Array.isArray(headers) || headers.length < 4) {
      console.error("Gantt data headers are missing or incomplete");
      return false;
    }
    
    // Check that all rows have the same number of columns
    const columnCount = headers.length;
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!Array.isArray(row) || row.length !== columnCount) {
        console.error(`Row ${i} has incorrect number of columns: ${row?.length} (expected ${columnCount})`);
        return false;
      }
      
      // Basic checks for required fields
      if (!row[0]) {
        console.error(`Row ${i} is missing Task ID`);
        return false;
      }
      
      if (!row[3] || !(row[3] instanceof Date)) {
        console.error(`Row ${i} has invalid Start Date: ${row[3]}`);
        return false;
      }
      
      if (!row[4] || !(row[4] instanceof Date)) {
        console.error(`Row ${i} has invalid End Date: ${row[4]}`);
        return false;
      }
      
      if (row[4] <= row[3]) {
        console.error(`❌ Row ${i} has End Date <= Start Date:`, {
          startDate: row[3],
          endDate: row[4],
          taskId: row[0],
          taskName: row[1]
        });
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error("Error validating Gantt data:", error);
    return false;
  }
};

