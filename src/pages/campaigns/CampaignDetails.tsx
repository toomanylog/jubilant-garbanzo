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
  DialogActions
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import SendIcon from '@mui/icons-material/Send';
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye';
import TouchAppIcon from '@mui/icons-material/TouchApp';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider, DateTimePicker } from '@mui/x-date-pickers';
import { toast } from 'react-toastify';

import Layout from '../../components/layout/Layout';
import { useAuth } from '../../contexts/AuthContext';
import { EmailCampaign, EmailTemplate, SmtpProvider, getEmailCampaignById, getEmailTemplateById, getSmtpProviderById } from '../../models/dynamodb';
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
  const [isProcessing, setIsProcessing] = useState(false);
  const [scheduledDate, setScheduledDate] = useState<Date | null>(new Date(Date.now() + 3600000)); // 1 heure plus tard

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser || !campaignId) return;
      
      try {
        // Récupérer la campagne
        const campaignData = await getEmailCampaignById(campaignId);
        if (!campaignData) {
          setError('Campagne non trouvée');
          setIsLoading(false);
          return;
        }
        
        // Vérifier que la campagne appartient à l'utilisateur courant
        if (campaignData.userId !== currentUser.userId) {
          setError("Vous n'avez pas les droits pour voir cette campagne");
          setIsLoading(false);
          return;
        }
        
        setCampaign(campaignData);
        
        // Récupérer le template et le fournisseur SMTP associés
        const [templateData, providerData] = await Promise.all([
          getEmailTemplateById(campaignData.templateId),
          getSmtpProviderById(campaignData.providerId)
        ]);
        
        setTemplate(templateData);
        setProvider(providerData);
      } catch (err: any) {
        console.error('Erreur lors de la récupération des données:', err);
        setError(err.message || 'Une erreur est survenue');
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
        return <Chip label="Brouillon" color="default" />;
      case 'scheduled':
        return <Chip label="Planifiée" color="primary" />;
      case 'sending':
        return <Chip label="En cours d'envoi" color="warning" />;
      case 'sent':
        return <Chip label="Envoyée" color="success" />;
      case 'failed':
        return <Chip label="Échec" color="error" />;
      default:
        return <Chip label={status} color="default" />;
    }
  };

  // Fonctions pour gérer les dialogues
  const handleOpenSendDialog = () => setOpenSendDialog(true);
  const handleCloseSendDialog = () => setOpenSendDialog(false);
  
  const handleOpenScheduleDialog = () => setOpenScheduleDialog(true);
  const handleCloseScheduleDialog = () => setOpenScheduleDialog(false);
  
  const handleOpenCancelDialog = () => setOpenCancelDialog(true);
  const handleCloseCancelDialog = () => setOpenCancelDialog(false);

  // Fonctions pour gérer les actions de campagne
  const handleSendCampaign = async () => {
    if (!campaignId) return;
    
    setIsLoading(true);
    
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
      toast.error(err.message || 'Une erreur est survenue');
    } finally {
      setIsLoading(false);
      setOpenSendDialog(false);
    }
  };

  const handleScheduleCampaign = async () => {
    if (!campaignId || !scheduledDate) return;
    
    setIsProcessing(true);
    
    try {
      const result = await CampaignService.scheduleCampaign(campaignId, scheduledDate);
      
      if (result.success) {
        toast.success('La campagne a été planifiée avec succès');
        // Recharger les données
        window.location.reload();
      } else {
        toast.error(`Erreur lors de la planification: ${result.error}`);
      }
    } catch (err: any) {
      toast.error(err.message || 'Une erreur est survenue');
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
        // Recharger les données
        window.location.reload();
      } else {
        toast.error(`Erreur lors de l'annulation: ${result.error}`);
      }
    } catch (err: any) {
      toast.error(err.message || 'Une erreur est survenue');
    } finally {
      setIsProcessing(false);
      handleCloseCancelDialog();
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
      toast.error(err.message || 'Une erreur est survenue');
    }
  };

  if (isLoading) {
    return (
      <Layout title="Détails de la campagne">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress />
        </Box>
      </Layout>
    );
  }

  if (error || !campaign) {
    return (
      <Layout title="Détails de la campagne">
        <Alert severity="error" sx={{ mb: 3 }}>
          {error || 'Campagne non trouvée'}
        </Alert>
        <Button variant="contained" onClick={() => navigate('/campaigns')}>
          Retour à la liste des campagnes
        </Button>
      </Layout>
    );
  }

  return (
    <Layout title="Détails de la campagne">
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          {campaign.name}
        </Typography>
        <Box>
          {campaign.status === 'draft' && (
            <Button 
              variant="contained" 
              color="primary"
              onClick={() => navigate(`/campaigns/${campaignId}`)}
              sx={{ mr: 2 }}
            >
              Modifier
            </Button>
          )}
          <Button 
            variant="outlined" 
            onClick={() => navigate('/campaigns')}
          >
            Retour
          </Button>
        </Box>
      </Box>
      
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
        <Box sx={{ width: { xs: '100%', md: '60%' } }}>
          <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Informations générales</Typography>
              {getCampaignStatusChip(campaign.status)}
            </Box>
            
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Sujet
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {campaign.subject}
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Expéditeur
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {campaign.fromName} &lt;{campaign.fromEmail}&gt;
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Modèle utilisé
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {template ? template.name : 'Modèle inconnu'}
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Fournisseur SMTP
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {provider ? provider.name : 'Fournisseur inconnu'}
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Date de création
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {new Date(campaign.createdAt).toLocaleDateString()} {new Date(campaign.createdAt).toLocaleTimeString()}
                </Typography>
              </Box>
              
              {campaign.scheduledAt && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Date d'envoi planifiée
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {new Date(campaign.scheduledAt).toLocaleDateString()} {new Date(campaign.scheduledAt).toLocaleTimeString()}
                  </Typography>
                </Box>
              )}
              
              {campaign.sentAt && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Date d'envoi effective
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {new Date(campaign.sentAt).toLocaleDateString()} {new Date(campaign.sentAt).toLocaleTimeString()}
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>
          
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Destinataires
            </Typography>
            
            <Box sx={{ maxHeight: '300px', overflow: 'auto', mt: 2 }}>
              <List dense>
                {campaign.recipients.slice(0, 100).map((email, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <PersonIcon />
                    </ListItemIcon>
                    <ListItemText primary={email} />
                  </ListItem>
                ))}
                {campaign.recipients.length > 100 && (
                  <ListItem>
                    <ListItemText 
                      primary={`+ ${campaign.recipients.length - 100} autres destinataires`} 
                      primaryTypographyProps={{ color: 'text.secondary', variant: 'body2' }}
                    />
                  </ListItem>
                )}
              </List>
            </Box>
          </Paper>
        </Box>
        
        <Box sx={{ width: { xs: '100%', md: '40%' } }}>
          <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Statistiques
            </Typography>
            
            {campaign.status === 'sent' || campaign.status === 'sending' ? (
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2">Emails envoyés</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {campaign.stats.sent} / {campaign.stats.total}
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={(campaign.stats.sent / campaign.stats.total) * 100} 
                  sx={{ mb: 2, height: 10, borderRadius: 5 }}
                />
                
                <Divider sx={{ my: 2 }} />
                
                <Typography variant="subtitle2" gutterBottom>
                  Détails
                </Typography>
                
                <List dense disablePadding>
                  <ListItem sx={{ py: 0.5 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <SendIcon color="primary" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Livrés" 
                      secondary={`${campaign.stats.delivered} (${Math.round((campaign.stats.delivered / campaign.stats.sent) * 100) || 0}%)`}
                    />
                  </ListItem>
                  
                  <ListItem sx={{ py: 0.5 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <RemoveRedEyeIcon color="info" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Ouverts" 
                      secondary={`${campaign.stats.opened} (${Math.round((campaign.stats.opened / campaign.stats.delivered) * 100) || 0}%)`}
                    />
                  </ListItem>
                  
                  <ListItem sx={{ py: 0.5 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <TouchAppIcon color="success" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Cliqués" 
                      secondary={`${campaign.stats.clicked} (${Math.round((campaign.stats.clicked / campaign.stats.opened) * 100) || 0}%)`}
                    />
                  </ListItem>
                  
                  <ListItem sx={{ py: 0.5 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <ErrorIcon color="error" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Rebonds" 
                      secondary={`${campaign.stats.bounced} (${Math.round((campaign.stats.bounced / campaign.stats.sent) * 100) || 0}%)`}
                    />
                  </ListItem>
                  
                  <ListItem sx={{ py: 0.5 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <WarningIcon color="warning" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Plaintes" 
                      secondary={`${campaign.stats.complaints} (${Math.round((campaign.stats.complaints / campaign.stats.sent) * 100) || 0}%)`}
                    />
                  </ListItem>
                </List>
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Les statistiques seront disponibles après l'envoi de la campagne.
              </Typography>
            )}
          </Paper>
          
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Actions
            </Typography>
            
            <Button 
              variant="outlined" 
              fullWidth 
              sx={{ mb: 2 }}
              onClick={() => {
                if (template) {
                  window.open(`/templates/${template.templateId}/preview`, '_blank');
                } else {
                  toast.error('Modèle non disponible');
                }
              }}
            >
              Prévisualiser le modèle
            </Button>
            
            {campaign.status === 'draft' && (
              <>
                <Button 
                  variant="contained" 
                  color="primary" 
                  fullWidth 
                  sx={{ mb: 2 }}
                  onClick={handleOpenSendDialog}
                >
                  Envoyer maintenant
                </Button>
                
                <Button 
                  variant="outlined" 
                  color="primary" 
                  fullWidth
                  onClick={handleOpenScheduleDialog}
                >
                  Planifier l'envoi
                </Button>
              </>
            )}
            
            {campaign.status === 'scheduled' && (
              <Button 
                variant="outlined" 
                color="warning" 
                fullWidth
                onClick={handleOpenCancelDialog}
              >
                Annuler l'envoi planifié
              </Button>
            )}
            
            {campaign.status === 'sent' && (
              <Button 
                variant="outlined" 
                color="primary" 
                fullWidth
                onClick={handleExportStats}
              >
                Exporter les statistiques (CSV)
              </Button>
            )}
          </Paper>
        </Box>
      </Box>
      
      {/* Dialogue de confirmation d'envoi */}
      <Dialog open={openSendDialog} onClose={handleCloseSendDialog}>
        <DialogTitle>Confirmer l'envoi</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Vous êtes sur le point d'envoyer cette campagne à {campaign.recipients.length} destinataire(s).
            Cette action est irréversible. Voulez-vous continuer ?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseSendDialog} disabled={isProcessing}>Annuler</Button>
          <Button 
            onClick={handleSendCampaign} 
            color="primary" 
            disabled={isProcessing}
            startIcon={isProcessing ? <CircularProgress size={20} /> : null}
          >
            {isProcessing ? 'Envoi en cours...' : 'Envoyer'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Dialogue de planification */}
      <Dialog open={openScheduleDialog} onClose={handleCloseScheduleDialog}>
        <DialogTitle>Planifier l'envoi</DialogTitle>
        <DialogContent>
          <DialogContentText gutterBottom>
            Veuillez sélectionner la date et l'heure à laquelle vous souhaitez envoyer cette campagne.
          </DialogContentText>
          <Box sx={{ mt: 2 }}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DateTimePicker
                label="Date et heure d'envoi"
                value={scheduledDate}
                onChange={(newValue) => setScheduledDate(newValue)}
                minDateTime={new Date()}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </LocalizationProvider>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseScheduleDialog} disabled={isProcessing}>Annuler</Button>
          <Button 
            onClick={handleScheduleCampaign} 
            color="primary" 
            disabled={isProcessing || !scheduledDate}
            startIcon={isProcessing ? <CircularProgress size={20} /> : null}
          >
            {isProcessing ? 'Planification...' : 'Planifier'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Dialogue d'annulation de planification */}
      <Dialog open={openCancelDialog} onClose={handleCloseCancelDialog}>
        <DialogTitle>Annuler l'envoi planifié</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Voulez-vous vraiment annuler l'envoi planifié de cette campagne ?
            La campagne repassera en état "brouillon".
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCancelDialog} disabled={isProcessing}>Non</Button>
          <Button 
            onClick={handleCancelScheduledCampaign} 
            color="warning" 
            disabled={isProcessing}
            startIcon={isProcessing ? <CircularProgress size={20} /> : null}
          >
            {isProcessing ? 'Annulation...' : 'Oui, annuler'}
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
};

export default CampaignDetails; 