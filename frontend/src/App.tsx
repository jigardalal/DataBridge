import { Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import Layout from './components/layout/Layout';
import { UploadPage } from './pages/UploadPage';
import MappingPage from './pages/MappingPage';
import DatasetsPage from './pages/DatasetsPage';

// Import your pages here
const Home = () => <div className="container mx-auto px-4 py-8">Home Page</div>;

// Protected route component that redirects to datasets page if no datasetId is provided
const ProtectedMappingRoute = () => {
  // Check if there's a datasetId in the URL query params
  const queryParams = new URLSearchParams(window.location.search);
  const hasDatasetId = queryParams.has('datasetId');
  
  // If there's no datasetId, redirect to datasets page
  if (!hasDatasetId) {
    return <Navigate to="/datasets" replace />;
  }
  
  // Otherwise, render the MappingPage
  return <MappingPage />;
};

export function App() {
  return (
    <Provider store={store}>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/mappings" element={<ProtectedMappingRoute />} />
          <Route path="/datasets" element={<DatasetsPage />} />
        </Routes>
      </Layout>
    </Provider>
  );
}
