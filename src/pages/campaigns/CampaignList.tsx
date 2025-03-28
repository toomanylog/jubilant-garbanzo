import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  IconButton,
  CircularProgress,
  Alert,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  LinearProgress
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SendIcon from '@mui/icons-material/Send';
import AddIcon from '@mui/icons-material/Add';
import Layout from '../../components/layout/Layout';
import { useAuth } from '../../contexts/AuthContext';
import { EmailCampaign, getEmailCampaignsByUserId, deleteEmailCampaign } from '../../models/dynamodb';
import { toast } from 'react-toastify';

const CampaignList: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [campaignToDelete, setCampaignToDelete] = useState<string | null>(null);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [campaignToSend, setCampaignToSend] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    const fetchCampaigns = async () => {
      if (!currentUser) return;
      
      try {
        const userCampaigns = await getEmailCampaignsByUserId(currentUser.userId);
        setCampaigns(userCampaigns);
      } catch (err: any) {
        console.error('Erreur lors de la récupération des campagnes:', err);
        setError(err.message || 'Une erreur est survenue');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCampaigns();
  }, [currentUser]);

  // Fonction pour éditer une campagne
  const handleEdit = (campaignId: string) => {
    navigate(`/campaigns/${campaignId}`);
  };

  // Fonction pour voir les détails d'une campagne
  const handleView = (campaignId: string) => {
    navigate(`/campaigns/${campaignId}/details`);
  };

  // Fonction pour ouvrir la boîte de dialogue de confirmation d'envoi
  const handleSendConfirm = (campaignId: string) => {
    setCampaignToSend(campaignId);
    setSendDialogOpen(true);
  };

  // Fonction pour envoyer une campagne après confirmation
  const handleSendCampaign = async () => {
    if (!campaignToSend) return;
    
    setIsSending(true);
    try {
      // Dans une implémentation réelle, on appellerait une API pour démarrer l'envoi
      toast.success('Campagne envoyée avec succès');
      
      // Mettre à jour l'état de la campagne localement
      setCampaigns(prevCampaigns => 
        prevCampaigns.map(campaign => 
          campaign.campaignId === campaignToSend 
            ? { ...campaign, status: 'sent', sentAt: new Date().toISOString() } 
            : campaign
        )
      );
    } catch (err: any) {
      console.error('Erreur lors de l\'envoi de la campagne:', err);
      toast.error(err.message || 'Une erreur est survenue');
    } finally {
      setSendDialogOpen(false);
      setCampaignToSend(null);
      setIsSending(false);
    }
  };

  // Fonction pour ouvrir la boîte de dialogue de confirmation de suppression
  const handleDeleteConfirm = (campaignId: string) => {
    setCampaignToDelete(campaignId);
    setDeleteDialogOpen(true);
  };

  // Fonction pour supprimer une campagne après confirmation
  const handleDeleteCampaign = async () => {
    if (!campaignToDelete) return;
    
    try {
      const success = await deleteEmailCampaign(campaignToDelete);
      if (success) {
        setCampaigns(campaigns.filter(c => c.campaignId !== campaignToDelete));
        toast.success('Campagne supprimée avec succès');
      } else {
        toast.error('Erreur lors de la suppression de la campagne');
      }
    } catch (err: any) {
      console.error('Erreur lors de la suppression de la campagne:', err);
      toast.error(err.message || 'Une erreur est survenue');
    } finally {
      setDeleteDialogOpen(false);
      setCampaignToDelete(null);
    }
  };

  // Obtenir le statut formaté d'une campagne
  const getCampaignStatusChip = (status: string) => {
    switch (status) {
      case 'draft':
        return <Chip label="Brouillon" color="default" size="small" />;
      case 'scheduled':
        return <Chip label="Planifiée" color="primary" size="small" />;
      case 'sending':
        return <Chip label="En cours d'envoi" color="warning" size="small" />;
      case 'sent':
        return <Chip label="Envoyée" color="success" size="small" />;
      case 'failed':
        return <Chip label="Échec" color="error" size="small" />;
      default:
        return <Chip label={status} color="default" size="small" />;
    }
  };

  // Rendre la page pendant le chargement
  if (isLoading) {
    return (
      <Layout title="Campagnes d'email">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress />
        </Box>
      </Layout>
    );
  }

  return (
    <Layout title="Campagnes d'email">
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          Campagnes d'email
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />} 
          onClick={() => navigate('/campaigns/new')}
        >
          Nouvelle campagne
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {campaigns.length === 0 ? (
        <Paper elevation={2} sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Vous n'avez pas encore créé de campagne d'email.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Les campagnes vous permettent d'envoyer des emails à plusieurs destinataires à la fois.
          </Typography>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            onClick={() => navigate('/campaigns/new')}
          >
            Créer une campagne
          </Button>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow>
                <TableCell>Nom</TableCell>
                <TableCell>Statut</TableCell>
                <TableCell>Objet</TableCell>
                <TableCell>Destinataires</TableCell>
                <TableCell>Taux d'ouverture</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {campaigns.map((campaign) => (
                <TableRow key={campaign.campaignId}>
                  <TableCell>{campaign.name}</TableCell>
                  <TableCell>{getCampaignStatusChip(campaign.status)}</TableCell>
                  <TableCell>{campaign.subject}</TableCell>
                  <TableCell>{campaign.recipients.length}</TableCell>
                  <TableCell>
                    {campaign.status === 'sent' ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LinearProgress 
                          variant="determinate" 
                          value={(campaign.stats.opened / campaign.stats.delivered) * 100 || 0} 
                          sx={{ width: '100px', height: '8px', borderRadius: '4px' }}
                        />
                        <Typography variant="body2">
                          {Math.round((campaign.stats.opened / campaign.stats.delivered) * 100) || 0}%
                        </Typography>
                      </Box>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    {campaign.status === 'scheduled' 
                      ? `Planifiée le ${new Date(campaign.scheduledAt || '').toLocaleDateString()}`
                      : campaign.status === 'sent' 
                        ? `Envoyée le ${new Date(campaign.sentAt || '').toLocaleDateString()}`
                        : `Créée le ${new Date(campaign.createdAt).toLocaleDateString()}`
                    }
                  </TableCell>
                  <TableCell>
                    <IconButton 
                      aria-label="voir" 
                      onClick={() => handleView(campaign.campaignId)}
                      size="small"
                    >
                      <VisibilityIcon />
                    </IconButton>
                    {campaign.status === 'draft' && (
                      <>
                        <IconButton 
                          aria-label="modifier" 
                          onClick={() => handleEdit(campaign.campaignId)}
                          size="small"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton 
                          aria-label="envoyer" 
                          color="primary"
                          onClick={() => handleSendConfirm(campaign.campaignId)}
                          size="small"
                        >
                          <SendIcon />
                        </IconButton>
                        <IconButton 
                          aria-label="supprimer" 
                          color="error"
                          onClick={() => handleDeleteConfirm(campaign.campaignId)}
                          size="small"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Boîte de dialogue de confirmation d'envoi */}
      <Dialog
        open={sendDialogOpen}
        onClose={() => !isSending && setSendDialogOpen(false)}
      >
        <DialogTitle>Confirmer l'envoi</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Êtes-vous sûr de vouloir envoyer cette campagne maintenant ? Cette action est irréversible.
          </DialogContentText>
          {isSending && <LinearProgress sx={{ mt: 2 }} />}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSendDialogOpen(false)} disabled={isSending}>Annuler</Button>
          <Button onClick={handleSendCampaign} color="primary" autoFocus disabled={isSending}>
            Envoyer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Boîte de dialogue de confirmation de suppression */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Êtes-vous sûr de vouloir supprimer cette campagne ? Cette action est irréversible.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Annuler</Button>
          <Button onClick={handleDeleteCampaign} color="error" autoFocus>
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
};

export default CampaignList; 