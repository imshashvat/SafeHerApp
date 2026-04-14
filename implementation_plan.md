# SafeHer — Women Safety Crime Prediction System

A full-stack web application using 15+ years of NCRB government data to predict real-time crime risk for women, featuring live GPS tracking, ML-powered safety scores, crime heatmaps, and an SOS alert system.

## Environment

| Tool | Version |
|------|---------|
| Python | 3.13 (via `py` launcher) |
| Node.js | 24.14.0 |
| npm | 11.9.0 |
| Workspace | `c:\Users\shash\Mini_Project` |

---

## User Review Required

> [!IMPORTANT]
> **Dataset Sourcing**: The NCRB CSV files (100+ files) are not currently in the workspace. You'll need to download them from Kaggle. The main dataset is: [Crime in India (Kaggle)](https://www.kaggle.com/datasets/rajanand/crime-in-india). **Do you already have these CSVs downloaded somewhere, or should I guide you through downloading them?**

> [!IMPORTANT]
> **Scope Decision**: This is a ~4 week project in the plan. I'll build the **complete working system** in a single session by implementing all P0 and P1 features. P2/P3 features (Fake Call, Offline Mode, PDF Reports) will be scaffolded but can be enhanced later. **Is this acceptable?**

> [!WARNING]
> **Authentication**: The plan mentions Supabase Auth. Since this is a local/portfolio project, I'll use **localStorage-based auth with a simple Flask backend** to avoid external service dependencies. We can add Supabase later if needed. **Agree?**

> [!IMPORTANT]
> **Deployment**: The plan targets Vercel + Render. I'll build everything to run **locally first** with one-command startup. Deployment configs will be included but deployment itself is Day 18-20 work. **OK?**

---

## Proposed Changes

### Overview of Components

```
women-safety-app/
├── backend/                     ← Python Flask API
│   ├── app.py                   ← Main Flask app with CORS
│   ├── requirements.txt         ← Python dependencies
│   ├── routes/
│   │   ├── safety.py            ← /api/safety-check endpoint
│   │   ├── heatmap.py           ← /api/heatmap-data endpoint
│   │   ├── reports.py           ← /api/incidents CRUD
│   │   └── trends.py            ← /api/crime-trends endpoint
│   ├── ml/
│   │   ├── train.py             ← Full training pipeline (5 algorithms)
│   │   ├── predict.py           ← Prediction + caching + district matching
│   │   ├── preprocess.py        ← Data cleaning + feature engineering
│   │   └── models/              ← Saved .pkl model files
│   ├── data/
│   │   ├── raw/                 ← Original NCRB CSVs (gitignored)
│   │   └── processed/           ← Cleaned master CSV + encoders
│   └── utils/
│       └── district_matcher.py  ← Fuzzy district name matching
│
├── frontend/                    ← React + Vite + Tailwind
│   ├── src/
│   │   ├── components/
│   │   │   ├── Map/             ← CrimeHeatmap, TravelMode, SafetyBadge
│   │   │   ├── SOS/             ← SOSButton, ContactsManager
│   │   │   ├── Dashboard/       ← StatCards, TrendCharts, Rankings
│   │   │   ├── Report/          ← IncidentForm, ReportsList
│   │   │   └── Layout/          ← Navbar, Sidebar, Footer
│   │   ├── pages/
│   │   │   ├── Home.jsx         ← Main map + travel mode
│   │   │   ├── Dashboard.jsx    ← Crime stats + trends
│   │   │   ├── Reports.jsx      ← Incident reports
│   │   │   └── Profile.jsx      ← Emergency contacts management
│   │   ├── hooks/
│   │   │   ├── useGeolocation.js
│   │   │   └── useSafetyCheck.js
│   │   ├── utils/
│   │   │   └── nominatim.js     ← Reverse geocoding helper
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css            ← Global styles + design system
│   ├── public/
│   │   └── india-districts.geojson ← District boundaries
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
│
├── notebooks/                   ← Jupyter EDA (optional)
├── .gitignore
└── README.md
```

---

### Phase 1 — Data Preparation & ML Model

#### [NEW] `backend/ml/preprocess.py`
- Load all primary CAW CSV files (2001-2012, 2013, 2014, 2015)
- Standardize column names across years using rename maps
- Handle nulls (fill numeric with 0, drop rows missing district)
- Fix state name inconsistencies
- Merge into single master dataframe
- Create target variable `risk_level` using `pd.qcut` (3 classes: SAFE=0, MODERATE=1, HIGH_RISK=2)
- Feature engineering: `rape_ratio`, `kidnap_ratio`, `year_trend`
- Encode state/district using LabelEncoder
- Save `training_data.csv`, `state_encoder.pkl`, `district_encoder.pkl`

#### [NEW] `backend/ml/train.py`
- Load processed training data
- Apply SMOTE for class balancing
- Train 5 algorithms: RandomForest, XGBoost, LightGBM, LogisticRegression, KNN
- 5-fold cross-validation comparison
- Auto-select best model
- Save `crime_model.pkl` with metrics report
- Generate confusion matrix and feature importance

#### [NEW] `backend/ml/predict.py`
- Load trained model and encoders at startup
- Pre-compute all district risk scores into cache dict
- Provide `get_safety_score(state, district)` function
- Apply night-time risk multiplier (22:00-05:00 → +40%, 18:00-22:00 → +15%)
- Return: risk_level, confidence, crime_rate, breakdown by crime type

---

### Phase 2 — Flask Backend API

#### [NEW] `backend/app.py`
- Flask app factory with CORS enabled
- Blueprint registration for all route modules
- Pre-compute risk scores on first request
- Health check endpoint

#### [NEW] `backend/routes/safety.py`
- `POST /api/safety-check` — accepts `{district, state, hour}`, returns risk assessment
- Uses fuzzy district matching via `difflib.get_close_matches`
- Falls back to state average if district not found

#### [NEW] `backend/routes/heatmap.py`
- `GET /api/heatmap-data` — returns all districts with risk scores as JSON array
- Format: `[{state, district, risk_level, score, lat, lng}]`
- District centroids pre-computed from data

#### [NEW] `backend/routes/trends.py`
- `GET /api/crime-trends?state=X` — returns year-over-year crime data
- `GET /api/state-rankings` — top 10 safest/most dangerous states

#### [NEW] `backend/routes/reports.py`
- `GET/POST /api/incidents` — community incident reports (SQLite-backed locally)
- Stores: lat, lng, district, state, crime_type, description, timestamp

---

### Phase 3 — React Frontend

#### [NEW] Frontend initialized with Vite + React
- React Router for SPA navigation
- Tailwind CSS for styling
- Leaflet + react-leaflet for maps
- Recharts for data visualization
- Axios for API calls

#### [NEW] `src/pages/Home.jsx` — Main Page
- Full-screen crime heatmap (Leaflet choropleth)
- Travel Mode toggle — live GPS tracking
- SafetyBadge — large colored indicator (green/amber/red)
- Current district info overlay
- SOS button always visible

#### [NEW] `src/components/Map/CrimeHeatmap.jsx`
- India districts GeoJSON layer
- Color-coded by risk level (green → amber → red)
- Click district for popup with crime breakdown
- Legend overlay

#### [NEW] `src/components/Map/TravelMode.jsx`
- `watchPosition` GPS tracking
- 30-second polling cycle
- Reverse geocoding via Nominatim
- Safety score auto-update
- Vibration + audio alert on HIGH RISK

#### [NEW] `src/components/SOS/SOSButton.jsx`
- Large emergency button
- 5-second countdown with cancel
- Sends location via EmailJS to emergency contacts
- Stores contacts in localStorage

#### [NEW] `src/pages/Dashboard.jsx`
- Crime trend line charts (2001-2015)
- State bar chart rankings
- Crime type pie chart breakdown
- State/district selector filters

#### [NEW] `src/pages/Reports.jsx`
- Community incident report form
- Map view of reported incidents
- Filter by crime type / date

#### [NEW] `src/pages/Profile.jsx`
- Emergency contacts manager (up to 5)
- Safety preferences
- Travel history

---

### Phase 4 — Polish & Deployment

#### [NEW] `.gitignore`
- Ignore `node_modules/`, `__pycache__/`, `.pkl` files, `data/raw/`, `.env`

#### [NEW] `README.md`
- Project overview, tech stack, setup instructions
- Screenshots section
- Live demo link (once deployed)

#### [NEW] Deployment configs
- `backend/Procfile` for Render
- `frontend/vercel.json` for Vercel
- Environment variable templates

---

## Design System

The UI will feature a **premium dark theme** with safety-focused color palette:

| Element | Color | Usage |
|---------|-------|-------|
| Background | `#0F0F1A` | Main dark background |
| Surface | `#1A1A2E` | Cards, panels |
| Accent Safe | `#00D4AA` | Safe zones, success states |
| Accent Warning | `#FFB800` | Moderate risk, warnings |
| Accent Danger | `#FF3366` | High risk, SOS, alerts |
| Primary | `#6C63FF` | Buttons, links, interactive |
| Text Primary | `#FFFFFF` | Headings, important text |
| Text Secondary | `#8B8BA7` | Body text, labels |

**Typography**: Inter (Google Fonts) — clean, modern, high readability

**Effects**: Glassmorphism cards, gradient borders, subtle glow effects on interactive elements, smooth micro-animations (fade, slide, pulse for alerts)

---

## Open Questions

> [!IMPORTANT]
> 1. **Do you have the NCRB CSV datasets downloaded?** If not, I'll need you to download them from Kaggle first. The key dataset is the "Crime in India" collection. Without these, I'll create the full pipeline but use **synthetic/sample data** for demonstration.

> [!IMPORTANT]
> 2. **EmailJS Setup**: For the SOS email feature to work, you'll need a free EmailJS account (emailjs.com). Should I set it up with placeholder keys that you can replace later?

> [!NOTE]
> 3. **India Districts GeoJSON**: I'll download the district boundary data from the DataMeet GitHub repository (~5MB file). This is free and open-source.

---

## Verification Plan

### Automated Tests
1. **ML Pipeline**: Train model and verify accuracy > 75% on test set
2. **API Endpoints**: Test all Flask endpoints with sample requests
3. **Frontend Build**: Ensure `npm run build` completes without errors

### Manual Verification
1. **Browser Testing**: Open frontend in browser, verify:
   - Heatmap loads with colored districts
   - Travel Mode shows GPS position and safety score
   - SOS button triggers countdown
   - Dashboard charts render with real data
   - Incident report form submits and shows on map
2. **Mobile Responsive**: Test on browser mobile viewport
3. **API Integration**: Verify frontend ↔ backend communication

### Dev Server Commands
```bash
# Backend (terminal 1)
cd backend && py -m flask run --port 5000

# Frontend (terminal 2)  
cd frontend && npm run dev
```
