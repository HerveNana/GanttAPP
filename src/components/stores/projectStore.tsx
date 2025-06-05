/**
 * Store Zustand pour la gestion des projets et tâches
 * Version commentée et optimisée pour la maintenance
 * 
 * @author [Votre Nom]
 * @version 1.1.0
 * 
 * Fonctionnalités :
 * - Gestion complète CRUD des projets
 * - Gestion complète CRUD des tâches
 * - Suivi des dépendances entre tâches
 * - Persistance automatique en localStorage
 * - Gestion des erreurs et loading states
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type { Project, Task, TaskStatus, TaskColor, TaskDependency } from './types/project';

// Type pour l'état global du store
interface ProjectState {
  // State
  projects: Project[];
  currentProject: Project | null;
  loading: boolean;
  error: string | null;
  
  // Project Actions
  createProject: (name: string, description?: string) => Promise<void>;
  updateProject: (projectId: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  selectProject: (projectId: string | null) => void;
  
  // Task Actions
  createTask: (task: Omit<Task, 'id' | 'dependencies'>) => Promise<void>;
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  addDependency: (taskId: string, dependency: TaskDependency) => Promise<void>;
  removeDependency: (taskId: string, dependencyId: string) => Promise<void>;
  
  // Utils
  clearError: () => void;
}

/**
 * Création du store avec persistance dans localStorage
 * 
 * Bonnes pratiques :
 * 1. Séparation claire du state et des actions
 * 2. Immutabilité stricte dans les updates
 * 3. Gestion d'erreur centralisée
 * 4. Typage fort pour toutes les actions
 * 5. Persistance automatique
 */
export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      // État initial
      projects: [],
      currentProject: null,
      loading: false,
      error: null,
      
      /**
       * Crée un nouveau projet
       * @param name - Nom du projet
       * @param description - Description optionnelle
       */
      createProject: async (name, description = '') => {
        console.log('Creating project:', { name, description }); // Debug log
        try {
          set({ loading: true, error: null });
          
          const newProject: Project = {
            id: uuidv4(),
            name,
            description,
            createdAt: new Date(),
            updatedAt: new Date(),
            tasks: []
          };
          
          console.log('New project object:', newProject); // Debug log
          
          // Update immuable du state
          set((state) => {
            const newState = {
              projects: [...state.projects, newProject],
              currentProject: newProject,
              loading: false
            };
            console.log('Updated state:', newState); // Debug log
            return newState;
          });
          
        } catch (err) {
          console.error('Project creation error:', err); // Debug log
          set({ 
            error: `Échec de création du projet: ${err instanceof Error ? err.message : String(err)}`,
            loading: false 
          });
          throw err; // Re-throw to propagate to UI
        }
      },
      
      /**
       * Met à jour un projet existant
       * @param projectId - ID du projet à mettre à jour
       * @param updates - Champs à mettre à jour
       */
      updateProject: async (projectId, updates) => {
        try {
          set({ loading: true, error: null });
          
          set((state) => {
            const updatedProjects = state.projects.map(project => 
              project.id === projectId 
                ? { ...project, ...updates, updatedAt: new Date() } 
                : project
            );
            
            return {
              projects: updatedProjects,
              currentProject: state.currentProject?.id === projectId 
                ? updatedProjects.find(p => p.id === projectId) || null 
                : state.currentProject,
              loading: false
            };
          });
          
        } catch (err) {
          set({ 
            error: `Échec de mise à jour du projet: ${err instanceof Error ? err.message : String(err)}`,
            loading: false 
          });
        }
      },
      
      /**
       * Supprime un projet
       * @param projectId - ID du projet à supprimer
       */
      deleteProject: async (projectId) => {
        try {
          set({ loading: true, error: null });
          
          set((state) => ({
            projects: state.projects.filter(p => p.id !== projectId),
            currentProject: state.currentProject?.id === projectId ? null : state.currentProject,
            loading: false
          }));
          
        } catch (err) {
          set({ 
            error: `Échec de suppression du projet: ${err instanceof Error ? err.message : String(err)}`,
            loading: false 
          });
        }
      },
      
      /**
       * Sélectionne ou désélectionne un projet courant
       * @param projectId - ID du projet à sélectionner (null pour désélectionner)
       */
      selectProject: (projectId) => {
        set({
          currentProject: projectId 
            ? get().projects.find(p => p.id === projectId) || null 
            : null,
          error: null
        });
      },
      
      /**
       * Crée une nouvelle tâche dans le projet courant
       * @param task - Données de la tâche (sans id et dépendances)
       */
      createTask: async (task) => {
        try {
          const { currentProject } = get();
          if (!currentProject) throw new Error('Aucun projet sélectionné');
          
          set({ loading: true, error: null });
          
          const newTask: Task = {
            ...task,
            id: uuidv4(),
            dependencies: [],
            projectId: currentProject.id
          };
          
          set((state) => {
            if (!state.currentProject) return state;
            
            const updatedProject = {
              ...state.currentProject,
              tasks: [...state.currentProject.tasks, newTask],
              updatedAt: new Date()
            };
            
            return {
              currentProject: updatedProject,
              projects: state.projects.map(p => 
                p.id === updatedProject.id ? updatedProject : p
              ),
              loading: false
            };
          });
          
        } catch (err) {
          set({ 
            error: `Échec de création de tâche: ${err instanceof Error ? err.message : String(err)}`,
            loading: false 
          });
        }
      },
      
      /**
       * Met à jour une tâche existante
       * @param taskId - ID de la tâche à mettre à jour
       * @param updates - Champs à mettre à jour
       */
      updateTask: async (taskId, updates) => {
        try {
          set({ loading: true, error: null });
          
          set((state) => {
            if (!state.currentProject) return state;
            
            const updatedTasks = state.currentProject.tasks.map(task => 
              task.id === taskId 
                ? { ...task, ...updates, updatedAt: new Date() } 
                : task
            );
            
            const updatedProject = {
              ...state.currentProject,
              tasks: updatedTasks,
              updatedAt: new Date()
            };
            
            return {
              currentProject: updatedProject,
              projects: state.projects.map(p => 
                p.id === updatedProject.id ? updatedProject : p
              ),
              loading: false
            };
          });
          
        } catch (err) {
          set({ 
            error: `Échec de mise à jour de tâche: ${err instanceof Error ? err.message : String(err)}`,
            loading: false 
          });
        }
      },
      
      /**
       * Supprime une tâche
       * @param taskId - ID de la tâche à supprimer
       */
      deleteTask: async (taskId) => {
        try {
          set({ loading: true, error: null });
          
          set((state) => {
            if (!state.currentProject) return state;
            
            const updatedTasks = state.currentProject.tasks.filter(
              task => task.id !== taskId
            );
            
            // Supprime aussi les dépendances liées à cette tâche
            const cleanedTasks = updatedTasks.map(task => ({
              ...task,
              dependencies: task.dependencies.filter(
                dep => dep.taskId !== taskId
              )
            }));
            
            const updatedProject = {
              ...state.currentProject,
              tasks: cleanedTasks,
              updatedAt: new Date()
            };
            
            return {
              currentProject: updatedProject,
              projects: state.projects.map(p => 
                p.id === updatedProject.id ? updatedProject : p
              ),
              loading: false
            };
          });
          
        } catch (err) {
          set({ 
            error: `Échec de suppression de tâche: ${err instanceof Error ? err.message : String(err)}`,
            loading: false 
          });
        }
      },
      
      /**
       * Ajoute une dépendance entre tâches
       * @param taskId - ID de la tâche source
       * @param dependency - Dépendance à ajouter
       */
      addDependency: async (taskId, dependency) => {
        try {
          set({ loading: true, error: null });
          
          set((state) => {
            if (!state.currentProject) return state;
            
            const updatedTasks = state.currentProject.tasks.map(task => {
              if (task.id !== taskId) return task;
              
              // Vérifie que la dépendance n'existe pas déjà
              const exists = task.dependencies.some(
                d => d.taskId === dependency.taskId && d.type === dependency.type
              );
              
              if (exists) return task;
              
              return {
                ...task,
                dependencies: [...task.dependencies, dependency]
              };
            });
            
            const updatedProject = {
              ...state.currentProject,
              tasks: updatedTasks,
              updatedAt: new Date()
            };
            
            return {
              currentProject: updatedProject,
              projects: state.projects.map(p => 
                p.id === updatedProject.id ? updatedProject : p
              ),
              loading: false
            };
          });
          
        } catch (err) {
          set({ 
            error: `Échec d'ajout de dépendance: ${err instanceof Error ? err.message : String(err)}`,
            loading: false 
          });
        }
      },
      
      /**
       * Supprime une dépendance entre tâches
       * @param taskId - ID de la tâche source
       * @param dependencyId - ID de la tâche cible
       */
      removeDependency: async (taskId, dependencyId) => {
        try {
          set({ loading: true, error: null });
          
          set((state) => {
            if (!state.currentProject) return state;
            
            const updatedTasks = state.currentProject.tasks.map(task => {
              if (task.id !== taskId) return task;
              return {
                ...task,
                dependencies: task.dependencies.filter(
                  dep => dep.taskId !== dependencyId
                )
              };
            });
            
            const updatedProject = {
              ...state.currentProject,
              tasks: updatedTasks,
              updatedAt: new Date()
            };
            
            return {
              currentProject: updatedProject,
              projects: state.projects.map(p => 
                p.id === updatedProject.id ? updatedProject : p
              ),
              loading: false
            };
          });
          
        } catch (err) {
          set({ 
            error: `Échec de suppression de dépendance: ${err instanceof Error ? err.message : String(err)}`,
            loading: false 
          });
        }
      },
      
      /**
       * Réinitialise les erreurs
       */
      clearError: () => set({ error: null })
    }),
    {
      name: 'project-storage', // Clé de stockage
      storage: createJSONStorage(() => localStorage), // Persistance en localStorage
      partialize: (state) => ({ projects: state.projects }) // Ne persiste que les projets
    }
  )
);

/**
 * Hook personnalisé pour accéder au store avec validation
 * 
 * Exemple d'utilisation :
 * const { projects, createProject } = useProjectStore();
 */
export function useProjectStoreWithValidation() {
  const store = useProjectStore();
  
  // Pourrait inclure une validation supplémentaire ici
  return store;
}
