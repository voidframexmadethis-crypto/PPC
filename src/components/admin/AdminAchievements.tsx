import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, setDoc, doc, serverTimestamp, addDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Beat, Achievement } from '../../types';
import { useStore } from '../../context/StoreContext';
import { MILESTONES, getBeatAchievementsProgress, generatePlaqueId, downloadPlaqueAsPNG } from '../../utils/achievementUtils';
import { DigitalRecordPlaque } from '../plaque/DigitalRecordPlaque';
import { Award, ShieldCheck, Download, RefreshCw, Eye, Music, CheckCircle2, Sparkles } from 'lucide-react';

export const AdminAchievements: React.FC = () => {
  const { state } = useStore();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'achievements'), orderBy('earnedTimestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs: Achievement[] = [];
      snapshot.forEach(docSnap => {
        docs.push({ id: docSnap.id, ...docSnap.data() } as Achievement);
      });
      setAchievements(docs);
    });

    return () => unsubscribe();
  }, []);

  // Sync and retroactively claim achievements for all store beats based on real play counts
  const handleSyncAchievements = async () => {
    setSyncing(true);
    setSyncMessage(null);
    let newClaimsCount = 0;

    try {
      for (const beat of state.beats) {
        const plays = beat.plays || 0;
        const earnedMilestones = MILESTONES.filter(m => plays >= m.milestone);

        for (const mDef of earnedMilestones) {
          const docId = `${beat.id}_${mDef.milestone}`;
          const existing = achievements.find(a => a.id === docId);

          if (!existing) {
            const plaqueId = generatePlaqueId(beat.id, mDef.milestone);
            const now = new Date();
            const achievementData: Achievement = {
              id: docId,
              plaqueId,
              beatId: beat.id,
              beatTitle: beat.title || 'Untitled Beat',
              producer: beat.producer || 'NightRunna',
              milestone: mDef.milestone,
              milestoneLabel: mDef.label,
              requiredPlays: mDef.milestone,
              actualPlaysWhenUnlocked: plays,
              coverArtUrl: beat.coverArtUrl || '',
              earnedDate: now.toISOString(),
              earnedTimestamp: now.getTime(),
              verificationStatus: 'VERIFIED',
            };

            // Save to Firestore
            await setDoc(doc(db, 'achievements', docId), {
              ...achievementData,
              createdAt: serverTimestamp(),
            });

            // Dispatch Admin Notification for new award
            await addDoc(collection(db, 'notifications'), {
              type: 'MILESTONE',
              title: '🏆 Achievement Unlocked',
              message: `"${beat.title}" reached ${mDef.label}.\nYour Digital Record Plaque is now available.`,
              url: '/admin/achievements',
              read: false,
              timestamp: now.toISOString()
            });

            newClaimsCount++;
          }
        }
      }

      setSyncMessage(
        newClaimsCount > 0
          ? `Successfully synchronized store records! Claimed ${newClaimsCount} new digital record plaque award(s).`
          : "All earned achievements are already synchronized and up to date."
      );
    } catch (err) {
      console.error("Failed to sync achievements:", err);
      setSyncMessage("An error occurred while syncing record plaques.");
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncMessage(null), 5000);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header & Sync Tool */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-900">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-mono text-xs font-bold mb-2">
            <Award className="w-3.5 h-3.5" />
            <span>RECORD PLAQUE MANAGEMENT</span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Achievements & Record Plaques</h1>
          <p className="text-neutral-400 text-sm mt-1">
            Real milestone plaques earned by catalog beats based on actual play counts.
          </p>
        </div>

        <button
          onClick={handleSyncAchievements}
          disabled={syncing}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/20 transition-all active:scale-95 disabled:opacity-50 shrink-0"
        >
          <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
          <span>{syncing ? 'Scanning Beats...' : 'Sync & Claim Plaques'}</span>
        </button>
      </div>

      {syncMessage && (
        <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-bold flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
          <span>{syncMessage}</span>
        </div>
      )}

      {/* Catalog Beats Milestone Progress Table */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-white tracking-tight">Beat Progress & Earned Plaques</h3>

        <div className="bg-neutral-950 border border-neutral-900 rounded-2xl overflow-hidden shadow-xl">
          <div className="divide-y divide-neutral-900">
            {state.beats.map((beat) => {
              const progress = getBeatAchievementsProgress(beat);
              const beatEarnedPlaques = achievements.filter(a => a.beatId === beat.id);

              return (
                <div key={beat.id} className="p-5 hover:bg-neutral-900/40 transition-colors">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    
                    {/* Beat Info */}
                    <div className="flex items-center gap-4 min-w-[280px]">
                      {beat.coverArtUrl ? (
                        <img src={beat.coverArtUrl} alt={beat.title} className="w-14 h-14 rounded-xl object-cover shrink-0 border border-neutral-800" />
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-neutral-900 flex items-center justify-center shrink-0 text-neutral-600">
                          <Music className="w-6 h-6" />
                        </div>
                      )}
                      <div>
                        <h4 className="text-sm font-bold text-white">{beat.title}</h4>
                        <p className="text-xs text-neutral-400">Produced by {beat.producer || 'NightRunna'}</p>
                        <div className="inline-flex items-center gap-1.5 mt-1 px-2 py-0.5 rounded-md bg-neutral-900 border border-neutral-800 text-[10px] font-mono text-indigo-400 font-bold">
                          <span>{beat.plays || 0} TOTAL PLAYS</span>
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="flex-1 max-w-md">
                      {progress.next ? (
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-xs">
                            <span className="text-neutral-400 font-medium">Next: <strong className="text-white">{progress.next.label}</strong></span>
                            <span className="font-mono text-neutral-400 font-bold">{beat.plays || 0} / {progress.next.milestone.toLocaleString()} plays ({progress.progressPercent}%)</span>
                          </div>
                          <div className="w-full h-2 bg-neutral-900 rounded-full overflow-hidden border border-neutral-800">
                            <div 
                              className="h-full bg-gradient-to-r from-indigo-500 to-fuchsia-500 rounded-full transition-all duration-500"
                              style={{ width: `${progress.progressPercent}%` }}
                            ></div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4 text-amber-400" />
                          <span>1 MILLION PLAYS - HIGHEST AWARD COMPLETED</span>
                        </div>
                      )}
                    </div>

                    {/* Earned Plaques Action List */}
                    <div className="flex flex-wrap items-center gap-2">
                      {beatEarnedPlaques.length === 0 ? (
                        <span className="text-xs font-mono text-neutral-600 italic">No plaques unlocked yet</span>
                      ) : (
                        beatEarnedPlaques.map((ach) => (
                          <div key={ach.id} className="flex items-center gap-1 bg-neutral-900 border border-neutral-800 rounded-xl px-2.5 py-1.5">
                            <span className="text-xs font-bold text-amber-400 font-mono">{ach.milestoneLabel}</span>
                            <button
                              onClick={() => setSelectedAchievement(ach)}
                              className="p-1 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
                              title="View Plaque"
                            >
                              <Eye className="w-3.5 h-3.5 text-indigo-400" />
                            </button>
                            <button
                              onClick={() => downloadPlaqueAsPNG(ach)}
                              className="p-1 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
                              title="Download High-Res PNG"
                            >
                              <Download className="w-3.5 h-3.5 text-emerald-400" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modal */}
      {selectedAchievement && (
        <DigitalRecordPlaque
          achievement={selectedAchievement}
          isModal={true}
          onClose={() => setSelectedAchievement(null)}
        />
      )}
    </div>
  );
};
