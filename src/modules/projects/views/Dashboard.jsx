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
import { 
  Box, 
  Typography, 
  Button, 
  Card, 
  CardContent, 
  CardActions,
  Grid,
  CircularProgress
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useProjectStore } from '../../../core/stores/ProjectStore';

export default function ProjectDashboard() {
  const navigate = useNavigate();
  const { projects, loading, error } = useProjectStore(state => ({
    projects: state.projects,
    loading: state.loading,
    error: state.error
  }));

  const handleCreateProject = () => {
    navigate('/projects'); // Navigate to projects page where creation can happen
  };

  const handleViewProject = (projectId) => {
    navigate(`/projects/${projectId}`);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Tableau de bord des projets
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleCreateProject}
        >
          Nouveau Projet
        </Button>
      </Box>

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      {projects.length === 0 ? (
        <Card sx={{ textAlign: 'center', p: 3 }}>
          <CardContent>
            <Typography variant="h6" color="textSecondary">
              Aucun projet n'a été créé
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
              Commencez par créer votre premier projet
            </Typography>
          </CardContent>
          <CardActions sx={{ justifyContent: 'center' }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleCreateProject}
            >
              Créer un projet
            </Button>
          </CardActions>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {projects.map((project) => (
            <Grid item xs={12} sm={6} md={4} key={project.id}>
              <Card>
                <CardContent>
                  <Typography variant="h6" component="h2" noWrap>
                    {project.name}
                  </Typography>
                  <Typography color="textSecondary" sx={{ mb: 1.5 }}>
                    {new Date(project.createdAt).toLocaleDateString()}
                  </Typography>
                  <Typography variant="body2" noWrap>
                    {project.description || 'Aucune description'}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button 
                    size="small" 
                    onClick={() => handleViewProject(project.id)}
                  >
                    Voir le projet
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
