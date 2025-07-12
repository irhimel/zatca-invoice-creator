# 🚀 Deployment Guide

## Quick Start

```bash
npm install
npm run dev          # Development
npm run build        # Production build
npm run dist         # Create installers
```

## Environment Setup

Create `.env`:

```env
AZURE_SQL_SERVER=your-server.database.windows.net
AZURE_SQL_DATABASE=your-database
AZURE_SQL_USERNAME=your-username
AZURE_SQL_PASSWORD=your-password
ZATCA_ENVIRONMENT=sandbox
```

## Building

### All Platforms

```bash
npm run dist:all
```

### Specific Platforms

```bash
npm run dist:win     # Windows
npm run dist:mac     # macOS
npm run dist:linux   # Linux
```

## Testing

```bash
npm run lint         # Code quality
npm run type-check   # TypeScript validation
```

Follow `QA_TESTING_GUIDE.md` for manual testing procedures.
