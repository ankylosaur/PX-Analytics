"""
api.py — FastAPI server for the Acoustic Sentiment Engine
POST /analyze-audio accepts a .wav upload and returns Empathy, Clarity,
and Efficiency scores (0–100) by running the trained EmotionCNN and
applying a heuristic mapping layer.
"""

import io
import os
import numpy as np
import torch
import torch.nn.functional as F
import librosa

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from model import EmotionCNN
from dataset import SAMPLE_RATE, DURATION_SEC, N_MFCC, FIXED_LENGTH


# ─── App setup ───
app = FastAPI(
    title="Ambient PX — Acoustic Sentiment Engine",
    version="1.0.0",
    description="Phase 1: Emotion classification → Business metric translation",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Load trained model at startup ───
MODEL_PATH = os.path.join(os.path.dirname(__file__), "best_model.pth")
device = torch.device("cpu")  # inference on CPU for simplicity
model = EmotionCNN(n_classes=8, in_channels=41)

if os.path.exists(MODEL_PATH):
    model.load_state_dict(torch.load(MODEL_PATH, map_location=device))
    print(f"[api] Loaded model weights from {MODEL_PATH}")
else:
    print(f"[api] WARNING: {MODEL_PATH} not found — model is untrained!")

model.to(device)
model.eval()

# ─── Emotion index mapping (0-indexed) ───
# 0=neutral, 1=calm, 2=happy, 3=sad, 4=angry, 5=fearful, 6=disgust, 7=surprised
EMOTION_NAMES = [
    "neutral", "calm", "happy", "sad",
    "angry", "fearful", "disgust", "surprised",
]


def extract_features_from_bytes(audio_bytes: bytes) -> tuple[torch.Tensor, float]:
    """
    Process raw .wav bytes into model-ready features.

    Returns:
        features: torch.FloatTensor of shape (1, 41, FIXED_LENGTH)
        zcr_mean: float — mean zero-crossing rate of the clip
    """
    # Load audio from in-memory bytes
    y, sr = librosa.load(io.BytesIO(audio_bytes), sr=SAMPLE_RATE, mono=True)

    # Pad or truncate to fixed duration
    target_len = SAMPLE_RATE * DURATION_SEC
    if len(y) < target_len:
        y = np.pad(y, (0, target_len - len(y)), mode="constant")
    else:
        y = y[:target_len]

    # Extract MFCCs (40, T) and ZCR (1, T)
    mfccs = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=N_MFCC)
    zcr = librosa.feature.zero_crossing_rate(y=y)
    zcr_mean = float(np.mean(zcr))

    # Stack → (41, T), pad/truncate to FIXED_LENGTH
    features = np.vstack([mfccs, zcr])
    if features.shape[1] < FIXED_LENGTH:
        pad_w = FIXED_LENGTH - features.shape[1]
        features = np.pad(features, ((0, 0), (0, pad_w)), mode="constant")
    else:
        features = features[:, :FIXED_LENGTH]

    tensor = torch.from_numpy(features.astype(np.float32)).unsqueeze(0)  # (1, 41, T)
    return tensor, zcr_mean


def compute_business_metrics(
    probs: np.ndarray,
    zcr_mean: float,
) -> dict[str, int]:
    """
    Heuristic mapping layer: translate raw emotion probabilities + ZCR
    into Empathy, Clarity, and Efficiency scores (0–100).

    Args:
        probs: np.ndarray of shape (8,) — softmax probabilities for each emotion.
               Index: 0=neutral, 1=calm, 2=happy, 3=sad,
                      4=angry, 5=fearful, 6=disgust, 7=surprised
        zcr_mean: float — mean zero-crossing rate of the audio clip.

    Returns:
        dict with keys "Empathy", "Clarity", "Efficiency", each int 0–100.
    """

    p_neutral, p_calm, p_happy, p_sad = probs[0], probs[1], probs[2], probs[3]
    p_angry, p_fearful, p_disgust, p_surprised = probs[4], probs[5], probs[6], probs[7]

    # ── Empathy (0–100) ──
    # Heavily boosted by calm + happy, penalized by angry + fearful
    empathy_raw = (
        50                              # baseline
        + 30 * (p_calm + p_happy)       # positive contributors (max +30)
        + 10 * p_neutral                # neutral is mildly positive
        + 5 * p_surprised               # surprise can indicate engagement
        - 35 * p_angry                  # strong penalty
        - 25 * p_fearful               # fearful tone erodes empathy
        - 15 * p_disgust               # disgust is negative
        - 10 * p_sad                   # sadness slightly negative
    )
    empathy = int(np.clip(empathy_raw, 0, 100))

    # ── Clarity (0–100) ──
    # Derived from Zero-Crossing Rate. Moderate, steady ZCR → high clarity.
    # Typical speech ZCR ranges roughly 0.03–0.12.
    # Sweet spot: ~0.04–0.08 → high scores (80–100)
    # Too high (>0.10): rushed/frantic → penalized
    # Too low (<0.03): mumbling → penalized
    zcr_center = 0.06    # ideal ZCR midpoint
    zcr_sigma = 0.025    # controls width of the "good" band

    # Gaussian-shaped mapping: peaks at zcr_center
    zcr_deviation = (zcr_mean - zcr_center) / zcr_sigma
    clarity_from_zcr = 95 * np.exp(-0.5 * zcr_deviation ** 2)

    # Slight emotional adjustment: angry/fearful speech tends to be less clear
    clarity_emotion_penalty = 10 * (p_angry + p_fearful) + 5 * p_disgust
    clarity_raw = clarity_from_zcr - clarity_emotion_penalty + 5  # small baseline boost
    clarity = int(np.clip(clarity_raw, 0, 100))

    # ── Efficiency (0–100) ──
    # Composite: inversely related to negative emotions, boosted by steady tempo
    negative_load = p_angry + p_fearful + p_disgust + p_sad
    positive_load = p_calm + p_neutral + p_happy

    efficiency_raw = (
        55                                  # baseline
        + 25 * positive_load                # calm, neutral, happy → efficient
        - 40 * negative_load                # frustration/anger kills efficiency
        + 15 * (1.0 - abs(zcr_deviation))   # steady tempo bonus (capped by deviation)
        + 5 * p_surprised                   # mild positive (engagement)
    )
    efficiency = int(np.clip(efficiency_raw, 0, 100))

    return {
        "Empathy": empathy,
        "Clarity": clarity,
        "Efficiency": efficiency,
    }


# ─── API Endpoints ───

@app.get("/health")
def health_check():
    """Simple health check."""
    model_loaded = os.path.exists(MODEL_PATH)
    return {"status": "ok", "model_loaded": model_loaded}


@app.post("/analyze-audio")
async def analyze_audio(file: UploadFile = File(...)):
    """
    Accept a .wav file upload, run emotion classification via the trained
    1D-CNN, and return translated business metrics.

    Returns:
        JSON: {"Empathy": int, "Clarity": int, "Efficiency": int}
    """
    # Validate file type
    if not file.filename.lower().endswith(".wav"):
        raise HTTPException(
            status_code=400,
            detail="Only .wav files are accepted. Please upload a valid WAV audio file.",
        )

    # Read uploaded file bytes
    try:
        audio_bytes = await file.read()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read uploaded file: {e}")

    if len(audio_bytes) < 1000:
        raise HTTPException(status_code=400, detail="Audio file is too small or empty.")

    # Extract features
    try:
        features_tensor, zcr_mean = extract_features_from_bytes(audio_bytes)
    except Exception as e:
        raise HTTPException(
            status_code=422,
            detail=f"Failed to process audio: {e}. Ensure the file is a valid WAV.",
        )

    # Run inference
    with torch.no_grad():
        features_tensor = features_tensor.to(device)
        logits = model(features_tensor)             # (1, 8)
        probs = F.softmax(logits, dim=1).squeeze()  # (8,)
        probs_np = probs.cpu().numpy()

    # Translate to business metrics
    metrics = compute_business_metrics(probs_np, zcr_mean)

    return metrics


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api:app", host="0.0.0.0", port=8000, reload=True)
