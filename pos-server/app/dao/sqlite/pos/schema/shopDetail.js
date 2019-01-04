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
     * @desc 店铺详情表
     * */
    sqlite.models.TbShopDetail = sqlite.define('tb_shop_detail', {
        id: { type: Sequelize.TEXT, primaryKey: true },         //id
        name: { type: Sequelize.TEXT, field: "name" },              //店铺名称
        address: { type: Sequelize.TEXT, field: "address" },           //地址
        phone: { type: Sequelize.TEXT, field: "phone" },             //店铺电话
        remark: { type: Sequelize.TEXT, field: "remark" },             // 备注，暂时用来存放 微信二维码地址
        isMealFee: { type: Sequelize.INTEGER, field: "is_meal_fee" },       //是否开启餐包费 --0: 未启用1: 启用
        mealFeeName: { type: Sequelize.TEXT, field: "meal_fee_name" },     //餐盒费名称
        mealFeePrice: { type: Sequelize.INTEGER, field: "meal_fee_price" },    //餐盒费钱
        printType: { type: Sequelize.INTEGER, field: "print_type" },
        isUseServicePrice: { type: Sequelize.INTEGER, field: "is_use_service_price" },//是否启用服务费  --0：未启用1：启用
        shopMode: { type: Sequelize.INTEGER, field: "shop_mode" },         //店铺模式
        payType: { type: Sequelize.INTEGER, field: "pay_type" },          //店铺的先付或后付的标识 -- 0：立马支付 1：稍后支付
        posPlusType: { type: Sequelize.INTEGER, field: "pos_plus_type" },     //pos点单菜品价格      --0  粉丝价 1 原价
        brandId: { type: Sequelize.TEXT, field: "brand_id" },
        brandName: { type: Sequelize.TEXT, field: "brand_name" },
        brandLogo: { type: Sequelize.TEXT, field: "brand_logo" },
        closeContinueTime: { type: Sequelize.INTEGER, field: "close_continue_time" },
        autoConfirmTime: { type: Sequelize.INTEGER, field: "auto_confirm_time" },
        autoPrintTotal: { type: Sequelize.INTEGER, field: "auto_print_total" },
        allowFirstPay: { type: Sequelize.INTEGER, field: "allow_first_pay" },
        allowAfterPay: { type: Sequelize.INTEGER, field: "allow_after_pay" },
        printReceipt: { type: Sequelize.INTEGER, field: "print_receipt" },
        printKitchen: { type: Sequelize.INTEGER, field: "print_kitchen" },
        modifyOrderPrintReceipt: { type: Sequelize.INTEGER, field: "modify_order_print_receipt" },
        modifyOrderPrintKitchen: { type: Sequelize.INTEGER, field: "modify_order_print_kitchen" },
        openPosWeChatPay: { type: Sequelize.INTEGER, field: "open_pos_wechat_pay" },
        openPosAliPay: { type: Sequelize.INTEGER, field: "open_pos_ali_pay" },
        openPosUnionPay: { type: Sequelize.INTEGER, field: "open_pos_union_pay" },
        openPosMoneyPay: { type: Sequelize.INTEGER, field: "open_pos_money_pay" },
        openPosShanhuiPay: { type: Sequelize.INTEGER, field: "open_pos_shanhui_pay" },
        openPosIntegralPay: { type: Sequelize.INTEGER, field: "open_pos_integral_pay" },
        openPosPayOrder: { type: Sequelize.INTEGER, field: "open_pos_pay_order" },
        openPosCharge: { type: Sequelize.INTEGER, field: "open_pos_charge" },
        openPosGroupBuy: { type: Sequelize.INTEGER, field: "open_pos_group_buy" },
        openPosCashCouponBuy: { type: Sequelize.INTEGER, field: "open_pos_cash_coupon_buy" },
        openOrderRemark: { type: Sequelize.INTEGER, field: "open_order_remark" },
        templateType: { type: Sequelize.INTEGER, field: "template_type" },
        printMeituan: { type: Sequelize.INTEGER, field: "print_meituan" },
        serviceName: { type: Sequelize.TEXT, field: "service_name" },      //服务费名称
        servicePrice: { type: Sequelize.INTEGER, field: "service_price" },     //服务费
        splitKitchen: { type: Sequelize.INTEGER, field: "split_kitchen" },
        isTurntable: { type: Sequelize.INTEGER, field: "is_turntable" },
        turntablePrintType: { type: Sequelize.INTEGER, field: "turntable_print_type" },
        tvIp: { type: Sequelize.TEXT, field: "tv_ip" },
        openBadAppraisePrintOrder: { type: Sequelize.INTEGER, field: "open_bad_appraise_print_order" },
        badAppraisePrintReceipt: { type: Sequelize.INTEGER, field: "bad_appraise_print_receipt" },
        badAppraisePrintKitchen: { type: Sequelize.INTEGER, field: "bad_appraise_print_kitchen" },
        orderWelcomeMessage: { type: Sequelize.TEXT, field: "order_welcome_message", defaultValue: '谢谢光临，欢迎再次惠顾' },
        isOpenScm: { type: Sequelize.INTEGER, field: "is_open_scm" },
        autoPrintConsumeOrder: { type: Sequelize.INTEGER, field: "auto_print_consume_order",defaultValue: 1 },      // 是否打印消费清单   1打印   0不打印
        autoPrintCheckOutOrder      : { type: Sequelize.INTEGER, field: "auto_print_checkout_order",defaultValue: 1 },    //是否打印结账单   1打印   0不打印
        logUrl                       : { type: Sequelize.TEXT, field: "log_url",defaultValue: `http://106.15.11.6:3000` },   //日志链接地址
        enableDuoDongXian          : { type: Sequelize.INTEGER, field: "enable_duo_dong_xian",defaultValue: 1 },   //多动线开关 0 :启用  1 : 未启用
        openRpay                    : {type: Sequelize.INTEGER, field: "open_rpay"},
        printOutDetails             : {type: Sequelize.INTEGER, field: "print_out_details",defaultValue: 1},     //是否打印退菜详情  0 不打印    1 打印

        serviceType     : {type: Sequelize.INTEGER, field: "service_type"},         //服务费类型，0 经典版 1 升级版
        tablewareFeeName: {type: Sequelize.TEXT, field: "tableware_fee_name"},    //餐具费名称
        tablewareFeePrice: {type: Sequelize.INTEGER, field: "tableware_fee_price"},   //餐具费价格
        isOpenTablewareFee:{type: Sequelize.INTEGER, field: "is_open_tableware_fee"}, //是否启用餐具费
        towelFeeName      :{type: Sequelize.TEXT, field: "towel_fee_name"},        // 纸巾费名称
        towelFeePrice      :{type: Sequelize.INTEGER, field: "towel_fee_price"},      //至今费价格
        isOpenTowelFee :{type: Sequelize.INTEGER, field: "is_open_towel_fee"},     //是否开启纸巾费
        sauceFeeName:{type: Sequelize.TEXT, field: "sauce_fee_name"},        //酱料费名称
        sauceFeePrice:{type: Sequelize.INTEGER, field: "sauce_fee_price"},       //酱料费价格
        isOpenSauceFee:{type: Sequelize.INTEGER, field: "is_open_sauce_fee"},      //是否开启酱料费
        isOpenAddPrintTotal:{type: Sequelize.INTEGER, field: "is_open_add_print_total",defaultValue: 1},      //是否开启打印加菜总单 0不打印 1打印
        isOpenUserSign:{type: Sequelize.INTEGER, field: "is_open_user_sign",defaultValue: 0},      //是否开启用户标识 0关闭 1开启
    }, {
            freezeTableName: true, //默认为false，当为false时，如果你数据库中已有表a的话，sequelize会修改你的表名，后缀加个s
            timestamps: false
        });

    return sqlite;
};