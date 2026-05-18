import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { useProviderMetrics } from "../../hooks/useDashboardData";
import { CardSkeleton, ChartSkeleton, EmptyState } from "./ChartSkeleton";

export default function ProviderDeepDive() {
  const {
    radarData,
    shiftData,
    pxScore,
    positiveDrivers,
    warningDrivers,
    profileStats,
    provider,
    loading,
    totalConsultations,
  } = useProviderMetrics("dr-jenkins", "last30");

  // ── Loading state ──
  if (loading) {
    return (
      <div className="p-6 space-y-5">
        <CardSkeleton className="h-24" />
        <div className="grid grid-cols-2 gap-5">
          <ChartSkeleton height={256} title="Communication Profile" />
          <div className="space-y-5">
            <ChartSkeleton height={140} title="Sentiment Trend" />
            <ChartSkeleton height={120} title="Key Drivers" />
          </div>
        </div>
      </div>
    );
  }

  // ── Resolved data ──
  const resolvedRadar = radarData || [
    { subject: "Empathy", value: 0, fullMark: 100 },
    { subject: "Clarity", value: 0, fullMark: 100 },
    { subject: "Efficiency", value: 0, fullMark: 100 },
  ];
  const resolvedShift = shiftData || [];
  const resolvedScore = pxScore || 0;
  const resolvedPositive = positiveDrivers || ["No data yet"];
  const resolvedWarning = warningDrivers || ["No data yet"];
  const resolvedStats = profileStats || [
    { label: "Patients Seen", value: "0" },
    { label: "Avg. Consult", value: "—" },
    { label: "Follow-up Rate", value: "—" },
    { label: "Peer Rank", value: "—" },
  ];

  const providerName = provider?.name || "Dr. Sarah Jenkins";
  const providerSpecialty = provider?.specialty || "Cardiology";
  const providerYear = provider?.joinedYear || 2019;
  const initials = providerName.split(" ").filter((_, i, a) => i === 0 || i === a.length - 1).map((w) => w[0]).join("").replace("D", "").replace("r", "").replace(".", "");
  const displayInitials = providerName.includes("Jenkins") ? "SJ" : initials.slice(0, 2).toUpperCase();

  return (
    <div className="p-6 space-y-5">
      {/* Profile Header */}
      <div className="bg-white border border-[#E5E7EB] rounded-[4px] p-6 flex items-center justify-between">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
            <span className="text-[#2563EB] font-semibold">{displayInitials}</span>
          </div>
          <div>
            <h2 className="text-base font-bold text-[#111827]">
              {providerName}
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {providerSpecialty} · Attending Physician · Joined {providerYear}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-10">
          {resolvedStats.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
                {s.label}
              </p>
              <p className="text-base font-semibold text-[#111827] mt-1.5">
                {s.value}
              </p>
            </div>
          ))}
          <div className="border-l border-gray-200 pl-10 text-right">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
              Individual PX Score
            </p>
            <p className="text-[2rem] font-light text-[#111827] mt-1 leading-none">
              {resolvedScore}
              <span className="text-base font-light text-gray-400"> /10</span>
            </p>
          </div>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-2 gap-5">
        {/* Left — Radar Chart */}
        <div className="bg-white border border-[#E5E7EB] rounded-[4px] p-6">
          <h2 className="text-sm font-semibold text-[#111827]">
            Communication Profile
          </h2>
          <p className="text-xs text-gray-400 mt-1 mb-4">
            Derived from patient feedback analysis — translucent blue fill,
            solid stroke
          </p>
          {totalConsultations > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={256}>
                <RadarChart
                  data={resolvedRadar}
                  margin={{ top: 10, right: 44, bottom: 10, left: 44 }}
                >
                  <PolarGrid stroke="#E5E7EB" strokeWidth={1} />
                  <PolarAngleAxis
                    dataKey="subject"
                    tick={{ fontSize: 13, fill: "#374151", fontWeight: 600 }}
                  />
                  <PolarRadiusAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 9, fill: "#9CA3AF" }}
                    tickCount={4}
                    axisLine={false}
                  />
                  <Radar
                    dataKey="value"
                    stroke="#2563EB"
                    strokeWidth={2}
                    fill="#2563EB"
                    fillOpacity={0.15}
                  />
                </RadarChart>
              </ResponsiveContainer>
              <div className="flex justify-around border-t border-gray-100 pt-4 mt-1">
                {resolvedRadar.map((d) => (
                  <div key={d.subject} className="text-center">
                    <p className="text-xs text-gray-500">{d.subject}</p>
                    <p className="text-sm font-bold text-[#111827] mt-1">
                      {d.value}
                      <span className="text-[11px] font-normal text-gray-400">
                        /100
                      </span>
                    </p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <EmptyState height={256} />
          )}
        </div>

        {/* Right — Stacked */}
        <div className="space-y-5">
          {/* Shift Timeline */}
          <div className="bg-white border border-[#E5E7EB] rounded-[4px] p-6">
            <h2 className="text-sm font-semibold text-[#111827]">
              Sentiment Trend — Shift Timeline
            </h2>
            <p className="text-xs text-gray-400 mt-1 mb-4">
              PX score 7AM-7PM · Afternoon dip at 3PM flagged for coaching
            </p>
            {resolvedShift.length > 0 ? (
              <ResponsiveContainer width="100%" height={140}>
                <LineChart
                  data={resolvedShift}
                  margin={{ top: 5, right: 10, left: -18, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis
                    dataKey="time"
                    tick={{ fontSize: 10, fill: "#9CA3AF" }}
                    tickLine={false}
                    axisLine={{ stroke: "#E5E7EB" }}
                  />
                  <YAxis
                    domain={[7.5, 9.5]}
                    tick={{ fontSize: 10, fill: "#9CA3AF" }}
                    tickLine={false}
                    axisLine={false}
                    tickCount={4}
                  />
                  <Tooltip
                    contentStyle={{
                      border: "1px solid #E5E7EB",
                      borderRadius: "4px",
                      fontSize: "12px",
                      boxShadow: "none",
                    }}
                    formatter={(v) => [`${v} / 10`, "PX Score"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#2563EB"
                    strokeWidth={2}
                    dot={{
                      r: 3.5,
                      fill: "#2563EB",
                      stroke: "#fff",
                      strokeWidth: 2,
                    }}
                    activeDot={{ r: 5, fill: "#2563EB", strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState height={140} />
            )}
          </div>

          {/* Key Drivers */}
          <div className="bg-white border border-[#E5E7EB] rounded-[4px] p-6">
            <h2 className="text-sm font-semibold text-[#111827] mb-5">
              Key Drivers
            </h2>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2.5">
              Strengths
            </p>
            <div className="flex flex-wrap gap-2 mb-5">
              {resolvedPositive.map((d) => (
                <span
                  key={d}
                  className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-100"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  {d}
                </span>
              ))}
            </div>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2.5">
              Needs Attention
            </p>
            <div className="flex flex-wrap gap-2">
              {resolvedWarning.map((d) => (
                <span
                  key={d}
                  className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 font-semibold border border-amber-100"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                  {d}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
