/**
 * @author wxh on 2017/11/29
 * @copyright
 * @desc
 */
const moment = require("moment");
const async = require("async");
const lodash = require("lodash");
const queuefun = require('queue-fun');
const httpClient = require("../../../util/httpClient");
const PayMode = require("../../../constant/PayMode");
const Queue = queuefun.Queue();
const q = queuefun.Q;  //配合使用的Promise流程控制类，也可以使用原生Promise也可以用q.js代替
//实列化一个最大并发为1的队列
const queue1 = new Queue(1);

const result = require("../../../util/resultUtil");
const fileUtil = require("../../../util/fileUtil");
const printTemplateModel = require("../../../constant/printTemplateModel");


const customSqlModel = require("../../../model/pos/customSql");

const orderModel = require("../../../model/pos/order");
const orderItemModel = require("../../../model/pos/orderItem");
const printerModel = require("../../../model/pos/printer");
const areaModel = require("../../../model/pos/area");
const orderPayment1ItemModel = require("../../../model/pos/orderPaymentItem");
const shopDetailModel = require("../../../model/pos/shopDetail");
const articleKitchenModel = require("../../../model/pos/articleKitchen");
const chargeOrderModel = require("../../../model/pos/chargeOrder");

const printerServiceModel = require("../../../model/printer-connector/printerService");

const printUtil = require('../../../util/printUtil');


//-------------新添加层controller
// const printController = require("../../../controller/pos/print");
const manyThreadController = require("../../../controller/pos/manyThreadPrint");
const printRecordController = require("../../../controller/pos/printRecord");
const printController = require("../../../controller/pos/print");
const orderController = require("../../../controller/pos/order")
const RefundOrderPaymentType = require("../../../constant/RefundOrderPaymentType")

module.exports = function (app) {
    return new Handler(app);
};

var Handler = function (app) {
    this.app = app;
};

var handler = Handler.prototype;


/**
 * 获取总单打印
 *
 * @param  {Object}   msg     request message
 * @param  {Object}   session current session object
 * @param  {Function} next    next step callback
 * @return {Void}
 */
handler.getTotalTemplate = function (msg, session, next) {
    let orderId = msg.orderId;
    let autoPrint = msg.autoPrint || 0;   // 1; 自动 0 手动
    let totalType = msg.totalType || 1;   // 1=先付， 2=后付消费、3= 后付结算
    let refund = msg.refund || 0;   // 0 不退菜   or  1 退菜
    let orderItemArr = msg.orderItemArr || [];    //退菜对象    orderItemArr:[ {id:"'df0a6deb982b4e57a894ce57f68211c4'",count:2}]

    if (!orderId) return result.error(next, "请输入订单ID", msg);

    printUtil.printTotal(orderId, autoPrint,totalType, refund, orderItemArr, (err, reply) => {
        if (err) {
            return result.error(next, err.toString(), msg);
        } else {
            return result.success(next, msg);
        }
    })
};


/**
 * 获取厨打单打印 or 精简版
 *
 * @param  {Object}   msg     request message
 * @param  {Object}   session current session object
 * @param  {Function} next    next step callback
 * @return {Void}
 */
handler.getKitchenTemplate = function (msg, session, next) {
    let orderId = msg.orderId;
    let autoPrint = msg.autoPrint || 0;   // 1; 自动 0 手动
    let kitchenType = msg.kitchenType || 0;   // 0 正常   or  1 精简版
    let refund = msg.refund || 0;   // 0 不退菜   or  1 退菜
    let orderItemArr = msg.orderItemArr || [];    //退菜对象    orderItemArr:[ {id:"'df0a6deb982b4e57a894ce57f68211c4'",count:2}]
    if (result.isEmpty(orderId)) return result.error(next, "请输入订单ID", msg);

    printUtil.printKitchen(orderId, autoPrint,kitchenType,refund, orderItemArr, (err, reply) => {
        if (err) {
            return result.error(next, err.toString(), msg);
        } else {
            return result.success(next, msg);
        }
    })
};


//---获取新厨打单打印 or 精简版
handler.getNewKitchenTemplate = function (msg, session, next) {

    // printController.printNewKitchen(msg,(err, reply) => {
    manyThreadController.printNewKitchen(msg,(err, reply) => {
        return err ?  result.error(next,err.toString(),msg):result.success(next,reply);
    });
};

/**
 * 获取小票打印
 *
 * @param  {Object}   msg     request message
 * @param  {Object}   session current session object
 * @param  {Function} next    next step callback
 * @return {Void}
 */

handler.getDailyReportTemplate = function (msg, session, next) {
    let dates = msg.dates;
    let businessData = {}
    if (result.isEmpty(dates)) {
        return result.error(next, "请输入日期时间戳", msg);
    }
    let item = {};
    async.waterfall([
        function (cb) {
            printerModel.getPrintIP(function (error, printerInfo) {
                if (error || printerInfo.length == 0) return cb(error || "未设置打印机！");
                item.printerInfo = [];
                lodash.forEach(printerInfo, function (value) {
                    let obj = {
                        PRINTERIP: value.ip,
                        PRINTERPORT: value.port
                    };
                    item.printerInfo.push(obj);
                });
                cb();
            })
        },
        function (cb) {
            orderModel.getOrderListByDates(dates, function (error, orderList) {
                if (error) return cb(error);
                item.orderIdArr = [];
                let count = 0
                if (orderList.length > 0) {
                    orderList.map(item => {
                        if (item.grant_money > 0) {
                            count ++
                        }
                    })
                    lodash.forEach(orderList, function (value) {
                        item.orderIdArr.push(`'${value.id}'`);
                    });
                    let obj = {
                        DATE: dates,    // 日期
                        TOTAL_AMOUNT: lodash.sumBy(orderList, function (o) { return o.amount_with_children ? o.amount_with_children + (+o.order_pos_discount_money || +o.member_discount_money || 0) : o.order_money + (+o.order_pos_discount_money || +o.member_discount_money || 0); }).toFixed(2), // 订单粉丝总额
                        ORDER_AMOUNT: orderList.length,                                           // 订单总数
                        ORDER_AVERAGE:
                            (lodash.sumBy(orderList, function (o) {
                                return o.amount_with_children ?
                                     o.grant_money + o.amount_with_children + (+o.order_pos_discount_money || +o.member_discount_money || 0)
                                    : o.grant_money + o.order_money + (+o.order_pos_discount_money || +o.member_discount_money || 0);
                            })
                                .toFixed(2) / orderList.length).toFixed(2),        // 订单均额
                        CUSTOMER_AMOUNT: lodash.sumBy(orderList, 'customer_count'),        // 就餐人数
                        GRANT_AMOUNT: lodash.sumBy(orderList, function (o) { return o.grant_money}),
                        GRANT_TOTAL: count
                    };
                    item.orderList = obj;
                } else {
                    item.orderList = {
                        DATE: dates,
                        TOTAL_AMOUNT: 0,
                        ORDER_AMOUNT: 0,
                        ORDER_AVERAGE: 0,
                        CUSTOMER_AMOUNT: 0,
                        GRANT_AMOUNT: 0,
                        GRANT_TOTAL: 0
                    }
                }
                cb(null, orderList);
            })
        },
        function (orderList, cb) {
            orderModel.getOrderAllByDates(dates, orderList, function (error, orderAll) {
                if (error) return cb(error);
                item.orderIdAll = [];
                if (orderList.length > 0) {
                    item.orderList.TOTAL_AMOUNT = lodash.sumBy(orderAll, function (o) {
                        return o.order_money + + (+o.order_pos_discount_money) + (+o.member_discount_money) + (+o.erase_money) +Number(o.grant_money)
                    }).toFixed(2), // 订单粉丝总额
                        item.orderList.ORDER_AVERAGE = (item.orderList.TOTAL_AMOUNT  / item.orderList.ORDER_AMOUNT).toFixed(2);
                    lodash.forEach(orderAll, function (value) {
                        item.orderIdAll.push(`'${value.id}'`);
                    });

                    orderModel.getOrderPaymentListById(item.orderIdAll, function (error, orderPaymentList) {
                        if (error) return cb(error);
                        let obj = {
                            INCOME_AMOUNT: 0,  //实收
                            INCOME_ITEMS: [],
                            DISCOUNT_AMOUNT: 0, //折扣
                            DISCOUNT_ITEMS: [], //折扣list
                            CANCELED_ORDER_AMOUNT: 0,   //退款金额
                            REFUNDS_ITEMS: []   //退款list
                        };

                        lodash.forEach(orderPaymentList, function (value) {
                            if ([2, 3, 7, 8, 17,26,28].indexOf(value.payment_mode_id) != -1) { //折扣
                                obj.DISCOUNT_AMOUNT += +(value.pay_value).toFixed(2);
                                let ITEMS = {
                                    PAYMENT_MODE: PayMode.getPayModeName(value.payment_mode_id),
                                    SUBTOTAL: (value.pay_value).toFixed(2)
                                };
                                obj.DISCOUNT_ITEMS.push(ITEMS);
                            } else if ([11, 19].indexOf(value.payment_mode_id) != -1) {                                                   //退款
                                obj.CANCELED_ORDER_AMOUNT += +(Math.abs(value.pay_value)).toFixed(2);
                                let ITEMS = {
                                    PAYMENT_MODE: PayMode.getPayModeName(value.payment_mode_id),
                                    SUBTOTAL: Math.abs(value.pay_value).toFixed(2)
                                };
                                obj.REFUNDS_ITEMS.push(ITEMS);
                            } else {
                                obj.INCOME_AMOUNT += +(value.pay_value).toFixed(2);
                                let ITEMS = {
                                    PAYMENT_MODE: PayMode.getPayModeName(value.payment_mode_id),
                                    SUBTOTAL: value.pay_value.toFixed(2)
                                };
                                obj.INCOME_ITEMS.push(ITEMS);
                            }
                        });

                        let grant = {
                            PAYMENT_MODE: '赠菜金额',
                            SUBTOTAL:  Number(item.orderList.GRANT_AMOUNT).toFixed(2)
                        }
                        obj.DISCOUNT_AMOUNT =  (Number(obj.DISCOUNT_AMOUNT) + Number(item.orderList.GRANT_AMOUNT)).toFixed(2);
                        obj.DISCOUNT_ITEMS.push(grant)
                        let conditions = {
                            accountingTime: `${dates}`,
                            orderState: ['2', '10']
                        };
                        orderModel.getDayOrder(conditions, function (err, membersAndPosDiscount) {
                            if (err) return cb(err);

                            if (lodash.sumBy(membersAndPosDiscount, (o) => { return +o.orderPosDiscountMoney + (+o.eraseMoney) +(+o.exemptionMoney)}) > 0) {
                                obj.DISCOUNT_AMOUNT += lodash.sumBy(membersAndPosDiscount, (o) => { return +o.orderPosDiscountMoney + (+o.eraseMoney)});
                                obj.DISCOUNT_ITEMS.push({ PAYMENT_MODE: 'POS端折扣', SUBTOTAL: (lodash.sumBy(membersAndPosDiscount, (o) => { return +o.orderPosDiscountMoney + (+o.eraseMoney) })).toFixed(2).toString() });
                            }
                            if (lodash.sumBy(membersAndPosDiscount, (o) => { return +o.memberDiscountMoney }) > 0) {
                                obj.DISCOUNT_AMOUNT += lodash.sumBy(membersAndPosDiscount, (o) => { return +o.orderPosDiscountMoney });
                                obj.DISCOUNT_ITEMS.push({ PAYMENT_MODE: '会员折扣', SUBTOTAL: (lodash.sumBy(membersAndPosDiscount, (o) => { return +o.memberDiscountMoney })).toFixed(2).toString() });
                            }

                            item.orderPaymentList = obj;
                            cb(null, orderList);
                        });

                    })
                } else {
                    item.orderPaymentList = {
                        INCOME_AMOUNT: 0,  //实收
                        INCOME_ITEMS: [],
                        DISCOUNT_AMOUNT: 0, //折扣
                        DISCOUNT_ITEMS: [], //折扣list
                        CANCELED_ORDER_AMOUNT: 0,   //退款金额
                        REFUNDS_ITEMS: []   //退款list
                    };
                    cb(null, orderList);
                }
            });
        },
        function (orderList, cb) {  //充值列表
            chargeOrderModel.listByDates(item.orderList.DATE, function (error, chargeList) {
                if (error) return cb(error);
                let obj = {
                    STORED_VALUE_COUNT: chargeList.length || 0,    //充值单数
                    SALED_PRODUCT_AMOUNT: lodash.sumBy(chargeList, 'charge_money') || 0,    //充值总金额
                    STORED_VALUE_ITEMS: []                                                  //菜品list
                };
                lodash.forEach(chargeList, function (value) {
                    obj.STORED_VALUE_ITEMS.push({
                        "TEL": value.telephone,
                        "SUBTOTAL": value.charge_money
                    })
                });
                item.chargeList = obj;
                cb(null, orderList);
            })
        },
        function (orderList, cb) {  //菜品销量
            orderItemModel.getOrderItemListById(item.orderIdAll, function (error, orderItemList) {
                if (error) return cb(error);
                let obj = {
                    SALED_PRODUCT_AMOUNT: lodash.sumBy(orderItemList, 'total_count') || 0,    //菜品总销量
                    SALED_PRODUCTS: [],                                                           //菜品list
                    GRANT_ITEM_TOTAL: lodash.sumBy(orderItemList, function (o) { return o.grant_count}) || 0
                };

                let orderItemListCp = lodash.cloneDeep(orderItemList);

                let nameType = lodash.unionBy(orderItemList, 'name');

                var group1 =  lodash.filter(orderItemList, function(o) {
                    return  !o.parent_id ;
                });

                var group2 =  lodash.filter(orderItemList, function(o) {
                    return  o.parent_id ;
                });

                lodash.forEach(group2, function (itrm_val) {
                    let sss = lodash.find(group1,  { 'item_id': itrm_val.parent_id});
                    if (sss) {
                        itrm_val.parent_name = sss.article_name;
                    }
                });


                lodash.forEach(group1, function (val) {
                    if (val.type == 5) {
                        val.article_name = val.article_name.split(`(`)[0]
                    }
                });
                let articleNameType = [];
                lodash.forEach(group1, function (val) {
                    let data = lodash.find(articleNameType, { 'name': val.name,'article_name': val.article_name});
                    if (!data) {
                        articleNameType.push(val)
                    }
                });


// let articleNameType = lodash.unionBy(group1, 'name');

// let articleNameType = lodash.unionBy(group1, 'article_name');


                let tc_articleNameType = lodash.unionBy(group2, 'article_name');



                lodash.forEach(articleNameType, function (val) {
                    val.orgin_count = lodash.sumBy(group1, function(o) {
                        if (o.article_name == val.article_name && o.name == val.name ){
                            return o.orgin_count
                        }
                    });
                    val.refund_count = lodash.sumBy(group1, function(o) {
                        if (o.article_name == val.article_name && o.name == val.name ) {
                            return o.refund_count
                        }
                    });
                    val.total_count = val.orgin_count - val.refund_count;
                });

                lodash.forEach(tc_articleNameType, function (val) {
                    val.orgin_count = lodash.sumBy(group2, function(o) {
                        if (o.article_name == val.article_name  ){
                            return o.orgin_count
                        }
                    });
                    val.refund_count = lodash.sumBy(group2, function(o) {
                        if (o.article_name == val.article_name  ) {
                            return o.refund_count
                        }
                    });
                    val.total_count = val.orgin_count - val.refund_count;
                });


                articleNameType.push(...tc_articleNameType);
                let articleNameTypeNew = [];
                lodash.forEach(articleNameType, function (val) {
                    let data = lodash.find(articleNameTypeNew, { 'name': val.name,'article_name': val.article_name});
                    if (!data) {
                        articleNameTypeNew.push(val)
                    }
                });

                articleNameType  = articleNameTypeNew;

// articleNameType = lodash.unionBy(articleNameType, 'article_name');




                lodash.forEach(nameType, function (value) {
                    let arr = [{ PRODUCT_NAME: lodash.pad(`${value.name}`,  34 - (value.name.length), '-'), SUBTOTAL: `--------------` }];

                    let orderItemListByName = lodash.filter(articleNameType, ['name', value.name]);

                    lodash.forEach(orderItemListByName, function (val) {
                        if (val.type == 5){
                            let stu1 = (val.article_name).replace(/\(.*?\)/g, '');
                            obj.SALED_PRODUCT_AMOUNT += val.total_count;
                            arr.push({
                                PRODUCT_NAME: "" + stu1,
                                SUBTOTAL: `${val.total_count}`
                            });

                            let arr_itrm = lodash.filter(orderItemListCp, (o) =>{
                                if (o.type == 5 && (o.article_name).replace(/\(.*?\)/g, '') == stu1 ) return o
                            });
                            let arr_item = [];
                            lodash.forEach(arr_itrm, function (itrm_val) {
                                let specificationItems = lodash.map(itrm_val.article_name.match(/\((.+?)\)/g), function (n) { return n.replace(/\(/, "").replace(/\)/, "") });
                                arr_item.push(...specificationItems);
                            });
                            let pushItem = [];
                            lodash.forEach(arr_item, function (itrm_val) {
                                pushItem.push({
                                    PRODUCT_NAME: "|_" + itrm_val,
                                    SUBTOTAL: `1`
                                })
                            });
                            let pushItemTo = lodash.unionBy(lodash.cloneDeep(pushItem), 'PRODUCT_NAME');
                            lodash.forEach(pushItemTo, function (itrm_val) {
                                let h_item = lodash.filter(pushItem, ['PRODUCT_NAME', itrm_val.PRODUCT_NAME]);
                                itrm_val.SUBTOTAL = h_item.length;

                            });
                            arr.push(...pushItemTo)
                        }else if (val.type == 3){
                            obj.SALED_PRODUCT_AMOUNT += val.total_count;
                            arr.push({
                                PRODUCT_NAME: "" + val.article_name,
                                SUBTOTAL: `${val.total_count}`
                            });

                            let arr_itrm =  lodash.filter(tc_articleNameType, function(o) {
                                if (o.parent_id  == val.item_id || (o.parent_name == val.article_name && o.name == val.name) ) return o;
                            });
                            lodash.forEach(arr_itrm, function (itrm_val) {
                                arr.push({
                                    PRODUCT_NAME: "|_" + itrm_val.article_name,
                                    SUBTOTAL: `${itrm_val.total_count}`
                                });
                            });
                        }else {
                            if (val.type != 4 ) {
                                obj.SALED_PRODUCT_AMOUNT += val.total_count;
                            }
                            let  itrm_val = lodash.find(tc_articleNameType, (o)=> {
                                if (o.article_name == val.article_name &&  val.type != 4  ) return o ;
                            });
                            if (itrm_val){
                                arr.push({
                                    PRODUCT_NAME: "" + val.article_name,
                                    SUBTOTAL: `${val.total_count + itrm_val.total_count}(${val.total_count}+${itrm_val.total_count})`
                                })
                            }else {
                                if (val.type == 4 ){
                                    arr.push({
                                        PRODUCT_NAME: "" + val.article_name,
                                        SUBTOTAL: `${val.total_count }(0+${val.total_count})`
                                    })
                                }else {
                                    arr.push({
                                        PRODUCT_NAME: "" + val.article_name,
                                        SUBTOTAL: `${val.total_count }(${val.total_count}+0)`
                                    })
                                }
                            }
                        }
                    });
                    obj.SALED_PRODUCTS.push(...arr);
                });
                item.OrderItemList = obj;
                cb(null, orderList);
            })
        },
        function (orderList, cb) {  //退菜数量
            orderItemModel.getOrderItemRefundListById(item.orderIdAll, function (error, refundList) {
                if (error) return cb(error);
                let obj = {
                    CANCELED_PRODUCT_COUNT: lodash.sumBy(refundList, 'refund_count') || 0,      //退菜总数量
                    CANCELED_PRODUCTS: []                                                        //退菜list
                };
                if (refundList.length > 0) {
                    let nameType = lodash.unionBy(refundList, 'name');
                    lodash.forEach(nameType, function (value) {
                        let orderItemListByName = lodash.filter(refundList, ['name', value.name]);

                        let arr = [{ PRODUCT_NAME: value.name, SUBTOTAL: lodash.sumBy(orderItemListByName, 'refund_count') }];
                        lodash.forEach(orderItemListByName, function (val) {
                            arr.push({
                                PRODUCT_NAME: "  " + val.article_name,
                                SUBTOTAL: val.refund_count
                            })
                        });
                        obj.CANCELED_PRODUCTS.push(...arr)
                    });
                }
                item.OrderItemRefundList = obj;
                cb(null, orderList);
            });
        },
        function (orderList, cb) {  //取消订单
            orderModel.getCancelOrderListByDates(dates, function (error, cancelOrderList) {
                if (error) return cb(error);
                let obj = {
                    CANCEL_ORDER_COUNT: cancelOrderList.length || 0,      //取消订单总数量
                    CANCEL_ORDERS: []                                       //取消订单list
                };

                if (cancelOrderList.length > 0) {
                    lodash.forEach(cancelOrderList, function (value) {
                        obj.CANCEL_ORDERS.push({
                            CANCEL_ORDER_NUMBER: value.serial_number
                        })
                    });
                }
                item.CancelOrderList = obj;
                cb(null, orderList);
            });
        },
        function (orderList, cb) {  //退菜金额及订单数
            orderModel.getOrderRefundAmountListById(item.orderIdAll, function (error, amountList) {
                if (error) return cb(error);
                let obj = {
                    CANCELED_ORDER_AMOUNT: (lodash.sumBy(amountList, 'total_value')).toFixed(2) || 0,
                    CANCELED_ORDER_COUNT: amountList.length || 0,
                    CANCELED_ORDERS: []
                };
                if (amountList.length > 0) {
                    lodash.forEach(amountList, function (value) {
                        obj.CANCELED_ORDERS.push({
                            ORDER_NUMBER: value.order_id,
                            TEL: value.telephone || '-',
                            SUBTOTAL: (value.total_value).toFixed(2)
                        })
                    });
                }
                item.OrderRefundAmountList = obj;
                cb(null, orderList);
            })
        },
        function (orderInfo, cb) { //获取设置店铺信息
            shopDetailModel.getCustomShopDetailInfo('', function (error, shopDetail) {
                if (error) return cb(error);
                item.shopDetail = shopDetail;
                cb(null, orderInfo);
            });
        },
        function (orderInfo, cb) {
            let reviewMoney = {}
            let sql = `SELECT open_audit FROM tb_brand_setting`
            customSqlModel.getOneCustomSqlInfo(sql, (error, result) => {
                if (error) return cb(error);
                if (result.open_audit) {
                    let sql = `SELECT id FROM tb_daily_log_operation WHERE create_time LIKE '${dates} %' ORDER BY create_time desc limit 1`

                    customSqlModel.getOneCustomSqlInfo(sql, function (error, result) {
                        if (error) return cb(error)
                        if ((result && result.length <= 0) || !result) {
                            reviewMoney.EMERSION_CASH_PAY = 0.00;
                            reviewMoney.EMERSION_INCOME_PAY = 0.00;
                            cb(null, reviewMoney)
                        } else {
                            let sql = `SELECT *  FROM tb_payment_review  WHERE  daily_log_id = '${result.id}' AND payment_mode_id = 30 OR payment_mode_id = 29`
                            customSqlModel.getAllCustomSqlInfo(sql, (error, result) => {
                                if (error) return cb(error)
                                for (let i = 0 ; i < result.length; i++) {
                                    if (result[i].payment_mode_id == 29) {
                                        reviewMoney.EMERSION_CASH_PAY = result[i].audit_money;
                                    } else if (result[i].payment_mode_id == 30) {
                                        reviewMoney.EMERSION_INCOME_PAY = result[i].audit_money;
                                    }
                                }
                                cb(null, reviewMoney)
                            })
                        }
                    })
                } else {
                    reviewMoney.EMERSION_CASH_PAY = 0
                    reviewMoney.EMERSION_INCOME_PAY = 0
                    cb(null, reviewMoney)
                }

            })


        },
        function (orderInfo, cb) {
            orderController.business(dates, (err, reply) => {
                businessData = {
                    INCOME_AMOUNT: 0,
                    INCOME_List : [],
                    REFUNDS_ITEMS: [],
                    CANCELED_ORDER_AMOUNT: reply.canceledOrderAmount,
                    discountAmount: reply.discountAmount
                }
                businessData.INCOME_AMOUNT = reply.incomeAmount;
                businessData.INCOME_ITEMS = []
                for (let key in reply.incomeItems) {
                    let item = reply.incomeItems[key];
                    businessData.INCOME_ITEMS.push({
                        PAYMENT_MODE: PayMode.getPayModeName(Number(key)),
                        SUBTOTAL: item
                    })
                }

                for (let key in reply.refundsItems) {
                    let item = reply.refundsItems[key];
                    businessData.REFUNDS_ITEMS.push({
                        PAYMENT_MODE: RefundOrderPaymentType.getPaymentNameById(Number(key)),
                        SUBTOTAL: item
                    })
                }
                for (let key in reply.underline) {
                    let item = reply.underline[key];
                    businessData.INCOME_ITEMS.push({
                        PAYMENT_MODE: Number(key) == 1 ? "线下微信支付":"线下支付宝支付",
                        SUBTOTAL: item
                    })
                }

                cb(null, orderInfo)
            })
        }
    ], function (error, reviewMoney) {
        if (error) return result.error(next, error.toString(), msg);
        let param = {};
        param.RESTAURANT_NAME = item.shopDetail.name || '-';              //店名
        param.DATE = item.orderList.DATE;                            //日期
        param.TOTAL_AMOUNT = item.orderList.TOTAL_AMOUNT;          // 总额
        param.ORDER_AMOUNT = item.orderList.ORDER_AMOUNT;          //订单总数
        param.ORDER_AVERAGE = item.orderList.ORDER_AVERAGE;        //订单均额
        param.CUSTOMER_AMOUNT = item.orderList.CUSTOMER_AMOUNT;    //就餐人数
        param.CUSTOMER_AVERAGE = item.orderList.CUSTOMER_AMOUNT ? (item.orderList.TOTAL_AMOUNT / item.orderList.CUSTOMER_AMOUNT).toFixed(2) : 0;                  //人均消费
        // param.INCOME_AMOUNT = item.orderPaymentList.INCOME_AMOUNT.toFixed(2) || 0;                     //实收金额
        // param.INCOME_ITEMS = item.orderPaymentList.INCOME_ITEMS || []; // 实收list
        param.INCOME_AMOUNT = Number(businessData.INCOME_AMOUNT).toFixed(2) || 0; //实收金额
        param.INCOME_ITEMS = businessData.INCOME_ITEMS || []; // 实收list
        param.DISCOUNT_AMOUNT = Number(businessData.discountAmount).toFixed(2) || 0;                  //折扣金额
        param.DISCOUNT_ITEMS = item.orderPaymentList.DISCOUNT_ITEMS;  //折扣金额 list
        param.STORED_VALUE_COUNT = item.chargeList.STORED_VALUE_COUNT;                  //充值单数
        param.STORED_VALUE_AMOUNT = item.chargeList.SALED_PRODUCT_AMOUNT;                  //充值金额
        param.STORED_VALUE_ITEMS = item.chargeList.STORED_VALUE_ITEMS;  //充值 list
        param.SALED_PRODUCT_AMOUNT = item.OrderItemList.SALED_PRODUCT_AMOUNT;                  //菜品总销量
        param.SALED_PRODUCTS = item.OrderItemList.SALED_PRODUCTS;  //菜品 list
        param.CANCELED_PRODUCT_COUNT = item.OrderItemRefundList.CANCELED_PRODUCT_COUNT;                  //退菜数量
        param.CANCELED_PRODUCTS = item.OrderItemRefundList.CANCELED_PRODUCTS;  //退菜品 list
        // param.CANCELED_ORDER_AMOUNT = item.OrderRefundAmountList.CANCELED_ORDER_AMOUNT;                  //退菜金额
        param.CANCELED_ORDER_AMOUNT = businessData.CANCELED_ORDER_AMOUNT;                  //退菜金额
        // param.REFUNDS_ITEMS = item.orderPaymentList.REFUNDS_ITEMS;                  //退菜list

        param.REFUNDS_ITEMS = businessData.REFUNDS_ITEMS;                  //退菜list

        param.CANCELED_ORDER_COUNT = item.OrderRefundAmountList.CANCELED_ORDER_COUNT;                  //退菜订单数
        param.CANCELED_ORDERS = item.OrderRefundAmountList.CANCELED_ORDERS;

        param.CANCEL_ORDER_COUNT = item.CancelOrderList.CANCEL_ORDER_COUNT;                  //取消订单数
        param.CANCEL_ORDERS = item.CancelOrderList.CANCEL_ORDERS;

        param.EMERSION_CASH_PAY = Number(reviewMoney.EMERSION_CASH_PAY||0).toFixed(2); // 浮出门店零用金
        param.EMERSION_INCOME_PAY = Number(reviewMoney.EMERSION_INCOME_PAY||0).toFixed(2); // 浮出门店零找金

        param.GRANT_AMOUNT = Number(item.orderList.GRANT_AMOUNT).toFixed(2); // 赠送菜品总金额金额
        param.GRANT_TOTAL = Number(item.orderList.GRANT_TOTAL);   //  赠菜的订单数
        param.GRANT_ITEM_TOTAL = Number(item.OrderItemList.GRANT_ITEM_TOTAL); // 退菜总数量

        if (item.printerInfo.length <= 0) return result.error(next, "未设置打印机！", msg);
        let datas = [];
        async.eachLimit(item.printerInfo, 1, function (item, ab) {
            param.PRINTERIP = item.PRINTERIP;
            param.PRINTERPORT = item.PRINTERPORT;

            printerServiceModel.receiptsPrint(param.PRINTERIP, param.PRINTERPORT, `${printTemplateModel.REPORT}/${printTemplateModel.DAILY_REPORT_TEMPLATE_48}`, param, function (err, ben) {
                fileUtil.appendFile(`printLogs`, `${msg.__route__}=>【打印日结小票】：${JSON.stringify(param)}`);
                datas.push(ben);
                ab()
            })
        }, function (err) {
            if (err) {
                fileUtil.appendFile(`printLogs`, `${msg.__route__}=>【打印日结小票】：${JSON.stringify(err.toString())}`);
                return result.error(next, err.toString(), msg);
            }
            result.success(next, datas);
        });

    });
};


/**
 * 催菜打印
 *
 * @param  {Object}   msg
 * @param  {Object}   session
 * @param  {Function} next
 * @return {Void}
**/
handler.reminderPrint = function (msg, session, next) {
    if (!msg.orderId) return result.error(next, "请输入订单ID", msg);

    let kitchenType = msg.kitchenType || 0;   // 0 正常   or  1 精简版
    let orderId = msg.orderId;
    let orderItemArr = msg.orderItemArr || []; //催菜菜品
    async.auto({
        getShopDetailInfo: function (cb) { // 0、获取店铺信息
            let sql = `select * from tb_shop_detail`;
            customSqlModel.getOneCustomSqlInfo(sql, (err, shopDetailInfo) => {
                return cb(err, shopDetailInfo);
            })
        },
        getOrderInfo: function (cb) { // 1、获取订单信息
            let sql = `select * from tb_order where id = '${orderId}'`;
            customSqlModel.getOneCustomSqlInfo(sql, (err, orderInfo) => {
                return cb(err, orderInfo);
            })
        },
        getPrinterTemplate: ['getShopDetailInfo', function (reply, cb) {
            let template = '';
            if (reply.getShopDetailInfo.shopMode == 2 || reply.getShopDetailInfo.shopMode == 7) { // 获取模板
                if (!kitchenType) {
                    template = `${printTemplateModel.REPORT}/${printTemplateModel.KITCHEN_TICKET_BARCODE_TEMPLATE_48}`;
                } else {
                    template = `${printTemplateModel.REPORT}/${printTemplateModel.KITCHEN_TICKET_LRF_BARCODE_TEMPLATE_48}`;
                }
            } else {
                if (!kitchenType) {
                    template = `${printTemplateModel.REPORT}/${printTemplateModel.KITCHEN_TICKET_TEMPLATE_48}`;
                } else {
                    template = `${printTemplateModel.REPORT}/${printTemplateModel.KITCHEN_TICKET_LRF_TEMPLATE_48}`;
                }
            }
            return cb(null, template);
        }],
        getPrinterItemInfo: ['getShopDetailInfo', function (reply, cb) { // 2、获取每个菜品的厨房信息 (根据店铺设置可能需要拆分)
            let split_kitchen = reply.getShopDetailInfo.split_kitchen; // 是否要拆开菜品打印 0厨打不分单 1厨打分单
            let print_type = reply.getShopDetailInfo.print_type; // 是否要拆开套餐打印 0：整单出  1：分单出
            // split_kitchen = 1;
            // print_type = 1;
            let orderItemResult = {
                orderItems: [],
                stickerPrintCount: 0
            };
            async.eachLimit(orderItemArr, 1, (orderItem, e_cb) => {
                let sql = `SELECT * FROM tb_article WHERE id = substr('${orderItem.articleId}',1,32)`;
                customSqlModel.getOneCustomSqlInfo(sql, (err, articleInfos) => {
                    let sql = `SELECT * FROM tb_printer WHERE id in ( SELECT printer_id FROM tb_kitchen WHERE id in (SELECT kitchen_id from tb_article_kitchen WHERE article_id = substr('${orderItem.articleId}',1,32) ))`;
                    if (articleInfos.virtual_id) {
                        sql = `SELECT * FROM tb_printer WHERE id in ( SELECT printer_id FROM tb_kitchen WHERE id = ( SELECT kitchen_id FROM tb_virtual_products_kitchen WHERE virtual_id = ( SELECT virtual_id FROM tb_article WHERE id = substr('${orderItem.articleId}',1,32) )))`;
                    }
                    // 同时查询虚拟餐包和正常打印的SQL:
                    // let sql = `SELECT * FROM tb_printer WHERE
                    // id in ( SELECT printer_id FROM tb_kitchen WHERE id = ( SELECT kitchen_id FROM tb_virtual_products_kitchen WHERE virtual_id = ( SELECT virtual_id FROM tb_article WHERE id = substr('${orderItem.articleId}',1,32))))
                    // or id in ( SELECT printer_id FROM tb_kitchen WHERE id in (SELECT kitchen_id from tb_article_kitchen WHERE article_id = substr('${orderItem.articleId}',1,32) ))`;
                    customSqlModel.getAllCustomSqlInfo(sql, (err, printerInfos) => {
                        sql = `SELECT * FROM tb_order_item WHERE id = '${orderItem.id}' or parent_id = '${orderItem.id}';`;
                        customSqlModel.getAllCustomSqlInfo(sql, (err, orderItemsInfo) => {
                            orderItemsInfo = orderItemsInfo.sort((a, b) => {
                                return (a.parent_id ? a.parent_id.length : 0) > (b.parent_id ? b.parent_id.length : 0);
                            });
                            for (let n = 0; n < printerInfos.length; n++) { // 一个菜品有可能有多种打印机设置
                                if (printerInfos[n].ticket_type == 1) { // 记录贴纸打印个数
                                    orderItemResult.stickerPrintCount += 1
                                }
                                for (let m = 0; m < orderItemsInfo.length; m++) { //记录菜品
                                    if (orderItemsInfo[m].parent_id) { //子品 名称 加|_
                                        orderItemsInfo[m].article_name = `|_${orderItemsInfo[m].article_name}`
                                    }
                                    // console.log('--------------orderItemsInfo------------------', JSON.stringify(orderItemsInfo))
                                    // console.log('--------------split_kitchen------------------', split_kitchen, print_type)
                                    if (split_kitchen && !print_type && !orderItemsInfo[m].parent_id) { // (1) 拆开数量 且 不拆套餐
                                        for (let i = 0; i < orderItemsInfo[m].count; i++) {
                                            orderItemResult.orderItems.push({
                                                printerInfo: printerInfos[n],
                                                orderItems: orderItemsInfo,
                                                count: 1
                                            });
                                        }
                                    } else if (split_kitchen && print_type) { // (2) 拆开数量 且 拆开套餐
                                        for (let i = 0; i < orderItemsInfo[m].count; i++) {
                                            orderItemResult.orderItems.push({
                                                printerInfo: printerInfos[n],
                                                orderItems: [orderItemsInfo[m]],
                                                count: 1
                                            });
                                        }
                                    } else if (!split_kitchen && print_type) {  // (3) 不拆数量 且 拆开套餐
                                        orderItemResult.orderItems.push({
                                            printerInfo: printerInfos[n],
                                            orderItems: [orderItemsInfo[m]],
                                            count: orderItemsInfo[m].count
                                        });
                                    } else if (!split_kitchen && !print_type && !orderItemsInfo[m].parent_id) { // (4) 不拆数量 且 不拆套餐
                                        orderItemResult.orderItems.push({
                                            printerInfo: printerInfos[n],
                                            orderItems: orderItemsInfo,
                                            count: orderItemsInfo[m].count
                                        });
                                    }
                                }
                            }
                            return e_cb(err);
                        });
                    });
                });
            }, (err) => {
                // console.log('--------------orderItemResult------------------', JSON.stringify(orderItemResult))
                return cb(err, orderItemResult)
            })
        }]
    }, function (err, resultData) {
        let prList = [];
        let param = {};
        let CUSTOMER_SATISFACTION = (resultData.consumeInfo && resultData.consumeInfo.CUSTOMER_SATISFACTION) || 0;
        //店铺信息
        param.RESTAURANT_TEL = `${resultData.getShopDetailInfo.phone}`;      //电话
        param.CUSTOMER_TEL = `${resultData.getShopDetailInfo.phone}`;
        param.DISTRIBUTION_MODE = '催菜';
        //订单信息
        param.TABLE_NUMBER = resultData.getShopDetailInfo.shopMode == 2 || resultData.getShopDetailInfo.shopMode == 7 ? resultData.getOrderInfo.ver_code : resultData.getOrderInfo.table_number;
        let orderNumber = (resultData.getOrderInfo.order_number || '999').toString();//订单号
        param.ORDER_NUMBER = orderNumber.length == 1 ? `00${orderNumber}` : orderNumber.length == 2 ? `0${orderNumber}` : orderNumber;      //订单号//桌号
        param.ORDER_ID = resultData.getOrderInfo.serial_number;                         //交易流水号
        param.BARCODE = resultData.getOrderInfo.serial_number.substring(8, 18);                         //条形码
        param.DATETIME = `${moment(+resultData.getOrderInfo.create_time).format('YYYY-MM-DD HH:mm:ss')}`;           //订单时间
        param.ORIGINAL_AMOUNT = resultData.getOrderInfo.original_amount;                  //原价
        param.CUSTOMER_SATISFACTION = "★★★★★☆☆☆☆☆".slice(5 - CUSTOMER_SATISFACTION, 10 - CUSTOMER_SATISFACTION);            //客户上次评分分数           //客户上次评分分数
        param.CUSTOMER_SATISFACTION_DEGREE = (resultData.consumeInfo && resultData.consumeInfo.CUSTOMER_SATISFACTION_DEGREE) || 0;     //客户平均评分分数
        param.CUSTOMER_PROPERTY = (resultData.consumeInfo && resultData.consumeInfo.CUSTOMER_PROPERTY) || '-';                //客服余额
        param.MEMO = resultData.getOrderInfo.remark || '-';
        param.CUSTOMER_COUNT = resultData.getOrderInfo.customer_count;
        async.eachLimit(resultData.getPrinterItemInfo.orderItems, 1, (getPrinterItem, e_cb) => {
            let num = 1;
            let numTotal = resultData.getPrinterItemInfo.stickerPrintCount;
            param.PRINTERIP = getPrinterItem.printerInfo.ip;
            param.PRINTERPORT = getPrinterItem.printerInfo.port;
            if (getPrinterItem.printerInfo.ticket_type == 1) { // 贴纸打印
                //模板信息
                for (let i = 0; i < getPrinterItem.orderItems.length; i++) {
                    param.PRINTTEMPLATE = `./report/restaurant_label.xml`;
                    param.CODE = `${resultData.getShopDetailInfo.shopMode == 2 || resultData.getShopDetailInfo.shopMode == 7 ? resultData.getOrderInfo.ver_code : resultData.getOrderInfo.table_number}`;
                    param.ARTICLE_NAME = getPrinterItem.orderItems[i].article_name;
                    param.ARTICLE_COUNT = getPrinterItem.orderItems[i].count;
                    param.ARTICLE_PRICE = getPrinterItem.orderItems[i].unit_price;
                    param.SPEC = getPrinterItem.orderItems[i].article_name.match(/\((.+?)\)/g) || '';
                    param.RESTAURANT_NAME = `${resultData.getShopDetailInfo.name}`;
                    param.ARTICLE_NUMBER = `${num}/${numTotal}`;
                    printerServiceModel.stickersPrint(param.PRINTERIP, param.PRINTERPORT, param.PRINTTEMPLATE, param, function (err, ben) {
                        return e_cb(null, ben);
                    });
                }
            } else { // 普通厨打
                //模板信息
                param.PRINTTEMPLATE = resultData.getPrinterTemplate;
                param.ITEMS = [];
                for (let i = 0; i < getPrinterItem.orderItems.length; i++) {
                    param.ITEMS.push({ ARTICLE_COUNT: getPrinterItem.count, ARTICLE_NAME: getPrinterItem.orderItems[i].article_name });
                }
                printerServiceModel.receiptsPrint(param.PRINTERIP, param.PRINTERPORT, param.PRINTTEMPLATE, param, function (err, ben) {
                    return e_cb(null, ben);
                })
            }
        }, (err) => {
            return result.success(next, param);
        })
    })
};

/**
 * 根据漏单id执行重打
 * @param msg
 * @param session
 * @param next
 */
handler.repeatPrintById  = function (msg, session, next) {
    printRecordController.repeatPrintById(msg,(err, reply) => {
        return err ?  result.error(next,err.toString(),msg):result.success(next,reply);
    });
};

/**
 * 根据id 删除打印记录
 * @param msg
 * @param session
 * @param next
 */
handler.deletePrintRecordById  = function (msg, session, next) {
    printRecordController.deletePrintRecordById(msg,(err, reply) => {
        return err ?  result.error(next,err.toString(),msg):result.success(next,reply);
    });
};


/**
 * 获取打印记录
 * @param msg
 * @param session
 * @param next
 */
handler.getPrintRecord  = function (msg, session, next) {
    printRecordController.getPrintRecord(msg,(err, reply) => {
        return err ?  result.error(next,err.toString(),msg):result.success(next,reply);
    });
};


/**
 * 查找钱箱
 */
Handler.prototype.findCashbox = function (msg, session, next) {
    printController.findCashbox(msg,(err, reply) => {
        return err ?  result.error(next,err.toString(),msg):result.success(next,reply);
    });

};


/**
 * 打开钱箱
 */
Handler.prototype.openCashbox = function (msg, session, next) {
    printController.openCashbox(msg,(err, reply) => {
        return err ?  result.error(next,err.toString(),msg):result.success(next,reply);
    });

};
