const fs = require('fs');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const Database = require('better-sqlite3');

// إعداد كلاوديناري
cloudinary.config({
    cloud_name: 'u0x5opyh',
    api_key: '472159413429157',
    api_secret: 'Ab7P54hG8y3GYIGjNc5a_j6twYg'
});

const db = new Database('massar.db');

// دالة البحث عن مسار الملف المحلي
function findLocalFilePath(imgUrl) {
    if (!imgUrl || typeof imgUrl !== 'string' || imgUrl.startsWith('http')) return null;
    
    const cleanPath = imgUrl.replace(/^\//, '').replace(/^uploads\//, '');
    const possiblePaths = [
        path.join(__dirname, 'uploads', cleanPath),
        path.join(__dirname, 'public', 'uploads', cleanPath),
        path.join(__dirname, 'public', imgUrl.replace(/^\//, '')),
        path.join(__dirname, imgUrl.replace(/^\//, ''))
    ];

    for (const p of possiblePaths) {
        if (fs.existsSync(p) && fs.lstatSync(p).isFile()) {
            return p;
        }
    }
    return null;
}

// دالة رفع ملف لكلاوديناري
async function uploadToCloud(localPath) {
    try {
        console.log(`⏳ جارٍ رفع: ${path.basename(localPath)}...`);
        const result = await cloudinary.uploader.upload(localPath, {
            folder: 'massar-dates-migrated'
        });
        console.log(`✅ تم الرفع بنجاح => ${result.secure_url}`);
        return result.secure_url;
    } catch (err) {
        console.error(`❌ فشل رفع ${localPath}:`, err.message);
        return null;
    }
}

async function main() {
    console.log('====================================================');
    console.log('🚀 بدء رفع جميع صور الموقع المحلي إلى Cloudinary...');
    console.log('====================================================\n');

    // 1. فحص وتحديث صور المنتجات Products
    console.log('--- 1. فحص صور المنتجات ---');
    const products = db.prepare('SELECT id, name_en, image_url FROM products').all();
    for (const p of products) {
        const local = findLocalFilePath(p.image_url);
        if (local) {
            const cloudUrl = await uploadToCloud(local);
            if (cloudUrl) {
                db.prepare('UPDATE products SET image_url = ? WHERE id = ?').run(cloudUrl, p.id);
            }
        }
    }

    // 2. فحص وتحديث صور المدونة Blog
    console.log('\n--- 2. فحص صور المدونة ---');
    try {
        const blogs = db.prepare('SELECT id, title_en, title_ar, image_url FROM blog_posts').all();
        for (const b of blogs) {
            const local = findLocalFilePath(b.image_url);
            if (local) {
                const cloudUrl = await uploadToCloud(local);
                if (cloudUrl) {
                    db.prepare('UPDATE blog_posts SET image_url = ? WHERE id = ?').run(cloudUrl, b.id);
                }
            }
        }
    } catch(e) {}

    // 3. فحص وتحديث صور البراندات والإعدادات Brands & Config
    console.log('\n--- 3. فحص صور البراندات والبانرات العامة ---');
    try {
        const configRow = db.prepare("SELECT value FROM site_config WHERE key = 'brands_data'").get();
        if (configRow && configRow.value) {
            let brands = JSON.parse(configRow.value);
            let updated = false;
            for (let b of brands) {
                const local = findLocalFilePath(b.image_url);
                if (local) {
                    const cloudUrl = await uploadToCloud(local);
                    if (cloudUrl) {
                        b.image_url = cloudUrl;
                        updated = true;
                    }
                }
            }
            if (updated) {
                db.prepare("UPDATE site_config SET value = ? WHERE key = 'brands_data'").run(JSON.stringify(brands));
                console.log('✅ تم تحديث صور البراندات بروابط سحابية.');
            }
        }
    } catch(e) {}

    // 4. فحص صور بطاقات Discover
    console.log('\n--- 4. فحص صور Discover Cards ---');
    try {
        const cards = db.prepare('SELECT id, image_url FROM discover_cards').all();
        for (const c of cards) {
            const local = findLocalFilePath(c.image_url);
            if (local) {
                const cloudUrl = await uploadToCloud(local);
                if (cloudUrl) {
                    db.prepare('UPDATE discover_cards SET image_url = ? WHERE id = ?').run(cloudUrl, c.id);
                }
            }
        }
    } catch(e) {}

    console.log('\n====================================================');
    console.log('🎉 اكتملت عملية رفع جميع الصور وتحديث قاعدة البيانات بنجاح!');
    console.log('====================================================');
}

main();
