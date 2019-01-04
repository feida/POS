/**
 * @author wxh on 2018/1/9
 * @copyright
 * @desc
 */

const posSqlite = require('../../dao/sqlite/pos').client;
const area = posSqlite.model('tb_area');

const async = require('async');
/**
 * 新增数据
 * @param content
 * @param callback
 */
exports.save = function(content, callback) {
    area.build(content).save().then(function (result) {
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
    area.update(update, {where: {id}}).then(function (result) {
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
    area.findOne({ where:{id} }).then(function (result) {
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
    area.findAll({
        where:conditions
    }).then(function (result) {
        callback(null, result);
    }).catch(function (err) {
        callback(err);
    });
};


/**
 * 根据座位号寻找打印机
 * @param orderInfo
 * @param cb
 */
exports.getPrintMachineByTableNumber = function (orderInfo, callback) {
    let support = orderInfo.distribution_mode_id == 1 ? 'support_tangshi' : 'support_waidai';  // 1 堂吃  3 外带
    posSqlite.query(`SELECT p.* from tb_table_qrcode tq LEFT JOIN tb_area a on tq.area_id = a.id  LEFT JOIN tb_printer p on a.print_id = p.id  where tq.table_number = ? and ${support} = 1  and a.print_id not  null`,
        {replacements: [orderInfo.table_number], type: posSqlite.QueryTypes.SELECT}
    ).then(function (resultsBen = []) {
        posSqlite.query(`SELECT * FROM tb_printer WHERE print_type = 2 and ticket_type = 0 and range  =0  and ${support} = 1 `, {type: posSqlite.QueryTypes.SELECT}
        ).then(function (results = []) {
            return callback(null, results.concat(resultsBen));
        }).catch(function (err) {
            return callback(err);
        });
    }).catch(function (err) {
        return callback(err);
    });
};
