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
  Tooltip,
} from "recharts";
import { DashboardHeader } from "./DashboardHeader";

const radarData = [
  { axis: "Empathy", value: 88, fullMark: 100 },
  { axis: "Clarity", value: 82, fullMark: 100 },
  { axis: "Efficiency", value: 75, fullMark: 100 },
];

const shiftData = [
  { time: "7AM", score: 8.5 },
  { time: "9AM", score: 8.8 },
  { time: "11AM", score: 9.0 },
  { time: "1PM", score: 8.3 },
  { time: "3PM", score: 7.9 },
  { time: "5PM", score: 8.2 },
  { time: "7PM", score: 8.6 },
];

const keyDrivers = [
  {
    label: "Excellent Medication Explanation",
    type: "positive" as const,
    count: 47,
  },
  {
    label: "Patient Empathy & Active Listening",
    type: "positive" as const,
    count: 38,
  },
  {
    label: "Clear Follow-up Instructions",
    type: "positive" as const,
    count: 31,
  },
  { label: "Rushed Discharge Process", type: "warning" as const, count: 12 },
  {
    label: "Limited Wait Time Communication",
    type: "warning" as const,
    count: 9,
  },
];

const stats = [
  { label: "Total Patients Seen", value: "284" },
  { label: "Avg. Consult Length", value: "18 min" },
  { label: "Follow-up Rate", value: "94%" },
  { label: "Peer Rank", value: "#2 / 14" },
];

export default function Screen3Provider() {
  return (
    <div className="min-h-screen bg-white">
      <DashboardHeader />
      <main className="p-6 bg-[#F8F9FA] min-h-[calc(100vh-57px)]">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs font-semibold text-blue-600 uppercase tracking-widest">
            Screen 3
          </span>
          <span className="text-gray-300">|</span>
          <span className="text-xs text-gray-500">
            Provider Coaching Deep-Dive — Doctor-Wise
          </span>
        </div>

        {/* Profile Strip */}
        <div className="bg-white border border-gray-200 rounded-[4px] p-4 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
              <span className="text-blue-600 font-semibold text-sm">SJ</span>
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                Dr. Sarah Jenkins
              </h2>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Cardiology · Attending Physician · Joined Jan 2019
              </p>
            </div>
          </div>

          <div className="flex items-center gap-8">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">
                  {s.label}
                </p>
                <p className="text-base font-medium text-gray-900 mt-0.5">
                  {s.value}
                </p>
              </div>
            ))}
            <div className="border-l border-gray-200 pl-8 text-right">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider">
                Individual PX Score
              </p>
              <p className="text-3xl font-light text-gray-900 mt-1">
                8.7
                <span className="text-base text-gray-400">/10</span>
              </p>
            </div>
          </div>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-2 gap-4">
          {/* Left — Radar */}
          <div className="bg-white border border-gray-200 rounded-[4px] p-5">
            <h2 className="text-sm font-medium text-gray-900 mb-0.5">
              Communication Profile
            </h2>
            <p className="text-[11px] text-gray-400 mb-3">
              Composite axes derived from patient feedback analysis
            </p>
            <ResponsiveContainer width="100%" height={240}>
              <RadarChart
                data={radarData}
                margin={{ top: 10, right: 40, bottom: 10, left: 40 }}
              >
                <PolarGrid stroke="#E5E7EB" strokeWidth={1} />
                <PolarAngleAxis
                  dataKey="axis"
                  tick={{ fontSize: 12, fill: "#374151", fontWeight: 500 }}
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
                  fillOpacity={0.12}
                />
              </RadarChart>
            </ResponsiveContainer>
            <div className="flex justify-around mt-1 border-t border-gray-100 pt-3">
              {radarData.map((d) => (
                <div key={d.axis} className="text-center">
                  <p className="text-[11px] text-gray-500">{d.axis}</p>
                  <p className="text-sm font-semibold text-gray-900 mt-0.5">
                    {d.value}
                    <span className="text-[10px] text-gray-400 font-normal">
                      /100
                    </span>
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Right — Stacked cards */}
          <div className="space-y-4">
            {/* Sparkline */}
            <div className="bg-white border border-gray-200 rounded-[4px] p-5">
              <h2 className="text-sm font-medium text-gray-900 mb-0.5">
                Sentiment Trend — Shift Timeline
              </h2>
              <p className="text-[11px] text-gray-400 mb-3">
                PX score across today's shift · Slight afternoon dip noted
              </p>
              <ResponsiveContainer width="100%" height={120}>
                <LineChart
                  data={shiftData}
                  margin={{ top: 5, right: 10, left: -18, bottom: 0 }}
                >
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
                      fontSize: "11px",
                      boxShadow: "none",
                    }}
                    formatter={(v) => [`${v}/10`, "PX Score"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#2563EB"
                    strokeWidth={2}
                    dot={{ r: 3, fill: "#2563EB", stroke: "#fff", strokeWidth: 2 }}
                    activeDot={{ r: 4, fill: "#2563EB", strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Key Drivers */}
            <div className="bg-white border border-gray-200 rounded-[4px] p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-medium text-gray-900">
                  Key Drivers
                </h2>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 text-[10px] text-gray-400">
                    <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                    Positive
                  </span>
                  <span className="flex items-center gap-1 text-[10px] text-gray-400">
                    <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                    Needs Attention
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                {keyDrivers.map((driver, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-[3px] font-medium ${
                        driver.type === "positive"
                          ? "bg-green-50 text-green-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          driver.type === "positive"
                            ? "bg-green-500"
                            : "bg-amber-400"
                        }`}
                      />
                      {driver.label}
                    </span>
                    <span className="text-[11px] text-gray-400 ml-2 shrink-0">
                      {driver.count}×
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
