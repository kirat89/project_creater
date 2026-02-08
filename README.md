# Create-Anything: Workflow-Driven Task Management System

A complete, full-stack workflow management system for creating, managing, and executing complex tasks, products, and habits with real-time progress tracking.

## 📊 Features

✅ **Workflow Builder** - Create reusable step templates
✅ **Item Execution** - Create items from workflows and execute steps sequentially
✅ **Step Management** - Support for manual, checklist, approval, and timer steps
✅ **Substeps** - Break down complex steps into actionable checklists
✅ **Real-time Progress** - Visual progress bars and status indicators
✅ **Search** - Find workflows and items instantly
✅ **Authentication** - Secure user registration and login
✅ **Full API** - RESTful backend for all operations

## 🏗️ Architecture

```
Create-Anything/
├── apps/
│   ├── backend/        # Python FastAPI backend
│   ├── web/            # React frontend
│   └── mobile/         # React Native (future)
├── migrations/         # Database schemas
└── docs/
```

## 🚀 Quick Start

### Minimum Requirements
- Python 3.9+
- Node.js 18+
- PostgreSQL 12+

### Setup (5 minutes)

```bash
# 1. Backend setup
cd apps/backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
python -m uvicorn main:app --reload

# 2. Frontend setup (in new terminal)
cd apps/web
npm install
npm run dev
```

**Full setup guide**: See [SETUP_GUIDE.md](SETUP_GUIDE.md)

## 📖 Available at

- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Frontend**: http://localhost:3000

## 🛠️ Tech Stack

### Backend
- **FastAPI** - Modern, fast Python web framework
- **PostgreSQL** - Relational database
- **asyncpg** - Async PostgreSQL driver
- **JWT** - Secure authentication

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **React Router** - Navigation
- **Tailwind CSS** - Styling

## 📋 API Overview

### Core Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/workflows` | List workflows |
| POST | `/api/workflows` | Create workflow |
| POST | `/api/items` | Create item from workflow |
| PUT | `/api/executions/{id}/steps/{stepId}` | Update step status |
| POST | `/api/executions/{id}/steps/{stepId}/substeps` | Add substep |
| POST | `/api/auth/login` | User login |

Full API docs available at: http://localhost:8000/docs

## 🔐 Authentication

- Registration: `POST /api/auth/signup`
- Login: `POST /api/auth/login`
- Token: Stored in localStorage
- Expiry: 60 minutes (configurable)

## 📁 Project Structure

```
apps/backend/
├── routers/
│   ├── workflows.py      # Workflow CRUD operations
│   ├── items.py          # Item CRUD operations
│   ├── steps.py          # Step management
│   ├── auth.py           # Authentication endpoints
│   └── step_execution.py # Step execution & substeps
├── db.py                 # Database connection management
├── main.py               # FastAPI application
└── requirements.txt      # Python dependencies

apps/web/
├── src/
│   ├── app/              # Pages/routes
│   ├── components/       # React components
│   └── utils/
│       └── apiClient.ts  # Backend API client
├── package.json
└── .env.local            # Environment config
```

## 🎯 Workflow Example

1. **Create a Workflow**
   - Define steps: "Research", "Design", "Build", "Test"
   - Set step types: manual, checklist, approval
   - Enable substeps for complex steps

2. **Create an Item**
   - Select a workflow template
   - Set title and type (task/product/habit)
   - Execution instance created automatically

3. **Execute Steps**
   - Work through steps sequentially
   - Add substeps to active steps
   - Mark steps complete to unlock next
   - Track real-time progress

4. **Monitor Progress**
   - Visual progress bar
   - Completion percentage
   - Step status indicators
   - Search and filter items

## 🔧 Configuration

### Backend (.env)
```env
DATABASE_URL=postgresql://user:pass@localhost:5432/tracker_db_local
JWT_SECRET=your-secret-key
ACCESS_TOKEN_EXPIRE_MINUTES=60
BACKEND_PORT=8000
FRONTEND_ORIGIN=http://localhost:3000
```

### Frontend (.env.local)
```env
REACT_APP_API_URL=http://localhost:8000/api
```

## 📖 Documentation

- **Setup Guide**: [SETUP_GUIDE.md](SETUP_GUIDE.md) - Complete local setup
- **API Reference**: http://localhost:8000/docs (Swagger UI)
- **Database Schema**: [migrations/001_initial_schema.sql](migrations/001_initial_schema.sql)

## 🐛 Troubleshooting

**Backend won't start?**
- Check PostgreSQL is running
- Verify DATABASE_URL in .env
- Run: `pip install -r requirements.txt`

**CORS errors?**
- Update FRONTEND_ORIGIN in backend .env
- Default: http://localhost:3000

**Port already in use?**
- Backend: Change BACKEND_PORT in .env
- Frontend: Run `npm run dev -- --port 3001`

## 📝 Environment Setup Checklist

- [ ] PostgreSQL installed and running
- [ ] Database created: `tracker_db_local`
- [ ] Backend `.env` configured with DATABASE_URL
- [ ] Backend dependencies installed
- [ ] Frontend `.env.local` configured
- [ ] Frontend dependencies installed

## 🚀 Deployment

For production deployment:
1. Update JWT_SECRET to a strong random value
2. Use production PostgreSQL database
3. Set FRONTEND_ORIGIN to production URL
4. Use environment-specific configurations
5. Enable HTTPS for API and frontend

## 📞 Support

Check the [SETUP_GUIDE.md](SETUP_GUIDE.md) for detailed troubleshooting and more information.

---

**Status**: ✅ Ready for local development
**Last Updated**: February 2026
