/**
 * DEBUG UTILITY FOR DATE HANDLING
 * ===============================
 * 
 * This utility helps debug and fix date-related issues in the Gantt app
 */

export const clearProjectCache = () => {
  try {
    localStorage.removeItem('project-storage');
    console.log('✅ Cleared project storage cache');
    return true;
  } catch (error) {
    console.error('❌ Error clearing cache:', error);
    return false;
  }
};

export const debugStoredData = () => {
  try {
    const stored = localStorage.getItem('project-storage');
    if (!stored) {
      console.log('📦 No stored project data found');
      return null;
    }
    
    const parsed = JSON.parse(stored);
    console.group('📊 Stored Project Data Analysis');
    
    if (parsed.state) {
      console.log('Projects count:', parsed.state.projects?.length || 0);
      console.log('Current project:', parsed.state.currentProject?.name || 'None');
      
      if (parsed.state.projects) {
        parsed.state.projects.forEach((project, index) => {
          console.group(`Project ${index + 1}: ${project.name}`);
          console.log('Tasks count:', project.tasks?.length || 0);
          
          if (project.tasks) {
            project.tasks.forEach((task, taskIndex) => {
              console.group(`Task ${taskIndex + 1}: ${task.name}`);
              console.log('Start Date:', task.startDate, '(Type:', typeof task.startDate, ')');
              console.log('End Date:', task.endDate, '(Type:', typeof task.endDate, ')');
              
              // Check if dates are valid
              if (typeof task.startDate === 'string') {
                const startDate = new Date(task.startDate);
                console.log('Start Date Valid:', !isNaN(startDate.getTime()));
              }
              
              if (typeof task.endDate === 'string') {
                const endDate = new Date(task.endDate);
                console.log('End Date Valid:', !isNaN(endDate.getTime()));
              }
              
              console.groupEnd();
            });
          }
          
          console.groupEnd();
        });
      }
    }
    
    console.groupEnd();
    return parsed;
  } catch (error) {
    console.error('❌ Error debugging stored data:', error);
    return null;
  }
};

// Export a convenience function to run all debugging
export const debugAndFix = () => {
  console.log('🔧 Starting date debug process...');
  
  debugStoredData();
  
  console.log('ℹ️ To fix issues, run: window.debugDates.clearCache()');
  
  return true;
};

// Make it available globally for easy access in browser console
if (typeof window !== 'undefined') {
  window.debugDates = {
    clearCache: clearProjectCache,
    debug: debugStoredData,
    debugAndFix
  };
  
  console.log('🔧 Date debugging utilities available at window.debugDates');
}
