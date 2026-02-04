# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BookScan is a personal library management system with ISBN barcode scanning, cover image OCR, and semantic vector search. It has two separate frontend implementations and a shared Docker infrastructure.

## Architecture

The system uses a unified stack:

- **Server**: Express.js API with Supertokens auth, direct PostgreSQL (with pgvector), Redis caching, Ollama embeddings, Elasticsearch hybrid search, and a separate OCR worker service. Orchestrated via `docker-compose.yml`.
- **Frontend (library-scanster)**: Vite + React + Shadcn/ui + TailwindCSS. Uses Supertokens for auth and the Express server as the backend.
- **Image CDN**: Bunny.net CDN for cover images and book photos.

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
docker compose up --build       # start all services
docker compose logs -f backend  # view backend logs
```

**Note**: Always use `docker compose` (space, not hyphen) for Docker commands.

## Database Migrations

Migration SQL files live in `library-scanster/src/db/migrations/` with sequential numbering (`001_`, `002_`, etc.).

To run a migration against the local Docker PostgreSQL:
```bash
docker exec bookscan-postgres psql -U bookuser -d bookscan -f /dev/stdin < library-scanster/src/db/migrations/NNN_name.sql
```

Or run raw SQL directly:
```bash
docker exec bookscan-postgres psql -U bookuser -d bookscan -c "SQL_HERE"
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
