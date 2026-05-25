/**
 * AdminDashboard.tsx — Main command center layout for post-discharge semantic analysis.
 *
 * Coordinates filters, feeds data via useFeedbackData, and renders the subcomponents:
 *   - KPIBar (stats, sentiment breakdown, trending pain points)
 *   - FilterBar (dropdowns for department, doctor, sentiment, patient search, and date range)
 *   - SentimentTrendChart (time-series stacked area chart of sentiment volume)
 *   - FeedbackTable (data grid with sentiment pill badges and clickable entity links)
 *   - FeedbackDetailPanel (slide-out sheet showing full transcripts and details)
 *   - DoctorProfileModal (deep dive clinical stats and pain points for a provider)
 *   - PatientProfileModal (vertical milestone timeline of patient's touchpoints)
 */

import { useState } from "react";
import { useFeedbackData } from "../../hooks/useFeedbackData";
import KPIBar from "./KPIBar";
import FilterBar from "./FilterBar";
import SentimentTrendChart from "./SentimentTrendChart";
import FeedbackTable from "./FeedbackTable";
import FeedbackDetailPanel from "./FeedbackDetailPanel";
import DoctorProfileModal from "./DoctorProfileModal";
import PatientProfileModal from "./PatientProfileModal";
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

  // ─── Selected Entity Deep Dive States ───
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [isDoctorOpen, setIsDoctorOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isPatientOpen, setIsPatientOpen] = useState(false);

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
    allFeedbacks,
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

  const handleSelectDoctor = (doctorId) => {
    setSelectedDoctor(doctorId);
    setIsDoctorOpen(true);
    setIsPatientOpen(false); // Close patient modal to prevent overlapping Dialogs
  };

  const handleSelectPatient = (patientName) => {
    setSelectedPatient(patientName);
    setIsPatientOpen(true);
    setIsDoctorOpen(false); // Close doctor modal to prevent overlapping Dialogs
  };

  return (
    <main className="flex-1 overflow-y-auto px-8 py-8 space-y-8 max-w-7xl mx-auto w-full">
      {/* ─── Page Title ─── */}
      <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
        Admin Command Center
      </h1>

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

      {/* ─── Sentiment Volume Trends Chart ─── */}
      <SentimentTrendChart
        feedbacks={feedbacks}
        dateRange={dateRange}
        loading={loading}
      />

      {/* ─── Data Grid Table ─── */}
      <FeedbackTable
        feedbacks={feedbacks}
        loading={loading}
        onSelectFeedback={handleSelectFeedback}
        onSelectDoctor={handleSelectDoctor}
        onSelectPatient={handleSelectPatient}
      />

      {/* ─── Detail Sheet Panel ─── */}
      <FeedbackDetailPanel
        feedback={selectedFeedback}
        open={isDetailOpen}
        onClose={handleCloseDetail}
      />

      {/* ─── Doctor Deep Dive Modal ─── */}
      <DoctorProfileModal
        doctorId={selectedDoctor}
        feedbacks={allFeedbacks}
        open={isDoctorOpen}
        onClose={() => setIsDoctorOpen(false)}
      />

      {/* ─── Patient Journey Modal ─── */}
      <PatientProfileModal
        patientName={selectedPatient}
        feedbacks={allFeedbacks}
        open={isPatientOpen}
        onClose={() => setIsPatientOpen(false)}
        onSelectDoctor={handleSelectDoctor}
      />
    </main>
  );
}

