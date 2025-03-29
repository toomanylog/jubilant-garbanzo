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
  Badge,
  Tooltip,
  Pagination
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SendIcon from '@mui/icons-material/Send';
import AddIcon from '@mui/icons-material/Add';
import BarChartIcon from '@mui/icons-material/BarChart';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import ScheduleIcon from '@mui/icons-material/Schedule';
import Layout from '../../components/layout/Layout';
import { useAuth } from '../../contexts/AuthContext';
import { EmailCampaign, getEmailCampaignsByUserId, deleteEmailCampaign } from '../../models/dynamodb';
import { CampaignService } from '../../services/campaign-service';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const CampaignList: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [filteredCampaigns, setFilteredCampaigns] = useState<EmailCampaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [campaignToDelete, setCampaignToDelete] = useState<EmailCampaign | null>(null);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [campaignToSend, setCampaignToSend] = useState<EmailCampaign | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentFilter, setCurrentFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(10);

  useEffect(() => {
    const fetchCampaigns = async () => {
      if (!currentUser) return;
      
      try {
        setIsLoading(true);
        const userCampaigns = await getEmailCampaignsByUserId(currentUser.userId);
        
        // Trier les campagnes par date de création (les plus récentes d'abord)
        userCampaigns.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        
        setCampaigns(userCampaigns);
        setFilteredCampaigns(userCampaigns);
      } catch (err: any) {
        console.error('Erreur lors de la récupération des campagnes:', err);
        setError(err.message || 'Une erreur est survenue lors du chargement des campagnes');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCampaigns();
  }, [currentUser]);

  // Filtrer les campagnes en fonction du statut sélectionné
  useEffect(() => {
    if (currentFilter === 'all') {
      setFilteredCampaigns(campaigns);
    } else {
      setFilteredCampaigns(campaigns.filter(campaign => campaign.status === currentFilter));
    }
    setPage(1); // Réinitialiser la pagination lors du changement de filtre
  }, [currentFilter, campaigns]);

  // Pagination des campagnes
  const paginatedCampaigns = filteredCampaigns.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  const handleFilterChange = (filter: string) => {
    setCurrentFilter(filter);
  };

  const handleEdit = (event: React.MouseEvent, campaignId: string) => {
    event.stopPropagation();
    navigate(`/campaigns/${campaignId}`);
  };

  const handleView = (campaignId: string) => {
    navigate(`/campaigns/${campaignId}/details`);
  };

  const handleSendClick = (event: React.MouseEvent, campaign: EmailCampaign) => {
    event.stopPropagation();
    setCampaignToSend(campaign);
    setSendDialogOpen(true);
  };

  const handleSendCampaign = async () => {
    if (!campaignToSend) return;
    
    setIsSending(true);
    try {
      const success = await CampaignService.sendCampaign(campaignToSend.campaignId);
      
      if (success) {
        toast.success('La campagne a été envoyée avec succès');
        
        // Mettre à jour l'état de la campagne localement
        setCampaigns(prevCampaigns => 
          prevCampaigns.map(campaign => 
            campaign.campaignId === campaignToSend.campaignId 
              ? { 
                  ...campaign, 
                  status: 'sending', 
                  sentAt: new Date().toISOString() 
                } 
              : campaign
          )
        );
      } else {
        toast.error('Échec de l\'envoi de la campagne');
      }
    } catch (err: any) {
      console.error('Erreur lors de l\'envoi de la campagne:', err);
      toast.error(err.message || 'Une erreur est survenue lors de l\'envoi');
    } finally {
      setSendDialogOpen(false);
      setCampaignToSend(null);
      setIsSending(false);
    }
  };

  const handleDeleteClick = (event: React.MouseEvent, campaign: EmailCampaign) => {
    event.stopPropagation();
    setCampaignToDelete(campaign);
    setDeleteDialogOpen(true);
  };

  const handleDeleteCampaign = async () => {
    if (!campaignToDelete) return;
    
    setIsDeleting(true);
    try {
      const success = await deleteEmailCampaign(campaignToDelete.campaignId);
      if (success) {
        setCampaigns(campaigns.filter(c => c.campaignId !== campaignToDelete.campaignId));
        toast.success('Campagne supprimée avec succès');
      } else {
        toast.error('Erreur lors de la suppression de la campagne');
      }
    } catch (err: any) {
      console.error('Erreur lors de la suppression de la campagne:', err);
      toast.error(err.message || 'Une erreur est survenue lors de la suppression');
    } finally {
      setDeleteDialogOpen(false);
      setCampaignToDelete(null);
      setIsDeleting(false);
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

  const getFormattedDate = (dateString: string | null) => {
    if (!dateString) return '—';
    
    try {
      return format(new Date(dateString), 'dd MMM yyyy, HH:mm', { locale: fr });
    } catch (e) {
      console.error('Erreur lors du formatage de la date:', e);
      return dateString;
    }
  };

  const calculateOpenRate = (campaign: EmailCampaign) => {
    if (!campaign.stats.sent || campaign.stats.sent === 0) return 0;
    return Math.round((campaign.stats.opened / campaign.stats.sent) * 100);
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

        <Card className="border border-gray-200 dark:border-gray-700 shadow-sm rounded-xl overflow-hidden">
          {campaigns.length === 0 ? (
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
          ) : (
            <>
              {/* Filtres de statut */}
              <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }} className="bg-gray-50 dark:bg-gray-800">
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  <Chip 
                    label="Toutes" 
                    onClick={() => handleFilterChange('all')} 
                    color={currentFilter === 'all' ? 'primary' : 'default'}
                    variant={currentFilter === 'all' ? 'filled' : 'outlined'}
                    className="cursor-pointer"
                  />
                  <Chip 
                    label="Brouillons" 
                    onClick={() => handleFilterChange('draft')} 
                    color={currentFilter === 'draft' ? 'primary' : 'default'}
                    variant={currentFilter === 'draft' ? 'filled' : 'outlined'}
                    className="cursor-pointer"
                  />
                  <Chip 
                    label="Planifiées" 
                    onClick={() => handleFilterChange('scheduled')} 
                    color={currentFilter === 'scheduled' ? 'primary' : 'default'}
                    variant={currentFilter === 'scheduled' ? 'filled' : 'outlined'}
                    className="cursor-pointer"
                  />
                  <Chip 
                    label="En cours" 
                    onClick={() => handleFilterChange('sending')} 
                    color={currentFilter === 'sending' ? 'primary' : 'default'}
                    variant={currentFilter === 'sending' ? 'filled' : 'outlined'}
                    className="cursor-pointer"
                  />
                  <Chip 
                    label="Envoyées" 
                    onClick={() => handleFilterChange('sent')} 
                    color={currentFilter === 'sent' ? 'primary' : 'default'}
                    variant={currentFilter === 'sent' ? 'filled' : 'outlined'}
                    className="cursor-pointer"
                  />
                  <Chip 
                    label="Échecs" 
                    onClick={() => handleFilterChange('failed')} 
                    color={currentFilter === 'failed' ? 'primary' : 'default'}
                    variant={currentFilter === 'failed' ? 'filled' : 'outlined'}
                    className="cursor-pointer"
                  />
                </Box>
              </Box>

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
                    {paginatedCampaigns.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center" className="py-8">
                          <Typography variant="body1" className="text-gray-500">
                            Aucune campagne ne correspond à ce filtre
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedCampaigns.map((campaign) => (
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
                            {campaign.status === 'draft' || campaign.status === 'scheduled' ? (
                              <Typography variant="body2" className="text-gray-500">—</Typography>
                            ) : (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <LinearProgress 
                                  variant="determinate" 
                                  value={calculateOpenRate(campaign)} 
                                  sx={{ 
                                    width: 100,
                                    height: 10,
                                    borderRadius: 5
                                  }}
                                />
                                <Typography variant="body2">
                                  {calculateOpenRate(campaign)}%
                                </Typography>
                              </Box>
                            )}
                          </TableCell>
                          <TableCell className="text-gray-700 dark:text-gray-300">
                            {campaign.status === 'draft' ? (
                              <span className="text-gray-500">Brouillon</span>
                            ) : campaign.status === 'scheduled' ? (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <ScheduleIcon fontSize="small" color="primary" />
                                <span>{getFormattedDate(campaign.scheduledAt)}</span>
                              </Box>
                            ) : (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <CalendarTodayIcon fontSize="small" />
                                <span>{getFormattedDate(campaign.sentAt)}</span>
                              </Box>
                            )}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                              <Tooltip title="Voir les détails">
                                <IconButton size="small" onClick={(e) => {
                                  e.stopPropagation();
                                  handleView(campaign.campaignId);
                                }}>
                                  <VisibilityIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              
                              <Tooltip title="Modifier">
                                <IconButton 
                                  size="small" 
                                  onClick={(e) => handleEdit(e, campaign.campaignId)}
                                  disabled={campaign.status !== 'draft'}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              
                              {campaign.status === 'draft' && (
                                <Tooltip title="Envoyer">
                                  <IconButton 
                                    size="small" 
                                    color="primary"
                                    onClick={(e) => handleSendClick(e, campaign)}
                                  >
                                    <SendIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              )}
                              
                              <Tooltip title="Supprimer">
                                <IconButton 
                                  size="small" 
                                  color="error"
                                  onClick={(e) => handleDeleteClick(e, campaign)}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              
              {/* Pagination */}
              {filteredCampaigns.length > rowsPerPage && (
                <Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
                  <Pagination 
                    count={Math.ceil(filteredCampaigns.length / rowsPerPage)} 
                    page={page} 
                    onChange={handlePageChange}
                    color="primary"
                  />
                </Box>
              )}
            </>
          )}
        </Card>
      </div>

      {/* Dialogue de confirmation d'envoi */}
      <Dialog open={sendDialogOpen} onClose={() => !isSending && setSendDialogOpen(false)}>
        <DialogTitle>Envoyer la campagne</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Êtes-vous sûr de vouloir envoyer cette campagne maintenant ? Cette action ne peut pas être annulée.
            {campaignToSend && (
              <>
                <br /><br />
                <strong>Nom de la campagne :</strong> {campaignToSend.name}<br />
                <strong>Nombre de destinataires :</strong> {campaignToSend.recipients.length}
              </>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setSendDialogOpen(false)} 
            disabled={isSending}
          >
            Annuler
          </Button>
          <Button 
            onClick={handleSendCampaign} 
            color="primary" 
            variant="contained"
            disabled={isSending}
            startIcon={isSending ? <CircularProgress size={20} /> : <SendIcon />}
          >
            {isSending ? 'Envoi en cours...' : 'Envoyer'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialogue de confirmation de suppression */}
      <Dialog open={deleteDialogOpen} onClose={() => !isDeleting && setDeleteDialogOpen(false)}>
        <DialogTitle>Supprimer la campagne</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Êtes-vous sûr de vouloir supprimer cette campagne ? Cette action ne peut pas être annulée.
            {campaignToDelete && (
              <>
                <br /><br />
                <strong>Nom de la campagne :</strong> {campaignToDelete.name}
              </>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setDeleteDialogOpen(false)} 
            disabled={isDeleting}
          >
            Annuler
          </Button>
          <Button 
            onClick={handleDeleteCampaign} 
            color="error" 
            variant="contained"
            disabled={isDeleting}
            startIcon={isDeleting ? <CircularProgress size={20} /> : <DeleteIcon />}
          >
            {isDeleting ? 'Suppression...' : 'Supprimer'}
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
};

export default CampaignList; 