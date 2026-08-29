(function() {
    window.currentSelectedBrand = null;

    // دمج الفلتر مع دالة العرض الأساسية لمنع إلغاء الفلترة
    function hookRenderProducts() {
        if (window._brandFilterHooked) return;
        if (typeof window.renderProducts === "function") {
            window._brandFilterHooked = true;
            const originalRender = window.renderProducts;
            window.renderProducts = function() {
                originalRender.apply(this, arguments);
                if (window.currentSelectedBrand) {
                    applyBrandFilterDOM(window.currentSelectedBrand);
                }
            };
        }
    }

    // مراقبة الضغط على زر أي براند
    document.addEventListener("click", function(e) {
        const btn = e.target.closest("#brandsPortfolioGrid button, .brands-portfolio-section button, #brandsPortfolioGrid a");
        if (!btn) return;

        const card = btn.closest("div[style*='border-radius']") || btn.parentElement.parentElement;
        const h3 = card ? card.querySelector("h3") : null;
        if (!h3) return;

        const brandName = h3.textContent.trim();
        e.preventDefault();
        e.stopPropagation();

        window.currentSelectedBrand = brandName;

        if (typeof navigateTo === "function") {
            navigateTo("products");
        }

        setTimeout(() => {
            applyBrandFilterDOM(brandName);
            const target = document.getElementById("products") || document.getElementById("allGrid");
            if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 60);
    }, true);

    // تطبيق تصفية المنتجات في الواجهة
    function applyBrandFilterDOM(brandName) {
        const allEl = document.getElementById("allGrid");
        if (!allEl) return;

        let prodsList = [];
        if (typeof products !== "undefined" && Array.isArray(products)) prodsList = products;
        else if (window.products && Array.isArray(window.products)) prodsList = window.products;

        if (!prodsList.length) return;

        const bLower = brandName.toLowerCase();
        const filtered = prodsList.filter(p => {
            const b = (p.brand || "").toLowerCase();
            const v = (p.variety || "").toLowerCase();
            const ne = (p.name_en || "").toLowerCase();
            const na = (p.name_ar || "").toLowerCase();

            return b.includes(bLower) || bLower.includes(b && b.length > 2 ? b : "___") ||
                   v.includes(bLower) || ne.includes(bLower) || na.includes(bLower);
        });

        // شريط التصفية العلوي
        let notice = document.getElementById("brandFilterNotice");
        if (!notice) {
            notice = document.createElement("div");
            notice.id = "brandFilterNotice";
            allEl.parentNode.insertBefore(notice, allEl);
        }

        notice.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; background:#fff9f0; border:2px solid #b8956a; padding:14px 20px; border-radius:10px; margin-bottom:25px; box-shadow:0 2px 8px rgba(184,149,106,0.15);">
                <div style="font-weight:bold; color:#2d3748; font-size:1.05rem;">
                    🏷️ Brand: <span style="color:#b8956a; text-transform:uppercase;">${brandName}</span> (${filtered.length} Products)
                </div>
                <button onclick="window.currentSelectedBrand=null; document.getElementById('brandFilterNotice').remove(); renderProducts();" style="background:#b8956a; color:white; border:none; padding:7px 16px; border-radius:6px; font-weight:bold; cursor:pointer;">
                    Show All Products ✕
                </button>
            </div>
        `;

        if (filtered.length > 0 && typeof window.productCardHtml === "function") {
            allEl.innerHTML = filtered.map(window.productCardHtml).join("");
        } else {
            allEl.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:50px 20px; color:#64748b; background:#f8fafc; border-radius:10px;">No products found for "${brandName}".</div>`;
        }
    }

    setInterval(hookRenderProducts, 300);
})();