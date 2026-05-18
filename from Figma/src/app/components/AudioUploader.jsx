/**
 * AudioUploader.jsx — Corporate Minimalist audio upload + ML orchestration
 *
 * Flow:
 *   1. User selects a .wav file
 *   2. File is sent to FastAPI (localhost:8000/analyze-audio) for ML inference
 *   3. Returned metrics are written to Firestore consultations collection
 *   4. UI shows success state with scores
 */

import { useState, useRef } from "react";
import { Upload, FileAudio, Loader2, CheckCircle2, AlertCircle, X } from "lucide-react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useAuth } from "../contexts/AuthContext";

const FASTAPI_URL = "http://localhost:8000/analyze-audio";

export default function AudioUploader() {
  const { profile } = useAuth();
  const fileInputRef = useRef(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | analyzing | saving | success | error
  const [metrics, setMetrics] = useState(null);  // { Empathy, Clarity, Efficiency }
  const [errorMsg, setErrorMsg] = useState("");

  /**
   * Handle file selection — validate it's a .wav
   */
  function handleFileSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".wav")) {
      setErrorMsg("Please select a valid .wav audio file.");
      setStatus("error");
      return;
    }

    setSelectedFile(file);
    setStatus("idle");
    setMetrics(null);
    setErrorMsg("");
  }

  /**
   * Clear the selected file and reset state
   */
  function clearFile() {
    setSelectedFile(null);
    setStatus("idle");
    setMetrics(null);
    setErrorMsg("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  /**
   * Orchestration: FastAPI inference → Firestore write
   */
  async function handleAnalyze() {
    if (!selectedFile) return;

    try {
      // ── Step 1: Send to FastAPI ──
      setStatus("analyzing");
      setErrorMsg("");

      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch(FASTAPI_URL, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.detail || `FastAPI returned ${response.status}`);
      }

      const scores = await response.json();
      // scores = { Empathy: int, Clarity: int, Efficiency: int }
      setMetrics(scores);

      // ── Step 2: Write to Firestore ──
      setStatus("saving");

      const providerId = profile?.provider_id || "unknown";

      await addDoc(collection(db, "consultations"), {
        timestamp: serverTimestamp(),
        provider_id: providerId,
        patient_anxiety_flag: scores.Empathy < 50, // auto-flag low empathy
        metrics: {
          Empathy: scores.Empathy,
          Clarity: scores.Clarity,
          Efficiency: scores.Efficiency,
        },
        source_filename: selectedFile.name,
        analyzed_by: profile?.uid || "anonymous",
      });

      // ── Step 3: Success ──
      setStatus("success");

      // Auto-clear after 5 seconds
      setTimeout(() => {
        clearFile();
      }, 5000);

    } catch (err) {
      console.error("[AudioUploader] Error:", err);

      // Distinguish error types for the user
      let message = err.message || "An unexpected error occurred.";
      if (err.name === "TypeError" && err.message.includes("fetch")) {
        message = "Cannot reach the ML server. Ensure FastAPI is running on port 8000.";
      } else if (err.code === "permission-denied") {
        message = "Firebase permission denied. Check your Firestore security rules.";
      }

      setErrorMsg(message);
      setStatus("error");
    }
  }

  // ── Status label text ──
  const STATUS_LABELS = {
    idle: "Ready",
    analyzing: "Analyzing acoustic sentiment via Y-Split processing...",
    saving: "Saving metrics to database...",
    success: "Analysis complete — metrics saved",
    error: "Analysis failed",
  };

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-[4px] p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-sm font-semibold text-[#111827]">
            Audio Consultation Upload
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Upload a .wav recording for real-time acoustic sentiment analysis
          </p>
        </div>
        {status !== "idle" && status !== "error" && (
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
            status === "success"
              ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
              : "bg-blue-50 text-blue-600 border border-blue-100"
          }`}>
            {STATUS_LABELS[status]}
          </span>
        )}
      </div>

      {/* File Drop Zone */}
      {!selectedFile ? (
        <label
          htmlFor="audio-upload"
          className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-gray-200 rounded-[4px] py-10 cursor-pointer hover:border-[#2563EB] hover:bg-blue-50/30 transition-colors"
        >
          <Upload size={24} className="text-gray-300" />
          <div className="text-center">
            <p className="text-sm text-gray-600">
              <span className="text-[#2563EB] font-medium">Click to select</span>{" "}
              a .wav audio file
            </p>
            <p className="text-[11px] text-gray-400 mt-1">
              WAV format only &middot; Max 10 MB recommended
            </p>
          </div>
          <input
            ref={fileInputRef}
            id="audio-upload"
            type="file"
            accept=".wav,audio/wav"
            onChange={handleFileSelect}
            className="hidden"
          />
        </label>
      ) : (
        <div className="space-y-4">
          {/* Selected File Card */}
          <div className="flex items-center gap-3 bg-slate-50 border border-gray-100 rounded-[4px] px-4 py-3">
            <FileAudio size={18} className="text-[#2563EB] shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#111827] truncate">
                {selectedFile.name}
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                {(selectedFile.size / 1024).toFixed(1)} KB
              </p>
            </div>
            {status === "idle" && (
              <button
                onClick={clearFile}
                className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-200 transition-colors"
              >
                <X size={14} className="text-gray-400" />
              </button>
            )}
          </div>

          {/* Analyze Button */}
          {status === "idle" && (
            <button
              onClick={handleAnalyze}
              className="w-full flex items-center justify-center gap-2 bg-[#2563EB] text-white text-sm font-medium rounded-[4px] py-2.5 hover:bg-blue-700 active:bg-blue-800 transition-colors"
            >
              <Upload size={14} />
              Analyze Consultation
            </button>
          )}

          {/* Loading States */}
          {(status === "analyzing" || status === "saving") && (
            <div className="flex items-center justify-center gap-2.5 py-3">
              <Loader2 size={16} className="text-[#2563EB] animate-spin" />
              <span className="text-sm text-gray-500">
                {STATUS_LABELS[status]}
              </span>
            </div>
          )}

          {/* Success State with Scores */}
          {status === "success" && metrics && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-emerald-600">
                <CheckCircle2 size={16} />
                <span className="text-sm font-medium">
                  {STATUS_LABELS.success}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {Object.entries(metrics).map(([key, value]) => (
                  <div
                    key={key}
                    className="bg-slate-50 border border-gray-100 rounded-[4px] p-3 text-center"
                  >
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
                      {key}
                    </p>
                    <p className="text-xl font-light text-[#111827] mt-1">
                      {value}
                      <span className="text-xs font-light text-gray-400">/100</span>
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error State */}
          {status === "error" && (
            <div className="flex items-start gap-2.5 bg-red-50 border border-red-100 rounded-[4px] px-4 py-3">
              <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-700">
                  {STATUS_LABELS.error}
                </p>
                <p className="text-xs text-red-500 mt-1">
                  {errorMsg}
                </p>
              </div>
              <button
                onClick={clearFile}
                className="text-xs text-red-400 hover:text-red-600 font-medium"
              >
                Retry
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
