const result = require("../../util/resultUtil");
const shopDetailModel = require("../../model/pos/shopDetail");
/**
 * 获取shopInfo
 * @param cb
 */
exports.getShopDetail = function (callback) {
    shopDetailModel.getCustomShopDetailInfo('',function (error, data) {
        if (error) {
            return  result.error(next, error.toString(), msg);
        }
        result.success(next, data);
    })
}


exports.getShopDetailFindOne = function (callback) {
    shopDetailModel.getShopDetailFindOne(function (error, data) {
        callback(error, data)
    })
}
