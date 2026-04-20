const fs = require('fs');

const path = 'assets/js/renderer.js';
const lines = fs.readFileSync(path, 'utf8').split('\n');

lines[451] = '        if (item.status === \'WAIT\') statusHtml = `<span class="status-wait">Đang chờ đăng</span>`;';
lines[452] = '        if (item.status === \'PROCESSING\') statusHtml = `<span style="color:var(--primary); font-weight:bold;">Đang điều khiển Bot...</span>`;';
lines[453] = '        if (item.status === \'ERROR\') statusHtml = `<span class="status-error">Quá thời gian (Need Push)</span>`;';
lines[454] = '        if (item.status === \'POSTED\') statusHtml = `<span style="color:var(--success)">Đã đăng thành công</span>`;';
lines[456] = '        // Chuyển timestamp sang định dạng YYYY-MM-DDThh:mm chuẩn cho input HTML5';

fs.writeFileSync(path, lines.join('\n'), 'utf8');
console.log("Fixed status font lines by exact index!");
