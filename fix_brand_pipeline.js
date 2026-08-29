const fs = require('fs');
const Database = require('better-sqlite3');

console.log('--- 1. فحص وتحديث المنتجات في قاعدة البيانات ---');
const db = new Database('massar.db');

// تحديث بعض المنتجات بأسماء البراندات لتجربة الفلترة فوراً
const allProducts = db.prepare('SELECT id, name_en, variety, brand FROM products').all();
console.log('Current products found:', allProducts.length);

if (allProducts.length > 0) {
    // توزيع أول 3 براندات على المنتجات كتجربة مباشرة
    const brands = ['NAWAH', 'QUBBAH', 'ALMADINAH'];
    allProducts.forEach((p, idx) => {
        const assignedBrand = p.brand || brands[idx % brands.length];
        db.prepare('UPDATE products SET brand = ? WHERE id = ?').run(assignedBrand, p.id);
        console.log(`Updated Product [${p.id}] "${p.name_en || 'Product'}" => Brand: ${assignedBrand}`);
    });
}

console.log('\n--- 2. تحديث استعلام جلب المنتجات في server.js ---');
let server = fs.readFileSync('server.js', 'utf8');

// التأكد من أن GET /api/products يجلب عمود brand
if (server.includes("app.get('/api/products'")) {
    server = server.replace(
        /SELECT\s+([a-zA-Z0-9_,\s]+)\s+FROM\s+products/i,
        (match, cols) => {
            if (!cols.includes('brand') && !cols.includes('*')) {
                return match.replace('FROM products', ', brand FROM products');
            }
            return match;
        }
    );
    fs.writeFileSync('server.js', server, 'utf8');
    console.log('✅ server.js GET query verified/updated.');
}

console.log('\n--- 3. ربط الفلترة داخل دالة العرض الأساسية في index.html ---');
let indexHtml = fs.readFileSync('public/index.html', 'utf8');

const filterIntegrationScript = `
<script>
window.selectedBrandName = null;

// دالة الضغط على زر البراند
window.filterByBrand = function(brandName) {
    window.selectedBrandName = (brandName || '').trim();
    
    // الانتقال لقسم المنتجات
    if (typeof navigateTo === 'function') {
        navigateTo('products');
    }
    
    setTimeout(() => {
        executeBrandFilterUI();
        const target = document.getElementById('allGrid') || document.getElementById('products');
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 150);
};

window.clearBrandFilter = function() {
    window.selectedBrandName = null;
    const banner = document.getElementById('brandFilterNotice');
    if (banner) banner.remove();
    if (typeof renderProducts === 'function') {
        renderProducts();
    }
};

function executeBrandFilterUI() {
    if (!window.selectedBrandName || !Array.isArray(products)) return;
    
    const allEl = document.getElementById('allGrid');
    if (!allEl) return;
    
    const targetBrand = window.selectedBrandName.toLowerCase();
    
    // فلترة المنتجات حسب البراند
    const matched = products.filter(p => {
        const pBrand = (p.brand || '').toLowerCase();
        const pVar = (p.variety || '').toLowerCase();
        const pNameEn = (p.name_en || '').toLowerCase();
        const pNameAr = (p.name_ar || '').toLowerCase();
        
        return pBrand.includes(targetBrand) || 
               targetBrand.includes(pBrand && pBrand.length > 2 ? pBrand : '___') ||
               pVar.includes(targetBrand) ||
               pNameEn.includes(targetBrand) ||
               pNameAr.includes(targetBrand);
    });

    // إضافة شريط الإشعار الأنيق
    let banner = document.getElementById('brandFilterNotice');
    if (!banner) {
        banner = document.createElement('div');
        banner.id = 'brandFilterNotice';
        allEl.parentNode.insertBefore(banner, allEl);
    }

    banner.innerHTML = \`
        <div style="display:flex; justify-content:space-between; align-items:center; background:#fdf8f0; border:2px solid #b8956a; padding:12px 20px; border-radius:10px; margin-bottom:25px;">
            <div style="font-size:1.05rem; font-weight:bold; color:#2d3748;">
                🏷️ منتجات براند: <span style="color:#b8956a; text-transform:uppercase;">\${window.selectedBrandName}</span> (\${matched.length} منتج)
            </div>
            <button onclick="clearBrandFilter()" style="background:#b8956a; color:white; border:none; padding:7px 16px; border-radius:6px; font-weight:bold; cursor:pointer;">
                عرض كل المنتجات ✕
            </button>
        </div>
    \`;

    if (matched.length > 0 && typeof window.productCardHtml === 'function') {
        allEl.innerHTML = matched.map(window.productCardHtml).join('');
    } else {
        allEl.innerHTML = \`
            <div style="grid-column:1/-1; text-align:center; padding:50px 20px; background:#fdfdfd; border-radius:12px; border:1px dashed #cbd5e1;">
                <p style="font-size:1.1rem; color:#64748b; font-weight:600; margin-bottom:15px;">لا توجد منتجات مخصصة حالياً لبراند "\${window.selectedBrandName}".</p>
                <button onclick="clearBrandFilter()" class="btn-primary" style="padding:9px 22px;">عرض جميع المنتجات</button>
            </div>
        \`;
    }
}

// دمج الفلترة عند كل استدعاء لعرض المنتجات
const originalRenderProducts = window.renderProducts;
window.renderProducts = function() {
    if (typeof originalRenderProducts === 'function') {
        originalRenderProducts();
    }
    if (window.selectedBrandName) {
        executeBrandFilterUI();
    }
};
</script>
`;

// إزالة أي نسخ قديمة وحقن النسخة الجديدة النظيفة
indexHtml = indexHtml.replace(/<script id="brand-filter-engine">[\s\S]*?<\/script>/gi, '');
indexHtml = indexHtml.replace('</body>', '<script id="brand-filter-engine">' + filterIntegrationScript + '</script>\n</body>');

fs.writeFileSync('public/index.html', indexHtml, 'utf8');
console.log('✅ index.html brand engine successfully installed.');
console.log('\n🎉 ALL FIXES APPLIED SUCCESSFULLY!');
