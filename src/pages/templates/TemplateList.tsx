import React, { useEffect, useState } from 'react';
import { 
  Typography,
  Button,
  IconButton,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Box,
  Tooltip
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AddIcon from '@mui/icons-material/Add';
import DescriptionIcon from '@mui/icons-material/Description';
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

  const handlePreview = (templateId: string) => {
    navigate(`/templates/${templateId}/preview`);
  };

  const handleEdit = (templateId: string) => {
    navigate(`/templates/${templateId}`);
  };

  const handleDeleteConfirm = (templateId: string) => {
    setTemplateToDelete(templateId);
    setDeleteDialogOpen(true);
  };

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

  if (isLoading) {
    return (
      <Layout title="Modèles d'email">
        <Box className="flex justify-center items-center h-[50vh]">
          <CircularProgress />
        </Box>
      </Layout>
    );
  }

  return (
    <Layout title="Modèles d'email">
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <Typography variant="h4" component="h1" className="font-bold text-gray-900 dark:text-white">
              Modèles d'email
            </Typography>
            <Typography variant="body2" className="mt-1 text-gray-600 dark:text-gray-400">
              Créez et gérez vos modèles d'emails personnalisables
            </Typography>
          </div>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            onClick={() => navigate('/templates/new')}
            className="bg-primary hover:bg-primary/90 text-white shadow-md"
            size="large"
          >
            Nouveau modèle
          </Button>
        </div>

        {error && (
          <Alert severity="error" className="rounded-lg">
            {error}
          </Alert>
        )}

        {templates.length === 0 ? (
          <Card className="border border-gray-200 dark:border-gray-700 shadow-sm rounded-xl overflow-hidden">
            <div className="p-8 text-center">
              <div className="rounded-full bg-primary/10 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <DescriptionIcon className="h-8 w-8 text-primary" />
              </div>
              <Typography variant="h6" className="font-semibold text-gray-900 dark:text-white mb-2">
                Aucun modèle d'email pour le moment
              </Typography>
              <Typography variant="body2" className="text-gray-600 dark:text-gray-400 max-w-md mx-auto mb-6">
                Les modèles vous permettent de créer des emails réutilisables et personnalisables pour vos campagnes.
              </Typography>
              <Button 
                variant="contained" 
                startIcon={<AddIcon />} 
                onClick={() => navigate('/templates/new')}
                size="large"
                className="bg-primary hover:bg-primary/90"
              >
                Créer mon premier modèle
              </Button>
            </div>
          </Card>
        ) : (
          <Card className="border border-gray-200 dark:border-gray-700 shadow-sm rounded-xl overflow-hidden">
            <TableContainer>
              <Table>
                <TableHead className="bg-gray-50 dark:bg-gray-800">
                  <TableRow>
                    <TableCell className="font-semibold text-gray-900 dark:text-white">Nom</TableCell>
                    <TableCell className="font-semibold text-gray-900 dark:text-white">Objet</TableCell>
                    <TableCell className="font-semibold text-gray-900 dark:text-white">Expéditeur</TableCell>
                    <TableCell className="font-semibold text-gray-900 dark:text-white">Date de création</TableCell>
                    <TableCell className="font-semibold text-gray-900 dark:text-white">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {templates.map((template) => (
                    <TableRow 
                      key={template.templateId}
                      hover
                      className="transition-colors border-b border-gray-200 dark:border-gray-700 cursor-pointer"
                      onClick={() => handlePreview(template.templateId)}
                    >
                      <TableCell className="font-medium text-gray-900 dark:text-white">
                        {template.name}
                      </TableCell>
                      <TableCell className="text-gray-700 dark:text-gray-300">
                        {template.subject}
                      </TableCell>
                      <TableCell className="text-gray-700 dark:text-gray-300">
                        <span className="flex items-center">
                          <span className="font-medium">{template.fromName}</span>
                          <span className="mx-1 text-gray-500">&lt;</span>
                          <span className="text-primary">{template.fromEmail}</span>
                          <span className="text-gray-500">&gt;</span>
                        </span>
                      </TableCell>
                      <TableCell className="text-gray-700 dark:text-gray-300">
                        {new Date(template.createdAt).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </TableCell>
                      <TableCell className="space-x-1" onClick={(e) => e.stopPropagation()}>
                        <Tooltip title="Prévisualiser">
                          <IconButton 
                            aria-label="prévisualiser" 
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePreview(template.templateId);
                            }}
                            size="small"
                            className="text-primary hover:bg-primary/10"
                          >
                            <VisibilityIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Modifier">
                          <IconButton 
                            aria-label="modifier" 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(template.templateId);
                            }}
                            size="small"
                            className="text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Supprimer">
                          <IconButton 
                            aria-label="supprimer" 
                            color="error"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteConfirm(template.templateId);
                            }}
                            size="small"
                            className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        )}

        {/* Boîte de dialogue de confirmation de suppression */}
        <Dialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            className: 'rounded-lg'
          }}
        >
          <DialogTitle className="text-lg font-semibold">Confirmer la suppression</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Êtes-vous sûr de vouloir supprimer ce modèle ? Cette action est irréversible.
            </DialogContentText>
          </DialogContent>
          <DialogActions className="p-4">
            <Button 
              onClick={() => setDeleteDialogOpen(false)}
              className="text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Annuler
            </Button>
            <Button 
              onClick={handleDeleteTemplate} 
              color="error" 
              variant="contained"
              autoFocus
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Supprimer
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    </Layout>
  );
};

export default TemplateList; 