import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface Dataset {
  _id: string;
  name: string;
  description?: string;
  fileUrl: string;
  status: string;
}

const DatasetsPage: React.FC = () => {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);

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
              <p className="text-sm">File: {dataset.fileUrl}</p>
              <p className="text-sm">Status: {dataset.status}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DatasetsPage;
