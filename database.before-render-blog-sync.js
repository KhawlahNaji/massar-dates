�const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const db = new Database(path.join(__dirname, 'massar.db'));

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
    CREATE TABLE IF NOT EXISTS admin_users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        slug TEXT UNIQUE NOT NULL,
        name_en TEXT NOT NULL,
        name_ar TEXT NOT NULL,
        name_ms TEXT NOT NULL,
        desc_en TEXT,
        desc_ar TEXT,
        desc_ms TEXT,
        variety TEXT,
        origin TEXT DEFAULT 'Saudi Arabia',
        type TEXT,
        texture_en TEXT,
        texture_ar TEXT,
        texture_ms TEXT,
        taste_en TEXT,
        taste_ar TEXT,
        taste_ms TEXT,
        image_url TEXT,
        badge_en TEXT,
        badge_ar TEXT,
        badge_ms TEXT,
        active INTEGER DEFAULT 1,
        featured INTEGER DEFAULT 1,
        sort_order INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS product_prices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL,
        weight TEXT NOT NULL,
        price REAL NOT NULL DEFAULT 0,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        UNIQUE(product_id, weight)
    );

    CREATE TABLE IF NOT EXISTS site_config (
        key TEXT PRIMARY KEY,
        value TEXT
    );

    
    CREATE TABLE IF NOT EXISTS blog_posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        slug TEXT UNIQUE NOT NULL,
        title_ar TEXT NOT NULL,
        title_en TEXT NOT NULL,
        title_ms TEXT NOT NULL,
        excerpt_ar TEXT,
        excerpt_en TEXT,
        excerpt_ms TEXT,
        content_ar TEXT,
        content_en TEXT,
        content_ms TEXT,
        image_url TEXT DEFAULT '',
        category TEXT DEFAULT 'types-of-dates',
        published INTEGER DEFAULT 1,
        featured INTEGER DEFAULT 0,
        sort_order INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE TABLE IF NOT EXISTS discover_cards (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        image_url TEXT DEFAULT '',
        title_ar TEXT DEFAULT '', title_en TEXT DEFAULT '', title_ms TEXT DEFAULT '',
        desc_ar TEXT DEFAULT '', desc_en TEXT DEFAULT '', desc_ms TEXT DEFAULT '',
        link TEXT DEFAULT '#', active INTEGER DEFAULT 1, sort_order INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT,
        message TEXT NOT NULL,
        is_read INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
`);

// Add brand column to products if not exists
try {
    db.prepare("ALTER TABLE products ADD COLUMN brand TEXT DEFAULT ''").run();
} catch (e) {
    if (!String(e.message).includes('duplicate column name')) throw e;
}

// تعد�`� جد��� ا�رسائ� بأ�&ا�  تا�& �&ت��اف� �&ع ���ا� �`�  SQLite
try {
    // 0 �!�` ��`�&ة ثابتة ���`�ب��!ا ا�٬ SQLite ْ��`�&ة افتراض�`ة ع� د ا�تعد�`�
    db.prepare("ALTER TABLE messages ADD COLUMN is_read INTEGER DEFAULT 0").run();
} catch (e) {
    if (!String(e.message).includes('duplicate column name')) throw e;
}

try {
    // � ����& بإضافة ا�ع�&��د بد���  ��`�&ة افتراض�`ة �تفاد�` خطأ SQLite
    db.prepare("ALTER TABLE messages ADD COLUMN updated_at DATETIME").run();
} catch (e) {
    if (!String(e.message).includes('duplicate column name')) throw e;
}

// Seed default admin if none exists
const adminCount = db.prepare('SELECT COUNT(*) as count FROM admin_users').get();
if (adminCount.count === 0) {
    const hash = bcrypt.hashSync('Admin@2024', 10);
    db.prepare('INSERT INTO admin_users (email, password) VALUES (?, ?)').run('admin@massardates.com', hash);
    console.log('�S& Default admin created: admin@massardates.com / Admin@2024');
}

// Seed default config if empty
const configCount = db.prepare('SELECT COUNT(*) as count FROM site_config').get();
if (configCount.count === 0) {
    const defaults = {
        logo_text: 'MASSAR DATES',
        logo_tagline_en: 'Premium Saudi Dates',
        logo_tagline_ar: 'ت�&��ر سع��د�`ة فاخرة',
        logo_tagline_ms: 'Kurma Saudi Premium',
        seo_title: 'MASSAR DATES | Premium Saudi Dates',
        seo_desc: 'MASSAR DATES - Premium Saudi Dates. Shop the finest Ajwa, Safawi, Sukkari, Medjool, and Mariami dates.',
        hero_badge_en: 'Premium Quality From Saudi Arabia',
        hero_badge_ar: 'ج��دة فاخرة �&�  ا��&�&�ْة ا�عرب�`ة ا�سع��د�`ة',
        hero_badge_ms: 'Kualiti Premium Dari Arab Saudi',
        hero_title_en: 'The Finest Saudi Dates Delivered to You',
        hero_title_ar: 'أفض� ا�ت�&��ر ا�سع��د�`ة تص� إ��`ْ',
        hero_title_ms: 'Kurma Saudi Terbaik Untuk Anda',
        hero_desc_en: 'Discover our handpicked selection of premium dates, sourced directly from the finest farms of Saudi Arabia. Pure, natural, and exquisitely delicious.',
        hero_desc_ar: 'اْتشف �&ج�&��عت� ا ا��&ختارة بع� ا�`ة �&�  ا�ت�&��ر ا�فاخرة �&�  أفض� �&زارع ا��&�&�ْة ا�عرب�`ة ا�سع��د�`ة.',
        hero_desc_ms: 'Temui koleksi kurma premium pilihan kami dari ladang terbaik di Arab Saudi.',
        hero_img: '',
        about_title_en: 'A Passion for Premium Dates',
        about_title_ar: 'شغف با�ت�&��ر ا�فاخرة',
        about_title_ms: 'Keghairahan Terhadap Kurma Premium',
        about_text_en: 'MASSAR DATES brings the finest premium dates from Saudi Arabia directly to you. We are dedicated to sourcing the highest quality dates, ensuring every piece meets our exacting standards of taste, freshness, and purity. From the blessed farms of Al Madinah to the lush orchards of Al-Qassim, each date variety tells a story of heritage, tradition, and uncompromising quality.',
        about_text_ar: '�&سار ��ت�&��ر ت�د�& أج��د ا�ت�&��ر ا�فاخرة �&�  ا��&�&�ْة ا�عرب�`ة ا�سع��د�`ة �&باشرة إ��`ْ. � ح�  �&�تز�&���  بت��ف�`ر أع��0 ج��دة �&�  ا�ت�&��ر.',
        about_text_ms: 'MASSAR DATES membawa kurma premium terbaik dari Arab Saudi terus kepada anda.',
        detail_tab_en: 'Our premium dates are carefully handpicked from the finest farms in Saudi Arabia. Each date is selected for its quality, size, and taste. 100% natural with no added sugar, no preservatives, and no artificial flavoring. Rich in natural fiber, potassium, and magnesium.',
        detail_tab_ar: '�`ت�& �طف ت�&��ر� ا ا�فاخرة بع� ا�`ة �&�  أفض� ا��&زارع ف�` ا��&�&�ْة ا�عرب�`ة ا�سع��د�`ة. طب�`ع�`ة 100% بد���  إضافات.',
        detail_tab_ms: 'Kurma premium kami dipetik dengan teliti dari ladang terbaik di Arab Saudi. 100% semulajadi tanpa bahan tambahan.',
        ship_tab_en: 'We offer nationwide delivery across Malaysia. Orders are processed and shipped within 1�3 business days. Shipping rates may vary depending on your location. Contact us via WhatsApp for specific inquiries.',
        ship_tab_ar: '� �د�& ت��ص�`�ا�9 ف�` ج�&�`ع أ� حاء �&ا��`ز�`ا. تت�& �&عا�جة ا�ط�بات خ�ا� 1-3 أ�`ا�& ع�&�.',
        ship_tab_ms: 'Kami menawarkan penghantaran ke seluruh Malaysia. Pesanan diproses dalam 1�3 hari perniagaan.',
        stor_tab_en: 'Store in a cool, dry place away from direct sunlight. For extended freshness, refrigerate after opening. Can be frozen for long-term storage. Keep packaging sealed when not in use.',
        stor_tab_ar: '�`ُحفظ ف�` �&ْا�  بارد ��جاف بع�`دا�9 ع�  أشعة ا�ش�&س ا��&باشرة. �`ُبرد بعد ا�فتح.',
        stor_tab_ms: 'Simpan di tempat sejuk dan kering. Sejukkan selepas dibuka untuk kesegaran yang lebih lama.',
        ret_tab_en: 'We want you to be completely satisfied. If you receive a damaged or incorrect product, contact us within 48 hours of delivery. Due to the perishable nature of our products, we cannot accept returns for change of mind.',
        ret_tab_ar: '� ر�`دْ أ�  تْ���  راض�`ا�9 ت�&ا�&ا�9. إذا ت���`ت �&� تجا�9 تا�فا�9�R اتص� ب� ا خ�ا� 48 ساعة.',
        ret_tab_ms: 'Kami mahu anda berpuas hati sepenuhnya. Hubungi kami dalam 48 jam jika produk rosak.',
        link_tiktok: 'https://www.tiktok.com',
        link_shopee: 'https://shopee.com.my/',
        link_lazada: 'https://www.lazada.com.my/',
        link_whatsapp: '601111134716',
        contact_email: 'info@massardates.com',
        contact_location_en: 'Kuala Lumpur, Malaysia',
        contact_location_ar: 'ْ��ا�ا��&ب��ر�R �&ا��`ز�`ا',
        contact_location_ms: 'Kuala Lumpur, Malaysia',
        social_tiktok: '#',
        social_instagram: '#',
        social_facebook: '#'
    };

    const insert = db.prepare('INSERT OR IGNORE INTO site_config (key, value) VALUES (?, ?)');
    const insertMany = db.transaction((items) => {
        for (const [k, v] of Object.entries(items)) {
            insert.run(k, v);
        }
    });
    insertMany(defaults);
    console.log('�S& Default site configuration created');
}

// Seed default products if empty
const prodCount = db.prepare('SELECT COUNT(*) as count FROM products').get();
if (prodCount.count === 0) {
    const products = [
        {
            slug: 'ajwa', name_en: 'Premium Ajwa Dates � Al Madinah',
            name_ar: 'ت�&ر عج��ة فاخر � ا��&د�`� ة ا��&� ��رة', name_ms: 'Kurma Ajwa Premium � Al Madinah',
            desc_en: 'The prized Ajwa date from Al Madinah, known for its rich, dark colour and distinctively soft, sweet flavour.',
            desc_ar: 'ت�&ر ا�عج��ة ا�ث�&�`�  �&�  ا��&د�`� ة ا��&� ��رة�R ا��&عر��ف ب���� �! ا�داْ�  ��� ْ�!ت�! ا�ح���ة.',
            desc_ms: 'Kurma Ajwa dari Al Madinah dengan warna gelap dan rasa manis yang lembut.',
            variety: 'Al Madinah', type: 'Ajwa',
            texture_en: 'Soft & Chewy', texture_ar: '� اع�& ���&طاط�`', texture_ms: 'Lembut & Kenyal',
            taste_en: 'Rich & Sweet', taste_ar: 'غ� �` ��ح���', taste_ms: 'Kaya & Manis',
            badge_en: 'Best Seller', badge_ar: 'ا�أْثر �&ب�`عا�9', badge_ms: 'Terlaris',
            prices: { '100g': 25, '250g': 55, '500g': 95, '1kg': 180, '3kg': 500, '5kg': 800 }
        },
        {
            slug: 'safawi', name_en: 'Premium Safawi Dates',
            name_ar: 'ت�&ر صفا���` فاخر', name_ms: 'Kurma Safawi Premium',
            desc_en: 'A semi-dry date with a deep, dark appearance and mildly sweet taste with satisfying chewy texture.',
            desc_ar: 'ت�&ر شب�! جاف ب�&ظ�!ر داْ�  ��طع�& ح��� �&عتد�.',
            desc_ms: 'Kurma separuh kering dengan rupa gelap dan rasa manis sederhana.',
            variety: 'Al Madinah', type: 'Safawi',
            texture_en: 'Semi-Dry & Chewy', texture_ar: 'شب�! جاف ���&طاط�`', texture_ms: 'Separuh Kering & Kenyal',
            taste_en: 'Mildly Sweet', taste_ar: 'ح��� �&عتد�', taste_ms: 'Manis Sederhana',
            badge_en: 'Popular', badge_ar: 'رائج', badge_ms: 'Popular',
            prices: { '100g': 18, '250g': 40, '500g': 70, '1kg': 130, '3kg': 360, '5kg': 580 }
        },
        {
            slug: 'sukkari', name_en: 'Premium Sukkari Dates',
            name_ar: 'ت�&ر سْر�` فاخر', name_ms: 'Kurma Sukkari Premium',
            desc_en: 'Known as the Royal Date, offering caramel-like sweetness with golden, delicate skin and soft flesh.',
            desc_ar: 'ا�ت�&ر ا��&�ْ�` بح�ا��ة ا�ْرا�&�`� ��ا��شرة ا�ذ�!ب�`ة.',
            desc_ms: 'Kurma Diraja dengan kemanisan karamel dan kulit emas.',
            variety: 'Al-Qassim', type: 'Sukkari',
            texture_en: 'Soft & Delicate', texture_ar: '� اع�& ��ر��`�', texture_ms: 'Lembut & Halus',
            taste_en: 'Caramel-like', taste_ar: 'ْرا�&�`�', taste_ms: 'Seperti Karamel',
            badge_en: 'Premium', badge_ar: 'فاخر', badge_ms: 'Premium',
            prices: { '100g': 15, '250g': 35, '500g': 60, '1kg': 110, '3kg': 300, '5kg': 480 }
        },
        {
            slug: 'medjool', name_en: 'Premium Medjool Dates',
            name_ar: 'ت�&ر �&جد��� فاخر', name_ms: 'Kurma Medjool Premium',
            desc_en: 'The King of Dates � large, plump, and incredibly sweet with luscious caramel flavour.',
            desc_ar: '�&�ْ ا�ت�&��ر � ْب�`ر ���&�&ت�ئ ��ح��� بشْ� �ا �`صد�.',
            desc_ms: 'Raja Kurma � besar, montok, dan sangat manis.',
            variety: 'Saudi Arabia', type: 'Medjool',
            texture_en: 'Soft & Plump', texture_ar: '� اع�& ���&�&ت�ئ', texture_ms: 'Lembut & Montok',
            taste_en: 'Rich Caramel', taste_ar: 'ْرا�&�`� غ� �`', taste_ms: 'Karamel Kaya',
            badge_en: 'King of Dates', badge_ar: '�&�ْ ا�ت�&��ر', badge_ms: 'Raja Kurma',
            prices: { '100g': 28, '250g': 65, '500g': 110, '1kg': 200, '3kg': 560, '5kg': 900 }
        },
        {
            slug: 'mariami', name_en: 'Premium Mariami Dates',
            name_ar: 'ت�&ر �&ر�`�&�` فاخر', name_ms: 'Kurma Mariami Premium',
            desc_en: 'A luxurious semi-dry date with beautifully wrinkled skin, balanced sweetness and nutty undertone.',
            desc_ar: 'ت�&ر شب�! جاف فاخر ب�شرة �&تجعدة ��ح�ا��ة �&ت��از� ة.',
            desc_ms: 'Kurma separuh kering mewah dengan kulit berkedut dan kemanisan seimbang.',
            variety: 'Saudi Arabia', type: 'Mariami',
            texture_en: 'Semi-Dry & Firm', texture_ar: 'شب�! جاف ���&ت�&اسْ', texture_ms: 'Separuh Kering & Pejal',
            taste_en: 'Balanced & Nutty', taste_ar: '�&ت��از�  ��ج��ز�`', taste_ms: 'Seimbang & Berkacang',
            badge_en: 'Exotic', badge_ar: '� ادر', badge_ms: 'Eksotik',
            prices: { '100g': 16, '250g': 38, '500g': 65, '1kg': 120, '3kg': 330, '5kg': 520 }
        }
    ];

    const insertProd = db.prepare(`
        INSERT INTO products (slug, name_en, name_ar, name_ms, desc_en, desc_ar, desc_ms,
            variety, origin, type, texture_en, texture_ar, texture_ms, taste_en, taste_ar, taste_ms,
            badge_en, badge_ar, badge_ms, sort_order)
        VALUES (@slug, @name_en, @name_ar, @name_ms, @desc_en, @desc_ar, @desc_ms,
            @variety, 'Saudi Arabia', @type, @texture_en, @texture_ar, @texture_ms,
            @taste_en, @taste_ar, @taste_ms, @badge_en, @badge_ar, @badge_ms, @sort_order)
    `);

    const insertPrice = db.prepare('INSERT INTO product_prices (product_id, weight, price) VALUES (?, ?, ?)');

    const seedAll = db.transaction(() => {
        products.forEach((p, i) => {
            p.sort_order = i;
            const result = insertProd.run(p);
            const prodId = result.lastInsertRowid;
            for (const [weight, price] of Object.entries(p.prices)) {
                insertPrice.run(prodId, weight, price);
            }
        });
    });
    seedAll();
    console.log('�S& Default products seeded');
}



// Safe Column Migrations for Products
try { db.prepare("ALTER TABLE products ADD COLUMN shopee_url TEXT DEFAULT ''").run(); } catch(e) {}
try { db.prepare("ALTER TABLE products ADD COLUMN lazada_url TEXT DEFAULT ''").run(); } catch(e) {}
try { db.prepare("ALTER TABLE products ADD COLUMN tiktok_url TEXT DEFAULT ''").run(); } catch(e) {}
try { db.prepare("ALTER TABLE products ADD COLUMN brand TEXT DEFAULT ''").run(); } catch(e) {}

// Create Blog & Discover Tables
db.exec(`
    CREATE TABLE IF NOT EXISTS blog_posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        slug TEXT UNIQUE NOT NULL,
        title_ar TEXT NOT NULL,
        title_en TEXT NOT NULL,
        title_ms TEXT NOT NULL,
        excerpt_ar TEXT, excerpt_en TEXT, excerpt_ms TEXT,
        content_ar TEXT, content_en TEXT, content_ms TEXT,
        image_url TEXT DEFAULT '',
        category TEXT DEFAULT 'types-of-dates',
        published INTEGER DEFAULT 1,
        featured INTEGER DEFAULT 0,
        sort_order INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS discover_cards (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        image_url TEXT DEFAULT '',
        title_ar TEXT DEFAULT '', title_en TEXT DEFAULT '', title_ms TEXT DEFAULT '',
        desc_ar TEXT DEFAULT '', desc_en TEXT DEFAULT '', desc_ms TEXT DEFAULT '',
        link TEXT DEFAULT '#',
        active INTEGER DEFAULT 1,
        sort_order INTEGER DEFAULT 0
    );
`);

// Seed Blog Posts
const blogCheck = db.prepare('SELECT COUNT(*) as count FROM blog_posts').get();
if (blogCheck.count === 0) {
    const insertBlog = db.prepare(`
        INSERT INTO blog_posts (slug, title_ar, title_en, title_ms, excerpt_ar, excerpt_en, excerpt_ms, content_ar, content_en, content_ms, image_url, category, published, featured, sort_order)
        VALUES (@slug, @title_ar, @title_en, @title_ms, @excerpt_ar, @excerpt_en, @excerpt_ms, @content_ar, @content_en, @content_ms, @image_url, @category, 1, @featured, @sort_order)
    `);
    const initialPosts = [
        {
            slug: 'ajwa-dates-al-madinah-benefits',
            title_ar: 'ت�&ر ا�عج��ة �&�  ا��&د�`� ة ا��&� ��رة: �&ا ا�ذ�` �`�&�`ز�!�x',
            title_en: 'Ajwa Dates from Al Madinah: What Makes Them Special?',
            title_ms: 'Kurma Ajwa dari Al Madinah: Apa yang Menjadikannya Istimewa?',
            excerpt_ar: 'اْتشف سر ت�&ر ا�عج��ة ا��&بارْ �&�  بسات�`�  ا��&د�`� ة ا��&� ��رة�R ��ف��ائد�! ا�صح�`ة ����`�&ت�! ا�تار�`خ�`ة.',
            excerpt_en: 'Discover the heritage and unique health benefits of the revered Ajwa dates from Al Madinah.',
            excerpt_ms: 'Ketahui keistimewaan dan khasiat kurma Ajwa barakah yang berasal dari kota suci Madinah.',
            content_ar: '<p>�`عتبر ت�&ر ا�عج��ة �&�  أر��0 ��أث�&�  أ� ��اع ا�ت�&��ر ا�سع��د�`ة�R ����! �&ْا� ة خاصة ف�` ا�تراث ا�إس�ا�&�`. �`ت�&�`ز بحبت�! ا�داْ� ة ذات ا�خط��ط ا�د��`�ة ���&��&س�! ا�� اع�& ��ح�ا��ت�! ا��&ت��از� ة غ�`ر ا��&فرطة.</p><p>تُزرع ا�عج��ة ف�` ا��&د�`� ة ا��&� ��رة ا��&بارْة تحت رعا�`ة خاصة �ض�&ا�  ا�حص��� ع��0 أع��0 درجات ا�ج��دة ��ا�� ضارة ا�غ� �`ة با��&عاد�  ��ا�أ��`اف ا�طب�`ع�`ة.</p>',
            content_en: '<p>Ajwa dates are among the most revered varieties in the world, celebrated for their unique soft texture, dark shade with fine white lines, and delightful, subtle sweetness.</p><p>Harvested directly from Al Madinah orchards, our Ajwa dates embody centuries of heritage, providing high nutritional value and natural antioxidants.</p>',
            content_ms: '<p>Kurma Ajwa adalah salah satu jenis kurma paling istimewa di dunia, terkenal dengan teksturnya yang lembut, warnanya yang gelap dan kemanisan yang sederhana.</p><p>Dituai terus dari kebun Madinah, kurma ini kaya dengan antioksidan dan mineral penting untuk tenaga sepanjang hari.</p>',
            image_url: 'https://images.unsplash.com/photo-1596704017254-9b121068fb31?w=800&auto=format&fit=crop&q=80',
            category: 'types-of-dates', featured: 1, sort_order: 1
        },
        {
            slug: 'guide-choosing-saudi-dates',
            title_ar: 'د��`� اخت�`ار ا�ت�&��ر ا�سع��د�`ة ا��&� اسبة',
            title_en: 'Guide to Choosing the Right Saudi Dates',
            title_ms: 'Panduan Memilih Kurma Saudi yang Sesuai',
            excerpt_ar: 'ْ�`ف تختار � ��ع ا�ت�&ر ا��&� اسب �ذ���ْ ��احت�`اجْ ا��`���&�` �&�  ب�`�  أش�!ر ا�ت�&��ر ا�سع��د�`ة�x',
            excerpt_en: 'Learn how to select the best Saudi dates matching your personal taste and dietary preference.',
            excerpt_ms: 'Ketahui cara memilih kurma Saudi yang paling sesuai dengan citarasa dan keperluan harian anda.',
            content_ar: '<p>تت� ��ع ا�ت�&��ر ا�سع��د�`ة ف�` درجات ا�ح�ا��ة ��ا����ا�& ��ا�رط��بة. إذا ْ� ت تفض� ا�ت�&��ر ا���`� ة ذات ا�ح�ا��ة ا�ْرا�&�`��`ة ا�فاخرة فإ�  ا�سْر�` �!�� خ�`ارْ ا�أ� سب�R ب�`� �&ا �`ت�&�`ز ا�صفا���` ب���ا�&�! شب�! ا�جاف ��ح�ا��ت�! ا�خف�`فة.</p>',
            content_en: '<p>Saudi dates offer an extensive range of textures and flavor profiles. From the caramel tenderness of Sukkari to the rich chewiness of Safawi, there is an ideal date for every palate.</p>',
            content_ms: '<p>Kurma Saudi mempunyai kepelbagaian rasa dan tekstur yang unik. Dari kelazatan rasa karamel Sukkari hingga kepada tekstur kenyal Safawi, terdapat kurma yang sempurna untuk setiap orang.</p>',
            image_url: 'https://images.unsplash.com/photo-1508615039623-a25605d2b022?w=800&auto=format&fit=crop&q=80',
            category: 'dates-guide', featured: 0, sort_order: 2
        },
        {
            slug: 'how-to-keep-dates-fresh',
            title_ar: 'ْ�`ف تحافظ ع��0 ا�ت�&��ر طازجة�x',
            title_en: 'How to Keep Dates Fresh',
            title_ms: 'Cara Mengekalkan Kesegaran Kurma',
            excerpt_ar: 'طر� ��� صائح ع�&��`ة �حفظ ا�ت�&��ر �فترات ط���`�ة �&ع ا�حفاظ ع��0 طع�&�!ا ��رط��بت�!ا ا�أص��`ة.',
            excerpt_en: 'Essential tips for storing and keeping your dates fresh, flavorful, and moist over time.',
            excerpt_ms: 'Tips penting penyimpanan untuk memastikan kurma anda kekal segar, lembut dan berkualiti.',
            content_ar: '<p>��حفاظ ع��0 ج��دة ا�ت�&ر�R �`ُ� صح بتخز�`� �! ف�` ��عاء �&حْ�& ا�إغ�ا� ف�` �&ْا�  بارد ��جاف. ��استخدا�& ا��`���&�` تْف�` درجة حرارة ا�غرفة ا��&عتد�ة�R ب�`� �&ا �`ُفض� ��ضع ا�ت�&��ر ا�رطبة �&ث� ا�سْر�` ف�` ا�ث�اجة ��حفاظ ع��0 � ضارت�!ا.</p>',
            content_en: '<p>To maintain peak freshness, store your dates in airtight containers away from direct sunlight. Soft dates like Sukkari thrive in refrigeration, keeping their delicate texture intact for months.</p>',
            content_ms: '<p>Untuk mengekalkan kualiti terbaik, simpan kurma dalam bekas kedap udara di tempat yang sejuk. Kurma lembut seperti Sukkari amat digalakkan disimpan dalam peti sejuk.</p>',
            image_url: 'https://images.unsplash.com/photo-1543362906-acfc16c67564?w=800&auto=format&fit=crop&q=80',
            category: 'dates-guide', featured: 0, sort_order: 3
        },
        {
            slug: 'ajwa-vs-safawi-vs-sukkari-vs-medjool',
            title_ar: 'ا�فر� ب�`�  ا�عج��ة ��ا�صفا���` ��ا�سْر�` ��ا��&جد���',
            title_en: 'Ajwa vs Safawi vs Sukkari vs Medjool',
            title_ms: 'Perbezaan Ajwa, Safawi, Sukkari dan Medjool',
            excerpt_ar: '�&�ار� ة شا�&�ة ب�`�  أش�!ر أربعة أص� اف �&�  ا�ت�&��ر �&�  ح�`ث ا�شْ� ��ا����ا�& ��ا�� ْ�!ة.',
            excerpt_en: 'A comprehensive comparison between four renowned date varieties in texture and sweetness.',
            excerpt_ms: 'Perbandingan lengkap antara empat jenis kurma terkenal dari segi tekstur, rasa dan keunikan.',
            content_ar: '<p>تخت�ف أص� اف ا�ت�&��ر ف�` �&��اصفات�!ا: ا�عج��ة داْ� ة �����ا�&�!ا � اع�&�R ��ا�صفا���` أط��� ��شب�! جاف �&ع ح�ا��ة �&عتد�ة�R ��ا�سْر�` ذ�!ب�` � اصع ���&حبب �عشا� ا�ح�ا��ة�R ��ا��&جد��� �&�&ت�ئ ��ْب�`ر ا�حج�& ب�&ذا� ْرا�&�`��` ع�&�`�.</p>',
            content_en: '<p>Ajwa is dark and gently sweet, Safawi is chewy and elongated, Sukkari offers a melt-in-mouth golden caramel taste, and Medjool stands out for its large, plump appearance and rich indulgence.</p>',
            content_ms: '<p>Ajwa berwarna gelap dan lembut, Safawi lebih panjang dan kenyal, Sukkari manis berkrim keemasan, manakala Medjool terkenal dengan saiznya yang besar dan berisi.</p>',
            image_url: 'https://images.unsplash.com/photo-1596704017254-9b121068fb31?w=800&auto=format&fit=crop&q=80',
            category: 'types-of-dates', featured: 1, sort_order: 4
        },
        {
            slug: 'from-saudi-farms-to-your-home',
            title_ar: '�&�  �&زارع ا�سع��د�`ة إ��0 �&� ز�ْ',
            title_en: 'From Saudi Farms to Your Home',
            title_ms: 'Dari Ladang Saudi ke Rumah Anda',
            excerpt_ar: 'رح�ة �طف ��اخت�`ار ت�&��ر MASSAR DATES بأع��0 �&عا�`�`ر ا�ج��دة حت�0 ��ص����!ا إ��`ْ.',
            excerpt_en: 'The farm-to-table journey of our premium Saudi dates, packed with care and utmost purity.',
            excerpt_ms: 'Perjalanan kurma MASSAR DATES dari ladang-ladang terbaik Arab Saudi terus ke kediaman anda.',
            content_ar: '<p>� حرص ف�` MASSAR DATES ع��0 اخت�`ار �&حاص�`�� ا �&باشرة �&�  � خ�`� ا��ص�`�& ��ا��&د�`� ة ا��&� ��رة�R �� ض�&�  حص���ْ ع��0 �&� تج طب�`ع�` 100% بد���  أ�` إضافات ص� اع�`ة أ�� سْر�`ات �&ضافة.</p>',
            content_en: '<p>At MASSAR DATES, we partner directly with trusted farms in Al-Qassim and Al Madinah to deliver uncompromised quality, 100% natural and freshly packed dates directly to you.</p>',
            content_ms: '<p>Kami bekerjasama secara langsung dengan ladang terpilih di Madinah dan Qassim untuk memastikan anda menerima kurma asli 100% berkualiti tinggi tanpa bahan pengawet.</p>',
            image_url: 'https://images.unsplash.com/photo-1508615039623-a25605d2b022?w=800&auto=format&fit=crop&q=80',
            category: 'saudi-farms', featured: 0, sort_order: 5
        }
    ];
    initialPosts.forEach(p => insertBlog.run(p));
}

// Seed Discover Cards
const discCheck = db.prepare('SELECT COUNT(*) as count FROM discover_cards').get();
if (discCheck.count === 0) {
    const insertDisc = db.prepare(`
        INSERT INTO discover_cards (image_url, title_ar, title_en, title_ms, desc_ar, desc_en, desc_ms, link, active, sort_order)
        VALUES (@image_url, @title_ar, @title_en, @title_ms, @desc_ar, @desc_en, @desc_ms, @link, 1, @sort_order)
    `);
    const saudiDateCards = [
        { image_url: 'https://images.unsplash.com/photo-1596704017254-9b121068fb31?w=800&auto=format&fit=crop&q=80', title_ar: 'ت�&ر ا�عج��ة ا��&بارْ', title_en: 'Blessed Ajwa Dates', title_ms: 'Kurma Ajwa Berkat', desc_ar: '�&�  �&زارع ��بسات�`�  ا��&د�`� ة ا��&� ��رة ا�فاخرة', desc_en: 'Directly from the finest Al Madinah orchards', desc_ms: 'Terus dari ladang kurma Al Madinah terbaik', link: '#', sort_order: 1 },
        { image_url: 'https://images.unsplash.com/photo-1596850181842-29c6bd23c3c0?w=800&auto=format&fit=crop&q=80', title_ar: 'ت�&ر ا�سْر�` ا�ذ�!ب�`', title_en: 'Golden Sukkari Dates', title_ms: 'Kurma Sukkari Keemasan', desc_ar: 'ا�ت�&��ر ا��&�ْ�`ة ذات ا�ح�ا��ة ا�ْرا�&�`��`ة', desc_en: 'Royal date offering melt-in-mouth caramel taste', desc_ms: 'Kurma diraja dengan rasa karamel yang lembut', link: '#', sort_order: 2 },
        { image_url: 'https://images.unsplash.com/photo-1590846413367-c2e497e0c971?w=800&auto=format&fit=crop&q=80', title_ar: '�&زارع ا�� خ�`� ا�سع��د�`ة', title_en: 'Saudi Palm Groves', title_ms: 'Ladang Kurma Saudi', desc_ar: 'ع� ا�`ة فائ�ة ��تراث سع��د�` أص�`� ف�` ا�زراعة', desc_en: 'Authentic Saudi heritage in date cultivation', desc_ms: 'Warisan asli Saudi dalam penanaman kurma', link: '#', sort_order: 3 },
        { image_url: 'https://images.unsplash.com/photo-1586375309967-6673e57e4c15?w=800&auto=format&fit=crop&q=80', title_ar: 'ع� ا��`د ا�ت�&ر ا�طازجة', title_en: 'Fresh Date Bunches', title_ms: 'Tandan Kurma Segar', desc_ar: 'حصاد �`د���` بد�ة ��حفاظ ع��0 ج��دة ��� ضارة ا�حبة', desc_en: 'Meticulously handpicked at peak ripeness', desc_ms: 'Dipetik dengan tangan untuk kesegaran maksimum', link: '#', sort_order: 4 },
        { image_url: 'https://images.unsplash.com/photo-1610276414268-22e77dc5e360?w=800&auto=format&fit=crop&q=80', title_ar: 'ت�&ر ا��&جد��� ا��&�ْ�`', title_en: 'Royal Medjool Dates', title_ms: 'Kurma Medjool Diraja', desc_ar: '�&�ْ ا�ت�&��ر با�حبة ا�عر�`ضة ��ا��&ذا� ا�فاخر', desc_en: 'The king of dates known for size and indulgence', desc_ms: 'Raja kurma yang terkenal dengan saiz dan kelazatan', link: '#', sort_order: 5 }
    ];
    saudiDateCards.forEach(c => insertDisc.run(c));
}

module.exports = db;

