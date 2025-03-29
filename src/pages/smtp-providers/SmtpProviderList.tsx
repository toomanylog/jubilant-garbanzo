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
  Tooltip,
  Checkbox,
  FormControlLabel,
  LinearProgress,
  FormGroup
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import SendIcon from '@mui/icons-material/Send';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import Layout from '../../components/layout/Layout';
import { useAuth } from '../../contexts/AuthContext';
import { SmtpProvider, getSmtpProvidersByUserId, deleteSmtpProvider, getUserSettings } from '../../models/dynamodb';
import { SmtpProviderService } from '../../services/smtp-provider-service';
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

  // États pour le test SMTP
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [providerToTest, setProviderToTest] = useState<SmtpProvider | null>(null);
  const [testEmails, setTestEmails] = useState<string[]>([]);
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [isTesting, setIsTesting] = useState(false);
  const [testResults, setTestResults] = useState<Array<{ email: string; success: boolean; error?: string }>>([]);
  const [testCompleted, setTestCompleted] = useState(false);

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

  const fetchTestEmails = async () => {
    if (!currentUser) return;
    
    try {
      const settings = await getUserSettings(currentUser.userId);
      if (settings && settings.testEmails) {
        setTestEmails(settings.testEmails);
      } else {
        setTestEmails([]);
      }
    } catch (err) {
      console.error('Erreur lors du chargement des adresses email de test:', err);
      toast.error('Impossible de charger les adresses email de test');
    }
  };

  useEffect(() => {
    fetchProviders();
    fetchTestEmails();
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

  const handleTestClick = (provider: SmtpProvider) => {
    setProviderToTest(provider);
    setSelectedEmails([]);
    setTestResults([]);
    setTestCompleted(false);
    setTestDialogOpen(true);
  };

  const handleTestCancel = () => {
    setTestDialogOpen(false);
    setProviderToTest(null);
  };

  const handleEmailSelect = (email: string) => {
    if (selectedEmails.includes(email)) {
      setSelectedEmails(selectedEmails.filter(e => e !== email));
    } else {
      setSelectedEmails([...selectedEmails, email]);
    }
  };

  const handleSelectAllEmails = () => {
    if (selectedEmails.length === testEmails.length) {
      setSelectedEmails([]);
    } else {
      setSelectedEmails([...testEmails]);
    }
  };

  const handleTestConfirm = async () => {
    if (!providerToTest || selectedEmails.length === 0) return;
    
    setIsTesting(true);
    setTestCompleted(false);
    setTestResults([]);
    
    try {
      const result = await SmtpProviderService.testSmtpProvider(
        providerToTest.providerId,
        selectedEmails
      );
      
      setTestResults(result.results);
      
      if (result.success) {
        toast.success('Test SMTP réussi !');
      } else {
        toast.error(`Erreur lors du test : ${result.error}`);
      }
      
      setTestCompleted(true);
    } catch (err: any) {
      console.error('Erreur lors du test du fournisseur SMTP:', err);
      toast.error('Une erreur est survenue lors du test');
    } finally {
      setIsTesting(false);
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
                    <TableCell>Nom</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Hôte</TableCell>
                    <TableCell>Région</TableCell>
                    <TableCell>Par défaut</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {providers.map((provider) => (
                    <TableRow key={provider.providerId}>
                      <TableCell className="font-medium">{provider.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{getProviderTypeIcon(provider.providerType)}</span>
                          {getProviderTypeLabel(provider.providerType)}
                        </div>
                      </TableCell>
                      <TableCell>{provider.host || '—'}</TableCell>
                      <TableCell>{provider.region || '—'}</TableCell>
                      <TableCell>
                        {provider.isDefault ? (
                          <Chip 
                            label="Par défaut" 
                            color="primary" 
                            size="small"
                            className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                          />
                        ) : '—'}
                      </TableCell>
                      <TableCell align="right">
                        <div className="flex items-center justify-end gap-2">
                          <Tooltip title="Tester">
                            <IconButton onClick={() => handleTestClick(provider)} color="primary">
                              <SendIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Modifier">
                            <IconButton onClick={() => handleEdit(provider.providerId)} color="primary">
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Supprimer">
                            <IconButton onClick={() => handleDeleteClick(provider)} color="error">
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        )}
      </div>

      {/* Dialogue de confirmation de suppression */}
      <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Êtes-vous sûr de vouloir supprimer le fournisseur SMTP "{providerToDelete?.name}" ? Cette action est irréversible.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} disabled={isDeleting}>
            Annuler
          </Button>
          <Button 
            onClick={handleDeleteConfirm} 
            color="error" 
            disabled={isDeleting}
            startIcon={isDeleting ? <CircularProgress size={24} /> : <DeleteIcon />}
          >
            {isDeleting ? 'Suppression...' : 'Supprimer'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialogue de test */}
      <Dialog 
        open={testDialogOpen} 
        onClose={handleTestCancel}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Tester le fournisseur SMTP
        </DialogTitle>
        <DialogContent>
          {testEmails.length === 0 ? (
            <Box className="my-4">
              <Alert severity="warning" className="mb-3">
                Aucune adresse email de test n'est configurée.
              </Alert>
              <Typography variant="body2" className="mb-2">
                Veuillez d'abord configurer des adresses email de test dans les paramètres de l'application.
              </Typography>
              <Button 
                variant="outlined" 
                onClick={() => {
                  handleTestCancel();
                  navigate('/settings');
                }}
              >
                Aller aux paramètres
              </Button>
            </Box>
          ) : (
            <>
              <DialogContentText className="mb-4">
                Sélectionnez les adresses email auxquelles vous souhaitez envoyer un email de test pour vérifier la configuration de "{providerToTest?.name}".
              </DialogContentText>
              
              <FormGroup className="mb-4">
                <FormControlLabel
                  control={
                    <Checkbox 
                      checked={selectedEmails.length === testEmails.length}
                      indeterminate={selectedEmails.length > 0 && selectedEmails.length < testEmails.length}
                      onChange={handleSelectAllEmails}
                    />
                  }
                  label={<Typography variant="subtitle2">Sélectionner tout</Typography>}
                />
                
                <Box className="pl-4">
                  {testEmails.map((email) => (
                    <FormControlLabel
                      key={email}
                      control={
                        <Checkbox 
                          checked={selectedEmails.includes(email)}
                          onChange={() => handleEmailSelect(email)}
                        />
                      }
                      label={email}
                    />
                  ))}
                </Box>
              </FormGroup>
              
              {isTesting && (
                <Box className="mb-4">
                  <Typography variant="body2" className="mb-2 text-center">
                    Envoi des emails de test en cours...
                  </Typography>
                  <LinearProgress />
                </Box>
              )}
              
              {testCompleted && testResults.length > 0 && (
                <Box className="mb-4">
                  <Typography variant="subtitle2" className="mb-2">
                    Résultats du test:
                  </Typography>
                  <Box className="bg-gray-50 dark:bg-gray-800 p-2 rounded-md">
                    {testResults.map((result, index) => (
                      <Box 
                        key={index} 
                        className="flex items-center gap-2 p-2 border-b last:border-0 border-gray-200 dark:border-gray-700"
                      >
                        {result.success ? (
                          <CheckCircleIcon className="text-green-500" fontSize="small" />
                        ) : (
                          <ErrorIcon className="text-red-500" fontSize="small" />
                        )}
                        <Typography variant="body2">
                          {result.email}
                        </Typography>
                        {!result.success && result.error && (
                          <Typography variant="caption" className="text-red-500">
                            {result.error.length > 50 ? result.error.substring(0, 50) + '...' : result.error}
                          </Typography>
                        )}
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleTestCancel} disabled={isTesting}>
            Fermer
          </Button>
          {testEmails.length > 0 && (
            <Button 
              onClick={handleTestConfirm} 
              color="primary" 
              variant="contained"
              disabled={isTesting || selectedEmails.length === 0}
              startIcon={isTesting ? <CircularProgress size={24} /> : <SendIcon />}
            >
              {isTesting ? 'Test en cours...' : 'Lancer le test'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Layout>
  );
};

export default SmtpProviderList; 