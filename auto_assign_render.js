const fs = require('fs');

console.log('1. حقن كود التوزيع التلقائي في server.js...');
let server = fs.readFileSync('server.js', 'utf8');

const autoAssignOnBoot = `
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
`;

// إزالة أي كود قديم وحقن الكود الجديد
server = server.replace(/\/\/ AUTO-ASSIGN BRANDS[\s\S]*?autoRepairProductBrands\(\);/gi, '');
server = server.replace(/(const\s+app\s*=\s*express\(\);)/, autoAssignOnBoot + '\n$1');
fs.writeFileSync('server.js', server, 'utf8');

console.log('2. تحديث كود الفلترة في public/index.html...');
let html = fs.readFileSync('public/index.html', 'utf8');

const clientFilterScript = `
<script id="massar-brand-final-filter">
window.filterByBrand = function(brandName) {
    if (!brandName) return;
    const bName = brandName.trim();
    
    if (typeof navigateTo === 'function') {
        navigateTo('products');
    }
    
    setTimeout(function() {
        const allEl = document.getElementById('allGrid');
        if (!allEl) return;
        
        let prods = (typeof products !== 'undefined' && Array.isArray(products)) ? products : (window.products || []);
        const bLower = bName.toLowerCase();
        
        // تصفية ذكية للغاية
        const filtered = prods.filter(function(p) {
            const b = (p.brand || '').toLowerCase();
            const v = (p.variety || '').toLowerCase();
            const ne = (p.name_en || '').toLowerCase();
            const na = (p.name_ar || '').toLowerCase();
            const text = b + ' ' + v + ' ' + ne + ' ' + na;
            
            if (bLower.includes('nawah') && (text.includes('nawah') || text.includes('نواة'))) return true;
            if (bLower.includes('qubba') && (text.includes('qubba') || text.includes('قبة') || text.includes('sukari') || text.includes('سكري'))) return true;
            if (bLower.includes('madina') && (text.includes('madina') || text.includes('ajwa') || text.includes('عجوة') || text.includes('المدينة'))) return true;
            
            return b.includes(bLower) || text.includes(bLower);
        });
        
        // شريط التصفية الذهبي
        let notice = document.getElementById('brandFilterNotice');
        if (!notice) {
            notice = document.createElement('div');
            notice.id = 'brandFilterNotice';
            allEl.parentNode.insertBefore(notice, allEl);
        }
        
        notice.innerHTML = '<div style="display:flex; justify-content:space-between; align-items:center; background:#fdf8ef; border:2px solid #b8956a; padding:14px 20px; border-radius:10px; margin-bottom:25px; box-shadow:0 3px 8px rgba(184,149,106,0.15);">' +
            '<div style="font-weight:bold; color:#2d3748; font-size:1.05rem;">🏷️ Brand: <span style="color:#b8956a; text-transform:uppercase;">' + bName + '</span> (' + filtered.length + ' Products)</div>' +
            '<button onclick="window.clearBrandFilterView()" style="background:#b8956a; color:white; border:none; padding:7px 18px; border-radius:6px; font-weight:bold; cursor:pointer;">Show All Products ✕</button>' +
        '</div>';
        
        if (filtered.length > 0 && typeof window.productCardHtml === 'function') {
            allEl.innerHTML = filtered.map(window.productCardHtml).join('');
        } else {
            allEl.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:50px 20px; color:#718096; background:#f8fafc; border-radius:10px; font-size:1.1rem;">No products found for "' + bName + '".</div>';
        }
        
        const sec = document.getElementById('products') || allEl;
        sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
};

window.clearBrandFilterView = function() {
    const notice = document.getElementById('brandFilterNotice');
    if (notice) notice.remove();
    if (typeof renderProducts === 'function') {
        renderProducts();
    }
};

// اعتراض الضغط على أزرار البراندات
document.addEventListener('click', function(e) {
    const btn = e.target.closest('#brandsPortfolioGrid button, .brands-portfolio-section button, #brandsPortfolioGrid a');
    if (!btn) return;
    const card = btn.closest('div[style*="border-radius"]') || btn.parentElement.parentElement;
    const h3 = card ? card.querySelector('h3') : null;
    if (h3) {
        e.preventDefault();
        e.stopPropagation();
        window.filterByBrand(h3.textContent.trim());
    }
}, true);
</script>
`;

html = html.replace(/<script id="massar-brand-[\s\S]*?<\/script>/gi, '');
html = html.replace('</body>', clientFilterScript + '\n</body>');
fs.writeFileSync('public/index.html', html, 'utf8');

console.log('✅ تم تجهيز السيرفر والموقع للتشغيل الدائم بنجاح!');
