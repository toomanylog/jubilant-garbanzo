import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  TextField, 
  Button, 
  Divider, 
  Alert, 
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle
} from '@mui/material';
import { Save as SaveIcon, Person as PersonIcon, Lock as LockIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import Layout from '../../components/layout/Layout';
import { useAuth } from '../../contexts/AuthContext';
import { CognitoUser, CognitoUserAttribute, AuthenticationDetails, CognitoUserPool } from 'amazon-cognito-identity-js';
import { getUserById, updateUser } from '../../models/dynamodb';

// Schéma de validation pour les informations du profil
const profileValidationSchema = Yup.object({
  fullName: Yup.string().required('Le nom complet est requis')
});

// Schéma de validation pour le changement de mot de passe
const passwordValidationSchema = Yup.object({
  currentPassword: Yup.string().required('Le mot de passe actuel est requis'),
  newPassword: Yup.string()
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
    .matches(/[A-Z]/, 'Le mot de passe doit contenir au moins une lettre majuscule')
    .matches(/[a-z]/, 'Le mot de passe doit contenir au moins une lettre minuscule')
    .matches(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre')
    .matches(/[^A-Za-z0-9]/, 'Le mot de passe doit contenir au moins un caractère spécial')
    .required('Le nouveau mot de passe est requis'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('newPassword')], 'Les mots de passe ne correspondent pas')
    .required('La confirmation du mot de passe est requise')
});

const ProfilePage: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // Récupérer les données utilisateur complètes depuis DynamoDB
  useEffect(() => {
    const fetchUserData = async () => {
      if (!currentUser) {
        navigate('/login');
        return;
      }

      try {
        setLoading(true);
        const userData = await getUserById(currentUser.userId);
        if (userData) {
          setUser(userData);
        } else {
          setError('Impossible de récupérer les informations utilisateur.');
        }
      } catch (err: any) {
        console.error('Erreur lors de la récupération des informations utilisateur:', err);
        setError('Une erreur est survenue lors de la récupération des informations utilisateur.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [currentUser, navigate]);

  // Formulaire pour les informations du profil
  const profileFormik = useFormik({
    initialValues: {
      fullName: currentUser?.fullName || ''
    },
    validationSchema: profileValidationSchema,
    onSubmit: async (values) => {
      try {
        setLoading(true);
        setError(null);

        if (!currentUser) {
          toast.error('Vous devez être connecté pour modifier votre profil.');
          return;
        }

        // Mettre à jour les attributs Cognito
        const userPool = new CognitoUser({
          Username: currentUser.email,
          Pool: new CognitoUserPool({
            UserPoolId: process.env.REACT_APP_AWS_USER_POOL_ID || '',
            ClientId: process.env.REACT_APP_AWS_APP_CLIENT_ID || ''
          })
        });

        // Se connecter au pool d'utilisateurs Cognito pour obtenir la session
        return new Promise((resolve, reject) => {
          userPool.getSession((err: any, session: any) => {
            if (err) {
              console.error('Erreur lors de la récupération de la session:', err);
              reject(err);
              return;
            }

            // Préparer les attributs à mettre à jour
            const attributes = [
              new CognitoUserAttribute({ Name: 'name', Value: values.fullName })
            ];

            userPool.updateAttributes(attributes, async (err, result) => {
              if (err) {
                console.error('Erreur lors de la mise à jour des attributs:', err);
                reject(err);
                return;
              }

              // Mettre à jour dans DynamoDB également
              try {
                if (user) {
                  const updatedUser = {
                    ...user,
                    fullName: values.fullName,
                    updatedAt: new Date().toISOString()
                  };
                  
                  const success = await updateUser(updatedUser);
                  
                  if (success) {
                    toast.success('Profil mis à jour avec succès');
                    // Mettre à jour l'état local
                    setUser(updatedUser);
                  } else {
                    toast.error('Erreur lors de la mise à jour du profil dans la base de données');
                  }
                } else {
                  toast.error('Informations utilisateur non disponibles');
                }
              } catch (dbError) {
                console.error('Erreur lors de la mise à jour du profil dans la base de données:', dbError);
                toast.error('Erreur lors de la mise à jour du profil dans la base de données');
              }
              
              resolve(true);
            });
          });
        });
      } catch (err: any) {
        console.error('Erreur lors de la mise à jour du profil:', err);
        setError('Une erreur est survenue lors de la mise à jour du profil.');
        toast.error('Erreur lors de la mise à jour du profil');
      } finally {
        setLoading(false);
      }
    }
  });

  // Formulaire pour le changement de mot de passe
  const passwordFormik = useFormik({
    initialValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    },
    validationSchema: passwordValidationSchema,
    onSubmit: async (values) => {
      try {
        setLoading(true);
        setError(null);

        if (!currentUser) {
          toast.error('Vous devez être connecté pour changer votre mot de passe.');
          return;
        }

        // Créer l'instance d'utilisateur Cognito
        const userPool = new CognitoUserPool({
          UserPoolId: process.env.REACT_APP_AWS_USER_POOL_ID || '',
          ClientId: process.env.REACT_APP_AWS_APP_CLIENT_ID || ''
        });

        const cognitoUser = new CognitoUser({
          Username: currentUser.email,
          Pool: userPool
        });

        // Créer les détails d'authentification pour le mot de passe actuel
        const authDetails = new AuthenticationDetails({
          Username: currentUser.email,
          Password: values.currentPassword
        });

        return new Promise((resolve, reject) => {
          // Authentifier l'utilisateur avec le mot de passe actuel
          cognitoUser.authenticateUser(authDetails, {
            onSuccess: () => {
              // Changer le mot de passe
              cognitoUser.changePassword(
                values.currentPassword,
                values.newPassword,
                (err, result) => {
                  if (err) {
                    console.error('Erreur lors du changement de mot de passe:', err);
                    toast.error('Erreur lors du changement de mot de passe: ' + (err.message || 'Mot de passe actuel incorrect.'));
                    reject(err);
                    return;
                  }

                  toast.success('Mot de passe changé avec succès');
                  // Réinitialiser le formulaire
                  passwordFormik.resetForm();
                  resolve(result);
                }
              );
            },
            onFailure: (err) => {
              console.error('Erreur lors de l\'authentification:', err);
              toast.error('Mot de passe actuel incorrect.');
              reject(err);
            }
          });
        });
      } catch (err: any) {
        console.error('Erreur lors du changement de mot de passe:', err);
        setError('Une erreur est survenue lors du changement de mot de passe.');
      } finally {
        setLoading(false);
      }
    }
  });

  // Fonction pour supprimer le compte
  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== currentUser?.email) {
      toast.error('Veuillez saisir correctement votre email pour confirmer la suppression');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (!currentUser) {
        toast.error('Vous devez être connecté pour supprimer votre compte.');
        return;
      }

      // Créer l'instance d'utilisateur Cognito
      const userPool = new CognitoUserPool({
        UserPoolId: process.env.REACT_APP_AWS_USER_POOL_ID || '',
        ClientId: process.env.REACT_APP_AWS_APP_CLIENT_ID || ''
      });

      const cognitoUser = new CognitoUser({
        Username: currentUser.email,
        Pool: userPool
      });

      return new Promise((resolve, reject) => {
        cognitoUser.getSession((err: any, session: any) => {
          if (err) {
            console.error('Erreur lors de la récupération de la session:', err);
            reject(err);
            return;
          }

          cognitoUser.deleteUser((err, result) => {
            if (err) {
              console.error('Erreur lors de la suppression du compte:', err);
              toast.error('Erreur lors de la suppression du compte: ' + (err.message || 'Une erreur est survenue.'));
              reject(err);
              return;
            }

            toast.success('Votre compte a été supprimé avec succès');
            // Déconnecter l'utilisateur et rediriger vers la page d'accueil
            logout();
            navigate('/');
            resolve(result);
          });
        });
      });
    } catch (err: any) {
      console.error('Erreur lors de la suppression du compte:', err);
      setError('Une erreur est survenue lors de la suppression du compte.');
    } finally {
      setLoading(false);
      setOpenDeleteDialog(false);
    }
  };

  if (loading && !user) {
    return (
      <Layout title="Mon Profil">
        <Box className="flex justify-center items-center h-[50vh]">
          <CircularProgress />
        </Box>
      </Layout>
    );
  }

  return (
    <Layout title="Mon Profil">
      <Box className="space-y-6 max-w-4xl mx-auto">
        <Box className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <Box>
            <Typography variant="h4" component="h1" className="font-bold text-gray-900 dark:text-white">
              Mon profil
            </Typography>
            <Typography variant="body2" className="mt-1 text-gray-600 dark:text-gray-400">
              Gérez vos informations personnelles et les paramètres de sécurité
            </Typography>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" className="rounded-lg">
            {error}
          </Alert>
        )}

        {/* Informations du profil */}
        <Card className="border border-gray-200 dark:border-gray-700 shadow-sm rounded-xl overflow-hidden">
          <CardContent>
            <Typography variant="h6" className="font-semibold mb-4 flex items-center">
              <PersonIcon className="mr-2" />
              Informations personnelles
            </Typography>
            <Divider className="mb-6" />

            <form onSubmit={profileFormik.handleSubmit}>
              <Box className="space-y-4">
                <TextField
                  fullWidth
                  id="fullName"
                  name="fullName"
                  label="Nom complet"
                  value={profileFormik.values.fullName}
                  onChange={profileFormik.handleChange}
                  onBlur={profileFormik.handleBlur}
                  error={profileFormik.touched.fullName && Boolean(profileFormik.errors.fullName)}
                  helperText={profileFormik.touched.fullName && profileFormik.errors.fullName}
                  className="rounded-md"
                />

                <TextField
                  fullWidth
                  id="email"
                  name="email"
                  label="Adresse email"
                  value={currentUser?.email || ''}
                  disabled
                  className="rounded-md"
                  helperText="L'adresse email ne peut pas être modifiée"
                />

                <Box className="flex justify-end mt-4">
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    startIcon={profileFormik.isSubmitting ? <CircularProgress size={20} /> : <SaveIcon />}
                    disabled={profileFormik.isSubmitting || !profileFormik.dirty}
                  >
                    Enregistrer
                  </Button>
                </Box>
              </Box>
            </form>
          </CardContent>
        </Card>

        {/* Changer le mot de passe */}
        <Card className="border border-gray-200 dark:border-gray-700 shadow-sm rounded-xl overflow-hidden">
          <CardContent>
            <Typography variant="h6" className="font-semibold mb-4 flex items-center">
              <LockIcon className="mr-2" />
              Changer le mot de passe
            </Typography>
            <Divider className="mb-6" />

            <form onSubmit={passwordFormik.handleSubmit}>
              <Box className="space-y-4">
                <TextField
                  fullWidth
                  id="currentPassword"
                  name="currentPassword"
                  label="Mot de passe actuel"
                  type="password"
                  value={passwordFormik.values.currentPassword}
                  onChange={passwordFormik.handleChange}
                  onBlur={passwordFormik.handleBlur}
                  error={passwordFormik.touched.currentPassword && Boolean(passwordFormik.errors.currentPassword)}
                  helperText={passwordFormik.touched.currentPassword && passwordFormik.errors.currentPassword}
                  className="rounded-md"
                />

                <TextField
                  fullWidth
                  id="newPassword"
                  name="newPassword"
                  label="Nouveau mot de passe"
                  type="password"
                  value={passwordFormik.values.newPassword}
                  onChange={passwordFormik.handleChange}
                  onBlur={passwordFormik.handleBlur}
                  error={passwordFormik.touched.newPassword && Boolean(passwordFormik.errors.newPassword)}
                  helperText={passwordFormik.touched.newPassword && passwordFormik.errors.newPassword}
                  className="rounded-md"
                />

                <TextField
                  fullWidth
                  id="confirmPassword"
                  name="confirmPassword"
                  label="Confirmer le nouveau mot de passe"
                  type="password"
                  value={passwordFormik.values.confirmPassword}
                  onChange={passwordFormik.handleChange}
                  onBlur={passwordFormik.handleBlur}
                  error={passwordFormik.touched.confirmPassword && Boolean(passwordFormik.errors.confirmPassword)}
                  helperText={passwordFormik.touched.confirmPassword && passwordFormik.errors.confirmPassword}
                  className="rounded-md"
                />

                <Box className="flex justify-end mt-4">
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    startIcon={passwordFormik.isSubmitting ? <CircularProgress size={20} /> : <SaveIcon />}
                    disabled={passwordFormik.isSubmitting || !passwordFormik.dirty}
                  >
                    Changer le mot de passe
                  </Button>
                </Box>
              </Box>
            </form>
          </CardContent>
        </Card>

        {/* Supprimer le compte */}
        <Card className="border border-red-200 dark:border-red-800 shadow-sm rounded-xl overflow-hidden">
          <CardContent>
            <Typography variant="h6" className="font-semibold mb-4 flex items-center text-red-600 dark:text-red-400">
              <DeleteIcon className="mr-2" />
              Supprimer mon compte
            </Typography>
            <Divider className="mb-6" />

            <Typography variant="body2" className="mb-4 text-gray-700 dark:text-gray-300">
              La suppression de votre compte est définitive et irréversible. Toutes vos données, campagnes et paramètres seront supprimés de façon permanente.
            </Typography>

            <Box className="flex justify-end">
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={() => setOpenDeleteDialog(true)}
              >
                Supprimer mon compte
              </Button>
            </Box>
          </CardContent>
        </Card>

        {/* Dialog de confirmation de suppression */}
        <Dialog
          open={openDeleteDialog}
          onClose={() => setOpenDeleteDialog(false)}
        >
          <DialogTitle className="text-red-600">Confirmer la suppression du compte</DialogTitle>
          <DialogContent>
            <DialogContentText className="mb-4">
              Cette action est <strong>définitive et irréversible</strong>. Toutes vos données seront supprimées de façon permanente.
            </DialogContentText>
            <DialogContentText className="mb-4">
              Pour confirmer, veuillez saisir votre adresse email : <strong>{currentUser?.email}</strong>
            </DialogContentText>
            <TextField
              autoFocus
              fullWidth
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              label="Votre adresse email"
              variant="outlined"
              className="rounded-md"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDeleteDialog(false)} color="primary">
              Annuler
            </Button>
            <Button
              onClick={handleDeleteAccount}
              color="error"
              disabled={deleteConfirmText !== currentUser?.email}
            >
              Supprimer définitivement
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Layout>
  );
};

export default ProfilePage; 