const customSqlModel = require("../../../model/pos/customSql");
const shopDetailModel = require("../../../model/pos/shopDetail");
const result = require("../../../util/resultUtil");
const async = require('async');
const dateUtil = require("../../../util/dateUtil");
const orderController = require("../../../controller/pos/order");
const webSocketClient = require("../../../util/webSocketClient");
const printUtil = require('../../../util/printUtil');
const { log } = require("../../../util/fileUtil");
const msgUtil = require("../../../util/msgUtil");
const lodash = require("lodash");
const moment = require("moment");
const fileUtil = require('../../../util/fileUtil');
const wsEvent = require("../../../util/eventsUtil").wsEvent();
const productionStatus = require('../../../constant/ProductionStatus');
const orderModel = require("../../../model/pos/order");

const crypto = require('crypto');

module.exports = function (app) {
    return new Handler(app);
};

var Handler = function (app) {
    this.app = app;
};

var handler = Handler.prototype;

handler.menuInit = function (msg, session, next) {
    result.success(next, '成功建立连接...')
};

handler.menuSyncArticleInfo = function (msg, session, next) {
    var syncInfo = {};
    var shopDetail = {};
    var uid = msg.ppid;
    var rid = "resto-pos";
    session.bind(uid, uid)
    session.set('rid', rid);
    msgUtil.init(this.app, uid);
    // 同步菜品
    async.waterfall([
        function (cb) {
            syncInfo.articleInfo = []
            var sql = `select st.begin_time,st.end_time,st.support_week_bin,st.discount,a.id,a.name,a.article_family_id,a.price,a.fans_price,a.article_type,a.has_unit,a.is_empty,
                a.current_working_stock,a.meal_fee_number,a.weight_package_id,a.open_catty,a.catty_money, 
                CASE
                    WHEN (a.has_unit != ' ' and a.has_unit is not null)
                    THEN
                        '2' 
                    ELSE
                        (CASE WHEN (SELECT id from tb_article_unit_new where article_id =  a.id) is not null THEN '5' ELSE	'' END)
                    END article_unit
                from tb_article a
                LEFT JOIN tb_article_support_time  ast on ast.article_id = a.id 
                LEFT JOIN tb_support_time  st on st.id = ast.support_time_id
                WHERE activated = 1 ORDER BY a.sort ASC`
            customSqlModel.getAllCustomSqlInfo(sql, function (error, articleInfoList) {
                if (error) cb(error);
                cb(null, articleInfoList)
            })
        },
        function (articleInfoList, cb) {
            shopDetailModel.getShopDetailFindOne((err, shopInfo)=> {
                if (err) return cb(err);
                shopDetail = shopInfo
                cb(null, articleInfoList);
            });
        },
        function (articleInfoList, cb) {
            let resultObj = [];
            async.eachLimit(articleInfoList, 1,  function(articleInfo, e_cb){
                if (!articleInfo.begin_time || !articleInfo.end_time || !articleInfo.support_week_bin) {
                    articleInfo.current_working_stock = 0;
                    let resultItem = lodash.find(resultObj, (o)=> {  return o.id ==articleInfo.id;});
                    if (resultItem == undefined){ resultObj.push(articleInfo); }
                    return e_cb()
                }
                let begin_time = `${moment().format('YYYY-MM-DD')} ${articleInfo.begin_time}`;
                let end_time = `${moment().format('YYYY-MM-DD')} ${articleInfo.end_time}`;
                if (dateUtil.isWeekDay(articleInfo.support_week_bin) && dateUtil.isBetween(begin_time,end_time)){
                    if (shopDetail.posPlusType == 0){
                        if (articleInfo.fans_price){
                            articleInfo.fans_price = +(articleInfo.fans_price * articleInfo.discount * 0.01).toFixed(2);
                        }
                        let resultItem = lodash.find(resultObj, (o)=> {  return o.id ==articleInfo.id;});
                        if (resultItem == undefined){
                            resultObj.push(articleInfo);
                        }else {
                            if (resultItem.current_working_stock<articleInfo.current_working_stock){
                                resultItem.current_working_stock = articleInfo.current_working_stock;
                                resultItem.begin_time = articleInfo.begin_time;
                                resultItem.end_time = articleInfo.end_time;
                                resultItem.support_week_bin = articleInfo.support_week_bin;
                                resultItem.discount = articleInfo.discount;
                                resultItem.fans_price = (+articleInfo.fans_price).toFixed(2);
                            }
                        }
                        return e_cb()
                    }else {
                        let resultItem = lodash.find(resultObj, (o)=> {  return o.id ==articleInfo.id;});
                        if (resultItem == undefined){
                            resultObj.push(articleInfo);
                        }else {
                            if (resultItem.current_working_stock<articleInfo.current_working_stock){
                                resultItem.current_working_stock = articleInfo.current_working_stock;
                                resultItem.begin_time = articleInfo.begin_time;
                                resultItem.end_time = articleInfo.end_time;
                                resultItem.support_week_bin = articleInfo.support_week_bin;
                                resultItem.discount = articleInfo.discount;
                            }
                        }
                        return e_cb()
                    }
                }else {
                    articleInfo.current_working_stock = 0;
                    let resultItem = lodash.find(resultObj, (o)=> {  return o.id ==articleInfo.id;});
                    if (resultItem == undefined){ resultObj.push(articleInfo); }
                    return e_cb()
                }
            }, (err) => {
                if (err) return cb(err);
                // syncInfo.articleInfo = resultObj;
                var articleList = resultObj;
                var articleLength = resultObj.length;
                async.forEachOf(articleList, function (item, index, callback) {
                   // console.log("item", item, index)
                    msgUtil.push('event', uid, {
                        data: {
                            type: 'asyncInfo',
                            article: item,
                            percent: parseInt(++index/articleLength * 100)
                        }
                    })
                }, function (error, data) {
                    msgUtil.push("event", uid, "菜品库存更新成功");
                });
                return cb(null, syncInfo)
            });
        },
        function (syncInfo, cb) {
            let sql = `select pos_plus_type from tb_shop_detail`;
            customSqlModel.getOneCustomSqlInfo(sql, function (error, result) {
                if (error) return result.error(next, '查询数据出错', error.toString());
                syncInfo .posPlusType = result.pos_plus_type;
                cb(null, syncInfo)
            })
        }
    ],function (error, syncInfo) {
        if (error) return result.success(next, error.toString());
        var articleList = syncInfo.articleInfo;
        result.success(next, {posPlusType: syncInfo.posPlusType})
    })
};

handler.getOrderInfoByTableNumber = function (msg, session, next) {
    if(msg.tableNumber == undefined || msg.tableNumber == 'undefined') return result.error(next, "桌位不存在", msg);
    let tableNumber = msg.tableNumber.toString().replace(/\b(0+)/gi,"");
    if (result.isEmpty(tableNumber)) return result.error(next, "桌位不能为空", msg);

    async.waterfall([
        function (cb) {
            let sql = `select * from tb_table_qrcode where table_number = '${tableNumber}'`;
            customSqlModel.getOneCustomSqlInfo(sql, function (error, tableInfo) {
                if (error) return result.error(next, '查询出错', error.toString());
                if (!tableInfo) return result.error(next, '桌位号不存在，请重新输入桌位');
                cb(null, tableInfo)
            })
        },

        function (tableInfo, cb) {
            let sql = `select id from tb_order where table_number='${tableNumber}' and order_state < 2 and parent_order_id is null`
            customSqlModel.getOneCustomSqlInfo(sql, function (error, orderId) {
                if (error) return result.error(next, '查询出错', error.toString())
                if (!orderId) return result.success(next, null);
                cb(null, orderId)
            })
        },
        function (orderId, cb) {
            let sql = `SELECT sum(order_money) orderMoney, sum(article_count) articleCount, (select service_price from tb_order where id = '${orderId.id}' and parent_order_id is null) servicePrice, (select customer_count from tb_order where id = '${orderId.id}' and parent_order_id is null) customerCount FROM tb_order WHERE id = '${orderId.id}' or ( parent_order_id = '${orderId.id}' and order_state < 2)`;
            customSqlModel.getOneCustomSqlInfo(sql, function (error, order) {
                if (error) return cb(error.toString());
                if (order == null) return result.success(next);
                //打印指令发出时 更新production_status的状态
                order.payOrderMoney = order.orderMoney;
                order.articleCount = order.articleCount;
                order.customerCount = order.customerCount;
                order.servicePrice = order.servicePrice;
                order.id = orderId.id;
                customSqlModel.getAllCustomSqlInfo(`SELECT * from tb_order_item where order_id = '${orderId.id}' ORDER BY type DESC`, function (error, orderItems) {
                    if (error) return cb(error.toString());
                    order.order_item_list = orderItems || [];
                    cb(null, order);
                });
            });
        },
        function (order, cb) {
            let sql = `select * from tb_order_item where order_id in(select id from tb_order where parent_order_id = '${order.id}' ) ORDER BY type DESC`;

            customSqlModel.getAllCustomSqlInfo(sql, function (error, childrenOrderItems) {
                if (error) return cb(error.toString());
                order.childreorder_item_list = childrenOrderItems || [];
                cb(null, order);
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
 * @desc  根据桌位号码获取 vvid
 * @param msg
 * @param session
 * @param next
 */
handler.getVvidByTableNumber = function (msg, session, next) {
    var tableNumber = msg.tableNumber;
    if (!tableNumber) return result.error(next, 'tableNumber不存在')
    customSqlModel.getOneCustomSqlInfo(`select table_pass from tb_table_qrcode where table_number = '${tableNumber}'`, function (error, res) {
       if (error) return result.error(next, error.toString());
       var tablePass = res.table_pass;
       customSqlModel.getOneCustomSqlInfo(`select remark from tb_shop_detail`, function (error, res) {
           if (error) return result.error(next, error.toString());
           var resUrl = `${res.remark}/wechat/index?vv=${tablePass}`
           result.success(next, resUrl);
       })

    })
}

/**
 * @desc  根据vvid获取 桌位号
 * @param msg
 * @param session
 * @param next
 */
handler.getTableNumberByVvid = function (msg, session, next) {
    var resUrl = msg.vvid;
    if (!resUrl) return result.error(next, 'vvid不存在');
    var tablePass =  resUrl.split('?')[1];
    var tablePass = tablePass.substring(3, tablePass.length)
    customSqlModel.getOneCustomSqlInfo(`select table_number from tb_table_qrcode where table_pass = '${tablePass}'`, function (error, res) {
        if (error) result.error(next, error.toString())
        result.success(next, {table_number: res.table_number})
    })
}

handler.newPushOrder = function (msg, session, next) {
   orderController.pushOrder(msg,(err, reply) => {
        if (err) {
           return result.error(next, err.toString(), msg)
        } else {
            let orderId = msg.childrenOrderId || msg.masterOrderId || '';
            log(`pad====下单${msg.childrenOrderId?'(加菜)':''} ==>`, `订单ID orderId:${msg.masterOrderId?msg.masterOrderId:msg.childrenOrderId},masterOrderId:${msg.masterOrderId},childrenOrderId:${msg.childrenOrderId},orderItems : ${JSON.stringify(msg)}`);
            printUtil.printTotal(orderId, 1, 2);
            printUtil.printKitchen(orderId, 1);
            printOrder(orderId, ()=>{});
            webSocketClient.printSuccess(orderId, () => {});
                msgUtil.pushAll('event',{
                    type: "padCreatedOrder",
                    data: {
                        message: '收到 pad 新订单',
                        data: reply
                    }
                })
           return result.success(next,reply);
        }
    });
}

// 修改打印指令
var printOrder = function(orderId, cb) {
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
                cb(error.toString());
            }
            cb(reply)
        });
    });
}



/**
 * @desc  根据桌位号 查询订单状态
 * @param msg
 * @param session
 * @param next
 */
handler.getOrderStateByTableNumber = function (msg, session, next) {
    if(msg.tableNumber == undefined || msg.tableNumber == 'undefined') return result.error(next, "桌位不存在", msg);
    let tableNumber = msg.tableNumber.toString().replace(/\b(0+)/gi,"");
    if (result.isEmpty(tableNumber)) return result.error(next, "桌位不能为空", msg);

    async.waterfall([
        function (cb) {
            let sql = `select * from tb_table_qrcode where table_number = '${tableNumber}'`;
            customSqlModel.getOneCustomSqlInfo(sql, function (error, tableInfo) {
                if (error) return result.error(next, '查询出错', error.toString());
                if (!tableInfo) return result.error(next, '桌位号不存在，请重新输入桌位');
                cb(null, tableInfo)
            })
        },

        function (tableInfo, cb) {
            let sql = `select order_state from tb_order where table_number='${tableNumber}' and parent_order_id is null and order_state < 2`
            customSqlModel.getOneCustomSqlInfo(sql, function (error, result) {
                if (error) return result.error(next, '查询出错', error.toString())
                if (result && result.order_state) {
                    cb(null, result.order_state)
                } else {
                    cb(null, null)
                }
            })
        },
    ], function (err, order) {
        if (err) {
            return result.error(next, err.toString(), msg);
        } else {
            result.success(next, order||null);
        }
    });
}