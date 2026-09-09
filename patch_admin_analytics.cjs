const fs = require('fs');
let content = fs.readFileSync('src/pages/Admin.tsx', 'utf8');

if (!content.includes('import { AnalyticsDashboard }')) {
  content = content.replace(
    "import { VideoAdMaker } from '../components/admin/VideoAdMaker';",
    "import { VideoAdMaker } from '../components/admin/VideoAdMaker';\nimport { AnalyticsDashboard } from '../components/admin/AnalyticsDashboard';"
  );
}

const targetStart = "      ) : activeTab === 'salesAnalytics' ? (";
const targetEnd = "        </div>\n      ) : activeTab === 'vaults' ? (";
// wait, the snippet above didn't show what's after engagementAnalytics.
