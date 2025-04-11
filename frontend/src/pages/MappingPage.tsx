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

const MappingPage: React.FC = () => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [dataCategories, setDataCategories] = useState<string[]>([]);
  const [selectedFileId, setSelectedFileId] = useState<string>('');
  const [selectedDataCategory, setSelectedDataCategory] = useState<string>('');
  const [mappings, setMappings] = useState<Mapping[]>([]);
  const [dropdownOptions, setDropdownOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const response = await axios.get('/api/files');
        console.log('Uploaded files list:', response.data);
        setFiles(response.data || []);
      } catch (error: any) {
        console.error('Error fetching files:', error);
        if (error.response) {
          console.error('Response data:', error.response.data);
          console.error('Status:', error.response.status);
          console.error('Headers:', error.response.headers);
        } else if (error.request) {
          console.error('No response received:', error.request);
        } else {
          console.error('Error setting up request:', error.message);
        }
      }
    };

    const fetchDataCategories = async () => {
      try {
        const response = await axios.get('/api/data-categories');
        console.log('Data categories:', response.data);
        setDataCategories(response.data || []);
      } catch (error) {
        console.error('Error fetching data categories:', error);
      }
    };

    fetchFiles();
    fetchDataCategories();
  }, []);

  const fetchMappings = async (fileId: string, dataCategory: string) => {
    setLoading(true);
    try {
      const safeCategory = dataCategory.replace(/\s+/g, '_');
      const response = await axios.get(`/api/mappings/${safeCategory}?fileId=${fileId}`);
      console.log('Mapping API response:', response.data);
      setMappings(response.data.mappings || []);
      setDropdownOptions(response.data.dropdownOptions || []);
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
    }
  };

  const handleDataCategorySelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const category = e.target.value;
    console.log('Selected data category:', category);
    setSelectedDataCategory(category);
    if (category && selectedFileId) {
      fetchMappings(selectedFileId, category);
    } else {
      setMappings([]);
    }
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

        <label className="block mb-2 font-semibold">Select Uploaded File:</label>
        <select
          className="border p-2 w-full"
          value={selectedFileId}
          onChange={handleFileSelect}
        >
          <option value="">-- Select a file --</option>
          {files.map((file) => (
            <option key={file._id} value={file._id}>
              {file.fileName} ({file.rowCount} rows)
            </option>
          ))}
        </select>
        <pre className="mt-2 text-xs bg-gray-100 p-2">
          Data categories: {JSON.stringify(dataCategories, null, 2)}
          {"\n"}Selected data category: {selectedDataCategory}
          {"\n"}Files: {JSON.stringify(files, null, 2)}
          {"\n"}Selected fileId: {selectedFileId}
        </pre>
      </div>

      {selectedFileId === '' ? (
        <p>Please select a file to load mappings.</p>
      ) : loading ? (
        <p>Loading mappings...</p>
      ) : mappings.length === 0 ? (
        <p>No mappings found for this file.</p>
      ) : (
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
      )}
    </div>
  );
};

export default MappingPage;
