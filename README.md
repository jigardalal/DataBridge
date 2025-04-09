# DataBridge

An AI-powered data onboarding system that simplifies the process of importing, analyzing, and transforming data using modern web technologies and artificial intelligence.

## Features

- Excel file parsing and processing
- AI-powered data analysis and mapping
- MongoDB data storage
- RESTful API backend
- Modern React frontend
- Docker support


## Tech Stack

### Backend
- Node.js + Express.js
- MongoDB with Mongoose
- OpenAI SDK for AI features
- SheetJS for Excel processing

### Frontend
- React 18 with TypeScript
- Material-UI (MUI)
- React Query
- React Router
- Vite


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
# Edit with your OpenAI API key

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
│   │   ├── config/        # Configuration files
│   │   ├── controllers/   # Route controllers
│   │   ├── middleware/    # Custom middleware
│   │   ├── models/        # Mongoose models
│   │   ├── routes/        # API routes
│   │   └── utils/         # Utility functions
│   ├── __tests__/        # Test files
│   └── package.json
│
├── frontend/              # React application
│   ├── src/
│   │   ├── components/   # Reusable components
│   │   ├── pages/        # Page components
│   │   ├── services/     # API services
│   │   ├── hooks/        # Custom hooks
│   │   ├── utils/        # Utility functions
│   │   └── types/        # TypeScript types
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
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## License

MIT
