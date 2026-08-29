const fs = require("fs");
const path = require("path");

function fixMojibake(filePath) {
    if (!fs.existsSync(filePath)) return;
    let raw = fs.readFileSync(filePath, "utf8");
    let fixed = raw
        .replace(/ðŸ“©\s*Ø±Ø³Ø§Ù„Ø©\s*Ù…Ù†/g, "\uD83D\uDCE9 \u0631\u0633\u0627\u0644\u0629 \u0645\u0646")
        .replace(/ðŸ“§\s*اÙ„Ø¨Ø±ÙŠØ¯/g, "\uD83D\uDCE7 \u0627\u0644Ø¨Ø±ÙŠØ¯")
        .replace(/ðŸ’¬\s*اÙ„Ø±Ø³Ø§Ù„Ø©/g, "\uD83D\uDCAC \u0627\u0644\u0631Ø³Ø§Ù„Ø©")
        .replace(/ðŸ“±\s*اÙ„Ù‡Ø§ØªÙ/g, "\uD83D\uDCF1 \u0627Ù„Ù‡Ø§ØªÙ")
        .replace(/الØ¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ/g, "\u0627\u0644Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ")
        .replace(/اÙ„Ø¨Ø±ÙŠØ¯/g, "\u0627Ù„Ø¨Ø±ÙŠØ¯")
        .replace(/اÙ„Ø±Ø³Ø§Ù„Ø©/g, "\u0627Ù„Ø±Ø³Ø§Ù„Ø©")
        .replace(/Ø±Ø³Ø§Ù„Ø©\s*Ù…Ù†/g, "\u0631Ø³Ø§Ù„Ø© \u0645Ù†")
        .replace(/اÙ„Ù‡Ø§ØªÙ/g, "\u0627Ù„Ù‡Ø§ØªÙ")
        .replace(/اÙ„Ø§Ø³Ù…/g, "\u0627Ù„Ø§Ø³Ù…")
        .replace(/\$\{subject\}/g, "${encodeURIComponent(subject)}")
        .replace(/\$\{body\}/g, "${encodeURIComponent(body)}");
    if (fixed !== raw) {
        fs.writeFileSync(filePath, fixed, "utf8");
        console.log("FIXED:", path.basename(filePath));
    }
}

function walk(dir) {
    for (const f of fs.readdirSync(dir)) {
        if (["node_modules", ".git", "uploads"].includes(f)) continue;
        const full = path.join(dir, f);
        if (fs.statSync(full).isDirectory()) {
            walk(full);
        } else if (/\.(js|html)$/i.test(f)) {
            fixMojibake(full);
        }
    }
}

walk(process.cwd());
console.log("All fixed!");