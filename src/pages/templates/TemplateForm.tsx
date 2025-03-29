import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Divider,
  CardContent,
  Card,
  CardHeader,
  useTheme,
  useMediaQuery,
  Tab,
  Tabs
} from '@mui/material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'react-toastify';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import CodeIcon from '@mui/icons-material/Code';
import VisibilityIcon from '@mui/icons-material/Visibility';

import Layout from '../../components/layout/Layout';
import { useAuth } from '../../contexts/AuthContext';
import { 
  EmailTemplate, 
  createEmailTemplate, 
  updateEmailTemplate
} from '../../models/dynamodb';

// Props pour le composant
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);

  // Pour debugger les valeurs initiales
  console.log('⚠️ DEBUG TemplateForm - initialValues:', initialValues);

  // Valeurs par défaut du formulaire
  const defaultValues = {
    name: '',
    subject: '',
    fromName: '',
    fromEmail: '',
    htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email Template</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #ffffff;
    }
    .header {
      text-align: center;
      padding: 20px 0;
      border-bottom: 1px solid #eee;
    }
    .content {
      padding: 20px 0;
    }
    .footer {
      text-align: center;
      padding: 20px 0;
      font-size: 12px;
      color: #999;
      border-top: 1px solid #eee;
    }
    .button {
      display: inline-block;
      padding: 10px 20px;
      background-color: #0066cc;
      color: #ffffff;
      text-decoration: none;
      border-radius: 5px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>North Eyes</h1>
    </div>
    <div class="content">
      <h2>Bonjour {{name}},</h2>
      <p>Voici votre email personnalisé.</p>
      <p>Sentez-vous libre de modifier ce modèle selon vos besoins.</p>
      <p><a href="#" class="button">Appel à l'action</a></p>
    </div>
    <div class="footer">
      <p>© 2023 North Eyes. Tous droits réservés.</p>
      <p><a href="{{unsubscribe_link}}">Se désabonner</a></p>
    </div>
  </div>
</body>
</html>`,
    textContent: ''
  };

  // Schéma de validation
  const validationSchema = Yup.object().shape({
    name: Yup.string().required('Le nom est requis'),
    subject: Yup.string().required('Le sujet est requis'),
    fromName: Yup.string().required('Le nom de l\'expéditeur est requis'),
    fromEmail: Yup.string().email('Email invalide').required('L\'email de l\'expéditeur est requis'),
    htmlContent: Yup.string().required('Le contenu HTML est requis')
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
        // Vérifier que le contenu HTML est valide
        if (!values.htmlContent || values.htmlContent.trim() === '') {
          throw new Error('Le contenu HTML ne peut pas être vide');
        }
        
        // S'assurer que le contenu HTML est correctement formaté
        console.log('⚠️ DEBUG TemplateForm - Contenu HTML envoyé:', values.htmlContent?.substring(0, 100) + '...');
        
        const templateData: EmailTemplate = {
          ...values,
          userId: currentUser.userId,
          templateId: initialValues?.templateId || uuidv4(),
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

  const handlePreview = () => {
    // Stocker les valeurs actuelles temporairement pour la prévisualisation
    localStorage.setItem('temp_template_preview', JSON.stringify(formik.values));
    window.open(`/templates/preview-temp`, '_blank');
  };

  const handleChangeTab = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <Layout title={isEditing ? "Modifier un template" : "Créer un template"}>
      <Box className="animate-fade-in" sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" className="font-bold text-primary-700 mb-2">
          {isEditing ? "Modifier un template" : "Créer un template"}
        </Typography>
        <Typography variant="body1" color="text.secondary" className="mb-6">
          {isEditing 
            ? "Modifiez votre template d'email avec l'éditeur HTML intégré." 
            : "Créez un nouveau template d'email pour vos campagnes."}
        </Typography>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} className="rounded-md">
          {error}
        </Alert>
      )}
      
      <form onSubmit={formik.handleSubmit}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 3, mb: 3 }}>
          <Card elevation={1} sx={{ flex: 1 }} className="rounded-lg border border-gray-100">
            <CardHeader 
              title="Informations générales" 
              className="border-b border-gray-100 bg-gray-50 px-4 py-3"
              titleTypographyProps={{ variant: 'subtitle1', className: 'font-medium' }}
            />
            <CardContent>
              <Box sx={{ mb: 3 }}>
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
                  variant="outlined"
                  className="rounded-md mb-4"
                />
                
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
                  variant="outlined"
                  className="rounded-md mb-4"
                />
                
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
                  variant="outlined"
                  className="rounded-md mb-4"
                />
                
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
                  variant="outlined"
                  className="rounded-md"
                />
              </Box>
            </CardContent>
          </Card>
        </Box>
        
        <Card elevation={1} className="rounded-lg border border-gray-100 mb-4">
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs 
              value={activeTab} 
              onChange={handleChangeTab} 
              aria-label="editeur de template"
              variant={isMobile ? "fullWidth" : "standard"}
              className="px-2"
            >
              <Tab 
                label="Éditeur HTML" 
                icon={<CodeIcon />} 
                iconPosition="start"
              />
              <Tab 
                label="Aperçu" 
                icon={<VisibilityIcon />} 
                iconPosition="start"
                onClick={handlePreview}
              />
            </Tabs>
          </Box>
          
          <Box sx={{ p: 3, minHeight: '400px' }} hidden={activeTab !== 0}>
            <TextField
              fullWidth
              id="htmlContent"
              name="htmlContent"
              label="Code HTML du template"
              multiline
              rows={20}
              value={formik.values.htmlContent}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.htmlContent && Boolean(formik.errors.htmlContent)}
              helperText={formik.touched.htmlContent && formik.errors.htmlContent}
              variant="outlined"
              className="rounded-md mb-4 font-mono"
              placeholder="Entrez votre code HTML ici..."
            />
          </Box>
        </Card>
        
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 4 }}>
          <Button
            variant="outlined"
            color="primary"
            onClick={() => navigate('/templates')}
            disabled={isSubmitting}
            startIcon={<CancelIcon />}
            size="large"
            className="rounded-md"
          >
            Annuler
          </Button>
          <Button
            variant="contained"
            color="primary"
            type="submit"
            disabled={isSubmitting}
            startIcon={isSubmitting ? <CircularProgress size={20} /> : <SaveIcon />}
            size="large"
            className="rounded-md shadow-md"
          >
            {isEditing ? "Mettre à jour" : "Créer le template"}
          </Button>
        </Box>
      </form>
    </Layout>
  );
};

export default TemplateForm; 