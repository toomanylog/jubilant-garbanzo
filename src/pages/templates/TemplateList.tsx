import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  IconButton,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AddIcon from '@mui/icons-material/Add';
import Layout from '../../components/layout/Layout';
import { useAuth } from '../../contexts/AuthContext';
import { EmailTemplate, getEmailTemplatesByUserId, deleteEmailTemplate } from '../../models/dynamodb';
import { toast } from 'react-toastify';

const TemplateList: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);

  useEffect(() => {
    const fetchTemplates = async () => {
      if (!currentUser) return;
      
      try {
        const userTemplates = await getEmailTemplatesByUserId(currentUser.userId);
        setTemplates(userTemplates);
      } catch (err: any) {
        console.error('Erreur lors de la récupération des modèles:', err);
        setError(err.message || 'Une erreur est survenue');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTemplates();
  }, [currentUser]);

  // Fonction pour prévisualiser un template
  const handlePreview = (templateId: string) => {
    navigate(`/templates/${templateId}/preview`);
  };

  // Fonction pour éditer un template
  const handleEdit = (templateId: string) => {
    navigate(`/templates/${templateId}`);
  };

  // Fonction pour ouvrir la boîte de dialogue de confirmation de suppression
  const handleDeleteConfirm = (templateId: string) => {
    setTemplateToDelete(templateId);
    setDeleteDialogOpen(true);
  };

  // Fonction pour supprimer un template après confirmation
  const handleDeleteTemplate = async () => {
    if (!templateToDelete) return;
    
    try {
      const success = await deleteEmailTemplate(templateToDelete);
      if (success) {
        setTemplates(templates.filter(t => t.templateId !== templateToDelete));
        toast.success('Modèle supprimé avec succès');
      } else {
        toast.error('Erreur lors de la suppression du modèle');
      }
    } catch (err: any) {
      console.error('Erreur lors de la suppression du modèle:', err);
      toast.error(err.message || 'Une erreur est survenue');
    } finally {
      setDeleteDialogOpen(false);
      setTemplateToDelete(null);
    }
  };

  // Rendre la page pendant le chargement
  if (isLoading) {
    return (
      <Layout title="Modèles d'email">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress />
        </Box>
      </Layout>
    );
  }

  return (
    <Layout title="Modèles d'email">
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          Modèles d'email
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />} 
          onClick={() => navigate('/templates/new')}
        >
          Nouveau modèle
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {templates.length === 0 ? (
        <Paper elevation={2} sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Vous n'avez pas encore créé de modèle d'email.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Les modèles vous permettent de créer des emails réutilisables pour vos campagnes.
          </Typography>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            onClick={() => navigate('/templates/new')}
          >
            Créer un modèle
          </Button>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow>
                <TableCell>Nom</TableCell>
                <TableCell>Objet</TableCell>
                <TableCell>Expéditeur</TableCell>
                <TableCell>Date de création</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {templates.map((template) => (
                <TableRow key={template.templateId}>
                  <TableCell>{template.name}</TableCell>
                  <TableCell>{template.subject}</TableCell>
                  <TableCell>{template.fromName} &lt;{template.fromEmail}&gt;</TableCell>
                  <TableCell>{new Date(template.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <IconButton 
                      aria-label="prévisualiser" 
                      onClick={() => handlePreview(template.templateId)}
                      size="small"
                    >
                      <VisibilityIcon />
                    </IconButton>
                    <IconButton 
                      aria-label="modifier" 
                      onClick={() => handleEdit(template.templateId)}
                      size="small"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton 
                      aria-label="supprimer" 
                      color="error"
                      onClick={() => handleDeleteConfirm(template.templateId)}
                      size="small"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Boîte de dialogue de confirmation de suppression */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Êtes-vous sûr de vouloir supprimer ce modèle ? Cette action est irréversible.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Annuler</Button>
          <Button onClick={handleDeleteTemplate} color="error" autoFocus>
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
};

export default TemplateList; 