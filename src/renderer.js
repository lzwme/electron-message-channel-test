// require('./lib/jquery');
// require('./lib/bootstrap.bundle');
// require('./lib/bootstrap-table/bootstrap-table');
// require('./lib/bootstrap-table/bootstrap-table-zh-CN');

const task = require('./service/task');
const stats = require('./service/stats');

const ipcSend = require('./service/initIPCSend');
const ipcSendTo = require('./service/initIPCSendTo');
const bcm = require('./service/initBroadcastMessage');
const mcm = require('./service/initMessageChannelMain');
const processFork = require('./service/initFork');
const workerThreads = require('./service/initWorkerThreads');

function initEvents() {
    // for btn
    $('#btnRunTestIPCSend').on('click', () => ipcSend.runTestIPCSend().then(d => stats.setStatsTableData(d)));
    $('#btnRunTestIPCSendTo').on('click', () => ipcSendTo.runTestIPCSendTo().then(d => stats.setStatsTableData(d)));
    $('#btnRunTestBCM').on('click', () => bcm.runTestBCM().then(d => stats.setStatsTableData(d)));
    $('#btnRunTestBCMTwoChannel').on('click', () => bcm.runTestBCMTwoChannel().then(d => stats.setStatsTableData(d)));
    $('#btnRunTestMessageChannelMain').on('click', () => mcm.runTestMessageChannelMain().then(d => stats.setStatsTableData(d)));
    $('#btnRunTestProcessFork').on('click', () => processFork.runTestProcessFork().then(d => stats.setStatsTableData(d)));
    $('#btnRunTestworkerThreads').on('click', () => workerThreads.runTestworkerThreads().then(d => stats.setStatsTableData(d)));

    $('#runOneByOne').off('click').on('click', async (ev) => {
        await ipcSend.runTestIPCSend().then(d => stats.setStatsTableData(d, false));
        await ipcSendTo.runTestIPCSendTo().then(d => stats.setStatsTableData(d, false));
        await bcm.runTestBCM().then(d => stats.setStatsTableData(d, false));
        await bcm.runTestBCMTwoChannel().then(d => stats.setStatsTableData(d, false));
        await mcm.runTestMessageChannelMain().then(d => stats.setStatsTableData(d, false));
        await processFork.runTestProcessFork().then(d => stats.setStatsTableData(d, false));
        await workerThreads.runTestworkerThreads().then(d => stats.setStatsTableData(d, false));
    });

    $('#statsOverView').on('click', () => stats.loadLocalStats());

    // for config

    $('#logDisabled').off('click').on('click', (ev) => {
        task.config.printLog = !task.config.printLog;
        $(ev.target).text(task.config.printLog ? '打印日志' : '不打印日志');
        $(ev.target).removeClass('btn-success').addClass(`btn-${task.config.printLog ? 'success' : 'secondary'}`);
        task.config.printLog ? $('#log').show() : $('#log').hide();
        task.config.printLog ? $('#logClean').show() : $('#logClean').hide();
    });
    $('#logClean').on('click', () => $('#log').html(''));

    $('#isDebug').off('click').on('click', (ev) => {
        task.config.debug = !task.config.debug;
        $(ev.target).text(task.config.debug ? 'DEBUG ON' : 'DEBUG OFF');
        $(ev.target).removeClass('btn-success').addClass(`btn-${task.config.debug ? 'success' : 'secondary'}`)
    });

    $('#configMode').off('change').on('change', (ev) => {
        task.config.mode = $(ev.target).val();
    });
}

initEvents();
