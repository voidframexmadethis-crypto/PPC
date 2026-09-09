import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Achievement } from '../../types';
import { DigitalRecordPlaque } from './DigitalRecordPlaque';
import { ShieldCheck, Award, ArrowLeft, CheckCircle2, AlertTriangle } from 'lucide-react';

export const PublicVerification: React.FC = () => {
  const { plaqueId } = useParams<{ plaqueId: string }>();
  const [achievement, setAchievement] = useState<Achievement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!plaqueId) {
      setLoading(false);
      setError("No Plaque ID provided.");
      return;
    }

    const fetchPlaque = async () => {
      try {
        const q = query(collection(db, 'achievements'), where('plaqueId', '==', plaqueId.toUpperCase()));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const docData = querySnapshot.docs[0].data();
          setAchievement({ id: querySnapshot.docs[0].id, ...docData } as Achievement);
        } else {
          // Fallback search by document ID or case-insensitive clean plaque ID
          const altQ = query(collection(db, 'achievements'), where('plaqueId', '==', plaqueId));
          const altSnap = await getDocs(altQ);
          if (!altSnap.empty) {
            setAchievement({ id: altSnap.docs[0].id, ...altSnap.docs[0].data() } as Achievement);
          } else {
            setError("No verified record plaque found matching this ID.");
          }
        }
      } catch (err) {
        console.error("Error verifying plaque ID:", err);
        setError("Unable to complete plaque verification at this time.");
      } finally {
        setLoading(false);
      }
    };

    fetchPlaque();
  }, [plaqueId]);

  return (
    <div className="min-h-screen bg-[#050505] text-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        
        {/* Navigation Back */}
        <div className="flex justify-between items-center">
          <Link 
            to="/"
            className="inline-flex items-center gap-2 text-xs font-mono text-neutral-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>BACK TO NIGHTRUNNA STORE</span>
          </Link>

          <Link
            to="/hall-of-fame"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            <Award className="w-3.5 h-3.5" />
            <span>HALL OF FAME</span>
          </Link>
        </div>

        {/* Verification Status Header */}
        <div className="p-6 md:p-8 rounded-3xl bg-neutral-950 border border-neutral-900 shadow-2xl text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto text-emerald-400">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
            VERIFIED NIGHTRUNNA RECORD ACHIEVEMENT
          </h1>
          <p className="text-xs font-mono text-neutral-400 tracking-widest uppercase">
            PLAQUE ID: {plaqueId}
          </p>
        </div>

        {loading ? (
          <div className="text-center py-20 text-neutral-500 animate-pulse text-sm">
            Verifying record plaque credentials...
          </div>
        ) : error || !achievement ? (
          <div className="p-8 rounded-3xl bg-red-500/10 border border-red-500/20 text-center space-y-3">
            <AlertTriangle className="w-10 h-10 text-red-400 mx-auto" />
            <h3 className="text-lg font-bold text-white">Plaque Verification Unsuccessful</h3>
            <p className="text-sm text-neutral-400 max-w-md mx-auto">
              {error || "The requested plaque ID could not be verified against NightRunna store records."}
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Verification Metadata Sheet */}
            <div className="p-6 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-400 pb-2 border-b border-neutral-800 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Verification Data Manifest</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                <div>
                  <span className="text-neutral-500 block">BEAT TITLE:</span>
                  <span className="text-white font-bold text-sm font-sans">{achievement.beatTitle}</span>
                </div>
                <div>
                  <span className="text-neutral-500 block">PRODUCER:</span>
                  <span className="text-white font-bold text-sm font-sans">{achievement.producer || 'NightRunna'}</span>
                </div>
                <div>
                  <span className="text-neutral-500 block">ACHIEVEMENT LEVEL:</span>
                  <span className="text-amber-400 font-bold text-sm font-sans">{achievement.milestoneLabel}</span>
                </div>
                <div>
                  <span className="text-neutral-500 block">VERIFICATION STATUS:</span>
                  <span className="text-emerald-400 font-bold text-sm font-sans">VERIFIED (100% AUTHENTIC)</span>
                </div>
                <div>
                  <span className="text-neutral-500 block">DATE EARNED:</span>
                  <span className="text-neutral-300">
                    {achievement.earnedDate ? new Date(achievement.earnedDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'RECORDED'}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-500 block">PERMANENT PLAQUE ID:</span>
                  <span className="text-indigo-400 font-bold">{achievement.plaqueId}</span>
                </div>
              </div>
            </div>

            {/* Full Digital Record Plaque Display */}
            <DigitalRecordPlaque achievement={achievement} />
          </div>
        )}

      </div>
    </div>
  );
};
