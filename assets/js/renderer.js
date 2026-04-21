// --- Biến toàn cục (Global state) ---
let contentsList = [];
let videosList = [];
let scheduleQueue = [];
let profilesList = []; // Mạng chứa các Profile quản lý page

// Kh�xi tạo data �ã lưu từ trư�:c
window.api.getTableData().then(data => {
    if (data && data.length > 0) {
        scheduleQueue = data;
        renderTable();
    }
});

// Render danh sách Profile ra màn hình Quản lý
function renderProfilesList() {
    const container = document.getElementById('profiles-list-container');
    if (!container) return;

    container.innerHTML = '';

    if (profilesList.length === 0) {
        container.innerHTML = '<p style="color: var(--text-muted); font-style: italic;">Chưa có Profile nào được lưu.</p>';
        return;
    }

    profilesList.forEach((profile, idx) => {
        const linksCount = profile.targetLinks.split('\n').filter(l => l.trim()).length;

        const card = document.createElement('div');
        card.style.background = 'var(--bg-dark)';
        card.style.border = '1px solid var(--border)';
        card.style.padding = '15px';
        card.style.borderRadius = '8px';
        card.style.display = 'flex';
        card.style.flexDirection = 'column';
        card.style.gap = '10px';

        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <h4 style="color: var(--primary); margin: 0; font-size: 1.1rem;">${profile.profileName}</h4>
                <div style="display: flex; gap: 8px;">
                    <button class="btn btn-outline btn-edit-profile" data-idx="${idx}" style="padding: 5px 10px; font-size: 0.85rem;">Sửa</button>
                    <button class="btn btn-outline btn-delete-profile" data-idx="${idx}" style="padding: 5px 10px; font-size: 0.85rem; border-color: var(--danger); color: var(--danger);">Xóa</button>
                </div>
            </div>
            <div style="font-size: 0.9rem; color: var(--text-muted);">
                <p style="margin: 0;">Quản lý: <strong>${linksCount}</strong> Nơi Đăng (Fanpage/Group)</p>
            </div>
            <div style="margin-top: 5px;">
                <button class="btn btn-primary btn-open-profile-direct" data-idx="${idx}" style="width: 100%; font-size: 0.9rem; padding: 8px;">Mở Trình Duyệt ${profile.profileName}</button>
            </div>
        `;
        container.appendChild(card);
    });

    // Gắn sự kiện cho các nút Edit / Delete / Open
    container.querySelectorAll('.btn-edit-profile').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const idx = e.target.getAttribute('data-idx');
            const p = profilesList[idx];
            document.getElementById('edit-profile-id').value = idx;
            document.getElementById('input-profile-name').value = p.profileName;
            document.getElementById('target-links').value = p.targetLinks;
            document.getElementById('form-profile-title').textContent = "Đang Sửa: " + p.profileName;
            document.getElementById('btn-save-profile').textContent = "Cập Nhật Profile";
            document.getElementById('btn-cancel-edit-profile').classList.remove('hidden');
            document.getElementById('input-profile-name').focus();
        });
    });

    container.querySelectorAll('.btn-delete-profile').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const idx = e.target.getAttribute('data-idx');
            if (confirm("Chắc chắn muốn hành động không?")) {
                profilesList.splice(idx, 1);
                debounceSaveConfig();
                renderProfilesList();
            }
        });
    });

    container.querySelectorAll('.btn-open-profile-direct').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const idx = e.target.getAttribute('data-idx');
            const p = profilesList[idx];

            e.target.disabled = true;
            const orgText = e.target.textContent;
            e.target.textContent = "Đang m�x...";
            try {
                await window.api.openProfile(p.profileName);
            } catch (err) {
                alert("Tương tác thành công/lỗi!");
            }
            e.target.disabled = false;
            e.target.textContent = orgText;
        });
    });
}

window.api.getConfig().then(config => {
    if (config) {
        // Tương thích ngược: Nếu có config cũ ProfileName dơn lẻ mà list �ang tr�ng thì push vào array
        if (config.profilesList && Array.isArray(config.profilesList)) {
            profilesList = config.profilesList;
        } else if (config.profileName && config.targetLinks) {
            profilesList.push({
                profileName: config.profileName,
                targetLinks: config.targetLinks
            });
        }

        renderProfilesList();

        // Interaction configs
        if (config.apiGeminiKey && document.getElementById('api-gemini-key')) document.getElementById('api-gemini-key').value = config.apiGeminiKey;
        if (config.interactionKeywords && document.getElementById('interaction-keywords')) document.getElementById('interaction-keywords').value = config.interactionKeywords;
        if (config.timeMin && document.getElementById('time-min')) document.getElementById('time-min').value = config.timeMin;
        if (config.timeMax && document.getElementById('time-max')) document.getElementById('time-max').value = config.timeMax;
        if (config.postsMin && document.getElementById('posts-min')) document.getElementById('posts-min').value = config.postsMin;
        if (config.postsMax && document.getElementById('posts-max')) document.getElementById('posts-max').value = config.postsMax;
    }
});

function saveQueueData() {
    window.api.saveTableData(scheduleQueue);
}

function debounceSaveConfig() {
    clearTimeout(window.saveConfigTimer);
    window.saveConfigTimer = setTimeout(() => {
        const apiGeminiKey = document.getElementById('api-gemini-key') ? document.getElementById('api-gemini-key').value : '';
        const interactionKeywords = document.getElementById('interaction-keywords') ? document.getElementById('interaction-keywords').value : '';
        const timeMin = document.getElementById('time-min') ? document.getElementById('time-min').value : '';
        const timeMax = document.getElementById('time-max') ? document.getElementById('time-max').value : '';
        const postsMin = document.getElementById('posts-min') ? document.getElementById('posts-min').value : '';
        const postsMax = document.getElementById('posts-max') ? document.getElementById('posts-max').value : '';

        window.api.saveConfig({
            profilesList,
            apiGeminiKey,
            interactionKeywords,
            timeMin,
            timeMax,
            postsMin,
            postsMax
        });
    }, 500);
}

// --- Giao di�!n (DOM Elements) ---
const elClock = document.getElementById('realtime-clock');
const btnTabs = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

// Content Input
const txtPaste = document.getElementById('content-paste');
const fileInput = document.getElementById('content-file-picker');
const btnParseContent = document.getElementById('btn-parse-content');

// Video Input
const btnSelectVideo = document.getElementById('btn-select-video-dir');
const txtDirPath = document.getElementById('video-dir-path');
const txtVideoCount = document.getElementById('video-count');

// Settings
const inputPostsPerDay = document.getElementById('posts-per-day');
const inputStartTime = document.getElementById('start-time');
const inputSecondTime = document.getElementById('second-time');
const containerSecondTime = document.getElementById('second-post-container');
const chkRandomTime = document.getElementById('random-time');
const btnGenerate = document.getElementById('btn-generate-schedule');

// Table
const tbody = document.getElementById('schedule-tbody');
const badgeQueue = document.getElementById('queue-badge');

// Lắng nghe sự ki�!n Save Config tự ��"ng
document.addEventListener('DOMContentLoaded', () => {
    ['api-gemini-key', 'interaction-keywords', 'time-min', 'time-max', 'posts-min', 'posts-max'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', debounceSaveConfig);
    });

    // Form thêm / sửa profile
    const btnSaveProfile = document.getElementById('btn-save-profile');
    const btnCancelEditProfile = document.getElementById('btn-cancel-edit-profile');
    const btnOpenProfile = document.getElementById('btn-open-profile');

    const resetProfileForm = () => {
        document.getElementById('edit-profile-id').value = '';
        document.getElementById('input-profile-name').value = '';
        document.getElementById('target-links').value = '';
        document.getElementById('form-profile-title').textContent = "Thêm Profile M�:i";
        document.getElementById('btn-save-profile').textContent = "Lưu Lại Profile";
        btnCancelEditProfile.classList.add('hidden');
    };

    if (btnCancelEditProfile) {
        btnCancelEditProfile.addEventListener('click', resetProfileForm);
    }

    if (btnSaveProfile) {
        btnSaveProfile.addEventListener('click', () => {
            const pName = document.getElementById('input-profile-name').value.trim();
            const pLinks = document.getElementById('target-links').value.trim();
            const editId = document.getElementById('edit-profile-id').value;

            if (!pName || pName === '') return alert("Tương tác thành công/lỗi!");

            const newProfileObj = {
                profileName: pName,
                targetLinks: pLinks
            };

            if (editId !== '') {
                // Sửa
                profilesList[parseInt(editId)] = newProfileObj;
            } else {
                // Thêm m�:i
                profilesList.push(newProfileObj);
            }

            debounceSaveConfig();
            renderProfilesList();
            resetProfileForm();
        });
    }

    if (btnOpenProfile) {
        btnOpenProfile.addEventListener('click', async () => {
            const profileName = document.getElementById('input-profile-name').value.trim() || 'Profile_Default';
            btnOpenProfile.disabled = true;
            const originalText = btnOpenProfile.textContent;
            btnOpenProfile.textContent = "Đang kh�xi tạo...";
            try {
                await window.api.openProfile(profileName);
            } catch (err) {
                alert("Tương tác thành công/lỗi!");
            }
            btnOpenProfile.disabled = false;
            btnOpenProfile.textContent = originalText;
        });
    }
});


// Engine core
const btnStartEngine = document.getElementById('btn-start-engine');
let isAutoRunning = false;
let isInteractionLinked = false;
let isFullAutoSequence = false;
let isPublishing = false; // NgĒn ngừa chạy song song 2 bot

// --- 1. Đ�ng h� thời gian thực ---
async function updateClock() {
    const now = new Date();
    elClock.textContent = now.toLocaleTimeString('vi-VN', { hour12: false });
    await checkScheduleQueue(now);
}
setInterval(updateClock, 1000);
updateClock();

// --- 2. Xử lý UI Tabs ---
btnTabs.forEach(btn => {
    btn.addEventListener('click', () => {
        btnTabs.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.classList.add('hidden'));

        btn.classList.add('active');
        document.getElementById(`tab-${btn.dataset.tab}`).classList.remove('hidden');
    });
});

inputPostsPerDay.addEventListener('change', (e) => {
    if (parseInt(e.target.value) >= 2) {
        containerSecondTime.classList.remove('hidden');
    } else {
        containerSecondTime.classList.add('hidden');
    }
});

// --- 3. Parsing N�?i dung (Text / Excel) ---
btnParseContent.addEventListener('click', async () => {
    const activeTab = document.querySelector('.tab-btn.active').dataset.tab;
    contentsList = []; // reset

    if (activeTab === 'paste') {
        const text = txtPaste.value.trim();
        if (!text) return alert("Vui lòng dán Nội dung (Content) trước!");

        // Tách bằng 2 dòng tr�ng
        contentsList = text.split(/\n\s*\n/).filter(t => t.trim() !== '');
        alert("Đã phân tích và tách thành công " + contentsList.length + " bài đăng!");
    } else {
        // Parse Excel/TXT file (if implemented via FileReader)
        if (!fileInput.files.length) return alert("Vui lòng chọn File chứa Nội dung (Content) trước!");
        const file = fileInput.files[0];

        if (file.name.endsWith('.txt')) {
            const text = await file.text();
            contentsList = text.split(/\n\s*\n/).filter(t => t.trim() !== '');
            alert("Đã phân tích File TXT và tách thành công " + contentsList.length + " bài đăng!");
        } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data);
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });

            // M�i dòng là 1 content (bỏ dòng trắng)
            contentsList = json.map(row => row[0]).filter(cel => cel && cel.toString().trim() !== "");
            alert("Đã tách File Excel thành công " + contentsList.length + " bài đăng!");
        }
    }
});

fileInput.addEventListener('change', () => {
    if (fileInput.files.length > 0) {
        document.getElementById('content-file-name').textContent = fileInput.files[0].name;
    }
});

// --- 4. Chọn thư mục Video ---
btnSelectVideo.addEventListener('click', async () => {
    const dirPath = await window.api.selectFolder();
    if (dirPath) {
        txtDirPath.textContent = "Thư mục: " + dirPath;
        const videos = await window.api.readVideos(dirPath);
        if (videos.error) {
            alert("Lỗi đọc Thư mục Video: " + videos.error);
            return;
        }
        videosList = videos;
        txtVideoCount.textContent = videos.length;
    }
});

// --- 5. Lên trình (Tự ghép kh�i Video - Content) ---
btnGenerate.addEventListener('click', () => {
    if (contentsList.length === 0) return alert("Chưa có Content! Vui lòng ấn Phân Tích Content.");
    if (videosList.length === 0) return alert("Chưa có Video! Vui lòng ấn Chọn Thư mục Video.");

    // Ghép s� lượng min (Giữa content và video)
    const matchCount = Math.min(contentsList.length, videosList.length);
    scheduleQueue = [];

    // Lấy config
    const postsPerDay = parseInt(inputPostsPerDay.value);
    const isRandom = chkRandomTime.checked;
    const time1 = inputStartTime.value; // "08:00"
    const time2 = inputSecondTime.value;

    // Đọc danh sách comment
    const commentRaw = document.getElementById('comment-paste') ? document.getElementById('comment-paste').value.trim() : '';
    let commentsList = [];
    if (commentRaw !== '') {
        commentsList = commentRaw.split('\n').filter(c => c.trim() !== '');
    }

    // Create flattened targets from profiles list: 
    // It maps through all profiles, and gathers all lines of fanpage links into a single array of pairs: [{profileName, targetUrl}]
    let flattenedTargets = [];
    if (profilesList.length === 0) {
        flattenedTargets.push({ profileName: "Profile_Default", targetUrl: "https://www.facebook.com/" });
    } else {
        profilesList.forEach(p => {
            const links = p.targetLinks.split('\n').map(l => l.trim()).filter(l => l !== '');
            if (links.length === 0) {
                flattenedTargets.push({ profileName: p.profileName, targetUrl: "https://www.facebook.com/" });
            } else {
                links.forEach(l => {
                    flattenedTargets.push({ profileName: p.profileName, targetUrl: l });
                });
            }
        });
    }

    let currentDate = new Date(); // Start from today
    let currentPostOfDay = 0;

    for (let i = 0; i < matchCount; i++) {
        const content = contentsList[i];
        const video = videosList[i];
        const comment = (commentsList.length > 0) ? (commentsList[i] || '') : '';

        const activeLinkIndex = i % flattenedTargets.length;
        const targetPair = flattenedTargets[activeLinkIndex];
        const targetUrl = targetPair.targetUrl;
        const targetProfile = targetPair.profileName;

        // Calculate which post of the day this is specifically for this target
        // A single "day wave" consumes (flattenedTargets.length) items for EACH post order
        // So a full cycle for a day consumes: flattenedTargets.length * postsPerDay
        const postsInOneDay = flattenedTargets.length * postsPerDay;
        const indexInCurrentDay = i % postsInOneDay;

        const timeSlotIndex = Math.floor(indexInCurrentDay / flattenedTargets.length);

        let baseTime = timeSlotIndex === 0 ? time1 : time2;
        let [hh, mm] = baseTime.split(':').map(Number);

        if (isRandom) {
            // Random +- 30 minutes from base time
            const offsetMs = (Math.random() - 0.5) * 60 * 60 * 1000;
            const d = new Date(currentDate);
            d.setHours(hh, mm, 0, 0);
            d.setTime(d.getTime() + offsetMs);
            hh = d.getHours();
            mm = d.getMinutes();
        }

        const scheduleDate = new Date(currentDate);
        scheduleDate.setHours(hh, mm, 0, 0);

        scheduleQueue.push({
            id: i + 1,
            content: content,
            video: video.name,
            videoPath: video.path,
            comment: comment,
            targetUrl: targetUrl,
            profileName: targetProfile,
            timestamp: scheduleDate.getTime(), // Save as timestamp for easy comparison
            displayTime: scheduleDate.toLocaleString('vi-VN', { hour12: false }),
            status: 'WAIT' // WAIT, ERROR, POSTED
        });

        // Advance to the next day when a full 'day block' is filled
        if (indexInCurrentDay === postsInOneDay - 1) {
            currentDate.setDate(currentDate.getDate() + 1);
        }
    }

    renderTable();
    saveQueueData();
});

// --- 6. HiỒn th�9 Bảng ---
function renderTable() {
    badgeQueue.textContent = `${scheduleQueue.length} Bài viết`;
    tbody.innerHTML = '';

    if (scheduleQueue.length === 0) {
        tbody.innerHTML = `<tr class="empty-row"><td colspan="6">Chưa có dữ li�!u.</td></tr>`;
        return;
    }

    scheduleQueue.forEach((item, index) => {
        const tr = document.createElement('tr');
        if (item.status === 'ERROR') tr.classList.add('row-error');

        let statusHtml = '';
        if (item.status === 'WAIT') statusHtml = `<span class="status-wait">Đang chờ đăng</span>`;
        if (item.status === 'PROCESSING') statusHtml = `<span style="color:var(--primary); font-weight:bold;">Đang điều khiển Bot...</span>`;
        if (item.status === 'ERROR') statusHtml = `<span class="status-error">Quá thời gian (Need Push)</span>`;
        if (item.status === 'POSTED') statusHtml = `<span style="color:var(--success)">Đã đăng thành công</span>`;

        // Chuyển timestamp sang định dạng YYYY-MM-DDThh:mm chuẩn cho input HTML5
        const dateObj = new Date(item.timestamp);
        const tzOffset = dateObj.getTimezoneOffset() * 60000;
        const localISOTime = (new Date(dateObj - tzOffset)).toISOString().slice(0, 16);

        const displayTarget = `[${item.profileName}] ` + (item.targetUrl || 'Mặc ��9nh');

        tr.innerHTML = `
            <td>${item.id}</td>
            <td><div class="truncate-text" title="${item.content}">${item.content}</div></td>
            <td>${item.video}</td>
            <td><div class="truncate-text" title="${item.comment || ''}">${item.comment || ''}</div></td>
            <td><div class="truncate-text" style="color:var(--primary); font-size: 0.8rem;" title="${displayTarget}">${displayTarget}</div></td>
            <td>
                <input type="datetime-local" class="time-edit-input" data-id="${item.id}" value="${localISOTime}" style="background:var(--bg-dark); color:white; border:1px solid var(--border); padding:6px; border-radius:4px; font-family:inherit; width: 100%; min-width: 175px;">
            </td>
            <td class="status-cell">${statusHtml}</td>
            <td>
                <button class="btn btn-secondary btn-delete-row" data-id="${item.id}" style="padding: 6px 10px; font-size: 0.8rem; border-color: var(--danger); color: var(--danger);">Xóa</button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    // Thêm Event Listener cho Nút xóa
    document.querySelectorAll('.btn-delete-row').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(e.target.dataset.id);
            scheduleQueue = scheduleQueue.filter(item => item.id !== id);
            renderTable();
            saveQueueData();
        });
    });

    // Thêm Event Listener cho ô Đ�?i thời gian
    document.querySelectorAll('.time-edit-input').forEach(input => {
        input.addEventListener('change', (e) => {
            const id = parseInt(e.target.dataset.id);
            const newValue = e.target.value; // YYYY-MM-DDThh:mm
            const targetItem = scheduleQueue.find(item => item.id === id);

            if (targetItem && newValue) {
                const newDate = new Date(newValue);
                targetItem.timestamp = newDate.getTime();
                targetItem.displayTime = newDate.toLocaleString('vi-VN', { hour12: false });

                // Nếu nâng thời gian thành tương lai thì Xóa l�i
                if (targetItem.status === 'ERROR' && newDate.getTime() > new Date().getTime()) {
                    targetItem.status = 'WAIT';
                }

                renderTable();
                saveQueueData();
            }
        });
    });
}

// --- 7. Chronological Checker (Tick logic) ---
async function checkScheduleQueue(now) {
    if (scheduleQueue.length === 0) return;
    const nowTs = now.getTime();
    let hasChanges = false;

    // Core Engine - KiỒm tra xem có bài nào �ến hạn không
    if (isAutoRunning && !isPublishing) {
        // Tìm 1 bài viết trong Queue có trạng thái WAIT hoặc ERROR và có Thời gian lập l�9ch bé hơn thời gian hi�!n tại
        const pendingPost = scheduleQueue.find(item => (item.status === 'WAIT' || item.status === 'ERROR') && nowTs >= item.timestamp);

        if (pendingPost) {
            isPublishing = true;
            pendingPost.status = 'PROCESSING';
            renderTable();
            saveQueueData();

            // Lấy profile Mặc ��9nh từ ô nhập �x trang Quản lý
            const pName = pendingPost.profileName || 'Profile_Default';

            try {
                const payload = {
                    profileName: pName,
                    content: pendingPost.content,
                    videoPath: pendingPost.videoPath,
                    targetUrl: pendingPost.targetUrl,
                    comment: pendingPost.comment
                };

                // Gọi API sang main.js �Ồ bật Playwright (headless=false �Ồ d�& xem trong thời gian �ầu)
                const isSuccess = await window.api.startPosting(payload);

                if (isSuccess === true) {
                    pendingPost.status = 'POSTED';
                } else {
                    pendingPost.status = 'ERROR'; // B�9 l�i hoặc fail �x �âu �ó
                }
            } catch (e) {
                console.error(e);
                pendingPost.status = 'ERROR';
            }

            isPublishing = false;
            hasChanges = true;
        }
    }

    if (isAutoRunning && isFullAutoSequence && !isPublishing && !isInteractionLinked) {
        const hasPending = scheduleQueue.some(item => item.status === 'WAIT' || item.status === 'PROCESSING');
        if (!hasPending) {
            isInteractionLinked = true;
            console.log("Danh sách đăng đã hoàn tất! Chuyển giao sang chế độ Tương Tác Dạo...");
            const btnInter = document.getElementById('btn-start-interaction');
            if (btnInter && !btnInter.classList.contains('hidden')) {
                btnInter.click();
            }

            // Sync outer UI
            const btnSEngine = document.getElementById('btn-start-engine');
            if (btnSEngine) {
                btnSEngine.textContent = "ĐANG TƯƠNG TÁC (CLICK ĐỂ DỪNG TOÀN BỘ)";
            }
            const btnPO = document.getElementById('btn-start-posting-only');
            if (btnPO) {
                btnPO.textContent = "BẮT ĐẦU ĐĂNG BÀI";
                btnPO.classList.add('btn-primary');
                btnPO.style.background = "";
            }
        }
    }

    // KiỒm tra báo �ỏ các bài quá hạn nếu không bật chế ��" chạy auto
    profilesList.forEach(item => {
        if (item.status === 'WAIT' && !isAutoRunning) {
            // Nếu thời gian hi�!n tại �ã vượt qua thời gian dự kiến �Ēng (quá 1 phút) mà k chạy
            if (nowTs > item.timestamp + 60000) {
                item.status = 'ERROR'; // Báo l�i quá hạn
                hasChanges = true;
            }
        }
    });

    if (hasChanges) {
        renderTable();
        saveQueueData();
    }
}

// --- 8. Navigation (Sidebar) ---
const navItems = document.querySelectorAll('.nav-item');
const viewSections = document.querySelectorAll('.view-section');

navItems.forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        // Xóa active cũ
        navItems.forEach(nav => nav.classList.remove('active'));
        // Ẩn tất cả view
        viewSections.forEach(view => view.classList.add('hidden'));

        // Kích hoạt view m�:i
        item.classList.add('active');
        const targetId = item.getAttribute('data-target');
        if (targetId) {
            const targetView = document.getElementById(targetId);
            if (targetView) targetView.classList.remove('hidden');
        }
    });
});


// --- 10. Start Auto Engine ---
function updateEngineUI(running, isFull) {
    isAutoRunning = running;
    isFullAutoSequence = running ? isFull : false;

    const btnStartEngine = document.getElementById('btn-start-engine');
    const btnStartPostingOnly = document.getElementById('btn-start-posting-only');

    if (isAutoRunning) {
        isInteractionLinked = false;
        if (isFull) {
            // Chế độ gộp: Nút to ngoài đổi màu, nút nhỏ đứng yên
            if (btnStartEngine) {
                btnStartEngine.textContent = "ĐANG CHẠY AUTO (CLICK ĐỂ DỪNG)";
                btnStartEngine.classList.remove('btn-primary');
                btnStartEngine.style.background = "var(--danger)";
                btnStartEngine.style.boxShadow = "0 4px 10px rgba(239, 68, 68, 0.4)";
            }
            if (btnStartPostingOnly) {
                btnStartPostingOnly.textContent = "BẮT ĐẦU ĐĂNG BÀI (Đang bận)";
                btnStartPostingOnly.classList.remove('btn-primary');
                btnStartPostingOnly.style.background = "";
                btnStartPostingOnly.style.color = "var(--success)";
                btnStartPostingOnly.disabled = true;
                btnStartPostingOnly.style.opacity = "0.5";
            }
        } else {
            // Chế độ đăng đơn lẻ: Nút nhỏ đổi màu, nút to kệ nó
            if (btnStartEngine) {
                btnStartEngine.textContent = "BẮT ĐẦU CHẠY AUTO (Đang bận)";
                btnStartEngine.classList.add('btn-primary');
                btnStartEngine.style.background = "";
                btnStartEngine.style.boxShadow = "";
                btnStartEngine.disabled = true;
                btnStartEngine.style.opacity = "0.5";
            }
            if (btnStartPostingOnly) {
                btnStartPostingOnly.textContent = "ĐANG ĐĂNG BÀI (CLICK ĐỂ DỪNG)";
                btnStartPostingOnly.classList.remove('btn-primary');
                btnStartPostingOnly.style.background = "var(--danger)";
                btnStartPostingOnly.style.color = "white";
                btnStartPostingOnly.disabled = false;
                btnStartPostingOnly.style.opacity = "1";
            }
        }
    } else {
        // Tắt toàn bộ hệ thống
        if (btnStartEngine) {
            isInteractionLinked = false;
            btnStartEngine.textContent = "BẮT ĐẦU CHẠY AUTO";
            btnStartEngine.classList.add('btn-primary');
            btnStartEngine.style.background = "";
            btnStartEngine.style.boxShadow = "";
            btnStartEngine.disabled = false;
            btnStartEngine.style.opacity = "1";
        }
        if (btnStartPostingOnly) {
            btnStartPostingOnly.textContent = "BẮT ĐẦU ĐĂNG BÀI";
            btnStartPostingOnly.classList.add('btn-primary');
            btnStartPostingOnly.style.background = "";
            btnStartPostingOnly.style.color = "white";
            btnStartPostingOnly.disabled = false;
            btnStartPostingOnly.style.opacity = "1";
        }
    }
}

if (btnStartEngine) {
    btnStartEngine.addEventListener('click', () => {
        const turnOn = !isAutoRunning;
        updateEngineUI(turnOn, true);
        if (!turnOn) {
            // Tắt luôn interaction ngầm nếu đang chạy
            const btnStopInter = document.getElementById('btn-stop-interaction');
            if (btnStopInter && !btnStopInter.classList.contains('hidden')) {
                btnStopInter.click();
            }
        }
    });
}
const btnStartPostingOnlyId = document.getElementById('btn-start-posting-only');
if (btnStartPostingOnlyId) {
    btnStartPostingOnlyId.addEventListener('click', () => {
        const turnOn = !isAutoRunning;
        updateEngineUI(turnOn, false);
        if (!turnOn) {
            const btnStopInter = document.getElementById('btn-stop-interaction');
            if (btnStopInter && !btnStopInter.classList.contains('hidden')) btnStopInter.click();
        }
    });
}

// --- 11. Bắt �ầu Tương Tác Dạo (Seeding) ---
const btnStartInteraction = document.getElementById('btn-start-interaction');
const btnPauseInteraction = document.getElementById('btn-pause-interaction');
const btnStopInteraction = document.getElementById('btn-stop-interaction');
let isInteractionPaused = false;

if (btnStartInteraction) {
    btnStartInteraction.addEventListener('click', async () => {
        const apiKey = document.getElementById('api-gemini-key').value.trim();
        const keywords = document.getElementById('interaction-keywords').value.trim();

        if (!apiKey) {
            return alert("Vui lòng nhập Gemini API Key.");
        }
        if (profilesList.length === 0) {
            return alert("Vui lòng cấu hình ít nhất 1 Profile ở tab Quản Lý Profile trước khi bắt đầu tương tác.");
        }

        const timeMin = parseInt(document.getElementById('time-min').value) || 15;
        const timeMax = parseInt(document.getElementById('time-max').value) || 30;
        const postsMin = parseInt(document.getElementById('posts-min').value) || 3;
        const postsMax = parseInt(document.getElementById('posts-max').value) || 5;

        // Cập nhật UI
        btnStartInteraction.classList.add('hidden');
        btnPauseInteraction.classList.remove('hidden');
        btnStopInteraction.classList.remove('hidden');
        isInteractionPaused = false;
        btnPauseInteraction.textContent = "TẠM DỪNG";

        try {
            await window.api.startInteraction({
                profilesList,
                apiKey,
                keywords,
                timeMin,
                timeMax,
                postsMin,
                postsMax
            });
            alert("Đã hoàn tất quá trình tương tác cho toàn bộ danh sách Profile!");
        } catch (e) {
            console.error(e);
            if (e.message && !e.message.includes("Interaction stopped by user")) {
                alert("Dịch vụ tương tác gặp lỗi: " + e.message);
            }
        } finally {
            // Restore UI
            btnStartInteraction.classList.remove('hidden');
            btnPauseInteraction.classList.add('hidden');
            btnStopInteraction.classList.add('hidden');
        }
    });
}

if (btnPauseInteraction) {
    btnPauseInteraction.addEventListener('click', async () => {
        isInteractionPaused = !isInteractionPaused;
        if (isInteractionPaused) {
            btnPauseInteraction.textContent = "TIẾP TỤC";
            btnPauseInteraction.style.background = "var(--success)";
            await window.api.pauseInteraction();
        } else {
            btnPauseInteraction.textContent = "TẠM DỪNG";
            btnPauseInteraction.style.background = "var(--warning)";
            await window.api.resumeInteraction();
        }
    });
}

if (btnStopInteraction) {
    btnStopInteraction.addEventListener('click', async () => {
        const confirmStop = confirm("Chắc chắn muốn hành động không?");
        if (confirmStop) {
            await window.api.stopInteraction();
        }
    });
}


// B?t log t? main process v� hi?n th? l�n UI
if (window.api && window.api.onBackendLog) {
    window.api.onBackendLog((msg) => {
        const termContent = document.getElementById('live-terminal-content');
        if (termContent) {
            const line = document.createElement('div');
            line.textContent = '> ' + msg;
            termContent.appendChild(line);
            termContent.scrollTop = termContent.scrollHeight;
        }
    });
}


// --- 12. Xử lý UI Khung API Key ---
document.addEventListener('DOMContentLoaded', () => {
    const toggleApiVis = document.getElementById('toggle-api-visibility');
    const toggleApiSize = document.getElementById('toggle-api-size');
    const apiInput = document.getElementById('api-gemini-key');

    if (toggleApiVis && apiInput) {
        toggleApiVis.addEventListener('click', () => {
            if (apiInput.style.webkitTextSecurity === 'none') {
                apiInput.style.webkitTextSecurity = 'disc';
            } else {
                apiInput.style.webkitTextSecurity = 'none';
            }
        });
    }

    if (toggleApiSize && apiInput) {
        toggleApiSize.addEventListener('click', () => {
            if (!apiInput.style.height || apiInput.style.height === '70px') {
                apiInput.style.height = '300px';
            } else {
                apiInput.style.height = '70px';
            }
        });
    }
});



// --- MỚI: QUẢN LÝ GIAO DIỆN GEMINI API KEY NÂNG CAO ---
const apiKeysWrapper = document.getElementById('gemini-keys-wrapper');
const btnAddKeyRow = document.getElementById('btn-add-gemini-key');
const btnCheckApiKeys = document.getElementById('btn-check-api-keys');
const rawApiTextArea = document.getElementById('api-gemini-key');

if (apiKeysWrapper && rawApiTextArea) {
    function renderKeyRows() {
        // Fallback an toàn cho lần load đầu
        const lines = rawApiTextArea.value.split('\n').map(l => l.trim()).filter(l => l !== '');
        if (lines.length === 0) lines.push(''); // Ít nhất 1 ô trống

        apiKeysWrapper.innerHTML = '';
        lines.forEach(key => {
            appendKeyRow(key);
        });
    }

    function appendKeyRow(keyValue) {
        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.alignItems = 'center';
        row.style.gap = '10px';

        const dot = document.createElement('div');
        dot.style.width = '12px';
        dot.style.height = '12px';
        dot.style.borderRadius = '50%';
        dot.style.background = 'gray';
        dot.style.boxShadow = '0 0 5px rgba(0,0,0,0.5)';
        dot.style.transition = 'all 0.3s ease';
        dot.className = 'api-status-dot';

        const input = document.createElement('input');
        input.type = 'text';
        input.value = keyValue;
        input.placeholder = 'Nhập Gemini API Key...';
        input.style.flex = '1';
        input.style.fontFamily = 'monospace';
        input.style.webkitTextSecurity = "disc";
        input.style.padding = "5px 10px";
        input.style.background = "var(--bg-dark)";
        input.style.border = "1px solid var(--border)";
        input.style.color = "var(--text)";
        input.className = 'api-key-input-row';

        const percentText = document.createElement('span');
        percentText.textContent = '-- %';
        percentText.style.color = '#ffeb3b';
        percentText.style.fontSize = '13px';
        percentText.style.whiteSpace = 'nowrap';
        percentText.style.width = '65px';
        percentText.style.textAlign = 'right';
        percentText.className = 'api-percent-label';

        const btnDel = document.createElement('button');
        btnDel.textContent = 'X';
        btnDel.style.background = 'transparent';
        btnDel.style.color = 'var(--danger)';
        btnDel.style.border = 'none';
        btnDel.style.cursor = 'pointer';
        btnDel.style.fontWeight = 'bold';
        btnDel.style.padding = '0 5px';

        btnDel.onclick = () => {
            row.remove();
            syncToTextArea();
        };

        input.oninput = () => {
            dot.style.background = 'gray'; // Reset về chưa check
            dot.style.boxShadow = '0 0 5px rgba(0,0,0,0.5)';
            percentText.textContent = '-- %';
            percentText.style.color = '#ffeb3b';
            syncToTextArea();
        };

        row.appendChild(dot);
        row.appendChild(input);
        row.appendChild(percentText);
        row.appendChild(btnDel);
        apiKeysWrapper.appendChild(row);
    }

    function syncToTextArea() {
        const inputs = Array.from(apiKeysWrapper.querySelectorAll('.api-key-input-row'));
        const lines = inputs.map(inp => inp.value.trim()).filter(v => v !== '');
        rawApiTextArea.value = lines.join('\n');
        // Kích hoạt luôn sự kiện input nội bộ của thẻ textarea để store.js save
        rawApiTextArea.dispatchEvent(new Event('input', { bubbles: true }));
    }

    if (btnAddKeyRow) {
        btnAddKeyRow.onclick = () => {
            appendKeyRow('');
            syncToTextArea();
            apiKeysWrapper.scrollTop = apiKeysWrapper.scrollHeight;
        };
    }

    if (btnCheckApiKeys) {
        btnCheckApiKeys.onclick = async () => {
            const rows = Array.from(apiKeysWrapper.children);
            let hasChecked = false;
            for (let row of rows) {
                const inp = row.querySelector('.api-key-input-row');
                const dot = row.querySelector('.api-status-dot');
                const lbl = row.querySelector('.api-percent-label');
                const key = inp.value.trim();

                if (!key) continue;
                lbl.textContent = 'Đang check...';
                lbl.style.color = 'cyan';
                hasChecked = true;

                try {
                    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ contents: [{ parts: [{ text: "1" }] }] })
                    });

                    if (res.ok) {
                        dot.style.background = '#f44336'; // Hoạt động = CHẤM ĐỎ NGẦU (Tuyệt đối theo Y/C user)
                        dot.style.boxShadow = '0 0 10px #f44336';
                        lbl.textContent = '0% (Tốt)';
                        lbl.style.color = '#f44336';
                    } else {
                        const data = await res.json();
                        dot.style.background = '#e91e63'; // Sập = CHẤM HỒNG (Theo y/c user)
                        dot.style.boxShadow = '0 0 10px #e91e63';
                        lbl.textContent = '100% (Sập)';
                        lbl.style.color = '#e91e63';
                    }
                } catch (e) {
                    dot.style.background = '#e91e63';
                    dot.style.boxShadow = '0 0 10px #e91e63';
                    lbl.textContent = 'Lỗi Mạng';
                    lbl.style.color = '#e91e63';
                }
            }
            if (!hasChecked) {
                alert("Vui lòng điền ít nhất 1 Key để kiểm tra!");
            }
        };
    }

    // Đợi tí cho config.json nạp xog thì ms render
    setTimeout(() => {
        renderKeyRows();
    }, 1000);
}

