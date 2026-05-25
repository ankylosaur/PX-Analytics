import { useState } from "react";
import { Bell, Upload, LogOut, Shield } from "lucide-react";
import AdminDashboard from "./components/AdminDashboard";
import AudioUploadModal from "./components/AudioUploadModal";
import { Toaster } from "./components/ui/sonner";
import { useAuth } from "./contexts/AuthContext";

export default function App() {
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const { user, profile, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50/40 flex flex-col font-sans antialiased selection:bg-blue-500 selection:text-white">
      {/* ─── Premium Enterprise Header ─── */}
      <header className="bg-white border-b border-slate-200/80 px-8 h-[60px] flex items-center justify-between shrink-0 sticky top-0 z-30 shadow-sm/5">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shrink-0 shadow-sm shadow-blue-500/15">
            <span className="text-white text-xs font-bold tracking-tight">
              PX
            </span>
          </div>
          <div>
            <span className="text-slate-950 font-bold text-[14px] tracking-tight block">
              PX Analytics
            </span>
            <span className="text-[10px] text-slate-400 font-semibold -mt-0.5 block">
              Patient Experience Command Center
            </span>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-3">
          {/* Role Indicator Badge */}
          {profile?.role && (
            <div className="hidden sm:flex items-center gap-1.5 bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-blue-100/50">
              <Shield className="h-3 w-3" />
              {profile.role}
            </div>
          )}

          {/* Upload Feedback Button */}
          <button
            onClick={() => setIsUploadOpen(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg px-4 py-2 text-xs font-semibold shadow-sm hover:shadow transition-all duration-200 cursor-pointer"
            id="header-upload-btn"
          >
            <Upload size={13} />
            Upload Feedback
          </button>

          {/* Notification bell */}
          <button className="relative w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-50 border border-slate-100 transition-colors">
            <Bell size={14} className="text-slate-500" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
          </button>

          {/* Sign Out / User Avatar */}
          <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
            <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center shrink-0 border border-blue-100">
              <span className="text-blue-600 text-xs font-bold uppercase">
                {profile?.displayName ? profile.displayName.slice(0, 2) : "AD"}
              </span>
            </div>
            {user && (
              <button
                onClick={signOut}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                title="Sign Out"
                aria-label="Sign out"
              >
                <LogOut size={14} />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ─── Main Admin Command Center ─── */}
      <AdminDashboard />

      {/* ─── Audio Upload Modal ─── */}
      <AudioUploadModal
        open={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
      />

      {/* ─── Global Sonner Toasts ─── */}
      <Toaster />
    </div>
  );
}
