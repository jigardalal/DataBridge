import { Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import Layout from './components/layout/Layout';
import { UploadPage } from './pages/UploadPage';
import MappingPage from './pages/MappingPage';
import DatasetsPage from './pages/DatasetsPage';

// Import your pages here
const Home = () => <div className="container mx-auto px-4 py-8">Home Page</div>;

export function App() {
  return (
    <Provider store={store}>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/mappings" element={<MappingPage />} />
          <Route path="/datasets" element={<DatasetsPage />} />
        </Routes>
      </Layout>
    </Provider>
  );
}
