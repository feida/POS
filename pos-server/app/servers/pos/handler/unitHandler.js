const customSql = require("../../../model/pos/customSql");
const result = require("../../../util/resultUtil");

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
handler.selectUnitListByArticleId = function (msg, session, next) {
    var articleId = msg.articleId;
    if (result.isEmpty(articleId)) {
        return result.error(next, "订单ID不能为空", msg);
    }
    let sql = `SELECT aun.id,aun.choice_type,u.name from 
                tb_article_unit_new aun LEFT JOIN tb_unit u on aun.unit_id = u.id where 
                article_id = '${articleId}' and aun.is_used = 1`;
    customSql.getAllCustomSqlInfo(sql, function (error, units) {
        sql = "SELECT aud.*,ud.name from tb_article_unit_detail aud LEFT JOIN tb_unit_detail ud on aud.unit_detail_id = ud.id where article_unit_id in (";
        for (let unit of units) {
            sql += "'" + unit.id + "',"
        }
        sql = sql.substring(0, sql.length - 1);
        sql += ") and aud.is_used = 1 ORDER BY aud.sort ASC";
        customSql.getAllCustomSqlInfo(sql, function (error, unitDetails) {
            for (var unit of units) {
                unit.details = [];
                for (detail of unitDetails) {
                    if (detail.article_unit_id == unit.id) {
                        // 前端预留字段
                        detail.state = 0;
                        unit.details.push(detail);
                    }
                }
            }
            result.success(next, units);
        })
    })
}