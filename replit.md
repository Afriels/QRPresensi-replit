# Overview

This is a modern student attendance management system built with QR code technology. The application allows schools to efficiently track student attendance by generating unique QR codes for each student that can be scanned by teachers. The system provides comprehensive attendance tracking, reporting, and student management capabilities.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The frontend is built as a React Single Page Application (SPA) using modern tooling:
- **React 18** with TypeScript for type safety and developer experience
- **Vite** as the build tool for fast development and optimized production builds
- **Wouter** for lightweight client-side routing instead of React Router
- **TanStack Query** for server state management and API caching
- **Tailwind CSS** with **shadcn/ui** component library for consistent, accessible UI components
- **React Hook Form** with Zod validation for form handling

## Backend Architecture
The backend follows a RESTful API design pattern:
- **Express.js** server with TypeScript for the API layer
- **Modular route structure** with separate route handlers in `server/routes.ts`
- **Storage abstraction layer** in `server/storage.ts` providing a clean interface for data operations
- **Session-based authentication** with role-based access control (admin vs teacher)
- **Middleware for logging** and error handling

## Database Design
The system uses PostgreSQL with Drizzle ORM for type-safe database operations:
- **Students table**: Core student information with unique NIS (student ID) and QR codes
- **Users table**: System users (admin/teacher) with bcrypt password hashing
- **Attendance records table**: Timestamped attendance entries with status tracking
- **Enum types**: For attendance status (present, late, sick, permission, absent) and user roles

## Authentication & Authorization
- **Password-based authentication** with bcrypt hashing
- **Session management** for maintaining user state
- **Role-based access control**: Admin users can manage students, teachers can only record attendance
- **Protected routes** requiring authentication on both client and server

## QR Code System
- **Unique QR code generation** for each student using the `qrcode` library
- **QR code scanning** using html5-qrcode for camera-based scanning
- **Manual entry fallback** for cases where scanning isn't available
- **QR codes link to student records** for quick attendance marking

## State Management
- **TanStack Query** handles all server state with intelligent caching
- **React state** for local UI state and form management
- **Custom hooks** for common operations like authentication and data fetching

## UI/UX Design
- **Responsive design** that works on mobile and desktop devices
- **Accessibility-first** approach using Radix UI primitives
- **Dark/light mode support** through CSS custom properties
- **Loading states and error handling** for better user experience

# External Dependencies

## Database
- **Neon PostgreSQL** serverless database for data persistence
- **Drizzle ORM** for type-safe database queries and migrations
- **connect-pg-simple** for PostgreSQL session storage

## UI Components
- **Radix UI** provides accessible, unstyled component primitives
- **Tailwind CSS** for utility-first styling
- **Lucide React** for consistent iconography
- **shadcn/ui** for pre-built component patterns

## QR Code Technology
- **qrcode** library for generating QR code images
- **html5-qrcode** for camera-based QR code scanning in browsers

## Development Tools
- **TypeScript** for type safety across the entire stack
- **Vite** for fast development builds and HMR
- **ESBuild** for production server bundling
- **PostCSS** with Autoprefixer for CSS processing

## Authentication
- **bcrypt** for secure password hashing
- **Express sessions** for user session management

## Data Validation
- **Zod** for runtime schema validation on both client and server
- **@hookform/resolvers** for integrating Zod with React Hook Form

## Production Deployment
- **Node.js** runtime environment
- **Express.js** serves both API and static files in production
- **Environment-based configuration** for database connections and API keys