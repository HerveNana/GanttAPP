/**
 * LOADING OVERLAY COMPONENT
 * ========================
 * 
 * Displays a full-screen loading indicator
 * 
 * Props:
 * - fullScreen: boolean (default: true)
 * - message: optional loading text
 */

import React from 'react';
import PropTypes from 'prop-types'; // <-- REQUIRED IMPORT
import { 
  Backdrop,
  CircularProgress,
  Box,
  Typography
} from '@mui/material';

const LoadingOverlay = ({ fullScreen = true, message }) => {
  return (
    <Backdrop
      open
      sx={{
        position: fullScreen ? 'fixed' : 'absolute',
        zIndex: (theme) => theme.zIndex.drawer + 1,
        color: '#fff',
      }}
    >
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
      >
        <CircularProgress color="inherit" />
        {message && (
          <Typography variant="body1" sx={{ mt: 2 }}>
            {message}
          </Typography>
        )}
      </Box>
    </Backdrop>
  );
};

// Type checking with PropTypes
LoadingOverlay.propTypes = {
  fullScreen: PropTypes.bool,
  message: PropTypes.string
};

export default LoadingOverlay;
