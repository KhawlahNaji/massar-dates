const fs = require('fs');
const path = require('path');

const replacements = [
    // 📩 رسالة من:
    {regex: /ðŸ“©\s*Ø±Ø³Ø§Ù„Ø©\s*Ù…Ù†/g, to: '\uD83D\uDCE9 \u0631\u0633\u0627\u0644\u0629 \u0645\u0646'},
    // 📧 البريد:
    {regex: /ðŸ“§\s*البريد/g, to: '\uD83D\uDCE7 \u0627\u0644\u0628\u0631\u064A\u062F'},
    // 💬 الرسالة:
    {regex: /ðŸ’¬\s*الرسالة/g, to: '\uD83D\uDCAC \u0627\u0644\u0631\u0633\u0627\u0644\u0629'},
    // 📱 الهاتف:
    {regex: /ðŸ“±\s*الهاتف/g, to: '\uD83D\uDCF1 \u0627\u0644\u0647\u0627\u062A\u0641'},
    // 📦 الطلب:
    {regex: /ðŸ“¦\s*Ø§Ù„Ø·Ù„Ø¨/g, to: '\uD83D\uDCE6 \u0627\u0644\u0637\u0644\u0628'},
    // إصلاح كلمات مشوهة:
    {regex: /الإلكتروني/g, to: '\u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A'},
    {regex: /البريد/g, to: '\u0627\u0644\u0628\u0631\u064A\u062F'},
    {regex: /Ø±Ø³Ø§Ù„Ø©\s*Ù…Ù†/g, to: '\u0631\u0633\u0627\u0644\u0629 \u0645\u0646'},
    {regex: /الرسالة/g, to: '\u0627\u0644\u0631\u0633\u0627\u0644\u0629'},
    {regex: /الهاتف/g, to: '\u0627\u0644\u0647\u0627\u062A\u0641'},
    {regex: /الاسم/g, to: '\u0627\u0644\u0627\u0633\u0645'},
    // إصلاح روابط mailto:
    {regex: /mailto:\$\{email\}\?subject=\$\{subject\}&body=\$\{body\}/g, to: 'mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}'}
];

function processFile(filePath) {
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;
    for (let r of replacements) {
        if (r.regex.test(content)) {
            content = content.replace(r.regex, r.to);
            changed = true;
        }
    }
    if (changed) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('FIXED:', path.basename(filePath));
    }
}

function walk(dir) {
    const files = fs.readdirSync(dir);
    for (const f of files) {
        if (['node_modules', '.git', 'uploads'].includes(f)) continue;
        const fullPath = path.join(dir, f);
        if (fs.statSync(fullPath).isDirectory()) {
            walk(fullPath);
        } else if (/\.(js|html|json)$/i.test(f)) {
            processFile(fullPath);
        }
    }
}

walk(process.cwd());
console.log('DONE - All templates fixed.');