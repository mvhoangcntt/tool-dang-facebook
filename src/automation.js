const { chromium } = require('playwright');
const path = require('path');
const os = require('os');
const fs = require('fs');
const { GoogleGenerativeAI } = require("@google/generative-ai");

class FacebookAutoBot {
    constructor() {
        this.browserContext = null;
        this.page = null;

        // Thư mục chứa profile của phần mềm
        this.userDataDir = path.join(os.homedir(), 'AppData', 'Roaming', 'FB_AutoPublisher', 'Profiles');
        if (!fs.existsSync(this.userDataDir)) {
            fs.mkdirSync(this.userDataDir, { recursive: true });
        }

        // --- States for Interaction ---
        this.isPaused = false;
        this.isStopped = false;
    }

    /**
     * Mở trình duyệt độc lập để người dùng tự đăng nhập tay lần đầu.
     * Trạng thái đăng nhập (cookies, local storage) sẽ được lưu vĩnh viễn.
     */
    async openProfile(profileName = 'Default') {
        const profilePath = path.join(this.userDataDir, profileName);

        // Mở trình duyệt có hiển thị UI (headless: false)
        const context = await chromium.launchPersistentContext(profilePath, {
            headless: false,
            viewport: null, // Cho phép tự thích ứng màn hình
            args: ['--disable-blink-features=AutomationControlled', '--start-maximized'] // bypass basic anti-bot & phóng to
        });

        const page = await context.newPage();
        await page.goto('https://www.facebook.com/');

        // Không đóng context để người dùng có thể xài như trình duyệt bình thường
        // Khi họ tự tắt cửa sổ, Playwright sẽ tự dừng
        return true;
    }

    /**
     * Hàm chạy tự động đăng bài
     */
    async postVideo(profileName, targetUrl, content, videoPath, comment, isHeadless = false) {
        const profilePath = path.join(this.userDataDir, profileName);

        try {
            this.browserContext = await chromium.launchPersistentContext(profilePath, {
                headless: isHeadless,
                viewport: null,
                args: ['--disable-blink-features=AutomationControlled', '--start-maximized']
            });
            this.page = await this.browserContext.newPage();

            // 1. Vào trang đích (Fanpage, Group hoặc Trang chủ cá nhân)
            const finalUrl = targetUrl ? targetUrl : 'https://www.facebook.com/';
            await this.page.goto(finalUrl, { waitUntil: 'load' });

            // Chờ 1 chút như người dùng thật
            await this.page.waitForTimeout(3000);

            // Kiểm tra xem đã đăng nhập chưa
            const isLogin = await this.page.locator('input[name="email"]').count() === 0;
            if (!isLogin) {
                console.error("Chưa đăng nhập! Vui lòng dùng nút 'Quản lý Profile' để đăng nhập trước.");
                await this.browserContext.close();
                return false;
            }

            // --- 1.5. KIỂM TRA TƯ CÁCH PAGE VÀ TICK CHUYỂN (SWITCH PROFILE) ---
            await this._switchIdentityRobustly(this.page, 10000); // Chờ tối đa 10s để FB load giao diện Switch Banner

            // 2. Click vào ô đăng bài (Hỗ trợ Profile cá nhân, Fanpage và Group)
            const createPostSelectors = [
                'div[role="button"]:has-text("Bạn đang nghĩ gì")',
                'div[role="button"]:has-text("What\'s on your mind")',
                'div[role="button"]:has-text("Tạo bài viết")',
                'div[role="button"]:has-text("Create Post")',
                'div[role="button"]:has-text("Viết nội dung")',
                'div[aria-label="Tạo bài viết"]',
                'span:text-is("Tạo bài viết")'
            ];

            let createPostBtn = null;
            for (let selector of createPostSelectors) {
                if (await this.page.locator(selector).count() > 0) {
                    createPostBtn = this.page.locator(selector).first();
                    break;
                }
            }

            if (!createPostBtn) {
                console.error("Không tìm thấy nút Tạo Bài Viết ở Link vừa vào.");
                await this.browserContext.close();
                return false;
            }

            await createPostBtn.click();
            await this.page.waitForTimeout(3000);

            // 3. Mở phần đính kèm Hình ảnh / Video bằng Native Javascript (Bypass mọi lớp lưới ảo chặn click của Facebook)
            let clickedMedia = await this.page.evaluate(() => {
                // Quét toàn bộ nút bấm trong DOM
                const buttons = Array.from(document.querySelectorAll('div[role="button"]'));
                for (let b of buttons) {
                    const label = (b.getAttribute('aria-label') || '').toLowerCase();
                    const tooltip = (b.getAttribute('data-tooltip-content') || '').toLowerCase();

                    // Tìm chính xác nút có chữ Ảnh, Video, Photo
                    if (label.includes('video') || label.includes('ảnh') || label.includes('photo') ||
                        tooltip.includes('video') || tooltip.includes('ảnh') || tooltip.includes('photo')) {
                        b.click();
                        return true;
                    }
                }
                return false; // Không tìm thấy
            });

            if (!clickedMedia) {
                // Chiến lược 2: Dùng mỏ neo text nếu mất label hoàn toàn
                clickedMedia = await this.page.evaluate(() => {
                    const spans = Array.from(document.querySelectorAll('span, div'));
                    const anchor = spans.find(s => s.textContent === 'Thêm vào bài viết của bạn' || s.textContent === 'Add to your post');
                    if (anchor) {
                        const wrapper = anchor.parentElement ? anchor.parentElement.parentElement : null;
                        if (wrapper) {
                            const btns = wrapper.querySelectorAll('div[role="button"]');
                            if (btns.length > 0) {
                                btns[0].click(); // Luôn lấy nút đầu tiên (Icon xanh lá)
                                return true;
                            }
                        }
                    }
                    return false;
                });
            }

            // Đợi Facebook xổ ra khung xám (Khung kéo thả hình / Add photos or videos)
            await this.page.waitForTimeout(2000);

            // Bơm File Video vảo thẳng thẻ input hidden của Modal Tạo bài viết
            // Cách này bypass hoàn toàn File Chooser của hệ điều hành, an toàn tuyệt đối với Playwright
            const dialog = this.page.locator('div[role="dialog"]').first();
            const fileInputs = dialog.locator('input[type="file"]');

            if (await fileInputs.count() > 0) {
                await fileInputs.first().setInputFiles(videoPath);
            } else {
                // Dự phòng nếu không nằm trong dialog
                const outerInputs = this.page.locator('input[type="file"][accept*="video"]');
                if (await outerInputs.count() > 0) {
                    await outerInputs.first().setInputFiles(videoPath);
                } else {
                    throw new Error("Tuyệt đối không tìm thấy kẽ hở input upload video nào trên giao diện này.");
                }
            }

            // Chờ tĩnh 10 giây để Facebook render preview của video lên modal trước khi Post
            await this.page.waitForTimeout(10000);

            // 4. Điền nội dung chữ (Content) sau khi đính kèm Video (Chống lỗi xóa Text của React)
            // Lấy textbox cuối cùng
            const textBox = this.page.locator('div[role="textbox"][contenteditable="true"]').last();
            await textBox.focus();
            await this.page.waitForTimeout(500);
            await this.page.keyboard.insertText(content); // Dùng insertText dán văn bản an toàn
            await this.page.waitForTimeout(1000);
            await this.page.keyboard.type(' '); // Gõ phím cứng để bắt ép Facebook lưu nội dung vào nháp
            await this.page.waitForTimeout(3000);

            // 5. Chuỗi click xuyên thấu các nút Đăng / Tiếp của Fanpage
            // Facebook thường hiển thị nút "Tiếp" thay vì "Đăng" ở Fanpage, và đôi khi chèn popup "Thêm nút WhatsApp"
            let hasClickedPost = false;
            for (let step = 0; step < 5; step++) { // Chạy tối đa 5 bước phòng hờ nhiều modal rác
                const btnAction = await this.page.evaluate(() => {
                    // Quét toàn bộ dòng chữ (từ dưới lên trên để lấy nút to nhất dưới đáy)
                    const elements = Array.from(document.querySelectorAll('span, div[dir="auto"], div[role="button"]'));
                    const targetSpan = elements.reverse().find(s => {
                        // Anti-Shadow-DOM: Bỏ qua các nút tàng hình (do React ẩn đi chưa xóa hẳn)
                        if (s.offsetWidth === 0 || s.offsetHeight === 0) return false;

                        const t = (s.textContent || '').trim().toLowerCase();
                        // Trực chờ các nút chức năng tiến lên, hoặc nút Từ chối quảng cáo
                        return t === 'tiếp' || t === 'next' || t === 'đăng' || t === 'post' ||
                            t === 'lúc khác' || t === 'not now' || t === 'để sau' || t === 'later';
                    });

                    if (targetSpan) {
                        // Rà ngược lên xem nó có nằm trong thẻ button nào không
                        let curr = targetSpan;
                        for (let i = 0; i < 5; i++) {
                            if (curr && curr.getAttribute && curr.getAttribute('role') === 'button') {
                                curr.click();
                                return (targetSpan.textContent || '').trim().toLowerCase();
                            }
                            if (curr) curr = curr.parentElement;
                        }
                        // Nếu không có role button bọc ngoài, click thẳng vào dòng chữ
                        targetSpan.click();
                        return (targetSpan.textContent || '').trim().toLowerCase();
                    }
                    return null;
                });

                if (btnAction === 'đăng' || btnAction === 'post') {
                    console.log("Đã click nút: " + btnAction);
                    hasClickedPost = true;
                    // Chờ Facebook 4 giây, xem nó có bật Popup "Thêm nút WhatsApp" để phá đám không
                    await new Promise(r => setTimeout(r, 4000));
                } else if (btnAction === 'tiếp' || btnAction === 'next' ||
                    btnAction === 'lúc khác' || btnAction === 'not now' ||
                    btnAction === 'để sau' || btnAction === 'later') {
                    console.log("Đã vượt qua lớp bảo vệ: " + btnAction);
                    // Đợi giao diện trượt / đóng cửa sổ popup
                    await new Promise(r => setTimeout(r, 4000));
                    if (hasClickedPost) {
                        break; // Nếu đã ấn đăng lần 1 mà có rác mọc ra, gạt rác xong là xong phim.
                    }
                } else {
                    console.log("Không tìm thấy gì cản đường trên giao diện.");
                    break;
                }
            }

            // 6. Treo Trình Duyệt để đợi Facebook Upload Video (CỰC KỲ QUAN TRỌNG)
            console.log("Đã chốt Đăng, đang neo trình duyệt đợi Facebook Upload ngầm...");
            let waitingUpload = true;
            let checks = 0;

            // Đợi tối thiểu 15 giây cho lệnh Upload bắt đầu bung băng thông
            await this.page.waitForTimeout(15000);

            // Vòng lặp neo mạng (tối đa 5 phút) tránh bị đứt gánh
            while (waitingUpload && checks < 60) {
                checks++;
                await this.page.waitForTimeout(5000);

                waitingUpload = await this.page.evaluate(() => {
                    const html = document.body.innerText.toLowerCase();
                    // Nếu hệ thống đang hiện Popup / Toast báo "Đang xử lý" / "Posting" góc dưới
                    if (html.includes('đang đăng') || html.includes('đang xử lý') ||
                        html.includes('posting') || html.includes('processing')) {
                        return true;
                    }

                    const dialogs = document.querySelectorAll('div[role="dialog"]');
                    for (let d of dialogs) {
                        const dText = d.innerText.toLowerCase();
                        if (dText.includes('đang đăng') || dText.includes('posting')) {
                            return true;
                        }
                    }
                    return false; // Mọi thứ đã im ắng, quá trình Upload đã xong
                });
            }

            // --- 6.5 DỌN DẸP LƯỚI BẢO VỆ CUỐI CÙNG ---
            // Nếu có hộp dialog rác, ta ép dọn bằng ESC. Nhưng vì Lệnh chuẩn sẽ Reload lại trang, 
            // nên ta không cần dọn dẹp quá khắt khe ở đây nữa, page load sẽ tự xoá trắng rác.

            // 7. Xử lý Comment, Like, Share, Link chuỗi hành động ngay sau khi đăng
            if (comment && comment.trim() !== '') {
                console.log("Bắt đầu chuỗi tự động Tương Tác sau khi bài lên...");
                try {
                    let clickedToast = false;

                    // --- BƯỚC 1: SĂN TOAST TOẠ ĐỘ VẬT LÝ VÀ CHUỘT THỰC ---
                    // Lý do: Các phương thức click DOM trước đây thường bị React của facebook chặn lơ.
                    console.log("Đang căng mắt chờ Toast 'Đã hiển thị' / 'Sẵn sàng' bật lên để Click (tối đa 30s)...");
                    for (let i = 0; i < 60; i++) {
                        const toastBox = await this.page.evaluate(() => {
                            // FB Toast thường gom vào alert, hoặc các div/span chữ tự động
                            const elements = Array.from(document.querySelectorAll('div[role="alert"], div[dir="auto"], span, a[role="link"]'));
                            for (let el of elements) {
                                const t = (el.innerText || el.textContent || '').toLowerCase().trim();
                                if (t.length > 5 && t.length < 250 && (
                                    (t.includes('hiển thị rồi đấy') || t.includes('đã hiển thị')) && t.includes('thước phim') ||
                                    t.includes('video của bạn đã sẵn sàng') ||
                                    t.includes('tải lên hoàn tất') ||
                                    t.includes('video is ready') ||
                                    t.includes('thước phim của bạn đã hiển thị')
                                )) {
                                    const rect = el.getBoundingClientRect();
                                    if (rect.width > 0 && rect.height > 0) {
                                        return { x: rect.x + (rect.width / 2), y: rect.y + (rect.height / 2) };
                                    }
                                }
                            }
                            return null;
                        });

                        if (toastBox) {
                            console.log(`-> BÃO TOAST XUẤT HIỆN Ở X=${toastBox.x}, Y=${toastBox.y}! Đang dập Click bằng Click tọa độ thực...`);
                            await this.page.mouse.click(toastBox.x, toastBox.y);
                            clickedToast = true;
                            // Chờ cho giao diện Reel bung lụa (Theater Mode)
                            await this.page.waitForTimeout(6000);
                            break;
                        }
                        await this.page.waitForTimeout(500);
                    }

                    // --- BƯỚC 2: FALLBACK NẾU MẤT TOAST -> LOAD LẠI TRẠNG THÁI VÀ QUÉT ---
                    let postUrlClicked = false;

                    if (!clickedToast) {
                        console.log("Mất Toast hoặc Click Toast không nhảy! Tiến hành nạp lại trang đích để tìm trực tiếp bài vừa đăng trên Feed...");
                        const finalUrl = targetUrl ? targetUrl : 'https://www.facebook.com/';
                        await this.page.goto(finalUrl, { waitUntil: 'load' });
                        await this.page.waitForTimeout(8000);

                        const pureText = content.replace(/[\n\r]+/g, ' ').replace(/[^\p{L}\p{N}\s]/gu, '').replace(/\s+/g, ' ').toLowerCase().trim().substring(0, 30);

                        for (let scrolls = 0; scrolls < 6; scrolls++) {
                            console.log(`Đang quét tìm bài viết mới đăng (Cuộn lần ${scrolls + 1})...`);

                            postUrlClicked = await this.page.evaluate((searchText) => {
                                const articles = Array.from(document.querySelectorAll('div[role="article"]'));
                                for (let article of articles) {
                                    const articleHtml = (article.innerText || article.textContent || '').toLowerCase();

                                    // Kiểm tra thời gian
                                    const hasNewTime = articleHtml.includes('vừa xong') || articleHtml.includes('just now') ||
                                        articleHtml.includes('1 phút') || articleHtml.includes('1 m') ||
                                        articleHtml.includes('2 phút') || articleHtml.includes('2 m') ||
                                        articleHtml.includes('3 phút') || articleHtml.includes('3 m') ||
                                        articleHtml.includes('4 phút') || articleHtml.includes('4 m') ||
                                        articleHtml.includes('5 phút') || articleHtml.includes('5 m');

                                    let hasMatchingText = true;
                                    if (searchText.length > 5) {
                                        hasMatchingText = articleHtml.replace(/[\n\r]+/g, ' ').replace(/[^\p{L}\p{N}\s]/gu, '').replace(/\s+/g, ' ').includes(searchText);
                                    }

                                    // Ưu tiên nã thẳng vào khớp định dạng text (Vì FB cập nhật thường giấu cả giờ đăng)
                                    // Nếu ko có text (vài chữ), thì mới ngó sang Thời gian.
                                    const isMatch = (searchText.length > 5 && hasMatchingText) || (searchText.length <= 5 && hasNewTime);

                                    if (isMatch) {
                                        // 1. Phá đảo bằng cách click trực tiếp vào lõi thẻ Video 💥
                                        const videos = article.querySelectorAll('video');
                                        if (videos.length > 0) {
                                            videos[0].click();
                                            return true;
                                        }

                                        // 2. Click vào link thời gian nếu không thấy lõi video
                                        const timeLinks = Array.from(article.querySelectorAll('a[role="link"]'));
                                        for (let link of timeLinks) {
                                            const t = (link.innerText || '').toLowerCase();
                                            if (t.includes('vừa xong') || t.includes('phút') || t.includes('m') || t.includes('just now')) {
                                                link.click();
                                                return true;
                                            }
                                        }

                                        // 3. Quét link sạch trỏ về bài đăng (loại bỏ click nhầm vô avatar Page)
                                        const allLinks = Array.from(article.querySelectorAll('a'));
                                        for (let link of allLinks) {
                                            const href = link.href || '';
                                            if (href.includes('/videos/') || href.includes('/watch') || href.includes('/posts/') || href.includes('/permalink/')) {
                                                link.click();
                                                return true;
                                            }
                                        }

                                        // Cuối cùng: Click vật lý thả bom vào giữa bụng bài viết
                                        const rect = article.getBoundingClientRect();
                                        return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 + 100 };
                                    }
                                }
                                return false;
                            }, pureText);

                            if (postUrlClicked) {
                                if (typeof postUrlClicked === 'object' && postUrlClicked.x && postUrlClicked.y) {
                                    await this.page.mouse.click(postUrlClicked.x, postUrlClicked.y);
                                    console.log("-> Bắn click tọa độ vật lý vào Video!");
                                }
                                console.log("-> ĐÃ MỞ BÀI ĐĂNG TỪ FEED NGON LÀNH!");
                                await this.page.waitForTimeout(6000);
                                break;
                            }

                            // Lăn chuột nhẹ nhàng hơn xuyên qua Bài Ghim, chống giật màn hình
                            await this.page.mouse.wheel(0, 400);
                            await this.page.waitForTimeout(3500);
                        }
                    }

                    if (!clickedToast && !postUrlClicked) {
                        console.log("Thất bại! Đã lướt hết mỏi tay nhưng không mở được bài nào. Bỏ qua chuỗi tương tác.");
                        await this.page.waitForTimeout(3000);
                    } else {
                        // Cả Click Toast Lẫn Tìm bài đều sẽ đẩy về: GIAO DIỆN THEATER CHO CHUỖI 5 BƯỚC THẦN THÁNH
                        console.log("Triển khai: Nhập Text Comment...");
                        let hasCommented = await this.page.evaluate(() => {
                            const textboxes = Array.from(document.querySelectorAll('div[role="textbox"][contenteditable="true"]'));
                            for (let t of textboxes) {
                                // Lọc textbox lộ thiên, sống động
                                if (t.offsetHeight > 0 && t.offsetWidth > 0 && t.tabIndex !== -1) {
                                    // Kiểm tra thêm để chắc không đụng nhầm thanh tìm kiếm FB 
                                    const lbl = (t.getAttribute('aria-label') || '').toLowerCase();
                                    if (!lbl.includes('tìm kiếm') && !lbl.includes('search')) {
                                        t.focus();
                                        return true;
                                    }
                                }
                            }
                            return false;
                        });

                        if (hasCommented) {
                            await this.page.waitForTimeout(1000);
                            await this.page.keyboard.insertText(comment);
                            await this.page.waitForTimeout(1000);
                            await this.page.keyboard.press('Enter');
                            console.log("==> Đã thả Comment thành công! <==");
                            await this.page.waitForTimeout(3000); // Đợi comment trôi lên

                            // --- BƯỚC 4: LIKE BÀI VIẾT ---
                            console.log("Triển khai: Like bài viết...");
                            await this.page.evaluate(() => {
                                const btns = Array.from(document.querySelectorAll('div[role="button"]'));
                                for (let b of btns) {
                                    const lbl = (b.getAttribute('aria-label') || '').toLowerCase();
                                    if (lbl === 'thích' || lbl === 'like') {
                                        if (b.offsetHeight > 0 && b.offsetWidth > 0) {
                                            b.click();
                                            return true;
                                        }
                                    }
                                }
                            });
                            await this.page.waitForTimeout(2500);

                            // --- BƯỚC 5: BẤM CHIA SẺ RỒI SAO CHÉP LIÊN KẾT ---
                            console.log("Triển khai: Gõ nút Chia sẻ...");
                            await this.page.evaluate(() => {
                                const btns = Array.from(document.querySelectorAll('div[role="button"]'));
                                for (let b of btns) {
                                    const lbl = (b.getAttribute('aria-label') || '').toLowerCase();
                                    if (lbl.includes('chia sẻ') || lbl.includes('share') || lbl.includes('gửi cho bạn bè') || lbl.includes('send this')) {
                                        if (b.offsetHeight > 0 && b.offsetWidth > 0) {
                                            b.click();
                                            return true;
                                        }
                                    }
                                }
                            });

                            console.log("Đợi Popup chia sẻ nổi lên...");
                            await this.page.waitForTimeout(3000);

                            console.log("Triển khai: Tìm và Click thẻ 'Sao chép liên kết'...");
                            const linkCopied = await this.page.evaluate(() => {
                                // Quét toàn màn hình tìm thẻ mang danh "sao chép liên kết"
                                const spans = Array.from(document.querySelectorAll('span, div[dir="auto"], span[dir="auto"]'));
                                for (let s of spans) {
                                    const t = (s.innerText || '').toLowerCase().trim();
                                    if (t === 'sao chép liên kết' || t === 'copy link') {
                                        let btn = s;
                                        while (btn && !btn.click) btn = btn.parentElement;
                                        if (btn && btn.click) {
                                            btn.click();
                                            return true;
                                        }
                                    }
                                }
                                return false;
                            });

                            if (linkCopied) {
                                console.log("==> COMBO DỨT ĐIỂM: COMMENT -> LIKE -> SHARE -> COPY LINK CỰC KỲ XUẤT SẮC! <==");
                            } else {
                                console.log("Không tìm thấy dòng chữ 'Sao chép liên kết', có thể FB chưa load xong popup.");
                            }

                            await this.page.waitForTimeout(3000);
                        } else {
                            console.log("Thất bại! Vẫn không tìm thấy TextBox để điền comment trên cửa sổ đang mở.");
                        }
                    }
                } catch (cmtErr) {
                    console.log("Lỗi System Exception khi cố gắng comment vào bài mới:", cmtErr);
                }
            } else {
                // Tặng thêm nệm an toàn tương đương nếu ko cần bình luận
                await this.page.waitForTimeout(10000);
            }

            await this.browserContext.close();
            return true;

        } catch (error) {
            console.error("Lỗi đăng bài:", error);
            if (this.browserContext) await this.browserContext.close();
            return false;
        }
    }

    // --- Điều khiển Trạng thái ---
    async pauseInteraction() { this.isPaused = true; console.log("Yêu cầu TẠM DỪNG đã nhận."); }
    async resumeInteraction() { this.isPaused = false; console.log("Yêu cầu TIẾP TỤC đã nhận."); }
    async stopInteraction() { this.isStopped = true; console.log("Yêu cầu DỪNG HẲN đã nhận."); }

    async _checkStateAndDelay(page, ms) {
        let elapsed = 0;
        const step = 500;
        while (elapsed < ms) {
            if (this.isStopped) throw new Error("Interaction stopped by user");

            if (this.isPaused) {
                // Đứng chờ vô tận nếu đang pause
                await page.waitForTimeout(step);
                continue;
            }

            await page.waitForTimeout(step);
            elapsed += step;
        }
    }

    async _switchIdentityRobustly(page, timeoutMs = 8000) {
        const switchSelectors = [
            'div[aria-label="Chuyển sang trang này"]',
            'div[aria-label="Switch to this page"]',
            'div[role="button"]:has-text("Chuyển ngay")',
            'div[role="button"]:has-text("Switch Now")',
            'div[aria-label="Chuyển"]',
            'div[role="button"]:has-text("Switch")',
            'div[aria-label="Tham gia Group dưới tư cách"]',
            'div[aria-label="Join Group As"]',
            'div[role="button"]:has-text("Tương tác dưới tư cách")',
            'div[role="button"]:has-text("Interact as")'
        ];
        let elapsed = 0;
        const step = 1000;
        let clickedCount = 0;

        console.log("Đang dò tìm yêu cầu Chuyển tư cách Page/Group...");
        while (elapsed < timeoutMs) {
            let foundBtn = null;

            // Ưu tiên dò nút Chuyển nằm trong Popup (Bypass lỗi 2 bước chuyển của FB)
            for (let sel of switchSelectors) {
                let scopedSel = `div[role="dialog"] ${sel}`;
                if ((await page.locator(scopedSel).count()) > 0) {
                    const loc = page.locator(scopedSel).first();
                    if (await loc.isVisible()) {
                        foundBtn = loc;
                        break;
                    }
                }
            }

            // Nếu không có trong popup, tìm ở bên ngoài
            if (!foundBtn) {
                for (let sel of switchSelectors) {
                    if ((await page.locator(sel).count()) > 0) {
                        const loc = page.locator(sel).first();
                        if (await loc.isVisible()) {
                            foundBtn = loc;
                            break;
                        }
                    }
                }
            }

            if (foundBtn) {
                console.log(`Phát hiện nút Chuyển Tư Cách (Lần ${clickedCount + 1}). Hành động: Click.`);
                await foundBtn.click().catch(() => { });
                clickedCount++;
                await this._checkStateAndDelay(page, 3000); // Chờ FB mở popup hoặc load trang
                // KHÔNG break ở đây, tiếp tục quét xem nó có văng ra 1 popup xác nhận không
            } else {
                if (clickedCount > 0) {
                    console.log("Đã click chuyển tư cách thành công và không còn nút xác nhận nào cản trở.");
                    break;
                }
            }

            await this._checkStateAndDelay(page, step);
            elapsed += step;
        }

        if (clickedCount > 0) {
            // Đóng các cửa sổ Modal cản trở khác nếu có (ví dụ popup giới thiệu tính năng mới)
            const btnX = page.locator('div[aria-label="Đóng"], div[aria-label="Close"]').first();
            if ((await btnX.count()) > 0 && await btnX.isVisible()) {
                await btnX.click().catch(() => { });
                await this._checkStateAndDelay(page, 1000);
            }
        } else {
            console.log("Không có yêu cầu chuyển đổi tư cách, sẽ giữ nguyên Profile hiện tại.");
        }
    }

    /**
     * Script Tương Tác Dạo (Seeding AI)
     */
    async startInteraction(settings) {
        const { profilesList, apiKey, keywords, timeMin, timeMax, postsMin, postsMax } = settings;
        this.isPaused = false;
        this.isStopped = false;

        try {
            const apiKeysArray = apiKey.split('\n').map(k => k.trim()).filter(k => k.length > 0);
            if (typeof global.savedApiIndex === 'undefined') global.savedApiIndex = 0;
            if (global.savedApiIndex >= apiKeysArray.length || global.savedApiIndex < 0) {
                global.savedApiIndex = 0;
            }
            
            let currentKeyIndex = global.savedApiIndex;
            console.log(`[HỆ THỐNG API] Bắt đầu lấy API ở vị trí đã lưu: Key thứ ${currentKeyIndex + 1}`);
            let currentGenAI = apiKeysArray.length > 0 ? new GoogleGenerativeAI(apiKeysArray[currentKeyIndex]) : null;
            let isAIAlive = apiKeysArray.length > 0;

            // Hàm Helper để xoay vòng API Keys nếu Hết Hạn Ngạch và dạo thử nghiệm các model con
            const askGemini = async (promptData) => {
                if (!isAIAlive || !currentGenAI) throw new Error("TẤT CẢ API KEYS ĐÃ CHẾT HOẶC HẾT HẠN NGẠCH!");

                const modelNames = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-2.5-pro", "gemini-1.5-flash", "gemini-pro-vision"];

                for (let keyAttempt = 0; keyAttempt < apiKeysArray.length; keyAttempt++) {
                    let lastErr = null;
                    for (let mName of modelNames) {
                        try {
                            const tempModel = currentGenAI.getGenerativeModel({ model: mName });
                            const res = await tempModel.generateContent(promptData);
                            // LƯU NGAY VỊ TRÍ ĐỂ CHUYỂN SANG KEY MỚI SAN SẺ TẢI TIẾP THEO THEO CHU CHÌNH VÒNG TRÒN
                            currentKeyIndex = (currentKeyIndex + 1) % apiKeysArray.length;
                            global.savedApiIndex = currentKeyIndex;
                            currentGenAI = new GoogleGenerativeAI(apiKeysArray[currentKeyIndex]);
                            return res;
                        } catch (err) {
                            lastErr = err;
                            const errStr = (err.message || '').toLowerCase();
                            // Nếu lỗi do Quá hạn ngạch (429 Too Many Requests), bỏ ngang vòng lặp Model để nhảy sang API Key mới
                            if (err.status === 429 || errStr.includes('429') || errStr.includes('quota') || errStr.includes('exhausted')) {
                                console.log(`[CẢNH BÁO] API Key dòng ${currentKeyIndex + 1} sập vì HẾT HẠN NGẠCH! Đảo Key ngay...`);
                                break;
                            }
                        }
                    } // end models loop

                    // Nếu đến đây tức là Key hiện tại oẳng (oẳng model hoặc sập ngạch)
                    console.log(`=> Đang nạp API Key dự phòng...`);
                    currentKeyIndex = (currentKeyIndex + 1) % apiKeysArray.length;
                    global.savedApiIndex = currentKeyIndex; // Cập nhật lại vào bộ nhớ rễ
                    currentGenAI = new GoogleGenerativeAI(apiKeysArray[currentKeyIndex]);

                    // Nếu đã thử hết mảng API Key mà vẫn xịt
                    if (keyAttempt === apiKeysArray.length - 1) {
                        isAIAlive = false;
                        console.log(">> [TỬ TRẬN CẤP BÁCH] Toàn bộ dàn API Key đã hết hạn ngạch! Bot kích hoạt Chế Độ Khuyết Tật (Chỉ Xem, Không Phân Tích, Không Comment).");
                        throw new Error("TẤT CẢ API KEYS ĐÃ TỬ TRẬN!");
                    }
                }
            };

            const filterKeywords = keywords ? keywords.split(',').map(k => k.trim().toLowerCase()).filter(k => k) : ['video'];
            const startIdx = settings.startIndex || 0;

            for (let pIdx = startIdx; pIdx < profilesList.length; pIdx++) {
                if (this.isStopped) break;

                const profileObj = profilesList[pIdx];
                const profilePath = path.join(this.userDataDir, profileObj.profileName);
                console.log(`=== Bắt đầu chạy Profile: ${profileObj.profileName} ===`);

                try {
                    this.browserContext = await chromium.launchPersistentContext(profilePath, {
                        headless: false,
                        viewport: null,
                        args: ['--disable-blink-features=AutomationControlled', '--start-maximized']
                    });
                    this.page = await this.browserContext.newPage();

                    const links = profileObj.targetLinks.split('\n').map(l => l.trim()).filter(l => l !== '');
                    if (links.length === 0) links.push("https://www.facebook.com/");

                    for (let linkIdx = 0; linkIdx < links.length; linkIdx++) {
                        const link = links[linkIdx];
                        console.log(`Bắt đầu xử lý cho Page thứ ${linkIdx + 1}: ${link}`);
                        await this.page.goto(link, { waitUntil: 'load' });
                        await this._checkStateAndDelay(this.page, 5000);

                        // --- KIỂM TRA ĐỔI TƯ CÁCH PAGE NHƯ LÚC ĐĂNG BÀI ---
                        await this._switchIdentityRobustly(this.page, 8000);

                        const timeToStayMin = Math.floor(Math.random() * (timeMax - timeMin + 1)) + timeMin;
                        const timeToStayMs = timeToStayMin * 60 * 1000;
                        let sessionStartTime = Date.now();
                        let endTime = sessionStartTime + timeToStayMs;
                        console.log(`Sẽ nán lại page này: ${timeToStayMin} phút.`);

                        const postsToComment = Math.floor(Math.random() * (postsMax - postsMin + 1)) + postsMin;
                        console.log(`Mục tiêu bình luận: ${postsToComment} video ngẫu nhiên.`);
                        let commentCount = 0;

                        // Chọn ngẫu nhiên 1 keyword để search
                        const randomKeyword = filterKeywords[Math.floor(Math.random() * filterKeywords.length)];
                        console.log(`Đang truy cập trang tìm kiếm với từ khóa: "${randomKeyword}"...`);

                        await this.page.goto(`https://www.facebook.com/search/top/?q=${encodeURIComponent(randomKeyword)}`, { waitUntil: 'load' });
                        await this._checkStateAndDelay(this.page, 5000);

                        // Tìm video đầu tiên trong kết quả search và nhấn vào
                        console.log("Đang cuộn tìm video đầu tiên...");
                        let clickedVideo = false;
                        for (let scrolls = 0; scrolls < 10; scrolls++) {
                            await this._checkStateAndDelay(this.page, 1500);

                            const clickCoords = await this.page.evaluate(() => {
                                // 1. Tìm các link hình thu nhỏ (thumbnail) trỏ sang Watch / Reel
                                // Tập trung quét tìm trong cột chính ở giữa, loại bỏ cột bên trái
                                const mainArea = document.querySelector('div[role="main"]') || document.querySelector('div[role="feed"]') || document.body;
                                const aTags = Array.from(mainArea.querySelectorAll('a'));
                                const videoLinks = aTags.filter(a => {
                                    const hr = a.href || '';
                                    return hr.includes('/watch') || hr.includes('/reel/') || hr.includes('/videos/');
                                });

                                for (let a of videoLinks) {
                                    const rect = a.getBoundingClientRect();
                                    // Bỏ qua cột trái (left < 300px) để không bấm nhầm menu Watch, Reels cố định
                                    if (rect.width > 30 && rect.height > 30 && rect.top >= 0 && rect.top <= window.innerHeight - rect.height && rect.left > 300) {
                                        return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
                                    }
                                }

                                // 2. Fallback: Nếu không tìm thấy link, tìm lõi thẻ video
                                const videos = Array.from(mainArea.querySelectorAll('video'));
                                for (let v of videos) {
                                    const r = v.getBoundingClientRect();
                                    if (r.width > 50 && r.height > 50 && r.top >= 0 && r.top <= window.innerHeight - r.height && r.left > 300) {
                                        return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
                                    }
                                }
                                return null;
                            });

                            if (clickCoords) {
                                // Bắn một phát click CHUẨN VẬT LÝ, xuyên qua màng bọc của Facebook (tránh lỗi TrustedEvent)
                                await this.page.mouse.click(clickCoords.x, clickCoords.y);
                                clickedVideo = true;
                                break;
                            }

                            if (clickedVideo) break;
                            // Kéo chuột dò tìm tiếp
                            await this.page.mouse.wheel(0, 1000);
                        }

                        if (!clickedVideo) {
                            console.log("Trường hợp xấu nhất: Không tìm thấy video hợp lệ ở cột giữa. Tiến hành mở thẳng https://www.facebook.com/reel/ ...");
                            await this.page.goto('https://www.facebook.com/reel/', { waitUntil: 'load' });
                            await this._checkStateAndDelay(this.page, 5000);
                        }

                        console.log("Đã vồ được và vào chế độ xem Video. Mặc định bỏ qua video đầu tiên theo yêu cầu, trượt xuống video thứ 2...");
                        await this._checkStateAndDelay(this.page, 3000);

                        // Mặc định bỏ qua Video đầu tiên: Lăn chuột mạnh kết hợp phím mũi tên để chắc chắn không bị kẹt focus
                        await this.page.mouse.move(500, 500); // Rê chuột ra giữa màn hình video
                        await this.page.mouse.wheel(0, 3000); // Lăn chuột cuộn xuống
                        await this._checkStateAndDelay(this.page, 500);
                        await this.page.keyboard.press('ArrowDown'); // Bơm thêm nút mũi tên
                        await this._checkStateAndDelay(this.page, 3000);

                        let isCommentPanelOpen = false; // Theo dõi cờ để không bấm lộn xộn icon Bình luận nhiều lần

                        // ============= VÒNG LẶP CHO CHẾ ĐỘ XEM VIDEO (WATCH FEED) =============
                        while (true) {
                            let lastImagePart = null; // Biến lưu ảnh để truyền cho AI làm content
                            if (this.isStopped) throw new Error("Interaction stopped by user");

                            // Cập nhật lại thời gian sau khi Paused-Resume để tính logic 50%
                            if (this.isPaused) {
                                const pauseStart = Date.now();
                                while (this.isPaused) {
                                    if (this.isStopped) throw new Error("Interaction stopped by user");
                                    await this.page.waitForTimeout(1000);
                                }
                                const pauseDuration = Date.now() - pauseStart;
                                // Phục hồi lại deadline tương lai để không bị mất thời gian do pause
                                sessionStartTime += pauseDuration;
                                endTime += pauseDuration;

                                // "Nếu thời gian tương tác đã quá nửa thì sẽ đến kênh tiếp theo khi chọn bắt đầu lại"
                                const elapsedTime = Date.now() - sessionStartTime;
                                if (elapsedTime > (timeToStayMs / 2)) {
                                    console.log("Đã qua hơn 50% thời gian khi tạm dừng. Sẽ chuyển thẳng sang Link Channel kế tiếp.");
                                    break; // Thoát vòng lặp lướt, qua kênh sau
                                }
                            }

                            if (Date.now() > endTime) {
                                console.log("Đã hết thời gian lướt cho tài khoản/Link này.");
                                break;
                            }

                            // Đảm bảo bật tiếng (Unmute)
                            const unmuteBtns = await this.page.locator('div[aria-label="Bật tiếng"], div[aria-label="Unmute"]').all();
                            for (let btn of unmuteBtns) {
                                try {
                                    if (await btn.isVisible()) {
                                        await btn.click();
                                        console.log("Đã bật tiếng video.");
                                        break;
                                    }
                                } catch (e) { }
                            }

                            // Đợi xíu tầm 2 giây cho Reel nạp Text (tên, tiêu đề, caption)
                            await this._checkStateAndDelay(this.page, 2000);

                            // --- MỞ RỘNG BÌNH LUẬN ĐỂ BUNG CAPTION TEXT VÀ HASHTAG TRƯỚC KHI CHỤP ẢNH MÀN HÌNH ---
                            console.log("Đang mở phần bình luận kiểm tra để bung nội dung Caption...");
                            const isPanelAlreadyOpenPrior = await this.page.evaluate(() => {
                                const textboxes = Array.from(document.querySelectorAll('div[role="textbox"][contenteditable="true"]'));
                                const cY = window.innerHeight / 2;
                                for (let t of textboxes) {
                                    const r = t.getBoundingClientRect();
                                    if (r.width > 0 && r.height > 0 && r.top >= 0 && r.bottom <= window.innerHeight) {
                                        const lbl = (t.getAttribute('aria-label') || '').toLowerCase();
                                        if (!lbl.includes('tìm kiếm') && !lbl.includes('search')) {
                                            const d = Math.abs(cY - (r.top + r.height / 2));
                                            if (d < 600) return true; // Nằm an toàn trong vùng nhìn thấy
                                        }
                                    }
                                }
                                return false;
                            });

                            if (!isPanelAlreadyOpenPrior) {
                                const clicked = await this.page.evaluate(() => {
                                    const btns = Array.from(document.querySelectorAll('div[aria-label="Bình luận"], div[aria-label="Comment"], i[data-visualcompletion="css-img"]'));
                                    let closest = null; let minD = Infinity; const cY = window.innerHeight / 2;
                                    for (let b of btns) {
                                        const lbl = (b.getAttribute('aria-label') || '').toLowerCase();
                                        if (b.tagName === 'I' && !b.className.includes('comment')) continue;
                                        const r = b.getBoundingClientRect();
                                        if (r.width > 0 && r.height > 0 && r.top >= 0 && r.bottom <= window.innerHeight) {
                                            const d = Math.abs(cY - (r.top + r.height / 2));
                                            if (d < minD) { minD = d; closest = b; }
                                        }
                                    }
                                    if (closest) { closest.click(); return true; }
                                    return false;
                                });

                                if (clicked) {
                                    // Chờ thêm 3s cho khay giao diện trượt ra hoàn thiện
                                    await this._checkStateAndDelay(this.page, 3000);
                                }
                            }

                            // --- QUÉT CHỦ ĐỀ BẰNG AI VISION LÊN HÌNH ẢNH SAU KHI ĐÃ ĐẦY ĐỦ THÔNG TIN ---
                            // Kiểm tra xem Video có đúng chủ đề (keyword) không
                            let matchKeyword = false;

                            if (filterKeywords.length === 1 && filterKeywords[0] === 'video') {
                                matchKeyword = true; // Chế độ lướt tự do (Không nhập gì hoặc nhập đúng chữ 'video')
                            } else {
                                console.log("Đang chụp màn hình Video và gọi thần nhãn Gemini để kiểm định chủ đề...");
                                try {
                                    if (!isAIAlive) throw new Error("ZombieMode");

                                    // Chụp ảnh cuộn video hiện hành
                                    const screenshotBuffer = await this.page.screenshot({ type: 'jpeg', quality: 30 });
                                    lastImagePart = {
                                        inlineData: {
                                            data: screenshotBuffer.toString("base64"),
                                            mimeType: "image/jpeg"
                                        }
                                    };

                                    const topicStr = filterKeywords.join(', ').toUpperCase();
                                    const queryPrompt = `Đây có phải video về chủ đề [ ${topicStr} ] không? Trả lời 'Đúng' hoặc 'Sai' và kèm giải thích ngắn gọn.`;

                                    // Kết hợp Prompt và Ảnh đè lên model.generateContent thông qua helper lách 404
                                    const result = await askGemini([queryPrompt, lastImagePart]);
                                    const responseText = (await result.response.text()).trim().toLowerCase();

                                    console.log(`[AI PHÂN TÍCH ẢNH DẠO]: ${responseText}`);

                                    // Nếu trong câu trả lời có chữ "đúng", ta sẽ cho pass
                                    if (responseText.includes('đúng') && !responseText.includes('không đúng') && !responseText.includes('chưa đúng')) {
                                        matchKeyword = true;
                                    }
                                } catch (aiScanErr) {
                                    if (!isAIAlive) {
                                        console.log(">> [🤖 CHẾ ĐỘ ZOMBIE]: Bỏ qua màng lọc kiểm duyệt thông minh, auto chấp nhận xem video này để duy trì vòng lặp hoạt động nick...");
                                        matchKeyword = true;
                                    } else {
                                        console.error("Lỗi khi kiểm định hình ảnh bằng AI:", aiScanErr.message);
                                        // Fallback về quét text cơ bản nếu AI sụp
                                        const allTexts = await this.page.evaluate(() => document.body.innerText);
                                        const lowercaseText = allTexts.toLowerCase();
                                        for (const k of filterKeywords) {
                                            if (lowercaseText.includes(k)) {
                                                matchKeyword = true;
                                                break;
                                            }
                                        }
                                    }
                                }
                            }

                            if (!matchKeyword) {
                                console.log(">> Cảnh báo: Video không trúng chủ đề/keyword của bạn. Lập tức cuộn chuột bỏ qua ngay chứ không xem!");

                                await this.page.keyboard.press('Escape');
                                await this.page.evaluate(() => { if (document.activeElement) document.activeElement.blur(); });
                                await this.page.mouse.move(500, 500);
                                await this.page.mouse.wheel(0, 3000);
                                await this._checkStateAndDelay(this.page, 500);
                                await this.page.keyboard.press('ArrowDown');

                                await this._checkStateAndDelay(this.page, 2000); // Chờ cho reel mới trôi tới
                                continue; // Lặp lại vòng mới lên đầu
                            }

                            console.log(">> BINGO! Video ĐÚNG chủ đề ngách. Bắt đầu nán lại xem để tăng độ trust...");

                            // Lúc này mới bắt đầu Xem 30s - 60s
                            const watchTimeMs = Math.floor(Math.random() * 30000) + 30000;
                            console.log(`Đang mải xem video... (${Math.floor(watchTimeMs / 1000)}s)`);
                            await this._checkStateAndDelay(this.page, watchTimeMs);

                            // Phân tích nếu vẫn còn quota comment
                            if (commentCount < postsToComment && isAIAlive) {
                                console.log("Video đã xem chín muồi. Đang gọi AI dùng hình ảnh để viết comment gài link...");

                                try {
                                    const topicStr = filterKeywords.join(', ').toUpperCase();
                                    const prompt = `Dựa vào hình ảnh trên, hãy viết cho tôi Câu trả lời bình luận một cách khéo léo kèm một mẹo nhỏ dân gian liên quan đến nội dung trên! QUAN TRỌNG: TUYỆT ĐỐI CHỈ TRẢ VỀ DUY NHẤT nội dung bình luận, KHÔNG KÈM THEO bất kỳ câu dẫn nào như "Dưới đây là bình luận...", KHÔNG giải thích. Nội dung phải tự nhiên, mang giá trị trao đi cho người xem.`;

                                    let result;
                                    if (lastImagePart) {
                                        // Gọi prompt kèm hình ảnh đã lưu ở bước kiểm định
                                        result = await askGemini([prompt, lastImagePart]);
                                    } else {
                                        // Fallback nếu không có hình ảnh
                                        const allTexts = await this.page.evaluate(() => document.body.innerText);
                                        const fallbackPrompt = `${prompt}\nNội dung từ FB: ${allTexts.substring(0, 1000)}`;
                                        result = await askGemini(fallbackPrompt);
                                    }

                                    const response = await result.response;
                                    const aiComment = response.text().trim().replace(/^"/, '').replace(/"$/, '').replace(/\n/g, ' ');

                                    console.log(`[AI COMMENT]: ${aiComment}`);

                                    // Phân tích TRỰC TIẾP xem TextBox Comment đã hiển thị sờ sờ trên màn hình chưa trước khi click mở
                                    const isPanelAlreadyOpen = await this.page.evaluate(() => {
                                        const textboxes = Array.from(document.querySelectorAll('div[role="textbox"][contenteditable="true"]'));
                                        const cY = window.innerHeight / 2;
                                        for (let t of textboxes) {
                                            const r = t.getBoundingClientRect();
                                            if (r.width > 0 && r.height > 0 && r.top >= 0 && r.bottom <= window.innerHeight) {
                                                const lbl = (t.getAttribute('aria-label') || '').toLowerCase();
                                                if (!lbl.includes('tìm kiếm') && !lbl.includes('search')) {
                                                    const d = Math.abs(cY - (r.top + r.height / 2));
                                                    if (d < 600) return true; // Nằm an toàn trong vùng nhìn thấy
                                                }
                                            }
                                        }
                                        return false;
                                    });

                                    if (!isPanelAlreadyOpen) {
                                        console.log("Khung bình luận bị đang đóng, Đang bung icon Bình Luận để lòi Textbox ra...");
                                        const clicked = await this.page.evaluate(() => {
                                            const btns = Array.from(document.querySelectorAll('div[aria-label="Bình luận"], div[aria-label="Comment"], i[data-visualcompletion="css-img"]'));
                                            let closest = null; let minD = Infinity; const cY = window.innerHeight / 2;
                                            for (let b of btns) {
                                                const lbl = (b.getAttribute('aria-label') || '').toLowerCase();
                                                // Lọc thẻ i thừa do visualcompletion
                                                if (b.tagName === 'I' && !b.className.includes('comment')) continue;

                                                const r = b.getBoundingClientRect();
                                                if (r.width > 0 && r.height > 0 && r.top >= 0 && r.bottom <= window.innerHeight) {
                                                    const d = Math.abs(cY - (r.top + r.height / 2));
                                                    if (d < minD) { minD = d; closest = b; }
                                                }
                                            }
                                            if (closest) { closest.click(); return true; }
                                            return false;
                                        });

                                        if (clicked) {
                                            await this._checkStateAndDelay(this.page, 3000);
                                        }
                                    } else {
                                        console.log("Phát hiện Khung bình luận đã CÓ SẴN (tự bung bởi FB), bỏ qua việc bấm nút Mở Comment để tránh vô tình TẮT nó!");
                                        await this._checkStateAndDelay(this.page, 500);
                                    }

                                    // Đảm bảo TextBox focus chuẩn xác trước khi gõ phím
                                    await this.page.evaluate(() => {
                                        const textboxes = Array.from(document.querySelectorAll('div[role="textbox"][contenteditable="true"]'));
                                        let closest = null; let minD = Infinity; const cY = window.innerHeight / 2;
                                        for (let t of textboxes) {
                                            const r = t.getBoundingClientRect();
                                            if (r.width > 0 && r.height > 0 && t.tabIndex !== -1 && r.top >= 0 && r.bottom <= window.innerHeight) {
                                                const lbl = (t.getAttribute('aria-label') || '').toLowerCase();
                                                if (!lbl.includes('tìm kiếm') && !lbl.includes('search')) {
                                                    const d = Math.abs(cY - (r.top + r.height / 2));
                                                    if (d < minD) { minD = d; closest = t; }
                                                }
                                            }
                                        }
                                        if (closest) closest.focus();
                                    });

                                    // Viết bình luận
                                    // Gửi text thẳng vào bàn phím (đã được focus ở trên)
                                    await this.page.keyboard.insertText(aiComment);
                                    await this._checkStateAndDelay(this.page, 1500);
                                    await this.page.keyboard.press('Enter');
                                    console.log("==> Đã submit comment thành công!");

                                    // Like video
                                    console.log("Triển khai: Like bài viết...");
                                    await this.page.evaluate(() => {
                                        const btns = Array.from(document.querySelectorAll('div[role="button"]'));
                                        let closest = null; let minD = Infinity; const cY = window.innerHeight / 2;
                                        for (let b of btns) {
                                            const lbl = (b.getAttribute('aria-label') || '').toLowerCase();
                                            if (lbl === 'thích' || lbl === 'like') {
                                                const r = b.getBoundingClientRect();
                                                if (r.width > 0 && r.height > 0 && r.top >= 0 && r.bottom <= window.innerHeight) {
                                                    const d = Math.abs(cY - (r.top + r.height / 2));
                                                    if (d < minD) { minD = d; closest = b; }
                                                }
                                            }
                                        }
                                        if (closest) closest.click();
                                    });
                                    await this._checkStateAndDelay(this.page, 2000);

                                    // Share video (Chia sẻ -> Sao chép liên kết)
                                    console.log("Triển khai: Bấm Chia sẻ (Share)...");
                                    await this.page.evaluate(() => {
                                        const btns = Array.from(document.querySelectorAll('div[role="button"]'));
                                        let closest = null; let minD = Infinity; const cY = window.innerHeight / 2;
                                        for (let b of btns) {
                                            const lbl = (b.getAttribute('aria-label') || '').toLowerCase();
                                            if (lbl.includes('chia sẻ') || lbl.includes('share') || lbl.includes('gửi cho bạn bè') || lbl.includes('send this')) {
                                                const r = b.getBoundingClientRect();
                                                if (r.width > 0 && r.height > 0 && r.top >= 0 && r.bottom <= window.innerHeight) {
                                                    const d = Math.abs(cY - (r.top + r.height / 2));
                                                    if (d < minD) { minD = d; closest = b; }
                                                }
                                            }
                                        }
                                        if (closest) closest.click();
                                    });
                                    await this._checkStateAndDelay(this.page, 2500);

                                    console.log("Triển khai: Sao chép liên kết (Bơm tương tác FB Share)...");
                                    await this.page.evaluate(() => {
                                        const spans = Array.from(document.querySelectorAll('span, div[dir="auto"], span[dir="auto"]'));
                                        let closest = null; let minD = Infinity; const cY = window.innerHeight / 2;
                                        for (let s of spans) {
                                            const t = (s.innerText || '').toLowerCase().trim();
                                            if (t === 'sao chép liên kết' || t === 'copy link') {
                                                const r = s.getBoundingClientRect();
                                                if (r.width > 0 && r.height > 0 && r.top >= 0 && r.bottom <= window.innerHeight) {
                                                    let btn = s;
                                                    while (btn && !btn.click) btn = btn.parentElement;
                                                    if (btn && btn.click) {
                                                        const d = Math.abs(cY - (r.top + r.height / 2));
                                                        if (d < minD) { minD = d; closest = btn; }
                                                    }
                                                }
                                            }
                                        }
                                        if (closest) closest.click();
                                    });
                                    await this._checkStateAndDelay(this.page, 2000);

                                    commentCount++;

                                    // Sau khi comment chờ từ 3 đến 10 giây random
                                    const postCommentWait = Math.floor(Math.random() * 8000) + 3000;
                                    console.log(`Ngâm video theo dõi thêm ${Math.floor(postCommentWait / 1000)}s...`);
                                    await this._checkStateAndDelay(this.page, postCommentWait);

                                } catch (aiErr) {
                                    console.error("Lỗi AI hoặc nhập comment: ", aiErr.message);
                                }
                            } else if (!isAIAlive && commentCount < postsToComment) {
                                console.log(">> [🤖 CHẾ ĐỘ ZOMBIE]: Tắt chức năng bình luận và chia sẻ (chỉ xem xong rồi đi).");
                            }

                            // Chuyển sang video tiếp theo
                            console.log("Chuyển sang video kế tiếp...");

                            // Xả Focus: Tắt mọi Popup Share hoặc Bảng Comment đang vướng bằng cách gõ phím Esc nhiều lần
                            await this.page.keyboard.press('Escape');
                            await this._checkStateAndDelay(this.page, 200);
                            await this.page.keyboard.press('Escape');
                            await this._checkStateAndDelay(this.page, 500);

                            // Hủy Focus hoàn toàn để ArrowDown có tác dụng lên trang chứ không phải lên Input
                            await this.page.evaluate(() => { if (document.activeElement) document.activeElement.blur(); });

                            // Combo Vật Lý nảy trang: Rê chuột ra giữa rồi lăn cuộn kết hợp phím
                            await this.page.mouse.move(500, 500);
                            await this.page.mouse.wheel(0, 3000);
                            await this._checkStateAndDelay(this.page, 500);
                            await this.page.keyboard.press('ArrowDown');

                            await this._checkStateAndDelay(this.page, 3000);
                        }
                    } // end for links

                } catch (profErr) {
                    console.error(`Lỗi khi xử lý Profile ${profileObj.profileName}:`, profErr.message);
                    if (profErr.message === "Interaction stopped by user") throw profErr;
                } finally {
                    if (this.browserContext) {
                        await this.browserContext.close().catch(() => { });
                        this.browserContext = null;
                        this.page = null;
                    }
                    if (this.onProfileComplete && !this.isStopped) {
                        this.onProfileComplete(pIdx);
                    }
                }
            } // end for profilesList

            console.log("CHUYẾN ĐI TƯƠNG TÁC ĐÃ HOÀN TẤT TOÀN BỘ CÁC PROFILE.");
            return true;

        } catch (error) {
            console.error("Luồng Tương tác bị lỗi hoặc đã Ngừng:", error.message);
            if (this.browserContext) await this.browserContext.close().catch(() => { });
            this.browserContext = null;

            // Ném lại lỗi nếu không phải là do user cố tình bấm Dừng
            if (error.message !== "Interaction stopped by user") {
                throw error;
            }
            return false;
        }
    }
}

module.exports = { FacebookAutoBot };
