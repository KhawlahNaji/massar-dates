require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const nodemailer = require('nodemailer');
const { Pool } = require('pg');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'massar-dates-secret-key';

// ==================== DATABASE POOL (SUPABASE) ====================
const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// ==================== CLOUDINARY UPLOAD CONFIG ====================
let upload;
if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
    });

    const cloudStorage = new CloudinaryStorage({
        cloudinary: cloudinary,
        params: {
            folder: 'massar-dates',
            allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'svg'],
            transformation: [{ quality: 'auto', fetch_format: 'auto' }]
        }
    });
    upload = multer({ storage: cloudStorage, limits: { fileSize: 5 * 1024 * 1024 } });
} else {
    const local = multer.diskStorage({
        destination: (req, file, cb) => cb(null, path.join(__dirname, 'uploads')),
        filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '-'))
    });
    upload = multer({ storage: local, limits: { fileSize: 5 * 1024 * 1024 } });
}

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Auth Middleware
function authMiddleware(req, res, next) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'No token provided' });
    try {
        req.admin = jwt.verify(token, JWT_SECRET);
        next();
    } catch {
        res.status(401).json({ error: 'Invalid token' });
    }
}

// ==================== PUBLIC API ====================

// 1. Config
app.get('/api/config', async (req, res) => {
    try {
        const { rows } = await db.query('SELECT key, value FROM site_config');
        const config = {};
        rows.forEach(r => config[r.key] = r.value);
        res.json(config);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// 2. Categories API with Smart Unique Slug
const getCategoriesHandler = async (req, res) => {
    try {
        const { rows } = await db.query('SELECT * FROM product_categories ORDER BY sort_order ASC, id ASC');
        res.setHeader("Content-Type", "application/json");
        res.json(rows);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

const saveCategoryHandler = async (req, res) => {
    try {
        const id = req.params.id || req.body.id;
        let { slug, name_en, name_ar, name_ms, image_url, description_en, description_ar, description_ms, sort_order, active } = req.body;
        
        let baseSlug = (slug || name_en || "category").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
        if (!baseSlug) baseSlug = "category";

        if (id) {
            // التحقق عند التعديل
            let uniqueSlug = baseSlug;
            const existing = await db.query('SELECT id FROM product_categories WHERE slug = $1 AND id != $2', [uniqueSlug, id]);
            if (existing.rows.length > 0) {
                uniqueSlug = `${baseSlug}-${Date.now().toString().slice(-4)}`;
            }

            await db.query(`
                UPDATE product_categories SET
                    slug = COALESCE($1, slug),
                    name_en = COALESCE($2, name_en),
                    name_ar = COALESCE($3, name_ar),
                    name_ms = COALESCE($4, name_ms),
                    image_url = COALESCE($5, image_url),
                    description_en = COALESCE($6, description_en),
                    description_ar = COALESCE($7, description_ar),
                    description_ms = COALESCE($8, description_ms),
                    sort_order = COALESCE($9, sort_order),
                    active = COALESCE($10, active)
                WHERE id = $11
            `, [slug ? uniqueSlug : null, name_en, name_ar, name_ms, image_url, description_en, description_ar, description_ms, sort_order !== undefined ? Number(sort_order) : null, active !== undefined ? (active ? 1 : 0) : null, id]);
            
            res.json({ success: true, id: Number(id) });
        } else {
            // توليد slug فريد تلقائياً عند الإضافة لمنع أي خطأ تكرار
            let uniqueSlug = baseSlug;
            let counter = 1;
            while (true) {
                const existing = await db.query('SELECT id FROM product_categories WHERE slug = $1', [uniqueSlug]);
                if (existing.rows.length === 0) break;
                uniqueSlug = `${baseSlug}-${counter}`;
                counter++;
            }

            const { rows } = await db.query(`
                INSERT INTO product_categories (slug, name_en, name_ar, name_ms, image_url, description_en, description_ar, description_ms, sort_order, active)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                RETURNING id
            `, [uniqueSlug, name_en || "", name_ar || "", name_ms || "", image_url || "", description_en || "", description_ar || "", description_ms || "", Number(sort_order) || 0, active !== undefined ? (active ? 1 : 0) : 1]);
            
            res.json({ success: true, id: rows[0].id });
        }
    } catch (e) {
        console.error("Category Error:", e);
        res.status(500).json({ error: e.message });
    }
};

const deleteCategoryHandler = async (req, res) => {
    try {
        await db.query('DELETE FROM product_categories WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

app.get('/api/product-categories', getCategoriesHandler);
app.get('/api/admin/product-categories', getCategoriesHandler);
app.post('/api/product-categories', saveCategoryHandler);
app.post('/api/admin/product-categories', saveCategoryHandler);
app.put('/api/product-categories/:id', saveCategoryHandler);
app.put('/api/admin/product-categories/:id', saveCategoryHandler);
app.delete('/api/product-categories/:id', deleteCategoryHandler);
app.delete('/api/admin/product-categories/:id', deleteCategoryHandler);

// 3. Products API
app.get('/api/products', async (req, res) => {
    try {
        const { rows: products } = await db.query('SELECT * FROM products WHERE active = 1 ORDER BY sort_order ASC, id ASC');
        const { rows: prices } = await db.query('SELECT product_id, weight, price FROM product_prices ORDER BY weight');
        
        const priceMap = {};
        prices.forEach(p => {
            if (!priceMap[p.product_id]) priceMap[p.product_id] = {};
            priceMap[p.product_id][p.weight] = Number(p.price);
        });

        const result = products.map(p => ({
            ...p,
            prices: priceMap[p.id] || {}
        }));
        res.json(result);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/products/:slug', async (req, res) => {
    try {
        const { rows } = await db.query('SELECT * FROM products WHERE (slug = $1 OR id::text = $1) AND active = 1 LIMIT 1', [req.params.slug]);
        if (!rows.length) return res.status(404).json({ error: 'Product not found' });
        const product = rows[0];
        const { rows: prices } = await db.query('SELECT weight, price FROM product_prices WHERE product_id = $1', [product.id]);
        const priceObj = {};
        prices.forEach(pr => priceObj[pr.weight] = Number(pr.price));
        res.json({ ...product, prices: priceObj });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// ==================== ADMIN API ====================

// Admin Login
app.post('/api/admin/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const { rows } = await db.query('SELECT * FROM admin_users WHERE email = $1 LIMIT 1', [email]);
        if (!rows.length || !bcrypt.compareSync(password, rows[0].password)) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const token = jwt.sign({ id: rows[0].id, email: rows[0].email }, JWT_SECRET, { expiresIn: '24h' });
        res.json({ token, email: rows[0].email });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Admin Products (ALL)
app.get('/api/admin/products', authMiddleware, async (req, res) => {
    try {
        const { rows: products } = await db.query('SELECT * FROM products ORDER BY sort_order ASC, id ASC');
        const { rows: prices } = await db.query('SELECT product_id, weight, price FROM product_prices');
        const priceMap = {};
        prices.forEach(p => {
            if (!priceMap[p.product_id]) priceMap[p.product_id] = {};
            priceMap[p.product_id][p.weight] = Number(p.price);
        });
        const result = products.map(p => ({
            ...p,
            prices: priceMap[p.id] || {}
        }));
        res.json(result);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Create Product with Unique Slug
app.post('/api/admin/products', authMiddleware, async (req, res) => {
    try {
        const { slug, category_id, name_en, name_ar, name_ms, desc_en, desc_ar, desc_ms,
            variety, brand, origin, type, texture_en, texture_ar, texture_ms,
            taste_en, taste_ar, taste_ms, badge_en, badge_ar, badge_ms,
            image_url, active, featured, prices, shopee_url, tiktok_url, lazada_url } = req.body;

        let baseSlug = (slug || name_en || 'product').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        if (!baseSlug) baseSlug = 'product';

        let uniqueSlug = baseSlug;
        let counter = 1;
        while (true) {
            const existing = await db.query('SELECT id FROM products WHERE slug = $1', [uniqueSlug]);
            if (existing.rows.length === 0) break;
            uniqueSlug = `${baseSlug}-${counter}`;
            counter++;
        }

        const { rows } = await db.query(`
            INSERT INTO products (
                slug, category_id, name_en, name_ar, name_ms, desc_en, desc_ar, desc_ms,
                variety, brand, origin, type, texture_en, texture_ar, texture_ms,
                taste_en, taste_ar, taste_ms, badge_en, badge_ar, badge_ms,
                image_url, active, featured, shopee_url, tiktok_url, lazada_url
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27)
            RETURNING id
        `, [
            uniqueSlug, category_id || 1, name_en, name_ar || name_en, name_ms || name_en,
            desc_en || '', desc_ar || desc_en || '', desc_ms || desc_en || '',
            variety || '', brand || '', origin || 'Saudi Arabia', type || '',
            texture_en || '', texture_ar || '', texture_ms || '',
            taste_en || '', taste_ar || '', taste_ms || '',
            badge_en || '', badge_ar || '', badge_ms || '',
            image_url || '', active !== undefined ? (active ? 1 : 0) : 1, featured ? 1 : 0,
            shopee_url || '', tiktok_url || '', lazada_url || ''
        ]);

        const prodId = rows[0].id;

        if (prices && typeof prices === 'object') {
            for (const [weight, price] of Object.entries(prices)) {
                if (Number(price) > 0) {
                    await db.query(
                        'INSERT INTO product_prices (product_id, weight, price) VALUES ($1, $2, $3) ON CONFLICT (product_id, weight) DO UPDATE SET price = EXCLUDED.price',
                        [prodId, weight, Number(price)]
                    );
                }
            }
        }

        res.json({ id: prodId, message: 'Product created' });
    } catch (e) {
        console.error("Product Create Error:", e);
        res.status(500).json({ error: e.message });
    }
});

// Update Product
app.put('/api/admin/products/:id', authMiddleware, async (req, res) => {
    try {
        const { category_id, name_en, name_ar, name_ms, desc_en, desc_ar, desc_ms,
            variety, brand, origin, type, texture_en, texture_ar, texture_ms,
            taste_en, taste_ar, taste_ms, badge_en, badge_ar, badge_ms,
            image_url, active, featured, prices, shopee_url, tiktok_url, lazada_url } = req.body;

        await db.query(`
            UPDATE products SET
                category_id = COALESCE($1, category_id),
                name_en = COALESCE($2, name_en),
                name_ar = COALESCE($3, name_ar),
                name_ms = COALESCE($4, name_ms),
                desc_en = COALESCE($5, desc_en),
                desc_ar = COALESCE($6, desc_ar),
                desc_ms = COALESCE($7, desc_ms),
                variety = COALESCE($8, variety),
                brand = COALESCE($9, brand),
                origin = COALESCE($10, origin),
                type = COALESCE($11, type),
                texture_en = COALESCE($12, texture_en),
                texture_ar = COALESCE($13, texture_ar),
                texture_ms = COALESCE($14, texture_ms),
                taste_en = COALESCE($15, taste_en),
                taste_ar = COALESCE($16, taste_ar),
                taste_ms = COALESCE($17, taste_ms),
                badge_en = COALESCE($18, badge_en),
                badge_ar = COALESCE($19, badge_ar),
                badge_ms = COALESCE($20, badge_ms),
                image_url = COALESCE($21, image_url),
                active = COALESCE($22, active),
                featured = COALESCE($23, featured),
                shopee_url = COALESCE($24, shopee_url),
                tiktok_url = COALESCE($25, tiktok_url),
                lazada_url = COALESCE($26, lazada_url),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $27
        `, [
            category_id, name_en, name_ar, name_ms, desc_en, desc_ar, desc_ms,
            variety, brand, origin, type, texture_en, texture_ar, texture_ms,
            taste_en, taste_ar, taste_ms, badge_en, badge_ar, badge_ms,
            image_url, active !== undefined ? (active ? 1 : 0) : null,
            featured !== undefined ? (featured ? 1 : 0) : null,
            shopee_url, tiktok_url, lazada_url, req.params.id
        ]);

        if (prices && typeof prices === 'object') {
            await db.query('DELETE FROM product_prices WHERE product_id = $1', [req.params.id]);
            for (const [weight, price] of Object.entries(prices)) {
                if (Number(price) > 0) {
                    await db.query(
                        'INSERT INTO product_prices (product_id, weight, price) VALUES ($1, $2, $3)',
                        [req.params.id, weight, Number(price)]
                    );
                }
            }
        }

        res.json({ message: 'Product updated' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Delete Product
app.delete('/api/admin/products/:id', authMiddleware, async (req, res) => {
    try {
        await db.query('DELETE FROM product_prices WHERE product_id = $1', [req.params.id]);
        await db.query('DELETE FROM products WHERE id = $1', [req.params.id]);
        res.json({ message: 'Product deleted' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Toggle Active / Featured
app.patch('/api/admin/products/:id/toggle', authMiddleware, async (req, res) => {
    try {
        const { rows } = await db.query('SELECT active FROM products WHERE id = $1', [req.params.id]);
        if (!rows.length) return res.status(404).json({ error: 'Not found' });
        const newActive = rows[0].active ? 0 : 1;
        await db.query('UPDATE products SET active = $1 WHERE id = $2', [newActive, req.params.id]);
        res.json({ message: 'Toggled', active: newActive });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.patch('/api/admin/products/:id/featured', authMiddleware, async (req, res) => {
    try {
        const { rows } = await db.query('SELECT featured FROM products WHERE id = $1', [req.params.id]);
        if (!rows.length) return res.status(404).json({ error: 'Not found' });
        const newFeat = rows[0].featured ? 0 : 1;
        await db.query('UPDATE products SET featured = $1 WHERE id = $2', [newFeat, req.params.id]);
        res.json({ message: 'Toggled', featured: newFeat });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Config Update
app.put('/api/admin/config', authMiddleware, async (req, res) => {
    try {
        for (const [k, v] of Object.entries(req.body)) {
            await db.query(
                'INSERT INTO site_config (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value',
                [k, typeof v === 'object' ? JSON.stringify(v) : String(v)]
            );
        }
        res.json({ message: 'Config updated' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Brands
app.get('/api/admin/brands', authMiddleware, async (req, res) => {
    try {
        const { rows } = await db.query("SELECT value FROM site_config WHERE key = 'brands_data'");
        let brands = [];
        if (rows.length && rows[0].value) {
            try { brands = JSON.parse(rows[0].value); } catch(e){}
        }
        res.json(brands);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.put('/api/admin/brands', authMiddleware, async (req, res) => {
    try {
        const brands = Array.isArray(req.body) ? req.body : req.body.brands;
        await db.query(
            "INSERT INTO site_config (key, value) VALUES ('brands_data', $1) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value",
            [JSON.stringify(brands)]
        );
        res.json({ message: 'Brands saved', brands });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Image Upload (Cloudinary URL)
app.post('/api/admin/upload', authMiddleware, upload.single('image'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const fileUrl = req.file.path || req.file.secure_url || ('/uploads/' + req.file.filename);
    res.json({ url: fileUrl });
});

// Password Change
app.put('/api/admin/password', authMiddleware, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const { rows } = await db.query('SELECT * FROM admin_users WHERE id = $1', [req.admin.id]);
        if (!rows.length || !bcrypt.compareSync(currentPassword, rows[0].password)) {
            return res.status(400).json({ error: 'Current password incorrect' });
        }
        const hash = bcrypt.hashSync(newPassword, 10);
        await db.query('UPDATE admin_users SET password = $1 WHERE id = $2', [hash, req.admin.id]);
        res.json({ message: 'Password changed' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Messages
app.post('/api/messages', async (req, res) => {
    try {
        const name = (req.body && req.body.name) || '';
        const email = (req.body && req.body.email) || '';
        const message = (req.body && req.body.message) || '';

        await db.query('INSERT INTO messages (name, email, message, is_read) VALUES ($1, $2, $3, 0)', [name, email, message]);

        let waLink = null;
        try {
            const { rows } = await db.query("SELECT value FROM site_config WHERE key = 'link_whatsapp'");
            if (rows.length && rows[0].value) {
                const wa = rows[0].value.replace(/[^0-9]/g, '');
                if (wa) {
                    waLink = 'https://wa.me/' + wa + '?text=' + encodeURIComponent('📩 رسالة من: ' + name + '\n📧 البريد: ' + email + '\n💬 الرسالة: ' + message);
                }
            }
        } catch(e){}

        res.json({ success: true, message: 'Message sent successfully', waLink });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/admin/messages', authMiddleware, async (req, res) => {
    try {
        const { rows } = await db.query('SELECT * FROM messages ORDER BY created_at DESC');
        res.json(rows);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.patch('/api/admin/messages/:id/toggle-read', authMiddleware, async (req, res) => {
    try {
        const { rows } = await db.query('SELECT is_read FROM messages WHERE id = $1', [req.params.id]);
        if (!rows.length) return res.status(404).json({ error: 'Not found' });
        const newRead = rows[0].is_read === 1 ? 0 : 1;
        await db.query('UPDATE messages SET is_read = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [newRead, req.params.id]);
        res.json({ message: 'Status updated', is_read: newRead });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.delete('/api/admin/messages/:id', authMiddleware, async (req, res) => {
    try {
        await db.query('DELETE FROM messages WHERE id = $1', [req.params.id]);
        res.json({ message: 'Message deleted' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Blog APIs
app.get('/api/blog', async (req, res) => {
    try {
        const { rows } = await db.query('SELECT * FROM blog_posts WHERE published = 1 ORDER BY featured DESC, sort_order ASC, created_at DESC');
        res.json(rows);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/blog/:slug', async (req, res) => {
    try {
        const { rows } = await db.query('SELECT * FROM blog_posts WHERE slug = $1 AND published = 1 LIMIT 1', [req.params.slug]);
        if (!rows.length) return res.status(404).json({ error: 'Post not found' });
        const post = rows[0];
        const { rows: related } = await db.query('SELECT id, slug, title_ar, title_en, title_ms, excerpt_ar, excerpt_en, excerpt_ms, image_url, category, created_at FROM blog_posts WHERE published = 1 AND slug != $1 AND category = $2 LIMIT 3', [post.slug, post.category]);
        res.json({ ...post, related });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/admin/blog', authMiddleware, async (req, res) => {
    try {
        const { rows } = await db.query('SELECT * FROM blog_posts ORDER BY sort_order ASC, created_at DESC');
        res.json(rows);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/admin/blog', authMiddleware, async (req, res) => {
    try {
        const b = req.body;
        const { rows } = await db.query(
            'INSERT INTO blog_posts (slug, title_ar, title_en, title_ms, excerpt_ar, excerpt_en, excerpt_ms, content_ar, content_en, content_ms, image_url, category, published, featured, sort_order) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING id',
            [b.slug, b.title_ar||'', b.title_en||'', b.title_ms||'', b.excerpt_ar||'', b.excerpt_en||'', b.excerpt_ms||'', b.content_ar||'', b.content_en||'', b.content_ms||'', b.image_url||'', b.category||'types-of-dates', b.published?1:0, b.featured?1:0, b.sort_order||0]
        );
        res.json({ id: rows[0].id, message: 'Created' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.delete('/api/admin/blog/:id', authMiddleware, async (req, res) => {
    try {
        await db.query('DELETE FROM blog_posts WHERE id = $1', [req.params.id]);
        res.json({ message: 'Deleted' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Discover Cards
app.get('/api/discover', async (req, res) => {
    try {
        const { rows } = await db.query('SELECT * FROM discover_cards WHERE active = 1 ORDER BY sort_order ASC');
        res.json(rows);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/admin/discover', authMiddleware, async (req, res) => {
    try {
        const { rows } = await db.query('SELECT * FROM discover_cards ORDER BY sort_order ASC');
        res.json(rows);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// SPA Fallback
app.get(/.*/, (req, res) => {
    if (req.path.startsWith('/admin')) {
        res.sendFile(path.join(__dirname, 'public', 'admin.html'));
    } else {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`\n🌴 MASSAR DATES (Supabase Edition) Running on http://localhost:${PORT}`);
    console.log(`🔒 Admin: http://localhost:${PORT}/admin`);
});
