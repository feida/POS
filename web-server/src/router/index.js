import Vue from 'vue';
import { MessageBox } from 'element-ui';
import { Message } from 'element-ui';
import { cancelOrder, getOrderDetail } from 'api/api';
import Router from 'vue-router';
import activation from 'page/activation/activation';
import login from 'page/login/login';
import main from 'page/main/main';
import table from 'page/table/table';
import tableConsole from 'page/table/component/console';
import tableDetail from 'page/table/component/detail';

import detail from '../components/car/detail'

import eatIn from 'page/table/children/eatin';
import packaging from 'page/table/children/packaging';
import takeout from 'page/table/children/takeout';
import order from 'page/order/order';
import tvorder from '../page/order/tvmode/tvorder';
import pay from 'page/pay/pay';
import report from 'page/report/report';
import business from 'page/report/children/business';
import sales from 'page/report/children/sales';
import recharge from 'page/report/children/recharge';
import satisfaction from 'page/report/children/satisfaction';
import stock from 'page/stock/stock';
import material from 'page/material/material';
import system from 'page/system/system';
import bus from '../utils/bus';

import inventory from 'page/material/children/inventory';
import inventoryview from 'page/material/children/inventoryview';

import purchase from 'page/material/children/purchase';
import purchaseview from 'page/material/children/purchaseview';

import rawmaterial from 'page/material/children/rawmaterial';

import storage from 'page/material/children/storage';
import storageview from 'page/material/children/storageview';

import {systemLog} from '../api/api'


Vue.use(Router);

var router = new Router({
  routes: [
    {
      path: '/login',
      component: login,
    },
    {
      path: '/activation',
      component: activation
    },
    {
      path: '/',
      component: main,
      // redirect: '/table/eatin',
      children: [
        {
          path: '/table',
          component: table,
          children: [
            {
              path: 'eatin',
              component: eatIn,
              children: [
                // {
                //   path: 'detail/:orderId',
                //   component: tableDetail
                // },
                {
                  path: 'detail/:orderId',
                  component: detail
                },
                {
                  path: 'console/:tableNumber',
                  component: tableConsole
                },
              ]
            },
            {
              path: 'packaging',
              component: packaging,
              children: [
                {
                  path: 'detail/:orderId',
                  component: detail
                },
                {
                  path: 'console/:tableNumber',
                  component: tableConsole
                },
              ]
            },
            {
              path: 'takeout',
              component: takeout,
              children: [
                {
                  path: 'detail/:orderId',
                  component: tableDetail
                },
                {
                  path: 'console/:tableNumber',
                  component: tableConsole
                },
              ]
            }
          ]
        },
        {
          path: '/order/:orderId',
          component: order
        },
        {
          "path": '/tvorder',
          component: tvorder
        },
        {
          path: '/pay/:orderId',
          component: pay
        },
        {
          path: '/stock',
          component: stock
        },
        {
          path: '/material',
          component: material,
          redirect:'/material/rawmaterial',
          children:[
            {
              path:'inventoryview',
              component:inventoryview
            },
            {
              path:'inventory',
              component:inventory
            },
            {
              path:'purchase',
              component:purchase,
            },
            {
              path:'purchaseview',
              component:purchaseview,
            },
            {
              path:'rawmaterial',
              component:rawmaterial
            },
            {
              path:'storage',
              component:storage
            },
            {
              path:'storageview',
              component:storageview,
            }
          ]
        },
        {
          path: '/report',
          component: report,
          redirect: '/report/business',
          children: [
            {
              path: 'business',
              component: business
            },
            {
              path: 'sales',
              component: sales
            },
            {
              path: 'recharge',
              component: recharge
            },
            {
              path: 'satisfaction',
              component: satisfaction
            }
          ]
        },
        {
          path: '/system',
          component: system
        }
      ]
    }
  ]
});


router.beforeEach((to, from, next) => {
  /***
   * desc 添加用户日志
   */
  pageLog(from, to)

  if(to.path == "/login" || to.path == "/activation" ){
    next();
  }
  // 判断当前是否登录
  if(sessionStorage.getItem("brandId") && sessionStorage.getItem("shopId")){
    // console.log("用户已经登录");
    // TODO : 在此验证用户权限
    if (to.query.addArticle) { // 表示继续点餐
      next()
    } else if (to.query.payConfirm) {
      sessionStorage.removeItem("earsMoney") // 取消订单， 清除抹零
      next();
    } else if(to.query.payConfirm){  // 表示确认离开支付页面
      next();
    } else if(from.path.includes("/pay/")){
      MessageBox.confirm('支付尚未完成，是否取消支付?', '提示', {
          confirmButtonText: '是',
          cancelButtonText: '否',
          type: 'warning'
        }).then(() => {
          let suborderId = from.query.suborderId;
          let orderId = from.params.orderId;
          let shopDet = JSON.parse(sessionStorage.getItem("shopDet"));
          if(shopDet.shop_mode == 6 && shopDet.allow_first_pay == 0){ //  电视叫号 || 大BOSS模式的先付
            // TODO： 同步至服务器
            getOrderDetail(suborderId || orderId, function (orderInfo) {
              //  先付模式下，订单未支付，并且 不是现金或银联支付，会自动取消
              if(orderInfo.order_state == 1 && orderInfo.pay_mode != 3 && orderInfo.pay_mode != 4){
                cancelOrder(suborderId || orderId, function () {
                  Message({
                    showClose: true,
                    type: 'success',
                    message: '订单已取消!'
                  });
                  sessionStorage.removeItem("earsMoney") // 取消订单， 清除抹零
                  bus.$emit("router-cancel-order", suborderId || orderId);
                  next(to.path + "?payConfirm=true&typeOrder=all");
                });
              }else{
                next(to.path + "?payConfirm=true&typeOrder=al");
              }
            });
          } else {
            next(to.path + "?payConfirm=true&typeOrder=al");
          }
        }).catch(() => {
          next(false);
        });
      // MessageBox.confirm('支付尚未完成，是否取消支付?', '提示', {
      //   confirmButtonText: '是',
      //   cancelButtonText: '否',
      //   type: 'warning'
      // }).then(() => {
      //   let suborderId = from.query.suborderId;
      //   let orderId = from.params.orderId;
      //   let shopDet = JSON.parse(sessionStorage.getItem("shopDet"));
      //   if(shopDet.shop_mode == 2 || (shopDet.shop_mode == 6 && shopDet.allow_first_pay == 0)){ //  电视叫号 || 大BOSS模式的先付
      //     // TODO： 同步至服务器
      //     getOrderDetail(suborderId || orderId, function (orderInfo) {
      //       //  先付模式下，订单未支付，并且 不是现金或银联支付，会自动取消
      //       if(orderInfo.order_state == 1 && orderInfo.pay_mode != 3 && orderInfo.pay_mode != 4){
      //         cancelOrder(suborderId || orderId, function () {
      //           Message({
      //             showClose: true,
      //             type: 'success',
      //             message: '订单已取消!'
      //           });
      //           sessionStorage.removeItem("earsMoney") // 取消订单， 清除抹零
      //           bus.$emit("router-cancel-order", suborderId || orderId);
      //           next(to.path + "?payConfirm=true");
      //         });
      //       }else{
      //         next(to.path + "?payConfirm=true");
      //       }
      //     });
      //   }else if(shopDet.shop_mode == 6 && shopDet.allow_after_pay == 0){   //  大BOSS模式的后付
      //     //  如果主订单已支付，则取消子订单或者主订单
      //     getOrderDetail(orderId, function (orderInfo) {
      //       if(orderInfo.order_state == 2 || orderInfo.order_state == 10){
      //         cancelOrder(suborderId || orderId, function () {
      //           Message({
      //             showClose: true,
      //             type: 'success',
      //             message: '订单已取消!'
      //           });
      //           bus.$emit("router-cancel-order", suborderId || orderId);
      //           next(to.path + "?payConfirm=true");
      //         });
      //       }else{
      //         next(to.path + "?payConfirm=true");
      //       }
      //     });
      //   }
      // }).catch(() => {
      //   next(false);
      // });
    }
    else{if (!to.path.includes('pay')) {
        sessionStorage.removeItem("earsMoney")
      }
      next();
    }
  }else {
    // console.log("用户尚未登录 ... ");
    next('/login');
  }
});

function pageLog(from, to) {
   if (to.path.includes('/login')) {
     systemLog("页面日志记录", "用户进入登陆页面， 准备登陆")
   }
}

export default router;
