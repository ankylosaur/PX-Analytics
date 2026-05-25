/**
 * AdminDashboard.tsx — Main command center layout for post-discharge semantic analysis.
 *
 * Coordinates filters, feeds data via useFeedbackData, and renders the subcomponents:
 *   - KPIBar (stats, sentiment breakdown, trending pain points)
 *   - FilterBar (dropdowns for department, doctor, sentiment, patient search, and date range)
 *   - FeedbackTable (data grid with sentiment pill badges)
 *   - FeedbackDetailPanel (slide-out sheet showing full transcripts and details)
 */

import { useState } from "react";
import { useFeedbackData } from "../../hooks/useFeedbackData";
import KPIBar from "./KPIBar";
import FilterBar from "./FilterBar";
import FeedbackTable from "./FeedbackTable";
import FeedbackDetailPanel from "./FeedbackDetailPanel";
import { AlertCircle } from "lucide-react";

export default function AdminDashboard() {
  // ─── Filter States ───
  const [searchQuery, setSearchQuery] = useState("");
  const [department, setDepartment] = useState("All");
  const [doctor, setDoctor] = useState("All");
  const [sentiment, setSentiment] = useState("All");
  const [dateRange, setDateRange] = useState({ from: null, to: null });

  // ─── Selected Feedback State for Detail Sheet ───
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // ─── Fetch Data ───
  const filters = {
    searchQuery,
    department,
    doctor,
    sentiment,
    startDate: dateRange.from,
    endDate: dateRange.to,
  };

  const {
    feedbacks,
    loading,
    error,
    sentimentBreakdown,
    trendingPainPoints,
    uniqueDoctors,
  } = useFeedbackData(filters);

  // ─── Handlers ───
  const handleDepartmentChange = (dept) => {
    setDepartment(dept);
    setDoctor("All"); // Reset doctor selection when department changes
  };

  const handleSelectFeedback = (feedback) => {
    setSelectedFeedback(feedback);
    setIsDetailOpen(true);
  };

  const handleCloseDetail = () => {
    setIsDetailOpen(false);
    // Keep selectedFeedback populated briefly to avoid blank sheet during close animation
  };

  return (
    <main className="flex-1 overflow-y-auto px-8 py-8 space-y-8 max-w-7xl mx-auto w-full">
      {/* ─── Page Title / Subtitle ─── */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Admin Command Center
        </h1>
        <p className="text-xs font-semibold text-slate-400 leading-normal">
          Monitor and analyze post-discharge patient feedback transcripts, AI summaries, and sentiment metrics in real time.
        </p>
      </div>

      {/* ─── Error Alert ─── */}
      {error && (
        <div className="rounded-xl bg-rose-50 border border-rose-100 p-4 flex items-start gap-3 shadow-sm/5">
          <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-rose-800">
              Database Sync Error
            </h3>
            <p className="text-xs text-rose-700 mt-1">{error}</p>
            <p className="text-xs text-rose-500 mt-1.5 font-medium">
              Make sure Firestore index is built or check network connection.
            </p>
          </div>
        </div>
      )}

      {/* ─── KPI Section ─── */}
      <KPIBar
        sentimentBreakdown={sentimentBreakdown}
        trendingPainPoints={trendingPainPoints}
        totalCount={feedbacks.length}
        loading={loading}
      />

      {/* ─── Filters Section ─── */}
      <FilterBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        department={department}
        setDepartment={handleDepartmentChange}
        doctor={doctor}
        setDoctor={setDoctor}
        sentiment={sentiment}
        setSentiment={setSentiment}
        dateRange={dateRange}
        setDateRange={setDateRange}
        doctors={uniqueDoctors}
      />

      {/* ─── Data Grid Table ─── */}
      <FeedbackTable
        feedbacks={feedbacks}
        loading={loading}
        onSelectFeedback={handleSelectFeedback}
      />

      {/* ─── Detail Sheet Panel ─── */}
      <FeedbackDetailPanel
        feedback={selectedFeedback}
        open={isDetailOpen}
        onClose={handleCloseDetail}
      />
    </main>
  );
}
