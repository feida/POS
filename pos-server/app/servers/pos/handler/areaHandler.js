const customSqlModel = require("../../../model/pos/customSql");
const areaModel = require("../../../model/pos/area");
const result = require("../../../util/resultUtil");
const orderState = require("../../../constant/OrderState");
const productionStatus = require("../../../constant/ProductionStatus");
const async = require('async');

module.exports = function (app) {
    return new Handler(app);
}

var Handler = function (app) {
    this.app = app;
}

var handler = Handler.prototype;


/**
 * 获取 餐位区域 集合
 * @param msg
 * @param session
 * @param next
 */
handler.list = function (msg, session, next) {
    let sql = "select * from tb_area";
    customSqlModel.getAllCustomSqlInfo(sql, function (error, data) {
        result.success(next, data);
    })
};