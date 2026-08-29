const fs = require('fs');
const path = require('path');

const replacements = [
    // الإيموجي المشوهة
    [/\u00F0\u0178\u201C\u00A9/g, '\uD83D\uDCE9'], // 📩
    [/\u00F0\u0178\u201C\u00A7/g, '\uD83D\uDCE7'], // 📧
    [/\u00F0\u0178\u2019\u00AC/g, '\uD83D\uDCAC'], // 💬
    [/\u00F0\u0178\u201C\u00B1/g, '\uD83D\uDCF1'], // 📱
    [/\u00F0\u0178\u201C\u00A6/g, '\uD83D\uDCE6'], // 📦
    [/\u00F0\u0178\u201C\u00B4/g, '\uD83C\uDF34'], // 🌴
    [/\u00F0\u0178\u201C\u00B3/g, '\uD83D\uDCDD'], // 📝
    // الكلمات المشوهة
    [/\u00D8\u00A7\u00D9\u201E\u00A8\u00D9\u2020\u201A\u00D8\u00AF/g, '\u0627\u0644\u0628\u0631\u064A\u062F'], // البريد
    [/\u00D8\u00A7\u00D9\u2020\u00D8\u00B1\u00D8\u00B3\u00D8\u00A7\u00D9\u201E\u00A9/g, '\u0627\u0644\u0631\u0633\u0627\u0644\u0629'], // الرسالة
    [/\u00D8\u00B1\u00D8\u00B3\u00D8\u00A7\u00D9\u201E\u00A9\u00A0\u00D9\u00A8\u00D9\u2020\u00D8\u00A7\u00D9\u201E\u00A9/g, '\u0631\u0633\u0627\u0644\u0629 \u0645\u0646'], // رسالة من
    [/\u00D8\u00A7\u00D9\u2020\u00D8\u00A7\u00D8\u00B3\u00D9\u2020\u00A9/g, '\u0627\u0644\u0627\u0633\u0645'], // الاسم
    [/\u00D8\u00A7\u00D9\u2020\u00D8\u00A7\u00D9\u2020\u00D8\u00A7\u00D8\u00A8\u00D8\u00B3\u00D9\u2020\u00A9/g, '\u0627\u0644\u0627\u0628\u0633'], // الابس؟
    // تصحيح mailto و encodeURIComponent
    [/\$\{subject\}/g, '${encodeURIComponent(subject)}'],
    [/\$\{body\}/g, '${encodeURIComponent(body)}']
];

function fixFile(filePath) {
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    for (let [bad, good] of replacements) {
        content = content.replace(bad, good);
    }
    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Fixed:', path.basename(filePath));
    }
}

function walk(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        if (['node_modules', '.git', 'uploads'].includes(file)) continue;
        const full = path.join(dir, file);
        if (fs.statSync(full).isDirectory()) {
            walk(full);
        } else if (/\.(js|html|json)$/i.test(file)) {
            fixFile(full);
        }
    }
}

walk(process.cwd());
console.log('Encoding cleanup completed successfully!');
