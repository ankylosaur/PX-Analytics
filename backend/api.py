"""
PX Analytics — Feedback Processing Engine
==========================================

Production-ready FastAPI server that processes patient audio feedback
through a three-stage pipeline:

    1. **Speech-to-Text (STT):** OpenAI Whisper API transcribes audio.
    2. **LLM Analysis:** GPT-4o extracts sentiment, summary, and pain points.
    3. **Persistence:** Results are stored in Google Cloud Firestore.

Version: 2.0.0
"""

from __future__ import annotations

import json
import logging
import os
from typing import Any, Dict
from uuid import uuid4

from dotenv import load_dotenv
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

# ---------------------------------------------------------------------------
# Environment & Logging
# ---------------------------------------------------------------------------

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
)
logger = logging.getLogger("px-analytics")

# ---------------------------------------------------------------------------
# OpenAI Client Initialisation
# ---------------------------------------------------------------------------

OPENAI_API_KEY: str | None = os.getenv("OPENAI_API_KEY")

openai_client = None
if OPENAI_API_KEY:
    from openai import OpenAI

    openai_client = OpenAI(api_key=OPENAI_API_KEY)
    logger.info("OpenAI client initialised successfully.")
else:
    logger.warning(
        "OPENAI_API_KEY is not set. Whisper and LLM endpoints will be unavailable."
    )

# ---------------------------------------------------------------------------
# Firebase Admin SDK Initialisation
# ---------------------------------------------------------------------------

FIREBASE_SERVICE_ACCOUNT_PATH: str | None = os.getenv("FIREBASE_SERVICE_ACCOUNT_PATH")

db = None
if FIREBASE_SERVICE_ACCOUNT_PATH:
    try:
        import firebase_admin
        from firebase_admin import credentials, firestore

        cred = credentials.Certificate(FIREBASE_SERVICE_ACCOUNT_PATH)
        firebase_admin.initialize_app(cred)
        db = firestore.client()
        logger.info("Firebase Admin SDK initialised — Firestore client ready.")
    except Exception:
        logger.exception("Failed to initialise Firebase Admin SDK.")
else:
    logger.warning(
        "FIREBASE_SERVICE_ACCOUNT_PATH is not set. Firestore persistence will be unavailable."
    )

# ---------------------------------------------------------------------------
# FastAPI Application
# ---------------------------------------------------------------------------

app = FastAPI(
    title="PX Analytics — Feedback Processing Engine",
    version="2.0.0",
    description=(
        "Processes patient audio feedback through Whisper STT, GPT-4o analysis, "
        "and persists structured results to Firestore."
    ),
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Dev mode — tighten for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# System prompt used for GPT-4o feedback analysis
# ---------------------------------------------------------------------------

_ANALYSIS_SYSTEM_PROMPT: str = (
    "You are a medical feedback analyst. Analyze the following patient feedback "
    "transcript. Return a JSON object with exactly three keys: "
    "'sentiment' (strictly one of: 'Positive', 'Neutral', or 'Negative'), "
    "'summary' (2-3 concise sentences summarizing the feedback), and "
    "'pain_points' (an array of short strings representing specific complaints "
    "or issues mentioned, empty array if none)."
)

# Allowed audio extensions for upload
_ALLOWED_EXTENSIONS: set[str] = {".wav", ".mp3"}


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@app.get("/health", tags=["Ops"])
async def health_check() -> Dict[str, Any]:
    """Return service health status including readiness of Whisper and LLM."""
    return {
        "status": "ok",
        "whisper_ready": openai_client is not None,
        "llm_ready": openai_client is not None,
    }


@app.post("/process-feedback", status_code=201, tags=["Feedback"])
async def process_feedback(
    file: UploadFile = File(..., description="Patient audio file (.wav or .mp3)"),
    patient_name: str = Form(..., description="Name of the patient"),
    doctor_id: str = Form(..., description="Identifier for the attending doctor"),
    department: str = Form(..., description="Hospital department"),
) -> Dict[str, Any]:
    """Process an audio feedback file through the full STT → LLM → Firestore pipeline.

    **Pipeline stages:**

    1. Validate the uploaded file extension.
    2. Transcribe audio via OpenAI Whisper.
    3. Analyse transcript with GPT-4o for sentiment, summary, and pain points.
    4. Persist structured results to Firestore.
    5. Return the complete feedback record.
    """

    # ----- Validate file extension -----
    file_ext = _get_file_extension(file.filename)
    if file_ext not in _ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{file_ext}'. Allowed: {_ALLOWED_EXTENSIONS}",
        )

    # ----- Step A: Speech-to-Text via Whisper -----
    transcript: str = await _transcribe_audio(file)

    # ----- Step B: LLM Analysis via GPT-4o -----
    analysis: Dict[str, Any] = _analyse_transcript(transcript)

    # ----- Step C: Persist to Firestore -----
    feedback_record: Dict[str, Any] = _save_to_firestore(
        patient_name=patient_name,
        doctor_id=doctor_id,
        department=department,
        transcript=transcript,
        analysis=analysis,
    )

    logger.info("Feedback %s processed successfully.", feedback_record["feedback_id"])
    return feedback_record


# ---------------------------------------------------------------------------
# Pipeline helpers
# ---------------------------------------------------------------------------


def _get_file_extension(filename: str | None) -> str:
    """Extract the lowercased file extension (including the dot) from a filename.

    Args:
        filename: Original filename from the upload, may be ``None``.

    Returns:
        Lowercased extension string, e.g. ``".wav"``.  Returns ``""`` if
        filename is ``None`` or has no extension.
    """
    if not filename:
        return ""
    _, ext = os.path.splitext(filename)
    return ext.lower()


async def _transcribe_audio(file: UploadFile) -> str:
    """Transcribe an uploaded audio file using OpenAI Whisper-1.

    Args:
        file: The uploaded audio ``UploadFile`` instance.

    Returns:
        The transcribed text.

    Raises:
        HTTPException: 500 if the Whisper API call fails.
    """
    if openai_client is None:
        raise HTTPException(
            status_code=500,
            detail="Speech-to-text processing failed: OpenAI client not initialised.",
        )

    try:
        audio_bytes = await file.read()
        transcription = openai_client.audio.transcriptions.create(
            model="whisper-1",
            file=(file.filename, audio_bytes),
        )
        transcript_text: str = transcription.text
        logger.info(
            "Whisper transcription completed (%d chars).", len(transcript_text)
        )
        return transcript_text
    except Exception:
        logger.exception("Whisper API call failed.")
        raise HTTPException(
            status_code=500,
            detail="Speech-to-text processing failed",
        )


def _analyse_transcript(transcript: str) -> Dict[str, Any]:
    """Send the transcript to GPT-4o for sentiment analysis.

    Args:
        transcript: Plain-text patient feedback transcript.

    Returns:
        Parsed JSON dict with keys ``sentiment``, ``summary``, ``pain_points``.

    Raises:
        HTTPException: 500 if the LLM call or JSON parsing fails.
    """
    if openai_client is None:
        raise HTTPException(
            status_code=500,
            detail="Feedback analysis failed: OpenAI client not initialised.",
        )

    # --- Call GPT-4o ---
    try:
        completion = openai_client.chat.completions.create(
            model="gpt-4o",
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": _ANALYSIS_SYSTEM_PROMPT},
                {"role": "user", "content": transcript},
            ],
        )
        raw_content: str = completion.choices[0].message.content
    except Exception:
        logger.exception("GPT-4o API call failed.")
        raise HTTPException(
            status_code=500,
            detail="Feedback analysis failed",
        )

    # --- Parse the JSON response ---
    try:
        analysis: Dict[str, Any] = json.loads(raw_content)
    except (json.JSONDecodeError, TypeError):
        logger.exception("Failed to parse GPT-4o JSON response: %s", raw_content)
        raise HTTPException(
            status_code=500,
            detail="Failed to parse analysis results",
        )

    logger.info("LLM analysis complete — sentiment: %s", analysis.get("sentiment"))
    return analysis


def _save_to_firestore(
    *,
    patient_name: str,
    doctor_id: str,
    department: str,
    transcript: str,
    analysis: Dict[str, Any],
) -> Dict[str, Any]:
    """Persist a structured feedback record to the ``patient_feedback`` Firestore collection.

    Args:
        patient_name: Name of the patient.
        doctor_id: Attending doctor identifier.
        department: Hospital department.
        transcript: Whisper-generated transcript.
        analysis: Parsed LLM analysis dict.

    Returns:
        The feedback record dict that was written (with ``timestamp`` replaced
        by the string ``"SERVER_TIMESTAMP"`` for the JSON response, since the
        actual server timestamp is resolved server-side).

    Raises:
        HTTPException: 500 if the Firestore write fails.
    """
    from firebase_admin import firestore as _firestore

    if db is None:
        raise HTTPException(
            status_code=500,
            detail="Failed to save feedback: Firestore client not initialised.",
        )

    feedback_id = f"FB-{uuid4().hex[:6].upper()}"

    record: Dict[str, Any] = {
        "feedback_id": feedback_id,
        "timestamp": _firestore.SERVER_TIMESTAMP,
        "patient_name": patient_name,
        "doctor_id": doctor_id,
        "department": department,
        "transcript": transcript,
        "sentiment": analysis.get("sentiment", "Unknown"),
        "summary": analysis.get("summary", ""),
        "pain_points": analysis.get("pain_points", []),
    }

    try:
        db.collection("patient_feedback").document(feedback_id).set(record)
        logger.info("Firestore document %s written.", feedback_id)
    except Exception:
        logger.exception("Firestore write failed for feedback %s.", feedback_id)
        raise HTTPException(
            status_code=500,
            detail="Failed to save feedback",
        )

    # Replace server sentinel with a JSON-serialisable placeholder for the response
    response_record = {**record, "timestamp": "SERVER_TIMESTAMP"}
    return response_record


# ---------------------------------------------------------------------------
# Entrypoint
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import uvicorn

    uvicorn.run("api:app", host="0.0.0.0", port=8000, reload=True)
