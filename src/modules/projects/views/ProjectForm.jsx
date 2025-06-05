/**
 * COMPOSANT : ProjectForm
 * DESCRIPTION : Formulaire de création/édition de projet
 * 
 * Fonctionnalités :
 * - Gère la création et l'édition des projets
 * - Validation des champs requis
 * - Interface utilisateur cohérente avec Material-UI
 * 
 * Props :
 * - initialValues: Valeurs initiales du formulaire (pour l'édition)
 * - onSubmit: Callback lors de la soumission du formulaire
 * - onCancel: Callback pour annuler et fermer le formulaire
 */

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  TextField,
  Button,
  Grid,
  CircularProgress,
  Typography
} from '@mui/material';
import { Save, Cancel } from '@mui/icons-material';

const ProjectForm = ({ initialValues, onSubmit, onCancel }) => {
  // ÉTATS DU FORMULAIRE
  const [formValues, setFormValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * GESTIONNAIRE : Mise à jour des champs du formulaire
   * @param {Event} e - Événement de changement
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Mise à jour des valeurs du formulaire
    setFormValues({
      ...formValues,
      [name]: value
    });
    
    // Réinitialisation de l'erreur pour ce champ si elle existe
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null
      });
    }
  };

  /**
   * VALIDATION : Vérifie la validité du formulaire
   * @returns {boolean} Formulaire valide ou non
   */
  const validateForm = () => {
    const newErrors = {};
    
    // Validation du nom (obligatoire)
    if (!formValues.name || formValues.name.trim() === '') {
      newErrors.name = 'Le nom du projet est obligatoire';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * GESTIONNAIRE : Soumission du formulaire
   * @param {Event} e - Événement de soumission
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation avant soumission
    if (!validateForm()) {
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Appel du callback de soumission
      await onSubmit(formValues);
      
      // Réinitialisation du formulaire après soumission réussie
      setFormValues(initialValues);
      
    } catch (err) {
      console.error('Erreur lors de la soumission:', err);
      setErrors({
        submit: err.message || 'Une erreur est survenue lors de la soumission'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // RENDU DU FORMULAIRE
  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
      {/* MESSAGE D'ERREUR GLOBAL */}
      {errors.submit && (
        <Typography color="error" sx={{ mb: 2 }}>
          {errors.submit}
        </Typography>
      )}
      
      {/* CHAMPS DU FORMULAIRE */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Nom du projet"
            name="name"
            value={formValues.name || ''}
            onChange={handleChange}
            error={!!errors.name}
            helperText={errors.name}
            required
            disabled={isSubmitting}
          />
        </Grid>
        
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Description"
            name="description"
            value={formValues.description || ''}
            onChange={handleChange}
            multiline
            rows={4}
            disabled={isSubmitting}
          />
        </Grid>
      </Grid>
      
      {/* BOUTONS D'ACTION */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3, gap: 2 }}>
        <Button
          variant="outlined"
          color="secondary"
          onClick={onCancel}
          startIcon={<Cancel />}
          disabled={isSubmitting}
        >
          Annuler
        </Button>
        
        <Button
          type="submit"
          variant="contained"
          color="primary"
          startIcon={isSubmitting ? <CircularProgress size={20} /> : <Save />}
          disabled={isSubmitting}
        >
          {initialValues.id ? 'Mettre à jour' : 'Créer'}
        </Button>
      </Box>
    </Box>
  );
};

// VALIDATION DES PROPS
ProjectForm.propTypes = {
  initialValues: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    description: PropTypes.string
  }).isRequired,
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired
};

export default ProjectForm;

