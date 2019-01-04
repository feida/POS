/**
 * @author wxh on 2018/1/9
 * @copyright
 * @desc
 */

const posSqlite = require('../../dao/sqlite/pos').client;
const orderPaymentItem = posSqlite.model('tb_order_payment_item');

const async = require('async');

/**
 * 新增数据
 * @param content
 * @param callback
 */
exports.save = function (content, callback) {
    orderPaymentItem.build(content).save().then(function (result) {
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
    orderPaymentItem.upsert(content).then(function (result) {
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
    orderPaymentItem.update(update, { where: { id } }).then(function (result) {
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
    orderPaymentItem.findOne({ where: { id } }).then(function (result) {
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
    orderPaymentItem.findAll({
        where: conditions
    }).then(function (result) {
        callback(null, result);
    }).catch(function (err) {
        callback(err);
    });
};

/**
 * 根据主订单id 获取支付列表
 * @param orderId
 * @param callback
 */
exports.listByOrderId = function (orderId, callback) {
    posSqlite.query(`SELECT payment_mode_id,sum(pay_value) pay_value, result_data from tb_order_payment_item where order_id in ( SELECT id FROM tb_order WHERE parent_order_id = ? or id = ? ) and payment_mode_id not in ('13','14','15','20','21')  GROUP BY payment_mode_id`,
        { replacements: [orderId, orderId], type: posSqlite.QueryTypes.SELECT }
    ).then(function (results) {
        return callback(null, results);
    }).catch(function (err) {
        return callback(err);
    });
};

/**
 * 根据主订单id 获取退菜金额列表
 * @param orderId
 * @param callback
 */
exports.refundListByOrderId = function (orderId, callback) {
    posSqlite.query(`SELECT * FROM tb_order_payment_item  where order_id = ?  and pay_value <0 ORDER BY pay_time  DESC`,
        { replacements: [orderId], type: posSqlite.QueryTypes.SELECT }
    ).then(function (results) {
        return callback(null, results);
    }).catch(function (err) {
        return callback(err);
    });
};

exports.deleteByConditions = function (conditions, callback) {
    orderPaymentItem.destroy({ where: conditions }).then(function (result) {
        return callback(null, result);
    }).catch(function (err) {
        return callback(err);
    });
};