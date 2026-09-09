const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const targetAnalyticsPost = `    try {
      await db.collection('analytics').add({
        eventType,
        trackId: trackId || null,
        visitorId,
        timestamp: FieldValue.serverTimestamp()
      });
      res.json({ success: true });
    } catch (err) {
      console.error("Analytics event error:", err);
      res.status(500).json({ success: false, error: "Internal server error." });
    }`;

const newAnalyticsPost = `    try {
      const analyticsFile = path.join(LOCAL_STORAGE_ROOT, 'analytics.json');
      let events = [];
      if (fs.existsSync(analyticsFile)) {
        events = JSON.parse(fs.readFileSync(analyticsFile, 'utf8'));
      }
      events.push({
        eventType,
        trackId: trackId || null,
        visitorId,
        timestamp: new Date().toISOString()
      });
      fs.writeFileSync(analyticsFile, JSON.stringify(events, null, 2));
      res.json({ success: true });
    } catch (err) {
      console.error("Analytics event error:", err);
      res.status(500).json({ success: false, error: "Internal server error." });
    }`;

const targetAnalyticsGet = `    try {
      const snapshot = await db.collection('analytics').get();
      const events: any[] = [];
      snapshot.forEach(doc => events.push(doc.data()));

      const totalVisits = events.filter(e => e.eventType === 'VISIT').length;`;

const newAnalyticsGet = `    try {
      const analyticsFile = path.join(LOCAL_STORAGE_ROOT, 'analytics.json');
      let events: any[] = [];
      if (fs.existsSync(analyticsFile)) {
        events = JSON.parse(fs.readFileSync(analyticsFile, 'utf8'));
      }

      const totalVisits = events.filter(e => e.eventType === 'VISIT').length;`;

content = content.replace(targetAnalyticsPost, newAnalyticsPost).replace(targetAnalyticsGet, newAnalyticsGet);

// Remove firebase-admin/firestore since it causes ADC permission error on deploy
const dbImportTarget = `const db = getFirestore();`;
content = content.replace(dbImportTarget, `// const db = getFirestore(); // Removed due to lack of service account ADC permissions in environment`);

fs.writeFileSync('server.ts', content);
console.log("Analytics patched successfully");
