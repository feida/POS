/**
 *  name: mhkz
 *  data: 2018-05-14
 *  desc: 购物车详情
 */

import { getOrderItemlistByOrderId } from '../../api/api'
const state = {
  isChild: false,
  car: [],
  orderItem: {},
  shopDetail: {},
  orderInfo: {}
}

const getters = {
  car: state => state.car
}

const actions = {
  getOrderItemlistByOrderId ({commit}, orderId) {
    getOrderItemlistByOrderId(orderId, orderItemList => commit('setOrderItem', orderItemList))
  }
}

const mutations = {
  setOrderInfo(state, orderInfo) {
    state.orderInfo = orderInfo
  },
  setShopDetail(state, shopDetail) {
    state.shopDetail = shopDetail
  },
  setOrderItem (state, orderItemList) {
    state.orderItem = orderItemList;
    this.commit('init_main');
  },
  init_main() {
    state.car = [];
    let orderItemList = state.orderItem.order_item_list || [];
    let childOrderItemList = state.orderItem.childreorder_item_list  || [];

    if(orderItemList.length > 0) {
      let notes = '';
      this.commit('init_car',{ orderItemList, notes})
    }

    if(childOrderItemList.length > 0) {
      let notes = '加菜'
      let orderItemList = childOrderItemList;
      this.commit('init_car',{orderItemList, notes})
    }
    if(state.orderItem.service_price > 0) this.commit('initServicePrice');
    if (state.orderItem.meal_fee_price > 0) this.commit("initMealFeePrice");
  },

  init_car ( state, result) {
    let orderItemMap = {};
    for (let orderItem of result.orderItemList) {
      let item = {};
      // 套餐主项
      if (orderItem.type === 3) {
        let packageItem = orderItemMap[orderItem.id];
        if (packageItem && packageItem.id) {
          orderItem.mealItems = packageItem.mealItems;
        }
      }
      // 套餐子项
      if (orderItem.type === 4) {
        let packageItem = orderItemMap[orderItem.parent_id] || {};
        packageItem.mealItems = (packageItem.mealItems || []);
        packageItem.mealItems.push({
          id: orderItem.article_id,
          count: orderItem.count,
          name: orderItem.article_name,
          price: orderItem.original_price
        });
        if (!packageItem.id) {
          packageItem.id = orderItem.parent_id;
          orderItemMap[packageItem.id] = packageItem;
        }
        continue;
      }

      item = {
        time: this.commit("generateUUID"),
        id: orderItem.article_id,
        ownId: orderItem.id, // 新增，订单id
        orderId: orderItem.order_id, // 主订单id
        unitPrice: orderItem.unit_price, // 新增 unitPrice
        payModeId: orderItem.payment_mode_id, // 支付类型
        originCount: orderItem.orgin_count, // 原始的菜品数量
        mealFeeNumber: orderItem.meal_fee_number, // 每一项所有的餐盒数量
        mealFeeNumberOne: orderItem.meal_fee_number / orderItem.count, // 每一项的每一道菜所需要的餐盒个数
        refundChange: 0, // 这个字段用来计算每一个菜品项需要退多少餐盒
        count: orderItem.count,   // 剩余的菜品数量
        tempCount: orderItem.count,
        tempRefundCount: orderItem.refund_count,
        type: orderItem.type,
        name: orderItem.article_name,
        price: orderItem.final_price,
        tempPrice: orderItem.final_price,
        isOpen: false,
        status: orderItem.status,
        notes: result.notes,
        extraPrice: 0, // 新增 额外费用
        grantCount: orderItem.grant_count,
        tempGrantCount: orderItem.grant_count,
      };
      if (item.type === 3) {
        item.mealItems = orderItem.mealItems;
      }
      orderItemMap[orderItem.id] = item;
    }
    this.car = [];
    for (let key in orderItemMap) {
      // 套餐总价（加上子项差价）
      if(orderItemMap[key].type === 3){
        for(let items of orderItemMap[key].mealItems){
          if(items.count>0){
            orderItemMap[key].price += items.price;
          }
        }
      }
      state.car.push(orderItemMap[key]);
    }
    state.isChild = false;
  },

  initServicePrice () {
    let orderItemList = state.orderItem

    if(state.orderInfo.service_price &&  state.shopDetail.service_type == 0){
      state.car.push({
        time: this.commit("generateUUID"),
        serverPrice: true,
        count: state.orderInfo.customer_count,
        name: "服务费",
        tempCount: state.orderInfo.customer_count,
        status: 1,
        type: 0,
        unitPrice: state.orderInfo.service_price / state.orderInfo.customer_count,
        tempPrice: state.orderInfo.service_price,
        price: state.orderInfo.service_price,
      });
    }
    if (state.orderItem.service_price &&  state.shopDetail.service_type == 1 ) {
      var upgradeService = [
        {
          name:  state.shopDetail.sauce_fee_name,
          count: state.orderItem.sauce_fee_count,
          price: state.orderItem.sauce_fee_price,
          type: 10
        },
        {
          name:  state.shopDetail.towel_fee_name,
          count: state.orderItem.towel_fee_count,
          price: state.orderItem.towel_fee_price,
          type: 11
        },
        {
          name:  state.shopDetail.tableware_fee_name,
          count: state.orderItem.tableware_fee_count,
          price: state.orderItem.tableware_fee_price,
          type: 12
        }
      ]
      for (let i = 0 ; i < upgradeService.length; i++) {
        if (upgradeService[i].price > 0) {
          state.car.push({
            time: this.commit("generateUUID"),
            serverPrice: true,
            count: upgradeService[i].count,
            name: upgradeService[i].name,
            tempCount: upgradeService[i].count,
            status: 1,
            type: upgradeService[i].type,
            unitPrice: upgradeService[i].price / upgradeService[i].count,
            tempPrice: upgradeService[i].price,
            price: upgradeService[i].price,
          });
        }
      }
    }
  },

  initMealFeePrice () {
    state.car.push({
      time: this.commit("generateUUID"),
      serverPrice: true,
      count: state.orderItem.meal_all_number,
      name: "餐盒费",
      price:  state.orderItem.meal_fee_price,
    });
  },
  generateUUID() {
    var d = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = (d + Math.random()*16)%16 | 0;
      d = Math.floor(d/16);
      return (c=='x' ? r : (r&0x3|0x8)).toString(16);
    });
    return uuid;
  },
}

export default {
  state,
  getters,
  actions,
  mutations
}
