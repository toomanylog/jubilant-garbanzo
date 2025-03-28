import React from 'react';
import { Link } from 'react-router-dom';
import { Box, Container, Typography, Grid, Button as MuiButton } from '@mui/material';
import { Eye, Mail, Send, Shield, BarChart3, Users } from 'lucide-react';
import { Button } from '../../components/ui/button';

const HomePage: React.FC = () => {
  return (
    <Box sx={{ bgcolor: 'background.default' }}>
      {/* Hero section */}
      <Box 
        sx={{ 
          pt: { xs: 8, sm: 10, md: 12 }, 
          pb: { xs: 8, sm: 10 },
          background: 'linear-gradient(to right, var(--primary), var(--secondary))'
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Box sx={{ color: 'white', textAlign: { xs: 'center', md: 'left' } }}>
                <Typography 
                  variant="h1" 
                  component="h1" 
                  sx={{ 
                    fontSize: { xs: '2.5rem', sm: '3rem', md: '3.5rem' },
                    fontWeight: 800,
                    mb: 2
                  }}
                >
                  Gérez vos campagnes d'emails avec <span style={{ color: '#f0f0f0' }}>North Eyes</span>
                </Typography>
                
                <Typography 
                  variant="h2" 
                  component="p" 
                  sx={{ 
                    fontSize: { xs: '1.2rem', md: '1.4rem' },
                    fontWeight: 400,
                    mb: 4,
                    opacity: 0.9
                  }}
                >
                  Une plateforme puissante pour créer, envoyer et analyser vos campagnes d'emailing en toute simplicité.
                </Typography>
                
                <Box 
                  sx={{ 
                    display: 'flex', 
                    gap: 2, 
                    flexWrap: 'wrap',
                    justifyContent: { xs: 'center', md: 'flex-start' }
                  }}
                >
                  <Button
                    size="lg"
                    variant="secondary"
                    className="font-medium"
                    asChild
                  >
                    <Link to="/register">
                      Commencer gratuitement
                    </Link>
                  </Button>
                  
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-white/30 text-white hover:bg-white/10 hover:border-white font-medium"
                    asChild
                  >
                    <Link to="/login">
                      Connexion
                    </Link>
                  </Button>
                </Box>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6} sx={{ display: { xs: 'none', md: 'block' } }}>
              <Box
                sx={{
                  position: 'relative',
                  height: '100%',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
              >
                <Box
                  sx={{
                    width: '80%',
                    height: '350px',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    backdropFilter: 'blur(8px)',
                    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    p: 4
                  }}
                >
                  <Eye size={80} color="#ffffff" strokeWidth={1.5} />
                  <Typography
                    variant="h3"
                    component="span"
                    sx={{
                      mt: 2,
                      fontSize: '2rem',
                      fontWeight: 700,
                      color: 'white'
                    }}
                  >
                    NORTH EYES
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      mt: 2,
                      color: 'rgba(255, 255, 255, 0.8)',
                      textAlign: 'center'
                    }}
                  >
                    Visualisez l'impact de vos campagnes en temps réel
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Features section */}
      <Box sx={{ py: { xs: 8, md: 12 } }}>
        <Container maxWidth="lg">
          <Typography
            variant="h2"
            component="h2"
            align="center"
            sx={{
              fontSize: { xs: '2rem', md: '2.5rem' },
              fontWeight: 700,
              mb: 2
            }}
          >
            Fonctionnalités principales
          </Typography>
          
          <Typography
            variant="body1"
            align="center"
            color="text.secondary"
            sx={{ mb: 8, maxWidth: '700px', mx: 'auto' }}
          >
            Notre plateforme offre tout ce dont vous avez besoin pour gérer efficacement vos campagnes d'emails.
          </Typography>

          <Grid container spacing={4}>
            {[
              {
                icon: <Send size={40} />,
                title: 'Envoi d\'emails',
                description: 'Envoyez des milliers d\'emails personnalisés en quelques clics seulement.'
              },
              {
                icon: <Mail size={40} />,
                title: 'Templates personnalisés',
                description: 'Créez des templates d\'emails professionnels avec notre éditeur intuitif.'
              },
              {
                icon: <BarChart3 size={40} />,
                title: 'Analytique détaillée',
                description: 'Suivez les performances de vos campagnes avec des statistiques en temps réel.'
              },
              {
                icon: <Shield size={40} />,
                title: 'Sécurité renforcée',
                description: 'Vos données sont protégées avec les plus hauts standards de sécurité.'
              },
              {
                icon: <Users size={40} />,
                title: 'Gestion des contacts',
                description: 'Organisez et segmentez vos contacts pour des campagnes ciblées.'
              }
            ].map((feature, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Box
                  sx={{
                    p: 4,
                    height: '100%',
                    bgcolor: 'background.paper',
                    borderRadius: 2,
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
                    },
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center'
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mb: 3,
                      width: 80,
                      height: 80,
                      borderRadius: '50%',
                      bgcolor: 'primary.light',
                      color: 'primary.main'
                    }}
                  >
                    {feature.icon}
                  </Box>
                  <Typography variant="h5" component="h3" gutterBottom fontWeight={600}>
                    {feature.title}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    {feature.description}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* CTA section */}
      <Box 
        sx={{ 
          py: { xs: 8, md: 10 },
          bgcolor: 'grey.100'
        }}
      >
        <Container maxWidth="md">
          <Box
            sx={{
              textAlign: 'center',
              p: { xs: 4, md: 6 },
              borderRadius: 4,
              bgcolor: 'background.paper',
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.06)'
            }}
          >
            <Typography
              variant="h3"
              component="h2"
              sx={{
                fontSize: { xs: '1.75rem', md: '2.25rem' },
                fontWeight: 700,
                mb: 2
              }}
            >
              Prêt à transformer votre stratégie d'emailing ?
            </Typography>
            
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ mb: 4, maxWidth: '600px', mx: 'auto' }}
            >
              Inscrivez-vous aujourd'hui et commencez à créer des campagnes d'emails qui convertissent.
            </Typography>
            
            <Button
              size="lg"
              className="font-medium px-8"
              asChild
            >
              <Link to="/register">
                Commencer maintenant
              </Link>
            </Button>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default HomePage; 