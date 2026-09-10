import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './firebase';

export interface GmailProfile {
  emailAddress: string;
  messagesTotal: number;
  threadsTotal: number;
  historyId: string;
}

export interface GmailMessageHeader {
  name: string;
  value: string;
}

export interface GmailMessageSummary {
  id: string;
  threadId: string;
  snippet: string;
  subject?: string;
  from?: string;
  to?: string;
  date?: string;
  internalDate?: string;
}

const GMAIL_SCOPES = [
  'https://mail.google.com/',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.compose',
  'https://www.googleapis.com/auth/gmail.modify'
];

let cachedAccessToken: string | null = null;
let isSigningIn = false;

export const initGmailAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const connectGmailAccount = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const provider = new GoogleAuthProvider();
    GMAIL_SCOPES.forEach(scope => provider.addScope(scope));
    provider.setCustomParameters({
      prompt: 'select_account consent'
    });

    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to retrieve Gmail access token from Google authentication.');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Gmail OAuth connection error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getCachedGmailToken = (): string | null => {
  return cachedAccessToken;
};

export const disconnectGmailAccount = async () => {
  if (cachedAccessToken) {
    try {
      await fetch(`https://oauth2.googleapis.com/revoke?token=${cachedAccessToken}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
    } catch (err) {
      console.warn('Revoke token warning:', err);
    }
  }
  cachedAccessToken = null;
  try {
    if (auth.currentUser) {
      await auth.signOut();
    }
  } catch (err) {
    console.warn('Firebase signout warning:', err);
  }
};

export const fetchGmailProfile = async (accessToken: string): Promise<GmailProfile> => {
  const res = await fetch('https://gmail.googleapis.com/v1/users/me/profile', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json'
    }
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Failed to fetch Gmail profile (${res.status})`);
  }
  return await res.json();
};

export function base64UrlEncode(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export const sendGmailMessage = async (
  accessToken: string,
  { to, subject, html, text, from }: { to: string; subject: string; html?: string; text?: string; from?: string }
): Promise<{ id: string; threadId: string; labelIds: string[] }> => {
  const boundary = "==_MIME_BOUNDARY_" + Date.now().toString(16);
  
  const mimeParts = [
    `To: ${to}`,
    from ? `From: ${from}` : '',
    `Subject: =?utf-8?B?${base64UrlEncode(subject)}?=`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    'Content-Transfer-Encoding: 8bit',
    '',
    text || (html ? html.replace(/<[^>]*>?/gm, '') : ''),
    '',
    `--${boundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    'Content-Transfer-Encoding: 8bit',
    '',
    html || text || '',
    '',
    `--${boundary}--`
  ].filter(line => line !== null && line !== undefined).join('\r\n');

  const raw = base64UrlEncode(mimeParts);

  const res = await fetch('https://gmail.googleapis.com/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ raw })
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Failed to send email via Gmail API (${res.status})`);
  }

  return await res.json();
};

export const fetchGmailRecentMessages = async (
  accessToken: string,
  q: string = 'label:SENT',
  maxResults: number = 8
): Promise<GmailMessageSummary[]> => {
  const listRes = await fetch(`https://gmail.googleapis.com/v1/users/me/messages?q=${encodeURIComponent(q)}&maxResults=${maxResults}`, {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });
  
  if (!listRes.ok) {
    const errorData = await listRes.json().catch(() => ({}));
    throw new Error(errorData.error?.message || 'Failed to list Gmail messages');
  }

  const listData = await listRes.json();
  if (!listData.messages || listData.messages.length === 0) {
    return [];
  }

  const messages: GmailMessageSummary[] = await Promise.all(
    listData.messages.map(async (msg: { id: string; threadId: string }) => {
      try {
        const detailRes = await fetch(`https://gmail.googleapis.com/v1/users/me/messages/${msg.id}?format=full`, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        if (!detailRes.ok) return { id: msg.id, threadId: msg.threadId, snippet: '' };
        const detail = await detailRes.json();
        
        const headers: GmailMessageHeader[] = detail.payload?.headers || [];
        const getHeader = (name: string) => headers.find(h => h.name.toLowerCase() === name.toLowerCase())?.value;

        return {
          id: msg.id,
          threadId: msg.threadId,
          snippet: detail.snippet || '',
          subject: getHeader('Subject') || '(No Subject)',
          from: getHeader('From') || '',
          to: getHeader('To') || '',
          date: getHeader('Date') || '',
          internalDate: detail.internalDate
        };
      } catch {
        return { id: msg.id, threadId: msg.threadId, snippet: '' };
      }
    })
  );

  return messages;
};
