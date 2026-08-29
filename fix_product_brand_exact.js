const fs = require('fs');

let adminHtml = fs.readFileSync('public/admin.html', 'utf8');

// 1. إضافة حقل اختيار البراند في نافذة المنتج (HTML)
const targetField = '<div class="field"><label>Variety / Region</label><input id="editProdVariety" placeholder="Al Madinah"></div>';
const brandField = '<div class="field"><label>🏷️ Brand / البراند التابع له</label><select id="editProdBrand" style="border: 1.5px solid #b8956a; background: #fffcf8; font-weight: 600; padding: 8px;"><option value="">-- General / عام (بدون براند) --</option></select></div>\n' + targetField;

if (!adminHtml.includes('id="editProdBrand"')) {
    adminHtml = adminHtml.replace(targetField, brandField);
}

// 2. إضافة دالة تعبئة البراندات التلقائية
const brandSelectLogic = `
function updateProductBrandDropdown(selectedBrand = '') {
    const sel = document.getElementById('editProdBrand');
    if (!sel) return;
    sel.innerHTML = '<option value="">-- General / عام (بدون براند) --</option>';
    
    let list = (typeof BRANDS !== 'undefined' && Array.isArray(BRANDS) && BRANDS.length > 0) 
        ? BRANDS 
        : [{ name: 'NAWAH' }, { name: 'QUBBAH' }, { name: 'ALMADINAH' }];
        
    list.forEach(b => {
        const opt = document.createElement('option');
        opt.value = b.name;
        opt.textContent = b.name;
        if (b.name === selectedBrand) opt.selected = true;
        sel.appendChild(opt);
    });
    if (selectedBrand) sel.value = selectedBrand;
}
`;

if (!adminHtml.includes('updateProductBrandDropdown')) {
    adminHtml = adminHtml.replace('function editProductModal(id) {', brandSelectLogic + '\nfunction editProductModal(id) {');
}

// 3. تشغيل التعبئة عند فتح نافذة تعديل المنتج
adminHtml = adminHtml.replace(
    "document.getElementById('editProdVariety').value = p.variety || '';",
    "document.getElementById('editProdVariety').value = p.variety || '';\n    updateProductBrandDropdown(p.brand || p.variety || '');"
);

// 4. تشغيل التعبئة عند إضافة منتج جديد
if (adminHtml.includes('function openNewProductModal') || adminHtml.includes('function addProductModal')) {
    adminHtml = adminHtml.replace(
        /(function\s+(?:openNewProductModal|addProductModal)[^{]*\{)/,
        "$1\n    setTimeout(() => updateProductBrandDropdown(''), 50);"
    );
}

fs.writeFileSync('public/admin.html', adminHtml, 'utf8');
console.log('SUCCESS_BRAND_DROPDOWN_INSTALLED_PERFECTLY');
