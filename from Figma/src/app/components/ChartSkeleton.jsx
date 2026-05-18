/**
 * ChartSkeleton.jsx — Corporate minimalist loading skeleton for chart containers
 * Uses animate-pulse on light grey divs to match the design system.
 */

export function CardSkeleton({ className = "" }) {
  return (
    <div className={`bg-white border border-[#E5E7EB] rounded-[4px] p-6 ${className}`}>
      <div className="h-3 w-28 bg-gray-100 rounded animate-pulse" />
      <div className="h-8 w-20 bg-gray-100 rounded animate-pulse mt-3" />
      <div className="h-3 w-36 bg-gray-50 rounded animate-pulse mt-3" />
    </div>
  );
}

export function ChartSkeleton({ height = 200, title = "" }) {
  return (
    <div className="bg-white border border-[#E5E7EB] rounded-[4px] p-6">
      {title && (
        <div className="mb-5">
          <div className="h-4 w-48 bg-gray-100 rounded animate-pulse" />
          <div className="h-3 w-72 bg-gray-50 rounded animate-pulse mt-2" />
        </div>
      )}
      <div
        className="bg-gray-50 rounded animate-pulse"
        style={{ height }}
      />
    </div>
  );
}

export function EmptyState({ message = "No acoustic data available for this timeframe", height = 200 }) {
  return (
    <div
      className="flex items-center justify-center text-sm text-gray-400"
      style={{ height }}
    >
      {message}
    </div>
  );
}
