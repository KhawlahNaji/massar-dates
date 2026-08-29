const fs = require('fs');

// 1. إنشاء ملف التحكم بالبراندات public/brands-manager.js
const brandsManagerCode = `
(function() {
    let brandsList = [];

    function getToken() {
        return localStorage.getItem('massar_token') || localStorage.getItem('token') || sessionStorage.getItem('token') || '';
    }

    // إدراج زر التبويب في القائمة الجانبية
    function injectNavAndSection() {
        const sidebar = document.querySelector('.sidebar nav, .sidebar-nav, nav, .sidebar');
        if (sidebar && !document.getElementById('nav-brands')) {
            const navBtn = document.createElement('a');
            navBtn.href = '#';
            navBtn.id = 'nav-brands';
            navBtn.className = 'nav-item';
            navBtn.style.cssText = 'display: flex; align-items: center; gap: 10px; padding: 12px 18px; color: inherit; text-decoration: none; cursor: pointer; border-radius: 8px; margin-bottom: 4px; font-weight: 600;';
            navBtn.innerHTML = '<span>🏷️</span> <span>البراندات (Brands)</span>';
            navBtn.onclick = function(e) {
                e.preventDefault();
                showBrandsTab();
            };
            sidebar.appendChild(navBtn);
        }

        const mainContainer = document.querySelector('.main-content, main, .container-fluid, .content') || document.body;
        if (mainContainer && !document.getElementById('tab-brands')) {
            const section = document.createElement('div');
            section.id = 'tab-brands';
            section.className = 'tab-content admin-section';
            section.style.cssText = 'display: none; padding: 25px; background: #fdfdfd; min-height: 80vh;';
            section.innerHTML = \`
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; flex-wrap: wrap; gap: 15px; border-bottom: 1px solid #eee; padding-bottom: 15px;">
                    <div>
                        <h2 style="margin: 0; font-size: 1.6rem; color: #2d3748;">🏷️ إدارة البراندات (Brands)</h2>
                        <p style="margin: 5px 0 0; color: #718096; font-size: 0.9rem;">إضافة وتعديل وحذف البراندات ورفع شعاراتها</p>
                    </div>
                    <button id="btnAddNewBrand" style="background: #b8956a; color: white; border: none; padding: 10px 22px; border-radius: 8px; font-weight: bold; cursor: pointer; display: flex; align-items: center; gap: 8px;">
                        ➕ إضافة براند جديد
                    </button>
                </div>

                <div id="brandsListGrid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 20px;"></div>

                <!-- Modal -->
                <div id="brandEditModal" style="display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 99999; justify-content: center; align-items: center; padding: 20px;">
                    <div style="background: white; border-radius: 12px; max-width: 550px; width: 100%; padding: 25px; box-shadow: 0 10px 25px rgba(0,0,0,0.2); max-height: 90vh; overflow-y: auto;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px; border-bottom: 1px solid #edf2f7; padding-bottom: 10px;">
                            <h3 id="modalBrandTitle" style="margin: 0; color: #2d3748;">بيانات البراند</h3>
                            <button id="btnCloseBrandModal" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #a0aec0;">✕</button>
                        </div>
                        <form id="brandEditForm">
                            <input type="hidden" id="editBrandIdx" value="-1">
                            <div style="margin-bottom: 14px;">
                                <label style="display: block; font-weight: bold; margin-bottom: 6px; font-size: 0.85rem;">اسم البراند (Brand Name) *</label>
                                <input type="text" id="bNameInput" required style="width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 6px; box-sizing: border-box;" placeholder="مثال: NAWAH أو QUBBAH">
                            </div>
                            <div style="margin-bottom: 14px;">
                                <label style="display: block; font-weight: bold; margin-bottom: 6px; font-size: 0.85rem;">شعار / صورة البراند</label>
                                <div style="display: flex; gap: 8px;">
                                    <input type="text" id="bImgInput" style="flex: 1; padding: 10px; border: 1px solid #cbd5e1; border-radius: 6px; box-sizing: border-box;" placeholder="رابط الصورة أو ارفع من جهازك">
                                    <label style="background: #e2e8f0; padding: 10px 14px; border-radius: 6px; cursor: pointer; font-size: 0.85rem; font-weight: bold; white-space: nowrap;">
                                        📁 رفع صورة
                                        <input type="file" id="bImgFile" accept="image/*" style="display: none;">
                                    </label>
                                </div>
                                <div id="bImgPrev" style="margin-top: 8px; text-align: center;"></div>
                            </div>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 14px;">
                                <div>
                                    <label style="display: block; font-weight: bold; margin-bottom: 4px; font-size: 0.85rem;">الشعار الفرعي (EN)</label>
                                    <input type="text" id="bTagEn" style="width: 100%; padding: 9px; border: 1px solid #cbd5e1; border-radius: 6px; box-sizing: border-box;" placeholder="Ancient Heritage">
                                </div>
                                <div>
                                    <label style="display: block; font-weight: bold; margin-bottom: 4px; font-size: 0.85rem;">الشعار الفرعي (AR)</label>
                                    <input type="text" id="bTagAr" style="width: 100%; padding: 9px; border: 1px solid #cbd5e1; border-radius: 6px; box-sizing: border-box;" placeholder="الأصالة والنقاء">
                                </div>
                            </div>
                            <div style="margin-bottom: 14px;">
                                <label style="display: block; font-weight: bold; margin-bottom: 4px; font-size: 0.85rem;">الوصف (EN)</label>
                                <textarea id="bDescEn" rows="2" style="width: 100%; padding: 9px; border: 1px solid #cbd5e1; border-radius: 6px; box-sizing: border-box;"></textarea>
                            </div>
                            <div style="margin-bottom: 14px;">
                                <label style="display: block; font-weight: bold; margin-bottom: 4px; font-size: 0.85rem;">الوصف (AR)</label>
                                <textarea id="bDescAr" rows="2" style="width: 100%; padding: 9px; border: 1px solid #cbd5e1; border-radius: 6px; box-sizing: border-box;"></textarea>
                            </div>
                            <div style="margin-bottom: 20px;">
                                <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-weight: bold; font-size: 0.9rem;">
                                    <input type="checkbox" id="bActive" checked style="width: 18px; height: 18px;">
                                    <span>تفعيل وإظهار البراند في الموقع</span>
                                </label>
                            </div>
                            <div style="display: flex; justify-content: flex-end; gap: 10px; border-top: 1px solid #edf2f7; padding-top: 15px;">
                                <button type="button" id="btnCancelModal" style="padding: 9px 18px; border: 1px solid #cbd5e1; background: white; border-radius: 6px; cursor: pointer;">إلغاء</button>
                                <button type="submit" id="btnSubmitBrand" style="padding: 9px 22px; background: #b8956a; color: white; border: none; border-radius: 6px; font-weight: bold; cursor: pointer;">💾 حفظ البراند</button>
                            </div>
                        </form>
                    </div>
                </div>
            \`;
            mainContainer.appendChild(section);
            setupEventListeners();
        }
    }

    function setupEventListeners() {
        document.getElementById('btnAddNewBrand').onclick = () => openBrandModal(-1);
        document.getElementById('btnCloseBrandModal').onclick = () => closeModal();
        document.getElementById('btnCancelModal').onclick = () => closeModal();
        document.getElementById('brandEditForm').onsubmit = saveBrandHandler;

        document.getElementById('bImgFile').onchange = async function(e) {
            const file = e.target.files[0];
            if (!file) return;
            const prev = document.getElementById('bImgPrev');
            prev.innerHTML = '<span style="color: #b8956a; font-size: 0.85rem;">⏳ جارٍ رفع الصورة لكلاوديناري...</span>';
            const formData = new FormData();
            formData.append('image', file);
            try {
                const res = await fetch('/api/admin/upload', {
                    method: 'POST',
                    headers: { 'Authorization': 'Bearer ' + getToken() },
                    body: formData
                });
                const data = await res.json();
                if (data.url) {
                    document.getElementById('bImgInput').value = data.url;
                    prev.innerHTML = '<img src="' + data.url + '" style="max-height: 60px; border-radius: 6px; border: 1px solid #ddd; margin-top: 5px;">';
                }
            } catch (err) {
                alert('فشل رفع الصورة');
                prev.innerHTML = '';
            }
        };
    }

    window.showBrandsTab = function() {
        document.querySelectorAll('.tab-content, .admin-section, [id^="tab-"], [id^="section-"]').forEach(el => {
            el.style.display = 'none';
        });
        document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
        
        const sec = document.getElementById('tab-brands');
        if (sec) sec.style.display = 'block';
        
        const nav = document.getElementById('nav-brands');
        if (nav) nav.classList.add('active');

        fetchBrands();
    };

    async function fetchBrands() {
        try {
            const res = await fetch('/api/admin/brands', {
                headers: { 'Authorization': 'Bearer ' + getToken() }
            });
            if (res.ok) {
                brandsList = await res.json();
                if (!Array.isArray(brandsList) || brandsList.length === 0) {
                    brandsList = [
                        { name: 'NAWAH', tagline_en: 'Ancient Heritage & Purity', desc_en: 'Crafted with timeless tradition, NAWAH represents the pure essence of Saudi dates.', active: true },
                        { name: 'QUBBAH', tagline_en: 'Royal Saudi Selection', desc_en: 'The pinnacle of luxury. QUBBAH brings handpicked, large-grade dates.', active: true },
                        { name: 'ALMADINAH', tagline_en: 'Blessed Sacred Harvest', desc_en: 'Sourced directly from the sacred orchards of Al Madinah Al Munawwarah.', active: true }
                    ];
                }
                renderBrands();
            }
        } catch (e) {
            console.error(e);
        }
    }

    function renderBrands() {
        const grid = document.getElementById('brandsListGrid');
        if (!grid) return;
        if (brandsList.length === 0) {
            grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #888;">لا توجد براندات. اضغط "إضافة براند جديد".</div>';
            return;
        }

        grid.innerHTML = brandsList.map((b, idx) => {
            const logo = b.image_url 
                ? '<img src="' + b.image_url + '" style="max-height: 50px; max-width: 120px; object-fit: contain;">'
                : '<div style="width: 45px; height: 45px; border-radius: 50%; background: #fdf6ec; border: 2px solid #b8956a; display: flex; align-items: center; justify-content: center; font-weight: bold; color: #b8956a;">' + (b.name||'B').charAt(0) + '</div>';

            return \`
                <div style="background: white; border-radius: 10px; border: 1px solid #e2e8f0; padding: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.03); display: flex; flex-direction: column; justify-content: space-between;">
                    <div>
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
                            \${logo}
                            <span style="font-size: 0.75rem; padding: 3px 8px; border-radius: 10px; font-weight: bold; \${b.active !== false ? 'background: #e6fffa; color: #234e52;' : 'background: #fff5f5; color: #742a2a;'}">
                                \${b.active !== false ? '● مفعّل' : '○ معطّل'}
                            </span>
                        </div>
                        <h3 style="margin: 0 0 5px; color: #2d3748; font-size: 1.15rem;">\${b.name}</h3>
                        <div style="font-size: 0.8rem; color: #b8956a; font-weight: bold; margin-bottom: 8px;">\${b.tagline_en || b.tagline_ar || ''}</div>
                        <p style="font-size: 0.85rem; color: #718096; line-height: 1.4; margin: 0 0 15px;">\${b.desc_en || b.desc_ar || 'لا يوجد وصف'}</p>
                    </div>
                    <div style="display: flex; gap: 8px; border-top: 1px solid #edf2f7; padding-top: 12px;">
                        <button onclick="window.editBrandIdx(\${idx})" style="flex: 1; padding: 7px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; cursor: pointer; font-weight: bold;">✏️ تعديل</button>
                        <button onclick="window.deleteBrandIdx(\${idx})" style="padding: 7px 12px; background: #fff5f5; border: 1px solid #feb2b2; color: #c53030; border-radius: 6px; cursor: pointer; font-weight: bold;">🗑️ حذف</button>
                    </div>
                </div>
            \`;
        }).join('');
    }

    window.editBrandIdx = function(idx) {
        openBrandModal(idx);
    };

    window.deleteBrandIdx = async function(idx) {
        if (!confirm('هل أنت متأكد من حذف هذا البراند؟')) return;
        brandsList.splice(idx, 1);
        await saveBrandsToServer();
        renderBrands();
    };

    function openBrandModal(idx) {
        document.getElementById('editBrandIdx').value = idx;
        const modal = document.getElementById('brandEditModal');
        const prev = document.getElementById('bImgPrev');

        if (idx >= 0 && brandsList[idx]) {
            const b = brandsList[idx];
            document.getElementById('modalBrandTitle').textContent = 'تعديل براند: ' + b.name;
            document.getElementById('bNameInput').value = b.name || '';
            document.getElementById('bImgInput').value = b.image_url || '';
            document.getElementById('bTagEn').value = b.tagline_en || '';
            document.getElementById('bTagAr').value = b.tagline_ar || '';
            document.getElementById('bDescEn').value = b.desc_en || '';
            document.getElementById('bDescAr').value = b.desc_ar || '';
            document.getElementById('bActive').checked = b.active !== false;
            prev.innerHTML = b.image_url ? '<img src="' + b.image_url + '" style="max-height: 60px; border-radius: 6px; border: 1px solid #ddd; margin-top: 5px;">' : '';
        } else {
            document.getElementById('modalBrandTitle').textContent = 'إضافة براند جديد';
            document.getElementById('brandEditForm').reset();
            document.getElementById('bActive').checked = true;
            prev.innerHTML = '';
        }
        modal.style.display = 'flex';
    }

    function closeModal() {
        document.getElementById('brandEditModal').style.display = 'none';
    }

    async function saveBrandHandler(e) {
        e.preventDefault();
        const idx = parseInt(document.getElementById('editBrandIdx').value);
        const data = {
            name: document.getElementById('bNameInput').value.trim(),
            image_url: document.getElementById('bImgInput').value.trim(),
            tagline_en: document.getElementById('bTagEn').value.trim(),
            tagline_ar: document.getElementById('bTagAr').value.trim(),
            desc_en: document.getElementById('bDescEn').value.trim(),
            desc_ar: document.getElementById('bDescAr').value.trim(),
            active: document.getElementById('bActive').checked
        };

        if (idx >= 0) {
            brandsList[idx] = data;
        } else {
            brandsList.push(data);
        }

        const btn = document.getElementById('btnSubmitBrand');
        btn.textContent = '⏳ جارٍ الحفظ...';
        btn.disabled = true;

        await saveBrandsToServer();
        btn.textContent = '💾 حفظ البراند';
        btn.disabled = false;
        closeModal();
        renderBrands();
    }

    async function saveBrandsToServer() {
        try {
            const res = await fetch('/api/admin/brands', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + getToken()
                },
                body: JSON.stringify(brandsList)
            });
            if (res.ok) {
                alert('✅ تم الحفظ بنجاح!');
            }
        } catch (e) {
            alert('حدث خطأ أثناء الحفظ');
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        injectNavAndSection();
    });
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        injectNavAndSection();
    }
})();
`;

fs.writeFileSync('public/brands-manager.js', brandsManagerCode, 'utf8');

// 2. ربط الملف بـ admin.html
let admin = fs.readFileSync('public/admin.html', 'utf8');
if (!admin.includes('brands-manager.js')) {
    admin = admin.replace('</body>', '<script src="brands-manager.js"></script>\n</body>');
    fs.writeFileSync('public/admin.html', admin, 'utf8');
}

console.log('SUCCESS_BRANDS_READY');
