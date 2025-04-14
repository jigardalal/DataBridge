import React, { useCallback, useState } from 'react';
import { Box, Typography, Paper, LinearProgress, IconButton, List, ListItem, ListItemText, ListItemSecondaryAction } from '@mui/material';
import { CloudUpload, Delete, CheckCircle, Error as ErrorIcon } from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

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
  const [dataCategories, setDataCategories] = useState<string[]>([]);
  const [selectedDataCategory, setSelectedDataCategory] = useState<string>('');
  const [categoryError, setCategoryError] = useState<string>('');
  const [datasetName, setDatasetName] = useState<string>('');
  const [datasetDescription, setDatasetDescription] = useState<string>('');
  const [nameError, setNameError] = useState<string>('');
  const [uploadSuccess, setUploadSuccess] = useState<boolean>(false);
  const [uploadMessage, setUploadMessage] = useState<string>('');
  const [isCreatingDataset, setIsCreatingDataset] = useState<boolean>(false);
  const navigate = useNavigate();

  React.useEffect(() => {
    const fetchDataCategories = async () => {
      try {
        const response = await axios.get('/api/data-categories');
        setDataCategories(response.data || []);
      } catch (error) {
        console.error('Error fetching data categories:', error);
      }
    };
    fetchDataCategories();
  }, []);

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
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!selectedDataCategory) {
      setCategoryError('Please select a data category before uploading.');
      return;
    }
    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFiles(droppedFiles);
  }, [selectedDataCategory]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    // Clear any previous errors
    setNameError('');
    setCategoryError('');
    
    // Validate inputs before proceeding
    if (!selectedDataCategory) {
      setCategoryError('Please select a data category before uploading.');
      if (e.target) e.target.value = '';
      return;
    }
    
    if (!datasetName.trim()) {
      setNameError('Please enter a dataset name');
      if (e.target) e.target.value = '';
      return;
    }
    
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      handleFiles(selectedFiles);
    }
  }, [selectedDataCategory, datasetName]);

  const handleFiles = (newFiles: File[]) => {
    if (!selectedDataCategory) {
      setCategoryError('Please select a data category before uploading.');
      return;
    }

    const validatedFiles = newFiles.map(file => {
      const error = validateFile(file);
      const fileWithProgress = file as FileWithProgress;
      fileWithProgress.progress = 0;
      fileWithProgress.status = error ? 'error' : 'uploading';
      fileWithProgress.error = error || undefined;
      return fileWithProgress;
    });

    setFiles(validatedFiles);

    validatedFiles.forEach(file => {
      if (!file.error) {
        uploadFile(file);
      }
    });
  };

  const uploadFile = async (file: FileWithProgress) => {
    try {
      // Clear any previous success messages
      setUploadSuccess(false);
      setUploadMessage('');
      
      // Update file status to uploading
      const updatedFiles = files.map(f => 
        f === file ? { ...f, status: 'uploading' as const, progress: 0 } : f
      );
      setFiles(updatedFiles);

      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      formData.append('dataCategory', selectedDataCategory);
      formData.append('name', datasetName);
      formData.append('description', datasetDescription);

      // Upload file with progress tracking
      const response = await axios.post('/api/files/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            const updatedFiles = files.map(f => 
              f === file ? { ...f, progress } : f
            );
            setFiles(updatedFiles);
          }
        },
      });

      console.log('File uploaded successfully:', response.data);
      
      // Update file status to success
      const successFiles = files.map(f => 
        f === file ? { ...f, status: 'success' as const, progress: 100 } : f
      );
      setFiles(successFiles);

      // Set upload success message
      setUploadSuccess(true);
      setUploadMessage(`File "${file.name}" uploaded successfully!`);

      // Now that the file is uploaded, generate mappings automatically
      setIsCreatingDataset(true);
      const fileId = response.data.fileId;
      const fileName = response.data.fileName || file.name;
      
      // Create dataset with auto-generated mappings
      await createDatasetWithMappings(fileId, fileName);
      
      // Wait a moment to show the success status before redirecting
      setTimeout(() => {
        navigate('/datasets');
      }, 2000);
      
    } catch (error) {
      console.error('Error uploading file:', error);
      
      // Update file status to error
      const errorFiles = files.map(f => 
        f === file ? { 
          ...f, 
          status: 'error' as const, 
          error: error instanceof Error ? error.message : 'Upload failed' 
        } : f
      );
      setFiles(errorFiles);
      
      // Set error message
      setUploadSuccess(false);
      setUploadMessage(`Error uploading file: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsCreatingDataset(false);
    }
  };

  // New function to create dataset with auto-generated mappings
  const createDatasetWithMappings = async (fileId: string, fileName: string) => {
    try {
      setUploadMessage('Creating dataset with auto-generated mappings...');
      
      // Get the normalized data category (replace spaces with underscores)
      const normalizedCategory = selectedDataCategory.replace(/\s+/g, '_');
      
      // First, get the auto-generated mappings from the backend
      const mappingsResponse = await axios.get(`/api/mappings/${normalizedCategory}?fileId=${fileId}`);
      
      console.log('Auto-generated mappings:', mappingsResponse.data);
      
      // Create a new dataset with the mappings
      const saveResponse = await axios.post('/api/datasets/save', {
        name: datasetName,
        description: datasetDescription,
        dataCategory: selectedDataCategory,
        fileId: fileId,
        fileName: fileName,
        mappings: mappingsResponse.data.mappings || [],
        targetFields: mappingsResponse.data.targetFields || [],
        status: 'completed'
      });
      
      console.log('Dataset created with auto-mappings:', saveResponse.data);
      setUploadMessage('Dataset created successfully! Redirecting to datasets page...');
      setIsCreatingDataset(false);
      
    } catch (error) {
      console.error('Error creating dataset with mappings:', error);
      setUploadMessage(`Error creating dataset: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsCreatingDataset(false);
      // We'll continue even if mapping generation fails
      // The user can still manually map fields later
    }
  };

  const removeFile = (fileToRemove: FileWithProgress) => {
    setFiles(prev => prev.filter(file => file !== fileToRemove));
  };

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', p: 2 }}>
      {categoryError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 flex items-center justify-between">
          <div className="flex items-center">
            <svg className="fill-current w-5 h-5 mr-2 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><title>Error</title><path d="M18.364 17.364a9 9 0 11-12.728-12.728 9 9 0 0112.728 12.728zM9 4h2v6H9V4zm0 8h2v2H9v-2z"/></svg>
            <span>{categoryError}</span>
          </div>
          <button onClick={() => setCategoryError('')} className="text-red-500 hover:text-red-700 font-bold ml-4">&times;</button>
        </div>
      )}

      {nameError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 flex items-center justify-between">
          <div className="flex items-center">
            <svg className="fill-current w-5 h-5 mr-2 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><title>Error</title><path d="M18.364 17.364a9 9 0 11-12.728-12.728 9 9 0 0112.728 12.728zM9 4h2v6H9V4zm0 8h2v2H9v-2z"/></svg>
            <span>{nameError}</span>
          </div>
          <button onClick={() => setNameError('')} className="text-red-500 hover:text-red-700 font-bold ml-4">&times;</button>
        </div>
      )}

      <div className="mb-4">
        <label className="block mb-2 font-semibold">Select Data Category:</label>
        <select
          className="border p-2 w-full mb-4"
          value={selectedDataCategory}
          onChange={(e) => {
            setSelectedDataCategory(e.target.value);
            if (e.target.value) {
              setCategoryError('');
            }
          }}
        >
          <option value="">-- Select a data category --</option>
          {dataCategories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-4">
        <label className="block mb-2 font-semibold">Dataset Name:</label>
        <input
          type="text"
          className="border p-2 w-full mb-2"
          value={datasetName}
          onChange={(e) => {
            setDatasetName(e.target.value);
            if (e.target.value) {
              setNameError('');
            }
          }}
          placeholder="Enter a name for this dataset"
        />
      </div>

      <div className="mb-4">
        <label className="block mb-2 font-semibold">Dataset Description (optional):</label>
        <textarea
          className="border p-2 w-full mb-4"
          value={datasetDescription}
          onChange={(e) => setDatasetDescription(e.target.value)}
          placeholder="Enter a description for this dataset"
          rows={2}
        />
      </div>

      <input
        type="file"
        id="file-upload"
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
                <ErrorIcon color="error" />
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

      {/* Success message */}
      {uploadSuccess && (
        <div className="mt-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
          <p className="font-semibold">{uploadMessage}</p>
          {isCreatingDataset && (
            <div className="mt-2">
              <p>Creating dataset with auto-generated mappings...</p>
              <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                <div className="bg-green-600 h-2.5 rounded-full animate-pulse w-full"></div>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Error message (not from file validation) */}
      {!uploadSuccess && uploadMessage && (
        <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          <p>{uploadMessage}</p>
        </div>
      )}
    </Box>
  );
};
