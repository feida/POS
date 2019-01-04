const WebSocket = require('ws');
const generalUtil = require("../util/generalUtil");
const shopDetail = require('../../config/shopDetail');
const wsEvent = require("../util/eventsUtil").wsEvent();
const { log, serviceInteractionLog } = require('../util/fileUtil');
const msgUtil = require('../util/msgUtil');

const config = require('../dao/config/index');

const order  = require("../controller/pos/order")

var webSocketClient = module.exports;

let client = {
    ws: null,
    webSocketOpen: false,
    network: false,
    data: {
        brandId: shopDetail.brandId,
        shopId: shopDetail.id,
    },
    callBackMap: {},
    requestIdList: [],
    heartbeat: {
        id: 0,
        reconnectCounts: 10,
        interval: 15000,  //  心跳间隔时间 （毫秒）
    },
};

webSocketClient.client = client;

webSocketClient.init = function (cb) {
    let that = this;
    client.ws = new WebSocket(`ws://${config.java_server_db.serverIp}/pos/orderServer`, null, null);
    client.ws.onopen = function () {
        client.webSocketOpen = true;
        msgUtil.pushAll('event',{
            type: "wsOpen",
            data: client.webSocketOpen
        })
        cb && cb();
    };
    client.ws.onmessage = function (event) {
        if (event && event.data) {
            log("ws", `收到新消息：\n ${event.data}`);
            var result = JSON.parse(event.data);
            let json = {
                'orderCreated':`收到微信订单`,
                'actionPrint':`电视叫号模式，打印订单指令`,
                'platform':`收到外卖订单`,
                'orderPay':`收到支付项`,
                'updatePayment':`更新支付状态`,
                'cancelOrder':`收到取消订单指令`,
                'serverCommand':`收到自定义指令`,
                'callback':`收到回调指令`,
            }
            // dataType
            serviceInteractionLog(`_【《******】_ws.receiveMsg__==>${config.java_server_db.serverIp}`, `${json[result.dataType]}==>${event.data}`);
            //  请求回调
            if (result.dataType === "callback") {
                for(var requestId of client.requestIdList) {
                    if (result.requestId == requestId && result.callBackData && result.callBackData.length > 0) {
                        var resultData = JSON.parse(result.callBackData);
                        order.syncSuccessOrderInfoById(resultData);
                    }
                }

                if (result.requestId) {
                    let serverCB = client.callBackMap[result.requestId];
                    serverCB && serverCB(null, result.callBackData);
                    delete client.callBackMap[result.requestId];
                }
            } else { //  服务端通讯事件
                wsEvent.emit(result.dataType, result);
            }
        }
    };
    client.ws.onerror = function (event) {
        console.error(`【ws报错-============】`);
        log(`__ws.onerror__`, `内容:ws报错==>${event}`);
    };
    client.ws.onclose = function (event) {
        client.webSocketOpen && msgUtil.errorNotify("已与服务器断开连接！");
        client.webSocketOpen = false;
        wsEvent.emit("wsOpen", false);
        msgUtil.pushAll('event',{
            type: "wsOpen",
            data: client.webSocketOpen
        })
        log(`__ws.onclose__`, `ws与服务器断开连接==>${event}`);
        //todo  断开之后，自动重连
        that.reconnect();
    };
};

webSocketClient.sendMsg = function (data, cb) {
    let that = this;
    let baseParam = {};
    if (cb && typeof cb === "function") {
        let requestId = generalUtil.randomUUID();
        var resultType = data.type == 'updateGrant' ||'updateTableState' || data.type == 'orderCreated' || data.type == 'orderPay' || data.type == 'updateData' || data.type == 'refundOrder' || data.type == 'changeTable'
        if (resultType) {
            client.requestIdList.push(requestId)
        }
        client.callBackMap[requestId] = cb;
        baseParam = { requestId: requestId };
    }
    let content = JSON.stringify(Object.assign(baseParam, data, client.data));
    if (client.webSocketOpen && client.ws) {
        console.log("\n\n")
        console.log("-发送消息-", content)
        console.log("\n\n")
        try {
            client.ws.send(content);
            let obj = eval('(' + content + ')');
            let json = {
                'login':`登录指令`,
                'heartbeat':`心跳`,
                'updateTableState':`修改座位状态指令`,
                'orderCreated':`创建订单指令`,
                'orderPay':`推送订单支付项指令`,
                'updateData':`推送修改订单数据指令`,
                'printSuccess':`推送打印成功指令`,
                'articleStock':`同步库存`,
                'syncPosLocalOrder':`同步本地订单`,
                'posCancelOrder':`pos发送取消订单指令`,
                'checkOut':`pos买单指令`,
                'logout':`登出`,
                'exceptionOrderList':`获取异常订单`,
                'scanCodePayment':`扫码支付`,
                'revocationOfOrder':`撤销扫码支付`,
                'callNumber':`叫号`,
                'callback':`服务器回调`,
                'confirmPayment':`轮训扫码支付`,
                'refundOrder':`退单信息`,
                'printOrder':`打印订单`,
                'activated':`上下架(0：下架1：上架)`,
                'empty':`沽清(0：未沽清1：已沽清)`,
                'edit':`编辑库存`,
            };
            serviceInteractionLog(`_【******》】_ws.sendMsg__==>${config.java_server_db.serverIp}`, `${json[obj.type]}==>${content}`);
        } catch (e) {
            cb && cb({ code: 500, error: e });
            serviceInteractionLog(`__error_ws.sendMsg__==>${config.java_server_db.serverIp}`, `内容:${e.toString()}`);
        }
    } else {
        cb && cb({ code: -1, error: "WS客户端未初始化" });
        console.error(`WS客户端未初始化`);
        that.stopHeartbeat();
        console.log("webSocketOpen：" + client.webSocketOpen);
        serviceInteractionLog(`__error_ws.sendMsg__==>${config.java_server_db.serverIp}`, `内容:WS客户端未初始化`);
    }
};

/**
 * 开始心跳
 */
webSocketClient.startHeartbeat = function () {
    clearInterval(client.heartbeat.id);
    client.heartbeat.id = setInterval(() => {
        this.sendMsg({ type: "heartbeat" });
    }, client.heartbeat.interval);
    serviceInteractionLog(`_【******》】_ws.sendMsg__==>${config.java_server_db.serverIp}`, `开始心跳 client.heartbeat.interval ==> ${client.heartbeat.interval}`);
};

/**
 * 停止心跳
 */
webSocketClient.stopHeartbeat = function () {
    clearInterval(client.heartbeat.id);
};

webSocketClient.reconnect = function () {
    // if(navigator.onLine){ //只有联网的时候，才进行重连
    //  如果默认链接次数大于 0 ，则 1.5秒重连一次，否则 30秒重连一次
    var timer = client.heartbeat.reconnectCounts > 0 ? 1500 : 30000;
    this.reconnectByTime(timer);
    serviceInteractionLog(`_【******》】_ws.sendMsg__==>${config.java_server_db.serverIp}`, `重连 client.heartbeat.reconnectCounts ==> ${client.heartbeat.reconnectCounts}`);
    // }
};

webSocketClient.reconnectByTime = function (timer) {
    let that = this;
        setTimeout(function () {
        client.heartbeat.reconnectCounts--;
        that.init(function () {
            that.login('','',function () {
                that.startHeartbeat();
                wsEvent.emit("wsOpen", client.webSocketOpen);
                serviceInteractionLog(`_【******》】_ws.sendMsg__==>${config.java_server_db.serverIp}`, `重启心跳 ==>${client.heartbeat.reconnectCounts}`);
                client.heartbeat.reconnectCounts = 10;
            });
        });
    }, timer);
};

/**
 * 封装统一回调
 * @param param             ws收到的数据
 * @param callBackData      ws需要给服务器回调的数据
 */
webSocketClient.callback = function (param, callBackData) {
    if (param && param.requestId) {
        this.sendMsg({
            requestId: param.requestId,
            type: "callback",
            callBackData: callBackData || null
        });
    }
};

/**
 * 登录
 */
webSocketClient.login = function (name, password, cb) {
    this.sendMsg({
        name: name,
        password: password,
        type: "login"
    }, cb);
};

/**
 * 同步库存
 */
webSocketClient.syncArticleStock = function (cb) {
    this.sendMsg({
        type: "articleStock"
    }, cb);
};

/**
 * 修改桌位状态
 * @param tableNumber
 * @param state
 */
webSocketClient.updateTableState = function (tableNumber, state, orderId, cb) {
    var data = {
        orderId: orderId,
        tableNumber:tableNumber,
        state:state,  // false：开台   true：释放
        type:"updateTableState"
    };
    console.log("\n\n")
    console.log("Data", data)
    console.log("\n\n")
    this.sendMsg(data, cb);
};

/**
 * 释放桌位
 * @param tableNumber
 * @param state
 */
webSocketClient.updateTableNumberState = function (tableNumber, state, cb) {
    var data = {
        tableNumber: tableNumber,
        state: true,  // false：开台   true：释放
        type: "updateTableNumberState"
    };
    this.sendMsg(data, cb);
};

/**
 * 打印成功
 * @param orderId
 * @param cb
 */
webSocketClient.printSuccess = function (orderId, cb) {
    this.sendMsg({
        type: "printSuccess",
        orderId: orderId
    }, cb);
};

/**
 * 打印订单
 * @param orderId
 * @param cb
 */
webSocketClient.printOrder = function (orderId, cb) {
    console.log('=========printOrder==========', orderId)
    this.sendMsg({
        type: "printOrder",
        orderId: orderId
    }, cb);
};

/**
 * 同步本地订单
 * @param orderInfo
 * @param cb
 */
webSocketClient.syncPosLocalOrder = function (orderInfo, cb) {
    this.sendMsg({
        type: "syncPosLocalOrder",
        order: orderInfo
    }, cb);
};

/**
 * Pos端取消订单
 * @param orderId
 * @param cb
 */
webSocketClient.posCancelOrder = function (orderId, cb) {
    this.sendMsg({
        type: "posCancelOrder",
        orderId: orderId
    }, cb);
};

/**
 * Pos买单
 * @param cb
 */
webSocketClient.posCheckOut = function (cb) {
    this.sendMsg({
        type: "checkOut"
    }, cb);
};

/**
 * 获取异常订单
 * @param cb
 */
webSocketClient.exceptionOrderList = function (cb) {
    this.sendMsg({
        type: "exceptionOrderList"
    }, cb);
};

/**
 *  撤销订单（扫码支付）
 * @param outTradeNo
 * @param payType
 * @param cb
 */
webSocketClient.revocationOfOrder = function (outTradeNo, payType, cb) {
    this.sendMsg({
        type: "revocationOfOrder",
        payType: payType,
        outTradeNo: outTradeNo
    }, cb);
};

/**
 * 扫码支付
 * @param brandId
 * @param shopId
 * @param authCode
 * @param paymentAmount
 * @param payType
 * @param cb
 */
webSocketClient.scanPay = function (brandId, shopId, authCode, paymentAmount, payType, orderId, cb) {

    console.log("===brandId",brandId)
    console.log("===shopId",shopId)
    console.log("===orderId",orderId)
    let sendScanPayData = {
        brandId: brandId,
        shopId: shopId,
        orderId : orderId,
        authCode: authCode, //注：二维码的扫描结果
        type: "scanCodePayment", //注：直接写死
        paymentAmount: (+paymentAmount).toFixed(2), //注：此次请求应付金额
        payType: payType //注：微信 = 1、支付宝 = 2、R+ = 3
    };
    this.sendMsg(sendScanPayData, cb);
};

/**
 * 轮询查询（扫码支付）
 * @param confirmData
 * @param cb
 */
webSocketClient.isPollingScanPay = function (confirmData, cb) {
    confirmData.order.orderState = 2;
    let confirmScanPayData = {
        shopId: confirmData.shopId,
        brandId: confirmData.brandId,
        outTradeNo: confirmData.outTradeNo,
        order: confirmData.order,
        paymentAmount: (+confirmData.paymentAmount).toFixed(2),
        type: "confirmPayment",
    };
    this.sendMsg(confirmScanPayData, cb)
};

/**
 * 退单
 * @param refund
 * @param cb
 */
webSocketClient.refundOrder = function (refund, cb) {
    this.sendMsg({
        refund: refund,
        type: "refundOrder"
    }, cb);
};

/**
 * 叫号
 * @param orderId
 * @param cb
 */
webSocketClient.callNumber = function (orderId, cb) {
    this.sendMsg({
        type: "callNumber",
        orderId: orderId
    }, cb);
};

/**
 * 退出登录
 * @param cb
 */
webSocketClient.posLogout = function (cb) {
    this.sendMsg({
        type: "logout"
    }, cb);
};

/**
 *
 */
webSocketClient.syncOrderInfo = function (cb) {

};

/**
 * 同步订单列表
 */
webSocketClient.syncOrders = function (data,cb) {
    this.sendMsg({
        type: 'synchronousData',
        dataSet: data
    }, cb);
}

/**
 * 动态更新数据
 * @param data
 * @param serverType    业务类型，没有可传  null
 * @param cb
 */
webSocketClient.syncUpdateData = function (data, serverType, lastSyncTime, syncState, cb) {
    this.sendMsg({
        type: "updateData",
        serverType: serverType || '',
        syncState: syncState,
        lastSyncTime: lastSyncTime,
        dataList: data
    }, cb);
};

/**
 * 订单支付
 */
webSocketClient.orderPay = function (orderId, payMode, orderPayment,lastSyncTime,syncState, cb) {
    this.sendMsg({
        type: "orderPay",
        orderId: orderId,
        payMode: payMode,
        isPosPay: 1,
        lastSyncTime: lastSyncTime,
        syncState: syncState,
        orderPayment: orderPayment || [],
    }, cb);
};



webSocketClient.orderCreated = function(order, cb) {
    this.sendMsg({
        type: "orderCreated",
        order: order
    }, cb);
}

/***
 * @param articleId article id
 * @param activated Current article activated status
 */
webSocketClient.articleActivated = function (articleId, activated, cb) {
    this.sendMsg({
        type: "activated",
        id: articleId,
        activated: activated
    }, cb)
}

/**
 * @desc sold out
 * @params id articleId
 * */
webSocketClient.articleEmpty = function (id, cb) {
    this.sendMsg({
        id: id,
        isEmpty: 1,
        type: "empty",
    }, cb);
}

/**
 * @desc Edit article stock
 * @params articleId string
 * @params count string
 */
webSocketClient.editStock = function (articleId, count, cb) {
    this.sendMsg({
        type: "edit",
        id: articleId,    //菜品id
        count: count,     //编辑的数量
    }, cb);
}
webSocketClient.changeTable = function (orderId, tableNumber, syncState, lastSyncTime, cb) {
    this.sendMsg({
        type: "changeTable",
        orderId: orderId ,
        tableNumber: tableNumber,
        syncState: syncState,
        lastSyncTime: lastSyncTime
    }, cb)
}

webSocketClient.updateGrant = function (grantData, cb) {
    this.sendMsg({
        type: 'updateGrant',
        orderId: grantData.orderId,
        order: grantData.order,
        orderItems: grantData.orderItems,
        remarks: grantData.remarks
    }, cb)
}
