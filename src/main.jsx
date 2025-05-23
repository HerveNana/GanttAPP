/**
 * POINT D'ENTREE PRINCIPAL
 * ========================
 * - Configure le rendu React
 * - Initialise les providers globaux
 * - Gère les erreurs non capturées
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import ErrorBoundary from './core/utils/ErrorBoundary';

// Add this temporarily to main.jsx
console.log('Crypto Key:', import.meta.env.VITE_CRYPTO_KEY); 

// Configuration du rendu
const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);

// Gestion des erreurs globales
window.addEventListener('error', (event) => {
  console.error('Erreur globale:', event.error);
  // Envoyer l'erreur à un service de tracking
});
