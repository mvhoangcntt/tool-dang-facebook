const fs = require('fs');
let content = fs.readFileSync('assets/js/renderer.js', 'utf8');

// The faulty string is just "        tr.innerHTML = `        `;\r\n        tbody.appendChild(tr);"
// Let's replace it structurally.

const badBlock = `        tr.innerHTML = \`
        \`;
        tbody.appendChild(tr);`;

const correctBlock = `        tr.innerHTML = \`
            <td>\${item.id}</td>
            <td><div class="truncate-text" title="\${item.content}">\${item.content}</div></td>
            <td>\${item.video}</td>
            <td><div class="truncate-text" title="\${item.comment || ''}">\${item.comment || ''}</div></td>
            <td><div class="truncate-text" style="color:var(--primary); font-size: 0.8rem;" title="\${displayTarget}">\${displayTarget}</div></td>
            <td>
                <input type="datetime-local" class="time-edit-input" data-id="\${item.id}" value="\${localISOTime}" style="background:var(--bg-dark); color:white; border:1px solid var(--border); padding:6px; border-radius:4px; font-family:inherit; width: 100%; min-width: 175px;">
            </td>
            <td class="status-cell">\${statusHtml}</td>
            <td>
                <button class="btn btn-secondary btn-delete-row" data-id="\${item.id}" style="padding: 6px 10px; font-size: 0.8rem; border-color: var(--danger); color: var(--danger);">Xóa</button>
            </td>
        \`;
        tbody.appendChild(tr);`;

content = content.replace(badBlock, correctBlock);
// Fallback in case of different line endings
content = content.replace(/tr\.innerHTML = `[\r\n\s]*`;[\r\n\s]*tbody\.appendChild\(tr\);/m, correctBlock);

fs.writeFileSync('assets/js/renderer.js', content, 'utf8');
console.log("Restored tr.innerHTML block safely.");
