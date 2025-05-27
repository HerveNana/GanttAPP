/**
 * COMPOSANT PRINCIPAL DE L'APPLICATION
 * ====================================
 *
 * Responsabilités :
 * - Configuration globale de l'application
 * - Gestion des routes principales
 * - Initialisation des providers contextuels
 * - Intégration des composants de layout
 *
 * Architecture :
 * - Utilise React Router v6 pour la navigation
 * - Intègre les contextes globaux (thème, authentification, etc.)
 * - Structure modulaire avec lazy loading
 */

import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { SnackbarProvider } from "notistack";
import PropTypes from "prop-types";
window.PropTypes = PropTypes; // Forces global availability

// Layouts (chargés immédiatement car critiques)
import MainLayout from "./layouts/MainLayout";
import AuthLayout from "./layouts/AuthLayout";

// Composants dynamiques (chargés à la demande)
const ProjectDashboard = lazy(() =>
  import("./modules/projects/views/Dashboard")
);
const GanttView = lazy(() => import("./modules/gantt/views/GanttView"));
const LoginView = lazy(() => import("./modules/auth/views/LoginView"));
const NotFoundView = lazy(() => import("./core/components/NotFound"));

// Thème et configuration
import appTheme from "./styles/theme";
import { AuthProvider } from "./core/contexts/AuthContext";
import LoadingOverlay from "./core/components/LoadingOverlay";

/**
 * Fonction principale de l'application
 *
 * Structure clé :
 * 1. Providers globaux (thème, notifications, auth)
 * 2. Système de routage principal
 * 3. Gestion des erreurs et états de chargement
 */
function App() {
  return (
    /**
     * PROVIDERS GLOBAUX
     * -----------------
     * Ordre important des providers :
     * 1. ThemeProvider : Gère le design system Material-UI
     * 2. SnackbarProvider : Gère les notifications toast
     * 3. AuthProvider : Gère l'état d'authentification
     */
    <ThemeProvider theme={appTheme}>
      <CssBaseline /> {/* Normalise les styles cross-browser */}
      <SnackbarProvider
        maxSnack={3}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        autoHideDuration={3000}
      >
        <BrowserRouter>
          <AuthProvider>
            <Suspense fallback={<LoadingOverlay />}>
              <Routes>
                {/* Routes publiques */}
                <Route path="/auth" element={<AuthLayout />}>
                  <Route path="login" element={<LoginView />} />
                </Route>

                {/* Routes protégées */}
                <Route path="/" element={<MainLayout />}>
                  <Route index element={<ProjectDashboard />} />
                  <Route path="projects/:id" element={<GanttView />} />
                </Route>

                {/* Fallback 404 */}
                <Route path="*" element={<NotFoundView />} />
              </Routes>
            </Suspense>
          </AuthProvider>
        </BrowserRouter>
      </SnackbarProvider>
    </ThemeProvider>
  );
}

export default App;
