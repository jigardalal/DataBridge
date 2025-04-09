require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const connectDB = require("./config/db");
const authenticate = require('./middleware/auth');
const errorHandler = require('./middleware/errorHandler');
const fileRoutes = require('./routes/fileRoutes');

const app = express();

// Configure CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Configure Helmet with less restrictive settings for development
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false
}));

app.use(express.json());
app.use(morgan("dev"));

// Routes
app.use('/api/files', fileRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP' });
});

app.use(errorHandler);

// Only connect to database and start server if this file is run directly
if (require.main === module) {
  connectDB();
  const PORT = process.env.PORT || 3002;
  app.listen(PORT, () => console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`));
}

module.exports = { app, connectDB };
