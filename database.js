const Database = require('better-sqlite3');
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

// تعديل جدول الرسائل بأمان تام متوافق مع قوانين SQLite
try {
    // 0 هي قيمة ثابتة ويقبلها الـ SQLite كقيمة افتراضية عند التعديل
    db.prepare("ALTER TABLE messages ADD COLUMN is_read INTEGER DEFAULT 0").run();
} catch (e) {
    if (!String(e.message).includes('duplicate column name')) throw e;
}

try {
    // نقوم بإضافة العمود بدون قيمة افتراضية لتفادي خطأ SQLite
    db.prepare("ALTER TABLE messages ADD COLUMN updated_at DATETIME").run();
} catch (e) {
    if (!String(e.message).includes('duplicate column name')) throw e;
}

// Seed default admin if none exists
const adminCount = db.prepare('SELECT COUNT(*) as count FROM admin_users').get();
if (adminCount.count === 0) {
    const hash = bcrypt.hashSync('Admin@2024', 10);
    db.prepare('INSERT INTO admin_users (email, password) VALUES (?, ?)').run('admin@massardates.com', hash);
    console.log('✅ Default admin created: admin@massardates.com / Admin@2024');
}

// Seed default config if empty
const configCount = db.prepare('SELECT COUNT(*) as count FROM site_config').get();
if (configCount.count === 0) {
    const defaults = {
        logo_text: 'MASSAR DATES',
        logo_tagline_en: 'Premium Saudi Dates',
        logo_tagline_ar: 'تمور سعودية فاخرة',
        logo_tagline_ms: 'Kurma Saudi Premium',
        seo_title: 'MASSAR DATES | Premium Saudi Dates',
        seo_desc: 'MASSAR DATES - Premium Saudi Dates. Shop the finest Ajwa, Safawi, Sukkari, Medjool, and Mariami dates.',
        hero_badge_en: 'Premium Quality From Saudi Arabia',
        hero_badge_ar: 'جودة فاخرة من المملكة العربية السعودية',
        hero_badge_ms: 'Kualiti Premium Dari Arab Saudi',
        hero_title_en: 'The Finest Saudi Dates Delivered to You',
        hero_title_ar: 'أفضل التمور السعودية تصل إليك',
        hero_title_ms: 'Kurma Saudi Terbaik Untuk Anda',
        hero_desc_en: 'Discover our handpicked selection of premium dates, sourced directly from the finest farms of Saudi Arabia. Pure, natural, and exquisitely delicious.',
        hero_desc_ar: 'اكتشف مجموعتنا المختارة بعناية من التمور الفاخرة من أفضل مزارع المملكة العربية السعودية.',
        hero_desc_ms: 'Temui koleksi kurma premium pilihan kami dari ladang terbaik di Arab Saudi.',
        hero_img: '',
        about_title_en: 'A Passion for Premium Dates',
        about_title_ar: 'شغف بالتمور الفاخرة',
        about_title_ms: 'Keghairahan Terhadap Kurma Premium',
        about_text_en: 'MASSAR DATES brings the finest premium dates from Saudi Arabia directly to you. We are dedicated to sourcing the highest quality dates, ensuring every piece meets our exacting standards of taste, freshness, and purity. From the blessed farms of Al Madinah to the lush orchards of Al-Qassim, each date variety tells a story of heritage, tradition, and uncompromising quality.',
        about_text_ar: 'مسار للتمور تقدم أجود التمور الفاخرة من المملكة العربية السعودية مباشرة إليك. نحن ملتزمون بتوفير أعلى جودة من التمور.',
        about_text_ms: 'MASSAR DATES membawa kurma premium terbaik dari Arab Saudi terus kepada anda.',
        detail_tab_en: 'Our premium dates are carefully handpicked from the finest farms in Saudi Arabia. Each date is selected for its quality, size, and taste. 100% natural with no added sugar, no preservatives, and no artificial flavoring. Rich in natural fiber, potassium, and magnesium.',
        detail_tab_ar: 'يتم قطف تمورنا الفاخرة بعناية من أفضل المزارع في المملكة العربية السعودية. طبيعية 100% بدون إضافات.',
        detail_tab_ms: 'Kurma premium kami dipetik dengan teliti dari ladang terbaik di Arab Saudi. 100% semulajadi tanpa bahan tambahan.',
        ship_tab_en: 'We offer nationwide delivery across Malaysia. Orders are processed and shipped within 1–3 business days. Shipping rates may vary depending on your location. Contact us via WhatsApp for specific inquiries.',
        ship_tab_ar: 'نقدم توصيلاً في جميع أنحاء ماليزيا. تتم معالجة الطلبات خلال 1-3 أيام عمل.',
        ship_tab_ms: 'Kami menawarkan penghantaran ke seluruh Malaysia. Pesanan diproses dalam 1–3 hari perniagaan.',
        stor_tab_en: 'Store in a cool, dry place away from direct sunlight. For extended freshness, refrigerate after opening. Can be frozen for long-term storage. Keep packaging sealed when not in use.',
        stor_tab_ar: 'يُحفظ في مكان بارد وجاف بعيداً عن أشعة الشمس المباشرة. يُبرد بعد الفتح.',
        stor_tab_ms: 'Simpan di tempat sejuk dan kering. Sejukkan selepas dibuka untuk kesegaran yang lebih lama.',
        ret_tab_en: 'We want you to be completely satisfied. If you receive a damaged or incorrect product, contact us within 48 hours of delivery. Due to the perishable nature of our products, we cannot accept returns for change of mind.',
        ret_tab_ar: 'نريدك أن تكون راضياً تماماً. إذا تلقيت منتجاً تالفاً، اتصل بنا خلال 48 ساعة.',
        ret_tab_ms: 'Kami mahu anda berpuas hati sepenuhnya. Hubungi kami dalam 48 jam jika produk rosak.',
        link_tiktok: 'https://www.tiktok.com',
        link_shopee: 'https://shopee.com.my/',
        link_lazada: 'https://www.lazada.com.my/',
        link_whatsapp: '01111134716',
        contact_email: 'info@massardates.com',
        contact_location_en: 'Kuala Lumpur, Malaysia',
        contact_location_ar: 'كوالالمبور، ماليزيا',
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
    console.log('✅ Default site configuration created');
}

// Seed default products if empty
const prodCount = db.prepare('SELECT COUNT(*) as count FROM products').get();
if (prodCount.count === 0) {
    const products = [
        {
            slug: 'ajwa', name_en: 'Premium Ajwa Dates – Al Madinah',
            name_ar: 'تمر عجوة فاخر – المدينة المنورة', name_ms: 'Kurma Ajwa Premium – Al Madinah',
            desc_en: 'The prized Ajwa date from Al Madinah, known for its rich, dark colour and distinctively soft, sweet flavour.',
            desc_ar: 'تمر العجوة الثمين من المدينة المنورة، المعروف بلونه الداكن ونكهته الحلوة.',
            desc_ms: 'Kurma Ajwa dari Al Madinah dengan warna gelap dan rasa manis yang lembut.',
            variety: 'Al Madinah', type: 'Ajwa',
            texture_en: 'Soft & Chewy', texture_ar: 'ناعم ومطاطي', texture_ms: 'Lembut & Kenyal',
            taste_en: 'Rich & Sweet', taste_ar: 'غني وحلو', taste_ms: 'Kaya & Manis',
            badge_en: 'Best Seller', badge_ar: 'الأكثر مبيعاً', badge_ms: 'Terlaris',
            prices: { '100g': 25, '250g': 55, '500g': 95, '1kg': 180, '3kg': 500, '5kg': 800 }
        },
        {
            slug: 'safawi', name_en: 'Premium Safawi Dates',
            name_ar: 'تمر صفاوي فاخر', name_ms: 'Kurma Safawi Premium',
            desc_en: 'A semi-dry date with a deep, dark appearance and mildly sweet taste with satisfying chewy texture.',
            desc_ar: 'تمر شبه جاف بمظهر داكن وطعم حلو معتدل.',
            desc_ms: 'Kurma separuh kering dengan rupa gelap dan rasa manis sederhana.',
            variety: 'Al Madinah', type: 'Safawi',
            texture_en: 'Semi-Dry & Chewy', texture_ar: 'شبه جاف ومطاطي', texture_ms: 'Separuh Kering & Kenyal',
            taste_en: 'Mildly Sweet', taste_ar: 'حلو معتدل', taste_ms: 'Manis Sederhana',
            badge_en: 'Popular', badge_ar: 'رائج', badge_ms: 'Popular',
            prices: { '100g': 18, '250g': 40, '500g': 70, '1kg': 130, '3kg': 360, '5kg': 580 }
        },
        {
            slug: 'sukkari', name_en: 'Premium Sukkari Dates',
            name_ar: 'تمر سكري فاخر', name_ms: 'Kurma Sukkari Premium',
            desc_en: 'Known as the Royal Date, offering caramel-like sweetness with golden, delicate skin and soft flesh.',
            desc_ar: 'التمر الملكي بحلاوة الكراميل والقشرة الذهبية.',
            desc_ms: 'Kurma Diraja dengan kemanisan karamel dan kulit emas.',
            variety: 'Al-Qassim', type: 'Sukkari',
            texture_en: 'Soft & Delicate', texture_ar: 'ناعم ورقيق', texture_ms: 'Lembut & Halus',
            taste_en: 'Caramel-like', taste_ar: 'كراميل', taste_ms: 'Seperti Karamel',
            badge_en: 'Premium', badge_ar: 'فاخر', badge_ms: 'Premium',
            prices: { '100g': 15, '250g': 35, '500g': 60, '1kg': 110, '3kg': 300, '5kg': 480 }
        },
        {
            slug: 'medjool', name_en: 'Premium Medjool Dates',
            name_ar: 'تمر مجدول فاخر', name_ms: 'Kurma Medjool Premium',
            desc_en: 'The King of Dates — large, plump, and incredibly sweet with luscious caramel flavour.',
            desc_ar: 'ملك التمور — كبير وممتلئ وحلو بشكل لا يصدق.',
            desc_ms: 'Raja Kurma — besar, montok, dan sangat manis.',
            variety: 'Saudi Arabia', type: 'Medjool',
            texture_en: 'Soft & Plump', texture_ar: 'ناعم وممتلئ', texture_ms: 'Lembut & Montok',
            taste_en: 'Rich Caramel', taste_ar: 'كراميل غني', taste_ms: 'Karamel Kaya',
            badge_en: 'King of Dates', badge_ar: 'ملك التمور', badge_ms: 'Raja Kurma',
            prices: { '100g': 28, '250g': 65, '500g': 110, '1kg': 200, '3kg': 560, '5kg': 900 }
        },
        {
            slug: 'mariami', name_en: 'Premium Mariami Dates',
            name_ar: 'تمر مريمي فاخر', name_ms: 'Kurma Mariami Premium',
            desc_en: 'A luxurious semi-dry date with beautifully wrinkled skin, balanced sweetness and nutty undertone.',
            desc_ar: 'تمر شبه جاف فاخر بقشرة متجعدة وحلاوة متوازنة.',
            desc_ms: 'Kurma separuh kering mewah dengan kulit berkedut dan kemanisan seimbang.',
            variety: 'Saudi Arabia', type: 'Mariami',
            texture_en: 'Semi-Dry & Firm', texture_ar: 'شبه جاف ومتماسك', texture_ms: 'Separuh Kering & Pejal',
            taste_en: 'Balanced & Nutty', taste_ar: 'متوازن وجوزي', taste_ms: 'Seimbang & Berkacang',
            badge_en: 'Exotic', badge_ar: 'نادر', badge_ms: 'Eksotik',
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
    console.log('✅ Default products seeded');
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
            title_ar: 'تمر العجوة من المدينة المنورة: ما الذي يميزه؟',
            title_en: 'Ajwa Dates from Al Madinah: What Makes Them Special?',
            title_ms: 'Kurma Ajwa dari Al Madinah: Apa yang Menjadikannya Istimewa?',
            excerpt_ar: 'اكتشف سر تمر العجوة المبارك من بساتين المدينة المنورة، وفوائده الصحية وقيمته التاريخية.',
            excerpt_en: 'Discover the heritage and unique health benefits of the revered Ajwa dates from Al Madinah.',
            excerpt_ms: 'Ketahui keistimewaan dan khasiat kurma Ajwa barakah yang berasal dari kota suci Madinah.',
            content_ar: '<p>يعتبر تمر العجوة من أرقى وأثمن أنواع التمور السعودية، وله مكانة خاصة في التراث الإسلامي. يتميز بحبته الداكنة ذات الخطوط الدقيقة وملمسه الناعم وحلاوته المتوازنة غير المفرطة.</p><p>تُزرع العجوة في المدينة المنورة المباركة تحت رعاية خاصة لضمان الحصول على أعلى درجات الجودة والنضارة الغنية بالمعادن والألياف الطبيعية.</p>',
            content_en: '<p>Ajwa dates are among the most revered varieties in the world, celebrated for their unique soft texture, dark shade with fine white lines, and delightful, subtle sweetness.</p><p>Harvested directly from Al Madinah orchards, our Ajwa dates embody centuries of heritage, providing high nutritional value and natural antioxidants.</p>',
            content_ms: '<p>Kurma Ajwa adalah salah satu jenis kurma paling istimewa di dunia, terkenal dengan teksturnya yang lembut, warnanya yang gelap dan kemanisan yang sederhana.</p><p>Dituai terus dari kebun Madinah, kurma ini kaya dengan antioksidan dan mineral penting untuk tenaga sepanjang hari.</p>',
            image_url: 'https://images.unsplash.com/photo-1596704017254-9b121068fb31?w=800&auto=format&fit=crop&q=80',
            category: 'types-of-dates', featured: 1, sort_order: 1
        },
        {
            slug: 'guide-choosing-saudi-dates',
            title_ar: 'دليل اختيار التمور السعودية المناسبة',
            title_en: 'Guide to Choosing the Right Saudi Dates',
            title_ms: 'Panduan Memilih Kurma Saudi yang Sesuai',
            excerpt_ar: 'كيف تختار نوع التمر المناسب لذوقك واحتياجك اليومي من بين أشهر التمور السعودية؟',
            excerpt_en: 'Learn how to select the best Saudi dates matching your personal taste and dietary preference.',
            excerpt_ms: 'Ketahui cara memilih kurma Saudi yang paling sesuai dengan citarasa dan keperluan harian anda.',
            content_ar: '<p>تتنوع التمور السعودية في درجات الحلاوة والقوام والرطوبة. إذا كنت تفضل التمور اللينة ذات الحلاوة الكراميلية الفاخرة فإن السكري هو خيارك الأنسب، بينما يتميز الصفاوي بقوامه شبه الجاف وحلاوته الخفيفة.</p>',
            content_en: '<p>Saudi dates offer an extensive range of textures and flavor profiles. From the caramel tenderness of Sukkari to the rich chewiness of Safawi, there is an ideal date for every palate.</p>',
            content_ms: '<p>Kurma Saudi mempunyai kepelbagaian rasa dan tekstur yang unik. Dari kelazatan rasa karamel Sukkari hingga kepada tekstur kenyal Safawi, terdapat kurma yang sempurna untuk setiap orang.</p>',
            image_url: 'https://images.unsplash.com/photo-1508615039623-a25605d2b022?w=800&auto=format&fit=crop&q=80',
            category: 'dates-guide', featured: 0, sort_order: 2
        },
        {
            slug: 'how-to-keep-dates-fresh',
            title_ar: 'كيف تحافظ على التمور طازجة؟',
            title_en: 'How to Keep Dates Fresh',
            title_ms: 'Cara Mengekalkan Kesegaran Kurma',
            excerpt_ar: 'طرق ونصائح عملية لحفظ التمور لفترات طويلة مع الحفاظ على طعمها ورطوبتها الأصلية.',
            excerpt_en: 'Essential tips for storing and keeping your dates fresh, flavorful, and moist over time.',
            excerpt_ms: 'Tips penting penyimpanan untuk memastikan kurma anda kekal segar, lembut dan berkualiti.',
            content_ar: '<p>للحفاظ على جودة التمر، يُنصح بتخزينه في وعاء محكم الإغلاق في مكان بارد وجاف. للاستخدام اليومي تكفي درجة حرارة الغرفة المعتدلة، بينما يُفضل وضع التمور الرطبة مثل السكري في الثلاجة للحفاظ على نضارتها.</p>',
            content_en: '<p>To maintain peak freshness, store your dates in airtight containers away from direct sunlight. Soft dates like Sukkari thrive in refrigeration, keeping their delicate texture intact for months.</p>',
            content_ms: '<p>Untuk mengekalkan kualiti terbaik, simpan kurma dalam bekas kedap udara di tempat yang sejuk. Kurma lembut seperti Sukkari amat digalakkan disimpan dalam peti sejuk.</p>',
            image_url: 'https://images.unsplash.com/photo-1543362906-acfc16c67564?w=800&auto=format&fit=crop&q=80',
            category: 'dates-guide', featured: 0, sort_order: 3
        },
        {
            slug: 'ajwa-vs-safawi-vs-sukkari-vs-medjool',
            title_ar: 'الفرق بين العجوة والصفاوي والسكري والمجدول',
            title_en: 'Ajwa vs Safawi vs Sukkari vs Medjool',
            title_ms: 'Perbezaan Ajwa, Safawi, Sukkari dan Medjool',
            excerpt_ar: 'مقارنة شاملة بين أشهر أربعة أصناف من التمور من حيث الشكل والقوام والنكهة.',
            excerpt_en: 'A comprehensive comparison between four renowned date varieties in texture and sweetness.',
            excerpt_ms: 'Perbandingan lengkap antara empat jenis kurma terkenal dari segi tekstur, rasa dan keunikan.',
            content_ar: '<p>تختلف أصناف التمور في مواصفاتها: العجوة داكنة وقوامها ناعم، والصفاوي أطول وشبه جاف مع حلاوة معتدلة، والسكري ذهبي ناصع ومحبب لعشاق الحلاوة، والمجدول ممتلئ وكبير الحجم بمذاق كراميلي عميق.</p>',
            content_en: '<p>Ajwa is dark and gently sweet, Safawi is chewy and elongated, Sukkari offers a melt-in-mouth golden caramel taste, and Medjool stands out for its large, plump appearance and rich indulgence.</p>',
            content_ms: '<p>Ajwa berwarna gelap dan lembut, Safawi lebih panjang dan kenyal, Sukkari manis berkrim keemasan, manakala Medjool terkenal dengan saiznya yang besar dan berisi.</p>',
            image_url: 'https://images.unsplash.com/photo-1596704017254-9b121068fb31?w=800&auto=format&fit=crop&q=80',
            category: 'types-of-dates', featured: 1, sort_order: 4
        },
        {
            slug: 'from-saudi-farms-to-your-home',
            title_ar: 'من مزارع السعودية إلى منزلك',
            title_en: 'From Saudi Farms to Your Home',
            title_ms: 'Dari Ladang Saudi ke Rumah Anda',
            excerpt_ar: 'رحلة قطف واختيار تمور MASSAR DATES بأعلى معايير الجودة حتى وصولها إليك.',
            excerpt_en: 'The farm-to-table journey of our premium Saudi dates, packed with care and utmost purity.',
            excerpt_ms: 'Perjalanan kurma MASSAR DATES dari ladang-ladang terbaik Arab Saudi terus ke kediaman anda.',
            content_ar: '<p>نحرص في MASSAR DATES على اختيار محاصيلنا مباشرة من نخيل القصيم والمدينة المنورة، لنضمن حصولك على منتج طبيعي 100% بدون أي إضافات صناعية أو سكريات مضافة.</p>',
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
        { image_url: 'https://images.unsplash.com/photo-1596704017254-9b121068fb31?w=800&auto=format&fit=crop&q=80', title_ar: 'تمر العجوة المبارك', title_en: 'Blessed Ajwa Dates', title_ms: 'Kurma Ajwa Berkat', desc_ar: 'من مزارع وبساتين المدينة المنورة الفاخرة', desc_en: 'Directly from the finest Al Madinah orchards', desc_ms: 'Terus dari ladang kurma Al Madinah terbaik', link: '#', sort_order: 1 },
        { image_url: 'https://images.unsplash.com/photo-1596850181842-29c6bd23c3c0?w=800&auto=format&fit=crop&q=80', title_ar: 'تمر السكري الذهبي', title_en: 'Golden Sukkari Dates', title_ms: 'Kurma Sukkari Keemasan', desc_ar: 'التمور الملكية ذات الحلاوة الكراميلية', desc_en: 'Royal date offering melt-in-mouth caramel taste', desc_ms: 'Kurma diraja dengan rasa karamel yang lembut', link: '#', sort_order: 2 },
        { image_url: 'https://images.unsplash.com/photo-1590846413367-c2e497e0c971?w=800&auto=format&fit=crop&q=80', title_ar: 'مزارع النخيل السعودية', title_en: 'Saudi Palm Groves', title_ms: 'Ladang Kurma Saudi', desc_ar: 'عناية فائقة وتراث سعودي أصيل في الزراعة', desc_en: 'Authentic Saudi heritage in date cultivation', desc_ms: 'Warisan asli Saudi dalam penanaman kurma', link: '#', sort_order: 3 },
        { image_url: 'https://images.unsplash.com/photo-1586375309967-6673e57e4c15?w=800&auto=format&fit=crop&q=80', title_ar: 'عناقيد التمر الطازجة', title_en: 'Fresh Date Bunches', title_ms: 'Tandan Kurma Segar', desc_ar: 'حصاد يدوي بدقة للحفاظ على جودة ونضارة الحبة', desc_en: 'Meticulously handpicked at peak ripeness', desc_ms: 'Dipetik dengan tangan untuk kesegaran maksimum', link: '#', sort_order: 4 },
        { image_url: 'https://images.unsplash.com/photo-1610276414268-22e77dc5e360?w=800&auto=format&fit=crop&q=80', title_ar: 'تمر المجدول الملكي', title_en: 'Royal Medjool Dates', title_ms: 'Kurma Medjool Diraja', desc_ar: 'ملك التمور بالحبة العريضة والمذاق الفاخر', desc_en: 'The king of dates known for size and indulgence', desc_ms: 'Raja kurma yang terkenal dengan saiz dan kelazatan', link: '#', sort_order: 5 }
    ];
    saudiDateCards.forEach(c => insertDisc.run(c));
}

module.exports = db;