/**
 * CONFIGURATION DU THÈME MATERIAL-UI
 * ==================================
 * 
 * Responsabilités :
 * - Définit le design system de l'application
 * - Centralise les couleurs, typographies et espacements
 * - Configure les variants globaux des composants
 * 
 * Documentation MUI : https://mui.com/material-ui/customization/theming/
 */

import { createTheme } from '@mui/material/styles';

// Palette de couleurs principale
const palette = {
  primary: {
    main: '#1976d2', // Bleu Material-UI par défaut
    light: '#42a5f5',
    dark: '#1565c0',
    contrastText: '#ffffff',
  },
  secondary: {
    main: '#9c27b0', // Violet
    light: '#ba68c8',
    dark: '#7b1fa2',
  },
  error: {
    main: '#d32f2f', // Rouge
  },
  background: {
    default: '#f5f5f5', // Gris clair
    paper: '#ffffff',   // Blanc
  },
};

// Configuration des typographies
const typography = {
  fontFamily: [
    '"Roboto"',
    '"Helvetica Neue"',
    'Arial',
    'sans-serif'
  ].join(','),
  h1: { fontSize: '2.5rem', fontWeight: 500 },
  h2: { fontSize: '2rem', fontWeight: 500 },
  h3: { fontSize: '1.75rem' },
  button: { textTransform: 'none' } // Désactive la capitalization automatique
};

// Configuration des composants globaux
const components = {
  MuiButton: {
    styleOverrides: {
      root: {
        borderRadius: 8, // Bordures plus arrondies
        padding: '8px 16px'
      }
    },
    defaultProps: {
      disableElevation: true // Désactive l'ombre par défaut
    }
  },
  MuiPaper: {
    styleOverrides: {
      root: {
        borderRadius: 12,
        boxShadow: '0px 2px 10px rgba(0, 0, 0, 0.08)' // Ombre plus douce
      }
    }
  }
};

// Création du thème
const theme = createTheme({
  palette,
  typography,
  components,
  spacing: 8, // Base spacing unit (1 = 8px)
  shape: {
    borderRadius: 8 // Bordure par défaut
  }
});

export default theme;
