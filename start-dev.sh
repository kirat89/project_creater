#!/bin/bash
# Start both backend and frontend in development mode

echo "🚀 Starting Create-Anything Development Environment"
echo "=================================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Ensure script runs from its own directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
pushd "$SCRIPT_DIR" > /dev/null

# Check apps folder exists
if [ ! -d "apps" ]; then
  echo -e "${RED}Error: apps directory not found in $SCRIPT_DIR${NC}"
  echo "Please move this script to the project root and run again"
  popd > /dev/null
  exit 1
fi

# Start backend
echo -e "${YELLOW}Starting backend...${NC}"
cd apps/backend || { echo "Failed to change directory to apps/backend"; popd > /dev/null; exit 1; }

# Check if virtual environment exists
if [ ! -d "venv" ]; then
  echo "Creating virtual environment..."
  python -m venv venv
fi

# Activate virtual environment
source venv/bin/activate 2>/dev/null || . venv/Scripts/activate 2>/dev/null

# Install dependencies if needed
if ! python -m pip show fastapi > /dev/null 2>&1; then
  echo "Installing dependencies..."
  pip install -r requirements.txt
fi

# Start the backend
echo -e "${GREEN}Backend starting on http://localhost:8000${NC}"
python -m uvicorn main:app --reload &
BACKEND_PID=$!

# Return to script root
cd ../.. || echo "Warning: failed to return to root from backend dir"

# Wait a moment for backend to start
sleep 3

# Start frontend
echo -e "${YELLOW}Starting frontend...${NC}"
cd apps/web

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

echo -e "${GREEN}Frontend starting on http://localhost:3000${NC}"
npm run dev &
FRONTEND_PID=$!

# Function to cleanup on exit
cleanup() {
  echo -e "\n${YELLOW}Shutting down services...${NC}"
  kill $BACKEND_PID 2>/dev/null
  kill $FRONTEND_PID 2>/dev/null
  echo -e "${GREEN}Services stopped${NC}"
}

# Trap exit signals
trap cleanup EXIT INT TERM

echo ""
echo -e "${GREEN}✅ Services started successfully!${NC}"
echo ""
echo "📍 Backend API: http://localhost:8000"
echo "📍 API Docs: http://localhost:8000/docs"
echo "📍 Frontend: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Return to original directory when exiting
popd > /dev/null

# Wait for background jobs
wait
