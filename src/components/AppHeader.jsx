/**
 * APPLICATION HEADER COMPONENT
 * ===========================
 * 
 * Responsibilities:
 * - Displays global navigation
 * - Shows user profile/account controls
 * - Handles responsive menu behavior
 * 
 * Props:
 * - onMenuClick: Function to handle mobile menu toggle
 * - title: Optional application title
 */

import React from 'react';
import PropTypes from 'prop-types';
import { 
  AppBar,
  Toolbar,
  IconButton,
  Typography
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';

const AppHeader = ({ onMenuClick, title = 'My App' }) => {
  return (
    <AppBar position="fixed" elevation={0}>
      <Toolbar>
        <IconButton
          edge="start"
          color="inherit"
          onClick={onMenuClick}
          sx={{ mr: 2 }}
        >
          <MenuIcon />
        </IconButton>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          {title}
        </Typography>
      </Toolbar>
    </AppBar>
  );
};

AppHeader.propTypes = {
  onMenuClick: PropTypes.func.isRequired,
  title: PropTypes.string
};

export default AppHeader; // Default export
