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
     * @desc 订单表  INTEGER  REAL
     * */
    sqlite.models.TbOrder = sqlite.define('tb_order', {
        id: { type: Sequelize.TEXT, primaryKey: true, field: "id" },
        tableNumber: { type: Sequelize.TEXT, field: "table_number" },
        customerCount: { type: Sequelize.INTEGER, field: "customer_count", defaultValue: 0 },
        accountingTime: { type: Sequelize.TEXT, field: "accounting_time" },
        orderState: { type: Sequelize.INTEGER, field: "order_state", defaultValue: 1 },  // 默认 1  待下单状态
        productionStatus: { type: Sequelize.INTEGER, field: "production_status", defaultValue: 0 }, // 默认 0 待下单状态
        originalAmount: { type: Sequelize.INTEGER, field: "original_amount", defaultValue: 0 },
        orderMoney: { type: Sequelize.INTEGER, field: "order_money", defaultValue: 0 },
        originMoney: { type: Sequelize.INTEGER, field: "origin_money" }, // 折扣前原价
        articleCount: { type: Sequelize.INTEGER, field: "article_count", defaultValue: 0 },
        serialNumber: { type: Sequelize.TEXT, field: "serial_number", defaultValue: '' },
        allowCancel: { type: Sequelize.INTEGER, field: "allow_cancel", defaultValue: 1 },  // 默认 1 ，允许取消
        closed: { type: Sequelize.INTEGER, field: "closed", defaultValue: 0 },
        createTime: { type: Sequelize.TEXT, field: "create_time" },
        pushOrderTime: { type: Sequelize.TEXT, field: "push_order_time" },
        printOrderTime: { type: Sequelize.TEXT, field: "print_order_time" },
        remark: { type: Sequelize.TEXT, field: "remark" },
        distributionModeId: { type: Sequelize.INTEGER, field: "distribution_mode_id", defaultValue: 0 },
        amountWithChildren: { type: Sequelize.INTEGER, field: "amount_with_children", defaultValue: 0 },
        parentOrderId: { type: Sequelize.TEXT, field: "parent_order_id" },
        servicePrice: { type: Sequelize.INTEGER, field: "service_price", defaultValue: 0 },
        isPosPay: { type: Sequelize.INTEGER, field: "is_pos_pay", defaultValue: 0 },  // 默认为 0 ，当在 pos端买单时，设置为 1
        payType: { type: Sequelize.INTEGER, field: "pay_type", defaultValue: 1 },     //pos2.0默认后付
        countWithChild: { type: Sequelize.INTEGER, field: "count_with_child", defaultValue: 0 },
        allowContinueOrder: { type: Sequelize.INTEGER, field: "allow_continue_order", defaultValue: 0 },
        paymentAmount: { type: Sequelize.INTEGER, field: "payment_amount", defaultValue: 0 },
        customerId: { type: Sequelize.TEXT, field: "customer_id", defaultValue: 0 },
        customerAddressId: { type: Sequelize.TEXT, field: "customer_address_id" },
        verCode: { type: Sequelize.TEXT, field: "ver_code" },
        payMode: { type: Sequelize.INTEGER, field: "pay_mode", defaultValue: 0 },
        mealFeePrice: { type: Sequelize.REAL, field: "meal_fee_price", defaultValue: 0 },
        mealAllNumber: { type: Sequelize.INTEGER, field: "meal_all_number", defaultValue: 0 },
        orderMode: { type: Sequelize.INTEGER, field: "order_mode", defaultValue: 0 },
        allowAppraise: { type: Sequelize.INTEGER, field: "allow_appraise", defaultValue: 0 },
        confirmTime: { type: Sequelize.TEXT, field: "confirm_time" },
        orderNumber: { type: Sequelize.INTEGER, field: "order_number", defaultValue: 0 },
        callNumberTime: { type: Sequelize.TEXT, field: "call_number_time" },
        callTimes: { type: Sequelize.INTEGER, field: "call_times", defaultValue: 0 },
        shopDetailId: { type: Sequelize.TEXT, field: "shop_detail_id" },
        dataOrigin: { type: Sequelize.TEXT, field: "data_origin", defaultValue: 0 },
        syncState: { type: Sequelize.INTEGER, field: "sync_state", defaultValue: 0 },   //0：未上传 1：上传成功
        lastSyncTime: { type: Sequelize.TEXT, field: "last_sync_time" },    //上次数据同步的时间
        orderPosDiscountMoney: { type: Sequelize.TEXT, field: "order_pos_discount_money", defaultValue: 0 },// pos端折扣金额
        memberDiscountMoney: { type: Sequelize.TEXT, field: "member_discount_money", defaultValue: 0 }, // 会员折扣金额（微信端）
        eraseMoney: { type: Sequelize.TEXT, field: "erase_money", defaultValue: 0 }, //  折扣金额和抹零金额 总和
        reduceMoney: { type: Sequelize.TEXT, field: "reduce_money", defaultValue: 0 }, // 折扣金额
        realEraseMoney: { type: Sequelize.TEXT, field: "real_erase_money", defaultValue: 0 }, // 抹零金额
        posDiscount:          { type: Sequelize.TEXT, field: "pos_discount", defaultValue: 100 }, // pos端折扣率
        noDiscountMoney:      { type: Sequelize.TEXT, field: "no_discount_money", defaultValue: 0 }, // pos中不参与折扣的金额
        exemptionMoney:       { type: Sequelize.TEXT, field: "exemption_money", defaultValue: 0 }, // 免单
        needConfirmOrderItem: { type: Sequelize.INTEGER, field: "need_confirm_order_item", defaultValue: false }, // 存在需要确认的菜品

        sauceFeeCount       : {type: Sequelize.TEXT,     field:"sauce_fee_count"},//酱料数量
        sauceFeePrice       : {type: Sequelize.INTEGER,     field:"sauce_fee_price"},//酱料价格
        towelFeeCount       : {type: Sequelize.TEXT,     field:"towel_fee_count"},//纸巾数量
        towelFeePrice       : {type: Sequelize.INTEGER,     field:"towel_fee_price"},//纸巾价格
        tablewareFeeCount   : {type: Sequelize.TEXT,     field:"tableware_fee_count"},//餐具数量
        tablewareFeePrice    : {type: Sequelize.INTEGER,     field:"tableware_fee_price"},//餐具价格
        isUseNewService    :  {type: Sequelize.INTEGER, field: "is_use_new_service"}, // 是否开启新版服务费
        grantMoney         : {type: Sequelize.INTEGER, field:"grant_money"} // 赠菜金额
    }, {
            indexes: [{
                name: 'id',
                unique: true,
                fields: ['id']
            }, {
                name: 'parent_order_id',
                fields: ['parent_order_id']
            }],
            freezeTableName: true, //默认为false，当为false时，如果你数据库中已有表a的话，sequelize会修改你的表名，后缀加个s
            timestamps: false
        });

    return sqlite;
};