/**
 * 生产状态 （订单初始状态为 0）
 * Created by Lmx on 2017/5/31.
 * where ordersetate = 2 and productionStatus in (1,2)  已完成
 * where ordersetate = 1 and productionStatus = 0  未支付
 */

var productionStatus = module.exports;


/**
 * 待下单
 * @type {number}
 */
productionStatus.PLACE_ORDER = 0;
/**
 * 已下单
 * @type {number}
 */
productionStatus.PUSH_ORDER = 1;

/**
 * 已打印
 * @type {number}
 */
productionStatus.HAS_PRINT = 2;

/**
 * 已叫号（电视叫号模式下用的字段）
 * @type {number}
 */
productionStatus.HAS_CALL = 3;

/**
 * 订单菜品全是退完
 * @type {number}
 */
productionStatus.REFUND_ARTICLE = 6;

/**
 * 获取生产状态
 * @param state
 * @returns {*}
 */
productionStatus.getProductionStatus = function (state) {
    switch (state) {
        case PUSH_ORDER:
            return "已下单";
        case HAS_PRINT:
            return "已打印";
        default:
            return "未知类型";
    }
}