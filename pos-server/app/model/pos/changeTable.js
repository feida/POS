/**
 * @author wxh on 2018/1/9
 * @copyright
 * @desc
 */

const posSqlite = require('../../dao/sqlite/pos').client;
const changeTable = posSqlite.model('tb_change_table');

const async = require('async');

/**
 * 新增或者修改数据
 * @param content
 * @param callback
 */
exports.upsert = function (content, callback) {
    if (typeof callback != 'function') {
        callback = function () { };
    }
    changeTable.upsert(content).then(function (result) {
        return callback(null, result);
    }).catch(function (err) {
        return callback(err);
    });
};

/**
 * 获取表总记录算
 * @param callback
 */
exports.count = function (callback) {
    changeTable.count().then(function (result) {
        return callback(null, result);
    }).catch(function (err) {
        return callback(err);
    });
};

/**
 * 获取所有数据
 * @param callback
 */
exports.findAll = function (callback) {
    changeTable.findAll({raw:true}).then(function (result) {
        return callback(null, result);
    }).catch(function (err) {
        return callback(err);
    });
};

/**
 * 删除数据
 * @param callback
 */
exports.destroyByTableName = function (condition,callback) {
    changeTable.destroy({
        where:{
            tableName:condition.tableName
        }
    }).then(function (result) {
        return callback(null, result);
    }).catch(function (err) {
        return callback(err);
    });
};
