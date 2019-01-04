/**
 * date: 2018/1/8
 * author: guofeng
 * des:
 */


const posSqlite = require('../../dao/sqlite/pos').client;

const platformOrderDetail = posSqlite.model('tb_platform_order_detail');

const async = require('async');

/**
 * 新增数据
 * @param content
 * @param callback
 */
exports.save = function(content, callback) {
    platformOrderDetail.build(content).save().then(function (result) {
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
    platformOrderDetail.update(update, {where: {id}}).then(function (result) {
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
    platformOrderDetail.findOne({ where:{id} }).then(function (result) {
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
    platformOrderDetail.findAll({
        where:conditions
    }).then(function (result) {
        callback(null, result);
    }).catch(function (err) {
        callback(err);
    });
};

/**
 * @desc 外卖订单详情
 * */
exports.getPlatformOrderDetailByPlatformOrderId = function (platformOrderId, callback) {
    platformOrderDetail.findAll({
        where:{platformOrderId}
    }).then(function(results) {
        return callback(null,results);
    }).catch(function (err) {
        return callback(err);
    });
};