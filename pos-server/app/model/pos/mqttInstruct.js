/**
 * @author wxh on 2018/12/1
 * @copyright
 * @desc
 */
const posSqlite = require('../../dao/sqlite/pos').client;
/**
 * 新增或者修改数据
 * @param table
 * @param content
 * @param callback
 */
exports.upsert = function (table,content, callback) {
    const table_current = posSqlite.model(table);
    table_current.upsert(content).then(function (result) {
        return callback(null,result);
    }).catch(function (err) {
        return callback(err);
    });
};

