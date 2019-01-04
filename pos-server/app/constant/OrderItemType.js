/**
 * OrderItem 菜品类型
 */
var OrderItemType = module.exports;

/**
 * 单品
 * @type {number}
 */
OrderItemType.ARTICLE = 1;

/**
 * 老规格
 * @type {number}
 */
OrderItemType.UNITPRICE = 2;

/**
 * 套餐类型
 * @type {number}
 */
OrderItemType.SETMEALS = 3;

/**
 * 套餐子项
 * @type {number}
 */
OrderItemType.MEALS_CHILDREN = 4;

/**
 * 新规格
 * @type {number}
 */
OrderItemType.UNIT_NEW = 5;

/**
 * 推荐餐包
 * @type {number}
 */
OrderItemType.RECOMMEND = 6;

/**
 * 称重包
 * @type {number}
 */
OrderItemType.WEIGHT = 8;

/**
 * 获取 菜品类型
 * @param type
 * @returns {string}
 */
OrderItemType.getPayModeName = function (type) {
    switch (type) {
        case ARTICLE:
            return "单品";
        case UNITPRICE:
            return "多规格单品";
        case SETMEALS:
            return "套餐";
        case MEALS_CHILDREN:
            return "套餐子品";
        case UNIT_NEW:
            return "新规格单品";
        case RECOMMEND:
            return "推荐餐品";
        case WEIGHT:
            return "称重包";
        default:
            return "未知";
    }
};