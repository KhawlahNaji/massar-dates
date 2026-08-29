const fs = require('fs');
const path = require('path');

const targetEmail = 'khwlah7712@gmail.com';
const targetPass = 'YOUR_APP_PASSWORD'; // ضع كلمة مرور التطبيق هنا

function fixMojibake(str) {
    return str
        .replace(/ðŸ“©\s*Ø±Ø³Ø§Ù„Ø©\s*Ù…Ù†/g, '\uD83D\uDCE9 \u0631\u0633\u0627\u0644\u0629 \u0645\u0646')
        .replace(/ðŸ“§\s*البريد/g, '\uD83D\uDCE7 \u0627\u0644\u0628\u0631\u064A\u062F')
        .replace(/ðŸ’¬\s*الØ±Ø³Ø§Ù„Ø©/g, '\uD83D\uDCAC \u0627\u0644\u0631\u0633\u0627\u0644\u0629')
        .replace(/ðŸ“±\s*اÙ„Ù‡Ø§ØªÙ/g, '\uD83D\uDCF1 \u0627\u0644\u0647\u0627\u062A\u0641')
        .replace(/الإلكتروني/g, '\u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A')
        .replace(/البريد/g, '\u0627\u0644\u0628\u0631\u064A\u062F')
        .replace(/Ø±Ø³Ø§Ù„Ø©\s*Ù…Ù†/g, '\u0631Ø³Ø§Ù„Ø© \u0645Ù†')
        .replace(/الØ±Ø³Ø§Ù„Ø©/g, '\u0627\u0644Ø±Ø³Ø§Ù„Ø©')
        .replace(/اÙ„Ù‡Ø§ØªÙ/g, '\u0627Ù„Ù‡Ø§ØªÙ');
}

function processFile(file) {
    if (!fs.existsSync(file)) return;
    let content = fs.readFileSync(file, 'utf8');
    let before = content;

    content = fixMojibake(content);

    // إصلاح mailto url encoding
    content = content.replace(/mailto:\$\{email\}\?subject=\$\{subject\}&body=\$\{body\}/g,
        'mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}');

    // إصلاح روابط الواتساب
    content = content.replace(/(wa\.me|api\.whatsapp\.com)[^\n]*text=[^"'\s]+/g, (match) => {
        return match.replace(/text=([^"'\s]+)/, (_, val) => {
            return 'text=' + (val.includes('encodeURIComponent') ? val : 'encodeURIComponent(' + val + ')');
        });
    });

    if (before !== content) {
        fs.writeFileSync(file, content, 'utf8');
        console.log('Fixed:', path.basename(file));
    }
}

function walk(dir) {
    const files = fs.readdirSync(dir);
    for (const f of files) {
        if (['node_modules', '.git', 'uploads'].includes(f)) continue;
        const full = path.join(dir, f);
        if (fs.statSync(full).isDirectory()) walk(full);
        else if (/\.(js|html|json)$/i.test(f)) processFile(full);
    }
}

// تعديل server.js لإعداد nodemailer و SMTP
const serverFile = path.join(process.cwd(), 'server.js');
if (fs.existsSync(serverFile)) {
    let code = fs.readFileSync(serverFile, 'utf8');
    // استبدال إعدادات SMTP إن وجدت، أو حقنها إذا لم توجد
    if (code.includes('nodemailer.createTransport')) {
        code = code.replace(
            /nodemailer\.createTransport\(\s*\{([\s\S]*?)\}\s*\)/,
            (match, config) => {
                return `nodemailer.createTransport({
                    host: 'smtp.gmail.com',
                    port: 587,
                    secure: false,
                    auth: {
                        user: '${targetEmail}',
                        pass: '${targetPass}'
                    }
                })`;
            }
        );
    } else {
        console.log('Server.js does not contain nodemailer.createTransport, please check manually.');
    }
    // تصحيح عنوان المستقبِل
    code = code.replace(/to:\s*['"][^'"]*['"]/g, `to: '${targetEmail}'`);
    // إصلاح القوالب المشوهة
    code = fixMojibake(code);

    fs.writeFileSync(serverFile, code, 'utf8');
    console.log('Updated server.js mail settings.');
}

walk(process.cwd());
console.log('All encoding and mail settings fixed successfully!');
