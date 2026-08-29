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
        const res = await cloudinary.uploader.upload(p, {
            folder: 'massar-dates-blog'
        });
        console.log(`✅ تم الرفع بنجاح => ${res.secure_url}`);
        return res.secure_url;
    } catch(e) {
        console.error(`❌ خطأ في الرفع:`, e.message);
        return null;
    }
}

async function startBlogFix() {
    console.log('====================================================');
    console.log('🚀 بدء تحديث وتثبيت صور المدونة الجديدة لريندر...');
    console.log('====================================================\n');

    // 1. فحص وتحديث جدول blog_posts
    let blogPosts = [];
    try {
        blogPosts = db.prepare('SELECT id, title_en, image_url FROM blog_posts').all();
        console.log(`📌 تم العثور على (${blogPosts.length}) مقال في قاعدة البيانات.`);

        for (const post of blogPosts) {
            const local = findLocalFile(post.image_url);
            if (local) {
                const cloudUrl = await uploadFile(local);
                if (cloudUrl) {
                    db.prepare('UPDATE blog_posts SET image_url = ? WHERE id = ?').run(cloudUrl, post.id);
                    post.image_url = cloudUrl; // تحديث للذاكرة
                    console.log(`📝 تم تحديث مقال [${post.id}] "${post.title_en || 'Blog'}" برابط سحابي.`);
                }
            }
        }
    } catch(err) {
        console.log('ملاحظة blog_posts:', err.message);
    }

    // 2. تحديث ملف blog-seed.json بالصور الجديدة لمنع استرجاع الصور القديمة
    if (fs.existsSync('blog-seed.json')) {
        try {
            let seedData = JSON.parse(fs.readFileSync('blog-seed.json', 'utf8'));
            if (Array.isArray(seedData)) {
                seedData.forEach(item => {
                    const matchedPost = blogPosts.find(p => p.id === item.id || (p.title_en && p.title_en === item.title_en));
                    if (matchedPost && matchedPost.image_url && matchedPost.image_url.startsWith('http')) {
                        item.image_url = matchedPost.image_url;
                    }
                });
                fs.writeFileSync('blog-seed.json', JSON.stringify(seedData, null, 2), 'utf8');
                console.log('✅ تم تحديث ملف blog-seed.json بروابط الصور السحابية الجديدة.');
            }
        } catch(e) {
            console.log('تنبيه seed:', e.message);
        }
    }

    // 3. فحص واستبدال أي صور مدونة ثابتة في index.html
    let html = fs.readFileSync('public/index.html', 'utf8');
    let htmlChanged = false;

    blogPosts.forEach(post => {
        if (post.image_url && post.image_url.startsWith('http')) {
            const fileName = path.basename(post.image_url);
            const regex = new RegExp(`['"]([^'"]*${fileName}[^'"]*)['"]`, 'g');
            if (regex.test(html)) {
                html = html.replace(regex, `"${post.image_url}"`);
                htmlChanged = true;
            }
        }
    });

    if (htmlChanged) {
        fs.writeFileSync('public/index.html', html, 'utf8');
        console.log('✅ تم تحديث كود واجهة المدونة في index.html.');
    }

    console.log('\n====================================================');
    console.log('🎉 اكتمل تحديث وتثبيت صور المدونة بنجاح تام!');
    console.log('====================================================');
}

startBlogFix();
