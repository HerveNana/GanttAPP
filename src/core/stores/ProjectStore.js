/**
 * ProjectStore - Store Zustand pour la gestion des projets et tâches
 * 
 * Fonctionnalités:
 * - Gestion complète CRUD des projets
 * - Gestion complète CRUD des tâches
 * - Suivi des dépendances entre tâches
 * - Persistance automatique en localStorage
 * - Gestion des erreurs et loading states
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';

// Types de base (pourraient être déplacés dans un fichier types.js dédié)
/**
 * @typedef {Object} Task
 * @property {string} id - Identifiant unique de la tâche
 * @property {string} name - Nom de la tâche
 * @property {string} description - Description de la tâche
 * @property {Date} startDate - Date de début
 * @property {Date} endDate - Date de fin
 * @property {number} completion - Pourcentage d'avancement (0-100)
 * @property {Array<TaskDependency>} dependencies - Liste des dépendances
 * @property {string} projectId - ID du projet parent
 * @property {Date} createdAt - Date de création
 * @property {Date} updatedAt - Date de dernière mise à jour
 */

/**
 * @typedef {Object} Project
 * @property {string} id - Identifiant unique du projet
 * @property {string} name - Nom du projet
 * @property {string} description - Description du projet
 * @property {Array<Task>} tasks - Liste des tâches du projet
 * @property {Date} createdAt - Date de création
 * @property {Date} updatedAt - Date de dernière mise à jour
 */

/**
 * @typedef {Object} TaskDependency
 * @property {string} taskId - ID de la tâche dont dépend celle-ci
 * @property {string} type - Type de dépendance ("finish-to-start", "start-to-start", etc.)
 */

// Création du store avec persistance dans localStorage
export const useProjectStore = create(
  persist(
    (set, get) => ({
      // État initial
      projects: [],
      currentProject: null,
      loading: false,
      error: null,
      
      /**
       * Crée un nouveau projet
       * @param {string} name - Nom du projet
       * @param {string} description - Description optionnelle
       * @returns {Promise<void>}
       */
      createProject: async (name, description = '') => {
        try {
          set({ loading: true, error: null });
          
          const newProject = {
            id: uuidv4(),
            name,
            description,
            tasks: [],
            createdAt: new Date(),
            updatedAt: new Date()
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
          throw err;
        }
      },
      
      /**
       * Met à jour un projet existant
       * @param {string} projectId - ID du projet à mettre à jour
       * @param {Object} updates - Champs à mettre à jour
       * @returns {Promise<void>}
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
          throw err;
        }
      },
      
      /**
       * Supprime un projet
       * @param {string} projectId - ID du projet à supprimer
       * @returns {Promise<void>}
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
          throw err;
        }
      },
      
      /**
       * Sélectionne un projet comme projet courant
       * @param {string} projectId - ID du projet à sélectionner
       * @returns {void}
       */
      selectProject: (projectId) => {
        try {
          const { projects } = get();
          const project = projects.find(p => p.id === projectId);
          
          if (!project) {
            throw new Error(`Projet avec ID ${projectId} non trouvé`);
          }
          
          set({
            currentProject: project,
            error: null
          });
        } catch (err) {
          set({ 
            error: `Échec de sélection du projet: ${err instanceof Error ? err.message : String(err)}`
          });
        }
      },
      
      /**
       * Crée une nouvelle tâche dans le projet courant
       * @param {Object} taskData - Données de la tâche à créer
       * @returns {Promise<void>}
       */
      createTask: async (taskData) => {
        try {
          set({ loading: true, error: null });
          
          const { currentProject } = get();
          if (!currentProject) {
            throw new Error('Aucun projet sélectionné');
          }
          
          // Enhanced date validation and conversion
          let startDate, endDate;
          
          try {
            // Convert and validate start date
            if (taskData.startDate instanceof Date) {
              startDate = new Date(taskData.startDate.getTime());
            } else if (typeof taskData.startDate === 'string' || typeof taskData.startDate === 'number') {
              startDate = new Date(taskData.startDate);
            } else {
              startDate = new Date();
            }
            
            // Convert and validate end date
            if (taskData.endDate instanceof Date) {
              endDate = new Date(taskData.endDate.getTime());
            } else if (typeof taskData.endDate === 'string' || typeof taskData.endDate === 'number') {
              endDate = new Date(taskData.endDate);
            } else {
              endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
            }
            
            // Validate date objects
            if (isNaN(startDate.getTime())) {
              console.warn('Invalid start date provided, using current date');
              startDate = new Date();
            }
            
            if (isNaN(endDate.getTime())) {
              console.warn('Invalid end date provided, using start date + 1 week');
              endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);
            }
            
            // Ensure end date is after start date
            if (endDate <= startDate) {
              console.warn('End date is before or equal to start date, adjusting');
              endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000); // Add 1 day
            }
            
          } catch (dateError) {
            console.error('Error processing dates:', dateError);
            startDate = new Date();
            endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
          }
          
          console.log('📅 Task creation - Date handling:', {
            originalStartDate: taskData.startDate,
            originalEndDate: taskData.endDate,
            processedStartDate: startDate.toISOString(),
            processedEndDate: endDate.toISOString(),
            startDateValid: !isNaN(startDate.getTime()),
            endDateValid: !isNaN(endDate.getTime())
          });
          
          const newTask = {
            id: uuidv4(),
            name: taskData.name || 'Nouvelle tâche',
            description: taskData.description || '',
            startDate: startDate,
            endDate: endDate,
            completion: Math.min(100, Math.max(0, taskData.completion || 0)),
            dependencies: Array.isArray(taskData.dependencies) ? taskData.dependencies : [],
            projectId: currentProject.id,
            createdAt: new Date(),
            updatedAt: new Date()
          };
          
          set((state) => {
            if (!state.currentProject) return state;
            
            // Ajoute la tâche au projet courant
            const updatedProject = {
              ...state.currentProject,
              tasks: [...state.currentProject.tasks, newTask],
              updatedAt: new Date()
            };
            
            // Met à jour le projet dans la liste des projets
            const updatedProjects = state.projects.map(p => 
              p.id === updatedProject.id ? updatedProject : p
            );
            
            return {
              projects: updatedProjects,
              currentProject: updatedProject,
              loading: false
            };
          });
        } catch (err) {
          set({ 
            error: `Échec de création de la tâche: ${err instanceof Error ? err.message : String(err)}`,
            loading: false 
          });
          throw err;
        }
      },
      
      /**
       * Met à jour une tâche existante
       * @param {string} taskId - ID de la tâche à mettre à jour
       * @param {Object} updates - Champs à mettre à jour
       * @returns {Promise<void>}
       */
      updateTask: async (taskId, updates) => {
        try {
          set({ loading: true, error: null });
          
          const { currentProject } = get();
          if (!currentProject) {
            throw new Error('Aucun projet sélectionné');
          }
          
          // Process date fields in updates if they exist
          const processedUpdates = { ...updates };
          
          if (updates.startDate) {
            try {
              const startDate = updates.startDate instanceof Date 
                ? new Date(updates.startDate.getTime())
                : new Date(updates.startDate);
              
              if (isNaN(startDate.getTime())) {
                console.warn('Invalid start date in update, keeping original');
                delete processedUpdates.startDate;
              } else {
                processedUpdates.startDate = startDate;
              }
            } catch (error) {
              console.error('Error processing start date update:', error);
              delete processedUpdates.startDate;
            }
          }
          
          if (updates.endDate) {
            try {
              const endDate = updates.endDate instanceof Date 
                ? new Date(updates.endDate.getTime())
                : new Date(updates.endDate);
              
              if (isNaN(endDate.getTime())) {
                console.warn('Invalid end date in update, keeping original');
                delete processedUpdates.endDate;
              } else {
                processedUpdates.endDate = endDate;
              }
            } catch (error) {
              console.error('Error processing end date update:', error);
              delete processedUpdates.endDate;
            }
          }
          
          set((state) => {
            if (!state.currentProject) return state;
            
            // Met à jour la tâche
            const updatedTasks = state.currentProject.tasks.map(task => 
              task.id === taskId 
                ? { ...task, ...processedUpdates, updatedAt: new Date() } 
                : task
            );
            
            // Met à jour le projet avec les tâches mises à jour
            const updatedProject = {
              ...state.currentProject,
              tasks: updatedTasks,
              updatedAt: new Date()
            };
            
            // Met à jour le projet dans la liste des projets
            const updatedProjects = state.projects.map(p => 
              p.id === updatedProject.id ? updatedProject : p
            );
            
            return {
              projects: updatedProjects,
              currentProject: updatedProject,
              loading: false
            };
          });
        } catch (err) {
          set({ 
            error: `Échec de mise à jour de la tâche: ${err instanceof Error ? err.message : String(err)}`,
            loading: false 
          });
          throw err;
        }
      },
      
      /**
       * Supprime une tâche
       * @param {string} taskId - ID de la tâche à supprimer
       * @returns {Promise<void>}
       */
      deleteTask: async (taskId) => {
        try {
          set({ loading: true, error: null });
          
          const { currentProject } = get();
          if (!currentProject) {
            throw new Error('Aucun projet sélectionné');
          }
          
          set((state) => {
            if (!state.currentProject) return state;
            
            // Supprime la tâche
            const updatedTasks = state.currentProject.tasks.filter(task => task.id !== taskId);
            
            // Nettoie également les dépendances qui faisaient référence à cette tâche
            const cleanedTasks = updatedTasks.map(task => ({
              ...task,
              dependencies: task.dependencies.filter(dep => dep.taskId !== taskId)
            }));
            
            // Met à jour le projet avec les tâches mises à jour
            const updatedProject = {
              ...state.currentProject,
              tasks: cleanedTasks,
              updatedAt: new Date()
            };
            
            // Met à jour le projet dans la liste des projets
            const updatedProjects = state.projects.map(p => 
              p.id === updatedProject.id ? updatedProject : p
            );
            
            return {
              projects: updatedProjects,
              currentProject: updatedProject,
              loading: false
            };
          });
        } catch (err) {
          set({ 
            error: `Échec de suppression de la tâche: ${err instanceof Error ? err.message : String(err)}`,
            loading: false 
          });
          throw err;
        }
      },
      
      /**
       * Ajoute une dépendance entre tâches
       * @param {string} taskId - ID de la tâche source
       * @param {Object} dependency - Dépendance à ajouter (taskId + type)
       * @returns {Promise<void>}
       */
      addDependency: async (taskId, dependency) => {
        try {
          set({ loading: true, error: null });
          
          const { currentProject } = get();
          if (!currentProject) {
            throw new Error('Aucun projet sélectionné');
          }
          
          set((state) => {
            if (!state.currentProject) return state;
            
            // Ajoute la dépendance à la tâche
            const updatedTasks = state.currentProject.tasks.map(task => {
              if (task.id !== taskId) return task;
              
              // Vérifie que la dépendance n'existe pas déjà
              const existingDep = task.dependencies.find(
                dep => dep.taskId === dependency.taskId && dep.type === dependency.type
              );
              
              if (existingDep) return task;
              
              return {
                ...task,
                dependencies: [...task.dependencies, dependency],
                updatedAt: new Date()
              };
            });
            
            // Met à jour le projet avec les tâches mises à jour
            const updatedProject = {
              ...state.currentProject,
              tasks: updatedTasks,
              updatedAt: new Date()
            };
            
            // Met à jour le projet dans la liste des projets
            const updatedProjects = state.projects.map(p => 
              p.id === updatedProject.id ? updatedProject : p
            );
            
            return {
              projects: updatedProjects,
              currentProject: updatedProject,
              loading: false
            };
          });
        } catch (err) {
          set({ 
            error: `Échec d'ajout de dépendance: ${err instanceof Error ? err.message : String(err)}`,
            loading: false 
          });
          throw err;
        }
      },
      
      /**
       * Supprime une dépendance entre tâches
       * @param {string} taskId - ID de la tâche source
       * @param {string} dependencyTaskId - ID de la tâche cible (dépendance)
       * @returns {Promise<void>}
       */
      removeDependency: async (taskId, dependencyTaskId) => {
        try {
          set({ loading: true, error: null });
          
          const { currentProject } = get();
          if (!currentProject) {
            throw new Error('Aucun projet sélectionné');
          }
          
          set((state) => {
            if (!state.currentProject) return state;
            
            // Supprime la dépendance de la tâche
            const updatedTasks = state.currentProject.tasks.map(task => {
              if (task.id !== taskId) return task;
              
              return {
                ...task,
                dependencies: task.dependencies.filter(dep => dep.taskId !== dependencyTaskId),
                updatedAt: new Date()
              };
            });
            
            // Met à jour le projet avec les tâches mises à jour
            const updatedProject = {
              ...state.currentProject,
              tasks: updatedTasks,
              updatedAt: new Date()
            };
            
            // Met à jour le projet dans la liste des projets
            const updatedProjects = state.projects.map(p => 
              p.id === updatedProject.id ? updatedProject : p
            );
            
            return {
              projects: updatedProjects,
              currentProject: updatedProject,
              loading: false
            };
          });
        } catch (err) {
          set({ 
            error: `Échec de suppression de dépendance: ${err instanceof Error ? err.message : String(err)}`,
            loading: false 
          });
          throw err;
        }
      },
      
      /**
       * Réinitialise l'erreur
       */
      clearError: () => set({ error: null }),
      
      /**
       * Clears localStorage cache to force re-initialization with proper date handling
       */
      clearCache: () => {
        try {
          localStorage.removeItem('project-storage');
          console.log('🗑️ Cleared project storage cache');
          set({
            projects: [],
            currentProject: null,
            loading: false,
            error: null
          });
        } catch (error) {
          console.error('Error clearing cache:', error);
          // Force reset even if localStorage operation fails
          set({
            projects: [],
            currentProject: null,
            loading: false,
            error: 'Failed to clear cache: ' + error.message
          });
        }
      },
      
      /**
       * Validates and fixes any date issues in stored data
       */
      validateAndFixDates: () => {
        try {
          set((state) => {
            const fixDatesInObject = (obj) => {
              if (!obj || typeof obj !== 'object') return obj;
              
              if (Array.isArray(obj)) {
                return obj.map(fixDatesInObject);
              }
              
              const fixed = { ...obj };
              
              // Fix date fields
              const dateFields = ['createdAt', 'updatedAt', 'startDate', 'endDate'];
              dateFields.forEach(field => {
                if (fixed[field]) {
                  if (!(fixed[field] instanceof Date)) {
                    try {
                      fixed[field] = new Date(fixed[field]);
                    } catch (error) {
                      console.warn(`Failed to convert ${field}, setting default`);
                      if (field === 'createdAt' || field === 'updatedAt') {
                        fixed[field] = new Date();
                      } else if (field === 'startDate') {
                        fixed[field] = new Date();
                      } else if (field === 'endDate') {
                        fixed[field] = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
                      }
                    }
                  }
                  
                  // Validate the Date object
                  if (isNaN(fixed[field].getTime())) {
                    console.warn(`Invalid date detected for ${field}, fixing`);
                    if (field === 'createdAt' || field === 'updatedAt') {
                      fixed[field] = new Date();
                    } else if (field === 'startDate') {
                      fixed[field] = new Date();
                    } else if (field === 'endDate') {
                      fixed[field] = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
                    }
                  }
                }
              });
              
              // Ensure task date consistency
              if (fixed.startDate && fixed.endDate && fixed.endDate <= fixed.startDate) {
                console.warn('End date before start date, fixing');
                fixed.endDate = new Date(fixed.startDate.getTime() + 24 * 60 * 60 * 1000);
              }
              
              // Recursively fix nested objects
              Object.keys(fixed).forEach(key => {
                if (fixed[key] && typeof fixed[key] === 'object') {
                  fixed[key] = fixDatesInObject(fixed[key]);
                }
              });
              
              return fixed;
            };
            
            return {
              ...state,
              projects: fixDatesInObject(state.projects),
              currentProject: fixDatesInObject(state.currentProject)
            };
          });
          
          console.log('✅ Date validation and fixing completed');
        } catch (error) {
          console.error('Error during date validation:', error);
          set(state => ({
            ...state,
            error: 'Failed to validate dates: ' + error.message
          }));
        }
      },
      
      /**
       * Initializes the store with proper date handling
       */
      initializeStore: () => {
        try {
          console.log('🔄 Initializing project store with date validation');
          
          // Validate existing data
          const { validateAndFixDates } = get();
          validateAndFixDates();
          
          console.log('✅ Project store initialized successfully');
        } catch (error) {
          console.error('Error initializing store:', error);
          set(state => ({
            ...state,
            error: 'Failed to initialize store: ' + error.message
          }));
        }
      },
      
      /**
       * Charge un exemple de projet pour démo
       */
      loadDemoProject: () => {
        const demoProject = {
          id: uuidv4(),
          name: "Projet démo",
          description: "Un projet de démonstration pour tester le diagramme de Gantt",
          tasks: [
            {
              id: uuidv4(),
              name: "Analyse des besoins",
              description: "Définir le périmètre et les objectifs du projet",
              startDate: new Date(2025, 5, 1), // 1er juin 2025
              endDate: new Date(2025, 5, 7),   // 7 juin 2025
              completion: 100,
              dependencies: [],
              projectId: "",
              createdAt: new Date(),
              updatedAt: new Date()
            },
            {
              id: uuidv4(),
              name: "Conception",
              description: "Concevoir l'architecture et les interfaces",
              startDate: new Date(2025, 5, 8),  // 8 juin 2025
              endDate: new Date(2025, 5, 14),   // 14 juin 2025
              completion: 70,
              dependencies: [],
              projectId: "",
              createdAt: new Date(),
              updatedAt: new Date()
            },
            {
              id: uuidv4(),
              name: "Développement",
              description: "Coder les fonctionnalités principales",
              startDate: new Date(2025, 5, 15), // 15 juin 2025
              endDate: new Date(2025, 5, 30),   // 30 juin 2025
              completion: 30,
              dependencies: [],
              projectId: "",
              createdAt: new Date(),
              updatedAt: new Date()
            },
            {
              id: uuidv4(),
              name: "Tests",
              description: "Tester et corriger les bugs",
              startDate: new Date(2025, 6, 1),  // 1er juillet 2025
              endDate: new Date(2025, 6, 7),    // 7 juillet 2025
              completion: 0,
              dependencies: [],
              projectId: "",
              createdAt: new Date(),
              updatedAt: new Date()
            },
            {
              id: uuidv4(),
              name: "Déploiement",
              description: "Mettre en production",
              startDate: new Date(2025, 6, 8),  // 8 juillet 2025
              endDate: new Date(2025, 6, 10),   // 10 juillet 2025
              completion: 0,
              dependencies: [],
              projectId: "",
              createdAt: new Date(),
              updatedAt: new Date()
            }
          ],
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        // Initialiser les projectId pour chaque tâche
        demoProject.tasks = demoProject.tasks.map(task => ({
          ...task,
          projectId: demoProject.id
        }));
        
        // Configurer quelques dépendances
        // Conception dépend de Analyse
        demoProject.tasks[1].dependencies = [{
          taskId: demoProject.tasks[0].id,
          type: "finish-to-start"
        }];
        
        // Développement dépend de Conception
        demoProject.tasks[2].dependencies = [{
          taskId: demoProject.tasks[1].id,
          type: "finish-to-start"
        }];
        
        // Tests dépendent de Développement
        demoProject.tasks[3].dependencies = [{
          taskId: demoProject.tasks[2].id,
          type: "finish-to-start"
        }];
        
        // Déploiement dépend de Tests
        demoProject.tasks[4].dependencies = [{
          taskId: demoProject.tasks[3].id,
          type: "finish-to-start"
        }];
        
        set((state) => ({
          projects: [...state.projects, demoProject],
          currentProject: demoProject
        }));
        
        console.log('✅ Demo project loaded with valid dates');
        return demoProject.id;
      }
    }),
    {
      name: 'project-storage', // Clé de stockage
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ 
        projects: state.projects,
        currentProject: state.currentProject 
      }),
      // Custom serialization/deserialization to handle Date objects
      serialize: (state) => {
        try {
          // Pre-process dates to ensure they're properly serializable
          const processForSerialization = (obj) => {
            if (obj && typeof obj === 'object') {
              if (Array.isArray(obj)) {
                return obj.map(processForSerialization);
              }
              
              const processed = { ...obj };
              
              // Ensure Date objects are valid before serialization
              const dateFields = ['createdAt', 'updatedAt', 'startDate', 'endDate'];
              dateFields.forEach(field => {
                if (processed[field] instanceof Date) {
                  if (isNaN(processed[field].getTime())) {
                    console.warn(`Invalid date found during serialization for ${field}, fixing`);
                    if (field === 'createdAt' || field === 'updatedAt') {
                      processed[field] = new Date();
                    } else if (field === 'startDate') {
                      processed[field] = new Date();
                    } else if (field === 'endDate') {
                      processed[field] = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
                    }
                  }
                }
              });
              
              // Recursively process nested objects
              Object.keys(processed).forEach(key => {
                if (processed[key] && typeof processed[key] === 'object') {
                  processed[key] = processForSerialization(processed[key]);
                }
              });
              
              return processed;
            }
            return obj;
          };
          
          const processedState = processForSerialization(state);
          console.log('📤 Serializing project data with validated dates');
          return JSON.stringify(processedState);
        } catch (error) {
          console.error('Error serializing project data:', error);
          // Return minimal valid JSON if serialization fails
          return JSON.stringify({
            projects: [],
            currentProject: null
          });
        }
      },
      deserialize: (str) => {
        try {
          const parsed = JSON.parse(str);
          
          // Enhanced date conversion with validation
          const convertDates = (obj) => {
            if (obj && typeof obj === 'object') {
              if (Array.isArray(obj)) {
                return obj.map(convertDates);
              }
              
              const converted = { ...obj };
              
              // Convert known date fields with validation
              const dateFields = ['createdAt', 'updatedAt', 'startDate', 'endDate'];
              
              dateFields.forEach(field => {
                if (converted[field] && typeof converted[field] === 'string') {
                  try {
                    const date = new Date(converted[field]);
                    if (!isNaN(date.getTime())) {
                      converted[field] = date;
                    } else {
                      console.warn(`Invalid date string for ${field}:`, converted[field]);
                      // Set a default date based on field type
                      if (field === 'createdAt' || field === 'updatedAt') {
                        converted[field] = new Date();
                      } else if (field === 'startDate') {
                        converted[field] = new Date();
                      } else if (field === 'endDate') {
                        converted[field] = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
                      }
                    }
                  } catch (error) {
                    console.error(`Error converting ${field} to Date:`, error);
                    // Set reasonable defaults
                    if (field === 'createdAt' || field === 'updatedAt') {
                      converted[field] = new Date();
                    } else if (field === 'startDate') {
                      converted[field] = new Date();
                    } else if (field === 'endDate') {
                      converted[field] = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
                    }
                  }
                }
              });
              
              // Additional validation for task dates
              if (converted.startDate && converted.endDate) {
                // Ensure both are Date objects before comparing
                const startDate = converted.startDate instanceof Date ? converted.startDate : new Date(converted.startDate);
                const endDate = converted.endDate instanceof Date ? converted.endDate : new Date(converted.endDate);
                
                // Ensure end date is after start date
                if (endDate <= startDate) {
                  console.warn('End date is before start date, adjusting');
                  converted.endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);
                }
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
          
          const result = convertDates(parsed);
          console.log('📥 Deserialized data with date conversion');
          return result;
        } catch (error) {
          console.error('Error deserializing project data:', error);
          // Return empty state if deserialization fails
          return {
            projects: [],
            currentProject: null
          };
        }
      }
    }
  )
);

// Initialize the store on creation
if (typeof window !== 'undefined') {
  // Add a small delay to ensure the store is fully initialized
  setTimeout(() => {
    try {
      const store = useProjectStore.getState();
      if (store.initializeStore) {
        store.initializeStore();
      }
    } catch (error) {
      console.error('Error during store auto-initialization:', error);
    }
  }, 100);
}

