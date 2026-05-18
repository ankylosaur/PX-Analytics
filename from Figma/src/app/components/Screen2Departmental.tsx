import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from "recharts";
import { DashboardHeader } from "./DashboardHeader";

const deptData = [
  { dept: "Cardiology", score: 8.7 },
  { dept: "Pediatrics", score: 8.5 },
  { dept: "Oncology", score: 7.9 },
  { dept: "Neurology", score: 7.8 },
  { dept: "Gen. Practice", score: 7.5 },
];

const frictionPoints = [
  {
    issue: "Wait Time Anxiety",
    dept: "General Practice",
    severity: "High" as const,
    count: 142,
    trend: "↑",
  },
  {
    issue: "Treatment Confusion",
    dept: "Oncology",
    severity: "Medium" as const,
    count: 87,
    trend: "→",
  },
  {
    issue: "Medication Instructions",
    dept: "Neurology",
    severity: "Medium" as const,
    count: 64,
    trend: "↓",
  },
  {
    issue: "Discharge Process",
    dept: "Cardiology",
    severity: "Low" as const,
    count: 38,
    trend: "↓",
  },
  {
    issue: "Staff Communication",
    dept: "Pediatrics",
    severity: "Low" as const,
    count: 29,
    trend: "↓",
  },
];

const SEVERITY_STYLES = {
  High: "bg-red-50 text-red-600",
  Medium: "bg-amber-50 text-amber-600",
  Low: "bg-blue-50 text-blue-600",
};

const HOSPITAL_AVG = 8.0;

const CustomBarLabel = (props: {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  value?: number;
}) => {
  const { x = 0, y = 0, width = 0, height = 0, value = 0 } = props;
  return (
    <text
      x={x + width + 6}
      y={y + height / 2 + 1}
      fontSize={11}
      fill="#374151"
      dominantBaseline="middle"
    >
      {value}
    </text>
  );
};

export default function Screen2Departmental() {
  return (
    <div className="min-h-screen bg-white">
      <DashboardHeader />
      <main className="p-6 bg-[#F8F9FA] min-h-[calc(100vh-57px)]">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs font-semibold text-blue-600 uppercase tracking-widest">
            Screen 2
          </span>
          <span className="text-gray-300">|</span>
          <span className="text-xs text-gray-500">
            Departmental Benchmarking — Specialty-Wise
          </span>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-white border border-gray-200 rounded-[4px] p-4">
            <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">
              Top Performing Dept
            </p>
            <p className="text-2xl font-light text-gray-900 mt-2">Cardiology</p>
            <p className="text-[11px] text-blue-600 mt-1">8.7 / 10 avg. score</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-[4px] p-4">
            <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">
              Highest Improvement
            </p>
            <p className="text-2xl font-light text-gray-900 mt-2">Pediatrics</p>
            <p className="text-[11px] text-gray-400 mt-1">↑ 1.2 pts over 60 days</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-[4px] p-4">
            <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">
              Hospital Average
            </p>
            <p className="text-2xl font-light text-gray-900 mt-2">
              8.0
              <span className="text-sm text-gray-400">/10</span>
            </p>
            <p className="text-[11px] text-gray-400 mt-1">
              Across all departments
            </p>
          </div>
        </div>

        {/* Horizontal Bar Chart */}
        <div className="bg-white border border-gray-200 rounded-[4px] p-5 mb-4">
          <div className="mb-3">
            <h2 className="text-sm font-medium text-gray-900">
              Departmental PX Averages
            </h2>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Composite patient experience score · Dashed line = Hospital
              Average (8.0)
            </p>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={deptData}
              layout="vertical"
              margin={{ top: 5, right: 60, left: 8, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#F3F4F6"
                horizontal={false}
              />
              <XAxis
                type="number"
                domain={[6, 10]}
                tick={{ fontSize: 10, fill: "#9CA3AF" }}
                tickLine={false}
                axisLine={{ stroke: "#E5E7EB" }}
                tickCount={5}
              />
              <YAxis
                type="category"
                dataKey="dept"
                tick={{ fontSize: 12, fill: "#374151" }}
                tickLine={false}
                axisLine={false}
                width={96}
              />
              <Tooltip
                contentStyle={{
                  border: "1px solid #E5E7EB",
                  borderRadius: "4px",
                  fontSize: "11px",
                  boxShadow: "none",
                }}
                formatter={(v) => [`${v} / 10`, "PX Score"]}
              />
              <ReferenceLine
                x={HOSPITAL_AVG}
                stroke="#94A3B8"
                strokeDasharray="5 4"
                strokeWidth={1.5}
                label={{
                  value: "Avg",
                  position: "top",
                  fontSize: 10,
                  fill: "#94A3B8",
                }}
              />
              <Bar
                dataKey="score"
                radius={[0, 2, 2, 0]}
                maxBarSize={28}
                label={<CustomBarLabel />}
              >
                {deptData.map((entry, idx) => (
                  <Cell
                    key={`dept-cell-${entry.dept}`}
                    fill={entry.score >= HOSPITAL_AVG ? "#2563EB" : "#93C5FD"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Friction Points Table */}
        <div className="bg-white border border-gray-200 rounded-[4px] p-5">
          <h2 className="text-sm font-medium text-gray-900 mb-4">
            Friction Points by Specialty
          </h2>
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-gray-100">
                {["Issue", "Department", "Severity", "Trend", "Occurrences"].map(
                  (h) => (
                    <th
                      key={h}
                      className={`text-[10px] font-medium text-gray-400 uppercase tracking-wider pb-2.5 ${
                        h === "Occurrences" ? "text-right" : "text-left"
                      }`}
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {frictionPoints.map((point, i) => (
                <tr key={i} className="border-b border-gray-50 last:border-0">
                  <td className="py-3 text-xs text-gray-900 font-medium pr-4">
                    {point.issue}
                  </td>
                  <td className="py-3 text-xs text-gray-500 pr-4">
                    {point.dept}
                  </td>
                  <td className="py-3 pr-4">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-[2px] font-medium ${
                        SEVERITY_STYLES[point.severity]
                      }`}
                    >
                      {point.severity}
                    </span>
                  </td>
                  <td className="py-3 text-xs text-gray-400 pr-4">
                    {point.trend}
                  </td>
                  <td className="py-3 text-xs text-gray-900 text-right font-medium">
                    {point.count}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
