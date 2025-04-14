import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

interface Dataset {
  _id: string;
  name: string;
  description?: string;
  fileUrl: string;
  fileId: string;
  fileName?: string;
  dataCategory?: string;
  status: string;
  mappings?: {
    dataCategory?: string;
  };
}

const DatasetsPage: React.FC = () => {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDatasets = async () => {
      try {
        const response = await axios.get('/api/datasets');
        setDatasets(response.data);
      } catch (error) {
        console.error('Error fetching datasets:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDatasets();
  }, []);

  const openMapping = (dataset: Dataset) => {
    console.log('Opening mapping for dataset:', dataset);
    
    // Navigate directly to the mapping page with just the dataset ID
    // This will load all necessary data from the backend
    navigate(`/mappings?datasetId=${dataset._id}`);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Datasets</h1>
      {loading ? (
        <p>Loading...</p>
      ) : datasets.length === 0 ? (
        <p>No datasets found.</p>
      ) : (
        <div className="space-y-4">
          {datasets.map((dataset) => (
            <div key={dataset._id} className="border p-4 rounded shadow">
              <h2 className="font-semibold">{dataset.name}</h2>
              <p className="text-gray-600">{dataset.description}</p>
              <p className="text-sm">File: {dataset.fileName || dataset.fileUrl}</p>
              {dataset.dataCategory && <p className="text-sm">Category: {dataset.dataCategory}</p>}
              <p className="text-sm">Status: {dataset.status}</p>
              <div className="mt-3">
                <button
                  onClick={() => openMapping(dataset)}
                  className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Open Mapping
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DatasetsPage;
