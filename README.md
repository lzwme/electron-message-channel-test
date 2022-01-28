# 进程/线程间消息通信性能测试

## 测试内容

- [electron.ipcRenderer.send](https://www.electronjs.org/zh/docs/latest/api/ipc-renderer#ipcrenderersendchannel-args)
- [electron.ipcRenderer.sendTo](https://www.electronjs.org/zh/docs/latest/api/ipc-renderer#ipcrenderersendtowebcontentsid-channel-args)
- [electron.MessageChannelMain](https://www.electronjs.org/zh/docs/latest/api/message-channel-main)
- [BroadcastChannel](https://developer.mozilla.org/zh-CN/docs/Web/API/BroadcastChannel)
  - `single channel`
  - `tow channel` 建立两个 Channel，分别用于接收和发送
- [Node.js child_process.fork](http://nodejs.cn/api/child_process.html#child_processforkmodulepath-args-options)
- [Node.js worker_threads 工作线程](http://nodejs.cn/api/worker_threads.html)
    - 不能在渲染进程中使用： [ERR_MISSING_PLATFORM_FOR_WORKER](https://nodejs.org/dist/latest/docs/api/errors.html#err_missing_platform_for_worker)

### TODO

- [Web Workers](https://developer.mozilla.org/zh-CN/docs/Web/API/Web_Workers_API)
  - [MessageChannel](https://developer.mozilla.org/en-US/docs/Web/API/MessageChannel) 双通道
- [ServiceWorker](https://developer.mozilla.org/zh-CN/docs/Web/API/ServiceWorker)
- [Node.js child_process.spawn](http://nodejs.cn/api/child_process.html#child_processspawncommand-args-options)

## 测试结果概要

平均性能排名：

1. `worker_threads` 性能最好，但只能在主进程中使用。密集通信可能会导致主进程阻塞，进而阻塞渲染进程
    - 达到阻塞的阈值条件较高，绝大部分场景下都可适用
1. `ipc.send` 性能也较好，但主要是与主进程通信，密集通信同样可能造成进程阻塞
1. `child_process.fork`
1. `MessageChannelMain`
1. `ipc.sendTo`
1. `BroadcastChannel`
1. `BroadcastChannel-TowChannel`
