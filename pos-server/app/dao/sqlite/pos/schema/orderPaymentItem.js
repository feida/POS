/**
 * @author wxh on 2017/10/31
 * @copyright
 * @desc
 */

const Sequelize = require('sequelize');
exports.define = function (sqlite) {
    if (!sqlite.models) {
        sqlite.models = {}
    }
    /**
     * @desc 订单支付项
     * */
    sqlite.models.TbOrderPaymentItem = sqlite.define('tb_order_payment_item', {
        id: {type: Sequelize.TEXT, primaryKey: true},                               //id
        orderId: {type: Sequelize.TEXT, field: "order_id"},                         //订单ID
        paymentModeId: {type: Sequelize.INTEGER, field: "payment_mode_id"},         //支付类型
        payValue: {type: Sequelize.REAL, field: "pay_value"},                    //支付金额
        payTime: {type: Sequelize.TEXT, field: "pay_time"},                         //支付时间
        remark: {type: Sequelize.TEXT, field: "remark"},                            //备注
        resultData: {type: Sequelize.TEXT, field: "result_data"},                   //用于记录 第三方支付的回调
        isUseBonus: {type: Sequelize.INTEGER, field: "is_use_bonus"},                  //是否用于分红
        toPayId: {type: Sequelize.TEXT, field: "to_pay_id"},                  //是否用于分红
        refundSourceId: {type: Sequelize.TEXT, field: "refund_source_id"} // 退款来源
    }, {
        freezeTableName: true, //默认为false，当为false时，如果你数据库中已有表a的话，sequelize会修改你的表名，后缀加个s
        timestamps: false
    });

    return sqlite;
};
