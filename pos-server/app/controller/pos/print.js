/**
 * @author wxh on 2018/6/4
 * @copyright
 * @desc
 */
const result = require("../../util/resultUtil");
const dateUtil = require("../../util/dateUtil");
const generalUtil = require("../../util/generalUtil");
const { log } = require("../../util/fileUtil");
const httpClient = require("../../util/httpClient");

const async = require("async");
const lodash = require("lodash");
const moment = require("moment");

const orderModel = require("../../model/pos/order");
const orderItemModel = require("../../model/pos/orderItem");
const printerModel = require("../../model/pos/printer");
const printerServiceModel = require("../../model/printer-connector/printerService");
const shopDetailModel = require("../../model/pos/shopDetail");
const articleKitchenModel = require("../../model/pos/articleKitchen");
const articleKitchenPrinterModel = require("../../model/pos/articleKitchenPrinter");
const printTemplateModel = require("../../constant/printTemplateModel");
// const { linksPrinter, formatInfo, splitOrder } = require('./printerLink.js')

//  厨打打印次数
let printKitchenExecuteNumber = {};
/**
 * 动线厨打
 * @param msg
 * @param callback
 * @returns {*}
 */
exports.printNewKitchen = function (msg, callback) {

    // test
    let orderId = msg.orderId;
    // let orderId = '57cad8c0c63d462da32a9c3f468ac385'
    // let orderId = 'a517b077928c4488bcaa5226c9541453'

    let autoPrint = msg.autoPrint || 0;   // 1; 自动 0 手动
    let totalType = msg.totalType || 1;   // 1=先付， 2=后付消费、3= 后付结算
    let refund = msg.refund || 0;   // 0 不退菜   or  1 退菜
    let orderItemArr = msg.orderItemArr || [];    //退菜对象    orderItemArr:[ {id:"'df0a6deb982b4e57a894ce57f68211c4'",count:2}]
    if (result.isEmpty(orderId)) return callback("请输入订单ID");

    log('多动线厨房打印第一步', `【发起厨房打印】【${autoPrint ? '自动打印' : '手动打印'} 】 orderId：${orderId},refund:${refund},${refund ? "orderItemArr:" + JSON.stringify(orderItemArr) : []}`);

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
                    orderModel.newPrintByOrderId(orderId, function (error, orderItems) {
                        if (error || orderItems.length == 0) return cb(error || '未找到需要打印的菜品');
                        var orderItems = lodash.filter(orderItems, function (o) { return o.orgin_count != o.refund_count; });
                        printerModel.getArticleSort(orderItems, function (e) {
                            orderInfo.orderItems = e;
                            if (!orderInfo.parent_order_id) return cb(null, orderInfo);
                            // 如果存在 父订单，则订单数量 显示 父订单的值
                            orderModel.getReceiptsById(orderInfo.parent_order_id, function (error, parentOrderInfo) {
                                if (error) return cb(error);
                                orderInfo.parentOrderInfo = parentOrderInfo;
                                cb(null, orderInfo);
                            })
                        });
                    });
                } else {
                    orderItemModel.newPrintRefundByOrderItemId(orderItemArr, orderInfo.distribution_mode_id, function (error, orderItemsReslut) {
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
        function (orderInfo, cb) { //获取店铺设置信息
            shopDetailModel.getShopDetailFindOne(function (error, shopDetail) {
                if (error) return cb(error);
                orderInfo.shopDetail = shopDetail;
                cb(null, orderInfo);
            });
        },
        function (orderInfo, cb) { //关联打印机
            let results = [];
            let stickerResults = [];

            // 订单拆分
            splitOrder(orderInfo)

            async.eachLimit(orderInfo.normalOrders, 1, function (item, ab) {
                linksPrinter.queueOrders(item, orderInfo).then(resBen => {
                    // 没有查询到打印机
                    if(Array.isArray(resBen)&&resBen.length===0){
                        return ab(null)
                    }
                    return formatInfo(item, orderInfo, results, stickerResults)
                    .then(() => {
                        return ab(null, [])
                    })
                }).catch(err => {ab(err) }) 
            }, function (error) {
                if (error) {
                    console.log(error)
                    return cb(error);
                } else {
                    // test
                    // linksPrinter.loggroups()
                    log(`printLogs`,`
                    -------------------------------小票------------------------------
                    ${JSON.stringify(results, null,2)}
                    -------------------------------贴纸------------------------------
                    ${JSON.stringify(stickerResults, null,2)}
                    `)

                    orderInfo.kitchenPrintList = results
                    orderInfo.stickerKitchenPrintList = stickerResults

                    cb(null, orderInfo);
                }
            });
        },
        function (orderInfo, cb) { //查询用户信息
            if (!orderInfo.customer_id || orderInfo.customer_id == 0 || orderInfo.customer_id == 'undefined') return cb(null, orderInfo);
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
                    // test
                    // exports.printNewKitchen(msg, callback)
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
            param.TABLE_NUMBER = resultData.shopDetail.shopMode == 2 || resultData.shopDetail.shopMode == 7 ? resultData.ver_code : resultData.table_number;
            let orderNumber = ((resultData.parentOrderInfo && resultData.parentOrderInfo.order_number) || resultData.order_number || '999').toString();//订单号
            param.ORDER_NUMBER = orderNumber.length == 1 ? `00${orderNumber}` : orderNumber.length == 2 ? `0${orderNumber}` : orderNumber;      //订单号//桌号
            param.ORDER_ID = resultData.serial_number;                         //交易流水号
            param.BARCODE = resultData.serial_number.substring(8, 18);                         //条形码
            param.DATETIME = `${moment(+resultData.create_time).format('YYYY-MM-DD HH:mm:ss')}`;           //订单时间
            param.ORIGINAL_AMOUNT = resultData.original_amount;                  //原价
            param.CUSTOMER_SATISFACTION = "★★★★★☆☆☆☆☆".slice(5 - CUSTOMER_SATISFACTION, 10 - CUSTOMER_SATISFACTION);            //客户上次评分分数           //客户上次评分分数
            param.CUSTOMER_SATISFACTION_DEGREE = (resultData.consumeInfo && resultData.consumeInfo.CUSTOMER_SATISFACTION_DEGREE) || 0;     //客户平均评分分数
            param.CUSTOMER_PROPERTY = (resultData.consumeInfo && resultData.consumeInfo.CUSTOMER_PROPERTY) || '-';                //客服余额
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
                                // if (!kitchenType) {
                                param.PRINTTEMPLATE = `${printTemplateModel.REPORT}/${printTemplateModel.KITCHEN_TICKET_BARCODE_TEMPLATE_48}`;
                                // } else {
                                //     param.PRINTTEMPLATE = `${printTemplateModel.REPORT}/${printTemplateModel.KITCHEN_TICKET_LRF_BARCODE_TEMPLATE_48}`;
                                // }
                            } else {
                                // if (!kitchenType) {
                                param.PRINTTEMPLATE = `${printTemplateModel.REPORT}/${printTemplateModel.KITCHEN_TICKET_TEMPLATE_48}`;
                                // } else {
                                //     param.PRINTTEMPLATE = `${printTemplateModel.REPORT}/${printTemplateModel.KITCHEN_TICKET_LRF_TEMPLATE_48}`;
                                // }
                            }
                            data.ITEMS = item.ITEMS;
                            printerServiceModel.receiptsPrint(param.PRINTERIP, param.PRINTERPORT, param.PRINTTEMPLATE, data, function (err, ben) {
                                log(`厨房打印==>`, `【小票打印厨打${err ? "失败error==>" + err : "成功==>" + ben}】 订单ID：${orderId},流水号:${param.ORDER_ID},『${JSON.stringify(param)}』\n【打印数据】:${JSON.stringify(data.ITEMS)}`);
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
                                ip: item.ip,
                                port: item.port,
                                CODE: `${resultData.shopDetail.shopMode == 2 || resultData.shopDetail.shopMode == 7 ? resultData.ver_code : resultData.table_number}`,
                                ARTICLE_NAME: item.ARTICLE_NAME,
                                ARTICLE_COUNT: item.ARTICLE_COUNT,
                                ARTICLE_PRICE: item.ARTICLE_PRICE,
                                SPEC: item.SPEC,
                                RESTAURANT_NAME: `${resultData.shopDetail.name}`,
                                ARTICLE_NUMBER: `${num}/${numTotal}`,
                                DISTRIBUTION_MODE: refund != 0 ? '退菜' : (resultData.distribution_mode_id == 1 ? resultData.parent_order_id ? '堂吃(加)' : '堂吃' : '外带'),
                                CUSTOMER_TEL: `${resultData.shopDetail.phone}`,
                                PRINTTEMPLATE: `./report/restaurant_label.xml`,
                                DATETIME: `${moment(+resultData.create_time).format('YYYY-MM-DD HH:mm:ss')}`
                            };

                            printerServiceModel.stickersPrint(lbObj.ip, lbObj.port, lbObj.PRINTTEMPLATE, lbObj, function (err, ben) {
                                log(`贴纸打印==>`, `【贴纸打印厨打${err ? "失败error==>" + err : "成功==>" + ben}】：『${orderId}』, 『refund:${refund}』,『${refund ? "orderItemArr:" + JSON.stringify(orderItemArr) : []}』,\n 『${JSON.stringify(lbObj)}』`);
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
 * 查找钱箱
 * @param msg
 * @param callback
 * @returns {*}
 */
exports.findCashbox = function (msg, callback) {
    printerModel.findAllInfoByConditions({receiveMoney:1}, function (err,relv) {
        if (err) return callback(err);
        callback(null,relv);
    });
};

/**
 * 打开钱箱
 * @param msg
 * @param callback
 * @returns {*}
 */
exports.openCashbox = function (msg, callback) {
    printerModel.findAllInfoByConditions({receiveMoney:1}, function (err,relv) {
        if (err) callback(err);

        if (relv.length == 0) {
            callback(null);
        }
        let obj =[];
        async.eachLimit(relv, 1, function (item, cb) {
            let printer = new Printer(item.ip, 'ETH');
            printer.openCashbox(function (res) {
                obj.push(res);
                cb()
            });
        },function (err) {
            if (err) callback(err);
            callback(null,obj)
        });
    });

};