/**
 * @author wxh on 2018/2/12
 * @copyright
 * @desc
 */

const posSqlite = require('../../dao/sqlite/pos').client;
const kitchenPrinter = posSqlite.model('tb_kitchen_printer');
const async = require('async');

/**
 * 新增数据
 * @param content
 * @param callback
 */
exports.save = function(content, callback) {
    kitchenPrinter.build(content).save().then(function (result) {
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
    kitchenPrinter.update(update, {where: {id}}).then(function (result) {
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
    kitchenPrinter.findOne({ where:{id} }).then(function (result) {
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
    kitchenPrinter.findAll({
        where:conditions
    }).then(function (result) {
        callback(null, result);
    }).catch(function (err) {
        callback(err);
    });
};



/**
 * 根据厨房查找打印机
 * @param kitchendId
 * @param distribution_mode_id
 * @param callback
 */

exports.getPrinterInfoByKitchenId = function (kitchendId,distribution_mode_id, callback) {
    let support = distribution_mode_id == 1 ? 'support_tangshi' : 'support_waidai';  // 1 堂吃  3 外带
    posSqlite.query(`
        SELECT kp.kitchen_id,p.id,p.name,p.ip,p.port,p.ticket_type from  tb_kitchen_printer kp
        LEFT JOIN tb_printer p on p.id  = kp.printer_id
        where kp.kitchen_id = ? and p.${support} = 1 and p.state = 1;
        `,
        { replacements: [kitchendId], type: posSqlite.QueryTypes.SELECT }
    ).then(function (results) {
        return callback(null, results);
    }).catch(function (err) {
        return callback(err);
    });
};