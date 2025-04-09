import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3002";

export const api = axios.create({ baseURL: API_URL });

export const uploadDataset = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  const response = await api.post('/api/files/upload', formData);
  return response.data;
};

export const getDatasets = async () => {
  const response = await api.get("/api/datasets");
  return response.data;
};
