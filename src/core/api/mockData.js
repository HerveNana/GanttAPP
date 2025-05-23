/**
 * MOCK DATA SERVICE
 * =================
 * 
 * Responsabilités :
 * - Simule un backend API avec des données fictives
 * - Implémente les délais réseau réalistes
 * - Gère les erreurs simulées
 * - Structure cohérente avec une vraie API REST
 * 
 * Architecture :
 * - Données stockées en mémoire
 * - Méthodes async pour simuler les appels réseau
 * - Structure reproductible pour les tests
 */

// Seed pour données reproductibles
const SEED = 'gantt-app-seed';

/**
 * Générateur de données déterministe
 * @param {string} seed - Graine pour la reproductibilité
 */
function generateMockData(seed) {
  // Utilisation d'un simple hash pour la reproductibilité
  let idCounter = 0;
  for (let i = 0; i < seed.length; i++) {
    idCounter += seed.charCodeAt(i);
  }

  const projects = [];
  const now = new Date();

  // Génération de 3 projets de démo
  for (let i = 1; i <= 3; i++) {
    const tasks = [];
    const taskCount = 3 + (i % 3); // Entre 3 et 5 tâches par projet

    for (let j = 1; j <= taskCount; j++) {
      tasks.push({
        id: `task-${idCounter++}`,
        name: `Tâche ${j} du Projet ${i}`,
        description: `Description de la tâche ${j}`,
        startDate: new Date(now.getTime() + j * 2 * 24 * 60 * 60 * 1000),
        endDate: new Date(now.getTime() + (j * 2 + 5) * 24 * 60 * 60 * 1000),
        status: ['not_started', 'in_progress', 'completed'][j % 3],
        assignees: [`user${j}@example.com`],
        dependencies: j > 1 ? [`task-${idCounter - 2}`] : []
      });
    }

    projects.push({
      id: `project-${i}`,
      name: `Projet ${i}`,
      description: `Description du projet ${i}`,
      createdAt: now,
      updatedAt: now,
      tasks
    });
  }

  return { projects };
}

// Données initiales
const { projects } = generateMockData(SEED);

/**
 * Simule un délai réseau
 * @param {number} [min=300] - Délai minimum en ms
 * @param {number} [max=1000] - Délai maximum en ms
 */
const simulateNetworkDelay = (min = 300, max = 1000) => {
  return new Promise(resolve => 
    setTimeout(resolve, Math.random() * (max - min) + min)
};

/**
 * Simule une erreur aléatoire (10% de chance)
 */
const simulateRandomError = () => {
  if (Math.random() < 0.1) {
    throw new Error('Erreur simulée du serveur');
  }
};

export const mockProjects = {
  /**
   * Récupère tous les projets
   * @returns {Promise<Array>}
   */
  async loadAll() {
    await simulateNetworkDelay();
    simulateRandomError();
    return [...projects]; // Retourne une copie
  },

  /**
   * Récupère un projet par ID
   * @param {string} id 
   * @returns {Promise<Object>}
   */
  async getById(id) {
    await simulateNetworkDelay();
    simulateRandomError();
    const project = projects.find(p => p.id === id);
    if (!project) throw new Error('Projet non trouvé');
    return { ...project }; // Retourne une copie
  },

  /**
   * Ajoute une tâche à un projet
   * @param {string} projectId 
   * @param {Object} taskData 
   * @returns {Promise<Object>} Projet mis à jour
   */
  async addTask(projectId, taskData) {
    await simulateNetworkDelay(500, 1500);
    simulateRandomError();

    const project = projects.find(p => p.id === projectId);
    if (!project) throw new Error('Projet non trouvé');

    const newTask = {
      ...taskData,
      id: `task-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    project.tasks.push(newTask);
    project.updatedAt = new Date();

    return { ...project };
  },

  /**
   * Met à jour une tâche
   * @param {string} projectId 
   * @param {string} taskId 
   * @param {Object} updates 
   * @returns {Promise<Object>} Projet mis à jour
   */
  async updateTask(projectId, taskId, updates) {
    await simulateNetworkDelay(300, 800);
    simulateRandomError();

    const project = projects.find(p => p.id === projectId);
    if (!project) throw new Error('Projet non trouvé');

    const task = project.tasks.find(t => t.id === taskId);
    if (!task) throw new Error('Tâche non trouvée');

    Object.assign(task, updates, {
      updatedAt: new Date()
    });

    project.updatedAt = new Date();

    return { ...project };
  }
};

export const mockAuth = {
  /**
   * Simule un login
   * @param {string} email 
   * @param {string} password 
   * @returns {Promise<Object>}
   */
  async login(email, password) {
    await simulateNetworkDelay(400, 1200);
    simulateRandomError();

    if (password.length < 6) {
      throw new Error('Mot de passe invalide');
    }

    return {
      user: {
        id: 'user-1',
        email,
        name: 'Utilisateur Demo',
        role: 'admin'
      },
      token: 'mock-jwt-token'
    };
  }
};
