# Pre-Launch Checklist ✅

Use this checklist to verify everything is set up correctly before launching the app.

## System Requirements

- [ ] Python 3.9 or higher installed
- [ ] Node.js 18 or higher installed
- [ ] PostgreSQL 12 or higher installed
- [ ] npm or yarn installed

## Database Setup

- [ ] PostgreSQL service is running
- [ ] Database `tracker_db_local` created
- [ ] Database user/password accessible
- [ ] Can connect: `psql -U postgres -d tracker_db_local`

## Backend Setup

- [ ] Clone/navigate to `apps/backend` directory
- [ ] Virtual environment created: `python -m venv venv`
- [ ] Virtual environment activated
- [ ] Dependencies installed: `pip install -r requirements.txt`
- [ ] `.env` file exists with correct values:
  - [ ] `DATABASE_URL` set correctly
  - [ ] `JWT_SECRET` configured
  - [ ] `BACKEND_PORT=8000`
  - [ ] `FRONTEND_ORIGIN=http://localhost:3000`
- [ ] Can start with: `python -m uvicorn main:app --reload`

## Frontend Setup

- [ ] Navigate to `apps/web` directory
- [ ] Dependencies installed: `npm install`
- [ ] `.env.local` file exists with:
  - [ ] `REACT_APP_API_URL=http://localhost:8000/api`
- [ ] Can start with: `npm run dev`

## Port Availability

- [ ] Port 8000 is available (backend)
- [ ] Port 3000 is available (frontend)
- [ ] Port 5432 is available (PostgreSQL)

## Optional: Using Startup Scripts

### Windows
- [ ] Run: `.\start-dev.bat` from project root
- [ ] Both services start in new windows
- [ ] Browser opens automatically

### macOS/Linux
- [ ] Run: `bash start-dev.sh` from project root
- [ ] Both services start in background
- [ ] Press Ctrl+C to stop all services

## First Test Run

After starting services (either manually or via scripts):

1. **Backend API Test**
   - [ ] Visit http://localhost:8000
   - [ ] See "Welcome to Create-Anything Backend"
   - [ ] Check Swagger UI: http://localhost:8000/docs

2. **Frontend Test**
   - [ ] Visit http://localhost:3000
   - [ ] See application interface
   - [ ] No console errors in browser

3. **Database Connection Test**
   - [ ] Load any page that fetches data
   - [ ] Check backend console for active requests
   - [ ] No database connection errors

## First Time User Journey

1. **Sign Up**
   - [ ] Click "Sign Up" or go to `/auth/signup`
   - [ ] Create account with email/password
   - [ ] Redirected to dashboard

2. **Create Workflow**
   - [ ] Navigate to workflows
   - [ ] Click "Create Workflow"
   - [ ] Add workflow name and type
   - [ ] Add multiple steps
   - [ ] Workflow created successfully

3. **Create Item**
   - [ ] Go to "New Item"
   - [ ] Select workflow template
   - [ ] Set title and type
   - [ ] Item created with execution

4. **Execute Steps**
   - [ ] Item opens in execution view
   - [ ] First step is "active"
   - [ ] Can mark steps complete
   - [ ] Next step unlocks automatically
   - [ ] Can add substeps

## Data Persistence

- [ ] Close browser, reopen: data still there
- [ ] Restart backend: data preserved
- [ ] Check database directly: tables populated correctly

## API Endpoints Test

Using http://localhost:8000/docs (Swagger UI):

- [ ] GET `/api/workflows` - Returns empty list or workflows
- [ ] POST `/api/auth/signup` - Can create user
- [ ] POST `/api/auth/login` - Can login
- [ ] GET `/api/auth/me` - Returns current user (with token)
- [ ] POST `/api/items` - Can create item
- [ ] GET `/api/items/{id}` - Can retrieve item

## Performance Check

- [ ] Pages load within 2 seconds
- [ ] API responses within 500ms
- [ ] No memory leaks after 5 minutes of use
- [ ] No continuous console errors

## Troubleshooting Completed

Before launch, resolve any of these common issues:

- [ ] "DATABASE_URL not found" → Check `.env` file
- [ ] "Cannot connect to database" → PostgreSQL running?
- [ ] "CORS errors" → Check `FRONTEND_ORIGIN` in `.env`
- [ ] "Port already in use" → Kill process or use different port
- [ ] "Module not found" → Reinstall dependencies
- [ ] "API 404" → Check endpoint URL and backend running

## Documentation Review

- [ ] Read `README.md` - Overview understood
- [ ] Read `SETUP_GUIDE.md` - Setup process clear
- [ ] API endpoints documented and tested
- [ ] Environment variables documented

## Ready to Launch! 🚀

Once all boxes are checked:

1. Keep both terminal windows open
2. Visit http://localhost:3000
3. Create workflows and items
4. Execute steps and track progress
5. Have fun building! 🎉

---

## Getting Help

If issues persist:

1. Check error messages in console
2. Verify all `.env` values are correct
3. Ensure all services are running
4. Review logs in terminal windows
5. Check firewall settings
6. Try using different ports if needed

Good luck! 🍀
