import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Button } from '../../components/ui/button';
import { Mail, Lock, User, ArrowRight, Loader2 } from 'lucide-react';

// Schéma de validation
const validationSchema = Yup.object({
  fullName: Yup.string()
    .required('Le nom complet est requis'),
  email: Yup.string()
    .email('Email invalide')
    .required('L\'email est requis'),
  password: Yup.string()
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
    .matches(/[A-Z]/, 'Le mot de passe doit contenir au moins une lettre majuscule')
    .matches(/[a-z]/, 'Le mot de passe doit contenir au moins une lettre minuscule')
    .matches(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre')
    .matches(/[^A-Za-z0-9]/, 'Le mot de passe doit contenir au moins un caractère spécial')
    .required('Le mot de passe est requis'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'Les mots de passe ne correspondent pas')
    .required('La confirmation du mot de passe est requise')
});

const RegisterPage: React.FC = () => {
  const { register, error, isLoading } = useAuth();
  const navigate = useNavigate();
  const [registerError, setRegisterError] = useState<string | null>(null);

  // Gestion du formulaire avec Formik
  const formik = useFormik({
    initialValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: ''
    },
    validationSchema,
    onSubmit: async (values) => {
      setRegisterError(null);
      
      const success = await register(values.email, values.fullName, values.password);
      
      if (success) {
        navigate('/dashboard');
      } else {
        setRegisterError('Échec de l\'inscription. Veuillez réessayer ultérieurement.');
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
            Créer un nouveau compte
          </p>
        </div>

        <div className="mt-8">
          <div className="bg-white dark:bg-gray-800 py-6 px-4 sm:py-8 sm:px-10 shadow-xl rounded-lg border border-gray-200 dark:border-gray-700 transition-all hover:shadow-lg">
            {(registerError || error) && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-md text-red-600 dark:text-red-300 text-sm">
                <p>{registerError || error}</p>
              </div>
            )}

            <form className="space-y-6" onSubmit={formik.handleSubmit}>
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Nom complet
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    autoComplete="name"
                    value={formik.values.fullName}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    required
                    className={`block w-full pl-10 py-3 pr-3 border ${
                      formik.touched.fullName && formik.errors.fullName 
                        ? 'border-red-300 text-red-900 placeholder-red-300 focus:outline-none focus:ring-red-500 focus:border-red-500' 
                        : 'border-gray-300 focus:ring-primary focus:border-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white'
                    } rounded-md shadow-sm placeholder-gray-400 transition-colors`}
                    placeholder="John Doe"
                  />
                </div>
                {formik.touched.fullName && formik.errors.fullName ? (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400">{formik.errors.fullName}</p>
                ) : null}
              </div>

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
                    autoComplete="new-password"
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
                
                <div className="mt-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Le mot de passe doit contenir au moins :
                  </p>
                  <ul className="mt-1 text-xs text-gray-500 dark:text-gray-400 space-y-1">
                    <li className={`flex items-center ${formik.values.password.length >= 8 ? 'text-green-500 dark:text-green-400' : ''}`}>
                      <span className={`mr-1 ${formik.values.password.length >= 8 ? 'text-green-500 dark:text-green-400' : ''}`}>
                        {formik.values.password.length >= 8 ? '✓' : '○'}
                      </span>
                      8 caractères
                    </li>
                    <li className={`flex items-center ${/[A-Z]/.test(formik.values.password) ? 'text-green-500 dark:text-green-400' : ''}`}>
                      <span className={`mr-1 ${/[A-Z]/.test(formik.values.password) ? 'text-green-500 dark:text-green-400' : ''}`}>
                        {/[A-Z]/.test(formik.values.password) ? '✓' : '○'}
                      </span>
                      Une lettre majuscule
                    </li>
                    <li className={`flex items-center ${/[a-z]/.test(formik.values.password) ? 'text-green-500 dark:text-green-400' : ''}`}>
                      <span className={`mr-1 ${/[a-z]/.test(formik.values.password) ? 'text-green-500 dark:text-green-400' : ''}`}>
                        {/[a-z]/.test(formik.values.password) ? '✓' : '○'}
                      </span>
                      Une lettre minuscule
                    </li>
                    <li className={`flex items-center ${/[0-9]/.test(formik.values.password) ? 'text-green-500 dark:text-green-400' : ''}`}>
                      <span className={`mr-1 ${/[0-9]/.test(formik.values.password) ? 'text-green-500 dark:text-green-400' : ''}`}>
                        {/[0-9]/.test(formik.values.password) ? '✓' : '○'}
                      </span>
                      Un chiffre
                    </li>
                    <li className={`flex items-center ${/[^A-Za-z0-9]/.test(formik.values.password) ? 'text-green-500 dark:text-green-400' : ''}`}>
                      <span className={`mr-1 ${/[^A-Za-z0-9]/.test(formik.values.password) ? 'text-green-500 dark:text-green-400' : ''}`}>
                        {/[^A-Za-z0-9]/.test(formik.values.password) ? '✓' : '○'}
                      </span>
                      Un caractère spécial
                    </li>
                  </ul>
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Confirmer le mot de passe
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    value={formik.values.confirmPassword}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    required
                    className={`block w-full pl-10 py-3 pr-3 border ${
                      formik.touched.confirmPassword && formik.errors.confirmPassword 
                        ? 'border-red-300 text-red-900 placeholder-red-300 focus:outline-none focus:ring-red-500 focus:border-red-500' 
                        : 'border-gray-300 focus:ring-primary focus:border-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white'
                    } rounded-md shadow-sm placeholder-gray-400 transition-colors`}
                    placeholder="********"
                  />
                </div>
                {formik.touched.confirmPassword && formik.errors.confirmPassword ? (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400">{formik.errors.confirmPassword}</p>
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
                      Inscription en cours...
                    </>
                  ) : (
                    <>
                      S'inscrire
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
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Vous avez déjà un compte? {' '}
                  <Link 
                    to="/login" 
                    className="font-medium text-primary hover:text-primary-600 transition-colors hover:underline"
                  >
                    Se connecter
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

export default RegisterPage; 