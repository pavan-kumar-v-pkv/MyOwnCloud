# MyOwnCloud - Complete Project Workflow

## System Architecture & Data Flow

```mermaid
graph TB
    %% User Layer
    subgraph "👤 User Layer"
        U[User Browser]
        M[Mobile Device]
    end

    %% Frontend Layer
    subgraph "🌐 Frontend Layer (Port 3000/80)"
        subgraph "React Components"
            D[Dashboard.jsx<br/>Main Orchestrator]
            S[Sidebar.jsx<br/>AI Search & Nav]
            FG[FileGrid.jsx<br/>File Display]
            FU[FileUploadZone.jsx<br/>Drag & Drop]
            BH[BreadcrumbHeader.jsx<br/>Navigation]
            SB[SearchBar.jsx<br/>Content Search]
        end
        
        subgraph "Frontend Services"
            AX[Axios API Client]
            RT[React Router]
            TW[Tailwind CSS]
        end
    end

    %% Backend Layer
    subgraph "🚀 Backend Layer (Port 8000)"
        subgraph "Express.js Server"
            API[Express App]
            AM[Auth Middleware<br/>JWT Validation]
            
            subgraph "Route Controllers"
                AC[Auth Controller<br/>Login/Register]
                FC[File Controller<br/>CRUD Operations]
                FOC[Folder Controller<br/>Organization]
                PC[Permission Controller<br/>Access Control]
            end
            
            subgraph "API Routes"
                AR[/api/auth/*]
                FR[/api/files/*]
                FoR[/api/folders/*]
                PR[/api/permissions/*]
            end
        end
        
        subgraph "Middleware Stack"
            ML[Multer<br/>File Upload]
            CP[CORS Policy]
            JP[JSON Parser]
            ER[Error Handler]
        end
    end

    %% AI Processing Layer
    subgraph "🤖 AI Processing Layer"
        subgraph "AI Pipeline"
            AP[analyzeFiles.js<br/>Main Pipeline]
            
            subgraph "Text Extraction"
                PDF[PDF Parser<br/>pdf-parse]
                OCR[OCR Engine<br/>Tesseract.js]
                TXT[Text Files<br/>Direct Read]
            end
            
            subgraph "AI Models"
                GROQ[Groq AI Service<br/>Llama 3 Models]
                CAT[Smart Categorization<br/>Resume/Invoice/Report]
                TAG[Tag Generation<br/>Content Keywords]
            end
        end
        
        subgraph "Model Fallback Chain"
            M1[llama3-70b-8192<br/>Primary Model]
            M2[llama-3.1-8b-instant<br/>Fast Fallback]
            M3[mixtral-8x7b-32768<br/>Alternative]
        end
    end

    %% Data Layer
    subgraph "💾 Data Layer"
        subgraph "PostgreSQL Database"
            subgraph "Database Tables"
                UT[Users Table<br/>Auth & Profiles]
                FT[Files Table<br/>Metadata & AI Results]
                FOT[Folders Table<br/>Organization]
                ST[ShareLinks Table<br/>Public Access]
                PT[Permissions Table<br/>Access Control]
            end
            
            PO[Prisma ORM<br/>Type-safe DB Access]
        end
        
        subgraph "File Storage"
            FS[Local Filesystem<br/>./uploads/]
            TH[Thumbnails<br/>./uploads/thumbnails/]
        end
    end

    %% External Services
    subgraph "🌍 External Services"
        GA[Groq API<br/>AI Processing]
        EMAIL[Email Service<br/>Notifications]
    end

    %% User Interactions
    U --> D
    M --> D
    
    %% Frontend Component Flow
    D --> S
    D --> FG
    D --> FU
    D --> BH
    S --> SB
    
    %% Frontend to Backend API Calls
    AX --> API
    SB --> FR
    FU --> FR
    FG --> FR
    
    %% Backend Route Processing
    API --> AM
    AM --> AC
    AM --> FC
    AM --> FOC
    AM --> PC
    
    AC --> AR
    FC --> FR
    FOC --> FoR
    PC --> PR
    
    %% Middleware Processing
    API --> ML
    API --> CP
    API --> JP
    API --> ER
    
    %% File Upload Flow
    ML --> FS
    FC --> AP
    
    %% AI Processing Flow
    AP --> PDF
    AP --> OCR
    AP --> TXT
    PDF --> GROQ
    OCR --> GROQ
    TXT --> GROQ
    
    %% AI Model Hierarchy
    GROQ --> M1
    M1 --> M2
    M2 --> M3
    
    %% AI Results
    GROQ --> CAT
    GROQ --> TAG
    CAT --> FC
    TAG --> FC
    
    %% Database Operations
    FC --> PO
    FOC --> PO
    PC --> PO
    PO --> UT
    PO --> FT
    PO --> FOT
    PO --> ST
    PO --> PT
    
    %% External API Calls
    AP --> GA
    
    %% Data Storage
    FC --> FS
    FC --> TH

    %% Styling
    classDef userClass fill:#3498db,stroke:#2980b9,stroke-width:2px,color:#fff
    classDef frontendClass fill:#e74c3c,stroke:#c0392b,stroke-width:2px,color:#fff
    classDef backendClass fill:#2ecc71,stroke:#27ae60,stroke-width:2px,color:#fff
    classDef aiClass fill:#f39c12,stroke:#e67e22,stroke-width:2px,color:#fff
    classDef dataClass fill:#9b59b6,stroke:#8e44ad,stroke-width:2px,color:#fff
    classDef externalClass fill:#34495e,stroke:#2c3e50,stroke-width:2px,color:#fff

    class U,M userClass
    class D,S,FG,FU,BH,SB,AX,RT,TW frontendClass
    class API,AM,AC,FC,FOC,PC,AR,FR,FoR,PR,ML,CP,JP,ER backendClass
    class AP,PDF,OCR,TXT,GROQ,CAT,TAG,M1,M2,M3 aiClass
    class UT,FT,FOT,ST,PT,PO,FS,TH dataClass
    class GA,EMAIL externalClass
```

## User Journey & Feature Flow

```mermaid
journey
    title MyOwnCloud User Journey
    section Authentication
      Visit App: 3: User
      Register/Login: 4: User
      JWT Token: 5: Backend
    section File Management
      Browse Files: 4: User
      Upload Files: 5: User
      Organize Folders: 4: User
      Set Permissions: 3: User
    section AI Analysis
      Click Analyze: 5: User
      Extract Text: 4: AI
      Generate Tags: 5: AI
      Categorize File: 5: AI
      Update Database: 4: Backend
    section Smart Search
      Enter Search Term: 5: User
      Content Matching: 5: AI
      Display Results: 5: Frontend
      Access Files: 4: User
    section Sharing
      Generate Link: 4: User
      Set Expiry: 3: User
      Share Publicly: 5: User
```

## Deployment Workflow

```mermaid
graph TD
    subgraph "Development"
        DEV[Local Development]
        GIT[Git Repository]
        BRANCH[Feature Branch]
    end
    
    subgraph "CI/CD Pipeline"
        subgraph "Build Stage"
            BUILD[Docker Build]
            TEST[Run Tests]
            LINT[Code Linting]
        end
        
        subgraph "Deploy Stage"
            PUSH[Push to Registry]
            DEPLOY[Deploy to Server]
            HEALTH[Health Check]
        end
    end
    
    subgraph "Production Environment"
        subgraph "Container Stack"
            NGINX[Nginx Proxy<br/>Port 80]
            REACT[React App<br/>Static Files]
            NODE[Node.js API<br/>Port 8000]
            POSTGRES[PostgreSQL<br/>Port 5432]
        end
        
        subgraph "Monitoring"
            LOGS[Application Logs]
            METRICS[Performance Metrics]
            ALERTS[Error Alerts]
        end
    end
    
    DEV --> BRANCH
    BRANCH --> GIT
    GIT --> BUILD
    BUILD --> TEST
    TEST --> LINT
    LINT --> PUSH
    PUSH --> DEPLOY
    DEPLOY --> HEALTH
    HEALTH --> NGINX
    NGINX --> REACT
    NGINX --> NODE
    NODE --> POSTGRES
    
    NODE --> LOGS
    POSTGRES --> METRICS
    LOGS --> ALERTS

    classDef devClass fill:#3498db,stroke:#2980b9,stroke-width:2px,color:#fff
    classDef ciClass fill:#e74c3c,stroke:#c0392b,stroke-width:2px,color:#fff
    classDef prodClass fill:#2ecc71,stroke:#27ae60,stroke-width:2px,color:#fff
    classDef monitorClass fill:#f39c12,stroke:#e67e22,stroke-width:2px,color:#fff

    class DEV,GIT,BRANCH devClass
    class BUILD,TEST,LINT,PUSH,DEPLOY,HEALTH ciClass
    class NGINX,REACT,NODE,POSTGRES prodClass
    class LOGS,METRICS,ALERTS monitorClass
```

## Database Schema Flow

```mermaid
erDiagram
    User {
        int id PK
        string name
        string email UK
        string password
        string role
        datetime createdAt
    }
    
    Folder {
        int id PK
        string name
        int parentId FK
        int userId FK
        datetime createdAt
    }
    
    File {
        int id PK
        string filename
        string filepath
        string mimetype
        int size
        int userId FK
        int folderId FK
        string textExtract
        string[] tags
        string category
        string thumbnailPath
        datetime createdAt
    }
    
    ShareLink {
        int id PK
        string shareId UK
        int fileId FK
        datetime expiresAt
        datetime createdAt
    }
    
    FilePermission {
        int id PK
        int fileId FK
        int userId FK
        string permission
    }
    
    User ||--o{ File : owns
    User ||--o{ Folder : creates
    Folder ||--o{ File : contains
    Folder ||--o{ Folder : "parent/child"
    File ||--o{ ShareLink : "can be shared"
    File ||--o{ FilePermission : "has permissions"
    User ||--o{ FilePermission : "granted to"
```

## AI Processing Flow

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend
    participant AI as AI Pipeline
    participant G as Groq API
    participant DB as Database
    participant FS as File Storage

    U->>F: Click "Analyze" button
    F->>B: POST /api/files/:id/analyze
    B->>FS: Read file from storage
    FS-->>B: File buffer
    B->>AI: analyzeFile(fileRecord)
    
    AI->>AI: detectFileType(filepath)
    AI->>AI: extractText(filepath, mimetype)
    
    alt PDF File
        AI->>AI: pdf-parse(buffer)
    else Image File
        AI->>AI: tesseract.recognize(buffer)
    else Text File
        AI->>AI: buffer.toString()
    end
    
    AI->>G: generateTagsAndCategory(text)
    G-->>AI: {tags: [], category: ""}
    
    AI-->>B: {textExtract, tags, category}
    B->>DB: Update file metadata
    DB-->>B: Updated record
    B-->>F: Analysis complete
    F-->>U: Show analysis results
    
    Note over U,FS: File is now searchable by content
```
