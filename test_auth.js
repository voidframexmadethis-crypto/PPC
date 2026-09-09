import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));
initializeApp({ projectId: firebaseConfig.projectId });
const auth = getAuth();
console.log("Auth initialized successfully");
