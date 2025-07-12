<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# Invoice Creator App - Development Guidelines

This is a cross-platform desktop application built with Electron, React, TypeScript, and Tailwind CSS for creating and managing invoices.

## Tech Stack

- **Desktop Framework**: Electron for cross-platform desktop app
- **Frontend**: React 19 with TypeScript
- **Styling**: Tailwind CSS
- **Build Tool**: Vite
- **PDF Generation**: jsPDF + html2canvas
- **Icons**: Lucide React
- **Date Handling**: date-fns
- **Unique IDs**: uuid

## Project Structure

- `public/electron.js` - Main Electron process
- `public/preload.js` - Secure IPC bridge
- `src/types/` - TypeScript type definitions
- `src/context/` - React context for state management
- `src/components/` - React components

## Key Features

- Create and edit invoices with itemized billing
- Client management
- Tax calculations
- PDF export functionality
- Save/load invoice data
- Cross-platform (Windows & Mac) compatibility

## Development Notes

- Use TypeScript for all new code
- Follow React functional component patterns
- Use Tailwind CSS for styling
- Implement proper error handling
- Ensure responsive design
- Maintain secure Electron practices (no nodeIntegration, use preload scripts)

## Code Style

- Use ES modules (type: "module" in package.json)
- Prefer const assertions and proper typing
- Use semantic HTML and accessible design patterns
- Follow React best practices (hooks, context, etc.)
