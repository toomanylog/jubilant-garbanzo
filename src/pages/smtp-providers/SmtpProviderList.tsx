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
  Chip,
  IconButton,
  CircularProgress,
  Alert
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import Layout from '../../components/layout/Layout';
import { useAuth } from '../../contexts/AuthContext';
import { SmtpProvider, getSmtpProvidersByUserId } from '../../models/dynamodb';

const SmtpProviderList: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [providers, setProviders] = useState<SmtpProvider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProviders = async () => {
      if (!currentUser) return;
      
      try {
        const userProviders = await getSmtpProvidersByUserId(currentUser.userId);
        setProviders(userProviders);
      } catch (err: any) {
        console.error('Erreur lors de la récupération des fournisseurs SMTP:', err);
        setError(err.message || 'Une erreur est survenue');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProviders();
  }, [currentUser]);

  // Obtenir le libellé du type de fournisseur
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

  // Rendre la page pendant le chargement
  if (isLoading) {
    return (
      <Layout title="Fournisseurs SMTP">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress />
        </Box>
      </Layout>
    );
  }

  return (
    <Layout title="Fournisseurs SMTP">
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          Fournisseurs SMTP
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />} 
          onClick={() => navigate('/smtp-providers/new')}
        >
          Nouveau fournisseur
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {providers.length === 0 ? (
        <Paper elevation={2} sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Vous n'avez pas encore configuré de fournisseur SMTP.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Les fournisseurs SMTP sont nécessaires pour envoyer des emails depuis votre application.
          </Typography>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            onClick={() => navigate('/smtp-providers/new')}
          >
            Configurer un fournisseur
          </Button>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow>
                <TableCell>Nom</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Informations de connexion</TableCell>
                <TableCell>Statut</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {providers.map((provider) => (
                <TableRow key={provider.providerId}>
                  <TableCell>{provider.name}</TableCell>
                  <TableCell>{getProviderTypeLabel(provider.providerType)}</TableCell>
                  <TableCell>
                    {provider.providerType === 'aws_ses' && (
                      <>Région: {provider.region}<br />Access Key: {provider.username?.substring(0, 6)}...</>
                    )}
                    {provider.providerType === 'custom_smtp' && (
                      <>Host: {provider.host}<br />Port: {provider.port}</>
                    )}
                    {provider.providerType === 'sendgrid' && (
                      <>API Key: {provider.apiKey?.substring(0, 6)}...</>
                    )}
                    {(provider.providerType === 'office365' || provider.providerType === 'mailjet') && (
                      <>{provider.username?.substring(0, 6)}...</>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={provider.isDefault ? 'Par défaut' : 'Actif'} 
                      color={provider.isDefault ? 'success' : 'primary'} 
                      size="small" 
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton 
                      aria-label="modifier" 
                      onClick={() => navigate(`/smtp-providers/${provider.providerId}`)}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton 
                      aria-label="supprimer" 
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Layout>
  );
};

export default SmtpProviderList; 