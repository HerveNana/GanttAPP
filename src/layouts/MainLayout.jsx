/**
 * LAYOUT PRINCIPAL DE L'APPLICATION
 * =================================
 * 
 * Responsabilités :
 * - Structure commune des pages authentifiées
 * - Intègre le header, la navigation et le contenu principal
 * - Gère le container principal et le système de grille
 */

import React from 'react';
import { Outlet } from 'react-router-dom';
import { Box, CssBaseline, Toolbar } from '@mui/material';
import AppHeader from '../components/AppHeader';
import AppSidebar from '../components/AppSidebar';

export default function MainLayout() {
  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppHeader />
      <AppSidebar />
      
      {/* Contenu principal */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: 'calc(100% - 240px)',
          minHeight: '100vh'
        }}
      >
        <Toolbar /> {/* Espace pour le header fixe */}
        <Outlet /> {/* Contenu des routes enfants */}
      </Box>
    </Box>
  );
}
