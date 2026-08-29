const fs = require('fs');

let adminHtml = fs.readFileSync('public/admin.html', 'utf8');
fs.writeFileSync('public/admin.html.before-brand-dropdown.bak', adminHtml);

// 1. إضافة حقل اختيار البراند داخل كود نافذة تعديل المنتجات (HTML Modal)
const brandFieldHtml = `
                    <div class="form-group">
                        <label>البراند التابع له (Brand) *</label>
                        <select class="form-control" id="editProdBrand" style="width: 100%; padding: 10px; border: 1.5px solid var(--gold); border-radius: 6px; background: #fffcf8; font-weight: 600;">
                            <option value="">-- بدون براند محدد (عام) --</option>
                        </select>
                    </div>`;

// نجد مكان حقل Variety ونضيف حقل البراند فوقه مباشرة
if (adminHtml.includes('editProdVariety') && !adminHtml.includes('editProdBrand')) {
    adminHtml = adminHtml.replace(
        /<div class="form-group">[\s\S]*?id="editProdVariety"[\s\S]*?<\/div>/,
        match => brandFieldHtml + '\n' + match
    );
}

// 2. تحديث الجافاسكربت لتعبئة قائمة البراندات عند فتح نافذة تعديل منتج
const injectEditHook = `
    // تعبئة قائمة البراندات المنسدلة في نافذة المنتج
    const brandSelect = document.getElementById('editProdBrand');
    if (brandSelect) {
        brandSelect.innerHTML = '<option value="">-- بدون براند محدد (عام) --</option>';
        if (typeof BRANDS !== 'undefined' && Array.isArray(BRANDS)) {
            BRANDS.forEach(b => {
                const opt = document.createElement('option');
                opt.value = b.name;
                opt.textContent = b.name;
                brandSelect.appendChild(opt);
            });
        } else if (typeof globalBrandsList !== 'undefined' && Array.isArray(globalBrandsList)) {
            globalBrandsList.forEach(b => {
                const opt = document.createElement('option');
                opt.value = b.name;
                opt.textContent = b.name;
                brandSelect.appendChild(opt);
            });
        } else {
            // كخيار احتياطي لو لم تُحمّل بعد
            ['NAWAH', 'QUBBAH', 'ALMADINAH'].forEach(name => {
                const opt = document.createElement('option');
                opt.value = name;
                opt.textContent = name;
                brandSelect.appendChild(opt);
            });
        }
        brandSelect.value = p.brand || p.variety || '';
    }
`;

// إدراج الهوك داخل دالة editProductModal
if (adminHtml.includes('function editProductModal(')) {
    adminHtml = adminHtml.replace(
        /(function editProductModal\(id\) \{[\s\S]*?document\.getElementById\('editProdVariety'\)\.value\s*=\s*p\.variety\s*\|\|\s*'\x27;)/,
        match => match + '\n' + injectEditHook
    );
}

// 3. تحديث دالة saveProductModal لإرسال البراند المختار للسيرفر عند الحفظ
const injectSaveHook = `
    const brandVal = document.getElementById('editProdBrand') ? document.getElementById('editProdBrand').value : '';
`;

if (adminHtml.includes('async function saveProductModal(')) {
    // إدخال متغير البراند في بداية الحفظ
    adminHtml = adminHtml.replace(
        'async function saveProductModal() {',
        'async function saveProductModal() {\n' + injectSaveHook
    );
    
    // إضافة قيمة البراند إلى حقول الحفظ التي تُرسل للسيرفر
    adminHtml = adminHtml.replace(
        /variety:\s*document\.getElementById\('editProdVariety'\)\.value/g,
        `variety: document.getElementById('editProdVariety').value || brandVal, brand: brandVal`
    );
}

fs.writeFileSync('public/admin.html', adminHtml, 'utf8');
console.log('SUCCESS_PRODUCT_BRAND_INTEGRATION_COMPLETED');
