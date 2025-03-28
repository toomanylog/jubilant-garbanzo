import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  Divider,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  FormHelperText,
  Alert,
  CircularProgress
} from '@mui/material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'react-toastify';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

import Layout from '../../components/layout/Layout';
import { useAuth } from '../../contexts/AuthContext';
import { 
  EmailTemplate, 
  createEmailTemplate, 
  updateEmailTemplate,
  getEmailTemplateById
} from '../../models/dynamodb';

// Props du composant
interface TemplateFormProps {
  initialValues?: EmailTemplate;
  isEditing?: boolean;
}

const TemplateForm: React.FC<TemplateFormProps> = ({ 
  initialValues,
  isEditing = false 
}) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { templateId } = useParams<{ templateId: string }>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [htmlContent, setHtmlContent] = useState(initialValues?.htmlContent || '');

  // Valeurs par défaut
  const defaultValues = {
    name: '',
    subject: '',
    fromName: '',
    fromEmail: '',
    htmlContent: '',
    textContent: ''
  };

  // Schéma de validation
  const validationSchema = Yup.object().shape({
    name: Yup.string().required('Le nom est requis'),
    subject: Yup.string().required('L\'objet est requis'),
    fromName: Yup.string().required('Le nom d\'expéditeur est requis'),
    fromEmail: Yup.string().email('Email invalide').required('L\'email d\'expéditeur est requis')
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
        const templateData: EmailTemplate = {
          ...values,
          htmlContent,
          userId: currentUser.userId,
          templateId: templateId || uuidv4(),
          createdAt: initialValues?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        if (isEditing) {
          await updateEmailTemplate(templateData);
          toast.success('Template mis à jour avec succès');
        } else {
          await createEmailTemplate(templateData);
          toast.success('Template créé avec succès');
        }
        
        navigate('/templates');
      } catch (err: any) {
        console.error('Erreur lors de la sauvegarde du template:', err);
        setError(err.message || 'Une erreur est survenue');
      } finally {
        setIsSubmitting(false);
      }
    }
  });

  // Modules pour l'éditeur Quill
  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'align': [] }],
      ['link', 'image'],
      ['clean']
    ],
  };

  // Formats pour l'éditeur Quill
  const quillFormats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet',
    'color', 'background',
    'align',
    'link', 'image'
  ];

  // Chargement initial du template si mode édition
  useEffect(() => {
    if (isEditing && templateId) {
      const fetchTemplate = async () => {
        setIsLoading(true);
        try {
          const template = await getEmailTemplateById(templateId);
          if (template) {
            formik.setValues({
              name: template.name,
              subject: template.subject,
              fromName: template.fromName,
              fromEmail: template.fromEmail,
              htmlContent: template.htmlContent || '',
              textContent: template.textContent || ''
            });
            setHtmlContent(template.htmlContent || '');
          } else {
            setError('Template non trouvé');
          }
        } catch (err: any) {
          setError(err.message || 'Erreur lors du chargement du template');
        } finally {
          setIsLoading(false);
        }
      };
      fetchTemplate();
    }
  }, [isEditing, templateId, formik]);

  // Afficher un spinner pendant le chargement
  if (isLoading) {
    return (
      <Layout title={isEditing ? 'Éditer un modèle' : 'Créer un modèle'}>
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
          <CircularProgress />
        </Box>
      </Layout>
    );
  }

  return (
    <Layout title={isEditing ? 'Éditer un modèle' : 'Créer un modèle'}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1">
          {isEditing ? 'Éditer un modèle d\'email' : 'Créer un modèle d\'email'}
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
            <Grid sx={{ display: 'flex', flexDirection: 'column' }} xs={12}>
              <TextField
                fullWidth
                id="name"
                name="name"
                label="Nom du template"
                value={formik.values.name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.name && Boolean(formik.errors.name)}
                helperText={formik.touched.name && formik.errors.name}
                required
              />
            </Grid>
            
            <Grid sx={{ display: 'flex', flexDirection: 'column' }} xs={12}>
              <TextField
                fullWidth
                id="subject"
                name="subject"
                label="Sujet de l'email"
                value={formik.values.subject}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.subject && Boolean(formik.errors.subject)}
                helperText={formik.touched.subject && formik.errors.subject}
                required
              />
            </Grid>
            
            <Grid sx={{ display: 'flex', flexDirection: 'column' }} xs={12} md={6}>
              <TextField
                fullWidth
                id="fromName"
                name="fromName"
                label="Nom de l'expéditeur"
                value={formik.values.fromName}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.fromName && Boolean(formik.errors.fromName)}
                helperText={formik.touched.fromName && formik.errors.fromName}
                required
              />
            </Grid>
            
            <Grid sx={{ display: 'flex', flexDirection: 'column' }} xs={12} md={6}>
              <TextField
                fullWidth
                id="fromEmail"
                name="fromEmail"
                label="Email de l'expéditeur"
                type="email"
                value={formik.values.fromEmail}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.fromEmail && Boolean(formik.errors.fromEmail)}
                helperText={formik.touched.fromEmail && formik.errors.fromEmail}
                required
              />
            </Grid>
            
            <Grid sx={{ display: 'flex', flexDirection: 'column' }} xs={12}>
              <Typography variant="h6" component="h3" sx={{ mb: 2 }}>
                Contenu HTML
              </Typography>
              <ReactQuill
                theme="snow"
                value={formik.values.htmlContent}
                onChange={(value) => formik.setFieldValue('htmlContent', value)}
                modules={quillModules}
                formats={quillFormats}
                style={{ 
                  height: '300px', 
                  marginBottom: '50px'
                }}
              />
              {formik.touched.htmlContent && formik.errors.htmlContent && (
                <FormHelperText error>{formik.errors.htmlContent as string}</FormHelperText>
              )}
            </Grid>
            
            <Grid sx={{ display: 'flex', flexDirection: 'column' }} xs={12}>
              <TextField
                fullWidth
                id="textContent"
                name="textContent"
                label="Contenu texte (version alternative sans HTML)"
                multiline
                rows={6}
                value={formik.values.textContent}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
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
                  onClick={() => navigate('/templates')}
                  disabled={isSubmitting}
                >
                  Annuler
                </Button>
                {isEditing && (
                  <Button
                    variant="outlined"
                    color="secondary"
                    onClick={() => navigate(`/templates/${templateId}/preview`)}
                    disabled={isSubmitting}
                  >
                    Prévisualiser
                  </Button>
                )}
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Layout>
  );
};

export default TemplateForm; 