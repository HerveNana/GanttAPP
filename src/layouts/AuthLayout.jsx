/**
 * LAYOUT D'AUTHENTIFICATION
 * ========================
 * 
 * Responsabilités :
 * - Structure des pages de login/register
 * - Version épurée sans sidebar/header
 */

import React from 'react';
import { Outlet } from 'react-router-dom';
import { Box } from '@mui/material';

export default function AuthLayout() {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        bgcolor: 'background.default'
      }}
    >
      <Outlet />
    </Box>
  );
}
