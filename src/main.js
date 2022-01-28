// Modules to control application life and create native browser window
const {
    app,
    BrowserWindow,
    ipcMain
} = require('electron')
const path = require('path')

require('./service/initMessageChannelMain');
require('./service/initIPCSend');
require('./service/initWorkerThreads');

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: false,
            nodeIntegration: true,
            // webSecurity: false,
        }
    })

    mainWindow.loadFile('index.html')

    const subWindow = new BrowserWindow({
        width: 1000,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: false,
            nodeIntegration: true,
            // webSecurity: false,
        }
    })

    subWindow.loadFile('index.html')

    ipcMain.on('getWebContentsId', (ev) => {
        ev.returnValue = {
            current: ev.sender.id,
            main: mainWindow.webContents.id,
            sub: subWindow.webContents.id
        };
    })

    BrowserWindow.getAllWindows().forEach(win => win.webContents.openDevTools())
}

app.whenReady().then(() => {
    createWindow()

    app.on('activate', function() {
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
})

app.on('window-all-closed', function() {
    if (process.platform !== 'darwin') app.quit()
})
