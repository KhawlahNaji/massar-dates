const db = require("./database");

// ==================== PRODUCT CATEGORIES ====================

db.exec(`
CREATE TABLE IF NOT EXISTS product_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT UNIQUE NOT NULL,
    name_en TEXT NOT NULL,
    name_ar TEXT DEFAULT '',
    name_ms TEXT DEFAULT '',
    image_url TEXT DEFAULT '',
    description_en TEXT DEFAULT '',
    description_ar TEXT DEFAULT '',
    description_ms TEXT DEFAULT '',
    sort_order INTEGER DEFAULT 0,
    active INTEGER DEFAULT 1
)
`);

// ==================== ADD CATEGORY_ID TO PRODUCTS ====================

const columns = db.prepare("PRAGMA table_info(products)").all();
const hasCategoryId = columns.some(column => column.name === "category_id");

if (!hasCategoryId) {
    db.exec(`
        ALTER TABLE products
        ADD COLUMN category_id INTEGER DEFAULT 1
    `);

    console.log("CATEGORY_ID COLUMN ADDED TO PRODUCTS");
}

// ==================== CREATE ALL CATEGORIES ====================

const categories = [
    {
        slug: "dates",
        name_en: "Dates",
        name_ar: "التمور",
        name_ms: "Kurma",
        sort_order: 1
    },
    {
        slug: "oils",
        name_en: "Oils",
        name_ar: "الزيوت",
        name_ms: "Minyak",
        sort_order: 2
    },
    {
        slug: "nuts",
        name_en: "Nuts",
        name_ar: "المكسرات",
        name_ms: "Kekacang",
        sort_order: 3
    },
    {
        slug: "honey",
        name_en: "Honey",
        name_ar: "العسل",
        name_ms: "Madu",
        sort_order: 4
    },
    {
        slug: "gift-boxes",
        name_en: "Gift Boxes",
        name_ar: "علب الهدايا",
        name_ms: "Kotak Hadiah",
        sort_order: 5
    }
];

const insertCategory = db.prepare(`
    INSERT OR IGNORE INTO product_categories
    (slug, name_en, name_ar, name_ms, sort_order, active)
    VALUES (?, ?, ?, ?, ?, 1)
`);

for (const category of categories) {
    insertCategory.run(
        category.slug,
        category.name_en,
        category.name_ar,
        category.name_ms,
        category.sort_order
    );
}

console.log("ALL PRODUCT CATEGORIES READY");

// ==================== GET CATEGORY IDS ====================

function getCategoryId(slug) {
    const category = db.prepare(`
        SELECT id FROM product_categories WHERE slug = ?
    `).get(slug);

    return category ? category.id : null;
}

const datesId = getCategoryId("dates");
const oilsId = getCategoryId("oils");
const honeyId = getCategoryId("honey");

// ==================== MOVE EXISTING DATE PRODUCTS ====================

db.prepare(`
    UPDATE products
    SET category_id = ?
    WHERE slug IN ('ajwa', 'safawi', 'sukkari', 'medjool', 'mariami')
`).run(datesId);

console.log("DATE PRODUCTS CATEGORY UPDATED");

// ==================== ADD BLACK SEED OIL ====================

const oilExists = db.prepare(`
    SELECT id FROM products
    WHERE slug = 'premium-black-seed-oil'
`).get();

if (!oilExists) {
    const result = db.prepare(`
        INSERT INTO products (
            slug,
            name_en,
            name_ar,
            name_ms,
            desc_en,
            desc_ar,
            desc_ms,
            variety,
            origin,
            texture_en,
            texture_ar,
            texture_ms,
            image_url,
            badge_en,
            badge_ar,
            badge_ms,
            active,
            featured,
            sort_order,
            category_id
        )
        VALUES (
            ?, ?, ?, ?,
            ?, ?, ?,
            ?, ?,
            ?, ?, ?,
            ?, ?, ?, ?,
            1, 1, 1, ?
        )
    `).run(
        "premium-black-seed-oil",
        "Premium Black Seed Oil",
        "زيت حبة البركة الفاخر",
        "Minyak Habbatus Sauda Premium",

        "Premium cold-pressed black seed oil with a rich natural aroma and smooth texture, carefully produced for exceptional quality.",
        "زيت حبة البركة الفاخر المعصور على البارد، يتميز برائحته الطبيعية الغنية وقوامه الناعم وجودته العالية.",
        "Minyak habbatus sauda premium yang diperah sejuk, dengan aroma semula jadi yang kaya, tekstur lembut dan kualiti yang istimewa.",

        "Yaman",
        "Yemen",

        "Smooth & Natural",
        "ناعم وطبيعي",
        "Lembut & Semula Jadi",

        "",
        "Premium Oil",
        "زيت فاخر",
        "Minyak Premium",

        oilsId
    );

    console.log("BLACK SEED OIL CREATED:", result.lastInsertRowid);
} else {
    db.prepare(`
        UPDATE products
        SET category_id = ?
        WHERE slug = 'premium-black-seed-oil'
    `).run(oilsId);

    console.log("BLACK SEED OIL CATEGORY UPDATED");
}

// ==================== ADD SIDR HONEY ====================

const honeyExists = db.prepare(`
    SELECT id FROM products
    WHERE slug = 'premium-sidr-honey'
`).get();

if (!honeyExists) {
    const result = db.prepare(`
        INSERT INTO products (
            slug,
            name_en,
            name_ar,
            name_ms,
            desc_en,
            desc_ar,
            desc_ms,
            variety,
            texture_en,
            texture_ar,
            texture_ms,
            image_url,
            badge_en,
            badge_ar,
            badge_ms,
            active,
            featured,
            sort_order,
            category_id
        )
        VALUES (
            ?, ?, ?,
            ?, ?, ?,
            ?, ?, ?,
            ?, ?, ?,
            ?, ?, ?,
            1, 1, 1, ?
        )
    `).run(
        "premium-sidr-honey",
        "Premium Sidr Honey",
        "عسل سدر فاخر",
        "Madu Sidr Premium",

        "Pure premium Sidr honey with a rich golden colour, naturally sweet flavour, and distinctive floral aroma.",
        "عسل سدر فاخر ونقي بلونه الذهبي الغني، ومذاقه الحلو الطبيعي، ورائحته الزهرية المميزة.",
        "Madu Sidr premium dan tulen dengan warna keemasan yang kaya, rasa manis semula jadi dan aroma bunga yang istimewa.",

        "Yemen / Saudi Arabia",

        "Smooth & Rich",
        "ناعم وغني",
        "Lembut & Kaya",

        "",
        "Premium Honey",
        "عسل فاخر",
        "Madu Premium",

        honeyId
    );

    console.log("SIDR HONEY CREATED:", result.lastInsertRowid);
} else {
    db.prepare(`
        UPDATE products
        SET category_id = ?
        WHERE slug = 'premium-sidr-honey'
    `).run(honeyId);

    console.log("SIDR HONEY CATEGORY UPDATED");
}

// ==================== FINISH ====================

console.log("PRODUCT CATEGORIES AND PRODUCTS SETUP READY");

db.close();