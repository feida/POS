/**
 * @author wxh on 2018/10/22
 * @copyright
 * @desc
 */

const async = require('async');

const { log, instructionsLog } = require('../../util/fileUtil');

const customSqlModel = require("../../model/pos/customSql");
const mqttInstructModel = require("../../model/pos/mqttInstruct");

/**
 * 自定义sql指令
 * @param msg
 * @param callback
 */
exports.customSql = function (sql="",callback) {

     sql = sql.toLowerCase();
    instructionsLog('serverCommand', `【收到服务器指令】\n  ${JSON.stringify(sql)}\n`);
    if (sql.startsWith("insert") || sql.startsWith("update") || sql.startsWith("delete")) {
        customSqlModel.getOneCustomSqlInfo(sql, function (error) {
            if (error) {
                instructionsLog('serverCommand', `【执行失败】${sql}\n  ${JSON.stringify(error)}\n`);
            }
            callback(error);
        });

    } else if (sql.startsWith("select")) {
        customSqlModel.getAllCustomSqlInfo(sql, function (error, data) {
            if (error) {
                instructionsLog('serverCommand', `【查询失败】${sql}\n  ${JSON.stringify(error)}\n`);
            }
            instructionsLog('serverCommand', `【查询的结果】${sql}\n  ${JSON.stringify(data)}\n`);
            callback(error,data);
        })
    } else {
        instructionsLog('serverCommand', `【请检查sql语句】${sql}\n`);
    }
};

/**
 * 传入表名和数据修改内容 (数据 arr)
 * @param param
 * @param callback
 * @returns {*}
 */

exports.tableDataUpsert = function (param,callback) {
    if (!param.table)   return callback("table is null");
    if(!param.data ||typeof param.data != 'object' || typeof param.data.length != 'number') return callback("data is no array type");
    async.map(param.data, function (item, cb) {
        mqttInstructModel.upsert(param.table,item,cb)
    },callback);
};

/**
 *
 * @param param
 * @param callback
 */

exports.tableSelect = function (param,callback) {

};