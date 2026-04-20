const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');

const replacements = [
    ["Ln L?ch Dang", "Lên Lịch Đăng"],
    ["Qu?n Ly Profile", "Quản Lý Profile"],
    ["Ci D?t Tuong Tc", "Cài Đặt Tương Tác"],
    ["H? th?ng s?n sng", "Hệ thống sẵn sàng"],
    ["B?T D?U CH?Y AUTO", "BẮT ĐẦU CHẠY AUTO"],
    ["Ln lch   ng", "Lên lịch đăng"],
    ["Cu hnh thi gian   ng", "Cấu hình thời gian đăng"],
    ["S bi   ng / Ngy", "Số bài đăng / Ngày"],
    ["Gi   ng mc", "Giờ đăng mốc"],
    ["Gi   ng mc Bi 2", "Giờ đăng mốc Bài 2"],
    ["Random lch gi trong phm vi 1 ting", "Random lệch giờ trong phạm vi 1 tiếng"],
    ["Comment bi   ng", "Comment bài đăng"],
    ["Nhp comment sau khi   ng (Mi bi tng ng 1 dng)...", "Nhập comment sau khi đăng (Mỗi bài tương ứng 1 dòng)..."],
    ["Gn Lch & Ghp Video", "Gán Lịch & Ghép Video"],
    ["Qun L  a Profile & Ni   ng", "Quản Lý Đa Profile & Nơi Đăng"],
    ["To nhiu Profile o   cha phin   ng nhp. Mi Profile s  c gn vi mt danh sch cc Fanpage/Group  ch. H thng s t  ng ghp content v chy ln lt t Profile ny sang Profile khc.", "Tạo nhiều Profile ảo để chứa phiên đăng nhập. Mỗi Profile sẽ được gán với một danh sách các Fanpage/Group đích. Hệ thống sẽ tự động ghép content và chạy lần lượt từ Profile này sang Profile khác."],
    ["Thm Profile Mi", "Thêm Profile Mới"],
    ["Tn Th Mc Profile (Vd: Profile_1, Nick_Chinh,...)", "Tên Thư Mục Profile (Vd: Profile_1, Nick_Chinh,...)"],
    ["Tn Profile vit lin khng du...", "Tên Profile viết liền không dấu..."],
    ["M Trnh Duyt     ng Nhp", "Mở Trình Duyệt Để Đăng Nhập"],
    ["Danh Sch Ni   ng ca Profile ny (Fanpage/Group)", "Danh Sách Nơi Đăng của Profile này (Fanpage/Group)"],
    ["Mi dng 1 link URL. C Ln lch   ng Video v Tng tc do AI  u s chy qua danh sch ny.", "Mỗi dòng 1 link URL. Cả Lên lịch đăng Video và Tương tác dạo AI đều sẽ chạy qua danh sách này."],
    ["Hy Sa", "Hủy Sửa"],
    ["Lu Li Profile", "Lưu Lại Profile"],
];

let counter = 0;
for (const [bad, good] of replacements) {
    if (html.includes(bad)) {
        html = html.replace(new RegExp(bad.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g'), good);
        counter++;
    } else {
        console.log("NOT FOUND:", bad);
    }
}

fs.writeFileSync('index.html', html, 'utf8');
console.log("HTML replaced count:", counter);

