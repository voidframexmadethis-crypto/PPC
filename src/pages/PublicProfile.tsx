import React from 'react';
import { useParams } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { Music, ExternalLink, Disc } from 'lucide-react';

export default function PublicProfile() {
  const { state } = useStore();
  const { profile, beats } = state;
  const { username } = useParams();

  const publicBeats = beats.filter(b => b.visibility === 'Public');

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      {/* Cinematic Hero */}
      <div className="relative h-80 w-full overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-tr from-indigo-950 via-neutral-900 to-neutral-950" />
        <div className="absolute inset-0 bg-black/40" />
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 -mt-24 relative z-10">
        <div className="flex flex-col md:flex-row items-start md:items-end gap-6 mb-12">
          <div className="w-40 h-40 rounded-3xl border-4 border-neutral-950 bg-neutral-800 overflow-hidden shadow-2xl shrink-0">
            {profile.avatarUrl ? (
              <img src={profile.avatarUrl} alt={profile.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-5xl font-black text-indigo-500 bg-neutral-900">
                {profile.name.substring(0, 2).toUpperCase()}
              </div>
            )}
          </div>
          <div className="mb-4">
            <h1 className="text-5xl font-black uppercase tracking-tighter mb-2">{profile.name}</h1>
            <p className="text-indigo-400 font-medium text-lg">@{username || 'producer'}</p>
          </div>
        </div>

        {/* Bio */}
        <div className="grid md:grid-cols-3 gap-12 mb-16">
          <div className="md:col-span-2">
            <h2 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-4">About</h2>
            <p className="text-lg text-neutral-300 leading-relaxed">{profile.bio}</p>
          </div>
          <div className="bg-neutral-900 rounded-2xl p-6 border border-neutral-800">
            <h2 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-4">Socials</h2>
            <div className="space-y-3">
              {profile.socialLinks.map((link) => (
                <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-neutral-300 hover:text-indigo-400 transition-colors">
                  <ExternalLink size={16} />
                  {link.platform}
                </a>
              ))}
              {profile.socialLinks.length === 0 && <p className="text-neutral-600 italic text-sm">No links connected.</p>}
            </div>
          </div>
        </div>

        {/* Beats */}
        <h2 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-8">Latest Beats</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {publicBeats.slice(0, 6).map(beat => (
            <div key={beat.id} className="bg-neutral-900/50 rounded-2xl p-4 border border-neutral-800 hover:border-indigo-500/50 transition-colors group">
              <div className="aspect-square rounded-xl bg-neutral-800 mb-4 overflow-hidden relative">
                <img src={beat.coverArtUrl} alt={beat.title} className="w-full h-full object-cover" />
                <button className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Music className="w-12 h-12 text-white" />
                </button>
              </div>
              <h3 className="font-bold text-lg">{beat.title}</h3>
              <p className="text-neutral-500 text-sm">{beat.primaryGenre} • {beat.bpm} BPM</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
