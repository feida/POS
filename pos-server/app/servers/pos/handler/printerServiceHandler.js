/**
 * @author wxh on 2018/1/3
 * @copyright
 * @desc
 */

const queuefun = require('queue-fun');
const Queue = queuefun.Queue();
const q = queuefun.Q;  //配合使用的Promise流程控制类，也可以使用原生Promise也可以用q.js代替
//实列化一个最大并发为1的队列
const queue1 = new Queue(1);

const result = require("../../../util/resultUtil");

const printTemplateModel = require("../../../constant/printTemplateModel");

const printerServiceModel = require("../../../model/printer-connector/printerService");

module.exports = function (app) {
    return new Handler(app);
};
const Handler = function (app) {
    this.app = app;
};

const handler = Handler.prototype;

/**
 * 小票打印通用模板
 */
handler.receiptsPrint = function (msg, session, next) {

    if (result.isEmpty(msg.PRINTERIP))  return result.error(next, "PRINTERIP is needed",msg);

    if (result.isEmpty(msg.PRINTTEMPLATE))  return result.error(next, "PRINTTEMPLATE is needed",msg);

    if (result.isEmpty(msg.PRINTOBJECT))  return result.error(next, "PRINTOBJECT is needed",msg);

    printerServiceModel.receiptsPrint(msg.PRINTERIP,msg.PRINTERPORT || 'ETH',msg.PRINTTEMPLATE,msg.PRINTOBJECT,function (err, rest) {
        if(err)  return result.error(next, err.toString(),msg);
        return result.success(next,rest);
    })
};


handler.TESTTEST = function (msg, session, next) {
    let param = {};
    param.PRINTERIP = '192.168.1.224';              // ip
    param.PRINTERPORT ='ETH';                       //端口
    param.PRINTTEMPLATE = `${printTemplateModel.REPORT}/${printTemplateModel.PLATFORM_TOTAL_TEMPLATE_48}`;
    param.PRINTOBJECT = {
        PLATFORM_NAME:'店面---',
        ORDER_NUMBER:'001',
        ORDER_ID :'1546513212313213',                       //流水号
        DATETIME :'2017-12-22 16:55:00',                    //日期
        MEMO :'备注备注备注备注备注备注备注备注备注备注-----',              //备注
        ITEMS:[
            {'SUBTOTAL': 20.00, 'ARTICLE_NAME': '鸡蛋仔(买一送一)', 'ARTICLE_COUNT': 1},
            {'SUBTOTAL': 20.00, 'ARTICLE_NAME': '|_鸡蛋仔(买一送一)', 'ARTICLE_COUNT': 1}
        ],
        CUSTOMER_ADDRESS:'长宁区金钟路968号长宁区金钟路968号-------------',
        USER_NAME:'金先生',
        USER_MOBILE:'13127538810',
        RESTAURANT_ADDRESS:'长宁区金钟路968号凌空SOHO二号楼103',
        ORIGINAL_AMOUNT:'22.00',
        REDUCTION_AMOUNT:'1.00',
        PAYMENT_AMOUNT:'21.00',
        BARCODE:'123456'
    };
    printerServiceModel.receiptsPrint(param.PRINTERIP,param.PRINTERPORT,param.PRINTTEMPLATE,param.PRINTOBJECT,function (err, rest) {
        if(err)  return result.error(next, err.toString(),msg);
        return result.success(next,rest);
    })
};

/**
 * 贴纸厨房
 */
Handler.prototype.stickersKitchen = function (msg, session, next) {
    var labelData=
        {
            'CODE':'8888',
            'DISTRIBUTION_MODE':'堂食',
            'ARTICLE_COUNT':'8',
            'SPEC':'#大杯 #加糖 #去冰',
            'ARTICLE_PRICE':'88',
            'RESTAURANT_NAME':'小满手工粉-品尊国际分店',
            'ARTICLE_NUMBER':'1/2',
            'CUSTOMER_TEL':18966668888,
            'DATETIME':'01.18 18:18:18',
            'ARTICLE_NAME':'鸡蛋仔(买一送一)',
            'RESTAURANT_ADDRESS':'上海市浦东新区纳贤路800号科海大楼A座9楼903室'
        };

    // let param = msg;
    // param.RESTAURANT_NAME ='店面';              //店名
    // param.ARTICLE_NUMBER ="1";              //001
    // param.CUSTOMER_TEL ="13127538810";              //001
    // param.DATETIME ='2017-12-22 16:55:00';                       //日期
    // param.ARTICLE_NAME ='萝卜汁';
    // param.RESTAURANT_ADDRESS='长宁区金钟路968号凌空SOHO二号楼103';

    printerServiceModel.stickersPrint('192.168.1.206','ETH','./report/restaurant_label.xml',labelData,function (err, rest) {
        if(err)  return result.error(next, err.toString(),msg);
        return result.success(next,rest);
    })

    // let TotalTemplate = function (data, printPath) {
    //     let deferred = q.defer();
    //     let lp = new LabelPrinter('192.168.1.206', 'ETH');
    //
    //     lp.print(printPath, data, function (res) {
    //         console.log(res)
    //         deferred.resolve({code: 200, msg: res.msg});
    //     });
    //     return deferred.promise;
    // };
    // queue1.go(TotalTemplate, [labelData, './report/restaurant_label.xml']).then(function (ben) {
    //     result.success(next, ben);
    // });
};
