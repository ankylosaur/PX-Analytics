import { Search, Bell } from "lucide-react";

export function DashboardHeader() {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-blue-600 rounded-[4px] flex items-center justify-center">
          <span className="text-white text-xs font-bold">PX</span>
        </div>
        <span className="text-gray-900 font-semibold text-base tracking-tight">
          Ambient PX Analytics
        </span>
      </div>
      <div className="flex items-center gap-2 flex-1 max-w-xs mx-10">
        <div className="flex items-center gap-2 border border-gray-200 rounded-[4px] px-3 py-1.5 flex-1 bg-[#F8F9FA]">
          <Search size={13} className="text-gray-400 shrink-0" />
          <input
            type="text"
            placeholder="Search patients, departments..."
            className="bg-transparent text-xs text-gray-600 placeholder-gray-400 outline-none flex-1"
          />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Bell size={15} className="text-gray-400" />
        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
          <span className="text-blue-600 text-xs font-semibold">SJ</span>
        </div>
      </div>
    </header>
  );
}
