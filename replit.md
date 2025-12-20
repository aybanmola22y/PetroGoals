# OKR Tracker Application

## Overview
An OKR (Objectives and Key Results) management website for tracking company-wide objectives, key results, initiatives, and check-ins. Built with Next.js 14, TypeScript, Tailwind CSS, and Supabase for data persistence.

## Project Architecture

### Tech Stack
- **Frontend**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS + shadcn/ui components
- **Database**: Supabase (PostgreSQL)
- **Charts**: Recharts
- **State Management**: In-memory store with Supabase sync

### Directory Structure
```
OKR-Tracker/
├── app/                    # Next.js App Router pages
│   ├── dashboard/          # Dashboard pages (overview, departments, settings)
│   ├── login/             # Authentication page
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Landing/home page
├── components/            # React components
│   ├── ui/                # shadcn/ui components (includes slider)
│   ├── okr-card.tsx       # OKR card with milestone stages display
│   ├── okr-dialog.tsx     # OKR create/edit dialog with target type
│   ├── checkin-dialog.tsx # Check-in dialog
│   ├── notification-bell.tsx # Notification system component
│   ├── sidebar.tsx        # Navigation sidebar with notifications
│   └── theme-*.tsx        # Theme components
├── lib/                   # Utilities and core logic
│   ├── store.ts           # Data store (Supabase integration + notifications)
│   ├── supabase.ts        # Supabase client configuration
│   └── utils.ts           # Helper functions
├── types/                 # TypeScript type definitions
│   └── okr.ts             # OKR types with milestone and notification support
├── hooks/                 # Custom React hooks
├── public/                # Static assets
├── supabase-schema.sql    # SQL schema for Supabase database
└── .env.local             # Environment variables (Supabase credentials)
```

## Setup Instructions

### 1. Supabase Configuration
1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the queries from `supabase-schema.sql`
3. Get your API credentials from **Settings > API**
4. Update `.env.local` with your credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   ```

### 2. Running the Application
```bash
cd OKR-Tracker
npm install
npm run dev
```
The app runs on `http://localhost:5000`

## Key Features
- **Dashboard Overview**: Real-time OKR progress tracking with charts
- **Total OKRs Card**: Shows total OKRs across all departments
- **Department Management**: Filter OKRs by department
- **Month Filter**: Filter overall progress by month
- **OKR CRUD**: Create, read, update, delete objectives
- **Target Types**: 
  - Quantitative: Traditional numeric target tracking
  - Milestone (System Development): 5-stage template with automatic progress calculation
- **Milestone Stages**: Requirements Gathering, Design, Develop, Testing, Deployment (20% each)
- **Green Progress Bar**: Progress bar turns green when >= 80% complete
- **Key Results Tracking**: Progress tracking with history
- **Initiatives**: Task management linked to OKRs
- **Check-ins**: Status updates on OKR progress
- **Notifications**: Deadline reminders for upcoming key result due dates
- **Current Date/Time**: Charts display real-time timestamps

## Database Schema
The application uses the following tables:
- `users` - User accounts
- `okrs` - Objectives
- `key_results` - Key results with target_type (quantitative/milestone)
- `milestone_stages` - Milestone stage progress for milestone-type key results
- `progress_history` - Progress tracking over time
- `initiatives` - Tasks linked to OKRs
- `comments` - Comments on initiatives
- `comment_attachments` - File attachments on comments
- `check_ins` - Status updates
- `check_in_key_result_updates` - Progress updates from check-ins
- `company_info` - Company mission, vision, values
- `notifications` - Deadline reminders and system notifications

## Demo Mode
When Supabase is not configured, the app runs in demo mode:
- **Demo Email**: demo@petro-okr.com
- **Demo Password**: demo123

Demo mode starts with an empty state (no OKRs) so you can create and test your own OKRs.

## Recent Changes
- **Dec 12, 2025**: 
  - Added Target Type feature to Key Results:
    - Quantitative: Traditional numeric progress tracking
    - Milestone (System Development): Auto-generates 5-stage template
  - Added Milestone Template with stages: Requirements Gathering, Design, Develop, Testing, Deployment
  - Milestone stages each have 20% weight and interactive progress sliders
  - Progress bar turns green when overall progress >= 80%
  - Added Total OKRs card to dashboard overview showing count across departments
  - Added Notification system for deadline reminders (7 days before due)
  - Notification bell in sidebar with unread count badge
  - Removed all mock OKR data (kept demo account for login)
  - Updated Supabase schema with milestone_stages and notifications tables
  
- **Dec 11, 2025**: 
  - Added initiative comment system with file attachment support
    - Supports PNG, JPG, Word (.doc/.docx), and PDF files
    - 10MB file size limit per attachment
    - Preview attachments with appropriate icons
  - Added demo mode with sample data when Supabase is not configured
  - Demo credentials displayed on login page for easy access
  - Removed Vite/Express dependencies, converted to pure Next.js
  - Removed all mock data from codebase
  - Added Supabase integration for data persistence
  - Created `.env.local` template for Supabase credentials
  - Created `supabase-schema.sql` with all database tables
  - Fixed OKR dialog scrolling issue
  - Added current date/time display to charts
  - Added month filter for overall progress section

## Departments
Operations, Sales & Marketing, HR, Finance, Accounting, Consultant, Review, HSSEQ, HSSE, Digital Solutions, Information Security, Admin

## User Preferences
Preferred communication style: Simple, everyday language.
