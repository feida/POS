/**
 * 订单表的支付方式（tb_order.pay_mode）
 * Created by Lmx on 2017/11/28.
 */
var orderPayMode = module.exports;

/**
 * 余额支付
 * @type {number}
 */
orderPayMode.YUE_PAY = 0;

/**
 * 微信支付
 * @type {number}
 */
orderPayMode.WX_PAY = 1;

/**
 * 支付宝支付
 * @type {number}
 */
orderPayMode.ALI_PAY = 2;

/**
 * 银联支付
 * @type {number}
 */
orderPayMode.YL_PAY = 3;

/**
 * 现金支付
 * @type {number}
 */
orderPayMode.XJ_PAY = 4;

/**
 * 闪惠支付
 * @type {number}
 */
orderPayMode.SHH_PAY = 5;

/**
 * 积分支付
 * @type {number}
 */
orderPayMode.JF_PAY = 6;

/**
 * 实体卡支付
 * @type {number}
 */
orderPayMode.CARD_PAY = 7;


/**
 * 免单支付
 * @type {number}
 */
orderPayMode.MD_PAY = 8;

/***
 * 团购支付
 * @type {number}
 */
orderPayMode.GROUP_PAY = 9;

/**
 * 代金券支付
 * @type {number}
 */
orderPayMode.CASH_COUPIN_PAY = 10;

/**
 * 混合支付
 * @type {number}
 */
orderPayMode.ALL_TYPE_PAY = 99;

/**
 *
 * @param state
 * @returns {string}
 */
orderPayMode.getPayModeName =  function(state){
	switch (state) {
		case WX_PAY:
			return "微信支付";
		case ALI_PAY:
			return "支付宝支付";
		case YL_PAY:
			return "银联支付";
		case XJ_PAY:
			return "现金支付";
		case SHH_PAY:
			return "闪惠支付";
		case JF_PAY:
			return "会员支付";
		case CARD_PAY:
			return "实体卡支付"
        case MD_PAY:
            return "免单支付"
		default:
			return "余额支付";
	}
}