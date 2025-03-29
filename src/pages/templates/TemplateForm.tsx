import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
  updateEmailTemplate,
  getEmailTemplateById
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
  const { templateId } = useParams<{ templateId: string }>();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(!!templateId);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [templateData, setTemplateData] = useState<EmailTemplate | null>(null);

  // Valeurs initiales du formulaire
  const defaultValues = {
    name: '',
    subject: '',
    htmlContent: '',
    textContent: '',
    variables: [] as string[]
  };

  // Chargement du template si nous sommes en mode édition
  useEffect(() => {
    const fetchTemplate = async () => {
      // Si pas d'ID de template ou si nous avons déjà des valeurs initiales, ne rien faire
      if (!templateId || initialValues) {
        console.log("⚠️ TemplateForm - Pas besoin de charger les données:", {
          hasTemplateId: !!templateId,
          hasInitialValues: !!initialValues
        });
        setIsLoading(false);
        return;
      }
      
      console.log("⚠️ TemplateForm - Début du chargement du template:", templateId);
      
      try {
        console.log("⚠️ TemplateForm - Appel de getEmailTemplateById avec templateId:", templateId);
        const template = await getEmailTemplateById(templateId);
        
        if (!template) {
          console.error("⚠️ TemplateForm - Template non trouvé:", templateId);
          setError("Template non trouvé");
          setIsLoading(false);
          return;
        }
        
        // Vérifier que le template appartient à l'utilisateur courant
        if (template.userId !== currentUser?.userId) {
          console.error("⚠️ TemplateForm - Le template n'appartient pas à l'utilisateur:", {
            templateUserId: template.userId,
            currentUserId: currentUser?.userId
          });
          setError("Vous n'avez pas les droits pour modifier ce template");
          setIsLoading(false);
          return;
        }
        
        console.log("⚠️ TemplateForm - Template chargé avec succès:", template.name);
        console.log("⚠️ TemplateForm - htmlContent présent:", !!template.htmlContent);
        console.log("⚠️ TemplateForm - Taille du htmlContent:", template.htmlContent?.length || 0);
        
        // Mettre à jour l'état avec les données du template
        setTemplateData(template);
        
        // Réinitialiser le formulaire avec les nouvelles valeurs
        formik.resetForm({
          values: {
            name: template.name || '',
            subject: template.subject || '',
            htmlContent: template.htmlContent || '',
            textContent: template.textContent || '',
            variables: template.variables || []
          }
        });
      } catch (err: any) {
        console.error("⚠️ TemplateForm - Erreur lors du chargement du template:", err);
        setError(err.message || "Une erreur est survenue lors du chargement du template");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTemplate();
  }, [templateId, currentUser, initialValues]);

  // Schéma de validation
  const validationSchema = Yup.object().shape({
    name: Yup.string().required('Le nom est requis'),
    subject: Yup.string().required('Le sujet est requis'),
    htmlContent: Yup.string().required('Le contenu HTML est requis')
  });

  // Gestion du formulaire avec Formik
  const formik = useFormik({
    initialValues: templateData || defaultValues,
    validationSchema,
    enableReinitialize: true, // Important pour permettre la mise à jour des valeurs
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
        console.log('⚠️ DEBUG TemplateForm - Taille du contenu HTML:', values.htmlContent?.length || 0);
        
        // Créer une copie explicite des valeurs pour s'assurer que tout est bien transmis
        const newTemplateData: EmailTemplate = {
          name: values.name,
          subject: values.subject,
          htmlContent: values.htmlContent || '<p>Contenu par défaut</p>', // S'assurer qu'il y a toujours du contenu
          textContent: values.textContent || '',
          variables: values.variables || [],
          userId: currentUser.userId,
          templateId: templateData?.templateId || templateId || uuidv4(),
          createdAt: templateData?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        // Afficher l'objet complet pour débogage
        console.log('⚠️ DEBUG TemplateForm - templateData complet:',  JSON.stringify({
          ...newTemplateData,
          htmlContent: newTemplateData.htmlContent ? `[${newTemplateData.htmlContent.length} caractères]` : 'null'
        }));
        
        const isEdit = !!templateId || !!templateData;
        
        if (isEdit) {
          console.log("⚠️ TemplateForm - Mise à jour du template:", newTemplateData.templateId);
          await updateEmailTemplate(newTemplateData);
          toast.success('Template mis à jour avec succès');
        } else {
          console.log("⚠️ TemplateForm - Création d'un nouveau template");
          await createEmailTemplate(newTemplateData);
          toast.success('Template créé avec succès');
        }
        
        navigate('/templates');
      } catch (err: any) {
        console.error('⚠️ TemplateForm - Erreur lors de la sauvegarde du template:', err);
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
  
  // Affichage pendant le chargement des données
  if (isLoading) {
    return (
      <Layout title="Modèle d'email">
        <Box className="flex justify-center items-center h-[50vh]">
          <CircularProgress />
        </Box>
      </Layout>
    );
  }
  
  // Affichage en cas d'erreur
  if (error) {
    return (
      <Layout title="Modèle d'email">
        <Alert severity="error" className="mb-4">
          {error}
        </Alert>
        <Button 
          variant="contained" 
          color="primary"
          onClick={() => navigate('/templates')}
        >
          Retour à la liste des templates
        </Button>
      </Layout>
    );
  }

  return (
    <Layout title={templateId ? "Modifier le template" : "Nouveau template"}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1">
          {templateId ? "Modifier le template" : "Créer un nouveau template"}
        </Typography>
      </Box>
      
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
            <div className="mt-2 text-gray-500 text-sm">
              <p className="font-medium text-amber-600 mb-1">Conseil pour email HTML:</p>
              <p>Pour assurer un affichage correct dans tous les clients mail, incluez une structure HTML complète avec:</p>
              <pre className="bg-gray-100 p-2 mt-1 text-xs overflow-auto">
{`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
</head>
<body>
  <!-- Votre contenu ici -->
</body>
</html>`}
              </pre>
            </div>
          </Box>
        </Card>
        
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
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
            {templateId ? "Mettre à jour" : "Créer le template"}
          </Button>
        </Box>
      </form>
    </Layout>
  );
};

export default TemplateForm; 