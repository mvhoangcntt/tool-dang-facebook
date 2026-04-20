const fs = require('fs');
let c = fs.readFileSync('assets/js/renderer.js', 'utf8');
const lines = c.split('\n');
const missing = [];
let html = fs.readFileSync('index.html', 'utf8');
lines.forEach((l, i) => {
    let m = l.match(/document\.getElementById\('([^']+)'\)/);
    if(m) {
        if(!html.includes('id=\"' + m[1] + '\"') && !html.includes(\"id='\" + m[1] + \"'\")) {
            missing.push(m[1] + ' at line ' + (i+1));
        }
    }
});
console.log('Missing IDs:', missing);
