/**
 * PatientProfileModal.tsx — Patient journey timeline profile view.
 *
 * Triggered by clicking a Patient name in the feedback table. Displays:
 *   - Patient KPI Strip (Total visits, latest sentiment, primary department)
 *   - Vertical touchpoint timeline listing all discharge feedback dates,
 *     associated doctors (clickable to view provider details), departments,
 *     sentiment pills, AI summaries, and full transcripts.
 */

import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { Badge } from "./ui/badge";
import { Card, CardContent } from "./ui/card";
import { Separator } from "./ui/separator";
import {
  User,
  MessageSquareText,
  Heart,
  Building2,
  Stethoscope,
  Clock,
  HeartCrack,
  Sparkles,
} from "lucide-react";

/**
 * Format a Firestore timestamp or ISO string to a readable date.
 */
function formatDate(ts) {
  if (!ts) return "—";
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function PatientProfileModal({
  patientName,
  feedbacks = [],
  open,
  onClose,
  onSelectDoctor,
}) {
  const [isScrolled, setIsScrolled] = useState(false);

  // ─── Filter & Sort Patient Feedbacks (Newest First) ───
  const patientFeedbacks = useMemo(() => {
    if (!patientName) return [];
    return feedbacks
      .filter((fb) => fb.patient_name === patientName)
      .sort((a, b) => {
        const dateA = a.timestamp?.toDate ? a.timestamp.toDate() : new Date(a.timestamp);
        const dateB = b.timestamp?.toDate ? b.timestamp.toDate() : new Date(b.timestamp);
        return dateB.getTime() - dateA.getTime();
      });
  }, [patientName, feedbacks]);

  // ─── Compute Statistics ───
  const stats = useMemo(() => {
    const total = patientFeedbacks.length;
    if (total === 0) {
      return { total: 0, lastSeenDept: "—", status: "Neutral" };
    }

    const lastVisit = patientFeedbacks[0];
    return {
      total,
      lastSeenDept: lastVisit.department || "—",
      status: lastVisit.sentiment || "Neutral",
    };
  }, [patientFeedbacks]);

  const handleScroll = (e: any) => {
    setIsScrolled(e.target.scrollTop > 10);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-2xl bg-white p-0 max-h-[85vh] flex flex-col overflow-hidden">
        {/* Sticky Header Section */}
        <div className={`p-6 pb-4 shrink-0 bg-white/95 backdrop-blur z-10 transition-shadow duration-200 ${
          isScrolled ? "border-b border-slate-200/80 shadow-sm" : "border-b border-transparent"
        }`}>
          <DialogHeader className="pb-2">
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900 tracking-tight">
              <User className="h-5 w-5 text-blue-600" />
              Patient Journey: {patientName}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400 font-medium">
              Chronological log of hospital visits, post-discharge feedback transcripts, and clinical summaries.
            </DialogDescription>
          </DialogHeader>

          {/* ─── Patient KPI Bar (Reflows on Mobile) ─── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
            {/* Total Touchpoints */}
            <Card className="p-4 bg-slate-50/60 border border-slate-100 shadow-sm/5 rounded-xl flex items-center">
              <CardContent className="p-0 flex items-center gap-3 w-full">
                <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center shrink-0">
                  <MessageSquareText className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Total Visits</p>
                  <p className="text-lg font-bold text-slate-800 mt-0.5">{stats.total}</p>
                </div>
              </CardContent>
            </Card>

            {/* Latest Status */}
            <Card className="p-4 bg-slate-50/60 border border-slate-100 shadow-sm/5 rounded-xl flex items-center">
              <CardContent className="p-0 flex items-center gap-3 w-full">
                <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${
                  stats.status === "Positive"
                    ? "bg-emerald-50 text-emerald-600"
                    : stats.status === "Negative"
                    ? "bg-rose-50 text-rose-600"
                    : "bg-slate-100 text-slate-500"
                }`}>
                  {stats.status === "Negative" ? (
                    <HeartCrack className="h-5 w-5" />
                  ) : (
                    <Heart className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Latest Tone</p>
                  <p className={`text-sm font-extrabold mt-1 leading-none ${
                    stats.status === "Positive"
                      ? "text-emerald-600"
                      : stats.status === "Negative"
                      ? "text-rose-600"
                      : "text-slate-600"
                  }`}>
                    {stats.status}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Primary/Last Seen Department */}
            <Card className="p-4 bg-slate-50/60 border border-slate-100 shadow-sm/5 rounded-xl flex items-center">
              <CardContent className="p-0 flex items-center gap-3 w-full">
                <div className="h-10 w-10 bg-slate-100 text-slate-500 rounded-lg flex items-center justify-center shrink-0">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Last Dept</p>
                  <p className="text-xs font-bold text-slate-800 mt-0.5 truncate max-w-[150px]">{stats.lastSeenDept}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Scrollable Modal Body */}
        <div
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-6 pt-2 space-y-6"
        >
          {/* ─── Timeline Header & Content ─── */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4.5 w-4.5 text-slate-400" />
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Care Timeline (Newest First)
              </h3>
            </div>

            {patientFeedbacks.length === 0 ? (
              <div className="text-center py-8 bg-slate-50/50 border border-dashed border-slate-200 rounded-xl">
                <p className="text-xs font-semibold text-slate-400 italic">No visit logs found for this patient.</p>
              </div>
            ) : (
              <div className="relative pl-6 border-l border-slate-200 ml-3.5 space-y-6 my-2">
                {patientFeedbacks.map((fb, idx) => (
                  <div key={fb.id || idx} className="relative group">
                    {/* Timeline bullet element aligned with vertical border-l */}
                    <span className={`absolute -left-[30px] top-1.5 h-3 w-3 rounded-full border-2 bg-white ${
                      fb.sentiment === "Positive"
                        ? "border-emerald-500"
                        : fb.sentiment === "Negative"
                        ? "border-rose-500"
                        : "border-slate-400"
                    }`} />

                    {/* Visit Card */}
                    <div className="bg-white border border-slate-200/60 p-5 rounded-xl shadow-xs hover:shadow-md transition-all duration-300 space-y-3.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-bold text-slate-800">
                          {formatDate(fb.timestamp)}
                        </span>
                        <Badge
                          variant="outline"
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            fb.sentiment === "Positive"
                              ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                              : fb.sentiment === "Neutral"
                              ? "bg-slate-100 text-slate-700 border-slate-200"
                              : "bg-rose-100 text-rose-700 border-rose-200"
                          }`}
                        >
                          {fb.sentiment}
                        </Badge>
                      </div>

                      {/* AI Clinical Summary */}
                      <div className="text-xs bg-indigo-50/50 border border-indigo-100/50 p-3 rounded-lg text-slate-900 font-medium leading-relaxed flex items-start gap-2 shadow-xs/5">
                        <Sparkles className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
                        <div>
                          {fb.summary || "No summary available."}
                        </div>
                      </div>

                      {/* Metadata fields (Doctor/Department) */}
                      <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <Stethoscope className="h-4 w-4 text-slate-400 shrink-0" />
                          <span className="truncate">
                            Doctor:{" "}
                            <button
                              onClick={() => {
                                onSelectDoctor(fb.doctor_id);
                              }}
                              className="text-blue-600 hover:underline hover:text-blue-800 font-bold cursor-pointer transition-colors text-left"
                            >
                              {fb.doctor_id || "—"}
                            </button>
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Building2 className="h-4 w-4 text-slate-400 shrink-0" />
                          <span className="truncate">Dept: {fb.department || "—"}</span>
                        </div>
                      </div>

                      {/* Raw Transcript (Collapsible details) */}
                      <details className="group cursor-pointer select-none">
                        <summary className="text-[10px] font-bold text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-wider flex items-center gap-1.5 focus:outline-hidden">
                          View Raw Transcript
                        </summary>
                        <p className="text-sm text-slate-500 leading-relaxed border-l-2 border-slate-200/80 pl-4 py-1 mt-2 mb-1 font-medium select-text">
                          "{fb.transcript || "—"}"
                        </p>
                      </details>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
