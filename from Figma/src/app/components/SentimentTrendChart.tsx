/**
 * SentimentTrendChart.tsx — Time-series sentiment analytics chart.
 *
 * Visualizes the volume of Positive, Neutral, and Negative feedback over time
 * using a stacked Recharts AreaChart. Automatically groups by day and respects
 * all active dashboard filters and date ranges.
 */

import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { LineChart as ChartIcon } from "lucide-react";
import { format, eachDayOfInterval, subDays, startOfDay } from "date-fns";

export default function SentimentTrendChart({ feedbacks, dateRange, loading }) {
  // ─── Group Data by Day ───
  const chartData = useMemo(() => {
    if (loading || !feedbacks) return [];

    // 1. Establish the date range interval
    let start = dateRange?.from ? startOfDay(dateRange.from) : null;
    let end = dateRange?.to ? startOfDay(dateRange.to) : startOfDay(new Date());

    if (!start) {
      // If no start date is set, default to 30 days back from end date
      start = subDays(end, 29);
    }

    // 2. Generate a list of all days in the interval to ensure zero-filled dates are plotted
    let intervalDays = [];
    try {
      intervalDays = eachDayOfInterval({ start, end });
    } catch (e) {
      // Fallback in case of invalid date intervals
      intervalDays = eachDayOfInterval({ start: subDays(new Date(), 29), end: new Date() });
    }

    // 3. Initialize mapping of formatted date strings to count objects
    const dayMap = {};
    intervalDays.forEach((day) => {
      const formatted = format(day, "MMM d");
      dayMap[formatted] = {
        date: formatted,
        rawDate: day,
        Positive: 0,
        Neutral: 0,
        Negative: 0,
      };
    });

    // 4. Fill map with actual feedback counts
    feedbacks.forEach((fb) => {
      if (!fb.timestamp) return;
      const fbDate = fb.timestamp.toDate ? fb.timestamp.toDate() : new Date(fb.timestamp);
      const formatted = format(fbDate, "MMM d");

      // Only count if within our established intervals
      if (dayMap[formatted]) {
        dayMap[formatted][fb.sentiment] = (dayMap[formatted][fb.sentiment] || 0) + 1;
      }
    });

    // Return sorted array of values
    return Object.values(dayMap).sort((a: any, b: any) => a.rawDate.getTime() - b.rawDate.getTime());
  }, [feedbacks, dateRange, loading]);

  const hasData = feedbacks && feedbacks.length > 0;

  // Custom tooltip renderer for premium styling
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/90 backdrop-blur-md border border-slate-200/85 p-3 rounded-lg shadow-xl text-xs font-semibold text-slate-800 space-y-1.5">
          <p className="font-extrabold border-b border-slate-100 pb-1 text-slate-900">{label}</p>
          {payload.map((entry: any) => (
            <div key={entry.name} className="flex items-center gap-2">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-slate-500 font-semibold capitalize">{entry.name}:</span>
              <span className="text-slate-900 font-bold">
                {entry.value} {entry.value === 1 ? "feedback" : "feedbacks"}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="p-6 bg-white border border-slate-200/80 shadow-sm rounded-xl transition-all duration-300">
      <CardHeader className="p-0 pb-4 flex flex-row items-center justify-between border-b border-slate-100 mb-5">
        <div>
          <CardTitle className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ChartIcon className="h-4.5 w-4.5 text-blue-600" />
            Sentiment Volume Trends
          </CardTitle>
          <p className="text-[10px] text-slate-400 font-medium mt-0.5">
            Daily breakdown of Positive, Neutral, and Negative feedback submissions
          </p>
        </div>
      </CardHeader>

      <CardContent className="p-0 h-auto w-full flex items-center justify-center">
        {loading ? (
          <div className="w-full h-[300px] flex flex-col gap-4 justify-between animate-pulse">
            <div className="h-4 w-32 bg-slate-100 rounded" />
            <div className="flex-1 w-full bg-slate-50/50 rounded-lg border border-dashed border-slate-200 flex items-center justify-center">
              <span className="text-xs text-slate-400 font-medium">Loading trends...</span>
            </div>
          </div>
        ) : !hasData ? (
          <div className="w-full h-[300px] rounded-lg border border-dashed border-slate-200 bg-slate-50/20 flex flex-col items-center justify-center p-8 text-center">
            <ChartIcon className="h-8 w-8 text-slate-300 mb-2.5" />
            <p className="text-xs font-bold text-slate-800">Not enough data for this period</p>
            <p className="text-[10px] text-slate-400 font-medium max-w-[200px] mt-1">
              Adjust your filters or upload new feedback to generate time-series trend charts.
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorPositive" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorNeutral" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#94a3b8" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorNegative" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis
                dataKey="date"
                stroke="#64748b"
                fontSize={10}
                fontWeight={600}
                tickLine={false}
                axisLine={false}
                dy={10}
              />
              <YAxis
                stroke="#64748b"
                fontSize={10}
                fontWeight={600}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#e2e8f0", strokeWidth: 1 }} />
              <Area
                type="monotone"
                dataKey="Positive"
                stroke="#10b981"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorPositive)"
                stackId="1"
              />
              <Area
                type="monotone"
                dataKey="Neutral"
                stroke="#94a3b8"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorNeutral)"
                stackId="1"
              />
              <Area
                type="monotone"
                dataKey="Negative"
                stroke="#f43f5e"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorNegative)"
                stackId="1"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
