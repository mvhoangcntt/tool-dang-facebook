const fs = require('fs');
let code = fs.readFileSync('assets/js/renderer.js', 'utf8');

code = code.replace(/alert\("Th.ng b.*?"\)/g, 'alert("Thành công!")');
code = code.replace(/if \(!text\) return alert\("Thành công!"\)/g, 'if (!text) return alert("Vui lòng dán Nội dung (Content) trước!")');
code = code.replace(/if \(!fileInput.files.length\) return alert\("Thành công!"\)/g, 'if (!fileInput.files.length) return alert("Vui lòng chọn File chứa Nội dung (Content) trước!")');

code = code.replace(/alert\('Thành công!'\);[^]*?\}\s*else\s*\{/g, 'alert("Đã phân tích và tách thành công " + contentsList.length + " bài đăng!");\n    } else {');

code = code.replace(/contentsList = text.split\(\/\\n\\s\\\*\\n\/\)\.filter\(t => t.trim\(\) !== ''\);\s*alert\("Thành công!"\);/g, 'contentsList = text.split(/\\n\\s*\\n/).filter(t => t.trim() !== \\'\\');\\n            alert("Đã phân tích File TXT và tách thành công " + contentsList.length + " bài đăng!");');

code = code.replace(/if \(contentsList.length === 0\) return alert\("Thành công!"\)/g, 'if (contentsList.length === 0) return alert("Chưa có Nội dung nào! Vui lòng ấn nút Phân Tích Content trước.")');
code = code.replace(/if \(videosList.length === 0\) return alert\("Thành công!"\)/g, 'if (videosList.length === 0) return alert("Chưa có Video nào! Vui lòng ấn Chọn thư mục Video trước.")');

fs.writeFileSync('assets/js/renderer.js', code);
