const result = require("../../../util/resultUtil");
const dateUtil = require("../../../util/dateUtil");
const generalUtil = require("../../../util/generalUtil");
const orderState = require("../../../constant/OrderState");
const productionStatus = require("../../../constant/ProductionStatus");
const shopMode = require("../../../constant/ShopMode");
const payMode = require("../../../constant/PayMode");
const fileUtil = require("../../../util/fileUtil");
const orderItemType = require("../../../constant/OrderItemType");
const kitchenModel = require("../../../model/pos/kitchen")

const orderModel = require("../../../model/pos/order");
const ordersync = require("../../../controller/pos/orderSync")
const shopDetailMode = require('../../../model/pos/shopDetail');
const areaMode = require('../../../model/pos/area');
const orderItemMode = require('../../../model/pos/orderItem');
const orderPaymentItemMode = require('../../../model/pos/orderPaymentItem');
const articleMode = require('../../../model/pos/article');
const articlePriceMode = require('../../../model/pos/articlePrice');
const orderPaymentItemModel = require('../../../model/pos/orderPaymentItem');
const customSqlModel = require("../../../model/pos/customSql");
const orderItemModel = require("../../../model/pos/orderItem");
const shopDetailModel = require("../../../model/pos/shopDetail");
const requestUtil = require("../../../util/requestUtil");

const msgUtil = require("../../../util/msgUtil");
const cacheUtil = require("../../../util/cacheUtil")


var async = require('async');
var lodash = require('lodash');
var moment = require('moment');
const request = require("request");

const webSocketClient = require("../../../util/webSocketClient");
const tvWebsocketClient = require("../../../util/tvWebSocketClient")
const mqttClient = require("../../../dao/mqtt/index");
//-------------新添加层controller
const orderController = require("../../../controller/pos/order");
const userController = require("../../../controller/pos/user");
const emqttClient = require("../../../dao/mqtt/index")

var lodTimer = null; // 用来判断，浏览器是否刷新

module.exports = function (app) {
    return new Handler(app);
}

var Handler = function (app) {
    this.app = app;
}

var handler = Handler.prototype;

/**
 * new 写入远程订单数据
 * @param msg
 * @param session
 * @param next
 */
handler.insertByOrderId = function (msg, session, next) {

    fileUtil.appendFile(`orderLogs`, `${msg.__route__}=>【收到微信订单】orderId：${msg.model.id},\n,${JSON.stringify(msg)}`);
    orderModel.selectById(msg.model.id, function (error, row) {
        if (error) return result.error(next, error.toString(), msg);
        if (row && row.id) return result.success(next); // 如果已存在 ，则不再执行
        //  如果不存在，则插入数据

        if (msg.model.parent_order_id) {  // 如果是子订单，则修改父订单的 amount_with_children 和 count_with_child 字段
            orderModel.selectById(msg.model.parent_order_id, function (error, parentOrder) {
                if (error) return result.error(next, error.toString());
                orderModel.insertSelectiveByOrderId(msg.model, function (error) {
                    if (error != null) return result.error(next, error.toString(), msg);
                    // 修改父订单信息
                    // 如果父订单的 amountWithChildren 为零，说明此子订单为第一个子订单，需要给 父订单的 amount_with_children 字段赋值。
                    var amountWithChildren = parentOrder.amountWithChildren || parentOrder.orderMoney;
                    var countWithChild = parentOrder.countWithChild || parentOrder.articleCount;
                    parentOrder.amountWithChildren = amountWithChildren + msg.model.order_money;
                    parentOrder.countWithChild = countWithChild + msg.model.article_count;
                    orderModel.updateByOrderId(parentOrder, function (error) {
                        if (error) return result.error(next, error.toString(), msg);
                        result.success(next);
                    })
                })
            });
        } else {  //没有父订单
            orderModel.selectPushOrderCount(function (error, orderNumber) {
                if (error) return result.error(next, error.toString(), msg);
                msg.model.order_number = ++orderNumber;
                orderModel.insertSelectiveByOrderId(msg.model, function (error) {
                    if (error) return result.error(next, error.toString(), msg);
                    result.success(next);
                })
            });
        }
    });
}

/**
 * 确认支付（微信端发起的  现金或者银联 支付）
 * @param msg
 * @param session
 * @param next
 */
handler.confirmPayment = function (msg, session, next) {

    customSqlModel.updateSelective(`tb_order`, msg.model, function (error) {
        if (error) {
            fileUtil.appendFile(`orderLogs`, `${msg.__route__}=>【微信订单】确认支付失败。 orderId：${msg.model.id},\n,${error.toString()}`);
            result.error(next, error.toString(), msg);
            return;
        }
        fileUtil.appendFile(`orderLogs`, `${msg.__route__}=>【微信订单】确认支付成功。 orderId：${msg.model.id},\n,${JSON.stringify(msg.model)}`);
        result.success(next);
    })
}

/**
 * parentid
 * @param msg
 * @param session
 * @param next
 */
handler.batchChangeChildOrder = function (msg, session, next) {
    let condition = {
        parent_order_id: msg.model.parent_order_id
    }
    delete msg.model.parent_order_id;
    customSqlModel.updateSelectiveCondition('tb_order', msg.model, condition, function (error, reply) {
        if (error != null) {
            result.error(next, error.toString(), msg);
            return;
        }
        result.success(next);
    });
}

/**
 * 根据订单查询订单信息
 * @param msg
 * @param session
 * @param next
 */
handler.selectById = function (msg, session, next) {
    var orderId = msg.orderId;

    if (result.isEmpty(orderId)) return result.error(next, "订单ID不能空", msg);

    async.waterfall([
        function (cb) {
            let sql = `SELECT  (SELECT sum(order_money)  FROM tb_order WHERE id = '${orderId}' or ( parent_order_id= '${orderId}' and order_state = 2)) receipts, * FROM tb_order WHERE  id = '${orderId}'`;
            customSqlModel.getOneCustomSqlInfo(sql, function (error, order) {
                if (error) return cb(error.toString());
                if (order == null) return result.success(next);
                //打印指令发出时 更新production_status的状态
                order.payOrderMoney = order.order_state == 1 ? order.order_money : 0;
                customSqlModel.getAllCustomSqlInfo(`SELECT * from tb_order_item where order_id = '${orderId}'  ORDER BY type DESC`, function (error, orderItems) {
                    if (error) return cb(error.toString());
                    order.order_item_list = orderItems || [];
                    cb(null, order);

                });
            });
        },
        function (order, cb) {
            //只查询未支付订单总金额
            customSqlModel.getOneCustomSqlInfo(`select sum(order_money) orderMoney from tb_order where parent_order_id ='${orderId}' and order_state=1`, function (error, childOrder) {
                if (error) return cb(error.toString());
                order.payOrderMoney += childOrder.orderMoney;
                order.order_money = order.receipts;
                let sql = "select * from tb_shop_detail";
                customSqlModel.getOneCustomSqlInfo(sql, function (error, shopDetail) {
                    // 如果是先付 只查询已经支付的菜品 allow_first_pay:0 allow_after_pay:1
                    let first_pay_status = '';
                    if (!shopDetail.allow_first_pay) {
                        first_pay_status = `and order_state = 2`;
                    }
                    let sql = `select * from tb_order_item where order_id in(select id from tb_order where parent_order_id= '${orderId}' ${first_pay_status} and order_state != 9 ) ORDER BY type DESC`;
                    customSqlModel.getAllCustomSqlInfo(`${sql}`, function (error, childrenOrderItems) {
                        if (error) return cb(error.toString());
                        order.childreorder_item_list = childrenOrderItems || [];
                        cb(null, order);
                    });
                });
            });
        }
    ], function (err, order) {
        if (err) {
            return result.error(next, err.toString(), msg);
        } else {
            result.success(next, order);
        }
    });
}

/**
 * 绑定桌号并且创建订单
 * @param msg
 * @param session
 * @param next
 */
handler.bindTable = function (msg, session, next) {
    orderController.bindTable(msg, (err, resultData) => {
        if (err) {
                if (err == '当前桌位被占用！') {
                    msgUtil.pushAll('event', {
                        type: 'bindError',
                        msg: `${msg.tableNumber} 桌位被占用`,
                        data: resultData.orderId
                    })
                }
                fileUtil.appendFile(`【 NewPos 终端操作】 `, `${msg.__route__}=> 开台失败：,\n,${err.toString()}，【传入参数】: ${msg}`);
                result.success(next, {
                    message:  '桌位被占用',
                    data: null
                });
        } else {
            if (msg.remark != '加菜') {
                msgUtil.pushAll('event', {
                    type: 'normalOrder',
                    eventType: 'bindTable',
                    tableNumber: msg.tableNumber.toString().replace(/\b(0+)/gi,""),
                    msg: `【${msg.tableNumber.toString().replace(/\b(0+)/gi,"")}号】桌位，开台成功！`,
                    orderId: resultData.orderId,
                    childrenOrder: msg.childrenOrder || 0,
                    time: new Date(),
                    ignoreUser: msg.uid
                })
                fileUtil.appendFile(` NewPos 终端操作 `, `${msg.__route__}=> 开台成功：,\n,${resultData}，【传入参数】: ${JSON.stringify(msg)}`);
            } else {
                fileUtil.appendFile(` NewPos 终端操作 `, `${msg.__route__}=> 加菜订单开台成功：,\n,${resultData}，【传入参数】: ${JSON.stringify(msg)}`);
            }
            webSocketClient.updateTableState(msg.tableNumber.toString().replace(/\b(0+)/gi,""), false, resultData.orderId, function () {})
            var data = {
                orderId: resultData.orderId,
                tableNumber: msg.tableNumber.toString().replace(/\b(0+)/gi,""),
                state: false,  // false：开台   true：释放
                type:"updateTableState",
                syncState: 1,
                lastSyncTime: resultData.lastSyncTime
            };
            //
            emqttClient.weChatPush('order', 'updateTableState', resultData.orderId, data)
            result.success(next, resultData.orderId);
        }
    })
}

/**
 * 菜品的所有供应时间段
 * @param msg
 * @param session
 * @param next
 */
handler.checkArticleSupporTime = function (msg, session, next) {
    var orderItems = msg.orderItems;

    if (!orderItems || orderItems.length == 0) { return result.error(next, "请选择菜品~", msg); }
    let sql = "select * from tb_article a where a.activated = 1";
    let articleMap = {};
    customSqlModel.getAllCustomSqlInfo(sql, function (error, rows) {
        for (let article of rows) {
            articleMap[article.id] = article;
        }
        sql = "select * from tb_article_price";
        var articlePriceMap = {};
        customSqlModel.getAllCustomSqlInfo(sql, function (error, rows) {
            for (let articlePrice of rows) {
                articlePriceMap[articlePrice.id] = articlePrice;
            }
            var notSellIds = [];
            for (var item of orderItems) {
                if (item.type == 1 || item.type == 5 || item.type == 8) { // 单品 和 新规格 直接匹配 id
                    var a = articleMap[item.id];
                    if (!(a && a.current_working_stock > 0)) {
                        notSellIds.push(item.id);
                    }
                } else if (item.type == 2) { // 老规格    article_prices_id
                    var ap = articlePriceMap[item.article_prices_id];
                    if (!(ap && ap.current_working_stock > 0)) {
                        notSellIds.push(ap.id);
                    }
                } else if (item.type == 3) { // 套餐      mealItems.articleId
                    for (var mealItem of item.mealItems) {
                        var mi = articleMap[mealItem.articleId];
                        if (!(mi && mi.current_working_stock > 0)) {
                            notSellIds.push(item.id);
                            // break;  // 套餐子品可能有多个， 只要有一个选中的子品 无法购买，则可退出循环
                        }
                    }
                }
            }
            // 数量大于零，则不再继续执行 供应
            // 时间检查
            if (notSellIds.length > 0) {
                result.error(next, notSellIds, msg);
            } else {  //  检查 供应时间
                let sql = "SELECT * from tb_support_time where begin_time <= time('now', 'localtime') and end_time >= time('now', 'localtime')";
                customSqlModel.getAllCustomSqlInfo(sql, function (error, supportTimes) {
                    var supportTimeIds = [];
                    for (var time of supportTimes) {
                        if (dateUtil.isWeekDay(time.support_week_bin)) {
                            supportTimeIds.push(time.id);
                        }
                    }
                    sql = "SELECT a.id,st.discount from tb_support_time st LEFT JOIN tb_article_support_time ast on st.id = ast.support_time_id" +
                        " LEFT JOIN tb_article a on ast.article_id = a.id ";
                    if (supportTimeIds && supportTimeIds.length != 0) {
                        sql += " where st.id in (" + supportTimeIds.toString() + ")";
                    }
                    customSqlModel.getAllCustomSqlInfo(sql, function (err, rows) {
                        let articleAndDiscountMap = generalUtil.listToMap(rows)
                        for (var item of orderItems) {
                            var articleId = item.id.indexOf("@") == -1 ? item.id : item.id.substring(0, item.id.indexOf("@"));
                            var supportTimeArticle = articleAndDiscountMap[articleId];
                            if (!supportTimeArticle || supportTimeArticle.discount != item.discount) {
                                notSellIds.push(item.id);
                            }
                        }
                        notSellIds.length == 0 ? result.success(next) : result.error(next, notSellIds, msg);
                    });
                });
            }
        });
    })
}

/**
 * 下单
 * @param msg
 * @param session
 * @param next
 */
handler.pushOrder = function (msg, session, next) {
    let shopDetail
    async.waterfall([
        function (cb) { //基础验证
            if (!msg.orderItems || msg.orderItems.length == 0) {
                cb("请选择菜品~");
                return;
            }
            let sql = "select * from tb_shop_detail";
            customSqlModel.getOneCustomSqlInfo(sql, function (error, shop) {
                shopDetail = shop
                if (error || !shopDetail) {
                    cb(error || "未找到店铺信息!");
                } else {
                    if ((shopDetail.shop_mode == shopMode.CALL_NUMBER ||shopDetail.shop_mode == FOOTMUMBER_ORDER)  && result.isEmpty(msg.masterOrderId)) {
                        sql = "SELECT count(id) orderNumber from tb_order where accounting_time=strftime('%Y-%m-%d', datetime('now','localtime')) and (parent_order_id =''  or parent_order_id is null)";
                        customSqlModel.getOneCustomSqlInfo(sql, function (error, data) {
                            orderNumber = data.orderNumber;
                            //  创建订单
                            var orderInfo = {
                                id: generalUtil.randomUUID(),
                                distributionModeId: msg.distributionModeId,
                                orderState: 1, // 默认 1  待下单状态
                                productionStatus: 0, // 默认 0 待下单状态
                                accountingTime: dateUtil.sdfDay(),
                                serialNumber: dateUtil.getSerialNumber(),
                                allowCancel: 1,    // 默认 1 ，允许取消
                                closed: 0,
                                createTime: dateUtil.timestamp(),
                                syncState: 0,
                                dataOrigin: 0,
                                shopDetailId: generalUtil.shopId,
                                isPosPay: 0,  // 默认为 0 ，当在 pos端买单时，设置为 1
                                payType: 0,   //  电视叫号，立即支付
                                allowContinueOrder: 1,    //  电视叫号不允许加菜
                                allowAppraise: 0, // 默认不允许评论
                                orderMode: shopDetail.shop_mode,
                                amountWithChildren: 0,// 默认为0 ，订单消费总和，包括子订单的金额
                                verCode: generalUtil.getRandomNumber(),
                                orderNumber: ++orderNumber //  当天的订单数
                            };
                            orderModel.upsert(orderInfo, function (err, reply) {
                                msg.masterOrderId = orderInfo.id;
                                cb(null, msg);
                            });
                        });
                    } else if (result.isEmpty(msg.masterOrderId)) {
                        cb("订单ID不能为空~");
                        return;
                    } else {
                        cb(null, msg);
                    }
                }
            });
        },
        function (msg, cb) { //初始化数据
            var orderInfo = {
                id: msg.childrenOrderId == null ? msg.masterOrderId : msg.childrenOrderId,
                order_items: msg.orderItems,
            }
            async.parallel({
                articleInfo: function (cb) { // 所有激活的菜品
                    let sql = "select * from tb_article a where a.activated = 1";
                    let articleMap = {};
                    customSqlModel.getAllCustomSqlInfo(sql, (err, data) => {
                        for (let article of data) {
                            articleMap[article.id] = article;
                        }
                        cb(null, articleMap)
                    });
                },
                articlePriceInfo: function (cb) {
                    let sql = "select * from tb_article_price"; // ?? 菜品老规格详情表
                    let articlePriceMap = {};
                    customSqlModel.getAllCustomSqlInfo(sql, (err, data) => {
                        for (let articlePrice of data) {
                            articlePriceMap[articlePrice.id] = articlePrice;
                        }
                        cb(null, articlePriceMap)
                    });
                },
                articleUnitDetailInfo: function (cb) {
                    let sql = "select * from tb_article_unit_detail"; // ?? 菜品新规格属性子项关联表
                    let articleUnitDetailMap = {};
                    customSqlModel.getAllCustomSqlInfo(sql, (err, data) => {
                        for (let articleUnit of data) {
                            let articleUnitDetail = null;
                            for (let i in data) {
                                articleUnitDetail = data[i];
                                articleUnitDetailMap[articleUnitDetail.id] = articleUnitDetail;
                            }
                        }
                        cb(null, articleUnitDetailMap)
                    });
                },
                unitDetailInfo: function (cb) {
                    let sql = "select * from tb_unit_detail"; // ?? 菜品新规格属性子项表
                    let unitDetailMap = {};
                    customSqlModel.getAllCustomSqlInfo(sql, (err, data) => {
                        let unitDetail = null;
                        for (let i in data) {
                            unitDetail = data[i];
                            unitDetailMap[unitDetail.id] = unitDetail;
                        }
                        cb(null, unitDetailMap)
                    });
                },
                mealItemInfo: function (cb) {
                    let sql = "select * from tb_meal_item"; // ?? 套餐属性子项表
                    let mealItemMap = {};
                    customSqlModel.getAllCustomSqlInfo(sql, (err, data) => {
                        let mealItem = null;
                        for (let i in data) {
                            mealItem = data[i];
                            mealItemMap[mealItem.id] = mealItem;
                        }
                        cb(null, mealItemMap)
                    });
                },
                weightPackageInfo: function (cb) {
                    let sql = "select * from tb_weight_package_detail;"; // ??
                    let weightPackageMap = {}
                    customSqlModel.getAllCustomSqlInfo(sql, (err, data) => {
                        for (let i in data) {
                            weightPackageMap[data[i].id] = data[i];
                        }
                        cb(null, weightPackageMap)
                    });
                }

            }, (err, resData) => {
                orderInfo.articleMap = resData.articleInfo;
                orderInfo.articlePriceMap = resData.articlePriceInfo;
                orderInfo.articleUnitDetailMap = resData.articleUnitDetailInfo;
                orderInfo.unitDetailMap = resData.unitDetailInfo;
                orderInfo.mealItemMap = resData.mealItemInfo;
                orderInfo.weightPackageMap = resData.weightPackageInfo;
                orderInfo.orderItemInfo = getOrderItems(orderInfo);
                cb(null, msg, orderInfo);
            })
        },
        //检查库存
        function (msg, orderInfo, cb) {
            //获取订单的子项
            let orderItems = orderInfo.orderItemInfo.orderItems || [];
            let tempArticleMap = {};
            let articelCount = {};
            for (let item of orderItems) {
                articelCount[item.article_id] = articelCount[item.article_id] ? articelCount[item.article_id] + item.count : item.count;
                if (item.type == 1 || item.type == 4 || item.type == 5 || item.type == 8) { //单品    套餐子项    新规格 重量包
                    if (tempArticleMap[item.article_id]) {
                        tempArticleMap[item.article_id].count += item.count;
                        tempArticleMap[item.article_id].duplicate = true;
                    } else {
                        tempArticleMap[item.article_id] = {
                            count: item.count,
                            duplicate: false
                        };
                    };
                    var article = orderInfo.articleMap[item.article_id];
                    if (articelCount[item.article_id] > article.current_working_stock) {
                        cb(article.name + " 库存不足 最多可购买：" + article.current_working_stock + " 份");
                        return;
                    }
                    if (item.type == 8) { // 重量类型
                        item.needRemind = 1;
                        item.weight = orderInfo.weightPackageMap[item.weight_package_detail_id].weight;
                        orderInfo.needConfirmOrderItem = 1;
                    }
                } else if (item.type == 2) {   //老规格 老规格只检查子项
                    let articlePrice = orderInfo.articlePriceMap[item.article_id];
                    if (articelCount[item.article_id] > articlePrice.current_working_stock) {
                        cb(articlePrice.name + " 库存不足 最多可购买：" + articlePrice.current_working_stock + " 份");
                        return;
                    }
                }
            }
            for (let key in tempArticleMap) {
                let temp = tempArticleMap[key];
                if (temp.duplicate) {
                    var article = orderInfo.articleMap[key];
                    if (temp.count > article.current_working_stock) {
                        cb("单品 和 套餐 重复购买   ___   【" + article.name + "】 库存不足 最多可购买：" + article.current_working_stock + " 份");
                        return;
                    }
                }
            }
            cb(null, msg, orderInfo);
        },
        //减库存
        function (msg, orderInfo, cb) { //
            //获取订单的子项
            var orderItems = orderInfo.orderItemInfo.orderItems || [];
            async.eachLimit(orderItems, 1, function (item, callback) {
                // orderItems.map(function(item) {
                let sql = '';
                switch (item.type) {
                    //单品 套餐子项  新规格
                    case 1:
                    case 4:
                    case 5:
                        sql = `select current_working_stock from tb_article where id = '${item.article_id}'`;
                        customSqlModel.getOneCustomSqlInfo(sql, function (err, article) {
                            var currentWorkingStock = article.current_working_stock - item.count;
                            var articleInfo = {
                                // id: item.article_id,
                                currentWorkingStock: currentWorkingStock,
                                isEmpty: currentWorkingStock == 0 ? 1 : 0
                            };
                            articleMode.updateById(item.article_id, articleInfo, function (err, reply) {
                                if (err) cb(err.toString());
                                callback();
                            });
                        });
                        break;
                    case 2: //老规格 老规格只检查子项
                        sql = `SELECT article_id,current_working_stock from tb_article_price where id = '${item.article_id}'`;
                        customSqlModel.getOneCustomSqlInfo(sql, function (err, articlePrice) {
                            if (err) cb(err.toString());
                            //先更新老规格子项
                            var articlePriceInfo = {
                                currentWorkingStock: articlePrice.current_working_stock - item.count
                            };
                            articlePriceMode.updateById(item.article_id, articlePriceInfo, function (err, reply) {
                                if (err) cb(err.toString());

                                //再更新老规格主项
                                sql = `select current_working_stock from tb_article where id = '${articlePrice.article_id}'`;
                                customSqlModel.getOneCustomSqlInfo(sql, function (err, article) {
                                    var currentWorkingStock = article.current_working_stock - item.count;
                                    var articleInfo = {
                                        // id: articlePrice.article_id,
                                        currentWorkingStock: currentWorkingStock,
                                        isEmpty: currentWorkingStock == 0 ? 1 : 0
                                    };
                                    articleMode.updateById(articlePrice.article_id, articleInfo, function (err, reply) {
                                        if (err) cb(err.toString());
                                        callback();
                                    });
                                });
                            });
                        });
                        break;
                    case 3:
                        callback();
                        break;
                    case 8:
                        sql = `select current_working_stock from tb_article where id = '${item.article_id}'`;
                        customSqlModel.getOneCustomSqlInfo(sql, function (err, article) {
                            var currentWorkingStock = article.current_working_stock - item.count;
                            var articleInfo = {
                                currentWorkingStock: currentWorkingStock,
                                isEmpty: currentWorkingStock == 0 ? 1 : 0
                            };
                            articleMode.updateById(item.article_id, articleInfo, function (err, reply) {
                                if (err) cb(err.toString());
                                callback();
                            });
                        });
                        break;
                }
            });

            cb(null, msg, orderInfo);
        },
        //查询原始订单
        function (msg, orderInfo, cb) {
            let sql = `SELECT  (SELECT sum(order_money)  
                                    FROM tb_order WHERE id = '${orderInfo.id}' or ( parent_order_id= '${orderInfo.id}' and order_state = 2)) receipts, 
                                    * FROM tb_order WHERE  id = '${orderInfo.id}'`;
            customSqlModel.getOneCustomSqlInfo(sql, function (err, originalOrder) {
                cb(null, msg, originalOrder, orderInfo);
            });
        },
        function (msg, originalOrder, orderInfo, cb) { //创建订单
            var mealAllPrice = msg.mealFeePrice;
            var servicePrice = msg.childrenOrderId == null ? originalOrder.service_price || 0 : 0;
            let order = {
                productionStatus: productionStatus.PUSH_ORDER,
                originalAmount: orderInfo.orderItemInfo.original_amount + servicePrice + mealAllPrice,//  需将 服务费也加上
                orderMoney: orderInfo.orderItemInfo.order_money + servicePrice + mealAllPrice, //将服务费或餐盒费 并入订单总金额
                articleCount: orderInfo.orderItemInfo.article_count,
                paymentAmount: orderInfo.orderItemInfo.order_money + servicePrice + mealAllPrice,
                parentOrderId: msg.childrenOrderId == null ? null : msg.masterOrderId, //当前订单为子订单时
                // customerCount: msg.childrenOrderId == null ? originalOrder.customer_count : 0,
                customerCount: originalOrder.customer_count, // 子订单的人数需要添加
                customerId: msg.customerId, // 如果是微信下单 子订单的customerId也需要加上
                mealAllNumber: msg.childrenOrderId == null ? msg.mealAllNumber : 0, //餐盒总个数 外带没有子订单
                mealFeePrice: msg.childrenOrderId == null ? msg.mealFeePrice : 0, //餐盒单价
                printOrderTime: dateUtil.timestamp(), //  下单时间
                syncState: 0,//  更新订单数据后，将订单的同步状态更改为 0，推送至服务器后，通过回调更改为 1
                needConfirmOrderItem: orderInfo.needConfirmOrderItem || 0 // 是否需要确认重量
            };
            //是否为子订单 更新主订单
            if (msg.childrenOrderId != null) {
                let sql = `SELECT  (SELECT sum(order_money)  
                                FROM tb_order WHERE id = '${msg.masterOrderId}' or 
                                ( parent_order_id= '${msg.masterOrderId}' and order_state = 2)) receipts, 
                                * FROM tb_order WHERE  id = '${msg.masterOrderId}'`;
                customSqlModel.getOneCustomSqlInfo(sql, function (err, orgOrder) {
                    sql = `select sum(article_count) articleCount,sum(order_money) orderMoney from tb_order 
                                where parent_order_id = '${msg.masterOrderId}' and order_state != 9`;
                    customSqlModel.getOneCustomSqlInfo(sql, function (err, data) {
                        let masterOrder = {
                            amountWithChildren: orgOrder.order_money + data.orderMoney + orderInfo.orderItemInfo.order_money,
                            countWithChild: orgOrder.article_count + data.articleCount + orderInfo.orderItemInfo.article_count,
                            mealAllNumber: orgOrder.meal_all_number + msg.mealAllNumber,
                            syncState: 0, //  更新订单数据后，将订单的同步状态更改为 0，推送至服务器后，通过回调更改为 1
                        };
                        if (orderInfo.needConfirmOrderItem) {
                            masterOrder.needConfirmOrderItem = orderInfo.needConfirmOrderItem || 0 // 主订单是否需要确认重量
                        }
                        //先更新主订单 然后更新子订单
                        orderModel.updateById(msg.masterOrderId, masterOrder, function (error, reply) { //
                            orderModel.updateById(orderInfo.id, order, function (error, reply) {//
                                cb(null, orderInfo);
                            });
                        });
                    });
                });
            } else {
                //没有子订单 只更新当前订单
                orderModel.updateById(orderInfo.id, order, function (error, reply) {
                    cb(null, orderInfo);
                });
            }
        },
        function (orderInfo, cb) { //插入订单项
            var orderItem = orderInfo.orderItemInfo.orderItems || [];
            async.eachLimit(orderItem, 1, function (item, callbacck) {
                item.order_id = orderInfo.id;
                item.sort = 0;
                item.status = 1;
                item.remark = item.discount ? item.discount + "%" : null;
                item.create_time = dateUtil.timestamp();
                delete item.discount; //删除数据库中没有的字段
                let content = {
                    id: item.id || generalUtil.randomUUID(),
                    orderId: item.order_id,
                    articleId: item.article_id,
                    articleName: item.article_name,
                    count: item.count,
                    originalPrice: item.original_price,
                    unitPrice: item.unit_price,
                    finalPrice: item.final_price,
                    type: item.type,
                    orginCount: item.orgin_count,
                    refundCount: item.refund_count,
                    mealFeeNumber: item.meal_fee_number,
                    printFailFlag: item.print_fail_flag,
                    sort: item.sort,
                    status: item.status,
                    remark: item.remark,
                    createTime: item.create_time,
                    parentId: item.parent_id,
                    mealItemId: item.meal_item_id || 0,
                    kitchenId: item.kitchen_id || '',
                    recommendId: item.recommend_id || '',
                    changeCount: item.change_count || 0,
                    weight: item.weight || 0,
                    needRemind: item.needRemind || 0,
                };
                orderItemMode.save(content, function (error, reply) {
                    if (error) {
                        return callbacck(error);
                    }
                    callbacck();
                });
            }, function (err) {
                if (err) {
                    return cb(err);
                }
                cb(null, orderInfo);
            });
        }
    ],
        function (err, resultData) {
            if (err) {
                msg.childrenOrderId && orderModel.deleteById(msg.childrenOrderId);// 删除创建的子订单
                result.error(next, err.toString(), msg);
                fileUtil.appendFile(`orderLogs`, `${msg.__route__}=>【Pos订单】创建失败：,\n,${err.toString()}`);
            } else {
                fileUtil.appendFile(`orderLogs`, `${msg.__route__}=>【创建订单】创建成功；,\n,${JSON.stringify(msg)}`);
                result.success(next, resultData.id);
            }
        });
};



/**
 * 下单
 * @param msg
 * @param session
 * @param next
 */
handler.newPushOrder = function (msg, session, next) {
    orderController.pushOrder(msg,(err, reply) => {
        if (msg.childrenOrderId) { // 加菜订单
            msgUtil.pushAll('event', {
                type: 'normalOrder',
                eventType: 'addArticle',
                msg: '收到加菜订单!',
                data: msg.masterOrderId
            })

        } else { // 新开台
            msgUtil.pushAll('event', {
                type: 'normalOrder',
                eventType: 'orderCreated',
                msg: '收到新订单!',
                data: msg.masterOrderId
            })
        }

        if (err) {
            fileUtil.appendFile(`NewPos 终端操作`, `${msg.__route__}=>【创建订单】失败：,\n,${err.toString()}`);
            result.error(next,err.toString(),msg)
        } else {
            fileUtil.appendFile(`NewPos 终端操作`, `${msg.__route__}=>【创建订单】成功；,\n,${JSON.stringify(msg)}`);
            result.success(next,reply);
        }
    });
};

var getOrderItems = function (orderInfo) {
    var orderItems = [],
        original_amount = 0,
        order_money = 0,
        article_count = 0;
    var articleMap = orderInfo.articleMap;
    var articlePriceMap = orderInfo.articlePriceMap;
    var articleUnitDetailMap = orderInfo.articleUnitDetailMap;
    var unitDetailMap = orderInfo.unitDetailMap;
    var weightPackageMap = orderInfo.weightPackageMap;
    var mealItemMap = orderInfo.mealItemMap;
    var orderItemList = orderInfo.order_items;
    for (var item_i = 0; item_i < orderItemList.length; item_i++) {
        var item = orderItemList[item_i];
        var orderItem = null;
        var article = null;
        if (item.type == 1) { //单品
            article = articleMap[item.id];
            orderItem = getOrderItemInfo(item, article);
        } else if (item.type == 2) { //老规格
            article = articleMap[item.id];
            orderItem = getOrderItemInfo(item, article);
            //老规格有自己独立的粉丝价和单价
            var articlePrice = articlePriceMap[item.article_prices_id];
            orderItem.article_id += "@" + articlePrice.unit_ids;
            orderItem.article_name += articlePrice.name;
            var middlePrice = articlePrice.price;

            if (item.discount / 100 < 1) {
                middlePrice = middlePrice * item.discount / 100;
            } else {
                //是否启用粉丝价
                if (!item.isFans && articlePrice.fans_price) {
                    middlePrice = articlePrice.fans_price;
                }
            }

            // 计算价格
            orderItem.unit_price = middlePrice;
            orderItem.final_price = orderItem.count * middlePrice;
            orderItem.original_price = middlePrice;

        } else if (item.type == 3) { //套餐
            article = articleMap[item.id];
            orderItem = getOrderItemInfo(item, article);
            orderItem.id = generalUtil.randomUUID();
            //套餐子项
            for (var mealItem_i in item.mealItems) {
                var mealItem = item.mealItems[mealItem_i];
                mealItem.type = 4;
                // mealItem.discount = item.discount;
                mealItem.discount = 100; // 这里仍然给100折扣，跟微信保持一致套餐差价不参与折扣，
                var mealItemInfo = mealItemMap[mealItem.id];
                var mealOrderItem = getOrderItemInfo(mealItem, mealItemInfo);
                mealOrderItem.article_id = mealItemInfo.article_id;
                mealOrderItem.parent_id = orderItem.id;
                mealOrderItem.meal_item_id = mealItem.id;
                //赋值基础信息
                orderItems.push(mealOrderItem);
                original_amount += mealOrderItem.final_price;
                order_money += mealOrderItem.final_price;
                // article_count += mealOrderItem.count;    // 套餐子项不参与 菜品总量的统计
            }
        } else if (item.type == 5) { //新规格
            article = articleMap[item.id];
            orderItem = getOrderItemInfo(item, article);
            for (var unit_i in item.unit_details) {
                var articleUnit = articleUnitDetailMap[item.unit_details[unit_i]];
                var unitDetail = unitDetailMap[articleUnit.unit_detail_id];
                orderItem.article_name += ("(" + unitDetail.name + ")");
                // 计算价格
                orderItem.unit_price += articleUnit.price * item.discount / 100;
                orderItem.final_price += orderItem.count * articleUnit.price * item.discount / 100;
                orderItem.original_price += orderItem.count * articleUnit.price;
            }
        } else if (item.type == 8) { // 重量类型
            article = articleMap[item.id];
            orderItem = getOrderItemInfo(item, article);
            orderItem.article_name = item.name;
            orderItem.unit_price = article.catty_money * weightPackageMap[item.weight_package_detail_id].weight;
            orderItem.original_price = article.catty_money * weightPackageMap[item.weight_package_detail_id].weight;
            orderItem.final_price = article.catty_money * weightPackageMap[item.weight_package_detail_id].weight;
            orderItem.weight_package_detail_id = item.weight_package_detail_id;
        } else { //没有任何匹配类型
            continue;
        }
        //赋值基础信息
        orderItems.push(orderItem);
        original_amount += orderItem.original_price * orderItem.count;
        order_money += orderItem.final_price;
        article_count += orderItem.count;
    }
    return {
        orderItems: orderItems,
        original_amount: original_amount,
        order_money: order_money,
        article_count: article_count
    };
}

var getOrderItemInfo = function (item, article) {
    if (!article || !article.id) {
        return {};
    }

    //折扣之后的价格
    var middlePrice = article.price || article.price_dif || 0;

    if (item.discount / 100 < 1) {
        middlePrice = middlePrice * item.discount / 100;
    } else { //是否启用粉丝价
        if (!item.isFans && item.fansPrice) {
            middlePrice = item.fansPrice;
        }
    }

    return {
        order_id: "",
        article_id: article.id || article.article_id,
        article_name: article.name || article.article_name,
        count: item.count,
        original_price: article.price || article.price_dif || 0,
        unit_price: middlePrice,
        final_price: item.count * middlePrice,
        type: item.type,
        orgin_count: item.count,
        refund_count: 0,
        meal_fee_number: item.mealFeeNumber,
        print_fail_flag: 0,
        discount: item.discount
    };
}

/**
 * 支付订单
 * @param msg
 * @param session
 * @param next
 */
handler.payOrder = function (msg, session, next) {
    orderController.payOrder(msg, (error, resultData) => {
        if (error) {
            if (error == '已买单') {
                msgUtil.pushAll('event', {
                    type: 'normalOrder',
                    eventType: 'payOrder',
                    msg: `【${resultData.tableNumber||resultData.verCode}】号桌，已经买过单啦!`,
                    data: resultData.orderId
                })
                return result.success(next, { message: "当前订单已经买过单啦", success: false, data: null });
            } else {
                msgUtil.pushAll('event', {
                    type: 'normalOrder',
                    eventType: 'payOrder',
                    msg: `【${resultData.tableNumber||resultData.verCode}】号桌，买单失败!`,
                    data: resultData.orderId
                })
                return result.success(next, { message: error.toString(), success: false, data: null});
            }
        } else {
            msgUtil.pushAll('event', {
                type: 'normalOrder',
                eventType: 'payOrder',
                msg: `【${resultData.tableNumber||resultData.verCode}】号桌，买单成功!`,
                data: resultData.orderId
            })
            result.success(next, resultData);
        }
    })
}

// handler.payOrder = function (msg, session, next) {
//     /*
//         折扣率 真实折扣率
//         折扣率 * order.order_money
//         真实折扣率 * orderItem.final_price unit_price 最后一个 是总价减去前面所有的final_price (超过价格 折扣率设为一百)
//         amount_with_children
//     */
//     if (!msg.orderId || msg.orderId.length == 0) {
//         return result.error(next, "订单不能为空", msg);
//     }
//     if (!msg.paymentItems || msg.paymentItems.length == 0) { // 如果没有支付项 则单单是抹零或者折扣操作 不改变订单状态
//         msg.paymentItems = [];
//     }
//     let updateData = [];
//     let updateOrderPaymentData = [];
//     let orderUPdate = []
//     let customerId = msg.formatDiscount.customerId || null;
//     let totalMoney = +msg.formatDiscount.totalMoney || 0; // 总金额
//     let discountMoney = +msg.formatDiscount.discountMoney || 0; // 折扣金额
//     let discountRate = +msg.formatDiscount.onDiscount.discountRate || 100; // 折扣率
//     let removeMoney = +msg.formatDiscount.onDiscount.removeMoney || 0; // 不参与折扣的钱
//     let onErasing = +msg.formatDiscount.onErasing.erasing || null; // 抹零
//     let reduceMoney = +msg.formatDiscount.onReduceMoney.reduceMoney || null;
//     let amountMoney = +msg.formatDiscount.amountMoney || 0; // 打折后需要支付的钱
//     let servicePrice = 0;
//     let mealFeePrice = 0;
//     // 真实折扣率: (抹零或者折扣金额 / 打折后需要支付的钱)
//     let realDiscountRate = (onErasing || reduceMoney) ? generalUtil.rounding(amountMoney / totalMoney * 100) : (discountRate == 100 ? null : discountRate);
//     let table_number;
//
//     let orderIdList = [];
//     let lastSyncOrderInfo = {}
//     msg.resultPayMents = [];
//     async.auto({
//         orderAndChildrenInfo: function (cb) { // 1、查找主订单 以及 未取消的子订单和兄弟订单
//             let sql = `select * from tb_order where id ='${msg.orderId}' ;`;
//             customSqlModel.getOneCustomSqlInfo(sql, function (err, orderInfo) {
//                 if (err) return cb(err);
//                 if (orderInfo.order_state == 2) return cb('该订单已经支付.');
//                 if (!orderInfo) return cb('订单不存在.');
//                 table_number = orderInfo.table_number;
//                 sql = `select * from tb_order where order_state not in (6, 9) and (id ='${msg.orderId}' or parent_order_id ='${msg.orderId}' `;
//                 if (orderInfo.parent_order_id)
//                     sql += ` or id = '${orderInfo.parent_order_id}' or parent_order_id = '${orderInfo.parent_order_id}'`;
//                 sql += ')';
//                 customSqlModel.getAllCustomSqlInfo(sql, (err, ordersInfo) => {
//                     if (err) return cb(err)
//                     let orderState = false
//                     for (let i = 0; i < ordersInfo.length; i++) {
//                         if (ordersInfo[i].order_state < 2) {
//                             orderState = true
//                         }
//                     }
//                     if (orderState == true) {
//                         orderState == false
//                         return cb(err, ordersInfo)
//                     } else  {
//                         return result.success (next, {
//                             message: '当前订单状态已变更',
//                             data: null
//                         })
//                     }
//                 });
//             });
//
//         },
//         selectOrderItem: ['orderAndChildrenInfo', function (reply, cb) { // 2、查找未支付订单的orderItem
//             let ordersInfo = reply.orderAndChildrenInfo;
//             let ids = [];
//             for (let i = ordersInfo.length - 1; i >= 0; i--) {
//                 // 如果已经买单，折扣和抹零
//                 if (ordersInfo[i].order_state === 2)
//                     continue
//                 else
//                     ids.push(`'${ordersInfo[i].id}'`);
//             }
//             if (ids.length <= 0) {
//                 return cb(null, null);
//             }
//             let sql = `select * from tb_order_item where order_id in (${ids.toString()}) and count > 0`;
//             customSqlModel.getAllCustomSqlInfo(sql, function (err, orderItems) {
//                 cb(err, orderItems);
//             })
//         }],
//         updateServiceAndMealPrice: ['orderAndChildrenInfo', function (reply, cb) { // 3、更新服务费和餐盒费
//             let updateOrderData = { order: [] };
//             let ordersInfo = reply.orderAndChildrenInfo;
//             lastSyncOrderInfo = {
//                 syncState: 0,
//                 lastSyncTime: new Date().getTime()
//             }
//             async.eachLimit(ordersInfo, 1, (orderInfo, e_cb) => {
//                 let order_update_info = {};
//                 if (orderInfo.order_state === orderState.HAS_PAY) {
//                     return e_cb(null, null);
//                 }
//                 order_update_info.syncState = 1;
//                 order_update_info.last_sync_time = lastSyncOrderInfo.lastSyncTime
//                 order_update_info.id = orderInfo.id;
//                 order_update_info.originMoney = orderInfo.origin_money || orderInfo.order_money;
//                 order_update_info.payMode = msg.payMode || orderInfo.pay_mode;
//                 order_update_info.exemptionMoney = msg.payMode == 8 ? orderInfo.order_money : 0;
//                 if (!orderInfo.parent_order_id || orderInfo.parent_order_id === '') {
//                     servicePriceDiscount(orderInfo, realDiscountRate, function (resultServicePrice) {
//                         order_update_info.servicePrice      = resultServicePrice.servicePrice,
//                         order_update_info.sauceFeePrice     = resultServicePrice.sauceFeePrice,
//                         order_update_info.towelFeePrice     = resultServicePrice.towelFeePrice,
//                         order_update_info.tablewareFeePrice = resultServicePrice.tablewareFeePrice
//
//                         orderInfo.sauce_fee_price= resultServicePrice.sauceFeePrice,
//                         orderInfo.towel_fee_price= resultServicePrice.towelFeePrice,
//                         orderInfo.tableware_fee_price = resultServicePrice.tablewareFeePrice
//
//                         servicePrice = order_update_info.servicePrice; // 记录服务费折扣
//                         orderInfo.service_price = order_update_info.servicePrice;
//                     })
//
//                     // order_update_info.servicePrice = (realDiscountRate !== null && orderInfo.service_price) ? generalUtil.rounding(orderInfo.service_price * (realDiscountRate / 100)) : orderInfo.service_price;
//                     // servicePrice = order_update_info.servicePrice; // 记录服务费折扣
//                     // orderInfo.service_price = order_update_info.servicePrice;
//                     order_update_info.mealFeePrice = (realDiscountRate !== null && orderInfo.meal_fee_price) ? generalUtil.rounding(orderInfo.meal_fee_price * (realDiscountRate / 100)) : orderInfo.meal_fee_price;
//                     mealFeePrice = order_update_info.mealFeePrice; //记录餐盒费折扣
//                     orderInfo.meal_fee_price = order_update_info.mealFeePrice;
//                 } else {
//                     order_update_info.servicePrice = orderInfo.service_price || 0;
//                     order_update_info.mealFeePrice = orderInfo.meal_fee_price || 0;
//                 }
//                 orderUPdate.push(order_update_info)
//                 orderModel.updateById(orderInfo.id, order_update_info, (err, reply) => {
//                     return e_cb(err, null);
//                 })
//             }, function (err) {
//                 return cb(err, null);
//             });
//         }],
//         updateOrderItem: ['orderAndChildrenInfo', 'selectOrderItem', 'updateServiceAndMealPrice', function (reply, cb) { // 4、更新订单orderItem
//             let updateOrderItemsData = { orderItem: [] };
//             let orderItemsInfo = reply.selectOrderItem.sort((a, b)=>  a.final_price - b.final_price);
//             let mainOrderId = reply.updateOrder;
//             let lastOrderItem = orderItemsInfo ? orderItemsInfo.pop() : [];
//             let all_final_price = servicePrice + mealFeePrice;
//             async.eachLimit(orderItemsInfo, 1, function (orderItem, e_cb) {
//
//                 if (orderItem.final_price == 0 ) return e_cb();
//                 let new_order_item = {
//                     id: orderItem.id,
//                     orderId: orderItem.order_id,
//                     articleId: orderItem.article_id,
//                     articleName: orderItem.article_name,
//                     count: orderItem.count,
//                     originalPrice: orderItem.original_price,
//                     no_discountPrice: orderItem.no_discount_price,
//                     remark: orderItem.remark,
//                     sort: orderItem.sort,
//                     status: orderItem.status,
//                     type: orderItem.type,
//                     parentId: orderItem.parent_id || '',
//                     createTime: orderItem.create_time,
//                     mealItemId: orderItem.meal_item_id,
//                     kitchenId: orderItem.kitchen_id,
//                     recommendId: orderItem.recommend_id,
//                     orginCount: orderItem.orgin_count,
//                     refundCount: orderItem.refund_count,
//                     mealFeeNumber: orderItem.meal_fee_number,
//                     changeCount: orderItem.change_count,
//                     printFailFlag: orderItem.print_fail_flag,
//                     weight: orderItem.weight,
//                     needRemind: orderItem.needRemind,
//                     // 除最后一个菜品外单项菜品价格×真实折扣率 - 除最后一个菜品外单项菜品均分的抹零
//                     noDiscountPrice: orderItem.no_discount_price || orderItem.final_price,
//                     finalPrice: realDiscountRate !== null ? generalUtil.rounding(orderItem.final_price * (realDiscountRate / 100)) : orderItem.final_price,
//                     unitPrice: realDiscountRate !== null ? generalUtil.rounding(orderItem.unit_price * (realDiscountRate / 100)) : orderItem.unit_price,
//                     posDiscount: realDiscountRate || orderItem.pos_discount
//
//                 }
//                 all_final_price += new_order_item.finalPrice;
//                 updateOrderItemsData.orderItem.push(new_order_item);
//                 orderItemMode.updateById(orderItem.id, new_order_item, function (err, reply) {
//                     e_cb(err, null);
//                 })
//             }, function (err) {
//                 let new_order_item = {};
//                 // new_order_item.id = lastOrderItem ? lastOrderItem.id : '';
//                 new_order_item.id =  lastOrderItem ? lastOrderItem.id : '';
//                 new_order_item.orderId = lastOrderItem.order_id;
//                 new_order_item.articleId = lastOrderItem.article_id;
//                 new_order_item.articleName = lastOrderItem.article_name;
//                 new_order_item.count = lastOrderItem.count;
//                 new_order_item.originalPrice = lastOrderItem.original_price;
//                 new_order_item.no_discountPrice = lastOrderItem.no_discount_price;
//                 new_order_item.remark = lastOrderItem.remark;
//                 new_order_item.sort = lastOrderItem.sort;
//                 new_order_item.status = lastOrderItem.status;
//                 new_order_item.type = lastOrderItem.type;
//                 new_order_item.parentId = lastOrderItem.parent_id || '';
//                 new_order_item.createTime = lastOrderItem.create_time;
//                 new_order_item.mealItemId = lastOrderItem.meal_item_id;
//                 new_order_item.kitchenId = lastOrderItem.kitchen_id;
//                 new_order_item.recommendId = lastOrderItem.recommend_id;
//                 new_order_item.orginCount = lastOrderItem.orgin_count;
//                 new_order_item.refundCount = lastOrderItem.refund_count;
//                 new_order_item.mealFeeNumber = lastOrderItem.meal_fee_number;
//                 new_order_item.changeCount = lastOrderItem.change_count;
//                 new_order_item.printFailFlag = lastOrderItem.print_fail_flag;
//                 new_order_item.weight = lastOrderItem.weight;
//                 new_order_item.needRemind = lastOrderItem.needRemind;
//                 if (lastOrderItem && all_final_price <= 0) { // 只有一个菜品 并且 没有服务费 (前几个价格×真实折扣率 - 抹零)
//                     new_order_item.noDiscountPrice = lastOrderItem.no_discount_price || lastOrderItem.final_price;
//                     new_order_item.finalPrice = generalUtil.rounding(amountMoney);
//                     new_order_item.unitPrice = lastOrderItem.count ? generalUtil.rounding(amountMoney / lastOrderItem.count) : 0;
//                     new_order_item.posDiscount = realDiscountRate || lastOrderItem.pos_discount;
//                 } else if (lastOrderItem && all_final_price > 0 && amountMoney && amountMoney >= all_final_price) {
//                     // 最后一个 是折扣价或者总价减去前面所有的final_price (超过所有的final_price 折扣率设为一百)
//                     new_order_item.noDiscountPrice = lastOrderItem.no_discount_price || lastOrderItem.final_price;
//                     new_order_item.finalPrice = generalUtil.rounding(amountMoney - all_final_price);
//                     new_order_item.unitPrice = generalUtil.rounding((amountMoney - all_final_price) / lastOrderItem.count);
//                     new_order_item.posDiscount = lastOrderItem.original_price == 0 ? realDiscountRate :  realDiscountRate !== null ? parseInt((new_order_item.finalPrice / lastOrderItem.original_price) * 100) : lastOrderItem.pos_discount;
//                 } else if (lastOrderItem) {
//                     new_order_item.noDiscountPrice = lastOrderItem.no_discount_price || lastOrderItem.final_price;
//                     new_order_item.posDiscount = lastOrderItem.pos_discount || 100;
//                 }
//                 updateOrderItemsData.orderItem.push(new_order_item)
//                 updateData.push(updateOrderItemsData);
//                 orderItemMode.updateById(new_order_item.id, new_order_item, function (err, reply) {
//                     cb(err, null);
//                 })
//             });
//         }],
//         updateOrder: ['orderAndChildrenInfo', 'selectOrderItem', 'updateServiceAndMealPrice', 'updateOrderItem', function (reply, cb) { // 3_1、更新 order
//             let ordersInfo = reply.orderAndChildrenInfo;
//             let mainOrderInfo;
//             let amountWithChildren = 0;
//             async.eachLimit(ordersInfo, 1, (order, e_cb) => {
//                 let sql = `select sum(final_price) sum from tb_order_item where order_id = '${order.id}' and count > 0;`;
//                 customSqlModel.getOneCustomSqlInfo(sql, (err, itemTotalMoney) => {
//                     orderIdList.push(order.id)
//                     let sum = itemTotalMoney.sum + order.service_price + order.meal_fee_price;
//                     let order_update_info = {};
//                     order_update_info.id = order.id;
//                     order_update_info.customerId = customerId;
//                     order_update_info.orderMoney = generalUtil.rounding(sum);
//                     order_update_info.paymentAmount = generalUtil.rounding(sum);
//                     order_update_info.posDiscount = discountRate == 100 ? order.pos_discount : discountRate;
//                     order_update_info.orderPosDiscountMoney = discountRate == 100 ? order.order_pos_discount_money : generalUtil.rounding(order.order_money - sum);
//
//                     order.order_money = generalUtil.rounding(sum);
//                     order.payment_amount = generalUtil.rounding(sum);
//
//                     if (order.parent_order_id) {
//                         amountWithChildren += order.order_money;
//                     } else {
//                         mainOrderInfo = order;
//                     }
//                     if (msg.paymentItems.length > 0 || msg.isScanPay) { // 结账
//                         order_update_info.orderState = orderState.HAS_PAY;
//                     }
//                     // let updateOrderData = { order: [] };
//                     // updateOrderData.order.push(order_update_info);
//                     // updateData.push(updateOrderData);
//                     orderUPdate.push(order_update_info)
//                     orderModel.updateById(order.id, order_update_info, (err, reply) => {
//                         e_cb(err, null);
//                     });
//                 });
//             }, (err) => {
//                 amountWithChildren = amountWithChildren ? generalUtil.rounding(amountWithChildren + mainOrderInfo.order_money) : amountWithChildren
//                 let updateMainOrder = {
//                     id: mainOrderInfo.id,
//                     amountWithChildren: amountWithChildren,
//                     eraseMoney: onErasing || reduceMoney ? ((onErasing || 0) + (reduceMoney || 0)) + parseFloat(mainOrderInfo.erase_money) : mainOrderInfo.erase_money,
//                     realEraseMoney: onErasing ? onErasing + parseFloat(mainOrderInfo.real_erase_money) : mainOrderInfo.real_erase_money,
//                     reduceMoney: reduceMoney ? reduceMoney + parseFloat(mainOrderInfo.reduce_money) : mainOrderInfo.reduce_money,
//                 };
//                 // updateData.push({ order: [updateMainOrder] });
//                 orderUPdate.push(updateMainOrder)
//                 orderModel.updateById(mainOrderInfo.id, updateMainOrder, (err, reply) => {
//                     cb(err, null);
//                 });
//             });
//         }],
//         insertPayment: ['orderAndChildrenInfo', function (reply, cb) { // 4、插入支付项
//             if (msg.paymentItems.length == 0 )   return cb();
//             async.eachLimit(msg.paymentItems, 1, function (payType, e_cb) {
//                 var item = {
//                     id: generalUtil.randomUUID(),
//                     orderId: msg.orderId,
//                     paymentModeId: payType.type,
//                     payValue: generalUtil.rounding(payType.money),
//                     remark: payMode.getPayModeName(parseInt(payType.type)) + "：" + payType.money,
//                     payTime: dateUtil.timestamp(),
//                     toPayId: payType.toPayId || null
//                 };
//                 msg.resultPayMents.push(generalUtil.convertHumpName(item));
//                 updateOrderPaymentData.push(item);
//                 orderPaymentItemMode.upsert(item, function (error) {
//                     e_cb(error || null);
//                 });
//             }, function (error) {
//                 if (error) {
//                     return cb(error.toString());
//                 } else {
//                     return cb(error, null);
//                 }
//             });
//         }],
//         releaseTable: ['orderAndChildrenInfo', function (reply, cb) {// 5、释放桌位
//             if (table_number && (msg.paymentItems.length > 0 || msg.isScanPay)) {
//                 // 如果没有支付项 则单单是抹零或者折扣或者扫描支付操作 不释放桌位
//                 let sql = `update tb_table_qrcode set table_state = 0 where table_number = ${table_number};`;
//                 customSqlModel.getOneCustomSqlInfo(sql, function (err, reply) {
//                     if (err) {
//                         return cb(err.toString());
//                     } else {
//                         return cb(null, msg);
//                     }
//                 });
//             } else {
//                 cb(null, null);
//             }
//         }]
//     }, function (err, data) {
//         updateData.push({ order:  orderUPdate})
//         if (err) {
//             fileUtil.appendFile(`orderLogs`, `${msg.__route__}=>【订单支付】支付失败：${msg.orderId},\n,${err.toString()}`);
//             //return result.error(next, err.toString(), msg);
//             return result.success(next, {
//               message: err.toString(),
//               success: false,
//               data: null
//             });
//         } else {
//             if (msg.paymentItems.length > 0 || msg.isScanPay) { // 结账
//                 // 同步数据前，先更改本地状态
//                 var syncOrderInfo = {
//                     syncState: 0,
//                     lastSyncTime: new Date().getTime()
//                 }
//                 // TODO: 待处理
//                 async.eachLimit(orderIdList, 1, function (orderId) {
//                     orderModel.updateById(orderId, syncOrderInfo, function () {
//                     })
//                 })
//                 webSocketClient.orderPay(msg.orderId, msg.payMode, updateOrderPaymentData, syncOrderInfo.lastSyncTime, 1, function () {
//                     // 同步数据前，先更改本地状态
//                     async.eachLimit(orderIdList, 1, function (orderId) {
//                         orderModel.updateById(orderId, lastSyncOrderInfo, function () {
//                         })
//                     })
//                     webSocketClient.syncUpdateData(JSON.stringify(updateData), 'orderPay',syncOrderInfo.lastSyncTime, 1, function (err,data) {
//                         // todo: 失败是否阻止回调
//                         // 同步后回调本地更新
//                         // synUpdateDataCb(msg, data)
//                         // if(err){
//
//                         // }
//
//                         fileUtil.appendFile(`orderLogs`, `${msg.__route__}=>【支付订单】支付成功 updateOrderPaymentData；,\n,${JSON.stringify(updateOrderPaymentData)}`);
//                         fileUtil.appendFile(`orderLogs`, `${msg.__route__}=>【支付订单】支付成功 updateData,\n,${JSON.stringify(updateData)}`);
//                         fileUtil.appendFile(`orderLogs`, `${msg.__route__}=>【支付订单】支付成功；msg,\n,${JSON.stringify(msg)}`);
//                         // result.success(next, msg);
//                     })
//                 })
//             } else { // 抹零和折扣
//                 fileUtil.appendFile(`orderLogs`, `${msg.__route__}=>【抹零订单】抹零成功 updateData,\n,${JSON.stringify(updateData)}`);
//                 fileUtil.appendFile(`orderLogs`, `${msg.__route__}=>【支付订单】抹零成功；msg,\n,${JSON.stringify(msg)}`);
//                 // synUpdateDataCb(msg, data)
//                 // todo 在 折扣之前本地状态需要改变
//                 var syncOrderInfo = {
//                     syncState: 0,
//                     lastSyncTime: new Date().getTime()
//                 }
//                 // todo 待优化
//                 async.eachLimit(orderIdList, 1, function (orderId) {
//                     orderModel.updateById(orderId, syncOrderInfo, function () {
//                     })
//                 })
//                 webSocketClient.syncUpdateData(JSON.stringify(updateData), syncOrderInfo.lastSyncTime, 1, 'orderPay',(err,data)=>{
//                 })
//             }
//             result.success(next, msg);
//         }
//     });
// }

// 针对服务费打折 服务费 1 普通 2 升级版
var servicePriceDiscount = function (orderInfo, realDiscountRate, callback) {
    /**
        sauceFeePrice       //酱料价格
        towelFeePrice       //纸巾价格
        tablewareFeePrice   //餐具价格
    */
     let resultServicePrice = {
        sauceFeePrice: orderInfo.sauce_fee_price,
        towelFeePrice: orderInfo.towel_fee_price,
        tablewareFeePrice: orderInfo.tableware_fee_price,
        servicePrice: orderInfo.service_price
    }
    if (realDiscountRate != null && orderInfo.service_price) {
        for (var key in resultServicePrice) {
            resultServicePrice[key] =  generalUtil.rounding(resultServicePrice[key] && resultServicePrice[key] > 0 ? resultServicePrice[key] * (realDiscountRate / 100) : 0  )
        }
    }
    callback(resultServicePrice)
}


/**
 * 同步订单回调
 */
function synUpdateDataCb(msg, data){
    if(!data) return
    data = JSON.parse(data)
    if(data.synSuccess){
        let orderRange = "'" + data.orderIds.split(',').join("','") + "'"
        let sql = `update tb_order set sync_state = 1 where id in (${orderRange})`
        customSqlModel.getAllCustomSqlInfo(sql, (err, result) => {
            if(err) return fileUtil.appendFile(`orderLogs`, `${msg.__route__}=>【同步支付订单】本地更新同步状态出错 IDs: ${orderRange}`);
            fileUtil.appendFile(`orderLogs`, `${msg.__route__}=>【同步支付订单】本地更新同步状态成功 IDs: ${orderRange}`);
        })
    }else{
        fileUtil.appendFile(`orderLogs`, `${msg.__route__}=>【同步支付订单】更新同步状态失败 IDs: ${data.orderIds}`);
    }
}

/**
 * 订单折扣  订单折扣分离
 * @param msg
 * @param session
 * @param next
 */
handler.orderDiscount = function (msg, session, next) {
    orderController.orderDiscount(msg, (err, resultData) => {
        if (err) {
            msgUtil.pushAll('event', {
                type: 'normalOrder',
                eventType: 'orderDiscount',
                data: msg.orderId,
                msg: '订单折扣失败',
            })
            fileUtil.appendFile(`NewPos终端操作`, `${msg.__route__}=>【订单折扣】折扣失败：${msg.orderId},\n,${err.toString()}`);
            return result.error(next, err.toString(), msg);
        } else {
            msgUtil.pushAll('event', {
                type: 'normalOrder',
                eventType: 'orderDiscount',
                data: msg.orderId,
                msg: '订单折扣成功',
            })
            fileUtil.appendFile(`NewPos终端操作`, `${msg.__route__}=>【订单折扣】抹零成功 updateData,\n,${JSON.stringify(resultData)}`);
            fileUtil.appendFile(`NewPos终端操作`, `${msg.__route__}=>【订单折扣】抹零成功；msg,\n,${JSON.stringify(msg)}`);
            result.success(next, resultData);
        }
    })
}

/**
 * 恢复折扣
 * @param msg
 * @param session
 * @param next
 */
handler.resumeDiscount = function (msg, session, next) {
    if (!msg.orderId) {
        return result.error(next, "订单不能为空", msg);
    }
    let updateData = [];
    let orderId = msg.orderId; // 主订单ID
    async.auto({
        getShopDetail: function (cb) {
            shopDetailModel.getCustomShopDetailInfo({}, (err, shopDetailInfo) => {
                cb(err, shopDetailInfo);
            })
        },
        resumeOrdersInfo: ['getShopDetail', function (reply, cb) {
            let orderUpdate = { order: [] };
            let shopDetail = reply.getShopDetail;

            let sql = `select * from tb_order where id = '${orderId}' or parent_order_id = '${orderId}'`;
            customSqlModel.getAllCustomSqlInfo(sql, (err, ordersInfo) => {
                if (ordersInfo.length <= 0) {
                    return result.error(next, "订单不存在", msg);
                }
                let item_arr = ordersInfo.filter((item) => item.parent_order_id == null || item.parent_order_id == '');
                if (item_arr[0].erase_money == 0 && item_arr[0].pos_discount > 99){
                    return cb(null,false);
                }
                let amount_with_children = 0;
                let meal_all_number = 0;
                for (let i = 0; i < ordersInfo.length; i++) {
                    amount_with_children += ordersInfo[i].origin_money || ordersInfo[i].order_money || 0;
                    meal_all_number += ordersInfo[i].meal_all_number;
                }
                if (ordersInfo.length <= 1) { // 只有主订单没有amount_with_children
                    amount_with_children = 0;
                }
                async.eachLimit(ordersInfo, 1, (orderInfo, e_cb) => {
                    if (orderInfo.origin_money != null) {
                        let tmp = {};
                        tmp.id = orderInfo.id;
                        tmp.orderMoney = orderInfo.origin_money;
                        tmp.paymentAmount = orderInfo.origin_money;
                        tmp.posDiscount = 100;
                        tmp.orderPosDiscountMoney = 0;
                        tmp.eraseMoney = 0;
                        tmp.realEraseMoney = 0;
                        tmp.reduceMoney = 0;
                        tmp.noDiscountMoney = 0;
                        tmp.servicePrice = shopDetail.is_use_service_price && !orderInfo.parent_order_id ? shopDetail.service_price * orderInfo.customer_count : 0;
                        tmp.sauceFeePrice = shopDetail.is_open_sauce_fee && !orderInfo.parent_order_id ? shopDetail.sauce_fee_price * Number(orderInfo.sauce_fee_count) : 0;    //酱料
                        tmp.towelFeePrice = shopDetail.is_open_towel_fee && !orderInfo.parent_order_id ? shopDetail.towel_fee_price * Number(orderInfo.towel_fee_count) : 0;   //纸巾
                        tmp.tablewareFeePrice = shopDetail.is_open_tableware_fee && !orderInfo.parent_order_id ? shopDetail.tableware_fee_price * Number(orderInfo.tableware_fee_count) : 0;   //餐具
                        tmp.mealFeeNnumber = shopDetail.is_meal_fee && !orderInfo.parent_order_id ? shopDetail.meal_fee_price * meal_all_number : 0;
                        tmp.amountWithChildren = !orderInfo.parent_order_id && ordersInfo.length > 0 ? amount_with_children : 0;

                        tmp.originMoney = 0;
                        orderUpdate.order.push(tmp);
                        orderModel.updateById(tmp.id, tmp, (err, reply) => {
                            return e_cb(err, reply);
                        });
                    } else {
                        return e_cb(err);
                    }
                }, (err) => {
                    if (orderUpdate.order.length > 0) {
                        updateData.push(orderUpdate);
                    }
                    return cb(err, ordersInfo);
                })
            });
        }],
        resumeOrderItem: ['getShopDetail', 'resumeOrdersInfo', function (reply, cb) {
            if (reply.resumeOrdersInfo == false) return cb(null,false);
            let orderItemsUpdate = { orderItem: [] };
            let ordersInfo = reply.resumeOrdersInfo;
            let ids = [];
            for (let i = 0; i < ordersInfo.length; i++) {
                ids.push(`'${ordersInfo[i].id}'`);
            }
            let sql = `select * from tb_order_item where order_id in (${ids.toString()}) and count > 0;`;
            customSqlModel.getAllCustomSqlInfo(sql, (err, orderItemsInfo) => {
                async.eachLimit(orderItemsInfo, 1, (orderItem, e_cb) => {
                    if (orderItem.no_discount_price != null) {
                        let tmp = {};
                        tmp.id = orderItem.id;
                        tmp.finalPrice = orderItem.no_discount_price;
                        tmp.unitPrice = orderItem.no_discount_price / orderItem.orgin_count;
                        tmp.posDiscount = 100;
                        tmp.noDiscountMoney = 0;
                        tmp.grantCount = 0;
                        orderItemsUpdate.orderItem.push(tmp);
                        orderItemModel.updateById(tmp.id, tmp, (err, reply) => {
                            e_cb(err)
                        });
                    } else {
                        e_cb(err)
                    }
                }, (err) => {
                    if (orderItemsUpdate.orderItem.length > 0) {
                        updateData.push(orderItemsUpdate);
                    }
                    cb(err);
                });
            });
        }]
    }, function (err, data) {
        if (err) {
            return result.error(next, err.toString(), msg);
        }
        if (data.resumeOrdersInfo != false){
            webSocketClient.syncUpdateData(JSON.stringify(updateData), null,(err,data)=>{
                synUpdateDataCb(msg, data)
            });
        }
        msgUtil.pushAll('event', {
            type: 'normalOrder',
            eventType: 'orderDiscount',
            data: msg.orderId,
            msg: '订单恢复折扣成功',
        })
        result.success(next, msg);
    });
};



/**
 * 第三方订单插入
 * @param msg
 * @param session
 * @param next
 */
handler.platformPayOrder = function (msg, session, next) {
    let orderId = msg.orderId;
    if (result.isEmpty(msg.orderId)) return result.error(next, "订单编号不能为空", msg);

    async.waterfall([
        function (cb) {
            let sql = `SELECT  (SELECT sum(order_money)  FROM tb_order WHERE id = '${orderId}' or ( parent_order_id= '${orderId}' and order_state = 2)) receipts, * FROM tb_order WHERE  id = '${orderId}'`;
            customSqlModel.getOneCustomSqlInfo(sql, function (error, orderInfo) {
                if (error || !orderInfo.id) return cb(error.toString() || "订单不存在~");

                if (orderInfo.order_state == orderState.CANCEL) return cb("订单已取消~");

                cb(null, orderInfo, msg);
            });
        },
        function (orderInfo, msg, cb) {
            var info = {
                id: msg.orderId,
                is_pos_pay: 1,  // 如果调用此方法，默认为 pos 支付
                order_state: orderState.HAS_PAY,
                pay_mode: msg.payMode,
                sync_state: 0,   //  更新订单数据后，将订单的同步状态更改为 0，推送至服务器后，通过回调更改为 1
                order_pos_discount_money: (+msg.formatDiscount.discountMoney || 0).toFixed(2),
                erase_money: ((+msg.formatDiscount.onReduceMoney.reduceMoney) || 0 + (+msg.formatDiscount.onErasing.erasing)).toFixed(2), // 按金额优惠
                no_discount_money: +msg.formatDiscount.onDiscount.removeMoney || 0,
                pos_discount: +msg.formatDiscount.onDiscount.discountRate || 100,
            };
            if (+msg.formatDiscount.amountMoney != 0) {
                info.order_money = +msg.formatDiscount.amountMoney
            }
            //  如果存在 parentId，说明是支付 子订单， 则无需更改 子订单的 同步状态
            msg.parentId && delete info.sync_state;
            customSqlModel.updateSelective(`tb_order`, info, function (err) {
                if (err) return cb(err.toString());
                cb(null, orderInfo, msg);
            });

        },
        function (orderInfo, msg, cb) {
            //查询是否存在子订单
            let sql = `select parent_order_id from tb_order where id = '${msg.orderId}'`;
            customSqlModel.getOneCustomSqlInfo(sql, function (err, data) {
                if (err) return cb(err.toString());
                if (data.parent_order_id && data.parent_order_id.length <= 0) return cb(null, orderInfo, msg);

                var totalDiscount = ((+msg.formatDiscount.discountMoney || 0) + (+msg.formatDiscount.onReduceMoney.reduceMoney || 0) + (+msg.formatDiscount.onErasing.erasing || 0)).toFixed(2)
                let sql = `UPDATE tb_order set amount_with_children = amount_with_children - ${totalDiscount} where id = '${data.parent_order_id}'`;
                customSqlModel.getOneCustomSqlInfo(sql, function (error) {
                    cb(error || null, orderInfo, msg);
                })
            });

        },
        //  如果有整单折扣 则更新菜品信息
        function (orderInfo, msg, cb) {
            let orderItemList = msg.formatDiscount.orderItemList || [];
            async.eachLimit(orderItemList, 1, function (orderItem, ab) {
                let updateItem = {
                    id: orderItem.id,
                    final_price: orderItem.finalPrice,
                    unit_price: orderItem.unitPrice,
                    pos_discount: orderItem.posDiscount
                };
                customSqlModel.updateSelective(`tb_order_item`, updateItem, function (error) {
                    ab(error || null);
                });
            }, function (err) {
                if (err) return cb(err.toString());
                cb(null, orderInfo, msg)
            })
        },
        function (orderInfo, msg, cb) {
            if (!orderInfo.table_number) return cb(null, msg);
            // 释放桌位
            customSqlModel.getAllCustomSqlInfo(`update tb_table_qrcode set table_state = 0 where table_number = ${orderInfo.table_number}`, function (err) {
                if (err) return cb(err.toString());
                cb(null, msg);
            });
        },
    ],
        function (err, data) {
            if (err) {
                result.error(next, err.toString(), msg);
                fileUtil.appendFile(`orderLogs`, `${msg.__route__}=>【订单支付】支付失败：${msg.orderId},\n,${err.toString()}`);
            } else {
                result.success(next, data);
            }
        });
};

/**
 * 打印订单     总单
 * @param msg
 * @param session
 * @param next
 */
handler.printOrder = function (msg, session, next) {
    var orderId = msg.orderId;
    if (result.isEmpty(orderId)) {
        result.error(next, "请输入订单ID");
        return;
    }

    //  修改订单状态
    let sql = `select * from tb_order where id = '${orderId}'`;
    customSqlModel.getOneCustomSqlInfo(sql, function (error, orderInfo) {
        if (error || !orderInfo) {
            result.error(next, error.toString() || "打印失败，订单不存在");
            return;
        }
        var updateOrder = {
            productionStatus: productionStatus.HAS_PRINT,
            printOrderTime: dateUtil.timestamp(),
            allowContinueOrder: 0,
            allowAppraise: 0,
            allowCancel: 0,
            syncState: 0   // 更改为 未同步状态
        };
        // TODO     此处需要根据店铺模式判断，是否允许订单继续加菜和评论
        orderModel.updateById(orderId, updateOrder, function (error, reply) {
            if (error) {
                return result.error(next, error.toString(), msg);
            }
            result.success(next)
        });
    });

}

/**
 * 获取订单打印信息
 * @param msg
 * @param session
 * @param next
 */
handler.getOrderInfoTest = function (msg, session, next) {
    var orderId = msg.orderId;
    if (result.isEmpty(orderId)) {
        return result.error(next, "请输入订单ID", msg);
    }
    async.waterfall([
        function (cb) { //关联订单信息
            let sql = `select * from tb_order where id = '${orderId}' `;
            customSqlModel.getOneCustomSqlInfo(sql, function (error, orderInfo) {
                if (error || !orderInfo) {
                    return cb(error || "订单不存在：" + orderId);
                }
                cb(null, orderInfo);
            });
        },
        function (orderInfo, cb) { //关联支付项
            let sql = `SELECT * from tb_order_payment_item where order_id = '${orderId}'`;
            customSqlModel.getAllCustomSqlInfo(sql, function (error, paymentItems) {
                if (error) {
                    return cb(error);
                }
                orderInfo.paymentItems = paymentItems;
                cb(null, orderInfo);
            });
        },
        function (orderInfo, cb) {
            // let sql = `select  id ,order_id orderId,article_id articelId,article_name articleName,count,original_price originalPrice,unit_price unitPrice, final_price finalPrice,remark,sort,status, type,parent_id parentId,create_time createTime,meal_item_id mealItemId,kitchen_id kitchenId,
            //     recommend_id recommendId,orgin_count originCount,refund_count refundCount,meal_fee_number mealFeeNumber,change_count changeCount,print_fail_flag printFailFlag,pos_discount posDiscount,weight, need_remind needRemind
            //
            //  from tb_order_item where order_id = '${orderId}' or
            //                  order_id in(select id from tb_order where parent_order_id= '${orderId}' and order_state != 9 ) ORDER BY type DESC`;
            let sql  = `select  m.sort familySort,t.id ,t.order_id orderId,t.article_id articelId,t.article_name articleName,
                    t.count,t.original_price originalPrice,t.unit_price unitPrice, t.final_price finalPrice,t.remark,
                    t.sort,t.status, t.type,t.parent_id parentId,t.create_time createTime,
                    t.meal_item_id mealItemId,t.kitchen_id kitchenId,t.recommend_id recommendId,
                    t.orgin_count originCount,t.refund_count refundCount,t.meal_fee_number mealFeeNumber,
                    t.change_count changeCount,t.print_fail_flag printFailFlag,t.pos_discount posDiscount,t.weight, t.need_remind needRemind
                    from tb_order_item t
                    LEFT JOIN  tb_article a  on  a.id= substr(t.article_id,1,32)
                    LEFT JOIN  tb_article_family m on m.id= a.article_family_id
                    where order_id = '${orderId}'
                    or order_id in(select id from tb_order where parent_order_id= '${orderId}' and order_state != 9 )
                    ORDER BY m.sort asc`;
            customSqlModel.getAllCustomSqlInfo(sql, function (error, orderItemInfo) {
                orderInfo.orderItemList = orderItemInfo;
                cb(null, orderInfo);
            })
        }
    ], function (err, resultData) {
        if (err) {
            result.error(next, err.toString(), msg);
        } else {
            result.success(next, resultData);
        }
    });
}

/**
 * 统计订单个数
 */
handler.orderStateCount = function (msg, session, next) {

    let distributionMode = msg.distributionMode || 1; // 默认堂食

    async.parallel({
        payOrderCount: function (cb) {
            let sql = `select count(id) payOrderCount from tb_order where distribution_mode_id = "${distributionMode}" and (parent_order_id is null or trim(parent_order_id) = '') and order_state in (2,10,11) and production_status in (1,2,3) and accounting_time=strftime('%Y-%m-%d', datetime('now','localtime'))`;
            customSqlModel.getOneCustomSqlInfo(sql, function (error, data) {
                if (error) return result.error(next, error.toString(), msg);
                cb(null, data);
            });
        },
        waitOrderCount: function (cb) {
            let sql = `select count(id) waitOrderCount from tb_order where distribution_mode_id = "${distributionMode}" and (parent_order_id =''  or parent_order_id is null) and order_state != 9 and production_status= 0`;
            customSqlModel.getOneCustomSqlInfo(sql, function (error, data) {
                if (error) return result.error(next, error.toString(), msg);
                cb(null, data);
            });
        },
        noPayOrderCount: function (cb) {
            let sql = `select count(id) noPayOrderCount from tb_order where distribution_mode_id = "${distributionMode}" and (parent_order_id =''  or parent_order_id is null) and order_state = 1 and production_status not in (0,6)`;
            customSqlModel.getOneCustomSqlInfo(sql, function (error, data) {
                if (error) return result.error(next, error.toString(), msg);
                cb(null, data);
            });
        },
        payingOrderCount: function (cb) {
            let sql = `SELECT count(id) payingOrderCount from tb_order where order_state = 1 and pay_mode in (3,4) and customer_id is not null`;
            customSqlModel.getOneCustomSqlInfo(sql, function (error, data) {
                if (error) return result.error(next, error.toString(), msg);
                cb(null, data);
            });
        }
    }, function (error, resultData) {
        if (error) return result.error(next, error.toString(), msg);
        var json = Object.assign(resultData.payOrderCount, resultData.waitOrderCount, resultData.noPayOrderCount, resultData.payingOrderCount);
        result.success(next, json);
    });

}


/**
 * 新 每日营业数据
 * @param  {Object}   msg     request message
 * @param  {Object}   session current session object
 * @param  {Function} next    next step callback
 * @return {Void}
 */
handler.businessData = function (msg, session, next) {
    let dates = msg.dates;
    if (result.isEmpty(dates)) {
        return result.error(next, "请输入日期时间戳", msg);
    }
    orderController.business(dates, (err, reply) => {
        return err ?  result.error(next,err.toString(),msg) : result.success(next, reply);
    });

};



/**
 * 新 退菜 改单
 * @param msg
 * @param session
 * @param next
 */
handler.refundOrder = function (msg, session, next) {
    // 注意：如果有两笔以上订单，只有所有订单的菜品全部退完，此订单才能改完 取消状态，如果一笔订单退完，这个订单的状态仍然不变 -- 2018-12-17 郭峰找吴廷龙确认的逻辑
    let orderId = msg.id;
    let refundItems = msg.orderItems;

    let refundList = [];
    let orderInfo = {};         //  主订单信息
    let refundMoney = 0;        //  退菜总金额
    let mealAllNumber = 0;      //  餐盒总数量
    let mealFeePrice = 0;       //  餐盒总价
    let synTime = Date.now()    //  订单最近更新时间

    if (result.isEmpty(orderId)) return result.error(next, "退菜失败：订单ID不能为空", msg);

    if (!refundItems || refundItems.length == 0) return result.error(next, "退菜失败：未选择退菜项", msg);

    async.waterfall([
        function (cb) {
            refundServicePrice(refundItems, () => { // 1、操作服务费
                return cb(null, null)
            })
        },
        function (reply, cb) {  // 2、判断订单状态：改单 或者 退菜
            let sql = `select * from tb_order where id = '${orderId}' `;
            customSqlModel.getOneCustomSqlInfo(sql, function (error, info) {
                if (error || !info) {
                    return cb(error || "未查到订单信息", null);
                }
                orderInfo = info;
                if (orderInfo.order_state == orderState.NO_PAY) {     //  改单
                    changeOrderItem(refundItems, orderInfo, function (error) {
                         newInsertOrderRefundRemark(orderId, refundItems, msg.refundRemark, function (resultData) {
                            // refundList = resultData;
                            return cb(error || null, null);
                        });
                    });
                } else {      //  退菜
                    refundOrderItem(refundItems, orderInfo, function (error) {
                        //  修改支付项（以服务器回调为准，直接插入）
                        //  插入退菜备注
                        newInsertOrderRefundRemark(orderId, refundItems, msg.refundRemark, function (resultData) {
                            refundList = resultData;
                            return cb(error || null, null);
                        });
                    });
                }
            });
        },
        function (reply, cb) {  //  开始检测订单状态
            checkOrderStatus(orderId, function (error) {
                return cb(error || null, null);
            });
        },
        // function (reply, cb) {  //  开始恢复库存 根据新需求 退菜后 不需要恢复库存
        //     restoreStock(refundItems, function (error) {
        //         return cb(error || null, null);
        //     });
        // }
    ], function (err, data) {
        if (err) {
            result.error(next, "退菜失败：" + err.toString(), msg);
        } else {
            // 更新本地状态
            let updateIds = []
            refundItems.forEach((item)=>{
                if(!(item.orderId in updateIds)){
                    updateIds.push(item.orderId)
                }
            })
            let orderRange = "'" + updateIds.join("','") + "'"
            let sql = `update tb_order set sync_state=0 ,last_sync_time = ${synTime} where id in (${orderRange})`
            customSqlModel.getAllCustomSqlInfo(sql, (err, result) => {
                msg.lastSyncTime = synTime
                msg.syncState = 0
                if(err) {
                    fileUtil.appendFile(`orderLogs`, `${msg.__route__}=>【退菜订单】本地更新同步状态出错 IDs: ${orderRange}`)
                    return cb(err)
                }
                fileUtil.appendFile(`orderLogs`, `${msg.__route__}=>【退菜订单】本地更新同步状态成功 IDs: ${orderRange}`);
            })

            fileUtil.appendFile(`orderLogs`, `${msg.__route__}=>【退菜订单】退菜成功；,\n,${JSON.stringify(msg)}`);
            msgUtil.pushAll('event', {
                type: 'normalOrder',
                eventType: 'refundOrder',
                data: msg.id,
                msg: '订单退菜成功',
            })
            result.success(next, refundList);
        }
    });
};

/**
 * 改单   ：如果改的订单项最终为 0 则把此项删掉
 * @param refundItems   退菜项
 * @param cb
 */
const changeOrderItem = function (refundItems, orderInfo, cb) {
    let parentOrderId = null,
        childOrderRefundMoney = 0,
        childOrderRefundCount = 0;
    async.eachLimit(refundItems, 1, function (refundItem, callBack) {
        if (refundItem.type === 0 || refundItem.type === 10 || refundItem.type === 11 || refundItem.type == 12) return callBack(null, null); // 服务费 跳过
        let sql = `SELECT * FROM tb_order WHERE  id = '${refundItem.orderId}'`;
        customSqlModel.getOneCustomSqlInfo(sql, function (error, order) {
            //  修改订单项
            let sql = `select * from tb_order_item where id = '${refundItem.id}'`;
            customSqlModel.getOneCustomSqlInfo(sql, function (error, item) {
                if (error || !item) {
                    return callBack(error || "订单项未找到");
                }
                //  如果是 套餐子项  则不进行计算
                if (item.type == orderItemType.MEALS_CHILDREN) {
                    return callBack();
                }
                let refundMoney = generalUtil.rounding(refundItem.count * refundItem.unitPrice);
                let refundCount = refundItem.count;
                //  餐盒费     已包含 orderItem 中不用再退一遍
                // if (refundItem.mealFeeNumber > 0) {
                //     refundMoney += (refundItem.count * (order.meal_fee_price / order.meal_all_number)).toFixed(2);
                //     item.meal_fee_number -= refundItem.count;
                // }

                item.count -= refundCount;
                item.refund_count += refundCount;
                item.final_price -= refundMoney ;
                // item.change_count
                // item.meal_fee_number

                customSqlModel.updateSelective('tb_order_item', item, function (error) {
                    if (error) return callBack(error);
                    if (item.type == orderItemType.SETMEALS) {
                        let sql = `update tb_order_item set count = 0,refund_count = 1 where parent_id = '${item.id}' and type = 4;`;
                        customSqlModel.getOneCustomSqlInfo(sql);
                    }
                    let _order = {
                        id: order.id,
                        original_amount: generalUtil.rounding(order.original_amount - refundMoney),
                        // origin_money: generalUtil.rounding(order.amount_with_children || order.order_money - refundMoney),
                        order_money: generalUtil.rounding(order.order_money - refundMoney),
                        payment_amount: generalUtil.rounding(order.payment_amount - refundMoney),
                        article_count: order.article_count - refundCount,
                    };
                    //  如果有子订单，则要更新订单总额（总订单+子订单）
                    if (order.amount_with_children && order.amount_with_children > 0) {
                        _order.amount_with_children = generalUtil.rounding(order.amount_with_children - refundMoney);
                        _order.count_with_child = order.count_with_child - refundCount;
                    }
                    //  餐盒费     已包含 orderItem 中不用再退一遍
                    // if (refundItem.mealFeeNumber > 0) {
                    //     _order.meal_fee_price -= (refundItem.count * (order.meal_fee_price / order.meal_all_number)).toFixed(2);
                    //     _order.meal_all_number -= refundItem.count;
                    // }

                    //  如果菜品数 小于等于 0 ，则取消订单
                    if (_order.article_count <= 0) {
                        _order.article_count = 0;
                    }
                    // if (orderInfo.parent_order_id && _order.article_count <= 0) { // 子订单 且 菜品全部退完
                    //     _order.order_state = orderState.CANCEL;
                    // }
                    //  判断当前订单是否是加菜订单
                    if (order.parent_order_id) {
                        parentOrderId = order.parent_order_id;
                        childOrderRefundMoney += parseFloat(refundMoney);
                        childOrderRefundCount += refundCount;
                    }
                    //1、未核重 重量包退菜
                    sql = `update tb_order set need_confirm_order_item = 0 where 
                                        id = '${refundItem.orderId}' and
                                        (select count(*) count from tb_order_item where order_id='${refundItem.orderId}'
                                         and orgin_count != refund_count and need_remind = 1) <= 0 
                                         and ((select count(*) count from tb_order where parent_order_id = '${refundItem.orderId}'  and need_confirm_order_item = 1) <= 0) ;`;
                    customSqlModel.getOneCustomSqlInfo(sql, function (err, reply) { // 当前订单核重退菜
                        sql = `update tb_order set need_confirm_order_item = 0 where 
                                        id = '${orderInfo.id}' and
                                        (select count(*) count from tb_order_item where order_id='${orderInfo.id}'
                                         and orgin_count != refund_count and need_remind = 1) <= 0 
                                         and ((select count(*) count from tb_order where parent_order_id = '${orderInfo.id}'  and need_confirm_order_item = 1) <= 0) ;`;
                        customSqlModel.getOneCustomSqlInfo(sql, function (err, reply) { // 更新主订单核重退菜
                            customSqlModel.updateSelective('tb_order', _order, function (error) {
                                sql = `SELECT id FROM tb_order WHERE(id = '${orderInfo.id}' OR(parent_order_id = '${orderInfo.id}')) AND (amount_with_children > 0 OR order_money > 0);`
                                customSqlModel.getAllCustomSqlInfo(sql, function (err, allOrderState) { // 2、子订单主订单都退完了，状态都变
                                    if (allOrderState.length <= 0) {
                                        sql = `update tb_order set order_state = ${orderState.CANCEL} where id = '${orderInfo.id}' or parent_order_id = '${orderInfo.id}'; `
                                        customSqlModel.getOneCustomSqlInfo(sql, function (err, reply) {
                                            return callBack(err || null);
                                        })
                                    } else {
                                        return callBack(error || null);
                                    }
                                })
                            });
                        })
                    })
                })
            })
        });
    }, function (error) {
        if (!parentOrderId) {
            return cb(error || null);
        }
        //  修改主订单数据
        let sql = `update tb_order set amount_with_children = amount_with_children - ${childOrderRefundMoney},
                    count_with_child = count_with_child - ${ childOrderRefundCount} where id = '${parentOrderId}'`;
        customSqlModel.getOneCustomSqlInfo(sql, function (error, reply) {
            cb(error || null);
        });
    });
};

/**
 * 退菜
 * @param refundItems
 * @param cb
 */
const refundOrderItem = function (refundItems, orderInfo, cb) {
    let parentOrderId = "";     //  主订单ID
    let childOrderRefundMoney = 0;        //  退菜总金额
    let childOrderRefundCount = 0; //  退菜总数量
    async.eachLimit(refundItems, 1, function (refundItem, callBack) {
        if (refundItem.type === 0 || refundItem.type === 10 || refundItem.type === 11 || refundItem.type == 12) return callBack(null, null); // 服务费 跳过
        let sql = `SELECT(SELECT sum(order_money)  FROM tb_order WHERE id = '${refundItem.orderId}' or(parent_order_id = '${refundItem.orderId}' and order_state = 2))
                    receipts, * FROM tb_order WHERE  id = '${refundItem.orderId}'`;
        customSqlModel.getOneCustomSqlInfo(sql, function (error, order) {
            if (error || !order) {
                return callBack(error || "未找到订单");
            }
            //  修改订单项
            sql = `select * from tb_order_item where id = '${refundItem.id}'`;
            customSqlModel.getOneCustomSqlInfo(sql, function (error, item) {
                if (error || !item) {
                    return callBack(error || "订单项未找到");
                }

                let refundMoney = (refundItem.count * refundItem.unitPrice).toFixed(2);
                let refundCount = refundItem.count;
                //  餐盒费
                if (refundItem.mealFeeNumber > 0) {
                    // refundMoney += generalUtil.rounding(refundItem.count * (order.meal_fee_price / order.meal_all_number));
                    item.meal_fee_number -= refundItem.count;
                }
                item.count -= refundCount;
                item.final_price -= refundMoney;
                item.refund_count += refundCount;
                //  如果是 套餐主品，将主品 final_price 改为0，表示已退菜，并且 自动将此套餐子品退完
                if (item.type == orderItemType.SETMEALS) {
                    item.final_price = 0;
                    let sql = `update tb_order_item set count = 0, refund_count = 1 where parent_id = '${refundItem.id}' and type = 4; `;
                    customSqlModel.getOneCustomSqlInfo(sql);
                }
                // item.change_count
                customSqlModel.updateSelective('tb_order_item', item, function (error, reply) {
                    if (error) {
                        return callBack("-updateSelectiveError：" + error);
                    }
                    let _order = {
                        id: order.id,
                        article_count: order.article_count - refundCount,
                    };
                    //  餐盒费
                    let reduceMealFee = 0;
                    if (refundItem.mealFeeNumber > 0) {
                        _order.meal_fee_price = order.meal_fee_price - (refundItem.count * (order.meal_fee_price / order.meal_all_number)).toFixed(2);
                        _order.meal_all_number = order.meal_all_number - refundItem.count;
                        reduceMealFee = refundItem.count * (order.meal_fee_price / order.meal_all_number);
                    }

                    //  如果有子订单，则要更新订单总额（总订单+子订单）
                    if (order.amount_with_children && order.amount_with_children > 0) {
                        _order.amount_with_children = generalUtil.rounding(order.amount_with_children) - refundMoney - reduceMealFee;
                        _order.count_with_child = order.count_with_child - refundCount;
                    }

                    _order.origin_money= generalUtil.rounding(order.order_money - refundMoney - reduceMealFee);
                    _order.order_money = generalUtil.rounding(order.order_money - refundMoney - reduceMealFee);
                    _order.payment_amount = generalUtil.rounding(order.order_money - refundMoney - reduceMealFee);

                    //  如果菜品数 小于等于 0 ，则取消订单
                    if (_order.article_count <= 0) {
                        _order.article_count = 0;
                    }

                    //  判断当前订单是否是加菜订单
                    if (order.parent_order_id) {
                        parentOrderId = order.parent_order_id;
                        childOrderRefundMoney += parseFloat(refundMoney);
                        childOrderRefundCount += refundCount;
                    }
                    // if (orderInfo.parent_order_id && _order.article_count <= 0) { // 子订单 且 菜品全部退完
                    //     _order.production_status = productionStatus.REFUND_ARTICLE;
                    // }
                    // 1、退主订单不退子订单 主订单状态不变
                    customSqlModel.updateSelective('tb_order', _order, function (error, reply) {
                        if (error) {
                            return callBack("updateSelectiveError：" + error);
                        }
                        sql = `SELECT id FROM tb_order WHERE(id = '${orderInfo.id}' OR(parent_order_id = '${orderInfo.id}')) AND (amount_with_children >= 0 OR order_money >= 0); `
                        console.log("--------退菜", sql)
                        customSqlModel.getAllCustomSqlInfo(sql, function (err, allOrderState) { //改变主订单状态
                            console.log("----------allOrderState", allOrderState)
                            if (allOrderState && allOrderState.length <= 0) {
                                sql = `update tb_order set production_status = ${productionStatus.REFUND_ARTICLE} where(id = '${orderInfo.id}' or parent_order_id = '${orderInfo.id}'); `
                                customSqlModel.getOneCustomSqlInfo(sql, function (err, reply) {
                                    customSqlModel.getOneCustomSqlInfo('select shop_mode from tb_shop_detail', function (error, result) {
                                        if (result.shop_mode == 2 || result.shop_mode == 7) {
                                            msgUtil.pushAll('event',{
                                                type: "cancelOrder",
                                                data: orderInfo
                                            })
                                            // tvWebsocketClient.removeNumber(orderInfo);
                                        }
                                        callBack();
                                    })
                                })
                            } else {
                                callBack();
                            }
                        })
                    });
                })
            })
        });
    }, function (error) {
        if (!parentOrderId) {
            return cb(error || null);
        }
        //  修改主订单数据
        let sql = `update tb_order set amount_with_children = amount_with_children - ${childOrderRefundMoney},
                    count_with_child = count_with_child - ${ childOrderRefundCount} where id = '${parentOrderId}'`;
        customSqlModel.getOneCustomSqlInfo(sql, function (error, reply) {
            cb(error || null);
        })
    });
};

/**
 * 退服务费
 * @param refundItems
 * @param cb
 */
const refundServicePrice = function (refundItems, cb) {
    async.eachLimit(refundItems, 1, function (refundItem, e_cb) {
        if (refundItem.type == 1 || refundItem.type == 2 || refundItem.type == 3 || refundItem.type == 5 || refundItem.type == 6 || refundItem.type == 8) return e_cb(null); // 不是服务费 跳过
        let customerCount = refundItem.count || 0; // 要退的人数
        let servicePrice = refundItem.unitPrice ? refundItem.unitPrice * customerCount : 0; // 要退的服务费
        let updateDate = {};
        updateDate.id = refundItem.orderId;
        // updateDate.customerCount = 0;
        updateDate.servicePrice = 0;
        updateDate.orderMoney = 0;
        updateDate.paymentAmount = 0;
        updateDate.amountWithChildren = 0;

        let sql = `select table_number, original_amount,article_count, order_money, payment_amount, amount_with_children, customer_count, service_price, sauce_fee_count, sauce_fee_price, towel_fee_count, towel_fee_price, tableware_fee_count, tableware_fee_price  from tb_order where id = '${updateDate.id}'; `;
        customSqlModel.getOneCustomSqlInfo(sql, (err, orderInfo) => {
            var type = [10,11,12,"10","11","12"]
            if (type.includes(refundItem.type)) {
                updateDate.tablewareFeeCount = refundItem.type == 12 ? orderInfo.tableware_fee_count - refundItem.count : orderInfo.tableware_fee_count;
                updateDate.tablewareFeePrice = refundItem.type == 12 ? orderInfo.tableware_fee_price - refundItem.unitPrice * refundItem.count : orderInfo.tableware_fee_price;
                updateDate.towelFeeCount = refundItem.type == 11 ? orderInfo.towel_fee_count - refundItem.count : orderInfo.towel_fee_count;
                updateDate.towelFeePrice = refundItem.type == 11 ? orderInfo.towel_fee_price - refundItem.unitPrice * refundItem.count : orderInfo.towel_fee_price;
                updateDate.sauceFeeCount = refundItem.type == 10 ? orderInfo.sauce_fee_count - refundItem.count : orderInfo.sauce_fee_count;
                updateDate.sauceFeePrice = refundItem.type == 10 ? orderInfo.sauce_fee_price - refundItem.unitPrice * refundItem.count : orderInfo.sauce_fee_price;

                var serviceTotal =  refundItem.unitPrice * refundItem.count

                // updateDate.originalAmount = orderInfo.original_amount - servicePrice; // 人数

                updateDate.paymentAmount = generalUtil.rounding(orderInfo.payment_amount - serviceTotal); // payment_amount
                updateDate.orderMoney = generalUtil.rounding(orderInfo.order_money - serviceTotal); // order_money
                updateDate.servicePrice = generalUtil.rounding(orderInfo.service_price - serviceTotal); // service_price
                if (orderInfo.amount_with_children) { // amount_with_children
                    updateDate.amountWithChildren = generalUtil.rounding(orderInfo.amount_with_children - serviceTotal);
                }
                if ((orderInfo.order_money == orderInfo.service_price) && orderInfo.article_count <= 0 && orderInfo.amount_with_children <= 0 && orderInfo.order_money <= 0) { //order_state
                    updateDate.orderState = orderState.CANCEL; // 如果只剩服务费没退，退服务费后改变订单状态
                }
            } else {
                if (!orderInfo || !orderInfo.service_price) {
                    return  e_cb(null, null);
                    // return result.success(next, null); //订单不存在 或者 服务费已经退完了
                }
                // updateDate.customerCount = orderInfo.customer_count - customerCount; // 人数
                updateDate.originalAmount = orderInfo.original_amount - servicePrice; // 人数

                updateDate.paymentAmount = generalUtil.rounding(orderInfo.payment_amount - servicePrice); // payment_amount
                updateDate.orderMoney = generalUtil.rounding(orderInfo.order_money - servicePrice); // order_money
                updateDate.servicePrice = generalUtil.rounding(orderInfo.service_price - servicePrice); // service_price
                if (orderInfo.amount_with_children) { // amount_with_children
                    updateDate.amountWithChildren = generalUtil.rounding(orderInfo.amount_with_children - servicePrice);
                }
                if ((orderInfo.order_money == orderInfo.service_price) && orderInfo.article_count <= 0  && orderInfo.amount_with_children <= 0 && orderInfo.order_money <=0) { //order_state
                    updateDate.orderState = orderState.CANCEL; // 如果只剩服务费没退，退服务费后改变订单状态
                }
            }
            orderModel.updateById(updateDate.id, updateDate, (err, reply) => {
                if (orderInfo.order_money == orderInfo.service_price && refundItems.type == 0 && orderInfo.amount_with_children <= 0 && orderInfo.order_money <= 0) { // 如果只剩服务费没退，退服务费后释放桌位
                    sql = `update tb_table_qrcode set table_state = 0 where table_number = ${orderInfo.table_number} `;
                    customSqlModel.getOneCustomSqlInfo(sql, (err, reply) => {
                        e_cb(err, null);
                    })
                } else {
                    e_cb(err, null);
                }
            })
        })
    }, function (err) {
        cb(err);
    })
};

const restoreStock = function (refundItems, cb) {
    async.eachLimit(refundItems, 1, function (refundItem, callback) {
        if (refundItem.type === 0) return callback(null); //服务费 跳过
        let sql = `select * from tb_order_item where id = '${refundItem.id}'`;
        customSqlModel.getOneCustomSqlInfo(sql, (error, orderItem) => {
            if (error) {
                return callback(error);
            }
            //  单品 或 新规格
            if (orderItem.type == orderItemType.ARTICLE || orderItem.type == orderItemType.UNIT_NEW || orderItem.type == orderItemType.WEIGHT) {
                sql = `update tb_article set current_working_stock = current_working_stock+${refundItem.count}, is_empty = 0 where id = '${refundItem.articleId}'`;
                customSqlModel.getAllCustomSqlInfo(sql, (error, reply) => {
                    if (error) {
                        return callback(error);
                    }
                    callback();
                });
            } else if (orderItem.type == orderItemType.UNITPRICE) {    //  老规格
                sql = `update tb_article_price set current_working_stock = current_working_stock+${refundItem.count} where id = '${refundItem.articleId}'`;
                customSqlModel.getAllCustomSqlInfo(sql, (error, reply) => {
                    if (error) {
                        return callback(error);
                    }
                    let articleId = refundItem.articleId.split("@")[0];
                    sql = `update tb_article set current_working_stock = current_working_stock+${refundItem.count}, is_empty = 0 where id = '${articleId}'`;
                    customSqlModel.getAllCustomSqlInfo(sql, (error, reply) => {
                        if (error) {
                            return callback(error);
                        }
                        callback();
                    });
                });
            } else if (orderItem.type == orderItemType.SETMEALS) { // 套餐
                sql = `SELECT * from tb_order_item where parent_id = '${orderItem.id}'`;
                customSqlModel.getAllCustomSqlInfo(sql, (error, mealsItems) => {
                    if (error) {
                        return callback(error);
                    }
                    //  还原套餐子项
                    async.eachLimit(mealsItems, 1, function (mealsItem, mealCB) {
                        sql = `update tb_article set current_working_stock = current_working_stock+1, is_empty = 0 where id = '${mealsItem.article_id}'`;
                        customSqlModel.getAllCustomSqlInfo(sql, (error, reply) => {
                            if (error) {
                                return mealCB(error);
                            }
                            mealCB();
                        })
                    }, function (error) {
                        if (error) {
                            return callback(error);
                        }
                        //  还原套餐主项
                        sql = `update tb_article set current_working_stock = current_working_stock+${orderItem.count}, is_empty = 0 where id = '${refundItem.articleId}'`;
                        customSqlModel.getAllCustomSqlInfo(sql, (error, reply) => {
                            if (error) {
                                return callback(error);
                            }
                            callback();
                        })
                    })
                })
            }
        });
    }, function (error) {
        cb(error || null);
    });
};

const checkOrderStatus = function (orderId, cb) {
    let sql = `select * from tb_order where id = '${orderId}' `;
    customSqlModel.getOneCustomSqlInfo(sql, function (error, orderInfo) {
        if (error) {
            return cb(error);
        }
        if (orderInfo.article_count > 0 || orderInfo.count_with_child > 0 || orderInfo.order_money > 0 || orderInfo.amount_with_children > 0 || orderInfo.service_price > 0) {
            sql = "SELECT * from tb_order where parent_order_id = ?";
            customSqlModel.getAllCustomSqlInfo(sql, function (error, childrenOrders) {
                if (error) {
                    return cb(error);
                }
                async.eachLimit(childrenOrders, 1, function (childrenOrder, callback) {
                    if (childrenOrder.article_count != 0) {
                        return callback();
                    }
                    sql = `update tb_order set production_status = ${productionStatus.REFUND_ARTICLE} where id = '${childrenOrder.id}'`;
                    customSqlModel.getAllCustomSqlInfo(sql, function (error, reply) {
                        callback(error || null);
                    });
                }, function (error) {
                    cb(error || null);
                });
            })
        } else {
            let sql = `update tb_order set production_status = ${productionStatus.REFUND_ARTICLE} where id = '${orderId}'`;
            customSqlModel.getAllCustomSqlInfo(sql, function (error, reply) {
                sql = `SELECT  (SELECT sum(order_money)  FROM tb_order WHERE id = '${orderId}' or ( parent_order_id= '${orderId}' and order_state = 2)) receipts, * FROM tb_order WHERE  id = '${orderId}'`;
                customSqlModel.getOneCustomSqlInfo(sql, function (error) {
                    if (error) return cb(error);
                    customSqlModel.getAllCustomSqlInfo(`update tb_table_qrcode set table_state = 0 where table_number = ${orderInfo.table_number} `, function (error) {
                        if (error) return cb(error);
                        cb(error || null);
                    })
                })
                // cb(error || null);
            });
        }
    });
};


/**
 * 插入退菜原因
 * 适用于新的退菜方法
 * 由于新方法和老方法的字段不一样（item.refundCount和item.count）
 * 为避免造成未知bug，所以重新复制了一份，重构时需整合 by_lmx  2018年2月26日 15:13:38
 * @param orderId
 * @param refundOrderItems
 * @param orderRefundRemark
 * @param cb
 */
var newInsertOrderRefundRemark = function (orderId, refundOrderItems, orderRefundRemark, cb) {
    let refundList = [];
    async.eachLimit(refundOrderItems, 1, function (item, callback) {
        let remark = {
            type: 1,
            article_id: item.articleId,
            order_id: orderId,
            refund_remark_id: orderRefundRemark.split("_")[0],
            refund_remark: orderRefundRemark.split("_")[1],
            remark_supply: "",
            refund_count: item.count,
            shop_id: generalUtil.shopId,
            brand_id: generalUtil.brandId,
            create_time: dateUtil.timestamp()
        };
        customSqlModel.insertSelective(`tb_order_refund_remark`,remark, function (error) {
            refundList.push(generalUtil.convertHumpName(remark));
            callback(error || null);
        });
    }, function (error) {
        cb && cb(refundList);
    });
};


/**
 * 获取 当天 的所有已支付订单
 * @param msg
 * @param session
 * @param next
 */
handler.payOrderList = function (msg, session, next) {
    let searchCondition = '';
    if (msg.verCode && !msg.tableNumber) {
        searchCondition = `and ( ver_code like '%${msg.verCode}%') `
    }
    if (!msg.verCode && msg.tableNumber) {
        searchCondition = `and ( table_number like '%${msg.tableNumber}%') `
    }
    if (msg.verCode && msg.tableNumber) {
        searchCondition = `and (   ver_code like '%${msg.verCode}%' or table_number like '%${msg.tableNumber}%') `
    }

    let condition = {};
    condition.page_skip = msg.page_skip;
    condition.page_size = msg.page_size;
    let distributionMode = msg.distributionMode || 1;
    async.parallel({
        payOrderList: function (cb) {
            let sql = `SELECT id,id order_id,table_number,amount_with_children,order_money,customer_id,
            CASE
            WHEN amount_with_children > 0 THEN
                amount_with_children
            ELSE
                order_money
            END totalAmount,
	        create_time,customer_count order_customer_count,ver_code,order_state,
            production_status,pay_mode,call_times from tb_order where distribution_mode_id = ${distributionMode}
            and (parent_order_id =''  or parent_order_id is null) and order_state in (2,10,11) and production_status in (1,2,3) 
            and accounting_time=strftime('%Y-%m-%d', datetime('now','localtime')) ${searchCondition} order by create_time DESC
            limit ${condition.page_skip},${condition.page_size}`;
            customSqlModel.getAllCustomSqlInfo(sql, function (err, data) {
                return cb(err, data);
            });
        },
        payOrderListCount: function (cb) {
            let sql = `SELECT count(*) count from tb_order where distribution_mode_id = ${distributionMode}
            and (parent_order_id =''  or parent_order_id is null) and order_state in (2,10,11) and production_status in (1,2,3) 
            and accounting_time=strftime('%Y-%m-%d', datetime('now','localtime')) ${searchCondition}`;
            customSqlModel.getOneCustomSqlInfo(sql, function (err, data) {
                return cb(err, data.count);
            });
        }
    }, function (error, reply) {
        if (error) {
            result.error(next, error.toString(), msg)
        }
        let results = {};
        results.payOrderList = reply.payOrderList;
        results.totalPage = Math.ceil(reply.payOrderListCount / msg.page_size) || 1;
        results.curPage = msg.page_index;
        results.sizePage = msg.page_size;
        return result.success(next, results);
    });
};

/**
 * 获取 所有 付款中订单
 */
handler.payingOrderList = function (msg, session, next) {
    let searchCondition = '';
    if (msg.verCode && !msg.tableNumber) {
        searchCondition = `and ( ver_code like '%${msg.verCode}%') `
    }
    if (!msg.verCode && msg.tableNumber) {
        searchCondition = `and ( table_number like '%${msg.tableNumber}%') `
    }
    if (msg.verCode && msg.tableNumber) {
        searchCondition = `and (   ver_code like '%${msg.verCode}%' or table_number like '%${msg.tableNumber}%') `
    }

    let condition = {};
    condition.page_skip = msg.page_skip;
    condition.page_size = msg.page_size;
    let distributionMode = msg.distributionMode || 1;

    async.parallel({
        payingOrderList: function (cb) {
            let sql = `SELECT id,id order_id, table_number,amount_with_children,order_money , customer_id,
                    CASE
                    WHEN amount_with_children > 0 THEN
                        amount_with_children
                    ELSE
                        order_money
                    END totalAmount,
                    create_time,customer_count order_customer_count ,ver_code,order_state,
                    production_status,pay_mode,call_times from tb_order where distribution_mode_id = ${distributionMode}
                    and  order_state = 1 and pay_mode in (3,4) and customer_id is not null ${searchCondition} 
                    order by create_time ASC
                    limit ${condition.page_skip},${condition.page_size}`;
            customSqlModel.getAllCustomSqlInfo(sql, function (err, data) {
                return cb(err, data);
            });
        },
        payingOrderListCount: function (cb) {
            let sql = `SELECT count(*) count from tb_order where distribution_mode_id = ${distributionMode}
                        and  order_state = 1 and pay_mode in (3,4) and customer_id is not null ${searchCondition};`;
            customSqlModel.getOneCustomSqlInfo(sql, function (err, data) {
                return cb(err, data.count);
            });
        }
    }, function (error, reply) {
        if (error) {
            result.error(next, error.toString(), msg)
        }
        let results = {};
        results.payingOrderList = reply.payingOrderList;
        results.totalPage = Math.ceil(reply.payingOrderListCount / msg.page_size) || 1;
        results.curPage = msg.page_index;
        results.sizePage = msg.page_size;
        return result.success(next, results);
    })
};

/**
 * 获取 所有 待下单订单
 */
handler.waitOrderList = function (msg, session, next) {
    let searchCondition = '';
    if (msg.verCode && !msg.tableNumber) {
        searchCondition = `and ( ver_code like '%${msg.verCode}%') `
    }
    if (!msg.verCode && msg.tableNumber) {
        searchCondition = `and ( table_number like '%${msg.tableNumber}%') `
    }
    if (msg.verCode && msg.tableNumber) {
        searchCondition = `and (   ver_code like '%${msg.verCode}%' or table_number like '%${msg.tableNumber}%') `
    }

    let condition = {};
    condition.page_skip = msg.page_skip;
    condition.page_size = msg.page_size;

    let distributionMode = msg.distributionMode || 1;

    async.parallel({
        waitOrderList: function (cb) {
            let sql = `SELECT id,id order_id ,table_number,amount_with_children,order_money, customer_id,
                    CASE
                    WHEN amount_with_children > 0 THEN
                        amount_with_children
                    ELSE
                        order_money
                    END totalAmount,
                    create_time,customer_count order_customer_count,ver_code,order_state,
                    production_status,pay_mode,call_times from tb_order where distribution_mode_id = ${distributionMode} and
                    (parent_order_id =''  or parent_order_id is null) and order_state != 9 and production_status= 0 ${searchCondition} 
                    order by create_time DESC
                    limit ${condition.page_skip},${condition.page_size}`;
            customSqlModel.getAllCustomSqlInfo(sql, function (err, data) {
                return cb(err, data);
            });
        }, waitOrderListCount: function (cb) {
            let sql = `SELECT count(*) count from tb_order where distribution_mode_id = ${distributionMode} and
                        (parent_order_id =''  or parent_order_id is null) and order_state != 9 and production_status= 0 
                        ${searchCondition}`;
            customSqlModel.getOneCustomSqlInfo(sql, function (err, data) {
                return cb(err, data.count);
            });
        }
    }, function (error, reply) {
        if (error) {

            result.error(next, error.toString(), msg)
        }
        let results = {};
        results.waitOrderList = reply.waitOrderList;
        results.totalPage = Math.ceil(reply.waitOrderListCount / msg.page_size) || 1;
        results.curPage = msg.page_index;
        results.sizePage = msg.page_size;
        return result.success(next, results);
    })
};

/**
 * 获取 所有 未支付订单
 */
handler.noPayOrderList = function (msg, session, next) {
    let searchCondition = '';
    if (msg.verCode && !msg.tableNumber) {
        searchCondition = `and ( ver_code like '%${msg.verCode}%') `
    }
    if (!msg.verCode && msg.tableNumber) {
        searchCondition = `and ( table_number like '%${msg.tableNumber}%') `
    }
    if (msg.verCode && msg.tableNumber) {
        searchCondition = `and (   ver_code like '%${msg.verCode}%' or table_number like '%${msg.tableNumber}%') `
    }

    let condition = {};
    condition.page_skip = msg.page_skip;
    condition.page_size = msg.page_size;

    let distributionMode = msg.distributionMode || 1;

    async.parallel({
        noPayOrderList: function (cb) {
            let sql = `SELECT id,id order_id,table_number,amount_with_children,order_money,order_money,customer_id,
                        CASE
                        WHEN amount_with_children > 0 THEN
                            amount_with_children
                        ELSE
                            order_money
                        END totalAmount,
                        create_time,customer_count order_customer_count,ver_code,order_state,
                        production_status,pay_mode,call_times from tb_order where distribution_mode_id = ${distributionMode} and
                        (parent_order_id =''  or parent_order_id is null) and order_state = 1 and production_status != 0 ${searchCondition}  
                        order by create_time ASC
                        limit ${condition.page_skip},${condition.page_size}`;
            customSqlModel.getAllCustomSqlInfo(sql, function (err, data) {
                cb(err, data);
            });
        }, noPayOrderListCount: function (cb) {
            let sql = `SELECT count(*) count from tb_order where distribution_mode_id = ${distributionMode} and
                        (parent_order_id =''  or parent_order_id is null) and order_state = 1 and production_status != 0 ${searchCondition}  ;`;
            customSqlModel.getOneCustomSqlInfo(sql, function (err, data) {
                cb(err, data.count);
            });
        }
    }, function (error, reply) {
        if (error) {
            result.error(next, error.toString(), msg)
        }
        let results = {};
        results.noPayOrderList = reply.noPayOrderList;
        results.totalPage = Math.ceil(reply.noPayOrderListCount / msg.page_size) || 1;
        results.curPage = msg.page_index;
        results.sizePage = msg.page_size;
        return result.success(next, results);
    })
};

/**
 * 获取 所有 待下单 和 未支付 的订单
 */
handler.waitAndNoPayOrderList = function (msg, session, next) {
    let searchCondition = '';
    if (msg.search_code) {
        searchCondition += `and (ver_code like '%${msg.search_code}%' or table_number like '%${msg.search_code}%') `
    }
    let condition = {};
    condition.page_skip = msg.page_skip;
    condition.page_size = msg.page_size;

    let distributionMode = msg.distributionMode || 1;
    async.parallel({
        waitAndNoPayOrderList: function (cb) {
            let sql = `SELECT id,table_number,amount_with_children,order_money,create_time,customer_count,ver_code,
                        order_state,production_status,pay_mode,call_times, customer_id from tb_order 
                        where distribution_mode_id = ${distributionMode} and (parent_order_id =''  or parent_order_id is null) 
                        and order_state != 9 ${searchCondition} 
                        and ( order_state in (1) or production_status in (0) )
                        limit ${condition.page_skip},${condition.page_size} `;
            customSqlModel.getAllCustomSqlInfo(sql, function (err, data) {
                cb(err, data);
            });
        },
        waitAndNoPayOrderListCount: function (cb) {
            let sql = `SELECT count(*) count from tb_order 
                        where distribution_mode_id = ${distributionMode} and (parent_order_id =''  or parent_order_id is null) and order_state != 9
                        and ( order_state in (1) or production_status in (0) ) ${searchCondition}`;
            customSqlModel.getOneCustomSqlInfo(sql, function (err, data) {
                cb(err, data.count);
            });
        }
    }, function (error, reply) {
        if (error) {
            result.error(next, error.toString(), msg)
        }
        let results = {};
        results.waitAndNoPayOrderList = reply.waitAndNoPayOrderList;
        results.totalPage = Math.ceil(reply.waitAndNoPayOrderListCount / msg.page_size) || 1;
        results.curPage = msg.page_index;
        results.sizePage = msg.page_size;
        return result.success(next, results);
    })
};


/***
 * 获取当天堂食+外带的 没有叫号的
 * @param msg
 * @param session
 * @param next
 */
handler.waitCallTPOrderList = function (msg, session, next) {
    let searchCondition = '';
    if (msg.search_code) {
        searchCondition += `and (ver_code like '%${msg.search_code}%' or table_number like '%${msg.search_code}%') `
    }
    let condition = {};
    condition.page_skip = msg.page_skip;
    condition.page_size = msg.page_size;
    async.parallel({
        waitCallTPOrderList: function (cb) {
            var sql = `SELECT id,table_number,amount_with_children,order_money,create_time,customer_count,ver_code,order_state,production_status,pay_mode,call_times, serial_number, distribution_mode_id, customer_id
            from tb_order where distribution_mode_id in(1,3)
            and (parent_order_id is null or parent_order_id ='') and order_state not in (1,9) and production_status in (1,2)
            and accounting_time=strftime('%Y-%m-%d', datetime('now','localtime')) ${searchCondition} order by create_time asc
            limit ${condition.page_skip},${condition.page_size}
            `;
            customSqlModel.getAllCustomSqlInfo(sql, function (error, data) {
                if (error) return cb(error);
                cb(null, data)
            });

        },
        waitCallTPOrderConut: function (cb) {
            var sql = `SELECT count(*) count
            from tb_order where distribution_mode_id in(1,3)
            and (parent_order_id is null or parent_order_id ='') and order_state not in (1,9) and production_status in (1,2)
            and accounting_time=strftime('%Y-%m-%d', datetime('now','localtime')) ${searchCondition}`;
            customSqlModel.getOneCustomSqlInfo(sql, function (error, data) {
                if (error) return cb(error);
                cb(null, data.count)
            });
        },
    }, function (error, reply) {
        if (error) {
            result.error(next, error.toString(), msg)
        }
        let results = {};
        results.waitCallTPOrderList = (reply.waitCallTPOrderList).reverse();
        results.totalPage = Math.ceil(reply.waitCallTPOrderConut / msg.page_size) || 1;
        results.curPage = msg.page_index;
        results.sizePage = msg.page_size;
        result.success(next, results);
    });
};
/***
 * 获取当天堂食+外带的 已经叫号的
 * @param msg
 * @param session
 * @param next
 */
handler.hasCallTPOrderList = function (msg, session, next) {
    let searchCondition = '';
    if (msg.search_code) {
        searchCondition += `and (ver_code like '%${msg.search_code}%' or table_number like '%${msg.search_code}%') `
    }
    let condition = {};
    condition.page_skip = msg.page_skip;
    condition.page_size = msg.page_size;
    async.parallel({
        hasCallTPOrderList: function (cb) {
            var sql = `SELECT id,table_number,amount_with_children,order_money,create_time,customer_count,ver_code,order_state,production_status,pay_mode,call_times, serial_number, distribution_mode_id, customer_id
            from tb_order where distribution_mode_id in (1,3)
            and (parent_order_id is null or parent_order_id ='')
            and order_state not in (1,9)
            and production_status = 3 and accounting_time=strftime('%Y-%m-%d', datetime('now','localtime')) ${searchCondition} order by create_time desc
            limit ${condition.page_skip},${condition.page_size}
            `;
            // limit ${condition.page_skip},${condition.page_size}
            customSqlModel.getAllCustomSqlInfo(sql, function (error, data) {
                if (error) return cb(error);
                cb(null, data)
            });
        },
        hasCallTPOrderCount: function (cb) {
            var sql = `SELECT count(*) count from tb_order where distribution_mode_id in (1,3)
            and (parent_order_id is null or parent_order_id ='')
            and order_state not in (1,9)
            and production_status = 3 
            and accounting_time=strftime('%Y-%m-%d', datetime('now','localtime')) ${searchCondition} `;

            customSqlModel.getOneCustomSqlInfo(sql, function (error, data) {
                if (error) return cb(error);

                cb(null, data.count)
            });
        },
    }, function (error, reply) {
        if (error) {
            result.error(next, error.toString(), msg)
        }
        let results = {};
        results.hasCallTPOrderList = reply.hasCallTPOrderList;
        results.totalPage = Math.ceil(reply.hasCallTPOrderCount / msg.page_size) || 1;
        results.curPage = msg.page_index;
        results.sizePage = msg.page_size;
        result.success(next, results);
    });
};

/***
 * 获取当天堂食+外带的 没有叫号的 and 已经叫号的
 * @param msg
 * @param session
 * @param next
 */
handler.waitCallTPAndhasCallTPOrderCount = function (msg, session, next) {

    async.parallel({
        //没有叫号的
        waitCallTPOrderCount: function (done) {
            var sql = "SELECT count(*) count from tb_order where distribution_mode_id in(1,3) and (parent_order_id =''  or parent_order_id is null) and order_state not in (1,9) and production_status in (1,2) and accounting_time=strftime('%Y-%m-%d', datetime('now','localtime')) order by create_time desc";
            customSqlModel.getOneCustomSqlInfo(sql, function (error, count) {
                if (error) return done(error);
                done(null, count)
            })
        },
        //已经叫号的
        hasCallTPOrderCount: function (done) {
            var sql = "SELECT count(*) count from tb_order where distribution_mode_id in (1,3) and (parent_order_id =''  or parent_order_id is null) and order_state not in (1,9) and production_status = 3 and accounting_time=strftime('%Y-%m-%d', datetime('now','localtime')) order by create_time desc";
            customSqlModel.getOneCustomSqlInfo(sql, function (error, count) {
                if (error) return done(error);
                done(null, count)
            })
        },
    }, function (error, resultData) {
        if (error) return result.error(next, error.toString(), msg)
        resultData.waitCallTPOrderCount = resultData.waitCallTPOrderCount.count;
        resultData.hasCallTPOrderCount = resultData.hasCallTPOrderCount.count;
        result.success(next, resultData);
    })
};

/***
 * 根据订单查询
 * @param msg
 * @param session
 * @param next
 */
handler.selectByOrderId = function (msg, session, next) {
    let sql = `select * from tb_order where id = '${msg.orderId}' `;
    customSqlModel.getOneCustomSqlInfo(sql, function (error, data) {
        if (error) {
            result.error(next, error.toString(), msg)
        }
        result.success(next, data);
    })
}

/**
 * 获取 当天 已叫号的订单 （电视叫号）
 * @param msg
 * @param session
 * @param next
 */
handler.hasCallOrderList = function (msg, session, next) {

    let distributionMode = msg.distributionMode || 1;
    let time = `${moment().format('x')}` - 5 * 60 * 1000;
    let sql = `SELECT id,table_number,amount_with_children,order_money,create_time,customer_count,ver_code,
    order_state,production_status,pay_mode,call_times, serial_number 
    from tb_order where distribution_mode_id = ${distributionMode} and (parent_order_id =''  or parent_order_id is null) 
    and order_state not in (1,9) and production_status = 3 and accounting_time=strftime('%Y-%m-%d', datetime('now','localtime')) 
    and create_time >=${time}
    order by create_time desc`;
    customSqlModel.getAllCustomSqlInfo(sql, function (error, data) {
        result.success(next, data);
    });
};

/**
 * 获当天所有未叫号的订单  （电视叫号，包含堂食和外带）
 * @param msg
 * @param session
 * @param next
 */
handler.waitCallAllOrderList = function (msg, session, next) {

    var sql = `SELECT id,table_number,amount_with_children,order_money,create_time,customer_count,ver_code,order_state,production_status,pay_mode,call_times 
    from tb_order where (parent_order_id =''  or parent_order_id is null) 
    and order_state not in (1,9) and production_status = 2 and accounting_time=strftime('%Y-%m-%d', datetime('now','localtime')) 
    order by create_time asc`;

    customSqlModel.getAllCustomSqlInfo(sql, function (error, data) {
        if (error) return result.error(next, error.toString(), msg)
        result.success(next, data);
    });
};



handler.countAndMoneyAmount = function (msg, session, next) { // TODO:
    var sql = `SELECT count(id) orderAmount, sum( 
        case when amount_with_children > 0  then amount_with_children 
        else order_money end 
        ) orderMoneyAmount from tb_order where 
            order_state in (2,10,11) 
            and production_status != 6 
            and (parent_order_id =''  or parent_order_id is null) 
            and accounting_time=strftime('%Y-%m-%d', datetime('now','localtime'));`;
    customSqlModel.getOneCustomSqlInfo(sql, function (error, data) {
        if (error) {
            result.error(next, error.toString(), msg)
        }

        result.success(next, data)
    })
};

/**
 * 取消订单
 * @param msg
 * @param session
 * @param next
 */
handler.cancelOrder = function (msg, session, next) {

    var orderId = msg.orderId;
    if (result.isEmpty(orderId)) return result.error(next, "请输入订单ID", msg);
    async.waterfall([
        function (cb) { //基础验证
            let sql = `SELECT  *  FROM tb_order WHERE id = '${orderId}'`;
            customSqlModel.getOneCustomSqlInfo(sql, function (error, orderInfo) {
                if (error || !orderInfo) {
                    return cb(error.toString() || "取消订单失败，订单不存在！");
                }
                if (orderInfo.order_state == 2 || orderInfo.order_state == 10) {
                    return cb("取消订单失败，订单已完成支付");
                }
                cb(null, orderInfo);
            });
        },
        function (orderInfo, cb) {
            orderModel.upsert({
                id: orderInfo.id,
                orderState: orderState.CANCEL,
            }, function (error) {
                if (error) return cb(error);
                if (orderInfo.parent_order_id) {
                    let parent_order_id = orderInfo.parent_order_id;
                    let sql = `SELECT  (SELECT sum(order_money)  FROM tb_order WHERE id = '${parent_order_id}' or
                    (parent_order_id= '${parent_order_id}' and order_state = 2)) receipts , * FROM tb_order WHERE  id = '${parent_order_id}'`;
                    customSqlModel.getOneCustomSqlInfo(sql, function (error, parentOrder) {
                        if (error) return cb(error);
                        orderModel.upsert({
                            id: parentOrder.id,
                            amountWithChildren: parentOrder.amount_with_children - orderInfo.order_money,
                            countWithChild: parentOrder.count_with_child - orderInfo.article_count
                        }, function (error) {
                            if (error) return cb(error);
                            cb(null, orderInfo, parentOrder);
                        })
                    })
                } else {
                    cb(null, orderInfo, null);
                }
            })
        },
        function (orderInfo, parentOrder, cb) {
            shopDetailMode.getCustomShopDetailInfo('', function (error, shopInfo) {
                if (shopInfo.allow_first_pay == 0) {  //  先付
                    customSqlModel.getAllCustomSqlInfo(`update tb_table_qrcode set table_state = 0 where table_number = ${orderInfo.table_number}`, function (error) {
                        if (error) return cb(error);
                        cb(null, orderInfo);
                    })
                } else if (shopInfo.allow_after_pay == 0) {    //  后付
                    if (parentOrder && parentOrder.id) {
                        //  如果主订单未支付，则不释放
                        if (parentOrder.order_state == orderState.NO_PAY) {
                            cb(null, orderInfo);
                        } else {
                            customSqlModel.getAllCustomSqlInfo(`update tb_table_qrcode set table_state = 0 where table_number = ${orderInfo.table_number}`, function (error) {
                                if (error) return cb(error);
                                cb(null, orderInfo);
                            })
                        }
                    } else {
                        //  如果是主订单，则释放桌位
                        customSqlModel.getAllCustomSqlInfo(`update tb_table_qrcode set table_state = 0 where table_number = ${orderInfo.table_number}`, function (error) {
                            if (error) return cb(error);
                            cb(null, orderInfo);
                        })
                    }
                }
            });
        },
        function (orderInfo, cb) { //恢复库存
            let sql = `select article_id, count,type from tb_order_item where order_id = '${orderId}';`;
            customSqlModel.getAllCustomSqlInfo(sql, function (error, orderItemsInfo) {
                async.eachLimit(orderItemsInfo, 1, (orderItem, e_cb) => {
                    if (orderItem.type === orderItemType.SETMEALS) return e_cb();
                    let articleId = orderItem.article_id;
                    let articelPriceId;
                    if (articleId.indexOf('@') >= 0) {
                        articelPriceId = articleId; // 老规格子项ID
                        articleId = orderItem.article_id.split('@')[0]; // 老规格主项ID
                    }
                    let sql = `UPDATE tb_article SET current_working_stock = current_working_stock + ${orderItem.count} WHERE id = '${articleId}'`;
                    customSqlModel.getAllCustomSqlInfo(sql, (err, reply) => {
                        if (err) {
                            return e_cb(err, null);
                        } else if (orderItem.type === orderItemType.UNITPRICE) { //老规格 加子项
                            let sql = `UPDATE tb_article_price SET current_working_stock = current_working_stock + ${orderItem.count} WHERE id = '${articelPriceId}'`;
                            customSqlModel.getAllCustomSqlInfo(sql, (err, reply) => {
                                return e_cb(err, null);
                            });
                        } else {
                            return e_cb(err, null);
                        }
                    });
                }, (error) => {
                    if (error) return cb(error);
                    cb(null, orderInfo);
                })

            })
        }
    ], function (err) {
        if (err) {
            fileUtil.appendFile(`orderLogs`, `${msg.__route__}=>【取消订单】失败；orderId：${orderId},\n,${JSON.stringify(msg)}`);
            result.error(next, err.toString(), msg);
        } else {
            fileUtil.appendFile(`orderLogs`, `${msg.__route__}=>【取消订单】成功；orderId：${orderId},\n,${JSON.stringify(msg)}`);
            result.success(next);
            fileUtil.appendFile('orderLogs', `【取消订单】成功；orderId：${orderId},\n,${JSON.stringify(msg)}`);
        }
    });
}


/**
 * 获取订单备注
 * @param msg
 * @param session
 * @param next
 */
handler.orderRemarkList = function (msg, session, next) {

    customSqlModel.getAllCustomSqlInfo(`select * from tb_order_remark ORDER BY sort ASC`, function (error, data) {
        if (error) {
            return result.error(next, error.toString(), msg);
        }
        result.success(next, data);
    })
}

/**
 * 获取   取消订单备注
 * @param msg
 * @param session
 * @param next
 */
handler.getRemarks = function(msg, sesssion, next) {
    let type = msg.type || 1
    console.log("==================", msg)
    customSqlModel.getAllCustomSqlInfo(`SELECT * FROM tb_refund_remark WHERE type = '${type}' AND state = '1' ORDER BY sort ASC`, function (error, data) {
        if (error)   return result.success(next, {
                                 data: data,
                                 message: "查询出错"
                            })
        result.success(next, data);
    })
}

handler.getRefundRemarkList = function (msg, session, next) {
    customSqlModel.getAllCustomSqlInfo(`select * from tb_refund_remark WHERE type = 1 ORDER BY sort ASC`, function (error, data) {
        if (error) {
            result.error(next, error.toString(), msg);
            return
        }
        result.success(next, data);
    })
};

/**s
 * 更新订单同步状态
 * @param msg
 * @param session
 * @param next
 */
handler.updateOrderSyncState = function (msg, session, next) {
    if (msg.orderId) {
        var order = {
            // id: msg.orderId,
            syncState: 1,
            lastSyncTime: dateUtil.timestamp()
        };
        orderModel.updateById(msg.orderId, order, function (err, reply) {
            result.success(next);
        });
    }
};

/**
 * 获取 所有未同步的订单 id 数组
 * @param msg
 * @param session
 * @param next
 */
handler.getNotSyncOrderIds = function (msg, session, next) {
    var sql = "SELECT id from tb_order where sync_state = 0 and (parent_order_id =''  or parent_order_id is null) order by create_time DESC";
    customSqlModel.getAllCustomSqlInfo(sql, function (error, orderIds) {
        if (error) {
            result.error(next, error.toString(), msg);
        } else {
            result.success(next, orderIds);
        }
    });
};

/**
 * 获取 订单完整信息 包含 自订单  用于同步数据
 * @param msg
 * @param session
 * @param next
 */
handler.getOrderFullInfoWithChildren = function (msg, session, next) {
    var orderId = msg.orderId;
    if (result.isEmpty(orderId)) {
        return result.error(next, '缺少orderId', msg);
    }
    getOrderFullInfo(orderId, function (error, order) {
        let sql = "select * from tb_shop_detail";
        customSqlModel.getAllCustomSqlInfo(sql, function (error, shopInfo) {
            //  如果 自动确认时间  已到，则自动更改为 确认状态
            if (parseInt(dateUtil.timestamp() - order.createTime / (1000)) >= shopInfo.auto_confirm_time) {
                order.orderState = orderState.CONFIRM;
                order.allowAppraise = 1;
                order.allowCancel = 0;
                order.allowContinueOrder = 0;
                order.confirmTime = dateUtil.timestamp();
                // todo 更新本地状态
            }
            var childrenOrders = [];
            sql = `SELECT * from tb_order where parent_order_id = '${orderId}'`;
            customSqlModel.getAllCustomSqlInfo(sql, function (error, childrenIds) {
                async.eachLimit(childrenIds, 1, function (item, cb) {
                    getOrderFullInfo(item.id, function (error, childrenOrder) {
                        if (childrenOrder) {
                            childrenOrders.push(childrenOrder);
                        }
                        cb();
                    });
                }, function (err) {
                    if (err) return result.error(next, err.toString(), msg);
                    order.childrenOrders = childrenOrders;
                    result.success(next, order);
                });
            });
        });
    });
};

/**
 * 获取 订单完整 信息 用于同步数据
 * @param msg
 * @param session
 * @param next
 */
handler.getOrderFullInfo = function (msg, session, next) {
    var orderId = msg.orderId;
    if (result.isEmpty(orderId)) {
        result.error(next, '缺少 orderId', msg);
        return;
    }
    getOrderFullInfo(orderId, function (error, order) {
        if (error) {
            result.error(next, error.toString(), msg);
        } else {
            result.success(next, order);
        }
    });
};

var getOrderFullInfo = function (orderId, cb) {
    async.waterfall([
        function (cb) { //订单信息
            let sql = `SELECT  (SELECT sum(order_money)  
                        FROM tb_order WHERE id = '${orderId}' or ( parent_order_id= '${orderId}' and order_state = 2)) receipts, * FROM tb_order WHERE  id = '${orderId}'`;
            customSqlModel.getOneCustomSqlInfo(sql, function (error, order) {
                if (order && order.id) {
                    cb(null, generalUtil.convertHumpName(order));
                } else {
                    cb(error || "订单不存在");
                }
            });
        }, function (order, cb) { // 订单项
            let sql = `SELECT * from tb_order_item where order_id = '${orderId}'  ORDER BY type DESC`;
            customSqlModel.getAllCustomSqlInfo(sql, function (error, orderItemList) {
                if (error) {
                    cb(error);
                } else {
                    var list = [];
                    for (var item of orderItemList) {
                        list.push(generalUtil.convertHumpName(item));
                    }
                    order.orderItem = list;
                    cb(null, order);
                }
            });
        },
        function (order, cb) { //   订单支付项
            var sql = `SELECT * from tb_order_payment_item where order_id = '${orderId}'`;
            customSqlModel.getAllCustomSqlInfo(sql, function (error, orderPaymentItemList) {
                if (error) {
                    cb(error);
                } else {
                    var list = [];
                    for (var item of orderPaymentItemList) {
                        list.push(generalUtil.convertHumpName(item));
                    }
                    order.orderPayment = list;
                    cb(null, order);
                }
            });
        },
        function (order, cb) { //   订单退菜备注
            let sql = `select * from tb_order_refund_remark where order_id = '${orderId}'`;
            customSqlModel.getAllCustomSqlInfo(sql, function (error, orderRefundRemarkList) {
                if (error) {
                    cb(error);
                } else {
                    var list = [];
                    for (var item of orderRefundRemarkList) {
                        delete item.id; // 移除 id 字段，此字段服务器会自动生成自增数据，避免重复
                        list.push(generalUtil.convertHumpName(item));
                    }
                    order.orderRefundRemarks = list;
                    cb(null, order);
                }
            });
        }
    ], function (error, order) { // final
        cb(error, order);
    });
};


/**
 * 结店推送
 * @param msg
 * @param session
 * @param next
 */

handler.closeBusiness = function (msg, session, next) {
    var time = dateUtil.sdfDay();

    async.parallel({
        //订单总数据
        orderDataOverView: function (done) {
            let sql = `SELECT count(id) orderCount, sum(customer_count) customerAllCount,sum(order_money) orderAllMoney 
                    FROM tb_order WHERE accounting_time = '${time}' AND distribution_mode_id in(1,3) AND order_state in (2,10,11) AND production_status != 6`;
            customSqlModel.getOneCustomSqlInfo(sql, function (err, orderOverView) {
                if (err) result.error(next, err.toString(), msg);
                done(null, orderOverView)
            });
        },
        //订餐源
        orderOrderingSource: function (done) {
            let sql = `SELECT distribution_mode_id payModeId,SUM(order_money) orderMoney,SUM(order_pos_discount_money) 
                        orderPosDiscountMoney,SUM(member_discount_money) memberDiscountMoney, 
                        COUNT(CASE WHEN (parent_order_id =''  or parent_order_id is null) THEN 1 END) orderCount 
                        FROM tb_order  WHERE distribution_mode_id in(1,3) AND accounting_time = '${time}' 
                        AND order_state in (2,10,11) and production_status != 6 GROUP BY distribution_mode_id`;
            customSqlModel.getAllCustomSqlInfo(sql, function (err, orderingSource) {
                if (err) result.error(next, err.toString(), msg);
                var obj = {};
                orderingSource.map(function (item) {
                    if (item.payModeId == 1) {
                        obj.eatIn = { orderCount: item.orderCount, orderMoney: item.orderMoney };

                    } else {
                        obj.eatOut = {
                            orderCount: item.orderCount,
                            orderMoney: item.orderMoney
                        };
                    }
                });
                done(null, obj)
            });
        },
        //支付源
        orderPaymentSource: function (done) {
            let sql = `SELECT is_pos_pay isPosPay, Count(CASE WHEN (parent_order_id =''  or parent_order_id is null) 
                THEN 1 END) orderCount, SUM(order_money) orderMoney 
                FROM tb_order WHERE accounting_time = '${time}' AND distribution_mode_id IN(1,3)
                 AND order_state in(2,10,11) and production_status !=6 GROUP BY is_pos_pay`;
            customSqlModel.getAllCustomSqlInfo(sql, function (err, paymentSource) {
                if (err) result.error(next, err.toString(), msg);
                var obj = {};
                paymentSource.map(function (item) {
                    if (item.customerId == "isPos") {
                        obj.pos = {
                            orderCount: item.orderCount,
                            orderMoney: item.orderMoney
                        };
                    } else {
                        obj.weChat = {
                            orderCount: item.orderCount,
                            orderMoney: item.orderMoney
                        };
                    }
                });
                done(null, obj)
            });
        },
        //支付明细
        orderPaymentDetailed: function (done) {
            var paymentTime = Date.parse(time).toString();
            var sql = `SELECT payment_mode_id payModeId,sum(pay_value) payValue 
                FROM (SELECT payment_mode_id, pay_value, order_state, production_status,pay_time 
                        FROM tb_order_payment_item as p LEFT JOIN tb_order o on p.order_id = o.id) 
                        WHERE pay_time >= '${paymentTime}' AND payment_mode_id in (1,10,5,6,12,16,2,3,7,8,11,17,19)
                         AND order_state != 9 and production_status != 6 GROUP BY payment_mode_id`;
            customSqlModel.getAllCustomSqlInfo(sql, function (err, paymentDetailed) {
                if (err) result.error(next, err.toString(), msg);
                done(null, paymentDetailed || [])
            });
        },
    }, function (error, results) {

        if (error) return result.error(next, error.toString(), msg);

        result.success(next, results);
    });

};

/**
 * 叫号
 * @param msg
 * @param session
 * @param next
 */
handler.callNumber = function (msg, session, next) {
    let orderId = msg.orderId;
    if (result.isEmpty(orderId)) {
        result.error(next, "订单ID不能为空!", msg);
        return;
    }
    var sql = `SELECT  (SELECT sum(order_money)  
                    FROM tb_order WHERE id = '${orderId}' or ( parent_order_id= '${orderId}' and order_state = 2)) receipts, 
                        * FROM tb_order WHERE  id = '${orderId}'`;
    customSqlModel.getOneCustomSqlInfo(sql, function (error, orderInfo) {
        if (error) {
            return result.error(next, "订单 ID 不存在！", msg);
        }
        let param = {
            id: orderId,
            call_times: ++orderInfo.call_times
        };
        if (orderInfo.production_status == (productionStatus.HAS_PRINT || productionStatus.PUSH_ORDER)) {
            param.production_status = productionStatus.HAS_CALL;
            param.call_number_time = dateUtil.timestamp();
        }
        customSqlModel.updateSelective('tb_order', param, function (error) {
            if (error) {
                result.error(next, error.toString(), msg);
            } else {
                result.success(next);
            }
        })
    });
};

/**
 * 根据 订单流水号 查询订单项
 * @param msg
 * @param session
 * @param next
 */
handler.getOrderItemsBySerialNumber = function (msg, session, next) {
    let serialNumber = msg.serialNumber;
    if (result.isEmpty(serialNumber)) {
        return result.error(next, error.toString() || "查询订单项失败：请输入订单流水号!", msg);
    }
    var sql = `select * from tb_order where serial_number like  '%${serialNumber}%' and  accounting_time=strftime('%Y-%m-%d', datetime('now','localtime'))`;
    customSqlModel.getOneCustomSqlInfo(sql, function (error, orderInfo) {
        if (error || !orderInfo) {
            return result.error(next, (error || "查询订单项失败：订单流水号不存在！" + serialNumber).toString(), msg);
        }
        var sql = `SELECT * from tb_order_item where order_id = '${orderInfo.id}'  ORDER BY type DESC`;
        customSqlModel.getAllCustomSqlInfo(sql, function (error, orderItemList) {
            if (error) {
                return result.error(next, error.toString(), msg);
            }
            let resultData = {
                verCode: orderInfo.ver_code,
                orderId: orderInfo.id,
                orderItemList: orderItemList
            };
            return result.success(next, resultData);
        })
    })

};


/**
 * 获取所有未打印的订单
 * @param msg
 * @param session
 * @param next
 */
handler.getNotPrintOrderList = function (msg, session, next) {
    let sql = "select * from tb_shop_detail ";
    customSqlModel.getOneCustomSqlInfo(sql, function (error, shopDetail) {
        let isFirstPay = true;
        if (shopDetail.shop_mode == shopMode.BOSS_ORDER && shopDetail.allow_after_pay == 0) {
            isFirstPay = false;
        }
        let orderState = [9];
        if (isFirstPay) {
            orderState.push(1);
        }
        sql = `SELECT o.*, c.telephone from tb_order o LEFT JOIN tb_customer c on o.customer_id = c.id 
                    where o.order_state not in(${orderState.toString()}) and o.production_status = 1
                    AND accounting_time = date() ORDER BY o.create_time DESC`;
        customSqlModel.getAllCustomSqlInfo(sql, function (error, orderList) {
            if (error) {
                return result.error(next, error.toString(), msg);
            }
            return result.success(next, orderList);
        })
    });
}


/**
 * 修复异常订单（将未打印订单改为 已打印）
 * @param msg
 * @param session
 * @param next
 */
handler.fixAllOrder = function (msg, session, next) {
    let orderList = msg.orderList || [];
    async.eachLimit(orderList, 1, function (order, callback) {
        var updateOrder = {
            id: order.id,
            print_order_time: dateUtil.timestamp(),
            allow_cancel: 0,
            production_status: productionStatus.HAS_PRINT
        };
        customSqlModel.updateSelective('tb_order', updateOrder, function (error) {
            if (error) {
                return callback(error);
            }
            fileUtil.appendFile('orderLogs', `【修复订单状态】orderId：${order.id},\n,原始数据：${JSON.stringify(order)}\n修改后的数据：${JSON.stringify(updateOrder)}`);
            callback();
        });
    }, function (error) {
        if (error) {
            return result.error(next, "修复订单失败：" + error.toString());
        }
        result.success(next);
    });
};


/**
 * 查询订单是否进行过折扣操作，包含子订单的
 * @param msg
 * @param session
 * @param next
 */
handler.selectOrderDiscount = function (msg, session, next) {
    if (generalUtil.isEmpty(msg.orderId)) {
        return result.error(next, "查询订单折扣失败，请输入订单ID！");
    }
    orderModel.selectOrderDiscount(msg.orderId, function (error, data) {
        if (error) {
            return result.error(next, "查询订单折扣失败：" + error.toString());
        }
        result.success(next, data);
    });
};

/**
 * 删除订单关联项
 * @param msg
 * @param session
 * @param next
 */
handler.deleteOrderRelationInfo = function (msg, session, next) {
    let orderId = msg.orderId || "";
    async.waterfall([
        function (cb) { //  delete tb_order
            orderModel.deleteById(orderId, function (error) {
                cb(error || null);
            });
        },
        function (cb) { //  delete tb_order_item
            orderItemModel.deleteByConditions({ orderId: orderId }, function (error) {
                cb(error || null);
            });
        },
        function (cb) { //  delete tb_order_payment_item
            orderPaymentItemModel.deleteByConditions({ orderId: orderId }, function (error) {
                cb(error || null);
            });
        },
    ], function (error) {
        if (error) {
            log("打印订单", `手动打印异常订单失败 ${orderId} ，${error}`);
            return result.error(next, error);
        }
        result.success(next);
    });
};

/**
 * 未支付订单加菜
 * @param msg
 * @param session
 * @param next
 */
handler.addOrderItemToOrder = function (msg, session, next) {
    if (generalUtil.isEmpty(msg.orderId)) {
        return result.error(next, "请输入订单ID！");
    }
    let updateData = [];
    let orderId = msg.orderId;
    async.auto({
        // 0、获取店铺信息
        getShopDetail: function (cb) {
            shopDetailModel.getCustomShopDetailInfo('', function (error, shopDetail) {
                if (error || !shopDetail) return cb(error);
                cb(null, shopDetail);
            });
        },
        checkOrder: function (cb) { // 1、检测订单
            orderModel.findOneInfoById(orderId, (err, orderInfo) => {
                if (!orderInfo) {
                    return cb('订单不存在');
                } else if (orderInfo.orderState === orderState.HAS_PAY) {
                    return cb('订单已经支付,无法加菜');
                } else if (orderInfo.orderState === orderState.CANCEL) {
                    return cb('订单已经取消,无法加菜');
                } else {
                    return cb(err, orderInfo);
                }
            });
        },
        checkArticle: function (cb) { // 2、检查库存
            let orderItems = [];
            for (let i = 0; i < msg.orderItems.length; i++) {
                orderItems.push(msg.orderItems[i])
                if (msg.orderItems[i].mealItems) {
                    for (let j = 0; j < msg.orderItems[i].mealItems.length; j++) { // 套餐子品
                        msg.orderItems[i].mealItems[j].id = msg.orderItems[i].mealItems[j].articleId;
                        msg.orderItems[i].mealItems[j].type = 4;
                        msg.orderItems[i].mealItems[j].mealFeeNumber = 0;
                        msg.orderItems[i].mealItems[j].parent_id = msg.orderItems[i].id;
                        orderItems.push(msg.orderItems[i].mealItems[j]);
                    }
                }
            }
            async.eachLimit(orderItems, 1, (orderItem, e_cb) => {
                if (orderItem.type == 1 || orderItem.type == 3 || orderItem.type == 4 || orderItem.type == 5 || orderItem.type == 8) { //单品 套餐 套餐子项 新规格 重量包
                    let sql = `SELECT current_working_stock from tb_article WHERE id = '${orderItem.id}'`;
                    customSqlModel.getOneCustomSqlInfo(sql, (err, stockInfo) => {
                        if (stockInfo.current_working_stock < orderItem.count) {
                            return e_cb(orderItem.name + " 库存不足 最多可购买：" + stockInfo.current_working_stock + " 份");
                        }
                        if (orderItem.type === 4) { // 套餐获取 mealItemId (tb_meal_item)
                            sql = `SELECT id from tb_meal_item WHERE article_id = '${orderItem.id}'`;
                            customSqlModel.getOneCustomSqlInfo(sql, (err, mealItemInfo) => {
                                orderItem.mealItemId = mealItemInfo.id;
                                return e_cb(err, null);
                            });
                        } else {
                            return e_cb(err, null);
                        }
                    });
                } else if (orderItem.type == 2) { //老规格 老规格只检查子项
                    let sql = `SELECT current_working_stock from tb_article_price WHERE id = '${orderItem.article_prices_id}'`;
                    customSqlModel.getOneCustomSqlInfo(sql, (err, stockInfo) => {
                        if (stockInfo.current_working_stock < orderItem.count) {
                            return e_cb(orderItem.name + " 库存不足 最多可购买：" + stockInfo.current_working_stock + " 份");
                        }
                        return e_cb(err, null);
                    });
                }
            }, function (err) {
                cb(err, orderItems);
            })
        },
        subtractArticle: ['getShopDetail', 'checkOrder', 'checkArticle', function (reply, cb) { // 3、减库存
            let orderItems = reply.checkArticle;
            async.eachLimit(orderItems, 1, (orderItem, e_cb) => {
                let sql = `UPDATE tb_article SET current_working_stock = current_working_stock - ${orderItem.count} WHERE id = '${orderItem.id}'`;
                customSqlModel.getAllCustomSqlInfo(sql, (err, reply) => {
                    if (err) {
                        return e_cb(err, null);
                    } else if (orderItem.article_prices_id) { //老规格 减子项
                        let sql = `UPDATE tb_article_price SET current_working_stock = current_working_stock - ${orderItem.count} WHERE id = '${orderItem.article_prices_id}'`;
                        customSqlModel.getAllCustomSqlInfo(sql, (err, reply) => {
                            return e_cb(err, null);
                        });
                    } else {
                        return e_cb(err, null);
                    }
                });
            }, function (err) {
                cb(err, orderItems);
            })
        }],
        insertOrderItems: ['subtractArticle', function (reply, cb) { // 4、记录菜品项
            let orderItems = reply.checkArticle;
            let orderItemUpdate = { orderItem: [] };
            async.eachLimit(orderItems, 1, (orderItem, e_cb) => {
                let content = {
                    id: generalUtil.randomUUID(),
                    orderId: orderId,
                    articleId: orderItem.id,
                    articleName: orderItem.name,
                    count: orderItem.count,
                    originalPrice: orderItem.fansPrice ? orderItem.fansPrice / orderItem.count : orderItem.price / orderItem.count,
                    unitPrice: orderItem.fansPrice ? orderItem.fansPrice / orderItem.count : orderItem.price / orderItem.count,
                    finalPrice: orderItem.fansPrice || orderItem.price,
                    type: orderItem.type,
                    orginCount: orderItem.count,
                    refundCount: 0,
                    mealFeeNumber: orderItem.mealFeeNumber,
                    printFailFlag: 0,
                    sort: orderItem.sort || 0,
                    status: 1,
                    remark: orderItem.remark || "100%",
                    createTime: (new Date()).getTime(),
                    parentId: orderItem.parent_id,
                    mealItemId: orderItem.mealItemId || 0,
                    kitchenId: orderItem.kitchen_id || '',
                    recommendId: orderItem.recommend_id || '',
                    changeCount: orderItem.change_count || 0,
                    weight: orderItem.weight || 0,
                    needRemind: orderItem.needRemind || 0,
                };
                orderItemUpdate.orderItem.push(content);
                orderItemMode.save(content, function (err, reply) {
                    if (err) {
                        return e_cb(err);
                    }
                    e_cb(err);
                });
            }, function (err) {
                updateData.push(orderItemUpdate);
                cb(err, orderItems);
            })
        }],
        updateOrder: ['insertOrderItems', function (reply, cb) { // 5、计算和更新 当前订单金额
            let shopDetail = reply.getShopDetail;
            let orderInfo = reply.checkOrder;
            let sql = `select sum(final_price) sumPrice, sum(meal_fee_number) mealNumberSum FROM tb_order_item where order_id = '${orderId}' and refund_count < orgin_count;`
            customSqlModel.getOneCustomSqlInfo(sql, (err, reply) => {
                let _order = {
                    id: orderId,
                    orderMoney: reply.sumPrice + orderInfo.servicePrice + reply.mealNumberSum * shopDetail.meal_fee_price,
                    paymentAmount: reply.sumPrice + orderInfo.servicePrice + reply.mealNumberSum * shopDetail.meal_fee_price,
                    mealAllNumber: reply.mealNumberSum,
                    mealFeePrice: reply.mealNumberSum * shopDetail.meal_fee_price,
                    originalAmount: reply.sumPrice
                };
                updateData.push({ order: [_order] });
                orderModel.updateById(orderId, _order, (err, reply) => {
                    return cb(err, null);
                })
            });
        }],
        updateMainOrder: ['updateServiceAndMealPrice', function (reply, cb) { // 6、计算和更新 主订单金额
            let orderInfo = reply.checkOrder;
            let mainOrderId = orderInfo.parentOrderId || orderInfo.id;
            let sql = `select count(id) count, sum(order_money) sumOrderMoney,service_price,meal_fee_price FROM tb_order where (id = '${mainOrderId}' or parent_order_id = '${mainOrderId}')  and order_state != ${orderState.CANCEL} `;
            customSqlModel.getOneCustomSqlInfo(sql, (err, reply) => {
                let _order = {
                    id: mainOrderId,
                    amountWithChildren: reply.count > 1 ? reply.sumOrderMoney + reply.service_price + reply.meal_fee_price : 0
                }
                updateData.push({ order: [_order] });
                orderModel.updateById(mainOrderId, _order, (err, reply) => {
                    return cb(err, null);
                })
            });
        }]
    }, function (err, resData) {
        if (err) {
            return result.error(next, err.toString(), msg);
        }
        webSocketClient.syncUpdateData(JSON.stringify(updateData), null,(err,data)=>{
            synUpdateDataCb(msg, data)
        })
        result.success(next);
    });
};

/**
 * @desc 对一些操作进行校验
 * @type null 是否正在买单 false 买单中
 * @type 1 没有进行买单
 */


handler.verificationOfOrders = function (msg, session, next) {
    let orderId = msg.orderId || '';
    let type = msg.type || ''
    requestUtil.post('verificationOfOrders', { orderId: orderId, type: type}, (err, data) => {
        if (err) {
            fileUtil.appendFile('orderLogs', `【加菜时校验】校验失败:\n ${JSON.stringify(err)}`);
            return result.error(next, error.toString())
        }
        fileUtil.appendFile('orderLogs', `【加菜时校验】校验成功，请求值：${JSON.stringify(msg)}\n, 返回值：${JSON.stringify(err)}`);
        result.success(next, data);
    });
}

/**
 * 根据订单id查询菜品项 包括子订单
 *
 */
handler.getOrderItemlistByOrderId = function (msg, session, next) {
    var orderId = msg.orderId;

    if (result.isEmpty(orderId)) return result.error(next, "订单ID不能空", msg);

    async.waterfall([
        function (cb) {
            let sql = `SELECT  (SELECT sum(order_money)  FROM tb_order WHERE id = '${orderId}' or ( parent_order_id= '${orderId}' and order_state = 2)) receipts, * FROM tb_order WHERE  id = '${orderId}'`;
            customSqlModel.getOneCustomSqlInfo(sql, function (error, order) {
                if (error) return cb(error.toString());
                if (order == null) return result.success(next);
                //打印指令发出时 更新production_status的状态
                order.payOrderMoney = order.order_state == 1 ? order.order_money : 0;
                customSqlModel.getAllCustomSqlInfo(`SELECT * from tb_order_item where order_id = '${orderId}'  ORDER BY type DESC`, function (error, orderItems) {
                    if (error) return cb(error.toString());
                    order.order_item_list = orderItems || [];
                    cb(null, order);

                });
            });
        },
        function (order, cb) {
            //只查询未支付订单总金额
            customSqlModel.getOneCustomSqlInfo(`select sum(order_money) orderMoney from tb_order where parent_order_id ='${orderId}' and order_state=1`, function (error, childOrder) {
                if (error) return cb(error.toString());
                order.payOrderMoney += childOrder.orderMoney;
                order.order_money = order.receipts;
                let sql = "select * from tb_shop_detail";
                customSqlModel.getOneCustomSqlInfo(sql, function (error, shopDetail) {
                    // 如果是先付 只查询已经支付的菜品 allow_first_pay:0 allow_after_pay:1
                    let first_pay_status = '';
                    if (!shopDetail.allow_first_pay) {
                        first_pay_status = `and order_state = 2`;
                    }
                    let sql = `select * from tb_order_item where order_id in(select id from tb_order where parent_order_id= '${orderId}' and order_state != 9 ) ORDER BY type DESC`;
                    customSqlModel.getAllCustomSqlInfo(`${sql}`, function (error, childrenOrderItems) {
                        if (error) return cb(error.toString());
                        order.childreorder_item_list = childrenOrderItems || [];
                        cb(null, order);
                    });
                });
            });
        }
    ], function (err, order) {
        if (err) {
            return result.error(next, err.toString(), msg);
        } else {
            result.success(next, order);
        }
    });
}


/**
 * 查询所有的打印机
 */
handler.getAllPrint = function (msg, session, next) {
    customSqlModel.getAllCustomSqlInfo('SELECT * FROM tb_kitchen', function (error, kitchenList) {
        if (error) result.error(next, error.toString());
        result.success(next, kitchenList)
    })
}

/**
 *  开启多动线厨房组
 */
handler.updateKitchenStatus = function (msg, session, next) {
       var kitchenId = msg.kitchenId;
       var kitchenInfo = {};
       kitchenInfo.status = msg.status;
        kitchenModel.updateById(kitchenId, kitchenInfo, (error, reply) => {
            // if (err) result.error(next, error.toString());
            result.success(next)
        })
}

/***
 *  查询与服务器连接的 WebSocket 是否在线
 */
handler.websocketOnline = function (msg, session, next) {
    var websocktOpen = webSocketClient.client.webSocketOpen;
    result.success(next, websocktOpen)
}
/**
 *  根据订单 ID 修改订单信息
 *  @msg Object
 *  @session
 */
handler.syncOrderInfoById = function (msg, session, next) {
    let orderId = msg.orderId || '';
    let orderInfo = {
        syncState: msg.syncState,
        lastSyncTime : msg.lastSyncTime
    }
    orderModel.updateById(orderId, orderInfo, (err, reply) => {
        if(err) result.success(next, err.toString());
        result.success(next, reply)
    })
}

handler.syncAllOrderById = function (msg, session, next) {
    async.waterfall([function(cb){
        let sql = `select id FROM tb_order WHERE id = '${msg.orderId}' or parent_order_id = '${msg.orderId}'`;
        customSqlModel.getAllCustomSqlInfo(sql, (err, orderIdList) => {
            if(err) return cb(err)
            return cb(null, orderIdList)
        })
    }, function(orderIdList, cb){
        let syncOrderInfo = {
            syncState: 0,
            lastSyncTime: (new Date()).getTime()
        }
        async.eachLimit(orderIdList, 1, function (orderId,m_cb) {
            orderModel.updateById(orderId.id, syncOrderInfo, (err, reply) => {
               if (err) return cb(err)
                m_cb(null)
            })
        })
        fileUtil.appendFile(`orderLogs`, `【本地订单同步】`, syncOrderInfo)
        return result.success(next, null)
    },err=>{
        result.success(err.toString())
    }])
}



/**
 * 查询未同步订单
 */
handler.getLeftSyncOrder = function (msg, session, next){
    ordersync.getNeedSyncOrder(msg, (err, list)=>{
        if(err) return result.success(next, err.toString())
        result.success(next, list)
    })
}

/**
 * 同步给定ID订单列表
 */
handler.syncAll = function (msg, session, next){
    ordersync.syncNeedOrder(msg, (err, list)=>{
        if(err) return result.success(next, err.toString())
        result.success(next, list)
    })
}

/**
 * 换桌
 * */
handler.wsChangeTable = function(msg, session, next) {
    webSocketClient.updateTableState(msg.tableNumber, msg.state, msg.orderId, function (data) {
        result.success(next, null)
    })
}

/**
 *  获取天气资源
 */
handler.getWeather = function (msg, session, next) {
   // var cache = new cacheUtil(0);
    // var cache = cacheUtil
    result.success(next, '')
   // var cacheWeather = cache.get('cacheWeather') || {};
   // if (JSON.stringify(cacheWeather) == '{}') {
   //     cacheWeather = {
   //         refreshed: 0,// 上一次刷新时间
   //         refreshing: false,// 是否正在刷新
   //         updateFrequency: 60 * 1000 * 60, // 1 小时
   //         weatherInfo: {}
   //     }
   // }
   // if ( new Date().getTime() < cacheWeather.refreshed + cacheWeather.updateFrequency) {
   //     cacheWeather.refreshing = false;
   //     cache.remove('cacheWeather')
   //     cache.put('cacheWeather', cacheWeather)
   //     return result.success(next, cacheWeather.weatherInfo)
   // }
   //
   // async.waterfall([
   //     function (cb) {
   //         request('https://api.map.baidu.com/location/ip?&ak=1SbQcHfQfPCSC8zAtYxIK4vBNG9tIUty&coor=bd09ll', function(error, response, body){
   //              // if (error) return cb('天气接口获取已经达到上限')
   //              let result = JSON.parse(body)
   //              cb(null, result.content.address_detail.city)
   //         });
   //     },
   //     function (city, cb) {
   //         let url = `http://api.map.baidu.com/telematics/v3/weather?location=${encodeURIComponent(city)}&output=json&ak=3p49MVra6urFRGOT9s8UBWr2`
   //         request(url, function(error, response, body){
   //             if (error) return cb(null)
   //             let result = JSON.parse(body);
   //             if (result.status == 302) return cb(null, result.msg)
   //             let resultWeather = result.results[0].weather_data
   //             cb(null, JSON.stringify(resultWeather))
   //         });
   //     }],
   //     function (err, resultWeather) {
   //         if (err) {
   //             return result.success(next, {
   //                 success: false,
   //                 data: {}
   //             });
   //         } else {
   //             cacheWeather.weatherInfo = resultWeather;
   //             cacheWeather.refreshed = new Date().getTime();
   //             cacheWeather.refreshing = true;
   //             cache.remove('cacheWeather');
   //             cache.put('cacheWeather', cacheWeather);
   //             result.success(next, resultWeather);
   //         }
   //     })
}

handler.updateOrderStateAndMoney = function (msg, session, next) {
    let orderId = msg.orderId;
    let newOrder = {
        id: orderId,
        orderState: msg.state,
        orderMoney: msg.actualMoney,
        paymentAmount: msg.actualMoney,
        orderPosDiscountMoney: msg.orderPosDiscountMoney,
        posDiscount: msg.posDiscount,
        payMode: msg.payMode,
        lastSyncTime: new Date().getTime(),
        syncState: 0,
    }
    let updateData = [{
        order: [newOrder]
    }]
    orderModel.updateById(orderId, newOrder, (err, reply) => {
        if (err) {
            return result.error(next, err.toString(), msg);
        }
        webSocketClient.syncUpdateData(JSON.stringify(updateData), null, newOrder.lastSyncTime, 1)
        result.success(next);
    });
}


/**
 * 根据orderId查询支付项支付类型
 * @param msg
 * @param session
 * @param next
 */
handler.getPaymentTypeByOrderId = function (msg, session, next) {
    let sql = `SELECT payment_mode_id from tb_order_payment_item where order_id = '${msg.orderId}' and payment_mode_id != 25; `;
    customSqlModel.getOneCustomSqlInfo(sql, function (err, data) {
        if (data) {
            result.success(next, { payment_mode_id: data.payment_mode_id });
        } else {
            result.error(next, '支付项不存在', msg);
        }
    });

}

/**
 *  Recover refund data;
 */
handler.recoveryRefundData = function (msg, session, next) {
    let orderId = msg.id;
    let refundItems = msg.orderItems;

    let refundList = [];
    let orderInfo = {};         //  主订单信息
    let refundMoney = 0;        //  退菜总金额
    let mealAllNumber = 0;      //  餐盒总数量
    let mealFeePrice = 0;       //  餐盒总价
    let synTime = Date.now()    //  订单最近更新时间

    if (result.isEmpty(orderId)) return result.error(next, "恢复菜品失败：订单ID不能为空", msg);

    if (!refundItems || refundItems.length == 0) return result.error(next, "退菜失败：未选择退菜项", msg);

    async.waterfall([
        function (cb) { // 1、 Recovery service price
            recoveryServicePrice(refundItems, () => {
                return cb(null, null)
            })
        },
        function (reply, cb) {  // 2、refund
            let sql = `select * from tb_order where id = '${orderId}' `;
            customSqlModel.getOneCustomSqlInfo(sql, function (error, info) {
                if (error || !info) {
                    return cb(error || "未查到订单信息", null);
                }
                orderInfo = info;

                // refundOrderItem(refundItems, orderInfo, function (error) {
                //     //  修改支付项（以服务器回调为准，直接插入）
                //     //  插入退菜备注
                //     newInsertOrderRefundRemark(orderId, refundItems, msg.refundRemark, function (resultData) {
                //         refundList = resultData;
                //         return cb(error || null, null);
                //     });
                // });
                recoveryArticleItem(refundItems, orderInfo, function (error) {
                    //  Because the server failed to return vegetables, no refund was allowed.
                    //  Delete the orderRefundRemrk
                    deleteOrderRefundRemark(orderId, refundItems, msg.refundRemark, function (resultData) {
                        refundList = resultData;
                        return cb(error || null, null);
                    });
                });
            });
        },
        // function (reply, cb) {  //  开始检测订单状态
        //     checkOrderStatus(orderId, function (error) {
        //         return cb(error || null, null);
        //     });
        // },
    ], function (err, data) {
        if (err) {
            result.error(next, "退菜失败：" + err.toString(), msg);
        } else {
            // 更新本地状态
            let updateIds = []
            refundItems.forEach((item)=>{
                if(!(item.orderId in updateIds)){
                    updateIds.push(item.orderId)
                }
            })
            let orderRange = "'" + updateIds.join("','") + "'"
            let sql = `update tb_order set sync_state=0 ,last_sync_time = ${synTime} where id in (${orderRange})`
            customSqlModel.getAllCustomSqlInfo(sql, (err, result) => {
                msg.lastSyncTime = synTime
                msg.syncState = 0
                if(err) {
                    fileUtil.appendFile(`orderLogs`, `${msg.__route__}=>【恢复退菜订单】本地更新同步状态出错 IDs: ${orderRange}`)
                    return cb(err)
                }
                fileUtil.appendFile(`orderLogs`, `${msg.__route__}=>【恢复退菜订单 】本地更新同步状态成功 IDs: ${orderRange}`);
            })


            fileUtil.appendFile(`orderLogs`, `${msg.__route__}=>【退菜订单】恢复退菜订单成功；,\n,${JSON.stringify(msg)}`);
            // msgUtil.pushAll('event',{
            //     type: "refundOrder",
            //     data: msg
            // })
            result.success(next, refundList);
        }
    });
}

/**
 * Recovery service price
 * @param refundItems
 */
const recoveryServicePrice = function (refundItems, cb) {

    async.eachLimit(refundItems, 1, function (refundItem, e_cb) {
        if (refundItem.type !== 0) return e_cb(null); // Not service price, next
        let customerCount = refundItem.count || 0; // Recovery count
        let servicePrice = refundItem.unitPrice ? refundItem.unitPrice * customerCount : 0; // Recover all service price
        let updateDate = {};
        updateDate.id = refundItem.orderId;
        updateDate.customerCount = 0;
        updateDate.servicePrice = 0;
        updateDate.orderMoney = 0;
        updateDate.paymentAmount = 0;
        updateDate.amountWithChildren = 0;
        let sql = `select table_number, original_amount,article_count, order_money, payment_amount, amount_with_children, customer_count, service_price from tb_order where id = '${updateDate.id}'; `;
        customSqlModel.getOneCustomSqlInfo(sql, (err, orderInfo) => {
            if (!orderInfo) { // If orders do not exist
                return result.success(next, null);
            }
            updateDate.customerCount = orderInfo.customer_count + customerCount; // 人数
            updateDate.originalAmount = orderInfo.original_amount + servicePrice; // 人数

            updateDate.paymentAmount = generalUtil.rounding(orderInfo.payment_amount + servicePrice); // payment_amount
            updateDate.orderMoney = generalUtil.rounding(orderInfo.order_money + servicePrice); // order_money
            updateDate.servicePrice = generalUtil.rounding(orderInfo.service_price + servicePrice); // service_price
            if (orderInfo.amount_with_children) { // amount_with_children
                updateDate.amountWithChildren = generalUtil.rounding(orderInfo.amount_with_children + servicePrice);
            }
            if ((orderInfo.order_money == orderInfo.service_price) && orderInfo.article_count <= 0) { //order_state
                // if (orderInfo.order_money == orderInfo.service_price) { //order_state
                updateDate.orderState = orderState.HAS_PAY; // 如果只剩服务费没退，退服务费后改变订单状态
            }
            orderModel.updateById(updateDate.id, updateDate, (err, reply) => {
                if (orderInfo.order_money == orderInfo.service_price) { // 如果只剩服务费没退，退服务费后释放桌位
                    sql = `update tb_table_qrcode set table_state = 1 where table_number = ${orderInfo.table_number} `;
                    customSqlModel.getOneCustomSqlInfo(sql, (err, reply) => {
                        e_cb(err, null);
                    })
                } else {
                    e_cb(err, null);
                }
            })
        })
    }, function (err) {
        cb(err);
    })
};

const recoveryArticleItem = function (refundItems, orderInfo, cb) {
    let parentOrderId = "";     //  主订单ID
    let childOrderRefundMoney = 0;        //  退菜总金额
    let childOrderRefundCount = 0; //  退菜总数量
    async.eachLimit(refundItems, 1, function (refundItem, callBack) {
        if (refundItem.type === 0 || refundItem.type === 10 || refundItem.type === 11 || refundItem.type == 12) return callBack(null, null); // 服务费 跳过
        let sql = `SELECT(SELECT sum(order_money)  FROM tb_order WHERE id = '${refundItem.orderId}' or(parent_order_id = '${refundItem.orderId}' and order_state = 2))
                    receipts, * FROM tb_order WHERE  id = '${refundItem.orderId}'`;
        customSqlModel.getOneCustomSqlInfo(sql, function (error, order) {
            if (error || !order) {
                return callBack(error || "未找到订单");
            }
            //  修改订单项
            sql = `select * from tb_order_item where id = '${refundItem.id}'`;
            customSqlModel.getOneCustomSqlInfo(sql, function (error, item) {
                if (error || !item) {
                    return callBack(error || "订单项未找到");
                }

                let refundMoney = (refundItem.count * refundItem.unitPrice).toFixed(2);
                let refundCount = refundItem.count;
                //  餐盒费
                if (refundItem.mealFeeNumber > 0) {
                    // refundMoney += generalUtil.rounding(refundItem.count * (order.meal_fee_price / order.meal_all_number));
                    item.meal_fee_number += refundItem.count;
                }
                item.count += refundCount;
                item.final_price += refundMoney;
                item.refund_count -= refundCount;
                //  如果是 套餐主品，将主品 final_price 改为0，表示已退菜，并且 自动将此套餐子品退完
                if (item.type == orderItemType.SETMEALS) {
                    item.final_price = 0;
                    let sql = `update tb_order_item set count = 0, refund_count = 1 where parent_id = '${refundItem.id}' and type = 4; `;
                    customSqlModel.getOneCustomSqlInfo(sql);
                }
                // item.change_count
                customSqlModel.updateSelective('tb_order_item', item, function (error, reply) {
                    if (error) {
                        return callBack("-updateSelectiveError：" + error);
                    }
                    let _order = {
                        id: order.id,
                        article_count: order.article_count + refundCount,
                    };
                    //  餐盒费
                    let reduceMealFee = 0;
                    if (refundItem.mealFeeNumber > 0) {
                        _order.meal_fee_price = order.meal_fee_price + (refundItem.count * (order.meal_fee_price / order.meal_all_number)).toFixed(2);
                        _order.meal_all_number = order.meal_all_number + refundItem.count;
                        reduceMealFee = refundItem.count * (order.meal_fee_price / order.meal_all_number);
                    }

                    //  如果有子订单，则要更新订单总额（总订单+子订单）
                    if (order.amount_with_children && order.amount_with_children > 0) {
                        _order.amount_with_children = generalUtil.rounding(order.amount_with_children) + refundMoney + reduceMealFee;
                        _order.count_with_child = order.count_with_child + refundCount;
                    }

                    _order.order_money = generalUtil.rounding(order.order_money + refundMoney + reduceMealFee);
                    _order.payment_amount = generalUtil.rounding(order.order_money + refundMoney + reduceMealFee);

                    //  如果菜品数 小于等于 0 ，则取消订单
                    if (_order.article_count <= 0) {
                        _order.article_count = 0;
                    }

                    //  判断当前订单是否是加菜订单
                    if (order.parent_order_id) {
                        parentOrderId = order.parent_order_id;
                        childOrderRefundMoney -= parseFloat(refundMoney);
                        childOrderRefundCount -= refundCount;
                    }
                    // 1、退主订单不退子订单 主订单状态不变
                    customSqlModel.updateSelective('tb_order', _order, function (error, reply) {
                        if (error) {
                            return callBack("updateSelectiveError：" + error);
                        }
                        sql = `SELECT id FROM tb_order WHERE(id = '${orderInfo.id}' OR(parent_order_id = '${orderInfo.id}')); `
                        customSqlModel.getAllCustomSqlInfo(sql, function (err, allOrderState) { //改变主订单状态
                                var status = orderInfo.call_times > 0 ? 3 : 2
                                sql = `update tb_order set production_status = ${status} where(id = '${orderInfo.id}' or parent_order_id = '${orderInfo.id}'); `
                                customSqlModel.getOneCustomSqlInfo(sql, function (err, reply) {
                                    customSqlModel.getOneCustomSqlInfo('select shop_mode from tb_shop_detail', function (error, result) {
                                        callBack();
                                    })
                                })
                        })
                    });
                })
            })
        });
    }, function (error) {
        if (!parentOrderId) {
            return cb(error || null);
        }
        //  修改主订单数据
        let sql = `update tb_order set amount_with_children = amount_with_children - ${childOrderRefundMoney},
                    count_with_child = count_with_child - ${ childOrderRefundCount} where id = '${parentOrderId}'`;
        customSqlModel.getOneCustomSqlInfo(sql, function (error, reply) {
            cb(error || null);
        })
    });
};

var deleteOrderRefundRemark = function (orderId, refundItems, orderRefundRemark, cb) {
    let refundList = [];
    async.eachLimit(orderRefundRemark, 1, function (item, callback) {
        var sql = `DELETE FROM table_name WHERE refund_remark_id = '${item.refundRemarkId}';`
        customSqlModel.getOneCustomSqlInfo(sql, function (error) {
            callback(error || null);
        });
    }, function (error) {
        cb && cb(error || refundList);
    });
};

handler.getDiscountInfo = function (msg, session, next) {
    var sql = `SELECT SUM(order_pos_discount_money+reduce_money) discountMoney, SUM(real_erase_money) easyMoney FROM tb_order WHERE id = '${msg.orderId}' OR parent_order_id = '${msg.orderId}'`

    customSqlModel.getOneCustomSqlInfo(sql, function (error, data) {
        if (error) {
            result.error(next, error.toString(), msg)
        }
        result.success(next, data);
    })
}

handler.onloadChrome = function (msg, session, next) {

    if (msg.chromeInfo) {
        if (lodTimer) return;
        onloadTimer(msg, session);
    } else {
        clearTimeout(lodTimer);
        lodTimer = null;
    }
    result.success(next, null)
}

var onloadTimer = function (msg, session) {
    var self = this;
    lodTimer = setTimeout(()=> {
        userController.logout(msg,session,  () =>{})
        lodTimer = null;
    }, 5000)
}

handler.emqttOnline = function (msg, session, next) {
  console.log('emqttClient',emqttClient)
    result.success(next, {
        success: true,
        data: {
            emqttOnline: emqttClient.client.mqttOpen || false
        }
    })
}
