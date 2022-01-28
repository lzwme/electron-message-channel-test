// @ts-check

if (process.env.CHILD_PROC === '1') {
  // 子进程
  process.on('message', (data) => {
    if (process.env.DEBUG === '1') console.log(data);
    process.send(data);
  });
} else {
  const child_process = require('child_process');
  const task = require('./task');
  const child = child_process.fork(__filename, { env: { CHILD_PROC: '1', DEBUG: task.config.debug ? '1' : '' } });
  function initProcessFork() {
    let uuid = 0;
    const request = (data, evName = '') => {
      return new Promise(resolve => {
        const isReply = !!evName;
        if (!evName) evName = `processfork_${uuid++}`;
        if (isReply) resolve();
        else task.eventBus.once(evName, (data) => resolve(data));
        child.send({ evName, data, isReply });
      });
    }
    // 收到消息回复
    child.on('message', (info) => {
      // @ts-ignore
      const { evName, data } = info;
      if (typeof data === 'string') JSON.parse(data); // string 解析时间也要计算
      if (task.config.debug) console.log('[MessageChannnelMain][req]onmessage', evName, data);
      task.eventBus.emit(evName, data);
    });

    return request;
  }

  exports.processForkRequest = globalThis.processForkRequest = initProcessFork();
  exports.runTestProcessFork = () => task.runTaskTest(globalThis.processForkRequest, 'processForkRequest');

  if (module === require.main) exports.runTestProcessFork();
}
