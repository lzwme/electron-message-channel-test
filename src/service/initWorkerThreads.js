/*
 * @Author: lzw
 * @Date: 2022-01-28 10:11:49
 * @LastEditors: lzw
 * @LastEditTime: 2022-01-28 15:22:01
 * @Description: worker_threads 工作线程性能测试
 */
// @ts-check

// 通过 ipc 方式控制启动
const WT = require('worker_threads');

if (!WT.isMainThread) {
    WT.parentPort.on('message', (data) => {
        if (WT.workerData.isDebug) console.log(data);
        WT.parentPort.postMessage(data);
    });
} else {
    const electron = require('electron');

    if (process.type === 'browser') {
        const task = require('./task');
        const worker = new WT.Worker(__filename, { workerData: { isDebug: task.config.debug }});

        function initWorkerThreads() {
            let uuid = 0;
            const request = (data, evName = '') => {
                return new Promise(resolve => {
                    const isReply = !!evName;
                    if (!evName) evName = `processfork_${uuid++}`;
                    if (isReply) resolve();
                    else task.eventBus.once(evName, (data) => resolve(data));
                    worker.postMessage({ evName, data, isReply });
                });
            }
            // 收到消息回复
            worker.on('message', (info) => {
                if (typeof info.data === 'string') JSON.parse(info.data); // string 解析时间也要计算
                if (task.config.debug) console.log('[MessageChannnelMain][req]onmessage', info.evName, info.data);
                task.eventBus.emit(info.evName, info.data);
            });

            return request;
        }

        const workerThreadsRequest = initWorkerThreads();
        const runTestworkerThreads = () => task.runTaskTest(workerThreadsRequest, 'workerThreadsRequest');

        electron.ipcMain.handle('workerThreadsRequest', (_ev, ...args) => workerThreadsRequest(...args));
        electron.ipcMain.handle('runTestworkerThreads', (_ev, cfg) => {
            if (cfg) Object.assign(task.config, cfg);
            return runTestworkerThreads();
        });
    } else if (process.type === 'renderer') {
        exports.workerThreadsRequest = () => {
            task.setRuning(true);
            return electron.ipcRenderer.invoke('workerThreadsRequest').then((result) => {
                task.setRuning(false);
                return result;
            });
        };
        exports.runTestworkerThreads = () => {
            task.setRuning(true);
            return electron.ipcRenderer.invoke('runTestworkerThreads', task.config).then((result) => {
                task.setRuning(false);
                return result;
            });
        };
    }
}
