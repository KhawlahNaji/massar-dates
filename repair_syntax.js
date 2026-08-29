const fs = require('fs');
const path = require('path');
const serverFile = path.join(process.cwd(), 'server.js');
let content = fs.readFileSync(serverFile, 'utf8');

// استبدال النمط المكسور mailto: 'email' إلى mailto:' + email + '
content = content.replace(/mailto:\s*'khwlah7712@gmail\.com'/g, "mailto:' + email + '");

// أيضًا معالجة أي حالة يكون فيها الإيميل داخل علامات اقتباس مفردة ومتبوعة بعلامة اقتباس نهاية
content = content.replace(/mailto:\s*'([^']*)'"/g, "mailto:' + email + '\"");

fs.writeFileSync(serverFile, content, 'utf8');
console.log('✅ تم إصلاح الصياغة بنجاح!');
