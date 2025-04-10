import React, { useCallback, useState } from 'react';
import { Box, Typography, Paper, LinearProgress, IconButton, List, ListItem, ListItemText, ListItemSecondaryAction } from '@mui/material';
import { CloudUpload, Delete, CheckCircle, Error } from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { uploadDataset } from '../services/api';

const ACCEPTED_FILE_TYPES = ['.xlsx', '.xls', '.csv'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

interface FileWithProgress extends File {
  progress?: number;
  error?: string;
  status?: 'uploading' | 'success' | 'error';
}

const UploadArea = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  textAlign: 'center',
  border: `2px dashed ${theme.palette.primary.main}`,
  backgroundColor: theme.palette.background.default,
  cursor: 'pointer',
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
}));

export const FileUpload: React.FC = () => {
  const [files, setFiles] = useState<FileWithProgress[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const validateFile = (file: File): string | null => {
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (!fileExtension || !ACCEPTED_FILE_TYPES.includes(`.${fileExtension}`)) {
      return 'Invalid file type. Only Excel (.xlsx, .xls) and CSV files are allowed.';
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'File size too large. Maximum size is 5MB.';
    }
    return null;
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFiles(droppedFiles);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      handleFiles(selectedFiles);
    }
  }, []);

  const handleFiles = (newFiles: File[]) => {
    const validatedFiles = newFiles.map(file => {
      const error = validateFile(file);
      const fileWithProgress = file as FileWithProgress;
      fileWithProgress.progress = 0;
      fileWithProgress.status = error ? 'error' : 'uploading';
      fileWithProgress.error = error || undefined;
      return fileWithProgress;
    });

    setFiles(prev => [...prev, ...validatedFiles]);

    // Upload valid files
    validatedFiles.forEach(file => {
      if (!file.error) {
        uploadFile(file);
      }
    });
  };

  const uploadFile = async (file: FileWithProgress) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      for (const pair of formData.entries()) {
        console.log('FormData entry:', pair[0], pair[1]);
      }

      const response = await uploadDataset(formData);
      
      setFiles(prev => prev.map(f => 
        f === file ? { ...f, status: 'success', progress: 100 } : f
      ));
    } catch (error: any) {
      console.error('Upload error:', error);
      const errorMessage = error.response?.data?.error || 'Upload failed. Please try again.';
      setFiles(prev => prev.map(f => 
        f === file ? { ...f, status: 'error', error: errorMessage } : f
      ));
    }
  };

  const removeFile = (fileToRemove: FileWithProgress) => {
    setFiles(prev => prev.filter(file => file !== fileToRemove));
  };

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', p: 2 }}>
      <input
        type="file"
        id="file-upload"
        multiple
        accept={ACCEPTED_FILE_TYPES.join(',')}
        onChange={handleFileInput}
        style={{ display: 'none' }}
      />
      
      <label htmlFor="file-upload">
        <UploadArea
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => document.getElementById('file-upload')?.click()}
          sx={{ backgroundColor: isDragging ? 'action.hover' : 'background.default' }}
        >
          <CloudUpload sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Drag and drop files here
          </Typography>
          <Typography variant="body2" color="text.secondary">
            or click to select files
          </Typography>
          <Typography variant="caption" display="block" sx={{ mt: 1 }}>
            Supported formats: Excel (.xlsx, .xls), CSV
          </Typography>
        </UploadArea>
      </label>

      <List sx={{ mt: 2 }}>
        {files.map((file, index) => (
          <ListItem
            key={index}
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
              mb: 1,
            }}
          >
            <ListItemText
              primary={file.name}
              secondary={
                file.error ? (
                  <Typography color="error">{file.error}</Typography>
                ) : (
                  <Box sx={{ width: '100%' }}>
                    <LinearProgress
                      variant={file.status === 'uploading' ? 'indeterminate' : 'determinate'}
                      value={file.progress}
                      color={file.status === 'success' ? 'success' : 'primary'}
                    />
                  </Box>
                )
              }
            />
            <ListItemSecondaryAction>
              {file.status === 'success' ? (
                <CheckCircle color="success" />
              ) : file.status === 'error' ? (
                <Error color="error" />
              ) : null}
              <IconButton
                edge="end"
                aria-label="delete"
                onClick={() => removeFile(file)}
                sx={{ ml: 1 }}
              >
                <Delete />
              </IconButton>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>
    </Box>
  );
};
