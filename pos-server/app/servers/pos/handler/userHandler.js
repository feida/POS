const result = require("../../../util/resultUtil");
const { log } = require("../../../util/fileUtil");
const msgUtil = require("../../../util/msgUtil");
const webSocketClient = require("../../../util/webSocketClient");
const wsEvent = require("../../../util/eventsUtil").wsEvent();

const userModel = require("../../../model/pos/user");
const shopDetailModel = require("../../../model/pos/shopDetail");
const customSql = require("../../../model/pos/customSql");
const mqttClient = require("../../../dao/mqtt/index");
//-------------新添加层controller
const userController = require("../../../controller/pos/user");

module.exports = function (app) {
    return new Handler(app);
};

var Handler = function (app) {
    this.app = app;
};

var handler = Handler.prototype;

/**
 * 获取 用户 集合
 * @param msg
 * @param session
 * @param next
 */
handler.list = function (msg, session, next) {
    let that = this;
    var sql = "select id,name,shop_detail_id from tb_user";
    customSql.getAllCustomSqlInfo(`${sql}`, (error, userList) => {
        if (error) {
            return result.error(null, error.toString());
        }

        let channel = that.app.get('channelService').getChannel("resto-pos", true);
        let members = channel.getMembers().toString() || "";
        userList.map(function (user) {
            if (members.indexOf(user.id) != -1) {
                user.online = true;
            }
        });
        result.success(next, userList);
    });
};

/**
 * 用户登录
 * @param msg
 * @param session
 * @param next
 */
handler.login = function (msg, session, next) {
    let that = this;
    let name = msg.name;
    let password = msg.password;
    if (result.isEmpty(name)) {
        result.error(next, "请输入用户名！", msg);
        return;
    }
    if (result.isEmpty(password)) {
        result.error(next, "请输入密码！", msg);
        return;
    }
    userModel.login(name, password, function (error, user) {
        if (error != null) {
            result.error(next, error.toString(), msg);
            return;
        }
        if (user == null) {
            result.error(next, "用户名或密码错误！", msg);
            return;
        }
        if ("a5f6205a9fab487dd32c12726b5e57a4b9d4e18f" == password) {
            log(`system`, `${msg.__route__}=>【登录成功】： 用户名：${name}   使用了超级密码登陆~~~`);
        }
        joinChannel(that, user.id, session, function (userNumber) {
            user.onlineNumber = userNumber;
            msgUtil.init(that.app, session.uid);
            //  登录服务器
            webSocketClient.login(name, password, function (error, resultData) {
                if (error && error.code == -1) {
                    return getShopInfo(next, user, msg);
                }
                if (resultData == null || resultData == "undefined") {
                    return result.error(next, "登录异常，请重试！");
                }
                resultData = JSON.parse(resultData);
                if (resultData.success == false) {
                    log(`error`, `${msg.__route__}=>【登录服务器错误】：${resultData.message}`);
                    result.error(next, resultData.message);
                } else {
                    log(`system`, `${msg.__route__}=>【登录成功】： 用户名：${name}`);
                    //  开始自动获取异常订单
                    wsEvent.emit("autoPrintExceptionOrder");
                    getShopInfo(next, user, msg);
                }
            });
        }, function () {
            return result.error(next, "该用户已登录，请更换账户登录~")
        });
    })
}

/**
 * 新用户登录
 * @param msg
 * @param session
 * @param next
 */
handler.newLogin = function (msg, session, next) {
    console.log('========',this.app.get('channelService'))
    userController.login(msg, session,(err, reply) => {
        return err ?  result.error(next,err.toString(),msg):result.success(next,reply);
    });
};
/**
 * 此方法用于将用户添加入同一个房间，便于从后台推送服务
 * @param msg
 * @param session
 * @param next
 */
handler.joinChannel = function (msg, session, next) {
    if (msg.id) {
        joinChannel(this, msg.id, session, function () {
            result.success(next);
        }, function () {
            result.error(next, "该用户已登录，请更换账户登录~")
        });
    } else {
        result.error(next, "登录异常，请重新登录后再同步数据~", msg);
    }
};

var joinChannel = function (content, id, session, cb, errorcb) {
    //  用户绑定 id
    var uid = id;
    var rid = "resto-pos";
    session.bind(uid);
    session.set('rid', rid);
    // 将用户加入到统一的房间里面
    var channel = content.app.get('channelService').getChannel(rid, true);
    var channelMember = channel.getMember(uid);
    if (!channelMember) { // 如果已经存在 则不重复添加
        // 此处必须填写属于 前端 session 的服务ID （ connector-server-1 ）  后期需将此处移至 前端服务中实现
        channel.add(uid, "connector-server-1");
        // todo 在 connector 中绑定 session close 事件    by  lmx 2018年3月26日 16:42:52
        // session.on('closed', function (app, session) {
        //     leave(this.app, session);
        // });
        cb && cb(channel.getMembers().length);
    } else {
        console.log("用户已在房间 无需重复绑定");
        errorcb && errorcb();
    }
};

var getShopInfo = function (next, user, msg) {
    shopDetailModel.getCustomShopDetailInfo(null, function (error, shopInfo) {
        if (error) {
            return result.error(next, error.toString(), msg)
        }
        user.shop_info = shopInfo;
        result.success(next, user);
    });
};


/**
 * 退出登录
 * @param msg
 * @param session
 * @param next
 */
handler.logout = function (msg, session, next) {
    var channel = this.app.get('channelService').getChannel("resto-pos");
    if (channel) {
        channel.leave(session.uid, "connector-server-1");
        let user = channel.getMembers();
        if (user.length == 0) {
            webSocketClient.posLogout();
            if (mqttClient.client.mqttOpen){
                mqttClient.end();
            }
        }
    }
    // msgUtil.infoNotify( "下线！");
    result.success(next);
};

let leave = function (app, userId) {
    var channel = app.get('channelService').getChannel("resto-pos");
    if (channel) {
        channel.leave(userId, "connector-server-1");
        let user = channel.getMembers();
        if (user.length == 0) {
            webSocketClient.posLogout();
        }
    }
};



/**
 * 刷新重连
 * @param msg
 * @param session
 * @param next
 */
handler.reconnection = function (msg, session, next) {
    //  用户绑定 id
    var uid = msg.userId;
    var rid = "resto-pos";
    session.bind(uid);
    session.set('rid', rid);
    var channel = this.app.get('channelService').getChannel(rid, true);
    var channelMember = channel.getMember(uid);
    // 如果已经存在 则移除老的session
    if (channelMember) {
        channel.leave(uid, "connector-server-1");
    }
    // 将用户加入到统一的房间里面
    channel.add(uid, "connector-server-1");
    // webSocketClient.login(null, null);
    next(null);
};