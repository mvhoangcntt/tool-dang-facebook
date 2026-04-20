const fs = require('fs');

let h = fs.readFileSync('index.html', 'utf8');

// Reverse the Gemimi API frame
let htmlBlockOld = '<div class=\"input-group\" style=\"grid-column: 1 / -1;\">\n' +
'                            <label>\n' +
'                                Gemini API Key (H? tr? nh?p nhi?u Key trên nhi?u dòng)\n' +
'                                <span id=\"toggle-api-visibility\" style=\"cursor: pointer; color: #007bff; font-size: 13px; margin-left: 10px; font-weight: normal; user-select: none;\">[?? Hi?n / ?n Key]</span>\n' +
'                            </label>\n' +
'                            <textarea id=\"api-gemini-key\" placeholder=\"Nh?p m?i API Key trên m?t dòng...&#10;Key 1...&#10;Key 2...\" rows=\"3\" style=\"width: 100%; font-family: monospace; resize: vertical; -webkit-text-security: disc;\"></textarea>\n' +
'                        </div>\n' +
'\n' +
'                        <div class=\"input-group\" style=\"grid-column: 1 / -1;\">\n' +
'                            <label>T? khoá l?c bài (Cách nhau b?ng d?u ph?y)</label>\n' +
'                            <input type=\"text\" id=\"interaction-keywords\" placeholder=\"Ví d?: th?i trang, qu?n áo, sale, váy, d?m...\" style=\"width: 100%;\">\n' +
'                        </div>\n' +
'\n' +
'                        <div class=\"input-group\" style=\"grid-column: 1 / -1; display: none;\">\n' +
'                            <label>Danh sách Link Ði Tuong Tác</label>\n' +
'                            <textarea id=\"interaction-links\" style=\"height: 10px;\"></textarea>\n' +
'                        </div>';

let htmlBlockNew = '<div class=\"input-group\" style=\"grid-column: 1 / -1;\">\n' +
'                            <label>Gemini API Key</label>\n' +
'                            <input type=\"text\" id=\"api-gemini-key\" placeholder=\"Nh?p API Key ? dây...\" style=\"width: 100%;\">\n' +
'                        </div>\n' +
'\n' +
'                        <div class=\"input-group\" style=\"grid-column: 1 / -1;\">\n' +
'                            <label>T? khoá l?c bài (Cách nhau b?ng d?u ph?y)</label>\n' +
'                            <input type=\"text\" id=\"interaction-keywords\" placeholder=\"Ví d?: th?i trang, qu?n áo, sale, váy, d?m...\" style=\"width: 100%;\">\n' +
'                        </div>\n' +
'\n' +
'                        <div class=\"input-group\" style=\"grid-column: 1 / -1;\">\n' +
'                            <label>Danh sách Link Ði Tuong Tác</label>\n' +
'                            <textarea id=\"interaction-links\" placeholder=\"https://www.facebook.com/group1...\"></textarea>\n' +
'                        </div>';

if (h.indexOf('Gemini API Key (H? tr?') !== -1) {
    let replaced = h.replace(htmlBlockOld, htmlBlockNew);
    if (replaced !== h) {
        h = replaced;
    } else {
        // Fallback robust replace
        h = h.substring(0, h.indexOf('<div class="input-group" style="grid-column: 1 / -1;">')) + htmlBlockNew + h.substring(h.indexOf('</div>', h.indexOf('id="interaction-links"')) + 6);
    }
}

// Strip out the interaction progress grid
let gridOld = '<div style=\"grid-column: 1 / -1; margin-top: 15px;\">\n' +
'                            <span style=\"font-size: 0.9rem; color: var(--text);\">Ti?n d? Tuong tác d?o</span>\n' +
'                            <div id=\"interaction-profile-status-grid\" class=\"mt-10\" style=\"display: flex; flex-wrap: wrap; gap: 5px;\"></div>\n' +
'                        </div>';

h = h.replace(gridOld, '');

fs.writeFileSync('index.html', h, 'utf8');

