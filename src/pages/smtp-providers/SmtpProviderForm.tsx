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
  Radio
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

import Layout from '../../components/layout/Layout';
import { useAuth } from '../../contexts/AuthContext';
import { 
  SmtpProvider, 
  SmtpSender,
  createSmtpProvider, 
  updateSmtpProvider
} from '../../models/dynamodb';

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
  const [showPassword, setShowPassword] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // États pour la gestion des expéditeurs
  const [openSenderDialog, setOpenSenderDialog] = useState(false);
  const [currentSender, setCurrentSender] = useState<SmtpSender | null>(null);
  const [isEditingSender, setIsEditingSender] = useState(false);

  // Pour debugger les valeurs initiales
  console.log('⚠️ DEBUG SmtpProviderForm - initialValues:', initialValues);

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
    requiresTls: true,
    senders: [] as SmtpSender[],
    senderRotationEnabled: false,
    senderRotationType: 'sequential' as 'sequential' | 'random'
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
  
  // État initial pour le formulaire d'expéditeur
  const emptySender: SmtpSender = {
    email: '',
    name: '',
    isActive: true
  };

  // Gestion des expéditeurs
  const [senderFormData, setSenderFormData] = useState<SmtpSender>(emptySender);
  
  // Schéma de validation pour les expéditeurs
  const senderValidationSchema = Yup.object().shape({
    email: Yup.string().email('Email invalide').required('L\'email est requis'),
    name: Yup.string().required('Le nom est requis')
  });

  // Gestion du formulaire avec Formik
  const formik = useFormik({
    initialValues: initialValues ? {
      ...initialValues,
      port: initialValues.port?.toString() || defaultValues.port,
      senders: initialValues.senders || [],
      senderRotationEnabled: initialValues.senderRotationEnabled || false,
      senderRotationType: initialValues.senderRotationType || 'sequential'
    } : defaultValues,
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
          port: port ? parseInt(port as string) : undefined,
          senders: values.senders || [],
          senderRotationEnabled: values.senderRotationEnabled || false,
          senderRotationType: values.senderRotationType || 'sequential'
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

  // Gestionnaire pour l'affichage du mot de passe
  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleMouseDownPassword = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
  };
  
  // Gestionnaires pour les dialogues d'expéditeur
  const handleAddSender = () => {
    setSenderFormData(emptySender);
    setIsEditingSender(false);
    setOpenSenderDialog(true);
  };
  
  const handleEditSender = (sender: SmtpSender, index: number) => {
    setSenderFormData(sender);
    setCurrentSender(sender);
    setIsEditingSender(true);
    setOpenSenderDialog(true);
  };
  
  const handleDeleteSender = (index: number) => {
    const newSenders = [...formik.values.senders || []];
    newSenders.splice(index, 1);
    formik.setFieldValue('senders', newSenders);
  };
  
  const handleCloseSenderDialog = () => {
    setOpenSenderDialog(false);
    setSenderFormData(emptySender);
    setCurrentSender(null);
  };
  
  const handleSaveSender = () => {
    try {
      // Validation
      senderValidationSchema.validateSync(senderFormData);
      
      // Update senders array
      let newSenders = [...formik.values.senders || []];
      
      if (isEditingSender && currentSender) {
        // Edit existing sender
        const index = newSenders.findIndex(s => 
          s.email === currentSender.email && s.name === currentSender.name);
        if (index !== -1) {
          newSenders[index] = senderFormData;
        }
      } else {
        // Add new sender
        newSenders.push(senderFormData);
      }
      
      formik.setFieldValue('senders', newSenders);
      handleCloseSenderDialog();
    } catch (err: any) {
      toast.error(err.message || 'Données d\'expéditeur invalides');
    }
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
                
                {/* Section pour les expéditeurs */}
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="subtitle2" className="font-medium text-gray-700">
                      Expéditeurs
                    </Typography>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<AddIcon />}
                      onClick={handleAddSender}
                    >
                      Ajouter un expéditeur
                    </Button>
                  </Box>
                  
                  {(!formik.values.senders || formik.values.senders.length === 0) ? (
                    <Alert severity="info" sx={{ mb: 2 }}>
                      Aucun expéditeur configuré. Ajoutez des expéditeurs pour pouvoir envoyer des emails.
                    </Alert>
                  ) : (
                    <List sx={{ mb: 2, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                      {formik.values.senders.map((sender, index) => (
                        <ListItem
                          key={index}
                          divider={index < (formik.values.senders?.length || 0) - 1}
                          secondaryAction={
                            <Box>
                              <IconButton 
                                edge="end" 
                                aria-label="edit" 
                                onClick={() => handleEditSender(sender, index)}
                                size="small"
                              >
                                <EditIcon />
                              </IconButton>
                              <IconButton 
                                edge="end" 
                                aria-label="delete" 
                                onClick={() => handleDeleteSender(index)}
                                size="small"
                                color="error"
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Box>
                          }
                        >
                          <ListItemText
                            primary={
                              <Box display="flex" alignItems="center">
                                <Typography variant="body1">{sender.name} &lt;{sender.email}&gt;</Typography>
                                {sender.isActive ? (
                                  <Chip 
                                    label="Actif" 
                                    size="small" 
                                    color="success" 
                                    sx={{ ml: 1 }}
                                  />
                                ) : (
                                  <Chip 
                                    label="Inactif" 
                                    size="small" 
                                    color="default" 
                                    sx={{ ml: 1 }}
                                  />
                                )}
                              </Box>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  )}
                </Grid>
                
                {/* Options de rotation des expéditeurs */}
                {formik.values.senders && formik.values.senders.length > 1 && (
                  <Grid item xs={12}>
                    <Card variant="outlined" sx={{ p: 2, mb: 2 }}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={formik.values.senderRotationEnabled}
                            onChange={formik.handleChange}
                            name="senderRotationEnabled"
                            color="primary"
                          />
                        }
                        label="Activer la rotation des expéditeurs"
                      />
                      
                      {formik.values.senderRotationEnabled && (
                        <Box sx={{ mt: 2, pl: 3 }}>
                          <Typography variant="body2" className="mb-2 text-gray-700">
                            Type de rotation :
                          </Typography>
                          <RadioGroup
                            value={formik.values.senderRotationType}
                            onChange={formik.handleChange}
                            name="senderRotationType"
                          >
                            <FormControlLabel 
                              value="sequential" 
                              control={<Radio />} 
                              label="Séquentielle (un après l'autre)" 
                            />
                            <FormControlLabel 
                              value="random" 
                              control={<Radio />} 
                              label="Aléatoire (choix aléatoire)" 
                            />
                          </RadioGroup>
                        </Box>
                      )}
                    </Card>
                  </Grid>
                )}
                
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
      
      {/* Dialogue pour ajouter/modifier un expéditeur */}
      <Dialog open={openSenderDialog} onClose={handleCloseSenderDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {isEditingSender ? "Modifier l'expéditeur" : "Ajouter un expéditeur"}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            id="name"
            label="Nom d'expéditeur"
            fullWidth
            variant="outlined"
            value={senderFormData.name}
            onChange={(e) => setSenderFormData({...senderFormData, name: e.target.value})}
            required
            sx={{ mb: 2, mt: 1 }}
          />
          <TextField
            margin="dense"
            id="email"
            label="Email d'expéditeur"
            type="email"
            fullWidth
            variant="outlined"
            value={senderFormData.email}
            onChange={(e) => setSenderFormData({...senderFormData, email: e.target.value})}
            required
            sx={{ mb: 2 }}
          />
          <FormControlLabel
            control={
              <Switch
                checked={senderFormData.isActive}
                onChange={(e) => setSenderFormData({...senderFormData, isActive: e.target.checked})}
                name="isActive"
                color="primary"
              />
            }
            label="Actif"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseSenderDialog}>Annuler</Button>
          <Button onClick={handleSaveSender} variant="contained" color="primary">
            {isEditingSender ? "Mettre à jour" : "Ajouter"}
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
};

export default SmtpProviderForm; 