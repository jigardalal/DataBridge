import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface Mapping {
  input_field: string;
  output_field: string;
  confidence: number;
}

const MappingPage: React.FC = () => {
  const [mappings, setMappings] = useState<Mapping[]>([]);
  const [dropdownOptions, setDropdownOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMappings = async () => {
      try {
        const response = await axios.get('/api/mappings/customer');
        console.log('Mapping API response:', response.data);
        setMappings(response.data.mappings || []);
        setDropdownOptions(response.data.dropdownOptions || []);
      } catch (error) {
        console.error('Error fetching mappings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMappings();
  }, []);

  const handleOutputFieldChange = (index: number, newValue: string) => {
    const updated = [...mappings];
    updated[index].output_field = newValue;
    setMappings(updated);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">AI-Suggested Field Mappings</h1>
      {loading ? (
        <p>Loading...</p>
      ) : mappings.length === 0 ? (
        <p>No mappings found.</p>
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
