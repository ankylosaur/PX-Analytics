/**
 * AudioUploadModal.tsx — Modal for uploading patient feedback audio
 *
 * Sends audio files to the FastAPI backend for processing via Whisper STT + LLM.
 * Includes graceful degradation: if the backend is unreachable,
 * falls back to mock inference and writes directly to Firestore.
 */

import { useState, useRef, useCallback, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "./ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Badge } from "./ui/badge";
import {
  Upload,
  FileAudio,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Mic,
} from "lucide-react";
import { toast } from "sonner";
import { addFeedback } from "../../lib/firestore";

const BACKEND_URL = "http://localhost:8000";

const DEPARTMENTS = [
  "Cardiology",
  "Neurology",
  "Pediatrics",
  "Oncology",
  "Orthopedics",
];

const DOCTORS = {
  Cardiology: ["Dr. Sharma", "Dr. Patel"],
  Neurology: ["Dr. Nair", "Dr. Sen"],
  Pediatrics: ["Dr. Joshi", "Dr. Gupta"],
  Oncology: ["Dr. Iyer"],
  Orthopedics: ["Dr. Rao"],
};

const STEPS = [
  { key: "uploading", label: "Uploading audio..." },
  { key: "transcribing", label: "Transcribing with Whisper..." },
  { key: "analyzing", label: "Analyzing feedback with AI..." },
  { key: "saving", label: "Saving to database..." },
];

/** Generate a mock feedback for demo/fallback mode. */
function generateMockFeedback(patientName, doctorId, department) {
  const sentiments = ["Positive", "Neutral", "Negative"];
  const sentiment = sentiments[Math.floor(Math.random() * sentiments.length)];

  const mockTranscripts = {
    Positive:
      "Overall I had a really positive experience. The doctor was attentive and explained everything clearly. The staff was friendly and made me feel comfortable throughout my visit.",
    Neutral:
      "The appointment was fine. Everything was handled professionally. I didn't have any major issues, but the wait was a bit longer than expected.",
    Negative:
      "I was frustrated with the long wait times and felt rushed during my consultation. The billing process was confusing and I had to ask multiple times for clarification on my treatment plan.",
  };

  const mockSummaries = {
    Positive:
      "Patient reported a highly positive experience, praising the attentiveness of medical staff and clear communication regarding their treatment plan.",
    Neutral:
      "Patient described an adequate experience with professional care but noted room for improvement in wait times and overall efficiency.",
    Negative:
      "Patient expressed dissatisfaction with extended wait times, rushed consultation, and confusion during the billing process.",
  };

  const painPointPool = {
    Positive: [],
    Neutral: ["Long wait times"],
    Negative: [
      "Long wait times",
      "Rushed consultation",
      "Billing errors",
      "Poor communication",
    ],
  };

  return {
    feedback_id: `FB-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
    patient_name: patientName,
    doctor_id: doctorId,
    department: department,
    transcript: mockTranscripts[sentiment],
    sentiment: sentiment,
    summary: mockSummaries[sentiment],
    pain_points: painPointPool[sentiment],
    _demo_mode: true,
  };
}

export default function AudioUploadModal({ open, onClose }) {
  const [patientName, setPatientName] = useState("");
  const [department, setDepartment] = useState("");
  const [doctor, setDoctor] = useState("");
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | uploading | transcribing | analyzing | saving | success | error
  const [errorMessage, setErrorMessage] = useState("");
  const [backendOnline, setBackendOnline] = useState(null);
  const fileInputRef = useRef(null);

  // Check backend health on modal open
  useEffect(() => {
    if (open) {
      fetch(`${BACKEND_URL}/health`, { signal: AbortSignal.timeout(3000) })
        .then((r) => r.json())
        .then((data) => {
          setBackendOnline(data.status === "ok");
        })
        .catch(() => {
          setBackendOnline(false);
        });
    }
  }, [open]);

  const resetForm = useCallback(() => {
    setPatientName("");
    setDepartment("");
    setDoctor("");
    setFile(null);
    setStatus("idle");
    setErrorMessage("");
  }, []);

  const handleClose = useCallback(
    (openState) => {
      if (!openState) {
        resetForm();
        onClose();
      }
    },
    [resetForm, onClose]
  );

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (selected) {
      const ext = selected.name.toLowerCase().split(".").pop();
      if (ext !== "wav" && ext !== "mp3") {
        toast.error("Only .wav and .mp3 files are accepted.");
        return;
      }
      setFile(selected);
    }
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) {
      const ext = dropped.name.toLowerCase().split(".").pop();
      if (ext !== "wav" && ext !== "mp3") {
        toast.error("Only .wav and .mp3 files are accepted.");
        return;
      }
      setFile(dropped);
    }
  }, []);

  const handleSubmit = async () => {
    // Validate form
    if (!patientName.trim()) {
      toast.error("Please enter a patient name.");
      return;
    }
    if (!department) {
      toast.error("Please select a department.");
      return;
    }
    if (!doctor) {
      toast.error("Please select a doctor.");
      return;
    }
    if (!file) {
      toast.error("Please select an audio file.");
      return;
    }

    try {
      if (backendOnline) {
        // ── Real pipeline: send to backend ──
        setStatus("uploading");

        const formData = new FormData();
        formData.append("file", file);
        formData.append("patient_name", patientName.trim());
        formData.append("doctor_id", doctor);
        formData.append("department", department);

        // Simulate step progression for UX
        setTimeout(() => setStatus("transcribing"), 800);
        setTimeout(() => setStatus("analyzing"), 2500);

        const response = await fetch(`${BACKEND_URL}/process-feedback`, {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json().catch(() => ({}));
          throw new Error(
            error.detail || `Server error (${response.status})`
          );
        }

        setStatus("saving");
        await new Promise((r) => setTimeout(r, 500)); // Brief UX pause

        setStatus("success");
        toast.success("Feedback processed successfully!", {
          description: `${patientName}'s audio has been analyzed and saved.`,
        });
      } else {
        // ── Fallback: demo mode ──
        setStatus("uploading");
        await new Promise((r) => setTimeout(r, 600));

        setStatus("analyzing");
        await new Promise((r) => setTimeout(r, 1000));

        const mockData = generateMockFeedback(
          patientName.trim(),
          doctor,
          department
        );

        setStatus("saving");
        await addFeedback(mockData);

        setStatus("success");
        toast.success("Feedback saved (demo mode)", {
          description:
            "Backend offline — simulated analysis was used.",
          icon: <AlertTriangle className="h-4 w-4 text-amber-500" />,
        });
      }

      // Auto close after success
      setTimeout(() => {
        handleClose(false);
      }, 1500);
    } catch (err) {
      console.error("[AudioUploadModal] Error:", err);
      setStatus("error");
      setErrorMessage(err.message || "An unexpected error occurred.");
      toast.error("Failed to process audio", {
        description: err.message || "Please try again.",
      });
    }
  };

  const isProcessing = ["uploading", "transcribing", "analyzing", "saving"].includes(status);
  const currentStepIndex = STEPS.findIndex((s) => s.key === status);
  const availableDoctors = department ? DOCTORS[department] || [] : [];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Mic className="h-5 w-5 text-blue-600" />
            Upload Patient Feedback
          </DialogTitle>
          <DialogDescription className="text-xs">
            Upload an audio recording of patient feedback for AI analysis.
            {backendOnline === false && (
              <span className="block mt-1 text-amber-600 font-medium">
                ⚠ Backend offline — results will be simulated.
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        {status === "success" ? (
          <div className="flex flex-col items-center gap-3 py-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
              <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            </div>
            <p className="text-sm font-semibold text-gray-800">
              Successfully Processed
            </p>
            <p className="text-xs text-gray-400">
              Feedback has been analyzed and saved.
            </p>
          </div>
        ) : status === "error" ? (
          <div className="flex flex-col items-center gap-3 py-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-50">
              <XCircle className="h-8 w-8 text-rose-500" />
            </div>
            <p className="text-sm font-semibold text-gray-800">
              Processing Failed
            </p>
            <p className="text-xs text-gray-400 text-center max-w-[260px]">
              {errorMessage}
            </p>
            <button
              onClick={() => setStatus("idle")}
              className="mt-2 text-xs text-blue-600 hover:underline font-medium"
            >
              Try Again
            </button>
          </div>
        ) : isProcessing ? (
          <div className="py-6 space-y-4">
            <div className="flex items-center justify-center">
              <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
            </div>
            <div className="space-y-2">
              {STEPS.map((step, i) => (
                <div
                  key={step.key}
                  className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-md transition-colors ${
                    i === currentStepIndex
                      ? "bg-blue-50 text-blue-700 font-medium"
                      : i < currentStepIndex
                      ? "text-emerald-600"
                      : "text-gray-300"
                  }`}
                >
                  {i < currentStepIndex ? (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  ) : i === currentStepIndex ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <div className="h-3.5 w-3.5 rounded-full border border-gray-200" />
                  )}
                  {step.label}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* ── Form Fields ── */}
            <div className="space-y-3 mt-1">
              {/* Patient Name */}
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">
                  Patient Name
                </label>
                <input
                  id="upload-patient-name"
                  type="text"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="e.g., John Doe"
                  className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 focus:outline-none transition-colors"
                />
              </div>

              {/* Department */}
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">
                  Department
                </label>
                <Select
                  value={department}
                  onValueChange={(val) => {
                    setDepartment(val);
                    setDoctor(""); // Reset doctor when department changes
                  }}
                >
                  <SelectTrigger className="h-9 text-sm" id="upload-department">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPARTMENTS.map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Doctor */}
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">
                  Doctor
                </label>
                <Select value={doctor} onValueChange={setDoctor}>
                  <SelectTrigger
                    className="h-9 text-sm"
                    disabled={!department}
                    id="upload-doctor"
                  >
                    <SelectValue
                      placeholder={
                        department
                          ? "Select doctor"
                          : "Select a department first"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {availableDoctors.map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* File Upload */}
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">
                  Audio File
                </label>
                <div
                  className={`relative flex flex-col items-center gap-2 rounded-lg border-2 border-dashed px-4 py-5 transition-colors cursor-pointer ${
                    file
                      ? "border-blue-300 bg-blue-50/50"
                      : "border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100"
                  }`}
                  onClick={() => fileInputRef.current?.click()}
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                >
                  {file ? (
                    <>
                      <FileAudio className="h-8 w-8 text-blue-500" />
                      <p className="text-xs font-medium text-gray-700">
                        {file.name}
                      </p>
                      <p className="text-[10px] text-gray-400">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </>
                  ) : (
                    <>
                      <Upload className="h-8 w-8 text-gray-300" />
                      <p className="text-xs text-gray-500">
                        Click or drag to upload
                      </p>
                      <p className="text-[10px] text-gray-400">
                        .wav or .mp3, max 25MB
                      </p>
                    </>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".wav,.mp3,audio/wav,audio/mpeg"
                    onChange={handleFileChange}
                    className="hidden"
                    id="upload-audio-file"
                  />
                </div>
              </div>
            </div>

            {/* ── Submit Button ── */}
            <DialogFooter className="mt-3">
              <button
                onClick={handleSubmit}
                disabled={!patientName || !department || !doctor || !file}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 active:bg-blue-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                id="upload-submit"
              >
                <Upload className="h-4 w-4" />
                Process Feedback
              </button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
