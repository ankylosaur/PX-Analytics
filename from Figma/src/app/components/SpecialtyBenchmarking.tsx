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
import { useBenchmarkingMetrics } from "../../hooks/useDashboardData";
import { CardSkeleton, ChartSkeleton, EmptyState } from "./ChartSkeleton";

const SEVERITY: Record<string, string> = {
  High: "bg-red-100 text-red-700 border border-red-200",
  Medium: "bg-amber-100 text-amber-700 border border-amber-200",
  Low: "bg-blue-50 text-blue-600 border border-blue-100",
};

interface LabelProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  value?: number;
}

function BarValueLabel({ x = 0, y = 0, width = 0, height = 0, value = 0 }: LabelProps) {
  return (
    <text
      x={x + width + 7}
      y={y + height / 2}
      fontSize={11}
      fill="#374151"
      dominantBaseline="middle"
    >
      {value}
    </text>
  );
}

export default function SpecialtyBenchmarking() {
  const { deptData, hospAvg, topDept, frictionPoints, loading, error } = useBenchmarkingMetrics("last30");

  // ── Loading state ──
  if (loading) {
    return (
      <div className="p-6 space-y-5">
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <CardSkeleton key={i} />)}
        </div>
        <ChartSkeleton height={248} title="Departmental PX Averages" />
        <ChartSkeleton height={200} title="Identified Friction Points" />
      </div>
    );
  }

  // ── Resolved data ──
  const resolvedDeptData = deptData || [];
  const resolvedAvg = hospAvg || 8.0;
  const resolvedTop = topDept || { dept: "—", score: 0 };
  const resolvedFriction = frictionPoints || [];

  return (
    <div className="p-6 space-y-5">
      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-[#E5E7EB] rounded-[4px] p-6">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
            Top Performing Dept
          </p>
          <p className="text-2xl font-light text-[#111827] mt-3">{resolvedTop.dept}</p>
          <p className="text-xs text-[#2563EB] font-semibold mt-2.5">
            Score: {resolvedTop.score} / 10
          </p>
        </div>
        <div className="bg-white border border-[#E5E7EB] rounded-[4px] p-6">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
            Highest Improvement
          </p>
          <p className="text-2xl font-light text-[#111827] mt-3">
            {resolvedDeptData.length > 1 ? resolvedDeptData[1]?.dept : "—"}
          </p>
          <p className="text-xs text-emerald-600 font-semibold mt-2.5">
            ↑ Trending upward
          </p>
        </div>
        <div className="bg-white border border-[#E5E7EB] rounded-[4px] p-6">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
            Hospital Average
          </p>
          <p className="text-2xl font-light text-[#111827] mt-3">
            {resolvedAvg}
            <span className="text-sm text-gray-400 font-light"> / 10</span>
          </p>
          <p className="text-xs text-gray-400 mt-2.5">All departments combined</p>
        </div>
      </div>

      {/* Horizontal Bar Chart */}
      <div className="bg-white border border-[#E5E7EB] rounded-[4px] p-6">
        <div className="mb-5">
          <h2 className="text-sm font-semibold text-[#111827]">
            Departmental PX Averages
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Composite patient experience score · Dashed line = Hospital Average
            ({resolvedAvg}) · Blue = above average
          </p>
        </div>
        {resolvedDeptData.length > 0 ? (
          <ResponsiveContainer width="100%" height={248}>
            <BarChart
              data={resolvedDeptData}
              layout="vertical"
              margin={{ top: 4, right: 64, left: 8, bottom: 4 }}
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
                width={104}
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
              <ReferenceLine
                x={resolvedAvg}
                stroke="#9CA3AF"
                strokeDasharray="5 4"
                strokeWidth={1.5}
                label={{
                  value: "Avg",
                  position: "insideTopRight",
                  fontSize: 10,
                  fill: "#9CA3AF",
                  dy: -4,
                }}
              />
              <Bar
                dataKey="score"
                radius={[0, 2, 2, 0]}
                maxBarSize={28}
                label={<BarValueLabel />}
              >
                {resolvedDeptData.map((entry) => (
                  <Cell
                    key={`dept-${entry.dept}`}
                    fill={entry.score >= resolvedAvg ? "#2563EB" : "#93C5FD"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState height={248} />
        )}
      </div>

      {/* Friction Points Table */}
      <div className="bg-white border border-[#E5E7EB] rounded-[4px] p-6">
        <h2 className="text-sm font-semibold text-[#111827] mb-5">
          Identified Friction Points
        </h2>
        {resolvedFriction.length > 0 ? (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                {["Issue", "Department", "Severity", "Occurrences"].map((h) => (
                  <th
                    key={h}
                    className={`text-[10px] font-semibold text-gray-400 uppercase tracking-widest pb-3 ${
                      h === "Occurrences" ? "text-right" : "text-left"
                    }`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {resolvedFriction.map((row, i) => (
                <tr key={i} className="border-b border-gray-50 last:border-0">
                  <td className="py-3.5 text-sm font-medium text-[#111827] pr-6">
                    {row.issue}
                  </td>
                  <td className="py-3.5 text-sm text-gray-500 pr-6">{row.dept}</td>
                  <td className="py-3.5 pr-6">
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                        SEVERITY[row.severity]
                      }`}
                    >
                      {row.severity}
                    </span>
                  </td>
                  <td className="py-3.5 text-sm font-semibold text-[#111827] text-right">
                    {row.occurrences}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <EmptyState message="No friction points detected in this timeframe" height={100} />
        )}
      </div>
    </div>
  );
}
