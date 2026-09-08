import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { Trash2, Play, Pause } from 'lucide-react';

export const PlayerManagement = () => {
  const { state, dispatch } = useStore();
  const [isPlaying, setIsPlaying] = useState<number | null>(null);

  const handleDelete = async (beatId: number, title: string) => {
    if (window.confirm(`Are you sure you want to remove "${title}" from the store and player?`)) {
      try {
        // Assuming the store context has a way to handle deletion
        // Need to check StoreContext or how beats are deleted in the existing system
        // Based on search, it was deleteDoc(beatRef);
        console.log(`Deleting beat ${beatId}`);
        // Implement actual deletion logic here
        // await deleteDoc(doc(db, "beats", beatId.toString()));
      } catch (error) {
        console.error("Failed to delete beat:", error);
      }
    }
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6">
      <h2 className="text-xl font-bold text-white mb-6">Player Beat Management</h2>
      <div className="space-y-4">
        {state.beats.map((beat: any) => (
          <div key={beat.id} className="flex items-center justify-between p-4 bg-neutral-950 rounded-xl border border-neutral-800">
            <div className="flex items-center gap-4">
              <img src={beat.artwork} alt={beat.title} className="w-12 h-12 rounded-lg object-cover" />
              <div>
                <h3 className="text-white font-bold">{beat.title}</h3>
                <p className="text-neutral-500 text-sm">{beat.producer}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button onClick={() => handleDelete(beat.id, beat.title)} className="text-red-400 hover:text-red-300 transition-colors">
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
