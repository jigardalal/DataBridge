import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface Mapping {
  input_field: string;
  output_field: string;
  confidence: number;
  transformation_type?: string;
  transformation_logic?: string;
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
  const [dropdownOptions, setDropdownOptions] = useState<string[]>([]);
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
  const [savedMappings, setSavedMappings] = useState<any[]>([]);
  const [showLoadMappingModal, setShowLoadMappingModal] = useState(false);

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
      setDropdownOptions(response.data.dropdownOptions || []);
      
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
      const mappedOutputFields = new Set(response.data.mappings.map((m: Mapping) => m.output_field).filter(Boolean));
      const allTargetFields = response.data.targetFields.map((f: TargetField) => f.name);
      const unmappedFields = allTargetFields.filter(field => !mappedOutputFields.has(field));
      setUnmappedTargetFields(unmappedFields);
      
    } catch (error) {
      console.error('Error fetching mappings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const fileId = e.target.value;
    console.log('Selected fileId:', fileId);
    setSelectedFileId(fileId);
    if (fileId && selectedDataCategory) {
      fetchMappings(fileId, selectedDataCategory);
    } else {
      setMappings([]);
      setSampleData([]);
    }
  };

  const handleDataCategorySelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const category = e.target.value;
    console.log('Selected data category:', category);
    setSelectedDataCategory(category);
    setSelectedFileId('');
    setMappings([]);
    setSampleData([]);
  };

  const handleOutputFieldChange = (index: number, newValue: string) => {
    const updatedMappings = [...mappings];
    updatedMappings[index].output_field = newValue;
    setMappings(updatedMappings);
    
    // Update unmapped target fields
    updateUnmappedTargetFields(updatedMappings);
  };
  
  const updateUnmappedTargetFields = (currentMappings: Mapping[]) => {
    const mappedOutputFields = new Set(currentMappings.map(m => m.output_field).filter(Boolean));
    const allTargetFields = targetFields.map(f => f.name);
    const unmappedFields = allTargetFields.filter(field => !mappedOutputFields.has(field));
    setUnmappedTargetFields(unmappedFields);
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
    const mapping = mappings[index];
    setSelectedMappingIndex(index);
    setTransformationType(mapping.transformation_type || 'none');
    setTransformationLogic(mapping.transformation_logic || '');
    setAiDescription('');
    setShowTransformationModal(true);
  };

  const saveTransformation = () => {
    if (selectedMappingIndex === null) return;
    
    const updatedMappings = [...mappings];
    updatedMappings[selectedMappingIndex].transformation_type = transformationType;
    updatedMappings[selectedMappingIndex].transformation_logic = transformationLogic;
    setMappings(updatedMappings);
    setShowTransformationModal(false);
  };

  const generateFormulaWithAI = async () => {
    if (!aiDescription || selectedMappingIndex === null) return;
    
    setIsGeneratingFormula(true);
    try {
      // Get sample data for the selected input field
      const inputField = mappings[selectedMappingIndex].input_field;
      const outputField = mappings[selectedMappingIndex].output_field;
      
      // Get sample values from the data
      const sampleValues = sampleData.slice(0, 5).map(row => row[inputField]);
      
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

  // Function to fetch saved mappings
  const fetchSavedMappings = async () => {
    try {
      const response = await axios.get('/api/user-mappings', {
        params: {
          dataCategory: selectedDataCategory,
          fileId: selectedFileId
        }
      });
      setSavedMappings(response.data);
    } catch (error) {
      console.error('Error fetching saved mappings:', error);
    }
  };
  
  // Load saved mappings when data category and file are selected
  useEffect(() => {
    if (selectedDataCategory && selectedFileId) {
      fetchSavedMappings();
    }
  }, [selectedDataCategory, selectedFileId]);
  
  // Function to open save mapping modal
  const openSaveMappingModal = () => {
    // Generate a default name based on the data category and date
    const defaultName = `${selectedDataCategory} Mapping - ${new Date().toLocaleDateString()}`;
    setMappingName(defaultName);
    setMappingDescription('');
    setShowSaveMappingModal(true);
  };
  
  // Function to save the current mappings
  const saveCurrentMappings = async () => {
    if (!mappingName.trim()) {
      alert('Please enter a name for this mapping');
      return;
    }
    
    try {
      const response = await axios.post('/api/mappings/save', {
        name: mappingName,
        description: mappingDescription,
        dataCategory: selectedDataCategory,
        fileId: selectedFileId,
        mappings: mappings,
        targetFields: targetFields
      });
      
      setShowSaveMappingModal(false);
      
      // Refresh the list of saved mappings
      fetchSavedMappings();
      
      alert(`Mapping "${mappingName}" saved successfully!`);
    } catch (error) {
      console.error('Error saving mappings:', error);
      alert('Error saving mappings. Please try again.');
    }
  };
  
  // Function to open load mapping modal
  const openLoadMappingModal = () => {
    fetchSavedMappings();
    setShowLoadMappingModal(true);
  };
  
  // Function to load a saved mapping
  const loadSavedMapping = async (mappingId: string) => {
    try {
      const response = await axios.get(`/api/mappings/load/${mappingId}`);
      
      if (response.data.success) {
        const loadedMapping = response.data.mapping;
        
        // Update mappings with the loaded data
        setMappings(loadedMapping.mappings);
        
        // Update target fields if they exist in the saved mapping
        if (loadedMapping.targetFields && loadedMapping.targetFields.length > 0) {
          setTargetFields(loadedMapping.targetFields);
        }
        
        // Update unmapped target fields
        updateUnmappedTargetFields(loadedMapping.mappings);
        
        setShowLoadMappingModal(false);
        
        alert(`Mapping "${loadedMapping.name}" loaded successfully!`);
      }
    } catch (error) {
      console.error('Error loading mapping:', error);
      alert('Error loading mapping. Please try again.');
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">AI-Suggested Field Mappings</h1>

      <div className="mb-4">
        <label className="block mb-2 font-semibold">Select Data Category:</label>
        <select
          className="border p-2 w-full mb-4"
          value={selectedDataCategory}
          onChange={handleDataCategorySelect}
        >
          <option value="">-- Select a data category --</option>
          {dataCategories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        {selectedDataCategory && (
          <>
            <label className="block mb-2 font-semibold">Select Uploaded File:</label>
            <select
              className="border p-2 w-full"
              value={selectedFileId}
              onChange={handleFileSelect}
              disabled={loading}
            >
              <option value="">-- Select a file --</option>
              {loading ? (
                <option value="" disabled>Loading files...</option>
              ) : files.length === 0 ? (
                <option value="" disabled>No files found for this category</option>
              ) : (
                files.map((file) => (
                  <option key={file._id} value={file._id}>
                    {file.fileName} ({file.rowCount} rows)
                  </option>
                ))
              )}
            </select>
          </>
        )}
      </div>

      {selectedFileId && (
        <div className="mt-4">
          {loading ? (
            <div className="text-center py-4">
              <p>Loading mappings...</p>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-4">Field Mappings</h2>
                <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Input Field
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Mapped To
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Required
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Confidence
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Transformation
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {mappings.map((mapping, idx) => {
                        const targetField = targetFields.find(f => f.name === mapping.output_field);
                        const isRequired = targetField?.required || false;
                        const isManual = mapping.input_field === 'MANUAL';
                        
                        return (
                          <tr key={idx} className={isManual ? "bg-gray-50" : ""}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {isManual ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                  Manual Entry
                                </span>
                              ) : (
                                mapping.input_field
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <select
                                value={mapping.output_field}
                                onChange={(e) => handleOutputFieldChange(idx, e.target.value)}
                                className="p-2 border border-gray-300 rounded-md w-full"
                              >
                                <option value="">Not mapped</option>
                                {dropdownOptions.map((option) => (
                                  <option key={option} value={option}>
                                    {option}{targetFields.find(f => f.name === option)?.required ? ' *' : ''}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {isRequired ? (
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                  Required
                                </span>
                              ) : (
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                  Optional
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <div className="flex items-center">
                                <div className="w-full bg-gray-200 rounded-full h-2.5">
                                  <div
                                    className={`h-2.5 rounded-full ${
                                      isManual ? 'bg-purple-500' :
                                      mapping.confidence >= 0.7
                                        ? 'bg-green-500'
                                        : mapping.confidence >= 0.4
                                        ? 'bg-yellow-500'
                                        : 'bg-red-500'
                                    }`}
                                    style={{ width: `${isManual ? 100 : mapping.confidence * 100}%` }}
                                  ></div>
                                </div>
                                <span className="ml-2">{isManual ? '100%' : `${Math.round(mapping.confidence * 100)}%`}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {mapping.transformation_type && mapping.transformation_type !== 'none' ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  {mapping.transformation_type}
                                </span>
                              ) : (
                                <span className="text-gray-400">None</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <button
                                onClick={() => openTransformationModal(idx)}
                                className="text-indigo-600 hover:text-indigo-900 mr-3"
                              >
                                {isManual && !mapping.transformation_logic ? (
                                  <span className="font-semibold">Add Formula*</span>
                                ) : (
                                  "Add Formula"
                                )}
                              </button>
                              {isManual && (
                                <button
                                  onClick={() => {
                                    const updatedMappings = mappings.filter((_, i) => i !== idx);
                                    setMappings(updatedMappings);
                                    updateUnmappedTargetFields(updatedMappings);
                                  }}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  Remove
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                      
                      {/* Display unmapped target fields */}
                      {unmappedTargetFields.length > 0 && (
                        <tr className="bg-gray-100">
                          <td colSpan={5} className="px-6 py-4 text-sm text-gray-500">
                            <div className="flex justify-between items-center">
                              <div>
                                <span className="font-semibold">Unmapped Target Fields: </span>
                                {unmappedTargetFields.map((field, index) => {
                                  const isRequired = targetFields.find(f => f.name === field)?.required || false;
                                  return (
                                    <span key={field} className="mr-2">
                                      {field}{isRequired ? '*' : ''}
                                      {index < unmappedTargetFields.length - 1 ? ', ' : ''}
                                    </span>
                                  );
                                })}
                              </div>
                              <button
                                onClick={openAddMappingModal}
                                className="px-3 py-1 bg-green-500 text-white text-xs rounded-lg hover:bg-green-600 focus:outline-none"
                              >
                                Add Mapping
                              </button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Source Data Table */}
              {sampleData.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-xl font-semibold mb-4">Input Data Preview</h2>
                  <div className="overflow-x-auto">
                    <div className="min-w-full inline-block align-middle">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            {Object.keys(sampleData[0]).map((header) => (
                              <th
                                key={header}
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
                              >
                                {header}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {sampleData.map((row, rowIndex) => (
                            <tr key={rowIndex} className="hover:bg-gray-50">
                              {Object.keys(sampleData[0]).map((header) => (
                                <td
                                  key={header}
                                  className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                                >
                                  {row[header]}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={handlePreviewClick}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      Preview Mapped Data & Export
                    </button>
                    <button
                      onClick={openSaveMappingModal}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ml-3"
                    >
                      Save Mapping
                    </button>
                    <button
                      onClick={openLoadMappingModal}
                      className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ml-3"
                    >
                      Load Saved Mapping
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Preview Modal */}
      {isPreviewModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border shadow-lg rounded-md bg-white" style={{ width: '90%', maxWidth: '1200px', height: '80vh', display: 'flex', flexDirection: 'column' }}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Preview Mapped Data ({previewData.length} rows)
              </h3>
              <button
                onClick={() => setIsPreviewModalOpen(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Main content area - using a div with explicit overflow styles */}
            <div style={{
              flex: '1 1 auto',
              padding: '16px',
              overflow: 'auto' /* This is crucial - enables scrolling */
            }}>
              {/* Table wrapper to ensure it can be wider than container */}
              <div style={{ 
                minWidth: '100%',
                width: 'max-content' /* Allows content to determine width */
              }}>
                <table style={{ 
                  borderCollapse: 'collapse',
                  width: '100%'
                }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f9fafb' }}>
                      {previewData.length > 0 && Object.keys(previewData[0]).map((header) => {
                        const targetField = targetFields.find(f => f.name === header);
                        const isRequired = targetField?.required || false;
                        return (
                          <th
                            key={header}
                            style={{ 
                              padding: '12px 24px',
                              textAlign: 'left',
                              fontSize: '12px',
                              fontWeight: 'bold',
                              color: '#6b7280',
                              textTransform: 'uppercase',
                              whiteSpace: 'nowrap',
                              minWidth: '200px',
                              position: 'sticky',
                              top: 0,
                              backgroundColor: '#f9fafb',
                              borderBottom: '1px solid #e5e7eb'
                            }}
                          >
                            {header}
                            {isRequired && (
                              <span style={{ 
                                marginLeft: '4px', 
                                color: '#ef4444'
                              }}>*</span>
                            )}
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.map((row, rowIndex) => (
                      <tr 
                        key={rowIndex} 
                        style={{ 
                          borderBottom: '1px solid #e5e7eb'
                        }}
                      >
                        {Object.keys(previewData[0]).map((header) => (
                          <td
                            key={header}
                            style={{ 
                              padding: '12px 24px',
                              whiteSpace: 'nowrap',
                              fontSize: '14px',
                              color: '#6b7280',
                              minWidth: '200px'
                            }}
                          >
                            {row[header] !== null && row[header] !== undefined ? String(row[header]) : ''}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="p-4 border-t flex justify-end space-x-4">
              <button
                onClick={() => setIsPreviewModalOpen(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Cancel
              </button>
              <button
                onClick={handleExportClick}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Export to CSV
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transformation Modal */}
      {showTransformationModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Add Transformation</h3>
              <div className="mt-2 px-7 py-3">
                {/* AI Formula Generation */}
                <div className="mb-6 border-b pb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
                    Describe the transformation in plain English
                  </label>
                  <textarea
                    className="w-full p-2 border border-gray-300 rounded-md mb-2"
                    rows={2}
                    value={aiDescription}
                    onChange={(e) => setAiDescription(e.target.value)}
                    placeholder="E.g., Combine first name and last name with a space in between"
                  />
                  <button
                    onClick={generateFormulaWithAI}
                    disabled={isGeneratingFormula || !aiDescription}
                    className={`w-full px-4 py-2 ${
                      isGeneratingFormula || !aiDescription
                        ? 'bg-gray-300 cursor-not-allowed'
                        : 'bg-indigo-500 hover:bg-indigo-600'
                    } text-white rounded-md focus:outline-none`}
                  >
                    {isGeneratingFormula ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Generating...
                      </span>
                    ) : (
                      'Generate Formula'
                    )}
                  </button>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
                    Transformation Type
                  </label>
                  <select
                    className="w-full p-2 border border-gray-300 rounded-md"
                    value={transformationType}
                    onChange={(e) => setTransformationType(e.target.value)}
                  >
                    <option value="none">None</option>
                    <option value="concatenate">Concatenate</option>
                    <option value="substring">Substring</option>
                    <option value="arithmetic">Arithmetic</option>
                    <option value="conditional">Conditional</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
                    Transformation Logic
                  </label>
                  <textarea
                    className="w-full p-2 border border-gray-300 rounded-md"
                    rows={4}
                    value={transformationLogic}
                    onChange={(e) => setTransformationLogic(e.target.value)}
                    placeholder={
                      transformationType === 'concatenate' ? 'Example: {firstName} + " " + {lastName}' :
                      transformationType === 'substring' ? 'Example: {fullText}.substring(0, 5)' :
                      transformationType === 'arithmetic' ? 'Example: {price} * 1.1' :
                      transformationType === 'conditional' ? 'Example: {status} === "active" ? "Active" : "Inactive"' :
                      transformationType === 'custom' ? 'Enter custom transformation logic' :
                      'Select a transformation type'
                    }
                  />
                </div>
                {transformationType !== 'none' && (
                  <div className="mb-4 text-left">
                    <p className="text-xs text-gray-500 mb-1">Syntax Help:</p>
                    <ul className="text-xs text-gray-500 list-disc pl-4">
                      {transformationType === 'concatenate' && (
                        <>
                          <li>Use {'{fieldName}'} to reference other fields</li>
                          <li>Example: {'{firstName}'} + " " + {'{lastName}'}</li>
                        </>
                      )}
                      {transformationType === 'substring' && (
                        <>
                          <li>Use {'{fieldName}'}.substring(start, end)</li>
                          <li>Example: {'{fullText}'}.substring(0, 5)</li>
                        </>
                      )}
                      {transformationType === 'arithmetic' && (
                        <>
                          <li>Use {'{fieldName}'} with operators (+, -, *, /)</li>
                          <li>Example: {'{price}'} * 1.1</li>
                        </>
                      )}
                      {transformationType === 'conditional' && (
                        <>
                          <li>Use ternary operator: condition ? trueValue : falseValue</li>
                          <li>Example: {'{status}'} === "active" ? "Active" : "Inactive"</li>
                        </>
                      )}
                      {transformationType === 'custom' && (
                        <>
                          <li>Write JavaScript expressions using {'{fieldName}'}</li>
                          <li>Example: {'{value}'}.toUpperCase()</li>
                        </>
                      )}
                    </ul>
                  </div>
                )}
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowTransformationModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none"
                >
                  Cancel
                </button>
                <button
                  onClick={saveTransformation}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Mapping Modal */}
      {showAddMappingModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Add Manual Mapping</h3>
              <div className="mt-2 px-7 py-3">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
                    Target Field
                  </label>
                  <select
                    className="w-full p-2 border border-gray-300 rounded-md"
                    value={newMappingOutputField}
                    onChange={(e) => setNewMappingOutputField(e.target.value)}
                  >
                    {unmappedTargetFields.map((field) => {
                      const isRequired = targetFields.find(f => f.name === field)?.required || false;
                      return (
                        <option key={field} value={field}>
                          {field}{isRequired ? ' *' : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>
                <p className="text-sm text-gray-500 mb-4 text-left">
                  This will create a manual mapping that requires a transformation formula to generate the field value.
                </p>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowAddMappingModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none"
                >
                  Cancel
                </button>
                <button
                  onClick={addManualMapping}
                  className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none"
                  disabled={!newMappingOutputField}
                >
                  Add & Configure
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Save Mapping Modal */}
      {showSaveMappingModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Save Mapping</h3>
              <div className="mt-2 px-7 py-3">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
                    Mapping Name
                  </label>
                  <input
                    type="text"
                    className="w-full p-2 border border-gray-300 rounded-md"
                    value={mappingName}
                    onChange={(e) => setMappingName(e.target.value)}
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
                    Mapping Description
                  </label>
                  <textarea
                    className="w-full p-2 border border-gray-300 rounded-md"
                    rows={2}
                    value={mappingDescription}
                    onChange={(e) => setMappingDescription(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowSaveMappingModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none"
                >
                  Cancel
                </button>
                <button
                  onClick={saveCurrentMappings}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Load Mapping Modal */}
      {showLoadMappingModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Load Saved Mapping</h3>
              <div className="mt-2 px-7 py-3">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
                    Saved Mappings
                  </label>
                  <ul>
                    {savedMappings.map((mapping) => (
                      <li key={mapping._id}>
                        <button
                          onClick={() => loadSavedMapping(mapping._id)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          {mapping.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowLoadMappingModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MappingPage;
