const fs = require('fs');

console.log('1. ربط المنتجات الحالية بالبراندات في قاعدة البيانات...');
try {
    const Database = require('better-sqlite3');
    const db = new Database('massar.db');
    
    // التأكد من وجود عمود brand
    try {
        db.exec('ALTER TABLE products ADD COLUMN brand TEXT;');
    } catch(e) {}

    const prods = db.prepare('SELECT id, name_en, variety, brand FROM products').all();
    const brands = ['NAWAH', 'QUBBAH', 'ALMADINAH'];
    
    prods.forEach((p, idx) => {
        let b = p.brand;
        const n = ((p.name_en || '') + ' ' + (p.variety || '')).toLowerCase();
        if (!b || b.trim() === '') {
            if (n.includes('ajwa') || n.includes('madin')) b = 'ALMADINAH';
            else if (n.includes('sukari') || n.includes('sukkari') || n.includes('royal') || n.includes('qubba')) b = 'QUBBAH';
            else b = brands[idx % brands.length];
            db.prepare('UPDATE products SET brand = ? WHERE id = ?').run(b, p.id);
        }
    });
    console.log('✅ تم تعيين وتحديث براندات المنتجات في قاعدة البيانات.');
} catch(err) {
    console.log('ملاحظة قاعدة البيانات:', err.message);
}

console.log('2. تحديث كود صفحة public/index.html...');
let html = fs.readFileSync('public/index.html', 'utf8');

// محرك الفلترة المتكامل المانع للتعارض
const runtimeBrandScript = `
<script id="massar-brand-filter-system">
window.currentFilteredBrand = null;

window.filterBrandByName = function(brandName) {
    window.currentFilteredBrand = brandName ? brandName.trim() : null;
    
    if (typeof navigateTo === 'function') {
        navigateTo('products');
    }
    
    setTimeout(function() {
        window.applyBrandFilterNow();
        const target = document.getElementById('allGrid') || document.getElementById('products');
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, 100);
};

window.clearBrandFilterView = function() {
    window.currentFilteredBrand = null;
    const banner = document.getElementById('brandFilterActiveBanner');
    if (banner) banner.remove();
    if (typeof renderProducts === 'function') {
        renderProducts();
    }
};

window.applyBrandFilterNow = function() {
    if (!window.currentFilteredBrand) return;
    const allEl = document.getElementById('allGrid');
    if (!allEl) return;
    
    let list = (typeof products !== 'undefined' && Array.isArray(products)) ? products : (window.products || []);
    const bTarget = window.currentFilteredBrand.toLowerCase();

    const filtered = list.filter(function(p) {
        const b = (p.brand || '').toLowerCase();
        const v = (p.variety || '').toLowerCase();
        const ne = (p.name_en || '').toLowerCase();
        const na = (p.name_ar || '').toLowerCase();
        return b.includes(bTarget) || (b && bTarget.includes(b)) || v.includes(bTarget) || ne.includes(bTarget) || na.includes(bTarget);
    });

    // شريط الفلتر العلوي
    let banner = document.getElementById('brandFilterActiveBanner');
    if (!banner) {
        banner = document.createElement('div');
        banner.id = 'brandFilterActiveBanner';
        allEl.parentNode.insertBefore(banner, allEl);
    }

    banner.innerHTML = '<div style="display:flex; justify-content:space-between; align-items:center; background:#fff8ef; border:2px solid #b8956a; padding:14px 20px; border-radius:10px; margin-bottom:25px; box-shadow:0 3px 8px rgba(184,149,106,0.15);">' +
        '<div style="font-size:1.1rem; font-weight:bold; color:#2d3748;">' +
            '🏷️ Brand: <span style="color:#b8956a; text-transform:uppercase;">' + window.currentFilteredBrand + '</span> (' + filtered.length + ' Products)' +
        '</div>' +
        '<button onclick="window.clearBrandFilterView()" style="background:#b8956a; color:white; border:none; padding:7px 18px; border-radius:6px; font-weight:bold; cursor:pointer;">Show All Products ✕</button>' +
    '</div>';

    if (filtered.length > 0 && typeof window.productCardHtml === 'function') {
        allEl.innerHTML = filtered.map(window.productCardHtml).join('');
    } else {
        allEl.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:50px 20px; color:#718096; background:#f8fafc; border-radius:10px; font-size:1.1rem;">No products found for "' + window.currentFilteredBrand + '".</div>';
    }
};

// اعتراض الضغط على أزرار البراندات في الصفحة كاملة
document.addEventListener('click', function(e) {
    const btn = e.target.closest('#brandsPortfolioGrid button, .brands-portfolio-section button, #brandsPortfolioGrid a');
    if (!btn) return;
    const card = btn.closest('div[style*="border-radius"]') || btn.parentElement.parentElement;
    const h3 = card ? card.querySelector('h3') : null;
    if (h3) {
        e.preventDefault();
        e.stopPropagation();
        window.filterBrandByName(h3.textContent.trim());
    }
}, true);
</script>
`;

// تنظيف أي أكواد سابقة وحقن المحرك النظيف
html = html.replace(/<script id="massar-brand-filter-system">[\s\S]*?<\/script>/gi, '');
html = html.replace(/<script id="brand-core-engine">[\s\S]*?<\/script>/gi, '');
html = html.replace('</body>', runtimeBrandScript + '\n</body>');

fs.writeFileSync('public/index.html', html, 'utf8');
console.log('✅ تم تحديث كود الموقع بنجاح تام وبترميز UTF-8 سليم!');
