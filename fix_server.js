const fs = require('fs');
const path = require('path');
const serverFile = path.join(process.cwd(), 'server.js');
let code = fs.readFileSync(serverFile, 'utf8');

// استبدال الرموز المشوهة بالنصوص العربية الصحيحة باستخدام يونيكود
code = code.replace(/الØ¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ/g, '\u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A'); // الإلكتروني
code = code.replace(/اÙ„Ø¨Ø±ÙŠØ¯/g, '\u0627\u0644\u0628\u0631\u064A\u062F'); // البريد
code = code.replace(/Ø±Ø³Ø§Ù„Ø©\s*Ù…Ù†/g, '\u0631\u0633\u0627\u0644\u0629 \u0645\u0646'); // رسالة من
code = code.replace(/اÙ„Ø±Ø³Ø§Ù„Ø©/g, '\u0627\u0644\u0631\u0633\u0627\u0644\u0629'); // الرسالة
code = code.replace(/اÙ„Ù‡Ø§ØªÙ/g, '\u0627\u0644\u0647\u0627\u062A\u0641'); // الهاتف
code = code.replace(/اÙ„Ø§Ø³Ù…/g, '\u0627\u0644\u0627\u0633\u0645'); // الاسم

// إصلاح رابط mailto ليدعم الترميز الصحيح
code = code.replace(/mailto:\$\{email\}\?subject=\$\{subject\}&body=\$\{body\}/g, 'mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}');

fs.writeFileSync(serverFile, code, 'utf8');
console.log('✅ تم إصلاح server.js بنجاح!');
