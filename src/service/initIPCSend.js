// @ts-check
const electron = require('electron');
const task = require('./task');
const msgTopic = task.constants.msgTopic + '-send';
// 主进程
if (process.type === 'browser') {
    console.log('init ipcsend envet')
    electron.ipcMain.setMaxListeners(0);
    electron.ipcMain.on(msgTopic, (ev, info) => {
      ev.sender.send(msgTopic, info); // 回复消息
    });
} else {
    electron.ipcRenderer.setMaxListeners(0);

    async function initIPCSend() {
        let uuid = 0;
        const request = (data, evName = '') => {
            return new Promise(resolve => {
              const isReply = !!evName;
                if (!evName) evName = `mcm_${uuid++}`;
                if (isReply) resolve();
                else task.eventBus.once(evName, (data) => resolve(data));
                electron.ipcRenderer.send(msgTopic , { evName, data, isReply });
            });
        }
        // 收到消息回复
        electron.ipcRenderer.on(msgTopic, (event, info) => {
          const { evName, data, isReply } = info;
            if (typeof data === 'string') JSON.parse(data); // string 解析时间也要计算
            if (task.config.debug) console.log('[MessageChannnelMain][req]onmessage', evName, data, isReply);
            task.eventBus.emit(evName, data);
        });

        exports.ipcSendRequest = globalThis.ipcSendRequest = request;
        return request;
    }

    initIPCSend();
    exports.runTestIPCSend = () => task.runTaskTest(globalThis.ipcSendRequest, 'ipc.send');
}
