# Overview

This is CroatianLearn, a Croatian language learning application built in the style of Duolingo. It features an interactive lesson system with multiple exercise types including translation, multiple-choice, listening, speaking, and word-bank exercises. The app includes user progress tracking, gamification elements (XP, streaks, gems, hearts), and AI-generated personalized lessons using OpenAI's GPT-4o model.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The frontend is built with **React 18** and **TypeScript**, using **Vite** as the build tool. The application follows a single-page application (SPA) pattern with client-side routing via **Wouter**. The UI is styled using **Tailwind CSS** with custom Duolingo-inspired design tokens and **shadcn/ui** components for consistent design patterns.

Key architectural decisions:
- **State Management**: Uses React Query (TanStack Query) for server state management and caching
- **Component Structure**: Organized into reusable UI components following atomic design principles
- **Styling**: Custom CSS variables for theming with Duolingo brand colors and fonts
- **Responsive Design**: Mobile-first approach with responsive layouts

## Backend Architecture
The backend is an **Express.js** server written in TypeScript using ES modules. It follows a RESTful API design pattern with clear separation of concerns.

Key architectural decisions:
- **Storage Layer**: Abstract storage interface with in-memory implementation (easily replaceable with database)
- **Route Organization**: Modular route registration system with centralized error handling
- **Development Setup**: Hot reloading via Vite integration in development mode
- **Build Process**: ESBuild for production bundling with proper external package handling

## Data Storage Solutions
The application uses **Drizzle ORM** with **PostgreSQL** as the primary database solution. The database schema is defined using Drizzle's type-safe schema definition.

Key architectural decisions:
- **Schema Design**: Relational model with users, lessons, exercises, user progress, and AI lessons
- **Type Safety**: Full TypeScript integration with Drizzle ORM and Zod validation
- **Migrations**: Drizzle Kit for database schema migrations
- **Connection**: Neon Database serverless PostgreSQL for cloud deployment

Database tables include:
- `users`: User profiles with gamification stats (XP, streaks, hearts, gems)
- `lessons`: Structured lesson content organized by units
- `exercises`: Individual exercises with various types and metadata
- `user_progress`: Progress tracking for completed exercises
- `ai_lessons`: AI-generated personalized lessons

## External Dependencies

### AI Integration
- **OpenAI GPT-4o**: For generating personalized lessons and providing pronunciation feedback
- **Web Speech API**: For speech recognition and text-to-speech functionality
- **AI Services**: Lesson generation based on user progress and preferences

### Database and Infrastructure  
- **Neon Database**: Serverless PostgreSQL hosting
- **Drizzle ORM**: Type-safe database ORM with PostgreSQL dialect
- **Connect PG Simple**: PostgreSQL session store for Express sessions

### UI and Styling
- **Radix UI**: Accessible component primitives for complex UI components
- **Tailwind CSS**: Utility-first CSS framework with custom design tokens
- **shadcn/ui**: Pre-built component library with Radix UI integration
- **Lucide React**: Icon library for consistent iconography

### Development and Build Tools
- **Vite**: Fast development server and build tool with React plugin
- **TypeScript**: Static type checking with strict configuration
- **ESBuild**: Fast JavaScript bundler for production builds
- **Replit Integration**: Development environment integration with error overlays and cartographer