const customSql = require("../../../model/pos/customSql");
const result = require("../../../util/resultUtil");
const shopDetail = require("../../../../config/shopDetail");
const httpClient = require("../../../util/httpClient");

// const customerController = require("../../../controller/pos/customer");
module.exports = function (app) {
    return new Handler(app);
}

var Handler = function (app) {
    this.app = app;
}

var handler = Handler.prototype;

/**
 * 写入远程用户数据
 * @param msg
 * @param session
 * @param next
 */
handler.insertSelectiveByCustomerId = function (msg, session, next) {
    //  格式化数据
    let customerInfo = msg.model;
    //  插入或更新
    let sql = `select * from tb_customer where id = '${customerInfo.id}'`;
    customSql.getOneCustomSqlInfo(sql, function (error, customer) {
        if (error) {
            return result.error(next, error.toString())
        }
        if (customer && customer.id) {    //  更新
            return result.success(next);
        } else {
            customSql.insertSelective('tb_customer', customerInfo, function (error) {
                if (error ) {
                    return result.error(next, error.toString(), msg);
                }
                result.success(next);
            });
        }
    });
}

// 根据customer_id
handler.selectByCustomerId = function (msg, session, next) {
    if (result.isEmpty(msg.customerId)) {
        return result.success(next, null);
    } else {
        let sql = `select * from tb_customer where id = '${msg.customerId}' ;`;
        customSql.getOneCustomSqlInfo(sql, function (error, customerInfo) { // TODO:
            if (error) {
                return result.error(next, error.toString(), msg);
            }
            result.success(next, customerInfo);
        })
    }
};


/**
 * 远程获取会员状态
 * @param msg
 * @param session
 * @param next
 */
handler.getMembersStateByCustomerId = function (msg, session, next) {
    if (result.isEmpty(msg.customerId)) {
        return result.success(next, null);
    } else {
        let status = true;
        setTimeout(function yc() {
           if (status){ return result.success(next,null)}
        },5000);
        httpClient.post("getCustomerConsumeInfo", { customerId: msg.customerId }, function (consumeInfo) {
            status = false;
            result.success(next,consumeInfo)
        }, function () {
            status = false;
            result.success(next,null)
        });
    }
};