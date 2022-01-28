const task = require('./task');

function initBroadcastMessage() {
  const reqChannel = new BroadcastChannel(task.constants.msgTopic + '-bcm');

  let uuid = 0;
  const request = (data, evName = '') => {
    return new Promise(resolve => {
      const isReply = !!evName;
      if (!evName) evName = `bcm_${uuid++}`;
      if (isReply) resolve();
      else task.eventBus.once(evName, (data) => resolve(data));
      reqChannel.postMessage({ evName, data, isReply });
    });
  }

  reqChannel.onmessage = (event) => {
    const { evName, data, isReply } = event.data;
    if (typeof data === 'string') JSON.parse(data); // string 解析时间也要计算
    if (task.config.debug) console.log('[BroadcastChannel][req]onmessage', evName, data, isReply);
    if (isReply) return task.eventBus.emit(evName, data);
    request(data, evName); // 回复消息请求
  }

  return request;
}

exports.BCMRequest = globalThis.BCMRequest = initBroadcastMessage();
exports.runTestBCM = () => task.runTaskTest(globalThis.BCMRequest, 'BroadcastChannel');

/**
  * @returns 双 channel 发送与接收
 */
function initBroadcastMessageTwoChannel() {
  const reqChannel = new BroadcastChannel(task.constants.msgTopic + '-bcm-req');
  const resChannel = new BroadcastChannel(task.constants.msgTopic + '-bcm-res');

  let uuid = 0;
  const request = (data, evName = '') => {
    return new Promise(resolve => {
      const isReply = !!evName;
       if (!evName) evName = `bcm_two_${uuid++}`;
      if (isReply) resolve();
      else task.eventBus.once(evName, (data) => resolve(data));
      (isReply ? resChannel : reqChannel).postMessage({ evName, data, isReply });
    });
  }
  // 收到消息请求
  reqChannel.onmessage = (event) => {
    const { evName, data, isReply = false } = event.data;
    if (typeof data === 'string') JSON.parse(data); // string 解析时间也要计算
    if (task.debug) console.log('[BCMTwoChannel][received req]onmessage', evName, data, isReply);
    // if (isReply) return task.eventBus.emit(evName, data);
    request(data, evName);
  }
  // res 仅用于消息回复
  resChannel.onmessage = (event) => {
    const { evName, data, isReply = true } = event.data;
    if (typeof data === 'string') JSON.parse(data); // string 解析时间也要计算
    if (task.debug) console.log('[BCMTwoChannel][received res]onmessage', evName, data, isReply);
    if (isReply) return task.eventBus.emit(evName, data);
    // request(data, true);
  }

  return request;
}

exports.BCMTwoChannelRequest = globalThis.BCMTwoChannelRequest = initBroadcastMessageTwoChannel();
exports.runTestBCMTwoChannel = () => task.runTaskTest(globalThis.BCMTwoChannelRequest, 'BroadcastChannelTwoChannel');
