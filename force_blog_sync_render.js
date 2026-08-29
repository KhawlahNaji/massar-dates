const fs = require('fs');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const Database = require('better-sqlite3');

cloudinary.config({
    cloud_name: 'u0x5opyh',
    api_key: '472159413429157',
    api_secret: 'Ab7P54hG8y3GYIGjNc5a_j6twYg'
});

const db = new Database('massar.db');

function findLocalFile(imgPath) {
    if (!imgPath || typeof imgPath !== 'string' || imgPath.startsWith('http')) return null;
    const clean = imgPath.replace(/^\//, '').replace(/^uploads\//, '');
    const paths = [
        path.join(__dirname, 'uploads', clean),
        path.join(__dirname, 'public', 'uploads', clean),
        path.join(__dirname, 'public', 'uploads', 'blog', clean),
        path.join(__dirname, 'uploads-before-render-image-fix', clean),
        path.join(__dirname, 'public', imgPath.replace(/^\//, '')),
        path.join(__dirname, imgPath.replace(/^\//, ''))
    ];
    for (const p of paths) {
        if (fs.existsSync(p) && fs.lstatSync(p).isFile()) return p;
    }
    return null;
}

async function uploadFile(p) {
    try {
        console.log(`⏳ جارٍ رفع صورة المقال: ${path.basename(p)}...`);
        const res = await cloudinary.uploader.upload(p, { folder: 'massar-dates-blog-final' });
        console.log(`✅ تم الرفع => ${res.secure_url}`);
        return res.secure_url;
    } catch(e) {
        console.error(`❌ خطأ:`, e.message);
        return null;
    }
}

async function run() {
    console.log("====================================================");
    console.log("🚀 تجهيز ومزامنة المدونة بالكامل لريندر...");
    console.log("====================================================\n");

    // 1. تحديث الصور في جدول blog_posts بروابط سحابية
    const blogs = db.prepare("SELECT * FROM blog_posts").all();
    for (let b of blogs) {
        const local = findLocalFile(b.image_url);
        if (local) {
            const cloudUrl = await uploadFile(local);
            if (cloudUrl) {
                b.image_url = cloudUrl;
                db.prepare("UPDATE blog_posts SET image_url = ? WHERE id = ?").run(cloudUrl, b.id);
            }
        }
    }

    // 2. تصدير جدول المدونة المحدث بالكامل إلى blog-seed.json
    const updatedBlogs = db.prepare("SELECT * FROM blog_posts").all();
    fs.writeFileSync('blog-seed.json', JSON.stringify(updatedBlogs, null, 2), 'utf8');
    console.log("✅ تم تصدير جدول المدونة الجديد كاملاً إلى blog-seed.json.");

    // 3. حقن كود المزامنة الإجباري عند تشغيل السيرفر في server.js
    let server = fs.readFileSync('server.js', 'utf8');
    const syncBlogOnStart = `
// ========================================================
// SYNC BLOG POSTS FROM SEED ON RENDER STARTUP
// ========================================================
function syncBlogFromSeed() {
    try {
        if (fs.existsSync('blog-seed.json')) {
            const seed = JSON.parse(fs.readFileSync('blog-seed.json', 'utf8'));
            if (Array.isArray(seed) && seed.length > 0) {
                const upsert = db.prepare(\`
                    INSERT INTO blog_posts (id, slug, category, image_url, title_ar, excerpt_ar, content_ar, title_en, excerpt_en, content_en, title_ms, excerpt_ms, content_ms, sort_order, active, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                    ON CONFLICT(id) DO UPDATE SET
                        image_url = excluded.image_url,
                        title_ar = excluded.title_ar,
                        title_en = excluded.title_en,
                        excerpt_ar = excluded.excerpt_ar,
                        excerpt_en = excluded.excerpt_en,
                        content_ar = excluded.content_ar,
                        content_en = excluded.content_en,
                        updated_at = CURRENT_TIMESTAMP
                \`);
                
                seed.forEach(item => {
                    upsert.run(
                        item.id, item.slug || '', item.category || 'news', item.image_url || '',
                        item.title_ar || '', item.excerpt_ar || '', item.content_ar || '',
                        item.title_en || '', item.excerpt_en || '', item.content_en || '',
                        item.title_ms || '', item.excerpt_ms || '', item.content_ms || '',
                        item.sort_order || 0, item.active !== undefined ? item.active : 1
                    );
                });
                console.log("✅ Auto-synced " + seed.length + " blog posts with Cloudinary images.");
            }
        }
    } catch(err) {
        console.error("Blog sync error:", err.message);
    }
}
syncBlogFromSeed();
`;

    server = server.replace(/\/\/ SYNC BLOG POSTS[\s\S]*?syncBlogFromSeed\(\);/gi, '');
    server = server.replace(/(const\s+app\s*=\s*express\(\);)/, syncBlogOnStart + '\n$1');
    fs.writeFileSync('server.js', server, 'utf8');

    // 4. تغيير تاريخ زمني في ملف index.html لإجبار Git على قبول الرفع
    let indexHtml = fs.readFileSync('public/index.html', 'utf8');
    indexHtml = indexHtml.replace(/<!-- BUILD_TIMESTAMP:.*? -->/g, '');
    indexHtml = indexHtml.replace('</body>', `<!-- BUILD_TIMESTAMP: ${Date.now()} -->\n</body>`);
    fs.writeFileSync('public/index.html', indexHtml, 'utf8');

    console.log("\n🎉 تم تجهيز الملفات وتحديث الروابط السحابية بنجاح!");
}

run();
