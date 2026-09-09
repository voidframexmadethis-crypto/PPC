const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const targetStr = `  if (!getApps().length) {
    initializeApp();
  }`;

const replacementStr = `  if (!getApps().length) {
    const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(configPath)) {
       const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
       initializeApp({ projectId: config.projectId });
    } else {
       initializeApp();
    }
  }`;

content = content.replace(targetStr, replacementStr);
fs.writeFileSync('server.ts', content);
console.log("InitializeApp patched successfully");
