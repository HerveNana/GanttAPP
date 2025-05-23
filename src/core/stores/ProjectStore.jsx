/**
 * STORE DE GESTION DES PROJETS
 * ===========================
 * 
 * Responsabilités :
 * - État global des projets et tâches
 * - Synchronisation avec l'API backend
 * - Gestion des mutations (CRUD)
 * 
 * Architecture :
 * - Utilise Zustand pour le state management
 * - Implémente un système de cache
 * - Optimisation des re-renders via sélecteurs
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { mockProjects } from '../api/mockData';

/**
 * Type d'état initial
 */
const initialState = {
  projects: [],
  currentProjectId: null,
  isLoading: false,
  error: null,
  lastUpdated: null
};

/**
 * Store principal
 */
export const useProjectStore = create(
  persist(
    immer((set, get) => ({
      ...initialState,

      /**
       * Charger tous les projets
       */
      loadProjects: async () => {
        set({ isLoading: true });
        try {
          // Simulation appel API
          const projects = await mockProjects.loadAll();
          set({
            projects,
            isLoading: false,
            lastUpdated: new Date().toISOString()
          });
        } catch (error) {
          set({
            error: error.message,
            isLoading: false
          });
          throw error;
        }
      },

      /**
       * Sélectionner un projet courant
       * @param {string} projectId 
       */
      setCurrentProject: (projectId) => {
        set({ currentProjectId: projectId });
      },

      /**
       * Ajouter une tâche
       * @param {string} projectId 
       * @param {object} taskData 
       */
      addTask: async (projectId, taskData) => {
        set({ isLoading: true });
        try {
          // Simulation appel API
          const updatedProject = await mockProjects.addTask(projectId, taskData);
          
          set((state) => {
            const projectIndex = state.projects.findIndex(p => p.id === projectId);
            if (projectIndex !== -1) {
              state.projects[projectIndex] = updatedProject;
            }
            state.isLoading = false;
            state.lastUpdated = new Date().toISOString();
          });
        } catch (error) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      /**
       * Mettre à jour une tâche
       * @param {string} projectId 
       * @param {string} taskId 
       * @param {object} updates 
       */
      updateTask: async (projectId, taskId, updates) => {
        set({ isLoading: true });
        try {
          // Simulation appel API
          const updatedProject = await mockProjects.updateTask(projectId, taskId, updates);
          
          set((state) => {
            const projectIndex = state.projects.findIndex(p => p.id === projectId);
            if (projectIndex !== -1) {
              state.projects[projectIndex] = updatedProject;
            }
            state.isLoading = false;
            state.lastUpdated = new Date().toISOString();
          });
        } catch (error) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      /**
       * Réinitialiser le store
       */
      reset: () => set(initialState)
    })),
    {
      name: 'project-storage', // Clé localStorage
      partialize: (state) => ({ 
        projects: state.projects,
        currentProjectId: state.currentProjectId
      }), // Que persister
    }
  )
);

// Sélecteurs dérivés
export const useCurrentProject = () => 
  useProjectStore(state => 
    state.projects.find(project => project.id === state.currentProjectId)
  );

export const useProjectTasks = (projectId) => 
  useProjectStore(state => 
    state.projects.find(project => project.id === projectId)?.tasks || []
  );
