/**
 * FilterBar.tsx — Filter controls for the Admin Command Center
 *
 * Provides a search box for Patient name, dropdowns for Department,
 * Doctor, Sentiment, and a date range picker. All filters are controlled
 * props managed by the parent AdminDashboard.
 */

import { Filter, CalendarDays, X, Search } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Badge } from "./ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar } from "./ui/calendar";
import { format } from "date-fns";

const DEPARTMENTS = [
  "All",
  "Cardiology",
  "Neurology",
  "Pediatrics",
  "Oncology",
  "Orthopedics",
];

const SENTIMENTS = ["All", "Positive", "Neutral", "Negative"];

export default function FilterBar({
  searchQuery,
  setSearchQuery,
  department,
  setDepartment,
  doctor,
  setDoctor,
  sentiment,
  setSentiment,
  dateRange,
  setDateRange,
  doctors = [],
}) {
  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    department !== "All" ||
    doctor !== "All" ||
    sentiment !== "All" ||
    dateRange.from ||
    dateRange.to;

  const clearFilters = () => {
    setSearchQuery("");
    setDepartment("All");
    setDoctor("All");
    setSentiment("All");
    setDateRange({ from: null, to: null });
  };

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-200/80 bg-white px-6 py-4 shadow-sm">
      {/* Filter Label */}
      <div className="flex items-center gap-2 mr-2">
        <Filter className="h-4 w-4 text-slate-400" />
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Filters
        </span>
      </div>

      {/* ── Search Input ── */}
      <div className="relative flex-1 min-w-[220px] max-w-xs h-9">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
        <input
          id="filter-search-patient"
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search patient..."
          className="w-full h-full pl-9 pr-8 text-xs font-medium rounded-lg border border-slate-200 bg-slate-50/50 text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all duration-200"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 h-5 w-5 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
            title="Clear search"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* ── Department Select ── */}
      <Select value={department} onValueChange={setDepartment}>
        <SelectTrigger className="w-[150px] h-9 text-xs font-semibold text-slate-700 border-slate-200 rounded-lg hover:bg-slate-50 transition-colors" id="filter-department">
          <SelectValue placeholder="Department" />
        </SelectTrigger>
        <SelectContent className="bg-white border border-slate-200 rounded-lg shadow-lg">
          {DEPARTMENTS.map((d) => (
            <SelectItem key={d} value={d} className="text-xs text-slate-700 hover:bg-slate-50 cursor-pointer">
              {d === "All" ? "All Departments" : d}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* ── Doctor Select ── */}
      <Select value={doctor} onValueChange={setDoctor}>
        <SelectTrigger className="w-[150px] h-9 text-xs font-semibold text-slate-700 border-slate-200 rounded-lg hover:bg-slate-50 transition-colors" id="filter-doctor">
          <SelectValue placeholder="Doctor" />
        </SelectTrigger>
        <SelectContent className="bg-white border border-slate-200 rounded-lg shadow-lg">
          <SelectItem value="All" className="text-xs text-slate-700 hover:bg-slate-50 cursor-pointer">All Doctors</SelectItem>
          {doctors.map((d) => (
            <SelectItem key={d} value={d} className="text-xs text-slate-700 hover:bg-slate-50 cursor-pointer">
              {d}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* ── Sentiment Select ── */}
      <Select value={sentiment} onValueChange={setSentiment}>
        <SelectTrigger className="w-[140px] h-9 text-xs font-semibold text-slate-700 border-slate-200 rounded-lg hover:bg-slate-50 transition-colors" id="filter-sentiment">
          <SelectValue placeholder="Sentiment" />
        </SelectTrigger>
        <SelectContent className="bg-white border border-slate-200 rounded-lg shadow-lg">
          {SENTIMENTS.map((s) => (
            <SelectItem key={s} value={s} className="text-xs text-slate-700 hover:bg-slate-50 cursor-pointer">
              {s === "All" ? "All Sentiments" : s}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* ── Date Range Popover ── */}
      <Popover>
        <PopoverTrigger asChild>
          <button
            id="filter-date-range"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors h-9 shrink-0"
          >
            <CalendarDays className="h-4 w-4 text-slate-400" />
            {dateRange.from ? (
              <span>
                {format(dateRange.from, "MMM d")}
                {dateRange.to ? ` – ${format(dateRange.to, "MMM d")}` : ""}
              </span>
            ) : (
              <span>Date Range</span>
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 bg-white border border-slate-200 rounded-lg shadow-lg" align="start">
          <Calendar
            mode="range"
            selected={dateRange}
            onSelect={(range) =>
              setDateRange({ from: range?.from || null, to: range?.to || null })
            }
            numberOfMonths={2}
            disabled={{ after: new Date() }}
          />
        </PopoverContent>
      </Popover>

      {/* ── Clear Filters ── */}
      {hasActiveFilters && (
        <button
          onClick={clearFilters}
          className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 px-3.5 py-1.5 text-xs font-semibold text-slate-600 transition-colors h-9"
        >
          <X className="h-3.5 w-3.5 text-slate-500" />
          Clear
        </button>
      )}

      {/* ── Active Filter Count Badge ── */}
      {hasActiveFilters && (
        <Badge
          variant="secondary"
          className="text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-full"
        >
          {[
            searchQuery.trim() !== "" ? 1 : 0,
            department !== "All" ? 1 : 0,
            doctor !== "All" ? 1 : 0,
            sentiment !== "All" ? 1 : 0,
            dateRange.from ? 1 : 0,
          ].reduce((a, b) => a + b, 0)}{" "}
          active
        </Badge>
      )}
    </div>
  );
}
