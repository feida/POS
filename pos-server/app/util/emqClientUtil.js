/**
 * @author wxh on 2018/12/3
 * @copyright
 * @desc
 */

var emqClient = module.exports;
const { log, serviceInteractionLog } = require('./fileUtil');

const mqttClient = require("../dao/mqtt/index");


const mqttInstructController  = require("../controller/pos/mqttInstruct");
const orderController  = require("../controller/pos/order");
const wsEvent = require("../util/eventsUtil").wsEvent();
const generalUtil = require("../util/generalUtil");

emqClient.weChatSourceDispose =  (param)=> {
    let arr = param.topic.split("/");
    var obj=JSON.parse(param.payload);
    let platform = arr[1], group = arr[4], action = arr[5], identification =arr[6];
    if (action == 'orderCreated' || action == 'orderPay' || action == 'updatePayment') {
        getAction(action, obj)
    }
};

var getAction = (action, obj) => {
    wsEvent.emit(action, obj);
}



emqClient.posAdminSourceDispose =  (param)=> {
    let arr = param.topic.split("/");
    var obj=JSON.parse(param.payload);
    let platform = arr[1],group = arr[4], action = arr[5],identification =arr[6] ;
     if (action == `upsert`){
        log(`接收到pos-admin 数据更新查询指令`,`${param.payload.toString()}`);
        mqttInstructController.tableDataUpsert(obj,(err,data)=>{
            let resultJson = {
                ok: err ? false : true,
                callback_channel:"newpos",
                message_id:obj["message_id"]  || "",
                message: `${err ? err+" || 数据更新失败" : "数据更新成功"}`,
            };
            return mqttClient.posAdminPush(group,action,identification,resultJson);
        });
    }else if (action == `gather`){
         serviceInteractionLog(`<==mqtt==开始订单数据采集`, `${param.payload.toString()}`);
         var timeBegin = new Date().getTime();
         var timeEnd = null;
         orderController.orderGatherBydate(param.topic,obj,(err,data)=>{
             timeEnd = new Date().getTime();
             let resultJson = {
                 ok: err ? false : true,
                 callback_channel:"newpos",
                 message_id:obj["message_id"]  || "",
                 message: `${err ? err+" || 订单数据采集失败" : "订单数据采集成功"} 总共用时： ${(timeEnd - timeBegin) / 1000}s`,
             };

             console.log("数据采集总共用时：" + (timeEnd - timeBegin) / 1000 + " s");
             serviceInteractionLog(`<==mqtt==结束订单数据采集`, "订单数据采集总共用时：" + (timeEnd - timeBegin) / 1000 + " s");
             return mqttClient.posAdminPush(group,action,identification,resultJson);
         })
    }else {
        return mqttClient.posAdminPush(group,action,identification,{ "ok": false,"callback_channel":"newpos","message_id":`${obj["message_id"] || ""}`,"message": `暂时不支持${action}操作 [customSql,upsert]`});
    }

};
