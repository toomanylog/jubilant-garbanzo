import React, { useState, useCallback, useRef } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Typography,
  Paper,
  Alert,
  Snackbar,
  Chip,
  Divider,
  LinearProgress
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import Papa from 'papaparse';

interface FileImportCampaignProps {
  onImportSuccess: (emails: string[]) => void;
  maxFileSize?: number; // En Mo
  allowedFileTypes?: string[]; // Ex: ['.csv', '.txt', '.xlsx']
}

const FileImportCampaign: React.FC<FileImportCampaignProps> = ({
  onImportSuccess,
  maxFileSize = 10, // 10 Mo par défaut
  allowedFileTypes = ['.csv', '.txt']
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [fileInfo, setFileInfo] = useState<{name: string, size: number} | null>(null);
  const [validEmails, setValidEmails] = useState<string[]>([]);
  const [invalidEmails, setInvalidEmails] = useState<string[]>([]);
  const [showSnackbar, setShowSnackbar] = useState(false);
  
  // Référence à l'input file caché
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validation d'email simple
  const isValidEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  };

  // Traiter le fichier CSV
  const processCsvFile = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);
    
    // Simuler la progression du téléchargement
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 95) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + 5;
      });
    }, 200);
    
    try {
      Papa.parse(file, {
        skipEmptyLines: true,
        complete: (results) => {
          clearInterval(progressInterval);
          setUploadProgress(100);
          
          // Extraire les emails des données du CSV
          const emails: string[] = results.data
            .map((row: any) => {
              // Si c'est une ligne avec un seul élément, le considérer comme un email
              if (Array.isArray(row) && row.length === 1) {
                return row[0];
              }
              
              // Si c'est une ligne avec plusieurs colonnes, chercher une colonne qui contient un email
              if (Array.isArray(row) && row.length > 1) {
                const possibleEmail = row.find((cell: any) => 
                  typeof cell === 'string' && isValidEmail(cell)
                );
                return possibleEmail || '';
              }
              
              // Si c'est juste une chaîne
              return typeof row === 'string' ? row : '';
            })
            .filter(email => email.trim() !== '');
          
          // Valider les emails
          const valid: string[] = [];
          const invalid: string[] = [];
          
          emails.forEach(email => {
            if (isValidEmail(email)) {
              valid.push(email.trim());
            } else {
              invalid.push(email.trim());
            }
          });
          
          setValidEmails(valid);
          setInvalidEmails(invalid);
          
          if (valid.length > 0) {
            setSuccess(true);
            setShowSnackbar(true);
            onImportSuccess(valid);
          } else {
            setError('Aucun email valide trouvé dans le fichier');
          }
          
          setIsUploading(false);
        },
        error: (error) => {
          clearInterval(progressInterval);
          setError(`Erreur lors de l'analyse du fichier: ${error.message}`);
          setIsUploading(false);
          setUploadProgress(0);
        }
      });
    } catch (err: any) {
      clearInterval(progressInterval);
      setError(`Erreur lors du traitement du fichier: ${err.message}`);
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Traiter le fichier TXT
  const processTxtFile = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);
    
    // Simuler la progression du téléchargement
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 95) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + 5;
      });
    }, 200);
    
    try {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        clearInterval(progressInterval);
        setUploadProgress(100);
        
        if (e.target && typeof e.target.result === 'string') {
          const content = e.target.result;
          
          // Séparer le contenu par lignes
          const lines = content.split(/\r?\n/);
          
          // Filtrer les emails valides
          const valid: string[] = [];
          const invalid: string[] = [];
          
          lines.forEach(line => {
            const trimmedLine = line.trim();
            if (trimmedLine !== '') {
              if (isValidEmail(trimmedLine)) {
                valid.push(trimmedLine);
              } else {
                invalid.push(trimmedLine);
              }
            }
          });
          
          setValidEmails(valid);
          setInvalidEmails(invalid);
          
          if (valid.length > 0) {
            setSuccess(true);
            setShowSnackbar(true);
            onImportSuccess(valid);
          } else {
            setError('Aucun email valide trouvé dans le fichier');
          }
        }
        
        setIsUploading(false);
      };
      
      reader.onerror = () => {
        clearInterval(progressInterval);
        setError('Erreur lors de la lecture du fichier');
        setIsUploading(false);
        setUploadProgress(0);
      };
      
      reader.readAsText(file);
    } catch (err: any) {
      clearInterval(progressInterval);
      setError(`Erreur lors du traitement du fichier: ${err.message}`);
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Vérifier l'extension du fichier
  const isValidFileType = (fileName: string): boolean => {
    const fileExtension = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();
    return allowedFileTypes.includes(fileExtension);
  };

  // Gérer le téléchargement du fichier
  const handleFileUpload = useCallback(async (file: File) => {
    setError(null);
    setSuccess(false);
    setValidEmails([]);
    setInvalidEmails([]);
    
    if (!isValidFileType(file.name)) {
      setError(`Type de fichier non pris en charge. Veuillez utiliser: ${allowedFileTypes.join(', ')}`);
      return;
    }
    
    if (file.size > maxFileSize * 1024 * 1024) {
      setError(`Fichier trop volumineux. Taille maximale: ${maxFileSize} Mo`);
      return;
    }
    
    setFileInfo({
      name: file.name,
      size: file.size
    });
    
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    
    if (fileExtension === '.csv') {
      await processCsvFile(file);
    } else if (fileExtension === '.txt') {
      await processTxtFile(file);
    } else {
      setError('Format de fichier non pris en charge');
    }
  }, [maxFileSize, allowedFileTypes]);

  // Gestionnaires d'événements de glisser-déposer
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);
  
  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);
  
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  }, [handleFileUpload]);
  
  // Gérer le clic sur le bouton de téléchargement
  const handleButtonClick = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, []);
  
  // Gérer le changement d'input file
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileUpload(e.target.files[0]);
    }
  }, [handleFileUpload]);
  
  // Formater la taille du fichier
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) {
      return `${bytes} octets`;
    } else if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(2)} Ko`;
    } else {
      return `${(bytes / (1024 * 1024)).toFixed(2)} Mo`;
    }
  };
  
  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h6" gutterBottom>
        Importer des destinataires
      </Typography>
      
      <Typography variant="body2" color="text.secondary" paragraph>
        Importez votre liste de destinataires à partir d'un fichier CSV ou TXT. 
        Chaque ligne doit contenir une adresse email valide.
        Taille maximale: {maxFileSize} Mo.
      </Typography>
      
      <Paper
        sx={{
          p: 3,
          border: '2px dashed',
          borderColor: isDragging ? 'primary.main' : 'divider',
          backgroundColor: isDragging ? 'rgba(0, 0, 0, 0.02)' : 'background.paper',
          borderRadius: 2,
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            borderColor: 'primary.main',
            backgroundColor: 'rgba(0, 0, 0, 0.02)'
          }
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleButtonClick}
      >
        <input
          type="file"
          hidden
          ref={fileInputRef}
          accept={allowedFileTypes.join(',')}
          onChange={handleFileChange}
        />
        
        {isUploading ? (
          <Box sx={{ py: 2 }}>
            <Typography variant="body1" gutterBottom>
              Traitement du fichier...
            </Typography>
            <Box sx={{ width: '100%', mt: 2 }}>
              <LinearProgress variant="determinate" value={uploadProgress} />
              <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
                {uploadProgress}%
              </Typography>
            </Box>
          </Box>
        ) : success ? (
          <Box sx={{ py: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <CheckCircleIcon color="success" sx={{ fontSize: 60, mb: 2 }} />
            <Typography variant="h6" gutterBottom color="success.main">
              Import réussi !
            </Typography>
            <Typography variant="body2">
              {validEmails.length} emails valides importés
            </Typography>
            {invalidEmails.length > 0 && (
              <Typography variant="body2" color="error">
                {invalidEmails.length} emails invalides ignorés
              </Typography>
            )}
            <Button
              variant="outlined"
              color="primary"
              sx={{ mt: 2 }}
              onClick={() => {
                setSuccess(false);
                setFileInfo(null);
              }}
            >
              Importer un autre fichier
            </Button>
          </Box>
        ) : fileInfo ? (
          <Box sx={{ py: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <ErrorIcon color="error" sx={{ fontSize: 60, mb: 2 }} />
            <Typography variant="h6" gutterBottom color="error.main">
              Erreur
            </Typography>
            <Typography variant="body1" gutterBottom>
              Impossible de traiter le fichier {fileInfo.name}
            </Typography>
            <Typography variant="body2" color="error">
              {error}
            </Typography>
            <Button
              variant="outlined"
              color="primary"
              sx={{ mt: 2 }}
              onClick={() => {
                setFileInfo(null);
                setError(null);
              }}
            >
              Réessayer
            </Button>
          </Box>
        ) : (
          <Box sx={{ py: 3 }}>
            <CloudUploadIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Glissez-déposez votre fichier ici
            </Typography>
            <Typography variant="body2" color="text.secondary">
              ou cliquez pour sélectionner un fichier
            </Typography>
            <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 1 }}>
              Formats acceptés: {allowedFileTypes.join(', ')}
            </Typography>
          </Box>
        )}
      </Paper>
      
      {validEmails.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Divider sx={{ mb: 2 }} />
          <Typography variant="subtitle1" gutterBottom>
            Aperçu des emails importés:
          </Typography>
          <Box sx={{ maxHeight: '200px', overflow: 'auto', p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
            {validEmails.slice(0, 10).map((email, index) => (
              <Chip
                key={index}
                label={email}
                size="small"
                variant="outlined"
                sx={{ m: 0.5 }}
              />
            ))}
            {validEmails.length > 10 && (
              <Typography variant="body2" color="text.secondary" sx={{ m: 1 }}>
                ... et {validEmails.length - 10} autres emails
              </Typography>
            )}
          </Box>
        </Box>
      )}
      
      <Snackbar
        open={showSnackbar}
        autoHideDuration={6000}
        onClose={() => setShowSnackbar(false)}
      >
        <Alert onClose={() => setShowSnackbar(false)} severity="success" variant="filled">
          {validEmails.length} emails ont été importés avec succès
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default FileImportCampaign; 