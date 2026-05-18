import { useState } from "react";
import { Download, ChevronDown, Bell } from "lucide-react";
import ExecutiveOverview from "./components/ExecutiveOverview";
import SpecialtyBenchmarking from "./components/SpecialtyBenchmarking";
import ProviderDeepDive from "./components/ProviderDeepDive";

type Tab = "executive" | "benchmarking" | "provider";

const TABS: { id: Tab; label: string }[] = [
  { id: "executive", label: "Executive Overview" },
  { id: "benchmarking", label: "Specialty Benchmarking" },
  { id: "provider", label: "Provider Deep-Dive" },
];

const DATE_RANGES = [
  { value: "last7", label: "Last 7 Days" },
  { value: "last30", label: "Last 30 Days" },
  { value: "last90", label: "Last 90 Days" },
  { value: "ytd", label: "Year to Date" },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>("executive");
  const [dateRange, setDateRange] = useState("last30");

  return (
    <div className="min-h-screen bg-[#F3F4F6]">
      {/* ── Top Header ── */}
      <header className="bg-white border-b border-[#E5E7EB] px-8 h-[60px] flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#2563EB] rounded flex items-center justify-center shrink-0">
            <span className="text-white text-xs font-bold tracking-tight">
              PX
            </span>
          </div>
          <span className="text-[#111827] font-bold text-[17px] tracking-tight">
            Ambient PX Analytics
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {/* Date Picker */}
          <div className="relative">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="appearance-none border border-[#E5E7EB] rounded-[4px] pl-3 pr-8 py-1.5 text-sm text-gray-700 bg-white cursor-pointer focus:outline-none focus:border-[#2563EB] transition-colors"
            >
              {DATE_RANGES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
            <ChevronDown
              size={13}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
          </div>

          {/* Export PDF */}
          <button className="flex items-center gap-1.5 border border-[#E5E7EB] rounded-[4px] px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-colors">
            <Download size={13} className="text-gray-500" />
            Export PDF
          </button>

          {/* Notification bell */}
          <button className="relative w-8 h-8 flex items-center justify-center rounded-[4px] hover:bg-gray-50 transition-colors">
            <Bell size={15} className="text-gray-400" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
          </button>

          {/* Avatar */}
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
            <span className="text-[#2563EB] text-xs font-bold">SJ</span>
          </div>
        </div>
      </header>

      {/* ── Tab Navigation ── */}
      <div className="bg-white border-b border-[#E5E7EB] px-8">
        <nav className="flex" role="tablist">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative px-5 py-3.5 text-sm font-medium transition-colors focus:outline-none ${
                activeTab === tab.id
                  ? "text-[#2563EB]"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              {tab.label}
              {/* Active indicator bar */}
              <span
                className={`absolute bottom-0 left-0 right-0 h-[2px] rounded-t-sm transition-colors ${
                  activeTab === tab.id ? "bg-[#2563EB]" : "bg-transparent"
                }`}
              />
            </button>
          ))}
        </nav>
      </div>

      {/* ── Tab Views ── */}
      <div>
        {activeTab === "executive" && <ExecutiveOverview />}
        {activeTab === "benchmarking" && <SpecialtyBenchmarking />}
        {activeTab === "provider" && <ProviderDeepDive />}
      </div>
    </div>
  );
}
