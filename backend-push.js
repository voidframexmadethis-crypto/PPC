const fs = require('fs');
const webpush = require('web-push');

if (!fs.existsSync('vapid_keys.json')) {
    const keys = webpush.generateVAPIDKeys();
    fs.writeFileSync('vapid_keys.json', JSON.stringify(keys));
}
