const fs = require('fs');

let admin = fs.readFileSync('public/admin.html', 'utf8');

const runtimeScript = `
<!-- BRAND SELECTOR RUNTIME INJECTOR -->
<script>
(function() {
    function injectBrandSelector() {
        const varietyInput = document.getElementById('editProdVariety');
        if (!varietyInput) return;
        
        // التحقق إذا كانت القائمة مضافة مسبقاً
        if (document.getElementById('editProdBrand')) return;

        const parentDiv = varietyInput.closest('.field') || varietyInput.closest('.form-group') || varietyInput.parentElement;
        if (!parentDiv) return;

        // إنشاء عنصر حقل البراند
        const brandDiv = document.createElement('div');
        brandDiv.className = parentDiv.className || 'field';
        brandDiv.style.marginBottom = '12px';
        brandDiv.innerHTML = \`
            <label style="display:block; font-weight:bold; margin-bottom:5px; color:#b8956a; font-size:0.88rem;">
                🏷️ Brand / البراند التابع له
            </label>
            <select id="editProdBrand" style="width:100%; padding:10px; border:2px solid #b8956a; border-radius:6px; background:#fffcf8; font-weight:bold; font-size:0.95rem; color:#2d3748;">
                <option value="">-- General / بدون براند (عام) --</option>
                <option value="NAWAH">NAWAH (نواة)</option>
                <option value="QUBBAH">QUBBAH (قبة)</option>
                <option value="ALMADINAH">ALMADINAH (المدينة)</option>
            </select>
        \`;

        parentDiv.parentNode.insertBefore(brandDiv, parentDiv);

        // عند تغيير البراند يكتب تلقائياً في خانة Variety لضمان التوافق
        document.getElementById('editProdBrand').addEventListener('change', function(e) {
            if (e.target.value) {
                varietyInput.value = e.target.value;
            }
        });
    }

    // مزامنة قيمة البراند عند فتح نافذة التعديل
    function syncBrandValue() {
        injectBrandSelector();
        const brandSelect = document.getElementById('editProdBrand');
        const varietyInput = document.getElementById('editProdVariety');
        if (!brandSelect || !varietyInput) return;

        const val = (varietyInput.value || '').toUpperCase();
        if (val.includes('NAWAH')) {
            brandSelect.value = 'NAWAH';
        } else if (val.includes('QUBBA') || val.includes('QUBBAH')) {
            brandSelect.value = 'QUBBAH';
        } else if (val.includes('MADINA') || val.includes('MADINAH') || val.includes('ALMADINA')) {
            brandSelect.value = 'ALMADINAH';
        } else {
            brandSelect.value = '';
        }
    }

    // مراقبة فتح النوافذ المنبثقة
    document.addEventListener('click', function(e) {
        if (e.target && (e.target.innerText.includes('Edit') || e.target.innerText.includes('Add') || e.target.onclick)) {
            setTimeout(syncBrandValue, 80);
            setTimeout(syncBrandValue, 300);
        }
    });

    setInterval(injectBrandSelector, 1000);
})();
</script>
`;

if (!admin.includes('BRAND SELECTOR RUNTIME INJECTOR')) {
    admin = admin.replace('</body>', runtimeScript + '\n</body>');
    fs.writeFileSync('public/admin.html', admin, 'utf8');
    console.log('SUCCESS_INJECTED_DIRECTLY');
} else {
    console.log('ALREADY_INJECTED');
}
