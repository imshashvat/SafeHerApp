# SafeHer Mobile App

React Native (Expo SDK 54) mobile application for women's safety.

## Quick Start

```bash
npm install
npx expo start
```

## Build Release APK

```bash
npx expo run:android --variant release
```

## Database

Uses **expo-sqlite** for local, offline, per-user data storage:
- Users (auth with hashed passwords)
- Guardians (emergency contacts)
- Alert History (SOS logs)
- Settings (per-user preferences)

## Maps

Uses free OpenStreetMap tiles — no API key required:
- Light theme (default): Standard OSM tiles
- Dark theme: CartoDB dark tiles
- Toggle via Settings → Map → Theme
