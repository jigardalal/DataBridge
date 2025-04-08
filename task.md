# Task List - AI-Powered Data Onboarding MVP

## Phase 1: Preparation & Design
- [ ] Define output schemas for each data type (Customers, Drivers, Rates, etc.)
- [ ] Collect a diverse set of messy input files (multi-tab, varying formats)
- [ ] Draft mapping dictionary format (input_field, output_field, data_type, rules, confidence_score, usage_stats)
- [ ] Create MongoDB schema definitions for raw input, processed entities, and dictionary
- [ ] Design UI wireframes: Upload → Select Entity Type → Interactive Mapping → Preview/Export

## Phase 2: Backend Core + Specialized AI Agents PoC
- [ ] Build a minimal CLI PoC to test core AI functionality before UI development
- [ ] Implement file upload API
- [ ] Integrate `sheetjs` to parse Excel files and normalize all tabs to JSON
- [ ] Create input validation layer to catch obvious issues before AI processing
- [ ] Store raw data in MongoDB (GridFS or pointer to file store)
- [ ] Develop specialized OpenAI agents:
  - [ ] Classification agent to identify tab content types
  - [ ] Mapping agent to align fields with output schema
  - [ ] Validation agent to detect anomalies and data issues
- [ ] Implement caching strategy for AI responses to reduce costs
- [ ] Design and implement token budget management system
- [ ] Save processed data with tags and metadata
- [ ] Implement CSV export functionality per data type
- [ ] Set up detailed logging for all AI interactions

## Phase 3: Frontend MVP
- [ ] Build React UI:
  - [ ] File upload component with drag-and-drop support
  - [ ] Dropdown to select entity type
  - [ ] Progress/status display
  - [ ] Interactive mapping correction interface
  - [ ] Data preview table with anomaly flags
  - [ ] Download button for CSV export
  - [ ] Anomaly report preview

## Phase 4: Mapping Dictionary Management
- [ ] Create MongoDB collection for mappings with versioning support
- [ ] Build backend API for managing dictionary
- [ ] Implement dictionary evolution mechanism based on user corrections
- [ ] Develop React UI for:
  - [ ] Viewing mappings
  - [ ] Editing/adding new field rules
  - [ ] Template management for recurring file types
- [ ] Allow backend to update dictionary based on new fields found
- [ ] Track usage statistics and confidence per mapping
- [ ] Implement fallback strategies for when AI can't confidently map fields

## Phase 5: Anomaly Reporting & Enhancement
- [ ] Define anomaly types and rules (missing fields, duplicates, unmapped columns, etc.)
- [ ] Generate anomaly reports from parsed data
- [ ] Display report in UI
- [ ] Allow download of anomaly reports
- [ ] Implement AI suggestions for fixing anomalies
- [ ] Add bulk processing support for multiple files
- [ ] Create versioning system for processed data
- [ ] Develop saved templates feature for recurring file types

## Phase 6: Infrastructure & Deployment
- [ ] Dockerize backend and frontend apps early in development
- [ ] Set up AWS ECS with task definitions and autoscaling
- [ ] Configure S3 or EFS for file storage
- [ ] Implement rate limiting for API endpoints
- [ ] Create CI/CD pipeline with GitHub Actions or AWS CodePipeline:
  - [ ] Lint and unit test
  - [ ] Build Docker images
  - [ ] Push to ECR
  - [ ] Deploy to ECS
- [ ] Version prompt templates and mapping dictionaries

## Optional Enhancements
- [ ] Add Redis-based job queue for background file processing
- [ ] Incorporate LangChain or Semantic Kernel for orchestration
- [ ] Add telemetry/logging dashboard for prompt usage, errors, and outcomes
- [ ] Implement A/B testing framework for prompt optimization
- [ ] Create benchmark suite for evaluating mapping accuracy across file types
