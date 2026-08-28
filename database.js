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

// ØªØ¹Ø¯ÙŠÙ„ Ø¬Ø¯ÙˆÙ„ Ø§Ù„Ø±Ø³Ø§Ø¦Ù„ Ø¨Ø£Ù…Ø§Ù† ØªØ§Ù… Ù…ØªÙˆØ§ÙÙ‚ Ù…Ø¹ Ù‚ÙˆØ§Ù†ÙŠÙ† SQLite
try {
    // 0 Ù‡ÙŠ Ù‚ÙŠÙ…Ø© Ø«Ø§Ø¨ØªØ© ÙˆÙŠÙ‚Ø¨Ù„Ù‡Ø§ Ø§Ù„Ù€ SQLite ÙƒÙ‚ÙŠÙ…Ø© Ø§ÙØªØ±Ø§Ø¶ÙŠØ© Ø¹Ù†Ø¯ Ø§Ù„ØªØ¹Ø¯ÙŠÙ„
    db.prepare("ALTER TABLE messages ADD COLUMN is_read INTEGER DEFAULT 0").run();
} catch (e) {
    if (!String(e.message).includes('duplicate column name')) throw e;
}

try {
    // Ù†Ù‚ÙˆÙ… Ø¨Ø¥Ø¶Ø§ÙØ© Ø§Ù„Ø¹Ù…ÙˆØ¯ Ø¨Ø¯ÙˆÙ† Ù‚ÙŠÙ…Ø© Ø§ÙØªØ±Ø§Ø¶ÙŠØ© Ù„ØªÙØ§Ø¯ÙŠ Ø®Ø·Ø£ SQLite
    db.prepare("ALTER TABLE messages ADD COLUMN updated_at DATETIME").run();
} catch (e) {
    if (!String(e.message).includes('duplicate column name')) throw e;
}

// Seed default admin if none exists
const adminCount = db.prepare('SELECT COUNT(*) as count FROM admin_users').get();
if (adminCount.count === 0) {
    const hash = bcrypt.hashSync('Admin@2024', 10);
    db.prepare('INSERT INTO admin_users (email, password) VALUES (?, ?)').run('admin@massardates.com', hash);
    console.log('âœ… Default admin created: admin@massardates.com / Admin@2024');
}

// Seed default config if empty
const configCount = db.prepare('SELECT COUNT(*) as count FROM site_config').get();
if (configCount.count === 0) {
    const defaults = {
        logo_text: 'MASSAR DATES',
        logo_tagline_en: 'Premium Saudi Dates',
        logo_tagline_ar: 'ØªÙ…ÙˆØ± Ø³Ø¹ÙˆØ¯ÙŠØ© ÙØ§Ø®Ø±Ø©',
        logo_tagline_ms: 'Kurma Saudi Premium',
        seo_title: 'MASSAR DATES | Premium Saudi Dates',
        seo_desc: 'MASSAR DATES - Premium Saudi Dates. Shop the finest Ajwa, Safawi, Sukkari, Medjool, and Mariami dates.',
        hero_badge_en: 'Premium Quality From Saudi Arabia',
        hero_badge_ar: 'Ø¬ÙˆØ¯Ø© ÙØ§Ø®Ø±Ø© Ù…Ù† Ø§Ù„Ù…Ù…Ù„ÙƒØ© Ø§Ù„Ø¹Ø±Ø¨ÙŠØ© Ø§Ù„Ø³Ø¹ÙˆØ¯ÙŠØ©',
        hero_badge_ms: 'Kualiti Premium Dari Arab Saudi',
        hero_title_en: 'The Finest Saudi Dates Delivered to You',
        hero_title_ar: 'Ø£ÙØ¶Ù„ Ø§Ù„ØªÙ…ÙˆØ± Ø§Ù„Ø³Ø¹ÙˆØ¯ÙŠØ© ØªØµÙ„ Ø¥Ù„ÙŠÙƒ',
        hero_title_ms: 'Kurma Saudi Terbaik Untuk Anda',
        hero_desc_en: 'Discover our handpicked selection of premium dates, sourced directly from the finest farms of Saudi Arabia. Pure, natural, and exquisitely delicious.',
        hero_desc_ar: 'Ø§ÙƒØªØ´Ù Ù…Ø¬Ù…ÙˆØ¹ØªÙ†Ø§ Ø§Ù„Ù…Ø®ØªØ§Ø±Ø© Ø¨Ø¹Ù†Ø§ÙŠØ© Ù…Ù† Ø§Ù„ØªÙ…ÙˆØ± Ø§Ù„ÙØ§Ø®Ø±Ø© Ù…Ù† Ø£ÙØ¶Ù„ Ù…Ø²Ø§Ø±Ø¹ Ø§Ù„Ù…Ù…Ù„ÙƒØ© Ø§Ù„Ø¹Ø±Ø¨ÙŠØ© Ø§Ù„Ø³Ø¹ÙˆØ¯ÙŠØ©.',
        hero_desc_ms: 'Temui koleksi kurma premium pilihan kami dari ladang terbaik di Arab Saudi.',
        hero_img: '',
        about_title_en: 'A Passion for Premium Dates',
        about_title_ar: 'Ø´ØºÙ Ø¨Ø§Ù„ØªÙ…ÙˆØ± Ø§Ù„ÙØ§Ø®Ø±Ø©',
        about_title_ms: 'Keghairahan Terhadap Kurma Premium',
        about_text_en: 'MASSAR DATES brings the finest premium dates from Saudi Arabia directly to you. We are dedicated to sourcing the highest quality dates, ensuring every piece meets our exacting standards of taste, freshness, and purity. From the blessed farms of Al Madinah to the lush orchards of Al-Qassim, each date variety tells a story of heritage, tradition, and uncompromising quality.',
        about_text_ar: 'Ù…Ø³Ø§Ø± Ù„Ù„ØªÙ…ÙˆØ± ØªÙ‚Ø¯Ù… Ø£Ø¬ÙˆØ¯ Ø§Ù„ØªÙ…ÙˆØ± Ø§Ù„ÙØ§Ø®Ø±Ø© Ù…Ù† Ø§Ù„Ù…Ù…Ù„ÙƒØ© Ø§Ù„Ø¹Ø±Ø¨ÙŠØ© Ø§Ù„Ø³Ø¹ÙˆØ¯ÙŠØ© Ù…Ø¨Ø§Ø´Ø±Ø© Ø¥Ù„ÙŠÙƒ. Ù†Ø­Ù† Ù…Ù„ØªØ²Ù…ÙˆÙ† Ø¨ØªÙˆÙÙŠØ± Ø£Ø¹Ù„Ù‰ Ø¬ÙˆØ¯Ø© Ù…Ù† Ø§Ù„ØªÙ…ÙˆØ±.',
        about_text_ms: 'MASSAR DATES membawa kurma premium terbaik dari Arab Saudi terus kepada anda.',
        detail_tab_en: 'Our premium dates are carefully handpicked from the finest farms in Saudi Arabia. Each date is selected for its quality, size, and taste. 100% natural with no added sugar, no preservatives, and no artificial flavoring. Rich in natural fiber, potassium, and magnesium.',
        detail_tab_ar: 'ÙŠØªÙ… Ù‚Ø·Ù ØªÙ…ÙˆØ±Ù†Ø§ Ø§Ù„ÙØ§Ø®Ø±Ø© Ø¨Ø¹Ù†Ø§ÙŠØ© Ù…Ù† Ø£ÙØ¶Ù„ Ø§Ù„Ù…Ø²Ø§Ø±Ø¹ ÙÙŠ Ø§Ù„Ù…Ù…Ù„ÙƒØ© Ø§Ù„Ø¹Ø±Ø¨ÙŠØ© Ø§Ù„Ø³Ø¹ÙˆØ¯ÙŠØ©. Ø·Ø¨ÙŠØ¹ÙŠØ© 100% Ø¨Ø¯ÙˆÙ† Ø¥Ø¶Ø§ÙØ§Øª.',
        detail_tab_ms: 'Kurma premium kami dipetik dengan teliti dari ladang terbaik di Arab Saudi. 100% semulajadi tanpa bahan tambahan.',
        ship_tab_en: 'We offer nationwide delivery across Malaysia. Orders are processed and shipped within 1â€“3 business days. Shipping rates may vary depending on your location. Contact us via WhatsApp for specific inquiries.',
        ship_tab_ar: 'Ù†Ù‚Ø¯Ù… ØªÙˆØµÙŠÙ„Ø§Ù‹ ÙÙŠ Ø¬Ù…ÙŠØ¹ Ø£Ù†Ø­Ø§Ø¡ Ù…Ø§Ù„ÙŠØ²ÙŠØ§. ØªØªÙ… Ù…Ø¹Ø§Ù„Ø¬Ø© Ø§Ù„Ø·Ù„Ø¨Ø§Øª Ø®Ù„Ø§Ù„ 1-3 Ø£ÙŠØ§Ù… Ø¹Ù…Ù„.',
        ship_tab_ms: 'Kami menawarkan penghantaran ke seluruh Malaysia. Pesanan diproses dalam 1â€“3 hari perniagaan.',
        stor_tab_en: 'Store in a cool, dry place away from direct sunlight. For extended freshness, refrigerate after opening. Can be frozen for long-term storage. Keep packaging sealed when not in use.',
        stor_tab_ar: 'ÙŠÙØ­ÙØ¸ ÙÙŠ Ù…ÙƒØ§Ù† Ø¨Ø§Ø±Ø¯ ÙˆØ¬Ø§Ù Ø¨Ø¹ÙŠØ¯Ø§Ù‹ Ø¹Ù† Ø£Ø´Ø¹Ø© Ø§Ù„Ø´Ù…Ø³ Ø§Ù„Ù…Ø¨Ø§Ø´Ø±Ø©. ÙŠÙØ¨Ø±Ø¯ Ø¨Ø¹Ø¯ Ø§Ù„ÙØªØ­.',
        stor_tab_ms: 'Simpan di tempat sejuk dan kering. Sejukkan selepas dibuka untuk kesegaran yang lebih lama.',
        ret_tab_en: 'We want you to be completely satisfied. If you receive a damaged or incorrect product, contact us within 48 hours of delivery. Due to the perishable nature of our products, we cannot accept returns for change of mind.',
        ret_tab_ar: 'Ù†Ø±ÙŠØ¯Ùƒ Ø£Ù† ØªÙƒÙˆÙ† Ø±Ø§Ø¶ÙŠØ§Ù‹ ØªÙ…Ø§Ù…Ø§Ù‹. Ø¥Ø°Ø§ ØªÙ„Ù‚ÙŠØª Ù…Ù†ØªØ¬Ø§Ù‹ ØªØ§Ù„ÙØ§Ù‹ØŒ Ø§ØªØµÙ„ Ø¨Ù†Ø§ Ø®Ù„Ø§Ù„ 48 Ø³Ø§Ø¹Ø©.',
        ret_tab_ms: 'Kami mahu anda berpuas hati sepenuhnya. Hubungi kami dalam 48 jam jika produk rosak.',
        link_tiktok: 'https://www.tiktok.com',
        link_shopee: 'https://shopee.com.my/',
        link_lazada: 'https://www.lazada.com.my/',
        link_whatsapp: '601111134716',
        contact_email: 'info@massardates.com',
        contact_location_en: 'Kuala Lumpur, Malaysia',
        contact_location_ar: 'ÙƒÙˆØ§Ù„Ø§Ù„Ù…Ø¨ÙˆØ±ØŒ Ù…Ø§Ù„ÙŠØ²ÙŠØ§',
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
    console.log('âœ… Default site configuration created');
}

// Seed default products if empty
const prodCount = db.prepare('SELECT COUNT(*) as count FROM products').get();
if (prodCount.count === 0) {
    const products = [
        {
            slug: 'ajwa', name_en: 'Premium Ajwa Dates â€“ Al Madinah',
            name_ar: 'ØªÙ…Ø± Ø¹Ø¬ÙˆØ© ÙØ§Ø®Ø± â€“ Ø§Ù„Ù…Ø¯ÙŠÙ†Ø© Ø§Ù„Ù…Ù†ÙˆØ±Ø©', name_ms: 'Kurma Ajwa Premium â€“ Al Madinah',
            desc_en: 'The prized Ajwa date from Al Madinah, known for its rich, dark colour and distinctively soft, sweet flavour.',
            desc_ar: 'ØªÙ…Ø± Ø§Ù„Ø¹Ø¬ÙˆØ© Ø§Ù„Ø«Ù…ÙŠÙ† Ù…Ù† Ø§Ù„Ù…Ø¯ÙŠÙ†Ø© Ø§Ù„Ù…Ù†ÙˆØ±Ø©ØŒ Ø§Ù„Ù…Ø¹Ø±ÙˆÙ Ø¨Ù„ÙˆÙ†Ù‡ Ø§Ù„Ø¯Ø§ÙƒÙ† ÙˆÙ†ÙƒÙ‡ØªÙ‡ Ø§Ù„Ø­Ù„ÙˆØ©.',
            desc_ms: 'Kurma Ajwa dari Al Madinah dengan warna gelap dan rasa manis yang lembut.',
            variety: 'Al Madinah', type: 'Ajwa',
            texture_en: 'Soft & Chewy', texture_ar: 'Ù†Ø§Ø¹Ù… ÙˆÙ…Ø·Ø§Ø·ÙŠ', texture_ms: 'Lembut & Kenyal',
            taste_en: 'Rich & Sweet', taste_ar: 'ØºÙ†ÙŠ ÙˆØ­Ù„Ùˆ', taste_ms: 'Kaya & Manis',
            badge_en: 'Best Seller', badge_ar: 'Ø§Ù„Ø£ÙƒØ«Ø± Ù…Ø¨ÙŠØ¹Ø§Ù‹', badge_ms: 'Terlaris',
            prices: { '100g': 25, '250g': 55, '500g': 95, '1kg': 180, '3kg': 500, '5kg': 800 }
        },
        {
            slug: 'safawi', name_en: 'Premium Safawi Dates',
            name_ar: 'ØªÙ…Ø± ØµÙØ§ÙˆÙŠ ÙØ§Ø®Ø±', name_ms: 'Kurma Safawi Premium',
            desc_en: 'A semi-dry date with a deep, dark appearance and mildly sweet taste with satisfying chewy texture.',
            desc_ar: 'ØªÙ…Ø± Ø´Ø¨Ù‡ Ø¬Ø§Ù Ø¨Ù…Ø¸Ù‡Ø± Ø¯Ø§ÙƒÙ† ÙˆØ·Ø¹Ù… Ø­Ù„Ùˆ Ù…Ø¹ØªØ¯Ù„.',
            desc_ms: 'Kurma separuh kering dengan rupa gelap dan rasa manis sederhana.',
            variety: 'Al Madinah', type: 'Safawi',
            texture_en: 'Semi-Dry & Chewy', texture_ar: 'Ø´Ø¨Ù‡ Ø¬Ø§Ù ÙˆÙ…Ø·Ø§Ø·ÙŠ', texture_ms: 'Separuh Kering & Kenyal',
            taste_en: 'Mildly Sweet', taste_ar: 'Ø­Ù„Ùˆ Ù…Ø¹ØªØ¯Ù„', taste_ms: 'Manis Sederhana',
            badge_en: 'Popular', badge_ar: 'Ø±Ø§Ø¦Ø¬', badge_ms: 'Popular',
            prices: { '100g': 18, '250g': 40, '500g': 70, '1kg': 130, '3kg': 360, '5kg': 580 }
        },
        {
            slug: 'sukkari', name_en: 'Premium Sukkari Dates',
            name_ar: 'ØªÙ…Ø± Ø³ÙƒØ±ÙŠ ÙØ§Ø®Ø±', name_ms: 'Kurma Sukkari Premium',
            desc_en: 'Known as the Royal Date, offering caramel-like sweetness with golden, delicate skin and soft flesh.',
            desc_ar: 'Ø§Ù„ØªÙ…Ø± Ø§Ù„Ù…Ù„ÙƒÙŠ Ø¨Ø­Ù„Ø§ÙˆØ© Ø§Ù„ÙƒØ±Ø§Ù…ÙŠÙ„ ÙˆØ§Ù„Ù‚Ø´Ø±Ø© Ø§Ù„Ø°Ù‡Ø¨ÙŠØ©.',
            desc_ms: 'Kurma Diraja dengan kemanisan karamel dan kulit emas.',
            variety: 'Al-Qassim', type: 'Sukkari',
            texture_en: 'Soft & Delicate', texture_ar: 'Ù†Ø§Ø¹Ù… ÙˆØ±Ù‚ÙŠÙ‚', texture_ms: 'Lembut & Halus',
            taste_en: 'Caramel-like', taste_ar: 'ÙƒØ±Ø§Ù…ÙŠÙ„', taste_ms: 'Seperti Karamel',
            badge_en: 'Premium', badge_ar: 'ÙØ§Ø®Ø±', badge_ms: 'Premium',
            prices: { '100g': 15, '250g': 35, '500g': 60, '1kg': 110, '3kg': 300, '5kg': 480 }
        },
        {
            slug: 'medjool', name_en: 'Premium Medjool Dates',
            name_ar: 'ØªÙ…Ø± Ù…Ø¬Ø¯ÙˆÙ„ ÙØ§Ø®Ø±', name_ms: 'Kurma Medjool Premium',
            desc_en: 'The King of Dates â€” large, plump, and incredibly sweet with luscious caramel flavour.',
            desc_ar: 'Ù…Ù„Ùƒ Ø§Ù„ØªÙ…ÙˆØ± â€” ÙƒØ¨ÙŠØ± ÙˆÙ…Ù…ØªÙ„Ø¦ ÙˆØ­Ù„Ùˆ Ø¨Ø´ÙƒÙ„ Ù„Ø§ ÙŠØµØ¯Ù‚.',
            desc_ms: 'Raja Kurma â€” besar, montok, dan sangat manis.',
            variety: 'Saudi Arabia', type: 'Medjool',
            texture_en: 'Soft & Plump', texture_ar: 'Ù†Ø§Ø¹Ù… ÙˆÙ…Ù…ØªÙ„Ø¦', texture_ms: 'Lembut & Montok',
            taste_en: 'Rich Caramel', taste_ar: 'ÙƒØ±Ø§Ù…ÙŠÙ„ ØºÙ†ÙŠ', taste_ms: 'Karamel Kaya',
            badge_en: 'King of Dates', badge_ar: 'Ù…Ù„Ùƒ Ø§Ù„ØªÙ…ÙˆØ±', badge_ms: 'Raja Kurma',
            prices: { '100g': 28, '250g': 65, '500g': 110, '1kg': 200, '3kg': 560, '5kg': 900 }
        },
        {
            slug: 'mariami', name_en: 'Premium Mariami Dates',
            name_ar: 'ØªÙ…Ø± Ù…Ø±ÙŠÙ…ÙŠ ÙØ§Ø®Ø±', name_ms: 'Kurma Mariami Premium',
            desc_en: 'A luxurious semi-dry date with beautifully wrinkled skin, balanced sweetness and nutty undertone.',
            desc_ar: 'ØªÙ…Ø± Ø´Ø¨Ù‡ Ø¬Ø§Ù ÙØ§Ø®Ø± Ø¨Ù‚Ø´Ø±Ø© Ù…ØªØ¬Ø¹Ø¯Ø© ÙˆØ­Ù„Ø§ÙˆØ© Ù…ØªÙˆØ§Ø²Ù†Ø©.',
            desc_ms: 'Kurma separuh kering mewah dengan kulit berkedut dan kemanisan seimbang.',
            variety: 'Saudi Arabia', type: 'Mariami',
            texture_en: 'Semi-Dry & Firm', texture_ar: 'Ø´Ø¨Ù‡ Ø¬Ø§Ù ÙˆÙ…ØªÙ…Ø§Ø³Ùƒ', texture_ms: 'Separuh Kering & Pejal',
            taste_en: 'Balanced & Nutty', taste_ar: 'Ù…ØªÙˆØ§Ø²Ù† ÙˆØ¬ÙˆØ²ÙŠ', taste_ms: 'Seimbang & Berkacang',
            badge_en: 'Exotic', badge_ar: 'Ù†Ø§Ø¯Ø±', badge_ms: 'Eksotik',
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
    console.log('âœ… Default products seeded');
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
            title_ar: 'ØªÙ…Ø± Ø§Ù„Ø¹Ø¬ÙˆØ© Ù…Ù† Ø§Ù„Ù…Ø¯ÙŠÙ†Ø© Ø§Ù„Ù…Ù†ÙˆØ±Ø©: Ù…Ø§ Ø§Ù„Ø°ÙŠ ÙŠÙ…ÙŠØ²Ù‡ØŸ',
            title_en: 'Ajwa Dates from Al Madinah: What Makes Them Special?',
            title_ms: 'Kurma Ajwa dari Al Madinah: Apa yang Menjadikannya Istimewa?',
            excerpt_ar: 'Ø§ÙƒØªØ´Ù Ø³Ø± ØªÙ…Ø± Ø§Ù„Ø¹Ø¬ÙˆØ© Ø§Ù„Ù…Ø¨Ø§Ø±Ùƒ Ù…Ù† Ø¨Ø³Ø§ØªÙŠÙ† Ø§Ù„Ù…Ø¯ÙŠÙ†Ø© Ø§Ù„Ù…Ù†ÙˆØ±Ø©ØŒ ÙˆÙÙˆØ§Ø¦Ø¯Ù‡ Ø§Ù„ØµØ­ÙŠØ© ÙˆÙ‚ÙŠÙ…ØªÙ‡ Ø§Ù„ØªØ§Ø±ÙŠØ®ÙŠØ©.',
            excerpt_en: 'Discover the heritage and unique health benefits of the revered Ajwa dates from Al Madinah.',
            excerpt_ms: 'Ketahui keistimewaan dan khasiat kurma Ajwa barakah yang berasal dari kota suci Madinah.',
            content_ar: '<p>ÙŠØ¹ØªØ¨Ø± ØªÙ…Ø± Ø§Ù„Ø¹Ø¬ÙˆØ© Ù…Ù† Ø£Ø±Ù‚Ù‰ ÙˆØ£Ø«Ù…Ù† Ø£Ù†ÙˆØ§Ø¹ Ø§Ù„ØªÙ…ÙˆØ± Ø§Ù„Ø³Ø¹ÙˆØ¯ÙŠØ©ØŒ ÙˆÙ„Ù‡ Ù…ÙƒØ§Ù†Ø© Ø®Ø§ØµØ© ÙÙŠ Ø§Ù„ØªØ±Ø§Ø« Ø§Ù„Ø¥Ø³Ù„Ø§Ù…ÙŠ. ÙŠØªÙ…ÙŠØ² Ø¨Ø­Ø¨ØªÙ‡ Ø§Ù„Ø¯Ø§ÙƒÙ†Ø© Ø°Ø§Øª Ø§Ù„Ø®Ø·ÙˆØ· Ø§Ù„Ø¯Ù‚ÙŠÙ‚Ø© ÙˆÙ…Ù„Ù…Ø³Ù‡ Ø§Ù„Ù†Ø§Ø¹Ù… ÙˆØ­Ù„Ø§ÙˆØªÙ‡ Ø§Ù„Ù…ØªÙˆØ§Ø²Ù†Ø© ØºÙŠØ± Ø§Ù„Ù…ÙØ±Ø·Ø©.</p><p>ØªÙØ²Ø±Ø¹ Ø§Ù„Ø¹Ø¬ÙˆØ© ÙÙŠ Ø§Ù„Ù…Ø¯ÙŠÙ†Ø© Ø§Ù„Ù…Ù†ÙˆØ±Ø© Ø§Ù„Ù…Ø¨Ø§Ø±ÙƒØ© ØªØ­Øª Ø±Ø¹Ø§ÙŠØ© Ø®Ø§ØµØ© Ù„Ø¶Ù…Ø§Ù† Ø§Ù„Ø­ØµÙˆÙ„ Ø¹Ù„Ù‰ Ø£Ø¹Ù„Ù‰ Ø¯Ø±Ø¬Ø§Øª Ø§Ù„Ø¬ÙˆØ¯Ø© ÙˆØ§Ù„Ù†Ø¶Ø§Ø±Ø© Ø§Ù„ØºÙ†ÙŠØ© Ø¨Ø§Ù„Ù…Ø¹Ø§Ø¯Ù† ÙˆØ§Ù„Ø£Ù„ÙŠØ§Ù Ø§Ù„Ø·Ø¨ÙŠØ¹ÙŠØ©.</p>',
            content_en: '<p>Ajwa dates are among the most revered varieties in the world, celebrated for their unique soft texture, dark shade with fine white lines, and delightful, subtle sweetness.</p><p>Harvested directly from Al Madinah orchards, our Ajwa dates embody centuries of heritage, providing high nutritional value and natural antioxidants.</p>',
            content_ms: '<p>Kurma Ajwa adalah salah satu jenis kurma paling istimewa di dunia, terkenal dengan teksturnya yang lembut, warnanya yang gelap dan kemanisan yang sederhana.</p><p>Dituai terus dari kebun Madinah, kurma ini kaya dengan antioksidan dan mineral penting untuk tenaga sepanjang hari.</p>',
            image_url: 'https://images.unsplash.com/photo-1596704017254-9b121068fb31?w=800&auto=format&fit=crop&q=80',
            category: 'types-of-dates', featured: 1, sort_order: 1
        },
        {
            slug: 'guide-choosing-saudi-dates',
            title_ar: 'Ø¯Ù„ÙŠÙ„ Ø§Ø®ØªÙŠØ§Ø± Ø§Ù„ØªÙ…ÙˆØ± Ø§Ù„Ø³Ø¹ÙˆØ¯ÙŠØ© Ø§Ù„Ù…Ù†Ø§Ø³Ø¨Ø©',
            title_en: 'Guide to Choosing the Right Saudi Dates',
            title_ms: 'Panduan Memilih Kurma Saudi yang Sesuai',
            excerpt_ar: 'ÙƒÙŠÙ ØªØ®ØªØ§Ø± Ù†ÙˆØ¹ Ø§Ù„ØªÙ…Ø± Ø§Ù„Ù…Ù†Ø§Ø³Ø¨ Ù„Ø°ÙˆÙ‚Ùƒ ÙˆØ§Ø­ØªÙŠØ§Ø¬Ùƒ Ø§Ù„ÙŠÙˆÙ…ÙŠ Ù…Ù† Ø¨ÙŠÙ† Ø£Ø´Ù‡Ø± Ø§Ù„ØªÙ…ÙˆØ± Ø§Ù„Ø³Ø¹ÙˆØ¯ÙŠØ©ØŸ',
            excerpt_en: 'Learn how to select the best Saudi dates matching your personal taste and dietary preference.',
            excerpt_ms: 'Ketahui cara memilih kurma Saudi yang paling sesuai dengan citarasa dan keperluan harian anda.',
            content_ar: '<p>ØªØªÙ†ÙˆØ¹ Ø§Ù„ØªÙ…ÙˆØ± Ø§Ù„Ø³Ø¹ÙˆØ¯ÙŠØ© ÙÙŠ Ø¯Ø±Ø¬Ø§Øª Ø§Ù„Ø­Ù„Ø§ÙˆØ© ÙˆØ§Ù„Ù‚ÙˆØ§Ù… ÙˆØ§Ù„Ø±Ø·ÙˆØ¨Ø©. Ø¥Ø°Ø§ ÙƒÙ†Øª ØªÙØ¶Ù„ Ø§Ù„ØªÙ…ÙˆØ± Ø§Ù„Ù„ÙŠÙ†Ø© Ø°Ø§Øª Ø§Ù„Ø­Ù„Ø§ÙˆØ© Ø§Ù„ÙƒØ±Ø§Ù…ÙŠÙ„ÙŠØ© Ø§Ù„ÙØ§Ø®Ø±Ø© ÙØ¥Ù† Ø§Ù„Ø³ÙƒØ±ÙŠ Ù‡Ùˆ Ø®ÙŠØ§Ø±Ùƒ Ø§Ù„Ø£Ù†Ø³Ø¨ØŒ Ø¨ÙŠÙ†Ù…Ø§ ÙŠØªÙ…ÙŠØ² Ø§Ù„ØµÙØ§ÙˆÙŠ Ø¨Ù‚ÙˆØ§Ù…Ù‡ Ø´Ø¨Ù‡ Ø§Ù„Ø¬Ø§Ù ÙˆØ­Ù„Ø§ÙˆØªÙ‡ Ø§Ù„Ø®ÙÙŠÙØ©.</p>',
            content_en: '<p>Saudi dates offer an extensive range of textures and flavor profiles. From the caramel tenderness of Sukkari to the rich chewiness of Safawi, there is an ideal date for every palate.</p>',
            content_ms: '<p>Kurma Saudi mempunyai kepelbagaian rasa dan tekstur yang unik. Dari kelazatan rasa karamel Sukkari hingga kepada tekstur kenyal Safawi, terdapat kurma yang sempurna untuk setiap orang.</p>',
            image_url: 'https://images.unsplash.com/photo-1508615039623-a25605d2b022?w=800&auto=format&fit=crop&q=80',
            category: 'dates-guide', featured: 0, sort_order: 2
        },
        {
            slug: 'how-to-keep-dates-fresh',
            title_ar: 'ÙƒÙŠÙ ØªØ­Ø§ÙØ¸ Ø¹Ù„Ù‰ Ø§Ù„ØªÙ…ÙˆØ± Ø·Ø§Ø²Ø¬Ø©ØŸ',
            title_en: 'How to Keep Dates Fresh',
            title_ms: 'Cara Mengekalkan Kesegaran Kurma',
            excerpt_ar: 'Ø·Ø±Ù‚ ÙˆÙ†ØµØ§Ø¦Ø­ Ø¹Ù…Ù„ÙŠØ© Ù„Ø­ÙØ¸ Ø§Ù„ØªÙ…ÙˆØ± Ù„ÙØªØ±Ø§Øª Ø·ÙˆÙŠÙ„Ø© Ù…Ø¹ Ø§Ù„Ø­ÙØ§Ø¸ Ø¹Ù„Ù‰ Ø·Ø¹Ù…Ù‡Ø§ ÙˆØ±Ø·ÙˆØ¨ØªÙ‡Ø§ Ø§Ù„Ø£ØµÙ„ÙŠØ©.',
            excerpt_en: 'Essential tips for storing and keeping your dates fresh, flavorful, and moist over time.',
            excerpt_ms: 'Tips penting penyimpanan untuk memastikan kurma anda kekal segar, lembut dan berkualiti.',
            content_ar: '<p>Ù„Ù„Ø­ÙØ§Ø¸ Ø¹Ù„Ù‰ Ø¬ÙˆØ¯Ø© Ø§Ù„ØªÙ…Ø±ØŒ ÙŠÙÙ†ØµØ­ Ø¨ØªØ®Ø²ÙŠÙ†Ù‡ ÙÙŠ ÙˆØ¹Ø§Ø¡ Ù…Ø­ÙƒÙ… Ø§Ù„Ø¥ØºÙ„Ø§Ù‚ ÙÙŠ Ù…ÙƒØ§Ù† Ø¨Ø§Ø±Ø¯ ÙˆØ¬Ø§Ù. Ù„Ù„Ø§Ø³ØªØ®Ø¯Ø§Ù… Ø§Ù„ÙŠÙˆÙ…ÙŠ ØªÙƒÙÙŠ Ø¯Ø±Ø¬Ø© Ø­Ø±Ø§Ø±Ø© Ø§Ù„ØºØ±ÙØ© Ø§Ù„Ù…Ø¹ØªØ¯Ù„Ø©ØŒ Ø¨ÙŠÙ†Ù…Ø§ ÙŠÙÙØ¶Ù„ ÙˆØ¶Ø¹ Ø§Ù„ØªÙ…ÙˆØ± Ø§Ù„Ø±Ø·Ø¨Ø© Ù…Ø«Ù„ Ø§Ù„Ø³ÙƒØ±ÙŠ ÙÙŠ Ø§Ù„Ø«Ù„Ø§Ø¬Ø© Ù„Ù„Ø­ÙØ§Ø¸ Ø¹Ù„Ù‰ Ù†Ø¶Ø§Ø±ØªÙ‡Ø§.</p>',
            content_en: '<p>To maintain peak freshness, store your dates in airtight containers away from direct sunlight. Soft dates like Sukkari thrive in refrigeration, keeping their delicate texture intact for months.</p>',
            content_ms: '<p>Untuk mengekalkan kualiti terbaik, simpan kurma dalam bekas kedap udara di tempat yang sejuk. Kurma lembut seperti Sukkari amat digalakkan disimpan dalam peti sejuk.</p>',
            image_url: 'https://images.unsplash.com/photo-1543362906-acfc16c67564?w=800&auto=format&fit=crop&q=80',
            category: 'dates-guide', featured: 0, sort_order: 3
        },
        {
            slug: 'ajwa-vs-safawi-vs-sukkari-vs-medjool',
            title_ar: 'Ø§Ù„ÙØ±Ù‚ Ø¨ÙŠÙ† Ø§Ù„Ø¹Ø¬ÙˆØ© ÙˆØ§Ù„ØµÙØ§ÙˆÙŠ ÙˆØ§Ù„Ø³ÙƒØ±ÙŠ ÙˆØ§Ù„Ù…Ø¬Ø¯ÙˆÙ„',
            title_en: 'Ajwa vs Safawi vs Sukkari vs Medjool',
            title_ms: 'Perbezaan Ajwa, Safawi, Sukkari dan Medjool',
            excerpt_ar: 'Ù…Ù‚Ø§Ø±Ù†Ø© Ø´Ø§Ù…Ù„Ø© Ø¨ÙŠÙ† Ø£Ø´Ù‡Ø± Ø£Ø±Ø¨Ø¹Ø© Ø£ØµÙ†Ø§Ù Ù…Ù† Ø§Ù„ØªÙ…ÙˆØ± Ù…Ù† Ø­ÙŠØ« Ø§Ù„Ø´ÙƒÙ„ ÙˆØ§Ù„Ù‚ÙˆØ§Ù… ÙˆØ§Ù„Ù†ÙƒÙ‡Ø©.',
            excerpt_en: 'A comprehensive comparison between four renowned date varieties in texture and sweetness.',
            excerpt_ms: 'Perbandingan lengkap antara empat jenis kurma terkenal dari segi tekstur, rasa dan keunikan.',
            content_ar: '<p>ØªØ®ØªÙ„Ù Ø£ØµÙ†Ø§Ù Ø§Ù„ØªÙ…ÙˆØ± ÙÙŠ Ù…ÙˆØ§ØµÙØ§ØªÙ‡Ø§: Ø§Ù„Ø¹Ø¬ÙˆØ© Ø¯Ø§ÙƒÙ†Ø© ÙˆÙ‚ÙˆØ§Ù…Ù‡Ø§ Ù†Ø§Ø¹Ù…ØŒ ÙˆØ§Ù„ØµÙØ§ÙˆÙŠ Ø£Ø·ÙˆÙ„ ÙˆØ´Ø¨Ù‡ Ø¬Ø§Ù Ù…Ø¹ Ø­Ù„Ø§ÙˆØ© Ù…Ø¹ØªØ¯Ù„Ø©ØŒ ÙˆØ§Ù„Ø³ÙƒØ±ÙŠ Ø°Ù‡Ø¨ÙŠ Ù†Ø§ØµØ¹ ÙˆÙ…Ø­Ø¨Ø¨ Ù„Ø¹Ø´Ø§Ù‚ Ø§Ù„Ø­Ù„Ø§ÙˆØ©ØŒ ÙˆØ§Ù„Ù…Ø¬Ø¯ÙˆÙ„ Ù…Ù…ØªÙ„Ø¦ ÙˆÙƒØ¨ÙŠØ± Ø§Ù„Ø­Ø¬Ù… Ø¨Ù…Ø°Ø§Ù‚ ÙƒØ±Ø§Ù…ÙŠÙ„ÙŠ Ø¹Ù…ÙŠÙ‚.</p>',
            content_en: '<p>Ajwa is dark and gently sweet, Safawi is chewy and elongated, Sukkari offers a melt-in-mouth golden caramel taste, and Medjool stands out for its large, plump appearance and rich indulgence.</p>',
            content_ms: '<p>Ajwa berwarna gelap dan lembut, Safawi lebih panjang dan kenyal, Sukkari manis berkrim keemasan, manakala Medjool terkenal dengan saiznya yang besar dan berisi.</p>',
            image_url: 'https://images.unsplash.com/photo-1596704017254-9b121068fb31?w=800&auto=format&fit=crop&q=80',
            category: 'types-of-dates', featured: 1, sort_order: 4
        },
        {
            slug: 'from-saudi-farms-to-your-home',
            title_ar: 'Ù…Ù† Ù…Ø²Ø§Ø±Ø¹ Ø§Ù„Ø³Ø¹ÙˆØ¯ÙŠØ© Ø¥Ù„Ù‰ Ù…Ù†Ø²Ù„Ùƒ',
            title_en: 'From Saudi Farms to Your Home',
            title_ms: 'Dari Ladang Saudi ke Rumah Anda',
            excerpt_ar: 'Ø±Ø­Ù„Ø© Ù‚Ø·Ù ÙˆØ§Ø®ØªÙŠØ§Ø± ØªÙ…ÙˆØ± MASSAR DATES Ø¨Ø£Ø¹Ù„Ù‰ Ù…Ø¹Ø§ÙŠÙŠØ± Ø§Ù„Ø¬ÙˆØ¯Ø© Ø­ØªÙ‰ ÙˆØµÙˆÙ„Ù‡Ø§ Ø¥Ù„ÙŠÙƒ.',
            excerpt_en: 'The farm-to-table journey of our premium Saudi dates, packed with care and utmost purity.',
            excerpt_ms: 'Perjalanan kurma MASSAR DATES dari ladang-ladang terbaik Arab Saudi terus ke kediaman anda.',
            content_ar: '<p>Ù†Ø­Ø±Øµ ÙÙŠ MASSAR DATES Ø¹Ù„Ù‰ Ø§Ø®ØªÙŠØ§Ø± Ù…Ø­Ø§ØµÙŠÙ„Ù†Ø§ Ù…Ø¨Ø§Ø´Ø±Ø© Ù…Ù† Ù†Ø®ÙŠÙ„ Ø§Ù„Ù‚ØµÙŠÙ… ÙˆØ§Ù„Ù…Ø¯ÙŠÙ†Ø© Ø§Ù„Ù…Ù†ÙˆØ±Ø©ØŒ Ù„Ù†Ø¶Ù…Ù† Ø­ØµÙˆÙ„Ùƒ Ø¹Ù„Ù‰ Ù…Ù†ØªØ¬ Ø·Ø¨ÙŠØ¹ÙŠ 100% Ø¨Ø¯ÙˆÙ† Ø£ÙŠ Ø¥Ø¶Ø§ÙØ§Øª ØµÙ†Ø§Ø¹ÙŠØ© Ø£Ùˆ Ø³ÙƒØ±ÙŠØ§Øª Ù…Ø¶Ø§ÙØ©.</p>',
            content_en: '<p>At MASSAR DATES, we partner directly with trusted farms in Al-Qassim and Al Madinah to deliver uncompromised quality, 100% natural and freshly packed dates directly to you.</p>',
            content_ms: '<p>Kami bekerjasama secara langsung dengan ladang terpilih di Madinah dan Qassim untuk memastikan anda menerima kurma asli 100% berkualiti tinggi tanpa bahan pengawet.</p>',
            image_url: 'https://images.unsplash.com/photo-1508615039623-a25605d2b022?w=800&auto=format&fit=crop&q=80',
            category: 'saudi-farms', featured: 0, sort_order: 5
        }
    ];
    initialPosts.forEach(p => insertBlog.run(p));
}

/* Sync current blog content so fresh Render databases receive all posts */
const blogSeed = require('./blog-seed.json');

const updateBlogSeed = db.prepare(`
    UPDATE blog_posts SET
        title_ar=@title_ar,
        title_en=@title_en,
        title_ms=@title_ms,
        excerpt_ar=@excerpt_ar,
        excerpt_en=@excerpt_en,
        excerpt_ms=@excerpt_ms,
        content_ar=@content_ar,
        content_en=@content_en,
        content_ms=@content_ms,
        image_url=@image_url,
        category=@category,
        published=@published,
        featured=@featured,
        sort_order=@sort_order,
        updated_at=CURRENT_TIMESTAMP
    WHERE slug=@slug
`);

const insertBlogSeed = db.prepare(`
    INSERT INTO blog_posts (
        slug,title_ar,title_en,title_ms,
        excerpt_ar,excerpt_en,excerpt_ms,
        content_ar,content_en,content_ms,
        image_url,category,published,featured,sort_order
    )
    VALUES (
        @slug,@title_ar,@title_en,@title_ms,
        @excerpt_ar,@excerpt_en,@excerpt_ms,
        @content_ar,@content_en,@content_ms,
        @image_url,@category,@published,@featured,@sort_order
    )
`);

const syncBlogSeed = db.transaction(() => {
    for (const post of blogSeed) {
        const result = updateBlogSeed.run(post);

        if (result.changes === 0) {
            insertBlogSeed.run(post);
        }
    }
});

syncBlogSeed();
/* Sync Discover cards for fresh Render databases */
const discoverSeed = require('./discover-seed.json');

const updateDiscoverSeed = db.prepare(`
    UPDATE discover_cards SET
        image_url=@image_url,
        title_ar=@title_ar,
        title_en=@title_en,
        title_ms=@title_ms,
        desc_ar=@desc_ar,
        desc_en=@desc_en,
        desc_ms=@desc_ms,
        link=@link,
        active=@active,
        sort_order=@sort_order
    WHERE id=@id
`);

const insertDiscoverSeed = db.prepare(`
    INSERT INTO discover_cards (
        image_url,title_ar,title_en,title_ms,
        desc_ar,desc_en,desc_ms,link,active,sort_order
    )
    VALUES (
        @image_url,@title_ar,@title_en,@title_ms,
        @desc_ar,@desc_en,@desc_ms,@link,@active,@sort_order
    )
`);

const syncDiscoverSeed = db.transaction(() => {
    discoverSeed.forEach((card,index) => {
        const row={
            ...card,
            id:index+1
        };

        const result=updateDiscoverSeed.run(row);

        if(result.changes===0){
            insertDiscoverSeed.run(row);
        }
    });
});

syncDiscoverSeed();
// Seed Discover Cards
const discCheck = db.prepare('SELECT COUNT(*) as count FROM discover_cards').get();
if (discCheck.count === 0) {
    const insertDisc = db.prepare(`
        INSERT INTO discover_cards (image_url, title_ar, title_en, title_ms, desc_ar, desc_en, desc_ms, link, active, sort_order)
        VALUES (@image_url, @title_ar, @title_en, @title_ms, @desc_ar, @desc_en, @desc_ms, @link, 1, @sort_order)
    `);
    const saudiDateCards = [
        { image_url: 'https://images.unsplash.com/photo-1596704017254-9b121068fb31?w=800&auto=format&fit=crop&q=80', title_ar: 'ØªÙ…Ø± Ø§Ù„Ø¹Ø¬ÙˆØ© Ø§Ù„Ù…Ø¨Ø§Ø±Ùƒ', title_en: 'Blessed Ajwa Dates', title_ms: 'Kurma Ajwa Berkat', desc_ar: 'Ù…Ù† Ù…Ø²Ø§Ø±Ø¹ ÙˆØ¨Ø³Ø§ØªÙŠÙ† Ø§Ù„Ù…Ø¯ÙŠÙ†Ø© Ø§Ù„Ù…Ù†ÙˆØ±Ø© Ø§Ù„ÙØ§Ø®Ø±Ø©', desc_en: 'Directly from the finest Al Madinah orchards', desc_ms: 'Terus dari ladang kurma Al Madinah terbaik', link: '#', sort_order: 1 },
        { image_url: 'https://images.unsplash.com/photo-1596850181842-29c6bd23c3c0?w=800&auto=format&fit=crop&q=80', title_ar: 'ØªÙ…Ø± Ø§Ù„Ø³ÙƒØ±ÙŠ Ø§Ù„Ø°Ù‡Ø¨ÙŠ', title_en: 'Golden Sukkari Dates', title_ms: 'Kurma Sukkari Keemasan', desc_ar: 'Ø§Ù„ØªÙ…ÙˆØ± Ø§Ù„Ù…Ù„ÙƒÙŠØ© Ø°Ø§Øª Ø§Ù„Ø­Ù„Ø§ÙˆØ© Ø§Ù„ÙƒØ±Ø§Ù…ÙŠÙ„ÙŠØ©', desc_en: 'Royal date offering melt-in-mouth caramel taste', desc_ms: 'Kurma diraja dengan rasa karamel yang lembut', link: '#', sort_order: 2 },
        { image_url: 'https://images.unsplash.com/photo-1590846413367-c2e497e0c971?w=800&auto=format&fit=crop&q=80', title_ar: 'Ù…Ø²Ø§Ø±Ø¹ Ø§Ù„Ù†Ø®ÙŠÙ„ Ø§Ù„Ø³Ø¹ÙˆØ¯ÙŠØ©', title_en: 'Saudi Palm Groves', title_ms: 'Ladang Kurma Saudi', desc_ar: 'Ø¹Ù†Ø§ÙŠØ© ÙØ§Ø¦Ù‚Ø© ÙˆØªØ±Ø§Ø« Ø³Ø¹ÙˆØ¯ÙŠ Ø£ØµÙŠÙ„ ÙÙŠ Ø§Ù„Ø²Ø±Ø§Ø¹Ø©', desc_en: 'Authentic Saudi heritage in date cultivation', desc_ms: 'Warisan asli Saudi dalam penanaman kurma', link: '#', sort_order: 3 },
        { image_url: 'https://images.unsplash.com/photo-1586375309967-6673e57e4c15?w=800&auto=format&fit=crop&q=80', title_ar: 'Ø¹Ù†Ø§Ù‚ÙŠØ¯ Ø§Ù„ØªÙ…Ø± Ø§Ù„Ø·Ø§Ø²Ø¬Ø©', title_en: 'Fresh Date Bunches', title_ms: 'Tandan Kurma Segar', desc_ar: 'Ø­ØµØ§Ø¯ ÙŠØ¯ÙˆÙŠ Ø¨Ø¯Ù‚Ø© Ù„Ù„Ø­ÙØ§Ø¸ Ø¹Ù„Ù‰ Ø¬ÙˆØ¯Ø© ÙˆÙ†Ø¶Ø§Ø±Ø© Ø§Ù„Ø­Ø¨Ø©', desc_en: 'Meticulously handpicked at peak ripeness', desc_ms: 'Dipetik dengan tangan untuk kesegaran maksimum', link: '#', sort_order: 4 },
        { image_url: 'https://images.unsplash.com/photo-1610276414268-22e77dc5e360?w=800&auto=format&fit=crop&q=80', title_ar: 'ØªÙ…Ø± Ø§Ù„Ù…Ø¬Ø¯ÙˆÙ„ Ø§Ù„Ù…Ù„ÙƒÙŠ', title_en: 'Royal Medjool Dates', title_ms: 'Kurma Medjool Diraja', desc_ar: 'Ù…Ù„Ùƒ Ø§Ù„ØªÙ…ÙˆØ± Ø¨Ø§Ù„Ø­Ø¨Ø© Ø§Ù„Ø¹Ø±ÙŠØ¶Ø© ÙˆØ§Ù„Ù…Ø°Ø§Ù‚ Ø§Ù„ÙØ§Ø®Ø±', desc_en: 'The king of dates known for size and indulgence', desc_ms: 'Raja kurma yang terkenal dengan saiz dan kelazatan', link: '#', sort_order: 5 }
    ];
    saudiDateCards.forEach(c => insertDisc.run(c));
}

module.exports = db;

