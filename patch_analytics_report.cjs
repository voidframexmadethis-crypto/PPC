const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const targetAnalyticsGet = `      res.json({
        totalVisits,
        uniqueVisitors,
        totalDownloads,
        totalShares,
        totalLikes,
        generatedAt: new Date().toISOString()
      });`;

const newAnalyticsGet = `      res.json({
        totalVisits,
        uniqueVisitors,
        totalDownloads,
        totalShares,
        totalLikes,
        events: events, // send raw events for time-series charting
        generatedAt: new Date().toISOString()
      });`;

if(content.includes(targetAnalyticsGet)) {
  content = content.replace(targetAnalyticsGet, newAnalyticsGet);
  fs.writeFileSync('server.ts', content);
  console.log("Analytics API patched to return events.");
} else {
  console.log("Could not find analytics report json response.");
}
