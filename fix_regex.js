const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// The replacement character in text is UFFFD. We can use . to match it.
html = html.replace(/<a href="#" class="nav-item active" data-target="view-schedule">L.n L.ch\s+.ng<\/a>/, '<a href="#" class="nav-item active" data-target="view-schedule">Lên Lịch Đăng</a>');
html = html.replace(/<a href="#" class="nav-item" data-target="view-profiles">Qu.n L. Profile<\/a>/, '<a href="#" class="nav-item" data-target="view-profiles">Quản Lý Profile</a>');
html = html.replace(/<a href="#" class="nav-item" data-target="view-settings">C.i\s+.t T..ng T.c<\/a>/, '<a href="#" class="nav-item" data-target="view-settings">Cài Đặt Tương Tác</a>');

html = html.replace(/H.\s+th.ng s.n s.ng/, 'Hệ thống sẵn sàng');
html = html.replace(/B.T\s+.U CH.Y AUTO/, 'BẮT ĐẦU CHẠY AUTO');

html = html.replace(/<!-- View: L.n l.ch   ng -->/, '<!-- View: Lên Lịch Đăng -->');

html = html.replace(/3\.\s+C.u h.nh th.i gian   ng/g, '3. Cấu hình thời gian đăng');
html = html.replace(/S. b.i   ng \/ Ng.y/g, 'Số bài đăng / Ngày');
html = html.replace(/Gi.\s+.ng m.c B.i 2/g, 'Giờ đăng gốc Bài 2');
html = html.replace(/Gi.\s+.ng m.c/g, 'Giờ đăng mốc');
html = html.replace(/Random l.ch gi.\s+trong ph.m vi 1 ti.ng/g, 'Random lệch giờ trong phạm vi 1 tiếng');

html = html.replace(/4\.\s+Comment b.i\s+.ng/g, '4. Comment bài đăng');
html = html.replace(/Nh.p comment sau khi\s+.ng \(M.i b.i t..ng .ng 1 d.ng\)\.\.\./g, 'Nhập comment sau khi đăng (Mỗi bài tương ứng 1 dòng)...');
html = html.replace(/G.n L.ch & Gh.p Video/g, 'Gán Lịch & Ghép Video');

html = html.replace(/Qu.n L.\s+.a Profile & N.i\s+.ng/g, 'Quản Lý Đa Profile & Nơi Đăng');
html = html.replace(/T.o nhi.u Profile .o\s+. \s+ch.a phi.n\s+.ng nh.p\. M.i Profile s.\s+..c g.n v.i m.t danh s.ch c.c Fanpage\/Group\s+.ch\. H.\s+th.ng s. t.\s+.ng gh.p content v.\s+ch.y l.n l..t t. Profile n.y sang Profile kh.c./g, 'Tạo nhiều Profile ảo để chứa phiên đăng nhập. Mỗi Profile sẽ được gán với một danh sách các Fanpage/Group đích. Hệ thống sẽ tự động ghép content và chạy lần lượt từ Profile này sang Profile khác.');
html = html.replace(/Th.m Profile M.i/g, 'Thêm Profile Mới');
html = html.replace(/T.n Th. M.c Profile \(Vd: Profile_1, Nick_Chinh,\.\.\.\)/g, 'Tên Thư Mục Profile (Vd: Profile_1, Nick_Chinh,...)');
html = html.replace(/T.n Profile vi.t li.n kh.ng d.u\.\.\./g, 'Tên Profile viết liền không dấu...');
html = html.replace(/M. Tr.nh Duy.t\s+. \s+.ng Nh.p/g, 'Mở Trình Duyệt Để Đăng Nhập');
html = html.replace(/Danh S.ch N.i\s+.ng c.a Profile n.y \(Fanpage\/Group\)/g, 'Danh Sách Nơi Đăng của Profile này (Fanpage/Group)');
html = html.replace(/M.i d.ng 1 link URL\. C. L.n l.ch\s+.ng Video v. T..ng t.c d.o AI\s+.u s.\s+ch.y qua danh s.ch n.y./g, 'Mỗi dòng 1 link URL. Cả Lên lịch đăng Video và Tương tác dạo AI đều sẽ chạy qua danh sách này.');
html = html.replace(/H.y S.a/g, 'Hủy Sửa');
html = html.replace(/L.u L.i Profile/g, 'Lưu Lại Profile');

fs.writeFileSync('index.html', html, 'utf8');

let js = fs.readFileSync('assets/js/renderer.js', 'utf8');
js = js.replace(/L.i\s+..c File Excel/g, 'Lỗi Đọc File Excel');
js = js.replace(/Kh.ng th.\s+..c n.i dung Excel/g, 'Không thể đọc nội dung Excel');
js = js.replace(/Ph.n T.ch Ho.n T.t/g, 'Phân Tích Hoàn Tất');
js = js.replace(/Th.nh c.ng/g, 'Thành công');
js = js.replace(/B.n\s+.. nh.p/g, 'Bạn đã nhập');
js = js.replace(/Vui l.ng d.n/g, 'Vui lòng dán');
js = js.replace(/b.i vi.t/g, 'bài viết');
js = js.replace(/Vui l.ng ch.n th. m.c Video./g, 'Vui lòng chọn thư mục Video.');
js = js.replace(/T.o L.ch Ho.n T.t/g, 'Tạo Lịch Hoàn Tất');
js = js.replace(/Ch.a\s+..ng/g, 'Chưa đăng');
js = js.replace(/T.m D.ng/g, 'Tạm Dừng');
js = js.replace(/.a l.n s.ng/g, 'Đã lên sóng');
js = js.replace(/D.NG L.I/g, 'DỪNG LẠI');
js = js.replace(/TI.P T.C/g, 'TIẾP TỤC');
js = js.replace(/Ch.c ch.n mu.n/g, 'Chắc chắn muốn');
js = js.replace(/X.a/g, 'Xóa');
fs.writeFileSync('assets/js/renderer.js', js, 'utf8');
console.log("Replaced with regex . wildcards");
