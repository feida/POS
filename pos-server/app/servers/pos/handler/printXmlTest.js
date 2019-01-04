/**
 * @author wxh on 2018/1/3
 * @copyright
 * @desc
 */

const path = require("path");
const fs = require("fs");
const moment = require("moment");
const async = require("async");
const lodash = require("lodash");
const queuefun = require('queue-fun');
const Queue = queuefun.Queue();
const q = queuefun.Q;  //配合使用的Promise流程控制类，也可以使用原生Promise也可以用q.js代替
//实列化一个最大并发为1的队列
const queue1 = new Queue(1);
const result = require("../../../util/resultUtil");
const Printer = require('../../../lib/printer/Printer').Printer;
module.exports = function (app) {
    return new Handler(app);
};
var Handler = function (app) {
    this.app = app;
};

/**
 * 小票厨房
 */
Handler.prototype.receiptsKitchen = function (msg, session, next) {

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
    param.BARCODE='123456';

    let TotalTemplate = function (data, printPath) {
        let deferred = q.defer();
        let printer = new Printer(param.PRINTERIP, param.PRINTERPORT || 'ETH');
        printer.print(printPath, data, function (res) {
            deferred.resolve({code: 200, msg: res.msg});
        });
        return deferred.promise;
    };

    queue1.go(TotalTemplate, [param, './report/test.xml']).then(function (ben) {
        result.success(next, ben);
    });
};


/**
 * 贴纸厨房
 */
Handler.prototype.stickersKitchen = function (msg, session, next) {
    let param = msg;
    param.RESTAURANT_NAME ='店面';              //店名
    param.ARTICLE_NUMBER ="1";              //001
    param.CUSTOMER_TEL ="13127538810";              //001
    param.DATETIME ='2017-12-22 16:55:00';                       //日期
    param.ARTICLE_NAME ='萝卜汁';
    param.RESTAURANT_ADDRESS='长宁区金钟路968号凌空SOHO二号楼103';

    let TotalTemplate = function (data, printPath) {
        let deferred = q.defer();
        let printer = new Printer('localhost', 'ETH','Gprinter  GP-3150TN');
        printer.print(printPath, data, function (res) {
            console.log(res)
            deferred.resolve({code: 200, msg: res.msg});
        });
        return deferred.promise;
    };
    queue1.go(TotalTemplate, [param, './report/restaurant_label.xml']).then(function (ben) {
        result.success(next, ben);
    });
};

// /**
//  * 打开钱箱
//  */
// Handler.prototype.openCashbox = function (msg, session, next) {
//     let printer = new Printer(`192.168.1.225`, 'ETH');
//     printer.openCashbox(function (res) {
//         result.success(next, res);
//     });
// };

