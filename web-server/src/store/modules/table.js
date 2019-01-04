/**
 *  name: mhkz
 *  data: 2018-05-12
 *  desc: 桌位管理
 */

import {
  getAllTableAndOrderList,
  getOrderDetail,
  payOrderList,
  payingOrderList,
  noPayOrderList,
  waitOrderList,
  getAreaList,
  getAllTableAndOrderByAreaId,
  waitCallTPOrderList,
  hasCallTPOrderList,
  waitAndNoPayOrderList,
  getMembersState
} from '../../api/api'

import async from 'async'

const state = {
  areaList: [],
  tableAndOrderList: [],
  searchKey: '',
  pageInfo: {
    totalPage: 0,
    currentPage: 1,
    pageIndex: 1,
    pageSize: 20,
  }
}

const getters = {
  areaList: state => state.areaList,
  tableAndOrderList: state=> state.tableAndOrderList,
  pageInfo: state => state.pageInfo,
}

const actions = {
  getAreaList({commit}) {
    getAreaList(area => commit('setAreaList', area))
  },

  getAllTableAndOrderByAreaId({commit}, areaId) {
    getAllTableAndOrderByAreaId(areaId, 1, tableList => commit('setTableList', tableList))
  },
  getAllTableAndOrderList({ commit }, Obj) {
    getAllTableAndOrderList(Obj.pageIndex, Obj.searchKey, function (tableAndOrderList) {
      async.map(tableAndOrderList.list, function(item, callback) {
        if(item.order_id && item.customer_id && item.customer_id.length > 5) {
          getMembersState(item.customer_id, function (customerInfo) {
            if(customerInfo) {
              item.flag = customerInfo.CUSTOMER_STATUS
              callback()
            }else {
              callback()
            }
          })
        }else {
          callback()
        }
      }, function(err,results) {
          commit('setTableAndOrderList', tableAndOrderList)
      });
    })

    //getAllTableAndOrderList(Obj.pageIndex, Obj.searchKey, tableAndOrderList => commit('setTableAndOrderList', tableAndOrderList))
  },

  getWaitAndNoPayOrderList({ commit }, Obj) {
    waitAndNoPayOrderList(Obj.distributionModeId, Obj.pageIndex, Obj.searchKey, Obj.pageSize, function (waitAndNoPayOrderList) {
      async.map(waitAndNoPayOrderList.waitAndNoPayOrderList, function(item, callback) {
        if(item.order_id && item.customer_id && item.customer_id.length > 5) {
          getMembersState(item.customer_id, function (customerInfo) {
            if(customerInfo) {
              item.flag = customerInfo.CUSTOMER_STATUS
              callback()
            }else {
              callback()
            }
          })
        }else {
          callback()
        }
      }, function(err,results) {
        commit('setWaitAndNoPayOrderList', waitAndNoPayOrderList)
      });
    })
    // waitAndNoPayOrderList(Obj.distributionModeId, Obj.pageIndex, Obj.searchKey, Obj.pageSize, waitAndNoPayOrderList => commit('setWaitAndNoPayOrderList', waitAndNoPayOrderList))
  },

  getPayOrder({commit}, Obj) {
    payOrderList(Obj.distributionModeId, Obj.pageIndex, Obj.searchKey, Obj.tableNumber, function (payOrder) {
      async.map(payOrder.payOrderList, function(item, callback) {
        if(item.order_id && item.customer_id && item.customer_id.length > 5) {
          getMembersState(item.customer_id, function (customerInfo) {
            if(customerInfo) {
              item.flag = customerInfo.CUSTOMER_STATUS
              callback()
            }else {
              callback()
            }
          })
        }else {
          callback()
        }
      }, function(err,results) {
        commit('setPayOrderList', payOrder)
      });
    })
    //payOrderList(Obj.distributionModeId, Obj.pageIndex, Obj.searchKey, Obj.tableNumber,  payOrder => commit('setPayOrderList',payOrder))
  },

  getPayingOrderList({commit}, Obj) {

    payingOrderList(Obj.distributionModeId, Obj.pageIndex, Obj.searchKey, Obj.tableNumber, function (payOrder) {
      async.map(payOrder.payingOrderList, function(item, callback) {
        if(item.order_id && item.customer_id && item.customer_id.length > 5) {
          getMembersState(item.customer_id, function (customerInfo) {
            if(customerInfo) {
              item.flag = customerInfo.CUSTOMER_STATUS
              callback()
            }else {
              callback()
            }
          })
        }else {
          callback()
        }
      }, function(err,results) {
        commit('setPayingOrderList', payOrder)
      });
    })

    //payingOrderList(Obj.distributionModeId, Obj.pageIndex, Obj.searchKey, Obj.tableNumber, payOrder => commit('setPayingOrderList',payOrder))
  },

  getNoPayOrderList({commit}, Obj) {
    noPayOrderList(Obj.distributionModeId, Obj.pageIndex, Obj.searchKey, Obj.tableNumber, function (payOrder) {
      async.map(payOrder.noPayOrderList, function(item, callback) {
        if(item.order_id && item.customer_id && item.customer_id.length > 5) {
          getMembersState(item.customer_id, function (customerInfo) {
            if(customerInfo) {
              item.flag = customerInfo.CUSTOMER_STATUS
              callback()
            }else {
              callback()
            }
          })
        }else {
          callback()
        }
      }, function(err,results) {
        commit('setNoPayOrderList', payOrder)
      });
    })
    //noPayOrderList(Obj.distributionModeId, Obj.pageIndex, Obj.searchKey, Obj.tableNumber,  payOrder => commit('setNoPayOrderList',payOrder))
  },

  getWaitOrderList({commit}, Obj) {
    waitOrderList(Obj.distributionModeId, Obj.pageIndex, Obj.searchKey, Obj.tableNumber, function (payOrder) {
      async.map(payOrder.waitOrderList, function(item, callback) {
        if(item.order_id && item.customer_id && item.customer_id.length > 5) {
          getMembersState(item.customer_id, function (customerInfo) {
            if(customerInfo) {
              item.flag = customerInfo.CUSTOMER_STATUS
              callback()
            }else {
              callback()
            }
          })
        }else {
          callback()
        }
      }, function(err,results) {
        commit('setWaitOrderList', payOrder)
      });

    })
    //waitOrderList(Obj.distributionModeId, Obj.pageIndex, Obj.searchKey, Obj.tableNumber,  payOrder => commit('setWaitOrderList',payOrder))
  },

  // 电视叫号 模式
  getWaitCallTPOrderList({commit}, Obj) {
    waitCallTPOrderList(Obj.pageIndex, Obj.searchKey, function (waitCallTPOrderList) {
      async.map(waitCallTPOrderList.waitCallTPOrderList, function(item, callback) {
        if(item.id && item.customer_id && item.customer_id.length > 5) {
          getMembersState(item.customer_id, function (customerInfo) {
            console.log('customerInfo',customerInfo)
            if(customerInfo) {
              item.flag = customerInfo.CUSTOMER_STATUS
              callback()
            }else {
              callback()
            }
          })
        }else {
          callback()
        }
      }, function(err,results) {
        commit('setWaitCallTPOrderList', waitCallTPOrderList)
      });
    })
    //waitCallTPOrderList(Obj.pageIndex, Obj.searchKey, waitCallTPOrderList => commit('setWaitCallTPOrderList', waitCallTPOrderList))
  },

  getHasCallTPOrderList({commit}, Obj) {
    hasCallTPOrderList(Obj.pageIndex, Obj.searchKey, function (hasCallTPOrderList) {
      async.map(hasCallTPOrderList.hasCallTPOrderList, function(item, callback) {
        if(item.id && item.customer_id && item.customer_id.length > 5) {
          getMembersState(item.customer_id, function (customerInfo) {
            if(customerInfo) {
              item.flag = customerInfo.CUSTOMER_STATUS
              callback()
            }else {
              callback()
            }
          })
        }else {
          callback()
        }
      }, function(err,results) {
        commit('setHasCallTPOrderList', hasCallTPOrderList)
      });
    })
    //hasCallTPOrderList(Obj.pageIndex, Obj.searchKey, hasCallTPOrderList => commit('setHasCallTPOrderList', hasCallTPOrderList))
  },

}
const mutations = {
  setAreaList(state, areaList) {
    state.areaList = areaList
  },

  setTableList(state, tableList) {
    state.tableAndOrderList = tableList.list;
    state.pageInfo.currentPage = tableList.curPage;
    state.pageInfo.totalPage = tableList.totalPage;
  },

  setTableAndOrderList(state, tableAndOrderList) {
    state.tableAndOrderList = tableAndOrderList.list;
    state.pageInfo.currentPage = tableAndOrderList.curPage;
    state.pageInfo.totalPage = tableAndOrderList.totalPage;
    sessionStorage.setItem("pageIndex", tableAndOrderList.curPage)
  },

  // setOrderInfo(state, orderInfo) {
  //   state.orderInfo = orderInfo
  // },

  setPayOrderList(state, payOrder) {
    state.tableAndOrderList = payOrder.payOrderList
    state.pageInfo.currentPage = payOrder.curPage;
    state.pageInfo.totalPage = payOrder.totalPage;
  },

  setPayingOrderList(state, payOrder) {
    state.tableAndOrderList = payOrder.payingOrderList
    state.pageInfo.currentPage = payOrder.curPage;
    state.pageInfo.totalPage = payOrder.totalPage;
  },

  setNoPayOrderList(state, payOrder) {
    state.tableAndOrderList = payOrder.noPayOrderList
    state.pageInfo.currentPage = payOrder.curPage;
    state.pageInfo.totalPage = payOrder.totalPage;
  },

  setWaitOrderList(state, payOrder) {
    state.tableAndOrderList = payOrder.waitOrderList
    state.pageInfo.currentPage = payOrder.curPage;
    state.pageInfo.totalPage = payOrder.totalPage;
  },

  refreshOrderList (state, order) { // 封装刷新数组
    state.tableAndOrderList
  },
  setPageIndex (state, page) { // 设置当前页面
    // state.pageInfo.currentPage = page.currentPage,
    state.pageInfo.pageIndex = page.pageIndex
    // state.pageInfo.totalPage = page.totalPage
  },

  // 电视叫号模式
  setWaitCallTPOrderList (state, waitCallTPOrderList) {
    state.tableAndOrderList = [];
    state.tableAndOrderList = waitCallTPOrderList.waitCallTPOrderList;
    state.pageInfo.currentPage = waitCallTPOrderList.curPage;
    state.pageInfo.totalPage = waitCallTPOrderList.totalPage;
  },

  setHasCallTPOrderList(state, hasCallTPOrderList) {
    state.tableAndOrderList = [];
    state.tableAndOrderList = hasCallTPOrderList.hasCallTPOrderList;
    state.pageInfo.currentPage = hasCallTPOrderList.curPage;
    state.pageInfo.totalPage = hasCallTPOrderList.totalPage;
  },

  setWaitAndNoPayOrderList(state, waitAndNoPayOrderList) {
    state.tableAndOrderList = [];
    state.tableAndOrderList = waitAndNoPayOrderList.waitAndNoPayOrderList;
    state.pageInfo.currentPage = waitAndNoPayOrderList.curPage;
    state.pageInfo.totalPage = waitAndNoPayOrderList.totalPage;
    sessionStorage.setItem("pageIndex", waitAndNoPayOrderList.curPage)
  },
  setCallNumber(state, order) {
    state.tableAndOrderList.map((item,index) => {
      if(item.id == order.id && item.call_times == 0) {
        state.tableAndOrderList.splice(index,1)
      }
    })
  },
  setTvOrderList(state, order) {

    if (order.parentOrderId == '' || order.parentOrderId == null) {
      state.tableAndOrderList.push({
        id: order.id,
        order_id: order.id,
        table_number: order.tableNumber,
        amount_with_children: order.amountWithChildren,
        order_money: order.orderMoney,
        create_time: order.createTime,
        customer_count: order.customerCount,
        ver_code: order.verCode,
        order_state: order.orderState,
        production_status: order.productionStatus,
        pay_mode: order.payMode,
        call_times: order.callTimes,
        serial_number: order.serialNumber,
        distribution_mode_id: order.distributionModeId
      })
    }
  },

  refundOrder(state, order) {
    let matchOrder = {};
    state.tableAndOrderList.map((item, index) => {
      if (item.order_id == order.id) {
         window.appControl.$notify.success(`${item.table_number} 号桌 退菜成功`)
      }
    })
  },

}

export default {
  state,
  getters,
  actions,
  mutations
}

