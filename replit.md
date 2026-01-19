# SteamLead - Game Studio Lead Management Platform

## Overview

SteamLead is a lead management and CRM application designed for B2B sales targeting game development studios. The platform integrates with the Steam API to discover games, track studio metrics, and manage outreach pipelines. Users can search for games, view real-time player statistics, and organize leads through a Kanban-style pipeline interface.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight alternative to React Router)
- **State Management**: TanStack Query (React Query) for server state with automatic caching
- **Styling**: Tailwind CSS with shadcn/ui component library (New York style variant)
- **Animations**: Framer Motion for page transitions and interactive elements
- **Build Tool**: Vite with hot module replacement

The frontend follows a page-based structure with shared layout components. The Sidebar component provides navigation and uses React Context for collapse state management. Custom hooks abstract API interactions (`use-leads`, `use-steam`, `use-auth`).

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **API Design**: REST endpoints defined in `shared/routes.ts` with Zod validation schemas
- **Database**: PostgreSQL with Drizzle ORM
- **Session Management**: express-session with PostgreSQL session store (connect-pg-simple)
- **Authentication**: Replit Auth integration using OpenID Connect

The server uses a modular structure with routes registered in `server/routes.ts` and database operations handled through a storage abstraction layer in `server/storage.ts`.

### Data Layer
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Location**: `shared/schema.ts` for shared types, `shared/models/auth.ts` for auth tables
- **Migrations**: Drizzle Kit with `db:push` command for schema synchronization
- **Validation**: Zod schemas generated from Drizzle schemas using drizzle-zod

### Shared Code Architecture
The `shared/` directory contains code used by both frontend and backend:
- `schema.ts`: Database table definitions and TypeScript types
- `routes.ts`: API route definitions with input/output schemas
- `models/auth.ts`: Authentication-related table schemas

### Build System
- **Development**: Vite dev server with Express backend running concurrently
- **Production**: esbuild bundles the server, Vite builds the client to `dist/public`
- **TypeScript**: Strict mode enabled with path aliases (`@/` for client, `@shared/` for shared)

## External Dependencies

### Database
- PostgreSQL database (required, connection via `DATABASE_URL` environment variable)
- Session storage table (`sessions`) managed by connect-pg-simple
- User and leads tables managed by Drizzle ORM

### Authentication
- Replit Auth (OpenID Connect) for user authentication
- Session secret required via `SESSION_SECRET` environment variable
- OIDC discovery URL defaults to `https://replit.com/oidc`

### Third-Party APIs
- Steam API integration for game search and metrics (proxied through backend to avoid CORS and protect API keys)
- API endpoints for search, game details, and top games by player count

### UI Dependencies
- Radix UI primitives for accessible component foundations
- Lucide React for iconography
- recharts for data visualization (listed in requirements)
- date-fns for date formatting