/**
 * Server API
 * Created by Lmx on 2017/7/3.
 */
import {
  request
} from '../utils/pomelo';

import * as url from './urlConfig'
import axios from 'axios';
import jsonpAdapter from 'axios-jsonp';
import jquery from 'jquery'
import { readCardServer } from '../config/serverConfig'

//请求头添加brandId

if (sessionStorage.getItem("shopDet")) {
  let shopDetailshopid = jquery.parseJSON(sessionStorage.getItem("shopDet"));
  axios.defaults.headers.common['brandId'] = shopDetailshopid.brand_id;
}

/**
 * 登录
 */
// export const login = (name, password, cb, errcb) => request('pos.userHandler.login', {
//   name: name,
//   password: password
// }, cb, errcb);
/**
 * 登录
 * @param name
 * @param password
 * @param kick  是否强制登录
 * @param cb
 * @param errcb
 */
export const login = (name, password, kick, cb, errcb) => request('connector.entryHandler.login', {
  name: name,
  password: password,
  kick: kick
}, cb, errcb);

/**
 * 加入统一房间
 */
export const joinChannel = (id, cb) => request('pos.userHandler.joinChannel', {
  id: id
}, cb);


/**
 * 获取用户集合
 * cb
 * */
export const getUserList = (cb, error) => request('pos.userHandler.list', {}, cb, error);

/**
 * 区域列表
 */
// export const areaList = (cb) => request('pos.areaHandler.list', {}, cb);

/**
 * 区域信息列表，包含区域下的桌位信息
 * @param areaId  区域ID
 * @param payState  支付状态
 * @param cb
 */
export const orderStateCount = (distributionMode, cb) => request('pos.orderHandler.orderStateCount', {
  distributionMode: distributionMode
}, cb);

/**
 * 绑定桌位
 * @param order
 * @param cb
 */
export const bindTable = (order,uid, cb) => request('pos.orderHandler.bindTable', {
  afterPay: order.afterPay,
  distributionModeId: order.distributionModeId,
  tableNumber: order.tableNumber,
  customerCount: order.customerCount,
  remark: order.remark,
  childrenOrder: order.childrenOrder,
  servicePrice: order.servicePrice,
  uid: uid,
}, cb);

/**
 * 取消订单
 * @param order
 * @param cb
 */
export const cancelOrder = (orderId, cb) => request('pos.orderHandler.cancelOrder', {
  orderId: orderId
}, cb);


/**
 * 菜品详情列表
 * @param order
 * @param cb
 */
export const listArticleInfo = (cb) => request('pos.articleFamilyHandler.listArticleInfo', {}, cb);

/***
 * 根据 articleId 查询重量包列表
 * @orderId String
 * @cb      function
 */
export const getWeightPackageLIst = (articleId, cb)=>request('pos.weightPackageHandler.selectWeightPackageByArticleId', {
  articleId: articleId
}, cb)

/**
 * 更新 重量包重量
 * */
export const confirmWeightPackage = (orderItemId,weight,articleName, cb) =>request('pos.orderItemHandler.updateOrderItemWeight', {
  orderItemId: orderItemId,
  articleName: articleName,
  weight: weight,
}, cb)


/**
 *  根据 orderId 查询订单详情
 * @param orderId
 * @param cb
 */
export const getOrderDetail = (orderId, cb) => request('pos.orderHandler.selectById', {
  orderId: orderId
}, cb);


/**
 *  根据 articleId 查询新规格列表
 * @param articleId 菜品id
 * @param cb
 */
export const getUnitList = (articleId, cb) => request('pos.unitHandler.selectUnitListByArticleId', {
  articleId: articleId
}, cb);

/**
 * 下单
 * @param orderId   订单ID
 * @param orderItems  订单项
 * @param cb
 */
export const pushOrder = (pushOrderInfo, cb) => request('pos.orderHandler.newPushOrder', {

// export const pushOrder = (pushOrderInfo, cb) => request('pos.orderHandler.pushOrder', {
  masterOrderId: pushOrderInfo.masterOrderId,
  childrenOrderId: pushOrderInfo.childrenOrderId,
  orderItems: pushOrderInfo.orderItems,
  mealFeePrice: pushOrderInfo.mealFeePrice,
  mealAllNumber: pushOrderInfo.mealAllNumber,
  distributionModeId: pushOrderInfo.distributionModeId,
  customerId: pushOrderInfo.customerId
}, cb);

export const checkArticleSupporTime = (orderItems, cb, errcb) => request('pos.orderHandler.checkArticleSupporTime', {
  orderItems: orderItems,
}, cb, errcb);

/**
 * 更新订单同步状态
 * @param orderId   订单ID
 * @param cb
 */
export const updateOrderSyncState = (orderId, cb) => request('pos.orderHandler.updateOrderSyncState', {
  orderId: orderId,
}, cb);

/**
 * 支付
 * @param orderId 订单ID
 * @param paymentItems 支付项
 * @param payMode 支付方式
 * @param cb
 */
export const payOrder = (orderId, paymentItems, payMode, formatDiscount, isScanPay, servicePrice, cb) => request('pos.orderHandler.payOrder', {
  orderId: orderId,
  paymentItems: paymentItems,
  payMode: payMode,
  formatDiscount: formatDiscount,// 折扣相关
  isScanPay: isScanPay,
  servicePrice: servicePrice,
  // tableNumber: formatDiscount.orderInfoList[0].tableNumber,
}, cb);

/**
 * @desc 折扣
 * @param orderId
 * @param formatDiscount
 * @param servicePrice
 */
export const orderDiscount = (orderId, formatDiscount, servicePrice, cb) => request('pos.orderHandler.orderDiscount', {
  orderId: orderId,
  formatDiscount: formatDiscount,// 折扣相关
  servicePrice: servicePrice,
  // tableNumber: formatDiscount.orderInfoList[0].tableNumber,
}, cb);



/**
 * @param 换桌
 * @param orderId 订单ID
 * @param fromTableNumber 原来卓号
 * @param toTableNumber 现在桌号
 * */
export const changeTable = (tableInfo, cb) => request('pos.tableQrcodeHandler.changeTableNum', {
  orderId: tableInfo.orderId,
  fromTableNumber: tableInfo.fromTableNumber,
  toTableNumber: tableInfo.toTableNumber,
  uid: tableInfo.uid
}, cb);


/**
 * 库存所有菜品详情
 * */
export const listArticleStockInfo = (cb) => request('pos.articleFamilyHandler.listArticleStockInfo', {}, cb);


/**
 * 库存上下架
 * @param cb
 * */
export const getArticleUpOrDown = (articleShelf, cb) => request('pos.articleHandler.articleUpOrDown', {
  id: articleShelf.currentArticleId,
  activated: articleShelf.activated
}, cb);
/**
 * 库存 沽清
 * */
export const getArticleIsEmpty = (outOfStock, cb) => request('pos.articleHandler.articleIsEmpty', {
  id: outOfStock.id,
  empty: outOfStock.empty,
  hasArticlePrice: outOfStock.hasArticlePrice
}, cb);

/**
 * 库存 沽清 老库存
 * */
export const getArticlePriceIsEmpty = (articlePriceIsEmpty, cb) => request('pos.articlePriceHandler.articlePriceIsEmpty', {
  id: articlePriceIsEmpty.id,
  articleId: articlePriceIsEmpty.articleId,
  originalStock: articlePriceIsEmpty.originalStock
}, cb);

/**
 * 编辑库存单品和新规格
 * */
export const getArticleStock = (articleStock, cb) => request('pos.articleHandler.articleStock', {
  id: articleStock.id,
  currentStock: articleStock.count
}, cb);

/**
 * 单品老规格库存编辑
 * */
export const getArticlePriceStock = (articlePriceStock, cb) => request('pos.articlePriceHandler.articlePriceStock', {
  id: articlePriceStock.id,
  articleId: articlePriceStock.articleId,
  sumCount: articlePriceStock.sumCount,
  currentStock: articlePriceStock.newStock
}, cb);

/**
 *  拉取远程库存并更新
 * */
export const getBatchUpdateCurrentStock = (articleList, cb, errorcb) => request('pos.articleHandler.batchUpdateCurrentStock', {
  dataList: articleList
}, cb, errorcb);

/**
 * 插入远程主订单
 * */
export const getInsertByOrderId = (orderItem, cb) => request('pos.orderHandler.insertByOrderId', {
  model: orderItem
}, cb);

/**
 * 插入远程子订单
 * @
 * */
export const getBatchInsertOrderItem = (item, cb) => request('pos.orderItemHandler.batchInsertOrderItem', {
  dataList: item
}, cb);

/**
 *  插入远程支付信息
 *  @param payment
 * */
export const getBatchInsertPayment = (payment, cb) => request('pos.orderPaymentItemHandler.batchInsertPayment', {
  dataList: payment
}, cb);

/**
 *  修改定单状态
 * */



/**
 *  查询订单支付项
 *  @param orderId 根据订单查询订单支付项
 * */

export const getPaymentSelectByOrderId = (orderId, cb) => request('pos.orderPaymentItemHandler.selectByOrderId', {
  orderId: orderId
}, cb);

export const getPaymentItemListByOrderId = (orderId, cb) => request('pos.orderPaymentItemHandler.getPaymentItemListByOrderId', {
  orderId: orderId
}, cb);

/**
 * 确认支付（微信端发起的  现金或者银联 支付）
 * @param orderPayment
 * @param cb
 */
export const updateRemoteOrderPaymode = (orderPayment, cb) => request('pos.orderHandler.confirmPayment', {
  model: orderPayment
}, cb);

/**
 * @ 批量更改子订单状态
 * @ model.parent_order_id 子订单的父id
 * @ model.order_state 订单状态
 * */
export const getBatchChangeChildOrder = (model, cb) => request('pos.orderHandler.batchChangeChildOrder', { //TODO:-------
  model: model
}, cb)

/**
 * @ 单条写入远程第三方外卖信息
 *
 * */
export const insertSelectiveByPlatformOrderId = (platformInfo, cb) => request('pos.platformOrderHandler.insertSelectiveByPlatformOrderId', {//TODO:-------
  model: platformInfo
}, cb)

/**
 * @ 批量写入第三方外卖详细信息
 * */
export const batchInsertPlatformOrderDetail = (batchPlatformOrderDetails, cb) => request('pos.platformOrderDetailHandler.batchInsertPlatformOrderDetail', {//TODO:-------
  dataList: batchPlatformOrderDetails
}, cb)

/**
 * 批量插入第三方外卖额外信息
 * */
export const batchInsertPlatformOrderExtra = (batchPlatformOrderExtra, cb) => request('pos.platformOrderExtraHandler.batchInsertPlatformOrderExtra', { //TODO:-------
  dataList: batchPlatformOrderExtra
}, cb)

/**
 * 写入远程微信用户信息
 * */
export const insertSelectiveByCustomerId = (customerInfo, cb) => request('pos.customerHandler.insertSelectiveByCustomerId', { //TODO:-------
  model: customerInfo
}, cb)

/**
 * 写入 远程用户详情 数据
 */
export const insertSelectiveByCustomerAddressId = (customerDetail, cb) => request('pos.customerAddressHandler.insertSelectiveByCustomerAddressId', { //TODO:-------
  model: customerDetail
}, cb);


/**
 * 获取店铺详细信息
 * */
export const getShopDetails = (cb) => request('pos.shopDetailHandler.list', {}, cb)

/**
 * 获取营业数据
 * */
export const businessData = (dates, cb) => request('pos.orderHandler.businessData', {
  dates: dates
}, cb)


/**
 * 退菜，改单（支付前定义为改单，支付后定义为退菜）
 * */
export const refundOrderNew = (refund, cb) => request('pos.orderHandler.refundOrder', refund, cb); //TODO:-------


/**
 * 退菜，改单（支付前定义为改单，支付后定义为退菜）
 * */
export const insertRefundPaymentItems = (refundPaymentItems, cb) => request('pos.orderPaymentItemHandler.insertRefundPaymentItems', { //TODO:-------
  refundPaymentItems: refundPaymentItems
}, cb);

/**
 * 退服务费
 * */

export const refundService  = (orderId, customerCount, servicePrice, cb) => request('pos.orderHandler.refundServicePrice', {
  orderId: orderId,
  customerCount: customerCount,
  servicePrice: servicePrice
}, cb)

/**
 * 退菜，改单（支付前定义为改单，支付后定义为退菜）
 * */
export const refundOrder = (localRefund, cb) => request('pos.orderHandler.changeOrder', { //TODO:-------
  orderId: localRefund.id, // 主订单的id
  orderPaymentList: localRefund.orderPaymentList, // 支付项
  refundWay: localRefund.refundWay,
  localRefundItem: localRefund.orderItems, // 退菜数组
  payModeId: localRefund.payModeId, // 支付类型
  refundAllMoney: localRefund.refundMoney, // 需要退的钱数
  refundAllCount: localRefund.refundAllCount, // 需要退的总个数
  refundMealAllNumber: localRefund.refundMealAllNumber, // 退掉的总的 餐盒个数
  refundMealAllPrice: localRefund.refundMealAllPrice, // 需要退的总的餐盒数的钱数
  isMealFee: localRefund.isMealFee, // 是否开启餐盒费
  refundList: localRefund.refundList,
  refundRemark: localRefund.refundRemark,
}, cb);

/**
 * 获取店铺详情
 * */
export const shopDetail = (cb) => request('pos.shopDetailHandler.list', {}, cb);

/**
 * 同步数据库
 * */
export const syncDatabase = (cb, errcb) => request('pos.systemHandler.syncDatabase', {}, cb, errcb);

/**
 * 获取已支付的订单
 * */
export const payOrderList = (distributionMode, page_index, verCode, tableNumber, cb) => request('pos.orderHandler.payOrderList', { //TODO:-------
  distributionMode: distributionMode,
  page_index: page_index,
  verCode: verCode,
  tableNumber: tableNumber,
}, cb);

/**
 * 获取付款中的订单
 * */
export const payingOrderList = (distributionMode, page_index, verCode, tableNumber, cb) => request('pos.orderHandler.payingOrderList', { //TODO:-------
  distributionMode: distributionMode,
  page_index: page_index,
  verCode: verCode,
  tableNumber: tableNumber
}, cb);

/**
 * 获取未支付的订单
 * */
export const noPayOrderList = (distributionMode, page_index, verCode, tableNumber,  cb) => request('pos.orderHandler.noPayOrderList', { //TODO:-------
  distributionMode: distributionMode,
  page_index: page_index,
  verCode: verCode,
  tableNumber:tableNumber
}, cb);

/**
 * 获取待下单的订单
 * */
export const waitOrderList = (distributionMode, page_index, verCode, tableNumber,  cb) => request('pos.orderHandler.waitOrderList', { //TODO:-------
  distributionMode: distributionMode,
  page_index: page_index,
  verCode: verCode,
  tableNumber: tableNumber
}, cb);

/**
 * 获取 待下单 和 未支付 的订单
 * */
export const waitAndNoPayOrderList = (distributionMode, pageIndex, searchKey,pageSize, cb) => request('pos.orderHandler.waitAndNoPayOrderList', {//TODO:-------
  distributionMode: distributionMode,
  page_index: pageIndex,
  search_code: searchKey,
  page_size: pageSize
}, cb);

/**
 * 桌位列表
 * @param tableInfo
 * @param cb
 */
export const tableList = (cb) => request('pos.tableQrcodeHandler.list', {}, cb);

/**
 * 底部订单统计
 * */
export const countAndMoneyAmount = (cb) => request('pos.orderHandler.countAndMoneyAmount', {}, cb);

/**
 * 释放桌位
 * @param orderId
 * @param tableNumber
 * @param cb
 */
export const releaseTable = (orderId, tableNumber, cb) => request('pos.tableQrcodeHandler.releaseTable', { //TODO:-------
  orderId: orderId,
  tableNumber: tableNumber
}, cb);

/**
 * 获取标签
 * @param type,1=开台标签
 * @param cb
 */
export const getTgs = (type, cb) => request('pos.tagHandler.getTgs', { //TODO:-------
  type: type,
}, cb);

/**
 * 获取订单备注
 * @param cb
 */
export const getOrderRemarkList = (cb) => request('pos.orderHandler.orderRemarkList', {}, cb);

/**
 * 获取 取消订单备注
 * @param cb
 */
export const getRefundRemarkList = (cb) => request('pos.orderHandler.getRefundRemarkList', {}, cb);
export const getRemarks = (type, cb) => request('pos.orderHandler.getRemarks', {
  type: type
}, cb)

/**
 * 获取 所有未同步的订单 id 数组
 * @param cb
 */
export const getNotSyncOrderIds = (cb) => request('pos.orderHandler.getNotSyncOrderIds', {}, cb); //TODO:-------

/**
 * 获取 订单完整信息  涉及以下四张表
 * tb_order(主订单包含子订单) , tb_order_item(订单项) , tb_order_payment_item(订单支付项) , tb_order_refund_remark(订单退菜备注)
 * @param cb
 */
export const getOrderFullInfoWithChildren = (orderId, cb) => request('pos.orderHandler.getOrderFullInfoWithChildren', { //TODO:-------
  orderId: orderId
}, cb);



/**
 * 恢复库存
 * tb_article
 * @param cb
 */
export const recoveryArticle = (cb) => request('pos.articleHandler.recoveryArticle', {}, cb);

/**
 * 结店
 *
 * @param cb
 */
export const closeBusiness = (cb) => request('pos.orderHandler.closeBusiness', {}, cb); //TODO:-------

/**
 * 菜品销量
 *
 * @param cb
 */
export const articleSales = (param, cb) => request('pos.orderItemHandler.articleSales', {
  reportDate: param.reportDate
}, cb);

/**
 * 根据菜品分类id 查询所有名称
 *
 * @param cb
 */
export const articleByFamilyId = (param, cb) => request('pos.orderItemHandler.articleByFamilyId', {
  reportDate: param.reportDate,
  familyId: param.familyId
}, cb);

/**
 * 根据菜品id 查询订单信息
 *
 * @param cb
 */
export const getOrderItemByArticleId = (param, cb) => request('pos.orderItemHandler.getOrderItemByArticleId', {
  reportDate: param.reportDate,
  articleId: param.articleId,
  articleType: param.articleType,
}, cb);

/**
 * 打印订单
 * @param cb
 */
export const printOrder = (orderId, cb) => request('pos.orderHandler.printOrder', {
  orderId: orderId,
}, cb);

/**
 * 获取订单信息test
 * @param cb
 */
export const getOrderInfoTest = (orderId, cb, errorcb) => request('pos.orderHandler.getOrderInfoTest', {
  orderId: orderId,
}, cb, errorcb);

/**
 * 打印总单
 * @param cb
 */
export const printTotal = (orderId, autoPrint,totalType, cb) => request('pos.printerHandler.getTotalTemplate', {
  orderId: orderId,
  totalType: totalType || 1,
  autoPrint: autoPrint || 0
}, cb);

/**
 * 打印退菜总单
 * @param cb
 */
export const printRefundTotal = (orderId, autoPrint,totalType,refund, orderItemArr, cb) => request('pos.printerHandler.getTotalTemplate', {
  orderId: orderId,
  totalType: totalType,
  refund: refund,
  orderItemArr: orderItemArr,
  autoPrint: autoPrint || 0
}, cb);

/**
 * 打印厨打
 * @param orderId
 * @param kitchenType 打印类型  0：正常  ,  1：精简版
 * @param cb
 */
export const printKitchenTotal = (orderId,autoPrint, kitchenType, refund, orderItemArr, cb) => request('pos.printerHandler.getKitchenTemplate', {
  orderId: orderId,
  autoPrint: autoPrint || 0,
  kitchenType: kitchenType,
  refund: refund,
  orderItemArr: orderItemArr
}, cb);
/**
 *  打印厨打
 *  @param orderId
 *  @param kitchenType 打印类型 0：正常， 1：精简版
 */
export const getNewKitchenTemplate = (orderId, autoPrint, kitchenType, refund, orderItemArr, cb) => request('pos.printerHandler.getNewKitchenTemplate', {
  orderId: orderId,
  autoPrint: autoPrint || 0,
  kitchenType: kitchenType,
  refund: refund,
  orderItemArr: orderItemArr
}, cb)

/**
 * 打印退菜厨打
 * @param orderId
 * @param kitchenType 打印类型  0：正常  ,  1：精简版
 * @param refund   0 不退菜   or  1 退菜
 * @param orderItemArr  退菜对象    orderItemArr:[ {id:"'df0a6deb982b4e57a894ce57f68211c4'",count:2}]
 * @param cb
 */
export const printRefundKitchenTotal = (orderId , autoPrint , kitchenType,refund, orderItemArr, cb) => request('pos.printerHandler.getKitchenTemplate', {
  orderId: orderId,
  kitchenType: kitchenType,
  refund: 1,
  orderItemArr: orderItemArr,
  autoPrint: autoPrint || 0
}, cb);

/**
 * 结店-当日小票
 * @param dates 日期  例如 2017-12-15
 * @param cb
 */
export const printStoreReport = (dates, cb) => request('pos.printerHandler.getDailyReportTemplate', {
  dates: dates
}, cb);


/**
 * 清除激活的 key
 * @param cb
 */
export const cleanActivationKey = (cb) => request('pos.systemHandler.cleanActivationKey', {}, cb);


/**
 * 服务器异常，禁止微信下单
 * */
export const serverError = (cb, errcb) => request('pos.systemHandler.serverError', {}, cb, errcb);

/**
 * 外卖打印总单
 * */
export const printPlatformTotal = (platformOrderId, cb, errcb) => request('pos.platformPrinterHandler.getPlatformTotalTemplate', {
  platformOrderId: platformOrderId
}, cb, errcb);


/**
 * 外卖打印厨打
 * */
export const printPlatformTicket = (platformOrderId, cb, errcb) => request('pos.platformPrinterHandler.getPlatformTicketTemplate', {
  platformOrderId: platformOrderId
}, cb, errcb);

/**
 *
 * @param cb
 * 获取今日第三方外卖列表集合
 */
export const platformTodayList = (cb) => request('pos.platformOrderHandler.todayList', {}, cb) //TODO:-------

/*
 * 根据订单ID获取第三方外卖呢订单详情
 * @param orderId
 * @param cb
 * */
export const platformByOrderId = (orderId, cb) => request('pos.platformOrderDetailHandler.getOrderInfoByOrderId', {
  orderId: orderId
}, cb)


/**
 * 获取今日第三方外卖列表集合
 * @param sql
 * @param cb
 */
export const serverCommand = (sql, cb) => request('pos.systemHandler.serverCommand', { //TODO:-------
  sql: sql
}, cb);

/**
 * 叫号
 * @param sql
 * @param cb
 */
export const callNumber = (orderId, cb) => request('pos.webSocketHandler.callNumber', {
  orderId: orderId
}, cb);

export const tvCallNumber = (orderId, cb)=>request('pos.webSocketHandler.orderId', {
  orderId: orderId
}, cb)
/***
 * 电视叫号 电视重连
 */
export const reconnectTV = (cb) => request('pos.webSocketHandler.reconectTV',{}, cb )

/**
* 当天已叫号订单  （电视叫号）
* @param sql
* @param cb
*/
export const hasCallOrderList = (distributionMode, cb) => request('pos.orderHandler.hasCallOrderList', {
 distributionMode: distributionMode
}, cb);

/**
* 当天所有未叫号的订单  （电视叫号，包含堂食和外带）
* @param cb
*/
export const waitCallAllOrderList = (cb) => request('pos.orderHandler.waitCallAllOrderList', {}, cb);


/**
 * 根据 订单流水号 查询订单项
 * @param sql
 * @param cb
 */
export const getOrderItemsBySerialNumber = (serialNumber, cb) => request('pos.orderHandler.getOrderItemsBySerialNumber', {  //TODO:-------
  serialNumber: serialNumber
}, cb);

/**
 * 获取 店铺电视配置
 * @param cb
 */
export const getShopTvConfig = (cb) => request('pos.shopTvConfigHandler.getShopTvConfig', {}, cb);  //TODO:-------

/***
 * 根据 customer_id 查询用户信息
 * @param customer_id
 * @param cb
 */
export const getCustomerInfo = (customerId, cb) => request('pos.customerHandler.selectByCustomerId', {
  customerId: customerId
}, cb)


export const waitCallTPOrderList = (pageIndex, searchKey, cb) => request('pos.orderHandler.waitCallTPOrderList', {
  page_index: pageIndex,
  search_code: searchKey,
}, cb);

export const hasCallTPOrderList = (pageIndex,searchKey, cb) => request(('pos.orderHandler.hasCallTPOrderList'), {
  page_index: pageIndex,
  search_code: searchKey
}, cb);

export const waitCallTPAndhasCallTPOrderCount = (cb) => request(('pos.orderHandler.waitCallTPAndhasCallTPOrderCount'), {}, cb);

export const selectTvByOrderId = (orderId, cb) => request('pos.orderHandler.selectByOrderId', {
  orderId: orderId
}, cb);



/**
 * 通过订订单id获取订单列表
 * @param type
 * @param content
 * @param cb
 */
export const getOrderItemByOrderId = (orderId, cb) => request('pos.orderItemHandler.getOrderItemByOrderId', {
  orderId: orderId
}, cb)


/**
 * 用于记录用户日志的通用方法
 * @param type
 * @param content
 * @param cb
 */
export const systemLog = (type, content, cb) => request('pos.systemHandler.log', {
  type: type,
  content: content
}, cb);

/**
 * 获取所有未打印的订单
 * @param type
 * @param content
 * @param cb
 */
export const getNotPrintOrderList = (cb) => request('pos.orderHandler.getNotPrintOrderList', {}, cb);

/**
 * 修复异常订单
 * @param type
 * @param content
 * @param cb
 */
export const fixAllOrder = (orderList, cb) => request('pos.orderHandler.fixAllOrder', {  // TODO:-------
  orderList: orderList
}, cb);


/**
 *采购单新增
 * */
export const addpurchaseApi = {
  addpurchase(data) {
    return axios.post(url.addpurchase,
      data
    ).then((response) => {
      return response.data
    })
  }
}
/**
 *入库单新增
 * */
export const addstoragesApi = {
  addstorages(data) {
    return axios.post(url.addstorages,
      data
    ).then((response) => {
      return response.data
    })
  }
}
/**
 * 盘点单新增
 * @type {{addinventory(*=): *}}
 */
export const addinventoryApi = {
  addinventory(data) {
    return axios.post(url.addinventory,
      data
    ).then((response) => {
      return response.data
    })
  }
}

/**
 * 扫码支付插入数据
 * @param orderId
 * @param formatDiscount
 * @param payMode
 * @param cb
 */
export const platformPayOrder = (orderId, formatDiscount, payMode, cb) => request('pos.orderHandler.platformPayOrder', {  //TODO:-------
  orderId: orderId,
  payMode: payMode,
  formatDiscount: formatDiscount
}, cb);

/**
 * 删除订单关联信息
 * @param type
 * @param content
 * @param cb
 */
export const deleteOrderRelationInfo = (orderId, cb) => request('pos.orderHandler.deleteOrderRelationInfo', {
  orderId: orderId
}, cb);

/**
 * 同步订单
 * @param orderIds
 * @param cb
 */
export const syncOrderInfo = (orderIds, cb) => request('pos.webSocketHandler.syncOrderInfo', {
  orderIds: orderIds,
}, cb);

/**
 * 退出登录
 * @param cb
 */
export const logout = (cb) => request('pos.userHandler.logout', {}, cb);

/**
 * 查询订单的折扣信息，包含子订单的
 * @param cb
 */
export const selectOrderDiscount = (orderId, cb) => request('pos.orderHandler.selectOrderDiscount', {
  orderId: orderId
}, cb);

/**
 * 获取店铺信息
 * @param cb
 */
export const getShopDetailInfo = (cb) => request('pos.shopDetailHandler.getShopDetailInfo', {}, cb);

/**
 * 查询菜品分类列表
 * @param cb function
 */
export const getFamilyList = (cb) => request('pos.articleFamilyHandler.getArticleFamily', {}, cb)

/**
 * Check the menu details according to the dish classification ID
 * @param familyId string dish classification ID
 * @param cb function
 */
export const getArticleListByFamilyId = (familyId, cb) => request('pos.articleFamilyHandler.getArticleByFamilyId', {
  article_family_id:  familyId
}, cb)
/**
 * Check the menu details according to the searchKey
 * @param searchKey string searchKey
 * @param cb function
 */
export const getArticleBySearchKey = (searchKey, cb) => request('pos.articleFamilyHandler.getArticleBySearchKey', {
  searchKey:  searchKey
}, cb)

/**
 * 根据菜品 id 来获取 新规格属性
 * @param articleId string
 * @param cb function
 * */
export const getUnitListByArticleId = (articleId, cb) => request('pos.unitHandler.selectUnitListByArticleId', {
  articleId: articleId
}, cb)

/**
 * 根据菜品 id 来获取 新规格属性
 * @param articleId string
 * @param cb function
 */

export const getArticlePriceListByArticleId = (articleId, cb) => request('pos.articlePriceHandler.getArticlePriceByArticleId', {
  articleId: articleId
}, cb)

/**
 * 根据菜品 id 来获取 套餐属性
 * @param articleId string
 * @param cb        function
 * */
 export const getMealByArticleId = (articleId, cb) => request('pos.mealItemHandler.getMealByArticleId', {
   articleId: articleId
}, cb)

/**
 * @desc 催菜
 * @param orderId
 * @param orderItemArr
 * @param cb
 */
export const reminderPrint = (orderData, cb) => request('pos.printerHandler.reminderPrint', {
  orderId: orderData.orderId,
  orderItemArr: orderData.orderItemArr
}, cb);

/***
 * @desc 继续点餐
 * @param orderId
 * @param childrenOrderId
 * @param orderItems
 * @param mealFeePrice
 * @param distributionModeId
 * @param customerId
 */
export const addOrderItemToOrder = (pushOrderInfo, cb) => request('pos.orderHandler.addOrderItemToOrder', {
  orderId: pushOrderInfo.masterOrderId,
  childrenOrderId: pushOrderInfo.childrenOrderId,
  orderItems: pushOrderInfo.orderItems,
  mealFeePrice: pushOrderInfo.mealFeePrice,
  mealAllNumber: pushOrderInfo.mealAllNumber,
  distributionModeId: pushOrderInfo.distributionModeId,
  customerId: pushOrderInfo.customerId
}, cb)

/**
 * @desc 判断微信和本地订单是否同时操作接口
 * @param orderId
 * @param type
 * @param cb
 * */
 export const verificationOfOrders = (verificationIFno, cb) => request('pos.orderHandler.verificationOfOrders', {
   orderId: verificationIFno.orderId || '',
   type: verificationIFno.type || ''
}, cb)

/**
 * 获取区域列表 带分页
 */
export const getAreaList = (cb) => request('pos.areaHandler.list', {}, cb);


  /**
   * 获取所有桌位
   * @params cb
   */
export const getAllTableAndOrderList = (pageIndex, search_code, cb) => request('pos.tableQrcodeHandler.getAllTableAndOrder',{
  page_index: pageIndex,
  search_code: search_code
}, cb)

/***
 * 获取桌位区域
 * @param areaId
 * @param pageIndex
 */
export const getAllTableAndOrderByAreaId = (areaId, pageIndex, cb) => request('pos.tableQrcodeHandler.getAllTableAndOrderByAreaId', {
  areaId: areaId,
  page_index: pageIndex
}, cb)


/***
 * @desc  万能消息接口
 * @param msgRoute
 * @param params
 * @param cb
 */
export const getNotifyToTerminal = (msgRoute, params, cb) => request('pos.msgHandler.freePush', {
  route: msgRoute,
  params: params
}, cb)



/***
* desc 取消折扣
 * @param orderId 主订单ID
 */
export const resumeDiscount = (orderId, cb) => request('pos.orderHandler.resumeDiscount', {
  orderId: orderId
}, cb)


/**
 * @desc 获取当前订单所有的菜品列表，包括所有子订单的子订单的
 * @param orderId
 * */
export const getOrderItemlistByOrderId = (orderId, cb) => request('pos.orderHandler.getOrderItemlistByOrderId', {
  orderId: orderId
}, cb)

/**
 * @desc 新版折扣
 */
export const givDiscount = (orderId, paymentItems, payMode, formatDiscount, isScanPay, servicePrice, cb) => request('pos.orderHandler.giveDiscount',{
  orderId: orderId,
  paymentItems: paymentItems,
  payMode: payMode,
  formatDiscount: formatDiscount,// 折扣相关
  isScanPay: isScanPay,
  servicePrice: servicePrice
}, cb)

/**
 * @desc 数据字段同步
 * */
export const syncOrderInfoById = (orderInfo, cb) => request('pos.orderHandler.syncOrderInfoById', {
  orderId: orderInfo.orderId,
  syncState: orderInfo.syncState,
  lastSyncTime: orderInfo.lastSyncTime
}, cb)

/**
 * @desc 加菜同步所有的订单
 * */
export const syncAllOrderById = (orderId, cb) => request('pos.orderHandler.syncAllOrderById', {
  orderId: orderId,
}, cb)


/**
 * @desc 获取所有的厨房打印机
 */
export const getAllPrint = (cb) => request('pos.orderHandler.getAllPrint', {}, cb);

/**
 * @desc 变更厨房状态
 */
export const changeKitchenStatus = (kitchenId, status, cb) => request('pos.orderHandler.updateKitchenStatus', {
  kitchenId: kitchenId,
  status: status
}, cb)

/**
 * @desc 查看与服务器 WebSocket 的连接状态
 */
export const websocketOnline = (cb) => request('pos.orderHandler.websocketOnline', {}, cb)



/**
 * @desc 换桌 同步服务器
 */
export const wsChangeTable = (tableNumber, state, orderId, cb) => request('pos.orderHandler.wsChangeTable', {
  tableNumber: tableNumber,
  state: false,
  orderId: orderId
}, cb)

/**
 * @desc 查询未同步订单
 * */
export const getLeftSyncOrder = (date, cb) => request('pos.orderHandler.getLeftSyncOrder', {
  date: date
}, cb)

/**
 * 结店时 同步未进行同步的订单
 * */
export const syncAll = (idList, cb) => request('pos.orderHandler.syncAll', {
  idList: idList
}, cb)
/**
 * @desc 打印记录
 */
export const getPrintRecord = (data, cb) => request('pos.printerHandler.getPrintRecord', {
  page_index: data.page_index,
  page_size: data.page_size,
  content: data.content,
  type: data.type,

}, cb)

/**
 * @desc 重新打印
 */
export const repeatPrintById = (data, cb, errCb) => request('pos.printerHandler.repeatPrintById', {
  id: data.id,
}, cb, errCb)
/**
 * @desc 删除打印记录
 */
export const deletePrintRecordById = (data, cb) => request('pos.printerHandler.deletePrintRecordById', {
  id: data.id,
}, cb);

/**
 * @desc 获取系统版本号
 */
export const getVersions = (cb) => request('pos.shopDetailHandler.getVersions', {}, cb);


/**
 * @desc 获取天气接口
 */
export const getWeather = (cb) => request('pos.orderHandler.getWeather', {} , cb)

/**
 * 读取卡号
 * @param cb
 */
export const readCard = (cb) => request('pos.cardHandler.readCard', {}
  , cb);


/**
 * 改变本地订单状态和金额
 * @param cardId
 */
export const updateOrderStateAndMoney = (data,cb) => request('pos.orderHandler.updateOrderStateAndMoney', {
  orderId:data.orderId,
  state:data.state,
  actualMoney:data.actualMoney,
  orderPosDiscountMoney: data.orderPosDiscountMoney,
  posDiscount: data.posDiscount,
  payMode: data.payMode
}, cb);

/**
 * 插入本地数据
 * @param cardId
 */
export const insertPayment = (data,cb) => request('pos.orderPaymentItemHandler.insertPayment', {
  orderId:data.orderId,
  paymentItems: data.paymentItems
}, cb);

/**
 *读卡支付
 * */
export const readCardPayMent = {
  restoPay(data) {
    return axios.post(readCardServer + '/newPosApi/restoPay',
      data,
      {headers: ''}
    ).then((response) => {
      return response.data
    })
  },
  saveOrder(data) {
    return axios.post(readCardServer + '/newPosApi/saveOrder',
      data,
      {headers: ''}
    ).then((response) => {
      return response.data
    })
  },
  savePayment(data) {
    return axios.post(readCardServer + '/newPosApi/savePayment',
      data,
      {headers: ''}
    ).then((response) => {
      return response.data
    })
  },
  refundOrderOrAticle(data) {  //退菜
    return axios.post(readCardServer + '/newPosApi/refundOrderOrAticle',
      data,
      {headers: ''}
    ).then((response) => {
      return response.data
    })
  },
}

/**
 * 退菜时支付类型判断
 * @param cardId
 */
export const getPaymentTypeByOrderId = (orderId,cb) => request('pos.orderPaymentItemHandler.getPaymentTypeByOrderId', {
  orderId:orderId,
}, cb);


/**
 * 获取是否有称重菜品
 * @param cb
 */
export const getOpenCatty = (cb) => request('pos.articleHandler.getOpenCatty', {}
  , cb);

/**
 * 读取称重
 * @param cb
 */
export const getWeight = (cb) => request('pos.weighReadHandler.getWeight', {}
  , cb);

/**
 * 读取称重 node版
 * @param cb
 */
export const getWeightNode = (port,cb) => request('pos.weighReadHandler.getWeightNode', {
    port:port,
}, cb);

/**
 * refund fail
 */
export const recoveryRefundData = (refund, cb) => request('pos.orderHandler.recoveryRefundData', refund, cb)


export const getDiscountInfo = (orderId, cb) => request('pos.orderHandler.getDiscountInfo', {
  orderId: orderId
}, cb)

export const newReleaseTable = (tableNumber, cb) => request('pos.tableQrcodeHandler.newReleaseTable', {
  tableNumber: tableNumber
}, cb)



/***
 * 复合金额
 * @param date
 * @param cb
 */
export const checkReport = (paymentInfo, cb) => request('pos.paymentReview.checkReport', {
  date: paymentInfo.date,
  operator: paymentInfo.operator,
  paymentList: paymentInfo.paymentList
}, cb)

//结店是否开启复核金额
export const isOpenPaymentReview = (cb) => request('pos.paymentReview.isOpenPaymentReview', {}, cb)


//结店审核列表
export const findAllPaymentList = (date, cb) => request('pos.paymentReview.findAllPaymentList', {
  date: date
}, cb)

//结店审核 A4打印
export const checkPrint = (printInfo, cb) => request('pos.paymentReview.checkPrint', {
  printDate: printInfo.printDate,
  operator: printInfo.operator
}, cb)

//结店成功
export const checkSuccess = (date, cb) => request('pos.paymentReview.checkSuccess', {
 date: date
}, cb)

//查找钱箱
export const findCashbox = (cb) => request('pos.printerHandler.findCashbox', {}, cb);

//打开钱箱
export const openCashbox = (cb) => request('pos.printerHandler.openCashbox', {}, cb);

//根据微信id获取超级会员状态
export const getMembersState = (customerId, cb) => request('pos.customerHandler.getMembersStateByCustomerId', {
  customerId: customerId,
}, cb)


// 赠菜
export const grantArticleByOrderIdAndOrderItems = (grantData, cb) => request('pos.orderItemHandler.grantArticleByOrderIdAndOrderItems', {
  id: grantData.id,
  orderItems: grantData.orderItems,
  remark: grantData.remark
}, cb)

// 判断刷新还是关闭浏览器
export const onloadChrome = (chromeInfo, cb) => request('pos.orderHandler.onloadChrome', {
  chromeInfo: chromeInfo
}, cb)

// 判断 emqtt 是否开启， 也可以用于判断是否断网
export const emqttOnline = cb => request('pos.orderHandler.emqttOnline', {}, cb);
