import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Paper,
  CircularProgress,
  Alert,
  Divider,
  TextField,
  IconButton,
  Tooltip
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import RefreshIcon from '@mui/icons-material/Refresh';
import DesktopWindowsIcon from '@mui/icons-material/DesktopWindows';
import PhoneAndroidIcon from '@mui/icons-material/PhoneAndroid';
import TabletIcon from '@mui/icons-material/Tablet';
import { toast } from 'react-toastify';

import Layout from '../../components/layout/Layout';
import { useAuth } from '../../contexts/AuthContext';
import { EmailTemplate, getEmailTemplateById } from '../../models/dynamodb';
import { TemplateService } from '../../services/template-service';

const TemplatePreview: React.FC = () => {
  const { templateId } = useParams<{ templateId: string }>();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [template, setTemplate] = useState<EmailTemplate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [viewMode, setViewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  
  // Pour la démo, des exemples de variables
  const demoVariables = useMemo(() => ({
    name: 'Jean Dupont',
    email: 'jean.dupont@example.com',
    company: 'Acme Inc.',
    unsubscribe_link: 'https://example.com/unsubscribe',
    date: new Date().toLocaleDateString(),
  }), []);

  useEffect(() => {
    const fetchTemplate = async () => {
      if (!currentUser || !templateId) return;
      
      try {
        setIsLoading(true);
        const templateData = await getEmailTemplateById(templateId);
        
        if (!templateData) {
          setError('Template non trouvé');
          return;
        }
        
        // Vérifier que le template appartient à l'utilisateur
        if (templateData.userId !== currentUser.userId) {
          setError("Vous n'avez pas les droits pour voir ce template");
          return;
        }
        
        setTemplate(templateData);
        
        // Extraire les variables du template
        const extractedVars = TemplateService.extractVariables(templateData.htmlContent);
        
        // Initialiser les variables avec des valeurs de démo
        const initialVars: Record<string, string> = {};
        extractedVars.forEach(varName => {
          initialVars[varName] = demoVariables[varName as keyof typeof demoVariables] || `{{${varName}}}`;
        });
        
        setVariables(initialVars);
        
        // Générer la prévisualisation
        const { html } = TemplateService.prepareTemplate(templateData, initialVars);
        setPreviewHtml(html);
      } catch (err: any) {
        console.error('Erreur lors du chargement du template:', err);
        setError(err.message || 'Une erreur est survenue');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTemplate();
  }, [currentUser, templateId, demoVariables]);

  const handleVariableChange = (name: string, value: string) => {
    const newVariables = { ...variables, [name]: value };
    setVariables(newVariables);
    
    if (template) {
      const { html } = TemplateService.prepareTemplate(template, newVariables);
      setPreviewHtml(html);
    }
  };

  const resetVariables = () => {
    if (!template) return;
    
    const extractedVars = TemplateService.extractVariables(template.htmlContent);
    const initialVars: Record<string, string> = {};
    
    extractedVars.forEach(varName => {
      initialVars[varName] = demoVariables[varName as keyof typeof demoVariables] || `{{${varName}}}`;
    });
    
    setVariables(initialVars);
    
    const { html } = TemplateService.prepareTemplate(template, initialVars);
    setPreviewHtml(html);
    
    toast.info('Variables réinitialisées');
  };

  if (isLoading) {
    return (
      <Layout title="Prévisualisation du template">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress />
        </Box>
      </Layout>
    );
  }

  if (error || !template) {
    return (
      <Layout title="Prévisualisation du template">
        <Alert severity="error" sx={{ mb: 3 }}>
          {error || 'Template non trouvé'}
        </Alert>
        <Button 
          variant="contained" 
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/templates')}
        >
          Retour à la liste des templates
        </Button>
      </Layout>
    );
  }

  // Définir la largeur du conteneur selon le mode de visualisation
  const getPreviewWidth = () => {
    switch (viewMode) {
      case 'mobile':
        return '320px';
      case 'tablet':
        return '768px';
      case 'desktop':
      default:
        return '100%';
    }
  };

  return (
    <Layout title={`Prévisualisation: ${template.name}`}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button 
          variant="outlined" 
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/templates')}
        >
          Retour
        </Button>
        <Box>
          <Tooltip title="Vue Desktop">
            <IconButton 
              color={viewMode === 'desktop' ? 'primary' : 'default'} 
              onClick={() => setViewMode('desktop')}
            >
              <DesktopWindowsIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Vue Tablette">
            <IconButton 
              color={viewMode === 'tablet' ? 'primary' : 'default'} 
              onClick={() => setViewMode('tablet')}
            >
              <TabletIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Vue Mobile">
            <IconButton 
              color={viewMode === 'mobile' ? 'primary' : 'default'} 
              onClick={() => setViewMode('mobile')}
            >
              <PhoneAndroidIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
        <Box sx={{ width: { xs: '100%', md: '30%' } }}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Variables du template</Typography>
              <Tooltip title="Réinitialiser les variables">
                <IconButton onClick={resetVariables} size="small">
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            </Box>
            <Divider sx={{ mb: 2 }} />
            
            {Object.keys(variables).length > 0 ? (
              Object.keys(variables).map((varName) => (
                <TextField
                  key={varName}
                  label={varName}
                  value={variables[varName]}
                  onChange={(e) => handleVariableChange(varName, e.target.value)}
                  fullWidth
                  margin="normal"
                  size="small"
                />
              ))
            ) : (
              <Typography variant="body2" color="text.secondary">
                Aucune variable trouvée dans ce template.
              </Typography>
            )}
          </Paper>
          
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Informations
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Typography variant="subtitle2" color="text.secondary">
              Sujet
            </Typography>
            <Typography variant="body1" gutterBottom>
              {TemplateService.parseTemplate(template.subject, variables)}
            </Typography>
            
            <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>
              Expéditeur
            </Typography>
            <Typography variant="body1" gutterBottom>
              {template.fromName} &lt;{template.fromEmail}&gt;
            </Typography>
          </Paper>
        </Box>
        
        <Box sx={{ width: { xs: '100%', md: '70%' } }}>
          <Paper elevation={2} sx={{ p: 1, height: '100%' }}>
            <Box sx={{ 
              width: getPreviewWidth(), 
              margin: '0 auto', 
              border: '1px solid #eee',
              height: 'calc(100vh - 200px)',
              overflow: 'auto',
              transition: 'width 0.3s ease'
            }}>
              <Box sx={{ 
                p: 2, 
                backgroundColor: '#f5f5f5', 
                borderBottom: '1px solid #eee',
                position: 'sticky',
                top: 0
              }}>
                <Typography variant="caption" sx={{ display: 'block', textAlign: 'center' }}>
                  De: {template.fromName} &lt;{template.fromEmail}&gt;
                </Typography>
                <Typography variant="caption" sx={{ display: 'block', textAlign: 'center' }}>
                  Objet: {TemplateService.parseTemplate(template.subject, variables)}
                </Typography>
              </Box>
              
              <Box 
                sx={{ p: 2 }}
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            </Box>
          </Paper>
        </Box>
      </Box>
    </Layout>
  );
};

export default TemplatePreview; 