import React from 'react';
import { Box, Button, Container, Typography } from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';

interface ErrorPageProps {
  code?: number;
  title?: string;
  message?: string;
  showBackButton?: boolean;
  showHomeButton?: boolean;
}

const ErrorPage: React.FC<ErrorPageProps> = ({
  code = 500,
  title = "Erreur serveur",
  message = "Une erreur s'est produite lors du traitement de votre demande. Veuillez réessayer plus tard.",
  showBackButton = true,
  showHomeButton = true
}) => {
  const navigate = useNavigate();
  
  const handleGoBack = () => {
    navigate(-1);
  };
  
  return (
    <Container maxWidth="md">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '80vh',
          textAlign: 'center',
          py: 8
        }}
      >
        <ReportProblemIcon sx={{ fontSize: 100, color: 'error.main', mb: 4 }} />
        
        <Typography variant="h1" component="h1" gutterBottom>
          {code}
        </Typography>
        
        <Typography variant="h4" component="h2" gutterBottom>
          {title}
        </Typography>
        
        <Typography variant="body1" color="text.secondary" paragraph sx={{ maxWidth: 600, mb: 4 }}>
          {message}
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
          {showBackButton && (
            <Button 
              variant="outlined" 
              size="large"
              onClick={handleGoBack}
            >
              Retour
            </Button>
          )}
          
          {showHomeButton && (
            <Button 
              component={RouterLink} 
              to="/" 
              variant="contained" 
              size="large"
            >
              Accueil
            </Button>
          )}
        </Box>
      </Box>
    </Container>
  );
};

export default ErrorPage; 