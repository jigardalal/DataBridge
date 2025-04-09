# Task List - AI-Powered Data Onboarding MVP

## 🚀 Initial Project Setup (Completed)
- [X] Setup base MERN project structure (backend, frontend, docker)
- [X] Initialize package.json for backend and frontend
- [X] Install core dependencies (Express, React, Mongoose, OpenAI, SheetJS, Vite, MUI)
- [X] Create basic Docker configuration (Dockerfiles, docker-compose.yml)
- [X] Initialize Git repository and push to GitHub
- [X] Configure basic backend server (Express, DB connection)
- [X] Configure basic frontend application (Vite, React, TS, MUI, Router)
- [X] Add `.gitignore`
- [X] Create initial `README.md`
- [X] Debug initial setup errors (npm scripts, file syntax, configs)
- [X] Configure backend port to avoid conflicts (using port 3002)
- [X] Configure frontend port (using port 3001)

## Phase 1: Preparation & Design
- [ ] Define output schemas for each data type (Customers, Drivers, Rates, etc.)
- [ ] Collect a diverse set of messy input files (multi-tab, varying formats)
- [ ] Draft mapping dictionary format (input_field, output_field, data_type, rules, confidence_score, usage_stats) - *(Schema defines structure)*
- [X] Create MongoDB schema definitions for raw input, processed entities, and dictionary - *(RawFile, ProcessedData, MappingDictionary, AnomalyReport)*
- [ ] Design UI wireframes: Upload → Select Entity Type → Interactive Mapping → Preview/Export

## Phase 2: Backend Core + Specialized AI Agents PoC
- [ ] Build a minimal CLI PoC to test core AI functionality before UI development
- [X] Implement file upload API with:
  - [X] Support for .xlsx, .xls, and .csv files
  - [X] File size and type validation
  - [X] Blank row filtering
  - [X] Error handling
- [X] Integrate `sheetjs` to parse Excel files and normalize all tabs to JSON
- [X] Create input validation layer to catch obvious issues before AI processing
- [X] Store raw data in MongoDB (GridFS or pointer to file store) - *(RawFile schema created)*
- [X] Develop specialized OpenAI agents:
  - [X] Classification agent to identify tab content types
  - [X] Mapping agent to align fields with output schema
  - [X] Validation agent to detect anomalies and data issues
    - [X] Implement required field validation
    - [X] Add format validation (email, phone, date, etc.)
    - [X] Detect duplicate values
    - [X] Use AI for inconsistency detection
    - [X] Provide fix suggestions
    - [X] Add comprehensive test suite
- [X] Implement caching strategy for AI responses to reduce costs
- [X] Design and implement token budget management system
- [X] Save processed data with tags and metadata - *(ProcessedData schema created)*
- [ ] Implement CSV export functionality per data type
- [ ] Set up detailed logging for all AI interactions

## Phase 3: Frontend MVP
- [X] Build React UI:
  - [X] Set up React Router for navigation
  - [X] Configure Redux for state management
  - [X] Implement Tailwind CSS for styling
  - [X] Create basic layout components (Header, Footer, Layout)
  - [ ] File upload component with drag-and-drop support
  - [ ] Dropdown to select entity type
  - [ ] Progress/status display
  - [ ] Interactive mapping correction interface
  - [ ] Data preview table with anomaly flags
  - [ ] Download button for CSV export
  - [ ] Anomaly report preview

## Phase 4: Mapping Dictionary Management
- [X] Create MongoDB collection for mappings with versioning support - *(MappingDictionary schema created)*
- [ ] Build backend API for managing dictionary
- [ ] Implement dictionary evolution mechanism based on user corrections
- [ ] Develop React UI for:
  - [ ] Viewing mappings
  - [ ] Editing/adding new field rules
  - [ ] Template management for recurring file types
- [ ] Allow backend to update dictionary based on new fields found
- [X] Track usage statistics and confidence per mapping - *(Fields added to schema)*
- [ ] Implement fallback strategies for when AI can't confidently map fields

## Phase 5: Anomaly Reporting & Enhancement
- [X] Define anomaly types and rules (missing fields, duplicates, unmapped columns, etc.) - *(AnomalyReport schema created)*
- [ ] Generate anomaly reports from parsed data
- [ ] Display report in UI
- [ ] Allow download of anomaly reports
- [ ] Implement AI suggestions for fixing anomalies
- [ ] Add bulk processing support for multiple files
- [ ] Create versioning system for processed data
- [ ] Develop saved templates feature for recurring file types

## Phase 6: Infrastructure & Deployment
- [X] Dockerize backend and frontend apps early in development
- [ ] Set up AWS ECS with task definitions and autoscaling
- [ ] Configure S3 or EFS for file storage
- [X] Implement rate limiting for API endpoints - *(Dependency installed)*
- [X] Create CI/CD pipeline with GitHub Actions or AWS CodePipeline:
  - [X] Lint and unit test
  - [ ] Build Docker images
  - [ ] Push to ECR
  - [ ] Deploy to ECS
- [ ] Version prompt templates and mapping dictionaries

## Testing Infrastructure (New Section)
- [X] Set up Jest testing framework
- [X] Configure GitHub Actions for automated testing
- [X] Create comprehensive middleware tests:
  - [X] Upload middleware tests
  - [X] Error handler middleware tests
  - [X] Authentication middleware tests
- [X] Create comprehensive agent tests:
  - [X] BaseAgent tests
  - [X] ClassificationAgent tests
  - [X] MappingAgent tests
  - [X] ValidationAgent tests
- [ ] Add test coverage thresholds
- [ ] Create tests for models:
  - [ ] Dataset model tests
  - [ ] AnomalyReport model tests
  - [ ] MappingDictionary model tests
  - [ ] ProcessedData model tests
  - [ ] RawFile model tests
- [ ] Create tests for controllers
- [ ] Create tests for utility functions
- [ ] Set up integration tests
- [ ] Set up end-to-end tests with Cypress or Playwright

## Optional Enhancements
- [ ] Add Redis-based job queue for background file processing
- [ ] Incorporate LangChain or Semantic Kernel for orchestration
- [ ] Add telemetry/logging dashboard for prompt usage, errors, and outcomes
- [ ] Implement A/B testing framework for prompt optimization
- [ ] Create benchmark suite for evaluating mapping accuracy across file types

## Discovered During Work
- [X] Add validation for additional data formats (URLs, credit cards, etc.)
- [X] Implement batch validation for large datasets
- [X] Add support for custom validation rules
- [X] Create validation rule templates for common use cases
- [X] Add performance optimization for large-scale validation
- [X] Implement validation result caching
- [X] Add validation history tracking
- [X] Create validation report generation
- [X] Add support for international phone number formats
- [X] Implement validation rule versioning
- [ ] Create API endpoints for token management and cache control
- [ ] Add monitoring dashboard for token usage and cache performance
- [ ] Implement rate limiting based on token usage
- [ ] Add cache warming for frequently accessed data
- [ ] Create automated tests for token and cache services
