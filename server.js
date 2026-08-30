require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const nodemailer = require('nodemailer');
const Database = require('better-sqlite3');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'massar-dates-super-secret-jwt-key';

// 1. قاعدة البيانات المحلية الاحتياطية (SQLite) - لضمان عدم فراغ الموقع أبداً
const sqliteDb = new Database(path.join(__dirname, 'massar.db'));

// 2. قاعدة البيانات السحابية (Supabase PG)
let pgPool = null;
if (process.env.DATABASE_URL) {
    try {
        pgPool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false }
        });
    } catch(e) {
        console.log("Using SQLite fallback");
    }
}

// دالة تنفيذ الاستعلامات الذكية (Supabase أولاً ثم SQLite كأمان)
async function queryDB(sql, pgSql, params = []) {
    if (pgPool) {
        try {
            const res = await pgPool.query(pgSql || sql, params);
            if (res.rows && res.rows.length > 0) return res.rows;
        } catch (e) {
            // في حال وجود خطأ في السحابة، يتم التبديل تلقائياً للمحلي
        }
    }
    // الاحتياطي المضمون (SQLite)
    try {
        const stmt = sqliteDb.prepare(sql);
        if (sql.trim().toUpperCase().startsWith('SELECT')) {
            return stmt.all(...params);
        } else {
            return stmt.run(...params);
        }
    } catch (err) {
        return [];
    }
}

// Middleware
app.use(cors());
app.use(express.json({ limit: '15mb' }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// إعداد رفع الصور
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, path.join(__dirname, 'uploads')),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '-'))
});
const upload = multer({ storage });

function authMiddleware(req, res, next) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'No token' });
    try {
        req.admin = jwt.verify(token, JWT_SECRET);
        next();
    } catch {
        res.status(401).json({ error: 'Invalid token' });
    }
}

// ==================== APIs ====================

// 1. Config
app.get('/api/config', async (req, res) => {
    try {
        const rows = sqliteDb.prepare('SELECT key, value FROM site_config').all();
        const config = {};
        rows.forEach(r => config[r.key] = r.value);
        res.json(config);
    } catch (e) { res.json({}); }
});

// 2. Categories
app.get(['/api/product-categories', '/api/admin/product-categories'], (req, res) => {
    try {
        const cats = sqliteDb.prepare('SELECT * FROM product_categories ORDER BY sort_order ASC, id ASC').all();
        res.json(cats);
    } catch (e) { res.json([]); }
});

app.post(['/api/product-categories', '/api/admin/product-categories'], (req, res) => {
    try {
        const { slug, name_en, name_ar, name_ms, image_url, description_en, description_ar, description_ms, sort_order, active } = req.body;
        const cleanSlug = (slug || name_en || "cat").toLowerCase().replace(/[^a-z0-9]+/g, "-") + '-' + Date.now().toString().slice(-3);
        const info = sqliteDb.prepare(`
            INSERT INTO product_categories (slug, name_en, name_ar, name_ms, image_url, description_en, description_ar, description_ms, sort_order, active)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(cleanSlug, name_en||'', name_ar||'', name_ms||'', image_url||'', description_en||'', description_ar||'', description_ms||'', Number(sort_order)||0, active?1:1);
        res.json({ success: true, id: info.lastInsertRowid });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put(['/api/product-categories/:id', '/api/admin/product-categories/:id'], (req, res) => {
    try {
        const { name_en, name_ar, name_ms, image_url, description_en, description_ar, description_ms, sort_order, active } = req.body;
        sqliteDb.prepare(`
            UPDATE product_categories SET
                name_en=COALESCE(?, name_en), name_ar=COALESCE(?, name_ar), name_ms=COALESCE(?, name_ms),
                image_url=COALESCE(?, image_url), description_en=COALESCE(?, description_en),
                description_ar=COALESCE(?, description_ar), description_ms=COALESCE(?, description_ms),
                sort_order=COALESCE(?, sort_order), active=COALESCE(?, active)
            WHERE id=?
        `).run(name_en, name_ar, name_ms, image_url, description_en, description_ar, description_ms, sort_order, active, req.params.id);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete(['/api/product-categories/:id', '/api/admin/product-categories/:id'], (req, res) => {
    try {
        sqliteDb.prepare('DELETE FROM product_categories WHERE id=?').run(req.params.id);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// 3. Products
app.get('/api/products', (req, res) => {
    try {
        const prods = sqliteDb.prepare('SELECT * FROM products WHERE active = 1 ORDER BY sort_order ASC').all();
        const priceStmt = sqliteDb.prepare('SELECT weight, price FROM product_prices WHERE product_id = ?');
        const result = prods.map(p => ({
            ...p,
            prices: Object.fromEntries(priceStmt.all(p.id).map(pr => [pr.weight, pr.price]))
        }));
        res.json(result);
    } catch (e) { res.json([]); }
});

app.get('/api/admin/products', authMiddleware, (req, res) => {
    try {
        const prods = sqliteDb.prepare('SELECT * FROM products ORDER BY sort_order ASC').all();
        const priceStmt = sqliteDb.prepare('SELECT weight, price FROM product_prices WHERE product_id = ?');
        const result = prods.map(p => ({
            ...p,
            prices: Object.fromEntries(priceStmt.all(p.id).map(pr => [pr.weight, pr.price]))
        }));
        res.json(result);
    } catch (e) { res.json([]); }
});

app.get('/api/products/:slug', (req, res) => {
    try {
        const p = sqliteDb.prepare('SELECT * FROM products WHERE (slug = ? OR id = ?) AND active = 1').get(req.params.slug, req.params.slug);
        if (!p) return res.status(404).json({ error: 'Not found' });
        const prices = sqliteDb.prepare('SELECT weight, price FROM product_prices WHERE product_id = ?').all(p.id);
        res.json({ ...p, prices: Object.fromEntries(prices.map(pr => [pr.weight, pr.price])) });
    } catch (e) { res.status(404).json({ error: 'Not found' }); }
});

app.post('/api/admin/products', authMiddleware, (req, res) => {
    try {
        const b = req.body;
        const slug = (b.slug || b.name_en || 'prod').toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now().toString().slice(-4);
        const r = sqliteDb.prepare(`
            INSERT INTO products (slug, category_id, name_en, name_ar, name_ms, desc_en, desc_ar, desc_ms, variety, brand, origin, type, texture_en, texture_ar, texture_ms, taste_en, taste_ar, taste_ms, badge_en, badge_ar, badge_ms, image_url, active, featured, shopee_url, tiktok_url, lazada_url)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(slug, b.category_id||1, b.name_en, b.name_ar||b.name_en, b.name_ms||b.name_en, b.desc_en||'', b.desc_ar||'', b.desc_ms||'', b.variety||'', b.brand||'', b.origin||'Saudi Arabia', b.type||'', b.texture_en||'', b.texture_ar||'', b.texture_ms||'', b.taste_en||'', b.taste_ar||'', b.taste_ms||'', b.badge_en||'', b.badge_ar||'', b.badge_ms||'', b.image_url||'', b.active?1:1, b.featured?1:0, b.shopee_url||'', b.tiktok_url||'', b.lazada_url||'');
        
        const prodId = r.lastInsertRowid;
        if (b.prices) {
            const insPrice = sqliteDb.prepare('INSERT INTO product_prices (product_id, weight, price) VALUES (?, ?, ?)');
            for (const [w, pr] of Object.entries(b.prices)) {
                if (Number(pr) > 0) insPrice.run(prodId, w, Number(pr));
            }
        }
        res.json({ id: prodId, success: true });
    } catch(e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/admin/products/:id', authMiddleware, (req, res) => {
    try {
        const b = req.body;
        sqliteDb.prepare(`
            UPDATE products SET
                category_id=COALESCE(?, category_id), name_en=COALESCE(?, name_en), name_ar=COALESCE(?, name_ar), name_ms=COALESCE(?, name_ms),
                desc_en=COALESCE(?, desc_en), desc_ar=COALESCE(?, desc_ar), desc_ms=COALESCE(?, desc_ms),
                variety=COALESCE(?, variety), brand=COALESCE(?, brand), origin=COALESCE(?, origin), type=COALESCE(?, type),
                texture_en=COALESCE(?, texture_en), texture_ar=COALESCE(?, texture_ar), texture_ms=COALESCE(?, texture_ms),
                taste_en=COALESCE(?, taste_en), taste_ar=COALESCE(?, taste_ar), taste_ms=COALESCE(?, taste_ms),
                badge_en=COALESCE(?, badge_en), badge_ar=COALESCE(?, badge_ar), badge_ms=COALESCE(?, badge_ms),
                image_url=COALESCE(?, image_url), active=COALESCE(?, active), featured=COALESCE(?, featured),
                shopee_url=COALESCE(?, shopee_url), tiktok_url=COALESCE(?, tiktok_url), lazada_url=COALESCE(?, lazada_url),
                updated_at=CURRENT_TIMESTAMP
            WHERE id=?
        `).run(b.category_id, b.name_en, b.name_ar, b.name_ms, b.desc_en, b.desc_ar, b.desc_ms, b.variety, b.brand, b.origin, b.type, b.texture_en, b.texture_ar, b.texture_ms, b.taste_en, b.taste_ar, b.taste_ms, b.badge_en, b.badge_ar, b.badge_ms, b.image_url, b.active!==undefined?(b.active?1:0):null, b.featured!==undefined?(b.featured?1:0):null, b.shopee_url, b.tiktok_url, b.lazada_url, req.params.id);

        if (b.prices) {
            sqliteDb.prepare('DELETE FROM product_prices WHERE product_id = ?').run(req.params.id);
            const insPrice = sqliteDb.prepare('INSERT INTO product_prices (product_id, weight, price) VALUES (?, ?, ?)');
            for (const [w, pr] of Object.entries(b.prices)) {
                if (Number(pr) > 0) insPrice.run(req.params.id, w, Number(pr));
            }
        }
        res.json({ success: true });
    } catch(e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/admin/products/:id', authMiddleware, (req, res) => {
    try {
        sqliteDb.prepare('DELETE FROM product_prices WHERE product_id = ?').run(req.params.id);
        sqliteDb.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
        res.json({ success: true });
    } catch(e) { res.status(500).json({ error: e.message }); }
});

// Admin Login
app.post('/api/admin/login', (req, res) => {
    try {
        const { email, password } = req.body;
        const user = sqliteDb.prepare('SELECT * FROM admin_users WHERE email = ?').get(email);
        if (!user || !bcrypt.compareSync(password, user.password)) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, email: user.email });
    } catch(e) { res.status(500).json({ error: e.message }); }
});

// Upload
app.post('/api/admin/upload', authMiddleware, upload.single('image'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file' });
    res.json({ url: '/uploads/' + req.file.filename });
});

// Config
app.put('/api/admin/config', authMiddleware, (req, res) => {
    const upsert = sqliteDb.prepare('INSERT INTO site_config (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value');
    const updateAll = sqliteDb.transaction((items) => {
        for (const [k, v] of Object.entries(items)) upsert.run(k, v);
    });
    updateAll(req.body);
    res.json({ message: 'Saved' });
});

// Blog
app.get('/api/blog', (req, res) => {
    try { res.json(sqliteDb.prepare('SELECT * FROM blog_posts WHERE published = 1 ORDER BY featured DESC, sort_order ASC').all()); } catch(e){ res.json([]); }
});
app.get('/api/blog/:slug', (req, res) => {
    try {
        const post = sqliteDb.prepare('SELECT * FROM blog_posts WHERE slug = ?').get(req.params.slug);
        const related = sqliteDb.prepare('SELECT * FROM blog_posts WHERE slug != ? LIMIT 3').all(req.params.slug);
        res.json({ ...post, related });
    } catch(e){ res.status(404).json({ error: 'Not found' }); }
});

// SPA Fallback
app.get(/.*/, (req, res) => {
    if (req.path.startsWith('/admin')) {
        res.sendFile(path.join(__dirname, 'public', 'admin.html'));
    } else {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    }
});

app.listen(PORT, () => {
    console.log(`\n🌴 MASSAR DATES (Protected & Complete) Running on http://localhost:${PORT}`);
});
