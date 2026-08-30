require('dotenv').config();
const SQLite = require('better-sqlite3');
const { Pool } = require('pg');

const sqlite = new SQLite('massar.db');
const pg = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function copy(table, columns, conflict) {
  const rows = sqlite.prepare(`SELECT ${columns.join(',')} FROM ${table}`).all();
  for (const row of rows) {
    const values = columns.map(c => row[c]);
    const marks = columns.map((_, i) => `$${i + 1}`).join(',');
    await pg.query(
      `INSERT INTO ${table} (${columns.join(',')}) VALUES (${marks}) ON CONFLICT ${conflict} DO NOTHING`,
      values
    );
  }
  console.log(`✅ ${table}: ${rows.length}`);
}

(async () => {
  try {
    await copy('admin_users', ['id','email','password'], '(email)');

    await copy('product_categories', [
      'id','slug','name_en','name_ar','name_ms','image_url',
      'description_en','description_ar','description_ms','sort_order','active'
    ], '(slug)');

    await copy('products', [
      'id','slug','category_id','name_en','name_ar','name_ms',
      'desc_en','desc_ar','desc_ms','variety','origin','type',
      'texture_en','texture_ar','texture_ms','taste_en','taste_ar','taste_ms',
      'image_url','badge_en','badge_ar','badge_ms','brand',
      'shopee_url','lazada_url','tiktok_url','active','featured','sort_order'
    ], '(slug)');

    await copy('product_prices', ['product_id','weight','price'], '(product_id, weight)');
    await copy('site_config', ['key','value'], '(key)');

    await copy('blog_posts', [
      'slug','title_ar','title_en','title_ms','excerpt_ar','excerpt_en','excerpt_ms',
      'content_ar','content_en','content_ms','image_url','category',
      'published','featured','sort_order'
    ], '(slug)');

    await copy('discover_cards', [
      'id','image_url','title_ar','title_en','title_ms',
      'desc_ar','desc_en','desc_ms','link','active','sort_order'
    ], '(id)');

    await copy('messages', ['id','name','email','message','is_read'], '(id)');

    await pg.query("SELECT setval('products_id_seq', COALESCE((SELECT MAX(id) FROM products),1))");
    await pg.query("SELECT setval('product_categories_id_seq', COALESCE((SELECT MAX(id) FROM product_categories),1))");

    console.log('🎉 تم نقل البيانات إلى Supabase بنجاح');
  } catch (e) {
    console.error('❌ خطأ:', e.message);
  } finally {
    await pg.end();
}
})();
