# Ambient PX Analytics

> **An AI-powered healthcare business intelligence platform that derives Patient Experience (PX) metrics from ambient consultation audio — eliminating the need for traditional post-visit surveys.**

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Phase 1: Acoustic Sentiment Engine (ML Backend)](#phase-1-acoustic-sentiment-engine-ml-backend)
  - [RAVDESS Dataset](#ravdess-dataset)
  - [Feature Extraction](#feature-extraction)
  - [Model Architecture](#model-architecture)
  - [Heuristic Mapping Layer](#heuristic-mapping-layer)
- [Phase 2: Firebase Backend](#phase-2-firebase-backend)
  - [Firestore Collections](#firestore-collections)
  - [Role-Based Access Control (RBAC)](#role-based-access-control-rbac)
- [Phase 3: Frontend Integration](#phase-3-frontend-integration)
- [Phase 4: Live Dashboard](#phase-4-live-dashboard)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Security](#security)

---

## Overview

Traditional healthcare patient experience measurement relies on post-visit surveys with low capture rates (~5%). Ambient PX Analytics resolves this by using a **Y-Split Processing** architecture to passively analyze consultation audio in real time, achieving **100% capture** without patient effort.

The platform processes `.wav` audio files through a trained 1D Convolutional Neural Network to classify emotions, then translates raw emotion logits into three business-ready metrics:

| Metric | Description |
|--------|-------------|
| **Empathy** | How emotionally attuned the provider sounds (calm/happy vs. angry/fearful) |
| **Clarity** | Speech tempo quality derived from Zero-Crossing Rate |
| **Efficiency** | Composite score balancing positive communication against negative emotion load |

These scores (0–100) are saved to Firestore and instantly visualized across the dashboard.

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
| Tailwind CSS | 4.1.12 | Styling framework |
| Recharts | 2.15.2 | Visualizing metrics & trends |
| Lucide React | 0.487.0 | Iconography |
| Firebase JS SDK | latest | Auth + Firestore real-time data client |

### Backend (ML Pipeline)
| Technology | Purpose |
|-----------|---------|
| Python 3.13 | Runtime |
| PyTorch | 1D-CNN model definition and inference |
| Librosa | Audio feature extraction (MFCC + ZCR) |
| FastAPI + Uvicorn | REST API server |
| NumPy | Numerical feature processing |

### Database & Auth
| Technology | Purpose |
|-----------|---------|
| Firebase Authentication | User login + RBAC |
| Cloud Firestore | NoSQL real-time database |
| Firebase Admin SDK | Database seeding and cleanup utilities |

---

## Project Structure

```
EY Patient Experience/
│
├── .env.local                    # Firebase web API keys (gitignored)
├── .gitignore
├── README.md                     # Documentation
│
├── from Figma/                   # React frontend app
│   ├── vite.config.ts
│   ├── package.json
│   ├── firestore.rules           # Production security rules
│   └── src/
│       ├── main.tsx              # Entry point
│       ├── lib/
│       │   ├── firebase.js       # Firebase initialization
│       │   └── firestore.js      # Firestore helper methods
│       ├── hooks/
│       │   └── useFeedbackData.js # Real-time Firestore query listener
│       └── app/
│           ├── App.tsx           # Tab shell, header, and layouts
│           ├── contexts/
│           │   └── AuthContext.jsx  # Auth + RBAC state provider
│           ├── styles/
│           │   ├── fonts.css
│           │   ├── globals.css
│           │   ├── index.css
│           │   ├── tailwind.css
│           │   └── theme.css
│           └── components/
│               ├── AdminDashboard.tsx       # Main dashboard layout
│               ├── AudioUploadModal.tsx     # Audio upload & pipeline driver
│               ├── DoctorProfileModal.tsx   # Detailed doctor statistics view
│               ├── PatientProfileModal.tsx  # Detailed patient summary view
│               ├── FeedbackDetailPanel.tsx  # Side panel details card
│               ├── FeedbackTable.tsx        # Responsive grid data table
│               ├── FilterBar.tsx            # Sentiment & category drop-down filters
│               ├── KPIBar.tsx               # Top-level indicators
│               ├── SentimentTrendChart.tsx  # Trend visualization chart
│               └── ui/                      # Styled shadcn base components
│
├── backend/                      # Python ML pipeline
│   ├── requirements.txt
│   ├── dataset.py                # RAVDESS Dataset parser (MFCC + ZCR)
│   ├── model.py                  # EmotionCNN 1D-CNN architecture
│   ├── train.py                  # PyTorch model training loop
│   ├── api.py                    # FastAPI server + heuristic mapping
│   └── best_model.pth            # Trained weights checkpoint (gitignored)
│
└── scripts/                      # Utility scripts
    ├── seed_feedback.js          # Firestore database seeder
    ├── wipe_legacy_firestore.js  # Clean existing collections
    ├── package.json
    └── serviceAccountKey.json    # Admin credentials key (gitignored)
```

---

## Phase 1: Acoustic Sentiment Engine (ML Backend)

### RAVDESS Dataset
The model is trained on the [Ryerson Audio-Visual Database of Emotional Speech and Song (RAVDESS)](https://zenodo.org/record/1188976), consisting of 1,440 `.wav` files of actors speaking with 8 distinct emotions: 
`01=neutral, 02=calm, 03=happy, 04=sad, 05=angry, 06=fearful, 07=disgust, 08=surprised`.

### Feature Extraction
Audio files are processed into a `(41, 173)` tensor containing:
1. **40 Mel-Frequency Cepstral Coefficients (MFCCs)**: capture spectral envelope characteristics.
2. **1 Zero-Crossing Rate (ZCR)**: captures speech tempo and structural articulation.

### Model Architecture
The custom PyTorch **EmotionCNN** is a 1D Convolutional Neural Network (112,968 parameters):
```
EmotionCNN
├── Conv1d(41→64, kernel_size=5) + BatchNorm + ReLU + MaxPool1d(4)
├── Conv1d(64→128, kernel_size=5) + BatchNorm + ReLU + MaxPool1d(4)
├── Conv1d(128→128, kernel_size=3) + BatchNorm + ReLU + AdaptiveAvgPool1d(1)
└── Classifier: Dropout(0.3) → Linear(128→64) → ReLU → Dropout(0.3) → Linear(64→8)
```

### Heuristic Mapping Layer
Logits outputted by the model are converted to probabilities and mapped to clinical metrics using standard formulas:

* **Empathy** (Attunement level):
  $$\text{Empathy} = 50 + 30 \times (P_{\text{calm}} + P_{\text{happy}}) + 10 \times P_{\text{neutral}} - 35 \times P_{\text{angry}} - 25 \times P_{\text{fearful}} - 15 \times P_{\text{disgust}}$$
* **Clarity** (Tempo & articulation quality):
  $$\text{Clarity} = \text{Gaussian}(ZCR, \text{target}=0.06) - 15 \times (P_{\text{angry}} + P_{\text{fearful}})$$
* **Efficiency** (Balance of constructive communication vs tension):
  $$\text{Efficiency} = 55 + 25 \times (P_{\text{calm}} + P_{\text{neutral}} + P_{\text{happy}}) - 40 \times (P_{\text{angry}} + P_{\text{fearful}} + P_{\text{disgust}} + P_{\text{sad}}) + 15 \times \text{TempoBonus}$$

---

## Phase 2: Firebase Backend

### Firestore Collections

#### `users`
```json
{
  "uid": "firebase_auth_uid",
  "email": "dr.patel@hospital.com",
  "role": "admin | provider",
  "provider_id": "dr-patel",
  "displayName": "Dr. Aarav Patel"
}
```

#### `providers`
```json
{
  "name": "Dr. Aarav Patel",
  "specialty": "Cardiology",
  "avgEmpathy": 88,
  "avgClarity": 82,
  "avgEfficiency": 75,
  "joinedYear": 2019
}
```

#### `consultations`
```json
{
  "timestamp": "Firestore Timestamp",
  "provider_id": "dr-patel",
  "doctorName": "Dr. Aarav Patel",
  "patientName": "Amit Sharma",
  "sentiment": "Positive | Neutral | Negative",
  "patient_anxiety_flag": false,
  "summary": "AI summary text mapping key findings...",
  "transcript": "Full consultation text log...",
  "metrics": {
    "Empathy": 88,
    "Clarity": 82,
    "Efficiency": 75
  },
  "tags": ["Wait Time", "Clear Explanations"]
}
```

### Role-Based Access Control (RBAC)

| Role | Access |
|------|--------|
| **Admin** | Unrestricted read/write access to all views, tables, and statistics. |
| **Provider** | Access restricted to consultation logs matching their `provider_id`. |

---

## Phase 3: Frontend Integration

The `AudioUploadModal.tsx` component orchestrates the client-side pipeline:

```
User selects .wav file
    → FormData → POST http://localhost:8000/analyze-audio
    → { Empathy, Clarity, Efficiency }
    → addDoc(consultations, { timestamp: serverTimestamp(), provider_id, metrics })
    → Success state callback
```

Error handling handles the following states:
* Backend server offline (`TypeError: fetch`)
* Firebase database permission issues (`permission-denied`)
* File formatting errors (non-wav file selection)

---

## Phase 4: Live Dashboard

### Real-time Data Hooks (`useFeedbackData.js`)
Frontend tables and charts query Firestore dynamically using the `onSnapshot` listener. Whenever new recordings are processed and added, dashboard components refresh instantly.

* `useFeedbackData` hook accepts active filters (date ranges, specialties, doctors, sentiment bounds) and updates data collections automatically.

### Loading States
Custom skeletons (`Skeleton` component) display loading blocks during active Firestore queries to prevent layout shifts.

---

## Getting Started

### Prerequisites
* Node.js 18+
* Python 3.10+
* Firebase project with Firestore and Auth services enabled

### 1. Set Up the Project
```bash
git clone https://github.com/ankylosaur/PX-Analytics.git
cd PX-Analytics
```

### 2. Configure Environment Variables
Create `.env.local` in the project root (see [Environment Variables](#environment-variables) section below).

### 3. Install & Run ML Backend
```powershell
cd backend
pip install -r requirements.txt
python train.py      # Trains model weights file
python api.py        # Starts FastAPI local endpoint
```

### 4. Install & Launch Frontend App
```powershell
cd "../from Figma"
npm install
npm run dev          # Starts development server
```

Open `http://localhost:5173`.

---

## Environment Variables

Configure the following variables inside `.env.local` in the project root:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

> ⚠️ Do not commit `.env.local` to remote repositories.

---

## Security

### Gitignored Files
The following configuration and binary files are gitignored for security:
* `.env.local` (Firebase private client configuration)
* `scripts/serviceAccountKey.json` (Firebase Admin SDK private key)
* `backend/best_model.pth` (Trained model weights checkpoint)

### Firestore Security Rules
Production rules (`from Figma/firestore.rules`):
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /consultations/{consultationId} {
      allow read: if request.auth != null && (
        resource.data.provider_id == request.auth.token.provider_id ||
        request.auth.token.role == 'admin'
      );
      allow create: if request.auth != null;
      allow update, delete: if false;
    }
  }
}
```
