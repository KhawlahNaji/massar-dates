const fs = require('fs');

let admin = fs.readFileSync('public/admin.html', 'utf8');

// 1. إزالة كود الحقن التلقائي المكرر والمسبب للمشاكل بالكامل
const runtimeRegex = /<!-- BRAND SELECTOR RUNTIME INJECTOR -->[\s\S]*?<\/script>/g;
admin = admin.replace(runtimeRegex, '');

// 2. التأكد من وجود خيارات البراندات داخل الـ Select الأساسي
const oldSelect = /<select class="form-control" id="editProdBrand"[\s\S]*?<\/select>/;
const cleanSelect = `<select class="form-control" id="editProdBrand" style="width: 100%; padding: 10px; border: 1.5px solid var(--gold); border-radius: 6px; background: #fffcf8; font-weight: 600;">
                            <option value="">-- General / عام --</option>
                            <option value="NAWAH">NAWAH (نواة)</option>
                            <option value="QUBBAH">QUBBAH (قبة)</option>
                            <option value="ALMADINAH">ALMADINAH (المدينة)</option>
                        </select>`;

admin = admin.replace(oldSelect, cleanSelect);

// 3. مزامنة القيمة عند الحفظ والتعديل بشكل صحيح ومباشر
if (admin.includes('function editProductModal(id) {')) {
    // التأكد من ضبط القيمة عند فتح النافذة
    const syncValueLine = "document.getElementById('editProdVariety').value = p.variety || '';";
    const syncValueReplacement = "document.getElementById('editProdVariety').value = p.variety || '';\n    if(document.getElementById('editProdBrand')) { document.getElementById('editProdBrand').value = p.brand || p.variety || ''; }";
    if (!admin.includes("document.getElementById('editProdBrand').value = p.brand")) {
        admin = admin.replace(syncValueLine, syncValueReplacement);
    }
}

fs.writeFileSync('public/admin.html', admin, 'utf8');
console.log('CLEANUP_AND_FIX_SUCCESSFUL');
