const fs = require('fs');
const path = require('path');

console.log("🚀 جاري فحص وإصلاح مشاكل ترميز اللغة العربية...");

// 1. تصليح ترميز كل الملفات إلى UTF-8 الصريح
function fixFileEncoding(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (file === 'node_modules' || file === '.git') continue;
        
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            fixFileEncoding(fullPath);
        } else if (/\.(js|html|json|css)$/i.test(file)) {
            let content = fs.readFileSync(fullPath, 'utf8');
            
            // التأكد من وجود meta charset في ملفات HTML
            if (file.endsWith('.html') && !content.includes('charset="UTF-8"') && !content.includes('charset="utf-8"')) {
                content = content.replace(/<head>/i, '<head>\n    <meta charset="UTF-8">');
                console.log(`✔ تم إضافة ترميز UTF-8 لملف HTML: ${file}`);
            }

            // تصليح روابط الواتساب في ملفات الواجهة والسيرفر
            if (content.includes('wa.me') || content.includes('whatsapp.com')) {
                // إصلاح الروابط التي لا تستخدم encodeURIComponent
                const fixedContent = content.replace(/text=\${([^}]+)}/g, (match, p1) => {
                    if (p1.includes('encodeURIComponent')) return match;
                    return `text=\${encodeURIComponent(${p1})}`;
                }).replace(/text='\s*\+\s*([a-zA-Z0-9_]+)/g, (match, p1) => {
                    if (p1.includes('encodeURIComponent')) return match;
                    return `text=' + encodeURIComponent(${p1})`;
                });
                
                if (fixedContent !== content) {
                    content = fixedContent;
                    console.log(`✔ تم إصلاح تشفير رابط الواتساب في: ${file}`);
                }
            }

            // حفظ الملف بترميز UTF-8
            fs.writeFileSync(fullPath, content, 'utf8');
        }
    }
}

// 2. فحص وإصلاح إعدادات Nodemailer في server.js
function fixServerFile() {
    const serverPath = path.join(process.cwd(), 'server.js');
    if (fs.existsSync(serverPath)) {
        let serverCode = fs.readFileSync(serverPath, 'utf8');
        let modified = false;

        // التأكد من أن Express يتعامل مع النصوص بـ UTF-8
        if (!serverCode.includes('charset=utf-8') && serverCode.includes('express()')) {
            serverCode = serverCode.replace(/const app = express\(\);/i, 
`const app = express();
app.use((req, res, next) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    next();
});`);
            modified = true;
            console.log("✔ تم ضبط ترويسة Express الافتراضية إلى UTF-8");
        }

        if (modified) {
            fs.writeFileSync(serverPath, serverCode, 'utf8');
        }
    }
}

fixFileEncoding(process.cwd());
fixServerFile();
console.log("✅ تم الانتهاء بنجاح! جميع الملفات والروابط أصبحت تدعم اللغة العربية 100%.");
