# Kompanion Web

Frontend for Kompanion - Strava-powered gamification app.

## Tech Stack

- React 18 + TypeScript
- Vite
- React Router v6
- Tailwind CSS
- Zustand (State Management)

## Project Structure

```
src/
├── components/       # UI components
│   ├── ui/          # Reusable UI components
│   └── layout/      # Layout components
├── features/        # Feature-specific components
├── pages/           # Page components
├── hooks/           # Custom React hooks
├── utils/           # Utility functions
├── api/             # API client and services
├── store/           # Zustand stores
├── types/           # TypeScript types
└── assets/          # Static assets
```

## Getting Started

### Prerequisites

- Node.js >= 20
- Backend API running on port 3000

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

### Building

```bash
npm run build
npm run preview
```

## Pages

- `/login` - Strava OAuth login
- `/dashboard` - Main dashboard with activities and quests
- `/achievements` - View and track achievements
- `/quests` - Weekly/monthly quests
- `/stats` - Detailed statistics
- `/components` - UI component showcase

## Features

- **Glassmorphism Design**: Modern glass effect UI
- **Mobile-First**: Optimized for mobile devices
- **Type-Safe**: Full TypeScript coverage
- **Real-time Sync**: Sync activities from Strava
- **Gamification**: Achievements, quests, and XP system

## Code Quality

```bash
npm run lint      # Run ESLint
npm run format    # Format with Prettier
npm run typecheck # TypeScript type checking
```

## Design System

### Colors
- Primary: Strava Orange (#FF4B00)
- Background: Gradient from gray-50 to gray-100

### Components
- Glass cards with backdrop blur
- Rounded corners (2xl)
- Smooth transitions and hover effects
- Bottom navigation for mobile

### Typography
- Font: Inter
- Weights: 400 (regular), 500 (medium), 600 (semibold), 700 (bold), 800 (extrabold)
