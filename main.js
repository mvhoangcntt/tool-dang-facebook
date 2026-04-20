const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const Store = require('electron-store');

// Khởi tạo electron-store để lưu dữ liệu nội bộ
const store = new Store();

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 850,
    minWidth: 1000,
    minHeight: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    },
    autoHideMenuBar: true,
    backgroundColor: '#0d1117' // Màu nền dark mode chuẩn
  });

  mainWindow.loadFile('index.html');
}

// Chặn và gửi Log xuống GUI
const originalLog = console.log;
const originalError = console.error;
const originalWarn = console.warn;

function sendLogToGUI(...args) {
    if (mainWindow && !mainWindow.isDestroyed() && mainWindow.webContents) {
        const msg = args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' ');
        mainWindow.webContents.send('backend-log', msg);
    }
}

console.log = function(...args) {
    originalLog.apply(console, args);
    sendLogToGUI(...args);
};

console.error = function(...args) {
    originalError.apply(console, args);
    sendLogToGUI("[LỖI ĐỎ CẤP BÁCH]", ...args);
};

console.warn = function(...args) {
    originalWarn.apply(console, args);
    sendLogToGUI("[CẢNH BÁO]", ...args);
};

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// --- CÁC IPC HANDLERS CHO GIAO DIỆN KHÁCH ---

// Xử lý hộp thoại chọn thư mục
ipcMain.handle('select-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Chọn thư mục chứa Video',
    properties: ['openDirectory']
  });
  if (!result.canceled) {
    return result.filePaths[0];
  }
  return null;
});

// Quét thư mục lấy danh sách video
ipcMain.handle('read-videos', async (event, dirPath) => {
    try {
        const files = fs.readdirSync(dirPath);
        // Lọc ra các định dạng video
        const videoFiles = files.filter(f => f.match(/\.(mp4|avi|mov|mkv)$/i));
        return videoFiles.map(f => ({
            name: f,
            path: path.join(dirPath, f)
        }));
    } catch(err) {
        return { error: err.message };
    }
});

// Lưu thông tin bảng dữ liệu
ipcMain.handle('save-table-data', async (event, data) => {
    store.set('tableData', data);
    return true;
});

// Lấy thông tin bảng dữ liệu đã lưu
ipcMain.handle('get-table-data', async () => {
    return store.get('tableData') || [];
});

// Cập nhật cấu hình
ipcMain.handle('save-config', async (event, config) => {
    store.set('appConfig', config);
    return true;
});

// Lấy cấu hình
ipcMain.handle('get-config', async () => {
    return store.get('appConfig') || {};
});

// --- CÁC HÀM TỪ PLAYWRIGHT BOT ---
const { FacebookAutoBot } = require('./src/automation.js');
const bot = new FacebookAutoBot();

ipcMain.handle('open-profile', async (event, profileName) => {
    return await bot.openProfile(profileName);
});

ipcMain.handle('start-posting', async (event, payload) => {
    return await bot.postVideo(payload.profileName, payload.targetUrl, payload.content, payload.videoPath, payload.comment, false);
});

ipcMain.handle('start-interaction', async (event, settings) => {
    bot.onProfileComplete = (pIdx) => {
        if (!event.sender.isDestroyed()) {
            event.sender.send('interaction-profile-complete', pIdx);
        }
    };
    return await bot.startInteraction(settings);
});

ipcMain.handle('pause-interaction', async () => bot.pauseInteraction());
ipcMain.handle('resume-interaction', async () => bot.resumeInteraction());
ipcMain.handle('stop-interaction', async () => bot.stopInteraction());
