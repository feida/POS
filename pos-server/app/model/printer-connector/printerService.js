/**
 * @author wxh on 2018/1/14
 * @copyright
 * @desc
 */
const fileUtil = require("../../util/fileUtil");
const queuefun = require('queue-fun');
const uuidV4 = require('uuid/v4');
const Queue = queuefun.Queue();
const q = queuefun.Q;  //配合使用的Promise流程控制类，也可以使用原生Promise也可以用q.js代替
//实列化一个最大并发为1的队列
const queue1 = new Queue(1, {
    "event_succ": function (data) {
        // fileUtil.appendFile(`总单打印第四步`, `【队列执行成功】流水号:${data.PRINTOBJECT.ORDER_ID ? data.PRINTOBJECT.ORDER_ID : ''},【执行数据】:${JSON.stringify(data)}`);
    }  //成功
    , "event_err": function (err) {
        // fileUtil.appendFile(`总单打印第四步`, `【队列执行失败error】${JSON.stringify(err)}`);
    }  //失败
});
const Printer = require('../../lib/printer/Printer').Printer;

const LabelPrinter = require('../../lib/printer/LabelPrinter').LabelPrinter;


const posSqlite = require('../../dao/sqlite/pos').client;
const printRecord = posSqlite.model('tb_print_record');

const printerModel = require("../../model/pos/printer");

const async = require('async');

let num = 1;
/**
 * @desc 小票通用打印
 * */
exports.receiptsPrint = function (PRINTERIP, PRINTERPORT, PRINTTEMPLATE, PRINTOBJECT, callback) {
    let TotalTemplate = function (data, printPath) {
        let deferred = q.defer();
        let printer = new Printer(PRINTERIP, PRINTERPORT || 'ETH');
        printer.print(printPath, data, function (res) {
            res.PRINTOBJECT = data;
            res.standbyIp = null;
            if (res.code==200) {
                return  deferred.resolve(res);
            }
            let content = {
                id:uuidV4().replace(/-/g, ""),
                serialNumber:res.PRINTOBJECT.ORDER_ID,
                tableNumber:res.PRINTOBJECT.TABLE_NUMBER,
                orderTime:res.PRINTOBJECT.DATETIME,
                distributionMode:res.PRINTOBJECT.DISTRIBUTION_MODE,
                ip:PRINTERIP,
                port:PRINTERPORT,
                printType:1,
                printTemplate:printPath,
                printContent:JSON.stringify(data),
                status:res.code == 200 ? 1:0,
                remark:res.msg
            };

            printerModel.findOneInfoByIp(PRINTERIP,function (err, revl) {
                if (err) {
                    fileUtil.appendFile(`查询${PRINTERIP}的备用打印机报错==>`,`${err}`);
                    printRecord.build(content).save().then(function (result) {});
                    deferred.resolve(res);
                }else {
                    if (revl.spareIp == null ||revl.spareIp =="" ){
                            fileUtil.appendFile(`启用备用打印机==>`,`未设置备用打印机`);
                            printRecord.build(content).save().then(function (result) {});
                            deferred.resolve(res);
                    }else {
                        let printer_spare = new Printer(revl.spareIp, PRINTERPORT || 'ETH');
                        printer_spare.print(printPath, data, function (resTo) {
                            resTo.PRINTOBJECT = data;
                            resTo.standbyIp = revl.spareIp;
                            fileUtil.appendFile(`启用${PRINTERIP}的备用打印机==>`,`打印机${PRINTERIP}报错、启动备用打印机IP${revl.spareIp},${resTo.code != 200 ? "失败error" : "成功"}`);
                            if (res.code!=200){
                                printRecord.build(content).save().then(function (result) {});
                            }
                            deferred.resolve(resTo);
                        })
                    }

                }
            })
        });
        return deferred.promise;
    };

    queue1.go(TotalTemplate, [PRINTOBJECT, PRINTTEMPLATE]).then(function (ben) {
        fileUtil.appendFile(`小票打印==>`, `【${ben.standbyIp?`备用`:``}小票打印${ben.code != 200 ? "失败error" : "成功"}】流水号:${PRINTOBJECT.ORDER_ID ? PRINTOBJECT.ORDER_ID : ''},『${ben.standbyIp?ben.standbyIp:PRINTERIP}』  『${PRINTTEMPLATE}』『${JSON.stringify(ben)}』  \n【打印数据】:${JSON.stringify(PRINTOBJECT)}`);
        if (ben.code != 200) { return callback(ben.msg); }
        return callback(null, ben.msg);
    });
};

/**
 * @desc 贴纸通用打印
 * */
exports.stickersPrint = function (PRINTERIP, PRINTERPORT, PRINTTEMPLATE, PRINTOBJECT, callback) {
    let TotalTemplate = function (data, printPath) {
        let deferred = q.defer();
        let printer = new LabelPrinter(PRINTERIP, PRINTERPORT || 'ETH');
        printer.print(printPath, data, function (res) {
            res.PRINTOBJECT = data;
            res.standbyIp = null;
            if (res.code==200) {
                return  deferred.resolve(res);
            }
            let content = {
                id:uuidV4().replace(/-/g, ""),
                serialNumber:res.PRINTOBJECT.ORDER_ID,
                tableNumber:res.PRINTOBJECT.CODE,
                orderTime:res.PRINTOBJECT.DATETIME,
                distributionMode:res.PRINTOBJECT.DISTRIBUTION_MODE,
                ip:PRINTERIP,
                port:PRINTERPORT,
                printType:2,
                printTemplate:printPath,
                printContent:JSON.stringify(data),
                status:res.code == 200 ? 1:0,
                remark:res.msg
            };
            printerModel.findOneInfoByIp(PRINTERIP,function (err, revl) {
                if (err) {
                    fileUtil.appendFile(`查询${PRINTERIP}的备用打印机报错==>`,`${err}`);
                    printRecord.build(content).save().then(function (result) {});
                    deferred.resolve(res);
                }else {
                    if (revl.spareIp == null ||revl.spareIp =="" ){
                        fileUtil.appendFile(`启用${PRINTERIP}的备用打印机==>`,`${PRINTERIP}未设置备用打印机`);
                        printRecord.build(content).save().then(function (result) {});
                        deferred.resolve(res);
                    }else {
                        let printer_spare = new Printer(revl.spareIp, PRINTERPORT || 'ETH');
                        printer_spare.print(printPath, data, function (resTo) {
                            resTo.PRINTOBJECT = data;
                            resTo.standbyIp = revl.spareIp;
                            fileUtil.appendFile(`启用${PRINTERIP}的备用打印机==>`,`打印机${PRINTERIP}报错、启动备用打印机IP${revl.spareIp},${resTo.code != 200 ? "失败error" : "成功"}`);
                            if (res.code!=200){
                                printRecord.build(content).save().then(function (result) {});
                            }
                            deferred.resolve(resTo);
                        })
                    }
                }
            })
        });
        return deferred.promise;
    };

    queue1.go(TotalTemplate, [PRINTOBJECT, PRINTTEMPLATE]).then(function (ben) {
        fileUtil.appendFile('贴纸打印==>', `【${ben.standbyIp?`备用`:``}贴纸打印总服务${ben.code != 200 ? "失败" : "成功"}】: 『${ben.standbyIp?ben.standbyIp:PRINTERIP}』  『${PRINTTEMPLATE}』 『${JSON.stringify(ben)}』 \n ${JSON.stringify(PRINTOBJECT)}`);
        if (ben.code != 200) return callback(ben.msg);
        return callback(null, ben.msg);
    });
};

