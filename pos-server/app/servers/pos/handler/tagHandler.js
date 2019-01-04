const result = require("../../../util/resultUtil");
const customSqlModel = require("../../../model/pos/customSql");

module.exports = function (app) {
    return new Handler(app);
}

var Handler = function (app) {
    this.app = app;
}

var handler = Handler.prototype;

/**
 *  获取标签内容
 * @param msg
 * @param session
 * @param next
 */
handler.getTgs = function (msg, session, next) {
    if (!msg.type) {
        return result.error(next, "type is need", msg);
    }
    var condition = [msg.type];
    let sql = `select * from tb_tag where type = '${condition}' `;
    customSqlModel.getAllCustomSqlInfo(sql, function (error, data) {
        result.success(next, data);
    })
}

