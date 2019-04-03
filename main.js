const {app, ipcMain, BrowserWindow} = require('electron');
const {autoUpdater} = require('electron-updater');
const log = require('electron-log');
const path = require('path');
const url = require('url');
const isDev = require('electron-is-dev');

autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';
autoUpdater.autoDownload = false;

let mainWindow = null;
let filepath = null;
let ready = false;

if (process.platform === 'win32') {
    app.commandLine.appendSwitch('high-dpi-support', 'true');
    app.commandLine.appendSwitch('force-device-scale-factor', '1');
}

const createWindow = () => {
    // const {width, height} = electron.screen.getPrimaryDisplay().workAreaSize;
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 768,
        show: false
    });

    let indexPath;

    if (isDev) {
        indexPath = url.format({
            protocol: 'http:',
            host: 'localhost:8080',
            pathname: 'index.html',
            slashes: true
        });
    } else {
        indexPath = url.format({
            protocol: 'file:',
            pathname: path.join(__dirname, 'dist', 'index.html'),
            slashes: true
        });
    }

    mainWindow.loadURL(indexPath);

    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        if (isDev) {
            mainWindow.webContents.openDevTools(
                {mode: 'detach'}
            );
        }
    });

    mainWindow.webContents.on('did-finish-load', () => {
        if (filepath) {
            mainWindow.webContents.send('open-file', filepath);
            filepath = null;
        }
    });

    ready = true;

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
};

// app.commandLine.appendSwitch("--disable-http-cache");

app.on('ready', () => {
    createWindow();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});

app.on('open-file', (event, qoboPath) => {
    event.preventDefault();
    filepath = qoboPath;

    if (ready) {
        mainWindow.webContents.send('open-file', filepath);
        filepath = null;
        return;
    }
});

const sendUpdateMessage = data => {
    mainWindow.webContents.send('checkUpdate', data);
};

autoUpdater.on('update-available', info => {
    const data = {
        key: 'updateAvailable',
        info: info
    };
    log.info(`update-available: ${data}`);
    sendUpdateMessage(data);
});

autoUpdater.on('update-not-available', info => {
    const data = {
        key: 'updateNotAvailable',
        info: info
    };
    log.info(`update-not-available: ${data}`);
    sendUpdateMessage(data);
});

autoUpdater.on('error', info => {
    const data = {
        key: 'error',
        info: info
    };
    sendUpdateMessage(data);
});

ipcMain.on('checkForUpdates', () => {
    if (isDev) {
        console.log('Can not work in development.');
    } else {
        autoUpdater.checkForUpdates();
    }
});
