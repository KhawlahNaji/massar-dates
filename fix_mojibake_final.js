�const fs = require('fs');
const path = require('path');

// /'D) 0CJ) D%1,'9 'DF5H5 'DE4HG) D#5DG' 'D91(J
function fixMojibakeString(str) {
    try {
        return Buffer.from(str, 'latin1').toString('utf8');
    } catch (e) {
        return str;
    }
}

function processDirectory(dir) {
    const files = fs.readdirSync(dir);

    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (file === 'node_modules' || file === '.git' || file === 'uploads') continue;

        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            processDirectory(fullPath);
        } else if (/\.(js|html|json)$/i.test(file)) {
            let content = fs.readFileSync(fullPath, 'utf8');

            // %0' H,/F' 1EH2 'DEHQ,J('CJ 'DE4GH1)
            if (content.includes('�x') || content.includes('رسا�ة') || content.includes('=� 'D(1J/:') || content.includes('=� 'D13'D):')) {
                
                // '3*(/'D E('41 HE6EHF DDF5H5 'DE4HG)
                content = content
                    .split('=� 13'D) EF').join('=� 13'D) EF')
                    .split('=� 'D(1J/').join('=� 'D(1J/')
                    .split('=� 'D13'D)').join('=� 'D13'D)')
                    .split('=� 'DG'*A').join('=� 'DG'*A')
                    .split('=� 'D7D(').join('=� 'D7D(')
                    .split('13'D) EF:').join('13'D) EF:')
                    .split(''D(1J/:').join(''D(1J/:')
                    .split(''D13'D):').join(''D13'D):');

                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(` *E %5D'- H*5-J- 'DB'D( AJ 'DEDA: ${file}`);
            }
        }
    }
}

console.log("= ,'1J A-5 ,EJ9 'DE,D/'* H'DEDA'*...");
processDirectory(process.cwd());
console.log(" *E 'D'F*G'! (F,'-!");
