import { Beat } from '../types';

/**
 * Validates whether a beat is an AI placeholder or fake beat.
 * Returns true if the beat is an AI/placeholder beat, false if it's a real human beat.
 */
export function isAIPlaceholderBeat(beat: Partial<Beat> | null | undefined): boolean {
  if (!beat) return true;

  const idLower = (beat.id || '').toLowerCase();
  const titleLower = (beat.title || '').toLowerCase();

  if (
    idLower.includes('placeholder') ||
    idLower.includes('ai_') ||
    titleLower.includes('placeholder') ||
    titleLower.includes('ai beat') ||
    titleLower.includes('ai generated') ||
    titleLower.includes('sample beat')
  ) {
    return true;
  }

  return false;
}

/**
 * Filters an array of beats to only retain genuine human-produced beats.
 */
export function filterHumanBeats(beats: Beat[]): Beat[] {
  if (!Array.isArray(beats)) return [];
  return beats.filter((beat) => !isAIPlaceholderBeat(beat));
}

/**
 * Robustly downloads an audio track to the user's local device.
 * Handles blob URLs, same-origin, and cross-origin audio links seamlessly.
 */
export async function downloadAudioFile(fileUrl: string, title: string) {
  if (!fileUrl) return;

  const cleanTitle = (title || 'beat-track').replace(/[/\\?%*:|"<>]/g, '-').trim();
  const hasExt = cleanTitle.toLowerCase().endsWith('.mp3') || cleanTitle.toLowerCase().endsWith('.wav');
  const fileName = hasExt ? cleanTitle : `${cleanTitle}.mp3`;

  try {
    // 1. Direct download for Blob or Data URLs
    if (fileUrl.startsWith('blob:') || fileUrl.startsWith('data:')) {
      const a = document.createElement('a');
      a.href = fileUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }

    // 2. Fetch as blob for remote/local audio files to force browser download prompt
    const res = await fetch(fileUrl, { mode: 'cors' });
    if (res.ok) {
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
      return;
    }
  } catch (err) {
    console.warn('Direct blob download attempt failed, attempting fallback download:', err);
  }

  // 3. Fallback direct anchor click
  const a = document.createElement('a');
  a.href = fileUrl;
  a.download = fileName;
  a.target = '_blank';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

