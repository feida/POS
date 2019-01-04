/**
 * 订单状态
 * Created by Lmx on 2017/5/31.
 */
var orderState = module.exports;

/**
 * 未支付
 * @type {number}
 */
orderState.NO_PAY = 1;

/**
 * 已支付
 * @type {number}
 */
orderState.HAS_PAY = 2;

/**
 * 已取消
 * @type {number}
 */
orderState.CANCEL = 9;

/**
 * 已确认      （  todo 状态为 已支付 后 系统自动根据 允许加菜时间，将状态变更为 已确认 状态  ）
 * @type {number}
 */
orderState.CONFIRM = 10;

/**
 * 获取支付方式
 * @param state
 * @returns {*}
 */
orderState.getOrderState = function (state) {
    switch (state) {
        case NO_PAY:
            return "未支付";
        case HAS_PAY:
            return "已支付";
        case CANCEL:
            return "已取消";
        default:
            return "未知状态";

    }
}