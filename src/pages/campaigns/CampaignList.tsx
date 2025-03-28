import React, { useEffect, useState } from 'react';
import { 
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
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  LinearProgress,
  Box,
  Alert,
  Card,
  Badge
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SendIcon from '@mui/icons-material/Send';
import AddIcon from '@mui/icons-material/Add';
import BarChartIcon from '@mui/icons-material/BarChart';
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

  const handleEdit = (campaignId: string) => {
    navigate(`/campaigns/${campaignId}`);
  };

  const handleView = (campaignId: string) => {
    navigate(`/campaigns/${campaignId}/details`);
  };

  const handleSendConfirm = (campaignId: string) => {
    setCampaignToSend(campaignId);
    setSendDialogOpen(true);
  };

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

  const handleDeleteConfirm = (campaignId: string) => {
    setCampaignToDelete(campaignId);
    setDeleteDialogOpen(true);
  };

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

  if (isLoading) {
    return (
      <Layout title="Campagnes d'email">
        <Box className="flex justify-center items-center h-[50vh]">
          <CircularProgress />
        </Box>
      </Layout>
    );
  }

  return (
    <Layout title="Campagnes d'email">
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <Typography variant="h4" component="h1" className="font-bold text-gray-900 dark:text-white">
              Campagnes d'email
            </Typography>
            <Typography variant="body2" className="mt-1 text-gray-600 dark:text-gray-400">
              Gérez et suivez toutes vos campagnes d'email en un seul endroit
            </Typography>
          </div>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            onClick={() => navigate('/campaigns/new')}
            className="bg-primary hover:bg-primary/90 text-white shadow-md"
            size="large"
          >
            Nouvelle campagne
          </Button>
        </div>

        {error && (
          <Alert severity="error" className="rounded-lg">
            {error}
          </Alert>
        )}

        {campaigns.length === 0 ? (
          <Card className="border border-gray-200 dark:border-gray-700 shadow-sm rounded-xl overflow-hidden">
            <div className="p-8 text-center">
              <div className="rounded-full bg-primary/10 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <BarChartIcon className="h-8 w-8 text-primary" />
              </div>
              <Typography variant="h6" className="font-semibold text-gray-900 dark:text-white mb-2">
                Aucune campagne pour le moment
              </Typography>
              <Typography variant="body2" className="text-gray-600 dark:text-gray-400 max-w-md mx-auto mb-6">
                Les campagnes vous permettent d'envoyer des emails à plusieurs destinataires à la fois et de suivre leurs performances.
              </Typography>
              <Button 
                variant="contained" 
                startIcon={<AddIcon />} 
                onClick={() => navigate('/campaigns/new')}
                size="large"
                className="bg-primary hover:bg-primary/90"
              >
                Créer ma première campagne
              </Button>
            </div>
          </Card>
        ) : (
          <Card className="border border-gray-200 dark:border-gray-700 shadow-sm rounded-xl overflow-hidden">
            <TableContainer>
              <Table>
                <TableHead className="bg-gray-50 dark:bg-gray-800">
                  <TableRow>
                    <TableCell className="font-semibold text-gray-900 dark:text-white">Nom</TableCell>
                    <TableCell className="font-semibold text-gray-900 dark:text-white">Statut</TableCell>
                    <TableCell className="font-semibold text-gray-900 dark:text-white">Objet</TableCell>
                    <TableCell className="font-semibold text-gray-900 dark:text-white">Destinataires</TableCell>
                    <TableCell className="font-semibold text-gray-900 dark:text-white">Taux d'ouverture</TableCell>
                    <TableCell className="font-semibold text-gray-900 dark:text-white">Date</TableCell>
                    <TableCell className="font-semibold text-gray-900 dark:text-white">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {campaigns.map((campaign) => (
                    <TableRow 
                      key={campaign.campaignId}
                      hover
                      className="transition-colors border-b border-gray-200 dark:border-gray-700 cursor-pointer"
                      onClick={() => handleView(campaign.campaignId)}
                    >
                      <TableCell className="font-medium text-gray-900 dark:text-white">
                        {campaign.name}
                      </TableCell>
                      <TableCell>{getCampaignStatusChip(campaign.status)}</TableCell>
                      <TableCell className="text-gray-700 dark:text-gray-300">
                        {campaign.subject}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          badgeContent={campaign.recipients.length} 
                          color="primary"
                          className="ml-2"
                        >
                          <span className="text-gray-700 dark:text-gray-300">destinataires</span>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {campaign.status === 'sent' ? (
                          <Box className="flex items-center gap-2">
                            <LinearProgress 
                              variant="determinate" 
                              value={(campaign.stats.opened / campaign.stats.delivered) * 100 || 0} 
                              className="w-20 h-2 rounded-full"
                            />
                            <Typography variant="body2" className="font-medium">
                              {Math.round((campaign.stats.opened / campaign.stats.delivered) * 100) || 0}%
                            </Typography>
                          </Box>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-gray-700 dark:text-gray-300">
                        {campaign.status === 'scheduled' 
                          ? `Planifiée le ${new Date(campaign.scheduledAt || '').toLocaleDateString()}`
                          : campaign.status === 'sent' 
                            ? `Envoyée le ${new Date(campaign.sentAt || '').toLocaleDateString()}`
                            : `Créée le ${new Date(campaign.createdAt).toLocaleDateString()}`
                        }
                      </TableCell>
                      <TableCell className="space-x-1" onClick={(e) => e.stopPropagation()}>
                        <IconButton 
                          aria-label="voir" 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleView(campaign.campaignId);
                          }}
                          size="small"
                          className="text-primary hover:bg-primary/10"
                        >
                          <VisibilityIcon />
                        </IconButton>
                        {campaign.status === 'draft' && (
                          <>
                            <IconButton 
                              aria-label="modifier" 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(campaign.campaignId);
                              }}
                              size="small"
                              className="text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                            >
                              <EditIcon />
                            </IconButton>
                            <IconButton 
                              aria-label="envoyer" 
                              color="primary"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSendConfirm(campaign.campaignId);
                              }}
                              size="small"
                              className="text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                            >
                              <SendIcon />
                            </IconButton>
                            <IconButton 
                              aria-label="supprimer" 
                              color="error"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteConfirm(campaign.campaignId);
                              }}
                              size="small"
                              className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
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
          </Card>
        )}

        {/* Boîte de dialogue de confirmation d'envoi */}
        <Dialog
          open={sendDialogOpen}
          onClose={() => !isSending && setSendDialogOpen(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            className: 'rounded-lg'
          }}
        >
          <DialogTitle className="text-lg font-semibold">Confirmer l'envoi</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Êtes-vous sûr de vouloir envoyer cette campagne maintenant ? Cette action est irréversible.
            </DialogContentText>
            {isSending && <LinearProgress className="mt-4" />}
          </DialogContent>
          <DialogActions className="p-4">
            <Button 
              onClick={() => setSendDialogOpen(false)} 
              disabled={isSending}
              className="text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Annuler
            </Button>
            <Button 
              onClick={handleSendCampaign} 
              variant="contained"
              color="primary" 
              autoFocus 
              disabled={isSending}
              className="bg-primary hover:bg-primary/90 text-white"
            >
              Envoyer
            </Button>
          </DialogActions>
        </Dialog>

        {/* Boîte de dialogue de confirmation de suppression */}
        <Dialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            className: 'rounded-lg'
          }}
        >
          <DialogTitle className="text-lg font-semibold">Confirmer la suppression</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Êtes-vous sûr de vouloir supprimer cette campagne ? Cette action est irréversible.
            </DialogContentText>
          </DialogContent>
          <DialogActions className="p-4">
            <Button 
              onClick={() => setDeleteDialogOpen(false)}
              className="text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Annuler
            </Button>
            <Button 
              onClick={handleDeleteCampaign} 
              color="error" 
              variant="contained"
              autoFocus
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Supprimer
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    </Layout>
  );
};

export default CampaignList; 