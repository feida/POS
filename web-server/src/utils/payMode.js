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
 * 免单
 * @param state
 * @returns {string}
 */
payMode.EXEMPTION_PAY = 26;


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
    case this.EXEMPTION_PAY:
      return "免单支付";
    case this.SHANHUI_PAY:
      return "新美大支付"
    default:
      return "未知";
  }
}
