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
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { fr } from 'date-fns/locale';

// Load debugging utilities
import './utils/debugDates';
import { Link } from 'react-router-dom';
import { SnackbarProvider } from 'notistack';
import PropTypes from "prop-types";
window.PropTypes = PropTypes; // Forces global availability

// Layouts (chargés immédiatement car critiques)
import MainLayout from "./layouts/MainLayout";
import AuthLayout from "./layouts/AuthLayout";

// Composants dynamiques (chargés à la demande)
const ProjectDashboard = lazy(() =>
  import("./modules/projects/views/Dashboard")
);
const Projects = lazy(() => import("./modules/projects/views/Projects"));
const GanttView = lazy(() => import("./modules/gantt/views/GanttViewFixed"));
const LoginView = lazy(() => import("./modules/auth/views/LoginView"));
const NotFoundView = lazy(() => import("./core/components/NotFound"));
const Sidebar = () => (
  <nav>
    <Link to="/">Dashboard</Link>
    <Link to="/projects">Projects</Link>
    <Link to="/settings">Settings</Link>
    <Link to="/user-profile">User Profile</Link>
  </nav>
);

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
// Clear localStorage if there are issues with date deserialization
const migrateLegacyStorage = () => {
  try {
    const storedData = localStorage.getItem('project-storage');
    if (storedData) {
      console.log('🔍 Checking localStorage data for corruption...');
      
      // Try to parse the stored data
      let parsed;
      try {
        parsed = JSON.parse(storedData);
      } catch (parseError) {
        console.warn('📦 Corrupted localStorage JSON, clearing:', parseError);
        localStorage.removeItem('project-storage');
        return;
      }
      
      // Check if we have the old format or corrupted date data
      if (parsed.state && parsed.state.projects) {
        let needsMigration = false;
        
        try {
          // Check if any dates are strings instead of proper Date objects
          for (const project of parsed.state.projects) {
            // Test date fields
            const dateFields = ['createdAt', 'updatedAt'];
            for (const field of dateFields) {
              if (project[field] && typeof project[field] === 'string') {
                // Try to convert to test validity
                const testDate = new Date(project[field]);
                if (isNaN(testDate.getTime())) {
                  needsMigration = true;
                  break;
                }
              }
            }
            
            if (project.tasks) {
              for (const task of project.tasks) {
                const taskDateFields = ['startDate', 'endDate', 'createdAt', 'updatedAt'];
                for (const field of taskDateFields) {
                  if (task[field] && typeof task[field] === 'string') {
                    // Try to convert to test validity
                    const testDate = new Date(task[field]);
                    if (isNaN(testDate.getTime())) {
                      needsMigration = true;
                      break;
                    }
                  }
                }
                if (needsMigration) break;
              }
            }
            
            if (needsMigration) break;
          }
        } catch (validationError) {
          console.warn('🚨 Error validating stored data structure:', validationError);
          needsMigration = true;
        }
        
        if (needsMigration) {
          console.log('🔄 Corrupted or legacy localStorage data detected, clearing...');
          localStorage.removeItem('project-storage');
          console.log('✅ Corrupted data cleared, fresh start enabled');
          
          // Show a notification to the user
          setTimeout(() => {
            console.log('💡 LocalStorage was cleared due to data corruption. Starting fresh!');
          }, 1000);
        } else {
          console.log('✅ LocalStorage data appears valid');
        }
      }
    } else {
      console.log('📭 No existing localStorage data found');
    }
  } catch (error) {
    console.warn('⚠️ Error during localStorage migration, clearing storage:', error);
    localStorage.removeItem('project-storage');
    console.log('🔄 Cleared localStorage due to migration error');
  }
};

function App() {
  // Run migration on app start
  React.useEffect(() => {
    console.log('🚀 Starting Gantt App with data migration check...');
    migrateLegacyStorage();
  }, []);
  
  return (
    /* PROVIDERS GLOBAUX
     * -----------------
     * Ordre important des providers :
     * 1. ThemeProvider : Gère le design system Material-UI
     * 2. SnackbarProvider : Gère les notifications toast
     * 3. AuthProvider : Gère l'état d'authentification
     */
    <ThemeProvider theme={appTheme}>
      <CssBaseline /> {/* Normalise les styles cross-browser */}
      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
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
                    <Route path="projects" element={<Projects />} />
                    <Route path="projects/:projectId" element={<GanttView />} />
                    <Route path="projects/:projectId/simple" element={<GanttView />} />
                    {/* Comment out routes that don't have components yet */}
                    {/* <Route path="settings" element={<Settings />} /> */}
                    {/* <Route path="user-profile" element={<UserProfile />} /> */}
                  </Route>

                  {/* Fallback 404 */}
                  <Route path="*" element={<NotFoundView />} />
                </Routes>
              </Suspense>
            </AuthProvider>
          </BrowserRouter>
        </SnackbarProvider>
      </LocalizationProvider>
    </ThemeProvider>
  );
}

export default App;

