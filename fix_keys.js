const fs = require('fs');

// Update index.html
let html = fs.readFileSync('index.html', 'utf8');

const targetHtml = `                            <label>
                                Gemini API Key (Hỗ trợ nhập nhiều Key trên nhiều dòng)
                                <span id="toggle-api-visibility" style="cursor: pointer; color: #007bff; font-size: 13px; margin-left: 10px; font-weight: normal; user-select: none;">[👁 Hiển thị / Ẩn Key]</span>
                            </label>
                            <textarea id="api-gemini-key" placeholder="Nhập mỗi API Key trên một dòng...\\nKey 1...\\nKey 2..." rows="3" style="width: 100%; font-family: monospace; resize: vertical; -webkit-text-security: disc;"></textarea>`;

const newHtml = `                            <label style="display: flex; align-items: center; justify-content: space-between;">
                                <span>Gemini API Key (Hỗ trợ nhập nhiều Key trên nhiều dòng)</span>
                                <div>
                                    <span id="toggle-api-visibility" style="cursor: pointer; color: #007bff; font-size: 13px; margin-left: 10px; font-weight: normal; user-select: none;">[👁 Hiển thị / Ẩn Key]</span>
                                    <span id="toggle-api-size" style="cursor: pointer; color: #007bff; font-size: 13px; margin-left: 10px; font-weight: normal; user-select: none;">[↕ Thu nhỏ / Mở rộng]</span>
                                </div>
                            </label>
                            <textarea id="api-gemini-key" placeholder="Nhập mỗi API Key trên một dòng...\\nKey 1...\\nKey 2..." rows="3" style="width: 100%; font-family: monospace; resize: vertical; -webkit-text-security: disc; min-height: 70px; max-height: 500px; transition: height 0.3s;"></textarea>`;

html = html.replace(targetHtml, newHtml);

fs.writeFileSync('index.html', html, 'utf8');


// Append JS to renderer.js
const appendJs = `\n
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
`;

fs.appendFileSync('assets/js/renderer.js', appendJs, 'utf8');

console.log("Updated HTML and JS successfully!");
