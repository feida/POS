/**
 * Created by Lmx on 2017/5/17.
 */
const customSql = require("../../../model/pos/customSql");
const result = require("../../../util/resultUtil");
const async = require('async');

module.exports = function (app) {
    return new Handler(app);
}

var Handler = function (app) {
    this.app = app;
}

var handler = Handler.prototype;

/**
 * 根据 菜品ID 查询
 * @param msg
 * @param session
 * @param next
 */
handler.selectWeightPackageByArticleId = function (msg, session, next) {
    var articleId = msg.articleId;
    if (result.isEmpty(articleId)) {
        return result.error(next, "菜品ID不能为空", msg);
    }
    let sql = `SELECT weight_package_id  FROM tb_article WHERE id = '${articleId}' and open_catty = 1;`;
    customSql.getOneCustomSqlInfo(sql, function (error, weightPackageIdsInfo) {
        if (!weightPackageIdsInfo) return result.error(next, "菜品缺失", msg);
        weightPackageIds = weightPackageIdsInfo.weight_package_id;
        let weightPackageResult = [];
        sql = `SELECT * FROM tb_weight_package WHERE id in (${weightPackageIds.toString()});`
        customSql.getAllCustomSqlInfo(sql, function (error, weightPackageInfo) {
            async.eachLimit(weightPackageInfo, 1, (item, cb) => {
                sql = `SELECT * FROM tb_weight_package_detail WHERE weight_package_id = '${item.id}';`
                customSql.getAllCustomSqlInfo(sql, (err, weightPackageDetailInfo) => {
                    item.list = weightPackageDetailInfo;
                    weightPackageResult.push(item);
                    cb(err, null);
                })
            }, (err) => {
                result.success(next, weightPackageResult);
            });
        })
    })
}