# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **React-based audio file management system** that allows users to upload, manage, and play audio files. The application uses **Supabase** as the backend service for authentication, database operations, and file storage. This is a standard **Create React App** application located at the repository root.

**Status:** ✅ Completed - All core features implemented

## Development Commands

### Core Commands
All commands should be run from the repository root:

```bash
# Start development server
npm start

# Build for production
npm run build

# Run tests
npm test

# Eject (not recommended)
npm run eject
```

### Testing
- **Single test file:** `npm test -- --testNamePattern="ComponentName"`
- **Watch mode:** `npm test` (runs in interactive watch mode)
- **Coverage report:** `npm test -- --coverage --watchAll=false`

## Architecture

### Project Structure
```
/
├── src/                     # Source code
│   ├── components/          # Reusable UI components
│   │   ├── AudioPlayer.js   # Audio playback controls
│   │   ├── FileUpload.js    # Drag-and-drop upload component
│   │   └── ProtectedRoute.js # Route guard for authenticated routes
│   ├── context/             # React Context providers
│   │   └── AuthContext.js   # User authentication state management
│   ├── pages/               # Page-level components
│   │   ├── Login.js         # User login page
│   │   ├── Register.js      # User registration page
│   │   ├── FileList.js      # Main file management interface
│   │   ├── ResetPassword.js # Password reset request
│   │   ├── UpdatePassword.js # Password update form
│   │   └── DevTest.js       # Development testing page
│   └── utils/               # Utility functions
│       └── supabase.js      # Supabase client configuration
├── public/                  # Static assets
├── package.json             # Dependencies and scripts
└── .env                     # Environment variables
```

### High-Level Architecture

1. **Authentication Flow** (`src/context/AuthContext.js:14-112`)
   - Uses Supabase Auth for user management
   - Supports email/password and Google OAuth
   - Provides session management and auth state changes
   - Registered users are redirected to `/`, unauthenticated users see login/register

2. **File Storage System**
   - **Database:** `audio_files` table stores metadata (file name, size, duration, user_id)
   - **Storage:** Private `audio-files` bucket in Supabase stores actual audio files
   - **RLS Policies:** Row-level security ensures users only access their own files

3. **Main Application Flow** (`src/App.js:25-57`)
   - Material-UI theme provider wraps the entire app
   - AuthProvider manages user authentication state
   - Router with protected routes guards main application
   - Default route `/` shows FileList (protected by ProtectedRoute)

4. **File Management** (`src/pages/FileList.js`)
   - Displays all user files in a Material-UI DataGrid
   - FileUpload component allows drag-and-drop uploads
   - Users can rename/delete their own files
   - Search functionality for filtering files

### Supabase Configuration

**Database Table:** `audio_files`
```sql
audio_files (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_size bigint NOT NULL,
  duration float,
  mime_type text NOT NULL,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
```

**Storage Bucket:** `audio-files` (private)

**RLS Policies:** Enabled on both database table and storage bucket, filtering by `auth.uid()`

## Key Components

### Authentication (`src/context/AuthContext.js:14-112`)
- Manages user session and authentication state
- Provides `signIn`, `signUp`, `signOut`, `signInWithGoogle`, `resetPassword`, and `updatePassword` methods
- Listens to Supabase auth state changes

### File Upload (`src/components/FileUpload.js`)
- Supports drag-and-drop and file picker
- Validates file types (MP3, WAV, AAC, FLAC, OGG) and size (50MB limit)
- Shows upload progress
- Integrates with Supabase storage for file uploads

### File List (`src/pages/FileList.js`)
- Main dashboard after login
- Material-UI DataGrid displays all user's audio files
- Includes search, rename, and delete functionality
- Integrates AudioPlayer for playing selected files

### Audio Player (`src/components/AudioPlayer.js`)
- HTML5 audio element with custom controls
- Play/pause, seek, volume control
- Displays current time and total duration

## Environment Configuration

Environment variables are in `.env` at the repository root:
- `REACT_APP_SUPABASE_URL`: Supabase project URL
- `REACT_APP_SUPABASE_ANON_KEY`: Supabase anonymous key (safe for client-side)

**Note:** The `service_role` key should never be exposed in the frontend.

## Routes

- `/` - FileList (protected)
- `/login` - Login page
- `/register` - Registration page
- `/reset-password` - Password reset request
- `/update-password` - Password update form

## Deployment

**Platform:** Cloudflare Pages

**Configuration:**
- Build command: `npm run build`
- Build output: `build`
- Node version: Latest LTS
- **Important:** Project files are at the repository root (not in a subdirectory)

**Environment Variables in Cloudflare Pages:**
- `REACT_APP_SUPABASE_URL`
- `REACT_APP_SUPABASE_ANON_KEY`

## Development Notes

### Testing
- Uses `@testing-library/react` and `@testing-library/jest-dom`
- Test files: `*.test.js`
- Run tests with: `npm test`

### Code Quality
- ESLint configured via `eslintConfig` in package.json
- Extends `react-app` and `react-app/jest` configurations
- Material-UI components for consistent UI

### Key Dependencies
- `react` and `react-dom` (v19.2.0)
- `@supabase/supabase-js` (v2.78.0) - Backend service
- `@mui/material` and `@mui/icons-material` (v7.3.4) - UI components
- `react-router-dom` (v7.9.5) - Client-side routing
- `react-scripts` (v5.0.1) - Create React App tooling

## Important Documentation Files

- `Supabase配置说明.md` - Supabase setup and configuration
- `开发任务文档.md` - Development task tracking (Chinese)
- `需求文档.md` - Project requirements and features (Chinese)

## Known Limitations

- No batch operations for files (delete multiple files at once)
- No playlist functionality (next/previous track)
- No file type filtering or sorting in the UI
- No pagination for large file lists

## Troubleshooting

**Supabase Auth Issues:**
- Check Site URL in Supabase Dashboard → Authentication → Settings
- Ensure environment variables are correctly set
- Restart dev server after changing `.env`

**Build Issues:**
- Run `npm run build` to test production build locally
- Check for console errors and warnings
- Verify all environment variables are present

**File Upload Issues:**
- Check file size (< 50MB)
- Verify file type is supported
- Ensure user is authenticated
- Check browser console for network errors

## Supabase Setup Requirements

The following must be configured in your Supabase project:

1. **Database Table:** Create `audio_files` table with RLS enabled
2. **Storage Bucket:** Create `audio-files` bucket (private)
3. **RLS Policies:** Apply to both database and storage for user data isolation
4. **Google OAuth (optional):** Configure if using Google login

See `Supabase配置说明.md` for detailed SQL policies and configuration steps.
