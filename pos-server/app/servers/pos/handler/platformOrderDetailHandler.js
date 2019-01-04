const platformOrderDetailModel = require("../../../model/pos/platformOrderDetail");
const result = require("../../../util/resultUtil")
const customSqlModel = require("../../../model/pos/customSql");

const async = require("async");

module.exports = function (app) {
    return new Handler(app);
}

var Handler = function (app) {
    this.app = app;
}

var handler = Handler.prototype;


/**
 * 根据 订单id查询订单详情
 * @param msg
 * @param session
 * @param next
 */
handler.getOrderInfoByOrderId = function (msg, session, next) {

    platformOrderDetailModel.getPlatformOrderDetailByPlatformOrderId(msg.orderId, function (error, data) {
        if (error) result.error(next, error.toString(), msg);
        result.success(next, data);
    })
}



/**
 * 批量插入 第三方订单详情信息
 * @param msg
 * @param session
 * @param next
 */
handler.batchInsertPlatformOrderDetail = function (msg, session, next) {
    async.eachLimit(msg.dataList, 1, function (entity, callback) {
        let orderEx = {
            id: entity.id,
            platform_order_id: entity.platformOrderId,
            name: entity.name,
            price: entity.price,
            quantity: entity.quantity,
            show_name: entity.showName
        };
        customSqlModel.insertSelective('tb_platform_order_detail', orderEx, function (err, reply) {
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