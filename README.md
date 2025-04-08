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

## Docker Deployment

```bash
docker-compose up --build
```

Access the application:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## License

MIT
