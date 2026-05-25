/**
 * KPIBar.tsx — Top-level KPI strip for the Admin Command Center
 *
 * Displays three key metrics:
 *   1. Total Feedbacks (last 30 days)
 *   2. Sentiment Breakdown (mini donut chart)
 *   3. Top Trending Pain Points
 */

import { MessageSquareText, TrendingUp, AlertTriangle } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { Card, CardContent } from "./ui/card";
import { Skeleton } from "./ui/skeleton";

const SENTIMENT_COLORS = {
  Positive: "#10b981", // Emerald-500
  Neutral: "#94a3b8",  // Slate-400
  Negative: "#f43f5e", // Rose-500
};

export default function KPIBar({ sentimentBreakdown, trendingPainPoints, totalCount, loading }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-6 bg-white border border-slate-200/80 shadow-sm rounded-xl min-h-[128px] flex items-center">
            <div className="flex items-center gap-4 w-full">
              <Skeleton className="h-12 w-12 rounded-xl bg-slate-100 animate-pulse" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3.5 w-24 bg-slate-100 animate-pulse rounded" />
                <Skeleton className="h-7 w-16 bg-slate-100 animate-pulse rounded" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  const donutData = [
    { name: "Positive", value: sentimentBreakdown.positive || 0 },
    { name: "Neutral", value: sentimentBreakdown.neutral || 0 },
    { name: "Negative", value: sentimentBreakdown.negative || 0 },
  ];

  const topPainPoints = trendingPainPoints.slice(0, 3);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* ── Total Feedbacks ── */}
      <Card className="p-6 bg-white border border-slate-200/80 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 ease-in-out rounded-xl min-h-[128px] flex items-center">
        <CardContent className="p-0 w-full">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 shrink-0">
              <MessageSquareText className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total Feedbacks
              </p>
              <p className="text-3xl font-bold text-slate-900 tracking-tight mt-0.5">
                {totalCount}
              </p>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">Last 30 days</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Sentiment Breakdown ── */}
      <Card className="p-6 bg-white border border-slate-200/80 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 ease-in-out rounded-xl min-h-[128px] flex items-center">
        <CardContent className="p-0 w-full">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={18}
                    outerRadius={30}
                    paddingAngle={3}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {donutData.map((entry) => (
                      <Cell
                        key={entry.name}
                        fill={SENTIMENT_COLORS[entry.name]}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Sentiment Breakdown
              </p>
              <div className="flex items-center gap-3 mt-2">
                <div className="flex items-center gap-1 shrink-0">
                  <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="text-xs font-bold text-slate-700">
                    {sentimentBreakdown.positivePercent || 0}%
                  </span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <span className="inline-block h-2 w-2 rounded-full bg-slate-400" />
                  <span className="text-xs font-bold text-slate-700">
                    {sentimentBreakdown.neutralPercent || 0}%
                  </span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <span className="inline-block h-2 w-2 rounded-full bg-rose-500" />
                  <span className="text-xs font-bold text-slate-700">
                    {sentimentBreakdown.negativePercent || 0}%
                  </span>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 font-medium mt-1">
                Positive · Neutral · Negative
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Trending Pain Points ── */}
      <Card className="p-6 bg-white border border-slate-200/80 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 ease-in-out rounded-xl min-h-[128px] flex items-center">
        <CardContent className="p-0 w-full">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 shrink-0">
              <TrendingUp className="h-6 w-6 text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Trending Pain Points
              </p>
              {topPainPoints.length > 0 ? (
                <ul className="mt-1.5 space-y-1.5">
                  {topPainPoints.map((pp) => (
                    <li
                      key={pp.point}
                      className="flex items-center gap-2 text-xs"
                    >
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                      <span className="text-slate-700 truncate font-semibold">
                        {pp.point}
                      </span>
                      <span className="text-slate-400 font-medium shrink-0">
                        ({pp.count})
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-400 font-medium mt-2 italic">
                  No pain points reported
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
