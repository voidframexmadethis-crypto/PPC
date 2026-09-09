import React, { useState, useEffect } from "react";
import { Outlet, NavLink, Link, useNavigate, useLocation } from "react-router-dom";
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
  Loader2,
  Volume2,
  Upload,
  Scale, Library,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useStore } from "../context/StoreContext";
import AudioPlayer from "./AudioPlayer";
import Uploader from "../pages/Uploader";
import Sidebar from "./navigation/Sidebar";
import Header from "./navigation/Header";

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
  const location = useLocation();

  useEffect(() => {
    // Only track site visits for non-owners to ensure analytics accuracy
    if (!authLoading && user?.email !== 'glennbucky@gmail.com') {
      const hasVisitedThisSession = sessionStorage.getItem('NIGHTRUNNA_VISITED');
      if (!hasVisitedThisSession) {
        incrementAnalytics("siteVisits");
        sessionStorage.setItem('NIGHTRUNNA_VISITED', 'true');
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
        "Welcome to NightRunna store",
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
  const profileName = user?.displayName || state.profile.name || "NightRunna";
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
    localStorage.setItem("NIGHTRUNNA_ADMIN_AUTH", "true");
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
          localStorage.getItem("NIGHTRUNNA_LAST_NOTIF_READ") || "0",
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
    setIsSubscribed(localStorage.getItem("NIGHTRUNNA_SUBSCRIBED") === "true");
    setIsYouTubeSubscribed(
      localStorage.getItem("NIGHTRUNNA_YOUTUBE_SUBSCRIBED") === "true",
    );
    setIsTikTokFollowed(
      localStorage.getItem("NIGHTRUNNA_TIKTOK_FOLLOWED") === "true",
    );
  };

  const toggleYouTubeSubscribe = () => {
    const newState = !isYouTubeSubscribed;
    setIsYouTubeSubscribed(newState);
    localStorage.setItem("NIGHTRUNNA_YOUTUBE_SUBSCRIBED", newState.toString());
    window.dispatchEvent(new Event("NIGHTRUNNA_SUBSCRIBED_STATUS_CHANGED"));
    // Direct navigation to bypass WebKit blob errors
    window.location.href = "https://youtube.com/@nightrunna";
  };

  const toggleTikTokFollow = () => {
    const newState = !isTikTokFollowed;
    setIsTikTokFollowed(newState);
    localStorage.setItem("NIGHTRUNNA_TIKTOK_FOLLOWED", newState.toString());
    window.dispatchEvent(new Event("NIGHTRUNNA_SUBSCRIBED_STATUS_CHANGED"));
    // Direct navigation to bypass WebKit blob errors
    window.location.href = "https://tiktok.com/@nightrunna";
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
        localStorage.setItem("NIGHTRUNNA_SUBSCRIBED", "true");
        localStorage.setItem("NIGHTRUNNA_SUBSCRIBER_EMAIL", subEmail.trim());
        localStorage.setItem("NIGHTRUNNA_SUBSCRIBER_NAME", subName.trim());
        setSubEmail("");
        setSubName("");
        checkSubscriptionStatus();
        // Trigger event so other pages know the user subscribed (for download locks)
        window.dispatchEvent(new Event("NIGHTRUNNA_SUBSCRIBED_STATUS_CHANGED"));
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
      "NIGHTRUNNA_SUBSCRIBED_STATUS_CHANGED",
      handleSubChanged,
    );

    // Poll notifications every 10 seconds for real-time notification alerts
    const interval = setInterval(fetchNotifications, 10000);

    return () => {
      window.removeEventListener(
        "NIGHTRUNNA_SUBSCRIBED_STATUS_CHANGED",
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
    { to: "/collections", icon: Library, label: "Collections" },
    { to: "/enterprise", icon: Radio, label: "Services" },
    { to: "/settings", icon: Sparkles, label: "Settings" },
  ];

  if (location.pathname === '/admin') {
    return (
      <div className="flex h-screen bg-[#050505] text-white font-sans overflow-hidden">
        <Outlet />
        <AudioPlayer />
      </div>
    );
  }

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
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        navItems={navItems}
        profileName={profileName}
        profileBio={profileBio}
        profileImg={profileImg}
        socials={socials}
        handleAdminAccess={handleAdminAccess}
      />

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <Header
          setSidebarOpen={setSidebarOpen}
          playVoiceGreeting={playVoiceGreeting}
          isPlayingVoice={isPlayingVoice}
          setIsUploaderOverlayOpen={setIsUploaderOverlayOpen}
          user={user}
          logout={logout}
          handleSignIn={handleSignIn}
          signingIn={signingIn}
          isSubscribed={isSubscribed}
          notifDropdownOpen={notifDropdownOpen}
          setNotifDropdownOpen={setNotifDropdownOpen}
          hasUnreadNotif={hasUnreadNotif}
          notifications={notifications}
        />

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
                    Join the NightRunna VIP Newsletter
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

            {/* OFFICIAL NIGHTRUNNA TERMS OF SERVICE LEGAL PANEL */}
            <div className="mt-10 bg-neutral-900 border border-neutral-800 rounded-2xl p-6 md:p-8 shadow-xl">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-neutral-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                    <Scale size={18} />
                  </div>
                  <div>
                    <h4 className="text-white font-extrabold text-sm md:text-base tracking-wide">
                      NightRunna OFFICIAL TERMS OF SERVICE
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
                    Welcome to NightRunna Music Platform. By accessing, streaming,
                    or purchasing instrumental beats, sound kits, and audio
                    licenses through this platform, you agree to be bound by
                    these Terms of Service. All rights, master recordings, and
                    compositional copyrights remain with NightRunna unless
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
                    unpurchased watermark preview files outside the NightRunna
                    audio engine. All trademarks, logos, and producer tags are
                    protected property of NightRunna.
                  </p>
                </div>

                <div>
                  <h5 className="text-white font-bold text-xs uppercase tracking-wider mb-1 text-indigo-400">
                    5. Updates & Governing Compliance
                  </h5>
                  <p>
                    NightRunna reserves the right to modify these terms at any
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
                  © {new Date().getFullYear()} NightRunna. All Rights Reserved.
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
                  href="https://x.com/nightrunna"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-white flex items-center justify-center transition-all shadow-sm group"
                  title="X (Twitter) @nightrunna"
                >
                  <Twitter className="w-4 h-4 transition-transform group-hover:scale-110" />
                </a>
                <a
                  href="https://instagram.com/nightrunna"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-white flex items-center justify-center transition-all shadow-sm group"
                  title="Instagram @nightrunna"
                >
                  <Instagram className="w-4 h-4 transition-transform group-hover:scale-110" />
                </a>
                <a
                  href="https://youtube.com/@nightrunna"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-white flex items-center justify-center transition-all shadow-sm group"
                  title="YouTube @nightrunna"
                >
                  <Youtube className="w-4 h-4 transition-transform group-hover:scale-110" />
                </a>
                <a
                  href="https://tiktok.com/@nightrunna"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-white flex items-center justify-center transition-all shadow-sm group"
                  title="TikTok @nightrunna"
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
                    NightRunna Accessibility Uploader
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
