import React from 'react';
import { Box, Button, Container, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

const NotFoundPage: React.FC = () => {
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
        <ErrorOutlineIcon sx={{ fontSize: 100, color: 'primary.main', mb: 4 }} />
        
        <Typography variant="h1" component="h1" gutterBottom>
          404
        </Typography>
        
        <Typography variant="h4" component="h2" gutterBottom>
          Page non trouvée
        </Typography>
        
        <Typography variant="body1" color="text.secondary" paragraph sx={{ maxWidth: 600, mb: 4 }}>
          La page que vous recherchez n'existe pas ou a été déplacée. 
          Vérifiez l'URL ou retournez à la page d'accueil.
        </Typography>
        
        <Button 
          component={RouterLink} 
          to="/" 
          variant="contained" 
          size="large"
          sx={{ mt: 2 }}
        >
          Retour à l'accueil
        </Button>
      </Box>
    </Container>
  );
};

export default NotFoundPage; 