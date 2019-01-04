/**
 * @author wxh on 2018/11/15
 * @copyright
 * @desc
 */

const result = require("../../util/resultUtil");
const orderState = require("../../constant/OrderState");

const orderMode = require('../../model/pos/order');
const orderItemMode = require('../../model/pos/orderItem');
const async = require('async');
const _ = require('lodash');
const sequelize = require('sequelize');


const webSocketClient = require("../../util/webSocketClient");

const { log ,appendFile} = require("../../util/fileUtil");
const requestUtil = require("../../util/requestUtil");

const generalUtil = require("../../util/generalUtil");
const dateUtil = require("../../util/dateUtil");
const customSqlModel = require("../../model/pos/customSql");

/**
 * 赠菜
 * @param msg
 * @param callback
 */

exports.grantArticleByOrderIdAndOrderItems = function (msg, callback) {
    let orderId = msg.id;
    let grantItems = msg.orderItems;
    let orderInfo = {};         //  主订单信息
    let synTime = Date.now();    //  订单最近更新时间
    let remarks = []
    let tableNumber = ''
    if (result.isEmpty(orderId)) return callback("id is null");
    if (result.isEmpty(grantItems)) return callback("orderItems is null ");
    log('发起赠菜==>', `orderId=>${orderId},grantItems=>${grantItems}`);
    async.waterfall([
        (vfDone)=>{
            requestUtil.post('verificationOfOrders', { orderId: orderId}, (err, data) => {
                if (err) {
                    log('赠菜校验==>', `【赠菜时校验】校验失败:\n ${JSON.stringify(err)}`);
                    vfDone(null,{success:true,message:``})
                }else {
                    log('赠菜校验==>', `【赠菜时校验】校验成功，请求值：${JSON.stringify(msg)}\n, 返回值：${JSON.stringify(data)}`);
                    vfDone(null,data)
                }
            });
        },
        function (result, cb) { // 插入 remark
            try {
                let resultObj = JSON.parse(result);
                if (resultObj.success == false){
                    log('赠菜校验==>', `返回值：${JSON.stringify(result)}`);
                    return callback(`此订单正在微信支付，请勿进行操作`);
                } else {
                    if (msg.remark) {
                        insertGrantRemark(orderId, grantItems, msg.remark, function (error, result) {
                            remarks = result
                            return cb(error || null, null);
                        })
                    } else {
                        return cb(null, null);
                    }
                }
            } catch (e) {
                log('赠菜校验==>', `返回值：${JSON.stringify(e)}`);
                insertGrantRemark(orderId, grantItems, msg.remark, function (error, result) {
                    remarks = result
                    return cb(error || null, null);
                })
            }
        }
    ],(error, result)=>{
        orderMode.findOneInfoById(orderId,(err, info)=>{
            if (err) return callback(err);
            orderInfo = info;
            if (info.tableNumber) {
                tableNumber = info.tableNumber
            }
            if (orderInfo.orderState != orderState.NO_PAY)    return callback(`该订单暂不支持赠菜`);
            let originalData = [];
            async.eachLimit(grantItems, 1,  (item, cb)=> {
                if (item.type ==1 ||item.type ==2 ||item.type ==5 ) {
                    orderItemMode.findOneInfoById(item.id, (err, reult) => {
                        if (err) return cb(err);
                        if (reult.grantCount == reult.orginCount ) return cb(`赠菜数量不能大于下单数量`);
                        originalData.push({
                            id: reult.id,
                            finalPrice: reult.unitPrice * item.count,
                            unitPrice:reult.unitPrice,
                            count: item.count,
                            orderId:item.orderId
                        });
                        cb()
                    })
                } else if(item.type ==3){
                    let condition = {
                        $or : [
                            {id : {"$like":`%${item.id}%`}},
                            {parent_id : {"$like":`%${item.id}%`}},
                        ]
                    };
                    orderItemMode.findAllInfoByConditions(condition, (err, reult) => {
                        if (err) return cb(err);
                        reult.map( (value)=> {
                            if (value.grantCount == value.orginCount ) return cb(`赠菜数量不能大于下单数量`);
                            originalData.push({
                                id: value.id,
                                finalPrice: value.unitPrice * value.count,
                                unitPrice:value.unitPrice,
                                orderId:value.orderId,
                                count: value.count,
                            });
                        });
                        cb();
                    })
                }else {
                    cb(`暂不支持该类型赠菜`)
                }
            }, (err) =>{
                if (err) return callback(err);
                let orderList  = [];
                let orderItemList  = [];
                let money = _.sumBy(originalData,  (o)=> o.finalPrice);
                let mainOrderMoney = 0;
                async.eachLimit(originalData, 1,  (item, cb)=> {
                    async.parallel({
                        orderItem: (done)=>{
                            orderItemMode.findOneInfoById(item.id,(err, rlv)=>{
                                if(err) return done(err);
                                orderItemMode.updateByConditions({finalPrice:(Number(rlv.finalPrice) - item.finalPrice).toFixed(2),count:rlv.count - item.count, grantCount:rlv.grantCount + item.count}, {id:item.id},(err, rve)=>{
                                    if(err) return done(err);
                                    orderItemMode.findOneInfoById(item.id,(err, rlv)=>{
                                        if(err) return done(err);
                                        orderItemList.push({id:rlv.id,finalPrice:rlv.finalPrice,grantCount:rlv.grantCount, count: rlv.count});
                                        done()
                                    });
                                });
                            });
                        },
                        order: (done)=>{
                            orderMode.findOneInfoById(item.orderId,(err, rev)=>{
                                if(err) return done(err);
                                orderMode.updateByConditions({paymentAmount:(Number(rev.orderMoney) - item.finalPrice).toFixed(2),orderMoney:(Number(rev.orderMoney) - item.finalPrice).toFixed(2),syncState:0,lastSyncTime:synTime}, {id:item.orderId},(err)=>{
                                    if(err) return done(err);
                                    orderMode.findOneInfoById(item.orderId,(err, rlv)=>{
                                        if(err) return done(err);
                                        let orderData = _.find(orderList, { 'id': rlv.id});
                                        if (orderData && orderData.orderMoney >rlv.orderMoney){
                                            _.remove(orderList, (sku)=> {
                                                return sku.id == rlv.id;
                                            });
                                            orderList.push({id:rlv.id,paymentAmount:rlv.orderMoney,orderMoney:rlv.orderMoney,"lastSyncTime":synTime,"syncState":1});
                                            done()
                                        }else {
                                            orderList.push({id:rlv.id,paymentAmount:rlv.orderMoney,orderMoney:Number(rlv.orderMoney),"lastSyncTime":synTime,"syncState":1});
                                            done()
                                        }
                                    });
                                });
                            });

                        },
                    },cb);
                }, (error)=> {
                    if (error) return callback(error);

                    if (orderInfo.amountWithChildren){
                        orderMode.updateByConditions({amountWithChildren:(Number(orderInfo.amountWithChildren) - money).toFixed(2),grantMoney:(Number(orderInfo.grantMoney) + money).toFixed(2), syncState:0, lastSyncTime:synTime}, {id:orderInfo.id},(err)=>{
                            if(err) return callback(err);
                            orderMode.findOneInfoById(orderInfo.id,(err, rlv)=>{
                                if(err) return callback(err);
                                let orderData = _.find(orderList, { 'id': rlv.id});
                                if (orderData){
                                    _.remove(orderList, (sku)=> sku.id == rlv.id);
                                    orderList.push({id:rlv.id,paymentAmount:rlv.orderMoney,orderMoney:rlv.orderMoney,amountWithChildren:rlv.amountWithChildren,grantMoney:Number(rlv.grantMoney),"lastSyncTime":synTime,"syncState":1});
                                }else {
                                    orderList.push({id:rlv.id,paymentAmount:rlv.orderMoney,orderMoney:rlv.orderMoney,amountWithChildren:rlv.amountWithChildren,grantMoney:Number(rlv.grantMoney),"lastSyncTime":synTime,"syncState":1});
                                }
                                // let updateData = [{"orderItem":orderItemList},{"order":orderList}];
                                let grantData = {
                                    orderId: orderId,
                                    order: orderList,
                                    orderItems: orderItemList,
                                    remarks: remarks

                                }

                                let status = true;
                                setTimeout(function yc() {
                                    if (status){
                                        status = false;
                                        log('赠菜失败==>', `orderId=>${orderId},originalData=>${originalData}`);
                                        return callback(null,originalData)
                                    }
                                },5000);
                                webSocketClient.updateGrant(grantData, (err, data) =>{
                                    if (status){
                                        status = false;
                                        log('赠菜成功==>', `orderId=>${orderId},originalData=>${originalData}`);
                                        callback(null,originalData)
                                    }
                                })
                                // webSocketClient.syncUpdateData(JSON.stringify(updateData),"",synTime,1,  (err,data)=> {
                                //     if (status){
                                //         status = false;
                                //         log('赠菜成功==>', `orderId=>${orderId},originalData=>${originalData}`);
                                //         callback(null,originalData)
                                //     }
                                // });
                            });
                        });
                    }else {
                        orderMode.updateByConditions({grantMoney:Number(orderInfo.grantMoney + money).toFixed(2),syncState:0,lastSyncTime:synTime}, {id:orderInfo.id},(err)=>{
                            if(err) return callback(err);
                            orderMode.findOneInfoById(orderInfo.id,(err, rlv)=>{
                                if(err) return callback(err);
                                let orderData = _.find(orderList, { 'id': rlv.id});
                                if (orderData){
                                    _.remove(orderList, (sku)=> sku.id == rlv.id);
                                    orderList.push({id:rlv.id,paymentAmount:rlv.orderMoney,orderMoney:rlv.orderMoney,grantMoney:Number(rlv.grantMoney),amountWithChildren:rlv.amount_with_children||0,"lastSyncTime":synTime,"syncState":1});
                                }else {
                                    orderList.push({id:rlv.id,paymentAmount:rlv.orderMoney,orderMoney:rlv.orderMoney,grantMoney:Number(rlv.grantMoney),amountWithChildren:rlv.amount_with_children||0,"lastSyncTime":synTime,"syncState":1});
                                }
                                // let updateData = [{"orderItem":orderItemList},{"order":orderList}];
                                let grantData = {
                                    orderId: orderId,
                                    order: orderList,
                                    orderItems: orderItemList,
                                    remarks:remarks
                                }

                                let status = true;
                                setTimeout(function yc() {
                                    if (status){
                                        status = false;
                                        log('赠菜失败==>', `orderId=>${orderId},originalData=>${originalData}`);
                                        return callback(null,originalData)
                                    }
                                },5000);
                                // console.log("-=========update=========", JSON.stringify(updateData));
                                webSocketClient.updateGrant(grantData, (err, data) =>{
                                    if (status){
                                        status = false;
                                        log('赠菜成功==>', `orderId=>${orderId},originalData=>${originalData}`);
                                        callback(null,originalData)
                                    }
                                })
                                // webSocketClient.syncUpdateData(JSON.stringify(updateData),"",synTime,1,  (err,data)=> {
                                //     if (status){
                                //         status = false;
                                //         log('赠菜成功==>', `orderId=>${orderId},originalData=>${originalData}`);
                                //         callback(null,originalData)
                                //     }
                                // });
                            });
                        });
                    }
                });
            });
        });
    });

};

/**
 * @param orderId
 * @param refundOrderItems
 * @param orderRefundRemark
 * @param cb
 */
var insertGrantRemark = function (orderId, refundOrderItems, orderRefundRemark, cb) {
    let refundList = [];
    async.eachLimit(refundOrderItems, 1, function (item, callback) {
        let remark = {
            type: 2,
            article_id: item.articleId,
            order_id: orderId,
            refund_remark_id: orderRefundRemark.split("_")[0],
            refund_remark: orderRefundRemark.split("_")[1],
            remark_supply: "",
            refund_count: item.count,
            shop_id: generalUtil.shopId,
            brand_id: generalUtil.brandId,
            create_time: dateUtil.timestamp()
        };
        customSqlModel.insertSelective(`tb_order_refund_remark`,remark, function (error) {
            refundList.push(generalUtil.convertHumpName(remark));
            callback(error || null);
        });
    }, function (error) {
        if (error) {
            cb(error)
        } else {
            cb(null, refundList)
        }
    });
};
