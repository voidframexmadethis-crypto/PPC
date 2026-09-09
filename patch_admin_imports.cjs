const fs = require('fs');
let content = fs.readFileSync('src/pages/Admin.tsx', 'utf8');

const importStr = `import { PushAlertsModule, ISRCModule, YouTubeManagerModule, PublishingModule, VaultsModule } from '../components/admin/RestoredAdminModules';`;
const addStr = `import { VideoAdMaker } from '../components/admin/VideoAdMaker';\nimport { SubscriptionsModule } from '../components/admin/SubscriptionsModule';`;

if(content.includes(importStr) && !content.includes('VideoAdMaker')) {
  content = content.replace(importStr, importStr + '\n' + addStr);
  fs.writeFileSync('src/pages/Admin.tsx', content);
  console.log("Imports patched successfully");
} else {
  console.log("Could not find import string or already patched.");
}
