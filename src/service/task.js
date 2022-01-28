/*
 * @Author: lzw
 * @Date: 2022-01-26 09:46:29
 * @LastEditors: lzw
 * @LastEditTime: 2022-01-28 17:11:35
 * @Description:
 */

const { writeFileSync, existsSync, mkdir } = require('fs');
const EventEmitter = require('events');

exports.eventBus = new EventEmitter();
exports.eventBus.setMaxListeners(0);

exports.constants = {
    msgTopic: 'postmessage-test',
};
const config = exports.config = globalThis.config = {
    debug: false,
    printLog: false,
    mode: 'light', // light、normal、big
};

const sleep = (timeout = 16) => new Promise(rs => setTimeout(() => rs(), timeout));
exports.sleep = sleep;

async function logger(...args) {
    if (config.printLog === false) return;
    console.log(...args);
    if (globalThis.document) {
        const d = document.createElement('li');
        d.innerHTML = args.map(d => typeof d === 'string' ? d : JSON.stringify(d)).join(' ');
        document.querySelector('#log').prepend(d);
        await sleep();
    }
}

function batchRunTask(request, data = genData(), taskTotal = 100, thread = 10) {
    const dataLen = JSON.stringify(data).length;
    const dataSize = `${Number(dataLen / 1024 / 1024).toFixed(4)}M`;
    logger('[batchRunTask]start', `dataLen(${dataSize}):`, JSON.stringify(data).length, 'taskTotal:', taskTotal, 'thread:', thread);
    const startTime = Date.now();
    const total = taskTotal;
    const asyncList = [];
    const run = () => {
        taskTotal--;
        return request(data).then(() => {
            if (taskTotal < 1) return;
            return run();
        });
    };

    thread = Math.min(taskTotal, thread);
    while (thread--) asyncList.push(run());

    return Promise.allSettled(asyncList).then(() => {
        const timeCost = Date.now() - startTime;
        const avg = timeCost / total;
        return { total, dataLen, dataSize, timeCost, avg };
    });
}
exports.batchRunTask = batchRunTask;

async function runTask(request, data = genData(), total = 10) {
    const startTime = Date.now();
    let cur = total;
    while (cur--) await request(data);
    const timeCost = Date.now() - startTime;
    await logger('timeCost:', timeCost, 'avg:', timeCost / total);
}
exports.runTask = runTask;

function genData(arrLength = 10, arrStrLength = 10, toString = false) {
    var data = [];
    while (arrLength--) data.push('a'.padStart(arrStrLength, '1'));
    return toString ? JSON.stringify(data) : data;
}
exports.genData = genData;

let running = false;
function setRuning(isRunning = true) {
    if (!globalThis.document) return running = isRunning;
    const d = document.querySelector('.running');
    running = !d;
    if (d) {
        d.remove();
    } else {
        const d = document.createElement('div');
        d.classList.add('running');
        d.innerText = 'RUNNING...';
        document.body.appendChild(d);
    }

    return sleep();
}
exports.setRuning = setRuning;

async function runTaskTest(request = globalThis.request, filename) {
    if (running) return;
    if (!task.config.printLog) console.log('start runTaskTest for', filename);
    await setRuning();

    const arrLengthList = [1, 10, 100, 1000];
    const arrStrLengthList = [10, 100];
    const totalList = [10, 100, 500];
    const threads = [1, 10]; // 1000 broadcastChannel 会崩溃
    const sendToString = [1, 0];
    const stats = { data: {}, filename, mode: config.mode, times: 0, avg: 0, timeCost: 0, startTime: Date.now(), endTime: 0 };

    if (config.mode !== 'light') {
        threads.push(100);
        totalList.push(1000);
        arrLengthList.push(10000);
        arrStrLengthList.push(1000);
    }

    for (const arrLen of arrLengthList) {
        for (const arrStrLen of arrStrLengthList) {
            for (const total of totalList) {
                const dataLen = arrLen * arrStrLen + 1;
                if (total > 10 && dataLen > 100_000_000) continue; // 100M 的数据，最多执行 10 次
                if (config.mode !== 'big' && total > 10 && dataLen > 10_000_000) continue; // 10M 以上的数据，执行 10 即可
                for (const thread of threads) {
                    if (dataLen > 10_000_000 && thread > 10) continue; // 大数据对象发送降低并发测试，否则容易卡死
                    for (const isToString of sendToString) {
                        const result = await task.batchRunTask(request, task.genData(arrLen, arrStrLen, !!isToString), total, thread);
                        const key = `arrLen:${arrLen}_arrStrLen:${arrStrLen}_total:${total}_thread:${thread}_toString:${isToString}`;
                        await logger(`[${filename}]`, key, result);
                        stats.data[key] = {
                            result,
                            params: { arrLen, arrStrLen, total, thread }
                        };
                        stats.times += total;
                    }
                }
            }
        }
    }

    stats.endTime = Date.now();
    stats.timeCost = stats.endTime - stats.startTime;
    stats.avg = stats.timeCost / stats.times;
    if (filename) {
        if (!existsSync('./stats')) mkdir('./stats');
        writeFileSync(`./stats/${filename}-${config.mode}-${config.printLog ? '1' : '0'}-${Date.now()}.json`, JSON.stringify(stats, null, 2));
    }

    setRuning(false);
    if (task.config.printLog) logger(`\nDONE! [${filename}]`, 'timeCost:', stats.timeCost, 'times:', stats.times, 'avg:', stats.avg);
    else console.log(`\nDONE! [${filename}]`, 'timeCost:', stats.timeCost, 'times:', stats.times, 'avg:', stats.avg);

    return stats;
}
exports.runTaskTest = runTaskTest;

globalThis.task = module.exports;
