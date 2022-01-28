/*
 * @Author: lzw
 * @Date: 2022-01-27 09:24:29
 * @LastEditors: lzw
 * @LastEditTime: 2022-01-28 10:09:40
 * @Description:
 */
// @ts-check
const electron = require('electron');

// 主进程
if (process.type === 'browser') {
    electron.ipcMain.on('getPort', (ev) => {
        const port = new electron.MessageChannelMain();
        electron.BrowserWindow.getAllWindows().forEach(win => {
            const id = win.webContents.id;
            if (id === 1) win.webContents.postMessage('port', null, [port.port1]);
            else if (id === 2) win.webContents.postMessage('port', null, [port.port2]);
        });
    });
} else {
    const task = require('./task');
    /** @type {MessagePort} */
    let port;
    electron.ipcRenderer.on('port', (e) => {
        if (port) port.close();
        port = e.ports[0];
        initMessageChannelMain();
    });

    electron.ipcRenderer.send('getPort');
    async function initMessageChannelMain() {
        let uuid = 0;
        const request = (data, evName = '') => {
            return new Promise(resolve => {
              const isReply = !!evName;
                if (!evName) evName = `mcm_${uuid++}`;
                if (isReply) resolve();
                else task.eventBus.once(evName, (data) => resolve(data));
                port.postMessage({ evName, data, isReply });
            });
        }
        port.onmessage = (event) => {
          const { evName, data, isReply } = event.data;
            if (typeof data === 'string') JSON.parse(data); // string 解析时间也要计算
            if (task.config.debug) console.log('[MessageChannnelMain][req]onmessage', evName, data, isReply);
            if (isReply) return task.eventBus.emit(evName, data);
            request(data, evName);
        };

        exports.messageChannelMainRequest = globalThis.messageChannelMainRequest = request;
        return request;
    }

    exports.runTestMessageChannelMain = () => task.runTaskTest(exports.messageChannelMainRequest, 'messageChannelMain');
}
