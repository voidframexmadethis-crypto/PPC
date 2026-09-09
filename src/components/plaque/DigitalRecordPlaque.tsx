import React, { useState } from 'react';
import { Achievement } from '../../types';
import { MILESTONES, downloadPlaqueAsPNG } from '../../utils/achievementUtils';
import { Download, Award, ShieldCheck, Share2, Check, ExternalLink, X } from 'lucide-react';

interface DigitalRecordPlaqueProps {
  achievement: Achievement;
  onClose?: () => void;
  isModal?: boolean;
}

export const DigitalRecordPlaque: React.FC<DigitalRecordPlaqueProps> = ({
  achievement,
  onClose,
  isModal = false,
}) => {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const mDef = MILESTONES.find(m => m.milestone === achievement.milestone) || MILESTONES[0];
  const isMillion = achievement.milestone >= 1000000;

  const handleDownload = async () => {
    setDownloading(true);
    try {
      downloadPlaqueAsPNG(achievement);
    } catch (e) {
      console.error("Download failed", e);
    } finally {
      setTimeout(() => setDownloading(false), 1000);
    }
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/verify/plaque/${achievement.plaqueId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formattedDate = achievement.earnedDate 
    ? new Date(achievement.earnedDate).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : 'OFFICIALLY RECORDED';

  const formattedTime = achievement.earnedTimestamp
    ? new Date(achievement.earnedTimestamp).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZoneName: 'short',
      })
    : '';

  const plaqueContent = (
    <div className="relative max-w-xl mx-auto select-none animate-in zoom-in-95 duration-300">
      {/* Outer Physical Frame Container */}
      <div 
        className={`relative p-5 rounded-2xl shadow-2xl border transition-all ${
          isMillion 
            ? 'bg-gradient-to-br from-amber-950 via-neutral-900 to-amber-900 border-amber-500/40 shadow-amber-500/10' 
            : mDef.frameStyle === 'gold' 
            ? 'bg-gradient-to-br from-amber-950 via-neutral-900 to-yellow-950 border-amber-600/30'
            : mDef.frameStyle === 'platinum' || mDef.frameStyle === 'diamond'
            ? 'bg-gradient-to-br from-slate-900 via-neutral-900 to-slate-800 border-sky-400/30 shadow-sky-500/10'
            : 'bg-neutral-950 border-neutral-800'
        }`}
      >
        {/* Frame Chamfer & Corner Accents */}
        <div className="absolute inset-2 border border-white/10 rounded-xl pointer-events-none"></div>

        {/* Inner Matted Felt Canvas */}
        <div className="relative bg-neutral-950 p-6 md:p-8 rounded-xl border border-neutral-900 overflow-hidden shadow-inner flex flex-col items-center">
          
          {/* Subtle Background Radial Glow */}
          <div 
            className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full blur-3xl opacity-20 pointer-events-none"
            style={{ backgroundColor: mDef.badgeColor }}
          ></div>

          {/* Top NightRunna Header Seal */}
          <div className="flex items-center gap-2 mb-6">
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-neutral-700"></div>
            <div className="flex items-center gap-1.5 px-3 py-1 bg-neutral-900 border border-neutral-800 rounded-full text-[10px] font-mono font-bold tracking-widest text-neutral-300 uppercase shadow-sm">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>OFFICIAL NIGHTRUNNA AWARD</span>
            </div>
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-neutral-700"></div>
          </div>

          {/* Mounted Vinyl Record Visual */}
          <div className="relative w-64 h-64 md:w-80 md:h-80 mb-8 flex items-center justify-center shrink-0">
            {/* Record Shadow */}
            <div className="absolute inset-0 rounded-full bg-black/80 blur-md translate-y-2"></div>
            
            {/* Vinyl Body */}
            <div 
              className={`relative w-full h-full rounded-full border-4 shadow-2xl flex items-center justify-center overflow-hidden ${
                isMillion 
                  ? 'bg-gradient-to-br from-neutral-900 via-amber-950/80 to-neutral-950 border-amber-400/50' 
                  : 'bg-gradient-to-br from-neutral-900 via-neutral-950 to-black border-neutral-800'
              }`}
            >
              {/* Concentric Vinyl Grooves */}
              <div className="absolute inset-3 rounded-full border border-white/5 pointer-events-none"></div>
              <div className="absolute inset-6 rounded-full border border-white/5 pointer-events-none"></div>
              <div className="absolute inset-10 rounded-full border border-white/5 pointer-events-none"></div>
              <div className="absolute inset-14 rounded-full border border-white/5 pointer-events-none"></div>
              <div className="absolute inset-20 rounded-full border border-white/5 pointer-events-none"></div>

              {/* Vinyl Sheen/Reflection Overlay */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none rotate-45"></div>

              {/* Center Record Label with Artwork */}
              <div 
                className="relative w-28 h-28 md:w-36 md:h-36 rounded-full border-4 shadow-xl overflow-hidden flex items-center justify-center bg-neutral-900"
                style={{ borderColor: mDef.badgeColor }}
              >
                {achievement.coverArtUrl ? (
                  <img 
                    src={achievement.coverArtUrl} 
                    alt={achievement.beatTitle} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-neutral-900 flex items-center justify-center text-neutral-500 font-bold text-xs">
                    NIGHTRUNNA
                  </div>
                )}
                
                {/* Center Record Spindle Hole */}
                <div className="absolute w-4 h-4 rounded-full bg-neutral-950 border-2 border-white/20 shadow-inner"></div>
              </div>
            </div>
          </div>

          {/* Engraved Metallic Award Plate */}
          <div 
            className={`w-full p-6 md:p-8 rounded-xl border text-center relative shadow-xl ${
              isMillion
                ? 'bg-gradient-to-b from-amber-100 via-amber-200 to-amber-300 text-neutral-950 border-amber-400'
                : mDef.frameStyle === 'gold'
                ? 'bg-gradient-to-b from-amber-100 via-amber-200 to-yellow-300 text-neutral-950 border-amber-400'
                : mDef.frameStyle === 'platinum' || mDef.frameStyle === 'diamond'
                ? 'bg-gradient-to-b from-slate-100 via-slate-200 to-slate-300 text-neutral-950 border-slate-300'
                : 'bg-gradient-to-b from-neutral-200 via-neutral-300 to-neutral-400 text-neutral-950 border-neutral-400'
            }`}
          >
            {/* Rivets/Screws in Plate Corners */}
            <div className="absolute top-3 left-3 w-2.5 h-2.5 rounded-full bg-neutral-800 border border-white/40 shadow-inner"></div>
            <div className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full bg-neutral-800 border border-white/40 shadow-inner"></div>
            <div className="absolute bottom-3 left-3 w-2.5 h-2.5 rounded-full bg-neutral-800 border border-white/40 shadow-inner"></div>
            <div className="absolute bottom-3 right-3 w-2.5 h-2.5 rounded-full bg-neutral-800 border border-white/40 shadow-inner"></div>

            <p className="text-xs font-black tracking-widest uppercase text-neutral-800 mb-1">
              NIGHTRUNNA RECORD ACHIEVEMENT
            </p>

            <h3 className="text-2xl md:text-3xl font-black tracking-tight text-neutral-950 my-1 uppercase drop-shadow-sm">
              {achievement.milestoneLabel}
            </h3>

            <div className="w-24 h-0.5 bg-neutral-950/20 mx-auto my-3"></div>

            <h4 className="text-xl md:text-2xl font-bold text-neutral-900 tracking-tight mb-1">
              "{achievement.beatTitle}"
            </h4>

            <p className="text-sm font-semibold text-neutral-700 uppercase tracking-wide">
              PRODUCED BY {achievement.producer || 'NIGHTRUNNA'}
            </p>

            <div className="mt-4 pt-3 border-t border-neutral-950/15 flex flex-col items-center gap-1 text-[11px] font-mono text-neutral-800">
              <p className="font-bold">
                EARNED: {formattedDate.toUpperCase()} {formattedTime && `• ${formattedTime}`}
              </p>
              <p className="font-bold tracking-wider text-neutral-900">
                PLAQUE ID: {achievement.plaqueId}
              </p>
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 mt-1 bg-neutral-950 text-white font-sans text-[10px] font-bold rounded-full uppercase tracking-wider">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span>VERIFIED NIGHTRUNNA ACHIEVEMENT</span>
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="w-full mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-neutral-900">
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-indigo-500/20 active:scale-95 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{downloading ? 'Generating PNG...' : 'DOWNLOAD DIGITAL PLAQUE'}</span>
            </button>

            <button
              onClick={handleCopyLink}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-3 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white font-bold text-xs border border-neutral-800 rounded-xl transition-all active:scale-95"
              title="Copy verification URL"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4 text-indigo-400" />}
              <span>{copied ? 'Link Copied!' : 'Verify Link'}</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-300">
        <div className="relative w-full max-w-xl my-8">
          <button
            onClick={onClose}
            className="absolute -top-12 right-0 p-2 text-neutral-400 hover:text-white bg-neutral-900 border border-neutral-800 rounded-full transition-all shadow-lg"
          >
            <X className="w-5 h-5" />
          </button>
          {plaqueContent}
        </div>
      </div>
    );
  }

  return plaqueContent;
};
