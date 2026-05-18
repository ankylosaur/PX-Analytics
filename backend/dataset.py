"""
dataset.py — RAVDESS PyTorch Dataset
Parses RAVDESS filenames, extracts MFCC + ZCR features via librosa,
and pads/truncates to a fixed length for batching.
"""

import os
import glob
import numpy as np
import librosa
import torch
from torch.utils.data import Dataset


# RAVDESS emotion mapping (3rd field in filename, 1-indexed)
EMOTION_LABELS = {
    1: "neutral",
    2: "calm",
    3: "happy",
    4: "sad",
    5: "angry",
    6: "fearful",
    7: "disgust",
    8: "surprised",
}

# Audio processing constants
SAMPLE_RATE = 22050
DURATION_SEC = 4          # fixed clip length in seconds
N_MFCC = 40               # MFCC coefficients
FIXED_LENGTH = 173         # ~4 s at sr=22050 with hop_length=512 → ceil(4*22050/512)


def extract_features(filepath: str) -> tuple[np.ndarray, float]:
    """
    Load a .wav file and extract:
      - MFCCs (40 coefficients × T frames)
      - Mean Zero-Crossing Rate (scalar)

    Returns:
        features: np.ndarray of shape (41, FIXED_LENGTH)
                  — 40 MFCC rows + 1 ZCR row, padded/truncated to FIXED_LENGTH
        zcr_mean: float — mean ZCR across the clip (used later by the heuristic layer)
    """
    # Load audio, resample to target SR, mono
    y, sr = librosa.load(filepath, sr=SAMPLE_RATE, mono=True)

    # Pad or truncate raw waveform to fixed duration
    target_len = SAMPLE_RATE * DURATION_SEC
    if len(y) < target_len:
        y = np.pad(y, (0, target_len - len(y)), mode="constant")
    else:
        y = y[:target_len]

    # Extract MFCCs: shape (n_mfcc, T)
    mfccs = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=N_MFCC)

    # Extract ZCR: shape (1, T)
    zcr = librosa.feature.zero_crossing_rate(y=y)

    # Compute mean ZCR for the heuristic mapping layer
    zcr_mean = float(np.mean(zcr))

    # Stack: (41, T)
    features = np.vstack([mfccs, zcr])

    # Pad or truncate along time axis to FIXED_LENGTH
    if features.shape[1] < FIXED_LENGTH:
        pad_width = FIXED_LENGTH - features.shape[1]
        features = np.pad(features, ((0, 0), (0, pad_width)), mode="constant")
    else:
        features = features[:, :FIXED_LENGTH]

    return features.astype(np.float32), zcr_mean


def parse_ravdess_emotion(filepath: str) -> int:
    """
    Extract the emotion label (0-indexed) from a RAVDESS filename.
    Filename format: 03-01-{emotion}-...-.wav
    The 3rd dash-separated integer encodes the emotion (1–8).
    Returns 0–7 for use as a class index.
    """
    basename = os.path.basename(filepath)
    parts = basename.replace(".wav", "").split("-")
    emotion_code = int(parts[2])  # 1-indexed in filename
    return emotion_code - 1       # convert to 0-indexed


class RAVDESSDataset(Dataset):
    """
    PyTorch Dataset for the RAVDESS speech emotion corpus.

    Args:
        root_dir: path to the RAVDESS root folder containing Actor_XX subdirs.
        preload: if True, extract all features on init (faster training, more RAM).
    """

    def __init__(self, root_dir: str, preload: bool = True):
        self.root_dir = root_dir
        self.preload = preload

        # Collect all .wav file paths
        self.filepaths = sorted(
            glob.glob(os.path.join(root_dir, "Actor_*", "*.wav"))
        )

        if len(self.filepaths) == 0:
            raise FileNotFoundError(
                f"No .wav files found in {root_dir}/Actor_*/. "
                "Ensure the RAVDESS dataset is extracted correctly."
            )

        # Parse emotion labels
        self.labels = [parse_ravdess_emotion(fp) for fp in self.filepaths]

        # Optional: preload all features into memory
        self._cache: list[tuple[np.ndarray, float]] | None = None
        if preload:
            print(f"[dataset] Preloading {len(self.filepaths)} audio files...")
            self._cache = [extract_features(fp) for fp in self.filepaths]
            print(f"[dataset] Done. Feature shape per sample: {self._cache[0][0].shape}")

    def __len__(self) -> int:
        return len(self.filepaths)

    def __getitem__(self, idx: int) -> dict:
        """
        Returns:
            dict with keys:
                "features" : torch.FloatTensor of shape (41, FIXED_LENGTH)
                "label"    : torch.LongTensor scalar (0–7)
                "zcr_mean" : float (mean zero-crossing rate)
        """
        if self._cache is not None:
            features, zcr_mean = self._cache[idx]
        else:
            features, zcr_mean = extract_features(self.filepaths[idx])

        return {
            "features": torch.from_numpy(features),
            "label": torch.tensor(self.labels[idx], dtype=torch.long),
            "zcr_mean": zcr_mean,
        }


if __name__ == "__main__":
    # Quick sanity check
    import sys

    data_root = sys.argv[1] if len(sys.argv) > 1 else "../datasets/RAVDESS"
    ds = RAVDESSDataset(data_root, preload=True)
    sample = ds[0]
    print(f"Total samples : {len(ds)}")
    print(f"Feature shape : {sample['features'].shape}")
    print(f"Label         : {sample['label'].item()} ({EMOTION_LABELS[sample['label'].item() + 1]})")
    print(f"ZCR mean      : {sample['zcr_mean']:.6f}")
