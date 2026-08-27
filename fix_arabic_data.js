const db = require("./database");

console.log("Starting Arabic data repair...");

// ==================== SITE CONFIG ====================

const siteConfig = {
    logo_tagline_ar: "تمور سعودية فاخرة",
    hero_badge_ar: "جودة فاخرة من المملكة العربية السعودية",
    hero_title_ar: "أفضل التمور السعودية تصل إليك",
    hero_desc_ar: "اكتشف مجموعتنا المختارة بعناية من التمور الفاخرة من أفضل مزارع المملكة العربية السعودية.",
    about_title_ar: "شغف بالتمور الفاخرة",
    about_text_ar: "شركة مسار للاستيراد والتصدير والتجارة المحدودة هي شركة تجارية دولية مقرها ماليزيا، متخصصة في استيراد وتصدير وتوزيع أجود أنواع التمور والفواكه المجففة وغيرها من الأطعمة على مستوى العالم. نلتزم بتوفير تمور استثنائية ومنتجات أخرى من مصادر موثوقة إلى الأسواق العالمية، جامعًا بين الجودة العالية والأسعار التنافسية والخدمة الاحترافية والإمداد الموثوق. نختار تمورنا بعناية فائقة لتلبية توقعات عملائنا المميزين وشركائنا التجاريين، موفرين التوازن الأمثل بين الحلاوة الطبيعية والنكهة الغنية والقوام الممتاز والجودة العالية. في مسار، نؤمن بأن التجارة الدولية الناجحة تقوم على الثقة والاتساق والشراكات طويلة الأمد. بدءًا من اختيار المصادر والجودة وصولًا إلى الخدمات اللوجستية والتسليم، نسعى جاهدين لتوفير تجربة سلسة وموثوقة لتجار الجملة والموزعين وتجار التجزئة وشركات الأغذية.",
    detail_tab_ar: "يتم قطف تمورنا الفاخرة بعناية من أفضل المزارع في المملكة العربية السعودية. طبيعية 100% بدون إضافات.",
    ship_tab_ar: "نقدم توصيلاً في جميع أنحاء ماليزيا. تتم معالجة الطلبات خلال 1-3 أيام عمل.",
    stor_tab_ar: "يُحفظ في مكان بارد وجاف بعيداً عن أشعة الشمس المباشرة. يُبرد بعد الفتح.",
    ret_tab_ar: "نريدك أن تكون راضياً تماماً. إذا تلقيت منتجاً تالفاً، اتصل بنا خلال 48 ساعة.",
    contact_location_ar: "2-3 Jalan SP 2/8, Serdang Seksyen 2, 43300 Seri Kembangan, Selangor, Malaysia"
};

const updateConfig = db.prepare(`
    UPDATE site_config
    SET value = ?
    WHERE key = ?
`);

const insertConfig = db.prepare(`
    INSERT OR IGNORE INTO site_config (key, value)
    VALUES (?, ?)
`);

for (const [key, value] of Object.entries(siteConfig)) {
    updateConfig.run(value, key);
    insertConfig.run(key, value);
}

console.log("SITE ARABIC DATA FIXED");

// ==================== PRODUCTS ====================

const products = {
    ajwa: {
        name_ar: "تمر عجوة فاخر – المدينة المنورة",
        desc_ar: "تمر العجوة الثمين من المدينة المنورة، المعروف بلونه الداكن ونكهته الحلوة والناعمة المميزة.",
        texture_ar: "ناعم ومطاطي",
        taste_ar: "غني وحلو",
        badge_ar: "الأكثر مبيعاً"
    },

    safawi: {
        name_ar: "تمر صفاوي فاخر",
        desc_ar: "تمر شبه جاف بمظهر داكن وطعم حلو معتدل وقوام مطاطي لذيذ.",
        texture_ar: "شبه جاف ومطاطي",
        taste_ar: "حلو معتدل",
        badge_ar: "رائج"
    },

    sukkari: {
        name_ar: "تمر سكري فاخر",
        desc_ar: "يُعرف بالتمر الملكي، ويتميز بحلاوة تشبه الكراميل وقشرة ذهبية رقيقة ولب ناعم.",
        texture_ar: "ناعم ورقيق",
        taste_ar: "بطعم الكراميل",
        badge_ar: "فاخر"
    },

    medjool: {
        name_ar: "تمر مجدول فاخر",
        desc_ar: "ملك التمور – كبير الحجم وممتلئ وحلو للغاية مع نكهة كراميل غنية.",
        texture_ar: "ناعم وممتلئ",
        taste_ar: "كراميل غني",
        badge_ar: "ملك التمور"
    },

    mariami: {
        name_ar: "تمر مريمي فاخر",
        desc_ar: "تمر شبه جاف فاخر بقشرة مجعدة وحلاوة متوازنة ولمسة مميزة من نكهة المكسرات.",
        texture_ar: "شبه جاف ومتماسك",
        taste_ar: "متوازن وجوزي",
        badge_ar: "نادر"
    },

    "premium-black-seed-oil": {
        name_ar: "زيت حبة البركة الفاخر",
        desc_ar: "زيت حبة البركة الفاخر المعصور على البارد، يتميز برائحته الطبيعية الغنية وقوامه الناعم وجودته العالية.",
        texture_ar: "ناعم وطبيعي",
        badge_ar: "زيت فاخر"
    },

    "premium-sidr-honey": {
        name_ar: "عسل سدر فاخر",
        desc_ar: "عسل سدر فاخر ونقي بلونه الذهبي الغني، ومذاقه الحلو الطبيعي، ورائحته الزهرية المميزة.",
        texture_ar: "ناعم وغني",
        badge_ar: "عسل فاخر"
    }
};

const updateProduct = db.prepare(`
    UPDATE products
    SET
        name_ar = ?,
        desc_ar = ?,
        texture_ar = ?,
        taste_ar = ?,
        badge_ar = ?
    WHERE slug = ?
`);

for (const [slug, data] of Object.entries(products)) {
    updateProduct.run(
        data.name_ar,
        data.desc_ar,
        data.texture_ar || null,
        data.taste_ar || null,
        data.badge_ar,
        slug
    );

    console.log("FIXED PRODUCT:", slug);
}

// ==================== CATEGORIES ====================

const categories = {
    dates: "التمور",
    oils: "الزيوت",
    nuts: "المكسرات",
    honey: "العسل",
    "gift-boxes": "علب الهدايا"
};

const updateCategory = db.prepare(`
    UPDATE product_categories
    SET name_ar = ?
    WHERE slug = ?
`);

for (const [slug, name] of Object.entries(categories)) {
    updateCategory.run(name, slug);
    console.log("FIXED CATEGORY:", slug);
}

// ==================== VERIFY ====================

console.log("\nVERIFYING ARABIC DATA...\n");

const result = db.prepare(`
    SELECT slug, name_ar, desc_ar, texture_ar, taste_ar, badge_ar
    FROM products
    ORDER BY id
`).all();

for (const product of result) {
    console.log(product);
}

console.log("\nArabic data repair completed successfully.");
// ============================================================
// FIX BLOG ARABIC DATA
// ============================================================

console.log("Starting blog Arabic data repair...");

const blogPosts = {
    "ajwa-dates-al-madinah": {
        title_ar: "تمر العجوة من المدينة المنورة: ما الذي يميزه؟",
        excerpt_ar: "اكتشف سر تمر العجوة المبارك من بساتين المدينة المنورة، وفوائده الصحية وقيمته التاريخية.",
        content_ar: "<p>يعتبر تمر العجوة من أرقى وأثمن أنواع التمور السعودية، وله مكانة خاصة في التراث الإسلامي. يتميز بحبته الداكنة ذات الخطوط الدقيقة وملمسه الناعم وحلاوته المتوازنة غير المفرطة.</p><p>تُزرع العجوة في المدينة المنورة المباركة تحت رعاية خاصة لضمان الحصول على أعلى درجات الجودة والنضارة الغنية بالمعادن والألياف الطبيعية.</p>"
    },

    "guide-choosing-saudi-dates": {
        title_ar: "دليل اختيار التمور السعودية المناسبة",
        excerpt_ar: "كيف تختار نوع التمر المناسب لذوقك واحتياجك اليومي من بين أشهر التمور السعودية؟",
        content_ar: "<p>تتنوع التمور السعودية في درجات الحلاوة والقوام والرطوبة. إذا كنت تفضل التمور اللينة ذات الحلاوة الكراميلية الفاخرة فإن السكري هو خيارك الأنسب، بينما يتميز الصفاوي بقوامه شبه الجاف وحلاوته الخفيفة.</p><p>في MASSAR DATES نحرص على فرز التمور بدقة فائقة لنضمن لك تجربة تذوق استثنائية في كل صنف.</p>"
    },

    "how-to-keep-dates-fresh": {
        title_ar: "كيف تحافظ على التمور طازجة؟",
        excerpt_ar: "طرق ونصائح عملية لحفظ التمور لفترات طويلة مع الحفاظ على طعمها ورطوبتها الأصلية.",
        excerpt_ms: "Tips penting penyimpanan untuk memastikan kurma anda kekal segar, lembut dan berkualiti.",
        content_ar: "<p>للحفاظ على جودة التمر، يُنصح بتخزينه في وعاء محكم الإغلاق في مكان بارد وجاف. للاستخدام اليومي تكفي درجة حرارة الغرفة المعتدلة، بينما يُفضل وضع التمور الرطبة مثل السكري في الثلاجة للحفاظ على نضارتها.</p>"
    },

    "ajwa-vs-safawi-vs-sukkari-vs-medjool": {
        title_ar: "الفرق بين العجوة والصفاوي والسكري والمجدول",
        excerpt_ar: "مقارنة شاملة بين أشهر أربعة أصناف من التمور من حيث الشكل والقوام والنكهة.",
        content_ar: "<p>تختلف أصناف التمور في مواصفاتها: العجوة داكنة وقوامها ناعم، والصفاوي أطول وشبه جاف مع حلاوة معتدلة، والسكري ذهبي ناصع ومحبب لعشاق الحلاوة، والمجدول ممتلئ وكبير الحجم بمذاق كراميلي عميق.</p>"
    },

    "from-saudi-farms-to-your-home": {
        title_ar: "من مزارع السعودية إلى منزلك",
        excerpt_ar: "رحلة قطف واختيار تمور MASSAR DATES بأعلى معايير الجودة حتى وصولها إليك.",
        content_ar: "<p>نحرص في MASSAR DATES على اختيار محاصيلنا مباشرة من نخيل القصيم والمدينة المنورة، لنضمن حصولك على منتج طبيعي 100% بدون أي إضافات صناعية أو سكريات مضافة.</p>"
    }
};

const updateBlog = db.prepare(`
    UPDATE blog_posts
    SET title_ar = ?,
        excerpt_ar = ?,
        content_ar = ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE slug LIKE ?
`);

for (const [slug, data] of Object.entries(blogPosts)) {
    updateBlog.run(
        data.title_ar,
        data.excerpt_ar,
        data.content_ar,
        `%${slug}%`
    );

    console.log("FIXED BLOG:", slug);
}

console.log("Blog Arabic data repair completed.");
db.close();
