import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface Mapping {
  input_field: string;
  output_field: string;
  confidence: number;
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
    const updated = [...mappings];
    updated[index].output_field = newValue;
    setMappings(updated);
  };

  const handlePreviewClick = async () => {
    setLoading(true);
    try {
      // Get all data from the backend for preview
      const response = await axios.get(`/api/mappings/${selectedDataCategory.replace(/\s+/g, '_')}?fileId=${selectedFileId}&allData=true`);
      const allData = response.data.sampleData || [];
      
      // Map the data to the output format
      const mappedData = allData.map((row: Record<string, any>) => {
        const mappedRow: SampleDataRow = {};
        mappings.forEach(mapping => {
          if (mapping.output_field) {
            mappedRow[mapping.output_field] = row[mapping.input_field] ?? null;
          }
        });
        return mappedRow;
      });
      
      setPreviewData(mappedData);
      setIsPreviewModalOpen(true);
    } catch (error) {
      console.error('Error fetching preview data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportClick = async () => {
    setLoading(true);
    try {
      // Get all data from the backend
      const response = await axios.get(`/api/mappings/${selectedDataCategory.replace(/\s+/g, '_')}?fileId=${selectedFileId}&allData=true`);
      const allData = response.data.sampleData || [];
      
      // Map the data to the output format
      const mappedData = allData.map((row: Record<string, any>) => {
        const mappedRow: SampleDataRow = {};
        mappings.forEach(mapping => {
          if (mapping.output_field) {
            mappedRow[mapping.output_field] = row[mapping.input_field] ?? null;
          }
        });
        return mappedRow;
      });
      
      if (!mappedData.length) {
        console.error('No data to export');
        return;
      }

      // Convert data to CSV
      const headers = Object.keys(mappedData[0]);
      const csvContent = [
        headers.join(','),
        ...mappedData.map((row: SampleDataRow) => 
          headers.map(header => {
            const value = row[header];
            return typeof value === 'string' && value.includes(',') 
              ? `"${value}"` 
              : value;
          }).join(',')
        )
      ].join('\n');

      // Create and trigger download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `mapped_data_${selectedDataCategory}_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
    } catch (error) {
      console.error('Error exporting data:', error);
    } finally {
      setLoading(false);
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
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {mappings.map((mapping, idx) => {
                        const targetField = targetFields.find(f => f.name === mapping.output_field);
                        const isRequired = targetField?.required || false;
                        
                        return (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {mapping.input_field}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <select
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                value={mapping.output_field}
                                onChange={(e) => handleOutputFieldChange(idx, e.target.value)}
                              >
                                <option value="">Select...</option>
                                {dropdownOptions.map((option) => {
                                  const isFieldRequired = targetFields.find(f => f.name === option)?.required || false;
                                  return (
                                    <option key={option} value={option}>
                                      {option}{isFieldRequired ? ' *' : ''}
                                    </option>
                                  );
                                })}
                              </select>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
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
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                                  <div
                                    className="bg-blue-600 h-2.5 rounded-full"
                                    style={{ width: `${Math.round(mapping.confidence * 100)}%` }}
                                  ></div>
                                </div>
                                <span className="text-sm text-gray-500">
                                  {(mapping.confidence * 100).toFixed(1)}%
                                </span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
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
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Preview Modal */}
      {isPreviewModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-[95vw] h-[90vh] flex flex-col">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-semibold">Preview Mapped Data</h3>
              <button
                onClick={() => setIsPreviewModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                            {row[header]}
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
    </div>
  );
};

export default MappingPage;
