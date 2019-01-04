

const customSqlModel = require("../../../model/pos/customSql");
const articleMode = require('../../../model/pos/article');
const articlePriceMode = require('../../../model/pos/articlePrice');
const orderItemMode = require('../../../model/pos/orderItem');
const orderMode = require('../../../model/pos/order');

const generalUtil = require("../../../util/generalUtil");
const result = require("../../../util/resultUtil");
var async = require('async');
var moment = require('moment');

const orderState = require('../../../../app/constant/OrderState');
const webSocketClient = require("../../../util/webSocketClient");
const msgUtil = require("../../../util/msgUtil");

const { log ,appendFile} = require("../../../util/fileUtil");


const orderItemController = require("../../../controller/pos/orderItem");


module.exports = function (app) {
    return new Handler(app);
}

var Handler = function (app) {
    this.app = app;
}

var handler = Handler.prototype;

/**
 * 批量插入 订单项 
 * @param msg
 * @param session
 * @param next
 */
handler.batchInsertOrderItem = function (msg, session, next) {
    var orderItems = msg.dataList || [];
    for (var item of orderItems) {
        item.mealFeeNumber = item.mealFeeNumber * item.count; // mhkz添加，为了与本地存储格式保持一致，后期需要更改
    }
    async.waterfall([
        function (cb) {
            let currentWorkingStock = 0;
            // 减库存
            async.eachLimit(orderItems, 1, function (item, callback) {
                let orderItemInsertInfo =
                    {
                        id: item.id || null,
                        orderId: item.orderId || null,
                        articleId: item.articleId || '',
                        articleName: item.articleName || '',
                        count: item.count || 0,
                        originalPrice: item.originalPrice || 0,
                        unitPrice: item.unitPrice || 0,
                        finalPrice: item.finalPrice || 0,
                        remark: item.remark || '',
                        sort: item.sort || 0,
                        status: item.status || 0,
                        type: item.type || 0,
                        parentId: item.parentId || '',
                        createTime: item.createTime || '',
                        mealItemId: item.mealItemId || '',
                        kitchenId: item.kitchenId || '',
                        recommendId: item.recommendId || '',
                        orginCount: item.orginCount || 0,
                        refundCount: item.refundCount || 0,
                        mealFeeNumber: item.mealFeeNumber || 0,
                        changeCount: item.changeCount || 0,
                        printFailFlag: item.printFailFlag || 0,
                        posDiscount: item.posDiscount,
                        weight: item.weight || 0,
                        needRemind: item.needRemind || 0,
                    };
                orderItemMode.save(orderItemInsertInfo, function (err, reply) {
                    if (err) return callback(err);
                    //单品 套餐子项  新规格
                    if (item.type == 1 || item.type == 4 || item.type == 5 || item.type == 8) {
                        let sql = `select current_working_stock from tb_article where id = '${item.articleId}'`;
                        customSqlModel.getOneCustomSqlInfo(sql, function (err, article) {
                            //  如果报错，或者未找到对应的餐品，则直接 减下一个库存
                            if (err || !article) {
                                return callback(err || !article);
                            }
                            currentWorkingStock = article.current_working_stock - item.count;
                            var articleInfo = {
                                currentWorkingStock: currentWorkingStock > 0 ? currentWorkingStock : 0,
                                isEmpty: currentWorkingStock > 0 ? 0 : 1
                            };
                            articleMode.updateById(item.articleId, articleInfo, function (err, reply) { // 
                                if (err) { return callback(err); }
                                callback();
                            });
                        });
                    } else if (item.type == 2) {
                        //老规格 老规格只检查子项
                        let sql = `SELECT article_id,current_working_stock from tb_article_price where id = '${item.articleId}'`;
                        customSqlModel.getOneCustomSqlInfo(sql, function (err, articlePrice) {
                            if (err || !articlePrice) {
                                return callback(err || !articlePrice);
                            }
                            currentWorkingStock = articlePrice.current_working_stock - item.count;
                            //先更新老规格子项
                            var articlePriceInfo = {
                                currentWorkingStock: currentWorkingStock > 0 ? currentWorkingStock : 0,
                            };
                            articlePriceMode.updateById(item.articleId, articlePriceInfo, function (err, reply) {
                                if (err) { return callback(err) }
                                //再更新老规格主项
                                sql = `select current_working_stock from tb_article where id = '${articlePrice.article_id}'`;
                                customSqlModel.getOneCustomSqlInfo(sql, function (err, article) {
                                    if (err || !article) {
                                        return callback(err || !article);
                                    }
                                    currentWorkingStock = article.current_working_stock - item.count;
                                    var articleInfo = {
                                        currentWorkingStock: currentWorkingStock > 0 ? currentWorkingStock : 0,
                                        isEmpty: currentWorkingStock > 0 ? 0 : 1
                                    };
                                    articleMode.updateById(articlePrice.article_id, articleInfo, function (err, reply) {
                                        if (err) {
                                            return callback(err);
                                        }
                                        callback();
                                    });
                                });
                            });
                        });
                    } else {
                        callback();
                    }
                })
            }, function (err) {
                if (err) return cb(err);
                cb(null)
            });
        }
    ], function (err) {
        if (err) {
            return result.error(next, err.toString(), msg);
        } else {
            result.success(next)
        }
    });
}


/**
 * 菜品销量
 * @param msg
 * @param session
 * @param next
 */
handler.articleSales = function (msg, session, next) {

    if (!msg.reportDate) {
        return result.error(next, "缺少reportDate参数", msg);
    }

    var start = +moment(moment(msg.reportDate).format('YYYY-MM-DD 00:00:00')).format('x');
    var end = start + (60 * 60 * 24 * 1000) - 1000;

    async.parallel({
        articleTotalSales: function (done) {
            let sql = `
                    SELECT sum(a.count) as count FROM tb_order_item a 
                    left   join  tb_order b  
                    on  b.id = a.order_id
                    where 
                    b.order_state = ${orderState.HAS_PAY} 
                    and (a.parent_id is null  or a.parent_id = '')
                    and a.create_time > ${start}
                    and a.create_time < ${end}`;
            customSqlModel.getAllCustomSqlInfo(sql, function (err, data) {
                if (err) done(err.toString());
                done(null, data)
            });
        },
        articleTypeNameAndSales: function (done) {
            let sql = `
                    select   sum(a.count) count, c.name familyName ,b.article_family_id from   tb_order_item a 
                    left   join  tb_order d  
                    on  d.id = a.order_id
                    left   join  tb_article b 
                    on   substr(a.article_id,1,32)=b.id 
                    left   join  tb_article_family c 
                    on  b.article_family_id = c.id
                    where 
                    d.order_state = ${orderState.HAS_PAY} 
                    and (a.parent_id is null  or a.parent_id = '')
                    and a.create_time > ${start}
                    and a.create_time < ${end}
                    group by c.name`;
            customSqlModel.getAllCustomSqlInfo(sql, function (err, data) {
                if (err) done(err.toString());
                done(null, data)
            });
        }
    }, function (error, results) {
        if (error) return result.error(next, error.toString(), msg);
        result.success(next, results)
    });

}

/**
 * 根据菜品分类id 查询名称
 * @param msg
 * @param session
 * @param next
 */
handler.articleByFamilyId = function (msg, session, next) {

    if (!msg.reportDate) {
        return result.error(next, "reportDate is needed", msg);
    }

    if (!msg.familyId) {
        return result.error(next, "familyId is needed", msg);
    }

    var start = +moment(moment(msg.reportDate).format('YYYY-MM-DD 00:00:00')).format('x');
    var end = start + (60 * 60 * 24 * 1000) - 1000;
    let sql = `
                select  a.id,
                aun.id newUnit, 
                sum(a.count)  count,
                b.id articleId,
                a.article_name itemName,
                b.name articleName,
                b.article_type, 
                b.has_unit ,
                b.article_family_id, 
                a.parent_id from   tb_order_item a
                left   join  tb_order d  
                on  	d.id = a.order_id
                left   join  tb_article b  
                on     substr(a.article_id,1,32)=b.id  	
                left   join  tb_article_family c 
                on  b.article_family_id = c.id
                left join tb_article_unit_new aun 
                on b.id = aun.article_id
                where 
                d.order_state = ${orderState.HAS_PAY} 
                and (a.parent_id is null  or a.parent_id = '')
                and a.count > 0 
                and c.id = '${msg.familyId}'
                and a.create_time > ${start}
                and a.create_time < ${end}
                GROUP BY b.name `;
    customSqlModel.getAllCustomSqlInfo(sql, function (err, data) {
        if (err) result.error(next, err.toString(), msg);

        result.success(next, data);
    })
}



/**
 * 根据菜品id 查询订单信息
 * @param msg
 * @param session
 * @param next
 */
handler.getOrderItemByArticleId = function (msg, session, next) {

    if (!msg.reportDate) {
        return result.error(next, "reportDate is needed", msg);
    }

    if (!msg.articleId) {
        return result.error(next, "articleId is needed", msg);
    }
    if (!msg.articleType) {
        return result.error(next, "articleType is needed", msg);
    }
    var start = +moment(moment(msg.reportDate).format('YYYY-MM-DD 00:00:00')).format('x');
    var end = start + (60 * 60 * 24 * 1000) - 1000;

    let articleType = msg.articleType;
    let articleId = msg.articleId;

    let sql = '';
    if (articleType == 1) {
        sql = ` select  a.id itemId, sum(a.count)  count, b.id tb_articleId, a.article_name itemName, b.name articleName from   tb_order_item a
                left   join  tb_order d   on      d.id = a.order_id   left   join  tb_article b    on     substr(a.article_id,1,32)=b.id   
                where   (a.parent_id is null  or a.parent_id = '')  and a.count > 0   and d.order_state = ${orderState.HAS_PAY} 
                and substr(a.article_id,1,32) = '${articleId}'   and a.create_time > ${start}  and a.create_time < ${end} GROUP BY a.article_name `;
        customSqlModel.getAllCustomSqlInfo(sql, function (err, data) {
            if (err) result.error(next, err.toString(), msg);
            result.success(next, data);
        })
    } else {
        sql = ` SELECT 
                GROUP_CONCAT("'"||a.id||"'") id ,
                a.article_name itemName,
                a.article_id articleId 
                from   tb_order_item a 
                where a.article_id = '${articleId}' 
                and a.create_time > ${start}
                and a.create_time < ${end}
                GROUP BY a.article_name`;
        customSqlModel.getOneCustomSqlInfo(sql, function (err, reply) {
            if (error) return result.error(next, err.toString(), msg);
            let sqlTo = ` 
            select sum(c.count)  count, a.name attrName,b.article_name articleName from  tb_meal_attr as a 
            left JOIN  tb_meal_item as b ON b.meal_attr_id = a.id 
            left JOIN  tb_order_item as c ON c.meal_item_id = b.id
            left JOIN  tb_order as d on d.id = c.order_id 
            where a.article_id = '${reply.articleId}'
            and c.count >0 
            and  d.order_state = ${orderState.HAS_PAY}
            and c.parent_id in (${reply.id})	
            and c.create_time > ${start}
            and c.create_time < ${end}
            GROUP BY a.name ,b.article_name`;

            customSqlModel.getAllCustomSqlInfo(sql, function (err, data) {
                if (err) result.error(next, err.toString(), msg);

                result.success(next, data);
            })
        })
    }
}


/**
 * 根据订单id 获取菜品列表
 * @param msg
 * @param session
 * @param next
 */
handler.getOrderItemByOrderId = function (msg, session, next) {

    if (result.isEmpty(msg.orderId)) {
        return result.error(next, error.toString() || " 缺少 orderId", msg);
    }
    let sql = `SELECT * from tb_order_item where order_id = '${msg.orderId}'  ORDER BY type DESC`;
    customSqlModel.getAllCustomSqlInfo(sql, function (error, orderItems) {
        if (error) {
            return result.error(next, error.toString(), msg);
        }
        let orderItemList = [];
        for (let orderItem of orderItems) {
            orderItemList.push(generalUtil.convertHumpName(orderItem));
        }
        return result.success(next, orderItemList);
    });
}
/**
 * 根据订单id 修改菜品重量
 * @param msg
 * @param session
 * @param next
 */
handler.updateOrderItemWeight = function (msg, session, next) {
    let itemId = msg.orderItemId;
    let weight = msg.weight;
    let articleName = msg.articleName;
    let updateData = [];
    let updateOrderItems = { orderItem: [] };
    let updateOrders = { order: [] };
    async.waterfall([
        function (cb) {// 1 、查找订单号 和 订单项原价 和 菜品项修改状态
            let sql = `select order_id ,article_id from tb_order_item where id = '${itemId}'`;
            customSqlModel.getOneCustomSqlInfo(sql, function (err, orderItemInfo) {
                sql = `select catty_money from tb_article where id = '${orderItemInfo.article_id}'`;
                customSqlModel.getOneCustomSqlInfo(sql, (err, articleInfo) => {
                    if (err || !orderItemInfo) return result.error(next, '无此订单', msg);
                    let weightInfo = {
                        id: itemId,
                        weight: weight,
                        needRemind: 0,
                        articleName: articleName,
                        originalPrice: (articleInfo.catty_money * weight),
                        unitPrice: (articleInfo.catty_money * weight),
                        finalPrice: (articleInfo.catty_money * weight)
                    }
                    orderItemMode.updateById(itemId, weightInfo, function (err, reply) {
                        updateOrderItems.orderItem.push(weightInfo)
                        cb(err, orderItemInfo);
                    });
                });
            })
        },
        function (orderItemInfo, cb) { //2、修改当前order总价 和状态
            let orderId = orderItemInfo.order_id;
            let sql = `select final_price , need_remind from tb_order_item where order_id = '${orderId}'`;
            let orderMoneyInfo = {};
            let needConfirmOrderItem = 0;
            let totalPrice = 0;
            customSqlModel.getAllCustomSqlInfo(sql, function (err, orderFinalPrice) {
                for (let i = 0; i < orderFinalPrice.length; i++) {
                    totalPrice += orderFinalPrice[i].final_price;
                    if (orderFinalPrice[i].need_remind) { // 有没核重的菜品
                        needConfirmOrderItem = 1;
                    }
                }
                sql = `select * from tb_order where id = '${orderId}'`
                customSqlModel.getOneCustomSqlInfo(sql, function (err, orderInfo) {
                    orderMoneyInfo.id = orderId;
                    orderMoneyInfo.needConfirmOrderItem = needConfirmOrderItem;
                    orderMoneyInfo.paymentAmount = totalPrice + (orderInfo.service_price || 0);
                    orderMoneyInfo.originalAmount = totalPrice + (orderInfo.service_price || 0);
                    orderMoneyInfo.orderMoney = totalPrice + (orderInfo.service_price || 0);
                    orderMode.updateById(orderId, orderMoneyInfo, function (err, reply) {
                        updateOrders.order.push(orderMoneyInfo);
                        cb(err, orderInfo);
                    });
                });
            })
        },
        function (orderItemInfo, cb) { // 3、查询主订单, 子订单, 兄弟订单, 父订单 修改父单amount_with_children 和 核重状态
            let sql = `select id,order_money,parent_order_id,payment_amount,original_amount,need_confirm_order_item from tb_order where 
                           (id = '${orderItemInfo.id}' and (parent_order_id is null or parent_order_id = ''))
                        or  parent_order_id  = '${orderItemInfo.id}'
                        or  parent_order_id  = '${orderItemInfo.parent_order_id || 'no parent'}'
                        or ( id = '${orderItemInfo.parent_order_id || 'no parent'}' )`;
            customSqlModel.getAllCustomSqlInfo(sql, function (err, mainAndChildrenOrder) {
                let updateMainInfo = {};
                updateMainInfo.orderMoney = 0;
                updateMainInfo.originalAmount = 0;
                updateMainInfo.paymentAmount = 0;
                updateMainInfo.needConfirmOrderItem = 0;
                updateMainInfo.amountWithChildren = 0;
                let ids = [];
                for (let i = 0; i < mainAndChildrenOrder.length; i++) {
                    ids.push(`'${mainAndChildrenOrder[i].id}'`);
                    if (!mainAndChildrenOrder[i].parent_order_id || mainAndChildrenOrder[i].parent_order_id == '') { //主订单
                        updateMainInfo.id = mainAndChildrenOrder[i].id;
                        updateMainInfo.orderMoney = mainAndChildrenOrder[i].order_money;
                        updateMainInfo.paymentAmount = mainAndChildrenOrder[i].payment_amount;
                        updateMainInfo.originalAmount = mainAndChildrenOrder[i].original_amount;
                    } else { //子订单
                        updateMainInfo.amountWithChildren += mainAndChildrenOrder[i].order_money;
                    }
                }
                // console.log('----------------ids-------------------', ids)
                let sql = `select count(*) count from tb_order_item where order_id in (${ids.toString()}) and need_remind = 1 and count > 0;` // 所有订单是否还有未核重的菜品
                customSqlModel.getOneCustomSqlInfo(sql, function (err, needRemindInfo) {
                    if (needRemindInfo.count > 0) {
                        updateMainInfo.needConfirmOrderItem = 1;
                    }
                    updateMainInfo.amountWithChildren = updateMainInfo.amountWithChildren ? updateMainInfo.amountWithChildren + updateMainInfo.orderMoney : 0;
                    updateOrders.order.push(updateMainInfo);
                    orderMode.updateById(updateMainInfo.id, updateMainInfo, (err, reply) => {
                        cb(err, orderItemInfo);
                    })
                });
            });
        }
    ], function (err) {
        if (err) {
            return result.error(next, err.toString(), msg);
        }
        updateData.push(updateOrderItems);
        updateData.push(updateOrders);
        webSocketClient.syncUpdateData(JSON.stringify(updateData), 'weightPackage')
        return result.success(next);
    });
};

/**
 * 赠菜
 * @param msg
 * @param session
 * @param next
 */
handler.grantArticleByOrderIdAndOrderItems = function (msg, session, next) {

    orderItemController.grantArticleByOrderIdAndOrderItems(msg,(err, reply) => {
        if (err) {
            result.error(next,err.toString(),msg);
        } else {
            let sql = `SELECT table_number, ver_code FROM tb_order WHERE id = '${msg.id}'`
            customSqlModel.getOneCustomSqlInfo(sql, (err, resultData) => {
                msgUtil.pushAll('event', {
                    type: 'normalOrder',
                    eventType: 'grantArticle',
                    msg: `${resultData.table_number||resultData.ver_code}号桌 赠菜成功!`,
                    data: msg.id
                })
                result.success(next,reply);
            })
        }
    });
};