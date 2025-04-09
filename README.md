# DataBridge

An AI-powered data onboarding system that simplifies the process of importing, analyzing, and transforming data using modern web technologies and artificial intelligence.

## Features

- Excel/CSV file parsing and processing
  - Support for .xlsx, .xls, and .csv files
  - Intelligent blank row filtering
  - Automatic data validation
  - MongoDB storage of parsed data
- AI-powered data analysis and mapping
  - Classification of data types
  - Field mapping and transformation
  - Data validation and anomaly detection
  - Intelligent fix suggestions
- Token Management & Caching
  - Daily and per-request token limits
  - Usage tracking and statistics
  - Redis-based response caching
  - Automatic cache invalidation
- RESTful API backend
- Modern React frontend
- Docker support


## Tech Stack

### Backend
- Node.js + Express.js
- MongoDB with Mongoose
- OpenAI SDK for AI features
- SheetJS for Excel processing
- Multer for file uploads

### Frontend
- React 19 with TypeScript
- Redux Toolkit for state management
- Tailwind CSS for styling
- React Router v7 for navigation
- Material-UI (MUI) components
- React Query for data fetching
- Vite for build tooling


## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (v4.4 or higher)
- Docker & Docker Compose (optional)
- OpenAI API key

### Installation

1. Clone the repository
2. Install dependencies:
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

3. Set up environment variables:
```bash
# Backend
cp backend/.env.example backend/.env
# Edit with your OpenAI API key and other settings

# Frontend
cp frontend/.env.development frontend/.env.local
```

4. Start development servers:
```bash
# Backend
cd backend
npm run dev

# Frontend
cd frontend
npm run dev
```


## Project Structure

```
databridge/
├── backend/                # Express.js server
│   ├── src/
│   │   ├── agents/        # AI agents for data processing
│   │   │   ├── BaseAgent.js
│   │   │   ├── ClassificationAgent.js
│   │   │   ├── MappingAgent.js
│   │   │   └── ValidationAgent.js
│   │   ├── services/      # Core services
│   │   │   ├── TokenManager.js
│   │   │   ├── CacheManager.js
│   │   │   └── AIServiceManager.js
│   │   ├── config/        # Configuration files
│   │   ├── controllers/   # Route controllers
│   │   ├── middleware/    # Custom middleware
│   │   ├── models/        # Mongoose models
│   │   ├── routes/        # API routes
│   │   └── utils/         # Utility functions
│   ├── __tests__/        # Test files
│   │   ├── agents/       # Agent test suites
│   │   ├── controllers/  # Controller tests
│   │   ├── middleware/   # Middleware tests
│   │   └── models/       # Model tests
│   └── package.json
│
├── frontend/              # React application
│   ├── src/
│   │   ├── components/   # Reusable components
│   │   │   └── layout/  # Layout components (Header, Footer, Layout)
│   │   ├── store/       # Redux store configuration
│   │   ├── pages/       # Page components
│   │   ├── services/    # API services
│   │   ├── hooks/       # Custom hooks
│   │   ├── utils/       # Utility functions
│   │   └── types/       # TypeScript types
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── package.json
│
├── docker/               # Docker configuration
├── docs/                 # Documentation
└── docker-compose.yml
```

## Testing

### Running Tests

```bash
# Run all tests
cd backend
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Test Structure
- Unit tests are located in `__tests__` directories
- Tests follow the same structure as the source code
- Each test file is named `*.test.js`

### Continuous Integration
- GitHub Actions automatically runs tests on push and pull requests
- Tests run on Node.js 16.x and 18.x
- Coverage reports are generated and uploaded as artifacts
- PRs require passing tests before merging

### Coverage Requirements
- All new code should include tests
- Aim for 80% coverage on:
  - Statements
  - Branches
  - Functions
  - Lines

## Docker Deployment

```bash
docker-compose up --build
```

Access the application:
- Frontend: http://localhost:3001
- Backend API: http://localhost:3002

## License

MIT

## API Documentation

### File Upload API

#### Upload a File
```bash
POST http://localhost:3002/api/files/upload
Content-Type: multipart/form-data

Form Data:
- file: Excel/CSV file (.xlsx, .xls, .csv)
```

Response:
```json
{
  "message": "File uploaded and parsed successfully",
  "fileId": "67f6a23b93c73d9045ef1182",
  "rowCount": 100,
  "headers": ["Column1", "Column2", "..."],
  "totalRowsBeforeFiltering": 120,
  "blankRowsRemoved": 20
}
```

#### Retrieve Parsed Data
```bash
GET http://localhost:3002/api/files/:fileId
```

Response:
```json
{
  "fileName": "example.xlsx",
  "fileType": "xlsx",
  "data": [{...}],
  "rowCount": 100,
  "columnHeaders": ["Column1", "Column2", "..."],
  "uploadDate": "2024-04-09T16:37:15.465Z"
}
```

File Upload Features:
- Supports .xlsx, .xls, and .csv files
- Maximum file size: 5MB
- Automatically filters blank rows
- Validates file format and content
- Stores parsed data in MongoDB

### Token Management API

#### Get Token Usage Stats
```bash
GET http://localhost:3002/api/tokens/stats
```

Response:
```json
{
  "dailyUsage": 5000,
  "dailyLimit": 100000,
  "perRequestLimit": 1000,
  "usageHistory": [...]
}
```

#### Check Token Limits
```bash
POST http://localhost:3002/api/tokens/check
Content-Type: application/json

{
  "estimatedTokens": 100
}
```

Response:
```json
{
  "allowed": true,
  "remaining": 95000
}
```

### Cache Management API

#### Get Cache Stats
```bash
GET http://localhost:3002/api/cache/stats
```

Response:
```json
{
  "connected_clients": 1,
  "used_memory": "2.5MB",
  "total_keys": 50
}
```

#### Clear Cache
```bash
DELETE http://localhost:3002/api/cache/clear
```

Response:
```json
{
  "message": "Cache cleared successfully"
}
```
