# Overview

FlowZen is a production-ready Kanban task management application with a unique zen-inspired aesthetic. The app features four interactive "spheres" that represent different stages of task workflow: Backlog (unlimited), Next Up (max 6), In Progress (max 3), and Completed (unlimited). The standout feature is the hyper-realistic liquid bubble animations rendered on Canvas at 60fps, creating a peaceful water garden atmosphere. Tasks are represented as colorful orbs that can be dragged between spheres with proper WIP (Work In Progress) limits enforced.

The application combines productivity with tranquility, offering optional zen audio effects via Web Audio API, responsive design for mobile and desktop, and accessibility features including ARIA labels and keyboard navigation. It's designed to be versatile for various workflows like project planning, trip organizing, or creative endeavors.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Vanilla JavaScript modular design** with separate files for distinct concerns (app.js as main controller, task-manager.js for business logic, drag-drop.js for interactions, canvas-animations.js for visual effects, audio-manager.js for sound)
- **Canvas-based animation system** using requestAnimationFrame for 60fps liquid bubble effects with realistic physics simulation
- **Event-driven architecture** with delegation patterns for dynamic content and separation of UI interactions from business logic
- **Responsive CSS design** with CSS Grid/Flexbox layout, mobile-first approach, and progressive enhancement
- **Accessibility-first approach** with ARIA labels, keyboard navigation support, and screen reader compatibility

## Backend Architecture
- **Firebase-as-a-Service approach** eliminating need for custom backend infrastructure
- **Local-first data strategy** with localStorage as primary storage and Firebase as sync layer
- **Real-time synchronization** via Firebase Realtime Database for cross-device task updates
- **Offline-first design** ensuring full functionality without internet connection

## Authentication & Authorization
- **Firebase Authentication** with email/password and guest mode support
- **Progressive authentication** allowing trial usage before requiring account creation
- **User session management** with automatic re-authentication and graceful fallbacks

## Data Management
- **Task state management** with in-memory objects synchronized to localStorage and Firebase
- **Conflict resolution** using Firebase's built-in real-time sync capabilities
- **Data validation** with client-side input sanitization and error handling
- **WIP limit enforcement** built into the drag-drop system architecture

# External Dependencies

## Firebase Services
- **Firebase App SDK v10.8.0** - Core Firebase functionality
- **Firebase Auth** - User authentication and session management
- **Firebase Realtime Database** - Real-time task synchronization across devices
- **Firebase Analytics** - Optional usage tracking and user behavior insights

## Third-Party Libraries
- **Feather Icons** - Lightweight icon library for UI elements
- **Stripe.js** - Payment processing (commented out, ready for premium features)

## Browser APIs
- **Web Audio API** - Zen sound effects and audio management
- **Canvas API** - Liquid bubble animations and visual effects
- **Drag and Drop API** - Native browser drag-and-drop functionality
- **Local Storage API** - Offline data persistence
- **Touch Events API** - Mobile gesture support

## Deployment & Hosting
- **Replit static hosting** - Primary deployment target
- **Environment variable system** - Configuration management for Firebase keys
- **CDN delivery** - Firebase SDKs loaded from Google's CDN for optimal performance