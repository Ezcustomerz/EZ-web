# EZ-Web

A full-stack web application with FastAPI backend and React frontend.

## Project Structure

```
EZ-web/
├── backend/           # FastAPI backend with Supabase
├── frontend/          # React + Vite frontend
└── package.json       # Root package.json with npm scripts
```

## Development Scripts

First, install the root dependencies:
```bash
npm install
```

Then you can run:

```bash
# Start only the backend server
npm run start:backend

# Start only the frontend server
npm run start:frontend

# Start both servers simultaneously
npm run start:both
```

## Setup Instructions

### First-time Setup

1. **Install root dependencies** (for npm scripts):
   ```bash
   npm install
   ```

2. **Setup backend**:
   ```bash
   npm run install:backend
   ```

3. **Setup frontend**:
   ```bash
   npm run install:frontend
   ```

   Or install everything at once:
   ```bash
   npm run install:all
   ```

4. **Configure environment variables**:
   - Backend: Create `backend/.env` with your configuration
   - Frontend: Create `frontend/.env` with your Supabase credentials

### Running the Application

- **Backend only**: `npm run start:backend`
- **Frontend only**: `npm run start:frontend`
- **Both servers**: `npm run start:both`

## API Endpoints

- Backend API: `http://localhost:8000`
- Frontend: `http://localhost:5173`
- API Documentation: `http://localhost:8000/docs`

## Technology Stack

- **Backend**: FastAPI, Supabase, Python
- **Frontend**: React, Vite, TypeScript, Material-UI
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth