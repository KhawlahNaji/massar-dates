require('dotenv').config();
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const express = require('express');
const path = require('path');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const nodemailer = require('nodemailer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'massar-dates-super-secret-jwt-key';

// ===== PostgreSQL فقط (بدون massar.db) =====
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

app.use(cors());
app.use(express.json({ limit: '15mb' }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ===== Cloudinary =====
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY)
  ? new CloudinaryStorage({
      cloudinary,
      params: {
        folder: 'massar-dates',
        allowed_formats: ['jpg', 'png', 'jpeg', 'webp', 'avif', 'svg']
      }
    })
  : multer.diskStorage({
      destination: (req, file, cb) => cb(null, path.join(__dirname, 'uploads')),
      filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '-'))
    });

const upload = multer({ storage });

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

// ===== Messages =====
app.post('/api/messages', async (req, res) => {
  try {
    const name = (req.body && req.body.name) || 'عميل جديد';
    const email = (req.body && req.body.email) || '';
    const message = (req.body && req.body.message) || '';
    console.log('📩 Message from:', name);

    try {
      await pool.query(
        'INSERT INTO messages (name, email, message, is_read, created_at, updated_at) VALUES ($1,$2,$3,0,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)',
        [name, email, message]
      );
    } catch (e) {
      console.log('msg save warn:', e.message);
    }

    try {
      const emailUser = (process.env.EMAIL_USER || '').trim();
      const emailPass = (process.env.EMAIL_PASS || '').replace(/\s+/g, '');
      const emailTo = process.env.EMAIL_TO || emailUser;
      if (emailUser && emailPass) {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: { user: emailUser, pass: emailPass },
          tls: { rejectUnauthorized: false }
        });
        await transporter.sendMail({
          from: '"MASSAR DATES" <' + emailUser + '>',
          to: emailTo,
          replyTo: email || undefined,
          subject: 'رسالة جديدة من: ' + name,
          html: '<div dir="rtl" style="font-family:Arial,sans-serif"><h2>رسالة جديدة</h2><p><strong>الاسم:</strong> ' + name + '</p><p><strong>البريد:</strong> ' + email + '</p><p><strong>الرسالة:</strong></p><p>' + String(message).replace(/</g,'&lt;') + '</p></div>'
        });
        console.log('✅ Email sent to', emailTo);
      }
    } catch (err) {
      console.log('⚠️ Email error:', err.message);
    }

    const waNumber = '601111134716';
    const waText = encodeURIComponent('🌴 رسالة من MASSAR DATES:\n\n👤 ' + name + '\n📧 ' + email + '\n💬 ' + message);
    const waLink = 'https://wa.me/' + waNumber + '?text=' + waText;

    return res.json({ success: true, message: 'تم الاستلام', waLink });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message });
  }
});

// ===== Config =====
app.get(['/api/config', '/api/site-config'], async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT key, value FROM site_config');
    const config = {};
    rows.forEach(r => config[r.key] = r.value);
    res.json(config);
  } catch (e) { res.json({}); }
});

app.put('/api/admin/config', authMiddleware, async (req, res) => {
  try {
    for (const [k, v] of Object.entries(req.body || {})) {
      const val = typeof v === 'object' ? JSON.stringify(v) : String(v);
      await pool.query(
        'INSERT INTO site_config (key, value) VALUES ($1,$2) ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value',
        [k, val]
      );
    }
    res.json({ message: 'Saved' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ===== Categories =====
app.get(['/api/categories', '/api/product-categories', '/api/admin/product-categories'], async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM product_categories ORDER BY sort_order ASC, id ASC');
    res.json(rows);
  } catch (e) { res.json([]); }
});

app.post(['/api/product-categories', '/api/admin/product-categories'], authMiddleware, async (req, res) => {
  try {
    const b = req.body || {};
    const slug = ((b.slug || b.name_en || 'cat') + '').toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now().toString().slice(-3);
    const { rows } = await pool.query(
      'INSERT INTO product_categories (slug,name_en,name_ar,name_ms,image_url,description_en,description_ar,description_ms,sort_order,active) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id',
      [slug, b.name_en||'', b.name_ar||'', b.name_ms||'', b.image_url||'', b.description_en||'', b.description_ar||'', b.description_ms||'', Number(b.sort_order)||0, b.active!==undefined?(b.active?1:0):1]
    );
    res.json({ success: true, id: rows[0].id });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put(['/api/product-categories/:id', '/api/admin/product-categories/:id'], authMiddleware, async (req, res) => {
  try {
    const b = req.body || {};
    await pool.query(
      'UPDATE product_categories SET name_en=COALESCE($1,name_en), name_ar=COALESCE($2,name_ar), name_ms=COALESCE($3,name_ms), image_url=COALESCE($4,image_url), description_en=COALESCE($5,description_en), description_ar=COALESCE($6,description_ar), description_ms=COALESCE($7,description_ms), sort_order=COALESCE($8,sort_order), active=COALESCE($9,active) WHERE id=$10',
      [b.name_en, b.name_ar, b.name_ms, b.image_url, b.description_en, b.description_ar, b.description_ms, b.sort_order, b.active!==undefined?(b.active?1:0):null, req.params.id]
    );
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete(['/api/product-categories/:id', '/api/admin/product-categories/:id'], authMiddleware, async (req, res) => {
  try {
    await pool.query('DELETE FROM product_categories WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ===== Products =====
async function getProducts(all) {
  const q = all
    ? 'SELECT * FROM products ORDER BY sort_order ASC, id ASC'
    : 'SELECT * FROM products WHERE active = 1 ORDER BY sort_order ASC, id ASC';
  const { rows: prods } = await pool.query(q);
  const { rows: prices } = await pool.query('SELECT product_id, weight, price FROM product_prices');
  const map = {};
  prices.forEach(pr => {
    if (!map[pr.product_id]) map[pr.product_id] = {};
    map[pr.product_id][pr.weight] = Number(pr.price);
  });
  return prods.map(p => ({ ...p, prices: map[p.id] || {} }));
}

app.get('/api/products', async (req, res) => {
  try { res.json(await getProducts(false)); } catch (e) { console.error('API_PRODUCTS_ERROR:', e.message); res.status(500).json({ error: e.message }); }
});

app.get('/api/admin/products', authMiddleware, async (req, res) => {
  try { res.json(await getProducts(true)); } catch (e) { console.error('API_ADMIN_PRODUCTS_ERROR:', e.message); res.status(500).json({ error: e.message }); }
});

app.get('/api/products/:slug', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM products WHERE (slug=$1 OR id::text=$1) AND active=1', [req.params.slug]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    const p = rows[0];
    const { rows: prices } = await pool.query('SELECT weight, price FROM product_prices WHERE product_id=$1', [p.id]);
    res.json({ ...p, prices: Object.fromEntries(prices.map(pr => [pr.weight, Number(pr.price)])) });
  } catch (e) { res.status(404).json({ error: 'Not found' }); }
});

app.post('/api/admin/products', authMiddleware, async (req, res) => {
  try {
    const b = req.body || {};
    const slug = ((b.slug || b.name_en || 'prod') + '').toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now().toString().slice(-4);
    const { rows } = await pool.query(
      `INSERT INTO products (slug,category_id,name_en,name_ar,name_ms,desc_en,desc_ar,desc_ms,variety,brand,origin,type,texture_en,texture_ar,texture_ms,taste_en,taste_ar,taste_ms,badge_en,badge_ar,badge_ms,image_url,active,featured,shopee_url,tiktok_url,lazada_url,sort_order)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28) RETURNING id`,
      [slug, b.category_id||1, b.name_en, b.name_ar||b.name_en, b.name_ms||b.name_en, b.desc_en||'', b.desc_ar||'', b.desc_ms||'', b.variety||'', b.brand||'', b.origin||'Saudi Arabia', b.type||'', b.texture_en||'', b.texture_ar||'', b.texture_ms||'', b.taste_en||'', b.taste_ar||'', b.taste_ms||'', b.badge_en||'', b.badge_ar||'', b.badge_ms||'', b.image_url||'', b.active!==undefined?(b.active?1:0):1, b.featured?1:0, b.shopee_url||'', b.tiktok_url||'', b.lazada_url||'', Number(b.sort_order)||0]
    );
    const prodId = rows[0].id;
    if (b.prices) {
      for (const [w, pr] of Object.entries(b.prices)) {
        if (Number(pr) > 0) await pool.query('INSERT INTO product_prices (product_id,weight,price) VALUES ($1,$2,$3)', [prodId, w, Number(pr)]);
      }
    }
    res.json({ id: prodId, success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/admin/products/:id', authMiddleware, async (req, res) => {
  try {
    const b = req.body || {};
    await pool.query(
      `UPDATE products SET
        category_id=COALESCE($1,category_id), name_en=COALESCE($2,name_en), name_ar=COALESCE($3,name_ar), name_ms=COALESCE($4,name_ms),
        desc_en=COALESCE($5,desc_en), desc_ar=COALESCE($6,desc_ar), desc_ms=COALESCE($7,desc_ms),
        variety=COALESCE($8,variety), brand=COALESCE($9,brand), origin=COALESCE($10,origin), type=COALESCE($11,type),
        texture_en=COALESCE($12,texture_en), texture_ar=COALESCE($13,texture_ar), texture_ms=COALESCE($14,texture_ms),
        taste_en=COALESCE($15,taste_en), taste_ar=COALESCE($16,taste_ar), taste_ms=COALESCE($17,taste_ms),
        badge_en=COALESCE($18,badge_en), badge_ar=COALESCE($19,badge_ar), badge_ms=COALESCE($20,badge_ms),
        image_url=COALESCE($21,image_url), active=COALESCE($22,active), featured=COALESCE($23,featured),
        shopee_url=COALESCE($24,shopee_url), tiktok_url=COALESCE($25,tiktok_url), lazada_url=COALESCE($26,lazada_url),
        sort_order=COALESCE($27,sort_order), updated_at=CURRENT_TIMESTAMP
       WHERE id=$28`,
      [b.category_id, b.name_en, b.name_ar, b.name_ms, b.desc_en, b.desc_ar, b.desc_ms, b.variety, b.brand, b.origin, b.type, b.texture_en, b.texture_ar, b.texture_ms, b.taste_en, b.taste_ar, b.taste_ms, b.badge_en, b.badge_ar, b.badge_ms, b.image_url, b.active!==undefined?(b.active?1:0):null, b.featured!==undefined?(b.featured?1:0):null, b.shopee_url, b.tiktok_url, b.lazada_url, b.sort_order, req.params.id]
    );
    if (b.prices) {
      await pool.query('DELETE FROM product_prices WHERE product_id=$1', [req.params.id]);
      for (const [w, pr] of Object.entries(b.prices)) {
        if (Number(pr) > 0) await pool.query('INSERT INTO product_prices (product_id,weight,price) VALUES ($1,$2,$3)', [req.params.id, w, Number(pr)]);
      }
    }
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/admin/products/:id', authMiddleware, async (req, res) => {
  try {
    await pool.query('DELETE FROM product_prices WHERE product_id=$1', [req.params.id]);
    await pool.query('DELETE FROM products WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ===== Auth + Upload =====
app.post('/api/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const { rows } = await pool.query('SELECT * FROM admin_users WHERE email=$1', [email]);
    const user = rows[0];
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, email: user.email });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/admin/upload', authMiddleware, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  const fileUrl = req.file.path || req.file.url || ('/uploads/' + req.file.filename);
  console.log('📸 Cloud image:', fileUrl);
  res.json({ url: fileUrl });
});

// ===== Blog =====
app.get('/api/blog', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM blog_posts WHERE published=1 ORDER BY featured DESC, sort_order ASC');
    res.json(rows);
  } catch (e) { res.json([]); }
});

app.get('/api/blog/:slug', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM blog_posts WHERE slug=$1', [req.params.slug]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    const { rows: related } = await pool.query('SELECT * FROM blog_posts WHERE slug!=$1 LIMIT 3', [req.params.slug]);
    res.json({ ...rows[0], related });
  } catch (e) { res.status(404).json({ error: 'Not found' }); }
});

app.use('/api', (req, res) => res.status(404).json({ error: 'API route not found' }));

app.get(/.*/, (req, res) => {
  if (req.path.startsWith('/admin')) {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
  } else {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  }
});


// POSTGRES STARTUP DIAGNOSTIC
pool.query('SELECT current_database() AS db, current_user AS db_user, (SELECT COUNT(*)::int FROM products) AS products_count')
  .then(({ rows }) => console.log('POSTGRES_DIAGNOSTIC_OK', rows[0]))
  .catch(err => console.error('POSTGRES_DIAGNOSTIC_ERROR', err.message));

app.listen(PORT, () => {
  console.log('\n🌴 MASSAR DATES (Postgres+Cloudinary) on http://localhost:' + PORT);
});

