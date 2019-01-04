/**
 * @author wxh on 2018/7/27
 * @copyright
 * @desc
 */

const result = require("../../util/resultUtil");
const dateUtil = require("../../util/dateUtil");
const generalUtil = require("../../util/generalUtil");
const { log } = require("../../util/fileUtil");
const async = require("async");
const lodash = require("lodash");
const moment = require("moment");

const customSqlModel = require("../../model/pos/customSql");
const shopDetailModel = require("../../model/pos/shopDetail");
const orderModel = require("../../model/pos/order");
const orderItemModel = require("../../model/pos/orderItem");
const orderPaymentItemModel = require("../../model/pos/orderPaymentItem");
const customModel = require("../../model/pos/customer");
const customerAddressModel = require("../../model/pos/customerAddress");
const tableQrcodeModel = require("../../model/pos/tableQrcode");
const articleModel = require("../../model/pos/article");
const articlePriceModel = require("../../model/pos/articlePrice");

const shopDetail = require("../../../config/shopDetail");
/**
 * 插入微信订单
 * @param msg
 * @param callback
 */
exports.serverWechatOrder = function (msg, callback) {
    let order = msg.order;
    if (order.tableNumber == '') order.tableNumber = null;


    async.waterfall([
        function (cb) { // 更新 customer_id
            let parentOrderId = order.parentOrderId;
            let customerId = order.customerId;
            if (customerId && customerId == 0 || !parentOrderId) return cb(null);
            orderModel.updateById(parentOrderId,{customerId: customerId}, (err)=>{
                if (err) return cb(err)
                cb(null)
            })
        },
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
            cb(null, shop);
        },
        function (shop, cb) {    //  插入 tb_order
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
                        if (shop.allow_first_pay == 0 && !order.orderPayment) return cb(null); // 加菜微信未支付 不操作主订单
                        var amountWithChildren = parentOrder.amountWithChildren || parentOrder.orderMoney;
                        var countWithChild = parentOrder.countWithChild || parentOrder.articleCount;
                        parentOrder.amountWithChildren = amountWithChildren + order.orderMoney;
                        parentOrder.countWithChild = countWithChild + order.articleCount;
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
                orderPaymentItemModel.save(item, eachCB);
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
        console.log("-------------------------------------error---------------------", error)
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
            // if (error || !article) return cb(error || !article);
            if (error || !article) return cb(null);
            currentWorkingStock = article.currentWorkingStock - orderItem.count;
            var articleInfo = {
                currentWorkingStock: currentWorkingStock > 0 ? currentWorkingStock : 0,
                isEmpty: currentWorkingStock > 0 ? 0 : 1 // 0 已沽清 1 已沽清
            };
            articleModel.updateById(orderItem.articleId, articleInfo, function (error) {
                // cb(error || null);
                cb(null);
            });
        });
    } else if (orderItem.type == 2) {
        //老规格 老规格只检查子项
        articlePriceModel.findOneInfoById(orderItem.articleId, function (error, articlePrice) {
            if (error || !articlePrice) {
                return cb(null);
            }
            currentWorkingStock = articlePrice.currentWorkingStock - orderItem.count;
            //先更新老规格子项
            var articlePriceInfo = {
                currentWorkingStock: currentWorkingStock > 0 ? currentWorkingStock : 0,
            };
            articlePriceModel.updateById(orderItem.articleId, articlePriceInfo, function (error) {
                if (error) { return cb(null) }
                //再更新老规格主项
                articleModel.findOneInfoById(articlePrice.articleId, function (error, article) {
                    if (error || !article) {
                        return cb(null);
                    }
                    currentWorkingStock = article.currentWorkingStock - orderItem.count;
                    var articleInfo = {
                        currentWorkingStock: currentWorkingStock > 0 ? currentWorkingStock : 0,
                        isEmpty: currentWorkingStock > 0 ? 0 : 1
                    };
                    articleModel.updateById(articlePrice.articleId, articleInfo, function (error) {
                        cb(null);
                    });
                });
            });
        });
    } else {
        cb(null);
    }
};


/**
 *  打印异常订单
 * @param msg
 * @param callback
 */
exports.printExceptionOrder = function (msg,callback) {
    let order = msg.order;
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
