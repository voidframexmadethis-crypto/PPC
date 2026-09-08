import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { useNavigate } from 'react-router-dom';
import { Eye, Save, Image as ImageIcon, User, FileText } from 'lucide-react';

export default function EditProfile() {
  const { state, updateProfile } = useStore();
  const { profile } = state;
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: profile.name || '',
    bio: profile.bio || '',
    avatarUrl: profile.avatarUrl || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile(formData);
  };

  return (
    <div className="min-h-screen bg-neutral-950 p-4 md:p-8 text-neutral-100">
      {/* Hero */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight">Producer Control Center</h1>
          <p className="text-neutral-500">Manage your artist brand identity</p>
        </div>
        <button onClick={() => navigate('/profile/krypside')} className="flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg font-bold text-sm transition-all">
          <Eye size={16} /> View Public Profile
        </button>
      </div>

      <form onSubmit={handleSubmit} className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
            {/* Identity Card */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-6">
                    <User className="text-indigo-500" />
                    <h2 className="text-lg font-bold">Profile Identity</h2>
                </div>
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-2">Producer Name</label>
                        <input 
                            type="text" 
                            value={formData.name} 
                            onChange={e => setFormData({...formData, name: e.target.value})}
                            className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-4 py-3 focus:border-indigo-500 transition-colors"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-2">Bio</label>
                        <textarea 
                            value={formData.bio} 
                            onChange={e => setFormData({...formData, bio: e.target.value})}
                            className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-4 py-3 h-32 focus:border-indigo-500 transition-colors"
                        />
                    </div>
                </div>
            </div>

            {/* Imagery Card */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-6">
                    <ImageIcon className="text-indigo-500" />
                    <h2 className="text-lg font-bold">Profile Imagery</h2>
                </div>
                <div>
                    <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-2">Avatar URL</label>
                    <input 
                        type="text" 
                        value={formData.avatarUrl} 
                        onChange={e => setFormData({...formData, avatarUrl: e.target.value})}
                        className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-4 py-3 focus:border-indigo-500 transition-colors"
                    />
                </div>
            </div>
        </div>

        {/* Sidebar Controls */}
        <div className="space-y-6">
            <button type="submit" className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-xl font-bold text-lg transition-all shadow-lg shadow-indigo-900/20">
                <Save size={20} /> Save Changes
            </button>
        </div>
      </form>
    </div>
  );
}
