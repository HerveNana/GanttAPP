/**
 * COMPOSANT : Projects
 * DESCRIPTION : Page principale de gestion des projets
 * 
 * Fonctionnalités :
 * - Affiche la liste des projets
 * - Permet la création, édition et suppression de projets
 * - Gère les états de chargement et erreurs
 * - Intère avec l'API/Store global
 * 
 * Technologies utilisées :
 * - React Hooks (useState, useEffect)
 * - Gestion d'état (Zustand/Redux selon configuration)
 * - Material-UI pour l'UI
 * - Axios pour les requêtes API (si nécessaire)
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjectStore } from '../../../core/stores/ProjectStore'; // Hook personnalisé pour les projets
import { 
  Box, 
  Typography, 
  Button, 
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  Stack,
  Tooltip
} from '@mui/material';
import { Add, Edit, Delete, Visibility, AutoAwesome } from '@mui/icons-material';
import ProjectForm from './ProjectForm'; // Formulaire de création/édition

const Projects = () => {
  // ÉTATS LOCAUX
  const [openDialog, setOpenDialog] = useState(false);
  const [currentProject, setCurrentProject] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // STORE GLOBAL (Zustand)
  const { 
    projects, 
    createProject, 
    updateProject, 
    deleteProject, 
    loadDemoProject,
    error: storeError, 
    loading: storeLoading 
  } = useProjectStore((state) => ({
    projects: state.projects,
    createProject: state.createProject,
    updateProject: state.updateProject,
    deleteProject: state.deleteProject,
    loadDemoProject: state.loadDemoProject,
    error: state.error,
    loading: state.loading
  }));

  /**
   * EFFECT : Synchronise les états locaux avec le store
   */
  useEffect(() => {
    setIsLoading(storeLoading);
    if (storeError) {
      setError(storeError);
    }
  }, [storeLoading, storeError]);

  /**
   * EFFECT : Initialisation du composant
   * Comme le store gère déjà la persistance, nous n'avons pas besoin
   * de charger les données explicitement à chaque montage
   */
  useEffect(() => {
    // Le state est déjà chargé à partir du localStorage par le store
    setIsLoading(false);
  }, []);

  /**
   * GESTIONNAIRE : Ouverture du formulaire pour un nouveau projet
   */
  const handleCreate = () => {
    setCurrentProject(null);
    setOpenDialog(true);
  };

  /**
   * GESTIONNAIRE : Ouverture du formulaire pour édition
   * @param {Object} project - Projet à éditer
   */
  const handleEdit = (project) => {
    setCurrentProject(project);
    setOpenDialog(true);
  };

  /**
   * GESTIONNAIRE : Soumission du formulaire
   * @param {Object} values - Données du formulaire
   */
  const handleSubmit = async (values) => {
    try {
      setError(null);
      
      if (!values.name?.trim()) {
        throw new Error('Le nom du projet est obligatoire');
      }
      
      if (currentProject) {
        // For updates, we pass the project ID and the updates object
        await updateProject(currentProject.id, {
          name: values.name,
          description: values.description || ''
        });
      } else {
        // For creation, we pass both name and description
        await createProject(values.name, values.description || '');
      }
      setOpenDialog(false);
    } catch (err) {
      setError(err.message || 'Une erreur est survenue');
      console.error('Error in project submission:', err);
      throw err; // Re-throw to let the form handle the error state
    }
  };

  /**
   * GESTIONNAIRE : Suppression d'un projet
   * @param {string} id - ID du projet à supprimer
   */
  const handleDelete = async (id) => {
    if (window.confirm('Confirmer la suppression ?')) {
      try {
        await deleteProject(id);
      } catch (err) {
        setError(err.message);
      }
    }
  };
  
  /**
   * GESTIONNAIRE : Navigation vers le diagramme de Gantt d'un projet
   * @param {string} id - ID du projet à visualiser
   */
  const handleViewGantt = (id) => {
    navigate(`/projects/${id}`);
  };
  
  /**
   * GESTIONNAIRE : Chargement d'un projet de démonstration
   */
  const handleLoadDemo = async () => {
    try {
      const demoProjectId = loadDemoProject();
      setError(null);
      // Navigate to the newly created demo project
      navigate(`/projects/${demoProjectId}`);
    } catch (err) {
      setError(err.message || 'Erreur lors du chargement du projet de démonstration');
    }
  };

  // RENDU PRINCIPAL
  return (
    <Box sx={{ p: 3 }}>
      {/* EN-TÊTE DE PAGE */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Gestion des Projets
        </Typography>
        <Stack direction="row" spacing={2}>
          <Button 
            variant="outlined" 
            startIcon={<AutoAwesome />}
            onClick={handleLoadDemo}
            color="secondary"
          >
            Projet Démo
          </Button>
          {process.env.NODE_ENV !== 'production' && (
            <Button 
              variant="outlined" 
              color="warning"
              onClick={() => {
                if (window.confirm('Supprimer toutes les données en cache? Cette action est irréversible.')) {
                  localStorage.removeItem('project-storage');
                  window.location.reload();
                }
              }}
            >
              Clear Cache
            </Button>
          )}
          <Button 
            variant="contained" 
            startIcon={<Add />}
            onClick={handleCreate}
          >
            Nouveau Projet
          </Button>
        </Stack>
      </Box>

      {/* GESTION DES ERREURS */}
      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          Erreur : {error}
        </Typography>
      )}

      {/* TABLEAU DES PROJETS */}
      {isLoading ? (
        <CircularProgress />
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nom</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Date de création</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {projects.map((project) => (
                <TableRow key={project.id}>
                  <TableCell>{project.name}</TableCell>
                  <TableCell>{project.description}</TableCell>
                  <TableCell>
                    {new Date(project.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Tooltip title="Voir diagramme Gantt">
                      <IconButton onClick={() => handleViewGantt(project.id)} color="success">
                        <Visibility />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Modifier le projet">
                      <IconButton onClick={() => handleEdit(project)}>
                        <Edit color="primary" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Supprimer le projet">
                      <IconButton onClick={() => handleDelete(project.id)}>
                        <Delete color="error" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* DIALOGUE DE FORMULAIRE */}
      <Dialog 
        open={openDialog} 
        onClose={() => setOpenDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {currentProject ? 'Éditer le Projet' : 'Nouveau Projet'}
        </DialogTitle>
        <DialogContent>
          <ProjectForm
            initialValues={currentProject || { name: '', description: '' }}
            onSubmit={handleSubmit}
            onCancel={() => setOpenDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default Projects;
