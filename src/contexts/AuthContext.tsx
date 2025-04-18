import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CognitoUserPool, CognitoUser, AuthenticationDetails, CognitoUserAttribute } from 'amazon-cognito-identity-js';
import { toast } from 'react-toastify';
import { createUser, getUserById, User } from '../models/dynamodb';
import * as crypto from 'crypto-js';

// Interface pour les erreurs Cognito qui contiennent des propriétés supplémentaires
interface CognitoError extends Error {
  code?: string;
}

// Configuration de Cognito
const poolData = {
  UserPoolId: process.env.REACT_APP_AWS_USER_POOL_ID || '',
  ClientId: process.env.REACT_APP_AWS_APP_CLIENT_ID || ''
};

// Le secret client n'est plus nécessaire pour les clients de type SPA
const clientSecret = process.env.REACT_APP_AWS_APP_CLIENT_SECRET || '';

// Fonction simplifiée pour compatibilité future si un secret client est ajouté
const calculateSecretHash = (username: string): string | undefined => {
  if (!clientSecret) {
    return undefined;
  }
  
  try {
    const message = username + poolData.ClientId;
    const hashResult = crypto.HmacSHA256(message, clientSecret);
    return crypto.enc.Base64.stringify(hashResult);
  } catch (error) {
    console.error('Erreur lors du calcul du SECRET_HASH:', error);
    return undefined;
  }
};

const userPool = new CognitoUserPool(poolData);

// Interface pour l'utilisateur actuel
interface CurrentUser {
  userId: string;
  email: string;
  fullName: string;
}

// Interface pour le contexte d'authentification
interface AuthContextType {
  currentUser: CurrentUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, fullName: string, password: string) => Promise<boolean>;
  logout: () => void;
  forgotPassword: (email: string) => Promise<boolean>;
  confirmForgotPassword: (email: string, code: string, newPassword: string) => Promise<boolean>;
  confirmSignUp: (email: string, code: string) => Promise<boolean>;
}

// Création du contexte
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Hook personnalisé pour utiliser le contexte
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth doit être utilisé à l'intérieur d'un AuthProvider");
  }
  return context;
};

// Props pour le provider
interface AuthProviderProps {
  children: ReactNode;
}

// Provider du contexte
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Vérifier l'état d'authentification au chargement
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const cognitoUser = userPool.getCurrentUser();
        
        if (cognitoUser) {
          // Récupérer la session Cognito
          cognitoUser.getSession((err: any, session: any) => {
            if (err) {
              setIsAuthenticated(false);
              setCurrentUser(null);
              setIsLoading(false);
              setError('Erreur lors de la vérification de l\'authentification');
              return;
            }

            if (session.isValid()) {
              // Récupérer les attributs de l'utilisateur
              cognitoUser.getUserAttributes((err: any, attributes: any) => {
                if (err) {
                  console.error('Erreur lors de la récupération des attributs:', err);
                  setIsLoading(false);
                  setError('Erreur lors de la récupération des attributs');
                  return;
                }

                if (attributes) {
                  // Chercher l'email et le nom dans les attributs
                  const email = attributes.find((a: any) => a.getName() === 'email')?.getValue() || '';
                  const fullName = attributes.find((a: any) => a.getName() === 'name')?.getValue() || '';
                  const sub = attributes.find((a: any) => a.getName() === 'sub')?.getValue() || '';

                  // Utiliser le sub (identifiant unique) comme userId
                  setCurrentUser({
                    userId: sub,
                    email,
                    fullName
                  });
                  setIsAuthenticated(true);
                } else {
                  setIsAuthenticated(false);
                  setCurrentUser(null);
                  setIsLoading(false);
                  setError('Aucun attribut trouvé');
                }
                setIsLoading(false);
              });
            } else {
              setIsAuthenticated(false);
              setCurrentUser(null);
              setIsLoading(false);
              setError('Session non valide');
            }
          });
        } else {
          // Ne pas définir d'erreur si l'utilisateur n'est simplement pas connecté
          // C'est un état normal, pas une erreur
          setIsAuthenticated(false);
          setCurrentUser(null);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Erreur lors de la vérification de l\'authentification:', error);
        setIsAuthenticated(false);
        setCurrentUser(null);
        setIsLoading(false);
        setError('Erreur lors de la vérification de l\'authentification');
      }
    };

    checkAuth();
  }, []);

  // Fonction de connexion
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const authenticationData = {
        Username: email,
        Password: password
      };

      const authenticationDetails = new AuthenticationDetails(authenticationData);

      const userData = {
        Username: email,
        Pool: userPool
      };

      const cognitoUser = new CognitoUser(userData);

      return new Promise((resolve, reject) => {
        cognitoUser.authenticateUser(authenticationDetails, {
          onSuccess: async (result) => {
            // Récupérer les attributs de l'utilisateur
            cognitoUser.getUserAttributes(async (err: any, attributes: any) => {
              if (err) {
                console.error('Erreur lors de la récupération des attributs:', err);
                reject(err);
                return;
              }

              if (attributes) {
                // Chercher l'email et le nom dans les attributs
                const email = attributes.find((a: any) => a.getName() === 'email')?.getValue() || '';
                const fullName = attributes.find((a: any) => a.getName() === 'name')?.getValue() || '';
                const sub = attributes.find((a: any) => a.getName() === 'sub')?.getValue() || '';

                // Vérifier si l'utilisateur existe dans DynamoDB
                try {
                  const userFromDB = await getUserById(sub);
                  
                  // Si l'utilisateur n'existe pas, le créer
                  if (!userFromDB) {
                    const newUser: User = {
                      userId: sub,
                      email,
                      fullName,
                      createdAt: new Date().toISOString(),
                      updatedAt: new Date().toISOString()
                    };
                    
                    await createUser(newUser);
                  }
                } catch (dbError) {
                  console.error('Erreur avec DynamoDB:', dbError);
                  // Même en cas d'erreur DynamoDB, on considère que l'authentification a réussi
                }

                setCurrentUser({
                  userId: sub,
                  email,
                  fullName
                });
                setIsAuthenticated(true);
                toast.success('Connexion réussie');
                resolve(true);
              } else {
                reject(new Error('Aucun attribut trouvé'));
              }
            });
          },
          onFailure: (err: CognitoError) => {
            console.error('Erreur lors de la connexion:', err);
            toast.error('Échec de la connexion: ' + (err.message || 'Vérifiez vos identifiants'));
            reject(err);
          }
        });
      });
    } catch (error) {
      console.error('Erreur lors de la connexion:', error);
      toast.error('Échec de la connexion');
      return false;
    }
  };

  // Fonction d'inscription
  const register = async (email: string, fullName: string, password: string): Promise<boolean> => {
    try {
      return new Promise((resolve, reject) => {
        // Attributs de l'utilisateur
        const attributeList = [
          new CognitoUserAttribute({ Name: 'email', Value: email }),
          new CognitoUserAttribute({ Name: 'name', Value: fullName })
        ];
        
        // Version compatible avec la structure attendue par l'API Cognito
        userPool.signUp(email, password, attributeList, [], (err, result) => {
          if (err) {
            console.error('Erreur lors de l\'inscription:', err);
            console.error('Code d\'erreur:', (err as CognitoError).code);
            console.error('Message d\'erreur:', err.message);
            
            // Messages d'erreur plus explicites selon le type d'erreur
            if (err.name === 'InvalidPasswordException') {
              const message = "Le mot de passe ne respecte pas les exigences de sécurité : au moins 8 caractères, avec majuscules, minuscules, chiffres et caractères spéciaux."
              setError(message);
              toast.error(message);
            } else if (err.name === 'UsernameExistsException') {
              const message = "Cette adresse email est déjà utilisée par un autre compte.";
              setError(message);
              toast.error(message);
            } else {
              setError(err.message);
              toast.error('Échec de l\'inscription: ' + (err.message || 'Une erreur est survenue'));
            }
            
            reject(err);
            return;
          }
          
          if (result) {
            console.log('Inscription réussie, utilisateur:', result.user);
            console.log('UserConfirmed:', result.userConfirmed);
            console.log('UserSub:', result.userSub);
            toast.success('Inscription réussie! Veuillez vérifier votre email pour confirmer votre compte.');
            resolve(true);
          } else {
            toast.error('Échec de l\'inscription');
            resolve(false);
          }
        });
      });
    } catch (error) {
      console.error('Erreur lors de l\'inscription:', error);
      toast.error('Échec de l\'inscription');
      return false;
    }
  };

  // Fonction de déconnexion
  const logout = () => {
    const cognitoUser = userPool.getCurrentUser();
    if (cognitoUser) {
      cognitoUser.signOut();
      setCurrentUser(null);
      setIsAuthenticated(false);
      toast.info('Vous êtes déconnecté');
    }
  };

  // Fonction pour demander la réinitialisation du mot de passe
  const forgotPassword = async (email: string): Promise<boolean> => {
    try {
      const userData = {
        Username: email,
        Pool: userPool
      };

      const cognitoUser = new CognitoUser(userData);

      return new Promise((resolve, reject) => {
        cognitoUser.forgotPassword({
          onSuccess: () => {
            toast.success('Code de réinitialisation envoyé à votre email');
            resolve(true);
          },
          onFailure: (err: CognitoError) => {
            console.error('Erreur lors de la demande de réinitialisation:', err);
            toast.error('Échec de la demande: ' + (err.message || 'Une erreur est survenue'));
            reject(err);
          }
        });
      });
    } catch (error) {
      console.error('Erreur lors de la demande de réinitialisation:', error);
      toast.error('Échec de la demande de réinitialisation');
      return false;
    }
  };

  // Fonction pour confirmer la réinitialisation du mot de passe avec le code
  const confirmForgotPassword = async (email: string, code: string, newPassword: string): Promise<boolean> => {
    try {
      const userData = {
        Username: email,
        Pool: userPool
      };

      const cognitoUser = new CognitoUser(userData);

      return new Promise((resolve, reject) => {
        cognitoUser.confirmPassword(code, newPassword, {
          onSuccess: () => {
            toast.success('Mot de passe réinitialisé avec succès');
            resolve(true);
          },
          onFailure: (err: CognitoError) => {
            console.error('Erreur lors de la confirmation de réinitialisation:', err);
            toast.error('Échec de la réinitialisation: ' + (err.message || 'Une erreur est survenue'));
            reject(err);
          }
        });
      });
    } catch (error) {
      console.error('Erreur lors de la confirmation de réinitialisation:', error);
      toast.error('Échec de la confirmation de réinitialisation');
      return false;
    }
  };

  // Fonction pour confirmer l'inscription avec le code
  const confirmSignUp = async (email: string, code: string): Promise<boolean> => {
    try {
      const userData = {
        Username: email,
        Pool: userPool
      };

      const cognitoUser = new CognitoUser(userData);

      return new Promise((resolve, reject) => {
        cognitoUser.confirmRegistration(code, true, (err, result) => {
          if (err) {
            console.error('Erreur lors de la confirmation du compte:', err);
            toast.error('Échec de la confirmation: ' + (err.message || 'Une erreur est survenue'));
            reject(err);
            return;
          }
          
          toast.success('Compte confirmé avec succès! Vous pouvez maintenant vous connecter.');
          resolve(true);
        });
      });
    } catch (error) {
      console.error('Erreur lors de la confirmation du compte:', error);
      toast.error('Échec de la confirmation du compte');
      return false;
    }
  };

  // Valeurs du contexte
  const value = {
    currentUser,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    forgotPassword,
    confirmForgotPassword,
    confirmSignUp
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext; 