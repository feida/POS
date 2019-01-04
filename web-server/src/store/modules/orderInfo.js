/**
 *  name: mhkz
 *  data: 2018-05-14
 *  desc: 购物车详情
 */

import {getOrderDetail, getDiscountInfo} from '../../api/api'
const state = {
  orderInfo: {},
  currentOrderInfo: {},
  discountInfo: {}
}

const getters = {
  orderInfo: state => state.orderInfo,
  currentOrderInfo: state => state.currentOrderInfo,
  allOrderInfo: state => state.allOrderInfo,
  discountInfo: state => state.discountInfo
}

const actions = {
  getOrderDetail ({commit}, orderId) {
    getOrderDetail(orderId, orderInfo => commit('setOrderInfo', orderInfo))
  },
  getCurrentOrderDetail ({commit}, currentOrderId) {
    getOrderDetail(currentOrderId, currentOrderInfo => commit('setCurrentOrderInfo', currentOrderInfo))
  },
  getDiscountInfo ({commit}, currentOrderId) {
    getDiscountInfo(currentOrderId, discountInfo => commit('setDiscountInfo', discountInfo))
  }
}


const mutations = {
  setOrderInfo (state, orderInfo) {
    state.orderInfo = orderInfo;
  },
  setCurrentOrderInfo (state, currentOrderInfo) {
    state.currentOrderInfo = currentOrderInfo
  },
  setDiscountInfo(state, discountInfo) {
    state.discountInfo = discountInfo
  }
}

export default {
  state,
  getters,
  actions,
  mutations
}
