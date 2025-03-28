import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Container,
  Grid,
  Button as MuiButton,
  LinearProgress
} from '@mui/material';
import { 
  MailOutline as MailIcon, 
  Send as SendIcon, 
  ViewList as ListIcon, 
  Description as TemplateIcon 
} from '@mui/icons-material';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Mail, Send, FileText, Users, BarChart3, Zap } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Layout from '../../components/layout/Layout';
import { CampaignService } from '../../services/campaign-service';
import { TemplateService } from '../../services/template-service';
import { SmtpProviderService } from '../../services/smtp-provider-service';

const DashboardPage: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalCampaigns: 0,
    activeCampaigns: 0,
    totalTemplates: 0,
    totalProviders: 0,
    loading: true
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [totalCampaigns, activeCampaigns, totalTemplates, totalProviders] = await Promise.all([
          CampaignService.getTotalCampaigns(),
          CampaignService.getActiveCampaigns(),
          TemplateService.getTotalTemplates(),
          SmtpProviderService.getTotalSmtpProviders()
        ]);
        
        setStats({
          totalCampaigns,
          activeCampaigns,
          totalTemplates,
          totalProviders,
          loading: false
        });
      } catch (error) {
        console.error("Erreur lors du chargement des statistiques:", error);
        setStats(prev => ({ ...prev, loading: false }));
      }
    };

    fetchStats();
  }, []);

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  const featuredCards = [
    {
      title: "Gestion des campagnes",
      description: "Créez et gérez vos campagnes d'emails pour atteindre votre audience.",
      icon: <Send className="h-12 w-12 text-primary" />,
      action: () => handleNavigate('/campaigns'),
      buttonText: "Voir mes campagnes",
      count: stats.totalCampaigns,
      active: stats.activeCampaigns,
      gradient: "from-blue-500 to-purple-500"
    },
    {
      title: "Templates personnalisés",
      description: "Créez des templates d'emails professionnels avec notre éditeur intuitif.",
      icon: <FileText className="h-12 w-12 text-primary" />,
      action: () => handleNavigate('/templates'),
      buttonText: "Gérer mes templates",
      count: stats.totalTemplates,
      gradient: "from-purple-500 to-pink-500"
    },
    {
      title: "Fournisseurs SMTP",
      description: "Configurez vos fournisseurs SMTP pour envoyer des emails via vos propres services.",
      icon: <Mail className="h-12 w-12 text-primary" />,
      action: () => handleNavigate('/smtp-providers'),
      buttonText: "Configurer SMTP",
      count: stats.totalProviders,
      gradient: "from-green-500 to-teal-500"
    }
  ];

  return (
    <Layout title="Tableau de bord">
      <Box className="bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 min-h-screen py-8">
        <Container maxWidth="lg">
          {/* Welcome Section */}
          <Box className="mb-10">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary to-secondary p-8 mb-6">
              <div className="absolute inset-0 bg-grid-white/10 bg-[size:20px_20px] opacity-20"></div>
              <div className="relative">
                <h1 className="text-3xl font-bold text-white mb-2">
                  Bienvenue, {currentUser?.fullName || 'Utilisateur'}
                </h1>
                <p className="text-white/80 max-w-xl">
                  Gérez efficacement vos campagnes d'emails, créez des templates personnalisés et configurez vos fournisseurs SMTP en toute simplicité.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Button 
                    variant="gradient" 
                    onClick={() => navigate('/campaigns/new')}
                    className="group"
                  >
                    <Send size={18} className="mr-2 group-hover:animate-pulse" />
                    Nouvelle campagne
                  </Button>
                  <Button 
                    variant="outline" 
                    className="border-white/30 text-white hover:bg-white/10 hover:border-white"
                    onClick={() => navigate('/templates/new')}
                  >
                    <FileText size={18} className="mr-2" />
                    Nouveau template
                  </Button>
                </div>
              </div>
              
              {/* Decorative elements */}
              <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-white/10 blur-2xl"></div>
              <div className="absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-white/10 blur-2xl"></div>
            </div>
          </Box>

          {/* Stats Overview */}
          <Box className="mb-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {stats.loading ? (
                <div className="col-span-3 p-8">
                  <LinearProgress />
                </div>
              ) : (
                featuredCards.map((card, index) => (
                  <Card key={index} className="overflow-hidden border-0 bg-white dark:bg-gray-900 shadow-md hover:shadow-xl transition-all duration-300">
                    <div className={`h-2 bg-gradient-to-r ${card.gradient}`}></div>
                    <CardHeader className="pt-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>{card.title}</CardTitle>
                          <CardDescription className="mt-2">{card.description}</CardDescription>
                        </div>
                        <div className="p-3 rounded-full bg-gray-100 dark:bg-gray-800">
                          {card.icon}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-3xl font-bold">{card.count}</span>
                        {card.active !== undefined && (
                          <span className="text-sm text-gray-500">
                            ({card.active} actifs)
                          </span>
                        )}
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button 
                        onClick={card.action}
                        variant="outline-gradient" 
                        className="w-full justify-center"
                      >
                        {card.buttonText}
                      </Button>
                    </CardFooter>
                  </Card>
                ))
              )}
            </div>
          </Box>

          {/* Features */}
          <Box className="mb-10">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent inline-block">
                Fonctionnalités principales
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mt-2 max-w-2xl mx-auto">
                Découvrez toutes les possibilités offertes par notre plateforme d'envoi d'emails
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="p-6 bg-white dark:bg-gray-900 rounded-lg shadow-sm hover:shadow-md transition-all border border-gray-100 dark:border-gray-800">
                <div className="p-3 rounded-full bg-primary/10 w-fit mb-4">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-bold text-lg mb-2">Envoi rapide</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Envoyez des emails à des milliers de destinataires en quelques clics seulement.
                </p>
              </div>

              <div className="p-6 bg-white dark:bg-gray-900 rounded-lg shadow-sm hover:shadow-md transition-all border border-gray-100 dark:border-gray-800">
                <div className="p-3 rounded-full bg-secondary/10 w-fit mb-4">
                  <BarChart3 className="h-6 w-6 text-secondary" />
                </div>
                <h3 className="font-bold text-lg mb-2">Statistiques détaillées</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Suivez les performances de vos campagnes avec des rapports détaillés.
                </p>
              </div>

              <div className="p-6 bg-white dark:bg-gray-900 rounded-lg shadow-sm hover:shadow-md transition-all border border-gray-100 dark:border-gray-800">
                <div className="p-3 rounded-full bg-green-500/10 w-fit mb-4">
                  <Users className="h-6 w-6 text-green-500" />
                </div>
                <h3 className="font-bold text-lg mb-2">Segmentation avancée</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Ciblez précisément votre audience avec notre système de segmentation.
                </p>
              </div>
            </div>
          </Box>

          {/* Getting Started Section */}
          <Box>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-8 border border-gray-100 dark:border-gray-700">
              <h2 className="text-2xl font-bold mb-4">Pour commencer</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Suivez ces étapes pour configurer votre première campagne d'emails
              </p>
              
              <ol className="space-y-4">
                <li className="flex items-start gap-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white font-medium">
                    1
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Configurez un fournisseur SMTP</h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      Ajoutez les détails de connexion de votre fournisseur de services d'emails.
                    </p>
                    <MuiButton 
                      variant="text" 
                      size="small" 
                      onClick={() => navigate('/smtp-providers/new')}
                      className="mt-2"
                    >
                      Ajouter un fournisseur
                    </MuiButton>
                  </div>
                </li>
                
                <li className="flex items-start gap-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white font-medium">
                    2
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Créez un template d'email</h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      Concevez un template attrayant avec notre éditeur visuel ou importez votre HTML.
                    </p>
                    <MuiButton 
                      variant="text" 
                      size="small" 
                      onClick={() => navigate('/templates/new')}
                      className="mt-2"
                    >
                      Créer un template
                    </MuiButton>
                  </div>
                </li>
                
                <li className="flex items-start gap-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white font-medium">
                    3
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Lancez votre campagne</h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      Choisissez votre template, sélectionnez vos destinataires et lancez votre campagne.
                    </p>
                    <MuiButton 
                      variant="text" 
                      size="small" 
                      onClick={() => navigate('/campaigns/new')}
                      className="mt-2"
                    >
                      Créer une campagne
                    </MuiButton>
                  </div>
                </li>
              </ol>
            </div>
          </Box>
        </Container>
      </Box>
    </Layout>
  );
};

export default DashboardPage; 