import React, { useState, useEffect } from 'react';
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
  FormControlLabel,
  InputAdornment,
  IconButton,
  Card,
  CardContent,
  Divider,
  useTheme,
  useMediaQuery,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  RadioGroup,
  Radio,
  Checkbox,
  CardHeader,
  Tooltip,
  FormGroup,
  AlertTitle
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'react-toastify';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { SelectChangeEvent } from '@mui/material/Select';
import InfoIcon from '@mui/icons-material/Info';

import Layout from '../../components/layout/Layout';
import { useAuth } from '../../contexts/AuthContext';
import { 
  SmtpProvider, 
  SmtpSender,
  createSmtpProvider, 
  updateSmtpProvider
} from '../../models/dynamodb';

// Correction de l'interface SmtpProviderWithWebhooks
interface SmtpProviderWithWebhooks extends SmtpProvider {
  webhookSettings?: {
    enabled: boolean;
    bounceUrl?: string;
    deliveryUrl?: string;
    openUrl?: string;
    clickUrl?: string;
    complaintUrl?: string;
    useDefaultWebhooks?: boolean;
  };
}

// Type pour les valeurs du formulaire qui inclut webhookSettings
interface FormValues extends Omit<SmtpProviderWithWebhooks, 'port'> {
  port: string | number;
}

// Liste des régions AWS
const AWS_REGIONS = [
  // Amérique du Nord
  { value: 'us-east-1', label: 'US East (N. Virginia) - us-east-1' },
  { value: 'us-east-2', label: 'US East (Ohio) - us-east-2' },
  { value: 'us-west-1', label: 'US West (N. California) - us-west-1' },
  { value: 'us-west-2', label: 'US West (Oregon) - us-west-2' },
  // Canada
  { value: 'ca-central-1', label: 'Canada (Central) - ca-central-1' },
  // Europe
  { value: 'eu-west-1', label: 'EU (Ireland) - eu-west-1' },
  { value: 'eu-west-2', label: 'EU (London) - eu-west-2' },
  { value: 'eu-west-3', label: 'EU (Paris) - eu-west-3' },
  { value: 'eu-central-1', label: 'EU (Frankfurt) - eu-central-1' },
  { value: 'eu-north-1', label: 'EU (Stockholm) - eu-north-1' },
  { value: 'eu-south-1', label: 'EU (Milan) - eu-south-1' },
  // Asie-Pacifique
  { value: 'ap-east-1', label: 'Asia Pacific (Hong Kong) - ap-east-1' },
  { value: 'ap-south-1', label: 'Asia Pacific (Mumbai) - ap-south-1' },
  { value: 'ap-northeast-1', label: 'Asia Pacific (Tokyo) - ap-northeast-1' },
  { value: 'ap-northeast-2', label: 'Asia Pacific (Seoul) - ap-northeast-2' },
  { value: 'ap-northeast-3', label: 'Asia Pacific (Osaka) - ap-northeast-3' },
  { value: 'ap-southeast-1', label: 'Asia Pacific (Singapore) - ap-southeast-1' },
  { value: 'ap-southeast-2', label: 'Asia Pacific (Sydney) - ap-southeast-2' },
  // Amérique du Sud
  { value: 'sa-east-1', label: 'South America (São Paulo) - sa-east-1' },
  // Moyen-Orient
  { value: 'me-south-1', label: 'Middle East (Bahrain) - me-south-1' },
  // Afrique
  { value: 'af-south-1', label: 'Africa (Cape Town) - af-south-1' },
];

// Props pour le composant
interface SmtpProviderFormProps {
  initialValues?: SmtpProviderWithWebhooks;
  isEditing?: boolean;
}

// Ajouter une fonction utilitaire pour vérifier la structure de webhookSettings
const isWebhookSettings = (obj: any): obj is {
  enabled: boolean;
  bounceUrl?: string;
  deliveryUrl?: string;
  openUrl?: string;
  clickUrl?: string;
  complaintUrl?: string;
  useDefaultWebhooks?: boolean;
} => {
  return obj && typeof obj === 'object' && 'enabled' in obj;
}

const SmtpProviderForm: React.FC<SmtpProviderFormProps> = ({ 
  initialValues,
  isEditing = false
}) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Améliorer le logging initialValues
  console.log('⚠️ DEBUG SmtpProviderForm - initialValues:', initialValues);
  console.log('⚠️ DEBUG SmtpProviderForm - initialValues type:', typeof initialValues);
  console.log('⚠️ DEBUG SmtpProviderForm - initialValues keys:', initialValues ? Object.keys(initialValues) : 'null');
  
  // Ajouter un useEffect immédiat pour tester la réception des props
  useEffect(() => {
    console.log('⚠️ DEBUG SmtpProviderForm - useEffect initialValues:', initialValues);
    console.log('⚠️ DEBUG SmtpProviderForm - isEditing:', isEditing);
    
    if (initialValues) {
      console.log('⚠️ DEBUG SmtpProviderForm - initialValues présent dans useEffect:', {
        name: initialValues.name,
        providerId: initialValues.providerId,
        type: initialValues.providerType
      });
    }
  }, [initialValues, isEditing]);

  // Valeurs par défaut du formulaire avec webhookSettings
  const defaultValues: FormValues = {
    name: '',
    providerType: 'custom_smtp' as const,
    host: '',
    port: '587',
    username: '',
    password: '',
    apiKey: '',
    region: 'us-east-1',
    isDefault: false,
    requiresTls: true,
    sendingRatePerSecond: 0,
    sendingRatePerMinute: 0,
    sendingRatePerHour: 0,
    sendingRatePerDay: 0,
    dailyQuota: 0,
    priority: 1,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    webhookSettings: {
      enabled: false,
      useDefaultWebhooks: true,
      bounceUrl: '',
      deliveryUrl: '',
      openUrl: '',
      clickUrl: '',
      complaintUrl: ''
    },
    providerId: '',
    userId: ''
  };

  // Schéma de validation mis à jour
  const validationSchema = Yup.object().shape({
    name: Yup.string().required('Le nom est requis'),
    providerType: Yup.string().required('Le type de provider est requis'),
    host: Yup.string().when('providerType', (providerType: any, schema: any) => {
      return providerType === 'custom_smtp' ? schema.required('L\'hôte SMTP est requis') : schema;
    }),
    port: Yup.number().when('providerType', (providerType: any, schema: any) => {
      return providerType === 'custom_smtp' ? schema.required('Le port est requis') : schema;
    }),
    username: Yup.string().when('providerType', (providerType: any, schema: any) => {
      return ['custom_smtp', 'office365'].includes(providerType) 
        ? schema.required('Le nom d\'utilisateur est requis') 
        : schema;
    }),
    password: Yup.string().when('providerType', (providerType: any, schema: any) => {
      return ['custom_smtp', 'office365'].includes(providerType) 
        ? schema.required('Le mot de passe est requis') 
        : schema;
    }),
    apiKey: Yup.string().when('providerType', (providerType: any, schema: any) => {
      return ['sendgrid', 'mailjet'].includes(providerType) 
        ? schema.required('La clé API est requise') 
        : schema;
    }),
    region: Yup.string().when('providerType', (providerType: any, schema: any) => {
      return providerType === 'aws_ses' ? schema.required('La région AWS est requise') : schema;
    }),
    sendingRatePerSecond: Yup.number().min(0, 'Le taux d\'envoi ne peut pas être négatif'),
    sendingRatePerMinute: Yup.number().min(0, 'Le taux d\'envoi ne peut pas être négatif'),
    sendingRatePerHour: Yup.number().min(0, 'Le taux d\'envoi ne peut pas être négatif'),
    sendingRatePerDay: Yup.number().min(0, 'Le taux d\'envoi ne peut pas être négatif'),
    dailyQuota: Yup.number().min(0, 'Le quota ne peut pas être négatif'),
    priority: Yup.number().min(0, 'La priorité ne peut pas être négative'),
    
    // Validation pour webhookSettings
    webhookSettings: Yup.object().shape({
      enabled: Yup.boolean(),
      useDefaultWebhooks: Yup.boolean(),
      bounceUrl: Yup.string().test(
        'url-check',
        'URL invalide',
        function(value) {
          const { enabled, useDefaultWebhooks } = this.parent;
          if (!enabled || useDefaultWebhooks || !value) return true;
          try {
            new URL(value);
            return true;
          } catch (e) {
            return false;
          }
        }
      ),
      deliveryUrl: Yup.string().test(
        'url-check',
        'URL invalide',
        function(value) {
          const { enabled, useDefaultWebhooks } = this.parent;
          if (!enabled || useDefaultWebhooks || !value) return true;
          try {
            new URL(value);
            return true;
          } catch (e) {
            return false;
          }
        }
      ),
      openUrl: Yup.string().test(
        'url-check',
        'URL invalide',
        function(value) {
          const { enabled, useDefaultWebhooks } = this.parent;
          if (!enabled || useDefaultWebhooks || !value) return true;
          try {
            new URL(value);
            return true;
          } catch (e) {
            return false;
          }
        }
      ),
      clickUrl: Yup.string().test(
        'url-check',
        'URL invalide',
        function(value) {
          const { enabled, useDefaultWebhooks } = this.parent;
          if (!enabled || useDefaultWebhooks || !value) return true;
          try {
            new URL(value);
            return true;
          } catch (e) {
            return false;
          }
        }
      ),
      complaintUrl: Yup.string().test(
        'url-check',
        'URL invalide',
        function(value) {
          const { enabled, useDefaultWebhooks } = this.parent;
          if (!enabled || useDefaultWebhooks || !value) return true;
          try {
            new URL(value);
            return true;
          } catch (e) {
            return false;
          }
        }
      ),
    }).nullable()
  });
  
  // Gestion du formulaire avec Formik
  const [formInitialized, setFormInitialized] = useState(false);
  
  // Utiliser useEffect pour initialiser Formik une seule fois au début, puis reconfigurer lorsque initialValues change
  useEffect(() => {
    console.log("⚠️ IMPORTANT - SmtpProviderForm - useEffect pour initialiser formik avec:", initialValues);
    if (initialValues && !formInitialized) {
      console.log("⚠️ IMPORTANT - SmtpProviderForm - Initialisation initiale du formulaire");
      // Marquer le formulaire comme initialisé
      setFormInitialized(true);
    }
  }, [initialValues, formInitialized]);

  // Utiliser FormValues pour le type du formulaire
  const formik = useFormik<FormValues>({
    initialValues: initialValues ? {
      ...initialValues,
      port: initialValues.port || 587,
      sendingRatePerSecond: initialValues.sendingRatePerSecond || 0,
      sendingRatePerMinute: initialValues.sendingRatePerMinute || 0,
      sendingRatePerHour: initialValues.sendingRatePerHour || 0,
      sendingRatePerDay: initialValues.sendingRatePerDay || 0,
      dailyQuota: initialValues.dailyQuota || 0,
      priority: initialValues.priority || 1,
      isActive: initialValues.isActive !== false,
      webhookSettings: initialValues.webhookSettings || {
        enabled: false,
        useDefaultWebhooks: true,
        bounceUrl: '',
        deliveryUrl: '',
        openUrl: '',
        clickUrl: '',
        complaintUrl: ''
      }
    } : defaultValues,
    enableReinitialize: true,
    validationSchema,
    onSubmit: async (values) => {
      if (!currentUser) return;
      
      setIsSubmitting(true);
      setError(null);
      
      try {
        // Copie des valeurs sans les propriétés à transformer
        const { port, ...otherValues } = values;
        
        const providerData: SmtpProviderWithWebhooks = {
          ...otherValues,
          userId: currentUser.userId,
          providerId: initialValues?.providerId || uuidv4(),
          createdAt: initialValues?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          providerType: values.providerType as 'aws_ses' | 'custom_smtp' | 'office365' | 'sendgrid' | 'mailjet',
          port: port ? parseInt(port as string) : undefined,
          sendingRatePerSecond: values.sendingRatePerSecond || 0,
          sendingRatePerMinute: values.sendingRatePerMinute || 0,
          sendingRatePerHour: values.sendingRatePerHour || 0,
          sendingRatePerDay: values.sendingRatePerDay || 0,
          dailyQuota: values.dailyQuota || 0,
          priority: values.priority || 1,
          isActive: values.isActive || true,
          requiresTls: values.requiresTls || false,
          isDefault: values.isDefault || false,
          webhookSettings: values.webhookSettings,
          region: values.region as 'us-east-1' | 'us-east-2' | 'us-west-1' | 'us-west-2' | 'ca-central-1' | 'eu-west-1' | 'eu-west-2' | 'eu-west-3' | 'eu-central-1' | 'eu-north-1' | 'eu-south-1' | 'ap-east-1' | 'ap-south-1' | 'ap-northeast-1' | 'ap-northeast-2' | 'ap-northeast-3' | 'ap-southeast-1' | 'ap-southeast-2' | 'sa-east-1' | 'me-south-1' | 'af-south-1'
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

  // Placer useEffect après la création de formik pour être sûr qu'il est défini
  useEffect(() => {
    if (initialValues && formInitialized) {
      console.log("⚠️ IMPORTANT - SmtpProviderForm - Données à charger dans le formulaire:", {
        name: initialValues.name,
        type: initialValues.providerType,
        host: initialValues.host
      });
      
      // Réinitialiser explicitement le formulaire avec les valeurs initiales
      formik.resetForm({
        values: {
          ...initialValues,
          port: initialValues.port || 587,
          sendingRatePerSecond: initialValues.sendingRatePerSecond || 0,
          sendingRatePerMinute: initialValues.sendingRatePerMinute || 0,
          sendingRatePerHour: initialValues.sendingRatePerHour || 0,
          sendingRatePerDay: initialValues.sendingRatePerDay || 0,
          dailyQuota: initialValues.dailyQuota || 0,
          priority: initialValues.priority || 1,
          isActive: initialValues.isActive !== false,
          webhookSettings: initialValues.webhookSettings || {
            enabled: false,
            useDefaultWebhooks: true,
            bounceUrl: '',
            deliveryUrl: '',
            openUrl: '',
            clickUrl: '',
            complaintUrl: ''
          }
        }
      });
      
      console.log("⚠️ IMPORTANT - SmtpProviderForm - Formulaire réinitialisé avec valeurs:", formik.values);
    }
  }, [initialValues, formInitialized, formik]);

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

  // Gestionnaire pour l'affichage du mot de passe
  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleMouseDownPassword = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
  };
  
  // Met à jour le nom d'hôte AWS SES en fonction de la région sélectionnée
  const handleRegionChange = (event: SelectChangeEvent<string>) => {
    const region = event.target.value;
    formik.setFieldValue('region', region);
    
    if (formik.values.providerType === 'aws_ses') {
      formik.setFieldValue('host', `email-smtp.${region}.amazonaws.com`);
    }
  };

  return (
    <Layout title={isEditing ? "Modifier un fournisseur SMTP" : "Ajouter un fournisseur SMTP"}>
      <Box className="animate-fade-in" sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" className="font-bold text-primary-700 mb-2">
          {isEditing ? "Modifier un fournisseur SMTP" : "Ajouter un fournisseur SMTP"}
        </Typography>
        <Typography variant="body1" color="text.secondary" className="mb-6">
          {isEditing 
            ? "Modifiez les informations de connexion de votre fournisseur SMTP." 
            : "Configurez un nouveau fournisseur SMTP pour envoyer vos emails."}
        </Typography>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} className="rounded-md">
          {error}
        </Alert>
      )}
      
      <Card elevation={2} className="overflow-hidden rounded-lg border border-gray-100">
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ p: 3, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="h6" className="font-medium">
              Informations du fournisseur
            </Typography>
          </Box>
          
          <form onSubmit={formik.handleSubmit}>
            <Box sx={{ p: 3 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
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
                    variant="outlined"
                    className="rounded-md"
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControl 
                    fullWidth 
                    error={formik.touched.providerType && Boolean(formik.errors.providerType)}
                    variant="outlined"
                    className="rounded-md"
                  >
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
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      id="host"
                      name="host"
                      label="Nom d'hôte"
                      value={formik.values.host}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={formik.touched.host && Boolean(formik.errors.host)}
                      helperText={
                        (formik.touched.host && formik.errors.host) ||
                        (formik.values.providerType === 'aws_ses' ? 
                          "Sera automatiquement mis à jour selon la région" : "")
                      }
                      required={isFieldRequired('host')}
                      variant="outlined"
                      className="rounded-md"
                      disabled={formik.values.providerType === 'aws_ses'}
                    />
                  </Grid>
                )}
                
                {isFieldRequired('port') && (
                  <Grid item xs={12} md={6}>
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
                      variant="outlined"
                      className="rounded-md"
                    />
                  </Grid>
                )}
                
                {isFieldRequired('username') && (
                  <Grid item xs={12} md={6}>
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
                      variant="outlined"
                      className="rounded-md"
                    />
                  </Grid>
                )}
                
                {isFieldRequired('password') && (
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      id="password"
                      name="password"
                      label={formik.values.providerType === 'aws_ses' ? "Secret Key" : "Mot de passe"}
                      type={showPassword ? 'text' : 'password'}
                      value={formik.values.password}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={formik.touched.password && Boolean(formik.errors.password)}
                      helperText={
                        (formik.touched.password && formik.errors.password) || 
                        (isEditing ? "Laissez vide pour conserver le mot de passe actuel" : "")
                      }
                      required={isFieldRequired('password')}
                      variant="outlined"
                      className="rounded-md"
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              aria-label="toggle password visibility"
                              onClick={handleClickShowPassword}
                              onMouseDown={handleMouseDownPassword}
                              edge="end"
                              size="large"
                            >
                              {showPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                )}
                
                {isFieldRequired('apiKey') && (
                  <Grid item xs={12} md={6}>
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
                      variant="outlined"
                      className="rounded-md"
                    />
                  </Grid>
                )}
                
                {isFieldRequired('region') && (
                  <Grid item xs={12} md={6}>
                    <FormControl
                      fullWidth
                      error={formik.touched.region && Boolean(formik.errors.region)}
                      variant="outlined"
                      required
                    >
                      <InputLabel id="region-label">Région AWS</InputLabel>
                      <Select
                        labelId="region-label"
                        id="region"
                        name="region"
                        value={formik.values.region}
                        onChange={handleRegionChange}
                        label="Région AWS"
                      >
                        {AWS_REGIONS.map((region) => (
                          <MenuItem key={region.value} value={region.value}>
                            {region.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                )}
                
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" className="font-medium mb-2 text-gray-700">
                    Options
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formik.values.requiresTls}
                        onChange={formik.handleChange}
                        name="requiresTls"
                        color="primary"
                      />
                    }
                    label="Utiliser TLS"
                    className="mb-2"
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formik.values.isDefault}
                        onChange={formik.handleChange}
                        name="isDefault"
                        color="primary"
                      />
                    }
                    label="Définir comme fournisseur par défaut"
                  />
                </Grid>
                
                <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>
                  Paramètres de quotas et limites d'envoi
                </Typography>

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      id="sendingRatePerSecond"
                      name="sendingRatePerSecond"
                      label="Taux d'envoi par seconde"
                      type="number"
                      variant="outlined"
                      value={formik.values.sendingRatePerSecond || ''}
                      onChange={formik.handleChange}
                      InputProps={{ inputProps: { min: 0 } }}
                      helperText="Limite le nombre d'emails envoyés par seconde"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      id="sendingRatePerMinute"
                      name="sendingRatePerMinute"
                      label="Taux d'envoi par minute"
                      type="number"
                      variant="outlined"
                      value={formik.values.sendingRatePerMinute || ''}
                      onChange={formik.handleChange}
                      InputProps={{ inputProps: { min: 0 } }}
                      helperText="Limite le nombre d'emails envoyés par minute"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      id="sendingRatePerHour"
                      name="sendingRatePerHour"
                      label="Taux d'envoi par heure"
                      type="number"
                      variant="outlined"
                      value={formik.values.sendingRatePerHour || ''}
                      onChange={formik.handleChange}
                      InputProps={{ inputProps: { min: 0 } }}
                      helperText="Limite le nombre d'emails envoyés par heure"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      id="sendingRatePerDay"
                      name="sendingRatePerDay"
                      label="Taux d'envoi par jour"
                      type="number"
                      variant="outlined"
                      value={formik.values.sendingRatePerDay || ''}
                      onChange={formik.handleChange}
                      InputProps={{ inputProps: { min: 0 } }}
                      helperText="Limite le nombre d'emails envoyés par jour"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      id="dailyQuota"
                      name="dailyQuota"
                      label="Quota journalier"
                      type="number"
                      variant="outlined"
                      value={formik.values.dailyQuota || ''}
                      onChange={formik.handleChange}
                      InputProps={{ inputProps: { min: 0 } }}
                      helperText="Nombre maximum d'emails pouvant être envoyés par jour"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      id="priority"
                      name="priority"
                      label="Priorité"
                      type="number"
                      variant="outlined"
                      value={formik.values.priority || ''}
                      onChange={formik.handleChange}
                      InputProps={{ inputProps: { min: 0 } }}
                      helperText="Priorité du fournisseur (plus petit = plus prioritaire)"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={Boolean(formik.values.isActive)}
                          onChange={formik.handleChange}
                          name="isActive"
                        />
                      }
                      label="Fournisseur actif"
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                      Désactivez ce paramètre pour suspendre temporairement ce fournisseur sans le supprimer
                    </Typography>
                  </Grid>
                </Grid>
                
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 2 }}>
                    <Button
                      variant="outlined"
                      onClick={() => navigate('/smtp-providers')}
                      disabled={isSubmitting}
                      startIcon={<CancelIcon />}
                    >
                      Annuler
                    </Button>
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      disabled={isSubmitting}
                      startIcon={isSubmitting ? <CircularProgress size={24} /> : <SaveIcon />}
                    >
                      {isSubmitting ? 'Enregistrement...' : isEditing ? 'Mettre à jour' : 'Enregistrer'}
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </form>
        </CardContent>
      </Card>

      {/* Ajouter une nouvelle section pour les webhooks personnalisés */}
      <Card elevation={1} sx={{ mb: 3 }} className="rounded-lg border border-gray-100">
        <CardHeader 
          title="Paramètres des Webhooks" 
          className="border-b border-gray-100 bg-gray-50 px-4 py-3"
          titleTypographyProps={{ variant: 'subtitle1', className: 'font-medium' }}
          action={
            <Tooltip title="Configurer les webhooks pour les notifications d'emails">
              <IconButton aria-label="info">
                <InfoIcon />
              </IconButton>
            </Tooltip>
          }
        />
        <CardContent>
          <FormGroup>
            <FormControlLabel
              control={
                <Switch
                  checked={formik.values.webhookSettings?.enabled || false}
                  onChange={(e) => {
                    formik.setFieldValue('webhookSettings.enabled', e.target.checked);
                    // Si c'est activé et que les webhooks n'existent pas encore, créer l'objet
                    if (e.target.checked && !formik.values.webhookSettings) {
                      formik.setFieldValue('webhookSettings', {
                        enabled: true,
                        useDefaultWebhooks: true,
                        bounceUrl: '',
                        deliveryUrl: '',
                        openUrl: '',
                        clickUrl: '',
                        complaintUrl: ''
                      });
                    }
                  }}
                  name="webhookSettings.enabled"
                />
              }
              label="Activer les notifications webhooks"
            />
          </FormGroup>

          {formik.values.webhookSettings?.enabled && (
            <>
              <FormGroup sx={{ mt: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formik.values.webhookSettings?.useDefaultWebhooks || false}
                      onChange={(e) => formik.setFieldValue('webhookSettings.useDefaultWebhooks', e.target.checked)}
                      name="webhookSettings.useDefaultWebhooks"
                    />
                  }
                  label="Utiliser les webhooks par défaut du système"
                />
                <FormHelperText>
                  Activez cette option pour utiliser les endpoints par défaut fournis par North Eyes. 
                  Désactivez-la pour configurer vos propres URLs d'endpoint.
                </FormHelperText>
              </FormGroup>

              {!formik.values.webhookSettings?.useDefaultWebhooks && isWebhookSettings(formik.values.webhookSettings) && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    URLs des Webhooks Personnalisés
                  </Typography>
                  <TextField
                    fullWidth
                    id="bounceUrl"
                    name="webhookSettings.bounceUrl"
                    label="URL de notification de rebond (bounce)"
                    variant="outlined"
                    margin="normal"
                    value={formik.values.webhookSettings.bounceUrl || ''}
                    onChange={formik.handleChange}
                    error={Boolean(isWebhookSettings(formik.touched.webhookSettings) && 
                           formik.touched.webhookSettings.bounceUrl && 
                           isWebhookSettings(formik.errors.webhookSettings) && 
                           formik.errors.webhookSettings.bounceUrl)}
                    helperText={
                      (isWebhookSettings(formik.touched.webhookSettings) && 
                       formik.touched.webhookSettings.bounceUrl && 
                       isWebhookSettings(formik.errors.webhookSettings) && 
                       formik.errors.webhookSettings.bounceUrl) || 
                      "URL qui sera appelée lorsqu'un email rebondit"
                    }
                  />
                  <TextField
                    fullWidth
                    id="deliveryUrl"
                    name="webhookSettings.deliveryUrl"
                    label="URL de confirmation de livraison"
                    variant="outlined"
                    margin="normal"
                    value={formik.values.webhookSettings.deliveryUrl || ''}
                    onChange={formik.handleChange}
                    error={Boolean(isWebhookSettings(formik.touched.webhookSettings) && 
                           formik.touched.webhookSettings.deliveryUrl && 
                           isWebhookSettings(formik.errors.webhookSettings) && 
                           formik.errors.webhookSettings.deliveryUrl)}
                    helperText={
                      (isWebhookSettings(formik.touched.webhookSettings) && 
                       formik.touched.webhookSettings.deliveryUrl && 
                       isWebhookSettings(formik.errors.webhookSettings) && 
                       formik.errors.webhookSettings.deliveryUrl) || 
                      "URL qui sera appelée lorsqu'un email est livré"
                    }
                  />
                  <TextField
                    fullWidth
                    id="openUrl"
                    name="webhookSettings.openUrl"
                    label="URL de notification d'ouverture"
                    variant="outlined"
                    margin="normal"
                    value={formik.values.webhookSettings.openUrl || ''}
                    onChange={formik.handleChange}
                    error={Boolean(isWebhookSettings(formik.touched.webhookSettings) && 
                           formik.touched.webhookSettings.openUrl && 
                           isWebhookSettings(formik.errors.webhookSettings) && 
                           formik.errors.webhookSettings.openUrl)}
                    helperText={
                      (isWebhookSettings(formik.touched.webhookSettings) && 
                       formik.touched.webhookSettings.openUrl && 
                       isWebhookSettings(formik.errors.webhookSettings) && 
                       formik.errors.webhookSettings.openUrl) || 
                      "URL qui sera appelée lorsqu'un email est ouvert"
                    }
                  />
                  <TextField
                    fullWidth
                    id="clickUrl"
                    name="webhookSettings.clickUrl"
                    label="URL de notification de clic"
                    variant="outlined"
                    margin="normal"
                    value={formik.values.webhookSettings.clickUrl || ''}
                    onChange={formik.handleChange}
                    error={Boolean(isWebhookSettings(formik.touched.webhookSettings) && 
                           formik.touched.webhookSettings.clickUrl && 
                           isWebhookSettings(formik.errors.webhookSettings) && 
                           formik.errors.webhookSettings.clickUrl)}
                    helperText={
                      (isWebhookSettings(formik.touched.webhookSettings) && 
                       formik.touched.webhookSettings.clickUrl && 
                       isWebhookSettings(formik.errors.webhookSettings) && 
                       formik.errors.webhookSettings.clickUrl) || 
                      "URL qui sera appelée lorsqu'un lien est cliqué"
                    }
                  />
                  <TextField
                    fullWidth
                    id="complaintUrl"
                    name="webhookSettings.complaintUrl"
                    label="URL de notification de plainte"
                    variant="outlined"
                    margin="normal"
                    value={formik.values.webhookSettings.complaintUrl || ''}
                    onChange={formik.handleChange}
                    error={Boolean(isWebhookSettings(formik.touched.webhookSettings) && 
                           formik.touched.webhookSettings.complaintUrl && 
                           isWebhookSettings(formik.errors.webhookSettings) && 
                           formik.errors.webhookSettings.complaintUrl)}
                    helperText={
                      (isWebhookSettings(formik.touched.webhookSettings) && 
                       formik.touched.webhookSettings.complaintUrl && 
                       isWebhookSettings(formik.errors.webhookSettings) && 
                       formik.errors.webhookSettings.complaintUrl) || 
                      "URL qui sera appelée lorsqu'un email est marqué comme spam"
                    }
                  />
                </Box>
              )}
            </>
          )}

          <Alert severity="info" sx={{ mt: 2 }}>
            <AlertTitle>Configuration des webhooks sur votre fournisseur SMTP</AlertTitle>
            Pour que les notifications fonctionnent correctement, vous devez également configurer ces URLs dans 
            votre compte fournisseur SMTP (AWS SES, Sendgrid, Mailjet, etc.). Consultez la documentation de votre 
            fournisseur pour plus d'informations.
          </Alert>
        </CardContent>
      </Card>
    </Layout>
  );
};

export default SmtpProviderForm; 