# MyOwnCloud - AI-Powered Personal File Storage

<div align="center">

![MyOwnCloud Architecture](myowncloud_architecture.png)

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-blue.svg)](https://postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://docker.com/)
[![AI](https://img.shields.io/badge/AI-Groq%20Powered-orange.svg)](https://groq.com/)

*A modern, secure, and intelligent file storage solution with AI-powered search and categorization*

[Quick Start](#quick-start) • [Documentation](#documentation) • [Architecture](#architecture) • [Development](#development)

</div>

## Features

### Core Features
- **Secure Authentication** - JWT-based user authentication
- **File Management** - Upload, download, organize files in folders
- **Public Sharing** - Generate shareable links with optional expiry
- **Responsive Design** - Modern UI that works on all devices
- **Bulk Operations** - Select multiple files for batch operations

### AI-Powered Features
- **Smart Categorization** - Automatically categorizes files (Resume, Invoice, Report, etc.)
- **Intelligent Tagging** - Generates relevant tags based on file content
- **Content-Based Search** - Search files by their content, not just names
- **Text Extraction** - OCR for images, text parsing for PDFs
- **Groq AI Integration** - Uses advanced language models for analysis

### Technical Features
- **Docker Ready** - Complete containerization with Docker Compose
- **Fast Performance** - Optimized API endpoints and database queries
- **Real-time Updates** - Live file status and search results
- **Rich Metadata** - File size, type, creation date, AI analysis results
- **Security** - File access control and secure upload handling

## Quick Start

### Prerequisites
- Docker & Docker Compose (recommended)
- OR Node.js 20+ and PostgreSQL 15+ (for local development)
- Groq API Key ([Get it here](https://console.groq.com))

### Docker Deployment (Recommended)

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/MyOwnCloud.git
   cd MyOwnCloud
   ```

2. **Run the deployment script**
   ```bash
   ./deploy.sh
   ```
   
   Or manually:
   ```bash
   # Copy environment template
   cp .env.example .env
   # Edit .env with your Groq API key (optional for basic functionality)
   
   # Start all services
   docker-compose up -d
   
   # Run database migrations
   docker-compose exec backend npx prisma migrate deploy
   ```

3. **Access the application**
   - Frontend: http://localhost
   - Backend API: http://localhost:8000
   - Database: localhost:5432

4. **Create your first account**
   - Navigate to http://localhost
   - Click "Sign Up" to register
   - Login with your credentials

### Management Commands

```bash
# Start services
docker-compose up -d

# Stop services  
docker-compose down

# View logs
docker-compose logs -f

# Restart services
docker-compose restart

# Check status
docker-compose ps
```

### Local Development

#### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your database URL and Groq API key

# Setup database
npx prisma migrate dev
npx prisma generate

# Start server
npm start  # Runs on http://localhost:8000
```

#### Frontend Setup
```bash
cd myowncloud-client
npm install
npm start  # Runs on http://localhost:3000
```

## Documentation

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React)                     │
│  ┌─────────────┬─────────────┬─────────────────────────┐ │
│  │   Sidebar   │  FileGrid   │     Upload Zone         │ │
│  │ (AI Search) │ (Display)   │   (Drag & Drop)         │ │
│  └─────────────┴─────────────┴─────────────────────────┘ │
└─────────────────────┬───────────────────────────────────┘
                      │ HTTP/REST API
┌─────────────────────▼───────────────────────────────────┐
│                  Backend (Node.js)                      │
│  ┌─────────────┬─────────────┬─────────────────────────┐ │
│  │    Auth     │    File     │      AI Analysis        │ │
│  │ Middleware  │ Controller  │       Pipeline          │ │
│  └─────────────┴─────────────┴─────────────────────────┘ │
└─────────────────────┬───────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────┐
│              Storage & Database                         │
│  ┌─────────────────────────┬─────────────────────────────┐ │
│  │    PostgreSQL           │     File System             │ │
│  │   (Metadata)           │     (./uploads)             │ │
│  └─────────────────────────┴─────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### AI Analysis Workflow

1. **File Upload** → User uploads file via drag & drop or file picker
2. **Storage** → File saved to filesystem, metadata to PostgreSQL
3. **Analysis Trigger** → User clicks "Analyze" button
4. **Text Extraction** → 
   - PDFs: Extract text using pdf-parse
   - Images: OCR using Tesseract.js
   - Text files: Direct reading
5. **AI Processing** → Send text to Groq AI for:
   - Smart categorization (Resume, Invoice, Report, etc.)
   - Tag generation (relevant keywords)
6. **Database Update** → Save AI results to PostgreSQL
7. **Smart Search** → Content becomes searchable via AI analysis

### API Documentation

#### Authentication
```bash
POST /api/auth/register  # User registration
POST /api/auth/login     # User login
```

#### File Operations
```bash
GET    /api/files              # List user files
POST   /api/files/upload       # Upload files
GET    /api/files/:id/download # Download file
DELETE /api/files/bulk-delete  # Delete multiple files
POST   /api/files/:id/analyze  # Analyze file with AI
GET    /api/files/search?q=    # Search files by content
```

#### Sharing
```bash
POST /api/files/:id/share      # Generate share link
GET  /api/share/:shareId       # Access shared file
```

### AI Models Used

- **Text Generation**: Groq's Llama 3 models
  - Primary: `llama3-70b-8192` (most capable)
  - Fallback: `llama-3.1-8b-instant` (faster)
- **Text Extraction**: 
  - PDFs: pdf-parse library
  - Images: Tesseract.js OCR
- **File Detection**: file-type library

## Development

### Project Structure
```
MyOwnCloud/
├── backend/                    # Node.js Express API
│   ├── ai/                    # AI analysis pipeline
│   ├── controllers/           # Route controllers
│   ├── middleware/            # Auth & validation
│   ├── routes/               # API routes
│   ├── prisma/               # Database schema
│   └── uploads/              # File storage
├── myowncloud-client/         # React frontend
│   ├── src/
│   │   ├── components/       # Reusable components
│   │   ├── pages/           # Main pages
│   │   ├── services/        # API services
│   │   └── utils/           # Helper functions
└── docker-compose.yml        # Container orchestration
```

### Component Breakdown

#### Frontend Components
- **`Dashboard.jsx`** - Main orchestrator component
- **`Sidebar.jsx`** - Navigation and AI search interface
- **`FileGrid.jsx`** - File display with search/normal modes
- **`FileUploadZone.jsx`** - Drag & drop upload interface
- **`BreadcrumbHeader.jsx`** - Navigation breadcrumbs

#### Backend Modules
- **`analyzeFiles.js`** - Complete AI analysis pipeline
- **`fileController.js`** - File CRUD operations
- **`auth.js`** - JWT authentication middleware

### Project Workflow
For detailed project workflow and architecture diagrams, see [WORKFLOW.md](WORKFLOW.md).

### Troubleshooting

#### Common Issues
1. **CORS errors**: Backend CORS is configured for `http://localhost` and `http://localhost:3000`
2. **Database connection**: Ensure PostgreSQL container is running
3. **File upload errors**: Check file permissions and upload directory exists
4. **AI analysis fails**: Verify GROQ_API_KEY is valid

#### Logs
```bash
# View all service logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

### Adding New Features

#### Adding a New AI Model
```javascript
// In backend/ai/analyzeFiles.js
const models = [
    "llama3-70b-8192",
    "your-new-model-name",  // Add here
    // ... existing models
];
```

#### Adding New File Types
```javascript
// In detectFileType function
if (ext === '.your-extension') return 'your/mimetype';
```

#### Extending Search
```javascript
// In backend/routes/file.js search endpoint
// Add new search criteria to the where clause
```

### Configuration

### Environment Variables
```bash
# Database (Docker deployment)
DATABASE_URL=postgresql://myowncloud:myowncloud@postgres:5432/myowncloud

# Authentication  
JWT_SECRET=your-secure-jwt-secret-key

# AI Service (optional)
GROQ_API_KEY=your-groq-api-key

# Application
NODE_ENV=production
PORT=8000

# File Upload
MAX_FILE_SIZE=104857600
UPLOAD_PATH=./uploads
ALLOWED_FILE_TYPES=pdf,jpg,jpeg,png,gif,bmp,webp,txt,doc,docx
```

### Docker Services
- **Frontend**: React app served by Nginx on port 80
- **Backend**: Node.js API server on port 8000  
- **Database**: PostgreSQL with persistent volume on port 5432
- **Network**: Internal Docker network for secure service communication

### Production Deployment
For production environments, consider:
- SSL/TLS configuration
- Environment security best practices
- Database backup strategies
- Monitoring and logging setup

### Testing
The application includes:
- Backend API testing with Jest
- Frontend component testing
- Integration testing
- Docker container health checks

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Groq](https://groq.com/) for AI processing capabilities
- [Prisma](https://prisma.io/) for database ORM
- [Tesseract.js](https://tesseract.projectnaptha.com/) for OCR functionality
- [React](https://reactjs.org/) and [Node.js](https://nodejs.org/) communities

---

<div align="center">
</div>