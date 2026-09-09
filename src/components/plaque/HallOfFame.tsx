import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Achievement, Beat } from '../../types';
import { useStore } from '../../context/StoreContext';
import { MILESTONES, getBeatAchievementsProgress } from '../../utils/achievementUtils';
import { DigitalRecordPlaque } from './DigitalRecordPlaque';
import { Award, ShieldCheck, Search, Download, ExternalLink, Music, Sparkles } from 'lucide-react';

interface HallOfFameProps {
  onSelectBeat?: (beatId: string) => void;
}

export const HallOfFame: React.FC<HallOfFameProps> = () => {
  const { state } = useStore();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMilestoneFilter, setSelectedMilestoneFilter] = useState<number | 'ALL'>('ALL');

  useEffect(() => {
    const q = query(collection(db, 'achievements'), orderBy('earnedTimestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs: Achievement[] = [];
      snapshot.forEach(doc => {
        docs.push({ id: doc.id, ...doc.data() } as Achievement);
      });
      setAchievements(docs);
      setLoading(false);
    }, (error) => {
      console.warn("Could not load achievements from Firestore, fallback to local evaluation:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredAchievements = achievements.filter(ach => {
    const matchesSearch = 
      ach.beatTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ach.producer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ach.plaqueId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = selectedMilestoneFilter === 'ALL' || ach.milestone === selectedMilestoneFilter;
    return matchesSearch && matchesFilter;
  });

  // Calculate upcoming progression for beats
  const beatProgressions = state.beats.map(beat => ({
    beat,
    progress: getBeatAchievementsProgress(beat)
  })).sort((a, b) => b.progress.progressPercent - a.progress.progressPercent);

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-neutral-950 via-indigo-950/40 to-neutral-950 border border-neutral-800 p-8 md:p-12 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-mono text-xs font-bold mb-4">
            <Award className="w-4 h-4" />
            <span>NIGHTRUNNA RECORD PLAQUE HALL OF FAME</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight">
            Certified Record Achievements
          </h1>
          <p className="text-neutral-400 text-sm md:text-base mt-3 leading-relaxed">
            Officially verified digital record plaques earned by NightRunna instrumental beats crossing real play count milestones.
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-neutral-900">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
          <button
            onClick={() => setSelectedMilestoneFilter('ALL')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
              selectedMilestoneFilter === 'ALL'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                : 'bg-neutral-900 text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
          >
            All Plaques ({achievements.length})
          </button>
          {MILESTONES.map(m => (
            <button
              key={m.milestone}
              onClick={() => setSelectedMilestoneFilter(m.milestone)}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
                selectedMilestoneFilter === m.milestone
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                  : 'bg-neutral-900 text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search beat title or Plaque ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500 transition-all"
          />
        </div>
      </div>

      {/* Achievements Gallery */}
      {loading ? (
        <div className="text-center py-20 text-neutral-500 text-sm animate-pulse">
          Loading Hall of Fame records...
        </div>
      ) : filteredAchievements.length === 0 ? (
        <div className="space-y-10">
          <div className="text-center py-16 px-6 bg-neutral-950/60 border border-neutral-900 rounded-3xl">
            <Award className="w-12 h-12 text-indigo-500/40 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white tracking-tight">No Earned Record Plaques Yet</h3>
            <p className="text-neutral-400 text-sm mt-2 max-w-md mx-auto">
              Record plaques are officially generated when a beat crosses legitimate play milestones (100 plays → 1,000,000 plays).
            </p>
          </div>

          {/* Real Play Count Progress Bar List */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <span>Milestone Progress Tracking</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {beatProgressions.map(({ beat, progress }) => (
                <div key={beat.id} className="p-5 bg-neutral-900/60 border border-neutral-800/80 rounded-2xl flex items-center gap-4">
                  {beat.coverArtUrl ? (
                    <img src={beat.coverArtUrl} alt={beat.title} className="w-16 h-16 rounded-xl object-cover shrink-0 border border-neutral-800" />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-neutral-950 flex items-center justify-center shrink-0 text-neutral-600">
                      <Music className="w-6 h-6" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <h4 className="text-sm font-bold text-white truncate">{beat.title}</h4>
                      <span className="text-xs font-mono text-indigo-400 font-bold ml-2 shrink-0">
                        {beat.plays || 0} plays
                      </span>
                    </div>

                    {progress.next ? (
                      <div className="mt-2 space-y-1">
                        <div className="flex justify-between text-[11px] text-neutral-400">
                          <span>Next: {progress.next.label}</span>
                          <span className="font-mono">{progress.progressPercent}%</span>
                        </div>
                        <div className="w-full h-2 bg-neutral-950 rounded-full overflow-hidden border border-neutral-800">
                          <div 
                            className="h-full bg-gradient-to-r from-indigo-500 to-fuchsia-500 rounded-full transition-all duration-500"
                            style={{ width: `${progress.progressPercent}%` }}
                          ></div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-amber-400 font-bold mt-2">
                        🏆 ALL MILESTONES COMPLETED
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAchievements.map((achievement) => {
            const mDef = MILESTONES.find(m => m.milestone === achievement.milestone) || MILESTONES[0];
            const isMillion = achievement.milestone >= 1000000;

            return (
              <div
                key={achievement.id}
                onClick={() => setSelectedAchievement(achievement)}
                className={`group relative p-6 rounded-2xl border transition-all cursor-pointer hover:-translate-y-1 ${
                  isMillion
                    ? 'bg-gradient-to-b from-amber-950/40 via-neutral-950 to-neutral-950 border-amber-500/40 hover:border-amber-400 shadow-xl shadow-amber-500/5'
                    : 'bg-neutral-950 border-neutral-800 hover:border-neutral-700 shadow-lg'
                }`}
              >
                {/* Plaque Thumbnail Preview */}
                <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-neutral-900 mb-5 border border-neutral-800 flex items-center justify-center p-4">
                  {/* Outer Frame Effect */}
                  <div className="absolute inset-2 border border-white/10 rounded-lg pointer-events-none"></div>

                  {/* Vinyl Record Center */}
                  <div className="relative w-36 h-36 md:w-44 md:h-44 rounded-full bg-neutral-950 border-4 border-neutral-800 shadow-2xl flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-1 rounded-full border border-white/5 pointer-events-none"></div>
                    <div className="absolute inset-3 rounded-full border border-white/5 pointer-events-none"></div>

                    {/* Artwork Center Label */}
                    <div className="w-16 h-16 rounded-full border-2 border-amber-500/50 overflow-hidden shrink-0">
                      {achievement.coverArtUrl ? (
                        <img src={achievement.coverArtUrl} alt={achievement.beatTitle} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-neutral-900 flex items-center justify-center text-[8px] text-neutral-500">
                          NIGHTRUNNA
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Milestone Badge Overlay */}
                  <div className="absolute top-4 left-4 px-3 py-1 bg-neutral-950/90 border border-neutral-800 rounded-full text-[10px] font-mono font-bold tracking-widest text-white uppercase shadow-md flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{achievement.milestoneLabel}</span>
                  </div>
                </div>

                {/* Plaque Info */}
                <div className="space-y-1">
                  <h4 className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors truncate">
                    "{achievement.beatTitle}"
                  </h4>
                  <p className="text-xs text-neutral-400">
                    Produced by {achievement.producer || 'NightRunna'}
                  </p>
                  
                  <div className="pt-3 border-t border-neutral-900 flex justify-between items-center text-[10px] font-mono text-neutral-500">
                    <span>ID: {achievement.plaqueId}</span>
                    <span className="text-indigo-400 font-bold group-hover:underline">View Plaque →</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
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
