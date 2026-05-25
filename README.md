# Ambient PX Analytics

> **An AI-powered healthcare business intelligence platform that derives Patient Experience (PX) metrics from ambient consultation audio — eliminating the need for traditional post-visit surveys.**

---

## Table of Contents

- [Overview](#overview)
- [Key Architectural Pillars](#key-architectural-pillars)
- [Architecture Diagram](#architecture-diagram)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Acoustic Sentiment Engine (ML Backend)](#acoustic-sentiment-engine-ml-backend)
  - [RAVDESS Dataset & Features](#ravdess-dataset--features)
  - [Model Architecture](#model-architecture)
  - [Heuristic Mapping Layer](#heuristic-mapping-layer)
- [Firebase & Firestore Database Architecture](#firebase--firestore-database-architecture)
  - [Schema Specifications](#schema-specifications)
  - [Role-Based Access Control (RBAC)](#role-based-access-control-rbac)
- [Premium UI/UX Polish & AI-First Design](#premium-uiux-polish--ai-first-design)
  - [AI-First Feedback Cards](#ai-first-feedback-cards)
  - [Premium Charts & Visuals](#premium-charts--visuals)
  - [Fluid Overlays & Sticky Modal Headers](#fluid-overlays--sticky-modal-headers)
  - [Responsive Data Tables](#responsive-data-tables)
- [Frontend Integration & Real-time Hooks](#frontend-integration--real-time-hooks)
- [Security & Rule Configurations](#security--rule-configurations)
- [Database Seeding (Indian Physicians & Patients)](#database-seeding-indian-physicians--patients)
- [Getting Started](#getting-started)
- [Environment Configuration](#environment-configuration)
- [Detailed Dashboard Views](#detailed-dashboard-views)

---

## Overview

Traditional healthcare patient experience measurement relies on post-visit surveys with low capture rates (~5%). Ambient PX Analytics resolves this by using a **Y-Split Processing** architecture to passively analyze consultation audio in real time, achieving **100% capture** without patient effort.

The platform processes `.wav` audio files through a trained 1D Convolutional Neural Network to classify emotions, then translates raw emotion logits into three business-ready metrics:

| Metric | Description |
|--------|-------------|
| **Empathy** | How emotionally attuned the provider sounds (calm/happy vs. angry/fearful) |
| **Clarity** | Speech tempo quality derived from Zero-Crossing Rate |
| **Efficiency** | Composite score balancing positive communication against negative emotion load |

These scores (0–100) are saved to Firestore and instantly visualized across three premium dashboard views.

---

## Key Architectural Pillars

1. **Passive Ambient Pipeline**: Audio recordings are fed into a 1D Convolutional Neural Network (EmotionCNN) to calculate emotion distributions, mapping acoustic properties directly to clinical communication quality scores.
2. **AI-First Information Hierarchy**: Patient detail logs are structured to highlight the **AI Clinical Summary** first, allowing clinicians to instantly review key takeaways while raw transcript quotes remain accessible but collapsed.
3. **Interactive Data Workspace**: A high-fidelity, responsive web client featuring real-time charts, detailed provider profiles, and simulated audio uploads.

---

## Architecture Diagram

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
* **UI & Logic**: React (v18.3.1), Vite (v6.3.5)
* **Styling**: Tailwind CSS (v4) for custom transitions, variables, and utility styling
* **Charts**: Recharts (v2.15.2) — Custom SVG Area, Line, Bar, Radar, and Donut visuals
* **Icons**: Lucide React (v0.487.0)
* **Database & Auth Integration**: Firebase JS SDK (v11)

### Backend (ML Pipeline)
* **Language & Runtime**: Python 3.13
* **Inference Model**: PyTorch (1D-CNN)
* **Acoustic Audio Processing**: Librosa (MFCC + ZCR extraction)
* **Server Framework**: FastAPI + Uvicorn
* **Data Processing**: NumPy

### Database & Auth
* **User Authentication**: Firebase Authentication (Admin/Provider RBAC)
* **NoSQL Database**: Cloud Firestore (real-time listeners via `onSnapshot`)
* **Seeding & Administration**: Firebase Admin SDK (Node.js)

---

## Project Structure

```
EY Patient Experience/
│
├── .env.local                    # Firebase web API keys (gitignored)
├── .gitignore
├── README.md                     # Main documentation
│
├── from Figma/                   # React Frontend App
│   ├── vite.config.ts
│   ├── package.json
│   ├── firestore.rules           # Production security rules
│   └── src/
│       ├── main.tsx              # Application entry point
│       ├── lib/
│       │   ├── firebase.js       # Firebase SDK configuration
│       │   └── firestore.js      # Firestore helper functions
│       ├── hooks/
│       │   └── useDashboardData.js  # Real-time data hooks (onSnapshot)
│       └── app/
│           ├── App.tsx           # Dashboard shell & header layout
│           ├── contexts/
│           │   └── AuthContext.jsx  # Authentication state & provider
│           └── components/
│               ├── AdminDashboard.tsx           # Executive dashboard entry
│               ├── KPIBar.tsx                   # Top-level metric blocks
│               ├── FeedbackTable.tsx            # Patient grid with sticky date
│               ├── FilterBar.tsx                # Filter dropdown controls
│               ├── SentimentTrendChart.tsx      # SVG AreaChart with glass tooltips
│               ├── DoctorProfileModal.tsx       # Doctor metrics & Tag Cloud
│               ├── PatientProfileModal.tsx      # Patient clinical summary cards
│               └── AudioUploadModal.tsx         # Drag & Drop file processor
│
├── backend/                      # Python ML Pipeline
│   ├── requirements.txt
│   ├── dataset.py                # RAVDESS Dataset pipeline (MFCC + ZCR)
│   ├── model.py                  # EmotionCNN 1D-CNN architecture
│   ├── train.py                  # CNN model training loop
│   ├── api.py                    # FastAPI server & heuristic mapping
│   └── best_model.pth            # Trained weights file (gitignored)
│
├── scripts/                      # Utility Database Scripts
│   ├── seed_feedback.js          # Firestore database seeder (Indian mock data)
│   ├── wipe_legacy_firestore.js  # Clears existing Firestore collections
│   ├── package.json
│   └── serviceAccountKey.json    # Admin credentials key (gitignored)
│
└── datasets/
    └── RAVDESS/                  # Audio files for training
        ├── Actor_01/
        └── ...
```

---

## Acoustic Sentiment Engine (ML Backend)

### RAVDESS Dataset & Features
The model is trained on the [Ryerson Audio-Visual Database of Emotional Speech and Song (RAVDESS)](https://zenodo.org/record/1188976), consisting of 1,440 `.wav` files of actors speaking with 8 distinct emotions: 
*Neutral, Calm, Happy, Sad, Angry, Fearful, Disgust, Surprised*.

Audio files are processed into a `(41, 173)` tensor containing:
1. **40 Mel-Frequency Cepstral Coefficients (MFCCs)**: capture spectral envelope characteristics.
2. **1 Zero-Crossing Rate (ZCR)**: captures speech tempo and structural articulation.

### Model Architecture
The custom PyTorch **EmotionCNN** is a 1D Convolutional Neural Network (112,968 parameters):
* **Conv Layer 1**: `Conv1d(41 → 64, kernel_size=5)` + `BatchNorm` + `ReLU` + `MaxPool1d(4)`
* **Conv Layer 2**: `Conv1d(64 → 128, kernel_size=5)` + `BatchNorm` + `ReLU` + `MaxPool1d(4)`
* **Conv Layer 3**: `Conv1d(128 → 128, kernel_size=3)` + `BatchNorm` + `ReLU` + `AdaptiveAvgPool1d(1)`
* **Linear Layers**: `Dropout(0.3)` → `Linear(128 → 64)` → `ReLU` → `Dropout(0.3)` → `Linear(64 → 8)`

### Heuristic Mapping Layer
Logits outputted by the model are converted to probabilities and mapped to clinical metrics using standard formulas:

* **Empathy** (Attunement level):
  $$\text{Empathy} = 50 + 30 \times (P_{\text{calm}} + P_{\text{happy}}) + 10 \times P_{\text{neutral}} - 35 \times P_{\text{angry}} - 25 \times P_{\text{fearful}} - 15 \times P_{\text{disgust}}$$
* **Clarity** (Tempo & articulation quality):
  $$\text{Clarity} = \text{Gaussian}(ZCR, \text{target}=0.06) - 15 \times (P_{\text{angry}} + P_{\text{fearful}})$$
* **Efficiency** (Balance of constructive communication vs tension):
  $$\text{Efficiency} = 55 + 25 \times (P_{\text{calm}} + P_{\text{neutral}} + P_{\text{happy}}) - 40 \times (P_{\text{angry}} + P_{\text{fearful}} + P_{\text{disgust}} + P_{\text{sad}}) + 15 \times \text{TempoBonus}$$

---

## Firebase & Firestore Database Architecture

### Schema Specifications

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
  "specialty": "Cardiology | Neurology | Pediatrics | Oncology | Orthopedics",
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
* **Admin**: Unrestricted read/write access. Views the Executive Dashboard, Table grids, and Benchmarking logs.
* **Provider**: Read-only access restricted strictly to their own consultation logs (tied to their `provider_id`).

---

## Premium UI/UX Polish & AI-First Redesign

### AI-First Feedback Cards
To ensure patient review cards prioritize actionable insights, we inverted the visual hierarchy:
* **AI Summary on Top**: Displays the AI Clinical Summary immediately below patient tags. It is styled with a subtle `bg-indigo-50/50 border border-indigo-100/50` indigo card container and features a soft purple `Sparkles` icon to natively signal AI insights.
* **Collapsible Raw Transcripts**: Raw conversations are enclosed in a native HTML5 `<details>` element labeled `"View Raw Transcript"`. This keeps the visual interface tidy while offering secondary access. The transcript text is styled with a clear left border (`border-l-2 border-slate-200 pl-4 py-1`) and clean non-italic typography.

### Premium Charts & Visuals
* **SVG Linear Gradients**: Interactive area charts (`SentimentTrendChart`) use custom SVG linear gradients that fade gracefully (opacity `0.4` down to `0`). Emerald fills are mapped to positive trends, slate fills to neutral volumes, and rose fills to negative scores.
* **Glassmorphism Tooltips**: The custom chart tooltip (`<CustomTooltip />`) features a blurred background wrapper (`bg-white/90 backdrop-blur-md border border-slate-100 shadow-xl`) displaying precise, custom colored-dot metric keys (e.g. `Positive: X feedbacks`).
* **Hidden Axis Lines**: Faint gridlines (`stroke="#e2e8f0" strokeDasharray="3 3"`) run horizontally, while vertical lines are hidden. Axis lines themselves are disabled (`axisLine={false}`) to present a floating design.

### Fluid Overlays & Sticky Modal Headers
* **Cubic-Bezier Drawer Animations**: Slide-out sheets use custom cubic-bezier animation curves (`transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]`) with heavy backdrop blurs (`bg-slate-900/40 backdrop-blur-sm`).
* **Scroll-Active Modal Headers**: Patient and Doctor profiles utilize scroll-event listeners. The header panel and top KPI row remain sticky (`sticky top-0 bg-white/95 backdrop-blur z-10`). As user scrolls down, the header dynamically applies a dividing border and drop shadow (`border-b border-slate-200/80 shadow-sm`) only when content passes underneath.
* **Doctor Profile Tag Cloud**: Weighted tag elements display frequent complaints (e.g. `Billing (3)`) in a compact wrap layout, replacing heavy charts with lightweight, color-coded badges.

### Responsive Data Tables
* **Sticky Columns on Horizontal Scroll**: Wrapped in an `overflow-x-auto` viewport container, the table locks the **Date** column (`sticky left-0 bg-white z-10`).
* **Hover Maintenance**: Group hover overrides (`group-hover:bg-slate-50/80`) prevent the sticky background color from overlaying or blocking row highlight indicators.
* **Typography Links**: Table hyperlink paths for Patient and Doctor names use premium styling (`text-slate-900 font-medium hover:text-indigo-600 cursor-pointer transition-colors duration-200`) instead of generic browser styles.

---

## Frontend Integration & Real-time Hooks

The frontend implements real-time synchronization hooks using Firestore's `onSnapshot` listener. Charts and grids reload dynamically when an audio recording is uploaded or a consultation is added:

* `useExecutiveMetrics(dateRange)`: Real-time queries for dashboard cards, trend area charts, and sentiment donuts.
* `useProviderMetrics(providerId, dateRange)`: Queries individual performance metrics for Radar and Line timelines.
* `useBenchmarkingMetrics(dateRange)`: Queries department rankings and tables.

During data load states, custom tailwind skeletons (`animate-pulse bg-slate-200/60`) render to prevent layout shifts.

---

## Security & Rule Configurations

1. **Security Rule Specifications (`firestore.rules`)**:
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
         allow update, delete: if false; // Consultations are immutable
       }
     }
   }
   ```
2. **Gitignored Assets**: API secret keys, Admin SDK JSON credentials (`serviceAccountKey.json`), and trained PyTorch checkpoint files (`best_model.pth`) are gitignored and managed securely.

---

## Database Seeding (Indian Physicians & Patients)

The database seeding script cleans existing collections and seeds **50 mock entries** spread over the last 30 days. To represent a localized team, all patients and physicians are configured using Indian names (e.g. *Sharma, Patel, Nair, Sen, Joshi, Gupta, Iyer, Rao*).

### Setup and Running the Seeder
1. Generate a new private key JSON in **Firebase Console → Project Settings → Service Accounts**.
2. Save it as `scripts/serviceAccountKey.json`.
3. Clear the legacy database and run the seeder:
   ```powershell
   cd scripts
   npm install
   node wipe_legacy_firestore.js
   node seed_feedback.js
   ```

---

## Getting Started

### Prerequisites
* Node.js 18+
* Python 3.10+
* A Firebase Project with Firestore and Authentication enabled

### 1. Set Up the Project
```bash
git clone https://github.com/ankylosaur/PX-Analytics.git
cd PX-Analytics
```

### 2. Configure Environment Variables
Create `.env.local` in the root directory (see [Environment Configuration](#environment-configuration) details).

### 3. Install & Start ML Backend
```powershell
cd backend
pip install -r requirements.txt
python train.py      # Trains PyTorch CNN model on RAVDESS dataset
python api.py        # Starts FastAPI at http://localhost:8000
```

### 4. Install & Launch Frontend App
```powershell
cd "../from Figma"
npm install
npm run dev          # Starts Vite development server
```

Open your browser to `http://localhost:5173`.

---

## Environment Configuration

Set the following variables inside `.env.local` in the project root:

```env
VITE_FIREBASE_API_KEY=your_web_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_fcm_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_google_analytics_id
```

---

## Detailed Dashboard Views

### Executive Overview
* **Interactive Timeline**: Recharts-based Sentiment Trend showing 30-day variations with custom tooltips.
* **Audio Uploader**: Direct upload path supporting `.wav` file selection. Triggers API calculation and logs results to Firestore.
* **KPI Strips**: Visual counts displaying totals, Net Sentiment distributions, and system throughput.

### Specialty Benchmarking
* **Comparative Averages**: Department-by-department comparisons aligned to historical benchmarks.
* **Warning Tables**: Automatic highlighting of negative reviews and process bottlenecks.

### Provider Deep-Dive
* **Radar Charts**: Multi-axis profiles mapping Empathy, Clarity, and Efficiency scores.
* **Attention Areas**: Strength and attention tags flagged by threshold analysis.
