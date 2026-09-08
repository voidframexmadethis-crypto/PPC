import React from 'react';
import { useParams } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { Music, ExternalLink, Disc, MapPin, Tag } from 'lucide-react';

export default function PublicProfile() {
  const { state } = useStore();
  const { profile, beats } = state;
  const { username } = useParams();

  const publicBeats = beats.filter(b => b.visibility === 'Public');

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 pb-20">
      {/* Cinematic Hero */}
      <div className="relative h-[40vh] w-full overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-neutral-950 to-neutral-900" />
        <div className="absolute inset-0 bg-black/60" />
        <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
                <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter text-white/10">NIGHTRUNNA</h1>
            </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-8 -mt-32 relative z-10">
        <div className="flex flex-col md:flex-row items-end gap-8 mb-12">
          <div className="w-48 h-48 rounded-2xl border-4 border-neutral-950 bg-neutral-800 overflow-hidden shadow-2xl shadow-black/50 shrink-0 ring-1 ring-white/10">
            {profile.avatarUrl ? (
              <img src={profile.avatarUrl} alt={profile.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-6xl font-black text-indigo-500 bg-neutral-900">
                {profile.name.substring(0, 2).toUpperCase()}
              </div>
            )}
          </div>
          <div className="mb-2">
            <h1 className="text-5xl font-black uppercase tracking-tighter mb-1">{profile.name}</h1>
            <p className="text-indigo-400 font-bold tracking-widest uppercase text-sm">@{username || 'producer'}</p>
          </div>
        </div>

        {/* Bio Section */}
        <div className="grid md:grid-cols-3 gap-12 mb-16">
          <div className="md:col-span-2">
            <h2 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-6">Biography</h2>
            <p className="text-xl text-neutral-300 leading-relaxed font-light">{profile.bio}</p>
          </div>
          <div className="bg-neutral-900/50 rounded-2xl p-8 border border-neutral-800/50">
            <h2 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-6">Connect</h2>
            <div className="grid gap-3">
              {profile.socialLinks.map((link) => (
                <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between gap-3 text-neutral-300 hover:text-white bg-neutral-950 p-4 rounded-xl border border-neutral-800 hover:border-indigo-500/50 transition-all">
                  <span className="font-bold">{link.platform}</span>
                  <ExternalLink size={16} />
                </a>
              ))}
              {profile.socialLinks.length === 0 && <p className="text-neutral-600 italic text-sm">No links connected.</p>}
            </div>
          </div>
        </div>

        {/* Beats Grid */}
        <div className="mb-12">
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold uppercase tracking-tight">Latest Productions</h2>
                <button className="text-indigo-400 font-bold text-sm uppercase tracking-widest hover:text-indigo-300 transition-colors">Browse All Beats</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {publicBeats.slice(0, 6).map(beat => (
                <div key={beat.id} className="bg-neutral-900/50 rounded-2xl p-4 border border-neutral-800 hover:border-indigo-500/50 transition-all duration-300 group hover:shadow-2xl hover:shadow-indigo-900/10">
                <div className="aspect-square rounded-xl bg-neutral-800 mb-4 overflow-hidden relative shadow-inner">
                    <img src={beat.coverArtUrl} alt={beat.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    <button className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                        <Music className="w-16 h-16 text-white" />
                    </button>
                </div>
                <h3 className="font-bold text-lg mb-1">{beat.title}</h3>
                <p className="text-neutral-500 text-sm font-medium">{beat.primaryGenre} • {beat.bpm} BPM</p>
                </div>
            ))}
            </div>
        </div>
      </div>
    </div>
  );
}
