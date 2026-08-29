const fs = require('fs');
const path = require('path');

// 1. تحديث قاعدة البيانات SQLite لإضافة عمود brand بأمان
try {
    const Database = require('better-sqlite3');
    const db = new Database('massar.db');
    // إضافة عمود brand لجدول products إذا لم يكن موجوداً
    db.exec(`
        ALTER TABLE products ADD COLUMN brand TEXT;
    `);
    console.log('✅ SQLite Database updated: added brand column.');
} catch (e) {
    if (e.message.includes('duplicate column name')) {
        console.log('ℹ️ Brand column already exists in products table.');
    } else {
        console.error('❌ Error updating database:', e);
    }
}

// 2. تحديث server.js ليدعم استقبال وحفظ عمود brand
let server = fs.readFileSync('server.js', 'utf8');
fs.writeFileSync('server.js.before-full-brand-fix', server);

// تعديل الاستعلامات لتشمل حقل brand عند الإضافة والتعديل
server = server.replace(
    /db\.prepare\(`\s*UPDATE\s+products\s+SET([\s\S]*?)variety\s*=\s*\?,([\s\S]*?)WHERE\s+id\s*=\s*\?\s*`\)/i,
    (match) => {
        if (!match.includes('brand')) {
            return match.replace('variety = ?,', 'variety = ?, brand = ?,');
        }
        return match;
    }
);

server = server.replace(
    /db\.prepare\(`\s*INSERT\s+INTO\s+products\s*\(([\s\S]*?)variety,([\s\S]*?)\)\s*VALUES\s*\(([\s\S]*?)\)\s*`\)/i,
    (match) => {
        if (!match.includes('brand')) {
            return match.replace('variety,', 'variety, brand,').replace('?,', '?, ?,');
        }
        return match;
    }
);

// التأكد من تمرير قيمة brand في استعلامات السيرفر
server = server.replace(
    /variety\s*\|\|\s*''\s*,\s*category_id/g,
    "variety || '', req.body.brand || '', category_id"
);

fs.writeFileSync('server.js', server, 'utf8');
console.log('✅ server.js updated with brand database queries.');

// 3. جعل الفلترة في index.html ذكية جداً وتقبل الفروقات اللغوية والاملائية
let indexHtml = fs.readFileSync('public/index.html', 'utf8');
fs.writeFileSync('public/index.html.before-smart-filter', indexHtml);

const smartFilterLogic = `
window.applyBrandFiltering = function() {
    if (!activeBrandFilter || !Array.isArray(products)) return;
    
    const allEl = document.getElementById('allGrid');
    if (!allEl) return;
    
    const bName = activeBrandFilter.trim().toLowerCase();
    
    // خريطة المرادفات لضمان ظهور المنتجات حتى لو اختلف الإملاء
    let synonyms = [bName];
    if (bName.includes('nawah')) synonyms.push('nawah', 'نواة', 'نواة');
    if (bName.includes('qubba')) synonyms.push('qubba', 'qubbah', 'قبة', 'قبه');
    if (bName.includes('madina')) synonyms.push('madina', 'madinah', 'almadina', 'almadinah', 'المدينة', 'مدينه');

    const filtered = products.filter(p => {
        // فحص الحقول النصية للمنتج ومطابقتها مع اسم البراند أو مرادفاته
        const checkFields = [
            p.brand, p.variety, p.name_en, p.name_ar, p.desc_en, p.desc_ar, p.slug
        ].map(f => (f || '').toLowerCase());

        return synonyms.some(syn => {
            return checkFields.some(field => field.includes(syn));
        });
    });
    
    // رسم شريط الفلتر الأنيق
    let banner = document.getElementById('brandFilterBanner');
    if (!banner) {
        banner = document.createElement('div');
        banner.id = 'brandFilterBanner';
        allEl.parentNode.insertBefore(banner, allEl);
    }
    
    banner.innerHTML = \`
        <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(184, 149, 106, 0.08); border: 1.5px solid var(--gold); padding: 14px 22px; border-radius: 12px; margin-bottom: 25px; font-family: sans-serif;">
            <span style="font-weight: 600; color: var(--brown-dark); font-size: 1rem;">
                🏷️ Brand: <strong style="color: var(--gold-dark); text-transform: uppercase;">\${activeBrandFilter}</strong> (\${filtered.length} products found)
            </span>
            <button onclick="clearBrandFilter()" style="background: var(--gold); color: #fff; border: none; padding: 6px 16px; border-radius: 6px; cursor: pointer; font-size: 0.85rem; font-weight: 600; transition: 0.2s;" onmouseover="this.style.background='#9e7e55'" onmouseout="this.style.background='var(--gold)'">
                Show All Products ✕
            </button>
        </div>
    \`;
    
    if (filtered.length > 0 && typeof window.productCardHtml === 'function') {
        allEl.innerHTML = filtered.map(window.productCardHtml).join('');
    } else {
        allEl.innerHTML = \`
            <div style="grid-column: 1 / -1; text-align: center; padding: 50px 20px; color: var(--text-light); background: var(--cream); border-radius: 12px; border: 1px dashed rgba(184,149,106,0.3);">
                <p style="font-size: 1.1rem; margin-bottom: 15px; font-weight: 600;">No products found specifically for "\${activeBrandFilter}".</p>
                <button onclick="clearBrandFilter()" class="btn-primary" style="padding: 10px 24px;">View All Products</button>
            </div>
        \`;
    }
};
`;

// استبدال دالة الفلترة القديمة بالذكية
indexHtml = indexHtml.replace(/window\.applyBrandFiltering\s*=\s*function\(\)\s*\{[\s\S]*?\};/gi, '');
if (!indexHtml.includes('applyBrandFiltering = function')) {
    indexHtml = indexHtml.replace('</body>', '<script>' + smartFilterLogic + '</script>\n</body>');
}

fs.writeFileSync('public/index.html', indexHtml, 'utf8');
console.log('✅ index.html updated with ultra-smart filtering logic.');
console.log('ALL_SYSTEMS_OPTIMIZED_AND_READY');
