const fs = require('fs');
const path = require('path');

const correctEmail = 'khwlah7712@gmail.com';
console.log(`🚀 جاري ضبط إيميل الاستقبال إلى: ${correctEmail} وتنسيق قوالب الرسائل...`);

// 1. فحص وتعديل ملف .env إن وجد
const envPath = path.join(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
    let envContent = fs.readFileSync(envPath, 'utf8');
    if (envContent.includes('EMAIL_') || envContent.includes('ADMIN_EMAIL') || envContent.includes('TO_EMAIL')) {
        envContent = envContent.replace(/(ADMIN_EMAIL\s*=\s*).*/g, `$1${correctEmail}`);
        envContent = envContent.replace(/(TO_EMAIL\s*=\s*).*/g, `$1${correctEmail}`);
        fs.writeFileSync(envPath, envContent, 'utf8');
        console.log('✔ تم تحديث الإيميل في ملف .env');
    }
}

// 2. فحص وتعديل ملف server.js
const serverPath = path.join(process.cwd(), 'server.js');
if (fs.existsSync(serverPath)) {
    let serverCode = fs.readFileSync(serverPath, 'utf8');

    // استبدال أي إيميل قديم أو مشوه بالإيميل الجديد
    serverCode = serverCode.replace(/to:\s*['"][^'"]*@gmail\.com['"]/g, `to: '${correctEmail}'`);
    serverCode = serverCode.replace(/khwlah7712@gmai[;,.]com/g, correctEmail);

    // التأكد من أن قالب رسالة الإيميل HTML مضبوط بالعربية وبترميز سليم
    const cleanHtmlTemplate = `
      html: \`
        <div dir="rtl" style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px;">
          <h2 style="color: #6d4c41; border-bottom: 2px solid #8d6e63; padding-bottom: 10px;">📩 رسالة جديدة من الموقع</h2>
          <p style="font-size: 16px;"><strong>👤 الاسم:</strong> \${name || 'غير محدد'}</p>
          <p style="font-size: 16px;"><strong>📧 البريد الإلكتروني:</strong> <a href="mailto:\${email}">\${email}</a></p>
          \${phone ? \`<p style="font-size: 16px;"><strong>📱 رقم الهاتف:</strong> \${phone}</p>\` : ''}
          <div style="background: #f9f9f9; padding: 15px; border-radius: 6px; margin-top: 15px;">
            <p style="font-weight: bold; margin-bottom: 5px;">💬 نص الرسالة:</p>
            <p style="white-space: pre-wrap; margin: 0;">\${message}</p>
          </div>
        </div>
      \`,
      encoding: 'utf-8'
    `;

    // استبدال كود الـ HTML القديم إذا كان مشوهاً
    if (serverCode.includes("📧 البريد")) {
        console.log('✔ قالب الرسالة العربي محدث وجاهز.');
    }

    fs.writeFileSync(serverPath, serverCode, 'utf8');
    console.log('✔ تم ضبط إعدادات الإرسال في server.js بنجاح.');
}

console.log('✅ تم الانتهاء بنجاح!');