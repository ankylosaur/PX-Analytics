/**
 * FeedbackDetailPanel.tsx — Slide-out detail view for a single feedback record
 *
 * Uses shadcn Sheet (side="right") to display:
 *   - Patient info header
 *   - Sentiment badge
 *   - AI-generated summary
 *   - Full transcript
 *   - Pain point tags
 */

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "./ui/sheet";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import {
  User,
  Stethoscope,
  Building2,
  CalendarDays,
  FileText,
  MessageSquareText,
  AlertTriangle,
} from "lucide-react";

const SENTIMENT_BADGE = {
  Positive: "bg-emerald-100 text-emerald-800 border-emerald-200 rounded-full px-3 py-1 text-xs font-semibold",
  Neutral: "bg-slate-100 text-slate-700 border-slate-200 rounded-full px-3 py-1 text-xs font-semibold",
  Negative: "bg-rose-100 text-rose-800 border-rose-200 rounded-full px-3 py-1 text-xs font-semibold",
};

function formatDate(ts) {
  if (!ts) return "—";
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function FeedbackDetailPanel({ feedback, open, onClose }) {
  if (!feedback) return null;

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg overflow-y-auto bg-white p-6"
      >
        <SheetHeader className="pb-4">
          <div className="flex items-center gap-3">
            <SheetTitle className="text-base font-bold text-slate-900 tracking-tight">
              Feedback Details
            </SheetTitle>
            <Badge
              variant="outline"
              className={`border ${
                SENTIMENT_BADGE[feedback.sentiment] || SENTIMENT_BADGE.Neutral
              }`}
            >
              {feedback.sentiment}
            </Badge>
          </div>
          <SheetDescription className="text-xs text-slate-400 font-medium">
            Record ID: {feedback.feedback_id || "—"}
          </SheetDescription>
        </SheetHeader>

        {/* ── Patient Info Cards ── */}
        <div className="grid grid-cols-2 gap-3 mt-2">
          <div className="flex items-center gap-2.5 rounded-xl bg-slate-50/80 border border-slate-100 px-3 py-2.5">
            <User className="h-4 w-4 text-slate-400 shrink-0" />
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Patient
              </p>
              <p className="text-xs font-bold text-slate-800 mt-0.5">
                {feedback.patient_name}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 rounded-xl bg-slate-50/80 border border-slate-100 px-3 py-2.5">
            <Stethoscope className="h-4 w-4 text-slate-400 shrink-0" />
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Doctor
              </p>
              <p className="text-xs font-bold text-slate-800 mt-0.5">
                {feedback.doctor_id}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 rounded-xl bg-slate-50/80 border border-slate-100 px-3 py-2.5">
            <Building2 className="h-4 w-4 text-slate-400 shrink-0" />
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Department
              </p>
              <p className="text-xs font-bold text-slate-800 mt-0.5">
                {feedback.department}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 rounded-xl bg-slate-50/80 border border-slate-100 px-3 py-2.5">
            <CalendarDays className="h-4 w-4 text-slate-400 shrink-0" />
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Date
              </p>
              <p className="text-xs font-bold text-slate-800 mt-0.5">
                {formatDate(feedback.timestamp)}
              </p>
            </div>
          </div>
        </div>

        <Separator className="my-5 bg-slate-100" />

        {/* ── AI Summary ── */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-blue-500" />
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              AI-Generated Summary
            </h3>
          </div>
          <div className="rounded-xl border border-blue-100 bg-blue-50/30 px-4 py-3.5 shadow-sm/5">
            <p className="text-xs font-semibold text-slate-700 leading-relaxed">
              {feedback.summary || "No summary available."}
            </p>
          </div>
        </div>

        <Separator className="my-5 bg-slate-100" />

        {/* ── Full Transcript ── */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <MessageSquareText className="h-4 w-4 text-slate-400" />
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Full Transcript
            </h3>
          </div>
          <div className="rounded-xl bg-slate-50/60 border border-slate-200/60 px-4 py-3.5 max-h-[180px] overflow-y-auto">
            <p className="text-xs font-semibold text-slate-600 leading-relaxed whitespace-pre-wrap">
              "{feedback.transcript || "No transcript available."}"
            </p>
          </div>
        </div>

        <Separator className="my-5 bg-slate-100" />

        {/* ── Pain Points ── */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-slate-400" />
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Pain Points
            </h3>
          </div>
          {feedback.pain_points && feedback.pain_points.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {feedback.pain_points.map((point, i) => (
                <Badge
                  key={i}
                  variant="outline"
                  className="rounded-md px-2.5 py-1 text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200"
                >
                  {point}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 font-medium italic">
              No pain points identified
            </p>
          )}
        </div>

        {/* ── Demo Mode Indicator ── */}
        {feedback._demo_mode && (
          <>
            <Separator className="my-5 bg-slate-100" />
            <div className="rounded-xl bg-amber-50 border border-amber-200/60 px-4 py-3 flex items-start gap-2.5 shadow-sm/5">
              <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-amber-800">
                  Demo Mode Entry
                </p>
                <p className="text-[10px] text-amber-600 font-medium mt-0.5">
                  This record was generated using simulated analysis because the backend API was unreachable.
                </p>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
