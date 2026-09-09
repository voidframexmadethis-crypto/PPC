import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { Video, Youtube, Instagram, Facebook, Twitter, Download, RefreshCw, UploadCloud, Play, Link as LinkIcon, ShieldAlert } from 'lucide-react';
import { Beat } from '../../types';

export const VideoAdMaker = () => {
  const { state } = useStore();
  const [selectedBeatId, setSelectedBeatId] = useState<string>('');
  const [beatUrl, setBeatUrl] = useState<string>('');
  const [badgeText, setBadgeText] = useState('PROMOTION');
  const [showBadge, setShowBadge] = useState(true);
  const [badgePosition, setBadgePosition] = useState<'top' | 'bottom'>('top');
  const [badgeSize, setBadgeSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [badgeOpacity, setBadgeOpacity] = useState<number>(100);
  const [badgeStyle, setBadgeStyle] = useState<'solid' | 'outline' | 'glass'>('solid');
  const [videoFormat, setVideoFormat] = useState<'9:16' | '1:1' | '16:9'>('9:16');
  const [isExporting, setIsExporting] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const selectedBeat = state.beats.find(b => b.id === selectedBeatId);

  // Social Connections Architecture
  const socialPlatforms = [
    { name: 'YouTube', icon: Youtube, status: 'CONNECTION REQUIRED', connected: false, color: 'text-red-500' },
    { name: 'TikTok', icon: Video, status: 'NOT CONNECTED', connected: false, color: 'text-neutral-200' },
    { name: 'Instagram', icon: Instagram, status: 'AUTHORIZATION REQUIRED', connected: false, color: 'text-pink-500' },
    { name: 'Facebook', icon: Facebook, status: 'NOT CONNECTED', connected: false, color: 'text-blue-500' },
    { name: 'X / Twitter', icon: Twitter, status: 'NOT CONNECTED', connected: false, color: 'text-neutral-400' }
  ];

  const handleExport = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      alert('Local export simulated (requires backend rendering for actual MP4 generation). Download ready!');
    }, 2000);
  };

  const getBadgeClasses = () => {
    let classes = 'font-black uppercase tracking-widest rounded shadow-lg transition-all ';
    
    // Size
    if (badgeSize === 'small') classes += 'px-3 py-1 text-xs ';
    else if (badgeSize === 'medium') classes += 'px-4 py-1.5 text-sm md:text-base ';
    else if (badgeSize === 'large') classes += 'px-6 py-2 text-base md:text-xl ';
    
    // Style
    if (badgeStyle === 'solid') classes += 'bg-red-600 text-white border border-red-500 ';
    else if (badgeStyle === 'outline') classes += 'bg-transparent text-red-500 border-2 border-red-500 shadow-none ';
    else if (badgeStyle === 'glass') classes += 'bg-red-600/30 text-white backdrop-blur-md border border-white/20 ';
    
    return classes;
  };

  const getFormatClasses = () => {
    switch (videoFormat) {
      case '9:16': return 'aspect-[9/16] w-full max-w-[320px] mx-auto';
      case '1:1': return 'aspect-square w-full max-w-[400px] mx-auto';
      case '16:9': return 'aspect-video w-full';
      default: return 'aspect-[9/16] w-full max-w-[320px] mx-auto';
    }
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-xl animate-in fade-in duration-300">
      <div className="border-b border-neutral-800 p-6 flex justify-between items-center bg-neutral-950">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Video className="text-indigo-400" /> Video Advertisement Maker
          </h2>
          <p className="text-neutral-400 text-sm mt-1">Design, export, and publish promotional videos directly to your social channels.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row h-full min-h-[700px]">
        
        {/* LEFT COLUMN: EDITOR */}
        <div className="w-full lg:w-1/2 p-6 overflow-y-auto border-r border-neutral-800 bg-neutral-950/50 space-y-8">
          
          {/* Beat Selection */}
          <section>
            <h3 className="text-lg font-bold text-white mb-4">1. Select Audio</h3>
            <select 
              className="w-full bg-neutral-900 border border-neutral-700 text-white rounded-lg p-3 outline-none focus:border-indigo-500"
              value={selectedBeatId}
              onChange={(e) => setSelectedBeatId(e.target.value)}
            >
              <option value="">-- Choose a Beat from Catalog --</option>
              {state.beats.map(beat => (
                <option key={beat.id} value={beat.id}>{beat.title} • {beat.bpm} BPM • {beat.key}</option>
              ))}
            </select>
            {selectedBeat && (
              <div className="mt-4 bg-neutral-900 border border-neutral-800 rounded-lg p-4 flex items-center gap-4">
                <img src={selectedBeat.coverArtUrl || 'https://via.placeholder.com/150'} alt="Art" className="w-16 h-16 rounded-md object-cover shadow-md" />
                <div>
                  <p className="font-bold text-white">{selectedBeat.title}</p>
                  <p className="text-xs text-neutral-400">Produced by {selectedBeat.producer || 'NightRunna'}</p>
                  <p className="text-indigo-400 font-mono text-sm mt-1">${selectedBeat.price.toFixed(2)}</p>
                </div>
              </div>
            )}
          </section>

          {/* Ad Configuration */}
          <section>
            <h3 className="text-lg font-bold text-white mb-4">2. Ad Configuration</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-neutral-400 uppercase font-bold mb-2">Beat/Store Link (Call To Action)</label>
                <div className="flex bg-neutral-900 border border-neutral-700 rounded-lg overflow-hidden">
                  <span className="p-3 text-neutral-500 bg-neutral-950 border-r border-neutral-700"><LinkIcon size={18} /></span>
                  <input 
                    type="url" 
                    placeholder="https://yourstore.com/beat-link" 
                    className="w-full bg-transparent p-3 text-white outline-none text-sm"
                    value={beatUrl}
                    onChange={(e) => setBeatUrl(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-neutral-400 uppercase font-bold mb-2">Video Format</label>
                <div className="flex gap-2">
                  <button onClick={() => setVideoFormat('9:16')} className={`flex-1 py-2 rounded-lg text-sm font-bold border ${videoFormat === '9:16' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-neutral-900 border-neutral-700 text-neutral-400 hover:text-white'}`}>9:16 (TikTok/Reels)</button>
                  <button onClick={() => setVideoFormat('1:1')} className={`flex-1 py-2 rounded-lg text-sm font-bold border ${videoFormat === '1:1' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-neutral-900 border-neutral-700 text-neutral-400 hover:text-white'}`}>1:1 (Square)</button>
                  <button onClick={() => setVideoFormat('16:9')} className={`flex-1 py-2 rounded-lg text-sm font-bold border ${videoFormat === '16:9' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-neutral-900 border-neutral-700 text-neutral-400 hover:text-white'}`}>16:9 (YouTube)</button>
                </div>
              </div>

              <div>
                <label className="block text-xs text-neutral-400 uppercase font-bold mb-2 flex items-center justify-between">
                  <span>Promotion Badge</span>
                  <input type="checkbox" checked={showBadge} onChange={(e) => setShowBadge(e.target.checked)} className="rounded bg-neutral-900 border-neutral-700" />
                </label>
                {showBadge && (
                  <div className="space-y-2 mt-2">
                    <div className="flex gap-2">
                      <input type="text" value={badgeText} onChange={(e) => setBadgeText(e.target.value)} className="flex-1 bg-neutral-900 border border-neutral-700 rounded-lg p-2 text-sm text-white" placeholder="Badge Text" />
                      <select value={badgePosition} onChange={(e) => setBadgePosition(e.target.value as any)} className="bg-neutral-900 border border-neutral-700 rounded-lg p-2 text-sm text-white">
                        <option value="top">Top</option>
                        <option value="bottom">Bottom</option>
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <select value={badgeSize} onChange={(e) => setBadgeSize(e.target.value as any)} className="flex-1 bg-neutral-900 border border-neutral-700 rounded-lg p-2 text-sm text-white">
                        <option value="small">Small Size</option>
                        <option value="medium">Medium Size</option>
                        <option value="large">Large Size</option>
                      </select>
                      <select value={badgeStyle} onChange={(e) => setBadgeStyle(e.target.value as any)} className="flex-1 bg-neutral-900 border border-neutral-700 rounded-lg p-2 text-sm text-white">
                        <option value="solid">Solid Background</option>
                        <option value="outline">Outline Only</option>
                        <option value="glass">Glass Effect</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-neutral-400 font-bold">Opacity</span>
                      <input type="range" min="10" max="100" value={badgeOpacity} onChange={(e) => setBadgeOpacity(Number(e.target.value))} className="w-full" />
                      <span className="text-xs text-white font-mono w-8">{badgeOpacity}%</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Export & Publishing */}
          <section>
            <h3 className="text-lg font-bold text-white mb-4">3. Export & Publish</h3>
            
            <button 
              onClick={handleExport}
              disabled={!selectedBeat || isExporting}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-2 mb-6 shadow-lg shadow-emerald-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExporting ? <RefreshCw className="animate-spin" /> : <Download />}
              {isExporting ? 'Rendering Video...' : 'Export Local MP4'}
            </button>

            <div className="space-y-3">
              <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-widest border-b border-neutral-800 pb-2">Social Publishing Architecture</h4>
              
              {socialPlatforms.map((platform) => {
                const Icon = platform.icon;
                return (
                  <div key={platform.name} className="bg-neutral-900 border border-neutral-800 rounded-lg p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg bg-neutral-950 border border-neutral-800 ${platform.color}`}>
                        <Icon size={18} />
                      </div>
                      <div>
                        <p className="font-bold text-white text-sm">{platform.name}</p>
                        <p className="text-[10px] text-amber-500 font-mono flex items-center gap-1">
                          <ShieldAlert size={10} /> {platform.status}
                        </p>
                      </div>
                    </div>
                    <button disabled className="bg-neutral-800 text-neutral-500 px-3 py-1.5 rounded text-xs font-bold opacity-50 cursor-not-allowed">
                      Connect
                    </button>
                  </div>
                );
              })}
            </div>
          </section>

        </div>

        {/* RIGHT COLUMN: LIVE PREVIEW */}
        <div className="w-full lg:w-1/2 bg-neutral-950 p-4 md:p-8 flex items-center justify-center relative bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-neutral-900 to-neutral-950">
          
          <div className="absolute top-4 right-4 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2 backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span> LIVE PREVIEW
          </div>

          <div className={`relative overflow-hidden bg-black shadow-2xl ring-1 ring-neutral-800 transition-all duration-500 flex items-center justify-center ${getFormatClasses()}`}>
            
            {/* Background Blur Effect */}
            {selectedBeat?.coverArtUrl && (
              <div 
                className="absolute inset-0 bg-cover bg-center opacity-30 scale-110 blur-xl"
                style={{ backgroundImage: `url(${selectedBeat.coverArtUrl})` }}
              />
            )}

            {!selectedBeat ? (
              <div className="text-center text-neutral-600 p-6 z-10">
                <Video size={48} className="mx-auto mb-4 opacity-50" />
                <p className="font-bold">Select a beat to preview</p>
              </div>
            ) : (
              <div className="relative z-10 w-full h-full flex flex-col items-center justify-center p-6 text-center">
                
                {/* Badge - Top */}
                {showBadge && badgePosition === 'top' && (
                  <div className="absolute top-6 left-0 right-0 flex justify-center z-20">
                    <span className={getBadgeClasses()} style={{ opacity: badgeOpacity / 100 }}>
                      {badgeText}
                    </span>
                  </div>
                )}

                {/* Main Content */}
                <div className="flex flex-col items-center gap-6 mt-8">
                  <div className="relative group">
                    <img src={selectedBeat.coverArtUrl || 'https://via.placeholder.com/400'} alt="Art" className="w-40 h-40 md:w-56 md:h-56 rounded-xl shadow-2xl object-cover ring-2 ring-white/10" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center cursor-pointer">
                      <Play className="text-white w-12 h-12" />
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-2xl md:text-3xl font-black text-white drop-shadow-md">{selectedBeat.title}</h3>
                    <p className="text-neutral-300 font-medium text-lg drop-shadow">Prod. {selectedBeat.producer || 'NightRunna'}</p>
                  </div>

                  {/* Real Audio Waveform Representation */}
                  <div className="w-full max-w-[90%] h-16 flex items-center justify-center gap-0.5 opacity-90 overflow-hidden">
                    {selectedBeat.waveformData && selectedBeat.waveformData.length > 0 ? (
                      // Display a simplified view of the actual precomputed waveform data
                      selectedBeat.waveformData.filter((_, i) => i % Math.ceil(selectedBeat.waveformData!.length / 60) === 0).map((peak, i) => (
                        <div 
                          key={i} 
                          className="w-1 bg-white rounded-full" 
                          style={{ height: `${Math.max(4, (peak + 1) * 50)}%` }}
                        ></div>
                      ))
                    ) : (
                      // Fallback waiting for real audio extraction
                      <div className="text-[10px] text-neutral-400 font-mono flex items-center gap-2">
                        <RefreshCw size={12} className="animate-spin" /> LOAD AUDIO WAVEFORM DATA
                      </div>
                    )}
                  </div>
                </div>

                {/* Badge - Bottom */}
                {showBadge && badgePosition === 'bottom' && (
                  <div className="absolute bottom-24 left-0 right-0 flex justify-center z-20">
                    <span className={getBadgeClasses()} style={{ opacity: badgeOpacity / 100 }}>
                      {badgeText}
                    </span>
                  </div>
                )}

                {/* Call To Action URL */}
                {beatUrl && (
                  <div className="absolute bottom-6 left-0 right-0 flex justify-center px-4">
                    <div className="bg-black/60 backdrop-blur-md border border-white/20 text-white py-3 px-6 rounded-xl font-bold w-full max-w-sm flex items-center justify-center gap-2 shadow-xl truncate">
                      <LinkIcon size={16} /> LISTEN / BUY BEAT
                    </div>
                  </div>
                )}

              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
