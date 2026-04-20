const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    // Files & Directories
    selectFolder: () => ipcRenderer.invoke('select-folder'),
    readVideos: (dirPath) => ipcRenderer.invoke('read-videos', dirPath),
    
    // Store & Config
    saveTableData: (data) => ipcRenderer.invoke('save-table-data', data),
    getTableData: () => ipcRenderer.invoke('get-table-data'),
    saveConfig: (config) => ipcRenderer.invoke('save-config', config),
    getConfig: () => ipcRenderer.invoke('get-config'),
    
    // Playwright Tasks
    openProfile: (profileName) => ipcRenderer.invoke('open-profile', profileName),
    startPosting: (payload) => ipcRenderer.invoke('start-posting', payload),
    startInteraction: (settings) => ipcRenderer.invoke('start-interaction', settings),
    pauseInteraction: () => ipcRenderer.invoke('pause-interaction'),
    resumeInteraction: () => ipcRenderer.invoke('resume-interaction'),
    stopInteraction: () => ipcRenderer.invoke('stop-interaction'),
    
    // System Utilities
    onBackendLog: (callback) => ipcRenderer.on('backend-log', (event, msg) => callback(msg)),
    onInteractionProfileComplete: (callback) => ipcRenderer.on('interaction-profile-complete', (event, pIdx) => callback(pIdx))
});
