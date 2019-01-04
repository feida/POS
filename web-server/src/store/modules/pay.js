import PAY_MODE from '../../utils/payMode'
import {getPaymentSelectByOrderId, payOrder, orderDiscount} from '../../api/api'
const state = {
  orderId: '',
  currentOrderId:'',
  cardMoney: '0', // 银行卡或者现金的钱 如果是微信下单并且是银联或者现金支付，这里有值
  orderInfo: {},
  payType: {},      // 初始化支付项
  shopDetail: {},
  orderPayType: [], // 已选择的订单支付方式列表
  paymentItems: [],
  currentPayType:{ // 当前选择支付的钱或支付项
    money: '00.00',
    icon: '',
    id: ''
  },

  orderPay: {},// 右侧展示支付项

  payInfo : { // 显示金额
    totalMoney : '0', // 总计金额
    amountMoney: '0', // 应付金额
    actuallyPay: '0', // 实付金额
    remainMoney: '0', // 剩余金额
    changeMoney: '0', // 找零金额
  },

  icon: { // icon 支付项展示图标
    1:'#icon-wechatpay',
    2: '#icon-chongzhi2',
    3: '#icon-youhuiquan',
    5:'#icon-yinlian',
    10:'#icon-zhifubao',
    12:'#icon-xianjin',
    16:"#icon-xinmeida1",
    17:'#icon-chongzhi2',
    26: '#icon-miandan',
    27: "#icon-tuangou",
    28: "#icon-daijinquan"
  },
  scanPay: { // 扫码支付
    dialogVisible: false,
    currentType:{},
    needPay: 0,
    scanValue: '', // 二维码
    paying: false,
    failed: false,
  },
  discountPackage: { // 折扣弹窗
    centerDialogVisible: false,
    discountType: ['按折扣率', '按金额优惠',' 免单'],
    selectDiscountActive: '0',
    discountTitle: '',
  },

  formatDiscount: { // 折扣
    totalMoney: '', // 订单总额
    discountMoney: '0', // 选择折扣方案后优惠的金额
    amountMoney: '', // 打折后需要支付的钱
    customerId: '',
    onDiscount: {// 按折扣率
      discountRate: '100', // 折扣率
      realDiscountRate:'100', // 真实折扣率（如果有减少的）
      removeMoney: '0', // 不参与折扣的钱
    },
    onReduceMoney: {// 按优惠金额
      reduceMoney: '0' // 按金额优惠
    },
    onErasing: { // 抹零
      erasing: '0' // 抹零
    },
  },
  schemaDialog:{ // 折扣方案弹窗
    onDiscountDialog: false,
    onErasingDialog: false,
  },
  autoFocus: true, // 自动聚焦

}

const getters = {
  payType:        state => state.payType,
  currentPayType: state => state.currentPayType,
  orderPayType:   state => state.orderPayType,
  payInfo:        state => state.payInfo,
  scanPay:        state => state.scanPay,
  cardMoney:      state => state.cardMoney,
  discountPackage:state => state.discountPackage,
  schemaDialog:   state=> state.schemaDialog,
  formatDiscount: state => state.formatDiscount,
  autoFocus:      state => state.autoFocus,
  icon:           state => state.icon,
  paymentItems: state => state.paymentItems,
}

const actions = {
  /**
   * @param commit
   * @param currentOrderId String 当前的订单id，如果有子订单，则是子订单id, 否则为父亲订单id
   */
  getPaymentSelectByOrderId({ commit }, currentOrderId) {
    getPaymentSelectByOrderId( currentOrderId, paymentList => {commit('setPaymentItem', paymentList)})
  },
}

const mutations = {
  formatMoney(money){ // 格式化金额
    return this.$utils.formatMoney(money || 0);
  },

  initOrderPayType(state) {
    state.orderPayType = [];
  },

  setOrderId(state, orderId) {
    state.orderId = orderId
  },

  setCustomerId(state, customerId) {
    state.formatDiscount.customerId = customerId;
  },

  setCurrentOrderId(state, currentOrderId) {
    state.currentOrderId = currentOrderId;
  },

  setShopDetail (state, shopDetail){ // 获取店铺参数
     state.shopDetail = shopDetail;
   },

  setPayTypeChange (state) {
    let total = 0;
    for (let type of state.orderPayType) {
      total += parseFloat(type.money)
    }
    state.payInfo.actuallyPay = total;
    state.payInfo.amountMoney = (Number(state.payInfo.totalMoney) - Number(total)).toFixed(2) < 0
                                  ? '0'
                                  : (Number(this.state.orderInfo.currentOrderInfo.payOrderMoney) - Number(total)).toFixed(2);
    state.payInfo.remainMoney = state.payInfo.amountMoney < 0 ? '0' :  state.payInfo.amountMoney;
    state.payInfo.changeMoney = (Number(state.payInfo.totalMoney )- Number(total)).toFixed(2) > 0
                                ? '0'
                                : Math.abs(Number(state.payInfo.totalMoney) - Number(total))
    state.currentPayType.money= state.payInfo.amountMoney < 0 ? '00.00' : state.payInfo.amountMoney || '00.00';
    state.currentPayType.money= Number(state.currentPayType.money).toFixed(2);
    state.currentPayType.id = '';
    state.currentPayType.icon='';
  },

  setPayInfo (state, orderInfo) { // 初始化支付信息
    state.payInfo.changeMoney = '0';
    state.payInfo.actuallyPay = '0';
    state.payInfo.totalMoney  =  Number(orderInfo.amount_with_children) || Number(orderInfo.origin_money) || Number(orderInfo.order_money);
    state.payInfo.amountMoney =  Number(orderInfo.payOrderMoney) || 0;
    state.payInfo.remainMoney =  (Number(state.payInfo.amountMoney) - Number(state.payInfo.actuallyPay)).toFixed(2)
    state.currentPayType.money=  Number(orderInfo.payOrderMoney);

    state.formatDiscount.amountMoney = Number(state.payInfo.amountMoney).toFixed(2);
    state.formatDiscount.totalMoney  = Number(orderInfo.payOrderMoney).toFixed(2);
  },

  setPaymentItem (state, paymentList) { // 初始化支付项，查询当前订单是否能够调用余额支付，或者是微信端余额或者现金支付
    if (paymentList.length <= 0) return;
    paymentList.map(paymentItem => {
      let {paymentModeId, payValue, toPayId} = paymentItem;
      state.payInfo.actuallyPay += payValue
      switch (paymentModeId) {
        case 5:
          state.orderPayType.push({type:5, icon: "#icon-yinlian", money:payValue, toPayId:  toPayId ||''});
          break;
        case 12: // 现金
          state.orderPayType.push({type:12, icon: "#icon-xianjin", money: payValue, toPayId:  toPayId ||''});
          break;
        case 2: // 余额
          state.orderPayType.push({type:2, icon: "#icon-yue", money: payValue, toPayId:  toPayId ||''});
          break;
        case 3: // 优惠券
          state.orderPayType.push({type:3, icon: "#icon-youhuiquan", money: payValue, toPayId:  toPayId ||''});
          break;
        case 6: // 充值金额支付
          state.orderPayType.push({type:2, icon: "#icon-chongzhi", money: money + payValue, toPayId:  toPayId ||''});
        case 7: // 充值赠送的金额支付
          state.orderPayType.push({type:2, icon: "#icon-chongzhi", money: money + payValue, toPayId:  toPayId ||''});
      }
    })
  },

  deletePayType (state, {index, item}) {
    state.orderPayType.splice(index, 1);
  },

  deletePaymentItems(state, toPayId) {
    state.paymentItems.map((item,index) => {
      if (item.toPayId && item.toPayId == toPayId) {
        state.paymentItems.splice(index, 1)
      }
    })
  },

  setShopValidPayMode (state){ // 初始化支付方式列表
    if (state.shopDetail.open_pos_money_pay)   state.payType[12] = "现金"
    if (state.shopDetail.open_pos_union_pay)   state.payType[5]  = "银行卡"
    if (state.shopDetail.open_pos_wechat_pay)  state.payType[1]  = "微信"
    if (state.shopDetail.open_pos_ali_pay)     state.payType[10] = "支付宝"
    if (state.shopDetail.open_pos_shanhui_pay) state.payType[16] = "新美大"
    if (state.shopDetail.open_pos_integral_pay)state.payType[17] = "积分"
    if (state.shopDetail.open_pos_group_buy)   state.payType[27] = "团购"
    if (state.shopDetail.open_pos_cash_coupon_buy) state.payType[28] = "代金券"
    if (state.shopDetail.shop_mode == 7 && state.shopDetail.open_rpay) state.payType[2] = "R+支付"
  },

  setOrderPayType (state) {
   state.orderPayType = []
   state.currentPayType.id = '';
  },

  setSelectPayType (state, index) { // 选择支付方式
    if (state.orderPayType.length > 0 && state.payInfo.remainMoney <= 0)  return  window.appControl.$notify.warning("请删除支付项后进行操作！");
    state.currentPayType.id = index;
    this.commit('initScanPay')
  },

  calcAdd(state, key)  {
    state.currentPayType.money += key + ''
  },

  calcDel (state, key) {
    let count = state.currentPayType.money + '';
    state.currentPayType.money = count.substring(0, count.length - 1)
  },
  calcEmpty(state, key){
    state.currentPayType.money = '';
  },

  calcConfirm(state, key) { // 确认支付方式
    if (!state.currentPayType.id)  return  window.appControl.$notify.warning("请在右侧选择支付项进行确认！");

    if (Number(state.currentPayType.money).toFixed(2) > Number(state.currentPayType.money).toFixed(2)) {
      return  window.appControl.$notify.warning(`当前支付项 只需要支付 ${Number(state.payInfo.remainMoney).toFixed(2)}元`);
    }
    for (var item of state.orderPayType) {
      if (item.type == state.currentPayType.id) {
        return  item.money = (Number(item.money) + Number(state.currentPayType.money)).toFixed(2)
      }
    }

    state.orderPayType.push({
      type: state.currentPayType.id,
      name: state.payType[state.currentPayType.id],
      money: Number(state.currentPayType.money).toFixed(2) || 0,
      icon: state.icon[state.currentPayType.id]
    })
  },

  initScanPay(state) { // 初始化扫码支付
    this.commit('openScanDialog')
  },

  openScanDialog(state) {
    let currentPay = state.currentPayType.id == PAY_MODE.WEIXIN_PAY || state.currentPayType.id == PAY_MODE.ALI_PAY || state.currentPayType.id == 2;
    if (currentPay) state.scanPay.dialogVisible = true; // 打开弹窗
    state.scanPay.currentType = state.currentPayType;
  },


  setFormatDiscount (state){ // 在页面渲染的同时，是需要将 formatDiscount 初始化的，取消折扣也需要初始化
    state.formatDiscount.totalMoney = '';
    state.formatDiscount.discountMoney = '0';
    state.formatDiscount.amountMoney = '0';
    state.formatDiscount.customerId = '';
    state.formatDiscount.onDiscount.discountRate = '100';
    state.formatDiscount.onDiscount.realDiscountRate = '100';
    state.formatDiscount.onDiscount.removeMoney = '0';
    state.formatDiscount.onReduceMoney.reduceMoney = '0';
    state.formatDiscount.onErasing.erasing = '0'
    state.schemaDialog.onErasingDialog = false
  },


  /**
   * @desc  折扣弹窗
   * @param state
   */
  initDiscount(state) {
    if (state.orderPayType.length > 0) return window.appControl.$notify.warning(`请移除支付项后进行操作`);
    if (this.state.orderInfo.currentOrderInfo.order_pos_discount_money > 0) return window.appControl.$notify.warning(`同笔订单不可重复折扣`);
    if (this.state.orderInfo.currentOrderInfo.erase_money > 0) return window.appControl.$notify.warning(`抹零后的订单不可进行折扣`);
    state.discountPackage.centerDialogVisible = true;
  },

  /**
   * 抹零
   * @param state
   * @returns {*}
   */
  initonErasing(state) {
    let index = 2, item = '抹零'
    this.commit('selectDiscountScheme', {index, item})
    if (state.orderPayType.length > 0) return window.appControl.$notify.warning(`请移除支付项后进行操作`)
    if (this.state.orderInfo.currentOrderInfo.erase_money > 0) return window.appControl.$notify.warning(`不可重复抹零`)
    state.schemaDialog.onErasingDialog = true;
    state.formatDiscount.onErasing.erasing = '0';
    this.commit('initFormatDiscount');
  },
  /**
   * @desc  选择折扣方案
   * @param state
   */
  selectDiscountScheme(state, {index, item}){
    state.discountPackage.selectDiscountActive = index;
    state.discountPackage.discountTitle = item;
  },

  /**
   * @desc 确认折扣方案并且打开弹窗
   * @param state
   */
  confirmDiscountSchema(state) {
    state.discountPackage.centerDialogVisible = false
    if (state.discountPackage.selectDiscountActive == 0 || state.discountPackage.selectDiscountActive) {
      state.schemaDialog.onDiscountDialog = true;
    }
    this.commit('initFormatDiscount')
  },

  /**
   * 上一步，关闭折扣方案弹窗， 打开 折扣方案选择弹窗
   * @param state
   */
  lastStep (state) {
    state.schemaDialog.onDiscountDialog = false;
    state.schemaDialog.onErasingDialog = false;
    this.commit('setFormatDiscount');
    state.discountPackage.centerDialogVisible = true
  },

  initFormatDiscount () {
    state.formatDiscount.totalMoney = state.payInfo.totalMoney;
    state.formatDiscount.amountMoney= state.payInfo.amountMoney;
    // state.formatDiscount.customerId = state.orderInfo.customer_id
  },



  dialogAdd (state, number) {
    if (state.discountPackage.selectDiscountActive == 0) {
      state.formatDiscount.onDiscount.discountRate = Number(state.formatDiscount.onDiscount.discountRate + number).toFixed(2);
    }
  },
  /**
   * @desc  保存折扣方案
   * @param state
   */
  saveDiscountScheama(state) {
    if(state.discountPackage.selectDiscountActive == 0){
      if(state.formatDiscount.onDiscount.discountRate <= 0 || state.formatDiscount.onDiscount.discountRate > 100){
        return window.appControl.$notify.warning(`请输入有效的折扣率`);
      }
    }else if(state.discountPackage.selectDiscountActive == 1){
      if(state.formatDiscount.onReduceMoney.reduceMoney <= 0){
        return window.appControl.$notify.warning("请输入有效的优惠金额！");
      }
    }else if(state.discountPackage.selectDiscountActive == 2) {
      if(state.formatDiscount.onErasing.erasing <= 0){
        return  window.appControl.$notify.warning("请输入有效的抹零金额！");
      }
    }
    state.currentPayType.money = (+state.formatDiscount.amountMoney).toFixed(2);
    if (state.formatDiscount.onErasing.erasing > 0 || state.formatDiscount.onReduceMoney.reduceMoney > 0) {
      delete state.formatDiscount.onDiscount.discountRate;
    }
    state.schemaDialog.onDiscountDialog = false;
    state.schemaDialog.onErasingDialog  = false;
    this.commit('saveOrderInfo');
  },

  saveOrderInfo: function () {
    let servicePrice = state.orderInfo.service_price;
    state.formatDiscount.customerId = this.state.orderInfo.orderInfo.customer_id;
    orderDiscount(state.currentOrderId, state.formatDiscount, servicePrice, result => {
      this.commit('setFormatDiscount')
      this.dispatch('getCurrentOrderDetail', state.currentOrderId);
      this.dispatch('getDiscountInfo', state.currentOrderId);
    })
    // payOrder(state.currentOrderId, '', '', state.formatDiscount, false, servicePrice,  (result) => {
    //     this.commit('setFormatDiscount')
    //     this.dispatch('getCurrentOrderDetail', state.currentOrderId);
    //     this.dispatch('getDiscountInfo', state.currentOrderId);
    //
    //   })
  },

  /**
   * @desc  取消折扣方案
   * @param state
   */
  cancleDiscount(state) {
    state.schemaDialog.onDiscountDialog = false;
    state.schemaDialog.onErasingDialog  = false;
  },

  /**
   * @desc  免单
   * @param state
   * @param index
   * @param item
   */
  confirmFreeOrder(state) {
    state.discountPackage.centerDialogVisible = false;
    state.currentPayType.id = PAY_MODE.EXEMPTION_PAY
    this.commit('calcConfirm');
  }

}

export default {
  state,
  getters,
  actions,
  mutations
}
