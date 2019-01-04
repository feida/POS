const WebSocket = require('ws');
const shopDetail = require('../../config/shopDetail');
const wsEvent = require("../util/eventsUtil").wsEvent();
const { log } = require('../util/fileUtil');
const msgUtil = require('../util/msgUtil');

//  有待优化    todo    2018年4月16日 17:09:58

//  叫号队列
let callOrderTask = [];

//  定时任务ID
let taskId = 0;


var tvWebSocketClient = module.exports;

let client = {
    ws: null,
    webSocketOpen: false,
    network: false,
    data: {
        brandId: shopDetail.brandId,
        shopId: shopDetail.id,
    },
    callBackMap: {},
    heartbeat: {
        id: 0,
        reconnectCounts: 10,
        interval: 15000,  //  心跳间隔时间 （毫秒）
    },
};

tvWebSocketClient.init = function (cb) {
    // let that = this;
    // client.ws = new WebSocket(`ws://${shopDetail.tvIp}:8000`, null, null);
    // client.ws.onopen = function () {
    //     log("【TV】","已成功连接   -->   电视端");
    //     msgUtil.infoNotify("已成功连接电视");
    //     msgUtil.pushAll("connectTV");
    //     client.webSocketOpen = true;
    //     cb && cb();
    // };
    // client.ws.onmessage = function (event) {
    //     let msg = JSON.parse(event.data);
    //     log("【TV】", "接收到 TV 端发送的消息： " + msg);
    //     wsEvent.emit("tv-" + msg.type, msg.data);
    // };
    // client.ws.onerror = function (event) {
    //     log(`【TV】`, `内容:ws报错`);
    // };
    // client.ws.onclose = function (event) {
    //     client.webSocketOpen && msgUtil.errorNotify("已与服务器断开连接！");
    //     client.webSocketOpen = false;
    //     log(`【TV】`, `ws与服务器断开连接`);
    //     //todo  断开之后，自动重连
    //     that.stopHeartbeat();
    //     that.reconnect();
    // };
};

tvWebSocketClient.sendTvMsg = function (data, cb) {
    if(client.webSocketOpen){
        client.ws.send(JSON.stringify(data));
        cb && cb();
    }else{
        this.reconnect();
        if(client.webSocketOpen) {
            client.ws.send(JSON.stringify(data));
            cb && cb();
        } else {
            log("【TV】","当前店铺未连接电视端");
        }
    }
};

/**
 * 开始心跳
 */
tvWebSocketClient.startHeartbeat = function () {
    client.heartbeat.id = setInterval(() => {
        this.sendTvMsg({ type: "heartbeat" });
    }, client.heartbeat.interval);
};

/**
 * 停止心跳
 */
tvWebSocketClient.stopHeartbeat = function () {
    clearInterval(client.heartbeat.id);
};

tvWebSocketClient.reconnect = function () {
    // if(navigator.onLine){ //只有联网的时候，才进行重连
    //  如果默认链接次数大于 0 ，则 1.5秒重连一次，否则 30秒重连一次
    var timer = client.heartbeat.reconnectCounts > 0 ? 1500 : 30000;
    this.reconnectByTime(timer);
    // }
};

tvWebSocketClient.reconnectByTime = function (timer) {
    let that = this;
    setTimeout(function () {
        client.heartbeat.reconnectCounts--;
        that.init(function () {
            // that.login(function () {
                that.startHeartbeat();
                client.heartbeat.reconnectCounts = 10;
            // });
        });
    }, timer);
};

/**
 * 新订单
 */
tvWebSocketClient.newOrder= function (order, cb) {
    let tvOrder = {
        type: "new",
        code: order.verCode,
        orderId: order.id,
        data: null
    }
    this.sendTvMsg(tvOrder, cb);
};

/**
 * 初始化TV信息
 * @param data
 */
tvWebSocketClient.initTv = function (data) {
    this.sendTvMsg(data);
    this.startCallOrderTask();
};

/**
 * 开始叫号任务
 */
// tvWebSocketClient.startCallOrderTask = function () {
//     let task = "";
//     taskId = setInterval(function () {
//         task = callOrderTask.shift();
//         if(task){
//             tvWebSocketClient.sendTvMsg(task);
//         }
//     }, 5000);
// };

/**
 * 叫号，执行一次叫号操作，会默认叫两次
 * order:{
 *  code（取餐码）,
 *  orderId（订单ID）,
  * data（订单项列表）
 * }
 * @param order
 * @param cb
 */
tvWebSocketClient.callNumber = function (order, cb) {
    let data = {
        type: "call",
        createTime: new Date()
    };
    data = Object.assign(data, order);
    if(callOrderTask.length === 0){
        clearInterval(taskId);
        tvWebSocketClient.sendTvMsg(data);
        callOrderTask.push(data);
        tvWebSocketClient.startCallOrderTask();
    }else{
        callOrderTask.push(data, data);
    }
    cb && cb();
};


/**
 * 移除叫号
 **/
tvWebSocketClient.removeNumber = function (order, cb) {
    let orderInfo = {
        type: "remove",
        code: order.ver_code,
        orderId: order.id,
        data: null
    }
    this.sendTvMsg(orderInfo, cb);
}