# Ambient PX Analytics

> **An AI-powered healthcare business intelligence platform that derives Patient Experience (PX) metrics from ambient consultation audio — eliminating the need for traditional post-visit surveys.**

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Phase 1: Acoustic Sentiment Engine (ML Backend)](#phase-1-acoustic-sentiment-engine-ml-backend)
- [Phase 2: Firebase Backend](#phase-2-firebase-backend)
- [Phase 3: Frontend Integration](#phase-3-frontend-integration)
- [Phase 4: Live Dashboard](#phase-4-live-dashboard)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database Seeding](#database-seeding)
- [Security](#security)
- [Dashboard Views](#dashboard-views)

---

## Overview

Traditional healthcare patient experience measurement relies on post-visit surveys with an average **5% capture rate**. Ambient PX Analytics uses a **Y-Split Processing** architecture to passively analyze consultation audio in real time, achieving **100% capture** without any patient effort.

The platform processes `.wav` audio files through a trained 1D Convolutional Neural Network to classify emotions, then translates raw emotion logits into three business-ready metrics:

| Metric | Description |
|--------|-------------|
| **Empathy** | How emotionally attuned the provider sounds (calm/happy vs. angry/fearful) |
| **Clarity** | Speech tempo quality derived from Zero-Crossing Rate |
| **Efficiency** | Composite score balancing positive communication against negative emotion load |

These scores (0–100) are saved to Firestore and instantly visualized across three dashboard views.

---

## Architecture

```
                        ┌─────────────────────────────┐
                        │       React Frontend         │
                        │   (Vite + Tailwind + Recharts)│
                        └────────────┬────────────────┘
                                     │
               ┌─────────────────────┼─────────────────────┐
               │                     │                     │
               ▼                     ▼                     ▼
    ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
    │  FastAPI ML API  │  │  Firebase Auth   │  │    Firestore     │
    │  (localhost:8000)│  │  (RBAC: Admin /  │  │  (consultations, │
    │  POST /analyze-  │  │   Provider)      │  │   providers,     │
    │  audio           │  └──────────────────┘  │   users)         │
    └────────┬─────────┘                        └──────────────────┘
             │                                           ▲
             │  1. Upload .wav                           │
             │  2. Run 1D-CNN inference                  │
             │  3. Return metrics JSON                   │
             │  4. Frontend writes to Firestore ─────────┘
             │
    ┌────────▼─────────┐
    │   EmotionCNN     │
    │  (PyTorch 1D-CNN)│
    │  RAVDESS trained │
    │  8-class output  │
    └──────────────────┘
```

---

## Tech Stack

### Frontend
| Technology | Version | Purpose |
|-----------|---------|---------|
| Vite | 6.3.5 | Build tool & dev server |
| React | 18.3.1 | UI framework |
| Tailwind CSS | 4.1.12 | Styling (Corporate Minimalist design system) |
| Recharts | 2.15.2 | AreaChart, PieChart, BarChart, RadarChart, LineChart |
| Lucide React | 0.487.0 | Icons |
| Firebase JS SDK | latest | Auth + Firestore real-time data |

### Backend (ML Pipeline)
| Technology | Purpose |
|-----------|---------|
| Python 3.13 | Runtime |
| PyTorch | 1D-CNN model definition and inference |
| Librosa | Audio feature extraction (MFCC + ZCR) |
| FastAPI + Uvicorn | REST API server |
| NumPy | Feature processing |

### Database & Auth
| Technology | Purpose |
|-----------|---------|
| Firebase Authentication | User login + RBAC |
| Cloud Firestore | NoSQL real-time database |
| Firebase Admin SDK | Server-side seeding script |

---

## Project Structure

```
EY Patient Experience/
│
├── .env.local                    # Firebase web API keys (gitignored)
├── .gitignore
├── README.md
│
├── from Figma/                   # Vite + React frontend
│   ├── vite.config.ts
│   ├── package.json
│   ├── firestore.rules           # Production security rules
│   └── src/
│       ├── main.tsx              # Entry point (wraps app in AuthProvider)
│       ├── lib/
│       │   ├── firebase.js       # Firebase app init from env vars
│       │   └── firestore.js      # Collection helpers + seedFirestore()
│       ├── hooks/
│       │   └── useDashboardData.js  # All real-time data hooks
│       └── app/
│           ├── App.tsx           # Tab routing + header
│           ├── contexts/
│           │   └── AuthContext.jsx  # Auth + RBAC context
│           └── components/
│               ├── ExecutiveOverview.tsx
│               ├── SpecialtyBenchmarking.tsx
│               ├── ProviderDeepDive.tsx
│               ├── AudioUploader.jsx    # Upload + orchestration
│               └── ChartSkeleton.jsx   # Loading states
│
├── backend/                      # Python ML pipeline
│   ├── requirements.txt
│   ├── dataset.py                # RAVDESS Dataset class (MFCC + ZCR)
│   ├── model.py                  # EmotionCNN 1D-CNN architecture
│   ├── train.py                  # Training loop + checkpointing
│   ├── api.py                    # FastAPI server + heuristic mapping
│   └── best_model.pth            # Trained weights (gitignored)
│
├── scripts/                      # Utility scripts
│   ├── seed.js                   # Firestore seeder (Firebase Admin)
│   ├── package.json
│   └── serviceAccountKey.json    # Admin credentials (gitignored)
│
└── datasets/
    └── RAVDESS/                  # Audio dataset for training
        ├── Actor_01/
        ├── Actor_02/
        └── ...
```

---

## Phase 1: Acoustic Sentiment Engine (ML Backend)

### Dataset: RAVDESS
The [Ryerson Audio-Visual Database of Emotional Speech and Song](https://zenodo.org/record/1188976) contains 1,440 `.wav` files from 24 professional actors expressing 8 emotions:

`01=neutral, 02=calm, 03=happy, 04=sad, 05=angry, 06=fearful, 07=disgust, 08=surprised`

### Feature Extraction (`dataset.py`)
Each audio file is processed into a `(41, 173)` feature tensor:
- **40 MFCCs** — Mel-Frequency Cepstral Coefficients capturing tonal/spectral characteristics
- **1 ZCR** — Zero-Crossing Rate capturing speech tempo/articulation

### Model Architecture (`model.py`)
```
EmotionCNN (112,968 parameters)
├── Conv1d(41→64, k=5) + BatchNorm + ReLU + MaxPool
├── Conv1d(64→128, k=5) + BatchNorm + ReLU + MaxPool
├── Conv1d(128→128, k=3) + BatchNorm + ReLU + AdaptiveAvgPool
└── Classifier: Dropout → Linear(128→64) → ReLU → Dropout → Linear(64→8)
```

### Training (`train.py`)
- 80/20 train/validation split
- CrossEntropyLoss, Adam optimizer (lr=1e-3)
- ReduceLROnPlateau scheduler
- Best-weight checkpointing to `best_model.pth`

### Heuristic Mapping Layer (`api.py`)
Raw emotion probabilities → 0–100 business metrics:

| Metric | Formula |
|--------|---------|
| **Empathy** | `50 + 30*(calm+happy) + 10*neutral - 35*angry - 25*fearful - 15*disgust` |
| **Clarity** | Gaussian function peaked at ideal ZCR (0.06), penalized by angry/fearful |
| **Efficiency** | `55 + 25*(calm+neutral+happy) - 40*(angry+fearful+disgust+sad) + 15*tempo_bonus` |

### Training the Model
```powershell
cd backend
pip install -r requirements.txt
python train.py
```

### Running the API
```powershell
python api.py
# → http://localhost:8000
# → http://localhost:8000/docs  (Swagger UI)
```

### Testing the Endpoint
```powershell
curl.exe -X POST "http://localhost:8000/analyze-audio" -F "file=@path\to\audio.wav"
# Response: {"Empathy": 88, "Clarity": 82, "Efficiency": 75}
```

---

## Phase 2: Firebase Backend

### Firestore Collections

**`users`**
```json
{
  "uid": "firebase_auth_uid",
  "email": "dr.jenkins@hospital.com",
  "role": "admin | provider",
  "provider_id": "dr-jenkins",
  "displayName": "Dr. Sarah Jenkins"
}
```

**`providers`**
```json
{
  "name": "Dr. Sarah Jenkins",
  "specialty": "Cardiology",
  "avgEmpathy": 88,
  "avgClarity": 82,
  "avgEfficiency": 75,
  "joinedYear": 2019
}
```

**`consultations`** *(core event log)*
```json
{
  "timestamp": "Firestore Timestamp",
  "provider_id": "dr-jenkins",
  "patient_anxiety_flag": false,
  "metrics": {
    "Empathy": 88,
    "Clarity": 82,
    "Efficiency": 75
  }
}
```

### Role-Based Access Control (RBAC)

| Role | Access |
|------|--------|
| **Admin** | Executive Overview, Specialty Benchmarking, all provider data |
| **Provider** | Only their own Provider Deep-Dive view |

---

## Phase 3: Frontend Integration

### AudioUploader Component
The `AudioUploader.jsx` component orchestrates the full pipeline client-side:

```
User selects .wav
    → FormData → POST http://localhost:8000/analyze-audio
    → { Empathy, Clarity, Efficiency }
    → addDoc(consultations, { timestamp: serverTimestamp(), provider_id, metrics })
    → Success UI with scores
    → Auto-clear after 5 seconds
```

Error handling distinguishes between:
- FastAPI server offline (`TypeError: fetch`)
- Firebase permission denied (`permission-denied`)
- Invalid file format (client-side validation)

---

## Phase 4: Live Dashboard

### Real-time Data Hooks (`useDashboardData.js`)

All hooks use Firestore's `onSnapshot` — charts update **instantly** when new consultations arrive.

| Hook | Powers |
|------|--------|
| `useExecutiveMetrics(dateRange)` | KPI cards, trust trend AreaChart, sentiment PieChart |
| `useProviderMetrics(providerId, dateRange)` | RadarChart, shift timeline LineChart, key drivers |
| `useBenchmarkingMetrics(dateRange)` | Dept averages BarChart, friction points table |

### Loading States
While Firestore fetches data:
- `CardSkeleton` — `animate-pulse` grey rectangles matching KPI card dimensions
- `ChartSkeleton` — full-height grey pulse block for chart area
- `EmptyState` — clean "No acoustic data available for this timeframe" message

---

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.10+
- Firebase project with Firestore and Auth enabled

### 1. Clone the repo
```bash
git clone https://github.com/YOUR_USERNAME/ambient-px-analytics.git
cd ambient-px-analytics
```

### 2. Set up environment variables
Create `.env.local` at the project root:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

### 3. Install frontend dependencies
```powershell
cd "from Figma"
npm install
```

### 4. Install Python dependencies
```powershell
cd backend
pip install -r requirements.txt
```

### 5. Train the ML model
```powershell
cd backend
python train.py
```

### 6. Start the ML API
```powershell
cd backend
python api.py
```

### 7. Start the frontend
```powershell
cd "from Figma"
npm run dev
```

Open `http://localhost:5173`

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_FIREBASE_API_KEY` | Firebase web API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Firestore project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | FCM sender ID |
| `VITE_FIREBASE_APP_ID` | Firebase app ID |
| `VITE_FIREBASE_MEASUREMENT_ID` | Google Analytics ID |

> ⚠️ Never commit `.env.local` — it is gitignored.

---

## Database Seeding

To populate the dashboard with realistic demo data:

1. Download a Firebase Admin service account key from:
   **Firebase Console → Project Settings → Service Accounts → Generate New Private Key**

2. Save it as `scripts/serviceAccountKey.json`

3. Run the seeder:
```powershell
cd scripts
npm install
node seed.js
```

This injects **150 consultations** across 5 providers over 30 days with upward-trending scores. Refresh the dashboard — all charts populate instantly via `onSnapshot`.

> ⚠️ `serviceAccountKey.json` is gitignored. Never commit it.

---

## Security

### Files that must never be committed
| File | Contains |
|------|---------|
| `.env.local` | Firebase web API keys |
| `scripts/serviceAccountKey.json` | Firebase Admin private key (full database access) |
| `backend/best_model.pth` | Trained model binary |

### Firestore Security Rules
Production rules in `from Figma/firestore.rules`:
- Admins can read all documents
- Providers can only read their own consultations
- Consultations are immutable (no update/delete)
- All writes require authentication

---

## Dashboard Views

### Executive Overview
- **KPI Strip** — Total consultations, feedback capture rate, global sentiment score, critical friction alerts
- **Audio Consultation Upload** — Drag-and-drop `.wav` file → ML inference → Firestore write
- **30-Day Patient Trust Trend** — AreaChart with gradient fill, composite weighted score (Empathy×0.45 + Clarity×0.30 + Efficiency×0.25)
- **Acoustic Sentiment Donut** — Positive / Neutral / Negative distribution
- **Historical Survey Rate** — Static baseline BarChart (~5% traditional capture vs. 100% ambient)

### Specialty Benchmarking
- **KPI Cards** — Top department, highest improvement, hospital average
- **Departmental PX Averages** — Horizontal BarChart, blue = above average, dashed reference line at hospital mean
- **Friction Points Table** — Auto-derived from low-scoring consultations, severity-coded badges

### Provider Deep-Dive
- **Provider Profile Header** — Name, specialty, patients seen, individual PX score
- **Communication Profile RadarChart** — Empathy / Clarity / Efficiency axes (0–100)
- **Shift Timeline LineChart** — PX score by 2-hour slot from 7AM–7PM
- **Key Drivers** — Auto-generated strengths (emerald) and attention areas (amber) from metric thresholds

---

*Built as a proof-of-concept for EY Patient Experience analytics — demonstrating how passive AI can replace low-signal survey instruments with a 100% capture, real-time feedback pipeline.*
