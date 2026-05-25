# Ambient PX Analytics

> **An AI-powered patient experience (PX) analytics dashboard that transcribes ambient clinician-patient consultation recordings and extracts structured sentiment data using OpenAI Whisper and GPT-4o — eliminating the need for traditional post-visit surveys.**

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Acoustic & Sentiment Pipeline](#acoustic--sentiment-pipeline)
  - [Speech-to-Text (STT) via Whisper](#speech-to-text-stt-via-whisper)
  - [Clinical Text Analysis via GPT-4o](#clinical-text-analysis-via-gpt-4o)
  - [Database Persistence](#database-persistence)
- [Firebase & Firestore Database Architecture](#firebase--firestore-database-architecture)
  - [Firestore Collections](#firestore-collections)
  - [Role-Based Access Control (RBAC)](#role-based-access-control-rbac)
- [Frontend Real-time Query Architecture](#frontend-real-time-query-architecture)
  - [Client-Side In-Memory Filtering](#client-side-in-memory-filtering)
  - [Derived Metric Computations](#derived-metric-computations)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Security & Rule Configurations](#security--rule-configurations)

---

## Overview

Traditional healthcare patient experience measurement relies on post-visit surveys with low average capture rates (~5%). Ambient PX Analytics resolves this by capturing ambient consultation audio in real time, achieving **100% capture** without patient or provider effort.

The platform uploads consultation recordings through a FastAPI backend which transcribes the audio via OpenAI Whisper, analyzes the transcript with GPT-4o to categorize sentiment (Positive, Neutral, or Negative), and generates a concise, executive clinical summary and pain point list. Results are persisted to Cloud Firestore and instantly visualised across the admin dashboard.

---

## Architecture

```
                               ┌────────────────────────────────┐
                               │         React Frontend         │
                               │   (Vite + Tailwind + Recharts)  │
                               └───────────────┬────────────────┘
                                               │ (Real-time snapshots)
                ┌──────────────────────────────┼──────────────────────────────┐
                │ (User Uploads Audio)         │                              │
                ▼                              ▼                              ▼
     ┌──────────────────────┐        ┌──────────────────┐           ┌──────────────────┐
     │  FastAPI Backend API │        │  Firebase Auth   │           │  Cloud Firestore │
     │   (localhost:8000)   │        │  (RBAC: Admin /  │           │   (Collections:  │
     └──────────┬───────────┘        │   Provider)      │           │  patient_feedback,│
                │                    └──────────────────┘           │    users)        │
                │                                                   └────────▲─────────┘
                ├────────────────────────────────────────────────────────────┤
                │ 1. Transcribe audio (Whisper API)                          │ (Persist results)
                │ 2. Analyze sentiment & summarize (GPT-4o)                   │
                │ 3. Save structured feedback record ────────────────────────┘
```

> **Fallback Mode (Demo Mode)**: If the FastAPI backend is unreachable or offline, the React client automatically downgrades to **Demo Mode**, performing mock transcription/analysis client-side and writing directly to Firestore to ensure continuous uptime and preview capabilities.

---

## Tech Stack

### Frontend
* **UI & Logic**: React (v18.3.1), Vite (v6.3.5)
* **Styling**: Tailwind CSS (v4) for transitions, theme customisation, and utility styling
* **Charts**: Recharts (v2.15.2) — Custom SVG Area charts and Pie breakdowns
* **Icons**: Lucide React (v0.487.0)
* **Database Client**: Firebase Web SDK (v11)

### Backend (Feedback Processing Engine)
* **Runtime**: Python 3.13
* **Framework**: FastAPI + Uvicorn
* **API Orchestration**: OpenAI SDK (Whisper STT + GPT-4o)
* **Database Write SDK**: Firebase Admin SDK (Python)
* **Utility**: python-dotenv

### Database & Security
* **Authentication**: Firebase Authentication
* **Database**: Cloud Firestore NoSQL

---

## Project Structure

```
EY Patient Experience/
│
├── .env.local                    # Firebase web client environment variables (gitignored)
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
│       │   ├── firebase.js       # Firebase Web SDK initialization
│       │   └── firestore.js      # Firestore helper methods & references
│       ├── hooks/
│       │   └── useFeedbackData.js # Real-time query listeners & client filtering
│       └── app/
│           ├── App.tsx           # Dashboard main structure and tabs shell
│           ├── contexts/
│           │   └── AuthContext.jsx  # Authentication state & provider
│           ├── styles/
│           │   ├── fonts.css
│           │   ├── globals.css
│           │   ├── index.css
│           │   ├── tailwind.css
│           │   └── theme.css
│           └── components/
│               ├── AdminDashboard.tsx       # Core dashboard panel layout
│               ├── AudioUploadModal.tsx     # Audio upload & pipeline driver
│               ├── DoctorProfileModal.tsx   # Detailed doctor statistics view
│               ├── PatientProfileModal.tsx  # Detailed patient summary view
│               ├── FeedbackDetailPanel.tsx  # Side panel details card
│               ├── FeedbackTable.tsx        # Responsive grid data table
│               ├── FilterBar.tsx            # Sentiment & category drop-down filters
│               ├── KPIBar.tsx               # Top-level indicators (Feedbacks, Sentiment, Pain Points)
│               └── SentimentTrendChart.tsx  # Trend visualization chart
│
├── backend/                      # FastAPI Backend Engine
│   ├── requirements.txt          # Python dependencies
│   ├── api.py                    # Server endpoints, Whisper & GPT-4o orchestration
│   └── .env                      # OpenAI API key & Firebase Account path (gitignored)
│
└── scripts/                      # Utility Database Scripts
    ├── seed_feedback.js          # Firestore database seeder
    ├── wipe_legacy_firestore.js  # Clears existing Firestore collections
    ├── package.json
    └── serviceAccountKey.json    # Admin credentials key (gitignored)
```

---

## Acoustic & Sentiment Pipeline

When an audio file is uploaded to the `/process-feedback` endpoint in `backend/api.py`, it passes through a three-stage pipeline:

### Speech-to-Text (STT) via Whisper
The uploaded file (`.wav` or `.mp3`) is processed by OpenAI's Whisper API using the audio transcriptions model:
```python
transcription = openai_client.audio.transcriptions.create(
    model="whisper-1",
    file=(file.filename, audio_bytes),
)
```
* **Output**: Plain-text transcript string of the consultation session.

### Clinical Text Analysis via GPT-4o
The plain-text transcript is passed to GPT-4o with instructions to analyze and format a JSON response.
* **System Prompt**:
  > *You are a clinical database analyst. Analyze the patient feedback transcript. Return a raw JSON object only (no markdown, no preamble) with exactly three keys:*
  > 1. `'sentiment'`: strictly one of 'Positive', 'Neutral', or 'Negative'.
  > 2. `'summary'`: 1 to 2 sentences summarizing the feedback (maximum 30 words). Style must be objective, administrative, and clipped. Structure: [Primary Sentiment Driver] + [Specific Incident/Context]. Do NOT use filler phrases like 'The patient stated', 'This feedback highlights', 'The patient felt', or 'Overall'.
  > 3. `'pain_points'`: an array of short strings representing specific complaints mentioned, empty if none.

### Database Persistence
If the Firebase Admin SDK is initialized on the backend, the structured output is stored directly in Cloud Firestore.

---

## Firebase & Firestore Database Architecture

### Firestore Collections

#### `users`
Tracks administrator and clinician user credentials and authorization roles.
```json
{
  "uid": "firebase_auth_uid",
  "email": "dr.patel@hospital.com",
  "role": "admin | provider",
  "provider_id": "dr-patel",
  "displayName": "Dr. Aarav Patel"
}
```

#### `patient_feedback`
Contains transcripts, summaries, sentiment labels, tags, and physician assignments.
```json
{
  "feedback_id": "FB-XXXXXX",
  "timestamp": "Firestore Timestamp",
  "patient_name": "Amit Sharma",
  "doctor_id": "Dr. Aarav Patel",
  "department": "Cardiology",
  "transcript": "Full consultation text log...",
  "sentiment": "Positive | Neutral | Negative",
  "summary": "AI summary text mapping key findings...",
  "pain_points": ["Wait Time", "Billing Errors"]
}
```

### Role-Based Access Control (RBAC)
* **Admin**: Authorized to read all feedback logs, view charts, and perform upload simulations.
* **Provider**: Authorized to view feedback logs associated strictly with their `provider_id`.

---

## Frontend Real-time Query Architecture

### Client-Side In-Memory Filtering
To avoid requiring composite indexes in Cloud Firestore for complex multi-field filter combinations, the frontend queries all feedbacks sorted by a single field (timestamp) using a real-time Firestore `onSnapshot` listener in `useFeedbackData.js`. 

Subsequent filtering (by Date Range, Sentiment, Department, Doctor, or Patient Search Queries) is performed **in-memory** on the client, ensuring snappy response rates and simple database requirements.

### Derived Metric Computations
The `useFeedbackData.js` hook calculates the following properties dynamically:
* **Sentiment Breakdown**: Calculates absolute volumes and rounded percentage values for positive, neutral, and negative logs to feed the donut chart.
* **Trending Pain Points**: Collects all strings in `pain_points` arrays, aggregates occurrences, and outputs a sorted array of objects (descending by frequency).
* **Unique Doctors / Departments**: Collects valid entries from the currently synced collection to dynamically populate dashboard filter dropdown elements.

---

## Getting Started

### Prerequisites
* Node.js 18+
* Python 3.10+
* Firebase Project with Firestore and Auth services enabled

### 1. Set Up the Project
```bash
git clone https://github.com/ankylosaur/PX-Analytics.git
cd PX-Analytics
```

### 2. Configure Environment Variables
* Configure the frontend env variables inside `from Figma/.env.local`.
* Configure the backend env variables inside `backend/.env`.

### 3. Install & Start Backend API
```powershell
cd backend
pip install -r requirements.txt
python api.py        # Starts FastAPI server at http://localhost:8000
```

### 4. Install & Launch Frontend App
```powershell
cd "../from Figma"
npm install
npm run dev          # Starts Vite development server
```

Open `http://localhost:5173`.

---

## Environment Variables

### Frontend (`from Figma/.env.local`)
```env
VITE_FIREBASE_API_KEY=your_firebase_web_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_google_analytics_id
```

### Backend (`backend/.env`)
```env
OPENAI_API_KEY=your_openai_api_key
FIREBASE_SERVICE_ACCOUNT_PATH=path/to/serviceAccountKey.json
```

---

## Security & Rule Configurations

### Firestore Security Rules
Applied inside `from Figma/firestore.rules`:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      allow read: if request.auth != null && 
        (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == "admin" ||
         !exists(/databases/$(database)/documents/users/$(request.auth.uid)));
    }
    match /patient_feedback/{feedbackId} {
      allow read, write: if request.auth != null;
    }
  }
}
```
