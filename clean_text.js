�const fs = require('fs');
const path = require('path');

function fixMojibake(filePath) {
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf8');

    // *5DJ- 'D1EH2 'DE4HG) 'D4'&9) H*-HJDG' DF5H5 91(J) 3DJE)
    const fixes = [
        { bad: /=�\s*رسا�ة\s*�&� /g, good: '=� 13'D) EF' },
        { bad: /=�\s*=� 'D(1J/:/g, good: '=� 'D(1J/' },
        { bad: /=�\s*=� 'D13'D):/g, good: '=� 'D13'D)' },
        { bad: /=�\s*ا��!ات�/g, good: '=� 'DG'*A' },
        { bad: /=�\s*ا�ط�ب/g, good: '=� 'D7D(' },
        { bad: /رسا�ة\s*جد�`دة/g, good: '13'D) ,/J/)' },
        { bad: /ط�ب\s*جد�`د/g, good: '7D( ,/J/' }
    ];

    let modified = false;
    fixes.forEach(item => {
        if (item.bad.test(content)) {
            content = content.replace(item.bad, item.good);
            modified = true;
        }
    });

    if (modified) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(` *E %5D'- 'DF5H5 'DE4HG) AJ: ${path.basename(filePath)}`);
    }
}

// A-5 ,EJ9 EDA'* 'D3J1A1 H'DE41H9
const files = fs.readdirSync(process.cwd());
files.forEach(file => {
    if (file.endsWith('.js') && file !== 'node_modules') {
        fixMojibake(path.join(process.cwd(), file));
    }
});

console.log(" *E *5DJ- BH'D( 'D13'&D (F,'-!");
