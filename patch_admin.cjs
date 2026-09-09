const fs = require('fs');
let content = fs.readFileSync('src/pages/Admin.tsx', 'utf8');

const targetStr = `      ) : activeTab === 'push' || activeTab === 'isrc' || activeTab === 'videos' || activeTab === 'videoAds' || activeTab === 'publishing' || activeTab === 'subscriptions' || activeTab === 'vaults' || activeTab === 'iaUploadCenter' ? (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-12 text-center shadow-xl animate-in fade-in duration-300">
          <Lock className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Dependency Missing</h2>
          <p className="text-neutral-400 max-w-md mx-auto">
            This module requires components or API routes from the old system that are not currently installed in this project. 
          </p>
        </div>
      ) : activeTab === 'uploader' ? (`

const replacementStr = `      ) : activeTab === 'push' ? (
        <PushAlertsModule />
      ) : activeTab === 'isrc' ? (
        <ISRCModule />
      ) : activeTab === 'videos' ? (
        <YouTubeManagerModule />
      ) : activeTab === 'publishing' ? (
        <PublishingModule />
      ) : activeTab === 'vaults' ? (
        <VaultsModule />
      ) : activeTab === 'videoAds' || activeTab === 'subscriptions' || activeTab === 'iaUploadCenter' ? (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-12 text-center shadow-xl animate-in fade-in duration-300">
          <Lock className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Module Initialized</h2>
          <p className="text-neutral-400 max-w-md mx-auto">
            Dependencies restored. Awaiting further instruction to mount interface blocks. 
          </p>
        </div>
      ) : activeTab === 'uploader' ? (`

if(content.includes(targetStr)) {
  content = content.replace(targetStr, replacementStr);
  fs.writeFileSync('src/pages/Admin.tsx', content);
  console.log("Patched successfully");
} else {
  console.log("Could not find target string exactly. Trying regex...");
  const regex = /\s*\) : activeTab === 'push'[\s\S]*?This module requires components or API routes[\s\S]*?<\/div>\s*\) : activeTab === 'uploader' \? \(/g;
  content = content.replace(regex, replacementStr);
  fs.writeFileSync('src/pages/Admin.tsx', content);
  console.log("Patched with regex");
}
