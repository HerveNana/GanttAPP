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
import type { Project, Task, TaskStatus, TaskColor, TaskDependency } from '../types/project';

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
  
  // Demo Project
  loadDemoProject: () => string;
  
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
          
          // Update immuable du state
          set((state) => ({
            projects: [...state.projects, newProject],
            currentProject: newProject,
            loading: false
          }));
          
        } catch (err) {
          set({ 
            error: `Échec de création du projet: ${err instanceof Error ? err.message : String(err)}`,
            loading: false 
          });
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
          
          // Ensure dates are proper Date objects
          const startDate = task.startDate instanceof Date ? task.startDate : new Date(task.startDate);
          const endDate = task.endDate instanceof Date ? task.endDate : new Date(task.endDate);
          
          // Validate dates
          if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            throw new Error('Invalid dates provided');
          }
          
          const newTask: Task = {
            ...task,
            id: uuidv4(),
            startDate: startDate,
            endDate: endDate,
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
  clearError: () => set({ error: null }),
      
      /**
       * Clears localStorage cache to force re-initialization with proper date handling
       */
      clearCache: () => {
        localStorage.removeItem('project-storage');
        set({
          projects: [],
          currentProject: null,
          loading: false,
          error: null
        });
      },
      
      /**
       * Charge un projet de démonstration avec des tâches d'exemple
       * @returns {string} L'ID du projet créé
       */
      loadDemoProject: () => {
        const demoProject: Project = {
          id: uuidv4(),
          name: 'Projet de Démonstration',
          description: 'Un projet d\'exemple avec des tâches pré-configurées pour tester le diagramme de Gantt',
          createdAt: new Date(),
          updatedAt: new Date(),
          tasks: [
            {
              id: uuidv4(),
              projectId: '',
              name: 'Analyse des exigences',
              description: 'Collecter et analyser les exigences du projet',
              startDate: new Date(),
              endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
              status: 'COMPLETED' as const,
              completion: 100,
              dependencies: []
            },
            {
              id: uuidv4(),
              projectId: '',
              name: 'Conception système',
              description: 'Concevoir l\'architecture du système',
              startDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
              endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
              status: 'IN_PROGRESS' as const,
              completion: 60,
              dependencies: []
            },
            {
              id: uuidv4(),
              projectId: '',
              name: 'Développement',
              description: 'Développer les fonctionnalités principales',
              startDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
              endDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000),
              status: 'NOT_STARTED' as const,
              completion: 0,
              dependencies: []
            },
            {
              id: uuidv4(),
              projectId: '',
              name: 'Tests et validation',
              description: 'Tester et valider le système',
              startDate: new Date(Date.now() + 26 * 24 * 60 * 60 * 1000),
              endDate: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000),
              status: 'NOT_STARTED' as const,
              completion: 0,
              dependencies: []
            }
          ]
        };
        
        // Set project ID for all tasks
        demoProject.tasks.forEach(task => {
          task.projectId = demoProject.id;
        });
        
        set((state) => ({
          projects: [...state.projects, demoProject],
          currentProject: demoProject
        }));
        
        return demoProject.id;
      }
    }),
    {
      name: 'project-storage', // Clé de stockage
      storage: createJSONStorage(() => localStorage), // Persistance en localStorage
      partialize: (state) => ({ 
        projects: state.projects,
        currentProject: state.currentProject 
      }),
      // Custom serialization/deserialization to handle Date objects
      serialize: (state) => {
        return JSON.stringify(state);
      },
      deserialize: (str) => {
        const parsed = JSON.parse(str);
        
        // Convert date strings back to Date objects
        const convertDates = (obj: any): any => {
          if (obj && typeof obj === 'object') {
            if (Array.isArray(obj)) {
              return obj.map(convertDates);
            }
            
            const converted = { ...obj };
            
            // Convert known date fields
            if (converted.createdAt && typeof converted.createdAt === 'string') {
              converted.createdAt = new Date(converted.createdAt);
            }
            if (converted.updatedAt && typeof converted.updatedAt === 'string') {
              converted.updatedAt = new Date(converted.updatedAt);
            }
            if (converted.startDate && typeof converted.startDate === 'string') {
              converted.startDate = new Date(converted.startDate);
            }
            if (converted.endDate && typeof converted.endDate === 'string') {
              converted.endDate = new Date(converted.endDate);
            }
            
            // Recursively convert nested objects
            Object.keys(converted).forEach(key => {
              if (converted[key] && typeof converted[key] === 'object') {
                converted[key] = convertDates(converted[key]);
              }
            });
            
            return converted;
          }
          return obj;
        };
        
        return convertDates(parsed);
      }
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
