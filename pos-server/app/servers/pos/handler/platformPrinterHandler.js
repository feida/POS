const async = require("async");
const lodash = require("lodash");
const moment = require("moment");
const queuefun = require('queue-fun');
const Queue = queuefun.Queue();
const q = queuefun.Q;  //配合使用的Promise流程控制类，也可以使用原生Promise也可以用q.js代替
//实列化一个最大并发为1的队列
const queue1 = new Queue(1);

const result = require("../../../util/resultUtil");
const fileUtil = require("../../../util/fileUtil");

const printTemplateModel = require("../../../constant/printTemplateModel");
const Printer = require('../../../lib/printer/Printer').Printer;



const platformOrder = require("../../../model/pos/platformOrder");
const shopDetail = require("../../../model/pos/shopDetail");
const printerServiceModel = require("../../../model/printer-connector/printerService");

const printer = require("../../../model/pos/printer");



module.exports = function (app) {
    return new Handler(app);
};

var Handler = function (app) {
    this.app = app;
};


/**
 * 获取平台总单打印
 * @param msg
 * @param session
 * @param next
 */
Handler.prototype.getPlatformTotalTemplate = function (msg, session, next) {

    if (result.isEmpty(msg.platformOrderId))  return result.error(next, "请输入订单platformOrderId",msg);
    let conditions  = {
        platformOrderId:msg.platformOrderId
    };
    async.parallel({
        shopDetail: function(cb){
            shopDetail.getShopDetailInfo(conditions,function (err, data) {
                if(err)  return cb(err);
                cb(null, data);
            });
        },
        printer: function(cb){
            let conditions = {
                printType:2,
                range:0,
                ticketType:0,
                supportWaimai:1
            };
            printer.getPrinterByPrintType(conditions,function (err, data) {
                if(err)  return cb(err);
                cb(null, data);
            });
        },
        platformOrder: function(cb){
            platformOrder.getPlatformOrderByPlatformOrderId(conditions,function (err,data) {
                if(err)  return cb(err);
                cb(null, data);
            });
        },
        platformOrderDetail: function(cb){
            platformOrder.getPlatformOrderDetailByPlatformOrderId(conditions,function (err,data) {
                if(err)  return cb(err);
                cb(null, data);
            });
        }
    },function(err, results){
        if(err) {
            fileUtil.appendFile(`printLogs`,`${msg.__route__}=>${results.platformOrder.type == 1 ? "【饿了么外卖】":"【美团外卖】" }总单-失败：${msg.platformOrderId},\n,${err.toString()}`);
            return result.error(next, err.toString(),msg);
        }
        if(!results.shopDetail)   return result.error(next, '没有找到店铺信息',msg);
        if(!results.printer.length)   return result.error(next, '没有找到打印机',msg);
        if(!results.platformOrder) return result.error(next, '没有找到外卖总订单数据',msg);
        if(!results.platformOrderDetail.length) return result.error(next, '没有找到外卖订单详情数据',msg);

        let param = {};
        param.RESTAURANT_NAME = results.shopDetail.name;              //店名
        param.PLATFORM_NAME = results.platformOrder.type == 1 ? "饿了么外卖":"美团外卖";              //平台名称
        param.PAYTYPE=results.platformOrder.payType;
        param.RESTAURANT_ADDRESS=results.platformOrder.address;
        let orderNumber = results.platformOrder.orderNumber.toString() || "001";

        param.ORDER_NUMBER = orderNumber.length == 1 ? `00${orderNumber}`: orderNumber.length == 2 ? `0${orderNumber}`:orderNumber;     //001
        param.ORDER_ID =results.platformOrder.platformOrderId;   //流水号
        param.DATETIME =moment(+results.platformOrder.orderCreateTime).format('YYYY-MM-DD HH:mm:ss');  //日期
        param.MEMO =results.platformOrder.remark;                       //日期
        param.ITEMS=[];
        param.CUSTOMER_ADDRESS = results.platformOrder.address;
        param.USER_NAME = results.platformOrder.name;
        param.USER_MOBILE = results.platformOrder.phone;
        param.ARTICLE_COUNT= +lodash.sumBy(results.platformOrderDetail,'quantity');
        param.ORIGINAL_AMOUNT=results.platformOrder.originalPrice.toFixed(2);
        param.PAYMENT_AMOUNT=results.platformOrder.totalPrice.toFixed(2);
        param.REDUCTION_AMOUNT=(param.ORIGINAL_AMOUNT - param.PAYMENT_AMOUNT).toFixed(2);
        lodash.forEach(results.platformOrderDetail,function (val) {
            let obj = {
                ARTICLE_NAME: val.showName,
                SUBTOTAL : (+val.price * +val.quantity).toFixed(2),
                ARTICLE_COUNT : val.quantity
            };
            param.ITEMS.push(obj)
        });

        let datas = [];
        async.eachLimit(results.printer, 1, function (item, ab) {
            param.PRINTERIP=item.ip;
            param.PRINTERPORT=item.port;
            printerServiceModel.receiptsPrint(param.PRINTERIP,param.PRINTERPORT,`${printTemplateModel.REPORT}/${printTemplateModel.PLATFORM_TOTAL_TEMPLATE_48}`,param,function (err, ben) {
                fileUtil.appendFile(`printLogs`,`${msg.__route__}=>${results.platformOrder.type == 1 ? "【饿了么外卖】":"【美团外卖】" }总单：${msg.platformOrderId},\n,${JSON.stringify(param)}`);
                datas.push(err?err:ben);
                ab()
            });
        }, function (err) {
            if (err) return result.error(next,err.toString(),msg);
            result.success(next, datas);
        });
    });
};





/**
 * 获取平台厨打打印
 *
 * @param  {Object}   msg     request message
 * @param  {Object}   session current session object
 * @param  {Function} next    next step callback
 * @return {Void}
 */
Handler.prototype.getPlatformTicketTemplate = function (msg, session, next) {

    if (result.isEmpty(msg.platformOrderId)) {
        return result.error(next, "请输入订单platformOrderId",msg);
    }
    let conditions  = {
        platformOrderId:msg.platformOrderId
    };
    async.parallel({
        shopDetail: function(cb){
            shopDetail.getShopDetailInfo(conditions,function (err, data) {
                if(err) return cb(err);
                cb(null, data)
            });
        },
        platformOrder: function(cb){
            platformOrder.getPlatformOrderByPlatformOrderId(conditions,function (err,data) {
                if(err) return cb(err);
                cb(null, data)
            });
        },
        platformOrderDetail: function(cb){
            platformOrder.getPlatformOrderDetailAndArticleByPlatformOrderId(conditions,function (err,data) {
                if(err) return cb(err);
                cb(null, data)
            });
        }
    },function(err, results){
        if(err)  return result.error(next, err.toString(),msg);
        if(!results.shopDetail)   return result.error(next, '没有找到店铺信息',msg);
        if(!results.platformOrder) return result.error(next, '没有找到外卖总订单数据',msg);
        if(!results.platformOrderDetail.length) return result.error(next, '没有找到外卖订单详情数据',msg);

        let param = {};
        param.PLATFORM_NAME = results.platformOrder.type == 1 ? "饿了么外卖":"美团外卖";              //平台名称
        let orderNumber = results.platformOrder.orderNumber.toString();
        param.ORDER_NUMBER = orderNumber.length == 1 ? `00${orderNumber}`: orderNumber.length == 2 ? `0${orderNumber}`:orderNumber;     //001
        param.ORDER_ID =results.platformOrder.platformOrderId;   //流水号
        param.DATETIME =moment(+results.platformOrder.orderCreateTime).format('YYYY-MM-DD HH:mm:ss');  //日期
        param.MEMO =results.platformOrder.remark;                       //日期                   //日期
        //厨打是否拆分  0  = 不拆分 1 拆分
        param.ITEMS = [];
        if(results.shopDetail.splitKitchen) {
            let datas = [];
            async.eachLimit(results.platformOrderDetail, 1, function (item, ab) {
                let i = 0;
                async.whilst(
                    function () {
                        return i < +item.quantity;
                    },
                    function (ef) {
                        param.ITEMS = [  {'ARTICLE_NAME': item.show_name, 'ARTICLE_COUNT': 1} ];
                        param.PRINTERIP=item.ip;
                        param.PRINTERPORT=item.port;
                        printerServiceModel.receiptsPrint(param.PRINTERIP,param.PRINTERPORT,`${printTemplateModel.REPORT}/${printTemplateModel.PLATFORM_KITCHEN_TICKET_TEMPLATE_48}`,param,function (err, ben) {
                            fileUtil.appendFile(`printLogs`,`${msg.__route__}=>${results.platformOrder.type == 1 ? "【饿了么外卖】":"【美团外卖】" }厨打：${JSON.stringify(param)}`);
                            datas.push(err?err:ben);
                            i++;
                            setTimeout(ef, 0);
                            if(i == +item.quantity) return   ab()
                        })
                    },
                    function (err) {}
                );
            }, function (err) {
                if (err) return result.error(next,err.toString(),msg);
                result.success(next, datas);
            });
        }else {
            let datas = [];
            async.eachLimit(results.platformOrderDetail, 1, function (item, ab) {
                param.ITEMS = [
                    {'ARTICLE_NAME': item.show_name, 'ARTICLE_COUNT': item.quantity},
                ];
                param.PRINTERIP=item.ip;
                param.PRINTERPORT=item.port;
                printerServiceModel.receiptsPrint(param.PRINTERIP,param.PRINTERPORT,`${printTemplateModel.REPORT}/${printTemplateModel.PLATFORM_KITCHEN_TICKET_TEMPLATE_48}`,param,function (err, ben) {
                    fileUtil.appendFile(`printLogs`,`${msg.__route__}=>${results.platformOrder.type == 1 ? "【饿了么外卖】":"【美团外卖】" }厨打：${JSON.stringify(param)}`);
                    datas.push(err?err:ben);
                    ab()
                })
            }, function (err) {
                if (err) return result.error(next,err.toString(),msg);
                result.success(next, datas);
            });
        }
    });
};

let TotalTemplate = function (data, printPath) {
    let deferred = q.defer();
    let printer = new Printer(data.PRINTERIP, data.PRINTERPORT || 'ETH');
    printer.print(printPath, data, function (res) {
        deferred.resolve({code: 200, msg: res.msg});
    });
    return deferred.promise;
};


/**
 * 平台总单模板
 *
 * @param  {Object}   msg     request message
 * @param  {Object}   session current session object
 * @param  {Function} next    next step callback
 * @return {Void}
 */
Handler.prototype.platformTotalTemplateTest = function (msg, session, next) {

    let param = msg;
    param.PRINTERIP ='192.168.1.224';              // ip
    param.PRINTERPORT ='ETH';                       //端口
    param.PLATFORM_NAME ='店面---';              //店名
    param.ORDER_NUMBER ="001";              //001
    param.ORDER_ID ='1546513212313213';                       //流水号
    param.DATETIME ='2017-12-22 16:55:00';                       //日期
    param.MEMO ='备注备注备注备注备注备注备注备注备注备注-----';                       //日期
    param.ITEMS=[
        {'SUBTOTAL': 20.00, 'ARTICLE_NAME': '鸡蛋仔(买一送一)', 'ARTICLE_COUNT': 1},
        {'SUBTOTAL': 20.00, 'ARTICLE_NAME': '|_鸡蛋仔(买一送一)', 'ARTICLE_COUNT': 1}
    ];
    param.CUSTOMER_ADDRESS = '长宁区金钟路968号长宁区金钟路968号-------------';
    param.USER_NAME = '金先生';
    param.USER_MOBILE = '13127538810';
    param.RESTAURANT_ADDRESS='长宁区金钟路968号凌空SOHO二号楼103';
    param.ORIGINAL_AMOUNT='22.00';
    param.REDUCTION_AMOUNT='1.00';
    param.PAYMENT_AMOUNT='21.00';


    let TotalTemplate = function (data, printPath) {
        let deferred = q.defer();
        let printer = new Printer(param.PRINTERIP, param.PRINTERPORT || 'ETH');
        printer.print(printPath, data, function (res) {
            deferred.resolve({code: 200, msg: res.msg});
        });
        return deferred.promise;
    };
    queue1.go(TotalTemplate, [param, './report/platform_receipt.xml']).then(function (ben) {
        result.success(next, ben);
    });

};









