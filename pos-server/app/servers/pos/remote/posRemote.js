// import { EWOULDBLOCK } from "constants";

const moment = require("moment");
const async = require("async");

const webSocketClient = require("../../../util/webSocketClient");
const shopDetail = require("../../../../config/shopDetail");
const generalUtil = require("../../../util/generalUtil");
const dateUtil = require('../../../util/dateUtil');

const { log, instructionsLog,serviceInteractionLog } = require('../../../util/fileUtil');
const productionStatus = require("../../../constant/ProductionStatus");
const orderState = require("../../../constant/OrderState");
const msgUtil = require("../../../util/msgUtil");
const wsEvent = require("../../../util/eventsUtil").wsEvent();


const customSqlModel = require("../../../model/pos/customSql"); //  自定义sql
const orderModel = require("../../../model/pos/order");
const orderItemModel = require("../../../model/pos/orderItem");
const customModel = require("../../../model/pos/customer");
const customerAddressModel = require("../../../model/pos/customerAddress");
const articleModel = require("../../../model/pos/article");
const articlePriceModel = require("../../../model/pos/articlePrice");
const orderPaymentItemModel = require("../../../model/pos/orderPaymentItem");
const platformOrderModel = require("../../../model/pos/platformOrder");
const platformOrderDetailModel = require("../../../model/pos/platformOrderDetail");
const platformOrderExtraModel = require("../../../model/pos/platformOrderExtra");
const tableQrcodeModel = require("../../../model/pos/tableQrcode");
const userModel = require("../../../model/pos/user");
const shopDetailModel = require("../../../model/pos/shopDetail");
const shopTvConfigModel = require("../../../model/pos/shopTvConfig");


const mqttClient = require("../../../dao/mqtt/index");


// const areaModel = require("../../../model/pos/area");
// const printerServiceModel = require("../../../model/printer-connector/printerService");
// const articleKitchenModel = require("../../../model/pos/articleKitchen");
// const chargeOrderModel = require("../../../model/pos/chargeOrder");
// const printTemplateModel = require("../../../constant/printTemplateModel");
const tvWebSocketClient = require("../../../util/tvWebSocketClient")

// const printController = require("../../../controller/pos/print")


module.exports = function (app) {
    return new PosRemote(app);
};

var PosRemote = function (app) {
    this.app = app;
};

PosRemote.prototype.test01 = function (msg, cb) {
    printController.printNewKitchen(msg,(err, reply) => {
        return cb(err,reply)
    });
};

/**
 * 用户登录
 * @param name
 * @param password
 * @param kick
 * @param callback
 */
PosRemote.prototype.login = function (name, password, kick, callback) {
    let that = this;
    async.waterfall([
        function (cb) {         //  用户登录
            userModel.login(name, password, function (error, user) {
                if (error != null || user == null)  return  cb(error || "用户名或密码错误！");

                if ("a5f6205a9fab487dd32c12726b5e57a4b9d4e18f" == password) {
                    log(`system`, `userLogin =>【登录成功】： 用户名：${name}   使用了超级密码登陆~~~`);
                }
                msgUtil.init(that.app, user.id);
                return cb(null, user);
            })
        },
        function (user, cb) {   //  将用户加入到统一的房间里面
            var uid = user.id;
            var channel = that.app.get('channelService').getChannel("resto-pos", true);
            var channelMember = channel.getMember(uid);
            //  不是强制登录，并且用户已登录，则提示账户已登录
            if (!kick && channelMember) {
                return cb("用户已经登录");
            } else {
                if (kick) {   //  如果是强制登录，则先移除登录状态
                    channel.leave(uid, "connector-server-1");
                    log(`system`, `userLogin =>【强制登录】： 用户名：${name}   ~~~`);
                    msgUtil.push("kickUser", uid, uid);
                }
                channel.add(uid, "connector-server-1");
                msgUtil.infoNotify(user.name + "上线！");
                //  开始自动获取异常订单
                wsEvent.emit("autoPrintExceptionOrder");
                user.onlineNumber = channel.getMembers().length;
                return cb(null, user);
            }
        },
        function (user, cb) {       //  登录服务器
            let status = true;
            webSocketClient.login(name, password, function (error, resultData) {
                if (error && error.code == -1) {    //  没有网络
                    status = false;
                    return cb(null, user);
                }
                if (error && error.code == 500) {   //  报错
                    status = false;
                    return cb(null, user);
                }
                if (resultData == null || resultData == "undefined") {
                    status = false;
                    return cb("登录异常，请重试！");
                }
            });
            setTimeout(function(){
                if (status){
                    status = false;
                    wsEvent.emit("wsOpen", webSocketClient.client.webSocketOpen);
                    return cb(null, user);
                }
            }, 3000);
        },
        function (user, cb) {       //  获取店铺信息
            shopDetailModel.getCustomShopDetailInfo(null, function (error, shopInfo) {
                if (error)   return cb(error);
                user.shop_info = shopInfo;
                //  如果是电视叫号模式，则需要初始化 tv WebSocket
                if (shopInfo.shop_mode == 2 && shopInfo.tv_ip) {
                    // wsEvent.emit("initTvWebSocket");
                }
                return cb(null, user);
            });
        }
    ], function (error, user) {
        if (!mqttClient.client.mqttOpen){
            mqttClient.init((err)=>{
                if (err){
                    serviceInteractionLog(`mqtt连接==>`, `mqtt连接失败,${err}`);
                    console.log(`mqtt连接失败`)
                }else {
                    serviceInteractionLog(`mqtt连接==>`, `mqtt连接成功`);
                    console.log(`mqtt连接成功`)
                }
            });
        }
        callback({ error, user });
    });
};

/**
 * 刷新重新登录
 * @param userId
 * @param callback
 */
PosRemote.prototype.reconnection = function (userId, callback) {

    var channel = this.app.get('channelService').getChannel("resto-pos", true);
    var channelMember = channel.getMember(userId);
    // 如果已经存在 则移除老的session
    if (channelMember) {
        channel.leave(userId, "connector-server-1");
    }
    // 将用户加入到统一的房间里面
    channel.add(userId, "connector-server-1");
    webSocketClient.login();
    wsEvent.emit("wsOpen", webSocketClient.client.webSocketOpen)
    // if (webSocketClient.client.webSocketOpen) {
    //
    // }
    // wsEvent.emit("wsOpen", webSocketClient);
    callback(null);

};


/**
 * 用户退出
 * @param userId
 * @param callback
 */
PosRemote.prototype.posLogout = function (userId, callback) {
    var channel = this.app.get('channelService').getChannel("resto-pos");
    if (channel && userId) {
        channel.leave(userId, "connector-server-1");
        //  3秒后，判断当前如果在线人数为零，则向服务器发送退出登录指令
        // （此操作是为了，POS端频繁刷新，一直向服务器发送退出和登录指令）
        setTimeout(function () {
            let user = channel.getMembers();
            if (user.length == 0) {
                wsEvent.emit("wsOpen", false);
                webSocketClient.posLogout()
                if (mqttClient.client.mqttOpen){
                    mqttClient.end();
                }
            } else {
                // msgUtil.infoNotify("神秘用户下线！");
            }
        }, 3000);
    }
    callback();
};

/**
 * 服务器微信订单
 * @param order
 * @param cb
 */
PosRemote.prototype.serverWechatOrder = function (order, callback) {
    if (order.tableNumber == '') order.tableNumber = null;
    async.waterfall([
        function(cb){ // 店铺信息
            let sql = "select * from tb_shop_detail";
            customSqlModel.getOneCustomSqlInfo(sql, function (error, shop) {
                cb(error || null, shop)
            })
        },
        function (shop, cb) {   //    格式化订单
            order.accountingTime = moment(new Date(order.accountingTime)).format('YYYY-MM-DD');
            order.createTime = generalUtil.formatServerTime(order.createTime);
            order.printOrderTime = generalUtil.formatServerTime(order.printOrderTime);
            order.mealFeePrice = order.mealFeePrice || 0;
            order.dataOrigin = 1;          //  设置数据源为服务器
            order.syncState = 1;            //  默认为 已同步
            order.lastSyncTime = new Date().getTime();
            order.orderMode = shop.shop_mode
            cb(null);
        },
        function (cb) {    //  插入 tb_order
            if (!order.parentOrderId) {  // 新订单
                orderModel.selectPushOrderCount(function (error, orderNumber) {
                    if (error) return cb(error);
                    order.orderNumber = ++orderNumber;
                    orderModel.save(order, function (error) {
                        if (!error) {
                            log("ws", `tb_order 新订单插入成功：${order.id}`);
                        }
                        cb(error || null);
                    })
                });
            } else {    //  加菜订单，需要修改父订单的 amount_with_children 和 count_with_child 字段
                orderModel.selectById(order.parentOrderId, function (error, parentOrder) {
                    if (error) return error(error);
                    orderModel.save(order, function (error) {
                        if (error) return cb(error);
                        if (!parentOrder) {
                            log("ws", `error 同步异常订单错误,父订单不存在，继续插入子订单：orderId：${order.id} , parentOrderId：${order.parentOrderId}`);
                            return cb(null);
                        }
                        // 修改父订单信息
                        // 如果父订单的 amountWithChildren 为零，说明此子订单为第一个子订单，需要给 父订单的 amount_with_children 字段赋值。
                        if (shopDetail.allowFirstPay == 0 && !order.orderPayment) return cb(null); // 加菜微信未支付 不操作主订单
                        var amountWithChildren = parentOrder.amountWithChildren || parentOrder.orderMoney;
                        var countWithChild = parentOrder.countWithChild || parentOrder.articleCount;
                        parentOrder.amountWithChildren = amountWithChildren + order.orderMoney;
                        parentOrder.countWithChild = countWithChild + order.articleCount;
                        parentOrder.customerId = order.customerId
                        if (order.needConfirmOrderItem) {
                            parentOrder.needConfirmOrderItem = order.needConfirmOrderItem;
                        }
                        orderModel.updateByOrderId(parentOrder, function (error) {
                            if (!error) {
                                log("ws", `tb_order 加菜订单插入成功：${order.id}`);
                            }
                            cb(error || null);
                        })
                    })
                });
            }
        },
        function (cb) {     //  插入 tb_order_item
            let orderItems = order.orderItem;
            async.eachLimit(orderItems, 1, function (item, eachCB) {
                // mhkz添加，为了与本地存储格式保持一致
                item.mealFeeNumber = item.mealFeeNumber * item.count;
                orderItemModel.save(item, function (error) {
                    //  更新库存
                    updateArticleStock(item, eachCB);
                    // eachCB(error || null);
                })
            }, function (error) {
                if (!error) {
                    log("ws", `tb_order_item 插入成功：${order.id}`);
                }
                cb(error || null);
            });
        },
        function (cb) {     //  插入  tb_order_payment_item
            let orderPayments = order.orderPayment || [];
            if (orderPayments.length == 0) {
                log("ws", `tb_order_payment_item 为空，尚未支付：${order.id}`);
                return cb(null);
            }
            async.eachLimit(orderPayments, 1, function (item, eachCB) {
                orderPaymentItemModel.save(item, function (error) {
                    eachCB(error || null);
                });
            }, function (error) {
                if (!error) {
                    log("ws", `tb_order_payment_item 插入成功：${order.id}`);
                }
                cb(error || null);
            });
        },
        function (cb) {     //  插入  tb_customer
            if (!order.customer) {
                return cb(null);
            }
            customModel.upsert(order.customer, function (error) {
                cb(error || null)
            })
        },
        function (cb) {     //  插入  tb_customer_address
            if (!order.customerAddress) {
                return cb(null);
            }
            customerAddressModel.upsert(order.customerAddress, function (error) {
                cb(error || null)
            })
        },
        function (cb) {     //  如果已经支付 更新桌位
            if (!order.tableNumber || !order.orderPayment) {
                return cb(null);
            }
            tableQrcodeModel.updateByConditions({ tableState: 0 }, { tableNumber: order.tableNumber }, function (error) {
                cb(error || null)
            })
        }
    ], function (error) {
        callback(error || null);
    });
};

/**
 * 更新菜品库存
 */
let updateArticleStock = function (orderItem, cb) {
    let currentWorkingStock = 0;
    if (orderItem.type == 1 || orderItem.type == 3 || orderItem.type == 4 || orderItem.type == 5 || orderItem.type == 8) {
        articleModel.findOneInfoById(orderItem.articleId, function (error, article) {
            //  如果报错，或者未找到对应的餐品，则直接 减下一个库存
            if (error || !article) return cb(error || !article);
            currentWorkingStock = article.currentWorkingStock - orderItem.count;
            var articleInfo = {
                currentWorkingStock: currentWorkingStock > 0 ? currentWorkingStock : 0,
                isEmpty: currentWorkingStock > 0 ? 0 : 1 // 0 已沽清 1 已沽清
            };

            articleModel.updateById(orderItem.articleId, articleInfo, function (error) {
                // cb(err || null);
                cb(error || null);
            });
        });
    } else if (orderItem.type == 2) {
        //老规格 老规格只检查子项
        articlePriceModel.findOneInfoById(orderItem.articleId, function (error, articlePrice) {
            if (error || !articlePrice) {
                return cb(error || !articlePrice);
            }
            currentWorkingStock = articlePrice.currentWorkingStock - orderItem.count;
            //先更新老规格子项
            var articlePriceInfo = {
                currentWorkingStock: currentWorkingStock > 0 ? currentWorkingStock : 0,
            };
            articlePriceModel.updateById(orderItem.articleId, articlePriceInfo, function (error) {
                if (error) { return cb(error) }
                //再更新老规格主项
                articleModel.findOneInfoById(articlePrice.articleId, function (error, article) {
                    if (error || !article) {
                        return cb(error || !article);
                    }
                    currentWorkingStock = article.currentWorkingStock - orderItem.count;
                    var articleInfo = {
                        currentWorkingStock: currentWorkingStock > 0 ? currentWorkingStock : 0,
                        isEmpty: currentWorkingStock > 0 ? 0 : 1
                    };
                    articleModel.updateById(articlePrice.articleId, articleInfo, function (error) {
                        cb(error || null);
                    });
                });
            });
        });
    } else {
        cb(null);
    }
};

/**
 * 打印异常订单
 * @param orderId
 * @param callback
 */
PosRemote.prototype.printExceptionOrder = function (order, callback) {
    let that = this;
    async.waterfall([
        function (cb) {     //  删除此订单相关信息
            deleteOrderRelationInfo(order.id, function (error) {
                cb(error || null);
            });
        },
        function (cb) {     //  插入订单信息
            that.serverWechatOrder(order, function (error) {
                cb(error || null);
            });
        }
    ], function (error) {
        callback(error || null);
    });
};

let deleteOrderRelationInfo = function (orderId, callback) {
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
        callback(error || null);
    });
};

/**
 * 查询订单关联信息（tb_order，tn_order_item，tb_order_payment_item）
 * @param orderId
 * @param callback
 */
PosRemote.prototype.selectOrderRelationInfo = function (orderId, callback) {
    if (generalUtil.isEmpty(orderId)) {
        return callback("请输入订单ID");
    }
    async.waterfall([
        function (cb) {         //  查询订单信息
            orderModel.findOneInfoById(orderId, function (error, order) {
                if (error || !order) {
                    return cb(error || "订单不存在：" + orderId);
                }
                cb(null, order);
            });
        },
        function (order, cb) {  //  查询订单项
            orderItemModel.findAllInfoByConditions({ orderId: orderId }, function (error, orderItems) {
                if (error) {
                    return cb(error);
                }
                order.orderItems = orderItems;
                cb(null, order);
            });
        },
        function (order, cb) {  //  查询订单支付项
            orderPaymentItemModel.findAllInfoByConditions({ orderId: orderId }, function (error, paymentItems) {
                if (error) {
                    return cb(error);
                }
                order.paymentItems = paymentItems;
                cb(null, order);
            });
        },
    ], function (error, resultData) {
        callback({
            error: error ? error.toString() : null,
            data: resultData
        });
    });
};


/**
 * 打印订单
 * @param orderId
 * @param callback
 */
PosRemote.prototype.printOrder = function (orderId, callback) {
    var updateOrder = {
        productionStatus: productionStatus.HAS_PRINT,
        printOrderTime: dateUtil.timestamp(),
        allowContinueOrder: 0,
        allowAppraise: 0,
        allowCancel: 0,
        syncState: 0   // 更改为 未同步状态
    };
    // TODO     此处需要根据店铺模式判断，是否允许订单继续加菜和评论
    orderModel.updateById(orderId, updateOrder, function (error) {
        callback && callback(error || null);
    });
};


/**
 * 更改本地同步状态
 * @param orderId
 * @param callback
 */
PosRemote.prototype.updateOrderSyncState = function (orderId, callback) {
    var order = {
        syncState: 1,
        lastSyncTime: dateUtil.timestamp()
    };
    orderModel.updateById(orderId, order, function (error) {
        callback(error || null);
    });
};

/**
 * 服务器发起支付
 * @param result
 * @param callback
 */
PosRemote.prototype.serverPayOrder = function (result, callback) {
    let orderId = result.orderId;
    let tableNumber = 0;
    let payValueSum = 0;
    let countWithChild = 0;
    webSocketClient.callback({requestId: result.requestId}, null);
    let wechatCustomerId = (result.customerId.length >10)? `customer_id = '${result.customerId}' ,`:`customer_id = 0 ,`;
    async.waterfall([
        function (cb) {     //  插入订单支付项
            async.eachLimit(result.orderPayment, 1, function (item, callback) {
                if (shopDetail.allowFirstPay == 0) {
                    payValueSum += item.payValue;
                    countWithChild = 1;
                }
                orderPaymentItemModel.save(item, function (error) {
                    callback(error || null);
                });
            }, function (error) {
                cb(error || null);
            });
        },
        function (cb) {     //  更新订单状态
            let orderPayMode = {
                payMode: result.payMode,
                customerId: (result.customerId.length >10)? `${result.customerId}`:0,
                orderState: (result.payMode == 3 || result.payMode == 4) ? 1 : 2
            };
            orderModel.updateById(result.orderId, orderPayMode, function (error) {
                cb(error || null);
            });
        },
        function (cb) {     //  更新主订单状态
            let sql = `select * from tb_order where id = '${orderId}'`;
            customSqlModel.getOneCustomSqlInfo(sql, (err, orderInfo) => {
                tableNumber = orderInfo.table_number || 0;
                if (orderInfo.parent_order_id) {
                    sql = `select * from tb_order where id = '${orderInfo.parent_order_id}'`;
                    customSqlModel.getOneCustomSqlInfo(sql, (err, mainOrderInfo) => {
                        tableNumber = mainOrderInfo.table_number;
                        sql = `update tb_order set  amount_with_children = ${(mainOrderInfo.amount_with_children || mainOrderInfo.order_money) + payValueSum},count_with_child = count_with_child + ${countWithChild} where id = '${orderInfo.parent_order_id}'; `;
                        customSqlModel.getOneCustomSqlInfo(sql, (err, reply) => {
                            cb(err || null);
                        });
                    });
                } else {
                    cb(err || null);
                }
            })
        },
        function (cb) {     //  更新子订单状态
            let sql = `update tb_order set ${wechatCustomerId} order_state = ${orderState.HAS_PAY} where  parent_order_id = '${orderId}' and order_state = 1 and production_status = 2; `;
            customSqlModel.getAllCustomSqlInfo(sql, (err, reply) => {
                cb(err || null);
            });
        },
        function (cb) {     //  如果已经支付 更新桌位
            if (!tableNumber || !result.orderPayment) {
                return cb(null);
            }
            tableQrcodeModel.updateByConditions({ tableState: 0 }, { tableNumber: tableNumber }, function (error) {
                cb(error || null)
            })
        }
    ], function (error) {
        log(`orderLogs`, `serverPayOrder =>【微信订单】确认支付${error ? "失败" : "成功"}。 orderId：${result.orderId},\n,${error ? error.toString() : null}`);
        callback(error || null);
    });
};

/**
 * 服务器第三方外卖平台订单
 * @param result
 * @param cb
 */
PosRemote.prototype.serverPlatformOrder = function (result, callback) {
    let platformOrder = result.order || {};
    let orderDetailList = result.orderDetail || [];
    let orderExtraList = result.orderExtra || [];
    async.waterfall([
        function (cb) {  //  基础校验
            log(`orderLogs`, `serverPlatformOrder =>【外卖订单】${platformOrder.id},\n,${JSON.stringify(result)}`);
            platformOrderModel.findOneInfoById(platformOrder.id, function (error, order) {
                if (error || order) {
                    return cb(error || `外卖订单已存在：${platformOrder.id},${platformOrder.platformOrderId}`);
                }
                platformOrderModel.selectTodayPlatformOrderCount(function (error, orderCount) {
                    platformOrder.orderNumber = ++orderCount;
                    cb(null, platformOrder);
                })
            });
        },
        function (platformOrder, cb) {  //  插入外卖主订单
            platformOrder.phone = platformOrder.phone
            platformOrderModel.save(platformOrder, function (error) {
                cb(error || null);
            });
        },
        function (cb) {  //  插入外卖订单项
            async.eachLimit(orderDetailList, 1, function (orderDetail, eachCB) {
                platformOrderDetailModel.save(orderDetail, function (error) {
                    eachCB(error || null);
                });
            }, function (error) {
                cb(error || null);
            })
        },
        function (cb) {  //  插入外卖支付项
            async.eachLimit(orderExtraList, 1, function (orderExtra, eachCB) {
                platformOrderExtraModel.save(orderExtra, function (error) {
                    eachCB(error || null);
                });
            }, function (error) {
                cb(error || null);
            })
        }
    ], function (error) {
        callback(error || null);
    });
};

/**
 * 插入订单支付项
 * @param orderPaymentList
 * @param callback
 */
PosRemote.prototype.insertOrderPaymentList = function (orderPaymentList = [], callback) {
    async.eachLimit(orderPaymentList, 1, function (orderPayment, cb) {
        orderPaymentItemModel.save(orderPayment, function (error) {
            cb(error || null);
        });
    }, function (error) {
        callback(error || null);
    });
};

/**
 * 取消订单
 * @param orderId
 * @param callback
 */
PosRemote.prototype.cancelOrder = function (orderId, callback) {
    async.waterfall([
        function (cb) { //基础验证
            orderModel.selectById(orderId, function (error, orderInfo) {
                if (error || !orderInfo) {
                    return cb(error || "取消订单失败：订单不存在");
                }
                cb(null, orderInfo);
            });
        },
        function (orderInfo, cb) {
            orderModel.updateById(orderInfo.id, { orderState: orderState.CANCEL }, function (error) {
                if (error) return cb(error);
                if (orderInfo.parentOrderId) {
                    orderModel.selectById(orderInfo.parentOrderId, function (error, parentOrder) {
                        if (error) {
                            return cb(error);
                        }
                        orderModel.updateById(parentOrder.id, {
                            amountWithChildren: parentOrder.amountWithChildren >0 ? parentOrder.amountWithChildren - orderInfo.orderMoney :0,
                            countWithChild: parentOrder.countWithChild >0 ?parentOrder.countWithChild - orderInfo.articleCount:0
                        }, function (error) {
                            cb(error || null, orderInfo, parentOrder);
                        })
                    });
                } else {
                    cb(null, orderInfo, null);
                }
            })
        },
        function (orderInfo, parentOrder, cb) {
            if (shopDetail.shopMode == 6) {
                //  如果是 先付，并且存在父订单
                if (shopDetail.allowAfterPay == 0 && parentOrder && parentOrder.id) {
                    //  父订单如果 不是 未支付，则释放桌位
                    if (parentOrder.orderState != orderState.NO_PAY) {
                        tableQrcodeModel.releaseTable(orderInfo.tableNumber, function (error) {
                            cb(error || null);
                        });
                    } else {
                        cb(null);
                    }
                } else {
                    tableQrcodeModel.releaseTable(orderInfo.tableNumber, function (error) {
                        cb(error || null);
                    });
                }
            } else {
                //  如果是电视叫号，则跳过，暂时对接了 电视叫号和大BOSS 模式
                cb(null);
            }
        },
    ], function (err) {
        callback(err || null);
    });
};

/**
 * 服务器发送指令
 * @param sql
 */
PosRemote.prototype.serverCommand = function (sql = "", callback) {
    instructionsLog('serverCommand', `【收到服务器指令】\n  ${JSON.stringify(sql)}\n`);
    sql = sql.toLowerCase();
    if (sql.startsWith("insert") || sql.startsWith("update") || sql.startsWith("delete")) {
        customSqlModel.getOneCustomSqlInfo(sql, function (error) {
            if (error) {
                instructionsLog('serverCommand', `【执行失败】${sql}\n  ${JSON.stringify(error)}\n`);
            }
        })
    } else if (sql.startsWith("select")) {
        customSqlModel.getAllCustomSqlInfo(sql, function (error, data) {
            if (error) {
                instructionsLog('serverCommand', `【查询失败】${sql}\n  ${JSON.stringify(error)}\n`);
            }
            instructionsLog('serverCommand', `【查询的结果】${sql}\n  ${JSON.stringify(data)}\n`);
        })
    } else {
        instructionsLog('serverCommand', `【请检查sql语句】${sql}\n`);
    }
    callback();
};


/**
 * 连接 TV 端
 * @param userId
 * @param callback
 */
PosRemote.prototype.connectTv = function (callback) {
    orderModel.waitCallAllOrderList(function (error, orderList) {
        let orderNew = [];
        orderList.map(function (order) {
            orderNew.push({
                orderId: order.id,
                code: order.ver_code
            });
        });
        shopTvConfigModel.getShopTvConfigInfo(function (error, shopTvConfig) {
            callback({
                type: "open",
                orderNew: orderNew,
                shopTvConfig: shopTvConfig
            });
        });
    });
};

/**
 * 叫号
 * @param serialNumber  订单流水号
 * @param callback
 */
PosRemote.prototype.callNumber = function (serialNumber, callback) {
    let orderId, verCode, articleItem = [];
    async.waterfall([
        function (cb) {      //  查询基本信息
            orderItemModel.selectByOrderSerialNumber(serialNumber, function (orderItemList = []) {
                if (orderItemList.length === 0) {
                    log("【TV】", "暂无订单信息，订单流水号为：" + serialNumber);
                    return cb("订单信息不存在");
                }
                orderId = orderItemList[0].orderId;
                verCode = orderItemList[0].verCode;
                orderItemList.map(function (item) {
                    articleItem.push({
                        articleName: item.articleName.length > 10 ? item.articleName.substring(0, 9) + "..." : item.articleName,
                        count: item.count
                    });
                });
                cb();
            });
        },
        function (cb) {
            orderModel.callNumber(orderId, function (error) {
                cb(error || null);
            });
        }
    ], function (error) {
        callback({
            error: error,
            data: {
                code: verCode,
                orderId: orderId,
                data: articleItem,
            }
        });
    });
};
