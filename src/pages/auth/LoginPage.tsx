import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Button } from '../../components/ui/button';
import { Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';

// Schéma de validation
const validationSchema = Yup.object({
  email: Yup.string()
    .email('Email invalide')
    .required('L\'email est requis'),
  password: Yup.string()
    .min(6, 'Le mot de passe doit contenir au moins 6 caractères')
    .required('Le mot de passe est requis')
});

const LoginPage: React.FC = () => {
  const { login, error, isLoading } = useAuth();
  const navigate = useNavigate();
  const [loginError, setLoginError] = useState<string | null>(null);

  // Gestion du formulaire avec Formik
  const formik = useFormik({
    initialValues: {
      email: '',
      password: ''
    },
    validationSchema,
    onSubmit: async (values) => {
      setLoginError(null);
      
      const success = await login(values.email, values.password);
      
      if (success) {
        navigate('/dashboard');
      } else {
        setLoginError('Échec de la connexion. Veuillez vérifier vos identifiants.');
      }
    }
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex flex-col justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            North Eyes
          </h2>
          <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
            Connexion à votre compte
          </p>
        </div>

        <div className="mt-8">
          <div className="bg-white dark:bg-gray-800 py-6 px-4 sm:py-8 sm:px-10 shadow-xl rounded-lg border border-gray-200 dark:border-gray-700 transition-all hover:shadow-lg">
            {(loginError || error) && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-md text-red-600 dark:text-red-300 text-sm">
                <p>{loginError || error}</p>
              </div>
            )}

            <form className="space-y-6" onSubmit={formik.handleSubmit}>
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
                    value={formik.values.email}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    required
                    className={`block w-full pl-10 py-3 pr-3 border ${
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
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Mot de passe
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    value={formik.values.password}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    required
                    className={`block w-full pl-10 py-3 pr-3 border ${
                      formik.touched.password && formik.errors.password 
                        ? 'border-red-300 text-red-900 placeholder-red-300 focus:outline-none focus:ring-red-500 focus:border-red-500' 
                        : 'border-gray-300 focus:ring-primary focus:border-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white'
                    } rounded-md shadow-sm placeholder-gray-400 transition-colors`}
                    placeholder="********"
                  />
                </div>
                {formik.touched.password && formik.errors.password ? (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400">{formik.errors.password}</p>
                ) : null}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                    Se souvenir de moi
                  </label>
                </div>

                <div className="text-sm">
                  <Link 
                    to="/forgot-password"
                    className="font-medium text-primary hover:text-primary-600 transition-colors"
                  >
                    Mot de passe oublié?
                  </Link>
                </div>
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
                      Connexion en cours...
                    </>
                  ) : (
                    <>
                      Se connecter
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </Button>
              </div>
            </form>

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
                    Pas encore inscrit?{" "}
                  </span>
                  <Link
                    to="/register"
                    className="font-medium text-primary hover:text-primary/80 dark:text-primary-light"
                  >
                    Créer un compte
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

export default LoginPage; 