const fs = require('fs');

console.log('1. قراءة وتحديث ملف public/admin.html...');
let admin = fs.readFileSync('public/admin.html', 'utf8');
fs.writeFileSync('public/admin.html.before-blog-fix', admin);

// الكود المطور والآمن لمنع تداخل المقالات نهائياً
const robustBlogFormCode = `
function showNativeBlogForm(post) {
    const form = document.getElementById('blogFormCard');

    if (!form) {
        console.error('blogFormCard not found');
        return;
    }

    form.style.display = 'block';

    // 1. تصفير شامل وفوري لجميع حقول المقال (لمنع تداخل النصوص نهائياً)
    const fieldsToReset = [
        'adminBlogEditId', 'adminBlogSlug', 'adminBlogImg',
        'adminBlogTitleAr', 'adminBlogExcAr',
        'adminBlogTitleEn', 'adminBlogExcEn',
        'adminBlogTitleMs', 'adminBlogExcMs'
    ];
    fieldsToReset.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });

    const contentsToReset = ['adminBlogContAr', 'adminBlogContEn', 'adminBlogContMs'];
    contentsToReset.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.innerHTML = '';
            if (el.contentEditable) el.textContent = '';
        }
    });

    // إعادة تعيين القيم الافتراضية
    if (document.getElementById('adminBlogCategory')) document.getElementById('adminBlogCategory').value = 'news';
    if (document.getElementById('adminBlogSort')) document.getElementById('adminBlogSort').value = 0;

    // 2. تعبئة البيانات الجديدة في حال وجود مقال للتعديل
    if (post) {
        document.getElementById('blogFormCardTitle').textContent = 'Edit Article';
        document.getElementById('adminBlogEditId').value = post.id || '';
        document.getElementById('adminBlogSlug').value = post.slug || '';
        document.getElementById('adminBlogCategory').value = post.category || 'news';
        document.getElementById('adminBlogSort').value = post.sort_order || 0;
        document.getElementById('adminBlogImg').value = post.image_url || '';

        // النصوص العربية
        if (document.getElementById('adminBlogTitleAr')) document.getElementById('adminBlogTitleAr').value = post.title_ar || '';
        if (document.getElementById('adminBlogExcAr')) document.getElementById('adminBlogExcAr').value = post.excerpt_ar || '';
        if (document.getElementById('adminBlogContAr')) document.getElementById('adminBlogContAr').innerHTML = post.content_ar || '';

        // النصوص الإنجليزية
        if (document.getElementById('adminBlogTitleEn')) document.getElementById('adminBlogTitleEn').value = post.title_en || '';
        if (document.getElementById('adminBlogExcEn')) document.getElementById('adminBlogExcEn').value = post.excerpt_en || '';
        if (document.getElementById('adminBlogContEn')) document.getElementById('adminBlogContEn').innerHTML = post.content_en || '';

        // نصوص الملايو
        if (document.getElementById('adminBlogTitleMs')) document.getElementById('adminBlogTitleMs').value = post.title_ms || '';
        if (document.getElementById('adminBlogExcMs')) document.getElementById('adminBlogExcMs').value = post.excerpt_ms || '';
        if (document.getElementById('adminBlogContMs')) document.getElementById('adminBlogContMs').innerHTML = post.content_ms || '';
    } else {
        document.getElementById('blogFormCardTitle').textContent = 'Add New Article';
    }

    // إرجاع تبويب اللغة تلقائياً للغة العربية (ar) لمنع لخبطة محتوى التبويبات المفتوحة
    const firstTab = document.querySelector('#blogFormCard .lang-tab, #blogFormCard .tab-btn');
    if (firstTab && typeof switchBlogLangTab === 'function') {
        switchBlogLangTab('ar', firstTab);
    }
}
`;

// استبدال دالة showNativeBlogForm القديمة بالجديدة المطورة والمضمونة
const startPattern = 'function showNativeBlogForm(post) {';
const endPattern = 'async function saveAdminBlog() {';

const startIndex = admin.indexOf(startPattern);
const endIndex = admin.indexOf(endPattern);

if (startIndex !== -1 && endIndex !== -1) {
    const before = admin.substring(0, startIndex);
    const after = admin.substring(endIndex);
    admin = before + robustBlogFormCode + '\n\n' + after;
    fs.writeFileSync('public/admin.html', admin, 'utf8');
    console.log('✅ SUCCESS: Blog text overlap issue permanently resolved!');
} else {
    console.log('❌ Error: Could not find function boundaries in admin.html.');
}
