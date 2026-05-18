"""
model.py — Lightweight 1D-CNN for RAVDESS Emotion Classification
3 convolutional blocks (Conv1d → BatchNorm → ReLU → MaxPool)
followed by adaptive pooling and a 2-layer FC classifier head.
Designed for fast CPU inference.
"""

import torch
import torch.nn as nn


class EmotionCNN(nn.Module):
    """
    1D Convolutional Neural Network for acoustic emotion recognition.

    Input:  (batch, 41, T)  — 40 MFCCs + 1 ZCR channel
    Output: (batch, 8)      — logits for 8 RAVDESS emotion classes

    Architecture:
        Block 1: Conv1d(41→64)  → BN → ReLU → MaxPool(2)
        Block 2: Conv1d(64→128) → BN → ReLU → MaxPool(2)
        Block 3: Conv1d(128→128) → BN → ReLU → AdaptiveAvgPool(1)
        Head:    Dropout → Linear(128→64) → ReLU → Dropout → Linear(64→8)
    """

    def __init__(self, n_classes: int = 8, in_channels: int = 41):
        super().__init__()

        # ── Convolutional feature extractor ──
        self.conv_blocks = nn.Sequential(
            # Block 1
            nn.Conv1d(in_channels, 64, kernel_size=5, padding=2),
            nn.BatchNorm1d(64),
            nn.ReLU(inplace=True),
            nn.MaxPool1d(kernel_size=2),

            # Block 2
            nn.Conv1d(64, 128, kernel_size=5, padding=2),
            nn.BatchNorm1d(128),
            nn.ReLU(inplace=True),
            nn.MaxPool1d(kernel_size=2),

            # Block 3
            nn.Conv1d(128, 128, kernel_size=3, padding=1),
            nn.BatchNorm1d(128),
            nn.ReLU(inplace=True),
            nn.AdaptiveAvgPool1d(1),  # → (batch, 128, 1)
        )

        # ── Fully connected classifier head ──
        self.classifier = nn.Sequential(
            nn.Dropout(0.3),
            nn.Linear(128, 64),
            nn.ReLU(inplace=True),
            nn.Dropout(0.2),
            nn.Linear(64, n_classes),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """
        Args:
            x: (batch, 41, T) — batched feature tensors
        Returns:
            logits: (batch, 8)
        """
        x = self.conv_blocks(x)   # → (batch, 128, 1)
        x = x.squeeze(-1)         # → (batch, 128)
        x = self.classifier(x)    # → (batch, 8)
        return x


def count_parameters(model: nn.Module) -> int:
    """Return the total number of trainable parameters."""
    return sum(p.numel() for p in model.parameters() if p.requires_grad)


if __name__ == "__main__":
    # Quick architecture check
    model = EmotionCNN()
    print(model)
    print(f"\nTrainable parameters: {count_parameters(model):,}")

    # Test forward pass with dummy input
    dummy = torch.randn(4, 41, 173)  # batch=4, channels=41, time=173
    out = model(dummy)
    print(f"Input shape : {dummy.shape}")
    print(f"Output shape: {out.shape}")  # expect (4, 8)
