# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BookScan is a personal library management system with ISBN barcode scanning, cover image OCR, and semantic vector search. It has two separate frontend implementations and a shared Docker infrastructure.

## Architecture

There are two distinct stacks that share a database concept but use different auth/data layers:

1. **Server + Client (legacy)**: Express.js API + CRA React app. Uses Supertokens auth, direct PostgreSQL (with pgvector), Redis caching, Ollama embeddings, and a separate OCR worker service. Orchestrated via `docker-compose.yml`.

2. **library-scanster (active frontend)**: Vite + React + Shadcn/ui + TailwindCSS. Uses Clerk for auth and Supabase as the backend (not the Express server). This is the more actively developed frontend.

These two stacks do **not** share authentication or data access—the server uses Supertokens while library-scanster uses Clerk + Supabase.

## Build and Dev Commands

### Server (`/server`)
```bash
npm run dev          # nodemon dev server
npm run build        # tsc compile
npm start            # run compiled output
npm test             # jest
```

### Library-Scanster (`/library-scanster`)
```bash
npm run dev          # vite dev server
npm run build        # vite build (production)
npm run build:dev    # vite build (development mode)
npm run lint         # eslint
npm run preview      # preview production build
```

### OCR Service (`/ocr-service`)
```bash
npm run build        # tsc compile
npm start            # run compiled output
npm run dev          # ts-node dev
```

### Docker (full stack)
```bash
docker-compose up --build       # start all services
docker-compose logs -f backend  # view backend logs
```

## Key Data Flow

- **ISBN scan**: Client → API → check DB → (miss) → OpenLibrary API → Ollama embedding → store in PostgreSQL with pgvector
- **Image scan**: Client → API → Tesseract OCR → extract ISBN or text → vector similarity search via pgvector
- Books are shared across users; `user_books` is a junction table linking users to their collections

## Git Conventions

Use conventional commit prefixes: `fix:`, `feat:`, `perf:`, `docs:`, `style:`, `refactor:`, `test:`, `chore:`. Lowercase, concise summary line.

## Code Style

- TypeScript throughout, functional/declarative patterns (no classes)
- Descriptive variable names with auxiliary verbs (`isLoading`, `hasError`)
- library-scanster uses Shadcn/ui components, TailwindCSS, React Hook Form + Zod validation, TanStack Query for data fetching
