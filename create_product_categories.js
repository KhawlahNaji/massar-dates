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
} else {
    console.log("CATEGORY_ID COLUMN ALREADY EXISTS");
}

// ==================== DEFAULT CATEGORY ====================

const existingCategory = db.prepare(`
    SELECT id
    FROM product_categories
    WHERE slug = ?
`).get("saudi-dates");

if (!existingCategory) {
    db.prepare(`
        INSERT INTO product_categories
        (
            slug,
            name_en,
            name_ar,
            name_ms,
            description_en,
            description_ar,
            description_ms,
            sort_order,
            active
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
        "saudi-dates",
        "Saudi Dates",
        "تمور سعودية",
        "Kurma Saudi",
        "Premium Saudi dates",
        "تمور سعودية فاخرة",
        "Kurma Saudi premium",
        1,
        1
    );

    console.log("DEFAULT PRODUCT CATEGORY CREATED");
}

console.log("PRODUCT CATEGORIES SETUP READY");