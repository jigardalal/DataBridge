# AI-Powered Data Onboarding - Planning Document

## Overview
This project aims to streamline the onboarding process for customers using intelligent AI workflows to handle messy Excel or Sheets files, map them to structured schemas, and flag anomalies. The solution will use a MERN stack, OpenAI SDK, and AWS ECS for scalable deployment.

---

## High-Level MVP Scope

### **Input**
- Excel/Google Sheets
- Multi-tab, semi-structured

### **Output**
- Schema-aligned CSVs per data type: Customers, Drivers, Rates, etc.

### **Tech Stack**
- MERN Stack (MongoDB, Express.js, React, Node.js)
- OpenAI SDK (Agentic AI workflows)
- AWS ECS + Docker for deployment
- Optional: Redis queue, S3 or EFS for storage

### **Initial Features**
- File upload (Excel/Sheet)
- AI-driven data classification & field mapping
- Data cleansing & deduplication
- Export to schema-aligned CSV
- Anomaly reporting (optional corrections)
- Interactive mapping correction

---

## Phased Implementation Plan

### **PHASE 1: Preparation & Design**
- Define output schemas + minimum required fields
- Gather messy sample files
- Design initial mapping dictionary format:
  - input_field
  - output_field
  - data_type
  - rules/notes
  - confidence_score
  - usage_stats
- Define MongoDB schemas
- Draft UI wireframes (upload > select > preview/export)

### **PHASE 2: Backend Core + Specialized AI Agents PoC**

#### **a. File Upload & Parsing**
- Use `sheetjs` to parse Excel tabs
- Normalize to JSON
- Store in MongoDB GridFS or S3
- Implement input validation layer before AI processing

#### **b. AI Agent Workflow**
- Implement specialized agents:
  - Classification agent for identifying tab content types
  - Mapping agent for field alignment 
  - Validation agent for anomaly detection
- Clean, deduplicate, and validate data
- Generate structured, schema-aligned JSON
- Persist with tags + prompt logs
- Implement caching strategy for AI responses

#### **c. Export**
- User preview of mapped data
- Generate downloadable CSV
- Optional S3 export

### **PHASE 3: MVP Frontend**
- React UI for:
  - File upload
  - Entity type selection (Customer, Driver, etc.)
  - Status & progress
  - Preview mapped output
  - Interactive mapping correction
  - Anomaly report
  - Download CSV

### **PHASE 4: Mapping Dictionary Management**
- MongoDB collection for mapping dictionary
- Admin UI for editing/adding mappings
- Dictionary includes:
  - Field name variations
  - Rules
  - Source samples
  - Confidence score/stats
  - Version history
- Support regex/wildcard rules
- Design dictionary evolution mechanism based on user corrections

### **PHASE 5: Anomaly Reporting**
- Highlight:
  - Missing required fields
  - Duplicate entries
  - Unmapped/unknown fields
  - Format errors (emails, ZIPs, etc.)
- Generate AI suggestions for fixes
- Export reports or re-upload fixed data
- Implement fallback strategies for low-confidence mappings

### **PHASE 6: Infrastructure & Deployment**
- Dockerize all services (early in development process)
- Deploy to AWS ECS (EFS/S3 for storage)
- GitHub Actions or AWS CodePipeline:
  - Lint → Docker build → Push to ECR → Deploy to ECS
- Version control for prompt templates + schema/mapping dictionaries
- Implement token budget management for AI calls
- Add rate limiting to API endpoints

---

## Additional Features & Recommendations
- Start with CLI/backend-only PoC before frontend
- Modular prompt templates for flexibility
- Intermediate JSON schema before CSV generation (for validation/debugging)
- Add telemetry from Day 1 (usage, anomalies, errors)
- Allow export of current mappings/dictionaries
- Templates for recurring file types
- Bulk processing for multiple files
- Data versioning for processed outputs

---

## Technologies Checklist

| Component        | Tool/Tech                      |
|------------------|-------------------------------|
| UI               | React + Redux                 |
| API              | Node.js + Express             |
| DB               | MongoDB (with GridFS)         |
| Excel Parsing    | sheetjs (xlsx)                |
| AI Integration   | OpenAI SDK                    |
| Workflow         | Optional: LangChain/Semantic Kernel |
| Storage          | GridFS/S3                     |
| Queues (opt.)    | Redis                         |
| Infra            | Docker, AWS ECS               |
| CI/CD            | GitHub Actions / AWS Pipeline |
| Caching          | Redis/MongoDB                 |

---

## Summary
- **MVP Flow**: Upload → Validate → Classify → Clean → Map → Interactive Review → Export
- Specialized AI agents power classification, validation, and mapping
- Dictionary evolves over time with user feedback and field variations
- Interactive mapping correction builds user trust and improves system accuracy
- Modular design enables future integrations and new entity types
- Deployed on AWS with full CI/CD and scalable architecture
- Comprehensive token management and caching reduces costs and improves performance

---

## Next Steps
- Draft sample OpenAI prompts for each specialized agent
- Create example schema + dictionary for Customer entity
- Build CLI PoC for classification + mapping + CSV output
- Start collecting edge-case input data for prompt tuning
- Design caching strategy for AI responses
