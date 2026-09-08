import React, { useState, useRef } from 'react';
import { useStore } from '../context/StoreContext';
import { useNavigate } from 'react-router-dom';
import { Eye, Save, Image as ImageIcon, User, Upload, Loader2, Facebook, Instagram, Youtube, Twitter, Music } from 'lucide-react';
import { storage } from '../lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export default function EditProfile() {
  const { state, updateProfile } = useStore();
  const { profile } = state;
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: profile.name || '',
    bio: profile.bio || '',
    avatarUrl: profile.avatarUrl || '',
    bannerUrl: profile.bannerUrl || '',
    socialLinks: profile.socialLinks || [],
  });
  const [uploading, setUploading] = useState<{avatar: boolean, banner: boolean}>({avatar: false, banner: false});
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const handleSocialLinkChange = (platform: string, url: string) => {
    const existingIndex = formData.socialLinks.findIndex(link => link.platform === platform);
    let newLinks = [...formData.socialLinks];
    if (existingIndex > -1) {
      newLinks[existingIndex].url = url;
    } else {
      newLinks.push({ id: platform.toLowerCase(), platform, url });
    }
    setFormData(prev => ({...prev, socialLinks: newLinks}));
  };

  const getLinkForPlatform = (platform: string) => {
    return formData.socialLinks.find(link => link.platform === platform)?.url || '';
  };

  const handleFileUpload = async (file: File, type: 'avatar' | 'banner') => {
    setUploading(prev => ({...prev, [type]: true}));
    try {
      const storageRef = ref(storage, `profiles/${type}/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setFormData(prev => ({...prev, [type === 'avatar' ? 'avatarUrl' : 'bannerUrl']: url}));
    } catch (error) {
      console.error("Upload failed", error);
    } finally {
      setUploading(prev => ({...prev, [type]: false}));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile(formData);
    navigate('/profile/krypside');
  };

  const platforms = [
    { name: 'Facebook', icon: Facebook },
    { name: 'Instagram', icon: Instagram },
    { name: 'YouTube', icon: Youtube },
    { name: 'X', icon: Twitter },
    { name: 'TikTok', icon: Music },
  ];

  return (
    <div className="min-h-screen bg-neutral-950 p-4 md:p-12 text-neutral-100">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-4">
            <div>
                <h1 className="text-4xl font-black uppercase tracking-tighter mb-1">Producer Control Center</h1>
                <p className="text-neutral-500 font-medium">Configure your premium artist brand</p>
            </div>
            <button onClick={() => navigate('/profile/krypside')} className="flex items-center gap-2 px-6 py-3 bg-white text-black hover:bg-neutral-200 rounded-full font-bold text-sm transition-all shadow-lg hover:shadow-indigo-500/20">
                <Eye size={16} /> View Public Profile
            </button>
        </div>

        <form onSubmit={handleSubmit} className="grid lg:grid-cols-2 gap-12">
            <div className="space-y-8">
                {/* Identity */}
                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-500">
                            <User size={24} />
                        </div>
                        <h2 className="text-xl font-bold uppercase tracking-tight">Identity</h2>
                    </div>
                    <div className="space-y-6">
                        <div>
                            <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-3">Producer Name</label>
                            <input 
                                type="text" 
                                value={formData.name} 
                                onChange={e => setFormData({...formData, name: e.target.value})}
                                className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-5 py-4 focus:border-indigo-500 outline-none transition-all text-lg font-medium"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-3">Biography</label>
                            <textarea 
                                value={formData.bio} 
                                onChange={e => setFormData({...formData, bio: e.target.value})}
                                className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-5 py-4 h-40 focus:border-indigo-500 outline-none transition-all text-lg font-light leading-relaxed"
                            />
                        </div>
                    </div>
                </div>

                {/* Imagery & Socials */}
                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-500">
                            <ImageIcon size={24} />
                        </div>
                        <h2 className="text-xl font-bold uppercase tracking-tight">Profile Imagery & Socials</h2>
                    </div>
                    <div className="grid gap-6">
                        <div>
                            <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-3">Avatar</label>
                            <div className="flex items-center gap-4">
                                <input type="file" ref={avatarInputRef} className="hidden" accept="image/*" onChange={(e) => e.target.files && handleFileUpload(e.target.files[0], 'avatar')} />
                                <div className="w-16 h-16 rounded-xl bg-neutral-950 border border-neutral-700 overflow-hidden flex items-center justify-center">
                                    {formData.avatarUrl ? <img src={formData.avatarUrl} className="w-full h-full object-cover" /> : <User className="text-neutral-500" />}
                                </div>
                                <button type="button" onClick={() => avatarInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-sm font-bold transition-all">
                                    {uploading.avatar ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                                    {uploading.avatar ? 'Uploading...' : 'Upload Avatar'}
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-3">Banner</label>
                            <div className="flex items-center gap-4">
                                <input type="file" ref={bannerInputRef} className="hidden" accept="image/*" onChange={(e) => e.target.files && handleFileUpload(e.target.files[0], 'banner')} />
                                <div className="w-32 h-16 rounded-xl bg-neutral-950 border border-neutral-700 overflow-hidden flex items-center justify-center">
                                    {formData.bannerUrl ? <img src={formData.bannerUrl} className="w-full h-full object-cover" /> : <ImageIcon className="text-neutral-500" />}
                                </div>
                                <button type="button" onClick={() => bannerInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-sm font-bold transition-all">
                                    {uploading.banner ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                                    {uploading.banner ? 'Uploading...' : 'Upload Banner'}
                                </button>
                            </div>
                        </div>
                        {/* Socials */}
                        <div className="mt-4 pt-6 border-t border-neutral-800 space-y-4">
                            {platforms.map(p => (
                                <div key={p.name}>
                                    <label className="flex items-center gap-2 text-xs font-bold text-neutral-500 uppercase tracking-widest mb-2">
                                        <p.icon size={14} /> {p.name} URL
                                    </label>
                                    <input 
                                        type="url" 
                                        value={getLinkForPlatform(p.name)} 
                                        onChange={e => handleSocialLinkChange(p.name, e.target.value)}
                                        className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-5 py-3 focus:border-indigo-500 outline-none transition-all"
                                        placeholder={`https://${p.name.toLowerCase()}.com/...`}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Sidebar Actions */}
            <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-8 h-fit lg:sticky lg:top-8">
                <h2 className="text-xl font-bold uppercase tracking-tight mb-8">Save Changes</h2>
                <button type="submit" className="w-full flex items-center justify-center gap-3 bg-indigo-600 hover:bg-indigo-700 text-white py-5 rounded-xl font-bold text-lg transition-all shadow-lg shadow-indigo-900/20 active:scale-[0.98]">
                    <Save size={20} /> Apply Profile Changes
                </button>
                <div className="mt-8 p-6 bg-neutral-950 rounded-xl border border-neutral-800">
                    <p className="text-neutral-500 text-sm italic">Changes are applied globally once saved. Your public profile will reflect these updates immediately to all visitors.</p>
                </div>
            </div>
        </form>
      </div>
    </div>
  );
}
