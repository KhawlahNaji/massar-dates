require("dotenv").config();
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
﻿const nodemailer = require('nodemailer');
const express = require('express');
const path = require('path');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const db = require('./database');


// ========================================================
// AUTO-ASSIGN BRANDS TO ALL PRODUCTS ON RENDER STARTUP
// ========================================================
function autoRepairProductBrands() {
    try {
        try { db.prepare("ALTER TABLE products ADD COLUMN brand TEXT").run(); } catch(e){}
        
        const prods = db.prepare("SELECT id, name_en, name_ar, variety, brand FROM products").all();
        if (prods && prods.length > 0) {
            const brands = ['NAWAH', 'QUBBAH', 'ALMADINAH'];
            let updatedCount = 0;
            
            prods.forEach((p, idx) => {
                let assigned = (p.brand || '').trim();
                const text = ((p.name_en || '') + ' ' + (p.variety || '') + ' ' + (p.name_ar || '')).toLowerCase();
                
                // إذا كان البراند فارغاً يتم تعيينه بذكاء
                if (!assigned) {
                    if (text.includes('ajwa') || text.includes('madin') || text.includes('عجوة') || text.includes('مدينة')) {
                        assigned = 'ALMADINAH';
                    } else if (text.includes('sukari') || text.includes('sukkari') || text.includes('royal') || text.includes('سكري') || text.includes('قبة')) {
                        assigned = 'QUBBAH';
                    } else {
                        assigned = brands[idx % brands.length];
                    }
                    db.prepare("UPDATE products SET brand = ? WHERE id = ?").run(assigned, p.id);
                    updatedCount++;
                }
            });
            console.log("✅ Auto-assigned brands to " + updatedCount + " products on startup.");
        }
    } catch(err) {
        console.error("Brand auto-repair error:", err.message);
    }
}
autoRepairProductBrands();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'massar-dates-secret-key-change-in-production';

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// File upload config
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'u0x5opyh',
    api_key: process.env.CLOUDINARY_API_KEY || '472159413429157',
    api_secret: process.env.CLOUDINARY_API_SECRET || 'Ab7P54hG8y3GYIGjNc5a_j6twYg'
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'massar-dates',
        allowed_formats: ['jpg', 'png', 'jpeg', 'webp', 'svg', 'gif']
    }
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// Auth middleware
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

// Get site config
app.get('/api/config', (req, res) => {
    const rows = db.prepare('SELECT key, value FROM site_config').all();
    const config = {};
    rows.forEach(r => config[r.key] = r.value);
    res.json(config);
});

// Get active products (public)
app.get('/api/products', (req, res) => {
    const products = db.prepare(`
        SELECT products.*, product_categories.slug AS category_slug,
               product_categories.name_en AS category_name_en,
               product_categories.name_ar AS category_name_ar,
               product_categories.name_ms AS category_name_ms
        FROM products
        LEFT JOIN product_categories ON products.category_id = product_categories.id
        WHERE products.active = 1
        ORDER BY products.sort_order ASC
    `).all();
    const priceStmt = db.prepare('SELECT weight, price FROM product_prices WHERE product_id = ? ORDER BY weight');
    const result = products.map(p => ({
        ...p,
        prices: Object.fromEntries(priceStmt.all(p.id).map(pr => [pr.weight, pr.price]))
    }));
    res.json(result);
});

// Get single product
app.get('/api/products/:slug', (req, res) => {
    const product = db.prepare('SELECT * FROM products WHERE slug = ? AND active = 1').get(req.params.slug);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    const prices = db.prepare('SELECT weight, price FROM product_prices WHERE product_id = ?').all(product.id);
    res.json({ ...product, prices: Object.fromEntries(prices.map(p => [p.weight, p.price])) });
});


// ==================== PRODUCT CATEGORIES ====================

app.get('/api/product-categories', (req, res) => {
    const categories = db.prepare(`
        SELECT *
        FROM product_categories
        WHERE active = 1
        ORDER BY sort_order ASC, id ASC
    `).all();

    res.json(categories);
});

app.get('/api/admin/product-categories', authMiddleware, (req, res) => {
    const categories = db.prepare(`
        SELECT *
        FROM product_categories
        ORDER BY sort_order ASC, id ASC
    `).all();

    res.json(categories);
});

app.post('/api/admin/product-categories', authMiddleware, (req, res) => {
    const {
        slug, name_en, name_ar, name_ms,
        image_url, description_en, description_ar, description_ms,
        sort_order, active
    } = req.body;

    const result = db.prepare(`
        INSERT INTO product_categories
        (slug, name_en, name_ar, name_ms, image_url,
         description_en, description_ar, description_ms,
         sort_order, active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
        slug,
        name_en,
        name_ar || '',
        name_ms || '',
        image_url || '',
        description_en || '',
        description_ar || '',
        description_ms || '',
        Number(sort_order) || 0,
        active === false ? 0 : 1
    );

    res.json({
        id: result.lastInsertRowid,
        message: 'Category created'
    });
});

app.put('/api/admin/product-categories/:id', authMiddleware, (req, res) => {
    const {
        slug, name_en, name_ar, name_ms,
        image_url, description_en, description_ar, description_ms,
        sort_order, active
    } = req.body;

    db.prepare(`
        UPDATE product_categories SET
            slug=?,
            name_en=?,
            name_ar=?,
            name_ms=?,
            image_url=?,
            description_en=?,
            description_ar=?,
            description_ms=?,
            sort_order=?,
            active=?
        WHERE id=?
    `).run(
        slug,
        name_en,
        name_ar || '',
        name_ms || '',
        image_url || '',
        description_en || '',
        description_ar || '',
        description_ms || '',
        Number(sort_order) || 0,
        active ? 1 : 0,
        req.params.id
    );

    res.json({ message: 'Category updated' });
});

app.delete('/api/admin/product-categories/:id', authMiddleware, (req, res) => {
    const used = db.prepare(
        'SELECT COUNT(*) AS count FROM products WHERE category_id = ?'
    ).get(req.params.id);

    if (used.count > 0) {
        return res.status(400).json({
            error: 'This category contains products. Move the products first.'
        });
    }

    db.prepare(
        'DELETE FROM product_categories WHERE id = ?'
    ).run(req.params.id);

    res.json({ message: 'Category deleted' });
});

// ==================== ADMIN API ====================

// Login
app.post('/api/admin/login', (req, res) => {
    const { email, password } = req.body;
    const user = db.prepare('SELECT * FROM admin_users WHERE email = ?').get(email);
    if (!user || !bcrypt.compareSync(password, user.password)) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, email: user.email });
});

// Get ALL products (admin)
app.get('/api/admin/products', authMiddleware, (req, res) => {
    const products = db.prepare('SELECT * FROM products ORDER BY sort_order ASC').all();
    const priceStmt = db.prepare('SELECT weight, price FROM product_prices WHERE product_id = ?');
    const result = products.map(p => ({
        ...p,
        prices: Object.fromEntries(priceStmt.all(p.id).map(pr => [pr.weight, pr.price]))
    }));
    res.json(result);
});
// Create product
app.post('/api/admin/products', authMiddleware, (req, res) => {
    const { slug, name_en, name_ar, name_ms, desc_en, desc_ar, desc_ms,
        category_id, variety, brand, origin, type, texture_en, texture_ar, texture_ms,
        taste_en, taste_ar, taste_ms, badge_en, badge_ar, badge_ms,
        image_url, active, featured, prices, shopee_url, tiktok_url, lazada_url } = req.body;

    const result = db.prepare(`
        INSERT INTO products (
            slug, name_en, name_ar, name_ms, desc_en, desc_ar, desc_ms,
            category_id, variety, brand, origin, type, texture_en, texture_ar, texture_ms,
            taste_en, taste_ar, taste_ms, badge_en, badge_ar, badge_ms,
            image_url, active, featured, shopee_url, tiktok_url, lazada_url
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
        slug || name_en.toLowerCase().replace(/\s+/g, '-'),
        name_en, name_ar || name_en, name_ms || name_en,
        desc_en, desc_ar || desc_en, desc_ms || desc_en,
        category_id || 1,
        variety, brand || '', origin || 'Saudi Arabia', type,
        texture_en, texture_ar, texture_ms,
        taste_en, taste_ar, taste_ms,
        badge_en, badge_ar, badge_ms,
        image_url || '', active ? 1 : 0, featured ? 1 : 0,
        shopee_url || '', tiktok_url || '', lazada_url || ''
    );

    const prodId = result.lastInsertRowid;

    if (prices) {
        const insertPrice = db.prepare(
            'INSERT INTO product_prices (product_id, weight, price) VALUES (?, ?, ?)'
        );
        for (const [weight, price] of Object.entries(prices)) {
            insertPrice.run(prodId, weight, price);
        }
    }

    res.json({ id: prodId, message: 'Product created' });
});
// Update product
app.put('/api/admin/products/:id', authMiddleware, (req, res) => {
    const { name_en, name_ar, name_ms, desc_en, desc_ar, desc_ms,
        category_id, variety, brand, origin, type, texture_en, texture_ar, texture_ms,
        taste_en, taste_ar, taste_ms, badge_en, badge_ar, badge_ms,
        image_url, active, featured, prices, shopee_url, tiktok_url, lazada_url } = req.body;

    db.prepare(`
        UPDATE products SET
            name_en=?, name_ar=?, name_ms=?,
            desc_en=?, desc_ar=?, desc_ms=?,
            category_id=?,
            variety=?, brand=?, origin=?, type=?,
            texture_en=?, texture_ar=?, texture_ms=?,
            taste_en=?, taste_ar=?, taste_ms=?,
            badge_en=?, badge_ar=?, badge_ms=?,
            image_url=?, active=?, featured=?,
            shopee_url=?, tiktok_url=?, lazada_url=?,
            updated_at=CURRENT_TIMESTAMP
        WHERE id=?
    `).run(
        name_en, name_ar, name_ms,
        desc_en, desc_ar, desc_ms,
        category_id || 1,
        variety, brand || '', origin, type,
        texture_en, texture_ar, texture_ms,
        taste_en, taste_ar, taste_ms,
        badge_en, badge_ar, badge_ms,
        image_url || '', active ? 1 : 0, featured ? 1 : 0,
        shopee_url || '', tiktok_url || '', lazada_url || '',
        req.params.id
    );

    if (prices) {
        db.prepare('DELETE FROM product_prices WHERE product_id = ?').run(req.params.id);
        const insertPrice = db.prepare(
            'INSERT INTO product_prices (product_id, weight, price) VALUES (?, ?, ?)'
        );
        for (const [weight, price] of Object.entries(prices)) {
            if (price > 0) {
                insertPrice.run(req.params.id, weight, price);
            }
        }
    }

    res.json({ message: 'Product updated' });
});

// Delete product
app.delete('/api/admin/products/:id', authMiddleware, (req, res) => {
    db.prepare('DELETE FROM product_prices WHERE product_id = ?').run(req.params.id);
    db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
    res.json({ message: 'Product deleted' });
});

// Toggle product active
app.patch('/api/admin/products/:id/toggle', authMiddleware, (req, res) => {
    const p = db.prepare('SELECT active , brand FROM products WHERE id = ?').get(req.params.id);
    if (!p) return res.status(404).json({ error: 'Not found' });
    db.prepare('UPDATE products SET active = ? WHERE id = ?').run(p.active ? 0 : 1, req.params.id);
    res.json({ message: 'Toggled', active: !p.active });
});

// Toggle featured
app.patch('/api/admin/products/:id/featured', authMiddleware, (req, res) => {
    const p = db.prepare('SELECT featured FROM products WHERE id = ?').get(req.params.id);
    if (!p) return res.status(404).json({ error: 'Not found' });
    db.prepare('UPDATE products SET featured = ? WHERE id = ?').run(p.featured ? 0 : 1, req.params.id);
    res.json({ message: 'Toggled', featured: !p.featured });
});

// Update config
app.put('/api/admin/config', authMiddleware, (req, res) => {
    const upsert = db.prepare('INSERT INTO site_config (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value');
    const updateAll = db.transaction((items) => {
        for (const [k, v] of Object.entries(items)) {
            upsert.run(k, v);
        }
    });
    updateAll(req.body);
    res.json({ message: 'Config updated' });
});

// ==================== BRANDS ====================

// Get brands
app.get('/api/admin/brands', authMiddleware, (req, res) => {
    const row = db.prepare(
        "SELECT value FROM site_config WHERE key = 'brands_data'"
    ).get();

    let brands = [];

    if (row && row.value) {
        try {
            brands = JSON.parse(row.value);
        } catch (e) {
            brands = [];
        }
    }

    res.json(brands);
});

// Save brands
app.put('/api/admin/brands', authMiddleware, (req, res) => {
    const brands = Array.isArray(req.body) ? req.body : req.body.brands;

    if (!Array.isArray(brands)) {
        return res.status(400).json({ error: 'Invalid brands data' });
    }

    db.prepare(`
        INSERT INTO site_config (key, value)
        VALUES ('brands_data', ?)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `).run(JSON.stringify(brands));

    res.json({ message: 'Brands saved', brands });
});
// Upload image
app.post('/api/admin/upload', authMiddleware, upload.single('image'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    res.json({ url: req.file.path });
});

// Change password
app.put('/api/admin/password', authMiddleware, (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const user = db.prepare('SELECT * FROM admin_users WHERE id = ?').get(req.admin.id);
    if (!bcrypt.compareSync(currentPassword, user.password)) {
        return res.status(400).json({ error: 'Current password incorrect' });
    }
    const hash = bcrypt.hashSync(newPassword, 10);
    db.prepare('UPDATE admin_users SET password = ? WHERE id = ?').run(hash, req.admin.id);
    res.json({ message: 'Password changed' });
});
// ==================== MESSAGES API (PUBLIC & ADMIN) ====================

// 1. Ø§Ø³ØªÙ‚Ø¨Ø§Ù„ Ø±Ø³Ø§Ù„Ø© Ø¬Ø¯ÙŠØ¯Ø© Ù…Ù† Ø§Ù„Ø¹Ù…ÙŠÙ„ (Ø¹Ø§Ù…)

// ==================== EMAIL & MESSAGES HANDLER ====================
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    tls: { rejectUnauthorized: false }
});

app.post('/api/messages', (req, res) => {
    const name = (req.body && req.body.name) || '';
    const email = (req.body && req.body.email) || '';
    const message = (req.body && req.body.message) || '';

    console.log('ðŸ“© [MASSAR] Ø§Ø³ØªÙ„Ø§Ù… Ø±Ø³Ø§Ù„Ø© Ø¬Ø¯ÙŠØ¯Ø© Ù…Ù†:', name, '| Ø¨Ø±ÙŠØ¯:', email);

    try {
        db.prepare('INSERT INTO messages (name, email, message, is_read, created_at, updated_at) VALUES (?, ?, ?, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)').run(name, email, message);
    } catch (e) {
        try {
            db.prepare('INSERT INTO messages (name, email, message) VALUES (?, ?, ?)').run(name, email, message);
        } catch (err) {
            console.log('Database note:', err.message);
        }
    }

    const mailOptions = {
        from: 'MASSAR DATES <khwlah7712@gmail.com>',
        to: 'khwlah7712@gmail.com',
        subject: 'ðŸ“¬ Ø±Ø³Ø§Ù„Ø© Ø¬Ø¯ÙŠØ¯Ø© Ù…Ù† Ù…ÙˆÙ‚Ø¹ Ù…Ø³Ø§Ø± - Ù…Ù†: ' + name,
        html: '<div style="font-family:Arial,sans-serif;direction:rtl;text-align:right;padding:20px;background:#f9f7f4;border-radius:10px;color:#2c1810;">' +
              '<h2 style="color:#b89568;border-bottom:2px solid #b89568;padding-bottom:10px;">ðŸŒ´ Ø±Ø³Ø§Ù„Ø© Ø¬Ø¯ÙŠØ¯Ø© Ù…Ù† Ù…ÙˆÙ‚Ø¹ MASSAR DATES</h2>' +
              '<p><strong>ðŸ‘¤ Ø§Ø³Ù… Ø§Ù„Ø¹Ù…ÙŠÙ„:</strong> ' + name + '</p>' +
              '<p><strong>ðŸ“§ Ø§Ù„Ø¨Ø±ÙŠØ¯ Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ:</strong> <a href="mailto:' + email + '">' + email + '</a></p>' +
              '<p><strong>ðŸ•’ Ø§Ù„ÙˆÙ‚Øª:</strong> ' + new Date().toLocaleString('ar-SA') + '</p>' +
              '<div style="background:#fff;padding:15px;border-radius:8px;border-right:4px solid #b89568;margin-top:15px;">' +
              '<h4 style="margin:0 0 10px 0;color:#2c1810;">ðŸ’¬ Ù†Øµ Ø§Ù„Ø±Ø³Ø§Ù„Ø©:</h4>' +
              '<p style="white-space:pre-wrap;margin:0;color:#444;line-height:1.7;">' + message + '</p>' +
              '</div>' +
              '</div>'
    };

    transporter.sendMail(mailOptions)
        .then(() => console.log('âœ… [MASSAR] ØªÙ… Ø¥Ø±Ø³Ø§Ù„ Ø§Ù„Ø¥ÙŠÙ…ÙŠÙ„ Ø¨Ù†Ø¬Ø§Ø­ Ø¥Ù„Ù‰: khwlah7712@gmail.com'))
        .catch(err => console.log('âŒ [MASSAR] Ø®Ø·Ø£ ÙÙŠ Ø¥Ø±Ø³Ø§Ù„ Ø§Ù„Ø¥ÙŠÙ…ÙŠÙ„:', err.message));

    let waLink = null;
    try {
        const row = db.prepare("SELECT value FROM site_config WHERE key = 'link_whatsapp'").get();
        const wa = (row && row.value) ? row.value.replace(/[^0-9]/g, '') : '';
        if (wa) {
            waLink = 'https://wa.me/' + wa + '?text=' + encodeURIComponent('ðŸ“© Ø±Ø³Ø§Ù„Ø© Ù…Ù†: ' + name + '\nðŸ“§ Ø§Ù„Ø¨Ø±ÙŠØ¯: ' + email + '\nðŸ’¬ Ø§Ù„Ø±Ø³Ø§Ù„Ø©: ' + message);
        }
    } catch(e) {}

    res.json({ success: true, message: 'Message sent successfully', waLink });
});


// 2. Ø¬Ù„Ø¨ Ø¬Ù…ÙŠØ¹ Ø§Ù„Ø±Ø³Ø§Ø¦Ù„ Ù„Ù„Ù…Ø´Ø±Ù
app.get('/api/admin/messages', authMiddleware, (req, res) => {
    try {
        const { search, filter } = req.query;
        let query = 'SELECT * FROM messages WHERE 1=1';
        let params = [];

        if (filter === 'read') {
            query += ' AND is_read = 1';
        } else if (filter === 'unread') {
            query += ' AND is_read = 0';
        }

        if (search) {
            query += ' AND (name LIKE ? OR email LIKE ? OR message LIKE ?)';
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }

        query += ' ORDER BY created_at DESC';
        const messages = db.prepare(query).all(params);
        res.json(messages);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});

// 3. ØªØ¹Ø¯ÙŠÙ„ Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ø±Ø³Ø§Ù„Ø©
app.put('/api/admin/messages/:id', authMiddleware, (req, res) => {
    try {
        const { name, email, message } = req.body;
        db.prepare(`
            UPDATE messages 
            SET name = ?, email = ?, message = ?, updated_at = CURRENT_TIMESTAMP 
            WHERE id = ?
        `).run(name, email, message, req.params.id);
        
        res.json({ message: 'Message updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update message' });
    }
});

// 4. ØªØºÙŠÙŠØ± Ø­Ø§Ù„Ø© Ø§Ù„Ù‚Ø±Ø§Ø¡Ø©
app.patch('/api/admin/messages/:id/toggle-read', authMiddleware, (req, res) => {
    try {
        const msg = db.prepare('SELECT is_read FROM messages WHERE id = ?').get(req.params.id);
        if (!msg) return res.status(404).json({ error: 'Message not found' });

        const newStatus = msg.is_read === 1 ? 0 : 1;
        db.prepare('UPDATE messages SET is_read = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
          .run(newStatus, req.params.id);

        res.json({ message: 'Status updated', is_read: newStatus });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to toggle read status' });
    }
});

// 5. Ø­Ø°Ù Ø§Ù„Ø±Ø³Ø§Ù„Ø©
app.delete('/api/admin/messages/:id', authMiddleware, (req, res) => {
    try {
        db.prepare('DELETE FROM messages WHERE id = ?').run(req.params.id);
        res.json({ message: 'Message deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to delete message' });
    }
});

// ==================== SPA FALLBACK (ÙŠØ¬Ø¨ Ø£Ù† ÙŠÙƒÙˆÙ† ÙÙŠ Ø§Ù„Ù†Ù‡Ø§ÙŠØ© Ø¯Ø§Ø¦Ù…Ø§Ù‹) ====================

// ==================== BLOG APIS ====================
app.get('/api/blog', (req, res) => {
    try {
        const posts = db.prepare('SELECT id, slug, title_ar, title_en, title_ms, excerpt_ar, excerpt_en, excerpt_ms, image_url, category, published, featured, sort_order, created_at FROM blog_posts WHERE published = 1 ORDER BY featured DESC, sort_order ASC, created_at DESC').all();
        res.json(posts);
    } catch(e) { res.status(500).json({error: e.message}); }
});

app.get('/api/blog/:slug', (req, res) => {
    try {
        const post = db.prepare('SELECT * FROM blog_posts WHERE slug = ? AND published = 1').get(req.params.slug);
        if (!post) return res.status(404).json({error: 'Post not found'});
        const related = db.prepare('SELECT id, slug, title_ar, title_en, title_ms, excerpt_ar, excerpt_en, excerpt_ms, image_url, category, created_at FROM blog_posts WHERE published = 1 AND slug != ? AND category = ? LIMIT 3').all(req.params.slug, post.category);
        res.json({ ...post, related });
    } catch(e) { res.status(500).json({error: e.message}); }
});

app.get('/api/admin/blog', authMiddleware, (req, res) => {
    try {
        const posts = db.prepare('SELECT * FROM blog_posts ORDER BY sort_order ASC, created_at DESC').all();
        res.json(posts);
    } catch(e) { res.status(500).json({error: e.message}); }
});

app.post('/api/admin/blog', authMiddleware, (req, res) => {
    try {
        const b = req.body;
        const r = db.prepare('INSERT INTO blog_posts (slug, title_ar, title_en, title_ms, excerpt_ar, excerpt_en, excerpt_ms, content_ar, content_en, content_ms, image_url, category, published, featured, sort_order) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').run(b.slug, b.title_ar||'', b.title_en||'', b.title_ms||'', b.excerpt_ar||'', b.excerpt_en||'', b.excerpt_ms||'', b.content_ar||'', b.content_en||'', b.content_ms||'', b.image_url||'', b.category||'types-of-dates', b.published?1:0, b.featured?1:0, b.sort_order||0);
        res.json({id: r.lastInsertRowid, message: 'Created'});
    } catch(e) { res.status(500).json({error: e.message}); }
});

app.put('/api/admin/blog/:id', authMiddleware, (req, res) => {
    try {
        const b = req.body;
        db.prepare('UPDATE blog_posts SET slug=?, title_ar=?, title_en=?, title_ms=?, excerpt_ar=?, excerpt_en=?, excerpt_ms=?, content_ar=?, content_en=?, content_ms=?, image_url=?, category=?, published=?, featured=?, sort_order=?, updated_at=CURRENT_TIMESTAMP WHERE id=?').run(b.slug, b.title_ar||'', b.title_en||'', b.title_ms||'', b.excerpt_ar||'', b.excerpt_en||'', b.excerpt_ms||'', b.content_ar||'', b.content_en||'', b.content_ms||'', b.image_url||'', b.category||'types-of-dates', b.published?1:0, b.featured?1:0, b.sort_order||0, req.params.id);
        res.json({message: 'Updated'});
    } catch(e) { res.status(500).json({error: e.message}); }
});

app.delete('/api/admin/blog/:id', authMiddleware, (req, res) => {
    try {
        db.prepare('DELETE FROM blog_posts WHERE id=?').run(req.params.id);
        res.json({message: 'Deleted'});
    } catch(e) { res.status(500).json({error: e.message}); }
});

app.patch('/api/admin/blog/:id/toggle', authMiddleware, (req, res) => {
    try {
        const p = db.prepare('SELECT published FROM blog_posts WHERE id=?').get(req.params.id);
        if(!p) return res.status(404).json({error: 'Not found'});
        db.prepare('UPDATE blog_posts SET published=?, updated_at=CURRENT_TIMESTAMP WHERE id=?').run(p.published?0:1, req.params.id);
        res.json({published: !p.published});
    } catch(e) { res.status(500).json({error: e.message}); }
});

app.patch('/api/admin/blog/:id/featured', authMiddleware, (req, res) => {
    try {
        const p = db.prepare('SELECT featured FROM blog_posts WHERE id=?').get(req.params.id);
        if(!p) return res.status(404).json({error: 'Not found'});
        db.prepare('UPDATE blog_posts SET featured=?, updated_at=CURRENT_TIMESTAMP WHERE id=?').run(p.featured?0:1, req.params.id);
        res.json({featured: !p.featured});
    } catch(e) { res.status(500).json({error: e.message}); }
});


app.get('/api/discover', (req, res) => { try { res.json(db.prepare('SELECT * FROM discover_cards WHERE active = 1 ORDER BY sort_order ASC').all()); } catch(e) { res.status(500).json({error: e.message}) } });
app.get('/api/admin/discover', authMiddleware, (req, res) => { try { res.json(db.prepare('SELECT * FROM discover_cards ORDER BY sort_order ASC').all()); } catch(e) { res.status(500).json({error: e.message}) } });
app.post('/api/admin/discover', authMiddleware, (req, res) => { try { const b=req.body; const r=db.prepare('INSERT INTO discover_cards (image_url,title_ar,title_en,title_ms,desc_ar,desc_en,desc_ms,link,active,sort_order) VALUES (?,?,?,?,?,?,?,?,?,?)').run(b.image_url||'',b.title_ar||'',b.title_en||'',b.title_ms||'',b.desc_ar||'',b.desc_en||'',b.desc_ms||'',b.link||'#',b.active?1:0,b.sort_order||0); res.json({id:r.lastInsertRowid}); } catch(e) { res.status(500).json({error:e.message}) } });
app.put('/api/admin/discover/:id', authMiddleware, (req, res) => { try { const b=req.body; db.prepare('UPDATE discover_cards SET image_url=?,title_ar=?,title_en=?,title_ms=?,desc_ar=?,desc_en=?,desc_ms=?,link=?,active=?,sort_order=? WHERE id=?').run(b.image_url||'',b.title_ar||'',b.title_en||'',b.title_ms||'',b.desc_ar||'',b.desc_en||'',b.desc_ms||'',b.link||'#',b.active?1:0,b.sort_order||0,req.params.id); res.json({message:'Updated'}); } catch(e) { res.status(500).json({error:e.message}) } });
app.delete('/api/admin/discover/:id', authMiddleware, (req, res) => { try { db.prepare('DELETE FROM discover_cards WHERE id=?').run(req.params.id); res.json({message:'Deleted'}); } catch(e) { res.status(500).json({error:e.message}) } });


app.get('/{*splat}', (req, res) => {
    if (req.path.startsWith('/admin')) {
        res.sendFile(path.join(__dirname, 'public', 'admin.html'));
    } else {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    }
});

// ØªØ´ØºÙŠÙ„ Ø§Ù„Ø³ÙŠØ±ÙØ±
app.listen(PORT, () => {
    console.log(`\nðŸŒ´ MASSAR DATES Server Running`);
    console.log(`ðŸ“ Website: http://localhost:${PORT}`);
    console.log(`ðŸ”’ Admin:   http://localhost:${PORT}/admin`);
});


