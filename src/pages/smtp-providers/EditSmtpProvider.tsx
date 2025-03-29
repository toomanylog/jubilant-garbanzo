import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, CircularProgress, Alert } from '@mui/material';
import Layout from '../../components/layout/Layout';
import SmtpProviderForm from './SmtpProviderForm';
import { useAuth } from '../../contexts/AuthContext';
import { SmtpProvider, getSmtpProviderById } from '../../models/dynamodb';

const EditSmtpProvider: React.FC = () => {
  const { providerId } = useParams<{ providerId: string }>();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [provider, setProvider] = useState<SmtpProvider | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProvider = async () => {
      if (!currentUser || !providerId) {
        console.error("⚠️ EditSmtpProvider - User ou providerId manquant:", { 
          currentUser: !!currentUser, 
          providerId 
        });
        setIsLoading(false);
        return;
      }
      
      console.log("⚠️ EditSmtpProvider - Début du chargement du fournisseur SMTP:", providerId);
      
      try {
        setIsLoading(true);
        console.log("⚠️ EditSmtpProvider - Appel de getSmtpProviderById avec providerId:", providerId);
        
        // Récupération du fournisseur SMTP par son ID
        const providerData = await getSmtpProviderById(providerId);
        console.log("⚠️ EditSmtpProvider - Fournisseur récupéré:", providerData ? providerData.name : "null");
        
        // Vérifier que le fournisseur appartient bien à l'utilisateur courant
        if (providerData.userId !== currentUser.userId) {
          console.error("⚠️ EditSmtpProvider - Le fournisseur n'appartient pas à l'utilisateur:", {
            providerUserId: providerData.userId,
            currentUserId: currentUser.userId
          });
          setError("Vous n'avez pas les droits pour modifier ce fournisseur SMTP");
          return;
        }
        
        // Mise à jour de l'état avec les données du fournisseur
        console.log("⚠️ EditSmtpProvider - Mise à jour du state avec le fournisseur");
        setProvider(providerData);
      } catch (err: any) {
        console.error('⚠️ EditSmtpProvider - Erreur lors de la récupération du fournisseur SMTP:', err);
        setError(err.message || 'Une erreur est survenue');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProvider();
  }, [currentUser, providerId]);

  // Rendu conditionnel en fonction de l'état du chargement
  if (isLoading) {
    return (
      <Layout title="Modification du fournisseur SMTP">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress />
        </Box>
      </Layout>
    );
  }

  // Affichage en cas d'erreur
  if (error) {
    return (
      <Layout title="Modification du fournisseur SMTP">
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Box sx={{ mt: 2 }}>
          <Typography variant="body1">
            Retourner à la <a href="/smtp-providers">liste des fournisseurs</a>.
          </Typography>
        </Box>
      </Layout>
    );
  }

  // Affichage si aucun fournisseur n'est trouvé
  if (!provider) {
    return (
      <Layout title="Modification du fournisseur SMTP">
        <Alert severity="warning">
          Le fournisseur SMTP demandé n'existe pas.
        </Alert>
        <Box sx={{ mt: 2 }}>
          <Typography variant="body1">
            Retourner à la <a href="/smtp-providers">liste des fournisseurs</a>.
          </Typography>
        </Box>
      </Layout>
    );
  }

  // Affichage du formulaire avec les données du fournisseur
  console.log("⚠️ EditSmtpProvider - Rendu du formulaire avec les données:", {
    name: provider.name,
    providerType: provider.providerType,
  });
  
  return (
    <Layout title="Modification du fournisseur SMTP">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1">
          Modifier le fournisseur SMTP
        </Typography>
      </Box>
      
      <SmtpProviderForm initialValues={provider} isEditing={true} />
    </Layout>
  );
};

export default EditSmtpProvider; 