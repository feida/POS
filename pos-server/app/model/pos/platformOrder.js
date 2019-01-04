/**
 * @author wxh on 2017/12/29
 * @copyright
 * @desc
 */

const posSqlite = require('../../dao/sqlite/pos').client;
const platformOrder = posSqlite.model('tb_platform_order');
const platformOrderDetail = posSqlite.model('tb_platform_order_detail');

const async = require('async');

/**
 * 新增数据
 * @param content
 * @param callback
 */
exports.save = function(content, callback) {
    platformOrder.build(content).save().then(function (result) {
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
    platformOrder.update(update, {where: {id}}).then(function (result) {
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
    platformOrder.findOne({ where:{id} }).then(function (result) {
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
    platformOrder.findAll({
        where:conditions
    }).then(function (result) {
        callback(null, result);
    }).catch(function (err) {
        callback(err);
    });
};


/**
 * @desc 外卖订单list
 * */
exports.getPlatformOrderList = function (conditions, callback) {
    platformOrder.findAndCountAll({
        'limit': conditions.page_size,
        'offset': conditions.page_skip ,
    }).then(function (result) {
        callback(null, result);
    }).catch(function (err) {
        callback(err);
    });
};

/**
 * @desc 外卖总订单buId
 * */
exports.getPlatformOrderByPlatformOrderId = function (conditions, callback) {
    platformOrder.findOne({
        where:{
            platformOrderId :conditions.platformOrderId
        }
    }).then(function(results) {
            return callback(null,results);
        }).catch(function (err) {
            return callback(err);
        });
};

/**
 * @desc 外卖订单详情
 * */
exports.getPlatformOrderDetailByPlatformOrderId = function (conditions, callback) {
    platformOrderDetail.findAll({
        where:{
            platformOrderId :conditions.platformOrderId
        }
    }).then(function(results) {
        return callback(null,results);
    }).catch(function (err) {
        return callback(err);
    });
};


/**
 * @desc 外卖订单buId
 * */

exports.getPlatformOrderDetailAndArticleByPlatformOrderId = function (conditions, callback) {
    let sql = `
    SELECT a.article_type,a.id article_id,pod.*,p.ip,p.port,p.ticket_type,po.phone,po.order_create_time from tb_platform_order_detail  pod 
    LEFT JOIN tb_article a on a.eleme_name = pod.name 
    LEFT JOIN tb_platform_order po on po.platform_order_id  =  pod.platform_order_id 
    LEFT JOIN tb_article_kitchen ak on ak.article_id = a.id
    LEFT JOIN tb_kitchen k on k.id = ak.kitchen_id 
    LEFT JOIN tb_printer p on p.id = k.printer_id
    where pod.platform_order_id =${conditions.platformOrderId}
    and p.support_waimai = 1	and k.printer_id is not null`;

    posSqlite.query(`${sql}`, { type: posSqlite.QueryTypes.SELECT})
        .then(function(results) {
            return callback(null,results);
        }).catch(function (err) {
        return callback(err);
    });
};


/**
 * @desc 外卖订单buId
 * */
exports.selectTodayPlatformOrderCount = function (callback) {
    posSqlite.query(`SELECT count(id) orderCount from tb_platform_order where date(datetime(SUBSTR(order_create_time,0,11), 'unixepoch', 'localtime')) = date('now')`, { type: posSqlite.QueryTypes.SELECT})
        .then(function(results) {
            return callback(null,results ? results[0].orderCount : 0);
        }).catch(function (err) {
        return callback(err);
    });
};