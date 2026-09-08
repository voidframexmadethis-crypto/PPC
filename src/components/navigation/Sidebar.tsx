import React from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import { Disc, Facebook, Instagram, Twitter, Youtube, X } from "lucide-react";

export interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  navItems: any[];
  profileName: string;
  profileBio: string;
  profileImg: string;
  socials: { fb: string; ig: string; yt: string; tw: string };
  handleAdminAccess: () => void;
}

export default function Sidebar({
  sidebarOpen,
  setSidebarOpen,
  navItems,
  profileName,
  profileBio,
  profileImg,
  socials,
  handleAdminAccess,
}: SidebarProps) {
  const navigate = useNavigate();

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 w-64 bg-neutral-900/40 backdrop-blur-2xl border-r border-white/10 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:block flex flex-col ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      {/* Glossy Header */}
      <div className="flex items-center justify-between h-20 px-6 border-b border-white/5 flex-shrink-0">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Disc className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-black tracking-tighter text-white uppercase">NightRunna</span>
        </div>
        <button
          className="lg:hidden text-neutral-400 hover:text-white"
          onClick={() => setSidebarOpen(false)}
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
        {navItems.map((item) => (
          item.label === "Services" ? (
            <div key={item.to} className="relative group">
              <button
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 text-neutral-400 hover:bg-white/5 hover:text-white hover:shadow-[0_0_15px_rgba(255,255,255,0.05)]`}
                onClick={() => navigate(item.to)}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-bold tracking-tight">{item.label}</span>
              </button>
            </div>
          ) : (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                  isActive
                    ? "bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-white font-bold shadow-[0_0_20px_rgba(99,102,241,0.2)] border border-white/10"
                    : "text-neutral-400 hover:bg-white/5 hover:text-white"
                }`
              }
              onClick={() => setSidebarOpen(false)}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-bold tracking-tight">{item.label}</span>
            </NavLink>
          )
        ))}
      </nav>

      {/* Glossy Profile Footer */}
      <div className="p-6 border-t border-white/5 bg-white/5 backdrop-blur-xl flex-shrink-0">
        <div className="flex items-center space-x-3 mb-4">
          <div
            onClick={handleAdminAccess}
            className="w-12 h-12 rounded-xl bg-neutral-800 border border-white/10 overflow-hidden flex items-center justify-center flex-shrink-0 cursor-pointer hover:border-indigo-500 transition-all shadow-inner"
          >
            {profileImg ? (
              <img src={profileImg} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span className="text-sm font-black text-indigo-400">
                {profileName.substring(0, 2).toUpperCase()}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold truncate text-white">
              {profileName}
            </p>
            <p className="text-xs text-neutral-500 truncate font-medium">{profileBio}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
