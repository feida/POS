const webSocketClient = require('../util/webSocketClient');
const tvWebSocketClient = require('../util/tvWebSocketClient');
const { log } = require('../util/fileUtil');
const wsEvent = require("../util/eventsUtil").wsEvent();
const msgUtil = require('../util/msgUtil');
const shopDetail = require('../../config/shopDetail');
const printUtil = require("../util/printUtil");
// const print = require("../controller/pos/print");
const manyThreadPrint = require("../controller/pos/manyThreadPrint");
const changeTable = require("../controller/pos/changeTable");
const syncMu = require('../controller/pos/orderSync')

const orderController = require("../controller/pos/order");

const wehchatController = require("../controller/pos/wehchat");
const lodash = require("lodash");

let ctx = null;

// 外卖订单备份
let platformBackups = {};
// 新订单支付项
let payOrderBackups = {};
//  新订单列表
let serverNewOrderBackups = {};
//  收到服务器打印指令的列表
let serverPrintOrderBackups = {};
//  打印时 未找到订单支付项的列表
let serverPrintNoOrderBackups = {};
//  打印时 未找到订单信息的列表
let notExitOrder = {};

//  自动打印异常订单服务
let autoPrintExceptionOrderServer = {
    printProcessFlag: false,
    printTask: null,
    intervalTime: 4 * 60 * 1000,        //  自动打印间隔，默认 5分钟   5 * 60 * 1000
    unPrintOrder: []
};

//  初始化TvWebSocket
let initTvWebSocket = false;


/**
 *
 * 用于和服务器建立长链接
 * @param app
 * @param opts
 * @returns {WSClient}
 */
module.exports = function (app, opts) {
    return new WSClient(app, opts);
};


var WSClient = function (app, opts) {
    this.app = app;
    ctx = this;
};

WSClient.name = '__WSClient__';

WSClient.prototype.start = function (cb) {

    let that = this;
    //  初始化
    webSocketClient.init(function () {
        log("ws", "webSocket初始化成功");
        // webSocketClient.login();
        // that.app.rpc.pos.posRemote.test01.toServer("*", {s1:1,s2:2},function (err,data) {
        //     msgUtil.pushAll("event", {type:'print', data})
        // });
    });

    //  同步菜品库存
    wsEvent.addListener("article", function (result) {
        console.log(result);
    });

    //  微信创建订单
    wsEvent.addListener("orderCreated", function (order) {
        log("ws", `收到新的微信订单：\n  ${JSON.stringify(order)}`);
        let orderId = order.id;
        //  防止出现空订单
        if (!order.orderItem) {
            return log("ws", `error 订单信息中未包含订单项，不继续执行；orderId：${orderId}}`);
        }
        //  防止重复插入
        if (serverNewOrderBackups[orderId]) {
            return;
        }
        serverNewOrderBackups[orderId] = true;

        wehchatController.serverWechatOrder({order:order},(error)=>{
            log("ws", `订单插入 ${error ? "失败" : "成功"}：${order.id}   \n  ${error ? JSON.stringify(error) : null}`);
            delete serverNewOrderBackups[orderId];
            if (shopDetail.allowFirstPay == 0 && !order.orderPayment) {
                msgUtil.pushAll("wsNewOrder", order);
                //  给服务器发送回调
                webSocketClient.callback(order);
                return cb(null);
            } else {
                printCreateOrder(order, function () {
                    msgUtil.pushAll("wsNewOrder", order);
                    //  给服务器发送回调
                    webSocketClient.callback(order);
                });
            }
        })
        // that.app.rpc.pos.posRemote.serverWechatOrder.toServer("*", order, function (error) {
        //     log("ws", `订单插入 ${error ? "失败" : "成功"}：${order.id}   \n  ${error ? JSON.stringify(error) : null}`);
        //     delete serverNewOrderBackups[orderId];
        //     if (shopDetail.allowFirstPay == 0 && !order.orderPayment) {
        //         msgUtil.pushAll("wsNewOrder", order);
        //         //  给服务器发送回调
        //         webSocketClient.callback(order);
        //         return cb(null);
        //     } else {
        //         printCreateOrder(order, function () {
        //             msgUtil.pushAll("wsNewOrder", order);
        //             //  给服务器发送回调
        //             webSocketClient.callback(order);
        //         });
        //     }
        // });
    });

    // //  电视叫号模式，打印订单指令
    // wsEvent.addListener("actionPrint", function (result) {
    //     posPrintOrder(result.orderId);
    // });

    //  外卖订单
    wsEvent.addListener("platform", function (result) {
        let orderId = result.order.id;
        if (platformBackups[orderId]) return;
        platformBackups[orderId] = true;
        let platformOrderId = result.order.platformOrderId;
        that.app.rpc.pos.posRemote.serverPlatformOrder.toServer("*", result, function (error) {
            delete platformBackups[orderId]
            log("ws", `外卖订单插入 ${error ? "失败" : "成功"}：${platformOrderId}   \n  ${error ? JSON.stringify(error) : null}`);
            if (error) {
                return;
            }
            printUtil.printPlatformTotal(platformOrderId, function (error) {
                console.log(error);
                log("ws", `printPlatformTotal   打印外卖总单 ${error ? "失败" : "成功"}：${platformOrderId}   \n  ${error ? JSON.stringify(error) : null}`);
            });
            printUtil.printPlatformKitchen(platformOrderId, function (error) {
                console.log(error);
                log("ws", `printPlatformKitchen   打印外卖厨打 ${error ? "失败" : "成功"}：${platformOrderId}   \n  ${error ? JSON.stringify(error) : null}`);
            });

            // let platformName = result.order.type == 1 ? "饿了么" : "美团";
            msgUtil.pushAll("wsNewPlatformOrder", result);
        });
    });

    //  支付订单（一般用于微信支付和支付宝的回调）
    wsEvent.addListener("orderPay", function (result) {
        ctx.app.rpc.pos.posRemote.serverPayOrder.toServer("*", result, function () {
            printPayOrder(result);
        });
    });

    //  更新支付状态
    wsEvent.addListener("updatePayment", function (result) {
        that.app.rpc.pos.posRemote.insertOrderPaymentList.toServer("*", result.orderPayment, function (error) {

        });
    });

    //  取消订单
    wsEvent.addListener("cancelOrder", function (result) {
        that.app.rpc.pos.posRemote.cancelOrder.toServer("*", result.orderId, function (error) {
            log("ws", `取消订单  ${error ? "失败" : "成功"}：${result.orderId}   \n  ${error ? JSON.stringify(error) : null}`);
            msgUtil.pushAll("wsCancelOrder");
        });
    });

    //  后台数据更改通知
    wsEvent.addListener("change", function (result) {
        changeTable.saveChangeTable(result);
        msgUtil.pushAll("wsServerDataChange");
    });

    //  服务器发送请求至Pos的自定义命令（sql）
    wsEvent.addListener("serverCommand", function (result) {
        that.app.rpc.pos.posRemote.serverCommand.toServer("*", result.data, null);
    });


    //  电视叫号模式
    if (shopDetail.shopMode == 2 || shopDetail.shopMode == 7) {
        //  电视端扫码叫号
        wsEvent.addListener("tv-scan", function (result) {
            that.app.rpc.pos.posRemote.callNumber.toServer("*", result, function (error, data) {
                if (error.errror) {
                    log("【TV】", "扫码叫号失败，" + JSON.stringify(error));
                }
                webSocketClient.callNumber(error.data.orderId);
                tvWebSocketClient.callNumber(error.data);
            });
        });
    }

    // 同步数据
    wsEvent.addListener("wsOpen", function (result) {
        if(result){
            log("ws",'连线启动定时同步=========')
            syncMu.syncTimer.start(()=>{})
        }else{
            log("ws",'断线终止定时同步=========')
            syncMu.syncTimer.stop()
        }
    });
    process.nextTick(cb);
};

WSClient.prototype.afterStart = function (cb) {
    wsEvent.addListener("autoPrintExceptionOrder", function () {
        if (autoPrintExceptionOrderServer.printProcessFlag) {
            return;
        }
        autoPrintExceptionOrderServer.printProcessFlag = true;
        webSocketClient.startHeartbeat();
        autoPrintExceptionOrder();
        log("【启动检测异常订单】", `启动检测异常订单`);
    });


    //  TV WebSocket
    wsEvent.addListener("initTvWebSocket", function () {
        if (initTvWebSocket) {
            return;
        }
        initTvWebSocket = true;
        tvWebSocketClient.init(function () {
            log("【初始化】", "初始化 tvWebSocket 成功");
            ctx.app.rpc.pos.posRemote.connectTv.toServer("*", function (data) {
                tvWebSocketClient.initTv(data);
            });
        });
    });

    process.nextTick(cb);
};

WSClient.prototype.stop = function (force, cb) {
    clearInterval(autoPrintExceptionOrderServer.printTask);
    process.nextTick(cb);
};


/**
 * 打印新订单
 * @param order
 * @param cb
 */
let printCreateOrder = function (order, cb) {
    let orderId = order.id;
    if (shopDetail.shopMode == 2 || shopDetail.shopMode == 7) {  //  电视叫号
        //  电视叫号模式，需要根据服务器的打印指令进行打印操作
        //  此情况是已收到服务器的打印指令，但是订单数据没有插入完成，所以等到数据插入完成之后，再自动执行打印操作
        // if (serverPrintNoOrderBackups[orderId]) {
        //     log("orderLogs", `先收到打印指令，现在订单数据已经插入成功，自动调用打印命令；  orderId：${orderId}\n`);
            posPrintOrder(orderId, true);
        // }
        cb && cb();
    } else if (shopDetail.shopMode == 6) {  // 大 Boss 模式
        if (shopDetail.allowFirstPay == 0) {  // 先付
            if (order.orderState == 1 && (order.payMode == 3 || order.payMode == 4)) {  // 银联和现金支付
                if (shopDetail.autoPrintTotal == 0) {
                    printUtil.printTotal(orderId,1, 1);
                }
                syncPrintState(orderId);
                cb && cb();
            } else if (order.orderState == 2) {  // 一次付清
                if (shopDetail.autoPrintTotal == 0) {
                    printUtil.printTotal(orderId, 1,1);
                }
                printUtil.printKitchen(orderId,1);
                syncPrintState(orderId);
                cb && cb();
            }
        } else if (shopDetail.allowAfterPay == 0) { // 后付
            // if (order.parentOrderId.length < 2) {
            //     if (shopDetail.autoPrintTotal == 0) {
            //         printUtil.printTotal(orderId, 2);
            //     }
            //     printUtil.printKitchen(orderId);
            //     syncPrintState(orderId);
            //     cb && cb();
            // }else {
            if (order.orderPayment) {
                if (shopDetail.autoPrintTotal == 0) { printUtil.printTotal(orderId,1, 3); }
            } else {

                if (shopDetail.autoPrintTotal == 0) { printUtil.printTotal(orderId,1, 2 )}
            }
            printUtil.printKitchen(orderId,1);
            syncPrintState(orderId);
            cb && cb();
        }
    }
};

/**
 * 打印订单
 * @param orderId
 * @param ignoreCheck
 */
let posPrintOrder = function (orderId, ignoreCheck) {
    // log("printLogs", `【收到打印指令】orderId：${orderId}    是否进行重复判断：${!ignoreCheck}\n`);
    // if (!ignoreCheck) {
    //     //  防止订单重复插入    如果历史记录中包含，则不进行插入操作
    //     if (serverPrintOrderBackups[orderId]) {
    //         log("printLogs", `【收到打印指令】历史记录中已存在，不进行打印操作：${orderId}\n`);
    //         return;
    //     }
    //     serverPrintOrderBackups[orderId] = true;
    // }
    //  电视叫号
    if (shopDetail.shopMode == 2 || shopDetail.shopMode == 7) {
        ctx.app.rpc.pos.posRemote.selectOrderRelationInfo.toServer("*", orderId, function (result) {
            if (result.error && result.error.indexOf("订单不存在") != -1) {
                setTimeout(function () {
                    notExitOrder[orderId] = notExitOrder[orderId] != null ? ++notExitOrder[orderId] : 0;
                    if (notExitOrder[orderId] <= 3) {
                        log("printLogs", `打印时订单不存在，1.5秒后自动调用打印方法(${notExitOrder[orderId]})：${orderId} \n  ${JSON.stringify(result.error)}`);
                        posPrintOrder(orderId, true);
                    } else {
                        delete notExitOrder[orderId];
                    }
                }, 1500);
                return;
            }
            let orderInfo = result.data;
            //  发送至 TV 端
            // tvWebSocketClient.newOrder(orderInfo);

            if (orderInfo.paymentItems && orderInfo.paymentItems.length > 0) {
                if (orderInfo.productionStatus < 2) {
                    log("printLogs", `【调用打印方法】orderId：${orderId}\n`);
                    if (shopDetail.autoPrintTotal == 0) {
                        printUtil.printTotal(orderId,1, 1);
                    }
                    // 是否开启多动线打印
                    if (shopDetail.enableDuoDongXian) {
                        printUtil.printKitchen(orderId,1);
                    } else {
                        let msg = {
                            orderId: orderId,
                            autoPrint: 1,
                            kitchenType: 0,
                            refund: 0,
                            orderItemArr: [],
                        }
                        manyThreadPrint.printNewKitchen(msg)
                    }
                    syncPrintState(orderId);
                    // wsEvent.emit("tvWebSocketNewOrder", orderInfo);
                    //  发送至 TV 端
                    // tvWebSocketClient.newOrder(orderInfo);
                    // if(shopDetail.shopMode == 2) {
                    //
                    // }
                    msgUtil.pushAll("event", {type: "newWechatTVorder", data: orderInfo})
                    delete notExitOrder[orderId];
                } else {
                    log("printLogs", `【订单状态错误】orderId：${orderId}  \n  ${JSON.stringify(orderInfo)}\n`);
                }
            } else {
                log("printLogs", `订单支付项不存在；orderId：${orderId}   -->将订单存起来，等待插入后自动打印\n`);
                //  保存不存在的订单ID
                serverPrintNoOrderBackups[orderId] = true;
            }
        });
    }
};

/**
 * 同步订单打印状态
 * @param orderId
 */
let syncPrintState = function (orderId, cb) {
    ctx.app.rpc.pos.posRemote.printOrder.toServer("*", orderId, function () {
        log("printLogs", `【打印订单】本地状态修改成功  orderId：${orderId}\n`);
        webSocketClient.printSuccess(orderId, function () {
            log("printLogs", `【打印订单】服务器状态修改成功  orderId：${orderId}\n`);
            ctx.app.rpc.pos.posRemote.updateOrderSyncState.toServer("*", orderId, function (error) {
                cb && cb(error || null);
            });
        });
    });
};

//  打印支付订单
let printPayOrder = function (order) {
    let orderId = order.orderId;
    if (shopDetail.shopMode == 2 || shopDetail.shopMode == 7) {  //  电视叫号模式
        //  如果是电视叫号模式 ，则判断是否先收到打印指令
        if (serverPrintNoOrderBackups[orderId]) {
            log("orderLogs", `订单支付成功，现在订单数据已经插入成功，自动调用打印命令；  orderId：${orderId}\n`);
            posPrintOrder(orderId, true);
        }
    } else if (shopDetail.shopMode == 6) {  // 大 Boss 模式
        if (shopDetail.allowFirstPay == 0) {  // 先付
            if (order.payMode == 1 || order.payMode == 2) { // 微信或者支付宝的支付回调
                if (shopDetail.autoPrintTotal == 0) {
                    printUtil.printTotal(orderId,1);
                }
                // printUtil.printKitchen(orderId,1);
                if (shopDetail.enableDuoDongXian) {
                    printUtil.printKitchen(orderId,1);
                } else {
                    let msg = {
                        orderId: orderId,
                        autoPrint: 1,
                        kitchenType: 0,
                        refund: 0,
                        orderItemArr: [],
                    }
                    manyThreadPrint.printNewKitchen(msg)
                }
                syncPrintState(orderId);
            }
        } else if (shopDetail.allowAfterPay == 0) { // 后付
            if (shopDetail.autoPrintTotal == 0) {
                printUtil.printTotal(orderId,1,3);  //  结账单
            }
        }
    }
};

let autoPrintExceptionOrder = function () {
    autoPrintExceptionOrderServer.printTask = setInterval(function () {
        webSocketClient.exceptionOrderList(function (error, orderList) {
            log("【获取异常订单】", orderList);
            if (orderList == "[]")    return;
            orderList = JSON.parse(orderList);
            let orderListArr = lodash.map(orderList, (n)=>{ return JSON.parse(n); });
            orderController.getOrderInfoById(orderListArr,function (err,orderIdArr) {
                if(orderIdArr.length >0){
                    for (let i = 0; i < orderIdArr.length; i++) {
                        webSocketClient.printSuccess(orderIdArr[i].id, function () {
                        });
                    }
                }
                let orderListItem = lodash.differenceBy(orderListArr, orderIdArr, 'id');
                if (orderListItem == "[]")    return;
                for (let i = 0; i < orderListItem.length; i++) {
                    setTimeout(function () {
                        let order = orderListItem[i];
                        let orderId = order.id;
                        log("【自动处理异常订单】", `开始处理异常订单：${orderListItem[i]}`);
                        ctx.app.rpc.pos.posRemote.printExceptionOrder.toServer("*", order, function (error) {
                            log("【自动处理异常订单】", `异常订单插入 ${error ? "失败" : "成功"}   ${orderId}   \n ${error ? JSON.stringify(error) : null}`);
                            if (error) return;
                            if (shopDetail.autoPrintTotal == 0) {
                                if (shopDetail.shopMode == 6 && shopDetail.allowAfterPay == 0) {
                                    printUtil.printTotal(orderId,1, 2, undefined, undefined, function (error) {
                                        log("【自动处理异常订单】", `打印总单 ${error ? "失败" : "成功"}   ${orderId}   \n ${error ? JSON.stringify(error) : null}`);
                                    });
                                } else {
                                    printUtil.printTotal(orderId, 1,1, undefined, undefined, function (error) {
                                        log("【自动处理异常订单】", `打印总单 ${error ? "失败" : "成功"}   ${orderId}   \n ${error ? JSON.stringify(error) : null}`);
                                    });
                                }
                            }
                            if (shopDetail.enableDuoDongXian) {
                                printUtil.printKitchen(orderId,1, undefined, undefined, undefined, function (error) {
                                    log("【自动处理异常订单】", `打印厨打 ${error ? "失败" : "成功"}   ${orderId}   \n ${error ? JSON.stringify(error) : null}`);
                                });
                            } else {
                                let msg = {
                                    orderId: orderId,
                                    autoPrint: 1,
                                    kitchenType: undefined,
                                    refund: undefined,
                                    orderItemArr: undefined,
                                };
                                manyThreadPrint.printNewKitchen(msg,function (error) {
                                    log("【自动处理异常订单】", `打印厨打 ${error ? "失败" : "成功"}   ${orderId}   \n ${error ? JSON.stringify(error) : null}`);
                                })
                            }
                            syncPrintState(orderId, function (error) {
                                log("【自动处理异常订单】", `异常订单打印 ${error ? "失败" : "成功"}   ${orderId}   \n ${error ? JSON.stringify(error) : null}`);
                            });
                        });
                    }, i * 1000);
                }
            })
        });
    }, autoPrintExceptionOrderServer.intervalTime);
};
