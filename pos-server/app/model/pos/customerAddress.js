/**
 * @author wxh on 2018/2/12
 * @copyright
 * @desc
 */

const posSqlite = require('../../dao/sqlite/pos').client;
const customerAddress = posSqlite.model('tb_customer_address');
const async = require('async');

/**
 * 新增数据
 * @param content
 * @param callback
 */
exports.save = function(content, callback) {
    customerAddress.build(content).save().then(function (result) {
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
exports.updateById = function(id, update, callback) {
    customerAddress.update(update, {where: {id}}).then(function (result) {
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
    customerAddress.findOne({ where:{id} }).then(function (result) {
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
    customerAddress.findAll({
        where:conditions
    }).then(function (result) {
        callback(null, result);
    }).catch(function (err) {
        callback(err);
    });
};

/**
 * 新增或者修改数据
 * @param content
 * @param callback
 */
exports.upsert = function (content, callback) {
    customerAddress.upsert(content).then(function (result) {
        return callback(null, result);
    }).catch(function (err) {
        return callback(err);
    });
};