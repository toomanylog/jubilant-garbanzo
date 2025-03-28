import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Divider,
  Chip,
  Alert,
  CircularProgress
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'react-toastify';

import Layout from '../../components/layout/Layout';
import { useAuth } from '../../contexts/AuthContext';
import { 
  EmailCampaign,
  SmtpProvider,
  EmailTemplate,
  createEmailCampaign,
  updateEmailCampaign,
  getEmailCampaignById,
  getSmtpProvidersByUserId,
  getEmailTemplatesByUserId
} from '../../models/dynamodb';

// Props du composant
interface CampaignFormProps {
  initialValues?: EmailCampaign;
  isEditing?: boolean;
}

const CampaignForm: React.FC<CampaignFormProps> = ({ 
  initialValues,
  isEditing = false 
}) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { campaignId } = useParams<{ campaignId: string }>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [providers, setProviders] = useState<SmtpProvider[]>([]);
  const [scheduledDate, setScheduledDate] = useState<dayjs.Dayjs | null>(
    initialValues?.scheduledAt ? dayjs(initialValues.scheduledAt) : null
  );

  // Valeurs par défaut
  const defaultValues = {
    name: '',
    templateId: '',
    providerId: '',
    subject: '',
    fromName: '',
    fromEmail: '',
    recipients: '',
    status: 'draft' as 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed'
  };

  // Schéma de validation
  const validationSchema = Yup.object().shape({
    name: Yup.string().required('Le nom est requis'),
    templateId: Yup.string().required('Un modèle est requis'),
    providerId: Yup.string().required('Un fournisseur SMTP est requis'),
    subject: Yup.string().required('L\'objet est requis'),
    fromName: Yup.string().required('Le nom d\'expéditeur est requis'),
    fromEmail: Yup.string().email('Email invalide').required('L\'email d\'expéditeur est requis'),
    recipients: Yup.string().required('Les destinataires sont requis')
  });

  // Chargement initial des données
  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) return;
      
      setIsLoading(true);
      try {
        // Récupérer les modèles d'emails
        const userTemplates = await getEmailTemplatesByUserId(currentUser.userId);
        setTemplates(userTemplates);
        
        // Récupérer les fournisseurs SMTP
        const userProviders = await getSmtpProvidersByUserId(currentUser.userId);
        setProviders(userProviders);
        
        // Si en mode édition, récupérer la campagne
        if (isEditing && campaignId && !initialValues) {
          const campaign = await getEmailCampaignById(campaignId);
          if (campaign) {
            formik.setValues({
              name: campaign.name,
              templateId: campaign.templateId,
              providerId: campaign.providerId,
              subject: campaign.subject,
              fromName: campaign.fromName,
              fromEmail: campaign.fromEmail,
              recipients: campaign.recipients.join('\n'),
              status: campaign.status
            });
            
            if (campaign.scheduledAt) {
              setScheduledDate(dayjs(campaign.scheduledAt));
            }
          } else {
            setError('Campagne non trouvée');
          }
        }
      } catch (err: any) {
        console.error('Erreur lors du chargement des données:', err);
        setError(err.message || 'Une erreur est survenue');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [currentUser, isEditing, campaignId]);

  // Mettre à jour les champs du formulaire lorsqu'un template est sélectionné
  const handleTemplateChange = (templateId: string) => {
    const selectedTemplate = templates.find(t => t.templateId === templateId);
    if (selectedTemplate) {
      formik.setFieldValue('subject', selectedTemplate.subject);
      formik.setFieldValue('fromName', selectedTemplate.fromName);
      formik.setFieldValue('fromEmail', selectedTemplate.fromEmail);
    }
  };

  // Gestion du formulaire avec Formik
  const formik = useFormik({
    initialValues: initialValues || defaultValues,
    validationSchema,
    onSubmit: async (values) => {
      if (!currentUser) return;
      
      setIsSubmitting(true);
      setError(null);
      
      try {
        // Préparer les destinataires en supprimant les lignes vides
        let recipientsArray: string[] = [];
        
        if (typeof values.recipients === 'string') {
          recipientsArray = values.recipients
            .split('\n')
            .map((email: string) => email.trim())
            .filter((email: string) => email !== '');
        } else {
          recipientsArray = values.recipients;
        }
        
        const campaignData: EmailCampaign = {
          campaignId: campaignId || uuidv4(),
          userId: currentUser.userId,
          name: values.name,
          templateId: values.templateId,
          providerId: values.providerId,
          subject: values.subject,
          fromName: values.fromName,
          fromEmail: values.fromEmail,
          recipients: recipientsArray,
          status: values.status as 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed',
          scheduledAt: scheduledDate ? scheduledDate.toISOString() : null,
          sentAt: null,
          createdAt: initialValues?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          stats: initialValues?.stats || {
            total: recipientsArray.length,
            sent: 0,
            delivered: 0,
            opened: 0,
            clicked: 0,
            bounced: 0,
            complaints: 0
          }
        };
        
        if (isEditing) {
          await updateEmailCampaign(campaignData);
          toast.success('Campagne mise à jour avec succès');
        } else {
          await createEmailCampaign(campaignData);
          toast.success('Campagne créée avec succès');
        }
        
        navigate('/campaigns');
      } catch (err: any) {
        console.error('Erreur lors de la sauvegarde de la campagne:', err);
        setError(err.message || 'Une erreur est survenue');
      } finally {
        setIsSubmitting(false);
      }
    }
  });

  // Effet pour réinitialiser le formulaire lorsque le mode change
  useEffect(() => {
    // Réinitialiser le formulaire avec les valeurs initiales
    formik.resetForm({ values: initialValues });
  }, [isEditing, formik, initialValues]);

  // Afficher un spinner pendant le chargement
  if (isLoading) {
    return (
      <Layout title={isEditing ? 'Modifier une campagne' : 'Créer une campagne'}>
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
          <CircularProgress />
        </Box>
      </Layout>
    );
  }

  return (
    <Layout title={isEditing ? 'Modifier une campagne' : 'Créer une campagne'}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1">
          {isEditing ? 'Modifier une campagne' : 'Créer une campagne'}
        </Typography>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {providers.length === 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Vous n'avez pas configuré de fournisseur SMTP. {' '}
          <Button 
            variant="text" 
            color="inherit" 
            onClick={() => navigate('/smtp-providers/new')}
            sx={{ textTransform: 'none', fontWeight: 'bold' }}
          >
            Configurer un fournisseur
          </Button>
        </Alert>
      )}
      
      {templates.length === 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Vous n'avez pas créé de modèle d'email. {' '}
          <Button 
            variant="text" 
            color="inherit" 
            onClick={() => navigate('/templates/new')}
            sx={{ textTransform: 'none', fontWeight: 'bold' }}
          >
            Créer un modèle
          </Button>
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
                label="Nom de la campagne"
                value={formik.values.name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.name && Boolean(formik.errors.name)}
                helperText={formik.touched.name && formik.errors.name}
                required
              />
            </Grid>
            
            <Grid sx={{ display: 'flex', flexDirection: 'column' }} xs={12} md={6}>
              <FormControl fullWidth error={formik.touched.templateId && Boolean(formik.errors.templateId)}>
                <InputLabel id="templateId-label">Modèle d'email</InputLabel>
                <Select
                  labelId="templateId-label"
                  id="templateId"
                  name="templateId"
                  value={formik.values.templateId}
                  onChange={(e) => {
                    formik.handleChange(e);
                    handleTemplateChange(e.target.value);
                  }}
                  onBlur={formik.handleBlur}
                  label="Modèle d'email"
                  required
                >
                  {templates.map(template => (
                    <MenuItem key={template.templateId} value={template.templateId}>
                      {template.name}
                    </MenuItem>
                  ))}
                </Select>
                {formik.touched.templateId && formik.errors.templateId && (
                  <FormHelperText>{formik.errors.templateId}</FormHelperText>
                )}
              </FormControl>
            </Grid>
            
            <Grid sx={{ display: 'flex', flexDirection: 'column' }} xs={12} md={6}>
              <FormControl fullWidth error={formik.touched.providerId && Boolean(formik.errors.providerId)}>
                <InputLabel id="providerId-label">Fournisseur SMTP</InputLabel>
                <Select
                  labelId="providerId-label"
                  id="providerId"
                  name="providerId"
                  value={formik.values.providerId}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  label="Fournisseur SMTP"
                  required
                >
                  {providers.map(provider => (
                    <MenuItem key={provider.providerId} value={provider.providerId}>
                      {provider.name} {provider.isDefault && <Chip size="small" label="Défaut" color="primary" sx={{ ml: 1 }} />}
                    </MenuItem>
                  ))}
                </Select>
                {formik.touched.providerId && formik.errors.providerId && (
                  <FormHelperText>{formik.errors.providerId}</FormHelperText>
                )}
              </FormControl>
            </Grid>
            
            <Grid sx={{ display: 'flex', flexDirection: 'column' }} xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Détails de l'email
              </Typography>
            </Grid>
            
            <Grid sx={{ display: 'flex', flexDirection: 'column' }} xs={12}>
              <TextField
                fullWidth
                id="subject"
                name="subject"
                label="Objet de l'email"
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
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DateTimePicker
                  label="Planifier l'envoi (optionnel)"
                  value={scheduledDate}
                  onChange={(newValue) => setScheduledDate(newValue)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      helperText: "Laissez vide pour enregistrer en brouillon"
                    }
                  }}
                />
              </LocalizationProvider>
            </Grid>
            
            <Grid sx={{ display: 'flex', flexDirection: 'column' }} xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Destinataires
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Entrez un email par ligne.
              </Typography>
            </Grid>
            
            <Grid sx={{ display: 'flex', flexDirection: 'column' }} xs={12}>
              <TextField
                fullWidth
                id="recipients"
                name="recipients"
                label="Liste des destinataires"
                multiline
                rows={8}
                value={formik.values.recipients}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.recipients && Boolean(formik.errors.recipients)}
                helperText={formik.touched.recipients && formik.errors.recipients}
                required
                placeholder="exemple@domaine.com"
              />
            </Grid>
            
            <Grid sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }} xs={12}>
              <Button
                variant="outlined"
                onClick={() => navigate('/campaigns')}
                disabled={isSubmitting}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={isSubmitting || providers.length === 0 || templates.length === 0}
                startIcon={isSubmitting && <CircularProgress size={20} />}
              >
                {isEditing ? 'Mettre à jour' : 'Créer'}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Layout>
  );
};

export default CampaignForm; 