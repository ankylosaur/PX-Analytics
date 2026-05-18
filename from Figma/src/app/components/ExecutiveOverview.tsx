import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";
import AudioUploader from "./AudioUploader";
import { useExecutiveMetrics } from "../../hooks/useDashboardData";
import { CardSkeleton, ChartSkeleton, EmptyState } from "./ChartSkeleton";

const DONUT_COLORS = ["#2563EB", "#93C5FD", "#EF4444"];

// Survey data stays static — it's historical baseline, not from Firestore
const surveyData = [
  { month: "Jan", rate: 4.8 },
  { month: "Feb", rate: 5.1 },
  { month: "Mar", rate: 4.9 },
  { month: "Apr", rate: 5.3 },
  { month: "May", rate: 5.0 },
];

export default function ExecutiveOverview() {
  const { kpis, trustTrendData, sentimentData, loading, error } = useExecutiveMetrics("last30");

  // ── Loading state ──
  if (loading) {
    return (
      <div className="p-6 space-y-5">
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <CardSkeleton key={i} />)}
        </div>
        <ChartSkeleton height={200} title="30-Day Patient Trust Trend" />
        <div className="grid grid-cols-2 gap-4">
          <ChartSkeleton height={156} title="Acoustic Sentiment" />
          <ChartSkeleton height={156} title="Historical Survey Response Rate" />
        </div>
      </div>
    );
  }

  // ── Resolved data (fallback to safe defaults if Firestore is empty) ──
  const resolvedKpis = kpis || [
    { label: "Consultations Analyzed", value: "0", valueClass: "text-[#111827]", sub: "No data yet", subClass: "text-gray-400" },
    { label: "Feedback Capture", value: "100%", valueClass: "text-[#2563EB]", sub: "Natively captured", subClass: "text-gray-400" },
    { label: "Global Sentiment", value: "—", valueClass: "text-[#111827]", sub: "Awaiting data", subClass: "text-gray-400" },
    { label: "Critical Friction Alerts", value: "0", valueClass: "text-red-500", sub: "No alerts", subClass: "text-gray-400" },
  ];

  const resolvedTrustData = trustTrendData || [];
  const resolvedSentiment = sentimentData || [
    { name: "Positive", value: 0 },
    { name: "Neutral", value: 0 },
    { name: "Negative", value: 0 },
  ];

  return (
    <div className="p-6 space-y-5">
      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        {resolvedKpis.map((k) => (
          <div
            key={k.label}
            className="bg-white border border-[#E5E7EB] rounded-[4px] p-6"
          >
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest leading-tight">
              {k.label}
            </p>
            <p className={`text-[2rem] font-light mt-3 leading-none ${k.valueClass}`}>
              {k.value}
              {k.suffix && (
                <span className="text-base font-light text-gray-400">
                  {k.suffix}
                </span>
              )}
            </p>
            <p className={`text-xs mt-2.5 ${k.subClass}`}>{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Audio Upload */}
      <AudioUploader />

      {/* Area Chart — Trust Trend */}
      <div className="bg-white border border-[#E5E7EB] rounded-[4px] p-6">
        <div className="mb-5">
          <h2 className="text-sm font-semibold text-[#111827]">
            30-Day Patient Trust Trend
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Composite score derived from passive acoustic analysis · Steady
            upward trajectory
          </p>
        </div>
        {resolvedTrustData.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart
              data={resolvedTrustData}
              margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
            >
              <defs>
                <linearGradient id="trustGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563EB" stopOpacity={0.12} />
                  <stop offset="95%" stopColor="#2563EB" stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 10, fill: "#9CA3AF" }}
                tickLine={false}
                axisLine={{ stroke: "#E5E7EB" }}
                interval={4}
                label={{
                  value: "Day",
                  position: "insideBottomRight",
                  offset: -4,
                  fontSize: 10,
                  fill: "#9CA3AF",
                }}
              />
              <YAxis
                domain={[7, 8.8]}
                tick={{ fontSize: 10, fill: "#9CA3AF" }}
                tickLine={false}
                axisLine={false}
                tickCount={5}
              />
              <Tooltip
                contentStyle={{
                  border: "1px solid #E5E7EB",
                  borderRadius: "4px",
                  fontSize: "12px",
                  boxShadow: "none",
                }}
                formatter={(v) => [`${v} / 10`, "Trust Score"]}
                labelFormatter={(l) => `Day ${l}`}
              />
              <Area
                type="monotone"
                dataKey="score"
                stroke="#2563EB"
                strokeWidth={2}
                fill="url(#trustGradient)"
                dot={false}
                activeDot={{ r: 4, fill: "#2563EB", strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState height={200} />
        )}
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-2 gap-4">
        {/* Donut — Acoustic Sentiment */}
        <div className="bg-white border border-[#E5E7EB] rounded-[4px] p-6">
          <h2 className="text-sm font-semibold text-[#111827]">
            Acoustic Sentiment
          </h2>
          <p className="text-xs text-gray-400 mt-1 mb-6">
            Distribution across all consultations
          </p>
          <div className="flex items-center gap-8">
            <div className="shrink-0">
              <PieChart width={156} height={156}>
                <Pie
                  data={resolvedSentiment}
                  cx="50%"
                  cy="50%"
                  innerRadius={44}
                  outerRadius={70}
                  dataKey="value"
                  paddingAngle={2}
                  startAngle={90}
                  endAngle={-270}
                >
                  {resolvedSentiment.map((entry, idx) => (
                    <Cell
                      key={`sentiment-${entry.name}`}
                      fill={DONUT_COLORS[idx]}
                    />
                  ))}
                </Pie>
              </PieChart>
            </div>
            <div className="space-y-4 flex-1">
              {resolvedSentiment.map((entry, idx) => (
                <div key={entry.name} className="flex items-center gap-3">
                  <div
                    className="w-2.5 h-2.5 rounded-sm shrink-0"
                    style={{ backgroundColor: DONUT_COLORS[idx] }}
                  />
                  <span className="text-sm text-gray-600 flex-1">
                    {entry.name}
                  </span>
                  <span className="text-sm font-semibold text-[#111827]">
                    {entry.value}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bar — Historical Survey (static data, unchanged) */}
        <div className="bg-white border border-[#E5E7EB] rounded-[4px] p-6">
          <h2 className="text-sm font-semibold text-[#111827]">
            Historical Survey Response Rate
          </h2>
          <p className="text-xs text-gray-400 mt-1 mb-6">
            Traditional survey baseline — avg. ~5% capture (vs. 100% ambient)
          </p>
          <ResponsiveContainer width="100%" height={156}>
            <BarChart
              data={surveyData}
              margin={{ top: 4, right: 10, left: -22, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 10, fill: "#9CA3AF" }}
                tickLine={false}
                axisLine={{ stroke: "#E5E7EB" }}
              />
              <YAxis
                domain={[0, 10]}
                tick={{ fontSize: 10, fill: "#9CA3AF" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip
                contentStyle={{
                  border: "1px solid #E5E7EB",
                  borderRadius: "4px",
                  fontSize: "12px",
                  boxShadow: "none",
                }}
                formatter={(v) => [`${v}%`, "Response Rate"]}
              />
              <Bar
                dataKey="rate"
                fill="#93C5FD"
                radius={[2, 2, 0, 0]}
                maxBarSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
