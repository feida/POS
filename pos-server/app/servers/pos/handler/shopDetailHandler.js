/**
 * Created by Lmx on 2017/5/17.
 */
const customSql = require("../../../model/pos/customSql");
const shopDetailModel = require("../../../model/pos/shopDetail");
const result = require("../../../util/resultUtil");
const pkg = require('../../../../package.json')

module.exports = function (app) {
    return new Handler(app);
}

var Handler = function (app) {
    this.app = app;
}

var handler = Handler.prototype;

/**
 * 获取 店铺详情 集合
 * @param msg
 * @param session
 * @param next
 */
handler.list = function (msg, session, next) {
    var sql = "select * from tb_shop_detail";
    customSql.getAllCustomSqlInfo(sql, function (error, data) {
        result.success(next, data);
    })
}

/**
 * 获取 店铺详情
 * @param msg
 * @param session
 * @param next
 */
handler.getShopDetailInfo = function (msg, session, next) {
    shopDetailModel.getCustomShopDetailInfo('',function (error, data) {
        if (error) {
            result.error(next, error.toString(), msg);
            return;
        }
        result.success(next, data);
    })
};

/**
 * 版本号
 */
handler.getVersions = function (msg, session, next){
    result.success(next, {version: pkg.version});
}
