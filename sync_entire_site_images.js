const fs = require('fs');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const Database = require('better-sqlite3');

// إعداد Cloudinary
cloudinary.config({
    cloud_name: 'u0x5opyh',
    api_key: '472159413429157',
    api_secret: 'Ab7P54hG8y3GYIGjNc5a_j6twYg'
});

const db = new Database('massar.db');
const uploadedMap = new Map(); // خريطة لتخزين الروابط المرفوعة وتجنب التكرار

// 1. دالة تجميع كل ملفات الصور من مجلدات المشروع
function getAllImageFiles(dirPath, arrayOfFiles = []) {
    if (!fs.existsSync(dirPath)) return arrayOfFiles;
    const files = fs.readdirSync(dirPath);

    files.forEach(file => {
        const fullPath = path.join(dirPath, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (file !== 'node_modules' && file !== '.git') {
                arrayOfFiles = getAllImageFiles(fullPath, arrayOfFiles);
            }
        } else {
            if (/\.(jpg|jpeg|png|webp|svg|gif|ico)$/i.test(file)) {
                arrayOfFiles.push(fullPath);
            }
        }
    });
    return arrayOfFiles;
}

// 2. رفع ملف لكلاوديناري
async function uploadToCloudinary(filePath) {
    const fileName = path.basename(filePath);
    if (uploadedMap.has(fileName)) {
        return uploadedMap.get(fileName);
    }
    try {
        console.log(`⏳ جارٍ رفع: ${fileName}...`);
        const res = await cloudinary.uploader.upload(filePath, {
            folder: 'massar-dates-full-sync',
            use_filename: true,
            unique_filename: false,
            overwrite: false
        });
        console.log(`✅ تم الرفع بنجاح => ${res.secure_url}`);
        uploadedMap.set(fileName, res.secure_url);
        return res.secure_url;
    } catch (e) {
        console.error(`❌ فشل رفع ${fileName}:`, e.message);
        return null;
    }
}

async function startFullMigration() {
    console.log('====================================================');
    console.log('🚀 بدء مزامنة ورفع كافة صور الموقع المحلي إلى السحابة...');
    console.log('====================================================\n');

    // تجميع كل الصور من مجلدات uploads ومجلد public
    const searchDirs = [
        path.join(__dirname, 'uploads'),
        path.join(__dirname, 'public', 'uploads'),
        path.join(__dirname, 'uploads-before-render-image-fix')
    ];

    let allImages = [];
    searchDirs.forEach(d => {
        allImages = allImages.concat(getAllImageFiles(d));
    });

    console.log(`📌 تم العثور على (${allImages.length}) صورة محلية. جارٍ المعالجة والرفع...\n`);

    for (const imgPath of allImages) {
        await uploadToCloudinary(imgPath);
    }

    console.log('\n--- تحديث قاعدة البيانات massar.db بروابط الصور السحابية ---');

    // تحديث جدول المنتجات
    const products = db.prepare('SELECT id, image_url FROM products').all();
    products.forEach(p => {
        if (p.image_url && !p.image_url.startsWith('http')) {
            const fileName = path.basename(p.image_url);
            if (uploadedMap.has(fileName)) {
                db.prepare('UPDATE products SET image_url = ? WHERE id = ?').run(uploadedMap.get(fileName), p.id);
            }
        }
    });

    // تحديث جدول المدونة
    try {
        const blogs = db.prepare('SELECT id, image_url FROM blog_posts').all();
        blogs.forEach(b => {
            if (b.image_url && !b.image_url.startsWith('http')) {
                const fileName = path.basename(b.image_url);
                if (uploadedMap.has(fileName)) {
                    db.prepare('UPDATE blog_posts SET image_url = ? WHERE id = ?').run(uploadedMap.get(fileName), b.id);
                }
            }
        });
    } catch(e) {}

    // تحديث جدول الإعدادات والبراندات و About Us
    try {
        const configs = db.prepare('SELECT key, value FROM site_config').all();
        configs.forEach(c => {
            if (c.value) {
                let valStr = c.value;
                let modified = false;
                uploadedMap.forEach((cloudUrl, fileName) => {
                    if (valStr.includes(fileName)) {
                        valStr = valStr.split(fileName).join(cloudUrl);
                        // معالجة المسارات المسبوقة بـ /uploads/
                        valStr = valStr.split('/uploads/' + cloudUrl).join(cloudUrl);
                        modified = true;
                    }
                });
                if (modified) {
                    db.prepare('UPDATE site_config SET value = ? WHERE key = ?').run(valStr, c.key);
                }
            }
        });
    } catch(e) {}

    // تحديث ملف public/index.html إذا كانت به مسارات محلية
    let indexHtml = fs.readFileSync('public/index.html', 'utf8');
    uploadedMap.forEach((cloudUrl, fileName) => {
        if (indexHtml.includes('/uploads/' + fileName) || indexHtml.includes('uploads/' + fileName)) {
            indexHtml = indexHtml.split('/uploads/' + fileName).join(cloudUrl);
            indexHtml = indexHtml.split('uploads/' + fileName).join(cloudUrl);
        }
    });
    fs.writeFileSync('public/index.html', indexHtml, 'utf8');

    console.log('\n====================================================');
    console.log('🎉 اكتمل رفع جميع الصور وتحديث قاعدة البيانات والصفحات بنجاح!');
    console.log('====================================================');
}

startFullMigration();
