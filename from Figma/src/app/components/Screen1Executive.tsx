import {
  LineChart,
  Line,
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
import { DashboardHeader } from "./DashboardHeader";

const trustTrendData = Array.from({ length: 30 }, (_, i) => {
  const base = 7.2 + (i / 29) * 1.2;
  const noise = Math.sin(i * 0.8) * 0.07 + Math.sin(i * 1.6) * 0.04;
  return { day: i + 1, score: parseFloat((base + noise).toFixed(2)) };
});

const sentimentData = [
  { name: "Positive", value: 68 },
  { name: "Neutral", value: 22 },
  { name: "Negative", value: 10 },
];

const surveyData = [
  { month: "Jan", rate: 4.8 },
  { month: "Feb", rate: 5.1 },
  { month: "Mar", rate: 4.9 },
  { month: "Apr", rate: 5.3 },
  { month: "May", rate: 5.0 },
];

const DONUT_COLORS = ["#2563EB", "#93C5FD", "#EF4444"];

const kpiCards = [
  {
    label: "Consultations Analyzed",
    value: "12,450",
    sub: "All departments, YTD",
    valueClass: "text-gray-900",
  },
  {
    label: "Feedback Capture Rate",
    value: "100%",
    sub: "Passive acoustic coverage",
    valueClass: "text-blue-600",
  },
  {
    label: "Global PX Sentiment",
    value: "8.4",
    suffix: "/10",
    sub: "↑ 0.3 pts from last month",
    valueClass: "text-gray-900",
  },
  {
    label: "Critical Alerts",
    value: "14",
    sub: "Requires immediate review",
    valueClass: "text-red-500",
  },
];

export default function Screen1Executive() {
  return (
    <div className="min-h-screen bg-white">
      <DashboardHeader />
      <main className="p-6 bg-[#F8F9FA] min-h-[calc(100vh-57px)]">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs font-semibold text-blue-600 uppercase tracking-widest">
            Screen 1
          </span>
          <span className="text-gray-300">|</span>
          <span className="text-xs text-gray-500">Executive Overview — Overall Feedback</span>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          {kpiCards.map((card, i) => (
            <div
              key={i}
              className="bg-white border border-gray-200 rounded-[4px] p-4"
            >
              <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider leading-tight">
                {card.label}
              </p>
              <p className={`text-3xl font-light mt-2 ${card.valueClass}`}>
                {card.value}
                {card.suffix && (
                  <span className="text-base text-gray-400">{card.suffix}</span>
                )}
              </p>
              <p className="text-[11px] text-gray-400 mt-1">{card.sub}</p>
            </div>
          ))}
        </div>

        {/* Line Chart */}
        <div className="bg-white border border-gray-200 rounded-[4px] p-5 mb-4">
          <div className="mb-3">
            <h2 className="text-sm font-medium text-gray-900">
              30-Day Patient Trust Trend
            </h2>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Composite score derived from passive acoustic analysis across all departments
            </p>
          </div>
          <ResponsiveContainer width="100%" height={190}>
            <LineChart
              data={trustTrendData}
              margin={{ top: 5, right: 24, left: 0, bottom: 5 }}
            >
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
                domain={[7, 8.6]}
                tick={{ fontSize: 10, fill: "#9CA3AF" }}
                tickLine={false}
                axisLine={false}
                tickCount={5}
              />
              <Tooltip
                contentStyle={{
                  border: "1px solid #E5E7EB",
                  borderRadius: "4px",
                  fontSize: "11px",
                  boxShadow: "none",
                }}
                formatter={(v) => [`${v}/10`, "Trust Score"]}
                labelFormatter={(l) => `Day ${l}`}
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#2563EB"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: "#2563EB", strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-2 gap-4">
          {/* Donut */}
          <div className="bg-white border border-gray-200 rounded-[4px] p-5">
            <h2 className="text-sm font-medium text-gray-900 mb-0.5">
              Passive Acoustic Sentiment
            </h2>
            <p className="text-[11px] text-gray-400 mb-4">
              Distribution across all 12,450 consultations
            </p>
            <div className="flex items-center gap-6">
              <div className="shrink-0">
                <PieChart width={150} height={150}>
                  <Pie
                    data={sentimentData}
                    cx="50%"
                    cy="50%"
                    innerRadius={42}
                    outerRadius={68}
                    dataKey="value"
                    paddingAngle={2}
                    startAngle={90}
                    endAngle={-270}
                  >
                    {sentimentData.map((entry, idx) => (
                      <Cell key={`sentiment-cell-${entry.name}`} fill={DONUT_COLORS[idx]} />
                    ))}
                  </Pie>
                </PieChart>
              </div>
              <div className="space-y-3 flex-1">
                {sentimentData.map((entry, idx) => (
                  <div key={entry.name} className="flex items-center gap-2.5">
                    <div
                      className="w-2.5 h-2.5 rounded-sm shrink-0"
                      style={{ backgroundColor: DONUT_COLORS[idx] }}
                    />
                    <span className="text-xs text-gray-600 flex-1">
                      {entry.name}
                    </span>
                    <span className="text-xs font-semibold text-gray-900">
                      {entry.value}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Traditional Survey Bar */}
          <div className="bg-white border border-gray-200 rounded-[4px] p-5">
            <h2 className="text-sm font-medium text-gray-900 mb-0.5">
              Traditional Survey Responses
            </h2>
            <p className="text-[11px] text-gray-400 mb-4">
              Historical baseline — avg. ~5% patient response rate
            </p>
            <ResponsiveContainer width="100%" height={150}>
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
                  domain={[0, 8]}
                  tick={{ fontSize: 10, fill: "#9CA3AF" }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip
                  contentStyle={{
                    border: "1px solid #E5E7EB",
                    borderRadius: "4px",
                    fontSize: "11px",
                    boxShadow: "none",
                  }}
                  formatter={(v) => [`${v}%`, "Response Rate"]}
                />
                <Bar
                  dataKey="rate"
                  fill="#93C5FD"
                  radius={[2, 2, 0, 0]}
                  maxBarSize={36}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </main>
    </div>
  );
}
