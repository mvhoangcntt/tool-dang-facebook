const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');

// Sidebar
html = html.replace(/<a href="#" class="nav-item active" data-target="view-schedule">.*<\/a>/, '<a href="#" class="nav-item active" data-target="view-schedule">Lên Lịch Đăng</a>');
html = html.replace(/<a href="#" class="nav-item" data-target="view-profiles">.*<\/a>/, '<a href="#" class="nav-item" data-target="view-profiles">Quản Lý Profile</a>');
html = html.replace(/<a href="#" class="nav-item" data-target="view-settings">.*<\/a>/, '<a href="#" class="nav-item" data-target="view-settings">Cài Đặt Tương Tác</a>');

html = html.replace(/<span class="dot pulse-green"><\/span>\s*H\S*\s*th\S*ng s\S*n s\S*ng/, '<span class="dot pulse-green"></span> Hệ thống sẵn sàng');
html = html.replace(/<button id="btn-start-engine" class="btn btn-primary pulse-btn">.*<\/button>/, '<button id="btn-start-engine" class="btn btn-primary pulse-btn">BẮT ĐẦU CHẠY AUTO</button>');

// Schedule tab
html = html.replace(/<!-- View: L\S+n l\S+ch\s+ng -->/, '<!-- View: Lên lịch đăng -->');
html = html.replace(/<h2 class="card-title">1\. Nh\S+p N\S+i Dung \(Content\)<\/h2>/, '<h2 class="card-title">1. Nhập Nội Dung (Content)</h2>');
html = html.replace(/<button class="tab-btn active" data-tab="paste">D\S+n Text<\/button>/, '<button class="tab-btn active" data-tab="paste">Dán Text</button>');
html = html.replace(/<textarea id="content-paste" placeholder=".*"><\/textarea>/, '<textarea id="content-paste" placeholder="Dán nội dung vào đây. Mỗi bài ngăn cách bằng 2 dòng trống..."></textarea>');
html = html.replace(/<p>K\S+o th\S+ ho\S+c d\S+n file Text \/ Excel v\S+o\s+\S+y<\/p>/, '<p>Kéo thả hoặc dán file Text / Excel vào đây</p>');
html = html.replace(/<span class="file-name" id="content-file-name">.*<\/span>/, '<span class="file-name" id="content-file-name">Chưa chọn file</span>');
html = html.replace(/<button class="btn btn-secondary mt-10" id="btn-parse-content">.*<\/button>/, '<button class="btn btn-secondary mt-10" id="btn-parse-content">Phân Tích Content</button>');

html = html.replace(/<h2 class="card-title">2\. Ch\S+n Video<\/h2>/, '<h2 class="card-title">2. Chọn Video</h2>');
html = html.replace(/<button class="btn btn-outline" id="btn-select-video-dir">.*<\/button>/, '<button class="btn btn-outline" id="btn-select-video-dir">Chọn thư mục Video</button>');
html = html.replace(/<p class="dir-path" id="video-dir-path">.*<\/p>/, '<p class="dir-path" id="video-dir-path">Chưa chọn thư mục</p>');
html = html.replace(/<div class="stat-badge">T\S+m th.*<strong id="video-count">0<\/strong>\s*videos<\/div>/, '<div class="stat-badge">Tìm thấy: <strong id="video-count">0</strong> videos</div>');

// Table list header
html = html.replace(/<h2 class="card-title">Danh s\S+ch b\S+i chu\S+n b\S+ l\S+n s\S+ng<\/h2>/, '<h2 class="card-title">Danh sách bài chuẩn bị lên sóng</h2>');
html = html.replace(/<span class="badge" id="queue-badge">0 B\S+i vi\S+t<\/span>/, '<span class="badge" id="queue-badge">0 Bài viết</span>');

html = html.replace(/<thead>[\s\S]*?<\/thead>/, `<thead>
                            <tr>
                                <th width="5%">STT</th>
                                <th width="15%">Nội Dung</th>
                                <th width="12%">Video</th>
                                <th width="15%">Comment</th>
                                <th width="15%">Link Đăng</th>
                                <th width="14%">Thời Gian</th>
                                <th width="14%">Trạng Thái Auto</th>
                                <th width="10%">Thao Tác</th>
                            </tr>
                        </thead>`);

html = html.replace(/<td colspan="7">.*<\/td>/, '<td colspan="7">Chưa có dữ liệu. Hãy nhập Content, chọn Thư mục Video và Bấm Tạo Lịch.</td>');

// Settings block
html = html.replace(/<h2 class="card-title">C\S+i\s+\S+t T\S+ng T\S+c D\S+o \(Seeding AI\)<\/h2>/, '<h2 class="card-title">Cài Đặt Tương Tác Dạo (Seeding AI)</h2>');
html = html.replace(/<p style="color: var\(--text-muted\); margin-bottom: 20px; font-size: 0\.95rem;">[\s\S]*?<\/p>/, `<p style="color: var(--text-muted); margin-bottom: 20px; font-size: 0.95rem;">
                        Bot sẽ tự động lướt trang, lọc bài viết theo từ khoá, xem video và dùng AI để bình luận một cách tự nhiên.
                    </p>`);

html = html.replace(/Gemini API Key \(H\S+ tr\S+ nh\S+p nhi\S+u Key tr\S+n nhi\S+u d\S+ng\)/, 'Gemini API Key (Hỗ trợ nhập nhiều Key trên nhiều dòng)');
html = html.replace(/\[=A Hi\S+n \/ \S+n Key\]/, '[👁 Hiển thị / Ẩn Key]');
html = html.replace(/Nh\S+p m\S+i API Key tr\S+n m\S+t d\S+ng...&#10;Key 1...&#10;Key 2.../, 'Nhập mỗi API Key trên một dòng...\\nKey 1...\\nKey 2...');

html = html.replace(/<label>T\S+ kho\S+ l\S+c b\S+i \(C\S+ch nhau b\S+ng d\S+u ph\S+y\)<\/label>/, '<label>Từ khoá lọc bài (Cách nhau bằng dấu phẩy)</label>');
html = html.replace(/placeholder="V\S+ d\S+: th\S+i trang, qu\S+n \S+o, sale, v\S+y,\s+\S+m..."/, 'placeholder="Ví dụ: thời trang, quần áo, sale, váy, đầm..."');

html = html.replace(/<label>Danh s\S+ch Link\s+\S+i T\S+ng T\S+c<\/label>/, '<label>Danh sách Link đi Tương Tác</label>');
html = html.replace(/<label>Th\S+i gian d\S+o 1 trang \(Ph\S+t\)<\/label>/, '<label>Thời gian dạo 1 trang (Phút)</label>');
html = html.replace(/<label>S\S+ b\S+i Random Cmt 1 trang<\/label>/, '<label>Số bài Random Cmt 1 trang</label>');

html = html.replace(/<button id="btn-start-interaction" class="btn btn-primary".*?<\/button>/, '<button id="btn-start-interaction" class="btn btn-primary" style="flex: 1; height: 50px; font-size: 1.1rem;">BẮT ĐẦU TƯƠNG TÁC</button>');
html = html.replace(/<button id="btn-pause-interaction" class="btn btn-secondary hidden" style="flex: 1; height: 50px; font-size: 1.1rem; background: var\(--warning\); color: #000; border: none;">.*<\/button>/, '<button id="btn-pause-interaction" class="btn btn-secondary hidden" style="flex: 1; height: 50px; font-size: 1.1rem; background: var(--warning); color: #000; border: none;">TẠM DỪNG</button>');
html = html.replace(/<button id="btn-stop-interaction" class="btn btn-secondary hidden" style="flex: 1; height: 50px; font-size: 1.1rem; border-color: var\(--danger\); color: var\(--danger\);">.*<\/button>/, '<button id="btn-stop-interaction" class="btn btn-secondary hidden" style="flex: 1; height: 50px; font-size: 1.1rem; border-color: var(--danger); color: var(--danger);">DỪNG HẲN</button>');

html = html.replace(/<h4 style="margin-bottom: 10px; color: var\(--text\);">Ti\S+n\s+\S+\s+T\S+ng t\S+c d\S+o<\/h4>/, '<h4 style="margin-bottom: 10px; color: var(--text);">Tiến độ Tương tác dạo</h4>');

html = html.replace(/X\S+a/, 'Xóa');

fs.writeFileSync('index.html', html, 'utf8');
console.log("Fixed HTML using regex wildcards.");

let renderer = fs.readFileSync('assets/js/renderer.js', 'utf8');
renderer = renderer.replace(/L\S+i\s+\S+\S+c File Excel/g, 'Lỗi Đọc File Excel');
renderer = renderer.replace(/Kh\S+ng th\S+\s+\S+\S+c n\S+i dung Excel/g, 'Không thể đọc nội dung Excel');
renderer = renderer.replace(/Ph\S+n T\S+ch Ho\S+n T\S+t/g, 'Phân Tích Hoàn Tất');
renderer = renderer.replace(/Th\S+nh c\S+ng/g, 'Thành công');
renderer = renderer.replace(/B\S+n\s+\S+\S+ nh\S+p/g, 'Bạn đã nhập');
renderer = renderer.replace(/Vui l\S+ng /g, 'Vui lòng ');
renderer = renderer.replace(/b\S+i vi\S+t/g, 'bài viết');
renderer = renderer.replace(/T\S+o L\S+ch Ho\S+n T\S+t/g, 'Tạo Lịch Hoàn Tất');
renderer = renderer.replace(/Ch\S+a\s+\S+\S+ng/g, 'Chưa đăng');
renderer = renderer.replace(/T\S+m D\S+ng/g, 'Tạm Dừng');
renderer = renderer.replace(/\S+a l\S+n s\S+ng/g, 'Đã lên sóng');
renderer = renderer.replace(/D\S+NG L\S+I/g, 'DỪNG LẠI');
renderer = renderer.replace(/TI\S+P T\S+C/g, 'TIẾP TỤC');
renderer = renderer.replace(/Ch\S+c ch\S+n mu\S+n/g, 'Chắc chắn muốn');
renderer = renderer.replace(/> X\S+a/g, '> Xóa');
fs.writeFileSync('assets/js/renderer.js', renderer, 'utf8');
console.log("Fixed JS using regex wildcards.");
