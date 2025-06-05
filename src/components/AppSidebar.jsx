/**
 * APP SIDEBAR COMPONENT
 * ====================
 * 
 * Responsible for:
 * - Primary application navigation
 * - User profile quick access
 * - Responsive behavior (mobile/desktop)
 * - Theme-aware styling
 * 
 * Architecture:
 * - Uses Material-UI for consistent styling
 * - Implements responsive design with custom hooks
 * - Follows accessibility best practices
 * - Type-safe with PropTypes
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Link  } from 'react-router-dom';
import PropTypes from 'prop-types';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  // Folder, // Correct import - no "Icon" suffix
  Settings as SettingsIcon,
  ChevronLeft as ChevronLeftIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Toolbar,
  IconButton,
  useMediaQuery,
  useTheme
} from '@mui/material';
import Folder from '@mui/icons-material/Folder';

// Sidebar width constants for maintainability
const DRAWER_WIDTH = 240;
const COLLAPSED_WIDTH = 73;

/**
 * Main Sidebar Component
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.mobileOpen - Mobile open state (controlled by parent)
 * @param {function} props.handleDrawerToggle - Mobile toggle handler
 */
const AppSidebar = ({ mobileOpen, handleDrawerToggle }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // Local state for desktop expanded/collapsed state
  const [collapsed, setCollapsed] = useState(false);
  const [activePath, setActivePath] = useState(location.pathname);

  // Update active path on route change
  useEffect(() => {
    setActivePath(location.pathname);
  }, [location]);

  /**
   * Navigation items configuration
   * Centralized for easy maintenance and i18n potential
   */
  const navItems = [
    {
      path: '/',
      label: 'Dashboard',
      icon: <DashboardIcon />,
      exact: true
    },
    {
      path: '/projects',
      label: 'Projects',
      icon: <Folder />,
      exact: false
    },
    {
      path: '/settings',
      label: 'Settings',
      icon: <SettingsIcon />,
      exact: true
    }
  ];

  /**
   * Determines if a nav item is active
   * @param {Object} item - Navigation item
   * @returns {boolean} Active state
   */
  const isActive = (item) => {
    return item.exact 
      ? activePath === item.path
      : activePath.startsWith(item.path);
  };

  /**
   * Handles navigation to a route
   * @param {string} path - Target path
   */
  const handleNavigation = (path) => {
    navigate(path);
    if (isMobile) handleDrawerToggle(); // Close on mobile after selection
  };

  /**
   * Toggles desktop expanded/collapsed state
   */
  const handleToggleCollapse = () => {
    setCollapsed(!collapsed);
  };

  return (
    <>
      {/* Mobile Temporary Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }} // Better performance on mobile
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            backgroundColor: theme.palette.background.paper
          }
        }}
      >
        <Toolbar>
          <IconButton onClick={handleDrawerToggle}>
            <ChevronLeftIcon />
          </IconButton>
        </Toolbar>
        <Divider />
        <NavContent 
          items={navItems} 
          isActive={isActive} 
          onNavigate={handleNavigation} 
        />
      </Drawer>

      {/* Desktop Persistent Drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          width: collapsed ? COLLAPSED_WIDTH : DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: collapsed ? COLLAPSED_WIDTH : DRAWER_WIDTH,
            overflowX: 'hidden',
            transition: theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.leavingScreen
            }),
            backgroundColor: theme.palette.background.paper,
            boxSizing: 'border-box'
          }
        }}
        open
      >
        <Toolbar sx={{ justifyContent: 'flex-end' }}>
          <IconButton onClick={handleToggleCollapse}>
            {collapsed ? <MenuIcon /> : <ChevronLeftIcon />}
          </IconButton>
        </Toolbar>
        <Divider />
        <NavContent 
          items={navItems} 
          isActive={isActive} 
          onNavigate={handleNavigation} 
          collapsed={collapsed}
        />
        <UserProfileSection collapsed={collapsed} />
      </Drawer>
    </>
  );
};

/**
 * Reusable Navigation Content Component
 */
const NavContent = ({ items, isActive, onNavigate, collapsed = false }) => {
  const theme = useTheme();

  return (
    <List>
      {items.map((item) => (
        <ListItem
          button
          key={item.path}
          onClick={() => onNavigate(item.path)}
          selected={isActive(item)}
          sx={{
            '&.Mui-selected': {
              backgroundColor: theme.palette.action.selected,
              '&:hover': {
                backgroundColor: theme.palette.action.selected
              }
            },
            px: collapsed ? 2.5 : 3,
            justifyContent: collapsed ? 'center' : 'flex-start'
          }}
        >
          <ListItemIcon
            sx={{
              minWidth: 'auto',
              mr: collapsed ? 0 : 2,
              color: isActive(item) 
                ? theme.palette.primary.main 
                : theme.palette.text.secondary
            }}
          >
            {item.icon}
          </ListItemIcon>
          {!collapsed && <ListItemText primary={item.label} />}
        </ListItem>
      ))}
    </List>
  );
};

/**
 * User Profile Section Component
 */
const UserProfileSection = ({ collapsed }) => {
  const theme = useTheme();

  return (
    <div style={{ marginTop: 'auto' }}>
      <Divider />
      <List>
        <ListItem
          button
          sx={{
            px: collapsed ? 2.5 : 3,
            justifyContent: collapsed ? 'center' : 'flex-start'
          }}
        >
          <ListItemIcon
            sx={{
              minWidth: 'auto',
              mr: collapsed ? 0 : 2,
              color: theme.palette.text.secondary
            }}
          >
            <PersonIcon />
          </ListItemIcon>
          {!collapsed && <ListItemText primary="User Profile" />}
        </ListItem>
      </List>
    </div>
  );
};

AppSidebar.propTypes = {
  mobileOpen: PropTypes.bool,
  handleDrawerToggle: PropTypes.func.isRequired
};

export default AppSidebar;
