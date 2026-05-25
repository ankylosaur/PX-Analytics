/**
 * FeedbackTable.tsx — Main data grid for the Admin Command Center
 *
 * Displays patient feedback records in a clean, enterprise-style table.
 * Supports row selection, sentiment pill badges, and pagination.
 * Includes sticky headers, skeletons, and beautiful empty states.
 */

import { SearchX, ChevronLeft, ChevronRight } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Badge } from "./ui/badge";
import { Skeleton } from "./ui/skeleton";
import { useState, useEffect } from "react";

const PAGE_SIZE = 10;

const SENTIMENT_STYLES = {
  Positive: "bg-emerald-100 text-emerald-700 border-emerald-200",
  Neutral: "bg-slate-100 text-slate-700 border-slate-200",
  Negative: "bg-rose-100 text-rose-700 border-rose-200",
};

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

/**
 * Truncate text to a max length with ellipsis.
 */
function truncate(text, maxLen = 80) {
  if (!text) return "—";
  return text.length > maxLen ? text.slice(0, maxLen) + "…" : text;
}

export default function FeedbackTable({
  feedbacks,
  loading,
  onSelectFeedback,
  onSelectDoctor,
  onSelectPatient,
}) {
  const [currentPage, setCurrentPage] = useState(0);

  // Reset to page 0 when feedbacks change
  useEffect(() => {
    setCurrentPage(0);
  }, [feedbacks?.length]);

  const totalPages = Math.ceil((feedbacks?.length || 0) / PAGE_SIZE);
  const safeCurrentPage = Math.min(currentPage, Math.max(0, totalPages - 1));

  const paginatedFeedbacks = (feedbacks || []).slice(
    safeCurrentPage * PAGE_SIZE,
    (safeCurrentPage + 1) * PAGE_SIZE
  );

  // ─── Loading Skeleton View ───
  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200/80 bg-white shadow-sm overflow-hidden overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/50 hover:bg-slate-50/50 border-b border-slate-200">
              <TableHead className="sticky left-0 bg-slate-50/55 text-xs font-semibold text-slate-500 uppercase tracking-wider pl-6 h-11 z-20 border-r border-slate-100 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">Date</TableHead>
              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider h-11">Patient</TableHead>
              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider h-11">Doctor</TableHead>
              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider h-11">Dept</TableHead>
              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider h-11 text-center">Sentiment</TableHead>
              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider pr-6 h-11">Summary</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: PAGE_SIZE }).map((_, i) => (
              <TableRow key={i} className="group border-b border-slate-100 hover:bg-transparent">
                <TableCell className="sticky left-0 bg-white group-hover:bg-white pl-6 py-4 z-10 border-r border-slate-100 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                  <Skeleton className="h-4 w-20 bg-slate-100/70 animate-pulse rounded" />
                </TableCell>
                <TableCell className="py-4"><Skeleton className="h-4 w-28 bg-slate-100/70 animate-pulse rounded" /></TableCell>
                <TableCell className="py-4"><Skeleton className="h-4 w-24 bg-slate-100/70 animate-pulse rounded" /></TableCell>
                <TableCell className="py-4"><Skeleton className="h-4 w-20 bg-slate-100/70 animate-pulse rounded" /></TableCell>
                <TableCell className="py-4 flex justify-center"><Skeleton className="h-6 w-20 bg-slate-100/70 animate-pulse rounded-full" /></TableCell>
                <TableCell className="pr-6 py-4"><Skeleton className="h-4 w-64 bg-slate-100/70 animate-pulse rounded flex-1" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  // ─── Empty State View ───
  if (!feedbacks || feedbacks.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200/80 bg-white shadow-sm p-16 text-center">
        <div className="flex flex-col items-center gap-4 max-w-sm mx-auto">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-slate-400">
            <SearchX className="h-8 w-8" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-sm font-semibold text-slate-900">
              No feedback found
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              No patient feedback matches your current filters. Try adjusting the search query, selecting another category, or uploading fresh recordings.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200/80 bg-white shadow-sm overflow-hidden flex flex-col">
      {/* Scrollable container for sticky header & sticky column support */}
      <div className="max-h-[520px] overflow-auto relative">
        <Table>
          <TableHeader className="sticky top-0 bg-slate-50/95 backdrop-blur-sm z-20 border-b border-slate-200 shadow-sm/5">
            <TableRow className="bg-slate-50/50 hover:bg-slate-50/50 border-b-0">
              <TableHead className="sticky top-0 left-0 bg-slate-50/95 backdrop-blur-sm text-xs font-semibold text-slate-500 uppercase tracking-wider pl-6 h-11 z-30 border-r border-slate-100 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                Date
              </TableHead>
              <TableHead className="sticky top-0 bg-slate-50/95 backdrop-blur-sm text-xs font-semibold text-slate-500 uppercase tracking-wider h-11">
                Patient
              </TableHead>
              <TableHead className="sticky top-0 bg-slate-50/95 backdrop-blur-sm text-xs font-semibold text-slate-500 uppercase tracking-wider h-11">
                Doctor
              </TableHead>
              <TableHead className="sticky top-0 bg-slate-50/95 backdrop-blur-sm text-xs font-semibold text-slate-500 uppercase tracking-wider h-11">
                Dept
              </TableHead>
              <TableHead className="sticky top-0 bg-slate-50/95 backdrop-blur-sm text-xs font-semibold text-slate-500 uppercase tracking-wider h-11 text-center">
                Sentiment
              </TableHead>
              <TableHead className="sticky top-0 bg-slate-50/95 backdrop-blur-sm text-xs font-semibold text-slate-500 uppercase tracking-wider pr-6 h-11">
                Summary
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedFeedbacks.map((fb) => (
              <TableRow
                key={fb.id}
                className="group cursor-pointer hover:bg-slate-50/80 border-b border-slate-100 transition-colors duration-150"
                onClick={() => onSelectFeedback(fb)}
              >
                <TableCell className="sticky left-0 bg-white group-hover:bg-slate-50/80 text-xs text-slate-600 font-semibold py-3.5 pl-6 border-r border-slate-100 z-10 transition-colors shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                  {formatDate(fb.timestamp)}
                </TableCell>
                <TableCell className="text-xs text-slate-900 font-semibold py-3.5">
                  {fb.patient_name ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectPatient?.(fb.patient_name);
                      }}
                      className="text-slate-900 font-medium cursor-pointer transition-colors duration-200 hover:text-indigo-600 text-left focus:outline-hidden"
                    >
                      {fb.patient_name}
                    </button>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell className="text-xs text-slate-600 font-medium py-3.5">
                  {fb.doctor_id ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectDoctor?.(fb.doctor_id);
                      }}
                      className="text-slate-900 font-medium cursor-pointer transition-colors duration-200 hover:text-indigo-600 text-left focus:outline-hidden"
                    >
                      {fb.doctor_id}
                    </button>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell className="text-xs text-slate-600 font-medium py-3.5">
                  {fb.department || "—"}
                </TableCell>
                <TableCell className="text-center py-3.5">
                  <Badge
                    variant="outline"
                    className={`rounded-full px-3 py-1 text-[11px] font-semibold border ${
                      SENTIMENT_STYLES[fb.sentiment] || SENTIMENT_STYLES.Neutral
                    }`}
                  >
                    {fb.sentiment || "Unknown"}
                  </Badge>
                </TableCell>
                <TableCell className="pr-6 text-xs text-slate-500 max-w-[340px] truncate py-3.5">
                  {fb.summary || "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4 bg-white">
          <p className="text-xs font-medium text-slate-400">
            Showing {safeCurrentPage * PAGE_SIZE + 1}–
            {Math.min((safeCurrentPage + 1) * PAGE_SIZE, feedbacks.length)} of{" "}
            {feedbacks.length}
          </p>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
              disabled={safeCurrentPage === 0}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-2 text-xs font-semibold text-slate-600">
              {safeCurrentPage + 1} / {totalPages}
            </span>
            <button
              onClick={() =>
                setCurrentPage((p) => Math.min(totalPages - 1, p + 1))
              }
              disabled={safeCurrentPage >= totalPages - 1}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
