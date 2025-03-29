import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Card,
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Chip,
  IconButton,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Tooltip
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import Layout from '../../components/layout/Layout';
import { useAuth } from '../../contexts/AuthContext';
import { SmtpProvider, getSmtpProvidersByUserId, deleteSmtpProvider } from '../../models/dynamodb';
import { toast } from 'react-toastify';

const SmtpProviderList: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [providers, setProviders] = useState<SmtpProvider[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [providerToDelete, setProviderToDelete] = useState<SmtpProvider | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchProviders = async () => {
    if (!currentUser) return;
    
    try {
      setLoading(true);
      const providersData = await getSmtpProvidersByUserId(currentUser.userId);
      setProviders(providersData);
    } catch (err: any) {
      console.error('Erreur lors du chargement des fournisseurs SMTP:', err);
      setError(err.message || 'Une erreur est survenue lors du chargement des fournisseurs SMTP');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders();
  }, [currentUser]);

  const getProviderTypeLabel = (type: string): string => {
    switch (type) {
      case 'aws_ses':
        return 'Amazon SES';
      case 'custom_smtp':
        return 'SMTP Personnalisé';
      case 'office365':
        return 'Office 365';
      case 'sendgrid':
        return 'SendGrid';
      case 'mailjet':
        return 'Mailjet';
      default:
        return type;
    }
  };

  const getProviderTypeIcon = (type: string) => {
    switch (type) {
      case 'aws_ses':
        return '🌩️'; // Cloud pour AWS
      case 'custom_smtp':
        return '🔧'; // Outil pour custom
      case 'office365':
        return '📧'; // Email pour Office
      case 'sendgrid':
        return '📤'; // Envoi pour SendGrid
      case 'mailjet':
        return '✈️'; // Avion pour Mailjet
      default:
        return '📨';
    }
  };

  const handleEdit = (providerId: string) => {
    navigate(`/smtp-providers/${providerId}`);
  };

  const handleDeleteClick = (provider: SmtpProvider) => {
    setProviderToDelete(provider);
    setDeleteDialogOpen(true);
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setProviderToDelete(null);
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    
    console.log('⚠️ DEBUG SmtpProviderList - Suppression du fournisseur:', providerToDelete);
    
    try {
      if (providerToDelete) {
        const result = await deleteSmtpProvider(providerToDelete.providerId);
        console.log('⚠️ DEBUG SmtpProviderList - Résultat de la suppression:', result);
        
        if (result) {
          // Mettre à jour la liste après la suppression
          setProviders(providers.filter(provider => provider.providerId !== providerToDelete.providerId));
          toast.success('Fournisseur SMTP supprimé avec succès');
        } else {
          toast.error('Erreur lors de la suppression du fournisseur SMTP');
        }
      }
    } catch (error) {
      console.error('Erreur lors de la suppression du fournisseur SMTP:', error);
      toast.error('Erreur lors de la suppression du fournisseur SMTP');
    } finally {
      setDeleteDialogOpen(false);
      setProviderToDelete(null);
      setIsDeleting(false);
      
      // Recharger la liste pour s'assurer qu'elle est à jour
      fetchProviders();
    }
  };

  if (loading) {
    return (
      <Layout title="Fournisseurs SMTP">
        <Box className="flex justify-center items-center h-[50vh]">
          <CircularProgress />
        </Box>
      </Layout>
    );
  }

  return (
    <Layout title="Fournisseurs SMTP">
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <Typography variant="h4" component="h1" className="font-bold text-gray-900 dark:text-white">
              Fournisseurs SMTP
            </Typography>
            <Typography variant="body2" className="mt-1 text-gray-600 dark:text-gray-400">
              Configurez vos services d'envoi d'emails pour vos campagnes
            </Typography>
          </div>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            onClick={() => navigate('/smtp-providers/new')}
            className="bg-primary hover:bg-primary/90 text-white shadow-md"
            size="large"
          >
            Nouveau fournisseur
          </Button>
        </div>

        {error && (
          <Alert severity="error" className="rounded-lg">
            {error}
          </Alert>
        )}

        {providers.length === 0 ? (
          <Card className="border border-gray-200 dark:border-gray-700 shadow-sm rounded-xl overflow-hidden">
            <div className="p-8 text-center">
              <div className="rounded-full bg-primary/10 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <MailOutlineIcon className="h-8 w-8 text-primary" />
              </div>
              <Typography variant="h6" className="font-semibold text-gray-900 dark:text-white mb-2">
                Aucun fournisseur SMTP configuré
              </Typography>
              <Typography variant="body2" className="text-gray-600 dark:text-gray-400 max-w-md mx-auto mb-6">
                Les fournisseurs SMTP sont nécessaires pour envoyer des emails depuis votre application. Configurez votre premier service d'envoi d'emails.
              </Typography>
              <Button 
                variant="contained" 
                startIcon={<AddIcon />} 
                onClick={() => navigate('/smtp-providers/new')}
                size="large"
                className="bg-primary hover:bg-primary/90"
              >
                Configurer un fournisseur
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
                    <TableCell className="font-semibold text-gray-900 dark:text-white">Type</TableCell>
                    <TableCell className="font-semibold text-gray-900 dark:text-white">Informations de connexion</TableCell>
                    <TableCell className="font-semibold text-gray-900 dark:text-white">Statut</TableCell>
                    <TableCell className="font-semibold text-gray-900 dark:text-white">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {providers.map((provider) => (
                    <TableRow 
                      key={provider.providerId}
                      hover
                      className="transition-colors border-b border-gray-200 dark:border-gray-700 cursor-pointer"
                      onClick={() => handleEdit(provider.providerId)}
                    >
                      <TableCell className="font-medium text-gray-900 dark:text-white">
                        {provider.name}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-xl" role="img" aria-label={provider.providerType}>
                            {getProviderTypeIcon(provider.providerType)}
                          </span>
                          <span className="text-gray-700 dark:text-gray-300">
                            {getProviderTypeLabel(provider.providerType)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-700 dark:text-gray-300">
                        {provider.providerType === 'aws_ses' && (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1">
                              <span className="text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 px-2 py-0.5 rounded">Région</span>
                              <span>{provider.region}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 px-2 py-0.5 rounded">Access Key</span>
                              <span className="font-mono">{provider.username?.substring(0, 6)}...</span>
                            </div>
                          </div>
                        )}
                        {provider.providerType === 'custom_smtp' && (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1">
                              <span className="text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300 px-2 py-0.5 rounded">Host</span>
                              <span>{provider.host}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300 px-2 py-0.5 rounded">Port</span>
                              <span>{provider.port}</span>
                            </div>
                          </div>
                        )}
                        {provider.providerType === 'sendgrid' && (
                          <div className="flex items-center gap-1">
                            <span className="text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 px-2 py-0.5 rounded">API Key</span>
                            <span className="font-mono">{provider.apiKey?.substring(0, 6)}...</span>
                          </div>
                        )}
                        {(provider.providerType === 'office365' || provider.providerType === 'mailjet') && (
                          <div className="flex items-center gap-1">
                            <span className="text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300 px-2 py-0.5 rounded">Username</span>
                            <span className="font-mono">{provider.username?.substring(0, 6)}...</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={provider.isDefault ? 'Par défaut' : 'Actif'} 
                          color={provider.isDefault ? 'success' : 'primary'} 
                          size="small"
                          className="font-medium"
                        />
                      </TableCell>
                      <TableCell className="space-x-1" onClick={(e) => e.stopPropagation()}>
                        <Tooltip title="Modifier">
                          <IconButton 
                            aria-label="modifier" 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(provider.providerId);
                            }}
                            size="small"
                            className="text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Supprimer">
                          <IconButton 
                            aria-label="supprimer" 
                            color="error"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteClick(provider);
                            }}
                            size="small"
                            className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        )}

        {/* Boîte de dialogue de confirmation de suppression */}
        <Dialog
          open={deleteDialogOpen}
          onClose={handleDeleteCancel}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            className: 'rounded-lg'
          }}
        >
          <DialogTitle className="text-lg font-semibold">Confirmer la suppression</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Êtes-vous sûr de vouloir supprimer ce fournisseur SMTP ? Cette action est irréversible et pourrait affecter vos campagnes d'emails.
            </DialogContentText>
          </DialogContent>
          <DialogActions className="p-4">
            <Button 
              onClick={handleDeleteCancel}
              className="text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Annuler
            </Button>
            <Button 
              onClick={handleDeleteConfirm} 
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

export default SmtpProviderList; 