/**
 * @author wxh on 2018/7/2
 * @copyright
 * @desc
 */

const result = require("../../util/resultUtil");
const tablePathModel = require("../../constant/tablePathModel");
const moment = require("moment");
const async = require("async");
const { log } = require("../../util/fileUtil");

const changeTableModel = require("../../model/pos/changeTable");

/**
 * 保存需要更新的表
 * @param msg
 * @param callback
 */
exports.saveChangeTable = function (msg,callback) {
    if (typeof callback != 'function') {
        callback = function () { };
    }
    let param=JSON.parse(msg.data);
    if (result.isEmpty(param.tableName))  return  callback(`缺少 tableName`);
    if (tablePathModel[param.tableName] == `undefined`)  return  callback(`未找到${msg.type}表`);
    let obj = {
        tableName:param.tableName,
        tablePath:tablePathModel[param.tableName],
        updateType:param.type
    };
    changeTableModel.upsert(obj)
};

/**
 * 获取需要更新的表的总数
 * @param msg
 * @param callback
 */
exports.getCountTable = function (msg,callback) {
    changeTableModel.count(function (err, count) {
        callback(err, count)
    })
};


/**
 * 获取需要更新的表
 * @param msg
 * @param callback
 */
exports.getAllTable= function (msg,callback) {
    changeTableModel.findAll(function (err, rely) {
        callback(err, rely)
    })
};

/**
 * 删除数据
 * @param msg
 * @param callback
 */
exports.destroyByTableName= function (msg,callback) {
    changeTableModel.destroyByTableName(msg,function (err, rely) {
        callback(err, rely)
    })
};