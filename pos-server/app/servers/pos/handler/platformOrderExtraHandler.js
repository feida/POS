const customSqlModel = require("../../../model/pos/customSql");

const result = require("../../../util/resultUtil");
const async = require("async");

module.exports = function (app) {
    return new Handler(app);
}

var Handler = function (app) {
    this.app = app;
}

var handler = Handler.prototype;

/**
 * 批量插入 第三方外卖附加信息
 * @param msg
 * @param session
 * @param next
 */
handler.batchInsertPlatformOrderExtra = function (msg, session, next) {
    async.eachLimit(msg.dataList, 1, function (entity, callback) {
        let orderEx = {
            id: entity.id,
            platform_order_id: entity.platformOrderId,
            name: entity.name,
            price: entity.price,
            quantity: entity.quantity
        }
        customSqlModel.insertSelective('tb_platform_order_extra', orderEx, function (err, reply) {
            callback(err, reply);
        })
    }, function (error) {
        if (error != null) {
            result.error(next, error.toString(), msg);
            return;
        }
        result.success(next);
    })
}