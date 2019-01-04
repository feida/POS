/**
 * 店铺状态
 */
var ShopMode = module.exports;

/**
 * 坐下点餐模式
 * @type {number}
 */
ShopMode.TABLE_MODE = 1;

/**
 * 电视叫号模式
 * @type {number}
 */
ShopMode.CALL_NUMBER = 2;

/**
 * 手动下单模式
 * @type {number}
 */
ShopMode.MANUAL_ORDER = 3;

/**
 * 后付款模式
 * @type {number}
 */
ShopMode.HOUFU_ORDER = 5;

/**
 * 混合模式（先付和后付）
 * @type {number}
 */
ShopMode.BOSS_ORDER = 6;

/**
 * 美食广场模式
 * @type {number}
 */
ShopMode.FOOTMUMBER_ORDER = 7;