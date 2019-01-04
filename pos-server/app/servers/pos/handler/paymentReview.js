const result = require("../../../util/resultUtil");
const paymentReview = require('../../../controller/pos/paymentReview');
const customSqlModel = require("../../../model/pos/customSql");
const requestUtil = require("../../../util/requestUtil")
const shopDetail = require('../../../../config/shopDetail');
const payMode = require("../../../constant/PayMode")
const dateUtil = require("../../../util/dateUtil")

module.exports = function (app) {
    return new Handler(app);
}

var Handler = function (app) {
    this.app = app;
}

var handler = Handler.prototype;


/**
 * 查询所有的支付项
 * @param msg
 * @param session
 * @param next
 */
handler.findAllPaymentList = function (msg, session, next) {
    paymentReview.findAllPaymentList(msg, (err, reply) => {
       // var payList = reply.filter(item => {
       //     if (item.money != 0) return item;
       //     if (item.paymentModeId == 29 || item.paymentModeId == 30)  return item;
       // })
        if (reply && reply.length > 0) {
            reply.filter(item => {
                if (item.money < 0) {
                    item.money = - item.money
                    item.auditMoney = - item.auditMoney
                }
                if (item.money == 0 && (item.paymentModeId != 29 || item.paymentModeId != 30)) {
                    return
                }
            })
        }
        return err ? result.error(next,err.toString(),msg) : result.success(next, reply);
    });
};

/**
 * 复合金额
 */
handler.checkReport = function (msg, session, next) {
    paymentReview.checkReport(msg, (error, reply, data) => {
        var data = JSON.parse(data)
        return error ? result.success(next, {
            success: false,
            syncSuccess: data.success,
        }, msg) : result.success(next, {
            success: true,
            syncSuccess: data.success,
            dailyLogId: reply.dailyLogOperation.id
        })
    })
}


/**
 * 检查是否开启复合数据
 * */
handler.isOpenPaymentReview = function (msg, session, next) {
    let sql = `SELECT open_audit openAudit FROM tb_brand_setting`;
    customSqlModel.getOneCustomSqlInfo(sql, (error, reply) => {
        if (error) result.error(next, error.toString());
        result.success(next, reply)
    })
}

/**
 * 打印
 * */
handler.checkPrint = function (msg, session, next) {
    if(!msg.printDate) {
        return result.error(next, '请选择打印时间')
    }
    requestUtil.post('insertPrintLog', {
        printDate: dateUtil.formatDateTime("yyyy-MM-dd HH:mm:ss"),
        shopId: shopDetail.id,
        brandId: shopDetail.brandId,
        operator: msg.operator,
    }, (err, data) => {
        if (err) return result.error(next, err.toString())
        result.success(next, {
            message: '打印成功',
            success: true,
            data: {}
        })
    });
}


handler.checkSuccess = function (msg, session, next) {
    var date = msg.date;
    var sql = `SELECT * FROM tb_payment_review WHERE create_time = (SELECT  create_time FROM tb_payment_review WHERE create_time like '%${date}%' ORDER BY create_time DESC LIMIT 1) `
    customSqlModel.getAllCustomSqlInfo(sql, (err, reply) => {
        if (err) return result.success(next, err.toString())
        if (reply && reply.length <=0) return result.success(next, {
            success: true,
            message: '暂无数据',
            data: []
        })
        let paymentList = []
        if (reply && reply.length > 0) {
            for (let i = 0; i < reply.length; i++ ) {
                paymentList.push({
                    name: payMode.getPaymentNameById(reply[i].payment_mode_id),
                    money : reply[i].report_money,
                    auditMoney: reply[i].audit_money,
                    createTime: reply[i].create_time,
                    operator: reply[i].operator
                })
            }
        }
        return result.success(next, {
            success: true,
            data: paymentList
        })
    })
}