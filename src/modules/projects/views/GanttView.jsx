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

import React, { useMemo, useEffect } from 'react';
import { Chart } from 'react-google-charts';
import { useParams } from 'react-router-dom';
import { useProjectStore } from '@store/projectStore';
import GanttToolbar from '@modules/gantt/components/GanttToolbar';
import LoadingOverlay from '@components/LoadingOverlay';
import { formatGanttData } from '@modules/gantt/utils/ganttFormatter';
import { useSnackbar } from 'notistack';

export default function GanttView() {
  const { projectId } = useParams();
  const { enqueueSnackbar } = useSnackbar();
  const { currentProject, loadProject, updateTask } = useProjectStore();

  // Chargement initial du projet
  useEffect(() => {
    const loadData = async () => {
      try {
        await loadProject(projectId);
      } catch (error) {
        enqueueSnackbar('Erreur de chargement du projet', { variant: 'error' });
        console.error('Erreur:', error);
      }
    };
    loadData();
  }, [projectId, loadProject, enqueueSnackbar]);

  /**
   * Formatage des données pour Google Charts
   * Mémoïsé pour éviter des recalculs inutiles
   */
  const chartData = useMemo(() => {
    if (!currentProject?.tasks) return [];
    return formatGanttData(currentProject.tasks);
  }, [currentProject]);

  /**
   * Handler de mise à jour des tâches
   * @param {string} taskId - ID de la tâche modifiée
   * @param {object} updates - Nouvelles propriétés
   */
  const handleTaskUpdate = async (taskId, updates) => {
    try {
      await updateTask(projectId, taskId, updates);
      enqueueSnackbar('Tâche mise à jour', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar('Échec de la mise à jour', { variant: 'error' });
    }
  };

  // Options de configuration du chart
  const chartOptions = {
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
    },
  };

  if (!currentProject) return <LoadingOverlay />;

  return (
    <div className="gantt-container">
      {/* Barre d'outils avec contrôles d'interaction */}
      <GanttToolbar 
        project={currentProject} 
        onZoomChange={(level) => console.log('Zoom:', level)}
      />

      {/* Conteneur principal du diagramme */}
      <div className="gantt-chart-wrapper">
        <Chart
          chartType="Gantt"
          width="100%"
          height="100%"
          data={chartData}
          options={chartOptions}
          chartEvents={[
            {
              eventName: 'select',
              callback: ({ chartWrapper }) => {
                const selection = chartWrapper.getChart().getSelection();
                if (selection.length > 0) {
                  const taskId = chartData[selection[0].row + 1][0];
                  console.log('Tâche sélectionnée:', taskId);
                }
              },
            },
          ]}
        />
      </div>
    </div>
  );
}
