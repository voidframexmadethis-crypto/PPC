import React, { useState, useEffect } from "react";
import { Outlet, NavLink, Link, useNavigate } from "react-router-dom";
import {
  Home,
  Youtube,
  Music,
  UploadCloud,
  Menu,
  X,
  Disc,
  BarChart3,
  Radio,
  ShoppingBag,
  Package,
  Facebook,
  Instagram,
  Twitter,
  Mail,
  Bell,
  Sparkles,
  Check,
  LogIn,
  LogOut,
  User as UserIcon,
  Loader2,
  Volume2,
  Upload,
  Scale,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useStore } from "../context/StoreContext";
import AudioPlayer from "./AudioPlayer";
import Uploader from "../pages/Uploader";

// Restored exact audio file paths, stream variables, and music assets for working preview files
export const LAYOUT_STREAM_VARIABLES = {
  previewAudio: "",
  musicAssets: ["/beats/123.m4a", "/beats/456.m4a"],
};

export default function Layout() {
  const { user, signIn, logout, loading: authLoading } = useAuth();
  const { state, updateProfile, incrementAnalytics } = useStore();
  const [signingIn, setSigningIn] = useState(false);
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [isUploaderOverlayOpen, setIsUploaderOverlayOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Only track site visits for non-owners to ensure analytics accuracy
    if (!authLoading && user?.email !== 'glennbucky@gmail.com') {
      const hasVisitedThisSession = sessionStorage.getItem('KRYPSIDE_VISITED');
      if (!hasVisitedThisSession) {
        incrementAnalytics("siteVisits");
        sessionStorage.setItem('KRYPSIDE_VISITED', 'true');
      }
    }
  }, [authLoading, user]);

  const playVoiceGreeting = () => {
    if (state.profile.voiceTagUrl) {
      const audio = new Audio(state.profile.voiceTagUrl);
      setIsPlayingVoice(true);
      audio.onended = () => setIsPlayingVoice(false);
      audio.onerror = () => setIsPlayingVoice(false);
      audio.play().catch(() => {
        setIsPlayingVoice(false);
      });
    } else {
      fallbackSpeech();
    }
  };

  const fallbackSpeech = () => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(
        "Krypside on the track. Welcome to the official sound lab and beat store. Select your instrumentals and secure your lease.",
      );
      utterance.rate = 1.0;
      utterance.pitch = 0.9;
      utterance.onstart = () => setIsPlayingVoice(true);
      utterance.onend = () => setIsPlayingVoice(false);
      utterance.onerror = () => setIsPlayingVoice(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  // Automatically play on website load every single time + handle autoplay restrictions with first interaction fallback
  useEffect(() => {
    const playAudio = () => {
      if (state.profile.voiceTagUrl) {
        const audio = new Audio(state.profile.voiceTagUrl);
        setIsPlayingVoice(true);
        audio.onended = () => setIsPlayingVoice(false);
        audio.onerror = () => setIsPlayingVoice(false);
        audio.play().catch(() => setIsPlayingVoice(false));
      } else {
        fallbackSpeech();
      }
    };

    const timer = setTimeout(() => {
      playAudio();
    }, 400);

    const handleFirstInteraction = () => {
      playAudio();
      window.removeEventListener("click", handleFirstInteraction);
      window.removeEventListener("keydown", handleFirstInteraction);
    };

    window.addEventListener("click", handleFirstInteraction);
    window.addEventListener("keydown", handleFirstInteraction);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("click", handleFirstInteraction);
      window.removeEventListener("keydown", handleFirstInteraction);
    };
  }, [state.profile.voiceTagUrl]);

  const handleSignIn = async () => {
    console.log("SignIn button clicked");
    setSigningIn(true);
    try {
      await signIn();
    } finally {
      setSigningIn(false);
    }
  };

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const profileName = user?.displayName || state.profile.name || "KRYPSIDE";
  const profileBio =
    state.profile.bio || "Pro Audio Loops & Instrumental Beats";
  const profileImg = user?.photoURL || state.profile.avatarUrl || "";
  const [socials, setSocials] = useState({ fb: "", ig: "", yt: "", tw: "" });

  const handleAdminAccess = () => {
    // 🛸 Play Alien Laser Sound
    const laserAudio = new Audio("https://www.soundjay.com/sci-fi/sounds/sci-fi-laser-1.mp3");
    laserAudio.volume = 0.5;
    laserAudio.play().catch(() => {});
    
    // Set Auth & Navigate
    localStorage.setItem("KRYPSIDE_ADMIN_AUTH", "true");
    navigate("/admin");
  };

  // 📧 EMAIL MARKETING & NEWSLETTER STATE:
  const [subEmail, setSubEmail] = useState("");
  const [subName, setSubName] = useState("");
  const [notifyOnBeatDrop, setNotifyOnBeatDrop] = useState(true);
  const [subStatus, setSubStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [subMessage, setSubMessage] = useState("");

  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isYouTubeSubscribed, setIsYouTubeSubscribed] = useState(false);
  const [isTikTokFollowed, setIsTikTokFollowed] = useState(false);
  const [notifications, setNotifications] = useState<
    {
      id: string;
      title: string;
      body: string;
      sentAt: string;
      beatTitle?: string;
    }[]
  >([]);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [hasUnreadNotif, setHasUnreadNotif] = useState(false);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/subscribers");
      if (!res.ok) return;
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) return;
      const data = await res.json();
      if (data && data.success) {
        setNotifications(data.notifications || []);

        // Check if there are new unread notifications
        const lastRead = Number(
          localStorage.getItem("KRYPSIDE_LAST_NOTIF_READ") || "0",
        );
        const hasUnread = (data.notifications || []).some(
          (n: any) => new Date(n.sentAt).getTime() > lastRead,
        );
        setHasUnreadNotif(hasUnread);
      }
    } catch (err) {
      // Silently catch network or JSON parse errors during startup or background polling
    }
  };

  const checkSubscriptionStatus = () => {
    setIsSubscribed(localStorage.getItem("KRYPSIDE_SUBSCRIBED") === "true");
    setIsYouTubeSubscribed(
      localStorage.getItem("KRYPSIDE_YOUTUBE_SUBSCRIBED") === "true",
    );
    setIsTikTokFollowed(
      localStorage.getItem("KRYPSIDE_TIKTOK_FOLLOWED") === "true",
    );
  };

  const toggleYouTubeSubscribe = () => {
    const newState = !isYouTubeSubscribed;
    setIsYouTubeSubscribed(newState);
    localStorage.setItem("KRYPSIDE_YOUTUBE_SUBSCRIBED", newState.toString());
    window.dispatchEvent(new Event("KRYPSIDE_SUBSCRIBED_STATUS_CHANGED"));
    // Direct navigation to bypass WebKit blob errors
    window.location.href = "https://youtube.com/@Krypside";
  };

  const toggleTikTokFollow = () => {
    const newState = !isTikTokFollowed;
    setIsTikTokFollowed(newState);
    localStorage.setItem("KRYPSIDE_TIKTOK_FOLLOWED", newState.toString());
    window.dispatchEvent(new Event("KRYPSIDE_SUBSCRIBED_STATUS_CHANGED"));
    // Direct navigation to bypass WebKit blob errors
    window.location.href = "https://tiktok.com/@krypside";
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subEmail.trim() || !subName.trim()) {
      setSubStatus("error");
      setSubMessage("Please enter both your name and email address.");
      return;
    }
    setSubStatus("loading");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: subEmail.trim(),
          name: subName.trim(),
          notifyOnBeatDrop,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSubStatus("success");
        setSubMessage(data.message);
        localStorage.setItem("KRYPSIDE_SUBSCRIBED", "true");
        localStorage.setItem("KRYPSIDE_SUBSCRIBER_EMAIL", subEmail.trim());
        localStorage.setItem("KRYPSIDE_SUBSCRIBER_NAME", subName.trim());
        setSubEmail("");
        setSubName("");
        checkSubscriptionStatus();
        // Trigger event so other pages know the user subscribed (for download locks)
        window.dispatchEvent(new Event("KRYPSIDE_SUBSCRIBED_STATUS_CHANGED"));
      } else {
        setSubStatus("error");
        setSubMessage(data.error || "Failed to subscribe. Please try again.");
      }
    } catch (err) {
      setSubStatus("error");
      setSubMessage("An unexpected error occurred. Please try again later.");
    }
  };

  useEffect(() => {
    checkSubscriptionStatus();
    fetchNotifications();

    const handleSubChanged = () => {
      checkSubscriptionStatus();
    };

    window.addEventListener(
      "KRYPSIDE_SUBSCRIBED_STATUS_CHANGED",
      handleSubChanged,
    );

    // Poll notifications every 10 seconds for real-time notification alerts
    const interval = setInterval(fetchNotifications, 10000);

    return () => {
      window.removeEventListener(
        "KRYPSIDE_SUBSCRIBED_STATUS_CHANGED",
        handleSubChanged,
      );
      clearInterval(interval);
    };
  }, []);

  const navItems = [
    { to: "/", icon: Home, label: "Home" },
    { to: "/videos", icon: Youtube, label: "YouTube Videos" },
    { to: "/player", icon: Music, label: "Audio Player" },
    { to: "/storefront", icon: Disc, label: "Storefront" },
    { to: "/merch", icon: ShoppingBag, label: "Merch Store" },
    { to: "/beat-packs", icon: Package, label: "Beat Packs" },
    { to: "/top-tracks", icon: BarChart3, label: "Top Tracks" },
    { to: "/enterprise", icon: Radio, label: "Services" },
    { to: "/profile/krypside", icon: UserIcon, label: "My Profile" },
    { to: "/settings", icon: Sparkles, label: "Settings" },
  ];

  return (
    <div className="flex h-screen bg-neutral-950 text-neutral-100 font-sans">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-neutral-900/60 backdrop-blur-md border-r border-neutral-800 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:block flex flex-col ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-neutral-800 flex-shrink-0">
          <div className="flex items-center space-x-2">
            <Disc className="w-6 h-6 text-indigo-500" />
            <span className="text-xl font-bold tracking-tight">Beat Store</span>
          </div>
          <button
            className="lg:hidden text-neutral-400 hover:text-white"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="p-4 space-y-1 flex-1 overflow-y-auto">
          {navItems.map((item) => (
            item.label === "Services" ? (
              <div key={item.to} className="relative group">
                <button
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors text-neutral-400 hover:bg-neutral-800/50 hover:text-white`}
                  onClick={() => navigate(item.to)}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
                {/* Mega menu placeholder */}
                <div className="absolute left-full top-0 ml-2 w-64 bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl p-4 hidden group-hover:block z-50">
                    <div className="text-xs font-bold text-neutral-500 uppercase mb-2">Music Industry Services</div>
                    <div className="space-y-2">
                        <Link to="/enterprise" className="block text-sm text-neutral-300 hover:text-indigo-400">Join Network</Link>
                        <Link to="/enterprise" className="block text-sm text-neutral-300 hover:text-indigo-400">Music Distribution</Link>
                    </div>
                </div>
              </div>
            ) : (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? "bg-indigo-500/10 text-indigo-400 font-medium"
                    : "text-neutral-400 hover:bg-neutral-800/50 hover:text-neutral-200"
                }`
              }
              onClick={() => setSidebarOpen(false)}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </NavLink>
            )
          ))}
        </nav>

        {/* Sidebar Profile & Socials Footer */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-950/20 backdrop-blur-md flex-shrink-0">
          <div className="flex items-center space-x-3 mb-3">
            <div
              onClick={handleAdminAccess}
              className="w-10 h-10 rounded-full bg-neutral-800 border border-neutral-700 overflow-hidden flex items-center justify-center flex-shrink-0 cursor-pointer hover:border-indigo-500 transition-colors"
            >
              {profileImg ? (
                <img
                  src={profileImg}
                  alt="Profile"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="text-sm font-bold text-indigo-400">
                  {profileName.substring(0, 2).toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate text-neutral-200">
                {profileName}
              </p>
              <p className="text-xs text-neutral-500 truncate">{profileBio}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {socials.fb && (
              <a
                href={
                  socials.fb.startsWith("http")
                    ? socials.fb
                    : `https://${socials.fb}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-[#1877F2] hover:text-white transition-colors"
                title="Facebook"
              >
                <Facebook size={14} />
              </a>
            )}
            {socials.ig && (
              <a
                href={
                  socials.ig.startsWith("http")
                    ? socials.ig
                    : `https://${socials.ig}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-[#E4405F] hover:text-white transition-colors"
                title="Instagram"
              >
                <Instagram size={14} />
              </a>
            )}
            {socials.yt && (
              <a
                href={
                  socials.yt.startsWith("http")
                    ? socials.yt
                    : `https://${socials.yt}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-[#FF0000] hover:text-white transition-colors"
                title="YouTube"
              >
                <Youtube size={14} />
              </a>
            )}
            {socials.tw && (
              <a
                href={
                  socials.tw.startsWith("http")
                    ? socials.tw
                    : `https://${socials.tw}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-[#1DA1F2] hover:text-white transition-colors"
                title="Twitter / X"
              >
                <Twitter size={14} />
              </a>
            )}
            {!socials.fb && !socials.ig && !socials.yt && !socials.tw && (
              <span className="text-[10px] text-neutral-500 italic">
                No social links connected
              </span>
            )}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Unified Topbar with Live Notifications & VIP status */}
        <header className="flex items-center justify-between h-16 px-4 md:px-8 border-b border-neutral-800 bg-neutral-900/65 backdrop-blur-md sticky top-0 z-40 flex-shrink-0">
          <div className="flex items-center space-x-4">
            {/* Mobile menu trigger */}
            <button
              className="lg:hidden text-neutral-400 hover:text-white p-1 rounded hover:bg-neutral-800 transition-colors"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Systems Core Online Status */}
            <div className="flex items-center space-x-2 bg-neutral-950/40 px-3 py-1.5 rounded-full border border-neutral-800/80">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[10px] text-neutral-400 font-bold font-mono tracking-wider">
                KRYPSIDE AUDIO ENGINE
              </span>
            </div>

            {/* Voice Tag / Greeting Button */}
            <div className="hidden md:flex items-center gap-2">
              <button
                onClick={playVoiceGreeting}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-indigo-300 rounded-lg text-xs font-semibold transition-all shadow-sm"
                title="Play Producer Voice Greeting & Tag"
              >
                <Volume2
                  className={`w-3.5 h-3.5 ${isPlayingVoice ? "animate-bounce text-indigo-400" : ""}`}
                />
                <span>
                  {isPlayingVoice ? "Voice Tag Active..." : "Voice Tag"}
                </span>
              </button>

              <button
                onClick={() => {
                  localStorage.setItem("KRYPSIDE_ADMIN_AUTH", "true");
                  setIsUploaderOverlayOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-sm"
                title="Open Accessibility Beat Uploader Interface"
              >
                <Upload className="w-3.5 h-3.5 text-emerald-400" />
                <span>Upload Voice Tag</span>
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-4 relative">
            {/* Auth Button */}
            {user ? (
              <div className="flex items-center gap-3">
                <button
                  onClick={logout}
                  className="flex items-center gap-2 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-lg text-xs font-bold transition-all"
                  title="Logout"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            ) : (
              <button
                onClick={handleSignIn}
                disabled={signingIn}
                className="flex items-center gap-2 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-neutral-800 disabled:text-neutral-500 text-white rounded-lg text-xs font-bold transition-all shadow-lg min-w-[140px] justify-center"
              >
                {signingIn ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <LogIn className="w-3.5 h-3.5" />
                )}
                <span>{signingIn ? "Signing in..." : "Producer Sign In"}</span>
              </button>
            )}

            {/* VIP Status Indicator */}
            {isSubscribed ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full text-xs font-semibold">
                <Check className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">ARTIST VIP ACTIVATED</span>
                <span className="sm:hidden">VIP</span>
              </div>
            ) : (
              <button
                onClick={() => {
                  const footerSub = document.getElementById(
                    "vip-newsletter-footer",
                  );
                  if (footerSub) {
                    footerSub.scrollIntoView({ behavior: "smooth" });
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-400 rounded-full text-xs font-semibold transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 animate-pulse text-indigo-400" />
                <span className="hidden sm:inline font-bold">
                  JOIN ARTIST VIP
                </span>
                <span className="sm:hidden font-bold">JOIN VIP</span>
              </button>
            )}

            {/* Notifications Dropdown Bell */}
            <div className="relative">
              <button
                onClick={() => {
                  setNotifDropdownOpen(!notifDropdownOpen);
                  if (!notifDropdownOpen) {
                    setHasUnreadNotif(false);
                    localStorage.setItem(
                      "KRYPSIDE_LAST_NOTIF_READ",
                      Date.now().toString(),
                    );
                  }
                }}
                className="relative p-2 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800/80 transition-all focus:outline-none"
                title="Recent Beat Drops"
              >
                <Bell
                  className={`w-5 h-5 ${hasUnreadNotif ? "animate-bounce text-indigo-400" : ""}`}
                />
                {hasUnreadNotif && (
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-indigo-500 rounded-full border-2 border-neutral-900" />
                )}
              </button>

              {/* Dropdown panel */}
              {notifDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40 cursor-default"
                    onClick={() => setNotifDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-3 w-80 md:w-96 bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-3 duration-200">
                    <div className="p-4 border-b border-neutral-800 bg-neutral-950/40 flex justify-between items-center">
                      <span className="text-sm font-bold text-white flex items-center gap-1.5">
                        <Bell
                          size={16}
                          className="text-indigo-400 animate-pulse"
                        />{" "}
                        Live Beat Drops
                      </span>
                      <button
                        onClick={() => setNotifDropdownOpen(false)}
                        className="text-xs text-neutral-500 hover:text-neutral-300 font-semibold"
                      >
                        Dismiss
                      </button>
                    </div>
                    <div className="max-h-[320px] overflow-y-auto divide-y divide-neutral-800/50">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-neutral-500 text-xs italic">
                          No new beat drop notifications recorded yet.
                          <br />
                          We'll notify you here the millisecond a beat drops!
                        </div>
                      ) : (
                        notifications.map((notif) => (
                          <div
                            key={notif.id}
                            className="p-4 hover:bg-neutral-800/30 transition-colors"
                          >
                            <div className="flex items-start gap-2.5">
                              <span className="text-base">🔥</span>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-neutral-200 leading-snug">
                                  {notif.title}
                                </p>
                                <p className="text-xs text-neutral-400 mt-1.5 leading-normal">
                                  {notif.body}
                                </p>
                                <span className="text-[10px] text-neutral-600 mt-2 block font-mono">
                                  {new Date(notif.sentAt).toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 overflow-auto p-4 md:p-8 flex flex-col justify-between">
          <div className="w-full max-w-[1600px] mx-auto flex-1">
            <Outlet />
          </div>

          {/* 📧 CENTRAL EMAIL MARKETING & RAPPER VIP NEWSLETTER PANEL */}
          <footer
            id="vip-newsletter-footer"
            className="mt-16 border-t border-neutral-900 pt-12 pb-6 w-full max-w-[1600px] mx-auto"
          >
            <div className="bg-gradient-to-br from-neutral-900 to-neutral-950 border border-neutral-800 rounded-2xl p-6 md:p-8 relative overflow-hidden shadow-2xl">
              {/* Background Glow */}
              <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 rounded-full blur-[100px] -z-0 pointer-events-none" />

              <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
                {/* Left Text details */}
                <div className="max-w-xl text-center lg:text-left">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-indigo-400 text-xs font-semibold mb-3">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>RAPPER EXCLUSIVE ACCESS</span>
                  </div>
                  <h3 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                    Join the KRYPSIDE VIP Newsletter
                  </h3>
                  <p className="mt-2 text-neutral-400 text-sm md:text-base leading-relaxed">
                    Subscribing unlocks{" "}
                    <strong className="text-indigo-400">
                      instant free beat downloads
                    </strong>
                    , VIP discount keys, and live automated email & text drops
                    the millisecond a new banger hits the store.
                  </p>

                  <div className="mt-4 flex flex-wrap justify-center lg:justify-start gap-4 text-xs font-medium text-neutral-500">
                    <span className="flex items-center gap-1">
                      <Check
                        className={`w-4 h-4 ${isSubscribed ? "text-emerald-400" : "text-neutral-600"}`}
                      />{" "}
                      Email VIP
                    </span>
                    <button
                      onClick={toggleYouTubeSubscribe}
                      className={`flex items-center gap-1.5 transition-colors ${isYouTubeSubscribed ? "text-emerald-400" : "text-neutral-500 hover:text-red-400"}`}
                    >
                      <Check
                        className={`w-4 h-4 ${isYouTubeSubscribed ? "text-emerald-400" : "text-neutral-600"}`}
                      />
                      <Youtube
                        size={14}
                        className={
                          isYouTubeSubscribed
                            ? "text-emerald-400"
                            : "text-red-500"
                        }
                      />
                      YouTube Unlock
                    </button>
                    <button
                      onClick={toggleTikTokFollow}
                      className={`flex items-center gap-1.5 transition-colors ${isTikTokFollowed ? "text-emerald-400" : "text-neutral-500 hover:text-indigo-400"}`}
                    >
                      <Check
                        className={`w-4 h-4 ${isTikTokFollowed ? "text-emerald-400" : "text-neutral-600"}`}
                      />
                      <Music
                        size={14}
                        className={
                          isTikTokFollowed
                            ? "text-emerald-400"
                            : "text-indigo-400"
                        }
                      />
                      TikTok Unlock
                    </button>
                  </div>
                </div>

                {/* Right Form panel */}
                <div className="w-full lg:max-w-md bg-neutral-950/20 backdrop-blur-md border border-neutral-800 p-5 rounded-xl shadow-inner">
                  {subStatus === "success" ? (
                    <div className="text-center py-6 animate-in fade-in zoom-in-95 duration-300">
                      <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Check className="w-6 h-6" />
                      </div>
                      <h4 className="text-lg font-bold text-white">
                        VIP Status Activated!
                      </h4>
                      <p className="text-xs text-neutral-400 mt-1.5 px-2">
                        {subMessage}
                      </p>
                      <button
                        onClick={() => setSubStatus("idle")}
                        className="mt-4 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
                      >
                        Subscribe another email
                      </button>
                    </div>
                  ) : (
                    <form
                      onSubmit={handleSubscribe}
                      className="flex flex-col gap-3.5"
                    >
                      <div className="flex flex-col sm:flex-row gap-3">
                        {/* Name Input */}
                        <div className="flex-1">
                          <label className="block text-[10px] text-neutral-400 uppercase font-bold tracking-wider mb-1">
                            Artist / Stage Name
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Young Savage"
                            value={subName}
                            onChange={(e) => setSubName(e.target.value)}
                            disabled={subStatus === "loading"}
                            className="w-full bg-neutral-900 border border-neutral-800 text-white rounded-lg px-3 py-2 text-sm placeholder-neutral-600 focus:outline-none focus:border-indigo-500 transition-colors"
                          />
                        </div>
                        {/* Email Input */}
                        <div className="flex-1">
                          <label className="block text-[10px] text-neutral-400 uppercase font-bold tracking-wider mb-1">
                            Your Email Address
                          </label>
                          <input
                            type="email"
                            required
                            placeholder="rapper@gmail.com"
                            value={subEmail}
                            onChange={(e) => setSubEmail(e.target.value)}
                            disabled={subStatus === "loading"}
                            className="w-full bg-neutral-900 border border-neutral-800 text-white rounded-lg px-3 py-2 text-sm placeholder-neutral-600 focus:outline-none focus:border-indigo-500 transition-colors"
                          />
                        </div>
                      </div>

                      {/* Drop Notification Checkbox */}
                      <div className="flex items-center gap-2 px-1">
                        <input
                          type="checkbox"
                          id="notifyOnBeatDrop"
                          checked={notifyOnBeatDrop}
                          onChange={(e) =>
                            setNotifyOnBeatDrop(e.target.checked)
                          }
                          disabled={subStatus === "loading"}
                          className="w-4 h-4 text-indigo-600 bg-neutral-900 border-neutral-800 rounded focus:ring-indigo-500 focus:ring-offset-neutral-950 focus:ring-2"
                        />
                        <label
                          htmlFor="notifyOnBeatDrop"
                          className="text-xs text-neutral-400 cursor-pointer select-none flex items-center gap-1.5 hover:text-neutral-300 transition-colors"
                        >
                          <Bell className="w-3.5 h-3.5 text-indigo-400" />
                          Notify me immediately when new beats drop
                        </label>
                      </div>

                      {/* Submit button */}
                      <button
                        type="submit"
                        disabled={subStatus === "loading"}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-neutral-800 disabled:text-neutral-500 disabled:cursor-not-allowed text-white font-bold text-sm py-2 px-4 rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-lg active:scale-[0.98]"
                      >
                        {subStatus === "loading" ? (
                          <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <>
                            <Mail className="w-4 h-4" />
                            <span>Unlock VIP Access & Free Downloads</span>
                          </>
                        )}
                      </button>

                      {subStatus === "error" && (
                        <p className="text-xs text-red-400 text-center font-medium mt-1 animate-pulse">
                          {subMessage}
                        </p>
                      )}
                    </form>
                  )}
                </div>
              </div>
            </div>

            {/* OFFICIAL KRYPSIDE TERMS OF SERVICE LEGAL PANEL */}
            <div className="mt-10 bg-neutral-900 border border-neutral-800 rounded-2xl p-6 md:p-8 shadow-xl">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-neutral-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                    <Scale size={18} />
                  </div>
                  <div>
                    <h4 className="text-white font-extrabold text-sm md:text-base tracking-wide">
                      KRYPSIDE OFFICIAL TERMS OF SERVICE
                    </h4>
                    <p className="text-[11px] text-neutral-400">
                      Standard Instrumental Licensing, Master Rights, & Platform
                      Governance
                    </p>
                  </div>
                </div>
                <div className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest bg-neutral-950 px-3 py-1 rounded border border-neutral-800">
                  Secure Legal Vault v4.9
                </div>
              </div>

              {/* Scrollable container with crisp container limits */}
              <div className="max-h-[220px] overflow-y-auto pr-3 space-y-4 text-xs text-neutral-300 custom-scrollbar leading-relaxed">
                <div>
                  <h5 className="text-white font-bold text-xs uppercase tracking-wider mb-1 text-indigo-400">
                    1. Introduction & Acceptance of Terms
                  </h5>
                  <p>
                    Welcome to Krypside Music Platform. By accessing, streaming,
                    or purchasing instrumental beats, sound kits, and audio
                    licenses through this platform, you agree to be bound by
                    these Terms of Service. All rights, master recordings, and
                    compositional copyrights remain with Krypside unless
                    explicitly transferred via an executed commercial lease
                    agreement.
                  </p>
                </div>

                <div>
                  <h5 className="text-white font-bold text-xs uppercase tracking-wider mb-1 text-indigo-400">
                    2. Instrumental Licensing & Usage Rights
                  </h5>
                  <p>
                    •{" "}
                    <strong className="text-white">Non-Exclusive Lease:</strong>{" "}
                    Grants the licensee rights to use the instrumental for
                    streaming on Spotify, Apple Music, and YouTube up to
                    platform stream caps, and live performances.
                  </p>
                  <p>
                    •{" "}
                    <strong className="text-white">
                      Unlimited / Exclusive Rights:
                    </strong>{" "}
                    Grants full commercial ownership, unlimited streams, and
                    radio broadcast rights as specified at checkout.
                  </p>
                  <p>
                    • <strong className="text-white">Prohibited Uses:</strong>{" "}
                    You may not register instrumental beats with Content ID
                    (e.g., YouTube Content ID, ACRCloud) as exclusive copyright
                    owner without an explicit exclusive buyout agreement.
                  </p>
                </div>

                <div>
                  <h5 className="text-white font-bold text-xs uppercase tracking-wider mb-1 text-indigo-400">
                    3. Secure Payment Processing & Transactions
                  </h5>
                  <p>
                    All transactions processed via Credit Card, PayPal, or
                    Crypto are securely handled via local client-side
                    confirmation and encrypted checkout routers. All sales of
                    digital audio files and beat leases are final due to the
                    immediate digital delivery nature of master tracks.
                  </p>
                </div>

                <div>
                  <h5 className="text-white font-bold text-xs uppercase tracking-wider mb-1 text-indigo-400">
                    4. User Conduct & Intellectual Property
                  </h5>
                  <p>
                    Users agree not to reverse engineer, scrape, or distribute
                    unpurchased watermark preview files outside the Krypside
                    audio engine. All trademarks, logos, and producer tags are
                    protected property of Krypside.
                  </p>
                </div>

                <div>
                  <h5 className="text-white font-bold text-xs uppercase tracking-wider mb-1 text-indigo-400">
                    5. Updates & Governing Compliance
                  </h5>
                  <p>
                    Krypside reserves the right to modify these terms at any
                    time. Continued use of the sound lab and beat store
                    constitutes acceptance of updated terms.
                  </p>
                </div>
              </div>
            </div>

            {/* Footer rights display & Social Media Connectivity Panel */}
            <div className="mt-8 border-t border-neutral-900 pt-6 flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-neutral-500 max-w-7xl mx-auto px-4 pb-8">
              <div className="flex flex-col gap-2 text-center md:text-left">
                <p style={{ cursor: "default" }} className="select-none">
                  © {new Date().getFullYear()} KRYPSIDE. All Rights Reserved.
                </p>

                <button
                  onClick={() => navigate("/admin-portal")}
                  className="px-5 py-2.5 mt-1 bg-indigo-600/10 hover:bg-indigo-600/20 border-2 border-indigo-500/30 text-indigo-400 hover:text-indigo-300 font-bold rounded-lg transition-all active:scale-95 text-xs tracking-wider uppercase"
                >
                  View Real-Life Analytics
                </button>
              </div>

              {/* Official Social Media Connectivity Panel */}
              <div className="flex items-center gap-3">
                <a
                  href="https://x.com/krypside"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-white flex items-center justify-center transition-all shadow-sm group"
                  title="X (Twitter) @krypside"
                >
                  <Twitter className="w-4 h-4 transition-transform group-hover:scale-110" />
                </a>
                <a
                  href="https://instagram.com/krypside"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-white flex items-center justify-center transition-all shadow-sm group"
                  title="Instagram @krypside"
                >
                  <Instagram className="w-4 h-4 transition-transform group-hover:scale-110" />
                </a>
                <a
                  href="https://youtube.com/@krypside"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-white flex items-center justify-center transition-all shadow-sm group"
                  title="YouTube @krypside"
                >
                  <Youtube className="w-4 h-4 transition-transform group-hover:scale-110" />
                </a>
                <a
                  href="https://tiktok.com/@krypside"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-white flex items-center justify-center transition-all shadow-sm group"
                  title="TikTok @krypside"
                >
                  <svg
                    className="w-4 h-4 transition-transform group-hover:scale-110"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
                  </svg>
                </a>
              </div>

              <div className="flex gap-4 text-neutral-600 text-[11px]">
                <span className="hover:text-neutral-400 transition-colors cursor-pointer">
                  Privacy Protocol
                </span>
                <span className="hover:text-neutral-400 transition-colors cursor-pointer">
                  Licensing Terms
                </span>
                <span className="hover:text-neutral-400 transition-colors cursor-pointer">
                  System Core v4.9
                </span>
              </div>
            </div>
          </footer>
        </div>
      </main>
      <AudioPlayer />

      {/* Full-Screen Accessibility Uploader Overlay */}
      {isUploaderOverlayOpen && (
        <div className="fixed inset-0 z-50 bg-[#000000] overflow-y-auto p-4 md:p-10 animate-in fade-in duration-300">
          <div className="max-w-6xl mx-auto bg-[#0a0a0a] border-2 border-neutral-800 rounded-3xl shadow-2xl p-6 md:p-12 relative text-white">
            <div className="flex items-center justify-between pb-6 mb-8 border-b border-neutral-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-center text-emerald-400 font-bold text-lg">
                  ⚡
                </div>
                <div>
                  <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                    Krypside Accessibility Uploader
                  </h2>
                  <p className="text-neutral-400 text-xs md:text-sm mt-1">
                    Stark high-visibility dark mode with massive scale input
                    fields and large touch targets.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsUploaderOverlayOpen(false)}
                className="px-6 py-3 bg-neutral-800 hover:bg-neutral-700 text-white font-bold rounded-xl border border-neutral-700 transition-all text-sm md:text-base flex items-center gap-2 shadow-lg cursor-pointer"
              >
                ✕ Close Uploader
              </button>
            </div>

            <div className="accessibility-uploader-wrapper bg-black p-4 md:p-6 rounded-2xl border border-neutral-800">
              <Uploader />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
