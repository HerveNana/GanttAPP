/**
 * VUE TABLEAU DE BORD DES PROJETS
 * ==============================
 * 
 * Responsabilités :
 * - Affiche la liste des projets
 * - Gère les interactions principales
 * - Fournit l'entrée vers le diagramme de Gantt
 */

import React from 'react';
import { Box, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

export default function ProjectDashboard() {
  const navigate = useNavigate();

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Tableau de bord des projets
      </Typography>
      <Box sx={{ mt: 2 }}>
        {/* Contenu temporaire - à remplacer par votre implémentation */}
        <Typography>
          Bienvenue dans l'application de gestion de projets.
        </Typography>
      </Box>
    </Box>
  );
}
