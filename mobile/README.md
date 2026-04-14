# SafeHer Mobile App 🛡️

> **React Native (Expo) · iOS + Android · Women Safety**

A full-featured personal safety app built with Expo SDK 54 + Expo Router.

---

## Features

| Feature | Status |
|---------|--------|
| 🆘 One-tap SOS Button | ✅ |
| 📳 Shake-to-Alert | ✅ |
| 📉 Fall Detection (Gyro+Accel) | ✅ |
| 📞 Auto-Call 112 on SOS | ✅ |
| 💬 SMS to All Guardians | ✅ |
| 📍 GPS Location Sharing | ✅ |
| 🎭 Fake Call Overlay | ✅ |
| ✅ Safety Check-ins | ✅ |
| 🗺️ Unsafe Zone Map | ✅ |
| 👯 Travel Companion | ✅ |
| 💡 Safety Hub (Tips + Rights) | ✅ |
| 📜 Alert History Log | ✅ |
| ⚙️ Fully Configurable Settings | ✅ |
| 👥 Community Forum | ✅ |
| 🏥 Medical ID Card | ✅ |

---

## Quick Start

```bash
cd mobile
npm install
npx expo start
```

Scan the QR code with **Expo Go** on Android, or use the iOS Simulator.

---

## Project Structure

```
mobile/
├── app/                  # Expo Router screens
│   ├── (tabs)/           # Bottom tab screens
│   ├── onboarding/       # First-run flow
│   ├── guardians.tsx     # Emergency contacts
│   ├── live-tracking.tsx # GPS share
│   ├── fake-call.tsx     # Fake call overlay
│   ├── safety-hub.tsx    # Tips + helplines
│   ├── settings.tsx      # App settings
│   ├── alert-history.tsx # SOS log
│   └── companion.tsx     # Travel companion
├── components/           # Reusable UI
├── hooks/                # Sensor + SOS hooks
├── services/             # Alert dispatch
├── store/                # Zustand state
└── constants/            # Theme + helplines
```

---

## Tech Stack (All Free)

- **Framework**: React Native + Expo SDK 54
- **Navigation**: Expo Router (file-based)
- **State**: Zustand + AsyncStorage
- **Sensors**: expo-sensors (accelerometer, gyroscope)
- **Location**: expo-location (GPS)
- **SMS**: expo-sms (native, no API cost)
- **Maps**: OpenStreetMap (free, no key needed)
- **Calls**: expo-linking tel: URI (native dialer)
- **Notifications**: expo-notifications (FCM free)

---

## SOS Flow

```
User presses SOS / shakes / falls
        ↓
10-second countdown (cancel any time)
        ↓
Fetch current GPS location
        ↓
Send SMS to all guardians (native)
        ↓
Auto-dial 112 emergency services
        ↓
Alert history logged
```

---

## Emergency Helplines (India)

| Service | Number |
|---------|--------|
| Women Helpline | 1091 |
| Police | 100 |
| National Emergency | 112 |
| Ambulance | 102 |
| Domestic Violence | 181 |
| Cyber Crime | 1930 |

---

## Permissions Required

- `ACCESS_FINE_LOCATION` — GPS for SOS
- `CAMERA` + `RECORD_AUDIO` — Evidence video
- `SEND_SMS` — Native SMS alerts
- `CALL_PHONE` — Auto-call 112
- `FOREGROUND_SERVICE` — Background detection

---

## License

MIT — Built for community safety ❤️
