/**
 * COMPOSANT GANTT CHART
 * =====================
 * - Affiche le diagramme de Gantt interactif
 * - Gère le zoom et le déplacement
 * - Expose des callbacks pour les interactions
 */

import React, { useMemo, useCallback } from 'react';
import { useProjects } from '../../store/projects';
import { formatGanttData } from './ganttUtils';

export default function GanttChart({ projectId }) {
  const { getProjectById } = useProjects();

  // Mémoization des données formatées
  const chartData = useMemo(() => {
    const project = getProjectById(projectId);
    return formatGanttData(project.tasks);
  }, [projectId, getProjectById]);

  // Gestion du clic sur une tâche
  const handleTaskClick = useCallback((taskId) => {
    console.log(`Tâche ${taskId} cliquée`);
    // Navigation vers le détail de la tâche
  }, []);

  return (
    <div className="gantt-container">
      {/* Implémentation réelle utiliserait une lib comme react-gantt-timeline */}
      <div className="gantt-header">...</div>
      <div className="gantt-body">
        {chartData.map(task => (
          <div 
            key={task.id} 
            className="gantt-task"
            onClick={() => handleTaskClick(task.id)}
            style={{
              left: `${task.position}px`,
              width: `${task.duration}px`
            }}
          >
            {task.name}
          </div>
        ))}
      </div>
    </div>
  );
}
