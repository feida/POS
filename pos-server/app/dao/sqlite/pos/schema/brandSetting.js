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
     * @desc 品牌设置表
     * */
    sqlite.models.TbBrandSetting = sqlite.define('tb_brand_setting', {
        id : {type: Sequelize.TEXT,    field:"id",primaryKey: true},
        printType : {type: Sequelize.INTEGER,    field:"print_type"},
        isAllowExtraPrice : {type: Sequelize.INTEGER,    field:"is_allow_extra_price"},
        aliPay : {type: Sequelize.INTEGER,    field:"ali_pay"},
        openUnionPay : {type: Sequelize.INTEGER,    field:"open_union_pay"},
        openShanhuiPay : {type: Sequelize.INTEGER,    field:"open_shanhui_pay"},
        openMoneyPay : {type: Sequelize.INTEGER,    field:"open_money_pay"},
        integralPay : {type: Sequelize.INTEGER,    field:"integral_pay"},
        isUseServicePrice : {type: Sequelize.INTEGER,    field:"is_use_service_price"},
        isMealFee : {type: Sequelize.INTEGER,    field:"is_meal_fee"},
        openPosCharge : {type: Sequelize.INTEGER,    field:"open_pos_charge"},
        openPosReminder : {type: Sequelize.INTEGER,    field:"open_pos_reminder"},
        openOrderRemark : {type: Sequelize.INTEGER,    field:"open_order_remark"},
        turntable : {type: Sequelize.INTEGER,    field:"turntable"},
        openPosDiscount : {type: Sequelize.INTEGER,    field:"open_pos_discount"},
        receiptSwitch : {type: Sequelize.INTEGER,    field:"receipt_switche"},
        openAudit: {type: Sequelize.INTEGER, field: "open_audit"}, // 1 开启， 0 关闭
    }, {
        freezeTableName: true, //默认为false，当为false时，如果你数据库中已有表a的话，sequelize会修改你的表名，后缀加个s
        timestamps:false
    });

    return sqlite;
};