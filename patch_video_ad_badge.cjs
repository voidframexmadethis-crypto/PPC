const fs = require('fs');
let content = fs.readFileSync('src/components/admin/VideoAdMaker.tsx', 'utf8');

const stateStr = `  const [badgePosition, setBadgePosition] = useState<'top' | 'bottom'>('top');`;
const newStateStr = `  const [badgePosition, setBadgePosition] = useState<'top' | 'bottom'>('top');
  const [badgeSize, setBadgeSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [badgeOpacity, setBadgeOpacity] = useState<number>(100);
  const [badgeStyle, setBadgeStyle] = useState<'solid' | 'outline' | 'glass'>('solid');`;

content = content.replace(stateStr, newStateStr);

const configStr = `                {showBadge && (
                  <div className="flex gap-2">
                    <input type="text" value={badgeText} onChange={(e) => setBadgeText(e.target.value)} className="flex-1 bg-neutral-900 border border-neutral-700 rounded-lg p-2 text-sm text-white" />
                    <select value={badgePosition} onChange={(e) => setBadgePosition(e.target.value as any)} className="bg-neutral-900 border border-neutral-700 rounded-lg p-2 text-sm text-white">
                      <option value="top">Top</option>
                      <option value="bottom">Bottom</option>
                    </select>
                  </div>
                )}`;

const newConfigStr = `                {showBadge && (
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
                )}`;

content = content.replace(configStr, newConfigStr);

const helperStr = `  const getFormatClasses = () => {`;
const newHelperStr = `  const getBadgeClasses = () => {
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

  const getFormatClasses = () => {`;

content = content.replace(helperStr, newHelperStr);

const renderBadgeTop = `{showBadge && badgePosition === 'top' && (
                  <div className="absolute top-6 left-0 right-0 flex justify-center">
                    <span className="bg-red-600 text-white text-xs md:text-sm font-black uppercase tracking-widest px-4 py-1.5 rounded shadow-lg">
                      {badgeText}
                    </span>
                  </div>
                )}`;

const newRenderBadgeTop = `{showBadge && badgePosition === 'top' && (
                  <div className="absolute top-6 left-0 right-0 flex justify-center z-20">
                    <span className={getBadgeClasses()} style={{ opacity: badgeOpacity / 100 }}>
                      {badgeText}
                    </span>
                  </div>
                )}`;

const renderBadgeBottom = `{showBadge && badgePosition === 'bottom' && (
                  <div className="absolute bottom-24 left-0 right-0 flex justify-center">
                    <span className="bg-red-600 text-white text-xs md:text-sm font-black uppercase tracking-widest px-4 py-1.5 rounded shadow-lg">
                      {badgeText}
                    </span>
                  </div>
                )}`;

const newRenderBadgeBottom = `{showBadge && badgePosition === 'bottom' && (
                  <div className="absolute bottom-24 left-0 right-0 flex justify-center z-20">
                    <span className={getBadgeClasses()} style={{ opacity: badgeOpacity / 100 }}>
                      {badgeText}
                    </span>
                  </div>
                )}`;

content = content.replace(renderBadgeTop, newRenderBadgeTop).replace(renderBadgeBottom, newRenderBadgeBottom);

fs.writeFileSync('src/components/admin/VideoAdMaker.tsx', content);
console.log("Badge properties patched successfully");
