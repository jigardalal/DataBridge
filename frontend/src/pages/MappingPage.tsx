import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useLocation } from 'react-router-dom';

interface Mapping {
  input_field: string;
  output_field: string;
  confidence: number;
  transformation_type?: string;
  transformation_logic?: string;
  ai_prompt?: string;  // Store the user's prompt for AI formula generation
}

interface TargetField {
  name: string;
  type: string;
  required: boolean;
  description: string;
}

interface UploadedFile {
  _id: string;
  fileName: string;
  createdAt: string;
  updatedAt: string;
  rowCount: number;
}

interface SampleDataRow {
  [key: string]: string | number | boolean | null;
}

const MappingPage: React.FC = () => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [dataCategories, setDataCategories] = useState<string[]>([]);
  const [selectedFileId, setSelectedFileId] = useState<string>('');
  const [selectedDataCategory, setSelectedDataCategory] = useState<string>('');
  const [mappings, setMappings] = useState<Mapping[]>([]);
  const [targetFields, setTargetFields] = useState<TargetField[]>([]);
  const [loading, setLoading] = useState(false);
  const [sampleData, setSampleData] = useState<SampleDataRow[]>([]);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewData, setPreviewData] = useState<SampleDataRow[]>([]);
  const [showTransformationModal, setShowTransformationModal] = useState(false);
  const [selectedMappingIndex, setSelectedMappingIndex] = useState<number | null>(null);
  const [transformationType, setTransformationType] = useState<string>('none');
  const [transformationLogic, setTransformationLogic] = useState<string>('');
  const [aiDescription, setAiDescription] = useState<string>('');
  const [isGeneratingFormula, setIsGeneratingFormula] = useState(false);
  const [showAddMappingModal, setShowAddMappingModal] = useState(false);
  const [newMappingOutputField, setNewMappingOutputField] = useState<string>('');
  const [unmappedTargetFields, setUnmappedTargetFields] = useState<string[]>([]);
  const [showSaveMappingModal, setShowSaveMappingModal] = useState(false);
  const [mappingName, setMappingName] = useState('');
  const [mappingDescription, setMappingDescription] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>(''); // New state for status selection
  const [savedDatasets, setSavedDatasets] = useState<any[]>([]);
  const [showLoadDatasetModal, setShowLoadDatasetModal] = useState(false);
  const [currentDataset, setCurrentDataset] = useState<any>(null);
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'info' as 'info' | 'success' | 'warning' | 'error'
  });
  
  // Get URL parameters
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const datasetIdFromUrl = queryParams.get('datasetId');
  const dataCategoryFromUrl = queryParams.get('dataCategory');
  const fileIdFromUrl = queryParams.get('fileId');

  // Load dataset from URL parameters
  useEffect(() => {
    if (datasetIdFromUrl) {
      // Load the dataset directly if a dataset ID is provided in the URL
      loadSavedDataset(datasetIdFromUrl);
    } else if (dataCategoryFromUrl && fileIdFromUrl) {
      // If no dataset ID but we have category and file ID, load the dataset by those parameters
      const fetchDatasetByFileId = async () => {
        try {
          const response = await axios.get(`/api/datasets?fileId=${fileIdFromUrl}`);
          if (response.data && response.data.length > 0) {
            // Use the first dataset found for this file
            loadSavedDataset(response.data[0]._id);
          } else {
            // No dataset found, set the data category and file ID
            setSelectedDataCategory(dataCategoryFromUrl);
            setSelectedFileId(fileIdFromUrl);
            // Fetch mappings from the mapping API
            fetchMappings(fileIdFromUrl, dataCategoryFromUrl);
          }
        } catch (error) {
          console.error('Error fetching dataset by file ID:', error);
          // Fall back to direct mapping
          setSelectedDataCategory(dataCategoryFromUrl);
          setSelectedFileId(fileIdFromUrl);
          fetchMappings(fileIdFromUrl, dataCategoryFromUrl);
        }
      };
      
      fetchDatasetByFileId();
    }
  }, [datasetIdFromUrl, dataCategoryFromUrl, fileIdFromUrl]);

  useEffect(() => {
    const fetchDataCategories = async () => {
      try {
        const response = await axios.get('/api/data-categories');
        console.log('Data categories:', response.data);
        setDataCategories(response.data || []);
      } catch (error) {
        console.error('Error fetching data categories:', error);
      }
    };

    fetchDataCategories();
  }, []);

  useEffect(() => {
    const fetchFiles = async () => {
      if (!selectedDataCategory) {
        setFiles([]);
        setSelectedFileId('');
        return;
      }
      setLoading(true);
      try {
        const response = await axios.get(`/api/files?dataCategory=${encodeURIComponent(selectedDataCategory)}`);
        console.log('Uploaded files list:', response.data);
        setFiles(response.data || []);
      } catch (error: any) {
        console.error('Error fetching files:', error);
        setFiles([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFiles();
  }, [selectedDataCategory]);

  const fetchMappings = async (fileId: string, dataCategory: string) => {
    setLoading(true);
    try {
      const safeCategory = dataCategory.replace(/\s+/g, '_');
      console.log('Fetching mappings for:', { fileId, dataCategory: safeCategory });
      const response = await axios.get(`/api/mappings/${safeCategory}?fileId=${fileId}`);
      console.log('Full API response:', JSON.stringify(response.data, null, 2));
      
      setMappings(response.data.mappings || []);
      setTargetFields(response.data.targetFields || []);
      
      // Log and process sample data
      console.log('Raw sample data:', response.data.sampleData);
      if (response.data.sampleData && response.data.sampleData.length > 0) {
        // Add unique IDs to each row for the DataGrid
        const processedData: SampleDataRow[] = response.data.sampleData.map((row: any, index: number) => ({
          id: index,
          ...row
        }));
        console.log('Processed sample data:', processedData);
        setSampleData(processedData);
      } else {
        console.log('No sample data available');
        setSampleData([]);
      }
      
      // Calculate unmapped target fields
      updateUnmappedTargetFields(response.data.mappings || []);
      
    } catch (error) {
      console.error('Error fetching mappings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDataCategorySelect = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const category = e.target.value;
    console.log('Selected data category:', category);
    setSelectedDataCategory(category);
    setSelectedFileId('');
    setMappings([]);
    setSampleData([]);
    
    // Fetch target fields for the selected data category
    if (category) {
      await fetchTargetFields(category);
    } else {
      setTargetFields([]);
    }
  };

  const fetchTargetFields = async (dataCategory: string) => {
    try {
      console.log(`Fetching target fields for category: ${dataCategory}`);
      const response = await axios.get(`/api/mappings/${dataCategory}`);
      
      if (response.data && response.data.targetFields) {
        console.log(`Received ${response.data.targetFields.length} target fields:`, response.data.targetFields);
        setTargetFields(response.data.targetFields);
        
        // If we have mappings, update unmapped fields
        if (mappings.length > 0) {
          updateUnmappedTargetFields(mappings);
        }
      } else {
        console.warn('No target fields received from API');
        setTargetFields([]);
      }
    } catch (error) {
      console.error('Error fetching target fields:', error);
      setNotification({
        open: true,
        message: 'Could not load target fields. Please try again.',
        severity: 'error'
      });
      setTargetFields([]);
    }
  };
  
  // Function to update the list of unmapped target fields
  const updateUnmappedTargetFields = (currentMappings: Mapping[]) => {
    if (!targetFields || targetFields.length === 0) {
      setUnmappedTargetFields([]);
      return;
    }
    // Only consider mappings with a non-empty output_field as mapped
    const mappedOutputFields = currentMappings
      .filter(m => m.output_field && m.output_field.trim() !== '')
      .map(m => m.output_field);
    const unmapped = targetFields.map(f => f.name).filter(name => !mappedOutputFields.includes(name));
    setUnmappedTargetFields(unmapped);
  };
  
  // Always recalculate unmappedTargetFields when mappings or targetFields change
  useEffect(() => {
    updateUnmappedTargetFields(mappings);
  }, [mappings, targetFields]);
  
  const handleOutputFieldChange = (index: number, newValue: string) => {
    const updatedMappings = [...mappings];
    updatedMappings[index].output_field = newValue;
    setMappings(updatedMappings);
    
    // Update unmapped target fields
    updateUnmappedTargetFields(updatedMappings);
  };
  
  const openAddMappingModal = () => {
    setNewMappingOutputField(unmappedTargetFields[0] || '');
    setShowAddMappingModal(true);
  };
  
  const addManualMapping = () => {
    if (!newMappingOutputField) return;
    
    const newMapping: Mapping = {
      input_field: 'MANUAL',
      output_field: newMappingOutputField,
      confidence: 1.0,
      transformation_type: 'custom',
      transformation_logic: ''
    };
    
    const updatedMappings = [...mappings, newMapping];
    setMappings(updatedMappings);
    updateUnmappedTargetFields(updatedMappings);
    setShowAddMappingModal(false);
    
    // Open transformation modal for the new mapping
    setSelectedMappingIndex(updatedMappings.length - 1);
    setTransformationType('custom');
    setTransformationLogic('');
    setAiDescription('');
    setShowTransformationModal(true);
  };

  const openTransformationModal = (index: number) => {
    setSelectedMappingIndex(index);
    const mapping = mappings[index];
    setTransformationType(mapping.transformation_type || 'none');
    setTransformationLogic(mapping.transformation_logic || '');
    
    // Load the saved AI prompt if it exists
    setAiDescription(mapping.ai_prompt || '');
    
    setShowTransformationModal(true);
  };

  const saveTransformation = () => {
    if (selectedMappingIndex === null) return;
    
    const updatedMappings = [...mappings];
    updatedMappings[selectedMappingIndex].transformation_type = transformationType;
    updatedMappings[selectedMappingIndex].transformation_logic = transformationLogic;
    
    // Save the AI prompt if it exists
    if (aiDescription) {
      updatedMappings[selectedMappingIndex].ai_prompt = aiDescription;
    }
    
    setMappings(updatedMappings);
    setShowTransformationModal(false);
  };

  const generateFormulaWithAI = async () => {
    if (!aiDescription || selectedMappingIndex === null) return;
    
    setIsGeneratingFormula(true);
    try {
      // Get the selected mapping
      const mapping = mappings[selectedMappingIndex];
      const outputField = mapping.output_field;
      
      // Get all available input fields
      const availableInputFields = mappings.map(m => m.input_field);
      
      // Call the API to generate the formula
      const response = await axios.post('/api/mappings/generate-formula', {
        description: aiDescription,
        inputFields: availableInputFields,
        outputField: outputField,
        sampleData: sampleData.slice(0, 5)
      });
      
      if (response.data.success) {
        setTransformationType(response.data.transformationType);
        setTransformationLogic(response.data.formula);
      }
    } catch (error) {
      console.error('Error generating formula:', error);
    } finally {
      setIsGeneratingFormula(false);
    }
  };

  const handlePreviewClick = async () => {
    if (!selectedDataCategory || !selectedFileId) {
      alert('Missing data category or file ID. Please reload the dataset.');
      return;
    }
    setLoading(true);
    try {
      // Get the safe category name (replace spaces with underscores)
      const safeCategory = selectedDataCategory.replace(/\s+/g, '_');
      
      console.log('Sending mappings with transformations:', mappings);
      
      // Send the mappings to the backend for preview
      const response = await axios.post(`/api/mappings/${safeCategory}/preview`, {
        fileId: selectedFileId,
        mappings: mappings
      });
      
      console.log('Preview response:', response.data);
      
      // Set the preview data and open the modal
      setPreviewData(response.data.data || []);
      setIsPreviewModalOpen(true);
    } catch (error) {
      console.error('Error generating preview:', error);
      // Show error message
    } finally {
      setLoading(false);
    }
  };

  const handleExportClick = async () => {
    setLoading(true);
    try {
      // Get the safe category name (replace spaces with underscores)
      const safeCategory = selectedDataCategory.replace(/\s+/g, '_');
      
      // Send the mappings to the backend for export
      const response = await axios.post(`/api/mappings/${safeCategory}/export`, {
        fileId: selectedFileId,
        mappings: mappings,
        format: 'csv'
      });
      
      console.log('Export response:', response.data);
      
      // Create a downloadable blob from the data
      const csvContent = convertToCSV(response.data.data);
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      
      // Create a temporary link and trigger the download
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', response.data.fileName || 'export.csv');
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      // Close the preview modal
      setIsPreviewModalOpen(false);
    } catch (error) {
      console.error('Error exporting data:', error);
      // Show error message
    } finally {
      setLoading(false);
    }
  };
  
  // Helper function to convert JSON data to CSV
  const convertToCSV = (data: any[]) => {
    if (!data || !data.length) return '';
    
    // Get the headers from the first object
    const headers = Object.keys(data[0]);
    
    // Create the CSV header row
    const headerRow = headers.join(',');
    
    // Create the data rows
    const dataRows = data.map(row => {
      return headers.map(header => {
        const value = row[header];
        // Handle strings with commas, quotes, etc.
        if (typeof value === 'string') {
          // Escape quotes and wrap in quotes
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value !== undefined && value !== null ? value : '';
      }).join(',');
    });
    
    // Combine header and data rows
    return [headerRow, ...dataRows].join('\n');
  };

  // Function to fetch saved datasets
  const fetchSavedDatasets = async () => {
    try {
      const response = await axios.get('/api/datasets', {
        params: {
          dataCategory: selectedDataCategory,
          fileId: selectedFileId
        }
      });
      setSavedDatasets(response.data);
    } catch (error) {
      console.error('Error fetching saved datasets:', error);
    }
  };
  
  // Load saved datasets when data category and file are selected
  useEffect(() => {
    if (selectedDataCategory && selectedFileId) {
      fetchSavedDatasets();
    }
  }, [selectedDataCategory, selectedFileId]);
  
  // Function to open save dataset modal
  const openSaveDatasetModal = () => {
    // Generate a default name based on the data category and date
    const defaultName = `${selectedDataCategory} Dataset - ${new Date().toLocaleDateString()}`;
    setMappingName(defaultName);
    setMappingDescription('');
    setSelectedStatus(''); // Reset status selection
    setShowSaveMappingModal(true);
  };
  
  // Function to save the current mappings
  const saveCurrentMappings = async () => {
    if (!mappingName.trim()) {
      alert('Please enter a name for this dataset');
      return;
    }
    
    try {
      const selectedFile = files.find(file => file._id === selectedFileId);
      const fileName = selectedFile ? selectedFile.fileName : '';
      
      const response = await axios.post('/api/datasets/save', {
        name: mappingName,
        description: mappingDescription,
        dataCategory: selectedDataCategory,
        fileId: selectedFileId,
        fileName: fileName,
        mappings: mappings,
        targetFields: targetFields,
        status: selectedStatus
      });
      
      setShowSaveMappingModal(false);
      alert('Dataset saved successfully!');
      fetchSavedDatasets(); // Refresh the list of saved datasets
    } catch (error) {
      console.error('Error saving mappings:', error);
      alert('Error saving dataset. Please try again.');
    }
  };
  
  // Function to open load dataset modal
  const openLoadDatasetModal = () => {
    fetchSavedDatasets();
    setShowLoadDatasetModal(true);
  };
  
  // Function to load a saved dataset
  const loadSavedDataset = async (datasetId: string) => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/datasets/load/${datasetId}`);
      console.log('Loaded dataset:', response.data);
      
      if (response.data.success) {
        const dataset = response.data.dataset;
        
        // Set the current dataset
        setCurrentDataset(dataset);
        
        // Safely set selected data category and file ID
        setSelectedDataCategory(dataset.dataCategory || '');
        setSelectedFileId(dataset.fileId || '');
        
        // Set the mappings and target fields
        const mappingsArray = Array.isArray(dataset.mappings) ? dataset.mappings : [];
        setMappings(mappingsArray);
        
        // If there are target fields in the dataset, use them
        if (Array.isArray(dataset.targetFields) && dataset.targetFields.length > 0) {
          console.log('Setting target fields from dataset:', dataset.targetFields);
          setTargetFields(dataset.targetFields);
          
          // Wait for state updates to complete
          setTimeout(() => {
            // Update unmapped target fields
            console.log('Calling updateUnmappedTargetFields with:', mappingsArray);
            updateUnmappedTargetFields(mappingsArray);
          }, 100);
        } 
        // If no target fields in dataset, fetch them based on data category
        else if (dataset.dataCategory) {
          console.log('Fetching target fields for category:', dataset.dataCategory);
          await fetchTargetFields(dataset.dataCategory);
        }
        
        // Set the dataset name and description for saving
        setMappingName(dataset.name || '');
        setMappingDescription(dataset.description || '');
        
        // Get sample data from the file if fileId exists
        if (dataset.fileId) {
          await fetchSampleData(dataset.fileId);
        } else {
          console.warn('Dataset missing fileId, cannot fetch sample data');
          setSampleData([]);
        }
      } else {
        console.error('Failed to load dataset:', response.data.error);
        setNotification({
          open: true,
          message: 'Error loading dataset: ' + (response.data.error || 'Unknown error'),
          severity: 'error'
        });
      }
    } catch (error) {
      console.error('Error loading dataset:', error);
      setNotification({
        open: true,
        message: 'Error loading dataset. Please try again.',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // New function to fetch sample data only
  const fetchSampleData = async (fileId: string) => {
    if (!fileId) {
      console.warn('Cannot fetch sample data: fileId is missing');
      setSampleData([]);
      return;
    }
    
    try {
      console.log(`Fetching sample data for fileId: ${fileId}`);
      const response = await axios.get(`/api/files/${fileId}/sample`);
      
      if (response.data && response.data.sampleData && response.data.sampleData.length > 0) {
        // Add unique IDs to each row for the DataGrid
        const processedData: SampleDataRow[] = response.data.sampleData.map((row: any, index: number) => ({
          id: index,
          ...row
        }));
        console.log(`Received ${processedData.length} sample data rows`);
        setSampleData(processedData);
      } else {
        console.log('No sample data received from API');
        setSampleData([]);
      }
    } catch (error) {
      console.error('Error fetching sample data:', error);
      
      // Show a non-blocking notification instead of an alert
      setNotification({
        open: true,
        message: 'Could not load sample data. You can still edit mappings.',
        severity: 'warning'
      });
      
      setSampleData([]);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const fileId = e.target.value;
    setSelectedFileId(fileId);
    
    if (!fileId) {
      setMappings([]);
      setSampleData([]);
      return;
    }
    
    setLoading(true);
    try {
      console.log(`Fetching mappings for file: ${fileId} and category: ${selectedDataCategory}`);
      const response = await axios.get(`/api/mappings/${selectedDataCategory}?fileId=${fileId}`);
      
      // Log the full response to debug
      console.log('Mapping API response:', response.data);
      
      // Set mappings from the response
      const loadedMappings = response.data.mappings || [];
      setMappings(loadedMappings);
      
      // If target fields were not already loaded, set them now
      if (targetFields.length === 0 && response.data.targetFields) {
        console.log('Setting target fields from mapping response:', response.data.targetFields);
        setTargetFields(response.data.targetFields);
      }
      
      // Wait for state updates to complete
      setTimeout(() => {
        // Update unmapped target fields
        console.log('Calling updateUnmappedTargetFields with:', loadedMappings);
        updateUnmappedTargetFields(loadedMappings);
      }, 100);
      
      // Log and process sample data
      console.log('Raw sample data:', response.data.sampleData);
      if (response.data.sampleData && response.data.sampleData.length > 0) {
        // Add unique IDs to each row for the DataGrid
        const processedData: SampleDataRow[] = response.data.sampleData.map((row: any, index: number) => ({
          id: index,
          ...row
        }));
        setSampleData(processedData);
      }
    } catch (error) {
      console.error('Error fetching mappings:', error);
      setNotification({
        open: true,
        message: 'Error fetching mappings. Please try again.',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Data Mapping</h1>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="spinner"></div>
            <p className="mt-2">Loading...</p>
          </div>
        </div>
      ) : (
        <div>
          {/* Dataset Information Section */}
          {currentDataset ? (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h2 className="text-lg font-semibold mb-2">Dataset Information</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Name:</p>
                  <p className="font-medium">{currentDataset.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Data Category:</p>
                  <p className="font-medium">{currentDataset.dataCategory}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">File:</p>
                  <p className="font-medium">{currentDataset.fileName || currentDataset.fileId}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Description:</p>
                  <p className="font-medium">{currentDataset.description || 'No description'}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="mb-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <p className="text-yellow-700">
                No dataset selected. Please go to the <a href="/datasets" className="text-blue-600 underline">Datasets page</a> to select a dataset.
              </p>
            </div>
          )}

          {/* Original selection dropdowns - only show if no dataset is loaded */}
          {!currentDataset && (
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data Category
                </label>
                <select
                  className="w-full p-2 border border-gray-300 rounded-md"
                  value={selectedDataCategory}
                  onChange={handleDataCategorySelect}
                >
                  <option value="">-- Select Data Category --</option>
                  {dataCategories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select File
                </label>
                <select
                  className="w-full p-2 border border-gray-300 rounded-md"
                  value={selectedFileId}
                  onChange={handleFileSelect}
                  disabled={!selectedDataCategory}
                >
                  <option value="">-- Select File --</option>
                  {files.map((file) => (
                    <option key={file._id} value={file._id}>
                      {file.fileName} ({file.rowCount} rows)
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Mapping Actions */}
          <div className="flex flex-wrap gap-3 mb-6">
            <button
              onClick={openAddMappingModal}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors shadow-sm"
            >
              Add Manual Mapping
            </button>
            {mappings.length > 0 && selectedDataCategory && selectedFileId && (
              <button
                onClick={() => {
                  if (!selectedDataCategory || !selectedFileId) {
                    alert('Missing data category or file ID. Please reload the dataset.');
                    return;
                  }
                  handlePreviewClick();
                }}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors shadow-sm"
              >
                Preview Output
              </button>
            )}
            <button
              onClick={handleExportClick}
              className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors shadow-sm"
            >
              Export Data
            </button>
            <button
              onClick={openSaveDatasetModal}
              className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600 transition-colors shadow-sm"
            >
              Save Dataset
            </button>
            <button
              onClick={openLoadDatasetModal}
              className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors shadow-sm"
            >
              Load Saved Dataset
            </button>
          </div>

          {/* Unmapped Target Fields - Always Show This Section */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Unmapped Target Fields</h2>
            {unmappedTargetFields.length === 0 ? (
              <p className="text-gray-600 mb-2">All target fields are mapped!</p>
            ) : (
              <>
                <p className="text-gray-600 mb-2">
                  These fields from the target schema don't have a mapping yet.
                </p>
                <div className="flex flex-wrap gap-2">
                  {unmappedTargetFields.map((field) => (
                    <span
                      key={field}
                      className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm"
                    >
                      {field}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Field Mappings Grid */}
          {(mappings.length > 0 || targetFields.length > 0) && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2">Field Mappings</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="py-2 px-4 border-b text-left">Input Field</th>
                      <th className="py-2 px-4 border-b text-left">Output Field</th>
                      <th className="py-2 px-4 border-b text-left">Confidence</th>
                      <th className="py-2 px-4 border-b text-left">Transformation</th>
                      <th className="py-2 px-4 border-b text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Debug log for mappings */}
                    {(() => { console.log('🔍 DEBUG: Rendering mappings:', mappings); return null; })()}
                    {(() => { console.log('🔍 DEBUG: Target fields:', targetFields); return null; })()}
                    
                    {/* First show all existing mappings */}
                    {mappings.map((mapping, index) => (
                      <tr 
                        key={`mapping-${index}`} 
                        className={`hover:bg-gray-50 ${!mapping.input_field ? 'bg-yellow-50' : ''}`}
                      >
                        <td className="py-2 px-4 border-b">
                          {mapping.input_field || (
                            <span className="italic text-gray-500">
                              No input field - add manual mapping
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-4 border-b">
                          <select
                            value={mapping.output_field}
                            onChange={(e) => handleOutputFieldChange(index, e.target.value)}
                            className="border p-1 w-full"
                          >
                            <option value="">-- Select Output Field --</option>
                            {targetFields.map((field) => (
                              <option key={field.name} value={field.name}>
                                {field.name} {field.required ? '*' : ''}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-2 px-4 border-b">
                          {typeof mapping.confidence === 'number'
                            ? `${(mapping.confidence * 100).toFixed(0)}%`
                            : 'N/A'}
                        </td>
                        <td className="py-2 px-4 border-b">
                          {mapping.transformation_type || 'None'}
                        </td>
                        <td className="py-2 px-4 border-b">
                          <button
                            onClick={() => {
                              if (typeof index !== 'number' || index < 0 || index >= mappings.length) {
                                alert('Invalid mapping selected.');
                                return;
                              }
                              openTransformationModal(index);
                            }}
                            className="px-3 py-1.5 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors shadow-sm text-sm"
                          >
                            Transform
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {/* Sample Data Preview */}
          {sampleData.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-2">Sample Data</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200">
                  <thead>
                    <tr className="bg-gray-100">
                      {Object.keys(sampleData[0]).map((key) => (
                        <th key={key} className="py-2 px-4 border-b text-left">
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sampleData.slice(0, 5).map((row, rowIndex) => (
                      <tr key={rowIndex} className="hover:bg-gray-50">
                        {Object.values(row).map((value, colIndex) => (
                          <td key={colIndex} className="py-2 px-4 border-b">
                            {String(value)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Preview Modal */}
      {isPreviewModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-11/12 max-w-6xl max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-800">Preview Output</h2>
              <button 
                onClick={() => setIsPreviewModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 focus:outline-none"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-grow">
              {previewData.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No preview data available
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white border border-gray-200">
                    <thead>
                      <tr className="bg-gray-100">
                        {Object.keys(previewData[0]).map((key) => (
                          <th key={key} className="py-3 px-4 border-b text-left font-semibold text-gray-700">
                            {key}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.map((row, rowIndex) => (
                        <tr key={rowIndex} className="hover:bg-gray-50">
                          {Object.values(row).map((value, colIndex) => (
                            <td key={colIndex} className="py-3 px-4 border-b text-gray-800">
                              {String(value)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setIsPreviewModalOpen(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors shadow-sm"
              >
                Close
              </button>
              <button
                onClick={handleExportClick}
                className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors shadow-sm"
              >
                Export
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transformation Modal */}
      {showTransformationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-11/12 max-w-3xl max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-800">Edit Transformation</h2>
              <button 
                onClick={() => setShowTransformationModal(false)}
                className="text-gray-500 hover:text-gray-700 focus:outline-none"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-grow">
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Transformation Type
                  </label>
                  <select
                    className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                    value={transformationType}
                    onChange={(e) => setTransformationType(e.target.value)}
                  >
                    <option value="none">None</option>
                    <option value="formula">Formula</option>
                    <option value="custom">Custom</option>
                    <option value="ai">AI-Generated</option>
                  </select>
                </div>
                
                {transformationType !== 'none' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Transformation Logic
                    </label>
                    <textarea
                      className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 h-32 font-mono"
                      value={transformationLogic}
                      onChange={(e) => setTransformationLogic(e.target.value)}
                      placeholder="Enter your transformation logic or formula here..."
                    />
                  </div>
                )}
                
                {transformationType === 'ai' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Describe what you want to do (AI will generate a formula)
                    </label>
                    <textarea
                      className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 h-24"
                      value={aiDescription}
                      onChange={(e) => setAiDescription(e.target.value)}
                      placeholder="Example: Convert the temperature from Celsius to Fahrenheit"
                    />
                    <button
                      onClick={generateFormulaWithAI}
                      disabled={isGeneratingFormula || !aiDescription}
                      className={`mt-3 px-4 py-2 ${
                        isGeneratingFormula || !aiDescription
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-green-500 hover:bg-green-600'
                      } text-white rounded transition-colors shadow-sm`}
                    >
                      {isGeneratingFormula ? 'Generating...' : 'Generate Formula'}
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowTransformationModal(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors shadow-sm"
              >
                Cancel
              </button>
              <button
                onClick={saveTransformation}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors shadow-sm"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Manual Mapping Modal */}
      {showAddMappingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
              onClick={() => setShowAddMappingModal(false)}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h3 className="text-lg font-semibold mb-4">Add Manual Mapping</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Target Field</label>
              {unmappedTargetFields.length === 0 ? (
                <select className="border p-2 w-full" disabled>
                  <option>No unmapped fields available</option>
                </select>
              ) : (
                <select
                  className="border p-2 w-full"
                  value={newMappingOutputField}
                  onChange={e => setNewMappingOutputField(e.target.value)}
                  disabled={unmappedTargetFields.length === 0}
                >
                  <option value="">-- Select Target Field --</option>
                  {unmappedTargetFields.map(field => (
                    <option key={field} value={field}>{field}</option>
                  ))}
                </select>
              )}
            </div>
            <div className="flex justify-end">
              <button
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                onClick={addManualMapping}
                disabled={!newMappingOutputField || unmappedTargetFields.length === 0}
              >
                Add Mapping
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save Dataset Modal */}
      {showSaveMappingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-800">Save Dataset</h2>
              <button 
                onClick={() => setShowSaveMappingModal(false)}
                className="text-gray-500 hover:text-gray-700 focus:outline-none"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                  value={mappingName}
                  onChange={(e) => setMappingName(e.target.value)}
                  placeholder="Enter a name for this dataset"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 h-24"
                  value={mappingDescription}
                  onChange={(e) => setMappingDescription(e.target.value)}
                  placeholder="Enter a description (optional)"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                >
                  <option value="">-- Select Status --</option>
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="completed">Completed</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowSaveMappingModal(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors shadow-sm"
              >
                Cancel
              </button>
              <button
                onClick={saveCurrentMappings}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors shadow-sm"
                disabled={!mappingName}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Load Dataset Modal */}
      {showLoadDatasetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-11/12 max-w-4xl max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-800">Load Saved Dataset</h2>
              <button 
                onClick={() => setShowLoadDatasetModal(false)}
                className="text-gray-500 hover:text-gray-700 focus:outline-none"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-grow">
              {savedDatasets.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No saved datasets found.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white border border-gray-200">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="py-3 px-4 border-b text-left font-semibold text-gray-700">Name</th>
                        <th className="py-3 px-4 border-b text-left font-semibold text-gray-700">Description</th>
                        <th className="py-3 px-4 border-b text-left font-semibold text-gray-700">Data Category</th>
                        <th className="py-3 px-4 border-b text-left font-semibold text-gray-700">Status</th>
                        <th className="py-3 px-4 border-b text-left font-semibold text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {savedDatasets.map((dataset) => (
                        <tr key={dataset._id} className="hover:bg-gray-50">
                          <td className="py-3 px-4 border-b text-gray-800">{dataset.name}</td>
                          <td className="py-3 px-4 border-b text-gray-800">{dataset.description || '-'}</td>
                          <td className="py-3 px-4 border-b text-gray-800">{dataset.dataCategory || '-'}</td>
                          <td className="py-3 px-4 border-b text-gray-800">{dataset.status || '-'}</td>
                          <td className="py-3 px-4 border-b">
                            <button
                              onClick={() => {
                                loadSavedDataset(dataset._id);
                                setShowLoadDatasetModal(false);
                              }}
                              className="px-3 py-1.5 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors shadow-sm text-sm"
                            >
                              Load
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            
            <div className="p-6 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setShowLoadDatasetModal(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors shadow-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Notification */}
      {notification.open && (
        <div className={`fixed bottom-4 right-4 bg-${notification.severity === 'info' ? 'blue' : notification.severity === 'success' ? 'green' : notification.severity === 'warning' ? 'yellow' : 'red'}-100 border border-${notification.severity === 'info' ? 'blue' : notification.severity === 'success' ? 'green' : notification.severity === 'warning' ? 'yellow' : 'red'}-400 text-${notification.severity === 'info' ? 'blue' : notification.severity === 'success' ? 'green' : notification.severity === 'warning' ? 'yellow' : 'red'}-700 p-4 rounded-lg shadow-lg flex justify-between items-center`}>
          <span>{notification.message}</span>
          <button 
            onClick={() => setNotification({...notification, open: false})}
            className="ml-4 text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
};

export default MappingPage;
