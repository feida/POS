/**
 * Created by Lmx on 2017/5/17.
 */
const async = require('async');
const webSocketClient = require("../../../util/webSocketClient");
const tvWebSocketClient = require("../../../util/tvWebSocketClient");
const wsEvent = require("../../../util/eventsUtil").wsEvent();
const msgUtil = require('../../../util/msgUtil');
const generalUtil = require('../../../util/generalUtil');
const dateUtil = require("../../../util/dateUtil");
const {log} = require("../../../util/fileUtil");
const customSql = require("../../../model/pos/customSql");
const shopDetail = require("../../../../config/shopDetail");
const result = require('../../../util/resultUtil');
const orderState = require('../../../constant/OrderState');
const {syncOrders, updateCallbacks, getNeedSyncOrder, syncTimer} = require('../../../controller/pos/orderSync')


const customSqlModel = require("../../../model/pos/customSql");
const orderModel = require("../../../model/pos/order");
const orderItemModel = require("../../../model/pos/orderItem");
const orderPaymentItemModel = require("../../../model/pos/orderPaymentItem");
const orderRefundRemarkModel = require("../../../model/pos/orderRefundRemark");

const requestUtil = require("../../../util/requestUtil")


module.exports = function (app) {
    return new Handler(app);
};

var Handler = function (app) {
    this.app = app;
};

var handler = Handler.prototype;

var touchCount = 0;
/**
 *  同步库存
 * @param msg
 * @param session
 * @param next
 */
handler.syncArticleStock = function (msg, session, next) {
    requestUtil.post('articleStock', {}, (error, data) => {
        if (error) {
            return msgUtil.push("syncArticleStockError", session.uid, "同步菜品出错，请检查网络状态或稍后重试！");
            next()
        }
        log(`准备批量更新库存`, `${data}`);
        let resultData = JSON.parse(data);
        let articleStockList = JSON.parse(resultData.data).articleList

        let stockLength = articleStockList.length;

        if (articleStockList && stockLength > 0) {
            let sql = "";
            async.eachLimit(articleStockList, 1, function (item, callback) {
                var index = articleStockList.indexOf(item)
                if (item.currentWorkingStock == 0) {
                    sql = `update tb_article set current_working_stock = 0, is_empty = 1  where id = '${item.id}'`;
                } else {
                    sql = `update tb_article set current_working_stock = ${item.currentWorkingStock}, is_empty = 0 where id = '${item.id}'`;
                }

                customSql.getOneCustomSqlInfo(sql, function (error, data) {
                    msgUtil.push("syncArticleStockProgress", session.uid, parseInt(++index / stockLength * 100));
                    callback && callback(error, data);
                })
            }, function (error, data) {
                log(`批量更新库存${error ? '失败' : '成功'}`, `${msg.__route__}=>${error ? JSON.stringify(error.toString()) : "更新成功，一共更新菜品数：" + stockLength}`);
                msgUtil.push("syncArticleStockSuccess", session.uid, "菜品库存更新成功");
            });
        } else {
            msgUtil.push("syncArticleStockSuccess", session.uid, "菜品库存更新成功");
        }
    })
    next(null);
};


/**
 * 同步说明 v1.0
 * 1、此方法一般在每次 Pos客户端 启动时进行数据校验（查询出所有 sync_state = 0 的订单数据）；
 * 2、每隔一秒遍历得出订单的完整信息包含以下几张表（tb_order , tb_order_item, tb_order_payment_item, tb_order_refund_remark）；
 * 3、分批执行推送请求操作；
 * 4、每个请求完成，都会执行对应的回调，进行本地同步状态的修改(设置sync_state = 1)；
 *
 * @param msg
 * @param session
 * @param next
 */
handler.syncOrderInfo = function (msg, session, next) {
    console.log("begin  syncOrderInfo ...");
    var totalSyncSuccessCount = 0;
    let orderIds = msg.orderIds;

    for (let i = 0; i < orderIds.length; i++) {
        let item = orderIds[i];
        setTimeout(() => {
            getOrderFullInfoWithChildren(item.id, function (error, orderInfo) {
                webSocketClient.syncPosLocalOrder(orderInfo, function (error) {
                    if (error && error.code == -1) {
                        msgUtil.push("syncArticleStockError", session.uid, "当前POS暂无网络链接，请检查网络！");
                        return;
                    }
                    updateOrderSyncState(orderInfo.id, function () {
                        ++totalSyncSuccessCount;
                        msgUtil.push("syncOrderInfoProgress", session.uid, parseInt(totalSyncSuccessCount / orderIds.length * 100));
                        if (i === (orderIds.length - 1)) {
                            log(`system`, `${msg.__route__}=>【同步成功】：总共：${orderIds.length}    成功条数：${totalSyncSuccessCount}`);
                            msgUtil.push("syncOrderInfoSuccess", session.uid, "同步成功：总共：" + orderIds.length + "   成功条数：" + totalSyncSuccessCount);
                        }
                    })
                });
            })
        }, 1000 * i);
    }
    next(null);
};

let getOrderFullInfoWithChildren = function (orderId, cb) {
    getOrderFullInfo(orderId, function (error, order) {
        let sql = "";
        //  如果 自动确认时间  已到，则自动更改为 确认状态
        if (order.orderState == 2 && parseInt(dateUtil.timestamp() - order.createTime / (1000)) >= shopDetail.autoConfirmTime) {
            order.orderState = orderState.CONFIRM;
            order.allowAppraise = 1;
            order.allowCancel = 0;
            order.allowContinueOrder = 0;
            order.confirmTime = dateUtil.timestamp();
            // todo 更新本地状态
        }
        var childrenOrderList = [];
        orderModel.findAllInfoByConditions({parentOrderId: orderId}, function (error, childrenOrders) {
            async.eachLimit(childrenOrders, 1, function (childrenOrder, callback) {
                getOrderFullInfo(childrenOrder.id, function (error, childrenOrder) {
                    if (childrenOrder) {
                        childrenOrderList.push(childrenOrder);
                    }
                    callback();
                });
            }, function (err) {
                if (err) return cb(err);
                order.childrenOrders = childrenOrderList;
                cb(null, order)
            });
        });
    });
};

let getOrderFullInfo = function (orderId, callback) {
    async.waterfall([
        function (cb) { //订单信息
            orderModel.findOneInfoById(orderId, function (error, order) {
                if (order && order.id) {
                    cb(null, order);
                } else {
                    cb(error || "订单不存在");
                }
            });
        }, function (order, cb) { // 订单项
            orderItemModel.findAllInfoByConditions({orderId: orderId}, function (error, orderItems) {
                if (error) {
                    return cb(error);
                }
                order.orderItem = orderItems;
                cb(null, order);
            });
        },
        function (order, cb) { //   订单支付项
            orderPaymentItemModel.findAllInfoByConditions({orderId: orderId}, function (error, paymentItems) {
                if (error) {
                    return cb(error);
                }
                order.orderPayment = paymentItems;
                cb(null, order);
            });
        },
        function (order, cb) { //   订单退菜备注
            orderRefundRemarkModel.findAllInfoByConditions({orderId: orderId}, function (error, orderRefundRemarks) {
                if (error) {
                    return cb(error);
                }
                order.orderRefundRemarks = orderRefundRemarks;
                cb(null, order);
            });
        }
    ], function (error, order) { // final
        if (error) {
            log("同步订单失败：getOrderFullInfo", `orderId：${orderId} \n  ${error.toString()}`);
        }
        callback(error, order);
    });
};

let updateOrderSyncState = function (orderId, cb) {
    let order = {
        syncState: 1,
        lastSyncTime: dateUtil.timestamp()
    };
    orderModel.updateById(orderId, order, function (err, reply) {
        cb();
    });
};

/**
 * POS退出登录
 * @param msg
 * @param session
 * @param next
 */
handler.posLogout = function (msg, session, next) {
    webSocketClient.posLogout();
    next(null);
};

/**
 * 发送请求
 * @param msg
 * @param session
 * @param next
 */
handler.sendMsg = function (msg, session, next) {
    if (msg.callback) {
        webSocketClient.sendMsg(msg.param, function (error, resultData) {
            if (error) {
                result.error(next, error);
            } else {
                result.success(next, resultData);
            }
        });
    } else {
        webSocketClient.sendMsg(msg.param);
        result.success(next);
    }
};

/**
 * 发送电视叫号 订单请求
 * @param msg
 * @param session
 * @param next
 */
handler.sendTvMsg = function (msg, session, next) {
    if (msg.callback) {
        tvWebSocketClient.newOrder(msg.order, function (error, resultData) {
            if (error) {
                result.error(next, error);
            } else {
                result.success(next, resultData);
            }
        })
    } else {
        tvWebSocketClient.newOrder(msg.order)
        result.success(next)
    }
}


/**
 * Pos端叫号
 * @param msg
 * @param session
 * @param next
 */
handler.callNumber = function (msg, session, next) {
    let orderId = msg.orderId, verCode, orderItemList = [];

    if (result.isEmpty(orderId)) return result.error(next, "请输入订单ID", msg);
    async.waterfall([
        function (cb) {             //  基础验证
            orderModel.selectById(orderId, function (error, order) {
                if (error || !order) {
                    return cb(error || "订单不存在    orderId：" + orderId);
                }
                verCode = order.verCode;
                cb(null, order);
            });
        },
        function (order, cb) {      //  查询订单项
            orderItemModel.findAllInfoByConditions({orderId: orderId}, function (error, orderItems = []) {
                if (error || orderItems.length === 0) {
                    return cb(error || "订单项为空");
                }
                orderItemList = orderItems;
                cb();
            })
        },
        function (cb) {             //  修改订单状态
            orderModel.callNumber(orderId, function (error) {
                cb(error || null);
            });
        }
    ], function (error) {

        if (error) {
            log("【TV】", "POS叫号失败，" + error);
            return result.error(next, "POS叫号失败，" + error)
        }

        // 将信息推送到服务器
        webSocketClient.callNumber(orderId);
        // tvWebSocketClient.callNumber({
        //     code: verCode,
        //     orderId: orderId,
        //     data: orderItemList,
        // });

        result.success(next);
    });
};

handler.tvCallNumber = function (msg, session, next) {
    webSocketClient.callNumber(msg.orderId);
    result.success(next, null)
}

handler.reconectTV = function (msg, session, next) {
    tvWebSocketClient.init(function () {
        return result.success(next);
    })
    // tvWebSocketClient.tvCloseConnect(function () {
    //
    // })
    // if (data) {
    //     msgUtil.infoNotify("TV 已连接");
    //     msgUtil.pushAll('event',{
    //         type: "tvWebsocketState",
    //         data: data
    //     })
    //     return result.success(next)
    // } else {
    //
    // }
}

/**
 * 同步订单
 */
handler.syncOrders = function (msg, session, next) {
    syncTimer.stop()
    syncTimer.start()
    // syncOrders(msg,(err, list)=>{
    //     if(err) return result.error(next, '查询待同步订单失败, '+ err)
    //     // 没有待同步订单
    //     if(!list) return result.success(next, [])

    //     webSocketClient.syncOrders(list,(err, data)=>{
    //         if(err) return result.error(next, '同步订单失败, '+ err)
    //         console.log(JSON.parse(data))
    //         return result.success(next, list)
    //     })
    // })
}

/**
 * 查询是否有未同步订单
 */
handler.checkSyncLeft = function (msg, session, next) {
    getNeedSyncOrder(msg, (err, returndata) => {
        if (err) return result.error(next, '查询失败, ' + err)
        result.success(next, returndata)
    })
}
