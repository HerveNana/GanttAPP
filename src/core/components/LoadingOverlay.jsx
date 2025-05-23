/**
 * COMPOSANT LOADING OVERLAY
 * ========================
 * 
 * Responsabilités :
 * - Affiche un indicateur de chargement global
 * - Couvre toute la vue pendant les opérations asynchrones
 * - Animation fluide pour une meilleure expérience utilisateur
 * 
 * Props :
 * - fullScreen : bool (default: true) - Couvre toute la fenêtre
 * - message : string - Message optionnel à afficher
 */

import React from 'react';
import { 
  CircularProgress,
  Backdrop,
  Box,
  Typography
} from '@mui/material';

export default function LoadingOverlay({ fullScreen = true, message }) {
  // Style conditionnel pour le mode plein écran
  const containerStyle = fullScreen ? { 
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    backgroundColor: 'rgba(0, 0, 0, 0.5)' // Fond semi-transparent
  } : {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4
  };

  return (
    <Backdrop open sx={containerStyle}>
      <Box sx={{ 
        textAlign: 'center',
        color: 'common.white'
      }}>
        <CircularProgress color="inherit" size={60} thickness={4} />
        {message && (
          <Typography variant="body1" sx={{ mt: 2 }}>
            {message}
          </Typography>
        )}
      </Box>
    </Backdrop>
  );
}

LoadingOverlay.propTypes = {
  fullScreen: PropTypes.bool,
  message: PropTypes.string
};
