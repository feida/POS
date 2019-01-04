let msgUtil = module.exports;

let _app = null;
let channel = null;
let uids = [];

msgUtil.init = function (app, uid) {
    if (!_app) {
        _app = app;
        channel = app.get('channelService').getChannel("resto-pos", false);
    }
    uid && uids.push(uid);
};

msgUtil.infoNotify = function (msg, uid) {
    this.notify("info", msg, uid);
};

msgUtil.errorNotify = function (msg, uid) {
    this.notify("error", msg, uid);
};

msgUtil.notify = function (type, msg, uid) {
    let data = {
        type: type,
        msg: msg,
    };
    if (uid) {
        this.push("notifyMsg", uid, data);
    } else {
        this.pushAll("notifyMsg", data);
    }
};

msgUtil.freePush = function (route = 'notifyMsg', data, uid) {
    if (uid) {
        this.push(route, uid, data);
    } else {
        this.pushAll(route, data);
    }
};

msgUtil.push = function (route, uid, data = "nothing") {
    if (_app) {
        _app.get('channelService').pushMessageByUids(route, data, [{
            uid: uid,
            sid: "connector-server-1"
        }]);
    } else {
        console.error("请先初始化 msgUtil");
    }
};

msgUtil.pushAll = function (route, data = "nothing") {
    if (channel) {
        channel.pushMessage(route, data);
    } else {
        console.error("请先初始化 msgUtil");
    }
};

msgUtil.pushPad = function (route, uid, data = "nothing") {
    if (_app) {
        _app.get('channelService').pushMessageByUids(route, data, [{
            uid: uid,
            sid: "connector-server-1"
        }]);
    } else {
        console.error("请先初始化 msgUtil");
    }
};