# 🚀 Create-Anything Local Development Guide

Complete setup instructions to run the workflow management system locally.

## Prerequisites

- **Node.js** v18+ (for frontend)
- **Python** 3.9+ (for backend)
- **PostgreSQL** 12+ (for database)
- **npm** or **yarn** (for package management)

---

## 1️⃣ Database Setup

### Create PostgreSQL Database

```bash
# Start PostgreSQL (Windows)
# Make sure PostgreSQL service is running

# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE tracker_db_local;

# Exit
\q
```

### Run Migrations

The migrations will be run automatically when the backend starts, but you can also run them manually:

```bash
# From the backend directory
cd apps/backend

# The migrations will auto-run on startup
```

---

## 2️⃣ Backend Setup (Python/FastAPI)

### Install Dependencies

```bash
cd apps/backend

# Create virtual environment (recommended)
python -m venv venv

# Activate virtual environment
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### Configure Environment

Update `.env` file with your database credentials:

```env
DATABASE_URL="postgresql://postgres:your-password@localhost:5432/tracker_db_local"
JWT_SECRET="your-secret-key-change-this-in-production"
ACCESS_TOKEN_EXPIRE_MINUTES=60
BACKEND_PORT=8000
FRONTEND_ORIGIN="http://localhost:3000"
```

### Start Backend Server

```bash
# From apps/backend directory (with venv activated)
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Backend will be available at: **http://localhost:8000**
API docs: **http://localhost:8000/docs** (Swagger UI)

---

## 3️⃣ Frontend Setup (React/TypeScript)

### Install Dependencies

```bash
cd apps/web

npm install
```

### Configure Environment

A `.env.local` file has been created. Update it if needed:

```env
REACT_APP_API_URL=http://localhost:8000/api
```

### Start Development Server

```bash
# From apps/web directory
npm run dev
```

Frontend will be available at: **http://localhost:3000** (or the port shown in terminal)

---

## 4️⃣ Directory Structure

```
create-anything/
├── apps/
│   ├── backend/
│   │   ├── routers/          # API route handlers
│   │   │   ├── workflows.py   # Workflow CRUD
│   │   │   ├── items.py       # Item CRUD
│   │   │   ├── steps.py       # Step management
│   │   │   ├── auth.py        # Authentication
│   │   │   └── step_execution.py  # Execution & substeps
│   │   ├── db.py              # Database connection
│   │   ├── main.py            # FastAPI app
│   │   ├── requirements.txt   # Python dependencies
│   │   └── .env               # Environment variables
│   │
│   ├── web/
│   │   ├── src/
│   │   │   ├── app/           # Routes/pages
│   │   │   ├── utils/
│   │   │   │   └── apiClient.ts # Backend API calls
│   │   │   └── components/    # React components
│   │   ├── package.json
│   │   ├── .env.local         # Local config
│   │   └── .env.example       # Config template
│   │
│   └── mobile/                # React Native (optional for now)
└── migrations/
    └── 001_initial_schema.sql # Database schema
```

---

## 5️⃣ Available API Endpoints

### Workflows
- `GET /api/workflows` - List all workflows
- `POST /api/workflows` - Create workflow
- `GET /api/workflows/{id}` - Get workflow details
- `PUT /api/workflows/{id}` - Update workflow
- `DELETE /api/workflows/{id}` - Delete workflow

### Items
- `GET /api/items` - List all items
- `POST /api/items` - Create item from workflow
- `GET /api/items/{id}` - Get item with execution
- `PUT /api/items/{id}` - Update item
- `DELETE /api/items/{id}` - Delete item

### Steps
- `GET /api/steps` - List steps by workflow
- `POST /api/steps` - Create step
- `GET /api/steps/{id}` - Get step
- `PUT /api/steps/{id}` - Update step
- `DELETE /api/steps/{id}` - Delete step

### Authentication
- `POST /api/auth/signup` - Register user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

### Executions
- `GET /api/executions/{id}/steps` - Get execution steps
- `PUT /api/executions/{id}/steps/{stepId}` - Update step status
- `POST /api/executions/{id}/steps/{stepId}/substeps` - Add substep
- `GET /api/executions/{id}/steps/{stepId}/substeps` - Get substeps
- `PUT /api/executions/{id}/steps/{stepId}/substeps/{substepId}` - Update substep
- `DELETE /api/executions/{id}/steps/{stepId}/substeps/{substepId}` - Delete substep

---

## 6️⃣ Important Notes

### Authentication
- Backend uses JWT tokens for authentication
- Token is stored in `localStorage` with key `access_token`
- Include token in `Authorization: Bearer <token>` header
- Token expires after 60 minutes (configurable via `ACCESS_TOKEN_EXPIRE_MINUTES`)

### CORS
- Backend allows requests from `http://localhost:3000` by default
- Update `FRONTEND_ORIGIN` in `.env` if using different port

### Database Connection
- Ensure PostgreSQL is running before starting backend
- Check DATABASE_URL in `.env` matches your setup
- On first run, migrations auto-create all tables

### API Documentation
Interactive API docs available at http://localhost:8000/docs

---

## 7️⃣ Troubleshooting

### Backend won't start
```
Error: DATABASE_URL or NEON_DATABASE_URL must be set
→ Update DATABASE_URL in .env file

Error: Connection refused
→ Check if PostgreSQL is running
```

### CORS errors
```
Access to XMLHttpRequest blocked
→ Update FRONTEND_ORIGIN in backend .env to match your frontend URL
```

### Module not found errors
```
ModuleNotFoundError: No module named '...'
→ Activate virtual environment: source venv/bin/activate (or venv\Scripts\activate on Windows)
→ Install requirements: pip install -r requirements.txt
```

### Port already in use
```
# Change backend port in .env and run command:
python -m uvicorn main:app --reload --port 8001

# Change frontend port (React Router):
npm run dev -- --port 3001
```

---

## 8️⃣ Next Steps

1. ✅ Create workflows from the UI
2. ✅ Create items from those workflows
3. ✅ Execute steps and track progress
4. ✅ Add substeps to active steps
5. ✅ Search items and workflows

---

## 📚 Frontend API Usage Example

```typescript
import { workflowsAPI, itemsAPI, executionsAPI } from '@/utils/apiClient';

// Get all workflows
const workflows = await workflowsAPI.list();

// Create item from workflow
const { item, execution } = await itemsAPI.create({
  title: "My Task",
  item_type: "task",
  workflow_id: "workflow-id"
});

// Update step status
await executionsAPI.updateStepStatus(
  execution.id,
  step.id,
  "done"
);

// Add substep
await executionsAPI.addSubstep(
  execution.id,
  step.id,
  "Subtask name"
);
```

---

## 🤝 Support

If you encounter issues:
1. Check logs in terminal
2. Review `.env` configuration
3. Verify database connection
4. Check API docs at http://localhost:8000/docs

Happy coding! 🎉
