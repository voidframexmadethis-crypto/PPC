import React from "react";
import { Menu, Volume2, Upload, Bell, LogIn, LogOut, Check, Sparkles, Loader2 } from "lucide-react";

export interface HeaderProps {
  setSidebarOpen: (open: boolean) => void;
  playVoiceGreeting: () => void;
  isPlayingVoice: boolean;
  setIsUploaderOverlayOpen: (open: boolean) => void;
  user: any;
  logout: () => void;
  handleSignIn: () => void;
  signingIn: boolean;
  isSubscribed: boolean;
  notifDropdownOpen: boolean;
  setNotifDropdownOpen: (open: boolean) => void;
  hasUnreadNotif: boolean;
  notifications: any[];
}

export default function Header({
  setSidebarOpen,
  playVoiceGreeting,
  isPlayingVoice,
  setIsUploaderOverlayOpen,
  user,
  logout,
  handleSignIn,
  signingIn,
  isSubscribed,
  notifDropdownOpen,
  setNotifDropdownOpen,
  hasUnreadNotif,
  notifications,
}: HeaderProps) {
  return (
    <header className="flex items-center justify-between h-20 px-6 border-b border-white/5 bg-neutral-900/40 backdrop-blur-2xl sticky top-0 z-40 flex-shrink-0">
      <div className="flex items-center space-x-4">
        <button
          className="lg:hidden text-neutral-400 hover:text-white p-2 rounded-lg hover:bg-white/5"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu className="w-6 h-6" />
        </button>

        {/* Engine Status */}
        <div className="flex items-center space-x-2 bg-black/40 px-4 py-2 rounded-full border border-white/5">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
          <span className="text-[10px] text-white font-black tracking-widest uppercase">
            Engine Online
          </span>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {/* Voice Tag / Uploader */}
        <div className="hidden md:flex items-center gap-2">
          <button
            onClick={playVoiceGreeting}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/5 text-indigo-300 rounded-xl text-xs font-bold transition-all shadow-inner"
          >
            <Volume2 className={`w-4 h-4 ${isPlayingVoice ? "animate-bounce text-indigo-400" : ""}`} />
            <span>{isPlayingVoice ? "Live..." : "Producer Tag"}</span>
          </button>
        </div>

        {/* Auth Button */}
        {user ? (
          <button
            onClick={logout}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/5 text-white rounded-xl text-xs font-bold transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        ) : (
          <button
            onClick={handleSignIn}
            disabled={signingIn}
            className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-500/20 transition-all"
          >
            {signingIn ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
            <span>{signingIn ? "Authenticating..." : "Producer Access"}</span>
          </button>
        )}

        {/* Notifications */}
        <button
          onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
          className="relative p-3 rounded-full text-neutral-400 hover:text-white hover:bg-white/5 transition-all"
        >
          <Bell className={`w-5 h-5 ${hasUnreadNotif ? "animate-pulse text-indigo-400" : ""}`} />
          {hasUnreadNotif && <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-indigo-500 rounded-full" />}
        </button>
      </div>
    </header>
  );
}
