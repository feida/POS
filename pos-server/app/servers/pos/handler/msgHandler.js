const result = require("../../../util/resultUtil");
const msgUtil = require("../../../util/msgUtil");

module.exports = function (app) {
    return new Handler(app);
}

var Handler = function (app) {
    this.app = app;
}

var handler = Handler.prototype;

/**
 *  自由发送消息
 * @param msg
 * @param session
 * @param next
 */
handler.freePush = function (msg, session, next) {
    if (!msg.route) {
        return result.error(next, "route is need", msg);
    }
    msgUtil.freePush(msg.route, msg);
    result.success(next, msg);
}

