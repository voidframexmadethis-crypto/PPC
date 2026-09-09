const fs = require('fs');
let content = fs.readFileSync('src/components/admin/VideoAdMaker.tsx', 'utf8');

const targetStr = `{/* Simulated Waveform */}
                  <div className="w-full max-w-[80%] h-16 flex items-end justify-center gap-1 opacity-80">
                    {Array.from({ length: 40 }).map((_, i) => (
                      <div 
                        key={i} 
                        className="w-1.5 bg-indigo-500 rounded-t-full" 
                        style={{ height: \`\${Math.max(10, Math.sin(i * 0.5) * 40 + Math.random() * 20 + 20)}%\` }}
                      ></div>
                    ))}
                  </div>`;

const replacementStr = `{/* Real Audio Waveform Representation */}
                  <div className="w-full max-w-[90%] h-16 flex items-center justify-center gap-0.5 opacity-90 overflow-hidden">
                    {selectedBeat.waveformData && selectedBeat.waveformData.length > 0 ? (
                      // Display a simplified view of the actual precomputed waveform data
                      selectedBeat.waveformData.filter((_, i) => i % Math.ceil(selectedBeat.waveformData!.length / 60) === 0).map((peak, i) => (
                        <div 
                          key={i} 
                          className="w-1 bg-white rounded-full" 
                          style={{ height: \`\${Math.max(4, (peak + 1) * 50)}%\` }}
                        ></div>
                      ))
                    ) : (
                      // Fallback waiting for real audio extraction
                      <div className="text-[10px] text-neutral-400 font-mono flex items-center gap-2">
                        <RefreshCw size={12} className="animate-spin" /> LOAD AUDIO WAVEFORM DATA
                      </div>
                    )}
                  </div>`;

if(content.includes(targetStr)) {
  content = content.replace(targetStr, replacementStr);
  fs.writeFileSync('src/components/admin/VideoAdMaker.tsx', content);
  console.log("Patched successfully");
} else {
  console.log("Could not find target string.");
}
