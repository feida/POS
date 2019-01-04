import { request } from '../utils/pomelo';
import { systemLog } from 'api/api';
// import bus from './bus';

export default {
  install(Vue) {
    let socket = {
      send : function (param, cb, errorCB) {
        if(navigator.onLine){
          try {
            request("pos.webSocketHandler.sendMsg", { param : param, callback: cb ? true : false }, function (result) {
              cb && cb(result);
            },function (error) {
              errorCB && errorCB(error);
            });
          }catch (e){
            systemLog("ws-发送失败", JSON.stringify(e));
          }
        }
      },
      updateTableState : function(tableNumber, state, orderId){
        var data = {
          orderId: orderId,
          tableNumber:tableNumber,
          state:state,  // false：开台   true：释放
          type:"updateTableState"
        };
        this.send(data, function (result) {});
      },
      printSuccess : function (orderId, cb) {
        this.send({
          type: "printSuccess",
          orderId: orderId
        }, cb);
      },
      printOrder : function (orderId, cb) {
        this.send({
          type: "printOrder",
          orderId: orderId
        }, cb);
      },
      syncPosLocalOrder: function (orderInfo, cb) {
        this.send({
          type: "syncPosLocalOrder",
          order: orderInfo
        },cb);
      },
      posCancelOrder: function (orderId, cb) {
        this.send({
          type: "posCancelOrder",
          orderId: orderId
        },cb);
      },
      posCheckOut: function (username,dailyLogId, cb) {
        this.send({
          type: "checkOut",
          operator: username || '',
          dailyLogId: dailyLogId || '',
        },cb);
      },
      orderPay: function (orderId, payMode, orderPayment, cb) {
        this.send({
          type:"orderPay",
          orderId: orderId,
          payMode: payMode,
          isPosPay: 1,
          orderPayment: orderPayment || [],
        },cb);
      },
      getAccountInfo: function (orderId, cb, errorCB) {
        this.send({
          type   : "getAccountInfo",
          orderId: orderId,
          // brandId: userInfo.brandId,
          // shopId : userInfo.shopId
        },cb , errorCB);
      },
      confirmOrder : function (orderId, cb) {
        this.send({
          type:"confirmOrder",
          isPosPay: 1,
          orderId: orderId,
        }, cb);
      },
      exceptionOrderList : function (cb) {
        this.send({
          type: "exceptionOrderList"
        }, cb);
      },
      revocationOfOrder : function (outTradeNo, payType, cb) {
        this.send({
          type : "revocationOfOrder",
          payType: payType,
          outTradeNo : outTradeNo
        }, cb);
      },
      scanPay : function (brandId, shopId, authCode, paymentAmount, payType, orderId, cb) {
        let sendScanPayData = {
          brandId  : brandId,
          shopId   : shopId,
          orderId   : orderId,
          authCode : authCode, //注：二维码的扫描结果
          type     : "scanCodePayment", //注：直接写死
          paymentAmount : (+paymentAmount).toFixed(2), //注：此次请求应付金额
          payType  : payType //注：微信 = 1、支付宝 = 2、R+ = 3
        };
        console.log("sendScanPayData mhkz", sendScanPayData);
        this.send(sendScanPayData, cb);
      },
      isPollingScanPay: function (confirmData, cb) {
        confirmData.order.orderState = 2;
        let confirmScanPayData = {
          shopId: confirmData.shopId,
          brandId:confirmData.brandId,
          outTradeNo: confirmData.outTradeNo,
          order: confirmData.order,
          paymentAmount: (+confirmData.paymentAmount).toFixed(2),
          type: "confirmPayment",
        };
        console.log("confirmData mhkz", confirmScanPayData)
        this.send(confirmScanPayData, cb)
      },
      refundOrder : function (refund, cb, errorCB) {
        this.send({
          refund: refund,
          type: "refundOrder"
        }, cb, errorCB);
      },
      orderCreated : function (order, cb) {
        this.send({
          type: "orderCreated",
          order: order
        }, cb);
      },
      articleEmpty : function (id, cb) {
        this.send({
          type: "empty",
          id: id,       //菜品id
          isEmpty: 1,
        }, cb);
      },
      editStock : function (articleId, count, cb) {
        this.send({
          type: "edit",
          id: articleId,    //菜品id
          count: count,     //编辑的数量
        }, cb);
      },
      changeTable : function (orderId, tableNumber, syncState, lastSyncTime, cb) {
        this.send({
          type:"changeTable",
          orderId: orderId ,
          tableNumber: tableNumber,
          syncState: 1,
          lastSyncTime: lastSyncTime
        }, cb);
      },
      articleActivated : function (articleId, activated, cb) {
        this.send({
          type: "activated",
          id: articleId, //菜品id
          activated: activated == true ? 0 : 1,  //0:下架 1上架
        }, cb);
      },
      callNumber: function (orderId, cb) {
        if(orderId){
          this.send({
            type: "callNumber",
            orderId: orderId
          },cb);
        }else{
          this.app.$message({
            message: '叫号失败，请稍后重试！',
            type: 'warning'
          });
        }
      },
      posLogout: function () {
        this.send({
          type: "logout"
        });
      },

      syncKitchenStatus: function (kitchenId, status) {
        this.send({
          type: "updateKitchenStatus",
          status: status,
          kitchenId: kitchenId
        })
      },

      deletePayType (couponId) {
          this.send({
            type: 'removeIsUseCoupon',
            couponId: couponId,
          })
      },

      //获取余额
      getOverage: function (brandId, shopId, customerId, money, cb) {
        this.send({
          type:"getCustomerAmount",
          brandId: brandId ,
          shopId: shopId,
          customerId: customerId,
          money: money
        }, cb);
      },

    };
    Vue.prototype.$socket = socket;
  }
}
