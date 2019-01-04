/**
 * @author wxh on 2018/10/17
 * @copyright
 * @desc
 */
const os = require('os');
const mqtt = require('mqtt');
const lodash = require('lodash');
const mqttEvents = require("../../util/eventsUtil").wsEvent();

const generalUtil = require("../../util/generalUtil");

const emqClientUtil = require("../../util/emqClientUtil");

const shopDetail = require('../../../config/shopDetail');

const { log, serviceInteractionLog } = require('../../util/fileUtil');
const msgUtil = require('../../util/msgUtil');

const orderController  = require("../../controller/pos/order");

const config = require('../config/index');


const mqttInstructController  = require("../../controller/pos/mqttInstruct");

// const MQTT_URL = `mqtt://test.emq.restoplus.cn:1883`;
const MQTT_URL = config.mqtt.newpos.url;

let mqttClient = module.exports;
let client = {
    url:MQTT_URL,
    mqtt: null,
    mqttOpen: false,
    callBackMap: {},
    subscribeTheme:`newPos/+/${shopDetail.brandId}/${shopDetail.id}/+/+/+`,         //newpos/platform/brandId/shopId/group/action/identification
    publishThemeJava:`weChat/${shopDetail.brandId}/${shopDetail.id}`,        //weChat/+/+/+/+/+
    publishThemeNode:`posAdmin/${shopDetail.brandId}/${shopDetail.id}`,       //posAdmin/+/+/+/+/+
    requestIdList: [],
    options: {
        username:`newpos-${shopDetail.id}`,
        password:"newpos",
        // clientId:`${shopDetail.id}-${os.hostname()}-${os.platform()}-${os.release()}-${(os.totalmem()/1024/1024/1024).toFixed(1)+'G'}`,
        clientId:`newpos-${shopDetail.brandId}-${shopDetail.id}`,
        keepalive: 5,    // 设置会话心跳时间 60秒，设置0为禁用
        reconnectPeriod: 15 * 1000,    //1000毫秒，两次重新连接之间的间隔
        resubscribe:true,   //如果连接断开并重新连接，则会再次自动订阅已订阅的主题（默认true）
    },
    data: {
        shopId: shopDetail.id,
        brandId: shopDetail.brandId
    }
};
mqttClient.client = client;
mqttClient.init =  (cb)=> {     //初始化
    client.mqtt=mqtt.connect(client.url,client.options);
    client.mqtt.on('connect',  () =>{
        client.mqttOpen = true;
        msgUtil.pushAll('emqttOnline', {
            emqttOnline: client.mqttOpen
        })
        client.mqtt.subscribe(`${client.subscribeTheme}`,(err)=>{
            if (err) return cb({type:`subscribe`,msg:err });
            serviceInteractionLog(`mqtt==>${MQTT_URL}`, `成功订阅${client.subscribeTheme}`);
            console.log(`成功订阅${client.subscribeTheme}`);
            cb()
        })
    });
    client.mqtt.on('reconnect',  () =>{
        serviceInteractionLog(`mqtt==>${MQTT_URL}`, `==reconnect==正在尝试重新连接`);
        console.log("==reconnect==正在尝试重新连接")
    });
    client.mqtt.on('close',  (connack) =>{
        client.mqttOpen = false;
        msgUtil.pushAll('emqttOnline', {
            emqttOnline: client.mqttOpen
        })
        serviceInteractionLog(`mqtt==>${MQTT_URL}`, `==close==你已断开连接,${connack?`异常退出`:`正常退出`}`);
        console.log(`==close==你已断开连接,${connack?`异常退出`:`正常退出`}`);
        return cb({type:`close`,msg:connack})
    });
    client.mqtt.on('error',  (msg) =>{
        serviceInteractionLog(`<==mqtt==${MQTT_URL}`, `收到mqtt错误`,msg);
        console.log(`收到mqtt错误`,msg)
    });
    client.mqtt.on('end',  () =>{
        serviceInteractionLog(`mqtt==>${MQTT_URL}`, `==mqtt退出==`);
        console.log("==mqtt退出==")
    });
    client.mqtt.on('message',  (topic, message, packet)=> {
        console.log(`result`,packet)
        if (message.toString() !=""){
            packet.payload = packet.payload.toString();
            mqttEvents.emit('message',packet);
            serviceInteractionLog(`<==mqtt==${MQTT_URL}==收到新消息`, `${topic},message==>${packet.payload}`);
            return client.mqtt.publish(`${topic}`,``,{ qos: 1, retain: true });
        }
    });
};

mqttClient.end =  ()=> {     //退出
    client.mqtt.end()
};


mqttClient.newposCallback =  (topic, content)=> {     //newpos接收回调
    console.log(`<==mqtt==${MQTT_URL}==发送回调消息 ${topic} `,JSON.stringify(content),{ qos: 1, retain: true });
    serviceInteractionLog(`<==mqtt==${MQTT_URL}==发送回调消息`, `${topic} -- ${JSON.stringify(content)}, { qos: 1, retain: true }`);
    return client.mqtt.publish(`${topic}`,JSON.stringify(content),{ qos: 1, retain: true });
};

mqttClient.weChatPush =  (group, action, id, data)=> {     //推送weChat消息
    // let requestId = generalUtil.randomUUID();
    // let baseParam = { requestId: requestId };
    // 这些类型的 action 需要改变订单的 sync_state
    // var resultType = action == 'updateGrant' ||'updateTableState' || data.type == 'orderCreated' || data.type == 'orderPay' || data.type == 'updateData' || data.type == 'refundOrder' || data.type == 'changeTable'
    // if (resultType) {
    //     client.requestIdList.push(requestId)
    // }
    // let content = JSON.stringify(Object.assign(baseParam, data, client.data));

    // console.log("\n\n\n")
    // console.log(`<==mqtt==${MQTT_URL}==发送新消息 ${client.publishThemeJava}/${group}/${action}/${id} `, content,{ qos: 1, retain: true });
    // console.log("\n\n\n")

    // serviceInteractionLog(`<==mqtt==${MQTT_URL}==发送新消息`, `${client.publishThemeNode}/${group}/${action}/${id} -- ${content}, { qos: 1, retain: true }`);
    // try {
    //     client.mqtt.publish(`${client.publishThemeJava}/${group}/${action}/${id}`, content,{ qos: 1, retain: true });
    // } catch (e) {
    //     serviceInteractionLog(`<==mqtt==${MQTT_URL}==发送出错，请检查 emqtt连接，或者退出登录，谢谢 `, JSON.stringify(e));
    // }
};

mqttClient.posAdminPush =  (group,action,id, content)=> {     //推送posAdmin消息
    console.log(`<==mqtt==${MQTT_URL}==发送新消息 ${client.publishThemeNode}/${group}/${action}/${id} `,JSON.stringify(content),{ qos: 1, retain: true });
    serviceInteractionLog(`<==mqtt==${MQTT_URL}==发送新消息`, `${client.publishThemeNode}/${group}/${action}/${id} -- ${JSON.stringify(content)}, { qos: 1, retain: true }`);
    client.mqtt.publish(`${client.publishThemeNode}/${group}/${action}/${id}`,JSON.stringify(content),{ qos: 1, retain: true });
};


mqttEvents.addListener("message",  (result)=> {
    console.log("----------result------------", result)
    let arr = result.topic.split("/");
    let platform = arr[1],group = arr[4], action = arr[5],identification =arr[6] ;
    try {
        var obj=JSON.parse(result.payload);
        if(typeof obj == 'object' && obj ){ //
            if (obj.callback_channel == "newpos") return;
            if (platform == `weChat`) {
                emqClientUtil.weChatSourceDispose(result)
            }else if (platform == `posAdmin`){
                emqClientUtil.posAdminSourceDispose(result)
            }else {
                console.log(`<==mqtt==${MQTT_URL}==收到新消息`, `暂时不支持${platform}平台通讯`);
                return serviceInteractionLog(`<==mqtt==${result.topic}==收到新消息`, `暂时不支持${platform}平台通讯`);
                // return mqttClient.newposCallback(`${result.topic}`,{ "ok": false,"callback_channel":"newpos","message_id":"","message": `暂时不支持${platform}平台通讯`});
            }
        }else{
            return serviceInteractionLog(`<==mqtt==${result.topic}==收到新消息`, `数据必须为Json对象`);
            // return mqttClient.newposCallback(`${result.topic}`,{ "ok": false,"callback_channel":"newpos","message_id":"","message": "数据必须为Json对象"});
        }
    } catch(e) {
        console.log('error：'+result.payload+'!!!'+e);
        return serviceInteractionLog(`<==mqtt==${result.topic}==收到新消息`, `数据必须为Json对象`);
        // return mqttClient.newposCallback(`${result.topic}`,{ "ok": false,"callback_channel":"newpos","message_id":"","message": "数据必须为Json对象"});
    }
});
