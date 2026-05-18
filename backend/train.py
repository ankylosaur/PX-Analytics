"""
train.py — Training script for the EmotionCNN on RAVDESS
80/20 train/val split, CrossEntropyLoss, Adam optimizer.
Saves the best model weights to best_model.pth.
"""

import os
import sys
import time
import torch
import torch.nn as nn
from torch.utils.data import DataLoader, random_split

from dataset import RAVDESSDataset
from model import EmotionCNN, count_parameters


# ─── Hyperparameters ───
BATCH_SIZE = 32
LEARNING_RATE = 1e-3
NUM_EPOCHS = 40
WEIGHT_DECAY = 1e-4
TRAIN_SPLIT = 0.8
RANDOM_SEED = 42

# ─── Paths ───
DATASET_ROOT = os.path.join(os.path.dirname(__file__), "..", "datasets", "RAVDESS")
SAVE_PATH = os.path.join(os.path.dirname(__file__), "best_model.pth")


def collate_fn(batch: list[dict]) -> tuple[torch.Tensor, torch.Tensor]:
    """Custom collate that stacks features and labels from dict-style samples."""
    features = torch.stack([item["features"] for item in batch])
    labels = torch.stack([item["label"] for item in batch])
    return features, labels


def train_one_epoch(
    model: nn.Module,
    loader: DataLoader,
    criterion: nn.Module,
    optimizer: torch.optim.Optimizer,
    device: torch.device,
) -> tuple[float, float]:
    """Run one training epoch. Returns (avg_loss, accuracy)."""
    model.train()
    running_loss = 0.0
    correct = 0
    total = 0

    for features, labels in loader:
        features, labels = features.to(device), labels.to(device)

        optimizer.zero_grad()
        logits = model(features)
        loss = criterion(logits, labels)
        loss.backward()
        optimizer.step()

        running_loss += loss.item() * features.size(0)
        preds = logits.argmax(dim=1)
        correct += (preds == labels).sum().item()
        total += labels.size(0)

    avg_loss = running_loss / total
    accuracy = correct / total
    return avg_loss, accuracy


@torch.no_grad()
def validate(
    model: nn.Module,
    loader: DataLoader,
    criterion: nn.Module,
    device: torch.device,
) -> tuple[float, float]:
    """Run validation. Returns (avg_loss, accuracy)."""
    model.eval()
    running_loss = 0.0
    correct = 0
    total = 0

    for features, labels in loader:
        features, labels = features.to(device), labels.to(device)

        logits = model(features)
        loss = criterion(logits, labels)

        running_loss += loss.item() * features.size(0)
        preds = logits.argmax(dim=1)
        correct += (preds == labels).sum().item()
        total += labels.size(0)

    avg_loss = running_loss / total
    accuracy = correct / total
    return avg_loss, accuracy


def main():
    # ── Device ──
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"[train] Using device: {device}")

    # ── Dataset & splits ──
    dataset_path = sys.argv[1] if len(sys.argv) > 1 else DATASET_ROOT
    dataset_path = os.path.abspath(dataset_path)
    print(f"[train] Loading dataset from: {dataset_path}")

    full_dataset = RAVDESSDataset(dataset_path, preload=True)
    total = len(full_dataset)
    n_train = int(total * TRAIN_SPLIT)
    n_val = total - n_train

    generator = torch.Generator().manual_seed(RANDOM_SEED)
    train_set, val_set = random_split(full_dataset, [n_train, n_val], generator=generator)

    train_loader = DataLoader(
        train_set, batch_size=BATCH_SIZE, shuffle=True, collate_fn=collate_fn,
        num_workers=0, pin_memory=(device.type == "cuda"),
    )
    val_loader = DataLoader(
        val_set, batch_size=BATCH_SIZE, shuffle=False, collate_fn=collate_fn,
        num_workers=0, pin_memory=(device.type == "cuda"),
    )

    print(f"[train] Train: {n_train} samples | Val: {n_val} samples")

    # ── Model, loss, optimizer ──
    model = EmotionCNN(n_classes=8, in_channels=41).to(device)
    print(f"[train] Model parameters: {count_parameters(model):,}")

    criterion = nn.CrossEntropyLoss()
    optimizer = torch.optim.Adam(
        model.parameters(), lr=LEARNING_RATE, weight_decay=WEIGHT_DECAY
    )
    scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(
        optimizer, mode="min", factor=0.5, patience=5
    )

    # ── Training loop ──
    best_val_acc = 0.0
    print(f"\n{'Epoch':>6}  {'Train Loss':>11}  {'Train Acc':>10}  {'Val Loss':>9}  {'Val Acc':>8}  {'Time':>6}")
    print("-" * 65)

    for epoch in range(1, NUM_EPOCHS + 1):
        t0 = time.time()

        train_loss, train_acc = train_one_epoch(
            model, train_loader, criterion, optimizer, device
        )
        val_loss, val_acc = validate(model, val_loader, criterion, device)

        scheduler.step(val_loss)

        elapsed = time.time() - t0

        # Save best model
        marker = ""
        if val_acc > best_val_acc:
            best_val_acc = val_acc
            torch.save(model.state_dict(), SAVE_PATH)
            marker = "  * saved"

        print(
            f"{epoch:>6d}  "
            f"{train_loss:>11.4f}  "
            f"{train_acc:>9.1%}  "
            f"{val_loss:>9.4f}  "
            f"{val_acc:>7.1%}"
            f"{elapsed:>6.1f}s"
            f"{marker}"
        )

    print(f"\n[train] Best validation accuracy: {best_val_acc:.1%}")
    print(f"[train] Model saved to: {os.path.abspath(SAVE_PATH)}")


if __name__ == "__main__":
    main()
