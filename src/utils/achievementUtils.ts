import { Beat, Achievement } from '../types';

export interface MilestoneDef {
  milestone: number;
  label: string;
  code: string;
  tierName: string;
  badgeColor: string;
  primaryColor: string;
  accentColor: string;
  frameStyle: 'silver' | 'gold' | 'platinum' | 'diamond' | 'million';
}

export const MILESTONES: MilestoneDef[] = [
  {
    milestone: 100,
    label: '100 PLAYS',
    code: '100',
    tierName: 'Bronze Record',
    badgeColor: '#cd7f32',
    primaryColor: '#8a5323',
    accentColor: '#e0a368',
    frameStyle: 'silver',
  },
  {
    milestone: 500,
    label: '500 PLAYS',
    code: '500',
    tierName: 'Silver Record',
    badgeColor: '#c0c0c0',
    primaryColor: '#7a8288',
    accentColor: '#e1e5e8',
    frameStyle: 'silver',
  },
  {
    milestone: 1000,
    label: '1,000 PLAYS',
    code: '1K',
    tierName: 'Gold Record',
    badgeColor: '#ffd700',
    primaryColor: '#b8860b',
    accentColor: '#ffe875',
    frameStyle: 'gold',
  },
  {
    milestone: 5000,
    label: '5,000 PLAYS',
    code: '5K',
    tierName: 'Gold Multi-Plat',
    badgeColor: '#e5c158',
    primaryColor: '#a87e1a',
    accentColor: '#fff0a3',
    frameStyle: 'gold',
  },
  {
    milestone: 10000,
    label: '10,000 PLAYS',
    code: '10K',
    tierName: 'Platinum Record',
    badgeColor: '#e5e4e2',
    primaryColor: '#8f9ba6',
    accentColor: '#ffffff',
    frameStyle: 'platinum',
  },
  {
    milestone: 25000,
    label: '25,000 PLAYS',
    code: '25K',
    tierName: 'Multi-Platinum',
    badgeColor: '#d1d5db',
    primaryColor: '#6b7280',
    accentColor: '#f3f4f6',
    frameStyle: 'platinum',
  },
  {
    milestone: 50000,
    label: '50,000 PLAYS',
    code: '50K',
    tierName: 'Diamond Certified',
    badgeColor: '#b9f2ff',
    primaryColor: '#38bdf8',
    accentColor: '#e0f2fe',
    frameStyle: 'diamond',
  },
  {
    milestone: 100000,
    label: '100,000 PLAYS',
    code: '100K',
    tierName: 'Multi-Diamond',
    badgeColor: '#38bdf8',
    primaryColor: '#0284c7',
    accentColor: '#bae6fd',
    frameStyle: 'diamond',
  },
  {
    milestone: 250000,
    label: '250,000 PLAYS',
    code: '250K',
    tierName: 'Quarter-Million Master',
    badgeColor: '#a855f7',
    primaryColor: '#7e22ce',
    accentColor: '#f3e8ff',
    frameStyle: 'diamond',
  },
  {
    milestone: 500000,
    label: '500,000 PLAYS',
    code: '500K',
    tierName: 'Half-Million Master',
    badgeColor: '#ec4899',
    primaryColor: '#be185d',
    accentColor: '#fce7f3',
    frameStyle: 'diamond',
  },
  {
    milestone: 1000000,
    label: '1 MILLION PLAYS',
    code: '1M',
    tierName: '1 Million Platinum Diamond Record',
    badgeColor: '#f59e0b',
    primaryColor: '#d97706',
    accentColor: '#fef3c7',
    frameStyle: 'million',
  },
];

// Simple deterministic hash generator for clean permanent Plaque IDs
export function generatePlaqueId(beatId: string, milestone: number): string {
  const mDef = MILESTONES.find(m => m.milestone === milestone);
  const code = mDef ? mDef.code : `${milestone}`;
  
  let hash = 0;
  const str = `${beatId}_${milestone}_nightrunna_record_award`;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  const cleanHash = Math.abs(hash).toString(16).padStart(8, '0').toUpperCase().substring(0, 8);
  return `NR-${code}-${cleanHash}`;
}

export function getBeatAchievementsProgress(beat: Beat) {
  const plays = beat.plays || 0;
  const earned = MILESTONES.filter(m => plays >= m.milestone);
  const next = MILESTONES.find(m => plays < m.milestone);
  
  let progressPercent = 100;
  if (next) {
    const previousTarget = earned.length > 0 ? earned[earned.length - 1].milestone : 0;
    const range = next.milestone - previousTarget;
    const currentInRange = Math.max(0, plays - previousTarget);
    progressPercent = Math.min(100, Math.max(0, (currentInRange / range) * 100));
  }

  return {
    plays,
    earned,
    next,
    progressPercent: Number(progressPercent.toFixed(1)),
    isMaxMilestone: !next && earned.length === MILESTONES.length,
  };
}

// Generate high-resolution PNG plaque award image
export async function generatePlaqueImage(achievement: Achievement): Promise<string> {
  const width = 1200;
  const height = 1600;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error("Canvas context creation failed");

  const mDef = MILESTONES.find(m => m.milestone === achievement.milestone) || MILESTONES[0];
  const isMillion = achievement.milestone >= 1000000;

  // 1. Frame Outer Shadow & Base
  ctx.fillStyle = '#0a0a0c';
  ctx.fillRect(0, 0, width, height);

  // Outer Frame Outer Edge (Dark Walnut or Burnished Steel)
  const outerBorderWidth = 60;
  const frameGrad = ctx.createLinearGradient(0, 0, width, height);
  if (isMillion) {
    frameGrad.addColorStop(0, '#1e1b18');
    frameGrad.addColorStop(0.3, '#d4af37');
    frameGrad.addColorStop(0.5, '#2a241e');
    frameGrad.addColorStop(0.7, '#fef08a');
    frameGrad.addColorStop(1, '#0f0e0c');
  } else if (mDef.frameStyle === 'gold') {
    frameGrad.addColorStop(0, '#3a2d0b');
    frameGrad.addColorStop(0.5, '#b8860b');
    frameGrad.addColorStop(1, '#1a1303');
  } else if (mDef.frameStyle === 'platinum' || mDef.frameStyle === 'diamond') {
    frameGrad.addColorStop(0, '#2d3748');
    frameGrad.addColorStop(0.5, '#cbd5e1');
    frameGrad.addColorStop(1, '#0f172a');
  } else {
    frameGrad.addColorStop(0, '#1c1917');
    frameGrad.addColorStop(0.5, '#57534e');
    frameGrad.addColorStop(1, '#0c0a09');
  }

  ctx.fillStyle = frameGrad;
  ctx.fillRect(0, 0, width, height);

  // Inner Bevel Matted Area
  const innerMargin = outerBorderWidth;
  const innerW = width - innerMargin * 2;
  const innerH = height - innerMargin * 2;

  // Matted Felt Background (Dark Charcoal Texture)
  const feltGrad = ctx.createRadialGradient(width / 2, height / 2, 100, width / 2, height / 2, width);
  feltGrad.addColorStop(0, '#18181b');
  feltGrad.addColorStop(1, '#09090b');
  ctx.fillStyle = feltGrad;
  ctx.fillRect(innerMargin, innerMargin, innerW, innerH);

  // Inner Gold/Silver Frame Bevel Line
  ctx.strokeStyle = isMillion ? '#fef08a' : mDef.badgeColor;
  ctx.lineWidth = 6;
  ctx.strokeRect(innerMargin + 10, innerMargin + 10, innerW - 20, innerH - 20);

  // 2. Vinyl Record Mounting (Top Half)
  const recordCenterX = width / 2;
  const recordCenterY = 560;
  const recordRadius = 380;

  // Record Outer Metallic Rim Shadow
  ctx.beginPath();
  ctx.arc(recordCenterX, recordCenterY, recordRadius + 8, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.fill();

  // Vinyl Body (Deep Black / Grooves)
  const recordGrad = ctx.createRadialGradient(recordCenterX, recordCenterY, 50, recordCenterX, recordCenterY, recordRadius);
  recordGrad.addColorStop(0, '#111111');
  recordGrad.addColorStop(0.85, '#050505');
  recordGrad.addColorStop(1, '#1f1f1f');
  ctx.beginPath();
  ctx.arc(recordCenterX, recordCenterY, recordRadius, 0, Math.PI * 2);
  ctx.fillStyle = recordGrad;
  ctx.fill();

  // Vinyl Grooves Circles
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.lineWidth = 1.5;
  for (let r = 160; r < recordRadius - 10; r += 12) {
    ctx.beginPath();
    ctx.arc(recordCenterX, recordCenterY, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Vinyl Shine Reflection Cones
  ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
  ctx.beginPath();
  ctx.moveTo(recordCenterX, recordCenterY);
  ctx.arc(recordCenterX, recordCenterY, recordRadius, -Math.PI / 4, Math.PI / 6);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(recordCenterX, recordCenterY);
  ctx.arc(recordCenterX, recordCenterY, recordRadius, Math.PI * 0.75, Math.PI * 1.15);
  ctx.fill();

  // 3. Center Vinyl Label with Artwork
  const labelRadius = 140;

  // Load Cover Artwork
  if (achievement.coverArtUrl) {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = achievement.coverArtUrl;
      await new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve; // Continue if image fails
      });
      if (img.complete && img.naturalWidth !== 0) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(recordCenterX, recordCenterY, labelRadius, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(img, recordCenterX - labelRadius, recordCenterY - labelRadius, labelRadius * 2, labelRadius * 2);
        ctx.restore();
      }
    } catch (e) {
      // Fallback label if image CORS prevents drawing
    }
  }

  // Label Ring Border
  ctx.strokeStyle = mDef.badgeColor;
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.arc(recordCenterX, recordCenterY, labelRadius, 0, Math.PI * 2);
  ctx.stroke();

  // Center Record Hole
  ctx.beginPath();
  ctx.arc(recordCenterX, recordCenterY, 20, 0, Math.PI * 2);
  ctx.fillStyle = '#09090b';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.lineWidth = 2;
  ctx.stroke();

  // 4. Metallic Engraved Plaque Plate (Bottom Half)
  const plateX = 140;
  const plateY = 1040;
  const plateW = width - plateX * 2;
  const plateH = 460;

  // Plate Base (Brass / Stainless Steel / Gold)
  const plateGrad = ctx.createLinearGradient(plateX, plateY, plateX + plateW, plateY + plateH);
  if (isMillion) {
    plateGrad.addColorStop(0, '#fef08a');
    plateGrad.addColorStop(0.3, '#d4af37');
    plateGrad.addColorStop(0.7, '#fef9c3');
    plateGrad.addColorStop(1, '#b45309');
  } else if (mDef.frameStyle === 'gold') {
    plateGrad.addColorStop(0, '#fef08a');
    plateGrad.addColorStop(0.5, '#ca8a04');
    plateGrad.addColorStop(1, '#854d0e');
  } else if (mDef.frameStyle === 'platinum' || mDef.frameStyle === 'diamond') {
    plateGrad.addColorStop(0, '#ffffff');
    plateGrad.addColorStop(0.5, '#cbd5e1');
    plateGrad.addColorStop(1, '#64748b');
  } else {
    plateGrad.addColorStop(0, '#f5f5f4');
    plateGrad.addColorStop(0.5, '#a8a29e');
    plateGrad.addColorStop(1, '#57534e');
  }

  ctx.fillStyle = plateGrad;
  ctx.fillRect(plateX, plateY, plateW, plateH);

  // Plate Inner Border
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 3;
  ctx.strokeRect(plateX + 12, plateY + 12, plateW - 24, plateH - 24);

  // Plate Screws/Rivet Details in corners
  const screwOffset = 24;
  const screws = [
    [plateX + screwOffset, plateY + screwOffset],
    [plateX + plateW - screwOffset, plateY + screwOffset],
    [plateX + screwOffset, plateY + plateH - screwOffset],
    [plateX + plateW - screwOffset, plateY + plateH - screwOffset],
  ];
  screws.forEach(([sx, sy]) => {
    ctx.beginPath();
    ctx.arc(sx, sy, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#262626';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 1;
    ctx.stroke();
  });

  // Plate Typography (Engraved Dark Text)
  ctx.fillStyle = '#0f172a';
  ctx.textAlign = 'center';

  // NightRunna Header
  ctx.font = '900 32px sans-serif';
  ctx.fillText('NIGHTRUNNA', recordCenterX, plateY + 65);

  ctx.font = '700 18px sans-serif';
  ctx.fillText('PRESENTED FOR DIGITAL RECORD ACHIEVEMENT', recordCenterX, plateY + 98);

  // Divider Line
  ctx.strokeStyle = 'rgba(15, 23, 42, 0.4)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(plateX + 80, plateY + 115);
  ctx.lineTo(plateX + plateW - 80, plateY + 115);
  ctx.stroke();

  // Milestone Label (e.g., "100 PLAYS" or "1 MILLION PLAYS")
  ctx.font = '900 48px sans-serif';
  ctx.fillStyle = isMillion ? '#854d0e' : '#020617';
  ctx.fillText(achievement.milestoneLabel, recordCenterX, plateY + 175);

  // Beat Title
  ctx.font = 'bold 36px sans-serif';
  ctx.fillStyle = '#0f172a';
  ctx.fillText(`"${achievement.beatTitle}"`, recordCenterX, plateY + 235);

  // Producer
  ctx.font = '600 22px sans-serif';
  ctx.fillStyle = '#334155';
  ctx.fillText(`PRODUCED BY: ${achievement.producer || 'NIGHTRUNNA'}`, recordCenterX, plateY + 275);

  // Earned Date
  ctx.font = '500 18px sans-serif';
  ctx.fillStyle = '#475569';
  const earnedText = achievement.earnedDate 
    ? `EARNED: ${new Date(achievement.earnedDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase()}`
    : 'OFFICIALLY RECORDED';
  ctx.fillText(earnedText, recordCenterX, plateY + 325);

  // Verification & Plaque ID
  ctx.font = 'bold 16px monospace';
  ctx.fillStyle = '#0f172a';
  ctx.fillText(`PLAQUE ID: ${achievement.plaqueId}  |  VERIFIED NIGHTRUNNA ACHIEVEMENT`, recordCenterX, plateY + 380);

  return canvas.toDataURL('image/png');
}

export function downloadPlaqueAsPNG(achievement: Achievement) {
  generatePlaqueImage(achievement).then(dataUrl => {
    const link = document.createElement('a');
    const safeTitle = (achievement.beatTitle || 'Beat').replace(/[^a-zA-Z0-9_\-]/g, '-');
    const safeMilestone = (achievement.milestoneLabel || 'Milestone').replace(/[^a-zA-Z0-9_\-]/g, '-');
    link.download = `NightRunna_${safeMilestone}_${safeTitle}.png`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }).catch(err => {
    console.error("Failed to generate digital plaque image:", err);
  });
}
