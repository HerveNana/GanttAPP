/**
 * VUE D'AUTHENTIFICATION
 * ======================
 * 
 * Responsabilités :
 * - Gestion du formulaire de connexion
 * - Validation des entrées utilisateur
 * - Intégration avec le système d'authentification
 * 
 * Architecture :
 * - Utilise Formik + Yup pour la gestion de formulaire
 * - Intègre Material-UI pour les composants UI
 * - Connecté au AuthContext pour la gestion d'état
 */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@contexts/AuthContext';
import { Formik, Form, Field } from 'formik';
import { TextField } from 'formik-mui';
import * as Yup from 'yup';
import {
  Button,
  Box,
  Typography,
  Alert,
  CircularProgress,
  Grid,
} from '@mui/material';

// Schéma de validation Yup
const LoginSchema = Yup.object().shape({
  email: Yup.string()
    .email('Email invalide')
    .required('Champ obligatoire'),
  password: Yup.string()
    .min(8, 'Trop court (minimum 8 caractères)')
    .required('Champ obligatoire'),
});

export default function LoginView() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState(null);

  /**
   * Soumission du formulaire
   * @param {object} values - Valeurs du formulaire
   * @param {object} actions - Objet Formik
   */
  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      setError(null);
      await login(values.email, values.password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Échec de la connexion');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 400, mx: 'auto', mt: 8, p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom align="center">
        Connexion
      </Typography>

      {/* Affichage des erreurs */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Formulaire Formik */}
      <Formik
        initialValues={{ email: '', password: '' }}
        validationSchema={LoginSchema}
        onSubmit={handleSubmit}
      >
        {({ isSubmitting }) => (
          <Form>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Field
                  component={TextField}
                  name="email"
                  type="email"
                  label="Email"
                  fullWidth
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12}>
                <Field
                  component={TextField}
                  name="password"
                  type="password"
                  label="Mot de passe"
                  fullWidth
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12}>
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={isSubmitting}
                  startIcon={
                    isSubmitting ? <CircularProgress size={20} /> : null
                  }
                >
                  Se connecter
                </Button>
              </Grid>
            </Grid>
          </Form>
        )}
      </Formik>

      {/* Liens secondaires */}
      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <Typography variant="body2">
          <Link to="/reset-password" style={{ textDecoration: 'none' }}>
            Mot de passe oublié ?
          </Link>
        </Typography>
        <Typography variant="body2" sx={{ mt: 1 }}>
          Nouvel utilisateur ?{' '}
          <Link to="/register" style={{ textDecoration: 'none' }}>
            Créer un compte
          </Link>
        </Typography>
      </Box>
    </Box>
  );
}
