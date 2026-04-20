const fs = require('fs');
let js = fs.readFileSync('assets/js/renderer.js', 'utf8');

// The block to replace:
/*
if (btnStartInteraction) {
...
}
*/

const blockStart = `if (btnStartInteraction) {`;
const blockEnd = `if (btnPauseInteraction) {`;

const startIndex = js.indexOf(blockStart);
const endIndex = js.indexOf(blockEnd);

if (startIndex !== -1 && endIndex !== -1) {
    const newBlock = `if (btnStartInteraction) {
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

`;
    js = js.substring(0, startIndex) + newBlock + js.substring(endIndex);
    fs.writeFileSync('assets/js/renderer.js', js, 'utf8');
    console.log("Successfully replaced btnStartInteraction block.");
} else {
    console.log("Could not find blocks.");
}
