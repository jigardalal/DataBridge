import { Link } from 'react-router-dom';

const Header = () => {
  return (
    <header className="bg-white shadow-md">
      <nav className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <Link to="/" className="text-xl font-bold text-gray-800">
            DataBridge
          </Link>
          <div className="space-x-4">
            <Link to="/" className="text-gray-600 hover:text-gray-800">
              Home
            </Link>
            <Link to="/about" className="text-gray-600 hover:text-gray-800">
              About
            </Link>
            <Link to="/contact" className="text-gray-600 hover:text-gray-800">
              Contact
            </Link>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header; 