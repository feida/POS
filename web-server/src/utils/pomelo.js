/**
 * Created by Lmx on 2017/7/3.
 */


/**
 * 消息分发中心
 * 此中心 用来分发newPos前端消息
 */

import pomelo from './pomelo-client/index';
import {SERVER_HOST, SERVER_PORT} from '../config/serverConfig';
import {Message, Notification} from 'element-ui';
import bus from './bus'

let ON_CONNECTION = false;  //  用于判断是否正在初始化
let HAS_INIT = false; // 用于判断是否已经初始化
let CONNECTION_FAILURE_TIMES = 0; //连接失败次数

let initPomelo = function (cb, error) {
  ON_CONNECTION = true;
  let serverHost = window.location.hostname;
  var ws = new WebSocket("ws://" + serverHost + ":" + SERVER_PORT + "/");
  ws.onopen = function () { //  判断本地服务器是否成功启动
    pomelo.init({
      host: serverHost,
      port: SERVER_PORT,
      log: true
    }, function () {
      console.log('pomelo init success ...');
      HAS_INIT = true;
      initPomeloListener();
      cb && cb();
    });
  };
  ws.onerror = function () {
    error && error()
  };
};

let baseRequest = function (route, param, cb, errcb) {
  pomelo.request(route, param, function (result) {
    console.log("\n");
    console.log(route, result);
    // console.table(result.data || []);
    console.log("\n");
    if (result.success) {
      cb && cb(result.data);
    } else {
      console.error(result);
      if(result.msg && (result.msg || "").toString().indexOf("database is locked") != -1){
        window.pomelo.notify("pos.webSocketHandler.posLogout");
        Notification({
          title: 'Resto',
          type: 'error',
          message: '本地数据库被锁，请重启POS，否则微信将无法正常下单！',
          duration: 0
        })
      }
      if(errcb){  // 如果传了 错误回调，则执行 错误回调
        errcb(result.msg);
      }else{  // 如果没有传，则执行默认错误提示
        if(result.msg){
          Message.closeAll();
          Message.error({
            showClose: true,
            message: result.msg
          });
        }
      }
    };
  });
};


export const request = function (route, param, cb, errcb) {
  if (pomelo && HAS_INIT) { // 如果已初始化
    baseRequest(route, param, cb, errcb);
  } else if(ON_CONNECTION){ //  如果正在初始化，则 100ms 后再请求
    setTimeout(function () {
      request(route, param, cb, errcb);
    }, 1000);
  }else {
    initPomelo(function () { // 如果未初始化，则先初始化，再请求
      baseRequest(route, param, cb, errcb);
    },function () { //  如果初始化失败，则 100ms 后重新初始化
      ON_CONNECTION = false;
      setTimeout(function () {
        ++CONNECTION_FAILURE_TIMES;
        if(CONNECTION_FAILURE_TIMES < 20){
          request(route, param, cb, errcb);
        }else{
          if(errcb){
            errcb("本地服务连接超时，请重启POS程序再试！");
          }else{
            Message.error({
              showClose: true,
              message: "本地服务连接超时，请重启POS程序再试！"
            });
          }
        }
      }, 1000);
    });
  };
};


let successNotify = function (msg) {
  Notification({
    title: 'Resto',
    type: "success",
    message: msg,
    duration: 2500
  })
};

function initPomeloListener() {

  //  实现 此消息分发 上面todo可以删除
  window.pomelo.on("event", (evenObj)=>{
    if (evenObj.type == 'normalOrder') {
      bus.$emit(evenObj.type, evenObj);
    } else {
      bus.$emit(evenObj.type, evenObj.data);
    }
  });

  //  通知消息
  window.pomelo.on("notifyMsg", (data)=>{
    let msg = data.msg;
    if(typeof msg == 'object' && data.type == 'info') {
      if(msg.childrenOrder == 1) {
        window.appControl.$notify.success(`【${msg.tableNumber}】号桌 已加菜`)
      } else {
        bus.$emit("bindTable", msg);
      }
    } else {
      Notification({
        title: 'Resto',
        type: data.type,
        message: data.msg,
        duration: 2500
      });
    }
    if(data.msg === "已与服务器断开连接！"){
      bus.$emit("wsServerClose");
    }
  });
  //  踢用户
  window.pomelo.on("kickUser", ()=>{
    bus.$emit("kickUser");
  });
  //  同步订单进度
  window.pomelo.on("syncOrderInfoProgress", (data)=>{
    bus.$emit("syncOrderInfoProgress", data);
  });
  //  同步订单成功
  window.pomelo.on("syncOrderInfoSuccess", (data)=>{
    bus.$emit("syncOrderInfoSuccess", data);
  });
  //  同步菜品库存进度
  window.pomelo.on("syncArticleStockProgress", (data)=>{
    bus.$emit("syncArticleStockProgress", data);
  });
  //  同步菜品库存成功
  window.pomelo.on("syncArticleStockSuccess", ()=>{
    bus.$emit("syncArticleStockSuccess");
  });
  //  同步菜品库存错误
  window.pomelo.on("syncArticleStockError", (errorMsg)=>{
    bus.$emit("syncArticleStockError", errorMsg);
  });
  //  同步数据库
  window.pomelo.on('syncDatabase', (data)=>{
    bus.$emit("syncDatabase", data);
  });
  //  同步数据库报错
  window.pomelo.on("syncDatabaseError", (data)=>{
    bus.$emit("syncDatabaseError",data);
  });
  //  同步库存成功
  window.pomelo.on("syncDatabaseSuccess", ()=>{
    bus.$emit("syncDatabaseSuccess");
  });
  //  服务器推送新订单
  window.pomelo.on("wsNewOrder", (data)=>{
    successNotify(`收到${data.tableNumber}桌 新订单`);
    bus.$emit("wsNewOrder", data);
  });
  //  服务器推送订单支付事件
  window.pomelo.on("wsPayOrder", (data)=>{
    bus.$emit("wsPayOrder", data);
  });
  //  服务器推送订单支付事件
  window.pomelo.on("wsCancelOrder", (data)=>{
    bus.$emit("wsCancelOrder", data);
  });
  //  服务器数据更新
  window.pomelo.on("wsServerDataChange", (data)=>{
    bus.$emit("wsServerDataChange", data);
  });
  //  与电视端建立连接
  window.pomelo.on("connectTV", ()=>{
    bus.$emit("connectTV");
  });
  //  与电视端断开连接
  window.pomelo.on("disconnectTV", ()=>{
    console.log("断开连接")
    bus.$emit("disconnectTV");
  });
  //  桌位消息通知
  // window.pomelo.on("bindTable", (data) => bus.$emit("bindTable", data))
  //  刷新购物车列表
  window.pomelo.on("freshCar", (msgInfo) => {
    bus.$emit("freshCar", msgInfo)
  })
  window.pomelo.on("freeRefundOrder", (msgInfo) => {
    bus.$emit("freeRefundOrder", msgInfo)
  })
}
