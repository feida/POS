const result = require("../../../util/resultUtil");

module.exports = function (app) {
    return new Handler(app);
};

var Handler = function (app) {
    this.app = app;
};

/**
 * 用户登录
 * @param msg
 * @param session
 * @param next
 */
Handler.prototype.login = function (msg, session, next) {
    let that = this;
    let name = msg.name;
    let password = msg.password;
    let kick = msg.kick;
    if (result.isEmpty(name)) {
        result.error(next, "请输入用户名！", msg);
        return;
    }
    if (result.isEmpty(password)) {
        result.error(next, "请输入密码！", msg);
        return;
    }
    this.app.rpc.pos.posRemote.login.toServer("*", name, password, kick, function (resultData) {
        if(resultData.error){
            result.error(next, resultData.error);
        }else{
            session.bind(resultData.user.id);
            session.set('rid', "resto-pos");
            session.on('closed', leave.bind(null, that.app));
            result.success(next, resultData.user);
        }
    } );
};

/**
 * 刷新重连
 * @param msg
 * @param session
 * @param next
 */
Handler.prototype.reconnection = function (msg, session, next) {
    session.bind(msg.userId);
    session.set('rid', "resto-pos");
    session.on('closed', leave.bind(null, this.app));
    this.app.rpc.pos.posRemote.reconnection.toServer("*", msg.userId, null);
    next(null);
};

let leave = function (app, session) {
    app.rpc.pos.posRemote.posLogout.toServer("*", session.uid, null);
};
