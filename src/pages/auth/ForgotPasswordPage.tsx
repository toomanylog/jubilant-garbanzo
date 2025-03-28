import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Button } from '../../components/ui/button';
import { Mail, Loader2, ArrowRight, KeyRound } from 'lucide-react';

// Schéma de validation pour la demande de réinitialisation
const requestValidationSchema = Yup.object({
  email: Yup.string()
    .email('Email invalide')
    .required('L\'email est requis')
});

// Schéma de validation pour la confirmation de réinitialisation
const confirmValidationSchema = Yup.object({
  email: Yup.string()
    .email('Email invalide')
    .required('L\'email est requis'),
  code: Yup.string()
    .required('Le code est requis'),
  newPassword: Yup.string()
    .min(6, 'Le mot de passe doit contenir au moins 6 caractères')
    .required('Le nouveau mot de passe est requis'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('newPassword')], 'Les mots de passe ne correspondent pas')
    .required('La confirmation du mot de passe est requise')
});

const ForgotPasswordPage: React.FC = () => {
  const { forgotPassword, confirmForgotPassword } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Formulaire pour la demande de réinitialisation
  const requestFormik = useFormik({
    initialValues: {
      email: ''
    },
    validationSchema: requestValidationSchema,
    onSubmit: async (values) => {
      setError(null);
      setIsLoading(true);
      
      try {
        const success = await forgotPassword(values.email);
        
        if (success) {
          setCodeSent(true);
        } else {
          setError('Échec de l\'envoi du code de réinitialisation.');
        }
      } catch (err: any) {
        setError(err.message || 'Une erreur est survenue');
      } finally {
        setIsLoading(false);
      }
    }
  });

  // Formulaire pour la confirmation de réinitialisation
  const confirmFormik = useFormik({
    initialValues: {
      email: requestFormik.values.email,
      code: '',
      newPassword: '',
      confirmPassword: ''
    },
    validationSchema: confirmValidationSchema,
    onSubmit: async (values) => {
      setError(null);
      setIsLoading(true);
      
      try {
        const success = await confirmForgotPassword(
          values.email, 
          values.code, 
          values.newPassword
        );
        
        if (success) {
          navigate('/login');
        } else {
          setError('Échec de la réinitialisation du mot de passe.');
        }
      } catch (err: any) {
        setError(err.message || 'Une erreur est survenue');
      } finally {
        setIsLoading(false);
      }
    }
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            North Eyes
          </h2>
          <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
            {codeSent ? 'Réinitialisez votre mot de passe' : 'Mot de passe oublié'}
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow-xl sm:rounded-lg sm:px-10 border border-gray-200 dark:border-gray-700 transition-all hover:shadow-lg">
            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-md text-red-600 dark:text-red-300 text-sm">
                <p>{error}</p>
              </div>
            )}

            {!codeSent ? (
              // Étape 1: Formulaire de demande de réinitialisation
              <form className="space-y-6" onSubmit={requestFormik.handleSubmit}>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Adresse email
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      value={requestFormik.values.email}
                      onChange={requestFormik.handleChange}
                      onBlur={requestFormik.handleBlur}
                      required
                      className={`block w-full pl-10 py-3 pr-3 border ${
                        requestFormik.touched.email && requestFormik.errors.email 
                          ? 'border-red-300 text-red-900 placeholder-red-300 focus:outline-none focus:ring-red-500 focus:border-red-500' 
                          : 'border-gray-300 focus:ring-primary focus:border-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white'
                      } rounded-md shadow-sm placeholder-gray-400 transition-colors`}
                      placeholder="nom@exemple.com"
                    />
                  </div>
                  {requestFormik.touched.email && requestFormik.errors.email ? (
                    <p className="mt-2 text-sm text-red-600 dark:text-red-400">{requestFormik.errors.email}</p>
                  ) : null}
                </div>

                <div>
                  <Button
                    type="submit"
                    className="w-full flex justify-center items-center py-3 px-4 rounded-md shadow-sm text-sm font-medium"
                    variant="gradient"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Envoi en cours...
                      </>
                    ) : (
                      <>
                        Envoyer le code de réinitialisation
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </form>
            ) : (
              // Étape 2: Formulaire de confirmation et nouveau mot de passe
              <form className="space-y-6" onSubmit={confirmFormik.handleSubmit}>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Adresse email
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      value={confirmFormik.values.email}
                      onChange={confirmFormik.handleChange}
                      onBlur={confirmFormik.handleBlur}
                      required
                      className={`block w-full pl-10 py-3 pr-3 border ${
                        confirmFormik.touched.email && confirmFormik.errors.email 
                          ? 'border-red-300 text-red-900 placeholder-red-300 focus:outline-none focus:ring-red-500 focus:border-red-500' 
                          : 'border-gray-300 focus:ring-primary focus:border-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white'
                      } rounded-md shadow-sm placeholder-gray-400 transition-colors`}
                      placeholder="nom@exemple.com"
                    />
                  </div>
                  {confirmFormik.touched.email && confirmFormik.errors.email ? (
                    <p className="mt-2 text-sm text-red-600 dark:text-red-400">{confirmFormik.errors.email}</p>
                  ) : null}
                </div>

                <div>
                  <label htmlFor="code" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Code de vérification
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <KeyRound className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="code"
                      name="code"
                      type="text"
                      value={confirmFormik.values.code}
                      onChange={confirmFormik.handleChange}
                      onBlur={confirmFormik.handleBlur}
                      required
                      className={`block w-full pl-10 py-3 pr-3 border ${
                        confirmFormik.touched.code && confirmFormik.errors.code 
                          ? 'border-red-300 text-red-900 placeholder-red-300 focus:outline-none focus:ring-red-500 focus:border-red-500' 
                          : 'border-gray-300 focus:ring-primary focus:border-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white'
                      } rounded-md shadow-sm placeholder-gray-400 transition-colors`}
                      placeholder="123456"
                    />
                  </div>
                  {confirmFormik.touched.code && confirmFormik.errors.code ? (
                    <p className="mt-2 text-sm text-red-600 dark:text-red-400">{confirmFormik.errors.code}</p>
                  ) : null}
                </div>

                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Nouveau mot de passe
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <KeyRound className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="newPassword"
                      name="newPassword"
                      type="password"
                      autoComplete="new-password"
                      value={confirmFormik.values.newPassword}
                      onChange={confirmFormik.handleChange}
                      onBlur={confirmFormik.handleBlur}
                      required
                      className={`block w-full pl-10 py-3 pr-3 border ${
                        confirmFormik.touched.newPassword && confirmFormik.errors.newPassword 
                          ? 'border-red-300 text-red-900 placeholder-red-300 focus:outline-none focus:ring-red-500 focus:border-red-500' 
                          : 'border-gray-300 focus:ring-primary focus:border-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white'
                      } rounded-md shadow-sm placeholder-gray-400 transition-colors`}
                      placeholder="********"
                    />
                  </div>
                  {confirmFormik.touched.newPassword && confirmFormik.errors.newPassword ? (
                    <p className="mt-2 text-sm text-red-600 dark:text-red-400">{confirmFormik.errors.newPassword}</p>
                  ) : null}
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Confirmer le mot de passe
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <KeyRound className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      autoComplete="new-password"
                      value={confirmFormik.values.confirmPassword}
                      onChange={confirmFormik.handleChange}
                      onBlur={confirmFormik.handleBlur}
                      required
                      className={`block w-full pl-10 py-3 pr-3 border ${
                        confirmFormik.touched.confirmPassword && confirmFormik.errors.confirmPassword 
                          ? 'border-red-300 text-red-900 placeholder-red-300 focus:outline-none focus:ring-red-500 focus:border-red-500' 
                          : 'border-gray-300 focus:ring-primary focus:border-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white'
                      } rounded-md shadow-sm placeholder-gray-400 transition-colors`}
                      placeholder="********"
                    />
                  </div>
                  {confirmFormik.touched.confirmPassword && confirmFormik.errors.confirmPassword ? (
                    <p className="mt-2 text-sm text-red-600 dark:text-red-400">{confirmFormik.errors.confirmPassword}</p>
                  ) : null}
                </div>

                <div>
                  <Button
                    type="submit"
                    className="w-full flex justify-center items-center py-3 px-4 rounded-md shadow-sm text-sm font-medium"
                    variant="gradient"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Réinitialisation en cours...
                      </>
                    ) : (
                      <>
                        Réinitialiser le mot de passe
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </form>
            )}

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                    Ou
                  </span>
                </div>
              </div>

              <div className="mt-6 text-center">
                <p className="mt-2 text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    {codeSent ? 'Pas reçu de code ?' : 'Vous vous souvenez de votre mot de passe ?'}{" "}
                  </span>
                  <Link
                    to={codeSent ? '/forgot-password' : '/login'}
                    className="font-medium text-primary hover:text-primary/80 dark:text-primary-light"
                  >
                    {codeSent ? 'Réessayer' : 'Se connecter'}
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage; 