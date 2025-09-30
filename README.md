# Adronaut Web Application

The frontend for Adronaut - a sci-fi themed marketing mission control system built with Next.js, TypeScript, and Tailwind CSS.

## Features

- 🚀 **Workspace**: Upload data artifacts and view AI-generated analysis snapshots
- 🎯 **Strategy**: Mission control interface for HITL strategy management
- 📊 **Results**: Telemetry dashboard with real-time campaign metrics
- 🎨 **Sci-Fi UI**: Dark theme with neon accents, glowing effects, and holographic panels
- 🤖 **AI Integration**: AutoGen agents for feature extraction and insights

## Tech Stack

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type safety and developer experience
- **Tailwind CSS** - Utility-first CSS framework
- **Supabase** - Database and file storage
- **Lucide React** - Icon library
- **React Dropzone** - File upload functionality

## Prerequisites

- Node.js 18+ and npm
- Supabase account and project
- OpenAI API key

## Environment Setup

1. **Copy environment file**:
   ```bash
   cp .env.example .env.local
   ```

2. **Configure environment variables**:
   ```env
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

   # AutoGen Service
   NEXT_PUBLIC_AUTOGEN_SERVICE_URL=http://localhost:8000

   # OpenAI (for client-side LLM calls if needed)
   NEXT_PUBLIC_OPENAI_API_KEY=your_openai_api_key
   ```

## Database Setup

1. **Create Supabase project** at [supabase.com](https://supabase.com)

2. **Run the database schema**:
   - Go to your Supabase project dashboard
   - Navigate to SQL Editor
   - Copy and execute the schema from `/docs/supabase-schema.sql`

3. **Configure storage bucket**:
   - Go to Storage in your Supabase dashboard
   - The `artifacts` bucket should be created automatically by the schema
   - Verify storage policies are set up correctly

## Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start development server**:
   ```bash
   npm run dev
   ```

3. **Open the application**:
   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Workspace page (home)
│   ├── strategy/          # Strategy management
│   ├── results/           # Results dashboard
│   ├── layout.tsx         # Root layout
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── layout/           # Layout components
│   ├── workspace/        # Workspace-specific components
│   ├── strategy/         # Strategy-specific components
│   └── results/          # Results-specific components
└── lib/                  # Utilities and configurations
    ├── supabase.ts       # Supabase client
    └── database.types.ts # TypeScript types
```

## UI Components

### Core Components

- **Button**: Sci-fi styled buttons with glow effects
- **Card**: Holographic panel containers with variants
- **Badge**: Status indicators with neon colors
- **Dialog**: Floating holo-panel modals
- **Progress**: Animated progress bars

### Design System

The application uses a custom sci-fi design system built on Tailwind CSS:

- **Colors**: Space grays, electric indigo, neon accents
- **Typography**: Inter (body), Orbitron (headings), JetBrains Mono (code)
- **Effects**: Glowing borders, holographic panels, scan lines
- **Animations**: Pulse effects, floating elements, streaming animations

## API Integration

The web app integrates with the AutoGen service running on port 8000:

- **File Upload**: `POST /upload`
- **Start Workflow**: `POST /autogen/run/start`
- **Continue Workflow**: `POST /autogen/run/continue`
- **Project Status**: `GET /project/{project_id}/status`
- **Real-time Events**: `GET /events/{run_id}` (SSE)

## Deployment

### Vercel (Recommended)

1. **Connect repository** to Vercel
2. **Configure environment variables** in Vercel dashboard
3. **Deploy** - automatic deployments on git push

### Self-hosted

1. **Build the application**:
   ```bash
   npm run build
   ```

2. **Start production server**:
   ```bash
   npm start
   ```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request
