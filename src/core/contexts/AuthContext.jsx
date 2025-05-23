/**
 * CONTEXTE D'AUTHENTIFICATION
 * ==========================
 * 
 * Responsabilités :
 * - Gestion de l'état global d'authentification
 * - Stockage sécurisé du token JWT
 * - Fourniture des méthodes de login/logout
 * - Protection des routes
 * 
 * Architecture :
 * - Utilise le pattern Context API + useReducer
 * - Persiste l'état dans localStorage (chiffré)
 * - TypeScript-ready avec PropTypes
 */

import React, { createContext, useContext, useReducer, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import CryptoJS from 'crypto-js';

// Clé de chiffrement (à mettre dans les variables d'environnement en production)
//const SECRET_KEY = process.env.REACT_APP_CRYPTO_KEY || 'default_secret_key';
const SECRET_KEY = import.meta.env.REACT_APP_CRYPTO_KEY || 'default_secret_key';

// États possibles
const AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: true
};

// Actions disponibles
const AuthActions = {
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  LOAD_USER: 'LOAD_USER'
};

// Reducer pour la gestion d'état
const authReducer = (state, action) => {
  switch (action.type) {
    case AuthActions.LOGIN:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        loading: false
      };
    case AuthActions.LOGOUT:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false
      };
    case AuthActions.LOAD_USER:
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        loading: false
      };
    default:
      return state;
  }
};

// Création du contexte
export const AuthContext = createContext();

// Provider principal
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, AuthState);
  const navigate = useNavigate();

  /**
   * Chiffrement/déchiffrement localStorage
   */
  const secureStorage = {
    set: (key, value) => {
      const encrypted = CryptoJS.AES.encrypt(JSON.stringify(value), SECRET_KEY).toString();
      localStorage.setItem(key, encrypted);
    },
    get: (key) => {
      const data = localStorage.getItem(key);
      if (!data) return null;
      const bytes = CryptoJS.AES.decrypt(data, SECRET_KEY);
      return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
    }
  };

  /**
   * Initialisation - Vérification du token au mount
   */
  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = secureStorage.get('auth_token');
        if (token) {
          const decoded = jwtDecode(token);
          if (decoded.exp * 1000 < Date.now()) {
            logout();
          } else {
            dispatch({
              type: AuthActions.LOAD_USER,
              payload: decoded.user
            });
          }
        }
      } catch (error) {
        console.error('Erreur vérification token:', error);
        secureStorage.removeItem('auth_token');
      } finally {
        dispatch({ type: 'STOP_LOADING' });
      }
    };
    initAuth();
  }, []);

  /**
   * Login utilisateur
   * @param {string} email 
   * @param {string} password 
   */
  const login = async (email, password) => {
    try {
      // Simulation appel API
      const response = await mockAuthAPI(email, password);
      
      secureStorage.set('auth_token', response.token);
      
      dispatch({
        type: AuthActions.LOGIN,
        payload: {
          user: response.user,
          token: response.token
        }
      });
      
      navigate('/dashboard');
    } catch (error) {
      throw new Error('Échec authentification');
    }
  };

  /**
   * Déconnexion
   */
  const logout = () => {
    secureStorage.removeItem('auth_token');
    dispatch({ type: AuthActions.LOGOUT });
    navigate('/login');
  };

  // Valeur exposée par le contexte
  const contextValue = {
    ...state,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired
};

// Hook personnalisé pour l'accès au contexte
export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider');
  }
  return context;
};

// Mock API (à remplacer par un vrai service)
const mockAuthAPI = (email, password) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        user: { id: 1, email, role: 'admin' },
        token: 'fake.jwt.token'
      });
    }, 500);
  });
};
