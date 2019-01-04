const result = require("../../../util/resultUtil");
const async = require('async');
const fileUtil = require("../../../util/fileUtil");
const customSqlModel = require("../../../model/pos/customSql");

module.exports = function (app) {
    return new Handler(app);
}

var Handler = function (app) {
    this.app = app;
}

var handler = Handler.prototype;


/**
 *  获取今日第三方外卖集合
 *  @param msg
 *  @param session
 *  @param next
 */
handler.todayList = function (msg, session, next) {
    let sql = "SELECT * from tb_platform_order where date(datetime(SUBSTR(order_create_time,0,11), 'unixepoch', 'localtime')) = date('now')";
    customSqlModel.getAllCustomSqlInfo(sql, function (error, data) {
        result.success(next, data);
    })
};

/**
 * 写入远程第三方外卖信息
 * @param msg
 * @param session
 * @param next
 */
handler.insertSelectiveByPlatformOrderId = function (msg, session, next) {
    let platformOrder = msg.model.order;
    let orderDetailList = msg.model.orderDetail;
    let orderExtraList = msg.model.orderExtra;
    async.waterfall([
        function (cb) {  //  基础验证
            if (platformOrder && platformOrder.id) {
                fileUtil.appendFile(`orderLogs`, `${msg.__route__}=>【外卖订单】${platformOrder.id},\n,${JSON.stringify(msg)}`);
                let sql = `SELECT * from tb_platform_order where id = '${platformOrder.id}'`;
                customSqlModel.getOneCustomSqlInfo(sql, function (error, order) {
                    if (!order) {
                        let platformOrderModel = {
                            id: platformOrder.id,
                            type: platformOrder.type,
                            platform_order_id: platformOrder.platformOrderId,
                            shop_detail_id: platformOrder.shopDetailId,
                            original_price: platformOrder.originalPrice,
                            total_price: platformOrder.totalPrice,
                            address: platformOrder.address,
                            phone: platformOrder.phone,
                            name: platformOrder.name,
                            order_create_time: platformOrder.orderCreateTime,
                            pay_type: platformOrder.payType,
                            remark: platformOrder.remark
                        };
                        sql = "SELECT count(id) orderCount from tb_platform_order where date(datetime(SUBSTR(order_create_time,0,11), 'unixepoch', 'localtime')) = date('now')";
                        customSqlModel.getOneCustomSqlInfo(sql, function (error, count) {
                            platformOrderModel.order_number = ++count.orderCount;
                            cb(null, platformOrderModel);
                        });
                    } else {
                        cb("外卖订单已存在");
                    }
                });
            } else {
                cb("无效的外卖订单");
            }
        },
        function (platformOrderModel, cb) {  //  插入外卖主订单
            customSqlModel.insertSelective('tb_platform_order', platformOrderModel, function (error, reply) {
                if (error != null) {
                    cb(error);
                }
                cb(null);
            });
        },
        function (cb) {  //  插入外卖订单项
            if (orderDetailList && orderDetailList.length > 0) {
                async.eachLimit(orderDetailList, 1, function (entity, callback) {
                    let orderDetailInfo = {
                        id: entity.id,
                        platform_order_id: entity.platformOrderId,
                        name: entity.name,
                        price: entity.price,
                        quantity: entity.quantity,
                        show_name: entity.showName
                    }
                    customSqlModel.insertSelective('tb_platform_order_detail', orderDetailInfo, function (err, reply) {
                        callback(err, reply);
                    })
                }, function (error) {
                    if (error != null) {
                        cb(error);
                    }
                    cb(null);
                })
            } else {
                cb(null);
            }
        },
        function (cb) {  //  插入外卖支付项
            if (orderExtraList && orderExtraList.length > 0) {
                async.eachLimit(orderExtraList, 1, function (entity, callback) {
                    let orderDetailInfo = {
                        id: entity.id,
                        platform_order_id: entity.platformOrderId,
                        name: entity.name,
                        price: entity.price,
                        quantity: entity.quantity
                    }
                    customSqlModel.insertSelective('tb_platform_order_extra', orderDetailInfo, function (err, reply) {
                        callback(err, reply);
                    })
                }, function (error) {
                    if (error != null) {
                        cb(error);
                    }
                    cb(null);
                })
            } else {
                cb(null);
            }
        }
    ], function (err) {
        if (err) {
            console.log("insertSelectiveByPlatformOrderId", err);
            result.error(next, err.toString(), msg);
        } else {
            result.success(next, platformOrder.platformOrderId);
        }
    });
};