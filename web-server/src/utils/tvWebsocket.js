import {
  waitCallAllOrderList,
  getOrderItemsBySerialNumber,
  getShopTvConfig,
  callNumber,
  getOrderDetail,
  systemLog,
  tvCallNumber
} from 'api/api';

import bus from './bus'

/**
 * date: 2018/1/16
 * author: guofeng
 * des:
 */
export default {
  install(Vue) {
    //  验证是否输入 websocket 连接 URL
    var log = console.log.bind(console);
    //  webSocket
    var socket = {
      app: null,
      ws: null,
      tvIp: "",
      reconnectCounts: 10,
      callOrderTask: [],
      init: function (_Vue, tvIp, cb) {
        systemLog("tv-websocket", `准备连接 电视端IP(${sessionStorage.getItem("tvIp")})`);
        if (this.ws != null && this.ws.readyState == 3) {
          console.log("this.ws", this.ws)
          this.ws.close();
        }
        this.tvIp = tvIp;
        var that = this;
        this.ws = new WebSocket(`ws://${tvIp}:8000`);
        this.ws.onopen = function () { that.onOpen(cb); };
        this.ws.onmessage = function (event) { that.onMessage(event); };
        this.ws.onerror = function (event) {
          that.onError(event);
        };
        this.ws.onclose = function (event) {
          that.onClose(event);
        };
        this.app = _Vue;
      },
      onOpen : function (cb) {
        log("%c 已成功连接   -->   电视端","background-color: #67C23A; color: #FFF;font-size:16px;");
        this.successNotify("已成功连接电视");
        let that = this;
        window.tvWebSocketOpen = true;
        sessionStorage.setItem('tvWebSocketOpen', true);
        bus.$emit("successTV");
        this.startCallOrderTask();

        //  监听事件
        bus.$off("newWechatTVorder");
        bus.$on("newWechatTVorder", orderInfo => {
          that.newOrder(orderInfo);
        })
        waitCallAllOrderList(function (orderList) {
          let orderNew = [];
          if(orderList && orderList.length > 0){
            for(let order of orderList){
              orderNew.push({
                orderId: order.id,
                code: order.ver_code
              });
            }
          }
          getShopTvConfig(function (shopTvConfig) {
            let data = {
              type : "open",
              orderNew: orderNew,
              shopTvConfig : shopTvConfig
            };
            that.send(data);
            systemLog("tv-websocket", "电视机连接成功： " + JSON.stringify(shopTvConfig));
            cb && cb();
          })
        })

      },
      startCallOrderTask: function () {
        var that = this;
        var task = JSON.parse(this.taskPerform());
        if(task){
          that.send(task);
          that.startCallOrderTask();
        }else{
          setTimeout(function () {
            that.startCallOrderTask();
          }, 1000);
        }
      },
      newOrder: function (order) {
        let data = {
          type: "new",
          code: order.ver_code || order.verCode,
          orderId: order.id,
          data: null
        };
        this.send(data);
      },
      callNumber: function (serialNumber) {
        let that = this;
        getOrderItemsBySerialNumber(serialNumber, function (resultData) {
          let orderItemList = resultData.orderItemList;
          var articleItem = [];
          if(orderItemList && orderItemList.length){
            for(let item of orderItemList){
              articleItem.push({
                articleName: item.article_name.length > 10 ? item.article_name.substring(0,9) + "..." : item.article_name,
                count: item.count
              });
            }
          }
          var data = {
            type: "call",
            code: resultData.verCode,
            orderId: resultData.orderId,
            data: articleItem,
            createTime: new Date()
          };
          callNumber(resultData.orderId);
          tvCallNumber(resultData.orderId);
          that.callOrderTask.push(data);
          that.taskPush(data)
          that.taskPush(data)
          systemLog("tv-websocket", "给电视发送叫号指令：" + JSON.stringify(resultData));
        })
      },
      /**
       * 移除叫号
       **/
      removeNumber: function (order, cb) {
          let orderInfo = {
            type: "remove",
            code: order.ver_code,
            orderId: order.id,
            data: null
          }
          this.send(orderInfo, cb);
      },
      taskPush:function (data) {
        var task = sessionStorage.getItem("task");
        if(!task){
          task = JSON.stringify(data)
        }else {
          task += `||${JSON.stringify(data)}`
        }
        sessionStorage.setItem("task",task);
      },
      taskPerform:function () {
        var task = sessionStorage.getItem("task");
        let taskTime = +sessionStorage.getItem("taskTime") + 5*1000;
        var taskArray = [];
        if(task){
          taskArray = task.split("||");
          let data = taskArray[0];
          if(new Date().getTime() > taskTime && window.tvWebSocketOpen){
            taskArray.splice(0,1);
            sessionStorage.setItem("task",taskArray.join("||"));
            sessionStorage.setItem("taskTime",new Date().getTime());
            console.log("正在执行",data);
            return data;
          }else {
            console.log("等待执行");
            return null;
          }
        }else {
          return null;
        }
      },
      onMessage : function (event) {
        log("【tvWebSocket】 onMessage ... ",JSON.parse(event.data));
        let msg = JSON.parse(event.data);
        if (msg.type == "scan") {
          this.callNumber(msg.data);
          systemLog("tv-websocket", "tv 发来叫号订单： " + msg.data);
          bus.$emit("tv-web-socket-call-order", msg.data);
        }
      },
      onClose : function (event) {
        window.tvWebSocketOpen = false;
        bus.$emit("closeTv");
        systemLog("tv-websocket", `已与 电视端IP(${sessionStorage.getItem("tvIp")}) 断开连接，正在尝试重新连接`);
        this.reconnectCounts > 0 && this.warningNotify("已与 电视端 断开连接，正在尝试重新连接。");
        this.reconnect();
      },
      onError : function (event) {
        log("onError" ,event);
      },
      reconnect: function () {
        var timer = this.reconnectCounts > 0 ? 5 * 1000 : 30 * 1000;
        this.reconnectByTime(timer);
      },
      reconnectByTime: function (timer) {
        setTimeout( function() {
          socket.reconnectCounts--;
          socket.init(socket.app, socket.tvIp);
        }, timer);
      },
      send : function (data) {
        if(window.tvWebSocketOpen){
          this.ws.send(JSON.stringify(data));
        }else{
          log("%c 当前店铺未连接电视端  ","background-color: #F56C6C; color: #FFF;font-size:16px;");
          log(data);
          log("\n");
        }
      },
      successNotify: function (msg,time) {
        return this.app.$notify({
          title: "TV连接",
          message: msg,
          type: "success",
          duration: time != null ? time : 2500,
        });
      },
      warningNotify: function (msg) {
        this.app.$notify({
          title: "TV连接",
          message: msg,
          type: "warning",
          duration: 2500,
        });
      }
    };

    Vue.prototype.$tvSocket = socket;
  }
}
