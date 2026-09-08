import React, { useState, useRef } from 'react';
import { Upload, Image as ImageIcon, CheckCircle2, DollarSign, Loader2 } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { storage } from '../lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const steps = ['Upload ZIP', 'Artwork', 'Pack Details', 'Store Preview', 'Review & Publish'];

export default function BeatPackUploader() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    zipFile: null as File | null,
    artworkUrl: '',
    name: '',
    description: '',
    tags: '',
    price: 0,
    enableFreePreview: false,
  });
  const [uploading, setUploading] = useState(false);
  const artworkInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File, type: 'zip' | 'artwork') => {
    setUploading(true);
    try {
      const storageRef = ref(storage, `beatpacks/${type}/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      if (type === 'artwork') setFormData(prev => ({...prev, artworkUrl: url}));
      else setFormData(prev => ({...prev, zipFile: file }));
    } catch (error) {
      console.error("Upload failed", error);
    } finally {
      setUploading(false);
    }
  };

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 0));

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="border-4 border-dashed border-neutral-800 rounded-3xl p-16 text-center hover:border-indigo-500/50 transition-all bg-neutral-950">
            <Upload className="w-16 h-16 mx-auto text-neutral-600 mb-6" />
            <h3 className="text-2xl font-bold text-white mb-2">Drop Beat Pack ZIP</h3>
            <input type="file" accept=".zip" onChange={(e) => e.target.files && handleFileUpload(e.target.files[0], 'zip')} className="mt-4" />
            {formData.zipFile && <p className="mt-4 text-emerald-400 font-bold">{formData.zipFile.name}</p>}
          </div>
        );
      case 1:
        return (
          <div className="border-2 border-neutral-800 rounded-3xl p-8 bg-neutral-950 text-center">
            <ImageIcon className="w-16 h-16 mx-auto text-neutral-600 mb-6" />
            <input type="file" ref={artworkInputRef} accept="image/*" onChange={(e) => e.target.files && handleFileUpload(e.target.files[0], 'artwork')} className="hidden" />
            <button type="button" onClick={() => artworkInputRef.current?.click()} className="bg-neutral-800 px-6 py-3 rounded-xl font-bold">
              {uploading ? <Loader2 className="animate-spin" /> : 'Select Artwork'}
            </button>
            {formData.artworkUrl && <img src={formData.artworkUrl} className="mt-6 w-48 h-48 mx-auto rounded-xl object-cover" />}
          </div>
        );
      case 2:
        return (
          <div className="grid gap-6">
            <input type="text" placeholder="Pack Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-4" />
            <textarea placeholder="Description" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-4 h-32" />
            <div className="flex gap-4">
              <input type="text" placeholder="Tags (comma separated)" value={formData.tags} onChange={e => setFormData({...formData, tags: e.target.value})} className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl p-4" />
              <div className="relative w-32">
                <DollarSign className="absolute left-3 top-4 text-neutral-500" />
                <input type="number" placeholder="Price" value={formData.price} onChange={e => setFormData({...formData, price: parseFloat(e.target.value)})} className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-4 pl-10" />
              </div>
            </div>
            <label className="flex items-center gap-3">
              <input type="checkbox" checked={formData.enableFreePreview} onChange={e => setFormData({...formData, enableFreePreview: e.target.checked})} />
              Enable Free Preview Download
            </label>
          </div>
        );
      case 3:
        return (
          <div className="bg-neutral-950 rounded-2xl p-8 border border-neutral-800">
            <h3 className="text-xl font-bold text-white mb-4">Preview</h3>
            {formData.artworkUrl && <img src={formData.artworkUrl} className="w-32 h-32 rounded-xl mb-4" />}
            <div className="font-bold text-2xl text-white">{formData.name || 'Untitled Pack'}</div>
            <p className="text-neutral-400 mt-2">{formData.description || 'No description...'}</p>
            <div className="mt-4 text-emerald-400 font-bold text-xl">${formData.price.toFixed(2)}</div>
          </div>
        );
      case 4:
        return (
          <div className="bg-neutral-950 rounded-2xl p-8 border border-neutral-800 text-center">
            <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-6" />
            <h3 className="text-2xl font-bold text-white mb-2">Review & Publish</h3>
            <p className="text-neutral-500 mb-8">Ready to make your pack live?</p>
            <button className="bg-indigo-600 px-8 py-4 rounded-2xl font-bold">Publish Beat Pack</button>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-6 bg-neutral-900 rounded-3xl border border-neutral-800 shadow-2xl">
      <h1 className="text-3xl font-black uppercase tracking-tighter text-white mb-8">Beat Pack Studio</h1>
      <div className="flex justify-between mb-12">
        {steps.map((step, i) => (
          <div key={step} className="flex flex-col items-center flex-1">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all border-4 ${
              i < currentStep ? 'bg-emerald-500 border-emerald-500 text-white' : 
              i === currentStep ? 'bg-neutral-900 border-indigo-500 text-indigo-400' : 'bg-neutral-950 border-neutral-800 text-neutral-600'
            }`}>
              {i < currentStep ? <CheckCircle2 className="w-6 h-6" /> : i + 1}
            </div>
            <span className={`text-xs mt-3 font-bold uppercase tracking-widest ${i === currentStep ? 'text-white' : 'text-neutral-500'}`}>
              {step}
            </span>
          </div>
        ))}
      </div>
      <div className="min-h-[400px]">{renderStep()}</div>
      <div className="flex justify-between mt-12 pt-8 border-t border-neutral-800">
        <button onClick={prevStep} disabled={currentStep === 0} className="px-8 py-4 bg-neutral-950 hover:bg-neutral-800 rounded-2xl font-bold text-neutral-400 disabled:opacity-50">Back</button>
        <button onClick={nextStep} className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 rounded-2xl font-bold text-white">{currentStep === steps.length - 1 ? 'Publish Pack' : 'Next Step'}</button>
      </div>
    </div>
  );
}
