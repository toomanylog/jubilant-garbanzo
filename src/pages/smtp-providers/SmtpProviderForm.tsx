import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  FormHelperText,
  Alert,
  CircularProgress,
  Switch,
  FormControlLabel
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'react-toastify';

import Layout from '../../components/layout/Layout';
import { useAuth } from '../../contexts/AuthContext';
import { 
  SmtpProvider, 
  createSmtpProvider, 
  updateSmtpProvider
} from '../../models/dynamodb';

// Props pour le composant
interface SmtpProviderFormProps {
  initialValues?: SmtpProvider;
  isEditing?: boolean;
}

const SmtpProviderForm: React.FC<SmtpProviderFormProps> = ({ 
  initialValues,
  isEditing = false
}) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Valeurs par défaut du formulaire
  const defaultValues = {
    name: '',
    providerType: 'custom_smtp' as const,
    host: '',
    port: '587',
    username: '',
    password: '',
    apiKey: '',
    region: 'us-east-1',
    isDefault: false,
    requiresTls: true
  };

  // Schéma de validation
  const validationSchema = Yup.object().shape({
    name: Yup.string().required('Le nom est requis'),
    providerType: Yup.string().required('Le type de fournisseur est requis'),
    host: Yup.string().when('providerType', {
      is: (val: string) => ['custom_smtp', 'office365'].includes(val),
      then: () => Yup.string().required('Le nom d\'hôte est requis')
    }),
    port: Yup.string().when('providerType', {
      is: (val: string) => ['custom_smtp', 'office365'].includes(val),
      then: () => Yup.string().required('Le port est requis')
    }),
    username: Yup.string().when('providerType', {
      is: (val: string) => ['custom_smtp', 'office365', 'aws_ses', 'mailjet'].includes(val),
      then: () => Yup.string().required('Le nom d\'utilisateur est requis')
    }),
    password: Yup.string().when(['providerType', 'isEditing'], {
      is: (providerType: string, editing: boolean) => 
        ['custom_smtp', 'office365', 'aws_ses', 'mailjet'].includes(providerType) && !editing,
      then: () => Yup.string().required('Le mot de passe est requis')
    }),
    apiKey: Yup.string().when('providerType', {
      is: (val: string) => val === 'sendgrid',
      then: () => Yup.string().required('La clé API est requise')
    }),
    region: Yup.string().when('providerType', {
      is: (val: string) => val === 'aws_ses',
      then: () => Yup.string().required('La région est requise')
    })
  });

  // Gestion du formulaire avec Formik
  const formik = useFormik({
    initialValues: initialValues || defaultValues,
    validationSchema,
    onSubmit: async (values) => {
      if (!currentUser) return;
      
      setIsSubmitting(true);
      setError(null);
      
      try {
        // Copie des valeurs sans les propriétés à transformer
        const { port, ...otherValues } = values;
        
        const providerData: SmtpProvider = {
          ...otherValues,
          userId: currentUser.userId,
          providerId: initialValues?.providerId || uuidv4(),
          createdAt: initialValues?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          providerType: values.providerType as 'aws_ses' | 'custom_smtp' | 'office365' | 'sendgrid' | 'mailjet',
          port: port ? parseInt(port as string) : undefined
        };
        
        if (isEditing) {
          await updateSmtpProvider(providerData);
          toast.success('Fournisseur SMTP mis à jour avec succès');
        } else {
          await createSmtpProvider(providerData);
          toast.success('Fournisseur SMTP créé avec succès');
        }
        
        navigate('/smtp-providers');
      } catch (err: any) {
        console.error('Erreur lors de la sauvegarde du fournisseur SMTP:', err);
        setError(err.message || 'Une erreur est survenue');
      } finally {
        setIsSubmitting(false);
      }
    }
  });

  // Vérifie si les champs sont conditionnellement requis
  const isFieldRequired = (field: string): boolean => {
    switch (field) {
      case 'host':
      case 'port':
        return ['custom_smtp', 'office365'].includes(formik.values.providerType);
      case 'username':
        return ['custom_smtp', 'office365', 'aws_ses', 'mailjet'].includes(formik.values.providerType);
      case 'password':
        // Si on est en mode édition, le mot de passe n'est pas obligatoire (on peut le garder inchangé)
        if (isEditing) return false;
        return ['custom_smtp', 'office365', 'aws_ses', 'mailjet'].includes(formik.values.providerType);
      case 'apiKey':
        return formik.values.providerType === 'sendgrid';
      case 'region':
        return formik.values.providerType === 'aws_ses';
      default:
        return false;
    }
  };

  return (
    <Layout title={isEditing ? "Modifier un fournisseur SMTP" : "Ajouter un fournisseur SMTP"}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1">
          {isEditing ? "Modifier un fournisseur SMTP" : "Ajouter un fournisseur SMTP"}
        </Typography>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Paper elevation={2} sx={{ p: 3 }}>
        <form onSubmit={formik.handleSubmit}>
          <Grid container component="div" spacing={3}>
            <Grid sx={{ display: 'flex', flexDirection: 'column' }} xs={12} md={6}>
              <TextField
                fullWidth
                id="name"
                name="name"
                label="Nom du fournisseur"
                value={formik.values.name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.name && Boolean(formik.errors.name)}
                helperText={formik.touched.name && formik.errors.name}
                required
              />
            </Grid>
            
            <Grid sx={{ display: 'flex', flexDirection: 'column' }} xs={12} md={6}>
              <FormControl fullWidth error={formik.touched.providerType && Boolean(formik.errors.providerType)}>
                <InputLabel id="providerType-label">Type de fournisseur</InputLabel>
                <Select
                  labelId="providerType-label"
                  id="providerType"
                  name="providerType"
                  value={formik.values.providerType}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  label="Type de fournisseur"
                  required
                >
                  <MenuItem value="aws_ses">Amazon SES</MenuItem>
                  <MenuItem value="custom_smtp">SMTP Personnalisé</MenuItem>
                  <MenuItem value="office365">Office 365</MenuItem>
                  <MenuItem value="sendgrid">SendGrid</MenuItem>
                  <MenuItem value="mailjet">Mailjet</MenuItem>
                </Select>
                {formik.touched.providerType && formik.errors.providerType && (
                  <FormHelperText>{formik.errors.providerType}</FormHelperText>
                )}
              </FormControl>
            </Grid>
            
            {/* Champs conditionnels en fonction du type de fournisseur */}
            {isFieldRequired('host') && (
              <Grid sx={{ display: 'flex', flexDirection: 'column' }} xs={12} md={6}>
                <TextField
                  fullWidth
                  id="host"
                  name="host"
                  label="Nom d'hôte"
                  value={formik.values.host}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.host && Boolean(formik.errors.host)}
                  helperText={formik.touched.host && formik.errors.host}
                  required={isFieldRequired('host')}
                />
              </Grid>
            )}
            
            {isFieldRequired('port') && (
              <Grid sx={{ display: 'flex', flexDirection: 'column' }} xs={12} md={6}>
                <TextField
                  fullWidth
                  id="port"
                  name="port"
                  label="Port"
                  type="number"
                  value={formik.values.port}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.port && Boolean(formik.errors.port)}
                  helperText={formik.touched.port && formik.errors.port}
                  required={isFieldRequired('port')}
                />
              </Grid>
            )}
            
            {isFieldRequired('username') && (
              <Grid sx={{ display: 'flex', flexDirection: 'column' }} xs={12} md={6}>
                <TextField
                  fullWidth
                  id="username"
                  name="username"
                  label={formik.values.providerType === 'aws_ses' ? "Access Key" : "Nom d'utilisateur"}
                  value={formik.values.username}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.username && Boolean(formik.errors.username)}
                  helperText={formik.touched.username && formik.errors.username}
                  required={isFieldRequired('username')}
                />
              </Grid>
            )}
            
            {isFieldRequired('password') && (
              <Grid sx={{ display: 'flex', flexDirection: 'column' }} xs={12} md={6}>
                <TextField
                  fullWidth
                  id="password"
                  name="password"
                  label={formik.values.providerType === 'aws_ses' ? "Secret Key" : "Mot de passe"}
                  type="password"
                  value={formik.values.password}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.password && Boolean(formik.errors.password)}
                  helperText={
                    (formik.touched.password && formik.errors.password) || 
                    (isEditing ? "Laissez vide pour conserver le mot de passe actuel" : "")
                  }
                  required={isFieldRequired('password')}
                />
              </Grid>
            )}
            
            {isFieldRequired('apiKey') && (
              <Grid sx={{ display: 'flex', flexDirection: 'column' }} xs={12} md={6}>
                <TextField
                  fullWidth
                  id="apiKey"
                  name="apiKey"
                  label="Clé API"
                  value={formik.values.apiKey}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.apiKey && Boolean(formik.errors.apiKey)}
                  helperText={formik.touched.apiKey && formik.errors.apiKey}
                  required={isFieldRequired('apiKey')}
                />
              </Grid>
            )}
            
            {isFieldRequired('region') && (
              <Grid sx={{ display: 'flex', flexDirection: 'column' }} xs={12} md={6}>
                <TextField
                  fullWidth
                  id="region"
                  name="region"
                  label="Région AWS"
                  value={formik.values.region}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.region && Boolean(formik.errors.region)}
                  helperText={formik.touched.region && formik.errors.region}
                  required={isFieldRequired('region')}
                />
              </Grid>
            )}
            
            <Grid sx={{ display: 'flex', flexDirection: 'column' }} xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formik.values.requiresTls}
                    onChange={formik.handleChange}
                    name="requiresTls"
                  />
                }
                label="Utiliser TLS"
              />
            </Grid>
            
            <Grid sx={{ display: 'flex', flexDirection: 'column' }} xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formik.values.isDefault}
                    onChange={formik.handleChange}
                    name="isDefault"
                  />
                }
                label="Définir comme fournisseur par défaut"
              />
            </Grid>
            
            <Grid sx={{ display: 'flex', flexDirection: 'column' }} xs={12}>
              <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                <Button
                  variant="contained"
                  color="primary"
                  type="submit"
                  disabled={isSubmitting}
                  startIcon={isSubmitting ? <CircularProgress size={20} /> : null}
                >
                  {isEditing ? "Mettre à jour" : "Créer"}
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/smtp-providers')}
                  disabled={isSubmitting}
                >
                  Annuler
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Layout>
  );
};

export default SmtpProviderForm; 