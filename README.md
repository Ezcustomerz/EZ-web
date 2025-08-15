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
   
   Create a `.env` file in the root directory with:
   ```bash
   # Frontend Configuration
   VITE_FRONTEND_URL=https://ez-web-iota.vercel.app  # Your production frontend URL
   VITE_API_BASE_URL=https://your-backend-api.com    # Your production backend URL
   
   # Supabase Configuration  
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   
   # Backend Configuration (for Supabase config.toml)
   FRONTEND_URL=https://ez-web-iota.vercel.app       # Used by Supabase for OAuth redirects
   
   # Development Project Configuration
   DEV_PROJECT_REF=your_dev_project_ref
   DEV_DB_PASSWORD=your_dev_db_password
   ```
   
   **For local development**, you can omit `VITE_FRONTEND_URL` and `VITE_API_BASE_URL` - they will default to localhost URLs.

### Running the Application

- **Backend only**: `npm run start:backend`
- **Frontend only**: `npm run start:frontend`
- **Both servers**: `npm run start:both`

## API Endpoints

- Backend API: `http://localhost:8000`
- Frontend: `http://localhost:3000`
- API Documentation: `http://localhost:8000/docs`

## Technology Stack

- **Backend**: FastAPI, Supabase, Python
- **Frontend**: React, Vite, TypeScript, Material-UI
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth