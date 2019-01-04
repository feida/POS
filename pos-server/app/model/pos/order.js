/**
 * @author wxh on 2018/1/6
 * @copyright
 * @desc
 */

const posSqlite = require('../../dao/sqlite/pos').client;
const order = posSqlite.model('tb_order');
const async = require('async');
const lodash = require('lodash');
const generalUtil = require('../../util/generalUtil');
/**
 * 保存数据
 * @param content
 * @param callback
 */
exports.save = function (content, callback) {
    order.build(content).save().then(function (result) {
        return callback(null, result);
    }).catch(function (err) {
        return callback(err);
    });
};

/**
 * 创建数据
 * @param content
 * @param callback
 */
exports.create = function (content, callback) {
    content.id = generalUtil.randomUUID();
    order.build(content).save().then(function (result) {
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
    order.upsert(content).then(function (result) {
        return callback(null, result);
    }).catch(function (err) {
        return callback(err);
    });
};

/**
 * 自增、自减
 * @param content
 * @param callback
 */
exports.increment = function (content,where, callback) {
    order.increment(content,where).then(function (result) {
        return callback(null, result);
    }).catch(function (err) {
        return callback(err);
    });
};

/**
 * 自增、自减
 * @param content
 * @param callback
 */
exports.increment = function (content,where, callback) {
    order.increment(content,where).then(function (result) {
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
    order.update(update, { where: { id } }).then(function (result) {
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
    order.update(update, { where: where }).then(function (result) {
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
    order.findOne({ where: { id } ,raw:true }).then(function (result) {
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
    order.findAll({
        where: conditions
    }).then(function (result) {
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
exports.findAllIdByConditions = function (conditions, callback) {
    order.findAll({
        where: conditions,
        attributes: ['id','parent_order_id']
    }).then(function (result) {
        callback(null, result);
    }).catch(function (err) {
        callback(err);
    });
};


/**
 * 根据id 获取信息
 * @param idArr
 * @param callback
 */
exports.findAllInfoByIdArr = function (idArr, callback) {
    order.findAll({
        where: {
            id:idArr,
            productionStatus:{
                $gte:2
            }
        } ,
        raw:true ,
        attributes: ['id'],
    }).then(function (result) {
        callback(null, result);
    }).catch(function (err) {
        callback(err);
    });
};

/**
 * @desc 根据id 查询
 * */
exports.selectById = function (id, callback) {
    order.findOne({
        where: { id }
    }).then(function (result) {
        callback(null, result);
    }).catch(function (err) {
        callback(err);
    });
};


/**
 * @desc 条件查询
 * */
exports.getDayOrder = function (conditions, callback) {
    order.findAll({
        where: conditions
    }).then(function (result) {
        callback(null, result);
    }).catch(function (err) {
        callback(err);
    });
};
/**
 * @desc 根据id 查询
 * */
exports.insertSelectiveByOrderId = function (mode, callback) {
    let item = {
        id: mode.id,
        tableNumber: mode.table_number,
        customerCount: mode.customer_count,
        accountingTime: mode.accounting_time,
        orderState: mode.order_state,
        productionStatus: mode.production_status,
        originalAmount: mode.original_amount,
        orderMoney: mode.order_money,
        articleCount: mode.article_count,
        serialNumber: mode.serial_number,
        allowCancel: mode.allow_cancel,
        closed: mode.closed,
        createTime: mode.create_time,
        printOrderTime: mode.print_order_time,
        remark: mode.remark,
        distributionModeId: mode.distribution_mode_id,
        amountWithChildren: mode.amount_with_children,
        paymentAmount: mode.payment_amount,
        servicePrice: mode.service_price,
        shopDetailId: mode.shop_detail_id,
        payType: mode.pay_type,
        customerId: mode.customer_id,
        allowContinueOrder: mode.allow_continue_order,
        customerAddressId: mode.customer_address_id,
        payMode: mode.pay_mode,
        verCode: mode.ver_code,
        mealFeePrice: mode.meal_fee_price,
        mealAllNumber: mode.meal_all_number,
        dataOrigin: mode.data_origin,
        syncState: mode.sync_state,
        lastSyncTime: mode.last_sync_time,
        orderNumber: mode.order_number,
        parentOrderId: mode.parent_order_id || null,
    };
    order.build(item).save().then(function (result) {
        return callback(null, result);
    }).catch(function (err) {
        return callback(err);
    });
};


/**
 * @desc 根据id 修改
 * */
exports.updateByOrderId = function (mode, callback) {
    let conditions = {
        id: mode.id
    };

    let update = {
        amountWithChildren: mode.amountWithChildren,
        countWithChild: mode.countWithChild,
        needConfirmOrderItem: mode.needConfirmOrderItem,
    };
    order.update(update, { where: conditions }).then(function (result) {
        return callback(null, result);
    }).catch(function (err) {
        return callback(err);
    });
};

/**
 * @desc 获取orderNumber
 * */
exports.selectPushOrderCount = function (callback) {
    posSqlite.query(`SELECT order_number orderNumber ,create_time from tb_order where accounting_time=strftime('%Y-%m-%d', 'now') and (parent_order_id =''  or parent_order_id is null)  order by order_number desc , create_time desc`, { type: posSqlite.QueryTypes.SELECT })
        .then(function (results) {
            return callback(null, results.length ? results[0].orderNumber : 0);
        }).catch(function (err) {
            return callback(err);
        });
};

/**
 * 根据id 获取 实收金额和总单信息
 * @param id
 * @param callback
 */

exports.getReceiptsById = function (id, callback) {
   posSqlite.query('SELECT  (SELECT sum(order_money)  FROM tb_order WHERE id = :id or ( parent_order_id= :id and order_state = 2)) receipts, * FROM tb_order WHERE  id = :id',
        { replacements: { id: id }, type: posSqlite.QueryTypes.SELECT }
    ).then(function (results) {
        return callback(null, results.length ? results[0] : {});
    }).catch(function (err) {
        return callback(err);
    });
};

/**
 * 根据订单id 查询需要打印的内容
 * @param orderId
 * @param callback
 */

exports.printByOrderId = function (orderId, distribution_mode_id, callback) {
    let support = distribution_mode_id == 1 ? 'support_tangshi' : 'support_waidai';  // 1 堂吃  3 外带
    posSqlite.query(`
        SELECT 'false' article_return,m.sort family_sort,a.sort article_sort,a.virtual_id,a.article_type,ma.article_id mealArticleId,ma.print_sort mealPrintSort ,p.*,t.* from tb_order_item  t 
        LEFT JOIN  tb_article a  on  a.id= substr(t.article_id,1,32) 
        LEFT JOIN  tb_article_family m on m.id= a.article_family_id 
        LEFT JOIN  tb_meal_item mi on mi.id = t.meal_item_id
        LEFT JOIN  tb_meal_attr ma on ma.id = mi.meal_attr_id
        LEFT JOIN  tb_kitchen k on k.id = mi.kitchen_id
        LEFT JOIN  tb_printer p on p.id = k.printer_id and p.${support} = 1
        where (t.order_id in (SELECT id FROM tb_order where id =? 
        and t.orgin_count - t.refund_count > 0
        or parent_order_id = ?) ) order by ma.print_sort asc
        `,
        { replacements: [orderId, orderId], type: posSqlite.QueryTypes.SELECT }
    ).then(function (results) {
        return callback(null, results);
    }).catch(function (err) {
        return callback(err);
    });
};


/**
 * 新多动线菜品打印查询
 * @param orderId
 * @param callback
 */

exports.mayThreadByOrderId = function (orderId, callback) {
    posSqlite.query(`
        SELECT 'false' article_return,m.sort family_sort,a.sort article_sort,a.article_type,ma.article_id mealArticleId,ma.print_sort mealPrintSort,akp.kitchen_group_id,kg.status kitchenGroupStatus,
        t.id,t.article_id,t.article_name,t.type,t.count,t.original_price,t.unit_price,t.final_price,t.parent_id,t.sort,t.status,t.orgin_count,t.refund_count from tb_order_item  t 
        LEFT JOIN  tb_article a  on  a.id= substr(t.article_id,1,32) 
        LEFT JOIN  tb_article_family m on m.id= a.article_family_id 
        LEFT JOIN  tb_meal_item mi on mi.id = t.meal_item_id
        LEFT JOIN  tb_meal_attr ma on ma.id = mi.meal_attr_id
        LEFT JOIN  tb_article_kitchen_printer akp on akp.article_id = substr(t.article_id,1,32) 
        LEFT JOIN  tb_kitchen_group kg on kg.id = akp.kitchen_group_id
        where (t.order_id in (SELECT id FROM tb_order where id =? 
        and t.orgin_count - t.refund_count > 0
        or parent_order_id = ?) ) and  kg.status = 0 and a.article_type !=2  order by ma.print_sort asc;
        `,
        { replacements: [orderId, orderId], type: posSqlite.QueryTypes.SELECT }
    ).then(function (results) {
        return callback(null, results);
    }).catch(function (err) {
        return callback(err);
    });
};


/**
 * 新多动线退菜菜品打印查询
 * @param orderItemArr
 * @param callback
 */

exports.mayThreadRefundByOrderIds = function (orderItemArr, callback) {
    let orderItemId = lodash.map(orderItemArr, 'id').join(',');
    posSqlite.query(`
        SELECT 'false' article_return,m.sort family_sort,a.sort article_sort,a.article_type,ma.article_id mealArticleId,ma.print_sort mealPrintSort,akp.kitchen_group_id,
        t.id,t.article_id,t.article_name,t.type,t.count,t.original_price,t.unit_price,t.final_price,t.parent_id,t.sort,t.status,t.orgin_count,t.refund_count from tb_order_item  t 
        LEFT JOIN  tb_article a  on  a.id= substr(t.article_id,1,32) 
        LEFT JOIN  tb_article_family m on m.id= a.article_family_id 
        LEFT JOIN  tb_meal_item mi on mi.id = t.meal_item_id
        LEFT JOIN  tb_meal_attr ma on ma.id = mi.meal_attr_id
        LEFT JOIN  tb_article_kitchen_printer akp on akp.article_id =  substr(t.article_id,1,32) 
        LEFT JOIN  tb_kitchen_group kg on kg.id = akp.kitchen_group_id
        where  a.article_type != 2 and  t.id in(${orderItemId})  or t.parent_id in (${orderItemId}) 
        and  kg.status = 0  order by ma.print_sort asc;
        `,
            { type: posSqlite.QueryTypes.SELECT }
    ).then(function (results) {
        return callback(null, results);
    }).catch(function (err) {
        return callback(err);
    });
};

/**
 * 多动线菜品打印查询
 * @param orderId
 * @param callback
 */

exports.newPrintByOrderId = function (orderId, callback) {
    posSqlite.query(`
        SELECT 'false' article_return,m.sort family_sort,a.sort article_sort,a.article_type,ma.article_id mealArticleId,ma.print_sort mealPrintSort ,t.* from tb_order_item  t 
        LEFT JOIN  tb_article a  on  a.id= substr(t.article_id,1,32) 
        LEFT JOIN  tb_article_family m on m.id= a.article_family_id 
        LEFT JOIN  tb_meal_item mi on mi.id = t.meal_item_id
        LEFT JOIN  tb_meal_attr ma on ma.id = mi.meal_attr_id
        where (t.order_id in (SELECT id FROM tb_order where id =? 
        and t.orgin_count - t.refund_count > 0
        or parent_order_id = ?) ) order by ma.print_sort asc
        `,
        { replacements: [orderId, orderId], type: posSqlite.QueryTypes.SELECT }
    ).then(function (results) {
        return callback(null, results);
    }).catch(function (err) {
        return callback(err);
    });
};

exports.totalArticleByOrderId = function (orderId, distribution_mode_id,printOutDetails, callback) {
    let support = distribution_mode_id == 1 ? 'support_tangshi' : 'support_waidai';  // 1 堂吃  3 外带
    let sql = '';
    if (printOutDetails ==1 ){
        sql = `SELECT 'false' article_return,m.sort family_sort,a.sort article_sort,ma.article_id mealArticleId,ma.print_sort mealPrintSort ,p.*,t.* from tb_order_item  t 
        LEFT JOIN  tb_article a  on  a.id= substr(t.article_id,1,32) 
        LEFT JOIN  tb_article_family m on m.id= a.article_family_id 
        LEFT JOIN  tb_meal_item mi on mi.id = t.meal_item_id
        LEFT JOIN  tb_meal_attr ma on ma.id = mi.meal_attr_id
        LEFT JOIN  tb_kitchen k on k.id = mi.kitchen_id
        LEFT JOIN  tb_printer p on p.id = k.printer_id and p.${support} = 1
        where (t.order_id in (SELECT id FROM tb_order where id =? 
        or parent_order_id = ?) ) order by m.sort asc;`
    }else {
        sql = `SELECT 'false' article_return,m.sort family_sort,a.sort article_sort,ma.article_id mealArticleId,ma.print_sort mealPrintSort ,p.*,t.* from tb_order_item  t 
        LEFT JOIN  tb_article a  on  a.id= substr(t.article_id,1,32) 
        LEFT JOIN  tb_article_family m on m.id= a.article_family_id 
        LEFT JOIN  tb_meal_item mi on mi.id = t.meal_item_id
        LEFT JOIN  tb_meal_attr ma on ma.id = mi.meal_attr_id
        LEFT JOIN  tb_kitchen k on k.id = mi.kitchen_id
        LEFT JOIN  tb_printer p on p.id = k.printer_id and p.${support} = 1
        where t.count>0 and (t.order_id in (SELECT id FROM tb_order where  order_state!=9 and (id =? 
        or parent_order_id = ?) ) ) order by m.sort asc`;
    }
    console.log(orderId);
    console.log(sql);
    posSqlite.query(`${sql}`, { replacements: [orderId, orderId], type: posSqlite.QueryTypes.SELECT }
    ).then(function (results) {
        return callback(null, results);
    }).catch(function (err) {
        return callback(err);
    });
};

exports.refundCountByOrderId = function (orderId, callback) {
    let sql = `SELECT 'true' article_return, m.sort family_sort,a.sort article_sort, 
    t.id, t.order_id,t.article_id,t.article_name || '(退)'  article_name ,t.count,t.original_price,
    t.unit_price,t.final_price,t.remark,t.sort,t.status,t.type,t.parent_id,t.create_time,t.meal_item_id,
    t.kitchen_id,t.recommend_id,t.orgin_count,t.refund_count,t.meal_fee_number,t.change_count,t.print_fail_flag 
    from tb_order_item  t left   join  tb_article a  on  a.id=substr(t.article_id,1,32) 
    left   join  tb_article_family m on m.id = a.article_family_id  
    where (t.order_id in (SELECT id FROM tb_order where id = ? or parent_order_id = ? ))  and t.refund_count >0`;
    posSqlite.query(`${sql}`, { replacements: [orderId, orderId], type: posSqlite.QueryTypes.SELECT }
    ).then(function (results) {
        return callback(null, results);
    }).catch(function (err) {
        return callback(err);
    });
};


/**
 * 根据日期获取主订单列表
 * @param dates
 * @param callback
 */

exports.getOrderListByDates = function (dates, callback) {
    posSqlite.query(`select * from tb_order where (parent_order_id =''  or parent_order_id is null) and order_state = 2 and production_status !=6  and accounting_time=strftime('%Y-%m-%d', ?)`,
        { replacements: [dates], type: posSqlite.QueryTypes.SELECT }
    ).then(function (results) {
        return callback(null, results);
    }).catch(function (err) {
        return callback(err);
    });
};

/**
 * 根据日期获取已取消的主订单列表
 * @param dates
 * @param callback
 */

exports.getCancelOrderListByDates = function (dates, callback) {
    posSqlite.query(`select * from tb_order where (parent_order_id =''  or parent_order_id is null) and order_state = 9 or (order_state = 2 and production_status = 6)  and accounting_time=strftime('%Y-%m-%d', ?)`,
        { replacements: [dates], type: posSqlite.QueryTypes.SELECT }
    ).then(function (results) {
        return callback(null, results);
    }).catch(function (err) {
        return callback(err);
    });
};


/**
 * 根据日期获取主订单及子订单列表
 * @param dates
 * @param callback
 */
exports.getOrderAllByDates = function (dates, orderList, callback) {
    let orderListId = [];
    lodash.forEach(orderList, function (value) {
        orderListId.push(`'${value.id}'`);
    });
    let orderId = orderListId.join(',');
    posSqlite.query(`select * from tb_order where (order_state = 2 and production_status !=6 and ( id  in (${orderId}) or parent_order_id  in (${orderId}) )) and accounting_time=strftime('%Y-%m-%d', ?)`,
        { replacements: [dates], type: posSqlite.QueryTypes.SELECT }
    ).then(function (results) {
        return callback(null, results);
    }).catch(function (err) {
        return callback(err);
    });
};


/**
 * 根据id获取支付列表
 * @param orderIdArr []
 * @param callback
 */
exports.getOrderPaymentListById = function (orderIdArr, callback) {
    let orderId = orderIdArr.join(',');
    posSqlite.query(`SELECT id,order_id,payment_mode_id, sum(pay_value) pay_value,result_data  FROM tb_order_payment_item WHERE order_id in (${orderId}) and payment_mode_id not in(13,14,15,20,21)  GROUP BY payment_mode_id`,
        { type: posSqlite.QueryTypes.SELECT }
    ).then(function (results) {
        return callback(null, results);
    }).catch(function (err) {
        return callback(err);
    });
};

/**
 * 根据id获取线退款数据
 * @param orderIdArr []
 * @param callback
 */
exports.getRefundPaymentListById = function (orderIdArr, callback) {
    let orderId = orderIdArr.join(',');
    posSqlite.query(`SELECT * FROM tb_order_payment_item WHERE order_id in (${orderId}) AND payment_mode_id not in(13,14,15,20,21)`,
        { type: posSqlite.QueryTypes.SELECT }
    ).then(function (results) {
        return callback(null, results);
    }).catch(function (err) {
        return callback(err);
    });
};



/**
 * 根据id 获取补偿金额详情
 * @param orderIdArr
 * @param callback
 */
exports.getOrderRefundAmountListById = function (orderIdArr, callback) {
    let orderId = orderIdArr.join(',');
    // let sql = `SELECT p.order_id,-sum(p.pay_value) total_value,c.telephone from tb_order_payment_item  p
    // LEFT JOIN tb_order o on o.id= p.order_id LEFT JOIN tb_customer c on c.id = o.customer_id
    // where p.order_id in (${orderId}) and p.payment_mode_id not in (1,10) and p.pay_value <=0  GROUP BY p.order_id`;

    let sql = `SELECT p.order_id,-sum(p.pay_value) total_value,c.telephone from tb_order_payment_item  p 
    LEFT JOIN tb_order o on o.id= p.order_id LEFT JOIN tb_customer c on c.id = o.customer_id 
    where p.order_id in (${orderId}) and p.pay_value <=0  GROUP BY p.order_id`;

    posSqlite.query(sql, { type: posSqlite.QueryTypes.SELECT }
    ).then(function (results) {
        return callback(null, results);
    }).catch(function (err) {
        return callback(err);
    });
};


exports.deleteById = function (id, callback) {
    if (typeof callback != 'function') {
        callback = function () { };
    }

    order.destroy({ where: { id: id } }).then(function (result) {
        return callback(null, result);
    }).catch(function (err) {
        return callback(err);
    });
};


exports.selectOrderDiscount = function (orderId, callback) {
    let sql = `SELECT id,sum(order_pos_discount_money) orderPosDiscountMoney, sum(erase_money) eraseMoney from tb_order where id = '${orderId}' or parent_order_id = '${orderId}'`;
    posSqlite.query(sql, { type: posSqlite.QueryTypes.SELECT }
    ).then(function (results) {
        return callback(null, results[0]);
    }).catch(function (err) {
        return callback(err);
    });
};

exports.waitCallAllOrderList = function (callback) {
    let sql = `SELECT id,table_number,amount_with_children,order_money,create_time,customer_count,ver_code,order_state,production_status,pay_mode,call_times 
    from tb_order where (parent_order_id =''  or parent_order_id is null)  and order_state not in (1,9) and production_status = 2 
    and accounting_time=strftime('%Y-%m-%d', datetime('now','localtime')) order by create_time asc`;

    posSqlite.query(sql, { type: posSqlite.QueryTypes.SELECT }
    ).then(function (results) {
        return callback(null, results);
    }).catch(function (err) {
        return callback(err);
    });
};

exports.callNumber = function (orderId, callback) {
    let sql = `UPDATE tb_order set production_status = 3, call_times = call_times + 1, call_number_time = '${new Date().getTime()}' where id = '${orderId}'`;
    posSqlite.query(sql, { type: posSqlite.QueryTypes.SELECT }
    ).then(function (results) {
        return callback(null, results);
    }).catch(function (err) {
        return callback(err);
    });
};


