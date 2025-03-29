import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { Box } from '@mui/material';
import theme from './theme';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import NotFoundPage from './pages/common/NotFoundPage';
import ErrorPage from './pages/common/ErrorPage';
import TermsPage from './pages/legal/TermsPage';
import PrivacyPage from './pages/legal/PrivacyPage';
import HelpPage from './pages/help/HelpPage';
import CookiesPage from './pages/legal/CookiesPage';

// Pages
import HomePage from './pages/home/HomePage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ConfirmSignUpPage from './pages/auth/ConfirmSignUpPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import SmtpProviderList from './pages/smtp-providers/SmtpProviderList';
import SmtpProviderForm from './pages/smtp-providers/SmtpProviderForm';
import TemplateList from './pages/templates/TemplateList';
import TemplateForm from './pages/templates/TemplateForm';
import TemplatePreview from './pages/templates/TemplatePreview';
import CampaignList from './pages/campaigns/CampaignList';
import CampaignForm from './pages/campaigns/CampaignForm';
import CampaignDetails from './pages/campaigns/CampaignDetails';
import SettingsPage from './pages/settings/SettingsPage';
import ProfilePage from './pages/profile/ProfilePage';

// Contexte d'authentification
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Composant pour les routes protégées qui nécessitent une authentification
interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { currentUser, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        minHeight: '50vh',
        mt: 8
      }}>
        <Box sx={{ textAlign: 'center' }}>
          <div className="animate-pulse flex flex-col items-center">
            <div className="h-12 w-12 bg-primary/20 rounded-full mb-4 flex items-center justify-center">
              <div className="h-8 w-8 bg-primary/40 rounded-full"></div>
            </div>
            <div className="h-2 w-24 bg-gray-200 rounded mb-2.5"></div>
            <div className="h-2 w-20 bg-gray-200 rounded"></div>
          </div>
        </Box>
      </Box>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
};

// Composant principal de l'application
const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <AuthProvider>
        <Router>
          <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
            <Navbar />
            <div className="flex-grow mt-16 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
              <Routes>
                {/* Page d'accueil */}
                <Route path="/" element={<HomePage />} />
                
                {/* Routes publiques */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/confirm-signup" element={<ConfirmSignUpPage />} />
                
                {/* Pages légales et aide */}
                <Route path="/legal/terms" element={<TermsPage />} />
                <Route path="/legal/privacy" element={<PrivacyPage />} />
                <Route path="/legal/cookies" element={<CookiesPage />} />
                <Route path="/help" element={<HelpPage />} />
                
                {/* Routes protégées */}
                <Route 
                  path="/dashboard" 
                  element={
                    <ProtectedRoute>
                      <DashboardPage />
                    </ProtectedRoute>
                  } 
                />
                
                {/* Routes pour les fournisseurs SMTP */}
                <Route 
                  path="/smtp-providers" 
                  element={
                    <ProtectedRoute>
                      <SmtpProviderList />
                    </ProtectedRoute>
                  }
                />
                <Route 
                  path="/smtp-providers/new" 
                  element={
                    <ProtectedRoute>
                      <SmtpProviderForm />
                    </ProtectedRoute>
                  }
                />
                <Route 
                  path="/smtp-providers/:providerId" 
                  element={
                    <ProtectedRoute>
                      <SmtpProviderForm />
                    </ProtectedRoute>
                  }
                />
                
                {/* Routes pour les modèles d'email */}
                <Route 
                  path="/templates" 
                  element={
                    <ProtectedRoute>
                      <TemplateList />
                    </ProtectedRoute>
                  }
                />
                <Route 
                  path="/templates/new" 
                  element={
                    <ProtectedRoute>
                      <TemplateForm />
                    </ProtectedRoute>
                  }
                />
                <Route 
                  path="/templates/:templateId" 
                  element={
                    <ProtectedRoute>
                      <TemplateForm />
                    </ProtectedRoute>
                  }
                />
                <Route 
                  path="/templates/:templateId/preview" 
                  element={
                    <ProtectedRoute>
                      <TemplatePreview />
                    </ProtectedRoute>
                  }
                />
                
                {/* Routes pour les campagnes email */}
                <Route 
                  path="/campaigns" 
                  element={
                    <ProtectedRoute>
                      <CampaignList />
                    </ProtectedRoute>
                  }
                />
                <Route 
                  path="/campaigns/new" 
                  element={
                    <ProtectedRoute>
                      <CampaignForm />
                    </ProtectedRoute>
                  }
                />
                <Route 
                  path="/campaigns/:campaignId" 
                  element={
                    <ProtectedRoute>
                      <CampaignForm />
                    </ProtectedRoute>
                  }
                />
                <Route 
                  path="/campaigns/:campaignId/details" 
                  element={
                    <ProtectedRoute>
                      <CampaignDetails />
                    </ProtectedRoute>
                  }
                />
                
                {/* Route pour les paramètres */}
                <Route 
                  path="/settings" 
                  element={
                    <ProtectedRoute>
                      <SettingsPage />
                    </ProtectedRoute>
                  }
                />
                
                {/* Route pour le profil utilisateur */}
                <Route 
                  path="/profile" 
                  element={
                    <ProtectedRoute>
                      <ProfilePage />
                    </ProtectedRoute>
                  }
                />
                
                {/* Page d'erreur 404 */}
                <Route path="/error" element={<ErrorPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </div>
            <Footer />
          </div>
        </Router>
      </AuthProvider>
      <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} />
    </ThemeProvider>
  );
};

export default App;
