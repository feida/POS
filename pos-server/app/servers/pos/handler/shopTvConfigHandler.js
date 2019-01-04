const result = require("../../../util/resultUtil");
const generalUtil = require("../../../util/generalUtil");
const customSqlModel = require("../../../model/pos/customSql");



module.exports = function (app) {
    return new Handler(app);
};

var Handler = function (app) {
    this.app = app;
};

var handler = Handler.prototype;


/**
 * 获取店铺 电视 配置
 * @param msg
 * @param session
 * @param next
 */
handler.getShopTvConfig = function (msg, session, next) {
    let sql = "select * from tb_shop_tv_config";
    customSqlModel.getOneCustomSqlInfo(sql, function (err, data) {
        if (err || !data) {
            return result.error(next, err.toString() || "获取电视配置失败～", msg)
        }
        result.success(next, generalUtil.convertHumpName(data));
    })
};