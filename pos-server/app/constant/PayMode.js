/**
 * 支付方式
 * Created by Lmx on 2017/11/28.
 */
var payMode = module.exports;

/**
 * 微信支付
 * @type {number}
 */
payMode.WEIXIN_PAY = 1;

/**
 * 红包支付
 * @type {number}
 */
payMode.ACCOUNT_PAY = 2;

/**
 * 优惠券支付
 * @type {number}
 */
payMode.COUPON_PAY = 3;

/**
 * 其他方式支付
 * @type {number}
 */
payMode.MONEY_PAY = 4;

/**
 * 银行卡支付
 * @type {number}
 */
payMode.BANK_CART_PAY = 5;

/**
 * 充值金额支付
 * @type {number}
 */
payMode.CHARGE_PAY = 6;

/**
 * 充值赠送的金额支付
 * @type {number}
 */
payMode.REWARD_PAY = 7;

/**
 * 等位红包
 * @type {number}
 */
payMode.WAIT_MONEY = 8;

/**
 * 饿了吗
 * @type {number}
 */
payMode.HUNGER_MONEY = 9;

/**
 * 支付宝
 * @type {number}
 */
payMode.ALI_PAY = 10;

/**
 * 菜品退款支付
 * @type {number}
 */
payMode.ARTICLE_BACK_PAY = 11;

/**
 * 现金支付
 * @type {number}
 */
payMode.CRASH_PAY= 12;

/**
 * 评论红包支付
 * @type {number}
 */
payMode.APPRAISE_RED_PAY = 13;

/**
 * 分享返利红包支付
 * @type {number}
 */
payMode.SHARE_RED_PAY = 14;

/**
 * 退菜红包支付
 * @type {number}
 */
payMode.REFUND_ARTICLE_RED_PAY = 15;

/**
 * 闪惠支付  大众点评
 * @type {number}
 */
payMode.SHANHUI_PAY = 16;

/**
 * 会员积分支付
 * @type {number}
 */
payMode.EGRAL_PAY = 17;

/**
 * 找零
 * @type {number}
 */
payMode.GIVE_CHANGE = 18;

/**
 * 现金退款
 * @type {number}
 */
payMode.REFUND_CRASH = 19;

/**
 * 第三方储值余额支付
 * @type {number}
 */
payMode.THIRD_MONEY_RED_PAY = 20;

/**
 * 消费返利余额支付
 * @type {number}
 */
payMode.REBATE_MONEY_RED_PAY = 21;

/**
 * 储值卡折扣支付
 * @type {number}
 */
payMode.CARD_DISCOUNT_PAY = 22;

/**
 * 卡充值金额支付
 * @type {number}
 */
payMode.CARD_CHARGE_PAY = 23;

/**
 * 卡充值赠送的金额支付
 * @type {number}
 */
payMode.CARD_REWARD_PAY = 24;

/**
 * 卡退款的金额支付
 * @type {number}
 */
payMode.CARD_REFUND_PAY = 25;

/**
 * 免单
 * @param state
 * @returns {Number}
 */
payMode.EXEMPTION_PAY = 26;

/***
 * 团购支付
 * @param state
 * @returns {Number}
 */
payMode.GROUP_PAY = 27;

/**
 * 代金券支付
 * @param state
 * @returns {Number}
 */
payMode.CASH_COUPIN_PAY = 28;


//============= 以下支付项适用于味千拉面项目===============//
/**
 * 门店浮出零用金
 * @param state
 * @returns {string}
 */
payMode.EMERSION_CASH_PAY = 29;

/**
 * 门店浮出零找金
 * @param state
 * @param {Number}
 */
payMode.EMERSION_INCOME_PAY = 30;

/**
 * 销售总额
 * @param
 * @type {number}
 */
payMode.TOTAL_AMOUNT = 31

/**
 * 折扣总额
 * @param
 * @type {number}
 */
payMode.EMERSION_DISCOUNT = 32

/**
 * 净销售总额
 * @type {number}
 */
payMode.TORAL_NET_INCOME = 33

/**
 * 现金合计
 * @type {number}
 */
payMode.CASH_AMOUNT = 34

/**
 * 银行卡 合计
 * @type {number}
 */
payMode.BANK_CARD_TOTAL = 35

/**
 * 其它卡券合计
 * @type {number}
 */
payMode.RESTS_COUPON_TOTAL = 36

/**
 * 合计
 * @type {number}
 */
payMode.TORTAL_MONEY = 37

/***
 * 退款金额
 * @param state
 * @returns {string}
 */
payMode.TOTAL_REFUND = 38

payMode.getPayModeName = function(state){
    switch (state) {
        case this.WEIXIN_PAY:
            return "微信支付";
        case this.ACCOUNT_PAY:
            return "红包支付";
        case this.COUPON_PAY:
            return "优惠券支付";
        case this.MONEY_PAY:
            return "其他方式支付";
        case this.BANK_CART_PAY:
            return "银行卡支付";
        case this.CHARGE_PAY:
            return "充值账户支付";
        case this.REWARD_PAY:
            return "充值赠送支付";
        case this.WAIT_MONEY:
            return "等位红包支付";
        case this.HUNGER_MONEY:
            return "饿了吗支付";
        case this.ALI_PAY:
            return "支付宝支付";
        case this.ARTICLE_BACK_PAY:
            return "退菜返还余额";
        case this.CRASH_PAY:
            return "现金支付";
        case this.APPRAISE_RED_PAY:
            return "评论红包支付";
        case this.SHARE_RED_PAY:
            return "分享返利红包支付";
        case this.REFUND_ARTICLE_RED_PAY:
            return "退菜红包支付";
        case this.SHANHUI_PAY:
            return "闪惠支付";
        case this.EGRAL_PAY:
            return "会员支付";
        case this.GIVE_CHANGE:
            return "找零";
        case this.REFUND_CRASH:
            return "现金退款";
        case this.THIRD_MONEY_RED_PAY:
            return "第三方储值余额支付";
        case this.REBATE_MONEY_RED_PAY:
            return "消费返利余额支付";
        case this.CARD_DISCOUNT_PAY:
            return "储值卡折扣支付";
        case this.CARD_CHARGE_PAY:
            return "卡充值金额支付";
        case this.CARD_REWARD_PAY:
            return "卡充值赠送的金额支付";
        case this.CARD_REFUND_PAY:
            return "卡退款的金额支付";
        case this.EXEMPTION_PAY:
            return "免单支付";
        case this.GROUP_PAY:
            return "团购支付";
        case this.CASH_COUPIN_PAY:
            return "代金券支付";
        case this.EMERSION_CASH_PAY:
            return "门店浮出零用金";
        case this.EMERSION_INCOME_PAY:
            return "门店浮出零找金";
        case this.TOTAL_AMOUNT:
            return "销售总额";
        case this.EMERSION_DISCOUNT:
            return "折扣总额";
        case this.TORAL_NET_INCOME:
            return "净销售总额";
        case this.CASH_AMOUNT:
            return "现金合计";
        case this.BANK_CARD_TOTAL:
            return "银行卡合计";
        case this.RESTS_COUPON_TOTAL:
            return "其它卡券合计";
        case this.TORTAL_MONEY:
            return "合计";
        case this.TOTAL_REFUND:
            return "退款金额"
        default:
            return "未知";
    }
}

payMode.getPaymentNameById= function (id) {
    var paymentMap = {
        1: '微信支付', 2: '红包支付', 3: '优惠券支付', 4:'其他方式支付',
        5: '银行卡支付', 6: '充值金额支付', 7: '充值赠送的金额支付', 8: '等位红包',
        9: '饿了吗', 10: '支付宝', 11: '菜品退款支付', 12: '现金支付',
        13: '评论红包支付', 14: '分享返利红包支付', 15: '退菜红包支付',
        16: '闪惠支付', 17: '会员积分支付', 18: '找零', 19: '现金退款',
        20: '第三方储值余额支付', 21: '消费返利余额支付', 22: '储值卡折扣支付', 23: '卡充值金额支付',
        24: '卡充值赠送的金额支付', 25: '卡退款的金额支付', 26: '免单',
        27: '团购支付', 28: '代金券支付', 29: '门店浮出零用金',
        30: '门店浮出零找金', 31: '销售总额', 32: '折扣总额',
        33: '净销售总额', 34: '现金合计', 35: '银行卡合计',
        36: '其它卡券合计', 37: '合计', 38: '退款金额'
    }
    return paymentMap[id]
}