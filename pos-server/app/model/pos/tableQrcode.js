/**
 * @author wxh on 2018/2/12
 * @copyright
 * @desc
 */


const posSqlite = require('../../dao/sqlite/pos').client;
const tableQrcode = posSqlite.model('tb_table_qrcode');
const async = require('async');


/**
 * 新增数据
 * @param content
 * @param callback
 */
exports.save = function (content, callback) {
    tableQrcode.build(content).save().then(function (result) {
        return callback(null, result);
    }).catch(function (err) {
        return callback(err);
    });
};



/**
 * 根据Id 修改数据
 * @param id
 * @param update
 * @param callback
 */
exports.updateById = function (id, update, callback) {
    tableQrcode.update(update, { where: { id } }).then(function (result) {
        return callback(null, result);
    }).catch(function (err) {
        return callback(err);
    });
};

/**
 * 新增或者修改数据
 * @param content
 * @param callback
 */
exports.upsert = function (content, callback) {
    tableQrcode.upsert(content).then(function (result) {
        return callback(null, result);
    }).catch(function (err) {
        return callback(err);
    });
};

/**
 *  修改数据
 * @param update
 * @param where
 * @param callback
 */
exports.updateByConditions = function (update, where, callback) {
    tableQrcode.update(update, { where: where }).then(function (result) {
        return callback(null, result);
    }).catch(function (err) {
        return callback(err);
    });
};

/**
 * 根据id 获取信息
 * @param id
 * @param callback
 */
exports.findOneInfoById = function (id, callback) {
    tableQrcode.findOne({ where: { id } }).then(function (result) {
        callback(null, result);
    }).catch(function (err) {
        callback(err);
    });
};

/**
 * 根据条件获取信息
 * @param conditions
 * @param callback
 */
exports.findAllInfoByConditions = function (conditions, callback) {
    tableQrcode.findAll({
        where: conditions
    }).then(function (result) {
        callback(null, result);
    }).catch(function (err) {
        callback(err);
    });
};

/**
 * 释放座位
 * @param tableNumber
 * @param callback
 */
exports.releaseTable = function (tableNumber, callback) {
    tableQrcode.update({ tableState: 0 }, { where: { tableNumber: tableNumber} }).then(function (result) {
        return callback(null, result);
    }).catch(function (err) {
        return callback(err);
    });
};

/**
 * 锁定座位
 * @param tableNumber
 * @param callback
 */
exports.lockingTable = function (tableNumber, callback) {
    tableQrcode.update({ tableState: 1 }, { where: { tableNumber: tableNumber} }).then(function (result) {
        return callback(null, result);
    }).catch(function (err) {
        return callback(err);
    });
};