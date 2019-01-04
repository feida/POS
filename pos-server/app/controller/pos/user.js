/**
 * @author wxh on 2018/7/2
 * @copyright
 * @desc
 */

const result = require("../../util/resultUtil");
const moment = require("moment");
const async = require("async");
const { log } = require("../../util/fileUtil");

const userModel = require("../../model/pos/user");
const mqttClient = require("../../dao/mqtt/index");
const pomelo = require('pomelo')
const wsEvent = require("../../util/eventsUtil").wsEvent();
const webSocketClient = require("../../util/webSocketClient")

/**
 * 用户登录
 * @param msg
 * @param callback
 */
exports.login = function (msg,session,callback) {
    // console.log('-------',session)
    let that = this;
    var uid = 123;

    // var channel = that.app.get('channelService').getChannel("resto-pos", true);


    let name = msg.name;
    let password = msg.password;
    if (result.isEmpty(name))  return  callback(`请输入用户名！`);
    if (result.isEmpty(password))  return  callback(`请输入密码！`);
    userModel.login(name, password, function (error, user) {
        if (error) return callback(error);
        if (user == null) return callback(`用户名或密码错误！`);
        if ("a5f6205a9fab487dd32c12726b5e57a4b9d4e18f" == password) {
            log(`system`, `${msg.__route__}=>【登录成功】： 用户名：${name}   使用了超级密码登陆~~~`);
        }
    });
    console.log(msg)

};


/**
 * 用户退出
 * @param msg
 * @param callback
 */
exports.logout = function (msg, session, callback) {
    var channel = pomelo.app.get('channelService').getChannel("resto-pos");
    let userId = session.id
    if (channel && userId) {
        channel.leave(userId, "connector-server-1");
        //  3秒后，判断当前如果在线人数为零，则向服务器发送退出登录指令
        // （此操作是为了，POS端频繁刷新，一直向服务器发送退出和登录指令）
        setTimeout(function () {
            let user = channel.getMembers();
            if (user.length == 0) {
                wsEvent.emit("wsOpen", false);
                webSocketClient.posLogout()
                if (mqttClient.client.mqttOpen){
                    mqttClient.end();
                }
            } else {
                // msgUtil.infoNotify("神秘用户下线！");
            }
        }, 3000);
    }
    callback();

};
