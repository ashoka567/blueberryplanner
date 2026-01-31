# Blueberry Planner - Family Organizer

## Overview

Blueberry Planner is a comprehensive family organization application for managing medications, chores, groceries, and calendar events for multi-tenant households. The application supports role-based access with Guardian and Member roles, featuring gamification through chore points and leaderboards.

The current implementation is a React/Express full-stack application with a PostgreSQL database, designed to run on Replit. There are also stub directories for an Angular frontend and Spring Boot backend (originally planned architecture), but the active implementation uses the React/Express stack.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state
- **Styling**: Tailwind CSS with shadcn/ui component library
- **Build Tool**: Vite
- **Key Pages**: Dashboard, Calendar, Medications, Chores, Groceries

The frontend lives in `client/src/` with a standard structure:
- `components/` - Reusable UI components (heavy use of Radix UI primitives via shadcn)
- `pages/` - Route-level components
- `lib/` - Utilities, types, and mock data
- `hooks/` - Custom React hooks

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database ORM**: Drizzle ORM with PostgreSQL
- **API Pattern**: RESTful endpoints prefixed with `/api`
- **Session/Auth**: Prepared for session-based auth with connect-pg-simple

The backend lives in `server/`:
- `index.ts` - Express app setup and middleware
- `routes.ts` - API route registration
- `storage.ts` - Data access layer (currently in-memory, ready for database)
- `vite.ts` - Vite dev server integration for HMR

### Database Layer
- **ORM**: Drizzle ORM
- **Database**: PostgreSQL (configured via DATABASE_URL environment variable)
- **Schema**: Defined in `shared/schema.ts` using Drizzle's table definitions
- **Migrations**: Managed via `drizzle-kit push` command

### Shared Code
The `shared/` directory contains code shared between frontend and backend:
- `schema.ts` - Database schema definitions and Zod validation schemas

### Build System
- Development: Vite dev server with HMR for frontend, tsx for backend
- Production: esbuild bundles server, Vite builds client to `dist/`

## External Dependencies

### Database
- **PostgreSQL**: Primary database, connection via `DATABASE_URL` environment variable
- **Drizzle ORM**: Type-safe database access with schema defined in TypeScript

### UI Component Libraries
- **Radix UI**: Accessible, unstyled primitives for dialogs, dropdowns, tooltips, etc.
- **shadcn/ui**: Pre-styled component collection built on Radix
- **Lucide React**: Icon library

### Key NPM Packages
- `@tanstack/react-query` - Server state management
- `date-fns` - Date manipulation utilities
- `zod` - Runtime schema validation
- `drizzle-zod` - Bridge between Drizzle schemas and Zod validation
- `wouter` - Lightweight routing

### Replit-Specific Integrations
- `@replit/vite-plugin-runtime-error-modal` - Error overlay in development
- `@replit/vite-plugin-cartographer` - Dev tooling (development only)
- Custom `vite-plugin-meta-images` - OpenGraph image handling for Replit deployments

### Fonts
- Google Fonts: Outfit (display), Inter (body text)