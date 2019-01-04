/**
 * @author wxh on 2018/6/27
 * @copyright
 * @desc
 */
const moment = require('moment')
const async = require('async')
const _ = require('underscore')

const result = require('../../util/resultUtil')
const dataUtil = require('../../util/dateUtil')
const generalUtil = require('../../util/generalUtil')
const defaults = require('../../constant/SyncDefaultVals')
const { log } = require("../../util/fileUtil");
const orderModel = require('../../model/pos/order')
const orderItemModel = require('../../model/pos/orderItem')
const orderPaymentItemModel = require('../../model/pos/orderPaymentItem')
const orderRefundRemarkModel = require('../../model/pos/orderRefundRemark')
const customSqlModel = require('../../model/pos/customSql')
const webSocketClient = require("../../util/webSocketClient");

exports.syncOrders = syncOrders
exports.getNeedSyncOrder = getNeedSyncOrder
exports.syncNeedOrder = syncNeedOrder
exports.syncTimer = {
    start : syncstart,
    stop: syncstop 
}

// 定时器
let timer = null
let timeNow = Date.now()

/**
 * 获取当日需要同步的订单
 * @param msg
 * @param callback
 */
function getNeedSyncOrder (msg, callback) {
    let date = msg.date || moment().format('YYYY-MM-DD')
    if (result.dateVerify(date)) return callback('日期格式不正确，正确格式为：2001-01-01')
    let timestamp = new Date(msg.date) - 0
    let timetil = timestamp + 1000 * 60 * 60 * 24
    let newIds = []
    let returnList = []

    async.waterfall([
        function (cb){
            let sql = `select * from tb_order o where (o.create_time >= ${timestamp} and o.create_time < ${timetil}) and o.sync_state = 0 and (o.parent_order_id is not null and o.parent_order_id !='')`

            customSqlModel.getAllCustomSqlInfo(sql, (err, list) => {
                if (err) return cb(err)
                list.forEach((parentOrder)=>{
                    if(!(parentOrder.parent_order_id in newIds)){
                        newIds.push(parentOrder.parent_order_id)
                    }
                })
                return cb(null)
            }) 
        },
        function (cb){
            newIds = "'" + newIds.join("','") + "'"
            let sql = `select * from tb_order o where o.create_time >= ${timestamp} and o.create_time < ${timetil} and o.sync_state = 0 and (o.parent_order_id is null or o.parent_order_id='') or o.id in (${newIds}) order by o.last_sync_time asc`

            customSqlModel.getAllCustomSqlInfo(sql, (err, list) => {
                if (err) return cb(err)
                let returnMap = list.map((order) => {
                    return order.id
                })
                returnList  = returnMap
                return cb(null)
            })
        }
    ],err=>{
        if(err) return callback(err)
        return callback(null,returnList)
    })
}

/**
 * 获取需要同步的订单
 * 1. 根据主订单状态查询是否同步
 * 2. 根据子订单状态查询是否同步 
 */
function syncOrders (config, cblast) {
    let orders = null
    let newOrders = []
    let newIds = []
    let formated = null
    timeNow = Date.now()

    let syncstate = 0

    async.waterfall([
            function (cb) { // 根据子订单查询父订单id
                if(config.idList){ // 根据已有订单号更新
                    return cb(null)
                }
                let sql = `select o.parent_order_id from tb_order o where o.sync_state=${syncstate} and (o.parent_order_id is not null and o.parent_order_id !='')`
                customSqlModel.getAllCustomSqlInfo(sql, (err, list) => {
                    if (err) return cb(err)
                    list.forEach((parentOrder)=>{
                        if(!(parentOrder.parent_order_id in newIds)){
                            newIds.push(parentOrder.parent_order_id)
                        }
                    })
                    cb(null)
                }) 
            },
            function (cb) {
                newIds = "'" + newIds.join("','") + "'"
                // 父订单未同步列表
                let sql = `select * from tb_order o where o.sync_state=${syncstate} and (o.parent_order_id is null or o.parent_order_id='') or o.id in (${newIds}) order by o.last_sync_time asc limit 0 ,5`
                if(config.idList){
                    let givenList = "'" + config.idList.join("','") + "'"
                    sql = `select * from tb_order o where  (o.parent_order_id is null or o.parent_order_id='') and o.id in (${givenList}) order by o.last_sync_time asc`
                }
                customSqlModel.getAllCustomSqlInfo(sql, (err, list) => {
                    if (err) return cb(err)
                    orders = list
                    let orderIdList = orders.map((order)=>{
                        return order.id
                    })
                    if(orderIdList.length){
                        log(`printLogs`,'同步订单::: '+ orderIdList) 
                    }
                    cb(null)
                })
            },
            function (cbf) {
                async.each(orders, (order, callback) => {
                    // 校验默认值和必填项
                    order = defaultval(defaults.order, order)
                    async.waterfall([
                            function (cb) { // 查找子订单
                                let sql = `select * from tb_order o where o.parent_order_id='${order.id}'`
                                order.suborders = []
                                customSqlModel.getAllCustomSqlInfo(sql, (err, subs) => {
                                    if (err) return cb(err)
                                    if (Array.isArray(subs) && subs.length) {
                                        order.suborders = subs
                                        subInfo(order.suborders, (err, newSubs) => {
                                            if (err) return cb(err)
                                            order.suborders = newSubs 
                                            cb(null, order)
                                        })
                                    } else {
                                        cb(null, order)
                                    }
                                })
                            },
                            function (order, cb) { // 查找商品项
                                orderItemModel.findAllInfoByConditions({
                                        orderId: order.id
                                    },
                                    function (error, orderItems) {
                                        if (error) return cb(error)
                                        orderItems = defaultval(defaults.orderitem, orderItems)
                                        order.orderItems = orderItems
                                        cb(null, order)
                                    })
                            },
                            function (order, cb) { // 查找支付项
                                orderPaymentItemModel.findAllInfoByConditions({
                                        orderId: order.id
                                    },
                                    function (error, paymentItems) {
                                        if (error) {
                                            console.log(error)
                                            return cb(error)
                                        }
                                        paymentItems = defaultval(defaults.payment, paymentItems)
                                        order.orderPaymentItems = paymentItems
                                        cb(null, order)
                                    })
                            },
                            function (order, cb){ // 退菜标注项
                                orderRefundRemarkModel.findAllInfoByConditions({
                                    orderId: order.id
                                },
                                function (error, refundItems) {
                                    if (error) {
                                        console.log(error)
                                        return cb(error)
                                    }
                                    refundItems = defaultval(defaults.refunds, refundItems)
                                    order.orderRefundRemarks = refundItems
                                    cb(null, order)
                                }) 
                            }
                        ],
                        (err) => {
                            if (err) return callback(err)
                            newOrders.push(order)
                            return callback()
                        })
                    },
                    (err) => {
                        if (err) return cbf(err)
                        return cbf(null)
                    })
            }
        ],
        (err) => {
            if (err) {
                console.log(err)
                return cblast(err)
            }
            try {
                formated = newOrders.length ? JSON.stringify(newOrders) : false
                cblast(null, formated)
            } catch (error) {
                cblast(error)
            }
        })
}

/**
 * 子订单信息拼接
 */
function subInfo(subs, callback) {
    let newSubs = []
    async.each(subs, (order, scallback) => {
        // 校验默认值和必填项
        order = defaultval(defaults.order, order)
        async.waterfall([
                function (cb) {
                    orderItemModel.findAllInfoByConditions({
                            orderId: order.id
                        },
                        function (error, orderItems) {
                            if (error) cb(error)
                            orderItems = defaultval(defaults.orderitem, orderItems)
                            order.orderItems = orderItems
                            cb(null, order)
                        })
                },
                function (order, cb) {
                    orderPaymentItemModel.findAllInfoByConditions({
                            orderId: order.id
                        },
                        function (error, paymentItems) {
                            if (error) return cb(error)
                            paymentItems = defaultval(defaults.payment, paymentItems)
                            order.orderPaymentItems = paymentItems
                            cb(null, order)
                        })
                },
                function (order, cb){ 
                    orderRefundRemarkModel.findAllInfoByConditions({
                        orderId: order.id
                    },
                    function (error, refundItems) {
                        if (error) return cb(error)
                        refundItems = defaultval(defaults.refunds, refundItems)
                        order.orderRefundRemarks = refundItems
                        cb(null, order)
                    }) 
                }
            ],
            (err) => {
                if (err) return scallback(err)
                newSubs.push(order)
                scallback(null, order)
            })
        },
        (err) => {
            if (err) return callback(err)
            callback(null, newSubs)
        })
}

/**
 * 默认值校验
 */
function defaultval(def, origin){
    if(Array.isArray(origin)){
        for (let originitem of origin){
            for(let defaultitem in def){
                if (def.hasOwnProperty(defaultitem)){
                    if(!(defaultitem in originitem)){
                        originitem[defaultitem] = def[defaultitem]
                    }
                    if(originitem[defaultitem]===null){
                        originitem[defaultitem] = def[defaultitem] 
                    }
                }
            } 
            originitem = generalUtil.convertHumpName(originitem)
        }
    }else{
        for(let defaultitem in def){
            if(def.hasOwnProperty(defaultitem)){
                if(!(defaultitem in origin)){
                    origin[defaultitem] = def[defaultitem]
                }
                if(origin[defaultitem]===null){
                    origin[defaultitem] = def[defaultitem] 
                }
            }
        }
        origin = generalUtil.convertHumpName(origin)
    }
    return origin
}

/**
 * 同步后更新订单
 */
function updateCallbacks (orders, cblast) {
    let orderIds = []
    let orderSyncFail = []
    orders.forEach(order=>{
        if(order.synSuccess){
            orderIds.push(order.id)
        }else{
            orderSyncFail.push(order.id) 
        }
       
        // 子订单返回更新
        if(Array.isArray(order.suborders)&& order.suborders.length){
            order.suborders.forEach(sub=>{
                if(sub.synSuccess){
                    orderIds.push(sub.id)
                }else{
                    orderSyncFail.push(sub.id) 
                }
            })
        }
    })
    let orderRange = "'" + orderIds.join("','") + "'"
    let sql = `update tb_order set sync_state = 1 where id in (${orderRange})`

    customSqlModel.getAllCustomSqlInfo(sql, (err, result) => {
        if (err) return cblast(err)

        // 日志打印
        if(orderIds.length){
            log(`printLogs`,'更新成功订单::: '+ orderIds)
        }
        if(orderSyncFail.length){
            log(`printLogs`,'更新失败订单::: '+ orderSyncFail)
        }
        cblast(null, orderSyncFail)
    })
}

/**
 * 定时同步功能
 */
function syncstart(cb){
    if(timer) {
        clearInterval(timer)
    }
    timer = setInterval(syncfunc, 1000*60*5)

    // 启动后会立即执行一次
    // syncfunc()

    function syncfunc(){
        syncOrders({},(err, list)=>{ // 查询订单信息
            if(err) { 
                log(`printLogs`,'------------更新待同步订单失败 '+ err)
                return 
            }
            if(!list){
                log(`printLogs`,'暂无需要同步订单') 
                return 
            }
            log(`printLogs`,'发送同步订单 '+list) 
            webSocketClient.syncOrders(list,(err, data)=>{ // 同步订单到后台
                if(err) { 
                    log(`printLogs`,'------------同步订单到线上失败 '+ err)
                    return
                }
                data = JSON.parse(data)
                let backorders = JSON.parse(data.resultData)
                updateCallbacks(backorders, (err,data)=>{
                    if(err){
                        log(`printLogs`,'------------本地更新同步订单失败 '+ err)
                        return
                    }
                })
            })
        })
    }
}

/**
 * 关闭定时同步
 */
function syncstop () {
    clearInterval(timer)
    timer = null
}

/**
 * 同步给定列表订单
 */
function syncNeedOrder(msg, cb){
    if(!msg || !Array.isArray(msg.idList)){
        return cb(new Error('需要idList'))
    }
    if(!msg.idList.length){
        return cb(null, [])
    }
    let failOrders = []
    async.each(msg.idList, (id,cb)=>{
        syncOrders({idList: [id]},(err, list)=>{ // 查询订单信息
            if(err) {
                log(`printLogs`,'------------更新待同步订单失败 '+ err)
                failOrders.push(id)
                return cb(null)
            }
            webSocketClient.syncOrders(list,(err, data)=>{ // 同步订单到后台
                if(err) {
                    log(`printLogs`,'------------同步订单到线上失败 '+ err)
                    failOrders.push(id)
                    return cb(null)
                }
                data = JSON.parse(data)
                let backorders = JSON.parse(data.resultData)
                updateCallbacks(backorders, (err,data)=>{
                    if(err){
                        log(`printLogs`,'------------本地更新同步订单失败 '+ err)
                        failOrders.push(id)
                        return cb(null)
                    }
                    if(data&&data.length){
                        failOrders = failOrders.concat(data)
                    }
                    cb(null)
                })
            })
        })
    },err=>{
        if(err){
           return cb(err)
        }
        failOrders = _.uniq(failOrders)
        return cb(null, failOrders)
    })
}
