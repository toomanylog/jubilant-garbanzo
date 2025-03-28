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
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
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

// Contexte d'authentification
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Composant pour les routes protégées qui nécessitent une authentification
interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { currentUser, isLoading } = useAuth();

  if (isLoading) {
    return <div>Chargement...</div>;
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
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            minHeight: '100vh'
          }}>
            <Navbar />
            <Box sx={{ flexGrow: 1 }}>
              <Routes>
                {/* Routes publiques */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                
                {/* Pages légales et aide */}
                <Route path="/legal/terms" element={<TermsPage />} />
                <Route path="/legal/privacy" element={<PrivacyPage />} />
                <Route path="/legal/cookies" element={<CookiesPage />} />
                <Route path="/help" element={<HelpPage />} />
                
                {/* Routes protégées */}
                <Route 
                  path="/" 
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
                
                {/* Page d'erreur 404 */}
                <Route path="/error" element={<ErrorPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Box>
            <Footer />
          </Box>
        </Router>
      </AuthProvider>
      <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} />
    </ThemeProvider>
  );
};

export default App;
