import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Paper,
  Divider,
  Chip,
  Alert,
  CircularProgress,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Card,
  CardContent,
  CardHeader,
  Grid,
  IconButton,
  Tooltip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import SendIcon from '@mui/icons-material/Send';
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye';
import TouchAppIcon from '@mui/icons-material/TouchApp';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AlarmIcon from '@mui/icons-material/Alarm';
import CancelIcon from '@mui/icons-material/Cancel';
import EmailIcon from '@mui/icons-material/Email';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider, DateTimePicker } from '@mui/x-date-pickers';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

import Layout from '../../components/layout/Layout';
import { useAuth } from '../../contexts/AuthContext';
import { EmailCampaign, EmailTemplate, SmtpProvider, getEmailCampaignById, getEmailTemplateById, getSmtpProviderById, deleteEmailCampaign } from '../../models/dynamodb';
import { CampaignService } from '../../services/campaign-service';

const CampaignDetails: React.FC = () => {
  const { campaignId } = useParams<{ campaignId: string }>();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [campaign, setCampaign] = useState<EmailCampaign | null>(null);
  const [template, setTemplate] = useState<EmailTemplate | null>(null);
  const [provider, setProvider] = useState<SmtpProvider | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // États pour les dialogues
  const [openSendDialog, setOpenSendDialog] = useState(false);
  const [openScheduleDialog, setOpenScheduleDialog] = useState(false);
  const [openCancelDialog, setOpenCancelDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [scheduledDate, setScheduledDate] = useState<dayjs.Dayjs | null>(dayjs().add(1, 'hour')); // 1 heure plus tard

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser || !campaignId) return;
      
      try {
        setIsLoading(true);
        
        // Récupérer la campagne
        console.log("Chargement de la campagne avec ID:", campaignId);
        const campaignData = await getEmailCampaignById(campaignId);
        
        if (!campaignData) {
          console.error("Campagne non trouvée:", campaignId);
          setError('Campagne non trouvée');
          setIsLoading(false);
          return;
        }
        
        // Vérifier que la campagne appartient à l'utilisateur courant
        if (campaignData.userId !== currentUser.userId) {
          console.error("La campagne n'appartient pas à l'utilisateur:", {
            campaignUserId: campaignData.userId,
            currentUserId: currentUser.userId
          });
          setError("Vous n'avez pas les droits pour voir cette campagne");
          setIsLoading(false);
          return;
        }
        
        console.log("Campagne chargée avec succès:", campaignData.name);
        setCampaign(campaignData);
        
        // Récupérer le template et le fournisseur SMTP associés
        console.log("Chargement du template et du fournisseur SMTP...");
        const [templateData, providerData] = await Promise.all([
          getEmailTemplateById(campaignData.templateId),
          getSmtpProviderById(campaignData.providerId)
        ]);
        
        console.log("Template chargé:", templateData?.name);
        console.log("Fournisseur SMTP chargé:", providerData?.name);
        
        setTemplate(templateData);
        setProvider(providerData);
      } catch (err: any) {
        console.error('Erreur lors de la récupération des données:', err);
        setError(err.message || 'Une erreur est survenue lors du chargement des données');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [currentUser, campaignId]);

  // Obtenir le statut formaté d'une campagne
  const getCampaignStatusChip = (status: string) => {
    switch (status) {
      case 'draft':
        return <Chip label="Brouillon" color="default" size="small" className="font-medium" />;
      case 'scheduled':
        return <Chip label="Planifiée" color="primary" size="small" className="font-medium" />;
      case 'sending':
        return <Chip label="En cours d'envoi" color="warning" size="small" className="font-medium" />;
      case 'sent':
        return <Chip label="Envoyée" color="success" size="small" className="font-medium" />;
      case 'failed':
        return <Chip label="Échec" color="error" size="small" className="font-medium" />;
      default:
        return <Chip label={status} color="default" size="small" className="font-medium" />;
    }
  };

  // Formatage des dates
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '—';
    
    try {
      return format(new Date(dateString), 'dd MMMM yyyy à HH:mm', { locale: fr });
    } catch (error) {
      console.error('Erreur de formatage de date:', error);
      return dateString;
    }
  };

  // Calcul des pourcentages pour les statistiques
  const calculatePercent = (value: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((value / total) * 100);
  };

  // Fonctions pour gérer les dialogues
  const handleOpenSendDialog = () => setOpenSendDialog(true);
  const handleCloseSendDialog = () => setOpenSendDialog(false);
  
  const handleOpenScheduleDialog = () => setOpenScheduleDialog(true);
  const handleCloseScheduleDialog = () => setOpenScheduleDialog(false);
  
  const handleOpenCancelDialog = () => setOpenCancelDialog(true);
  const handleCloseCancelDialog = () => setOpenCancelDialog(false);
  
  const handleOpenDeleteDialog = () => setOpenDeleteDialog(true);
  const handleCloseDeleteDialog = () => setOpenDeleteDialog(false);

  // Fonctions pour gérer les actions de campagne
  const handleSendCampaign = async () => {
    if (!campaignId) return;
    
    setIsProcessing(true);
    
    try {
      const result = await CampaignService.sendCampaign(campaignId);
      
      if (result) {
        toast.success('La campagne a été envoyée avec succès');
        // Recharger les données
        window.location.reload();
      } else {
        toast.error('Échec de l\'envoi de la campagne');
      }
    } catch (err: any) {
      toast.error(err.message || 'Une erreur est survenue lors de l\'envoi');
    } finally {
      setIsProcessing(false);
      handleCloseSendDialog();
    }
  };

  const handleScheduleCampaign = async () => {
    if (!campaignId || !scheduledDate) return;
    
    // Vérifier que la date est dans le futur
    if (scheduledDate.isBefore(dayjs())) {
      toast.error('La date de planification doit être dans le futur');
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // Mettre à jour le statut de la campagne
      if (campaign) {
        const updatedCampaign = {
          ...campaign,
          status: 'scheduled' as 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed',
          scheduledAt: scheduledDate.toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        const result = await CampaignService.scheduleCampaign(campaignId, scheduledDate.toDate());
        
        if (result.success) {
          toast.success('La campagne a été planifiée avec succès');
          setCampaign(updatedCampaign);
        } else {
          toast.error(`Erreur lors de la planification: ${result.error}`);
        }
      }
    } catch (err: any) {
      toast.error(err.message || 'Une erreur est survenue lors de la planification');
    } finally {
      setIsProcessing(false);
      handleCloseScheduleDialog();
    }
  };

  const handleCancelScheduledCampaign = async () => {
    if (!campaignId) return;
    
    setIsProcessing(true);
    
    try {
      const result = await CampaignService.cancelScheduledCampaign(campaignId);
      
      if (result.success) {
        toast.success('La planification a été annulée avec succès');
        
        // Mettre à jour le statut local de la campagne
        if (campaign) {
          const updatedCampaign = {
            ...campaign,
            status: 'draft' as 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed',
            scheduledAt: null,
            updatedAt: new Date().toISOString()
          };
          setCampaign(updatedCampaign);
        }
      } else {
        toast.error(`Erreur lors de l'annulation: ${result.error}`);
      }
    } catch (err: any) {
      toast.error(err.message || 'Une erreur est survenue lors de l\'annulation');
    } finally {
      setIsProcessing(false);
      handleCloseCancelDialog();
    }
  };

  const handleDeleteCampaign = async () => {
    if (!campaignId) return;
    
    setIsProcessing(true);
    
    try {
      const success = await deleteEmailCampaign(campaignId);
      
      if (success) {
        toast.success('La campagne a été supprimée avec succès');
        navigate('/campaigns');
      } else {
        toast.error('Erreur lors de la suppression de la campagne');
      }
    } catch (err: any) {
      toast.error(err.message || 'Une erreur est survenue lors de la suppression');
    } finally {
      setIsProcessing(false);
      handleCloseDeleteDialog();
    }
  };

  const handleExportStats = async () => {
    if (!campaignId) return;
    
    try {
      const result = await CampaignService.exportCampaignStats(campaignId);
      
      if (result.success && result.csvContent) {
        // Créer un blob avec le contenu CSV
        const blob = new Blob([result.csvContent], { type: 'text/csv;charset=utf-8;' });
        
        // Créer un lien pour télécharger le fichier
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.href = url;
        link.setAttribute('download', `campagne_${campaignId}_stats.csv`);
        document.body.appendChild(link);
        
        // Déclencher le téléchargement
        link.click();
        
        // Nettoyer
        setTimeout(() => {
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        }, 100);
        
        toast.success('Les statistiques ont été exportées avec succès');
      } else {
        toast.error(`Erreur lors de l'export: ${result.error}`);
      }
    } catch (err: any) {
      toast.error(err.message || 'Une erreur est survenue lors de l\'export');
    }
  };

  // Affichage pendant le chargement
  if (isLoading) {
    return (
      <Layout title="Détails de la campagne">
        <Box className="flex justify-center items-center h-[50vh]">
          <CircularProgress />
        </Box>
      </Layout>
    );
  }

  // Affichage en cas d'erreur
  if (error || !campaign) {
    return (
      <Layout title="Détails de la campagne">
        <Alert severity="error" className="mb-4 rounded-lg">
          {error || 'Campagne non trouvée'}
        </Alert>
        <Button 
          variant="contained" 
          color="primary"
          onClick={() => navigate('/campaigns')}
          startIcon={<ArrowBackIcon />}
        >
          Retour à la liste des campagnes
        </Button>
      </Layout>
    );
  }

  return (
    <Layout title={`Campagne: ${campaign.name}`}>
      {/* En-tête */}
      <Box className="mb-6">
        <Box className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
          <Box>
            <Box className="flex items-center gap-2">
              <IconButton
                color="primary"
                onClick={() => navigate('/campaigns')}
                className="mr-2"
              >
                <ArrowBackIcon />
              </IconButton>
              <Typography variant="h4" component="h1" className="font-bold text-gray-900 dark:text-white">
                {campaign.name}
              </Typography>
              {getCampaignStatusChip(campaign.status)}
            </Box>
            <Typography variant="body1" color="textSecondary" className="mt-2">
              Créée le {formatDate(campaign.createdAt)}
            </Typography>
          </Box>

          <Box className="flex flex-wrap gap-2">
            {campaign.status === 'draft' && (
              <>
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<AlarmIcon />}
                  onClick={handleOpenScheduleDialog}
                >
                  Planifier
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<SendIcon />}
                  onClick={handleOpenSendDialog}
                >
                  Envoyer
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<EditIcon />}
                  onClick={() => navigate(`/campaigns/${campaignId}`)}
                >
                  Modifier
                </Button>
              </>
            )}
            
            {campaign.status === 'scheduled' && (
              <Button
                variant="outlined"
                color="warning"
                startIcon={<CancelIcon />}
                onClick={handleOpenCancelDialog}
              >
                Annuler la planification
              </Button>
            )}
            
            {(campaign.status === 'sent' || campaign.status === 'failed') && (
              <Button
                variant="outlined"
                startIcon={<FileDownloadIcon />}
                onClick={handleExportStats}
              >
                Exporter les statistiques
              </Button>
            )}
            
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={handleOpenDeleteDialog}
            >
              Supprimer
            </Button>
          </Box>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Informations de la campagne */}
        <Grid item xs={12} md={6}>
          <Card className="border border-gray-200 dark:border-gray-700 shadow-sm rounded-xl mb-4">
            <CardHeader
              title="Informations de la campagne"
              className="border-b border-gray-200 bg-gray-50 px-6 py-3"
              titleTypographyProps={{ variant: 'subtitle1', className: 'font-semibold' }}
            />
            <CardContent className="p-6">
              <List disablePadding>
                <ListItem divider className="px-0">
                  <ListItemText 
                    primary="Statut" 
                    secondary={
                      <Box className="flex items-center mt-1">
                        {getCampaignStatusChip(campaign.status)}
                        {campaign.status === 'scheduled' && (
                          <Typography variant="body2" className="ml-2">
                            Planifiée pour le {formatDate(campaign.scheduledAt)}
                          </Typography>
                        )}
                        {campaign.status === 'sent' && (
                          <Typography variant="body2" className="ml-2">
                            Envoyée le {formatDate(campaign.sentAt)}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                </ListItem>
                
                <ListItem divider className="px-0">
                  <ListItemText 
                    primary="Modèle d'email" 
                    secondary={template ? template.name : 'Non disponible'}
                  />
                </ListItem>
                
                <ListItem divider className="px-0">
                  <ListItemText 
                    primary="Fournisseur SMTP" 
                    secondary={provider ? provider.name : 'Non disponible'}
                  />
                </ListItem>
                
                <ListItem divider className="px-0">
                  <ListItemText 
                    primary="Objet" 
                    secondary={campaign.subject}
                  />
                </ListItem>
                
                <ListItem divider className="px-0">
                  <ListItemText 
                    primary="Expéditeur" 
                    secondary={`${campaign.fromName} <${campaign.fromEmail}>`}
                  />
                </ListItem>
                
                <ListItem className="px-0">
                  <ListItemText 
                    primary="Destinataires" 
                    secondary={
                      <Box className="mt-1">
                        <Chip 
                          label={`${campaign.recipients.length} destinataires`} 
                          size="small" 
                          color="primary"
                        />
                      </Box>
                    }
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
          
          {campaign.recipients.length > 0 && (
            <Card className="border border-gray-200 dark:border-gray-700 shadow-sm rounded-xl">
              <CardHeader
                title={`Liste des destinataires (${campaign.recipients.length})`}
                className="border-b border-gray-200 bg-gray-50 px-6 py-3"
                titleTypographyProps={{ variant: 'subtitle1', className: 'font-semibold' }}
              />
              <CardContent className="p-0">
                <List 
                  sx={{ 
                    maxHeight: 300, 
                    overflow: 'auto',
                    padding: 0
                  }}
                >
                  {campaign.recipients.map((email, index) => (
                    <ListItem key={email} divider={index < campaign.recipients.length - 1}>
                      <ListItemIcon>
                        <PersonIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary={email} />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          )}
        </Grid>

        {/* Statistiques de la campagne */}
        <Grid item xs={12} md={6}>
          <Card className="border border-gray-200 dark:border-gray-700 shadow-sm rounded-xl">
            <CardHeader
              title="Statistiques de la campagne"
              className="border-b border-gray-200 bg-gray-50 px-6 py-3"
              titleTypographyProps={{ variant: 'subtitle1', className: 'font-semibold' }}
            />
            <CardContent className="p-6">
              {campaign.status === 'draft' || campaign.status === 'scheduled' ? (
                <Alert severity="info" className="rounded-lg">
                  Les statistiques seront disponibles une fois la campagne envoyée.
                </Alert>
              ) : (
                <Box>
                  <Box className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                    <Box className="p-4 border border-gray-200 rounded-lg text-center">
                      <Typography variant="h5" className="font-bold text-primary">
                        {campaign.stats.sent}
                      </Typography>
                      <Typography variant="body2" className="text-gray-600">
                        Emails envoyés
                      </Typography>
                    </Box>
                    
                    <Box className="p-4 border border-gray-200 rounded-lg text-center">
                      <Typography variant="h5" className="font-bold text-green-600">
                        {campaign.stats.delivered}
                      </Typography>
                      <Typography variant="body2" className="text-gray-600">
                        Emails délivrés
                      </Typography>
                    </Box>
                    
                    <Box className="p-4 border border-gray-200 rounded-lg text-center">
                      <Typography variant="h5" className="font-bold text-amber-600">
                        {campaign.stats.opened}
                      </Typography>
                      <Typography variant="body2" className="text-gray-600">
                        Emails ouverts
                      </Typography>
                    </Box>
                    
                    <Box className="p-4 border border-gray-200 rounded-lg text-center">
                      <Typography variant="h5" className="font-bold text-blue-600">
                        {campaign.stats.clicked}
                      </Typography>
                      <Typography variant="body2" className="text-gray-600">
                        Clics
                      </Typography>
                    </Box>
                    
                    <Box className="p-4 border border-gray-200 rounded-lg text-center">
                      <Typography variant="h5" className="font-bold text-red-600">
                        {campaign.stats.bounced}
                      </Typography>
                      <Typography variant="body2" className="text-gray-600">
                        Rebonds
                      </Typography>
                    </Box>
                    
                    <Box className="p-4 border border-gray-200 rounded-lg text-center">
                      <Typography variant="h5" className="font-bold text-red-600">
                        {campaign.stats.complaints}
                      </Typography>
                      <Typography variant="body2" className="text-gray-600">
                        Plaintes
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Divider className="my-4" />
                  
                  <Typography variant="subtitle2" className="font-semibold mb-3">
                    Taux de performance
                  </Typography>
                  
                  <Box className="space-y-4">
                    <Box>
                      <Box className="flex justify-between items-center mb-1">
                        <Typography variant="body2">
                          Taux de délivrance
                        </Typography>
                        <Typography variant="body2" className="font-medium">
                          {calculatePercent(campaign.stats.delivered, campaign.stats.sent)}%
                        </Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={calculatePercent(campaign.stats.delivered, campaign.stats.sent)} 
                        className="h-2 rounded-full"
                      />
                    </Box>
                    
                    <Box>
                      <Box className="flex justify-between items-center mb-1">
                        <Typography variant="body2">
                          Taux d'ouverture
                        </Typography>
                        <Typography variant="body2" className="font-medium">
                          {calculatePercent(campaign.stats.opened, campaign.stats.delivered)}%
                        </Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={calculatePercent(campaign.stats.opened, campaign.stats.delivered)} 
                        color="success"
                        className="h-2 rounded-full"
                      />
                    </Box>
                    
                    <Box>
                      <Box className="flex justify-between items-center mb-1">
                        <Typography variant="body2">
                          Taux de clic
                        </Typography>
                        <Typography variant="body2" className="font-medium">
                          {calculatePercent(campaign.stats.clicked, campaign.stats.opened)}%
                        </Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={calculatePercent(campaign.stats.clicked, campaign.stats.opened)} 
                        color="secondary"
                        className="h-2 rounded-full"
                      />
                    </Box>
                    
                    <Box>
                      <Box className="flex justify-between items-center mb-1">
                        <Typography variant="body2">
                          Taux de rebond
                        </Typography>
                        <Typography variant="body2" className="font-medium">
                          {calculatePercent(campaign.stats.bounced, campaign.stats.sent)}%
                        </Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={calculatePercent(campaign.stats.bounced, campaign.stats.sent)} 
                        color="error"
                        className="h-2 rounded-full"
                      />
                    </Box>
                  </Box>
                  
                  {campaign.status === 'sent' && (
                    <Box className="mt-6">
                      <Button
                        variant="outlined"
                        startIcon={<FileDownloadIcon />}
                        fullWidth
                        onClick={handleExportStats}
                      >
                        Exporter les statistiques complètes (CSV)
                      </Button>
                    </Box>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Dialogues de confirmation */}
      {/* Dialogue d'envoi */}
      <Dialog open={openSendDialog} onClose={() => !isProcessing && handleCloseSendDialog()}>
        <DialogTitle>Envoyer la campagne</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Êtes-vous sûr de vouloir envoyer cette campagne maintenant ? 
            Une fois envoyée, la campagne ne pourra plus être modifiée.
            
            <Box className="mt-4 p-3 bg-gray-50 rounded-lg">
              <Typography variant="subtitle2" className="font-semibold">
                Détails de l'envoi:
              </Typography>
              <List dense disablePadding>
                <ListItem disablePadding>
                  <Typography variant="body2">
                    • <strong>Nom:</strong> {campaign.name}
                  </Typography>
                </ListItem>
                <ListItem disablePadding>
                  <Typography variant="body2">
                    • <strong>Destinataires:</strong> {campaign.recipients.length}
                  </Typography>
                </ListItem>
                <ListItem disablePadding>
                  <Typography variant="body2">
                    • <strong>Modèle:</strong> {template?.name || 'Non disponible'}
                  </Typography>
                </ListItem>
                <ListItem disablePadding>
                  <Typography variant="body2">
                    • <strong>Fournisseur:</strong> {provider?.name || 'Non disponible'}
                  </Typography>
                </ListItem>
              </List>
            </Box>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseSendDialog} disabled={isProcessing}>
            Annuler
          </Button>
          <Button 
            onClick={handleSendCampaign} 
            color="primary" 
            variant="contained"
            disabled={isProcessing}
            startIcon={isProcessing ? <CircularProgress size={20} /> : <SendIcon />}
          >
            {isProcessing ? 'Envoi en cours...' : 'Envoyer maintenant'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialogue de planification */}
      <Dialog open={openScheduleDialog} onClose={() => !isProcessing && handleCloseScheduleDialog()}>
        <DialogTitle>Planifier l'envoi</DialogTitle>
        <DialogContent>
          <DialogContentText className="mb-4">
            Sélectionnez la date et l'heure à laquelle vous souhaitez envoyer cette campagne.
          </DialogContentText>
          <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="fr">
            <DateTimePicker
              label="Date et heure d'envoi"
              value={scheduledDate}
              onChange={(newValue) => setScheduledDate(newValue)}
              minDateTime={dayjs().add(5, 'minute')}
              className="w-full"
              slotProps={{
                textField: {
                  fullWidth: true,
                  variant: 'outlined'
                }
              }}
            />
          </LocalizationProvider>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseScheduleDialog} disabled={isProcessing}>
            Annuler
          </Button>
          <Button 
            onClick={handleScheduleCampaign} 
            color="primary" 
            variant="contained"
            disabled={isProcessing || !scheduledDate}
            startIcon={isProcessing ? <CircularProgress size={20} /> : <AlarmIcon />}
          >
            {isProcessing ? 'Planification...' : 'Planifier l\'envoi'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialogue d'annulation de planification */}
      <Dialog open={openCancelDialog} onClose={() => !isProcessing && handleCloseCancelDialog()}>
        <DialogTitle>Annuler la planification</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Êtes-vous sûr de vouloir annuler la planification de cette campagne ? 
            La campagne reviendra à l'état de brouillon.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCancelDialog} disabled={isProcessing}>
            Conserver la planification
          </Button>
          <Button 
            onClick={handleCancelScheduledCampaign} 
            color="warning" 
            variant="contained"
            disabled={isProcessing}
            startIcon={isProcessing ? <CircularProgress size={20} /> : <CancelIcon />}
          >
            {isProcessing ? 'Annulation...' : 'Annuler la planification'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialogue de suppression */}
      <Dialog open={openDeleteDialog} onClose={() => !isProcessing && handleCloseDeleteDialog()}>
        <DialogTitle>Supprimer la campagne</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Êtes-vous sûr de vouloir supprimer cette campagne ? Cette action est irréversible.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} disabled={isProcessing}>
            Annuler
          </Button>
          <Button 
            onClick={handleDeleteCampaign} 
            color="error" 
            variant="contained"
            disabled={isProcessing}
            startIcon={isProcessing ? <CircularProgress size={20} /> : <DeleteIcon />}
          >
            {isProcessing ? 'Suppression...' : 'Supprimer'}
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
};

export default CampaignDetails; 