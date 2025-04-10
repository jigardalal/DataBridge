import { Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import Layout from './components/layout/Layout';
import { UploadPage } from './pages/UploadPage';

// Import your pages here
const Home = () => <div className="container mx-auto px-4 py-8">Home Page</div>;
const About = () => <div className="container mx-auto px-4 py-8">About Page</div>;
const Contact = () => <div className="container mx-auto px-4 py-8">Contact Page</div>;

export function App() {
  return (
    <Provider store={store}>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
        </Routes>
      </Layout>
    </Provider>
  );
}
