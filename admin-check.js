
let AUTH_TOKEN = localStorage.getItem('massar_admin_token') || '';
let CONFIG = {}, PRODUCTS = [], BRANDS = [];
// ================= TEXT FORMATTER =================
function applyTextFormat(element, property, value) {
    if (!element || !value) return;

    if (property === 'fontFamily') {
        element.style.fontFamily = value;
        element.dataset.fontFamily = value;
    }

    if (property === 'fontSize') {
        element.style.fontSize = value;
        element.dataset.fontSize = value;
    }

    if (property === 'fontWeight') {
        element.style.fontWeight = value;
        element.dataset.fontWeight = value;
    }

    if (property === 'textAlign') {
        element.style.textAlign = value;
        element.dataset.textAlign = value;
    }

    if (property === 'color') {
        element.style.color = value;
        element.dataset.textColor = value;
    }
}
function createTextFormatter(targetId) {
    const target = document.getElementById(targetId);
    if (!target) return;

    const old = document.getElementById('formatter-' + targetId);
    if (old) old.remove();

    const wrapper = document.createElement('div');
    wrapper.id = 'formatter-' + targetId;

    wrapper.style.cssText = `
        margin-top:8px;
        padding:10px;
        border:1px solid var(--border);
        border-radius:10px;
        background:var(--cream);
        display:flex;
        gap:8px;
        flex-wrap:wrap;
        align-items:center;
    `;

    wrapper.innerHTML = `
        <select class="text-font">
            <option value="">Font</option>
            <option value="Arial">Arial</option>
            <option value="Georgia">Georgia</option>
            <option value="Verdana">Verdana</option>
            <option value="Tahoma">Tahoma</option>
            <option value="Times New Roman">Times New Roman</option>
            <option value="Courier New">Courier New</option>
        </select>

        <select class="text-size">
            <option value="">Size</option>
            <option value="12px">12px</option>
            <option value="14px">14px</option>
            <option value="16px">16px</option>
            <option value="18px">18px</option>
            <option value="20px">20px</option>
            <option value="24px">24px</option>
            <option value="30px">30px</option>
            <option value="36px">36px</option>
            <option value="42px">42px</option>
        </select>

        <select class="text-weight">
            <option value="">Weight</option>
            <option value="400">Normal</option>
            <option value="500">Medium</option>
            <option value="600">Semi Bold</option>
            <option value="700">Bold</option>
            <option value="800">Extra Bold</option>
        </select>

        <select class="text-align">
            <option value="">Align</option>
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
        </select>

        <label style="font-size:12px;">
            Color
            <input type="color" class="text-color" value="#000000">
        </label>
    `;

    target.parentElement.appendChild(wrapper);

    wrapper.querySelector('.text-font').onchange = function () {
        applyTextFormat(target, 'fontFamily', this.value);
    };

    wrapper.querySelector('.text-size').onchange = function () {
        applyTextFormat(target, 'fontSize', this.value);
    };

    wrapper.querySelector('.text-weight').onchange = function () {
        applyTextFormat(target, 'fontWeight', this.value);
    };

    wrapper.querySelector('.text-align').onchange = function () {
        applyTextFormat(target, 'textAlign', this.value);
    };

    wrapper.querySelector('.text-color').oninput = function () {
        applyTextFormat(target, 'color', this.value);
    };
}

async function api(url, options = {}) {
    const opts = { ...options, headers: { ...(options.headers || {}) } };
    if (AUTH_TOKEN) opts.headers['Authorization'] = 'Bearer ' + AUTH_TOKEN;
    if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
        opts.headers['Content-Type'] = 'application/json';
        opts.body = JSON.stringify(options.body);
    }
    const res = await fetch(url, opts);
    if (res.status === 401 && AUTH_TOKEN) { logout(); throw new Error('Unauthorized'); }
    return res.json();
}

function toast(msg) {
    const el = document.createElement('div'); el.className = 'toast'; el.textContent = msg;
    document.getElementById('toastWrap').appendChild(el);
    setTimeout(() => el.remove(), 2600);
}

async function handleLogin(e) {
    e.preventDefault();
    try {
        const data = await api('/api/admin/login', {
            method: 'POST',
            body: { email: document.getElementById('loginEmail').value, password: document.getElementById('loginPassword').value }
        });
        if (data.token) {
            AUTH_TOKEN = data.token;
            localStorage.setItem('massar_admin_token', AUTH_TOKEN);
            enterApp();
        } else { toast('Invalid email or password'); }
    } catch(err) { toast('Login failed'); }
}

function logout() {
    AUTH_TOKEN = ''; localStorage.removeItem('massar_admin_token');
    document.getElementById('appView').classList.remove('active');
    document.getElementById('loginView').style.display = 'flex';
}

async function enterApp() {
    document.getElementById('loginView').style.display = 'none';
    document.getElementById('appView').classList.add('active');
    await loadAllData();
}

function switchPanel(name, btn) {
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

    const panel = document.getElementById('panel-' + name);
    if (panel) panel.classList.add('active');

    if (btn) btn.classList.add('active');

    const pageTitle = document.getElementById('pageTitle');
    if (pageTitle) pageTitle.textContent = name.toUpperCase();

    window.scrollTo(0, 0);

    if (name === 'categories') {
        setTimeout(() => {
            if (typeof loadCategoryManager === 'function') {
                loadCategoryManager();
            }
        }, 50);
    }
}
function switchPanelByName(name) {
    const btn = document.querySelector(`.nav-item[onclick*="${name}"]`);
    switchPanel(name, btn);
}

function switchLangTab(scope, l, btn) {
    btn.parentElement.querySelectorAll('.lang-tab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll(`[id^="${scope}-lang-"]`).forEach(el => el.classList.remove('active'));
    document.getElementById(`${scope}-lang-${l}`)?.classList.add('active');
}

async function loadAllData() {
    CONFIG = await api('/api/config');
    PRODUCTS = await api('/api/admin/products');
    
    // ===== ABOUT US RELOAD FIX =====
    // Loads saved English / Arabic / Malay About Us text after Refresh.
    const aboutReloadFields = [
        'about_intro1_en','about_intro2_en','about_who_en','about_heritage_en',
        'about_commitment_en','about_vision_en','about_mission_en','about_premium_en',
        'about_origins_en','about_supply_en','about_customer_en','about_products_en',
        'about_business_en','about_final_en',

        'about_intro1_ar','about_intro2_ar','about_who_ar','about_heritage_ar',
        'about_commitment_ar','about_vision_ar','about_mission_ar','about_premium_ar',
        'about_origins_ar','about_supply_ar','about_customer_ar','about_products_ar',
        'about_business_ar','about_final_ar',

        'about_intro1_ms','about_intro2_ms','about_who_ms','about_heritage_ms',
        'about_commitment_ms','about_vision_ms','about_mission_ms','about_premium_ms',
        'about_origins_ms','about_supply_ms','about_customer_ms','about_products_ms',
        'about_business_ms','about_final_ms'
    ];

    aboutReloadFields.forEach(function(field) {
        const element = document.getElementById(field);
        if (element) {
            element.value = CONFIG[field] ?? '';
        }
    });
    // ===== END ABOUT US RELOAD FIX =====
    // Populate simple fields
    const allFields = [
        'hero_badge_en','hero_badge_ar','hero_badge_ms','hero_title_en','hero_title_ar','hero_title_ms','hero_desc_en','hero_desc_ar','hero_desc_ms','hero_img',
        'detail_tab_en','detail_tab_ar','detail_tab_ms','ship_tab_en','ship_tab_ar','ship_tab_ms','stor_tab_en','stor_tab_ar','stor_tab_ms','ret_tab_en','ret_tab_ar','ret_tab_ms',
        'about_title_en','about_title_ar','about_title_ms',
'about_text_en','about_text_ar','about_text_ms',
'about_image',
        'contact_email','contact_location_en','contact_location_ar','contact_location_ms',
        'link_tiktok','link_shopee','link_lazada','link_whatsapp',
        'social_instagram','social_facebook','social_tiktok',
        'logo_text','seo_title','seo_desc','logo_url'
    ];
    allFields.forEach(f => {
        const el = document.getElementById(f);
        if (el) el.value = CONFIG[f] || '';
    });
      loadSavedTextFormatting();

    const wa2 = document.getElementById('link_whatsapp_2');
    if (wa2) wa2.value = CONFIG.link_whatsapp || '';

    // Hero image preview
    if (CONFIG.hero_img) {
        document.getElementById('heroImgPreview').innerHTML = `<img src="${CONFIG.hero_img}" style="max-height:80px;border-radius:6px">`;
    }

    // Logo image preview
    refreshLogoPreview();

    // Render specialized editors
    renderProductsTable();
    loadWhyMassarUI();
    loadBrandsUI();
    loadB2BUI();
    loadTestimonialsUI();
        loadBrandStoryUI();

    // تشغيل محرر تنسيق النصوص
    initTextFormatters();
}
function loadSavedTextFormatting() {
    const textFields = [
        'hero_badge_en',
        'hero_badge_ar',
        'hero_badge_ms',
        'hero_title_en',
        'hero_title_ar',
        'hero_title_ms',
        'hero_desc_en',
        'hero_desc_ar',
        'hero_desc_ms',

        'wm_sub_en',
        'wm_sub_ar',
        'wm_sub_ms',
        'wm_title_en',
        'wm_title_ar',
        'wm_title_ms',
        'wm_desc_en',
        'wm_desc_ar',
        'wm_desc_ms',

        'b2b_subtitle_en',
        'b2b_subtitle_ar',
        'b2b_subtitle_ms',
        'b2b_title_en',
        'b2b_title_ar',
        'b2b_title_ms',
        'b2b_desc_en',
        'b2b_desc_ar',
        'b2b_desc_ms',
        'b2b_button_en',
        'b2b_button_ar',
        'b2b_button_ms',

        'about_title_en',
        'about_title_ar',
        'about_title_ms',
        'about_text_en',
        'about_text_ar',
        'about_text_ms',

        'detail_tab_en',
        'detail_tab_ar',
        'detail_tab_ms',
        'ship_tab_en',
        'ship_tab_ar',
        'ship_tab_ms',
        'stor_tab_en',
        'stor_tab_ar',
        'stor_tab_ms',
        'ret_tab_en',
        'ret_tab_ar',
        'ret_tab_ms',

        'seo_title',
        'seo_desc'
    ];

    textFields.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;

        const fontFamily = CONFIG[id + '_font_family'];
        const fontSize = CONFIG[id + '_font_size'];
        const fontWeight = CONFIG[id + '_font_weight'];
        const textAlign = CONFIG[id + '_text_align'];
        const textColor = CONFIG[id + '_text_color'];

        if (fontFamily) {
            el.dataset.fontFamily = fontFamily;
            el.style.fontFamily = fontFamily;
        }

        if (fontSize) {
            el.dataset.fontSize = fontSize;
            el.style.fontSize = fontSize;
        }

        if (fontWeight) {
            el.dataset.fontWeight = fontWeight;
            el.style.fontWeight = fontWeight;
        }

        if (textAlign) {
            el.dataset.textAlign = textAlign;
            el.style.textAlign = textAlign;
        }

        if (textColor) {
            el.dataset.textColor = textColor;
            el.style.color = textColor;
        }
    });
}
function initTextFormatters() {
    const textFields = [
        // HERO
        'hero_badge_en',
        'hero_badge_ar',
        'hero_badge_ms',
        'hero_title_en',
        'hero_title_ar',
        'hero_title_ms',
        'hero_desc_en',
        'hero_desc_ar',
        'hero_desc_ms',

        // WHY MASSAR
        'wm_sub_en',
        'wm_sub_ar',
        'wm_sub_ms',
        'wm_title_en',
        'wm_title_ar',
        'wm_title_ms',
        'wm_desc_en',
        'wm_desc_ar',
        'wm_desc_ms',

        // B2B
        'b2b_subtitle_en',
        'b2b_subtitle_ar',
        'b2b_subtitle_ms',
        'b2b_title_en',
        'b2b_title_ar',
        'b2b_title_ms',
        'b2b_desc_en',
        'b2b_desc_ar',
        'b2b_desc_ms',
        'b2b_button_en',
        'b2b_button_ar',
        'b2b_button_ms',

        // ABOUT
        'about_title_en',
        'about_title_ar',
        'about_title_ms',
        'about_text_en',
        'about_text_ar',
        'about_text_ms',

        // PRODUCT DETAILS
        'detail_tab_en',
        'detail_tab_ar',
        'detail_tab_ms',
        'ship_tab_en',
        'ship_tab_ar',
        'ship_tab_ms',
        'stor_tab_en',
        'stor_tab_ar',
        'stor_tab_ms',
        'ret_tab_en',
        'ret_tab_ar',
        'ret_tab_ms',

        // SEO
        'seo_title',
        'seo_desc'
    ];

    textFields.forEach(id => {
        createTextFormatter(id);
    });
}
async function saveLogoSize() {
    const width = document.getElementById('logo_width').value || 280;
    const height = document.getElementById('logo_height').value || 90;

    await api('/api/admin/config', {
        method: 'PUT',
        body: {
            logo_width: width,
            logo_height: height
        }
    });

    CONFIG.logo_width = width;
    CONFIG.logo_height = height;

    toast('Logo size saved successfully!');
}

async function saveAboutLongTexts() {
    const fields = [
        'about_intro1_en','about_intro2_en','about_who_en','about_heritage_en',
        'about_commitment_en','about_vision_en','about_mission_en',
        'about_premium_en','about_origins_en','about_supply_en',
        'about_customer_en','about_products_en','about_business_en','about_final_en',

        'about_intro1_ar','about_intro2_ar','about_who_ar','about_heritage_ar',
        'about_commitment_ar','about_vision_ar','about_mission_ar',
        'about_premium_ar','about_origins_ar','about_supply_ar',
        'about_customer_ar','about_products_ar','about_business_ar','about_final_ar',

        'about_intro1_ms','about_intro2_ms','about_who_ms','about_heritage_ms',
        'about_commitment_ms','about_vision_ms','about_mission_ms',
        'about_premium_ms','about_origins_ms','about_supply_ms',
        'about_customer_ms','about_products_ms','about_business_ms','about_final_ms'
    ];

    const body = {};

    fields.forEach(function(id) {
        const el = document.getElementById(id);
        if (el) body[id] = el.value;
    });

    try {
        const result = await api('/api/admin/config', {
            method: 'PUT',
            body: body
        });

        Object.assign(CONFIG, body);

        const fresh = await api('/api/config');
        CONFIG = fresh || CONFIG;

        fields.forEach(function(id) {
            const el = document.getElementById(id);
            if (el) el.value = CONFIG[id] || '';
        });

        toast('About Us saved successfully!');
        console.log('ABOUT SAVE RESULT:', result);
    } catch (error) {
        console.error('About Us save error:', error);
        toast('Failed to save About Us');
    }
}
async function saveConfigFields(fields) {
    const body = {};

    fields.forEach(f => {
        const el = document.getElementById(f);
        if (!el) return;

        // Save text value
        body[f] = el.value;

        // Save text formatting
        if (el.dataset.fontFamily) {
            body[f + '_font_family'] = el.dataset.fontFamily;
        }

        if (el.dataset.fontSize) {
            body[f + '_font_size'] = el.dataset.fontSize;
        }

        if (el.dataset.fontWeight) {
            body[f + '_font_weight'] = el.dataset.fontWeight;
        }

        if (el.dataset.textAlign) {
            body[f + '_text_align'] = el.dataset.textAlign;
        }

        if (el.dataset.textColor) {
            body[f + '_text_color'] = el.dataset.textColor;
        }
    });

    try {
        await api('/api/admin/config', {
            method: 'PUT',
            body
        });

        Object.assign(CONFIG, body);

        toast('Saved successfully!');
    } catch (error) {
        console.error('Save config error:', error);
        toast('Failed to save changes');
    }
}
// ---------------- PRODUCTS ----------------
function renderProductsTable() {
    document.getElementById('productsTableBody').innerHTML = PRODUCTS.map(p => {
        const pVals = Object.values(p.prices || {}).filter(v => v > 0);
        const minP = pVals.length ? `RM ${Math.min(...pVals)}` : '--';
        const img = p.image_url ? `<img src="${p.image_url}" style="width:40px;height:40px;object-fit:cover;border-radius:4px">` : '🌰';
        return `
            <tr>
                <td>${img}</td>
                <td><strong>${p.name_en}</strong></td>
                <td>${p.variety || '-'}</td>
                <td>${minP}</td>
                <td>${p.active ? '<span style="color:var(--success);font-weight:700">● Active</span>' : '<span style="color:var(--text-light)">○ Hidden</span>'}</td>
                <td>${p.featured ? '⭐ Yes' : 'No'}</td>
                <td style="text-align:right">
                    <button class="btn btn-outline btn-sm" onclick="editProductModal(${p.id})">Edit</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteProduct(${p.id})">🗑</button>
                </td>
            </tr>
        `;
    }).join('');
}

function openProductModal() {
    document.getElementById('editProdId').value = '';
    ['Slug','Variety','Name_en','Name_ar','Name_ms','Desc_en','Desc_ar','Desc_ms','Badge_en','Badge_ar','Badge_ms','Texture_en','Texture_ar','Texture_ms'].forEach(f => {
        const el = document.getElementById('editProd' + f); if (el) el.value = '';
    });
    document.getElementById('editProdImage').value = '';
    document.getElementById('editProdCategory').value = '1';
    document.getElementById('prodImgPreviewBox').innerHTML = '';
    ['100g','250g','500g','1kg','3kg','5kg'].forEach(w => document.getElementById('p_' + w).value = '');
    document.getElementById('editProdActive').checked = true;
    document.getElementById('editProdFeatured').checked = true;
    document.getElementById('productModal').classList.add('active');
}
function closeProductModal() { document.getElementById('productModal').classList.remove('active'); }

function editProductModal(id) {
    const p = PRODUCTS.find(x => x.id === id); if (!p) return;
    document.getElementById('editProdId').value = p.id;
    document.getElementById('editProdSlug').value = p.slug || '';
    document.getElementById('editProdVariety').value = p.variety || '';
    document.getElementById('editProdCategory').value = String(p.category_id || 1);
    ['en','ar','ms'].forEach(l => {
        document.getElementById('editProdName_' + l).value = p['name_' + l] || '';
        document.getElementById('editProdDesc_' + l).value = p['desc_' + l] || '';
        document.getElementById('editProdBadge_' + l).value = p['badge_' + l] || '';
        document.getElementById('editProdTexture_' + l).value = p['texture_' + l] || '';
    });
    ['100g','250g','500g','1kg','3kg','5kg'].forEach(w => {
        document.getElementById('p_' + w).value = (p.prices && p.prices[w]) || '';
    });
    document.getElementById('editProdActive').checked = p.active !== false;
    document.getElementById('editProdFeatured').checked = !!p.featured;
    document.getElementById('editProdImage').value = p.image_url || '';
    document.getElementById('prodImgPreviewBox').innerHTML = p.image_url ? `<img src="${p.image_url}" style="max-height:70px;border-radius:4px">` : '';
    document.getElementById('productModal').classList.add('active');
}

async function saveProductModal() {
    const id = document.getElementById('editProdId').value;
    const prices = {};
    ['100g','250g','500g','1kg','3kg','5kg'].forEach(w => {
        const val = parseFloat(document.getElementById('p_' + w).value);
        if (val > 0) prices[w] = val;
    });
    const body = {
        slug: document.getElementById('editProdSlug').value || document.getElementById('editProdName_en').value.toLowerCase().replace(/[^a-z0-9]+/g,'-'),
        name_en: document.getElementById('editProdName_en').value,
        name_ar: document.getElementById('editProdName_ar').value || document.getElementById('editProdName_en').value,
        name_ms: document.getElementById('editProdName_ms').value || document.getElementById('editProdName_en').value,
        desc_en: document.getElementById('editProdDesc_en').value,
        desc_ar: document.getElementById('editProdDesc_ar').value,
        desc_ms: document.getElementById('editProdDesc_ms').value,
        badge_en: document.getElementById('editProdBadge_en').value,
        badge_ar: document.getElementById('editProdBadge_ar').value,
        badge_ms: document.getElementById('editProdBadge_ms').value,
        texture_en: document.getElementById('editProdTexture_en').value,
        texture_ar: document.getElementById('editProdTexture_ar').value,
        texture_ms: document.getElementById('editProdTexture_ms').value,
        variety: document.getElementById('editProdVariety').value,
        image_url: document.getElementById('editProdImage').value,
        active: document.getElementById('editProdActive').checked,
        featured: document.getElementById('editProdFeatured').checked,
        prices
    };
    if (id) await api('/api/admin/products/' + id, { method: 'PUT', body });
    else await api('/api/admin/products', { method: 'POST', body });
    closeProductModal();
    PRODUCTS = await api('/api/admin/products');
    renderProductsTable();
    toast('Product saved successfully!');
}

async function deleteProduct(id) {
    if (!confirm('Are you sure you want to delete this product?')) return;
    await api('/api/admin/products/' + id, { method: 'DELETE' });
    PRODUCTS = await api('/api/admin/products');
    renderProductsTable();
    toast('Product deleted');
}

// ---------------- WHY MASSAR ----------------
function loadWhyMassarUI() {
    let wm = {
        active: true,
        subtitle_en: "Why Choose Us", subtitle_ar: "لماذا تختارنا", subtitle_ms: "Kenapa Pilih Kami",
        title_en: "WHY MASSAR?", title_ar: "لماذا مسار؟", title_ms: "KENAPA MASSAR?",
        desc_en: "Discover why dates connoisseurs trust MASSAR DATES.", desc_ar: "اكتشف لماذا يثق خبراء التمور بمسار.", desc_ms: "Ketahui sebab pencinta kurma mempercayai MASSAR DATES.",
        cards: [
            { icon: "🏆", title_en: "Premium Quality", title_ar: "جودة فائقة", title_ms: "Kualiti Premium", desc_en: "Carefully selected Saudi dates.", desc_ar: "تمور سعودية منتقاة بعناية.", desc_ms: "Kurma Saudi pilihan.", active: true },
            { icon: "🇸🇦", title_en: "Authentic Saudi Origin", title_ar: "منشأ سعودي أصيل", title_ms: "Asal Saudi Tulen", desc_en: "Authentic dates directly sourced.", desc_ar: "تمور أصيلة مستوردة مباشرة.", desc_ms: "Kurma asli dibekalkan terus.", active: true },
            { icon: "📦", title_en: "Fresh & Carefully Packed", title_ar: "طازجة ومعبأة بعناية", title_ms: "Segar & Dibungkus Rapi", desc_en: "Packed with care for maximum freshness.", desc_ar: "تعبئة راقية تضمن الطراوة.", desc_ms: "Dibungkus rapi mengekalkan kesegaran.", active: true },
            { icon: "🤝", title_en: "Trusted Service", title_ar: "خدمة موثوقة", title_ms: "Perkhidmatan Dipercayai", desc_en: "Reliable wholesale & retail service.", desc_ar: "خدمة موثوقة للأفراد والشركات.", desc_ms: "Perkhidmatan dipercayai untuk semua.", active: true }
        ]
    };
    if (CONFIG.why_massar_data) {
        try { wm = typeof CONFIG.why_massar_data === 'string' ? JSON.parse(CONFIG.why_massar_data) : CONFIG.why_massar_data; } catch(e){}
    }
    document.getElementById('wm_active').checked = wm.active !== false;
    ['en','ar','ms'].forEach(l => {
        document.getElementById('wm_sub_' + l).value = wm['subtitle_' + l] || '';
        document.getElementById('wm_title_' + l).value = wm['title_' + l] || '';
        document.getElementById('wm_desc_' + l).value = wm['desc_' + l] || '';
    });

    document.getElementById('wmCardsContainer').innerHTML = (wm.cards || []).map((c, i) => `
        <div style="background:var(--cream);border:1px solid var(--border);border-radius:8px;padding:16px;margin-bottom:14px">
            <div style="display:flex;justify-content:space-between;margin-bottom:8px">
                <strong>Card #${i+1}</strong>
                <label><input type="checkbox" class="wmc-act" data-idx="${i}" ${c.active!==false?'checked':''}> Active</label>
            </div>
            <div class="form-grid">
                <div class="field"><label>Icon (Emoji)</label><input class="wmc-icon" data-idx="${i}" value="${c.icon||'✨'}"></div>
                <div class="field"><label>Title (EN)</label><input class="wmc-t-en" data-idx="${i}" value="${c.title_en||''}"></div>
            </div>
            <div class="field"><label>Description (EN)</label><textarea class="wmc-d-en" data-idx="${i}">${c.desc_en||''}</textarea></div>
            <div class="form-grid">
                <div class="field"><label>العنوان (عربي)</label><input class="wmc-t-ar" data-idx="${i}" value="${c.title_ar||''}" dir="rtl"></div>
                <div class="field"><label>الوصف (عربي)</label><textarea class="wmc-d-ar" data-idx="${i}" dir="rtl">${c.desc_ar||''}</textarea></div>
            </div>
            <div class="form-grid">
                <div class="field"><label>Tajuk (MS)</label><input class="wmc-t-ms" data-idx="${i}" value="${c.title_ms||''}"></div>
                <div class="field"><label>Penerangan (MS)</label><textarea class="wmc-d-ms" data-idx="${i}">${c.desc_ms||''}</textarea></div>
            </div>
        </div>
    `).join('');
}

async function saveWhyMassarComplete() {
    const cards = [];
    document.querySelectorAll('.wmc-icon').forEach(el => {
        const i = el.dataset.idx;
        cards.push({
            icon: el.value,
            active: document.querySelector(`.wmc-act[data-idx="${i}"]`).checked,
            title_en: document.querySelector(`.wmc-t-en[data-idx="${i}"]`).value,
            desc_en: document.querySelector(`.wmc-d-en[data-idx="${i}"]`).value,
            title_ar: document.querySelector(`.wmc-t-ar[data-idx="${i}"]`).value,
            desc_ar: document.querySelector(`.wmc-d-ar[data-idx="${i}"]`).value,
            title_ms: document.querySelector(`.wmc-t-ms[data-idx="${i}"]`).value,
            desc_ms: document.querySelector(`.wmc-d-ms[data-idx="${i}"]`).value
        });
    });
    const data = {
        active: document.getElementById('wm_active').checked,
        subtitle_en: document.getElementById('wm_sub_en').value,
        subtitle_ar: document.getElementById('wm_sub_ar').value,
        subtitle_ms: document.getElementById('wm_sub_ms').value,
        title_en: document.getElementById('wm_title_en').value,
        title_ar: document.getElementById('wm_title_ar').value,
        title_ms: document.getElementById('wm_title_ms').value,
        desc_en: document.getElementById('wm_desc_en').value,
        desc_ar: document.getElementById('wm_desc_ar').value,
        desc_ms: document.getElementById('wm_desc_ms').value,
        cards
    };
    const jsonStr = JSON.stringify(data);
    await api('/api/admin/config', { method: 'PUT', body: { why_massar_data: jsonStr } });
    CONFIG.why_massar_data = jsonStr;
    toast('Why MASSAR section saved!');
}

// ---------------- BRANDS ----------------
function loadBrandsUI() {
    if (CONFIG.brands_data) {
        try { BRANDS = typeof CONFIG.brands_data === 'string' ? JSON.parse(CONFIG.brands_data) : CONFIG.brands_data; } catch(e){}
    }
    if (!BRANDS || !BRANDS.length) {
        BRANDS = [
            { name: 'NAWAH', tagline_en: 'Ancient Heritage & Purity', desc_en: 'Crafted with timeless tradition.', active: true },
            { name: 'QUBBAH', tagline_en: 'Royal Saudi Selection', desc_en: 'The pinnacle of luxury.', active: true },
            { name: 'ALMADINAH', tagline_en: 'Blessed Sacred Harvest', desc_en: 'Sourced from Al Madinah.', active: true }
        ];
    }
    document.getElementById('brandsTableBody').innerHTML = BRANDS.map((b, i) => `
        <tr>
            <td>${b.image_url ? `<img src="${b.image_url}" style="max-height:30px">` : `<div style="width:30px;height:30px;border-radius:50%;background:var(--beige);text-align:center;line-height:30px;font-weight:700">${b.name.charAt(0)}</div>`}</td>
            <td><strong>${b.name}</strong></td>
            <td>${b.tagline_en || '-'}</td>
            <td>${b.active !== false ? '● Active' : '○ Hidden'}</td>
            <td style="text-align:right">
                <button class="btn btn-outline btn-sm" onclick="editBrandModal(${i})">Edit</button>
                <button class="btn btn-danger btn-sm" onclick="deleteBrand(${i})">🗑</button>
            </td>
        </tr>
    `).join('');
}

function openBrandModal() {
    document.getElementById('editBrandId').value = '';
    document.getElementById('editBrandName').value = '';
    document.getElementById('editBrandImage').value = '';
    ['en','ar','ms'].forEach(l => {
        document.getElementById('editBrandTagline_' + l).value = '';
        document.getElementById('editBrandDesc_' + l).value = '';
    });
    document.getElementById('editBrandActive').checked = true;
    document.getElementById('brandModal').classList.add('active');
}
function closeBrandModal() { document.getElementById('brandModal').classList.remove('active'); }

function editBrandModal(idx) {
    const b = BRANDS[idx]; if (!b) return;
    document.getElementById('editBrandId').value = idx;
    document.getElementById('editBrandName').value = b.name;
    document.getElementById('editBrandImage').value = b.image_url || '';
    ['en','ar','ms'].forEach(l => {
        document.getElementById('editBrandTagline_' + l).value = b['tagline_' + l] || '';
        document.getElementById('editBrandDesc_' + l).value = b['desc_' + l] || '';
    });
    document.getElementById('editBrandActive').checked = b.active !== false;
    document.getElementById('brandModal').classList.add('active');
}

async function saveBrandModal() {
    const idx = document.getElementById('editBrandId').value;
    const b = {
        name: document.getElementById('editBrandName').value,
        image_url: document.getElementById('editBrandImage').value,
        tagline_en: document.getElementById('editBrandTagline_en').value,
        tagline_ar: document.getElementById('editBrandTagline_ar').value,
        tagline_ms: document.getElementById('editBrandTagline_ms').value,
        desc_en: document.getElementById('editBrandDesc_en').value,
        desc_ar: document.getElementById('editBrandDesc_ar').value,
        desc_ms: document.getElementById('editBrandDesc_ms').value,
        active: document.getElementById('editBrandActive').checked
    };
    if (idx !== '') BRANDS[idx] = b; else BRANDS.push(b);
    const jsonStr = JSON.stringify(BRANDS);
    await api('/api/admin/config', { method: 'PUT', body: { brands_data: jsonStr } });
    CONFIG.brands_data = jsonStr;
    closeBrandModal();
    loadBrandsUI();
    toast('Brand saved!');
}

async function deleteBrand(idx) {
    if (!confirm('Delete this brand?')) return;
    BRANDS.splice(idx, 1);
    const jsonStr = JSON.stringify(BRANDS);
    await api('/api/admin/config', { method: 'PUT', body: { brands_data: jsonStr } });
    CONFIG.brands_data = jsonStr;
    loadBrandsUI();
    toast('Brand deleted');
}

// ---------------- FOR BUSINESSES (B2B) ----------------
function loadB2BUI() {
    let b2b = { active: true };
    if (CONFIG.b2b_data) {
        try { b2b = typeof CONFIG.b2b_data === 'string' ? JSON.parse(CONFIG.b2b_data) : CONFIG.b2b_data; } catch(e){}
    }
    document.getElementById('b2b_active').checked = b2b.active !== false;
    ['en','ar','ms'].forEach(l => {
        document.getElementById('b2b_subtitle_' + l).value = b2b['subtitle_' + l] || '';
        document.getElementById('b2b_title_' + l).value = b2b['title_' + l] || '';
        document.getElementById('b2b_desc_' + l).value = b2b['desc_' + l] || '';
        document.getElementById('b2b_button_' + l).value = b2b['button_' + l] || '';
    });
}

async function saveB2BSectionComplete() {
    const data = {
        active: document.getElementById('b2b_active').checked,
        subtitle_en: document.getElementById('b2b_subtitle_en').value,
        subtitle_ar: document.getElementById('b2b_subtitle_ar').value,
        subtitle_ms: document.getElementById('b2b_subtitle_ms').value,
        title_en: document.getElementById('b2b_title_en').value,
        title_ar: document.getElementById('b2b_title_ar').value,
        title_ms: document.getElementById('b2b_title_ms').value,
        desc_en: document.getElementById('b2b_desc_en').value,
        desc_ar: document.getElementById('b2b_desc_ar').value,
        desc_ms: document.getElementById('b2b_desc_ms').value,
        button_en: document.getElementById('b2b_button_en').value,
        button_ar: document.getElementById('b2b_button_ar').value,
        button_ms: document.getElementById('b2b_button_ms').value
    };
    const jsonStr = JSON.stringify(data);
    await api('/api/admin/config', { method: 'PUT', body: { b2b_data: jsonStr } });
    CONFIG.b2b_data = jsonStr;
    toast('For Businesses updated successfully!');
}

// ---------------- TESTIMONIALS ----------------
function loadTestimonialsUI() {
    let t = {};
    if (CONFIG.testimonials_data) {
        try { t = typeof CONFIG.testimonials_data === 'string' ? JSON.parse(CONFIG.testimonials_data) : CONFIG.testimonials_data; } catch(e){}
    }
    ['en','ar','ms'].forEach(l => {
        for (let i = 1; i <= 3; i++) {
            const q = document.getElementById(`t_q${i}_${l}`); if (q) q.value = t[`q${i}_${l}`] || '';
            const a = document.getElementById(`t_a${i}_${l}`); if (a) a.value = t[`a${i}_${l}`] || '';
            const r = document.getElementById(`t_r${i}_${l}`); if (r) r.value = t[`r${i}_${l}`] || '';
        }
    });
}

async function saveTestimonialsComplete() {
    const data = {};
    ['en','ar','ms'].forEach(l => {
        for (let i = 1; i <= 3; i++) {
            data[`q${i}_${l}`] = document.getElementById(`t_q${i}_${l}`).value;
            data[`a${i}_${l}`] = document.getElementById(`t_a${i}_${l}`).value;
            data[`r${i}_${l}`] = document.getElementById(`t_r${i}_${l}`).value;
        }
    });
    const jsonStr = JSON.stringify(data);
    await api('/api/admin/config', { method: 'PUT', body: { testimonials_data: jsonStr } });
    CONFIG.testimonials_data = jsonStr;
    toast('Testimonials saved!');
}

// ---------------- OUR BRAND STORY ----------------
function loadBrandStoryUI() {
    let bs = {};
    if (CONFIG.brand_story_data) {
        try { bs = typeof CONFIG.brand_story_data === 'string' ? JSON.parse(CONFIG.brand_story_data) : CONFIG.brand_story_data; } catch(e){}
    }
    ['en','ar','ms'].forEach(l => {
        document.getElementById('ourbrand_sub_' + l).value = bs['sub_' + l] || '';
        document.getElementById('ourbrand_title_' + l).value = bs['title_' + l] || '';
        document.getElementById('ourbrand_desc_' + l).value = bs['desc_' + l] || '';
        document.getElementById('ourbrand_btn_' + l).value = bs['btn_' + l] || '';
    });
}

async function saveBrandStoryComplete() {
    const data = {};
    ['en','ar','ms'].forEach(l => {
        data['sub_' + l] = document.getElementById('ourbrand_sub_' + l).value;
        data['title_' + l] = document.getElementById('ourbrand_title_' + l).value;
        data['desc_' + l] = document.getElementById('ourbrand_desc_' + l).value;
        data['btn_' + l] = document.getElementById('ourbrand_btn_' + l).value;
    });
    const jsonStr = JSON.stringify(data);
    await api('/api/admin/config', { method: 'PUT', body: { brand_story_data: jsonStr } });
    CONFIG.brand_story_data = jsonStr;
    toast('Brand story saved!');
}

// ---------------- LINKS ----------------
async function saveLinksComplete() {
    const wa = document.getElementById('link_whatsapp_2').value;
    document.getElementById('link_whatsapp').value = wa;
    await saveConfigFields(['link_tiktok','link_shopee','link_lazada','link_whatsapp','social_instagram','social_facebook','social_tiktok']);
}

// ---------------- IMAGE UPLOADS ----------------
async function uploadSingleImage(e, hiddenId, previewId) {
    const file = e.target.files[0]; if (!file) return;
    const fd = new FormData(); fd.append('image', file);
    const data = await api('/api/admin/upload', { method: 'POST', body: fd });
    if (data.url) {
        document.getElementById(hiddenId).value = data.url;
        if (previewId) document.getElementById(previewId).innerHTML = `<img src="${data.url}" style="max-height:70px;border-radius:4px">`;
        toast('Image uploaded!');
    }
}
function uploadProductImage(e) { uploadSingleImage(e, 'editProdImage', 'prodImgPreviewBox'); }
function uploadBrandLogo(e) { uploadSingleImage(e, 'editBrandImage', null); }

async function uploadAboutImage(e) {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    try {
        const response = await fetch('/api/admin/upload', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + AUTH_TOKEN
            },
            body: formData
        });

        const data = await response.json();

        if (!response.ok || !data.url) {
            throw new Error(data.error || 'Upload failed');
        }

        await api('/api/admin/config', {
            method: 'PUT',
            body: {
                about_image: data.url
            }
        });

        CONFIG.about_image = data.url;

        const img = document.getElementById('aboutImagePreview');
        const box = document.getElementById('aboutImagePreviewBox');

        img.src = data.url;
        box.style.display = 'block';

        toast('About Us image updated!');

    } catch (err) {
        console.error(err);
        toast('Image upload failed', 'error');
    }
}
async function uploadLogoDirect(e) {
    const file = e.target.files[0]; if (!file) return;
    const fd = new FormData(); fd.append('image', file);
    const data = await api('/api/admin/upload', { method: 'POST', body: fd });
    if (data.url) {
        document.getElementById('logo_url').value = data.url;
        await api('/api/admin/config', { method: 'PUT', body: { logo_url: data.url } });
        CONFIG.logo_url = data.url;
        refreshLogoPreview();
        toast('Logo image updated!');
    }
}

function refreshLogoPreview() {
    const url = CONFIG.logo_url;
if (document.getElementById('logo_width')) {
    document.getElementById('logo_width').value = CONFIG.logo_width || 280;
}

if (document.getElementById('logo_height')) {
    document.getElementById('logo_height').value = CONFIG.logo_height || 90;
}
    const box = document.getElementById('logoPreviewBox');
    if (url) {
        document.getElementById('logoPreviewImg').src = url;
        box.style.display = 'flex';
    } else {
        box.style.display = 'none';
    }
}

async function removeLogo() {
    await api('/api/admin/config', { method: 'PUT', body: { logo_url: '' } });
    CONFIG.logo_url = '';
    refreshLogoPreview();
    toast('Logo removed, reverted to text logo');
}

// ---------------- SECURITY ----------------
async function changePassword(e) {
    e.preventDefault();
    const cur = document.getElementById('currentPassword').value;
    const nw = document.getElementById('newPassword').value;
    const cf = document.getElementById('confirmPassword').value;
    if (nw !== cf) { toast('Passwords do not match'); return; }
    try {
        await api('/api/admin/password', { method: 'PUT', body: { currentPassword: cur, newPassword: nw } });
        toast('Password changed successfully!');
        document.getElementById('currentPassword').value = '';
        document.getElementById('newPassword').value = '';
        document.getElementById('confirmPassword').value = '';
    } catch(err) { toast('Failed: ' + err.message); }
}

document.addEventListener('DOMContentLoaded', () => {
    if (AUTH_TOKEN) enterApp();
    else document.getElementById('loginView').style.display = 'flex';
});
// ----------------- نظام إدارة الرسائل والواتساب الجديد -----------------
function detectArabic(text) {
    const arabic = /[\u0600-\u06FF]/;
    return arabic.test(text);
}

async function fetchAdminMessages() {
    const search = document.getElementById('msgSearchInput')?.value || '';
    const filter = document.getElementById('msgFilterSelect')?.value || 'all';
    const tbody = document.getElementById('messagesTableBody');
    if (!tbody) return;

    try {
        const url = `/api/admin/messages?search=${encodeURIComponent(search)}&filter=${filter}`;
        MESSAGES = await api(url);
        
        tbody.innerHTML = '';
        if (MESSAGES.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:30px; color:var(--text-light)">No messages found.</td></tr>`;
            return;
        }

        MESSAGES.forEach(msg => {
            const isUnread = msg.is_read === 0;
            const bg = isUnread ? '#fff9db' : '#ffffff';
            const statusLabel = isUnread ? '🔴 Unread' : '✅ Read';
            const dir = detectArabic(msg.message) ? 'rtl' : 'ltr';
            const align = detectArabic(msg.message) ? 'right' : 'left';

            tbody.innerHTML += `
                <tr id="msg-row-${msg.id}" style="background-color:${bg}">
                    <td>
                        <strong style="display:block;margin-bottom:4px;">${statusLabel}</strong>
                        <button class="btn btn-outline btn-sm" style="font-size:10px;padding:2px 6px" onclick="toggleMessageRead(${msg.id})">
                            Mark ${isUnread ? 'Read' : 'Unread'}
                        </button>
                    </td>
                    <td><input type="text" id="msg-name-${msg.id}" value="${escapeHTML(msg.name)}" style="width:100%;padding:4px;border:1px solid var(--border)"></td>
                    <td><input type="email" id="msg-email-${msg.id}" value="${escapeHTML(msg.email || '')}" style="width:100%;padding:4px;border:1px solid var(--border)"></td>
                    <td>
                        <textarea id="msg-text-${msg.id}" rows="2" dir="${dir}" 
                                  style="width:100%;padding:6px;border:1px solid var(--border);text-align:${align};font-family:inherit;">${escapeHTML(msg.message)}</textarea>
                    </td>
                    <td style="font-size:11px;color:var(--text-light);white-space:nowrap;">
                        📅 ${msg.created_at}
                        ${msg.updated_at !== msg.created_at ? `<br><span style="color:var(--gold)">✏️ Edited: ${msg.updated_at}</span>` : ''}
                    </td>
                    <td style="text-align:right;">
                        <button class="btn btn-outline btn-sm" onclick="replyToCustomer('${msg.email}', '${escapeHTML(msg.name)}')"
                                style="margin-bottom:4px; width:75px; background:#007bff; color:#fff; border:none; cursor:pointer;">
                                ✉️ Reply
                        </button>
                        <br>
                        <button class="btn btn-primary btn-sm" onclick="saveMessageEdits(${msg.id})" style="margin-bottom:4px;width:75px">💾 Save</button>
                        <br>
                        <button class="btn btn-danger btn-sm" onclick="deleteMessage(${msg.id})" style="width:75px">🗑 Delete</button>
                    </td>
                </tr>
            `;
        });
    } catch (err) {
        console.error(err);
    }
}

async function toggleMessageRead(id) {
    try {
        await api(`/api/admin/messages/${id}/toggle-read`, { method: 'PATCH' });
        fetchAdminMessages();
    } catch(err) {
        toast('Error changing status');
    }
}

async function saveMessageEdits(id) {
    const name = document.getElementById(`msg-name-${id}`).value.trim();
    const email = document.getElementById(`msg-email-${id}`).value.trim();
    const message = document.getElementById(`msg-text-${id}`).value.trim();
    if (!name || !message) {
        toast('Name and message fields are required.');
        return;
    }
    try {
        await api(`/api/admin/messages/${id}`, {
            method: 'PUT',
            body: { name, email, message }
        });
        toast('Message changes saved!');
        fetchAdminMessages();
    } catch(err) {
        toast('Failed to save details');
    }
}

async function deleteMessage(id) {
    if (!confirm('Are you sure you want to delete this message?')) return;
    try {
        await api(`/api/admin/messages/${id}`, { method: 'DELETE' });
        toast('Message deleted');
        fetchAdminMessages();
    } catch(err) {
        toast('Failed to delete message');
    }
}

function replyToCustomer(email, name) {
    if (!email || email.trim() === '') {
        toast("This customer did not provide an email.");
        return;
    }
    const subject = encodeURIComponent("Reply from MASSAR DATES");
    const body = encodeURIComponent(`Hello ${name},\n\n`);
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}&su=${subject}&body=${body}`;
    const mailtoUrl = `mailto:${email}?subject=${subject}&body=${body}`;
    const useGmail = confirm("How would you like to reply?\n\nClick [ OK ] to open Gmail Web (Recommended)\nClick [ Cancel ] to use default Mail App");
    if (useGmail) {
        window.open(gmailUrl, '_blank');
    } else {
        window.location.href = mailtoUrl;
    }
}

function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, 
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
}

const originalSwitchPanel = switchPanel;

switchPanel = function(name, btn) {

    originalSwitchPanel(name, btn);

    if (name === 'messages') {
        fetchAdminMessages();
    }

    if (name === 'categories') {
        setTimeout(function() {
            if (typeof loadCategoryManager === 'function') {
                loadCategoryManager();
            }
        }, 150);
    }
};



// Discover Admin
async function loadDiscAdmin(){const t=localStorage.getItem('massar_admin_token');if(!t)return;try{const r=await fetch('/api/admin/discover',{headers:{'Authorization':'Bearer '+t}});const c=await r.json();document.getElementById('discAdminList').innerHTML='<table style="width:100%;border-collapse:collapse"><tr style="background:#f5f5f5"><th style="padding:10px;text-align:left">Title</th><th>Active</th><th>Actions</th></tr>'+c.map(x=>'<tr style="border-bottom:1px solid #eee"><td style="padding:10px">'+x.title_en+'</td><td>'+(x.active?'✅':'❌')+'</td><td><button onclick="editDiscCard('+x.id+')" style="padding:4px 8px;cursor:pointer">✏️</button><button onclick="deleteDiscCard('+x.id+')" style="padding:4px 8px;cursor:pointer;color:red">🗑️</button></td></tr>').join('')+'</table>'}catch(e){}}
function showDiscForm(c){document.getElementById('discFormWrap').style.display='block';document.getElementById('discFormTitle').textContent=c?'Edit':'New';document.getElementById('discEditId').value=c?c.id:'';document.getElementById('discImage').value=c?(c.image_url||''):'';['Ar','En','Ms'].forEach(l=>{document.getElementById('discTitle'+l).value=c?(c['title_'+l.toLowerCase()]||''):'';document.getElementById('discDesc'+l).value=c?(c['desc_'+l.toLowerCase()]||''):''})}
async function uploadDiscImage(input){if(!input.files[0])return;const f=new FormData();f.append('image',input.files[0]);const t=localStorage.getItem('massar_admin_token');const r=await fetch('/api/admin/upload',{method:'POST',headers:{'Authorization':'Bearer '+t},body:f});const d=await r.json();if(d.filename)document.getElementById('discImage').value='/uploads/'+d.filename}
async function saveDiscCard(){const t=localStorage.getItem('massar_admin_token');const id=document.getElementById('discEditId').value;const d={image_url:document.getElementById('discImage').value,active:1,sort_order:0};['ar','en','ms'].forEach(l=>{d['title_'+l]=document.getElementById('discTitle'+l.charAt(0).toUpperCase()+l.slice(1)).value;d['desc_'+l]=document.getElementById('discDesc'+l.charAt(0).toUpperCase()+l.slice(1)).value});await fetch(id?'/api/admin/discover/'+id:'/api/admin/discover',{method:id?'PUT':'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+t},body:JSON.stringify(d)});document.getElementById('discFormWrap').style.display='none';loadDiscAdmin()}
async function editDiscCard(id){const t=localStorage.getItem('massar_admin_token');const r=await fetch('/api/admin/discover',{headers:{'Authorization':'Bearer '+t}});const c=await r.json();const card=c.find(x=>x.id===id);if(card)showDiscForm(card)}
async function deleteDiscCard(id){if(!confirm('Delete?'))return;const t=localStorage.getItem('massar_admin_token');await fetch('/api/admin/discover/'+id,{method:'DELETE',headers:{'Authorization':'Bearer '+t}});loadDiscAdmin()}


async function uploadAdminImage(input, targetId) {
    if (!input.files || !input.files[0]) return;
    const formData = new FormData();
    formData.append('image', input.files[0]);
    const token = localStorage.getItem('massar_admin_token');
    try {
        const res = await fetch('/api/admin/upload', {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + token },
            body: formData
        });
        const data = await res.json();
        if (data.filename) {
            document.getElementById(targetId).value = '/uploads/' + data.filename;
        } else if (data.url) {
            document.getElementById(targetId).value = data.url;
        }
    } catch(e) {}
}

function switchBlogLangTab(lang, btn) {
    ['ar','en','ms'].forEach(l => document.getElementById('blogLangBox-'+l).style.display = (l === lang ? 'block' : 'none'));
    btn.parentNode.querySelectorAll('.lang-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
}

function switchDiscLangTab(lang, btn) {
    ['ar','en','ms'].forEach(l => document.getElementById('discLangBox-'+l).style.display = (l === lang ? 'block' : 'none'));
    btn.parentNode.querySelectorAll('.lang-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
}

async function loadNativeBlog() {
    const token = localStorage.getItem('massar_admin_token');
    try {
        const res = await fetch('/api/admin/blog', { headers: { 'Authorization': 'Bearer ' + token } });
        const posts = await res.json();
        const wrap = document.getElementById('blogTableWrap');
        if (!posts || posts.length === 0) {
            wrap.innerHTML = '<p>No articles found.</p>';
            return;
        }
        wrap.innerHTML = `<table class="table">
            <thead>
                <tr>
                    <th>Title (EN / AR)</th>
                    <th>Category</th>
                    <th>Status</th>
                    <th>Featured</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${posts.map(p => `
                    <tr>
                        <td><strong>${p.title_en || '-'}</strong><br><small style="color:var(--text-light)">${p.title_ar || '-'}</small></td>
                        <td><span style="background:var(--cream-dark);padding:3px 8px;border-radius:4px;font-size:12px;">${p.category || '-'}</span></td>
                        <td>${p.published ? '<span style="color:var(--success);font-weight:bold;">✅ Published</span>' : '<span style="color:var(--danger)">❌ Hidden</span>'}</td>
                        <td>${p.featured ? '⭐ Yes' : '-'}</td>
                        <td>
                            <button class="btn" style="background:var(--cream-dark);padding:4px 10px;font-size:12px;" onclick="editNativeBlog(${p.id})">✏️ Edit</button>
                            <button class="btn" style="background:var(--cream-dark);padding:4px 10px;font-size:12px;" onclick="toggleNativeBlogPub(${p.id})">${p.published ? '🙈 Hide' : '👁️ Show'}</button>
                            <button class="btn" style="background:var(--danger);color:#fff;padding:4px 10px;font-size:12px;" onclick="deleteNativeBlog(${p.id})">🗑️ Delete</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>`;
    } catch(e) {}
}

function showNativeBlogForm(post) {
    const form = document.getElementById('blogFormCard');

    if (!form) {
        console.error('blogFormCard not found');
        return;
    }

    form.style.display = 'block';

    document.getElementById('blogFormCardTitle').textContent =
        post ? 'Edit Article' : 'Add New Article';

    document.getElementById('adminBlogEditId').value =
        post ? post.id : '';

    document.getElementById('adminBlogSlug').value =
        post ? (post.slug || '') : '';

    document.getElementById('adminBlogCategory').value =
        post ? (post.category || 'news') : 'news';

    document.getElementById('adminBlogSort').value =
        post ? (post.sort_order || 0) : 0;

    document.getElementById('adminBlogImg').value =
        post ? (post.image_url || '') : '';

    document.getElementById('adminBlogTitleAr').value =
        post ? (post.title_ar || '') : '';

    document.getElementById('adminBlogExcAr').value =
        post ? (post.excerpt_ar || '') : '';

    document.getElementById('adminBlogContAr').innerHTML =
    post ? (post.content_ar || '') : '';

  document.getElementById('adminBlogContEn').innerHTML =
    post ? (post.content_en || '') : '';

    document.getElementById('adminBlogExcEn').value =
        post ? (post.excerpt_en || '') : '';

    document.getElementById('adminBlogContEn').innerHTML =
        post ? (post.content_en || '') : '';

    document.getElementById('adminBlogContMs').innerHTML =
    post ? (post.content_ms || '') : '';

    document.getElementById('adminBlogExcMs').value =
        post ? (post.excerpt_ms || '') : '';

    document.getElementById('adminBlogContMs').innerHTML =
        post ? (post.content_ms || '') : '';

    form.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
    });
}


async function saveAdminBlog() {
    const token = localStorage.getItem('massar_admin_token');

    if (!token) {
        alert('Admin session expired. Please login again.');
        return;
    }

    const id = document.getElementById('adminBlogEditId').value;

    const b = {
        slug: document.getElementById('adminBlogSlug').value || ('post-' + Date.now()),
        category: document.getElementById('adminBlogCategory').value,
        sort_order: parseInt(document.getElementById('adminBlogSort').value) || 0,
        image_url: document.getElementById('adminBlogImg').value,

        published: 1,
        featured: 0,

        title_ar: document.getElementById('adminBlogTitleAr').value,
        title_en: document.getElementById('adminBlogTitleEn').value,
        title_ms: document.getElementById('adminBlogTitleMs').value,

        excerpt_ar: document.getElementById('adminBlogExcAr').value,
        excerpt_en: document.getElementById('adminBlogExcEn').value,
        excerpt_ms: document.getElementById('adminBlogExcMs').value,

      content_ar:
document.getElementById('adminBlogContAr').innerHTML,
content_en:
document.getElementById('adminBlogContEn').innerHTML,
content_ms:
document.getElementById('adminBlogContMs').innerHTML
    };

    try {
        const res = await fetch(
            id ? '/api/admin/blog/' + id : '/api/admin/blog',
            {
                method: id ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify(b)
            }
        );

        const data = await res.json();

        console.log('Save response:', data);

        if (!res.ok) {
            alert('Failed to save article: ' + (data.error || data.message || res.status));
            return;
        }

        alert(id ? 'Article updated successfully!' : 'Article added successfully!');

        document.getElementById('blogFormCard').style.display = 'none';

        loadNativeBlog();

    } catch (error) {
        console.error('Save article error:', error);
        alert('Error saving article. Check the console.');
    }
}


async function editNativeBlog(id) {
    console.log('EDIT BLOG ID:', id);

    const token = localStorage.getItem('massar_admin_token');

    if (!token) {
        alert('Admin session expired. Please login again.');
        return;
    }

    try {
        const res = await fetch('/api/admin/blog', {
            headers: {
                'Authorization': 'Bearer ' + token
            }
        });

        if (!res.ok) {
            throw new Error('Failed to load blog: HTTP ' + res.status);
        }

        const posts = await res.json();

        console.log('BLOG POSTS:', posts);

        const post = posts.find(p => Number(p.id) === Number(id));

        if (!post) {
            alert('Article not found');
            return;
        }

        showNativeBlogForm(post);

    } catch (error) {
        console.error('editNativeBlog error:', error);
        alert('Could not load article for editing.');
    }
}

async function deleteNativeBlog(id) {
    if (!confirm('Are you sure you want to delete this article?')) return;
   const token = localStorage.getItem('massar_admin_token');
    await fetch('/api/admin/blog/' + id, { method: 'DELETE', headers: { 'Authorization': 'Bearer ' + token } });
    loadNativeBlog();
}

async function loadNativeDiscover() {
    const token = localStorage.getItem('massar_admin_token');
    try {
        const res = await fetch('/api/admin/discover', { headers: { 'Authorization': 'Bearer ' + token } });
        const cards = await res.json();
        const wrap = document.getElementById('discTableWrap');
        if (!cards || cards.length === 0) {
            wrap.innerHTML = '<p>No discover cards found.</p>';
            return;
        }
        wrap.innerHTML = `<table class="table">
            <thead>
                <tr>
                    <th>Image</th>
                    <th>Title (EN / AR)</th>
                    <th>Status</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${cards.map(c => `
                    <tr>
                        <td><img src="${c.image_url}" style="height:45px;width:75px;object-fit:cover;border-radius:4px;"></td>
                        <td><strong>${c.title_en || '-'}</strong><br><small style="color:var(--text-light)">${c.title_ar || '-'}</small></td>
                        <td>${c.active ? '<span style="color:var(--success);font-weight:bold;">✅ Active</span>' : '<span style="color:var(--danger)">❌ Hidden</span>'}</td>
                        <td>
                            <button class="btn" style="background:var(--cream-dark);padding:4px 10px;font-size:12px;" onclick="editNativeDisc(${c.id})">✏️ Edit</button>
                            <button class="btn" style="background:var(--danger);color:#fff;padding:4px 10px;font-size:12px;" onclick="deleteNativeDisc(${c.id})">🗑️ Delete</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>`;
    } catch(e) {}
}

function showNativeDiscForm(card) {
    document.getElementById('discFormCard').style.display = 'block';
    document.getElementById('discFormCardTitle').textContent = card ? 'Edit Card' : 'Add New Card';
    document.getElementById('adminDiscEditId').value = card ? card.id : '';
    document.getElementById('adminDiscImg').value = card ? (card.image_url || '') : '';

    ['Ar','En','Ms'].forEach(l => {
        document.getElementById('adminDiscTitle'+l).value = card ? (card['title_'+l.toLowerCase()] || '') : '';
        document.getElementById('adminDiscDesc'+l).value = card ? (card['desc_'+l.toLowerCase()] || '') : '';
    });
}

async function saveAdminDisc() {
    const token = localStorage.getItem('massar_admin_token');
    const id = document.getElementById('adminDiscEditId').value;
    const c = {
        image_url: document.getElementById('adminDiscImg').value, active: 1, sort_order: 0,
        title_ar: document.getElementById('adminDiscTitleAr').value,
        title_en: document.getElementById('adminDiscTitleEn').value,
        title_ms: document.getElementById('adminDiscTitleMs').value,
        desc_ar: document.getElementById('adminDiscDescAr').value,
        desc_en: document.getElementById('adminDiscDescEn').value,
        desc_ms: document.getElementById('adminDiscDescMs').value
    };
    await fetch(id ? '/api/admin/discover/' + id : '/api/admin/discover', {
        method: id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify(c)
    });
    document.getElementById('discFormCard').style.display = 'none';
    loadNativeDiscover();
}

async function editNativeDisc(id) {
    const token = localStorage.getItem('massar_admin_token');
    const res = await fetch('/api/admin/discover', { headers: { 'Authorization': 'Bearer ' + token } });
    const cards = await res.json();
    const card = cards.find(c => c.id === id);
    if (card) showNativeDiscForm(card);
}

async function deleteNativeDisc(id) {
    if (!confirm('Are you sure you want to delete this card?')) return;
   const token = localStorage.getItem('massar_admin_token');
    await fetch('/api/admin/discover/' + id, { method: 'DELETE', headers: { 'Authorization': 'Bearer ' + token } });
    loadNativeDiscover();
}

// Hook natively into switchPanel
if (typeof window.switchPanel === 'function') {
    const origSwitch = window.switchPanel;
    window.switchPanel = function(panelName, btn) {
        origSwitch(panelName, btn);
        if (panelName === 'blog') loadNativeBlog();
        if (panelName === 'discover') loadNativeDiscover();
    };
}


console.log("ADMIN NATIVE SCRIPT LOADED");
console.log("editNativeBlog:", typeof editNativeBlog);


// Image Upload Helper
async function uploadAdminImage(input, targetId) {
    if (!input.files || !input.files[0]) return;
    const formData = new FormData();
    formData.append('image', input.files[0]);
    const token = localStorage.getItem('massar_admin_token');
    try {
        const res = await fetch('/api/admin/upload', {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + token },
            body: formData
        });
        const data = await res.json();
        if (data.filename) {
            document.getElementById(targetId).value = '/uploads/' + data.filename;
        } else if (data.url) {
            document.getElementById(targetId).value = data.url;
        }
    } catch(e) { console.error('Upload Error:', e); }
}

function switchBlogLangTab(lang, btn) {
    ['ar','en','ms'].forEach(l => document.getElementById('blogLangBox-'+l).style.display = (l === lang ? 'block' : 'none'));
    btn.parentNode.querySelectorAll('.lang-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
}

function switchDiscLangTab(lang, btn) {
    ['ar','en','ms'].forEach(l => document.getElementById('discLangBox-'+l).style.display = (l === lang ? 'block' : 'none'));
    btn.parentNode.querySelectorAll('.lang-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
}

// Load Blog List
async function loadAdminBlog() {
    const token = localStorage.getItem('massar_admin_token');
    try {
        const res = await fetch('/api/admin/blog', { headers: { 'Authorization': 'Bearer ' + token } });
        const posts = await res.json();
        const wrap = document.getElementById('blogTableWrap');
        if (!posts || posts.length === 0) {
            wrap.innerHTML = '<p>No articles found.</p>';
            return;
        }
        wrap.innerHTML = `<table class="table">
            <thead>
                <tr>
                    <th>Title (EN / AR)</th>
                    <th>Category</th>
                    <th>Status</th>
                    <th>Featured</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${posts.map(p => `
                    <tr>
                        <td><strong>${p.title_en}</strong><br><small style="color:var(--text-light)">${p.title_ar}</small></td>
                        <td><span style="background:var(--cream-dark);padding:3px 8px;border-radius:4px;font-size:12px;">${p.category}</span></td>
                        <td>${p.published ? '<span style="color:var(--success);font-weight:bold;">✅ Published</span>' : '<span style="color:var(--danger)">❌ Hidden</span>'}</td>
                        <td>${p.featured ? '⭐ Yes' : '-'}</td>
                        <td>
                            <button class="btn" style="background:var(--cream-dark);padding:4px 10px;font-size:12px;" onclick="editAdminBlog(${p.id})">✏️ Edit</button>
                            <button class="btn" style="background:var(--cream-dark);padding:4px 10px;font-size:12px;" onclick="toggleAdminBlogPub(${p.id})">${p.published ? '🙈 Hide' : '👁️ Show'}</button>
                            <button class="btn" style="background:var(--danger);color:#fff;padding:4px 10px;font-size:12px;" onclick="deleteAdminBlog(${p.id})">🗑️ Delete</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>`;
    } catch(e) { console.error('Blog load error:', e); }
}

function showAdminBlogForm(post) {
    document.getElementById('blogFormCard').style.display = 'block';
    document.getElementById('blogFormCardTitle').textContent = post ? 'Edit Article' : 'Add New Article';
    document.getElementById('adminBlogEditId').value = post ? post.id : '';
    document.getElementById('adminBlogSlug').value = post ? post.slug : '';
    document.getElementById('adminBlogCategory').value = post ? post.category : 'types-of-dates';
    document.getElementById('adminBlogSort').value = post ? (post.sort_order || 0) : 0;
    document.getElementById('adminBlogImg').value = post ? (post.image_url || '') : '';

    ['Ar','En','Ms'].forEach(l => {
        document.getElementById('adminBlogTitle'+l).value = post ? (post['title_'+l.toLowerCase()] || '') : '';
        document.getElementById('adminBlogExc'+l).value = post ? (post['excerpt_'+l.toLowerCase()] || '') : '';
        document.getElementById('adminBlogCont'+l).innerHTML = post ? (post['content_'+l.toLowerCase()] || '') : '';
    });
}



async function editAdminBlog(id) {
    const token = localStorage.getItem('massar_admin_token');
    const res = await fetch('/api/admin/blog', { headers: { 'Authorization': 'Bearer ' + token } });
    const posts = await res.json();
    const post = posts.find(p => p.id === id);
    if (post) showAdminBlogForm(post);
}

async function toggleAdminBlogPub(id) {
    const token = localStorage.getItem('massar_admin_token');
    await fetch('/api/admin/blog/' + id + '/toggle', { method: 'PATCH', headers: { 'Authorization': 'Bearer ' + token } });
    loadAdminBlog();
}

async function deleteAdminBlog(id) {
    if (!confirm('Are you sure you want to delete this article?')) return;
    const token = localStorage.getItem('massar_admin_token');
    await fetch('/api/admin/blog/' + id, { method: 'DELETE', headers: { 'Authorization': 'Bearer ' + token } });
    loadAdminBlog();
}

// Discover Admin Logic
async function loadAdminDiscover() {
    const token = localStorage.getItem('massar_admin_token');
    try {
        const res = await fetch('/api/admin/discover', { headers: { 'Authorization': 'Bearer ' + token } });
        const cards = await res.json();
        const wrap = document.getElementById('discTableWrap');
        if (!cards || cards.length === 0) {
            wrap.innerHTML = '<p>No cards found.</p>';
            return;
        }
        wrap.innerHTML = `<table class="table">
            <thead>
                <tr>
                    <th>Image</th>
                    <th>Title (EN / AR)</th>
                    <th>Status</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${cards.map(c => `
                    <tr>
                        <td><img src="${c.image_url}" style="height:45px;width:75px;object-fit:cover;border-radius:4px;"></td>
                        <td><strong>${c.title_en}</strong><br><small style="color:var(--text-light)">${c.title_ar}</small></td>
                        <td>${c.active ? '<span style="color:var(--success);font-weight:bold;">✅ Active</span>' : '<span style="color:var(--danger)">❌ Hidden</span>'}</td>
                        <td>
                            <button class="btn" style="background:var(--cream-dark);padding:4px 10px;font-size:12px;" onclick="editAdminDisc(${c.id})">✏️ Edit</button>
                            <button class="btn" style="background:var(--danger);color:#fff;padding:4px 10px;font-size:12px;" onclick="deleteAdminDisc(${c.id})">🗑️ Delete</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>`;
    } catch(e) { console.error('Discover load error:', e); }
}

function showAdminDiscForm(card) {
    const form = document.getElementById('discFormCard');
    if (!form) return;

    form.style.display = 'block';

    const setValue = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.value = value || '';
    };

    setValue('discFormCardTitle', card ? 'Edit Card' : 'Add New Card');
    setValue('adminDiscEditId', card ? card.id : '');
    setValue('adminDiscImg', card ? card.image_url : '');

    setValue('adminDiscTitleAr', card ? card.title_ar : '');
    setValue('adminDiscTitleEn', card ? card.title_en : '');
    setValue('adminDiscTitleMs', card ? card.title_ms : '');

    setValue('adminDiscDescAr', card ? card.desc_ar : '');
    setValue('adminDiscDescEn', card ? card.desc_en : '');
    setValue('adminDiscDescMs', card ? card.desc_ms : '');

    ['ar','en','ms'].forEach(function(l) {
        const box = document.getElementById('discLangBox-' + l);
        if (box) box.style.display = l === 'ar' ? 'block' : 'none';
    });

    document.querySelectorAll('[onclick*="switchDiscLangTab"]').forEach(function(btn) {
        btn.classList.toggle('active', btn.textContent.includes('العربية'));
    });
}
async function saveAdminDisc() {
    const token = localStorage.getItem('massar_admin_token');
    const id = document.getElementById('adminDiscEditId').value;
    const c = {
        image_url: document.getElementById('adminDiscImg').value, active: 1, sort_order: 0,
        title_ar: document.getElementById('adminDiscTitleAr').value,
        title_en: document.getElementById('adminDiscTitleEn').value,
        title_ms: document.getElementById('adminDiscTitleMs').value,
        desc_ar: document.getElementById('adminDiscDescAr').value,
        desc_en: document.getElementById('adminDiscDescEn').value,
        desc_ms: document.getElementById('adminDiscDescMs').value
    };
    await fetch(id ? '/api/admin/discover/' + id : '/api/admin/discover', {
        method: id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify(c)
    });
    document.getElementById('discFormCard').style.display = 'none';
    loadAdminDiscover();
}

async function editAdminDisc(id) {
    const token = localStorage.getItem('massar_admin_token');
    const res = await fetch('/api/admin/discover', { headers: { 'Authorization': 'Bearer ' + token } });
    const cards = await res.json();
    const card = cards.find(c => c.id === id);
    if (card) showAdminDiscForm(card);
}

async function deleteAdminDisc(id) {
    if (!confirm('Are you sure you want to delete this card?')) return;
    const token = localStorage.getItem('massar_admin_token');
    await fetch('/api/admin/discover/' + id, { method: 'DELETE', headers: { 'Authorization': 'Bearer ' + token } });
    loadAdminDiscover();
}

// Hook into native switchPanel
if (typeof window.switchPanel === 'function') {
    const origSwitch = window.switchPanel;
    window.switchPanel = function(panelName, btn) {
        origSwitch(panelName, btn);
        if (panelName === 'blog') loadAdminBlog();
        if (panelName === 'discover') loadAdminDiscover();
    };
}


function blogFormat(editorId, command, value = null) {
    const editor = document.getElementById(editorId);

    if (!editor) {
        console.error('Blog editor not found:', editorId);
        return;
    }

    editor.focus();

    try {
        if (command === 'fontSize') {
            document.execCommand('fontSize', false, value);
        } else if (command === 'fontName') {
            document.execCommand('fontName', false, value);
        } else if (command === 'foreColor') {
            document.execCommand('foreColor', false, value);
        } else {
            document.execCommand(command, false, value);
        }
    } catch (error) {
        console.error('Blog formatting error:', error);
    }
}


function toggleAdminSidebar(){
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');

    if(!sidebar) return;

    sidebar.classList.toggle('open');

    if(overlay){
        overlay.classList.toggle('open', sidebar.classList.contains('open'));
    }
}

function closeAdminSidebar(){
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');

    if(sidebar) sidebar.classList.remove('open');
    if(overlay) overlay.classList.remove('open');
}

document.addEventListener('DOMContentLoaded', function(){
    document.querySelectorAll('.nav-item').forEach(function(item){
        item.addEventListener('click', function(){
            if(window.innerWidth <= 900){
                closeAdminSidebar();
            }
        });
    });

    window.addEventListener('resize', function(){
        if(window.innerWidth > 900){
            closeAdminSidebar();
        }
    });
});


function adminGoBack(){
    if (window.history.length > 1) {
        window.history.back();
    } else {
        switchPanelByName('dashboard');
    }
}


/* ===== ADMIN SECTION BACK NAVIGATION ===== */
(function(){

    let adminSectionHistory = [];

    function getCurrentAdminSection(){
        const active = document.querySelector('.panel.active');
        return active ? active.id.replace('panel-','') : 'dashboard';
    }

    window.adminGoBack = function(){

        if(adminSectionHistory.length === 0){
            switchPanelByName('dashboard');
            return;
        }

        const previous = adminSectionHistory.pop();

        switchPanelByName(previous);

        setTimeout(function(){
            updateAdminBackButton();
        }, 50);
    };

    window.updateAdminBackButton = function(){
        const btn = document.querySelector('.admin-back-btn');

        if(!btn) return;

        const current = getCurrentAdminSection();

        if(current === 'dashboard' || adminSectionHistory.length === 0){
            btn.style.visibility = 'hidden';
            btn.style.pointerEvents = 'none';
        }else{
            btn.style.visibility = 'visible';
            btn.style.pointerEvents = 'auto';
        }
    };

    const originalSwitchPanel = window.switchPanel;

    if(typeof originalSwitchPanel === 'function'){

        window.switchPanel = function(panelName, btn){

            const current = getCurrentAdminSection();

            if(panelName !== current){
                if(current && current !== panelName){
                    adminSectionHistory.push(current);
                }
            }

            originalSwitchPanel(panelName, btn);

            setTimeout(function(){
                updateAdminBackButton();
            }, 30);
        };
    }

    document.addEventListener('DOMContentLoaded', function(){

        setTimeout(function(){
            updateAdminBackButton();
        }, 100);

    });

})();


/* ===== CLOSE SIDEBAR WHEN MOUSE LEAVES SIDEBAR ===== */
(function(){

    document.addEventListener('DOMContentLoaded', function(){

        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebarOverlay');

        if(!sidebar) return;

        

    });

})();


/* ===== FINAL ADMIN SIDEBAR CLICK FIX ===== */
(function () {

    document.addEventListener("click", function (e) {

        const sidebar = document.getElementById("sidebar");
        const menuBtn = document.getElementById("mobileMenuBtn");

        if (!sidebar || !menuBtn) return;

        if (window.innerWidth <= 900 &&
            sidebar.classList.contains("open") &&
            e.target !== menuBtn &&
            !menuBtn.contains(e.target)) {

            sidebar.classList.remove("open");

            const overlay = document.getElementById("sidebarOverlay");

            if (overlay) {
                overlay.classList.remove("open");
                overlay.classList.remove("active");
            }
        }

    }, true);

})();

