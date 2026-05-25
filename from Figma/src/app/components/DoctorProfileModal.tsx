/**
 * DoctorProfileModal.tsx — Deep dive profile view for an individual doctor.
 *
 * Triggered by clicking a Doctor name in the feedback table. Displays:
 *   - Provider KPI Card Strip (Feedbacks, Sentiment % Positive, Department)
 *   - Pain Point Frequency distribution (Recharts horizontal BarChart)
 *   - Mini data grid showing only this doctor's feedback records
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
  Stethoscope,
  MessageSquareText,
  Percent,
  Building2,
  FileText,
  AlertTriangle,
  Sparkles,
} from "lucide-react";

export default function DoctorProfileModal({ doctorId, feedbacks = [], open, onClose, loading = false }) {
  const [isScrolled, setIsScrolled] = useState(false);

  // ─── Filter Data for This Doctor ───
  const doctorFeedbacks = useMemo(() => {
    if (!doctorId) return [];
    return feedbacks.filter((fb) => fb.doctor_id === doctorId);
  }, [doctorId, feedbacks]);

  // ─── Compute Statistics ───
  const stats = useMemo(() => {
    const total = doctorFeedbacks.length;
    if (total === 0) {
      return { total: 0, sentimentScore: 0, department: "—" };
    }

    const positive = doctorFeedbacks.filter((fb) => fb.sentiment === "Positive").length;
    const score = Math.round((positive / total) * 100);

    // Get department from first record as fallback
    const dept = doctorFeedbacks[0].department || "—";

    return {
      total,
      sentimentScore: score,
      department: dept,
    };
  }, [doctorFeedbacks]);

  // ─── Group Pain Points for Chart ───
  const painPointsChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    doctorFeedbacks.forEach((fb) => {
      if (Array.isArray(fb.pain_points)) {
        fb.pain_points.forEach((pt) => {
          counts[pt] = (counts[pt] || 0) + 1;
        });
      }
    });

    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // top 5 pain points
  }, [doctorFeedbacks]);

  const hasPainPoints = painPointsChartData.length > 0;

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
              <Stethoscope className="h-5 w-5 text-blue-600" />
              Clinical Profile: {doctorId}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400 font-medium">
              Detailed patient experience metrics and transcript logs for this provider.
            </DialogDescription>
          </DialogHeader>

          {/* ─── Provider KPI Bar (Reflows on Mobile) ─── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
            {/* Total Feedbacks */}
            <Card className="p-4 bg-slate-50/60 border border-slate-100 shadow-sm/5 rounded-xl flex items-center">
              <CardContent className="p-0 flex items-center gap-3 w-full">
                <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center shrink-0">
                  <MessageSquareText className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Feedbacks</p>
                  <p className="text-lg font-bold text-slate-800 mt-0.5">{stats.total}</p>
                </div>
              </CardContent>
            </Card>

            {/* Sentiment Score */}
            <Card className="p-4 bg-slate-50/60 border border-slate-100 shadow-sm/5 rounded-xl flex items-center">
              <CardContent className="p-0 flex items-center gap-3 w-full">
                <div className="h-10 w-10 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center shrink-0">
                  <Percent className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Positivity Score</p>
                  <p className="text-lg font-bold text-slate-800 mt-0.5">{stats.sentimentScore}%</p>
                </div>
              </CardContent>
            </Card>

            {/* Department */}
            <Card className="p-4 bg-slate-50/60 border border-slate-100 shadow-sm/5 rounded-xl flex items-center">
              <CardContent className="p-0 flex items-center gap-3 w-full">
                <div className="h-10 w-10 bg-slate-100 text-slate-500 rounded-lg flex items-center justify-center shrink-0">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Department</p>
                  <p className="text-xs font-bold text-slate-800 mt-0.5 truncate max-w-[150px]">{stats.department}</p>
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
          {/* ─── Pain Point Chart ─── */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4.5 w-4.5 text-slate-400" />
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Frequent Patient Complaints
              </h3>
            </div>

            {loading ? (
              <div className="flex flex-wrap gap-2 mt-4 animate-pulse">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-8 w-24 bg-slate-100 rounded-md" />
                ))}
              </div>
            ) : !hasPainPoints ? (
              <p className="text-xs font-semibold text-slate-400 italic mt-4">No complaints reported for this provider.</p>
            ) : (
              <div className="flex flex-wrap gap-2 mt-4">
                {painPointsChartData.map((pp) => (
                  <span
                    key={pp.name}
                    className="inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium bg-rose-50 text-rose-700 border border-rose-200 transition-all hover:bg-rose-100/70"
                  >
                    {pp.name}
                    <span className="ml-1.5 opacity-70 text-xs">({pp.value})</span>
                  </span>
                ))}
              </div>
            )}
          </div>

          <Separator className="bg-slate-100" />

          {/* ─── Feedback Log List ─── */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <FileText className="h-4.5 w-4.5 text-slate-400" />
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Feedback Logs
              </h3>
            </div>

            <div className="space-y-4">
              {doctorFeedbacks.map((fb) => (
                <div 
                  key={fb.id} 
                  className="p-5 bg-white border border-slate-200/60 rounded-xl shadow-xs hover:shadow-md transition-all duration-300 space-y-3.5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-bold text-slate-800">{fb.patient_name}</span>
                    <Badge
                      variant="outline"
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
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

                  {/* AI Summary Block */}
                  <div className="text-xs bg-indigo-50/50 border border-indigo-100/50 p-3 rounded-lg text-slate-900 font-medium leading-relaxed flex items-start gap-2 shadow-xs/5">
                    <Sparkles className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
                    <div>
                      {fb.summary || "No summary available."}
                    </div>
                  </div>

                  {/* Raw Transcript (Collapsible details) */}
                  <details className="group cursor-pointer select-none">
                    <summary className="text-[10px] font-bold text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-wider flex items-center gap-1.5 focus:outline-hidden">
                      View Raw Transcript
                    </summary>
                    <p className="text-sm text-slate-500 leading-relaxed border-l-2 border-slate-200 pl-4 py-1 mt-2 mb-1 font-medium select-text">
                      "{fb.transcript}"
                    </p>
                  </details>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
