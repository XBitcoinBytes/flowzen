# Flowzen

> **Archived.** This repository is no longer maintained. It is kept as a public record of an early experiment.

A zen-inspired Kanban task-board demo. Built by Shaun Barry with AI tools on Replit. This is an early experiment, preserved as a public archive of the work.

**Stack:** HTML, CSS, and vanilla JavaScript, with optional Firebase Auth and Realtime Database (the app runs in demo mode if those keys are not set).

**Run locally:** serve the folder with any static file server, for example `npx serve .`. Copy `.env.example` if you want to hook up your own Firebase project.

---

## Features and setup

A zen-inspired Kanban task management application with liquid bubble animations and Japanese water garden aesthetics.

## Features

- **Four Zen Spheres**: Backlog, Next Up (max 6), In Progress (max 3), and Completed
- **Liquid Bubble Animations**: Hyper-realistic Canvas-based water effects at 60fps
- **Drag & Drop**: Smooth task movement between spheres with WIP limits
- **User Authentication**: Firebase Auth with email/password and guest mode
- **Real-time Sync**: Firebase Realtime Database for cross-device synchronization
- **Responsive Design**: Works beautifully on mobile and desktop
- **Zen Audio**: Optional water bubble sound effects via Web Audio API
- **Accessibility**: ARIA labels, keyboard navigation, and screen reader support

## Setup Instructions

### 1. Firebase Configuration

1. Go to the [Firebase Console](https://console.firebase.google.com/) and create a new project
2. Add a web app to your Firebase project
3. Enable Authentication with Email/Password method
4. Enable Realtime Database
5. Copy your Firebase configuration values

### 2. Environment Variables

Set the following environment variables in your deployment platform:

```bash
FIREBASE_API_KEY=your-api-key
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_APP_ID=your-app-id
FIREBASE_MESSAGING_SENDER_ID=your-sender-id
FIREBASE_MEASUREMENT_ID=your-measurement-id (optional)
```
