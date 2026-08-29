const fs = require('fs');

let bm = fs.readFileSync('public/brands-manager.js', 'utf8');

const brandSelectHook = `
    // تحديث وإضافة قائمة البراندات داخل نافذة المنتجات
    function injectBrandSelectInProductModal() {
        const modal = document.getElementById('productModal') || document.querySelector('.product-modal, form#productForm');
        if (!modal || document.getElementById('pBrandSelect')) return;

        const varietyInput = document.getElementById('pVariety') || document.querySelector('input[name="variety"]');
        if (varietyInput && varietyInput.parentNode) {
            const container = document.createElement('div');
            container.style.marginBottom = '14px';
            container.innerHTML = \`
                <label style="display: block; font-weight: bold; margin-bottom: 6px; font-size: 0.85rem; color: #b8956a;">🏷️ البراند التابع له (Brand)</label>
                <select id="pBrandSelect" style="width: 100%; padding: 10px; border: 1.5px solid #b8956a; border-radius: 6px; box-sizing: border-box; background: #fffcf8; font-weight: 600;">
                    <option value="">-- بدون براند محدد (عام) --</option>
                </select>
            \`;
            varietyInput.parentNode.insertBefore(container, varietyInput);

            // عند تغيير البراند يتم ضبط القيمة تلقائياً
            document.getElementById('pBrandSelect').addEventListener('change', function(e) {
                if (varietyInput && e.target.value) {
                    if (!varietyInput.value.includes(e.target.value)) {
                        varietyInput.value = e.target.value;
                    }
                }
            });
        }
    }

    // تعبئة القائمة بالبراندات المتاحة
    function updateBrandDropdownOptions() {
        const select = document.getElementById('pBrandSelect');
        if (!select) return;
        
        const currentVal = select.value;
        select.innerHTML = '<option value="">-- بدون براند محدد (عام) --</option>';
        brandsList.forEach(b => {
            if (b.name) {
                const opt = document.createElement('option');
                opt.value = b.name;
                opt.textContent = b.name + (b.tagline_ar ? ' (' + b.tagline_ar + ')' : '');
                select.appendChild(opt);
            }
        });
        if (currentVal) select.value = currentVal;
    }

    const origRenderBrands = renderBrands;
    renderBrands = function() {
        if (typeof origRenderBrands === 'function') origRenderBrands();
        injectBrandSelectInProductModal();
        updateBrandDropdownOptions();
    };
`;

if (!bm.includes('pBrandSelect')) {
    bm = bm.replace('function renderBrands() {', brandSelectHook + '\n    function renderBrands() {');
    fs.writeFileSync('public/brands-manager.js', bm, 'utf8');
}

console.log('SUCCESS_BRAND_SELECT_ADDED');
