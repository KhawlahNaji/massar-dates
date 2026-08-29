�const fs = require('fs');
const path = require('path');

function isMojibake(str) {
    // We look for common mojibake patterns
    return str.includes('ا') || str.includes('ر') || str.includes('�x') || str.includes('�');
}

function fixFile(filePath) {
    if (!fs.existsSync(filePath)) return;
    let raw = fs.readFileSync(filePath, 'utf8');
    if (!isMojibake(raw)) return;
    try {
        let fixed = Buffer.from(raw, 'latin1').toString('utf8');
        if (!isMojibake(fixed)) {
            fs.writeFileSync(filePath, fixed, 'utf8');
            console.log('Fixed:', path.basename(filePath));
        }
    } catch (e) {
        // Do nothing
    }
}

function walk(dir) {
    const files = fs.readdirSync(dir);
    for (const f of files) {
        if (!['node_modules', '.git', 'uploads'].includes(f)) {
            const full = path.join(dir, f);
            if (fs.statSync(full).isDirectory()) {
                walk(full);
            } else if (/\.(js|html|json)$/i.test(f)) {
                fixFile(full);
            }
        }
    }
}

walk(process.cwd());
console.log('DONE - All mojibake files have been fixed!');