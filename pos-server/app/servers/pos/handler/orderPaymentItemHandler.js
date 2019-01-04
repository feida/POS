const orderPaymentItemMode = require('../../../model/pos/orderPaymentItem');
const result = require("../../../util/resultUtil");
const generalUtil = require("../../../util/generalUtil");
const webSocketClient = require("../../../util/webSocketClient")
const async = require('async');
const payMode = require('../../../constant/PayMode');

module.exports = function (app) {
    return new Handler(app);
}

var Handler = function (app) {
    this.app = app;
}

var handler = Handler.prototype;
const customSqlModel = require("../../../model/pos/customSql");
/**
 * 批量插入 支付项
 * @param msg
 * @param session
 * @param next
 */
handler.batchInsertPayment = function (msg, session, next) {
    async.eachLimit(msg.dataList, 1, function (entity, callback) {
        orderPaymentItemMode.save(entity, function (error, reply) {
            callback(error || null);
        });
    }, function (error) {
        if (error != null) {
            result.error(next, error.toString(), msg);
            return;
        }
        result.success(next);
    });
}


/**
 * 郭峰 添加
 * 通过订单ID 查询订单支付项
 * @param msg
 * @param session
 * @param next
 * */
handler.selectByOrderId = function (msg, session, next) {
    var sql = `SELECT payment_mode_id,sum(pay_value) pay_value, result_data, to_pay_id from tb_order_payment_item where order_id in 
                ( SELECT id FROM tb_order WHERE parent_order_id = '${msg.orderId}' or id = '${msg.orderId}' ) 
                and payment_mode_id not in ('13','14','15','20','21')  GROUP BY payment_mode_id`;
    customSqlModel.getAllCustomSqlInfo(sql, function (err, data) {
        var orderPayments = [];
        for (var item of data) {
            orderPayments.push(generalUtil.convertHumpName(item));
        }
        result.success(next, orderPayments);
    });

}



handler.getPaymentItemListByOrderId = function (msg, session, next) { // TODO:
    let sql = `SELECT payment_mode_id,pay_value pay_value, result_data from tb_order_payment_item where order_id in ( SELECT id FROM tb_order WHERE parent_order_id = '${msg.orderId}' or id = '${msg.orderId}' ) and payment_mode_id not in ('13','14','15','20','21')`;
    customSqlModel.getAllCustomSqlInfo(sql, function (err, data) {
        var orderPayments = [];
        for (var item of data) {
            orderPayments.push(generalUtil.convertHumpName(item));
        }
        result.success(next, orderPayments);
    });

}

/**
 * 批量插入退款数据
 * @param msg
 * @param session
 * @param next
 */
handler.insertRefundPaymentItems = function (msg, session, next) {
    let refundPaymentItems = msg.refundPaymentItems || [];
    async.eachLimit(refundPaymentItems, 1, function (item, callback) {
        let param = convertEntity(item);
        param.id = param.id || generalUtil.randomUUID();
        customSqlModel.insertSelective('tb_order_payment_item', param, function (error, reply) {
            callback(error || null);
        })
    }, function (error, resultData) {
        if (error) {
            result.error(next, "退菜失败：" + (error.toString() || "未知错误"))
        } else {
            result.success(next, resultData);
        }
    })
};

let convertEntity = function (entity) {
    return {
        id: entity.id,
        order_id: entity.orderId,
        pay_time: formatServerTime(entity.payTime),
        pay_value: entity.payValue,
        payment_mode_id: entity.paymentModeId,
        remark: entity.remark||'',
        result_data: entity.resultData||'',
        refund_source_id: entity.refundSourceId||'',
    }
};

let formatServerTime = function (str) {
    str = str.toString();
    if (str.indexOf(".") != -1) {
        return str.substring(0, str.lastIndexOf("."));
    } else {
        return str;
    }
};

/**
 * @param msg
 * @param session
 * @param next
 * **/
handler.insertPayment = function (msg, session, next) {// 4、插入支付项
    let orderId = msg.orderId;
    let paymentItems = msg.paymentItems || [];
    let updateOrderPaymentData = [];
    async.eachLimit(paymentItems, 1, function (payType, e_cb) {
        var item = {
            id: payType.id || generalUtil.randomUUID(),
            orderId: msg.orderId,
            paymentModeId: payType.type,
            payValue: payType.payValue,
            remark: payMode.getPayModeName(parseInt(payType.type)) + "：" + payType.payValue,
            payTime: payType.payTime || `${dateUtil.timestamp()}`,
            toPayId: payType.toPayId || ''
        };
        updateOrderPaymentData.push(item);
        orderPaymentItemMode.upsert(item, function (error) {
            // console.log('===============111================', msg.orderId, payType.type, updateOrderPaymentData)
            // webSocketClient.orderPay(msg.orderId, payType.type, updateOrderPaymentData, function () {
            e_cb(error || null);
            // })
        });
    }, function (error) {
        if (error != null) {
            result.error(next, error.toString(), msg);
            return;
        }
        // let updateData = [{
        //     orderPaymentItem: updateOrderPaymentData
        // }]
        // webSocketClient.syncUpdateData(JSON.stringify(updateData), null)
        result.success(next);
    });
};

/**
 * 根据orderId查询支付项支付类型
 * @param msg
 * @param session
 * @param next
 */
handler.getPaymentTypeByOrderId = function (msg, session, next) {
    let sql = `SELECT payment_mode_id from tb_order_payment_item where order_id = '${msg.orderId}' and payment_mode_id != 25; `;
    customSqlModel.getOneCustomSqlInfo(sql, function (err, data) {
        if (data) {
            result.success(next, { payment_mode_id: data.payment_mode_id });
        } else {
            result.error(next, '支付项不存在', msg);
        }
    });

}
