�const fs = require('fs');
const path = require('path');

const serverFile = path.join(process.cwd(), 'server.js');
let code = fs.readFileSync(serverFile, 'utf8');

// 1. *5DJ- 'D371 'DEC3H1 523 FG'&J'K
code = code.replace(
    /<p><strong>[^<]*<\/strong>\s*<a href="mailto:\s*['"]?khwlah7712@gmail\.com['"]?">\s*'\s*\+\s*email\s*\+\s*'<\/a><\/p>'/g,
    '<p><strong>=� 'D(1J/ 'D%DC*1HFJ:</strong> <a href="mailto:\' + email + \'">\' + email + \'</a></p>\''
);

// *5DJ- #J (B'J' C31 AJ 371 'D%JEJD
code = code.replace(
    /href="mailto:\s*'khwlah7712@gmail\.com'">'\s*\+\s*email/g,
    'href="mailto:\' + email + \'">\' + email'
);

// 2. *F8JA 4'ED D#J -1HA E4HG) /'.D server.js
code = code.replace(/ا�إ�ْتر��� �`/g, ''D%DC*1HFJ');
code = code.replace(/=�/g, '=�');
code = code.replace(/=�/g, '=�');
code = code.replace(/=�/g, '=�');
code = code.replace(/=�/g, '=�');
code = code.replace(/رسا�ة �&� /g, '13'D) EF');
code = code.replace(/ا�بر�`د/g, ''D(1J/');
code = code.replace(/ا�رسا�ة/g, ''D13'D)');

fs.writeFileSync(serverFile, code, 'utf8');
console.log(" *E %5D'- CH/ server.js H*5-J- 'D.7# (F,'-!");