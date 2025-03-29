import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, CircularProgress, Alert, Button } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
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
        setError("Impossible de charger le fournisseur: identifiant manquant ou utilisateur non connecté");
        setIsLoading(false);
        return;
      }
      
      console.log("⚠️ EditSmtpProvider - Début du chargement du fournisseur SMTP:", providerId);
      
      try {
        setIsLoading(true);
        console.log("⚠️ EditSmtpProvider - Appel de getSmtpProviderById avec providerId:", providerId);
        
        // Récupération du fournisseur SMTP par son ID
        const providerData = await getSmtpProviderById(providerId);
        console.log("⚠️ EditSmtpProvider - Fournisseur récupéré:", providerData ? JSON.stringify(providerData) : "null");
        
        // Vérifier que le fournisseur appartient bien à l'utilisateur courant
        if (providerData.userId !== currentUser.userId) {
          console.error("⚠️ EditSmtpProvider - Le fournisseur n'appartient pas à l'utilisateur:", {
            providerUserId: providerData.userId,
            currentUserId: currentUser.userId
          });
          setError("Vous n'avez pas les droits pour modifier ce fournisseur SMTP");
          setIsLoading(false);
          return;
        }
        
        // Mise à jour de l'état avec les données du fournisseur
        console.log("⚠️ EditSmtpProvider - Mise à jour du state avec le fournisseur");
        setProvider(providerData);
      } catch (err: any) {
        console.error('⚠️ EditSmtpProvider - Erreur lors de la récupération du fournisseur SMTP:', err);
        setError(err.message || 'Une erreur est survenue lors du chargement du fournisseur SMTP');
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
        <Box className="flex justify-center items-center h-[50vh]">
          <CircularProgress />
        </Box>
      </Layout>
    );
  }

  // Affichage en cas d'erreur
  if (error) {
    return (
      <Layout title="Modification du fournisseur SMTP">
        <Alert severity="error" className="mb-4 rounded-lg">
          {error}
        </Alert>
        <Button
          variant="contained"
          color="primary"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/smtp-providers')}
          className="mt-4"
        >
          Retour à la liste des fournisseurs
        </Button>
      </Layout>
    );
  }

  // Affichage si aucun fournisseur n'est trouvé
  if (!provider) {
    return (
      <Layout title="Modification du fournisseur SMTP">
        <Alert severity="warning" className="mb-4 rounded-lg">
          Le fournisseur SMTP demandé n'existe pas.
        </Alert>
        <Button
          variant="contained"
          color="primary"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/smtp-providers')}
          className="mt-4"
        >
          Retour à la liste des fournisseurs
        </Button>
      </Layout>
    );
  }

  // Affichage du formulaire avec les données du fournisseur
  console.log("⚠️ EditSmtpProvider - Rendu du formulaire avec les données:", {
    name: provider.name,
    providerType: provider.providerType,
    host: provider.host,
    port: provider.port,
    isActive: provider.isActive ? "Actif" : "Inactif"
  });
  
  // Vérification détaillée du provider avant de le passer au formulaire
  console.log("⚠️ EditSmtpProvider - Provider avant passage au formulaire:", {
    providerId: provider.providerId,
    isDefined: !!provider,
    isObject: typeof provider === 'object',
    keys: Object.keys(provider),
    containsAllRequiredProps: !!(
      provider.providerId && 
      provider.name && 
      provider.providerType
    ),
    serialized: JSON.stringify(provider)
  });
  
  return (
    <Layout title="Modification du fournisseur SMTP">
      <SmtpProviderForm initialValues={provider} isEditing={true} />
    </Layout>
  );
};

export default EditSmtpProvider; 