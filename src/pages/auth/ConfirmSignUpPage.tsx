import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../../contexts/AuthContext';
import { Lock, Loader2, ArrowRight, CheckCircle } from 'lucide-react';

// Schéma de validation
const validationSchema = Yup.object({
  email: Yup.string()
    .email('Email invalide')
    .required('L\'email est requis'),
  code: Yup.string()
    .required('Le code de confirmation est requis')
    .matches(/^\d+$/, 'Le code de confirmation doit contenir uniquement des chiffres')
    .min(6, 'Le code de confirmation doit contenir au moins 6 caractères')
});

const ConfirmSignUpPage: React.FC = () => {
  const { confirmSignUp } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const emailFromURL = searchParams.get('email') || '';

  const formik = useFormik({
    initialValues: {
      email: emailFromURL,
      code: ''
    },
    validationSchema,
    onSubmit: async (values) => {
      setError(null);
      setIsLoading(true);
      
      try {
        const success = await confirmSignUp(values.email, values.code);
        if (success) {
          setIsSuccess(true);
          setTimeout(() => {
            navigate('/login');
          }, 3000);
        } else {
          setError('Échec de la confirmation du compte. Veuillez vérifier votre code et réessayer.');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Une erreur est survenue lors de la confirmation du compte');
      } finally {
        setIsLoading(false);
      }
    }
  });

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex flex-col justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="text-center mb-8">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-green-600 dark:text-green-400">Compte confirmé avec succès !</h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Vous allez être redirigé vers la page de connexion...
            </p>
          </div>
          <div className="text-center">
            <Link 
              to="/login" 
              className="inline-flex items-center px-6 py-3 font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-600 transition-colors"
            >
              Se connecter maintenant
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex flex-col justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            North Eyes
          </h2>
          <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
            Confirmation de votre compte
          </p>
        </div>

        <div className="mt-8">
          <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow-xl rounded-lg border border-gray-200 dark:border-gray-700 sm:px-10 transition-all hover:shadow-lg">
            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-md text-red-600 dark:text-red-300 text-sm">
                <p>{error}</p>
              </div>
            )}

            <form className="space-y-6" onSubmit={formik.handleSubmit}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Adresse email
                </label>
                <div className="mt-1 rounded-md shadow-sm">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={formik.values.email}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    required
                    className={`block w-full py-3 px-4 border ${
                      formik.touched.email && formik.errors.email 
                        ? 'border-red-300 text-red-900 placeholder-red-300 focus:outline-none focus:ring-red-500 focus:border-red-500' 
                        : 'border-gray-300 focus:ring-primary focus:border-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white'
                    } rounded-md shadow-sm placeholder-gray-400 transition-colors`}
                    placeholder="nom@exemple.com"
                  />
                </div>
                {formik.touched.email && formik.errors.email ? (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400">{formik.errors.email}</p>
                ) : null}
              </div>

              <div>
                <label htmlFor="code" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Code de confirmation
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="code"
                    name="code"
                    type="text"
                    value={formik.values.code}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    required
                    className={`block w-full pl-10 py-3 pr-3 border ${
                      formik.touched.code && formik.errors.code 
                        ? 'border-red-300 text-red-900 placeholder-red-300 focus:outline-none focus:ring-red-500 focus:border-red-500' 
                        : 'border-gray-300 focus:ring-primary focus:border-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white'
                    } rounded-md shadow-sm placeholder-gray-400 transition-colors`}
                    placeholder="123456"
                  />
                </div>
                {formik.touched.code && formik.errors.code ? (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400">{formik.errors.code}</p>
                ) : null}
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Veuillez saisir le code à 6 chiffres qui a été envoyé à votre adresse email.
                </p>
              </div>

              <div>
                <button
                  type="submit"
                  className="w-full flex justify-center items-center py-3 px-4 bg-gradient-to-r from-primary to-secondary text-white rounded-md shadow-sm font-medium hover:from-primary-600 hover:to-secondary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Vérification en cours...
                    </>
                  ) : (
                    <>
                      Confirmer mon compte
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Vous n'avez pas reçu de code? Contactez notre support.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmSignUpPage; 