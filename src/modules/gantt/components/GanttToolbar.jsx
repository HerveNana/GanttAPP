import React from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Button,
  IconButton,
  Tooltip,
  Stack,
  useTheme,
  useMediaQuery,
  Typography,
  Chip
} from '@mui/material';
import {
  Add as AddIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  Today as TodayIcon,
  FilterList as FilterIcon,
  AccountTree as DependencyIcon
} from '@mui/icons-material';

const GanttToolbar = ({ 
  onAddTask, 
  onZoomIn, 
  onZoomOut, 
  onToday, 
  onFilter,
  onDependencies,
  zoomLevel = 100
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Box
      sx={{
        p: 2,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: 1,
        borderColor: 'divider'
      }}
    >
      <Button
        variant="contained"
        color="primary"
        startIcon={<AddIcon />}
        onClick={onAddTask}
        size={isMobile ? 'small' : 'medium'}
      >
        {!isMobile && 'Nouvelle Tâche'}
      </Button>

      <Stack direction="row" spacing={1} alignItems="center">
        <Tooltip title="Zoom avant">
          <IconButton onClick={onZoomIn} size={isMobile ? 'small' : 'medium'}>
            <ZoomInIcon />
          </IconButton>
        </Tooltip>
        
        {!isMobile && (
          <Chip 
            size="small" 
            label={`${zoomLevel}%`}
            color="primary"
            variant="outlined"
          />
        )}
        
        <Tooltip title="Zoom arrière">
          <IconButton onClick={onZoomOut} size={isMobile ? 'small' : 'medium'}>
            <ZoomOutIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Aujourd'hui">
          <IconButton onClick={onToday} size={isMobile ? 'small' : 'medium'}>
            <TodayIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Filtrer">
          <IconButton onClick={onFilter} size={isMobile ? 'small' : 'medium'}>
            <FilterIcon />
          </IconButton>
        </Tooltip>
        {onDependencies && (
          <Tooltip title="Gérer les dépendances">
            <IconButton onClick={onDependencies} size={isMobile ? 'small' : 'medium'}>
              <DependencyIcon />
            </IconButton>
          </Tooltip>
        )}
      </Stack>
    </Box>
  );
};

GanttToolbar.propTypes = {
  onAddTask: PropTypes.func.isRequired,
  onZoomIn: PropTypes.func.isRequired,
  onZoomOut: PropTypes.func.isRequired,
  onToday: PropTypes.func.isRequired,
  onFilter: PropTypes.func.isRequired,
  onDependencies: PropTypes.func,
  zoomLevel: PropTypes.number
};

export default GanttToolbar;

