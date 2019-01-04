/**
 * @author wxh on 2018/1/9
 * @copyright
 * @desc
 */

const posSqlite = require('../../dao/sqlite/pos').client;
const orderItem = posSqlite.model('tb_order_item');

const async = require('async');
const lodash = require('lodash');



/**
 * 新增数据
 * @param content
 * @param callback
 */
exports.save = function (content, callback) {
    orderItem.build(content).save().then(function (result) {
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
    orderItem.upsert(content).then(function (result) {
        return callback(null, result);
    }).catch(function (err) {
        return callback(err);
    });
};

/**
 * 数量自增或子减
 * @param content
 * @param callback
 */
exports.increment = function (content, where,callback) {
    orderItem.increment(content,where).then(function (result) {
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
    orderItem.update(update, { where: { id } }).then(function (result) {
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
    orderItem.update(update, { where: where }).then(function (result) {
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
    orderItem.findOne({ where: { id } }).then(function (result) {
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
    orderItem.findAll({
        where: conditions,
        raw: true
    }).then(function (result) {
        callback(null, result);
    }).catch(function (err) {
        callback(err);
    });
};


/**
 * 根据订单ID 查询退菜内容
 * @param orderId
 * @param callback
 */
exports.refundCountByOrderId = function (orderId, callback) {
    posSqlite.query(`SELECT 'true' article_return, m.sort family_sort,a.sort article_sort, t.id, t.order_id,t.article_id,t.article_name || '(退)'  article_name ,t.count,t.original_price,t.unit_price,t.final_price,t.remark,t.sort,t.status,t.type,t.parent_id,t.create_time,t.meal_item_id,t.kitchen_id,t.recommend_id,t.orgin_count,t.refund_count,t.meal_fee_number,t.change_count,t.print_fail_flag from tb_order_item  t left   join  tb_article a  on  a.id=substr(t.article_id,1,32) left   join  tb_article_family m on m.id = a.article_family_id  where (t.order_id in (SELECT id FROM tb_order where id = :orderId or parent_order_id = :orderId ))  and t.refund_count >0  `,
        { replacements: { orderId: orderId }, type: posSqlite.QueryTypes.SELECT }
    ).then(function (results) {
        return callback(null, results);
    }).catch(function (err) {
        return callback(err);
    });
};

/**
 * 根据订单 ID in  查询退菜内容
 * @param orderItemArr
 * @param callback
 */
exports.printRefundByOrderItemId = function (orderItemArr, distribution_mode_id, callback) {
    let orderItemId = lodash.map(orderItemArr, 'id').join(',');
    let support = distribution_mode_id == 1 ? 'support_tangshi' : 'support_waidai';  // 1 堂吃  3 外带
    // posSqlite.query(`SELECT 'false' article_return, m.sort family_sort,a.sort article_sort, t.* from tb_order_item  t left   join  tb_article a  on  a.id= substr(t.article_id,1,32) left   join  tb_article_family m on m.id = a.article_family_id where  t.id in(${orderItemId})  or t.parent_id in (${orderItemId}) order by m.sort asc,a.sort asc`,
    posSqlite.query(`
    SELECT 'false' article_return, m.sort family_sort,a.sort article_sort, ma.article_id mealArticleId,ma.print_sort mealPrintSort ,p.*, t.* from tb_order_item  t 
    left   join  tb_article a  on  a.id= substr(t.article_id,1,32) left   join  tb_article_family m on m.id= a.article_family_id 
    LEFT JOIN  tb_meal_item mi on mi.id = t.meal_item_id LEFT JOIN  tb_meal_attr ma on ma.id = mi.meal_attr_id LEFT JOIN  tb_kitchen k on k.id = mi.kitchen_id
    LEFT JOIN  tb_printer p on p.id = k.printer_id  and p.${support} = 1 where  t.id in(${orderItemId})  or t.parent_id in (${orderItemId}) order by ma.print_sort DESC
    `,
        { type: posSqlite.QueryTypes.SELECT }
    ).then(function (results) {
        return callback(null, results);
    }).catch(function (err) {
        return callback(err);
    });
};

/**
 * 根据订单 ID in  查询退菜内容
 * @param orderItemArr
 * @param callback
 */
exports.newPrintRefundByOrderItemId = function (orderItemArr, distribution_mode_id, callback) {
    let orderItemId = lodash.map(orderItemArr, 'id').join(',');
    let support = distribution_mode_id == 1 ? 'support_tangshi' : 'support_waidai';  // 1 堂吃  3 外带
     posSqlite.query(`
    SELECT 'false' article_return, m.sort family_sort,a.sort article_sort, ma.article_id mealArticleId,ma.print_sort mealPrintSort ,p.*, t.* from tb_order_item  t 
    left   join  tb_article a  on  a.id= substr(t.article_id,1,32) left   join  tb_article_family m on m.id= a.article_family_id 
    LEFT JOIN  tb_meal_item mi on mi.id = t.meal_item_id LEFT JOIN  tb_meal_attr ma on ma.id = mi.meal_attr_id LEFT JOIN  tb_kitchen k on k.id = mi.kitchen_id
    LEFT JOIN  tb_printer p on p.id = k.printer_id  and p.${support} = 1 where  t.id in(${orderItemId})  or t.parent_id in (${orderItemId}) order by ma.print_sort DESC
    `,
        { type: posSqlite.QueryTypes.SELECT }
    ).then(function (results) {
        return callback(null, results);
    }).catch(function (err) {
        return callback(err);
    });
};


/**
 * 根据订单id 获取菜品列表
 * @param orderId
 * @param callback
 */
exports.getOrderItemByOrderId = function (orderId, callback) {
    orderItem.findAll({
        where: { orderId }
    }).then(function (result) {
        callback(null, result);
    }).catch(function (err) {
        callback(err);
    });
};

/**
 * 批量新增
 * @param id
 * @param update
 * @param callback
 */
exports.batchInsertOrderItem = function (orderItemList, callback) {
    async.eachLimit(orderItemList, 1, function (item, cb) {
        orderItem.build(item).save().then(function (result) {
            return cb(null, result);
        }).catch(function (err) {
            return cb(err);
        });
    }, function (err) {
        if (err) return callback(err);
        callback();
    });
};

/**
 * 根据订单id 修改菜品字段内容
 * @param id
 * @param update
 * @param callback
 */
exports.updateOrderItemById = function (id, update, callback) {
    console.warn("update", update, "id", id)
    orderItem.update(update, { where: { id } }).then(function (result) {
        return callback(null, result);
    }).catch(function (err) {
        return callback(err);
    });
};



/**
 * 根据id获取菜品列表
 * @param orderIdArr []
 * @param callback
 */
exports.getOrderItemListById = function (orderIdArr, callback) {
    let orderId = orderIdArr.join(',');
    let sql = `SELECT t.id item_id,f.id,t.type,f.name,t.article_name ,t.orgin_count , t.refund_count,t.parent_id, t.grant_count from 
        tb_order_item  t LEFT JOIN tb_article a on a.id = substr(t.article_id,1,32)
        LEFT JOIN tb_article_family f on f.id = a.article_family_id WHERE t.order_id in (${orderId}) 
        order by f.sort`;
        console.log(`----sql--`,sql)
    posSqlite.query(sql, { type: posSqlite.QueryTypes.SELECT }
    ).then(function (results) {
        return callback(null, results);
    }).catch(function (err) {
        return callback(err);
    });
};


/**
 * 根据id获取菜品列表
 * @param orderIdArr []
 * @param callback
 */
exports.getOrderItemRefundListById = function (orderIdArr, callback) {
    let orderId = orderIdArr.join(',');
    let sql = `SELECT f.id,f.name,f.sort,t.article_name ,sum(t.refund_count) refund_count,t.parent_id FROM tb_order_item  t 
    LEFT JOIN tb_article a on a.id = substr(t.article_id,1,32) 
    LEFT JOIN tb_article_family f on f.id = a.article_family_id 
    WHERE t.order_id in (${orderId}) 
    and (t.parent_id ='' or t.parent_id is null ) and t.refund_count>0   
    GROUP BY t.article_name order by  f.sort`;

    // let sql = `SELECT f.id,f.name,f.sort,t.article_name ,sum(t.refund_count) refund_count,t.parent_id FROM tb_order_item  t
    // LEFT JOIN tb_article a on a.id = substr(t.article_id,1,32)
    // LEFT JOIN tb_article_family f on f.id = a.article_family_id
    // LEFT JOIN tb_order_payment_item p on p.order_id = t.order_id
    // WHERE t.order_id in (${orderId})
    // and p.payment_mode_id not in (1,10)
    // and (t.parent_id ='' or t.parent_id is null ) and t.refund_count>0
    // GROUP BY t.article_name order by  f.sort`;
    posSqlite.query(sql, { type: posSqlite.QueryTypes.SELECT }
    ).then(function (results) {
        return callback(null, results);
    }).catch(function (err) {
        return callback(err);
    });
};

exports.deleteByConditions = function (conditions, callback) {
    orderItem.destroy({where: conditions}).then(function (result) {
        return callback(null, result);
    }).catch(function (err) {
        return callback(err);
    });
};

/**
 * 电视叫号模式使用
 * 根据订单流水号查询的订单项
 * @param serialNumber
 * @param callback
 */
exports.selectByOrderSerialNumber = function (serialNumber, callback) {
    let sql = `SELECT o.id orderId, o.ver_code verCode, oi.article_name articleName, oi.count from tb_order_item oi LEFT JOIN tb_order o on oi.order_id = o.id where o.serial_number like '%${serialNumber}' ORDER BY type DESC`;
    posSqlite.query(sql, { type: posSqlite.QueryTypes.SELECT }
    ).then(function (results) {
        return callback(results);
    }).catch(function (err) {
        return callback(err);
    });
};
