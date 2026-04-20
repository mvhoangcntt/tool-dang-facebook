const fs = require('fs');
let c = fs.readFileSync('assets/js/renderer.js', 'utf8');

const ix1 = c.indexOf('btnStartInteraction.addEventListener');
const ix2 = c.indexOf('} finally {', ix1);

if(ix1 > -1 && ix2 > -1) {
    let oldBlock = c.substring(ix1, ix2 + 11);
    
    let newBlock = "btnStartInteraction.addEventListener('click', async () => {\n" +
"        const apiKey = document.getElementById('api-gemini-key').value.trim();\n" +
"        const keywords = document.getElementById('interaction-keywords').value.trim();\n" +
"        const interactionLinks = document.getElementById('interaction-links').value.trim();\n" +
"        \n" +
"        if (!apiKey) {\n" +
"            return alert('Vui lòng nh?p Gemini API Key d? c?u hình AI comment!');\n" +
"        }\n" +
"        if (!interactionLinks) {\n" +
"            return alert('Vui lòng nh?p Link Ði Tuong Tác!');\n" +
"        }\n" +
"\n" +
"        const timeMin = parseInt(document.getElementById('time-min').value) || 15;\n" +
"        const timeMax = parseInt(document.getElementById('time-max').value) || 30;\n" +
"        const postsMin = parseInt(document.getElementById('posts-min').value) || 3;\n" +
"        const postsMax = parseInt(document.getElementById('posts-max').value) || 5;\n" +
"\n" +
"        // C?p nh?t UI\n" +
"        btnStartInteraction.classList.add('hidden');\n" +
"        btnPauseInteraction.classList.remove('hidden');\n" +
"        btnStopInteraction.classList.remove('hidden');\n" +
"        isInteractionPaused = false;\n" +
"        btnPauseInteraction.textContent = \"T?M D?NG\";\n" +
"\n" +
"        try {\n" +
"            await window.api.startInteraction({\n" +
"                apiKey,\n" +
"                keywords,\n" +
"                interactionLinks,\n" +
"                timeMin,\n" +
"                timeMax,\n" +
"                postsMin,\n" +
"                postsMax\n" +
"            });\n" +
"            alert(\"Ðã k?t thúc phiên tuong tác d?o!\");\n" +
"        } catch (e) {\n" +
"            console.error(e);\n" +
"            if(e.message && !e.message.includes(\"Interaction stopped by user\")) {\n" +
"                alert(\"Có l?i x?y ra: \" + e.message);\n" +
"            }\n" +
"        } finally {";
    
    c = c.replace(oldBlock, newBlock);
    fs.writeFileSync('assets/js/renderer.js', c, 'utf8');
}
