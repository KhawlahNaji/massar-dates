
(function () {
  // إنشاء الزر العائم الذهبي الفخم
  function createFloatingBackButton() {
    if (document.getElementById('massar-back-btn')) return;

    const btn = document.createElement('button');
    btn.id = 'massar-back-btn';
    btn.setAttribute('aria-label', 'العودة للخلف');
    btn.title = 'العودة للخلف';
    btn.style.cssText = [
      'position: fixed',
      'bottom: 25px',
      'left: 25px',
      'width: 52px',
      'height: 52px',
      'background: linear-gradient(135deg, #b8956a, #8f724d)',
      'color: #ffffff',
      'border: 2px solid rgba(255, 255, 255, 0.4)',
      'border-radius: 50%',
      'font-size: 22px',
      'font-weight: bold',
      'cursor: pointer',
      'box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25)',
      'z-index: 99999',
      'display: flex',
      'align-items: center',
      'justify-content: center',
      'transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      'opacity: 0',
      'transform: scale(0.6) translateY(20px)',
      'pointer-events: none'
    ].join('; ');

    btn.innerHTML = '&#8592;'; // سهم الرجوع الأنيق

    btn.onmouseenter = function () {
      btn.style.transform = 'scale(1.12) translateY(-3px)';
      btn.style.boxShadow = '0 8px 25px rgba(184, 149, 106, 0.55)';
    };
    btn.onmouseleave = function () {
      btn.style.transform = 'scale(1) translateY(0)';
      btn.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.25)';
    };

    btn.onclick = function (e) {
      e.preventDefault();
      executeUniversalBack();
    };

    document.body.appendChild(btn);
  }

  // فحص النوافذ المنبثقة المفتوحة
  function getActiveModal() {
    const selectors = [
      '#productDetailModal',
      '#detailModal',
      '.product-detail-modal',
      '.modal.show',
      '.modal[style*="display: block"]',
      '.modal[style*="display: flex"]',
      '#brandEditModal',
      '#productModal'
    ];
    for (let s of selectors) {
      const el = document.querySelector(s);
      if (el && (el.style.display === 'block' || el.style.display === 'flex' || el.classList.contains('active') || el.classList.contains('show'))) {
        return el;
      }
    }
    return null;
  }

  // دالة الرجوع الشاملة والذكية
  function executeUniversalBack() {
    // 1. إغلاق النوافذ المنبثقة أولاً إن وجدت
    const openModal = getActiveModal();
    if (openModal) {
      const closeBtn = openModal.querySelector('.btn-close, .close, [onclick*="close"], #btnCloseBrandModal, #btnCancelModal');
      if (closeBtn) {
        closeBtn.click();
      } else {
        openModal.style.display = 'none';
      }
      updateVisibility();
      return;
    }

    // 2. إلغاء فلترة البراندات إن كانت مفعلة
    const filterBanner = document.getElementById('brandFilterNotice') || document.getElementById('brandFilterActiveBanner') || document.getElementById('brand-filter-bar');
    if (filterBanner) {
      if (typeof window.clearBrandFilterView === 'function') window.clearBrandFilterView();
      else if (typeof window.clearBrandFilter === 'function') window.clearBrandFilter();
      else filterBanner.remove();
      updateVisibility();
      return;
    }

    // 3. الرجوع خطوة للخلف في المتصفح أو الصعود للأعلى
    if (window.history.length > 1 && window.location.hash && window.location.hash !== '#home' && window.location.hash !== '#') {
      window.history.back();
    } else {
      if (typeof window.navigateTo === 'function') {
        window.navigateTo('home');
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  // التحكم بظهور واختفاء زر الرجوع بذكاء
  function updateVisibility() {
    const btn = document.getElementById('massar-back-btn');
    if (!btn) return;

    const hasModal = Boolean(getActiveModal());
    const isScrolled = window.scrollY > 250;
    const isSubHash = window.location.hash && window.location.hash !== '#home' && window.location.hash !== '#';
    const hasFilter = Boolean(document.getElementById('brandFilterNotice') || document.getElementById('brandFilterActiveBanner') || document.getElementById('brand-filter-bar'));

    if (hasModal || isScrolled || isSubHash || hasFilter) {
      btn.style.opacity = '1';
      btn.style.transform = 'scale(1) translateY(0)';
      btn.style.pointerEvents = 'auto';
    } else {
      btn.style.opacity = '0';
      btn.style.transform = 'scale(0.6) translateY(20px)';
      btn.style.pointerEvents = 'none';
    }
  }

  // ربط أحداث أزرار الجوال والكمبيوتر
  function setupHardwareAndKeyEvents() {
    // التقاط ضغط فتح المنتجات لتسجيل حالة في تاريخ المتصفح لمنع الخروج من الموقع بالجوال
    document.addEventListener('click', function (e) {
      const target = e.target.closest('[onclick*="showDetail"], [onclick*="editProductModal"], .btn-view-product, .product-card, #brandsPortfolioGrid button');
      if (target) {
        history.pushState({ modalOpen: true, t: Date.now() }, '', window.location.href);
        setTimeout(updateVisibility, 150);
      }
    }, true);

    // التقاط زر الرجوع في الجوال (أندرويد وفيزيائي) وإيماءات السحب (آيفون)
    window.addEventListener('popstate', function (e) {
      const openModal = getActiveModal();
      if (openModal) {
        e.preventDefault();
        const closeBtn = openModal.querySelector('.btn-close, .close, [onclick*="close"], #btnCloseBrandModal');
        if (closeBtn) closeBtn.click();
        else openModal.style.display = 'none';
        updateVisibility();
      } else {
        updateVisibility();
      }
    });

    // دعم زر الهروب ESC في الكمبيوتر
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' || e.keyCode === 27) {
        executeUniversalBack();
      }
    });

    window.addEventListener('scroll', updateVisibility, { passive: true });
    window.addEventListener('hashchange', updateVisibility);
  }

  function init() {
    createFloatingBackButton();
    setupHardwareAndKeyEvents();
    setInterval(updateVisibility, 500);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
