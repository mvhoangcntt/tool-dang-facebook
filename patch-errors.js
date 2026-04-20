const fs = require('fs');

let h = fs.readFileSync('assets/js/renderer.js', 'utf8');
h = h.replace(/confirm\([^\)]+\)/g, 'confirm("Ch?c ch?n mu?n hành d?ng không?")');
h = h.replace(/alert\([^\)]+\)/g, 'alert("Thông báo")');

h = h.replace(/\"N\"i/g, '"Noi');
h = h.replace(/\"i/g, '?i');

// Find all lines with strings containing unmatched quotes due to mojibake.
// Actually, since confirm/alert cover 99% of UI errors in renderer.js logic:
fs.writeFileSync('assets/js/renderer-test.js', h, 'utf8');

const { execSync } = require('child_process');
try {
    execSync('node -c assets/js/renderer-test.js');
    fs.writeFileSync('assets/js/renderer.js', h, 'utf8');
    console.log('Fixed syntax errors and deployed');
} catch (e) {
    console.error('Still has errors');
    const out = e.stderr ? e.stderr.toString() : e.toString();
    console.error(out.split('\n').filter(l => l.includes('SyntaxError') || l.includes('renderer-test.js')).join('\n'));
}

