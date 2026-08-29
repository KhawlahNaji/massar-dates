window.categoryManagerItems = [];

window.switchCategoryManagerLang = function(lang, btn) {
    ["ar", "en", "ms"].forEach(function(l) {
        const box = document.getElementById("categoryManagerLang-" + l);
        if (box) box.style.display = l === lang ? "block" : "none";
    });

    if (btn && btn.parentNode) {
        btn.parentNode.querySelectorAll(".lang-tab").forEach(function(b) {
            b.classList.remove("active");
        });
        btn.classList.add("active");
    }
};

window.loadCategoryManager = async function() {
    const wrap = document.getElementById("categoryManagerTable");
    if (!wrap) return;

    wrap.innerHTML = "<p>Loading categories...</p>";

    try {
        const res = await fetch("/api/product-categories");
        if (!res.ok) throw new Error("HTTP " + res.status);

        const data = await res.json();

        window.categoryManagerItems =
            Array.isArray(data) ? data : [];

        window.renderCategoryManager();

    } catch (error) {
        console.error("Category manager error:", error);
        wrap.innerHTML =
            "<p style='color:var(--danger)'>Unable to load categories: " +
            error.message + "</p>";
    }
};

window.renderCategoryManager = function() {
    const wrap = document.getElementById("categoryManagerTable");
    if (!wrap) return;

    const items = window.categoryManagerItems;

    if (!items.length) {
        wrap.innerHTML = "<p>No categories found.</p>";
        return;
    }

    wrap.innerHTML = `
        <table class="table">
            <thead>
                <tr>
                    <th>Image</th>
                    <th>Category</th>
                    <th>English</th>
                    <th>العربية</th>
                    <th>Malay</th>
                    <th>Order</th>
                    <th>Status</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${items.map(function(c) {
                    const active = Number(c.active) === 1;

                    return `
                        <tr>
                            <td>
                                ${c.image_url
                                    ? `<img src="${c.image_url}"
                                        style="width:80px;height:55px;object-fit:cover;border-radius:8px;">`
                                    : "No Image"}
                            </td>

                            <td><strong>${c.slug || "-"}</strong></td>

                            <td>${c.name_en || "-"}</td>

                            <td dir="rtl">${c.name_ar || "-"}</td>

                            <td>${c.name_ms || "-"}</td>

                            <td>${c.sort_order ?? 0}</td>

                            <td>
                                ${active
                                    ? '<span style="color:var(--success);font-weight:700;">● Active</span>'
                                    : '<span style="color:var(--danger);font-weight:700;">● Hidden</span>'}
                            </td>

                            <td>
                                <button class="btn"
                                    onclick="editCategoryManager(${Number(c.id)})">
                                    ✏️ Edit
                                </button>

                                <button class="btn"
                                    onclick="toggleCategoryManager(${Number(c.id)})">
                                    ${active ? "🙈 Hide" : "👁️ Show"}
                                </button>

                                <button class="btn"
                                    onclick="deleteCategoryManager(${Number(c.id)})">
                                    🗑️ Delete
                                </button>
                            </td>
                        </tr>
                    `;
                }).join("")}
            </tbody>
        </table>
    `;
};

window.showCategoryManagerForm = function(category) {
    const form = document.getElementById("categoryManagerFormCard");
    if (!form) return;

    form.style.display = "block";

    const set = function(id, value) {
        const el = document.getElementById(id);
        if (el) el.value = value ?? "";
    };

    set("categoryManagerFormTitle",
        category ? "Edit Category" : "Add Category");

    set("categoryManagerEditId",
        category ? category.id : "");

    set("categoryManagerSlug",
        category ? category.slug : "");

    set("categoryManagerSort",
        category ? category.sort_order : 0);

    set("categoryManagerImage",
        category ? category.image_url : "");

    set("categoryManagerNameEn",
        category ? category.name_en : "");

    set("categoryManagerNameAr",
        category ? category.name_ar : "");

    set("categoryManagerNameMs",
        category ? category.name_ms : "");

    set("categoryManagerDescEn",
        category ? category.description_en : "");

    set("categoryManagerDescAr",
        category ? category.description_ar : "");

    set("categoryManagerDescMs",
        category ? category.description_ms : "");

    const active =
        document.getElementById("categoryManagerActive");

    if (active) {
        active.checked =
            category ? Number(category.active) === 1 : true;
    }

    switchCategoryManagerLang("en");
};

window.closeCategoryManagerForm = function() {
    const form =
        document.getElementById("categoryManagerFormCard");

    if (form) form.style.display = "none";
};

window.editCategoryManager = function(id) {
    const category =
        window.categoryManagerItems.find(
            function(c) {
                return Number(c.id) === Number(id);
            }
        );

    if (category) {
        window.showCategoryManagerForm(category);
    }
};

window.saveCategoryManager = async function() {
    const id =
        document.getElementById("categoryManagerEditId").value;

    const body = {
        slug: document.getElementById("categoryManagerSlug").value,
        name_en: document.getElementById("categoryManagerNameEn").value,
        name_ar: document.getElementById("categoryManagerNameAr").value,
        name_ms: document.getElementById("categoryManagerNameMs").value,
        description_en: document.getElementById("categoryManagerDescEn").value,
        description_ar: document.getElementById("categoryManagerDescAr").value,
        description_ms: document.getElementById("categoryManagerDescMs").value,
        image_url: document.getElementById("categoryManagerImage").value,
        sort_order: Number(
            document.getElementById("categoryManagerSort").value
        ) || 0,
        active: document.getElementById("categoryManagerActive").checked
    };

    const url = id
        ? "/api/admin/product-categories/" + id
        : "/api/admin/product-categories";

    const method = id ? "PUT" : "POST";

    try {
        const res = await fetch(url, {
            method: method,
            headers: {
                "Content-Type": "application/json",
                "Authorization":
                    "Bearer " +
                    (localStorage.getItem("massar_admin_token") || "")
            },
            body: JSON.stringify(body)
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.error || "Save failed");
        }

        closeCategoryManagerForm();
        await loadCategoryManager();

        alert(id ? "Category updated" : "Category created");

    } catch (error) {
        console.error(error);
        alert(error.message);
    }
};

window.toggleCategoryManager = async function(id) {
    const category =
        window.categoryManagerItems.find(
            function(c) {
                return Number(c.id) === Number(id);
            }
        );

    if (!category) return;

    try {
        const res = await fetch(
            "/api/admin/product-categories/" + id,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization":
                        "Bearer " +
                        (localStorage.getItem("massar_admin_token") || "")
                },
                body: JSON.stringify({
                    slug: category.slug,
                    name_en: category.name_en,
                    name_ar: category.name_ar,
                    name_ms: category.name_ms,
                    image_url: category.image_url,
                    description_en: category.description_en,
                    description_ar: category.description_ar,
                    description_ms: category.description_ms,
                    sort_order: category.sort_order,
                    active: Number(category.active) !== 1
                })
            }
        );

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.error || "Update failed");
        }

        await loadCategoryManager();

    } catch (error) {
        console.error(error);
        alert(error.message);
    }
};

window.deleteCategoryManager = async function(id) {
    if (!confirm("Delete this category?")) return;

    try {
        const res = await fetch(
            "/api/admin/product-categories/" + id,
            {
                method: "DELETE",
                headers: {
                    "Authorization":
                        "Bearer " +
                        (localStorage.getItem("massar_admin_token") || "")
                }
            }
        );

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.error || "Delete failed");
        }

        await loadCategoryManager();

    } catch (error) {
        console.error(error);
        alert(error.message);
    }
};
