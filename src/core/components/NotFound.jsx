/**
 * COMPOSANT 404
 * =============
 * 
 * Responsabilités :
 * - Affiche une page d'erreur 404
 * - Propose des actions de navigation
 */

import React from 'react';
import { Button, Typography, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <Box sx={{ textAlign: 'center', mt: 10 }}>
      <Typography variant="h1" gutterBottom>
        404
      </Typography>
      <Typography variant="h5" gutterBottom>
        Page non trouvée
      </Typography>
      <Button
        variant="contained"
        onClick={() => navigate('/')}
        sx={{ mt: 3 }}
      >
        Retour à l'accueil
      </Button>
    </Box>
  );
}
