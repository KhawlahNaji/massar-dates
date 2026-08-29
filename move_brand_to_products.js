const fs = require('fs');

let admin = fs.readFileSync('public/admin.html', 'utf8');

// 1. حذف الحقل من المكان الخاطئ (داخل التصنيفات)
admin = admin.replace(/<div class="form-group">\s*<label>[^<]*Brand[^<]*<\/label>\s*<select[^>]*id="editProdBrand"[\s\S]*?<\/select>\s*<\/div>/gi, '');

// 2. إدراج الحقل في مكانه الصحيح 100% (داخل نافذة تعديل المنتج قبل Variety)
const brandFieldCorrect = `
              <div class="field">
                  <label style="font-weight:bold; color:#b8956a;">🏷️ Brand / البراند التابع له</label>
                  <select id="editProdBrand" style="width:100%; padding:9px; border:2px solid #b8956a; border-radius:6px; background:#fffcf8; font-weight:bold; color:#2d3748;">
                      <option value="">-- General / عام (بدون براند) --</option>
                      <option value="NAWAH">NAWAH (نواة)</option>
                      <option value="QUBBAH">QUBBAH (قبة)</option>
                      <option value="ALMADINAH">ALMADINAH (المدينة)</option>
                  </select>
              </div>`;

// استبدال حقل Variety ليسبقه حقل البراند
admin = admin.replace(
    /(<div class="field">\s*<label>\s*Variety\s*\/\s*Region\s*<\/label>[\s\S]*?id="editProdVariety"[\s\S]*?<\/div>)/i,
    brandFieldCorrect + '\n$1'
);

// 3. ضبط كود الجافاسكريبت لملء وحفظ البراند
const scriptSync = `
<script>
// مزامنة البراند عند فتح نافذة المنتج
const origEditModal = window.editProductModal;
window.editProductModal = function(id) {
    if (typeof origEditModal === 'function') origEditModal(id);
    const p = (typeof PRODUCTS !== 'undefined') ? PRODUCTS.find(x => x.id === id) : null;
    const bSel = document.getElementById('editProdBrand');
    if (bSel && p) {
        bSel.value = p.brand || p.variety || '';
    }
};

// عند تغيير البراند
document.addEventListener('change', function(e) {
    if (e.target && e.target.id === 'editProdBrand') {
        const vInput = document.getElementById('editProdVariety');
        if (vInput && e.target.value) {
            vInput.value = e.target.value;
        }
    }
});
</script>
`;

if (!admin.includes('origEditModal')) {
    admin = admin.replace('</body>', scriptSync + '\n</body>');
}

fs.writeFileSync('public/admin.html', admin, 'utf8');
console.log('SUCCESS_MOVED_TO_PRODUCTS_CORRECTLY');
