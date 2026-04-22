# 🛡️ SafeHer — Women Safety Mobile App

> **Your safety, always on.** A comprehensive React Native mobile application for women's safety with ML-powered crime intelligence, real-time SOS alerts, and community features.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![React Native](https://img.shields.io/badge/React%20Native-0.81-blue)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-SDK%2054-black)](https://expo.dev/)

---

## ✨ Features

### 🆘 Emergency SOS
- **One-tap SOS** — Sends GPS + alerts to all guardians instantly
- **Shake to Alert** — Shake phone to trigger SOS (adjustable sensitivity 1-5)
- **Fall Detection** — Gyro + accelerometer fusion detects falls
- **Voice Detection** — Detects shouts/distress keywords ("help", "bachao")
- **Auto-call 112** — Dials emergency services automatically on SOS
- **Auto-call Guardian** — Calls your top-priority guardian

### 📞 Fake Call
- Realistic incoming call screen to escape uncomfortable situations
- Timer-based auto-trigger

### 🗺️ Crime Intelligence (100% Free — No API Key)
- **Crime Heatmap** — 1032 districts mapped with ML risk predictions
- **Route Safety** — Analyze any route for crime risk before travel
- **LightGBM ML Model** — 99.43% accuracy, NCRB 2001-2015 dataset
- **District-level breakdown** — Rape, kidnapping, assault, dowry data

### 🔐 User Authentication
- Local SQLite database — works 100% offline
- Per-user data isolation (guardians, settings, alert history)
- Secure password hashing (SHA-256)

### 🌍 Maps (100% Free, No API Key)
| Feature | Service | Details |
|---------|---------|---------|
| Heatmap | OpenStreetMap via Leaflet.js | WebView rendered, free |
| Route drawing | OSRM | Free open-source routing |
| Geocoding | Nominatim | Free OSM geocoder |
| Police stations | Overpass API | Free OSM data |
| Theme toggle | Light (default) / Dark | User switchable |

### 📍 Other Features
- **Live location tracking** — Share GPS with guardians
- **Virtual companion** — AI safety companion
- **Safety check-in** — Periodic check-in reminders
- **Community feed** — Share safety reports
- **Alert history** — Full SOS dispatch log
- **Emergency helplines** — India: 112, 1091, 181, etc.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React Native (Expo SDK 54) |
| Language | TypeScript |
| State | Zustand |
| Database | SQLite (expo-sqlite) |
| Maps | Leaflet.js + OpenStreetMap |
| Routing | OSRM (free) |
| Navigation | Expo Router (file-based) |
| Sensors | expo-sensors (accelerometer, gyroscope) |
| Auth | Local SQLite + SHA-256 hashing |

---

## 📂 Project Structure

```
SafeHerApp/
├── mobile/
│   ├── app/                    # Screens (Expo Router)
│   │   ├── (tabs)/             # Tab screens
│   │   │   ├── index.tsx       # Home + SOS button
│   │   │   ├── map.tsx         # Crime heatmap
│   │   │   ├── checkin.tsx     # Safety check-in
│   │   │   ├── community.tsx   # Community feed
│   │   │   └── profile.tsx     # User profile
│   │   ├── auth/               # Authentication screens
│   │   │   ├── login.tsx       # Phone + password login
│   │   │   └── register.tsx    # User registration
│   │   ├── onboarding/         # First-time setup
│   │   ├── _layout.tsx         # Root layout + auth guard
│   │   ├── route-safety.tsx    # Route analysis
│   │   ├── dashboard.tsx       # Crime statistics
│   │   ├── guardians.tsx       # Guardian management
│   │   ├── settings.tsx        # App settings + map theme
│   │   └── ...                 # Other screens
│   ├── components/             # Reusable UI components
│   │   ├── LeafletMapView.tsx  # OSM map (light/dark theme)
│   │   ├── SOSButton.tsx       # Emergency button
│   │   ├── CountdownTimer.tsx  # SOS countdown overlay
│   │   └── FakeCallOverlay.tsx # Fake call screen
│   ├── hooks/                  # Custom React hooks
│   │   ├── useShakeDetection   # Accelerometer shake
│   │   ├── useFallDetection    # Fall detection
│   │   ├── useVoiceDetection   # Audio distress detection
│   │   └── useSOSDispatch      # SOS alert dispatch
│   ├── services/               # Business logic
│   │   ├── database.ts         # SQLite CRUD operations
│   │   ├── alertService.ts     # SOS dispatch pipeline
│   │   ├── crimeDataService.ts # ML crime predictions
│   │   └── backgroundService.ts# Foreground service
│   ├── store/                  # Zustand state stores
│   │   ├── authStore.ts        # Auth state + session
│   │   ├── settingsStore.ts    # User settings (SQLite)
│   │   ├── guardianStore.ts    # Guardian contacts (SQLite)
│   │   ├── alertHistoryStore.ts# Alert log (SQLite)
│   │   └── sosStore.ts         # SOS state machine
│   ├── constants/              # Theme, helplines
│   ├── android/                # Native Android project
│   ├── app.json                # Expo config
│   └── package.json
├── .gitignore
├── LICENSE
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Android Studio (for Android builds)
- Java 17

### Installation

```bash
# Clone the repo
git clone https://github.com/your-username/SafeHerApp.git
cd SafeHerApp/mobile

# Install dependencies
npm install

# Start development server
npx expo start
```

### Build APK (Release)

```bash
# Build release APK (includes bundled JS)
npx expo run:android --variant release

# The APK will be at:
# android/app/build/outputs/apk/release/app-release.apk
```

### Run on Device (Debug)

```bash
# Connect device via USB, enable USB debugging
npx expo run:android

# Or use ADB reverse for Metro
adb reverse tcp:8081 tcp:8081
```

---

## 🗄️ Database Schema

```sql
-- Users table
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  phone TEXT NOT NULL UNIQUE,
  email TEXT DEFAULT '',
  password_hash TEXT NOT NULL,
  blood_group TEXT DEFAULT '',
  medical_notes TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now'))
);

-- Guardians (per-user)
CREATE TABLE guardians (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT DEFAULT '',
  relation TEXT DEFAULT 'Guardian',
  priority INTEGER DEFAULT 1
);

-- Alert History (per-user)
CREATE TABLE alert_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  trigger_type TEXT NOT NULL,
  timestamp INTEGER NOT NULL,
  latitude REAL,
  longitude REAL,
  location TEXT DEFAULT 'Unknown',
  status TEXT DEFAULT 'sent',
  sent_to INTEGER DEFAULT 0,
  guardian_names TEXT DEFAULT '[]'
);

-- User Settings (per-user)
CREATE TABLE user_settings (
  user_id INTEGER PRIMARY KEY REFERENCES users(id),
  shake_sensitivity INTEGER DEFAULT 3,
  fall_detection INTEGER DEFAULT 1,
  voice_keyword INTEGER DEFAULT 0,
  map_theme TEXT DEFAULT 'light',
  -- ... more settings
);
```

---

## ⭐ Star this Project

If SafeHer has been helpful or you support women's safety technology, please consider giving this repo a ⭐

> **Every star helps spread awareness and encourages development of safety tools.**

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
