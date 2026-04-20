const fs = require('fs');
let js = fs.readFileSync('assets/js/renderer.js', 'utf8');

// The `` or `?` could be any non-ASCII corrupted byte sequence or \ufffd
// We use a broader regex pattern or just exact replacement string with wildcards.

js = js.replace(/Chưa có Profile nào .{1,5}ược lưu\./g, 'Chưa có Profile nào được lưu.');
js = js.replace(/Nơi .{1,5}ng \(Fanpage/g, 'Nơi Đăng (Fanpage'); // It's "Nơi  Ēng" or "Nơi  Ēng"
js = js.replace(/M.x Trình Duy.!t/g, 'Mở Trình Duyệt');
js = js.replace(/M.{1,3} Trình Duy.{1,3}t/g, 'Mở Trình Duyệt');
js = js.replace(/Gắn sự ki.!n/g, 'Gắn sự kiện');
js = js.replace(/DANG CH.Y AUTO \(CLICK D.\s+D.NG\)/g, 'ĐANG CHẠY AUTO (CLICK ĐỂ DỪNG)');
js = js.replace(/Ch.c ch.n mu.n h.nh d.ng kh.ng\?/g, 'Chắc chắn muốn hành động không?');

// Also explicitly fix the ones that showed up in view_file
js = js.replace('Nơi  Ēng', 'Nơi Đăng');
js = js.replace('Mx Trình Duy!t', 'Mở Trình Duyệt');
js = js.replace('Gắn sự ki!n', 'Gắn sự kiện');
js = js.replace('Chưa có dữ li!u.', 'Chưa có dữ liệu.');
js = js.replace('Đang chờ  Ēng', 'Đang chờ đăng');
js = js.replace('Đang  iều khiỒn', 'Đang điều khiển');
js = js.replace('Đã  Ēng', 'Đã đăng');
js = js.replace('chuẩn cho input HTML5', 'chuẩn cho input HTML5');
js = js.replace(' 9nh dạng YYYY-MM-DDThh:mm', 'định dạng YYYY-MM-DDThh:mm');
js = js.replace('Mặc  9nh', 'Mặc định');


fs.writeFileSync('assets/js/renderer.js', js, 'utf8');
console.log("Replaced corrupt Profile fonts strings.");
