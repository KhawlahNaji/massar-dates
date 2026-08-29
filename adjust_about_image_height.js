const fs = require('fs');

let html = fs.readFileSync('public/index.html', 'utf8');

// ستايل احترافي يضمن محاذاة طول الصورة مع طول النص تماماً
const perfectAlignmentStyle = `
<style id="about-image-perfect-alignment">
/* جعل حاوية قسم من نحن متساوية الطول بين الصورة والنص */
.about-grid, 
.brandstory-grid, 
.story-grid, 
[class*="about"][class*="grid"], 
section#about .container > div,
section[id*="brandstory"] .container > div {
    display: grid !important;
    grid-template-columns: 1fr 1fr;
    align-items: stretch !important; /* هذا السطر يجبر الطرفين على التساوي في الطول */
    gap: 40px !important;
}

/* ضبط حاوية الصورة لتأخذ 100% من طول النص المقابل */
.about-image, 
.about-img, 
.about-image-wrap, 
.story-image, 
[class*="about-image"], 
[class*="about-img"],
[class*="story-image"] {
    height: 100% !important;
    min-height: 100% !important;
    display: flex !important;
    flex-direction: column !important;
}

/* ضبط الصورة نفسها لتملأ الطول بالكامل بدون تمطيط أو تشويه */
.about-image img, 
.about-img img, 
.about-image-wrap img, 
.story-image img, 
[class*="about-image"] img, 
[class*="about-img"] img,
[class*="story-image"] img {
    width: 100% !important;
    height: 100% !important;
    min-height: 100% !important;
    max-height: 100% !important;
    object-fit: cover !important; /* يحافظ على جودة وأبعاد الصورة */
    object-position: center !important;
    border-radius: 16px !important;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08) !important;
}

/* تجاوب مثالي مع شاشات الجوال */
@media (max-width: 900px) {
    .about-grid, 
    .brandstory-grid, 
    .story-grid, 
    [class*="about"][class*="grid"],
    section#about .container > div,
    section[id*="brandstory"] .container > div {
        grid-template-columns: 1fr !important;
    }
    
    .about-image img, 
    .about-image-wrap img, 
    [class*="about-image"] img {
        height: 360px !important;
        min-height: 360px !important;
    }
}
</style>
`;

// إزالة أي ستايل سابق وحقن الستايل الجديد
html = html.replace(/<style id="about-image-perfect-alignment">[\s\S]*?<\/style>/gi, '');
html = html.replace('</head>', perfectAlignmentStyle + '\n</head>');

fs.writeFileSync('public/index.html', html, 'utf8');
console.log('✅ تم ضبط مقاس ومحاذاة صورة About Us بطول النص بنجاح تام!');
