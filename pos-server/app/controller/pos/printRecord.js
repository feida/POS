/**
 * @author wxh on 2018/7/2
 * @copyright
 * @desc
 */

const result = require("../../util/resultUtil");
const moment = require("moment");
const async = require("async");
const { log } = require("../../util/fileUtil");

const printRecordModel = require("../../model/pos/printRecord");

const printerServiceModel = require("../../model/printer-connector/printerService");

/**
 * 执行打印
 * @param msg
 * @param callback
 */
exports.repeatPrintById = function (msg,callback) {
    let id = msg.id;
    if (result.isEmpty(id))  return  callback(`缺少 id！`);
    printRecordModel.findOneInfoAndDestroyById(id,function (err, rely) {
        if (err) return  callback(err);
        if (!rely) return  callback(`未找到该id`);
        if (rely.printType == 1){
            printerServiceModel.receiptsPrint(rely.ip,rely.port,rely.printTemplate,JSON.parse(rely.printContent),function (err,ben) {
                return callback(err,ben);
            })
        }else {
            printerServiceModel.stickersPrint(rely.ip,rely.port,rely.printTemplate,JSON.parse(rely.printContent),function (err,ben) {
                return callback(err,ben);
            })
        }

    })
};


/**
 * 删除打印记录
 * @param msg
 * @param callback
 */
exports.deletePrintRecordById = function (msg,callback) {
    let id = msg.id;
    if (result.isEmpty(id))  return  callback(`缺少 id！`);
    printRecordModel.deletePrintRecordById(id,function (err, rely) {
        callback(err, rely)
    })
};

/**
 * 获取打印记录
 * @param msg
 * @param callback
 */
exports.getPrintRecord = function (msg,callback) {
    let condition = {};
    condition.page_skip = msg.page_skip;
    condition.page_size = msg.page_size;
    condition.status = 0;
    let where = {
        status:condition.status
    };
    if (msg.content && msg.type){
        condition.content = msg.content;
        condition.type = msg.type;
        if (condition.type == 'serialNumber'){
            where.serialNumber ={
                $like: '%' + condition.content + '%'
            }
        }
        if (condition.type == 'tableNumber'){
            where.tableNumber ={
                $like: '%' + condition.content + '%'
            }
        }

        if (condition.type == 'printContent'){
            where.printContent ={
                $like: '%' + condition.content + '%'
            }
        }
    }
    printRecordModel.getPrintRecord(condition,where ,function (err, rely) {
        rely.page_total = Math.ceil(rely.count/msg.page_size);
        callback(err, rely)
    })
};


