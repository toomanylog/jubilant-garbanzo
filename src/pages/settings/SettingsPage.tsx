import React from 'react';
import { Typography, Container, Paper, Box } from '@mui/material';
import Layout from '../../components/layout/Layout';

const SettingsPage: React.FC = () => {
  return (
    <Layout title="Paramètres">
      <Container maxWidth="lg">
        <Paper elevation={1} sx={{ p: 3, mt: 3 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Paramètres
          </Typography>
          <Typography variant="body1" paragraph>
            Cette page vous permet de gérer vos paramètres utilisateur et les préférences de l'application.
          </Typography>
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom>
              Paramètres à venir
            </Typography>
            <Typography variant="body2">
              Cette fonctionnalité est en cours de développement et sera disponible prochainement.
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Layout>
  );
};

export default SettingsPage; 