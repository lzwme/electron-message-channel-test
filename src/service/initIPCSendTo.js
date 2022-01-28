const task = require('./task');
const electron = require('electron');

function initSendTo() {
  const eventBus = task.eventBus;
  const msgTopic = task.constants.msgTopic + '-sendto';
  const cids = electron.ipcRenderer.sendSync('getWebContentsId');
  const toCid = cids.current ===cids.main ? cids.sub : cids.main;
  console.log('cids:', cids, 'sendTo Cid:', toCid);
  document.title += ` - ${cids.current}`;

  let uuid = 0;
  const request = (data, isReply = false) => {
    return new Promise(resolve => {
      const evName = `sendto_${uuid++}`;
      if (isReply) resolve();
      else eventBus.once(evName, (data) => resolve(data));
      electron.ipcRenderer.sendTo(toCid, msgTopic, evName, data, isReply);
    });
  }
  electron.ipcRenderer.setMaxListeners(0);
  electron.ipcRenderer.on(msgTopic, (_ev, evName, data, isReply) => {
    if (typeof data === 'string') JSON.parse(data); // string 解析时间也要计算
    if (task.config.debug) console.log('[sendTo]onmessage', evName, data, isReply);
    if (isReply) return eventBus.emit(evName, data);
    request(data, true);
  });

  return request;
}

exports.ipcSendToRequest = globalThis.ipcSendToRequest = initSendTo();
exports.runTestIPCSendTo = () => task.runTaskTest(globalThis.ipcSendToRequest, 'ipc.sendTo');
