const fs = require('fs');
let lines = fs.readFileSync('index.html', 'utf8').split('\n');

lines[67] = '                    <h2 class="card-title mt-20">3. Cấu hình thời gian đăng</h2>';
lines[70] = '                            <label>Số bài đăng / Ngày</label>';
lines[74] = '                            <label>Giờ đăng mốc</label>';
lines[80] = '                            <label>Giờ đăng mốc Bài 2</label>';
lines[86] = '                        <label for="random-time">Random lệch giờ trong phạm vi 1 tiếng</label>';
lines[89] = '                    <h2 class="card-title mt-20">4. Comment bài đăng</h2>';
lines[91] = '                        <textarea id="comment-paste" placeholder="Nhập comment sau khi đăng (Mỗi bài tương ứng 1 dòng)..." style="width: 100%; height: 80px; background: var(--bg-dark); border: 1px solid var(--border); color: var(--text-light); padding: 10px; border-radius: 6px; font-family: inherit; margin-top: 5px; resize: vertical;"></textarea>';
lines[94] = '                    <button class="btn btn-secondary mt-10 w-full" id="btn-generate-schedule">Gán Lịch & Ghép Video</button>';

lines[133] = '                        <h2 class="card-title">Quản Lý Đa Profile & Nơi Đăng</h2>';
lines[135] = '                            Tạo nhiều Profile ảo để chứa phiên đăng nhập. Mỗi Profile sẽ được gán với một danh sách các Fanpage/Group đích. Hệ thống sẽ tự động ghép content và chạy lần lượt từ Profile này sang Profile khác.';
lines[145] = '                        <h3 id="form-profile-title" style="margin-bottom: 15px; color: var(--primary);">Thêm Profile Mới</h3>';
lines[150] = '                                <label>Tên Thư Mục Profile (Vd: Profile_1, Nick_Chinh,...)</label>';
lines[152] = '                                    <input type="text" id="input-profile-name" placeholder="Tên Profile viết liền không dấu..." style="flex: 1;">';
lines[153] = '                                    <button class="btn btn-outline" id="btn-open-profile" style="white-space: nowrap;">Mở Trình Duyệt Để Đăng Nhập</button>';
lines[158] = '                                <label>Danh Sách Nơi Đăng của Profile này (Fanpage/Group)</label>';
lines[159] = '                                <p style="color: var(--text-muted); margin-bottom: 10px; font-size: 0.85rem;">Mỗi dòng 1 link URL. Cả Lên lịch đăng Video và Tương tác dạo AI đều sẽ chạy qua danh sách này.</p>';
lines[164] = '                                <button class="btn btn-secondary hidden" id="btn-cancel-edit-profile">Hủy Sửa</button>';
lines[165] = '                                <button class="btn btn-primary" id="btn-save-profile">Lưu Lại Profile</button>';

fs.writeFileSync('index.html', lines.join('\n'), 'utf8');

// Fixing any remaining ? characters in renderer.js
let js = fs.readFileSync('assets/js/renderer.js', 'utf8');
// Fix 'Ci Dt'
js = js.replace(/C[^\w\s]*i\s+[^\w\s]*t/g, 'Cài Đặt');
// Fix 'Ln lch'
js = js.replace(/L[^\w\s]*n l[^\w\s]*ch/g, 'Lên lịch');
// Fix 'Ln Lch'
js = js.replace(/L[^\w\s]*n L[^\w\s]*ch/g, 'Lên Lịch');
fs.writeFileSync('assets/js/renderer.js', js, 'utf8');

console.log("Fixed via absolute lines");
