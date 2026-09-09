const fs = require('fs');
let content = fs.readFileSync('src/pages/Admin.tsx', 'utf8');

const targetRegex = /\) : activeTab === 'videoAds' \|\| activeTab === 'subscriptions' \|\| activeTab === 'iaUploadCenter' \? \([\s\S]*?<\/div>/;

const replacementStr = `) : activeTab === 'videoAds' ? (
        <VideoAdMaker />
      ) : activeTab === 'subscriptions' ? (
        <SubscriptionsModule />
      ) : activeTab === 'iaUploadCenter' ? (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-12 text-center shadow-xl animate-in fade-in duration-300">
          <Lock className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Module Initialized</h2>
          <p className="text-neutral-400 max-w-md mx-auto">
            Dependencies restored. Awaiting further instruction to mount interface blocks. 
          </p>
        </div>`;

if(targetRegex.test(content)) {
  content = content.replace(targetRegex, replacementStr);
  fs.writeFileSync('src/pages/Admin.tsx', content);
  console.log("Render blocks patched successfully");
} else {
  console.log("Could not find render blocks using regex.");
}
