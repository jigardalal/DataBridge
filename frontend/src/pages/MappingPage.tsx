import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface Mapping {
  input_field: string;
  output_field: string;
  confidence: number;
}

interface UploadedFile {
  _id: string;
  fileName: string;
  createdAt: string;
  updatedAt: string;
  rowCount: number;
}

interface SampleDataRow {
  id: number;
  [key: string]: any;
}

const MappingPage: React.FC = () => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [dataCategories, setDataCategories] = useState<string[]>([]);
  const [selectedFileId, setSelectedFileId] = useState<string>('');
  const [selectedDataCategory, setSelectedDataCategory] = useState<string>('');
  const [mappings, setMappings] = useState<Mapping[]>([]);
  const [dropdownOptions, setDropdownOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [sampleData, setSampleData] = useState<any[]>([]);

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
                <table className="min-w-full border">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="p-2 border">Input Field</th>
                      <th className="p-2 border">Mapped To</th>
                      <th className="p-2 border">Confidence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mappings.map((mapping, idx) => (
                      <tr key={idx} className="border-b">
                        <td className="p-2 border">{mapping.input_field}</td>
                        <td className="p-2 border">
                          <select
                            className="border p-1 w-full"
                            value={mapping.output_field}
                            onChange={(e) =>
                              handleOutputFieldChange(idx, e.target.value)
                            }
                          >
                            <option value="">Select...</option>
                            {dropdownOptions.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="p-2 border">
                          <div className="w-full bg-gray-200 rounded h-4">
                            <div
                              className="bg-green-500 h-4 rounded"
                              style={{ width: `${Math.round(mapping.confidence * 100)}%` }}
                            ></div>
                          </div>
                          <span className="text-xs">{(mapping.confidence * 100).toFixed(1)}%</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {sampleData.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-xl font-semibold mb-4">Data Preview</h2>
                  <div className="overflow-x-auto">
                    <table className="min-w-full border">
                      <thead>
                        <tr className="bg-gray-100">
                          {Object.keys(sampleData[0]).map((header) => (
                            <th key={header} className="p-2 border font-semibold">
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {sampleData.map((row, rowIndex) => (
                          <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            {Object.values(row).map((value, colIndex) => (
                              <td key={colIndex} className="p-2 border">
                                {value}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default MappingPage;
