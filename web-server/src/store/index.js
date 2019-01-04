import Vue from 'vue'
import Vuex from 'vuex'
import user from './modules/user'
import article from './modules/article'
import detailCar from './modules/detailCar'
import table from './modules/table'
import pay from './modules/pay'
import orderInfo from './modules/orderInfo'
import stock from './modules/stock'


Vue.use(Vuex)

export default new Vuex.Store({
  modules: {
    user,
    article,
    detailCar,
    table,
    pay,
    orderInfo,
    stock
  },
})
