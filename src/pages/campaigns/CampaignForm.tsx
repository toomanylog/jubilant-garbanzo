import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Divider,
  Chip,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  CardHeader,
  InputAdornment,
  IconButton,
  Tooltip,
  ListItemText,
  Checkbox,
  OutlinedInput
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import 'dayjs/locale/fr';
import dayjs, { Dayjs } from 'dayjs';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'react-toastify';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import ContentPasteIcon from '@mui/icons-material/ContentPaste';

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
  const [scheduledDate, setScheduledDate] = useState<Dayjs | null>(
    initialValues?.scheduledAt ? dayjs(initialValues.scheduledAt) : null
  );
  const [isScheduled, setIsScheduled] = useState(false);

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
        if (campaignId && !initialValues) {
          console.log("Chargement de la campagne avec ID:", campaignId);
          const campaign = await getEmailCampaignById(campaignId);
          
          if (campaign) {
            console.log("Campagne chargée:", campaign);
            
            // Vérifier que la campagne appartient à l'utilisateur
            if (campaign.userId !== currentUser.userId) {
              setError("Vous n'avez pas les droits pour modifier cette campagne");
              setIsLoading(false);
              return;
            }
            
            // Vérifier si la campagne est en mode brouillon
            if (campaign.status !== 'draft') {
              setError("Seules les campagnes en brouillon peuvent être modifiées");
              setIsLoading(false);
              return;
            }
            
            // Mettre à jour l'état avec les données de la campagne
            if (campaign.scheduledAt) {
              setScheduledDate(dayjs(campaign.scheduledAt));
              setIsScheduled(true);
            }
            
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
          } else {
            setError('Campagne non trouvée');
          }
        }
      } catch (err: any) {
        console.error('Erreur lors du chargement des données:', err);
        setError(err.message || 'Une erreur est survenue lors du chargement des données');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [currentUser, campaignId, initialValues]);

  // Mettre à jour les champs du formulaire lorsqu'un template est sélectionné
  const handleTemplateChange = (templateId: string) => {
    const selectedTemplate = templates.find(t => t.templateId === templateId);
    if (selectedTemplate) {
      formik.setFieldValue('subject', selectedTemplate.subject);
      formik.setFieldValue('fromName', selectedTemplate.fromName);
      formik.setFieldValue('fromEmail', selectedTemplate.fromEmail);
    }
  };

  // Gérer les changements sur le champ templateId
  const handleSelectTemplateChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    const value = event.target.value as string;
    formik.setFieldValue('templateId', value);
    handleTemplateChange(value);
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
        
        // Validation des emails des destinataires
        const invalidEmails = recipientsArray.filter(email => !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/));
        if (invalidEmails.length > 0) {
          throw new Error(`Les adresses email suivantes sont invalides: ${invalidEmails.join(', ')}`);
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
          status: isScheduled ? 'scheduled' : 'draft',
          scheduledAt: isScheduled && scheduledDate ? scheduledDate.toISOString() : null,
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
        
        console.log('Données de la campagne à enregistrer:', campaignData);
        
        if (campaignId) {
          // Mise à jour d'une campagne existante
          await updateEmailCampaign(campaignData);
          toast.success('Campagne mise à jour avec succès');
        } else {
          // Création d'une nouvelle campagne
          await createEmailCampaign(campaignData);
          toast.success('Campagne créée avec succès');
        }
        
        navigate('/campaigns');
      } catch (err: any) {
        console.error('Erreur lors de la sauvegarde de la campagne:', err);
        setError(err.message || 'Une erreur est survenue lors de la sauvegarde');
      } finally {
        setIsSubmitting(false);
      }
    }
  });

  // Fonction pour utiliser les destinataires du presse-papiers
  const handlePasteRecipients = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        // Fusionner avec les destinataires existants
        const currentRecipients = formik.values.recipients ? formik.values.recipients + '\n' : '';
        const newText = currentRecipients + text;
        formik.setFieldValue('recipients', newText);
      }
    } catch (err) {
      console.error('Erreur lors de la lecture du presse-papiers:', err);
      toast.error('Impossible de lire le presse-papiers');
    }
  };

  // Afficher un spinner pendant le chargement
  if (isLoading) {
    return (
      <Layout title={campaignId ? 'Modifier la campagne' : 'Créer une campagne'}>
        <Box className="flex justify-center items-center h-[50vh]">
          <CircularProgress />
        </Box>
      </Layout>
    );
  }

  return (
    <Layout title={campaignId ? 'Modifier la campagne' : 'Créer une campagne'}>
      <Box className="mb-6">
        <Typography variant="h4" component="h1" className="font-bold text-gray-900 dark:text-white">
          {campaignId ? 'Modifier la campagne' : 'Créer une nouvelle campagne'}
        </Typography>
        <Typography variant="body1" className="mt-2 text-gray-600 dark:text-gray-400">
          {campaignId 
            ? 'Modifiez les informations de votre campagne' 
            : 'Remplissez les informations pour créer une nouvelle campagne d\'email'}
        </Typography>
      </Box>
      
      {error && (
        <Alert severity="error" className="mb-6 rounded-lg">
          {error}
        </Alert>
      )}
      
      {providers.length === 0 && (
        <Alert severity="warning" className="mb-6 rounded-lg">
          Vous n'avez pas configuré de fournisseur SMTP. Vous devez en configurer un pour envoyer des emails.
          <Button 
            variant="text" 
            color="inherit" 
            onClick={() => navigate('/smtp-providers/new')}
            sx={{ ml: 2, textTransform: 'none', fontWeight: 'bold' }}
          >
            Configurer un fournisseur SMTP
          </Button>
        </Alert>
      )}
      
      {templates.length === 0 && (
        <Alert severity="warning" className="mb-6 rounded-lg">
          Vous n'avez pas créé de modèle d'email. Vous devez en créer un pour envoyer des campagnes.
          <Button 
            variant="text" 
            color="inherit" 
            onClick={() => navigate('/templates/new')}
            sx={{ ml: 2, textTransform: 'none', fontWeight: 'bold' }}
          >
            Créer un modèle d'email
          </Button>
        </Alert>
      )}
      
      <form onSubmit={formik.handleSubmit}>
        <Grid container spacing={3}>
          {/* Informations de base de la campagne */}
          <Grid item xs={12} md={6}>
            <Card className="border border-gray-200 dark:border-gray-700 shadow-sm rounded-xl">
              <CardHeader
                title="Informations de la campagne"
                className="border-b border-gray-200 bg-gray-50 px-6 py-3"
                titleTypographyProps={{ variant: 'subtitle1', className: 'font-semibold' }}
              />
              <CardContent className="p-6">
                <TextField
                  fullWidth
                  id="name"
                  name="name"
                  label="Nom de la campagne"
                  variant="outlined"
                  margin="normal"
                  value={formik.values.name}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.name && Boolean(formik.errors.name)}
                  helperText={formik.touched.name && formik.errors.name}
                  className="mb-4"
                  required
                />
                
                <FormControl 
                  fullWidth 
                  margin="normal" 
                  variant="outlined"
                  error={formik.touched.templateId && Boolean(formik.errors.templateId)}
                  className="mb-4"
                >
                  <InputLabel id="template-label" required>Modèle d'email</InputLabel>
                  <Select
                    labelId="template-label"
                    id="templateId"
                    name="templateId"
                    value={formik.values.templateId}
                    onChange={(e) => handleSelectTemplateChange(e as any)}
                    onBlur={formik.handleBlur}
                    label="Modèle d'email"
                  >
                    {templates.length === 0 ? (
                      <MenuItem value="" disabled>
                        Aucun modèle disponible
                      </MenuItem>
                    ) : (
                      templates.map((template) => (
                        <MenuItem key={template.templateId} value={template.templateId}>
                          {template.name}
                        </MenuItem>
                      ))
                    )}
                  </Select>
                  {formik.touched.templateId && formik.errors.templateId && (
                    <FormHelperText>{formik.errors.templateId}</FormHelperText>
                  )}
                </FormControl>
                
                <FormControl 
                  fullWidth 
                  margin="normal" 
                  variant="outlined"
                  error={formik.touched.providerId && Boolean(formik.errors.providerId)}
                  className="mb-4"
                >
                  <InputLabel id="provider-label" required>Fournisseur SMTP</InputLabel>
                  <Select
                    labelId="provider-label"
                    id="providerId"
                    name="providerId"
                    value={formik.values.providerId}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    label="Fournisseur SMTP"
                  >
                    {providers.length === 0 ? (
                      <MenuItem value="" disabled>
                        Aucun fournisseur disponible
                      </MenuItem>
                    ) : (
                      providers.map((provider) => (
                        <MenuItem key={provider.providerId} value={provider.providerId}>
                          {provider.name} ({provider.providerType})
                        </MenuItem>
                      ))
                    )}
                  </Select>
                  {formik.touched.providerId && formik.errors.providerId && (
                    <FormHelperText>{formik.errors.providerId}</FormHelperText>
                  )}
                </FormControl>
                
                <FormControl className="mb-4 mt-6" component="fieldset" variant="standard">
                  <Typography 
                    variant="subtitle2" 
                    className="mb-2 font-semibold text-gray-900 dark:text-white"
                  >
                    Planification
                  </Typography>
                  <FormHelperText className="mb-3">
                    Planifiez l'envoi de votre campagne à une date et heure spécifiques.
                  </FormHelperText>
                  
                  <Box display="flex" alignItems="center" mb={2}>
                    <Checkbox
                      checked={isScheduled}
                      onChange={(e) => setIsScheduled(e.target.checked)}
                      name="scheduled"
                      color="primary"
                    />
                    <Typography>Planifier l'envoi</Typography>
                  </Box>
                  
                  {isScheduled && (
                    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="fr">
                      <DateTimePicker
                        label="Date et heure d'envoi"
                        value={scheduledDate}
                        onChange={(newValue) => setScheduledDate(newValue)}
                        minDateTime={dayjs().add(5, 'minute')}
                        className="w-full mt-2"
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            variant: 'outlined'
                          }
                        }}
                      />
                    </LocalizationProvider>
                  )}
                </FormControl>
              </CardContent>
            </Card>
          </Grid>

          {/* Informations d'expédition */}
          <Grid item xs={12} md={6}>
            <Card className="border border-gray-200 dark:border-gray-700 shadow-sm rounded-xl">
              <CardHeader
                title="Informations d'expédition"
                className="border-b border-gray-200 bg-gray-50 px-6 py-3"
                titleTypographyProps={{ variant: 'subtitle1', className: 'font-semibold' }}
              />
              <CardContent className="p-6">
                <TextField
                  fullWidth
                  id="subject"
                  name="subject"
                  label="Objet de l'email"
                  variant="outlined"
                  margin="normal"
                  value={formik.values.subject}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.subject && Boolean(formik.errors.subject)}
                  helperText={formik.touched.subject && formik.errors.subject}
                  className="mb-4"
                  required
                />
                
                <TextField
                  fullWidth
                  id="fromName"
                  name="fromName"
                  label="Nom de l'expéditeur"
                  variant="outlined"
                  margin="normal"
                  value={formik.values.fromName}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.fromName && Boolean(formik.errors.fromName)}
                  helperText={formik.touched.fromName && formik.errors.fromName}
                  className="mb-4"
                  required
                />
                
                <TextField
                  fullWidth
                  id="fromEmail"
                  name="fromEmail"
                  label="Email de l'expéditeur"
                  variant="outlined"
                  margin="normal"
                  type="email"
                  value={formik.values.fromEmail}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.fromEmail && Boolean(formik.errors.fromEmail)}
                  helperText={formik.touched.fromEmail && formik.errors.fromEmail}
                  className="mb-4"
                  required
                />
                
                <Box className="mt-6 mb-4">
                  <Typography 
                    variant="subtitle2" 
                    className="mb-2 font-semibold text-gray-900 dark:text-white flex items-center"
                  >
                    Liste des destinataires
                    <Tooltip title="Un destinataire par ligne. Exemple: john.doe@exemple.com">
                      <IconButton size="small" className="ml-1">
                        <HelpOutlineIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Typography>
                  
                  <TextField
                    fullWidth
                    id="recipients"
                    name="recipients"
                    variant="outlined"
                    multiline
                    rows={10}
                    placeholder="Entrez un email par ligne, par exemple:
john.doe@exemple.com
jane.doe@exemple.com"
                    value={formik.values.recipients}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.recipients && Boolean(formik.errors.recipients)}
                    helperText={formik.touched.recipients && formik.errors.recipients}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <Tooltip title="Coller depuis le presse-papiers">
                            <IconButton
                              edge="end"
                              onClick={handlePasteRecipients}
                            >
                              <ContentPasteIcon />
                            </IconButton>
                          </Tooltip>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
        
        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button
            variant="outlined"
            onClick={() => navigate('/campaigns')}
            startIcon={<CancelIcon />}
            disabled={isSubmitting}
            className="px-6"
          >
            Annuler
          </Button>
          <Button
            variant="contained"
            color="primary"
            type="submit"
            startIcon={isSubmitting ? <CircularProgress size={20} /> : <SaveIcon />}
            disabled={isSubmitting || providers.length === 0 || templates.length === 0}
            className="px-6"
          >
            {isSubmitting ? 'Enregistrement...' : campaignId ? 'Mettre à jour' : 'Créer la campagne'}
          </Button>
        </Box>
      </form>
    </Layout>
  );
};

export default CampaignForm; 