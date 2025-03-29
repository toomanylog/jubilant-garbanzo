import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Divider,
  Card,
  CardContent,
  TextField,
  Button,
  Chip,
  List,
  ListItem,
  ListItemText,
  IconButton,
  CircularProgress,
  Alert,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Save as SaveIcon } from '@mui/icons-material';
import { toast } from 'react-toastify';
import Layout from '../../components/layout/Layout';
import { useAuth } from '../../contexts/AuthContext';
import { getUserSettings, updateTestEmails } from '../../models/dynamodb';

const SettingsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // État pour les emails de test
  const [testEmails, setTestEmails] = useState<string[]>([]);
  const [newEmail, setNewEmail] = useState<string>('');
  const [emailError, setEmailError] = useState<string>('');
  
  useEffect(() => {
    const fetchUserSettings = async () => {
      if (!currentUser) return;
      
      try {
        setLoading(true);
        const settings = await getUserSettings(currentUser.userId);
        
        if (settings) {
          setTestEmails(settings.testEmails || []);
        }
      } catch (err: any) {
        console.error('Erreur lors du chargement des paramètres utilisateur:', err);
        setError('Une erreur est survenue lors du chargement des paramètres');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserSettings();
  }, [currentUser]);
  
  const validateEmail = (email: string): boolean => {
    if (!email) {
      setEmailError('L\'adresse email ne peut pas être vide');
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError('Veuillez entrer une adresse email valide');
      return false;
    }
    
    if (testEmails.includes(email)) {
      setEmailError('Cette adresse email est déjà dans la liste');
      return false;
    }
    
    setEmailError('');
    return true;
  };
  
  const handleAddEmail = () => {
    if (validateEmail(newEmail)) {
      setTestEmails([...testEmails, newEmail]);
      setNewEmail('');
    }
  };
  
  const handleDeleteEmail = (email: string) => {
    setTestEmails(testEmails.filter(e => e !== email));
  };
  
  const handleSaveTestEmails = async () => {
    if (!currentUser) return;
    
    try {
      setSaving(true);
      const success = await updateTestEmails(currentUser.userId, testEmails);
      
      if (success) {
        toast.success('Adresses email de test enregistrées avec succès');
      } else {
        toast.error('Erreur lors de l\'enregistrement des adresses email');
      }
    } catch (err: any) {
      console.error('Erreur lors de l\'enregistrement des adresses email:', err);
      toast.error('Une erreur est survenue lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };
  
  if (loading) {
    return (
      <Layout title="Paramètres">
        <Box className="flex justify-center items-center h-[50vh]">
          <CircularProgress />
        </Box>
      </Layout>
    );
  }
  
  return (
    <Layout title="Paramètres">
      <Box className="space-y-6">
        <Box className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <Box>
            <Typography variant="h4" component="h1" className="font-bold text-gray-900 dark:text-white">
              Paramètres
            </Typography>
            <Typography variant="body2" className="mt-1 text-gray-600 dark:text-gray-400">
              Gérez vos paramètres utilisateur et les préférences de l'application
            </Typography>
          </Box>
        </Box>
        
        {error && (
          <Alert severity="error" className="rounded-lg">
            {error}
          </Alert>
        )}
        
        <Card className="border border-gray-200 dark:border-gray-700 shadow-sm rounded-xl overflow-hidden">
          <CardContent>
            <Typography variant="h6" className="font-semibold mb-4">
              Emails de test pour vérification inbox
            </Typography>
            <Typography variant="body2" className="text-gray-600 dark:text-gray-400 mb-4">
              Définissez des adresses email de test pour vérifier la délivrabilité inbox lors des tests de vos fournisseurs SMTP.
            </Typography>
            
            <Box className="mb-4">
              <Box className="flex flex-col sm:flex-row gap-3">
                <TextField
                  label="Adresse email"
                  variant="outlined"
                  fullWidth
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  error={!!emailError}
                  helperText={emailError}
                  placeholder="test@example.com"
                  size="small"
                />
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleAddEmail}
                  disabled={!newEmail}
                  className="whitespace-nowrap"
                  size="medium"
                >
                  Ajouter
                </Button>
              </Box>
            </Box>
            
            {testEmails.length > 0 ? (
              <List className="bg-gray-50 dark:bg-gray-800 rounded-lg overflow-hidden">
                {testEmails.map((email, index) => (
                  <React.Fragment key={email}>
                    {index > 0 && <Divider />}
                    <ListItem
                      secondaryAction={
                        <IconButton edge="end" aria-label="delete" onClick={() => handleDeleteEmail(email)}>
                          <DeleteIcon />
                        </IconButton>
                      }
                    >
                      <ListItemText primary={email} />
                    </ListItem>
                  </React.Fragment>
                ))}
              </List>
            ) : (
              <Box className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg text-center">
                <Typography variant="body2" className="text-gray-500 dark:text-gray-400">
                  Aucune adresse email de test définie
                </Typography>
              </Box>
            )}
            
            <Box className="mt-4 flex justify-end">
              <Button
                variant="contained"
                color="primary"
                startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
                onClick={handleSaveTestEmails}
                disabled={saving}
              >
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
            </Box>
          </CardContent>
        </Card>
        
        <Card className="border border-gray-200 dark:border-gray-700 shadow-sm rounded-xl overflow-hidden">
          <CardContent>
            <Typography variant="h6" className="font-semibold mb-4">
              Préférences d'affichage
            </Typography>
            <Typography variant="body2" className="text-gray-600 dark:text-gray-400 mb-6">
              Personnalisez l'apparence et les fonctionnalités de votre interface.
            </Typography>
            
            <Box className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <Box className="flex items-center justify-between">
                <Box>
                  <Typography variant="subtitle2" className="font-medium">
                    Mode d'affichage des résultats
                  </Typography>
                  <Typography variant="body2" className="text-sm text-gray-500 dark:text-gray-400">
                    Choisissez comment les résultats sont affichés
                  </Typography>
                </Box>
                <Chip label="Bientôt disponible" size="small" />
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Layout>
  );
};

export default SettingsPage; 