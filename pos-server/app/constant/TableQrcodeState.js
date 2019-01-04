/**
 * 桌位状态.
 */
var TableQrcodeState = module.exports;

/**
 * 空闲
 * @type {number}
 */
TableQrcodeState.FREE = 0;

/**
 * 已占用
 * @type {number}
 */
TableQrcodeState.LOCK = 1;