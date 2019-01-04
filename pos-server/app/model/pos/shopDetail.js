/**
 * @author wxh on 2017/12/29
 * @copyright
 * @desc
 */

const posSqlite = require('../../dao/sqlite/pos').client;
const shopDetail = posSqlite.model('tb_shop_detail');
const async = require('async');


/**
 * 新增数据
 * @param content
 * @param callback
 */
exports.save = function(content, callback) {
    shopDetail.build(content).save().then(function (result) {
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
    shopDetail.update(update, {where: {id}}).then(function (result) {
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
    shopDetail.findOne({ where:{id} }).then(function (result) {
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
    shopDetail.findAll({
        where:conditions
    }).then(function (result) {
        callback(null, result);
    }).catch(function (err) {
        callback(err);
    });
};

/**
 * @desc
 * */
exports.getShopDetailInfo = function (conditions, callback) {
    shopDetail.findOne({raw: true}).then(function (result) {
        return callback(null, result);
    }).catch(function (err) {
        return callback(err);
    });
};

/**
 * 获取店铺信息
 * @param callback
 */
exports.getShopDetailFindOne = function (callback) {
    shopDetail.findOne({raw: true}).then(function (result) {
        return callback(null, result);
    }).catch(function (err) {
        console.log('------------',err)
        return callback(err);
    });
};


/**
 *
 * @param conditions
 * @param callback
 */
exports.getCustomShopDetailInfo = function (conditions, callback) {
    posSqlite.query('select * from tb_shop_detail',
        {  type: posSqlite.QueryTypes.SELECT }
    ).then(function(results) {
        return callback(null,  results.length ? results[0] :results);
    }).catch(function (err) {
        return callback(err);
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


// /**
//  * @desc 外卖订单buId
//  * */
// exports.getPlatformOrderById = function (conditions, callback) {
//     posSqlite.query(`
//     SELECT pod.*,po.*,a.* from tb_platform_order_detail  pod
//     LEFT JOIN  tb_platform_order  po
//     on po.platform_order_id = pod.platform_order_id
//     LEFT JOIN tb_article a
//     on a.eleme_name = pod.name
//     where pod.platform_order_id = ${conditions.platformOrderId}
//     `, { type: posSqlite.QueryTypes.SELECT})
//         .then(function(results) {
//             return callback(null,results);
//         }).catch(function (err) {
//             return callback(err);
//         });
// };