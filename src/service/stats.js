/*
 * @Author: lzw
 * @Date: 2022-01-28 14:42:09
 * @LastEditors: lzw
 * @LastEditTime: 2022-01-28 17:09:47
 * @Description:
 */

Object.assign($.fn.bootstrapTable.defaults, {
    height: 600,
    // virtualScroll: false,
    showColumns: true,
    showColumnsToggleAll: true,
    showColumnsSearch: true,
    minimumCountColumns: 2,
    showPaginationSwitch: true,
    showFullscreen: true,
    search: true,
});

const StatsTable = $('#statsOverViewTable').bootstrapTable();

function setStatsTableData(stats, reset = false) {
    if (!stats) return;

    const options = {
        columns: [],
        data: reset ? [] : StatsTable.bootstrapTable('getData'),
    };
    if (!Array.isArray(stats)) stats = [stats];

    options.columns = Object.keys(stats[0] || {}).filter(d => d !== 'data').map(key => {
        const cols = { field: key, title: key, sortable: true, };
        if (key.includes('Time')) {
            cols.formatter = d => {
                const a = new Date(d);
                a.setHours(a.getHours() + 8);
                return a.toISOString().replace('T', ' ').replace('Z', '');
            };
        }
        return cols;
    });

    stats.forEach(info => options.data.push(info));
    StatsTable.bootstrapTable('refreshOptions', options);
}
exports.setStatsTableData = setStatsTableData;

async function loadLocalStats() {
    const fs = require('fs');
    const path = require('path');
    const statsPath = './stats';
    const list = fs.readdirSync(statsPath).filter(d => d.endsWith('.json'));

    setStatsTableData([], true);
    StatsTable.bootstrapTable('showLoading');
    const statsList = [];
    list.forEach(filename => {
        const filepath = path.resolve(statsPath, filename);
        statsList.push(JSON.parse(fs.readFileSync(filepath, 'utf-8')));
    });
    setStatsTableData(statsList, false);
    StatsTable.bootstrapTable('hideLoading');
}
exports.loadLocalStats = loadLocalStats;
