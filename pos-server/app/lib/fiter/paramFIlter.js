/**
 * @author wxh on 2017/12/29
 * @copyright
 * @desc
 */

const paging = require("../paging/index");
const fileUtil = require("../../util/fileUtil");

const routeArr = ['articleFamilyHandler.listArticleStockInfo', `tableQrcodeHandler.list`, `systemHandler.log`]; //过滤接口

let obj = {
    ['userHandler.list']: '获取用户列表==>',
    ['entryHandler.login']: '用户登录==>',
    ['orderHandler.payOrder']: '支付或者核重==>',
    ['orderHandler.pushOrder']: '下单==>',
    ['orderHandler.fixAllOrder']: '修复异常订单==>',
    ['orderHandler.callNumber']: '叫号==>',
    ['orderHandler.updateOrderSyncState']: '更新订单同步状态==>',
    ['orderHandler.cancelOrder']: '取消订单==>',
    ['orderHandler.refundOrder']: '退菜或者改单==>',
    ['orderHandler.printOrderKitchen']: '打印订单 厨打==>',
    ['orderHandler.printOrder']: '打印订单 总单==>',
    ['orderHandler.bindTable']: '绑定桌号并且创建订单==>',
    ['orderHandler.confirmPayment']: '确认支付（微信端发起的  现金或者银联 支付）==>',
    ['webSocketHandler.sendMsg']: '发送ws消息 ==>',
    ['orderHandler.selectById']: '根据ID查询订单信息 ==>',
    ['orderHandler.getOrderItemlistByOrderId']: '根据订单id查询菜品项 ==>',
    ['customerHandler.selectByCustomerId']: '根据订单id查询微信用户信息 ==>',
    ['orderHandler.checkArticleSupporTime']: '菜品的所有供应时间段 ==>',
    ['shopDetailHandler.getShopDetailInfo']: '获取店铺详情 ==>',
    ['printerHandler.getTotalTemplate']: '执行总单打印 ==>',
    ['printerHandler.getKitchenTemplate']: '执行厨房打印 ==>',
    ['orderPaymentItemHandler.selectByOrderId']: '通过订单ID 查询订单支付项 ==>',
    ['orderHandler.waitCallTPAndhasCallTPOrderCount']: '获取当天堂食+外带的 没有叫号的AND已经叫号的 ==>',
    ['orderHandler.waitCallTPOrderList']: '获取当天堂食+外带的 没有叫号的 ==>',
    ['orderHandler.getOrderInfoTest']: '获取订单打印信息 ==>',
    ['entryHandler.reconnection']: '刷新重新登陆 ==>',
};


module.exports = function () {
    return new Filter();
}

var Filter = function () {
};
let start = 0;
Filter.prototype.before = function (msg, session, next) {
    let self = this;
    if (typeof msg == "object") {
        msg = paging.init(msg);
        start = Date.now();
        let route = msg.__route__.split(".")[1] + '.' + msg.__route__.split(".")[2];
        fileUtil.filterFile(`发起请求==>${obj[route]}${msg.__route__}`, `请求参数:${JSON.stringify(msg)}`);
        next();
    } else {
        next(true, {
            success: false,
            msg: "请传入对象" || null,
            data: null,
        });
        return;
    }
};

Filter.prototype.after = function (err, msg, session, resp, next) {
    if (routeArr.indexOf(msg.__route__.split(".")[1] + '.' + msg.__route__.split(".")[2]) < 0) {
        let route = msg.__route__.split(".")[1] + '.' + msg.__route__.split(".")[2];
        fileUtil.filterFile(`结束请求==>${obj[route]}${msg.__route__}`, `${msg.__route__},时长:${Date.now() - start},返回结果:${JSON.stringify(resp)} ,${err ? 'error:' + JSON.stringify(err) : ''}`);
    }
    next(err);
};

Filter.prototype.routeAllocation = function (msg) {
    console.log((msg.__route__).split(".")[0])
    // posRouter.map(msg.__route__)
};