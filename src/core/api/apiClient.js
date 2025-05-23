/**
 * API CLIENT SERVICE
 * =================
 * 
 * Responsabilités :
 * - Gestion centralisée des appels HTTP
 * - Configuration des intercepteurs
 * - Gestion des erreurs réseau
 * - Authentification automatique
 * 
 * Architecture :
 * - Utilise Axios comme client HTTP
 * - Intercepteurs pour le JWT
 * - Cache intelligente
 * - Système de retry
 */

import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

// Configuration de base
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://api.example.com/v1';

/**
 * Crée une instance Axios configurée
 */
const createApiClient = () => {
  const instance = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  });

  // Intercepteur pour l'authentification
  instance.interceptors.request.use(
    async (config) => {
      const { token } = useAuth.getState();
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      return config;
    },
    (error) => Promise.reject(error)
  );

  // Intercepteur de réponse pour la gestion globale des erreurs
  instance.interceptors.response.use(
    (response) => response.data,
    async (error) => {
      const originalRequest = error.config;
      
      // Gestion des 401 (token expiré)
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
        
        try {
          const { refreshToken } = useAuth.getState();
          const { token } = await refreshAuthToken(refreshToken);
          
          useAuth.setState({ token });
          originalRequest.headers.Authorization = `Bearer ${token}`;
          
          return instance(originalRequest);
        } catch (refreshError) {
          useAuth.getState().logout();
          return Promise.reject(refreshError);
        }
      }

      // Transformation des erreurs
      const apiError = {
        message: error.response?.data?.message || 'Erreur réseau',
        status: error.response?.status || 500,
        data: error.response?.data
      };

      return Promise.reject(apiError);
    }
  );

  return instance;
};

// Instance unique (singleton)
const apiClient = createApiClient();

/**
 * Rafraîchit le token JWT
 * @param {string} refreshToken 
 * @returns {Promise<Object>}
 */
const refreshAuthToken = async (refreshToken) => {
  const response = await apiClient.post('/auth/refresh', { refreshToken });
  return {
    token: response.data.accessToken,
    refreshToken: response.data.refreshToken
  };
};

/**
 * Méthodes HTTP wrappées
 */
export const http = {
  get: (url, config) => apiClient.get(url, config),
  post: (url, data, config) => apiClient.post(url, data, config),
  put: (url, data, config) => apiClient.put(url, data, config),
  delete: (url, config) => apiClient.delete(url, config),
  patch: (url, data, config) => apiClient.patch(url, data, config)
};

/**
 * Services API spécifiques
 */
export const apiService = {
  projects: {
    getAll: () => http.get('/projects'),
    getById: (id) => http.get(`/projects/${id}`),
    create: (data) => http.post('/projects', data),
    update: (id, data) => http.put(`/projects/${id}`, data),
    delete: (id) => http.delete(`/projects/${id}`),
    addTask: (projectId, taskData) => 
      http.post(`/projects/${projectId}/tasks`, taskData)
  },
  
  tasks: {
    update: (projectId, taskId, updates) => 
      http.patch(`/projects/${projectId}/tasks/${taskId}`, updates)
  },
  
  auth: {
    login: (credentials) => http.post('/auth/login', credentials),
    logout: () => http.post('/auth/logout'),
    refresh: (refreshToken) => http.post('/auth/refresh', { refreshToken })
  }
};

/**
 * Fonction utilitaire pour annuler les requêtes
 */
export const createCancelToken = () => {
  return axios.CancelToken.source();
};

// Export par défaut pour les cas spéciaux
export default apiClient;
