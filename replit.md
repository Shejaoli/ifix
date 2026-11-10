# IFIX

## Overview

IFIX is a premium e-commerce website for an electronics retail shop based in Kigali, Rwanda. The platform enables customers to browse and purchase refurbished and new electronics (iPhones, Samsung phones, laptops, audio equipment, accessories) with WhatsApp integration for order confirmation. The site features a customer-facing storefront with product catalog, search, and filtering, plus a secure admin dashboard for product and order management.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript, bundled via Vite
- **Routing**: Wouter (lightweight client-side routing)
- **State Management**: TanStack React Query for server state caching and synchronization
- **Styling**: Tailwind CSS with CSS variables for theming (dark/light mode support)
- **UI Components**: shadcn/ui component library (Radix UI primitives with custom styling)
- **Animations**: Framer Motion for page transitions and micro-interactions
- **Forms**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **API Design**: RESTful JSON API with typed routes defined in `shared/routes.ts`
- **Session Management**: Express-session with MemoryStore (configurable for production with connect-pg-simple)
- **Authentication**: Custom password hashing using Node.js crypto (scrypt), session-based admin auth

### Data Layer
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Location**: `shared/schema.ts` contains all table definitions
- **Migrations**: Drizzle Kit for schema migrations (`drizzle-kit push`)
- **Validation**: Drizzle-Zod for generating Zod schemas from database tables

### Project Structure
```
├── client/           # Frontend React application
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Route-level page components
│   │   ├── hooks/        # Custom React hooks
│   │   └── lib/          # Utilities and query client
├── server/           # Backend Express application
│   ├── routes.ts     # API route handlers
│   ├── storage.ts    # Database access layer
│   └── auth.ts       # Authentication utilities
├── shared/           # Shared code between client/server
│   ├── schema.ts     # Database schema definitions
│   └── routes.ts     # API route type definitions
```

### Key Design Patterns
- **Shared Types**: Database schemas and API contracts are defined in `shared/` and imported by both client and server
- **Storage Interface**: `IStorage` interface in `server/storage.ts` abstracts database operations for testability
- **Theme System**: CSS variables with Tailwind's `dark:` variant, persisted to localStorage with system preference fallback

## External Dependencies

### Database
- **PostgreSQL**: Primary database, connection via `DATABASE_URL` environment variable
- **Drizzle ORM**: Type-safe database queries and migrations

### Third-Party Services
- **WhatsApp Business**: Order confirmation and customer support via `wa.me` URL scheme (no API integration, direct linking)

### Key NPM Packages
- `@tanstack/react-query`: Server state management
- `drizzle-orm` / `drizzle-kit`: Database ORM and migrations
- `express-session` / `memorystore`: Session management
- `zod`: Runtime validation for API inputs and forms
- `framer-motion`: Animation library
- `wouter`: Lightweight React router
- `lucide-react`: Icon library

### Environment Variables Required
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Secret key for session encryption (optional, has default)