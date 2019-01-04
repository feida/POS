const moment = require("moment");
const async = require("async");
const lodash = require("lodash");
const queuefun = require('queue-fun');
const httpClient = require("./httpClient");
const PayMode = require("../constant/PayMode");
const Queue = queuefun.Queue();
const q = queuefun.Q;  //配合使用的Promise流程控制类，也可以使用原生Promise也可以用q.js代替
//实列化一个最大并发为1的队列
const queue1 = new Queue(1);

const result = require("./resultUtil");
const generalUtil = require("./generalUtil");
// const shopDetail = require("../../config/shopDetail");
const { log } = require("./fileUtil");
const printTemplateModel = require("../constant/printTemplateModel");


const orderModel = require("../model/pos/order");
const orderItemModel = require("../model/pos/orderItem");
const printerModel = require("../model/pos/printer");
const areaModel = require("../model/pos/area");
const orderPaymentItemModel = require("../model/pos/orderPaymentItem");
const shopDetailModel = require("../model/pos/shopDetail");
const articleKitchenModel = require("../model/pos/articleKitchen");
const chargeOrderModel = require("../model/pos/chargeOrder");
const platformOrder = require("../model/pos/platformOrder");
const printer = require("../model/pos/printer");
const printerServiceModel = require("../model/printer-connector/printerService");

//  厨打打印次数
let printKitchenExecuteNumber = {};

let printUtil = module.exports;

/**
 * 打印总单
 * @param orderId           订单ID
 * @param totalType         1=先付， 2=后付消费、3= 后付结算
 * @param refund            0 不退菜   or  1 退菜
 * @param orderItemArr      退菜对象    orderItemArr:[ {id:"'df0a6deb982b4e57a894ce57f68211c4'",count:2}]
 * @param autoPrint         1; 自动 0 手动
 * @param callback
 */
printUtil.printTotal = function (orderId, autoPrint = 0, totalType = 1,  refund = 0, orderItemArr = [], callback) {
    let refundServicePriceItem = [];

    if (typeof callback != 'function') {
        callback = function () { };
    }
    log('总单打印第一步', `【发起总单打印】【${autoPrint?'自动打印':'手动打印'} 】 订单ID：${orderId},refund:${refund},${refund ? "orderItemArr:" + JSON.stringify(orderItemArr) : []}`);

    shopDetailModel.getShopDetailInfo('', function (error, shopDetail) {
        if (error || !shopDetail) return callback(error || "未找到店铺信息");
        if (shopDetail.autoPrintTotal !=0 && autoPrint !=0) return callback();
        if (shopDetail.autoPrintConsumeOrder !=1 && totalType ==2 && autoPrint !=0) return callback();
        if (shopDetail.autoPrintCheckOutOrder !=1  && (totalType ==3 || totalType ==1) && autoPrint !=0) return callback();
        if (refund != 0) {

            lodash.forEach(orderItemArr, function (val) {
                var type = [0, 10, 11, 12]
                var articleType = {"0": shopDetail.serviceName + '(退)', "10": shopDetail.sauceFeeName + '(退)', "11": shopDetail.towelFeeName + '(退)', "12": shopDetail.tablewareFeeName + '(退)'}
                if (type.includes(val.type)) {
                    let refundItemTmp = {
                        ARTICLE_NAME: articleType[val.type],
                        ARTICLE_COUNT: 0 - val.refundCount,
                        ARTICLE_TOTAL: 0 - val.refundCount,
                        SUBTOTAL: (0 - (val.refundCount * val.unitPrice)).toFixed(2),
                        TOTAL: +(0 - (val.refundCount * val.unitPrice)).toFixed(2)
                    };
                    refundServicePriceItem.push(refundItemTmp)
                }
                lodash.assign(val, { id: "'" + val.id + "'" });
            });
        }

        async.waterfall([
           function (cb) { //关联订单信息
                orderModel.getReceiptsById(orderId, function (error, orderInfo) {
                    if (error || !orderInfo) return cb(error || "订单不存在！");

                    if (!refund) {
                        async.parallel({
                            totalArticleByOrderId: function (done) {
                                orderModel.totalArticleByOrderId(orderId, orderInfo.distribution_mode_id, shopDetail.printOutDetails, function (error, orderItems) {
                                    if (error) return cb(error);
                                    let orderItemList = orderItems;
                                    orderItemList.map(item => {
                                        if (item.grant_count > 0) {
                                            let article = {}
                                            for (it in item) {
                                                if (it == "article_name") {
                                                    article[it] = item[it] + "(赠)"
                                                }else if (it == "orgin_count") {
                                                    article["orgin_count"] = -item["grant_count"]
                                                }else if (it == "original_price") {
                                                    article[`${it}`] = item["original_price"]
                                                }  else {
                                                    article.it = item.it
                                                }
                                            }
                                            orderItems.push(article)
                                        }
                                    })
                                    done(null, orderItems)
                                })
                            },
                            refundCountByOrderId: function (done) {
                                if (shopDetail.printOutDetails ==0 ) return done();
                                orderModel.refundCountByOrderId(orderId, function (error, refundCountItems) {
                                    if (error) return cb(error);
                                    done(null, refundCountItems)
                                });
                            },
                        }, function (error, results) {
                            if (error) return cb(error);

                            if (shopDetail.printOutDetails ==1 ){
                                 results.totalArticleByOrderId.push(...results.refundCountByOrderId);
                            }
                            // log('总单打印菜品查询', `【菜品查询】订单ID：${orderId},【菜品内容】:${JSON.stringify(results.totalArticleByOrderId)}`);
                            printerModel.getArticleSort(results.totalArticleByOrderId, function (e) {
                                orderInfo.orderItems = e;
                                // log('总单打印菜品排序', `【菜品排序】订单ID：${orderId},【菜品排序内容】:${JSON.stringify(orderInfo.orderItems)}`);
                                if (!orderInfo.parent_order_id) return cb(null, orderInfo);
                                // 如果存在 父订单，则 订单数量 显示 父订单的值
                                orderModel.getReceiptsById(orderInfo.parent_order_id, function (error, parentOrderInfo) {
                                    if (error) return cb(error);
                                    orderInfo.parentOrderInfo = parentOrderInfo;
                                    cb(null, orderInfo);
                                })
                            });
                        });
                    } else {
                        orderModel.refundCountByOrderId(orderId, function (error, refundCountItems) {
                            let orderItems = [];
                            lodash.forEach(refundCountItems, function (val) {
                                let orderItemObj = lodash.find(orderItemArr, function (o) {
                                    return o.id == `'${val.id}'` || o.id == `'${val.parent_id}'`
                                });
                                if (orderItemObj) {
                                    if (!val.parent_id || val.type == 6) {
                                        lodash.assign(val, {
                                            refund_count: orderItemObj.refundCount,
                                            original_price: orderItemObj.unitPrice,
                                            meal_fee_number: orderItemObj.refundMealFeeItemOfPrint
                                        });
                                    } else {
                                        lodash.assign(val, {
                                            refund_count: 1,
                                            original_price: val.unit_price,
                                            meal_fee_number: orderItemObj.refundMealFeeItemOfPrint
                                        });
                                    }
                                    orderItems.push(val);
                                }
                            });
                            printerModel.getArticleSort(orderItems, function (e) {
                                orderInfo.orderItems = e;
                                if (!orderInfo.parent_order_id) return cb(null, orderInfo);
                                // 如果存在 父订单，则 订单数量 显示 父订单的值
                                orderModel.getReceiptsById(orderInfo.parent_order_id, function (error, parentOrderInfo) {
                                    orderInfo.parentOrderInfo = parentOrderInfo;
                                    cb(null, orderInfo);
                                })
                            });
                        });
                    }

                });
            },
            function (orderInfo, cb) { //关联打印机

                //orderInfo.table_number 座位号
                areaModel.getPrintMachineByTableNumber(orderInfo, function (error, tableInfo) {
                    if (error) return cb(error);
                    orderInfo.printerInfo = tableInfo;
                    cb(null, orderInfo);
                });
            },
            function (orderInfo, cb) { //关联支付项
                orderInfo.paymentItems = [];
                if (!refund) {
                    orderPaymentItemModel.listByOrderId(orderId, function (error, paymentItems) {
                        if (error) return cb(error);
                        orderInfo.paymentItems = paymentItems;
                        cb(null, orderInfo);
                    });
                } else {
                    if (totalType != 1 && orderInfo.order_state != 2 && orderInfo.order_state != 9) return cb(null, orderInfo);
                    orderPaymentItemModel.refundListByOrderId(orderId, function (error, paymentItems) {
                        if (error) return cb(error);
                        let refundAmount = (lodash.sumBy(orderInfo.orderItems, function (o) {
                            return o.refund_count * o.original_price;
                        }));
                        if (refundServicePriceItem.length > 0) {
                            for (let i = refundServicePriceItem.length - 1; i >= 0; i--) {
                                refundAmount += Math.abs(refundServicePriceItem[i].SUBTOTAL);
                            }
                        }
                        let paymentAmount = 0;
                        let obj = [];
                        lodash.forEach(paymentItems, function (val) {
                            paymentAmount += Math.abs(val.pay_value.toFixed(2));
                            obj.push(val);
                            if (paymentAmount.toFixed(2) == refundAmount.toFixed(2)) return false;
                        });

                        orderInfo.paymentItems = obj;
                        orderInfo.paymentss = obj;

                        cb(null, orderInfo);
                    });
                }
            },
            function (orderInfo, cb) { //设置店铺信息
                if (!refund) {
                    if (orderInfo.distribution_mode_id == 1 && shopDetail.isUseServicePrice == 1 && shopDetail.serviceType == 0 && (orderInfo.parent_order_id == "" || orderInfo.parent_order_id == null)) {
                        // 普通版服务费
                        orderInfo.orderItems = [...orderInfo.orderItems, {
                            'article_return': "false",
                            'article_name': shopDetail.serviceName,
                            'count': orderInfo.customer_count,
                            'orgin_count': orderInfo.customer_count,
                            // 'orgin_count': shopDetail.servicePrice == 0 ? orderInfo.customer_count : parseInt(orderInfo.service_price / shopDetail.servicePrice),
                            'original_price': shopDetail.servicePrice
                        }];
                    } else if (orderInfo.distribution_mode_id == 1 && shopDetail.isUseServicePrice == 1 && shopDetail.serviceType == 1 && (orderInfo.parent_order_id == "" || orderInfo.parent_order_id == null)) {
                        // 升级版服务费
                        if (shopDetail.isOpenSauceFee) {
                            orderInfo.orderItems = [...orderInfo.orderItems, {
                                'article_return': "false",
                                'article_name': shopDetail.sauceFeeName,
                                'count': Number(orderInfo.sauce_fee_count),
                                'orgin_count': Number(orderInfo.sauce_fee_count),
                                'original_price': shopDetail.sauceFeePrice
                            }];
                        }

                        if (shopDetail.isOpenTowelFee) {
                            orderInfo.orderItems = [...orderInfo.orderItems,{
                                'article_return': "false",
                                'article_name': shopDetail.towelFeeName,
                                'count': Number(orderInfo.towel_fee_count),
                                'orgin_count': Number(orderInfo.towel_fee_count),
                                'original_price': shopDetail.towelFeePrice
                            }];
                        }
                        if (shopDetail.isOpenTablewareFee) {
                            orderInfo.orderItems = [...orderInfo.orderItems,{
                                'article_return': "false",
                                'article_name': shopDetail.tablewareFeeName,
                                'count': Number(orderInfo.tableware_fee_count),
                                'orgin_count': Number(orderInfo.tableware_fee_count),
                                'original_price': shopDetail.tablewareFeePrice
                            }];
                        }
                    } else if (orderInfo.distribution_mode_id == 3 && shopDetail.isMealFee == 1) {
                        let mealFeeCount = lodash.sumBy(orderInfo.orderItems, function (o) {
                            return o.article_return == 'false' ? o.meal_fee_number : 0
                        });
                        orderInfo.orderItems = [...orderInfo.orderItems, {
                            'article_return': "false",
                            'article_name': shopDetail.mealFeeName,
                            'count': orderInfo.meal_all_number,
                            'orgin_count': orderInfo.meal_all_number,
                            'original_price': shopDetail.mealFeePrice ||1
                        }];
                    }
                } else {
                    if (orderInfo.distribution_mode_id == 3 && shopDetail.isMealFee == 1) {
                        let mealFeeCount = lodash.sumBy(orderInfo.orderItems, function (o) {
                            return o.article_return == 'true' && !o.parent_id ? o.meal_fee_number : 0
                        });
                        let s1 = orderInfo.orderItems;

                        orderInfo.orderItems = [...orderInfo.orderItems, {
                            'article_return': "false",
                            'article_name': shopDetail.mealFeeName,
                            'count': -mealFeeCount,
                            'orgin_count': -mealFeeCount,
                            'original_price': shopDetail.mealFeePrice
                        }];
                        let refundAmount = (lodash.sumBy(s1, function (o) {
                            return o.refund_count * o.original_price;
                        })) + mealFeeCount * shopDetail.mealFeePrice;
                        let paymentAmount = 0;
                        let obj = [];
                        lodash.forEach(orderInfo.paymentss, function (val) {
                            paymentAmount += Math.abs(val.pay_value.toFixed(2));
                            obj.push(val);
                            if (paymentAmount.toFixed(2) == refundAmount.toFixed(2)) return false;
                        });
                        orderInfo.paymentItems = obj;
                    }
                }
                orderInfo.shopDetail = shopDetail;

                cb(null, orderInfo);

            },
            function (orderInfo, cb) { //查询用户信息
                if (!orderInfo.customer_id ||orderInfo.customer_id == 0  || orderInfo.customer_id == 'undefined' || orderInfo.shopDetail.isOpenUserSign == 0) return cb(null, orderInfo);
                httpClient.network(function () {
                    httpClient.post("getCustomerConsumeInfo", { customerId: orderInfo.customer_id }, function (consumeInfo) {
                        orderInfo.consumeInfo = consumeInfo;
                        cb(null, orderInfo);
                    }, function () {
                        cb(null, orderInfo);
                    });
                }, function () {
                    cb(null, orderInfo);
                })
            }
        ], function (err, resultData) {
            if (err) {
                log(`数据问题总单打印失败`, `printUtil=>【打印总单--error】orderId：${orderId},totalType：${totalType},refund:${refund},${refund ? "orderItemArr:" + JSON.stringify(orderItemArr) : []},\n,${err.toString()}`);
                callback && callback(err);
            } else {
                if (resultData.parent_order_id && resultData.shopDetail.isOpenAddPrintTotal == 0 &&  resultData.shopDetail.allowAfterPay == 0) {
                    log(`加菜打印总单设置被关闭`, `【加菜打印总单未开启】`);
                    return callback()
                }

                var CUSTOMER_SATISFACTION = (resultData.consumeInfo && resultData.consumeInfo.CUSTOMER_SATISFACTION) || 0;
                let param = {};
                param.RESTAURANT_NAME = refund != 0 ? resultData.shopDetail.name : getNameInit(resultData.shopDetail.name, totalType);                   //店名
                param.RESTAURANT_ADDRESS = resultData.shopDetail.address;                //地址
                param.RESTAURANT_TEL = `${resultData.shopDetail.phone}`;                 //电话
                param.DISTRIBUTION_MODE = refund != 0 ? '退菜' : (resultData.distribution_mode_id == 1 ? resultData.parent_order_id ? '堂吃(加)' : '堂吃' : '外带');                //堂吃 or 外带
                param.TABLE_NUMBER = resultData.shopDetail.shopMode == 2 || resultData.shopDetail.shopMode == 7 ? resultData.ver_code : resultData.table_number;                              //桌号
                param.CUSTOMER_COUNT = (resultData.parentOrderInfo && resultData.parentOrderInfo.customer_count) || resultData.customer_count;    //就餐人数
                let orderNumber = ((resultData.parentOrderInfo && resultData.parentOrderInfo.order_number) || resultData.order_number || '999').toString();
                param.ORDER_NUMBER = orderNumber.length == 1 ? `00${orderNumber}` : orderNumber.length == 2 ? `0${orderNumber}` : orderNumber;      //订单号
                param.ORDER_ID = resultData.serial_number;                         //交易流水号
                param.BARCODE = resultData.serial_number.substring(8, 18);                         //条形码
                param.DATETIME = `${moment(+resultData.create_time).format('YYYY-MM-DD HH:mm:ss')}`;           //订单时间

                printerModel.getItemsInit(resultData.orderItems,resultData.shopDetail.printOutDetails, function (err, itemasResult) {
                    if (err) return callback && callback(err);
                    // log('总单打印菜品格式化', `【菜品格式化】订单ID：${orderId},【菜品格式化内容】:${JSON.stringify(itemasResult)}`);
                    param.ITEMS = itemasResult.concat(refundServicePriceItem);
                    param.ARTICLE_COUNT = lodash.sum(lodash.map(param.ITEMS, 'ARTICLE_TOTAL'));
                    param.ORIGINAL_AMOUNT = lodash.sum(lodash.map(param.ITEMS, 'TOTAL')).toFixed(2);                  //原价
                    param.PAYMENT_AMOUNT = refund ? 0 : (resultData.amount_with_children ? (+resultData.amount_with_children).toFixed(2) : (+resultData.order_money).toFixed(2));                       //应付
                    // console.warn(resultData.receipts)
                    // console.warn(resultData.consumption)
                    // param.PAYMENT_AMOUNT = totalType ==2  ? resultData.consumption.toFixed(2) : (resultData.receipts .toFixed(2));                       //应付
                    param.REDUCTION_AMOUNT = refund ? 0 : (param.ORIGINAL_AMOUNT - param.PAYMENT_AMOUNT).toFixed(2);                 //折扣
                    printerModel.getPaymentItemsInit(resultData.paymentItems, function (err, paymentResult) {
                        if (err) return callback && callback(err);
                        param.PAYMENT_ITEMS = paymentResult;
                        param.CUSTOMER_SATISFACTION = "★★★★★☆☆☆☆☆".slice(5 - CUSTOMER_SATISFACTION, 10 - CUSTOMER_SATISFACTION);            //客户上次评分分数
                        param.CUSTOMER_SATISFACTION_DEGREE = (resultData.consumeInfo && resultData.consumeInfo.CUSTOMER_SATISFACTION_DEGREE) || 0;     //客户平均评分分数

                        param.CUSTOMER_PROPERTY = resultData.consumeInfo? `${resultData.consumeInfo.CUSTOMER_STATUS == 1 ? "【VIP】":""} ${resultData.consumeInfo.CUSTOMER_PROPERTY}`:"-";                //客服余额
                        param.MEMO = resultData.remark;
                        param.WELCOME = resultData.shopDetail.orderWelcomeMessage;
                        printerModel.getTotalTemplate(param, function (data) {
                            if (resultData.printerInfo.length <= 0) {
                                log(`printLogs`, `printUtil=>【打印总单】：${orderId},未设置打印机！`);
                                return callback && callback(null, { msg: '未设置打印机！' });
                            } else {
                                let datas = [];

                                async.eachLimit(resultData.printerInfo, 1, function (item, ab) {
                                    if (item.range == 1){
                                        if (totalType ==2 && item.bill_of_consumption != 1){
                                            log(`区域打印机`, `【消费清单打印未开启】==>${item.ip}`);
                                            return ab();
                                        }else if (totalType ==3 && item.bill_of_account != 1){
                                            log(`区域打印机`, `【结算清单打印未开启】==>${item.ip}`);
                                            return ab();
                                        }
                                    }

                                    param.PRINTERIP = item.ip;
                                    param.PRINTERPORT = item.port;
                                    if (resultData.shopDetail.shopMode == 2 || resultData.shopDetail.shopMode == 7) {
                                        if(resultData.shopDetail.isOpenUserSign == 0 ){
                                            param.PRINTTEMPLATE = printTemplateModel.shopObj_not_user_info[resultData.shopDetail.brandId] ? printTemplateModel.shopObj_not_user_info[resultData.shopDetail.brandId] : `${printTemplateModel.REPORT}/${printTemplateModel.TOTAL_TEMPLATE_NOT_USER_INFO_48}`;
                                        }else {
                                            param.PRINTTEMPLATE = printTemplateModel.shopObj[resultData.shopDetail.brandId] ? printTemplateModel.shopObj[resultData.shopDetail.brandId] : `${printTemplateModel.REPORT}/${printTemplateModel.TOTAL_TEMPLATE_48}`;
                                        }
                                    } else {
                                        if(resultData.shopDetail.isOpenUserSign == 0 ){
                                            param.PRINTTEMPLATE = `${printTemplateModel.REPORT}/${printTemplateModel.TOTAL_TEMPLATE_NOT_USER_INFO_48}`;
                                        }else {

                                            param.PRINTTEMPLATE = `${printTemplateModel.REPORT}/${printTemplateModel.TOTAL_TEMPLATE_48}`;
                                        }
                                    }

                                    // console.log(resultData.shopDetail.isOpenUserSign)
                                    printerServiceModel.receiptsPrint(param.PRINTERIP, param.PRINTERPORT, param.PRINTTEMPLATE, data, function (err, ben) {
                                        log(`总单打印最终执行==>`, `【打印总单${err ? "失败error==>"+err : "成功==>"+ben}】 订单ID：${orderId},流水号:${param.ORDER_ID},totalType：${totalType},refund:${refund},${refund ? "orderItemArr:" + JSON.stringify(orderItemArr) : []},\n${JSON.stringify(param)}`);
                                        datas.push(err ? err : ben);
                                        ab()
                                    });
                                }, function (err) {
                                    callback && callback(err, datas);
                                });
                            }
                        });
                    });                  //付款类型列表
                })  //菜品列表
            }
        });
    });

};

/**
 * 厨打
 * @param orderId           订单ID
 * @param kitchenType       0 正常   or  1 精简版
 * @param refund            0 不退菜   or  1 退菜
 * @param orderItemArr      退菜对象    orderItemArr:[ {id:"'df0a6deb982b4e57a894ce57f68211c4'",count:2}]
 * @param autoPrint         // 1; 自动打印 0 手动打印
 * @param callback
 */
printUtil.printKitchen = function (orderId, autoPrint =0, kitchenType = 0,  refund = 0, orderItemArr = [], callback) {

    if (typeof callback != 'function') {
        callback = function () { };
    }

    let kitchenPrintTemplate = kitchenType ? `${printTemplateModel.REPORT}/${printTemplateModel.KITCHEN_TICKET_LRF_TEMPLATE_48}` : `${printTemplateModel.REPORT}/${printTemplateModel.KITCHEN_TICKET_TEMPLATE_48}`;

    if (generalUtil.isEmpty(orderId)) return callback && callback("请输入订单ID");

    log('厨房打印第一步', `【发起厨房打印】【${autoPrint?'自动打印':'手动打印'} 】 orderId：${orderId},refund:${refund},${refund ? "orderItemArr:" + JSON.stringify(orderItemArr) : []}`);

    if (refund != 0) {
        if (typeof orderItemArr != 'object' || orderItemArr.length == 0) {
            return callback && callback("请输入退菜ID");
        } else {
            lodash.forEach(orderItemArr, function (val) {
                lodash.assign(val, { id: "'" + val.id + "'" });
            });
        }
    }

    async.waterfall([
        function (cb) { //关联订单信息
            orderModel.getReceiptsById(orderId, function (error, orderInfo) {
                if (error) return cb(error);
                if (refund == 0) {
                    orderModel.printByOrderId(orderId, orderInfo.distribution_mode_id, function (error, orderItems) {
                        if (error) return cb(error);
                        var orderItems = lodash.filter(orderItems, function (o) { return o.orgin_count != o.refund_count; });
                        printerModel.getArticleSort(orderItems, function (e) {
                            orderInfo.orderItems = e;
                            if (!orderInfo.parent_order_id) return cb(null, orderInfo);
                            // 如果存在 父订单，则 订单数量 显示 父订单的值
                            orderModel.getReceiptsById(orderInfo.parent_order_id, function (error, parentOrderInfo) {
                                if (error) return cb(error);
                                orderInfo.parentOrderInfo = parentOrderInfo;
                                cb(null, orderInfo);
                            })
                        });
                    });
                } else {
                    orderItemModel.printRefundByOrderItemId(orderItemArr, orderInfo.distribution_mode_id, function (error, orderItemsReslut) {
                        if (error) return cb(error);
                        let orderItems = [];
                        lodash.forEach(orderItemsReslut, function (val) {
                            let s1 = lodash.find(orderItemArr, function (o) { return o.id == `'${val.id}'` || o.id == `'${val.parent_id}'` });
                            lodash.assign(val, { count: s1.count });
                            orderItems.push(val);
                        });
                        printerModel.getArticleSort(orderItems, function (e) {
                            orderInfo.orderItems = e;
                            if (!orderInfo.parent_order_id) return cb(null, orderInfo);
                            // 如果存在 父订单，则 订单数量 显示 父订单的值
                            orderModel.getReceiptsById(orderInfo.parent_order_id, function (error, parentOrderInfo) {
                                orderInfo.parentOrderInfo = parentOrderInfo;
                                cb(null, orderInfo);
                            })
                        });
                    });
                }
            });
        },
        function (orderInfo, cb) { //设置店铺信息
            shopDetailModel.getShopDetailInfo(orderInfo.shop_detail_id, function (error, shopDetail) {
                if (error) return cb(error);
                orderInfo.shopDetail = shopDetail;
                cb(null, orderInfo);
            });
        },
        function (orderInfo, cb) { //关联打印机
            let results = [];
            let virtualResults = [];
            let recommendResults = [];
            let stickerResults = [];
            async.eachLimit(orderInfo.orderItems, 1, function (item, ab) {
                if (
                    (item.type !=4 && item.type !=6 &&item.virtual_id && item.article_type == 1) ||
                    (item.type ==4 && orderInfo.shopDetail.printType!=0 &&item.virtual_id && item.article_type == 1 )
                ) {    //虚拟餐品
                    articleKitchenModel.getVirtualKitchenByVirtualId(item.virtual_id, orderInfo.distribution_mode_id, function (error, resBen) {
                        if (error) return ab(error);
                        if (resBen.length == 0) return ab();
                        async.eachLimit(resBen, 1, function (ben, ef) {
                            printerModel.getVirtualKitchenData(item, ben, orderInfo.shopDetail, virtualResults, function (data) {    //厨打不分
                                virtualResults = data;
                                return ef();
                            })
                        }, function (error) {
                            if (error) return ab(error);
                            return ab(null);
                        });
                    })
                } else if (item.type == 6){         //推荐餐品
                    articleKitchenModel.getRecommendKitchenByRecommendId(item.recommend_id,orderInfo.distribution_mode_id,(error,resBen)=>{
                        if (error) return ab(error);
                        if (resBen.length == 0) return ab();
                        async.eachLimit(resBen, 1, function (ben, ef) {
                            if (ben.recommend_print_type == 0) {
                                // articleKitchenModel.selectByArticleId(item.article_id, orderInfo.distribution_mode_id,  (error, resBen)=> {
                                //     if (error) return ab(error);
                                //
                                //     resBen
                                // });
                                return ef();
                            }else {
                                printerModel.getRecommendKitchenData(item, ben, orderInfo.shopDetail, recommendResults, function (data) {    //厨打不分
                                    recommendResults = data;
                                    return ef();
                                })
                            }
                        }, function (error) {
                            if (error) return ab(error);
                            return ab(null);
                        });
                    });
                } else {
                    articleKitchenModel.selectByArticleId(item.article_id, orderInfo.distribution_mode_id, function (error, resBen) {
                        if (error) return ab(error);
                        // orderInfo.shopDetail.splitKitchen = 1;  // 0厨打不分单 1厨打分单
                        // orderInfo.shopDetail.printType = 0;  // 套餐 0：整单出  1：分单出
                        if (resBen.length > 0) {
                            async.eachLimit(resBen, 1, function (ben, ef) {
                                if (+ben.ticket_type == 0 && +item.ticket_type != 1) {
                                    if (orderInfo.shopDetail.splitKitchen && !orderInfo.shopDetail.printType) {  //  厨打分单,套餐不分
                                        printerModel.getArticleSplitKitchenData(item, ben, orderInfo.shopDetail, results, function (data) {
                                            results = data;
                                            return ef();
                                        })
                                    } else if (orderInfo.shopDetail.splitKitchen && orderInfo.shopDetail.printType) { //  厨打分单,套餐分=
                                        printerModel.getAllSplitKitchenData(item, ben, orderInfo.shopDetail, results, function (data) {
                                            results = data;
                                            return ef();
                                        })
                                    } else if (!orderInfo.shopDetail.splitKitchen && orderInfo.shopDetail.printType) { //  厨打不分单,套餐分=
                                        printerModel.getNotDivideKitchenNotMealData(item, ben, orderInfo.shopDetail, results, function (data) {
                                            results = data;
                                            return ef();
                                        })
                                    } else {
                                        printerModel.getNotDivideKitchenData(item, ben, orderInfo.shopDetail, results, function (data) {    //厨打不分,套餐不分
                                            results = data;
                                            return ef();
                                        })
                                    }
                                } else {
                                    if (orderInfo.shopDetail.splitKitchen && !orderInfo.shopDetail.printType) {  //  厨打分单,套餐不分
                                        printerModel.getStickerArticleSplitKitchenData(item, ben, orderInfo.shopDetail, stickerResults, function (data) {
                                            stickerResults = data;
                                            return ef();
                                        })
                                    } else if (orderInfo.shopDetail.splitKitchen && orderInfo.shopDetail.printType) { //  厨打分单,套餐分=
                                        printerModel.getStickerAllSplitKitchenData(item, orderInfo.shopDetail, stickerResults, orderInfo.orderItems, ben, function (data) {
                                            stickerResults = data;
                                            return ef();
                                        })
                                    } else if (!orderInfo.shopDetail.splitKitchen && orderInfo.shopDetail.printType) { //  厨打不分单,套餐分=
                                        printerModel.getStickerNotDivideKitchenNotMealData(item, orderInfo.shopDetail, stickerResults, orderInfo.orderItems, ben, function (data) {
                                            stickerResults = data;
                                            return ef();
                                        })
                                    } else {
                                        printerModel.getStickerNotDivideKitchenData(item, ben, orderInfo.shopDetail, stickerResults, function (data) {    //厨打不分,套餐不分
                                            stickerResults = data;
                                            return ef();
                                        })
                                    }
                                }
                            }, function (error) {
                                if (error) return ab(error);
                                return ab(null);
                            });
                        } else {
                            if (+item.ticket_type == 1) {
                                printerModel.getStickerAllSplitKitchenData(item, orderInfo.shopDetail, stickerResults, orderInfo.orderItems, {}, function (data) {
                                    stickerResults = data;
                                    return ab();
                                })
                            } else {
                                if (orderInfo.shopDetail.splitKitchen && !orderInfo.shopDetail.printType) {  //  厨打分单,套餐不分
                                    printerModel.getArticleSplitKitchenData(item, {}, orderInfo.shopDetail, results, function (data) {
                                        results = data;
                                        return ab();
                                    })
                                } else if (orderInfo.shopDetail.splitKitchen && orderInfo.shopDetail.printType) { //  厨打分单,套餐分=
                                    printerModel.getAllSplitKitchenData(item, {}, orderInfo.shopDetail, results, function (data) {
                                        results = data;
                                        return ab();
                                    })
                                } else if (!orderInfo.shopDetail.splitKitchen && orderInfo.shopDetail.printType) { //  厨打不分单,套餐分=
                                    printerModel.getNotDivideKitchenNotMealData(item, {}, orderInfo.shopDetail, results, function (data) {
                                        results = data;
                                        return ab();
                                    })
                                } else {
                                    printerModel.getNotDivideKitchenData(item, {}, orderInfo.shopDetail, results, function (data) {    //厨打不分,套餐不分
                                        results = data;
                                        return ab();
                                    })
                                }
                            }
                        }
                    });
                }
            }, function (error) {
                if (error) {
                    return cb(error);
                } else {
                    orderInfo.kitchenPrintList = results.concat(virtualResults,recommendResults);
                    orderInfo.stickerKitchenPrintList = stickerResults;
                    cb(null, orderInfo);
                }
            });
        },
        function (orderInfo, cb) { //查询用户信息
            if (!orderInfo.customer_id ||orderInfo.customer_id == 0  || orderInfo.customer_id == 'undefined'|| orderInfo.shopDetail.isOpenUserSign == 0) return cb(null, orderInfo);
            httpClient.network(function () {
                httpClient.post("getCustomerConsumeInfo", { customerId: orderInfo.customer_id }, function (consumeInfo) {
                    orderInfo.consumeInfo = consumeInfo;
                    cb(null, orderInfo);
                }, function () {
                    cb(null, orderInfo);
                });
            }, function () {
                cb(null, orderInfo);
            })
        }
    ], function (err, resultData) {
        if (err) {
            printKitchenExecuteNumber[orderId] = printKitchenExecuteNumber[orderId] != null ? ++printKitchenExecuteNumber[orderId] : 0;
            if (printKitchenExecuteNumber[orderId] <= 3) {
                setTimeout(function () {
                    printUtil.printKitchen(orderId, kitchenType, refund, orderItemArr, callback);
                    log(`printLogs`, `printUtil=>【打印厨打--失败error ${printKitchenExecuteNumber[orderId]} 】orderId：${orderId},refund:${refund},${refund ? "orderItemArr:" + JSON.stringify(orderItemArr) : []},\n${err.toString()}`);
                }, 1000);
            } else {
                log(`printLogs`, `printUtil=>【打印厨打--失败error ${printKitchenExecuteNumber[orderId]} 】orderId：${orderId},refund:${refund},${refund ? "orderItemArr:" + JSON.stringify(orderItemArr) : []},\n${err.toString()}`);
                delete printKitchenExecuteNumber[orderId];
                return callback && callback(err.toString());
            }
        } else {
            let param = {};
            let CUSTOMER_SATISFACTION = (resultData.consumeInfo && resultData.consumeInfo.CUSTOMER_SATISFACTION) || 0;
            param.RESTAURANT_TEL = `${resultData.shopDetail.phone}`;      //电话
            param.DISTRIBUTION_MODE = refund != 0 ? '退菜' : (resultData.distribution_mode_id == 1 ? resultData.parent_order_id ? '堂吃(加)' : '堂吃' : '外带');
            param.TABLE_NUMBER = resultData.shopDetail == 2 || resultData.shopDetail.shopMode == 7 ? resultData.ver_code : resultData.table_number;
            let orderNumber = ((resultData.parentOrderInfo && resultData.parentOrderInfo.order_number) || resultData.order_number || '999').toString();//订单号
            param.ORDER_NUMBER = orderNumber.length == 1 ? `00${orderNumber}` : orderNumber.length == 2 ? `0${orderNumber}` : orderNumber;      //订单号//桌号
            param.ORDER_ID = resultData.serial_number;                         //交易流水号
            param.BARCODE = resultData.serial_number.substring(8, 18);                         //条形码
            param.DATETIME = `${moment(+resultData.create_time).format('YYYY-MM-DD HH:mm:ss')}`;           //订单时间
            param.ORIGINAL_AMOUNT = resultData.original_amount;                  //原价
            param.CUSTOMER_SATISFACTION = "★★★★★☆☆☆☆☆".slice(5 - CUSTOMER_SATISFACTION, 10 - CUSTOMER_SATISFACTION);            //客户上次评分分数           //客户上次评分分数
            param.CUSTOMER_SATISFACTION_DEGREE = (resultData.consumeInfo && resultData.consumeInfo.CUSTOMER_SATISFACTION_DEGREE) || 0;     //客户平均评分分数
            param.CUSTOMER_PROPERTY = resultData.consumeInfo? `${resultData.consumeInfo.CUSTOMER_STATUS == 1 ? "【VIP】":""} ${resultData.consumeInfo.CUSTOMER_PROPERTY}`:"-";                //客服余额
            param.MEMO = resultData.remark || '-';                             //备注
            // 打印控制
            printerModel.getTotalTemplate(param, function (data) {
                async.parallel({
                    kitchenPrintList: function (done) {
                        let prList = [];
                        if (resultData.kitchenPrintList.length == 0) return done(null, prList);
                        async.eachLimit(resultData.kitchenPrintList, 1, function (item, ab) {
                            if (!item.ip) return ab();
                            param.PRINTERIP = item.ip;
                            param.PRINTERPORT = item.port;
                            if (resultData.shopDetail.shopMode == 2 || resultData.shopDetail.shopMode == 7) {
                                if (!kitchenType) {
                                    if (resultData.shopDetail.isOpenUserSign == 0 ){
                                        param.PRINTTEMPLATE = `${printTemplateModel.REPORT}/${printTemplateModel.KITCHEN_TICKET_BARCODE_TEMPLATE_NOT_USER_INFO_48}`;
                                    }else {
                                        param.PRINTTEMPLATE = `${printTemplateModel.REPORT}/${printTemplateModel.KITCHEN_TICKET_BARCODE_TEMPLATE_48}`;
                                    }
                                }else {
                                    param.PRINTTEMPLATE = `${printTemplateModel.REPORT}/${printTemplateModel.KITCHEN_TICKET_LRF_BARCODE_TEMPLATE_48}`;
                                }
                            } else {
                                if (!kitchenType) {
                                    if (resultData.shopDetail.isOpenUserSign == 0 ){
                                        param.PRINTTEMPLATE = `${printTemplateModel.REPORT}/${printTemplateModel.KITCHEN_TICKET_TEMPLATE_NOT_USER_INFO_48}`;
                                    }else {
                                        param.PRINTTEMPLATE = `${printTemplateModel.REPORT}/${printTemplateModel.KITCHEN_TICKET_TEMPLATE_48}`;
                                    }

                                }else {
                                    param.PRINTTEMPLATE = `${printTemplateModel.REPORT}/${printTemplateModel.KITCHEN_TICKET_LRF_TEMPLATE_48}`;
                                }
                            }
                            data.ITEMS = item.ITEMS;
                            printerServiceModel.receiptsPrint(param.PRINTERIP, param.PRINTERPORT, param.PRINTTEMPLATE, data, function (err, ben) {
                                log(`厨房打印==>`, `【小票打印厨打${err ? "失败error==>"+err : "成功==>"+ben}】 订单ID：${orderId},流水号:${param.ORDER_ID},『${JSON.stringify(param)}』\n【打印数据】:${JSON.stringify(data.ITEMS)}`);
                                err ? prList.push(err) : prList.push(ben);
                                ab()
                            });
                        }, function (err) {
                            if (err) return done(err.toString());
                            return done(null, prList)

                        });
                    },
                    stickerKitchenPrintList: function (done) {
                        let lbList = [];
                        if (resultData.stickerKitchenPrintList.length == 0) return done(null, lbList);
                        let num = 1;
                        let numTotal = resultData.stickerKitchenPrintList.length;
                        async.eachLimit(resultData.stickerKitchenPrintList, 1, function (item, ab) {
                            if (!item.ip) return ab();
                            let lbObj = {
                                ORDER_ID:resultData.serial_number,
                                ip: item.ip,
                                port: item.port,
                                CODE: `${resultData.shopDetail.shopMode == 2 || resultData.shopDetail.shopMode == 7? resultData.ver_code : resultData.table_number}`,
                                ARTICLE_NAME: item.ARTICLE_NAME,
                                ARTICLE_COUNT: item.ARTICLE_COUNT,
                                ARTICLE_PRICE: (item.ARTICLE_PRICE * item.ARTICLE_COUNT).toFixed(2),
                                SPEC: item.SPEC,
                                RESTAURANT_NAME: `${resultData.shopDetail.name}`,
                                ARTICLE_NUMBER: `${num}/${numTotal}`,
                                DISTRIBUTION_MODE: refund != 0 ? '退菜' : (resultData.distribution_mode_id == 1 ? resultData.parent_order_id ? '堂吃(加)' : '堂吃' : '外带'),
                                CUSTOMER_TEL: `${resultData.shopDetail.phone}`,
                                PRINTTEMPLATE: `./report/restaurant_label.xml`,
                                DATETIME: `${moment(+resultData.create_time).format('YYYY-MM-DD HH:mm:ss')}`
                            };
                            printerServiceModel.stickersPrint(lbObj.ip, lbObj.port, lbObj.PRINTTEMPLATE, lbObj, function (err, ben) {
                                log(`贴纸打印==>`, `【贴纸打印厨打${err ? "失败error==>"+err : "成功==>"+ben}】：『${orderId}』, 『refund:${refund}』,『${refund ? "orderItemArr:" + JSON.stringify(orderItemArr) : []}』,\n 『${JSON.stringify(lbObj)}』`);
                                err ? lbList.push(err) : lbList.push(ben);
                                num++;
                                ab()
                            })
                        }, function (err) {
                            if (err) return done(err.toString());
                            return done(null, lbList)
                        });
                    },
                }, function (err, results) {
                    callback && callback(err, results);
                });
            });

            delete printKitchenExecuteNumber[orderId];
        }
    });
};

/**
 * 打印第三方平台外卖总单
 * @param platformOrderId
 * @param callback
 */
printUtil.printPlatformTotal = function (platformOrderId, callback) {
    let conditions = {
        platformOrderId: platformOrderId
    };
    async.parallel({
        printer: function (cb) {
            let conditions = {
                printType: 2,
                range: 0,
                ticketType: 0,
                supportWaimai: 1
            };

            printer.getPrinterByPrintType(conditions, function (err, data) {
                if (err) return cb(err);
                cb(null, data);
            });
        },
        platformOrder: function (cb) {
            platformOrder.getPlatformOrderByPlatformOrderId(conditions, function (err, data) {
                if (err) return cb(err);
                cb(null, data);
            });
        },
        platformOrderDetail: function (cb) {
            platformOrder.getPlatformOrderDetailByPlatformOrderId(conditions, function (err, data) {
                if (err) return cb(err);
                cb(null, data);
            });
        },
        shopDetailModel: function (cb) {
            shopDetailModel.getShopDetailInfo(conditions, function (err, data) {
                if (err) return cb(err);
                cb(null, data)
            });
        }
    }, function (err, results) {
        if (err) {
            log(`printLogs`, `printPlatformTotal =>${results.platformOrder.type == 1 ? "【饿了么外卖】" : "【美团外卖】"}总单-失败：${platformOrderId},\n,${err.toString()}`);
            return callback && callback(err.toString());
        }
        if (!results.printer.length) {
            log(`printLogs`, `printPlatformTotal => 没有找到打印机：${platformOrderId}`);
            return callback && callback("没有找到打印机");
        }
        if (!results.platformOrder) {
            log(`printLogs`, `printPlatformTotal => 没有找到外卖总订单数据：${platformOrderId}`);
            return callback && callback("没有找到外卖总订单数据");
        }
        if (!results.platformOrderDetail.length) {
            log(`printLogs`, `printPlatformTotal => 没有找到外卖订单详情数据：${platformOrderId}`);
            return callback && callback("没有找到外卖订单详情数据");
        }

        let param = {};
        param.RESTAURANT_NAME = results.shopDetailModel.name;              //店名
        param.PLATFORM_NAME = results.platformOrder.type == 1 ? "饿了么外卖" : "美团外卖";              //平台名称
        param.PAYTYPE = results.platformOrder.payType;
        param.RESTAURANT_ADDRESS = results.platformOrder.address;
        let orderNumber = results.platformOrder.orderNumber.toString() || "001";

        param.ORDER_NUMBER = orderNumber.length == 1 ? `00${orderNumber}` : orderNumber.length == 2 ? `0${orderNumber}` : orderNumber;     //001
        param.ORDER_ID = results.platformOrder.platformOrderId;   //流水号
        param.DATETIME = moment(+results.platformOrder.orderCreateTime).format('YYYY-MM-DD HH:mm:ss');  //日期
        param.MEMO = results.platformOrder.remark;                       //日期
        param.ITEMS = [];
        param.CUSTOMER_ADDRESS = results.platformOrder.address;
        param.USER_NAME = results.platformOrder.name;
        param.USER_MOBILE = results.platformOrder.phone;
        param.ARTICLE_COUNT = +lodash.sumBy(results.platformOrderDetail, 'quantity');
        param.ORIGINAL_AMOUNT = results.platformOrder.originalPrice.toFixed(2);
        param.PAYMENT_AMOUNT = results.platformOrder.totalPrice.toFixed(2);
        param.REDUCTION_AMOUNT = (param.ORIGINAL_AMOUNT - param.PAYMENT_AMOUNT).toFixed(2);
        lodash.forEach(results.platformOrderDetail, function (val) {
            let obj = {
                ARTICLE_NAME: val.showName,
                SUBTOTAL: (+val.price * +val.quantity).toFixed(2),
                ARTICLE_COUNT: val.quantity
            };
            param.ITEMS.push(obj)
        });
        let datas = [];
        async.eachLimit(results.printer, 1, function (item, ab) {
            param.PRINTERIP = item.ip;
            param.PRINTERPORT = item.port;
            printerServiceModel.receiptsPrint(param.PRINTERIP, param.PRINTERPORT, `${printTemplateModel.REPORT}/${printTemplateModel.PLATFORM_TOTAL_TEMPLATE_48}`, param, function (err, ben) {
                log(`printLogs`, ` printPlatformTotal  =>${results.platformOrder.type == 1 ? "【饿了么外卖】" : "【美团外卖】"}总单：${platformOrderId},\n,${JSON.stringify(param)}`);
                datas.push(err ? err : ben);
                ab()
            });
        }, function (err) {
            callback && callback(err || null, datas);
        });
    });
};

/**
 * 打印第三方外卖平台的厨打
 * @param msg
 * @param session
 * @param next
 */
printUtil.printPlatformKitchen = function (platformOrderId, callback) {

    let conditions = {
        platformOrderId: platformOrderId
    };

    async.parallel({
        platformOrder: function (cb) {
            platformOrder.getPlatformOrderByPlatformOrderId(conditions, function (err, data) {
                if (err) return cb(err);
                cb(null, data)
            });
        },
        platformOrderDetail: function (cb) {
            platformOrder.getPlatformOrderDetailAndArticleByPlatformOrderId(conditions, function (err, data) {
                if (err) return cb(err);
                cb(null, data)
            });
        },
        shopDetailModel: function (cb) {
            shopDetailModel.getShopDetailInfo(conditions, function (err, data) {
                if (err) return cb(err);
                cb(null, data)
            });
        },
    }, function (err, results) {
        if (err) {
            return callback && callback(err);
        }
        if (!results.platformOrder) {
            log(`printLogs`, `printPlatformKitchen => 没有找到外卖总订单数据：${platformOrderId}`);
            return callback && callback("没有找到外卖总订单数据");
        }
        if (!results.platformOrderDetail.length) {
            log(`printLogs`, `printPlatformKitchen => 没有找到外卖订单详情数据：${platformOrderId}`);
            return callback && callback("没有找到外卖订单详情数据");
        }

        let param = {};
        param.PLATFORM_NAME = results.platformOrder.type == 1 ? "饿了么外卖" : "美团外卖";              //平台名称
        let orderNumber = results.platformOrder.orderNumber.toString();
        param.ORDER_NUMBER = orderNumber.length == 1 ? `00${orderNumber}` : orderNumber.length == 2 ? `0${orderNumber}` : orderNumber;     //001
        param.ORDER_ID = results.platformOrder.platformOrderId;   //流水号
        param.DATETIME = moment(+results.platformOrder.orderCreateTime).format('YYYY-MM-DD HH:mm:ss');  //日期
        param.MEMO = results.platformOrder.remark;                       //日期                   //日期
        //厨打是否拆分  0  = 不拆分 1 拆分
        param.ITEMS = [];
        if (results.shopDetailModel.splitKitchen) {
            let datas = [];
            let numTotal = lodash.sumBy(results.platformOrderDetail, function (o) {
                return o.ticket_type == 1 ? o.quantity : 0;
            });
            let num = 1;
            async.eachLimit(results.platformOrderDetail, 1, function (item, ab) {
                let i = 0;
                async.whilst(
                    function () {
                        return i < +item.quantity;
                    },
                    function (ef) {
                        if (item.ticket_type == 0) {
                            param.ITEMS = [{'ARTICLE_NAME': item.show_name, 'ARTICLE_COUNT': 1}];
                            param.PRINTERIP = item.ip;
                            param.PRINTERPORT = item.port;
                            printerServiceModel.receiptsPrint(param.PRINTERIP, param.PRINTERPORT, `${printTemplateModel.REPORT}/${printTemplateModel.PLATFORM_KITCHEN_TICKET_TEMPLATE_48}`, param, function (err, ben) {
                                datas.push(err ? err : ben);
                                i++;
                                if (i == +item.quantity) return ab();
                                setTimeout(ef, 0);
                            })
                        } else {
                            let lbObj = {
                                ip: item.ip,
                                port: item.port,
                                CODE: `${item.phone.substring(8, 12)}`,
                                ARTICLE_NAME: item.show_name,
                                ARTICLE_COUNT: 1,
                                ARTICLE_PRICE: `￥${item.price.toFixed(2)}`,
                                SPEC: '',
                                BRAND_NAME: `${results.shopDetailModel.brandName}`,
                                RESTAURANT_NAME: `${results.shopDetailModel.name}`,
                                ARTICLE_NUMBER: `${num}/${numTotal}`,
                                DISTRIBUTION_MODE: results.platformOrder.type == 1 ? "饿了么" : "美团",
                                CUSTOMER_TEL: `${results.shopDetailModel.phone}`,
                                PRINTTEMPLATE: `${printTemplateModel.REPORT}/${printTemplateModel.RESTAURANT_PLATFORM_LABEL}`,
                                DATETIME: `${moment(+item.order_create_time).format('YYYY-MM-DD HH:mm:ss')}`
                            };
                            printerServiceModel.stickersPrint(lbObj.ip, lbObj.port, lbObj.PRINTTEMPLATE, lbObj, function (err, ben) {
                                fileUtil.appendFile(`printLogs`, `${msg.__route__}=>${results.platformOrder.type == 1 ? "【饿了么外卖】" : "【美团外卖】" }贴纸厨打：${JSON.stringify(param)}`);
                                datas.push(err ? err : ben);
                                i++;
                                num++;
                                if (i == +item.quantity) return ab();
                                setTimeout(ef, 0);
                            });
                        }
                    },
                    function (err) {
                        return ab(err)
                    }
                );
            }, function (err) {
                callback && callback(err || null, datas);
            });
        } else {
            let datas = [];
            let numTotal = (lodash.filter(results.platformOrderDetail, function (o) {
                return o.ticket_type == 1;
            })).length;
            let num = 1;
            async.eachLimit(results.platformOrderDetail, 1, function (item, ab) {

                if (item.ticket_type == 0) {
                    param.ITEMS = [{'ARTICLE_NAME': item.show_name, 'ARTICLE_COUNT': item.quantity}];
                    param.PRINTERIP = item.ip;
                    param.PRINTERPORT = item.port;
                    printerServiceModel.receiptsPrint(param.PRINTERIP, param.PRINTERPORT, `${printTemplateModel.REPORT}/${printTemplateModel.PLATFORM_KITCHEN_TICKET_TEMPLATE_48}`, param, function (err, ben) {
                        datas.push(err ? err : ben);
                        ab()
                    })
                } else {

                    let lbObj = {
                        ip: item.ip,
                        port: item.port,
                        CODE: `${item.phone.substring(8, 12)}`,
                        ARTICLE_NAME: item.show_name,
                        ARTICLE_COUNT: item.quantity,
                        ARTICLE_PRICE: `￥${item.price.toFixed(2)}`,
                        SPEC: '',
                        BRAND_NAME: `${results.shopDetailModel.brandName}`,
                        RESTAURANT_NAME: `${results.shopDetailModel.name}`,
                        ARTICLE_NUMBER: `${num}/${numTotal}`,
                        DISTRIBUTION_MODE: results.platformOrder.type == 1 ? "饿了么" : "美团",
                        CUSTOMER_TEL: `${results.shopDetailModel.phone}`,
                        PRINTTEMPLATE: `${printTemplateModel.REPORT}/${printTemplateModel.RESTAURANT_PLATFORM_LABEL}`,
                        DATETIME: `${moment(+item.order_create_time).format('YYYY-MM-DD HH:mm:ss')}`
                    };
                    printerServiceModel.stickersPrint(lbObj.ip, lbObj.port, lbObj.PRINTTEMPLATE, lbObj, function (err, ben) {
                        err ? datas.push(err) : datas.push(ben);
                        num++;
                        ab()
                    });
                }

            }, function (err) {
                callback && callback(err || null, datas);
            });
        }
    });
};


let getNameInit = function (name, totalType) {
    if (totalType == 2) {
        return name + '\n（消费清单）';
    } else if (totalType == 3) {
        return name + '\n（结账清单）';
    } else {
        return name;
    }
};



//--------------------新厨打方式  动线方式---


/**
 * 动线厨打
 * @param orderId           订单ID
 * @param autoPrint         // 1; 自动打印 0 手动打印
 * @param kitchenType       0 正常   or  1 精简版
 * @param callback
 */
printUtil.printNewKitchen = function (msg, session, next) {
    let orderId = msg.orderId;
    let autoPrint = msg.autoPrint || 0;   // 1; 自动 0 手动
    let kitchenType = msg.kitchenType || 0;   // 0 正常   or  1 精简版
    if (result.isEmpty(orderId)) return result.error(next, "请输入订单ID", msg);

};
