/**
 *  打印机类型
 * Created by Lmx on 2017/5/27.
 */
var printerType = module.exports;

/**
 * 厨房
 * @type {number}
 */
printerType.KITCHEN = 1;

/**
 * 前台
 * @type {number}
 */
printerType.RECEPTION = 2;

/**
 * 打包
 * @type {number}
 */
printerType.PACKAGE = 3;

printerType.getPrintType = function (type) {
    switch(type){
        case KITCHEN :
            return "厨房";
        case RECEPTION :
            return "前台";
        case PACKAGE :
            return "打包";
        default :
            return "未知类型";
    }
}