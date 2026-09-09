const fs = require('fs');
let content = fs.readFileSync('src/pages/Admin.tsx', 'utf8');

const targetStr = content.substring(
  content.indexOf("      ) : activeTab === 'salesAnalytics' ? ("),
  content.indexOf("      ) : activeTab === 'push' ? (")
);

const newStr = `      ) : (activeTab === 'salesAnalytics' || activeTab === 'engagementAnalytics') ? (
        <AnalyticsDashboard
          state={state}
          realAnalytics={realAnalytics}
          totalEarnings={totalEarnings}
          netEarnings={netEarnings}
          totalPlays={displayPlays}
          totalLikes={totalLikes}
          totalShares={totalShares}
          totalDownloads={totalDownloads}
          subscribers={subscribers}
        />
`;

if (content.includes("      ) : activeTab === 'salesAnalytics' ? (")) {
  content = content.replace(targetStr, newStr);
  
  if (!content.includes('import { AnalyticsDashboard }')) {
    content = content.replace(
      "import { VideoAdMaker } from '../components/admin/VideoAdMaker';",
      "import { VideoAdMaker } from '../components/admin/VideoAdMaker';\nimport { AnalyticsDashboard } from '../components/admin/AnalyticsDashboard';"
    );
  }
  
  fs.writeFileSync('src/pages/Admin.tsx', content);
  console.log("Admin.tsx patched successfully.");
} else {
  console.log("Could not find target string.");
}
