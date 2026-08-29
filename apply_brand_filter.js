const fs = require("fs");

let html = fs.readFileSync("public/index.html", "utf8");
fs.writeFileSync("public/index.html.backup-brand-fix", html);

// 1. ????? ?? ??????? ?????? ??? ???????
html = html.replace(
    /onclick=["']navigateTo\(['"]products['"]\);\s*return false;?["']/g,
    `onclick="filterByBrand('\${b.name}'); return false;"`
);

// 2. ????? ???? filterByBrand ????????
const brandFilterScript = `
<script>
let activeBrandFilter = null;

window.filterByBrand = function(brandName) {
    activeBrandFilter = brandName;
    if (typeof navigateTo === 'function') {
        navigateTo('products');
    }
    
    setTimeout(() => {
        applyBrandFiltering();
        const prodSec = document.getElementById('products') || document.getElementById('allGrid');
        if (prodSec) {
            prodSec.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, 100);
};

window.clearBrandFilter = function() {
    activeBrandFilter = null;
    if (typeof renderProducts === 'function') {
        renderProducts();
    }
    const banner = document.getElementById('brandFilterBanner');
    if (banner) banner.remove();
};

function applyBrandFiltering() {
    if (!activeBrandFilter || !Array.isArray(products)) return;
    
    const allEl = document.getElementById('allGrid');
    if (!allEl) return;
    
    const bName = activeBrandFilter.trim().toLowerCase();
    
    // ????? ???????? ??? ??????? (?????? ?? ??? ???????? ?? ???????)
    const filtered = products.filter(p => {
        const brandMatch = p.brand && p.brand.toLowerCase().includes(bName);
        const nameEnMatch = p.name_en && p.name_en.toLowerCase().includes(bName);
        const nameArMatch = p.name_ar && p.name_ar.toLowerCase().includes(bName);
        const varietyMatch = p.variety && p.variety.toLowerCase().includes(bName);
        const descMatch = p.desc_en && p.desc_en.toLowerCase().includes(bName);
        return brandMatch || nameEnMatch || nameArMatch || varietyMatch || descMatch;
    });
    
    // ????? ???? ?????? ??????
    let banner = document.getElementById('brandFilterBanner');
    if (!banner) {
        banner = document.createElement('div');
        banner.id = 'brandFilterBanner';
        allEl.parentNode.insertBefore(banner, allEl);
    }
    
    banner.innerHTML = \`
        <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(184, 149, 106, 0.1); border: 1px solid var(--gold); padding: 14px 22px; border-radius: 12px; margin-bottom: 25px;">
            <span style="font-weight: 600; color: var(--brown-dark); font-size: 1rem;">
                ??? Brand: <strong style="color: var(--gold-dark);">\${activeBrandFilter}</strong> (\${filtered.length} products)
            </span>
            <button onclick="clearBrandFilter()" style="background: var(--gold); color: #fff; border: none; padding: 6px 16px; border-radius: 6px; cursor: pointer; font-size: 0.85rem; font-weight: 600;">
                Show All Products ?
            </button>
        </div>
    \`;
    
    if (filtered.length > 0 && typeof window.productCardHtml === 'function') {
        allEl.innerHTML = filtered.map(window.productCardHtml).join('');
    } else {
        allEl.innerHTML = \`
            <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-light);">
                <p style="font-size: 1.1rem; margin-bottom: 15px;">No products found specifically for "\${activeBrandFilter}".</p>
                <button onclick="clearBrandFilter()" class="btn-primary" style="padding: 8px 20px;">View All Products</button>
            </div>
        \`;
    }
}
</script>
`;

if (!html.includes('filterByBrand')) {
    html = html.replace('</body>', brandFilterScript + '\n</body>');
}

fs.writeFileSync("public/index.html", html);
console.log("SUCCESS_BRAND_FILTER_APPLIED");
