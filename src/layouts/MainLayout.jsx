/**
 * LAYOUT PRINCIPAL DE L'APPLICATION
 * =================================
 * 
 * Responsabilités :
 * - Structure commune des pages authentifiées
 * - Intègre le header, la navigation et le contenu principal
 * - Gère le container principal et le système de grille
 */

import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Box, CssBaseline, Toolbar } from '@mui/material';
import AppHeader from '../components/AppHeader';
import AppSidebar from '../components/AppSidebar';

export default function MainLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppHeader 
        onMenuClick={handleDrawerToggle}
        title="Gantt App"
      />
      <AppSidebar 
        mobileOpen={mobileOpen}
        handleDrawerToggle={handleDrawerToggle}
      />
      
      {/* Contenu principal */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - 240px)` },
          minHeight: '100vh'
        }}
      >
        <Toolbar /> {/* Espace pour le header fixe */}
        <Outlet /> {/* Contenu des routes enfants */}
      </Box>
    </Box>
  );
}
