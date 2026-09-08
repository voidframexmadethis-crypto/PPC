import React from 'react';
import { User, Building2, Briefcase, Mic2, Headphones } from 'lucide-react';

const roles = [
  { id: 'artist', label: 'I’m an Artist', icon: Mic2 },
  { id: 'label', label: 'I’m a Record Label', icon: Building2 },
  { id: 'manager', label: 'I’m a Manager', icon: Briefcase },
  { id: 'curator', label: 'I’m a Playlist Curator', icon: User },
  { id: 'engineer', label: 'I’m a Music Engineer', icon: Headphones },
];

export const JoinNetworkView = () => (
  <div className="space-y-6">
    <h2 className="text-2xl font-bold text-white text-center">Join the NightRunna Music Network</h2>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {roles.map(role => (
        <button key={role.id} className="bg-neutral-800 p-6 rounded-xl border border-neutral-700 hover:border-indigo-500 transition-all flex flex-col items-center text-center gap-4">
          <role.icon className="w-10 h-10 text-indigo-400" />
          <span className="font-bold text-white">{role.label}</span>
          <span className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-500">JOIN AS {role.id.toUpperCase()}</span>
        </button>
      ))}
    </div>
  </div>
);
