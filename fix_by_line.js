const fs = require('fs');
let code = fs.readFileSync('assets/js/renderer.js', 'utf8');
let lines = code.split(/\r?\n/);

lines[290] = '        if (!text) return alert(\Vui lòng dán Nội dung (Content) trước!\);';
lines[294] = '        alert(\Đã phân tích và tách thành công \ + contentsList.length + \ bài đăng!\);';
lines[297] = '        if (!fileInput.files.length) return alert(\Vui lòng chọn File chứa Nội dung (Content) trước!\);';
lines[303] = '            alert(\Đã phân tích File TXT và tách thành công \ + contentsList.length + \ bài đăng!\);';
lines[312] = '            alert(\Đã tách File Excel thành công \ + contentsList.length + \ bài đăng!\);';
lines[330] = '            alert(\Lỗi đọc Thư mục Video: \ + videos.error);';
lines[340] = '    if (contentsList.length === 0) return alert(\Chưa có Content! Vui lòng ấn Phân Tích Content.\);';
lines[341] = '    if (videosList.length === 0) return alert(\Chưa có Video! Vui lòng ấn Chọn Thư mục Video.\);';

fs.writeFileSync('assets/js/renderer.js', lines.join('\r\n'));
