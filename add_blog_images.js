const fs = require('fs');
const path = require('path');
const https = require('https');
const db = require('./database');

const folder = path.join(__dirname, 'public', 'uploads', 'blog');

const images = [
    {
        slug: 'ajwa-dates-al-madinah',
        file: 'ajwa-dates.jpg',
        source: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Ajwa_dates.JPG'
    },
    {
        slug: 'guide-choosing-saudi-dates',
        file: 'sukkari-dates.jpg',
        source: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Sukkary_date.jpg'
    },
    {
        slug: 'how-to-keep-dates-fresh',
        file: 'dates-fresh.jpg',
        source: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Dried_date.jpg'
    },
    {
        slug: 'ajwa-vs-safawi-vs-sukkari-vs-medjool',
        file: 'safawi-dates.jpg',
        source: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Saudi_Safawi_date_variety.jpg'
    },
    {
        slug: 'from-saudi-farms-to-your-home',
        file: 'saudi-date-farm.jpg',
        source: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Date_palm_with_fruits.jpg'
    },
    {
        slug: 'al-madinah-date-heritage',
        file: 'madinah-date-market.jpg',
        source: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Medina_dates_market.JPG'
    },
    {
        slug: 'dates-and-natural-nutrition',
        file: 'dates-nutrition.jpg',
        source: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Ripe_Dates.jpg'
    },
    {
        slug: 'arabic-coffee-and-dates',
        file: 'arabic-coffee-dates.jpg',
        source: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Arabic_coffee_with_dates.jpg'
    },
    {
        slug: 'date-and-nut-energy-bites',
        file: 'date-balls.jpg',
        source: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Date_balls.jpg'
    },
    {
        slug: 'why-premium-date-origin-matters',
        file: 'unaizah-palm-farm.jpg',
        source: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Palm_Trees_in_Unaizah.jpg'
    },
    {
        slug: 'massar-dates-quality-commitment',
        file: 'boxed-dates.jpg',
        source: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Boxed_Dates.jpg'
    }
];

function download(url, destination) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(destination);

        https.get(url, { headers: { 'User-Agent': 'MASSAR-DATES-Blog/1.0' } }, response => {
            if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
                file.close();
                try { fs.unlinkSync(destination); } catch {}
                return download(response.headers.location, destination).then(resolve).catch(reject);
            }

            if (response.statusCode !== 200) {
                file.close();
                try { fs.unlinkSync(destination); } catch {}
                return reject(new Error(`HTTP ${response.statusCode}`));
            }

            response.pipe(file);

            file.on('finish', () => {
                file.close(resolve);
            });

            file.on('error', reject);
        }).on('error', err => {
            file.close();
            try { fs.unlinkSync(destination); } catch {}
            reject(err);
        });
    });
}

async function main() {
    for (const item of images) {
        const output = path.join(folder, item.file);

        try {
            console.log(`Downloading: ${item.file}`);
            await download(item.source, output);

            const url = `/uploads/blog/${item.file}`;

            db.prepare(`
                UPDATE blog_posts
                SET image_url = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE slug = ?
            `).run(url, item.slug);

            console.log(`OK: ${item.slug} -> ${url}`);
        } catch (err) {
            console.error(`FAILED: ${item.slug}`, err.message);
        }
    }

    const rows = db.prepare(`
        SELECT id, slug, image_url
        FROM blog_posts
        ORDER BY id
    `).all();

    console.log('\nBLOG IMAGES:');
    console.table(rows);

    db.close();
}

main().catch(err => {
    console.error(err);
    try { db.close(); } catch {}
    process.exit(1);
});
