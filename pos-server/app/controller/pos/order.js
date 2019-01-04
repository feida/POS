/**
 * @author wxh on 2018/6/4
 * @copyright
 * @desc
 */
const result = require("../../util/resultUtil");
const requestUtil = require("../../util/requestUtil");
const dateUtil = require("../../util/dateUtil");
const generalUtil = require("../../util/generalUtil");
const { log ,appendFile} = require("../../util/fileUtil");
const shopMode = require("../../constant/ShopMode");
const productionStatus = require("../../constant/ProductionStatus");
const async = require("async");
const lodash = require("lodash");
const moment = require("moment");
const request = require("request");

const orderModel = require("../../model/pos/order");
const orderItemModel = require("../../model/pos/orderItem");
const articleModel = require("../../model/pos/article");
const articlePriceModel = require("../../model/pos/articlePrice");

const printerModel = require("../../model/pos/printer");
const shopDetailModel = require("../../model/pos/shopDetail");
const customSqlModel = require("../../model/pos/customSql");

// const orderModel = require("../../model/pos/order");
const posSqlite = require('../../dao/sqlite/pos').client;
const shopTvConfigModel = require("../../model/pos/shopTvConfig");
const webSocketClient = require('../../util/webSocketClient');


const mqttClient = require("../../dao/mqtt/index");



const tableQrcodeMode = require("../../model/pos/tableQrcode");
const orderState = require("../../constant/OrderState");
const orderPaymentItemModel = require('../../model/pos/orderPaymentItem');
const payMode = require("../../constant/PayMode");

/**
 * 下单
 * @param msg
 * @param callback
 * @returns {*}
 */
exports.pushOrder = function (msg, callback) {
    let masterOrderId = msg.masterOrderId;
    let childrenOrderId = msg.childrenOrderId;
    let orderItems = msg.orderItems;
    let shopDetail = null;
    // TODO: 不同模式的masterid 校验
    // if (!masterOrderId)  return callback("缺少 masterOrderId 参数");
    if (msg.orderItems.length == 0)  return callback("请选择菜品~");
    log(`下单${childrenOrderId?'(加菜)':''} ==>`, `订单ID orderId:${masterOrderId?masterOrderId:childrenOrderId},masterOrderId:${masterOrderId},childrenOrderId:${childrenOrderId},orderItems : ${JSON.stringify(orderItems)}`);
    let orderInfo = {};
    let lastSyncTime = (new Date()).getTime();
    async.waterfall([
        function (cb) {
            if (!masterOrderId )  return cb(null);
            var sql = `SELECT order_state FROM tb_order WHERE id = '${masterOrderId}'`;
            customSqlModel.getOneCustomSqlInfo(sql, function (error, reply) {
                if (reply.order_state <=2)  return cb(null);
                return cb("主订单状态已经变更，请重新开台下单")
            })
        },
        function(cb){ // 库存校验
            async.eachLimit(orderItems, 1, function (item, ab) {
                if (item.type == 2 ){ // 老规格
                    let conditions = {
                        id:item.article_prices_id,
                        currentWorkingStock:{
                            '$gte':item.count
                        }
                    };
                    articlePriceModel.findAllInfoByConditions(conditions ,(err, reply) => {
                        if(err) return ab(err);
                        if (!reply) return ab(`未找到${item.name}菜品或者库存数量低于${item.count}`);
                        return ab();
                    })
                }else if (item.type == 3 ){ // 套餐
                    async.eachLimit(item.mealItems, 1,  (mealItem, e_cb) => {
                        let conditions = {
                            id:mealItem.articleId,
                            currentWorkingStock:{
                                '$gte':mealItem.count
                            }
                        };
                        articleModel.findAllInfoByConditions(conditions ,(err, reply) => {
                            if(err) return e_cb(err);
                            if (!reply) return e_cb(`未找到${item.name}菜品或者库存数量低于${item.count}`);
                            return e_cb();
                        })
                    }, (err) => {
                        if (err) return ab(err);
                        return ab()
                    });
                }else{
                    let conditions = {
                        id:item.id,
                        currentWorkingStock:{
                            '$gte':item.count
                        }
                    };
                    articleModel.findAllInfoByConditions(conditions ,(err, reply) => {
                        if(err) return ab(err);
                        if (reply.length<1) return ab(`${item.name} 库存不足`);
                        return ab();
                    })
                }
            }, function (error) {
                if(error) return cb(error);
                return cb(null)
            })
        },
        function(cb){ // 店铺信息
            shopDetailModel.getShopDetailFindOne((error,shop)=>{
                if (error)  return cb(error);
                shopDetail = shop;
                if (shopDetail.shopModel != 6) return cb(null);
                let sql = `SELECT order_state FROM tb_order WHERE id = '${masterOrderId}'`;
                customSqlModel.getOneCustomSqlInfo(sql, (error, reply) =>{
                    if (error) cb(error);
                    if (reply.order_state >= 2) {
                        return cb('当前订单状态已变更，请重新选择桌位进行开台')
                    }else {
                        return cb(null)
                    }
                })
            })
        },
        function(e_cb){ // 创建订单
            if ((shopDetail.shopMode == shopMode.CALL_NUMBER||shopDetail.shopMode == shopMode.FOOTMUMBER_ORDER) && result.isEmpty(msg.masterOrderId) ) {
                let sql = "SELECT count(id) orderNumber from tb_order where accounting_time=strftime('%Y-%m-%d', datetime('now','localtime')) and (parent_order_id =''  or parent_order_id is null)";
                customSqlModel.getOneCustomSqlInfo(sql, function (error, data) {
                    if (error) return callback(error);
                    //  创建订单
                    let orderInfo = {
                        id: generalUtil.randomUUID(),
                        distributionModeId: msg.distributionModeId,
                        orderState: 1, // 默认 1  待下单状态
                        productionStatus: 0, // 默认 0 待下单状态
                        accountingTime: dateUtil.sdfDay(),
                        serialNumber: dateUtil.getSerialNumber(),
                        allowCancel: 0,    // 默认 1 ，允许取消
                        closed: 0,
                        createTime: dateUtil.timestamp(),
                        syncState: 0,
                        dataOrigin: 0,
                        shopDetailId: generalUtil.shopId,
                        isPosPay: 0,  // 默认为 0 ，当在 pos端买单时，设置为 1
                        payType: 0,   //  电视叫号，立即支付
                        allowContinueOrder: 1,    //  电视叫号不允许加菜
                        allowAppraise: 0, // 默认不允许评论
                        orderMode: shopDetail.shopMode,
                        amountWithChildren: 0,// 默认为0 ，订单消费总和，包括子订单的金额
                        verCode: generalUtil.getRandomNumber(),
                        orderNumber: ++data.orderNumber //  当天的订单数
                    };
                    orderModel.upsert(orderInfo, function (err, reply) {
                        if (err) return e_cb(err);
                        msg.masterOrderId = orderInfo.id;
                        return e_cb(null,msg);
                    });
                });
            }else if (result.isEmpty(msg.masterOrderId)) {
                return e_cb("订单ID不能为空~");
            } else {
                return e_cb(null,msg)
            }
        },
        function(msg,cbf){ // 信息查询, 生成订单项信息
            let getArticle = (item,cb)=>{
                let sql = `select * from tb_article a where a.id = '${item.id}' and a.activated = 1`;
                customSqlModel.getAllCustomSqlInfo(sql, (err, data) => {
                    if(err || !data || !data.length) return cb(err?err:'未找到菜品');
                    let article = data[0];
                    let orderItem = getOrderItemInfo(item, data[0]);
                    return cb(null,orderItem, article)
                })
            };
            let getArticlePrice = (item,cb)=>{
                let sql = `select * from tb_article_price p where p.id='${item.article_prices_id}'`;
                customSqlModel.getAllCustomSqlInfo(sql, (err, data) => {
                    if(err || !data || !data.length) return cb(err ? err:'未找到老规格菜品');
                    return cb(null, data[0])
                })
            };
            let getUnitDetailInfo = (detailId,cb) =>{
                posSqlite.query(`SELECT t1.* ,t2.name FROM tb_article_unit_detail t1
                LEFT JOIN tb_unit_detail t2 on t2.id = t1.unit_detail_id 
                where t1.id = ?`,{ replacements: [detailId],type: posSqlite.QueryTypes.SELECT }).then(data=>{
                    if(!data || !data.length) {
                        return cb('未找到菜品新规格属性子项')
                    }else {
                        return cb(null, data[0])
                    }
                }).catch(err=>{
                    console.log(err);
                    return cb(err)
                })
            }
            let getMealItemInfo = (mealItemids,cb)=>{
                // TODO
                // let sql = `select * from tb_meal_item m where m.id in ${mealItemids}`
                let sql = `select * from tb_meal_item`;
                customSqlModel.getAllCustomSqlInfo(sql, (err, data) => {
                    if(err||!data || !data.length) return cb(err?err:'未找到套餐属性子项');
                    let mealItem = null;
                    let mealItemMap = {}
                    for (let i in data) {
                        mealItem = data[i];
                        mealItemMap[mealItem.id] = mealItem;
                    }
                    cb(null, mealItemMap)
                });
            }
            let getWeightPackageInfo = (item,cb)=>{
                let sql = `select * from tb_weight_package_detail w where w.id=${item.weight_package_detail_id}`;
                customSqlModel.getAllCustomSqlInfo(sql, (err, data) => {
                    if(err||!data || !data.length) return cb(err?err:'未找到重量包项');
                    return cb(null, data[0])
                });
            }

            // 返回重组数据
            orderInfo.id =  msg.childrenOrderId == null ? msg.masterOrderId : msg.childrenOrderId
            orderInfo.orderItems = msg.orderItems

            let orderItems = []
            let original_amount = 0
            let order_money = 0
            let article_count = 0

            async.each(orderInfo.orderItems,(item,cbe)=>{
                let orderItem = null
                if(item.type == 1){
                    async.auto({
                        getArticle: (cb)=>{
                            getArticle(item,(err,article)=>{
                                if(err) return cb(err)
                                cb(null, article)
                            })
                        }
                    },(err, data)=>{
                        if(err) return cbe(err)
                        orderItem = data.getArticle
                        orderItems.push(orderItem)
                        original_amount += +(orderItem.original_price * orderItem.count);
                        order_money += orderItem.final_price;
                        article_count += orderItem.count;
                        cbe()
                    })
                }else if(item.type == 2){
                    async.auto({
                        getArticle: (cb)=>{
                            getArticle(item,(err,article)=>{
                                if(err) return cb(err)
                                orderItem = article
                                cb(null, article)
                            })
                        },
                        getArticlePrice: ['getArticle',(article,cb)=>{
                            article = article.getArticle
                            getArticlePrice(item,(error,item)=>{
                                //老规格有自己独立的粉丝价和单价
                                var articlePrice = item
                                orderItem.article_id += "@" + articlePrice.unit_ids
                                orderItem.article_name += articlePrice.name
                                var middlePrice = articlePrice.price

                                if (item.discount / 100 < 1) {
                                    middlePrice = middlePrice * item.discount / 100
                                } else {
                                    //是否启用粉丝价
                                    if (!item.isFans && articlePrice.fans_price) {
                                        middlePrice = articlePrice.fans_price
                                    }
                                }

                                // 计算价格
                                orderItem.unit_price = middlePrice;
                                orderItem.final_price = orderItem.count * middlePrice;
                                orderItem.original_price = middlePrice;
                                cb(null)
                            })
                        }]
                    },(err, data)=>{
                        if(err) return cbe(err);
                        //赋值基础信息
                        orderItems.push(orderItem);
                        original_amount += +(orderItem.original_price * orderItem.count);
                        order_money += orderItem.final_price;
                        article_count += orderItem.count;
                        cbe()
                    })
                }else if(item.type == 3){
                    async.auto({
                        getArticle: (cb)=>{
                            getArticle(item,(err,article)=>{
                                if(err) return cb(err)
                                orderItem = article
                                cb(null, article)
                            })
                        },
                        getMealItemInfo: ['getArticle',(article,cb)=>{
                            //    let mealIds =  item.mealItems.map((meal)=>{
                            //        return `${meal.id}`
                            //    })
                            //    mealIds = mealIds.join(',')
                            //    mealIds = `(${mealIds})`
                            article = article.getArticle
                           getMealItemInfo(null,(err, meals)=>{
                               console.log(err)
                                if(err) return cb(err)
                                orderItem.id = generalUtil.randomUUID();
                                //套餐子项
                                for (var mealItem_i in item.mealItems) {
                                    var mealItem = item.mealItems[mealItem_i];
                                    mealItem.type = 4;
                                    mealItem.discount = 100; // 这里仍然给100折扣，跟微信保持一致套餐差价不参与折扣，
                                    var mealItemInfo = meals[mealItem.id];
                                    var mealOrderItem = getOrderItemInfo(mealItem, mealItemInfo);
                                    mealOrderItem.article_id = mealItemInfo.article_id;
                                    mealOrderItem.parent_id = orderItem.id;
                                    mealOrderItem.meal_item_id = mealItem.id;
                                    //赋值基础信息
                                    orderItems.push(mealOrderItem);
                                    original_amount += mealOrderItem.final_price;
                                    order_money += mealOrderItem.final_price;
                                    // article_count += mealOrderItem.count;    // 套餐子项不参与 菜品总量的统计
                                }
                                cb(null, orderItem)
                           })
                        }]
                    },(err, data)=>{
                        if(err) return cbe(err)
                        //赋值基础信息
                        orderItems.push(orderItem);
                        original_amount += +(orderItem.original_price * orderItem.count);
                        order_money += orderItem.final_price;
                        article_count += orderItem.count;
                        cbe()
                    })
                }else if(item.type == 5){
                    async.auto({
                        getArticle: (cb)=>{
                            getArticle(item,(err,article)=>{
                                if(err) return cb(err)
                                orderItem = article
                                cb(null, article)
                            })
                        },
                        articleUnitDetailInfo: ['getArticle',(article,cb)=>{
                            async.each(item.unit_details,(unit,cbe)=>{
                                getUnitDetailInfo(unit, (err, articleUnit)=>{
                                    if(err) return cbe(err)
                                    orderItem.article_name += ("(" + articleUnit.name + ")");
                                    // 计算价格
                                    orderItem.unit_price += articleUnit.price * item.discount / 100;
                                    orderItem.final_price += orderItem.count * articleUnit.price * item.discount / 100;
                                    orderItem.original_price += +(orderItem.count * articleUnit.price);
                                    cbe(null)
                                })
                            },(err)=>{
                                if(err) return cb(err)
                                cb(null)
                            })
                        }]
                    },(err, data)=>{
                        if(err) return cbe(err)
                        //赋值基础信息
                        orderItems.push(orderItem);
                        original_amount += orderItem.original_price * orderItem.count;
                        order_money += orderItem.final_price;
                        article_count += orderItem.count;
                        cbe()
                    })
                }else if(item.type == 8){ // 重量包
                    async.auto({
                        getArticle: (cb)=>{
                            getArticle(item,(err,oitem, article)=>{
                                if(err) return cb(err)
                                orderItem = oitem
                                cb(null, article)
                            })
                        },
                        getWeightPackageInfo: ['getArticle',(article,cb)=>{
                            article = article.getArticle
                            if (!item.weight_package_detail_id) {
                                orderItem.article_name = item.name;
                                orderItem.unit_price = article.catty_money * item.weight;
                                orderItem.original_price = article.catty_money * item.weight;
                                orderItem.final_price = article.catty_money * item.weight;
                                orderItem.weight_package_detail_id = '';

                                // 添加重量包核重信息
                                orderItem.needRemind = 1;
                                orderItem.weight = item.weight;
                                orderInfo.needConfirmOrderItem = 1;
                                cb();
                            } else {
                                getWeightPackageInfo(item,(err, data)=>{
                                    if(err) return cb(err)
                                    orderItem.article_name = item.name;
                                    orderItem.unit_price = data.weight ;
                                    orderItem.original_price = article.catty_money *  data.weight;
                                    orderItem.final_price = article.catty_money *  data.weight ;
                                    orderItem.weight_package_detail_id =  item.weight_package_detail_id;

                                    // 添加重量包核重信息
                                    orderItem.needRemind = 1;
                                    orderItem.weight = data.weight
                                    orderInfo.needConfirmOrderItem = 1;
                                    cb()
                                })
                            }
                        }]
                    },(err, data)=>{
                        if(err) return cbe(err)

                        //赋值基础信息
                        orderItems.push(orderItem);
                        original_amount += +(+orderItem.original_price * orderItem.weight_package_detail_id ? orderItem.count : orderItem.weight);
                        order_money += orderItem.final_price;
                        article_count += orderItem.count;
                        cbe()
                    })
                }else{
                    // 其他餐品类型
                    cbe()
                }
            },(err)=>{
                if(err) return cbf(err)

                //赋值基础信息
                orderInfo.orderItemInfo = {
                    orderItems,
                    original_amount,
                    order_money,
                    article_count
                }
                cbf(null)
            })
        },
        function(e_cb){ // 更新订单
            //  if (shopDetail.shopMode == shopMode.BOSS_ORDER ) {
            let sql = `SELECT  (SELECT sum(order_money)   FROM tb_order WHERE id = '${orderInfo.id}' or ( parent_order_id= '${orderInfo.id}' and order_state = 2)) receipts, * FROM tb_order WHERE  id = '${orderInfo.id}'`;

            customSqlModel.getOneCustomSqlInfo(sql, function (err, originalOrder) {
                if (err) return e_cb(err);
                var mealAllPrice = msg.mealFeePrice;
                var servicePrice = msg.childrenOrderId == null ? originalOrder.service_price || 0 : 0;
                let order = {
                    productionStatus: productionStatus.PUSH_ORDER,
                    originalAmount: orderInfo.orderItemInfo.original_amount + servicePrice + mealAllPrice,//  需将 服务费也加上
                    orderMoney: orderInfo.orderItemInfo.order_money + servicePrice + mealAllPrice, //将服务费或餐盒费 并入订单总金额
                    articleCount: orderInfo.orderItemInfo.article_count,
                    paymentAmount: orderInfo.orderItemInfo.order_money + servicePrice + mealAllPrice,
                    parentOrderId: msg.childrenOrderId == null ? null : msg.masterOrderId, //当前订单为子订单时,
                    customerCount: originalOrder.customer_count, // 子订单的人数需要添加
                    customerId: msg.customerId, // 如果是微信下单 子订单的customerId也需要加上
                    mealAllNumber: msg.childrenOrderId == null ? msg.mealAllNumber : 0, //餐盒总个数 外带没有子订单
                    mealFeePrice: msg.childrenOrderId == null ? msg.mealFeePrice : 0, //餐盒单价
                    printOrderTime: dateUtil.timestamp(), //  下单时间
                    syncState: 0,//  更新订单数据后，将订单的同步状态更改为 0，推送至服务器后，通过回调更改为 1
                    needConfirmOrderItem: orderInfo.needConfirmOrderItem || 0, // 是否需要确认重量
                    orderMode: shopDetail.shopMode
                };
                //是否为子订单 更新主订单
                if (msg.childrenOrderId != null) {
                    let sql = `SELECT  (SELECT sum(order_money)  
                    FROM tb_order WHERE id = '${msg.masterOrderId}' or 
                    ( parent_order_id= '${msg.masterOrderId}' and order_state = 2)) receipts, 
                    * FROM tb_order WHERE  id = '${msg.masterOrderId}'`;
                    customSqlModel.getOneCustomSqlInfo(sql, function (err, orgOrder) {
                        if (err) return e_cb(err);
                        sql = `select sum(article_count) articleCount,sum(order_money) orderMoney from tb_order 
                    where parent_order_id = '${msg.masterOrderId}' and order_state != 9`;
                        customSqlModel.getOneCustomSqlInfo(sql, function (err, data) {
                            if (err) return e_cb(err);
                            let masterOrder = {
                                amountWithChildren: orgOrder.order_money + data.orderMoney + orderInfo.orderItemInfo.order_money,
                                countWithChild: orgOrder.article_count + data.articleCount + orderInfo.orderItemInfo.article_count,
                                mealAllNumber: orgOrder.meal_all_number + msg.mealAllNumber,
                                syncState: 0, //  更新订单数据后，将订单的同步状态更改为 0，推送至服务器后，通过回调更改为 1
                            };
                            if (orderInfo.needConfirmOrderItem) {
                                masterOrder.needConfirmOrderItem = orderInfo.needConfirmOrderItem || 0 // 主订单是否需要确认重量
                            }
                            //先更新主订单 然后更新子订单.
                            orderModel.updateById(msg.masterOrderId, masterOrder, function (err, reply) {
                                if (err) return e_cb(err);
                                orderModel.updateById(orderInfo.id, order, function (err, reply) {
                                    if (err) return e_cb(err);
                                    return e_cb(null, orderInfo);
                                });
                            });
                        });
                    });
                } else {
                    //没有子订单 只更新当前订单)
                    orderModel.updateById(orderInfo.id, order, function (err, reply) {
                        if (err) return e_cb(err);
                        return e_cb(null, orderInfo);
                    });
                }
            });
            // }else {
            //     // TODO: 其他模式
            //     return e_cb(null,null);
            // }
        },
        function (orderInfo, cb) { //插入订单项
            var orderItem = orderInfo.orderItemInfo.orderItems || [];
            async.eachLimit(orderItem, 1, function (item, callbacck) {
                item.order_id = orderInfo.id;
                item.sort = 0;
                item.status = 1;
                item.remark = item.discount ? item.discount + "%" : null;
                item.create_time = dateUtil.timestamp();
                delete item.discount; //删除数据库中没有的字段
                let content = {
                    id: item.id || generalUtil.randomUUID(),
                    orderId: item.order_id,
                    articleId: item.article_id,
                    articleName: item.article_name,
                    count: item.count,
                    originalPrice: item.original_price,
                    unitPrice: item.type == 8 ? item.original_price : item.unit_price,
                    finalPrice: item.final_price,
                    type: item.type,
                    orginCount: item.orgin_count,
                    refundCount: item.refund_count,
                    mealFeeNumber: item.meal_fee_number,
                    printFailFlag: item.print_fail_flag,
                    sort: item.sort,
                    status: item.status,
                    remark: item.remark,
                    createTime: item.create_time,
                    parentId: item.parent_id,
                    mealItemId: item.meal_item_id || 0,
                    kitchenId: item.kitchen_id || '',
                    recommendId: item.recommend_id || '',
                    changeCount: item.change_count || 0,
                    weight: item.weight || 0,
                    needRemind: item.needRemind || 0,
                };
                orderItemModel.save(content, function (error, reply) {
                    if (error)  return callbacck(error);
                    callbacck();
                });
            }, function (err) {
                if (err)   return cb(err);
                cb(null, orderInfo);
            });
        },
        function (orderInfo, cb) { //减库存
            //获取订单的子项
            var orderItems = orderInfo.orderItemInfo.orderItems || [];
            async.eachLimit(orderItems, 1, function (item, callback) {
                let sql = '';
                switch (item.type) {
                    //单品 套餐子项  新规格
                    case 1:
                    case 4:
                    case 5:
                        sql = `select current_working_stock from tb_article where id = '${item.article_id}'`;
                        customSqlModel.getOneCustomSqlInfo(sql, function (err, article) {
                            var currentWorkingStock = article.current_working_stock - item.count;
                            var articleInfo = {
                                // id: item.article_id,
                                currentWorkingStock: currentWorkingStock,
                                isEmpty: currentWorkingStock == 0 ? 1 : 0
                            };
                            articleModel.updateById(item.article_id, articleInfo, function (err, reply) {
                                if (err) cb(err.toString());
                                callback();
                            });
                        });
                        break;
                    case 2: //老规格 老规格只检查子项
                        sql = `SELECT article_id,current_working_stock from tb_article_price where id = '${item.article_id}'`;
                        customSqlModel.getOneCustomSqlInfo(sql, function (err, articlePrice) {
                            if (err) cb(err.toString());
                            //先更新老规格子项
                            var articlePriceInfo = {
                                currentWorkingStock: articlePrice.current_working_stock - item.count
                            };
                            articlePriceModel.updateById(item.article_id, articlePriceInfo, function (err, reply) {
                                if (err) cb(err.toString());

                                //再更新老规格主项
                                sql = `select current_working_stock from tb_article where id = '${articlePrice.article_id}'`;
                                customSqlModel.getOneCustomSqlInfo(sql, function (err, article) {
                                    var currentWorkingStock = article.current_working_stock - item.count;
                                    var articleInfo = {
                                        // id: articlePrice.article_id,
                                        currentWorkingStock: currentWorkingStock,
                                        isEmpty: currentWorkingStock == 0 ? 1 : 0
                                    };
                                    articleModel.updateById(articlePrice.article_id, articleInfo, function (err, reply) {
                                        if (err) cb(err.toString());
                                        callback();
                                    });
                                });
                            });
                        });
                        break;
                    case 3: //套餐
                        callback();
                        break;
                    case 8: // ??
                        sql = `select current_working_stock from tb_article where id = '${item.article_id}'`;
                        customSqlModel.getOneCustomSqlInfo(sql, function (err, article) {
                            var currentWorkingStock = article.current_working_stock - item.count;
                            var articleInfo = {
                                currentWorkingStock: currentWorkingStock,
                                isEmpty: currentWorkingStock == 0 ? 1 : 0
                            };
                            articleModel.updateById(item.article_id, articleInfo, function (err, reply) {
                                if (err) cb(err.toString());
                                callback();
                            });
                        });
                        break;
                }
            });
            cb(null, orderInfo);
        },
        function (orderInfo, cb) { // 更改本地同步状态
            var orderId = masterOrderId
            let sql = `select id FROM tb_order WHERE id = '${orderId}' or parent_order_id = '${orderId}'`;
            customSqlModel.getAllCustomSqlInfo(sql, (err, orderIdList) => {
                if(err) return cb(err)
                let syncOrderInfo = {
                    syncState: 0,
                    lastSyncTime: lastSyncTime
                }
                async.eachLimit(orderIdList, 1, function (orderId,m_cb) {
                    orderModel.updateById(orderId.id, syncOrderInfo, (err, reply) => {
                        if (err) return cb(err)
                        m_cb(null)
                    })
                })
                appendFile(`orderLogs`, `【本地订单同步】`, syncOrderInfo)
                cb(null, orderInfo)
            })
        },
        function (orderInfo, cb) { // 订单数据推送到服务器
            var orderId = !!childrenOrderId ? childrenOrderId : masterOrderId;
            if (shopDetail.shopMode == 2 || shopDetail.shopMode == 7) {
                orderId = orderInfo.id
            }
            var orderSql = `select * from tb_order where id = '${orderId}'`;
            var orderItemSql = `select * from tb_order_item where order_id = '${orderId}'`;
            customSqlModel.getOneCustomSqlInfo(orderSql, function (error, resOrder) {
                if (error) return cb(error);
                customSqlModel.getAllCustomSqlInfo(orderItemSql, function (error, resOrderItem) {
                    if (error) return cb(error);

                    resOrder.last_sync_time = lastSyncTime;

                    sendOrderInfo(resOrder, resOrderItem, function (amountOrderInfo) {
                        webSocketClient.orderCreated(amountOrderInfo,function () {})
                        mqttClient.weChatPush('order', 'orderCreated',msg.masterOrderId || new Date().getTime(), {
                            order: amountOrderInfo,
                            type: "orderCreated"
                        })
                    })
                    cb(null, orderInfo)
                })
            })
        }
    ],function (err,resultData) {
        if (err) {
            msg.childrenOrderId && orderModel.deleteById(msg.childrenOrderId);// 删除创建的子订单
            callback(err)
            appendFile(`orderLogs`, `${msg.__route__}=>【Pos订单】创建失败：,\n,${err.toString()}`);
        } else {
            appendFile(`orderLogs`, `${msg.__route__}=>【创建订单】创建成功；,\n,${JSON.stringify(msg)}`);
            callback(null, resultData.id);
        }
    })
}

function sendOrderInfo(orderInfo, orderItems, re_cb) {
    var orderItemMap = [];
    for (let i = 0; i < orderItems.length; i++) {
        orderItemMap[i] = {
            "unitPrice": orderItems[i].unit_price,
            "refundCount": orderItems[i].refund_count,
            "articleName": orderItems[i].article_name,
            "recommendId": orderItems[i].recommendId,
            "originalPrice": orderItems[i].original_price,
            "orderId": orderItems[i].order_id,
            "count": orderItems[i].count,
            "articleId": orderItems[i].article_id,
            "finalPrice": orderItems[i].final_price,
            "changeCount": orderItems[i].change_count,
            "remark": orderItems[i].remark,
            "mealItemId": orderItems[i].meal_item_id,
            "sort": orderItems[i].sort,
            "type": orderItems[i].type,
            "printFailFlag": orderItems[i].print_fail_flag,
            "parentId": orderItems[i].parent_id,
            "mealFeeNumber": orderItems[i].meal_fee_number,
            "originCount": orderItems[i].origin_count,
            "createTime": orderItems[i].create_time,
            "id": orderItems[i].id,
            "kitchenId": orderItems[i].kitchen_id,
            "status": orderItems[i].status,
            "needRemind": orderItems[i].need_remind
        }
    };
    var amountOrder = {
        "orderMoney": orderInfo.order_money,
        "accountingTime": orderInfo.accounting_time,
        "articleCount": orderInfo.article_count,
        "remark": orderInfo.remark,
        "paymentAmount": orderInfo.payment_amount,
        "tableNumber": orderInfo.table_number,
        "orderState": orderInfo.order_state,
        "amountWithChildren": orderInfo.amount_with_children,
        "customerAddressId": orderInfo.customer_address_id,
        "payType": orderInfo.pay_type,
        "parentOrderId": orderInfo.parent_order_id,
        "productionStatus": orderInfo.production_status,
        "customerId": orderInfo.customer_id,
        "allowContinueOrder": orderInfo.allow_continue_order,
        "id": orderInfo.id,
        "serialNumber": orderInfo.serial_number,
        "orderItem": orderItemMap,
        "dataType": 'orderCreated',
        "allowCancel": orderInfo.allow_cancel,
        "printOrderTime": orderInfo.print_order_time,
        "pushOrderTime": orderInfo.push_order_time,
        "originalAmount": orderInfo.original_amount,
        "createTime": orderInfo.create_time,
        "servicePrice": orderInfo.service_price,
        "closed": orderInfo.closed,
        "shopDetailId": orderInfo.shop_detail_id,
        "countWithChild": orderInfo.count_with_child,
        "distributionModeId": orderInfo.distribution_mode_id,
        "customerCount": orderInfo.customer_count,
        "verCode": orderInfo.ver_code,
        "dataOrigin": orderInfo.data_origin,
        "payMode": orderInfo.pay_mode,
        "mealFeePrice": orderInfo.meal_fee_price || 0,
        "mealAllNumber": orderInfo.meal_all_number || 0,
        "needConfirmOrderItem":  orderInfo.need_confirm_order_item || 0, // 是否需要确认重量
        "syncState": 1,
        "lastSyncTime": orderInfo.last_sync_time,
        "posDiscount": orderInfo.pos_discount || 100,

        "sauceFeeCount": orderInfo.sauce_fee_count,
        "sauceFeePrice" : orderInfo.sauce_fee_price,
        "towelFeeCount" : orderInfo.towel_fee_count,
        "towelFeePrice" : orderInfo.towel_fee_price,
        "tablewareFeeCount":orderInfo.tableware_fee_count,
        "tablewareFeePrice": orderInfo.tableware_fee_price,
        "isUseNewService": orderInfo.is_use_new_service
    };
    re_cb(amountOrder)
}

/**
 * 连接 TV 端
 * @param userId
 * @param callback
 */
exports.connectTv = function (callback) {
    orderModel.waitCallAllOrderList(function (error, orderList) {
        let orderNew = [];
        orderList.map(function (order) {
            orderNew.push({
                orderId: order.id,
                code: order.ver_code
            });
        });
        shopTvConfigModel.getShopTvConfigInfo(function (error, shopTvConfig) {
            callback({
                type: "open",
                orderNew: orderNew,
                shopTvConfig: shopTvConfig
            });
        });
    });
};

function getOrderItemInfo (item, article) {
    if (!article || !article.id) {
        return {};
    }

    //折扣之后的价格
    var middlePrice = article.price || article.price_dif || 0;

    if (item.discount / 100 < 1) {
        middlePrice = middlePrice * item.discount / 100;
    } else { //是否启用粉丝价
        if (!item.isFans && item.fansPrice) {
            middlePrice = item.fansPrice;
        }
    }

    return {
        order_id: "",
        article_id: article.id || article.article_id,
        article_name: article.name || article.article_name,
        count: item.count,
        original_price: article.price || article.price_dif || 0,
        unit_price: middlePrice,
        final_price: item.count * middlePrice,
        type: item.type,
        orgin_count: item.count,
        refund_count: 0,
        meal_fee_number: item.mealFeeNumber,
        print_fail_flag: 0,
        discount: item.discount
    };
}



/**
 * 根据ID 获取订单信息
 * @param callback
 */
exports.getOrderInfoById = function (orderIdArr,callback) {
    let orderIds = lodash.map(orderIdArr, 'id');
    orderModel.findAllInfoByIdArr(orderIds, callback);
};

/**
 *  数据同步成功后根据 订单 ID 修改订单
 */
exports.syncSuccessOrderInfoById = function (order) {
    let orderId = order.orderId
    let orderIds = order.orderIds
    // if (orderId != 'undefined') {
    //     orderModel.updateById(orderId, orderInfo, (err, reply) => {
    //         // if(err) result.success(next, err.toString());
    //         // result.success(next, null)
    //     })
    // }
    // 退菜回调更新本地同步状态
    if (order.orderId && order.synSuccess){
        async.waterfall([function (cb) {
            let parentId = ''
            customSqlModel.getOneCustomSqlInfo(`select parent_order_id from tb_order where id = '${order.orderId}'`, (error, parentOrderId) => {
                if (error) return cb(error)
                if (parentOrderId.parent_order_id) {
                    parentId = parentOrderId.parent_order_id;
                    cb(null, parentId);
                } else {
                    parentId = order.orderId;
                    cb(null,parentId);
                }
            })
        }, function(parentId, cb){
            let sql = `select id FROM tb_order WHERE id = '${parentId}' or parent_order_id = '${parentId}'`;
            customSqlModel.getAllCustomSqlInfo(sql, (err, orderIdList) => {
                if(err) return cb(err)
                return cb(null, orderIdList);
            })
        }, function(orderIdList, cb){
            let syncOrderInfo = {syncState: 1}
            async.eachLimit(orderIdList, 1, function (orderId, m_cb) {
                orderModel.updateById(orderId.id, syncOrderInfo, (err, reply) => {
                    if (err) return m_cb(err);
                    m_cb();
                })
            }, error => {
                if (error) return cb(error);
                return cb();
            })
        }, error => {
            if (error) return;
            return;
        }])
    } else if (order.orderIds && order.synSuccess) {
        async.waterfall([function(cb){
            let orderRange = "'" + orderIds.split(',').join("','") + "'"
            let sql = `select parent_order_id from tb_order where id in (${orderRange}) and parent_order_id is not null`
            customSqlModel.getAllCustomSqlInfo(sql, (err, ids) => {
                if(err) return cb(err)
                let parentIds = ids.map(id=>{
                    return id.parent_order_id
                })
                return cb(null, parentIds)
            })
        }, function(parentIds, cb){
            orderIds = orderIds.split(',').concat(parentIds)
            let orderRange = "'" + orderIds.join("','") + "'"
            let sql = `update tb_order set sync_state=1  where id in (${orderRange})`
            customSqlModel.getAllCustomSqlInfo(sql, (err, result) => {
                if(err) return cb(err)
                appendFile(`orderLogs`, `【退菜订单】本地更新同步状态成功 IDs: ${orderRange}`);
                return cb(null)
            })
        }],err=>{
            if(err) return appendFile(`orderLogs`, `【退菜订单】本地更新同步状态出错 err: ${err}`)
        })

    }else if(orderIds && ! order.synSuccess){
       appendFile(`orderLogs`, `【退菜订单】线上更新同步状态失败 IDs: ${orderIds}`);
    }
}

/**
 * 获取今日数据
 */
exports.business = function (dates, callback) {
    let resourcePaymentList = []
    let item = {};
   let allOrderPayments = [];
    async.waterfall([
        function (cb) {
            orderModel.getOrderListByDates(dates, function (error, orderList) {
                if (error) return cb(error);
                item.orderIdArr = [];
                if (orderList.length > 0) {
                    lodash.forEach(orderList, function (value) {
                        item.orderIdArr.push(`'${value.id}'`);
                    });
                    let obj = {
                        date: dates,    // 日期
                        totalAmount: lodash.sumBy(orderList, function (o) { return Number(o.amount_with_children )? Number(o.amount_with_children) + Number(o.order_pos_discount_money || o.member_discount_money || 0) : Number(o.order_money) + Number(o.order_pos_discount_money || o.member_discount_money || 0); }).toFixed(2), // 订单粉丝总额
                        orderAmount: orderList.length,                                           // 订单总数
                        orderAverage: (lodash.sumBy(orderList, function (o) { return Number(o.amount_with_children) ? Number(o.amount_with_children) + Number(o.order_pos_discount_money || o.member_discount_money || 0) : Number(o.order_money ) + Number(o.order_pos_discount_money || o.member_discount_money || 0); }).toFixed(2) / orderList.length).toFixed(2),        // 订单均额
                        customerAmount: lodash.sumBy(orderList, 'customer_count'),        // 就餐人数
                    };
                    item.orderList = obj;
                } else {
                    item.orderList = {
                        date: dates,
                        totalAmount: 0,
                        orderAmount: 0,
                        orderAverage: 0,
                        customerCount: 0,
                    }
                }
                cb(null, orderList);
            })
        },
        function (orderList, cb) { // TODO:
            orderModel.getOrderAllByDates(dates, orderList, function (error, orderAll) {
                if (error) return cb(error);
                item.orderIdAll = [];
                if (orderList.length > 0) {
                    item.orderList.grantAmount =  lodash.sumBy(orderAll, function (o) {return Number(o.grant_money)}).toFixed(2), // 赠菜金额
                    item.orderList.totalAmount = lodash.sumBy(orderAll, function (o) {
                        return Number(o.order_money)  + Number(o.order_pos_discount_money) + Number(o.member_discount_money) + Number(o.erase_money) + Number(o.grant_money)
                    }).toFixed(2), // 订单粉丝总额
                    item.orderList.orderAverage = item.orderList.totalAmount / item.orderList.orderAmount;
                    lodash.forEach(orderAll, function (value) {
                        item.orderIdAll.push(`'${value.id}'`);
                    });
                    orderModel.getOrderPaymentListById(item.orderIdAll, function (error, orderPaymentList) {
                        orderModel.getRefundPaymentListById(item.orderIdAll, (error, orderRefundPayment) => {
                            resourcePaymentList = orderPaymentList
                            allOrderPayments = orderRefundPayment;
                            if (error) return cb(error);
                            let obj = {
                                incomeAmount: 0,  // 实收总额
                                incomeItems: {},  // 实收 List
                                discountAmount: 0, //折扣总额
                                discountItems: {}, //折扣list
                                canceledOrderAmount: 0,//退款金额总额
                                refundsItems: {},   //退款list
                                posAndMemberDiscountItems: {},
                                underline: {
                                    1: 0,
                                    10: 0
                                }
                            };


                            let refundMap = {}
                            for (let i = 0; i < orderRefundPayment.length; i++) {
                                let ite = orderRefundPayment[i]
                                if ([1, 10].indexOf(ite.payment_mode_id ) != -1 && ite.pay_value > 0 && !ite.result_data) { // 线下支付的金额
                                     obj.underline[ite.payment_mode_id] = obj.underline[ite.payment_mode_id] + ite.pay_value;
                                }

                                if (orderRefundPayment[i].payment_mode_id == 19) {
                                    let refundItem = orderRefundPayment[i];
                                    for (let j = 0; j < orderRefundPayment.length; j++) {
                                        let tempItem = orderRefundPayment[j]
                                        refundMap[tempItem.payment_mode_id] =  refundMap[tempItem.payment_mode_id] || 0
                                        if (refundItem.refund_source_id == tempItem.id) {
                                            let rst = refundMap[tempItem.payment_mode_id]
                                            refundMap[tempItem.payment_mode_id] = rst + refundItem.pay_value;
                                        }
                                    }
                                }
                                if (orderRefundPayment[i].payment_mode_id == 12 && orderRefundPayment[i].pay_value < 0) {
                                    obj.refundsItems[12] = (Number(obj.refundsItems[12]||0) + Number(Math.abs(orderRefundPayment[i].pay_value))).toFixed(2);
                                    obj.canceledOrderAmount = (Number(obj.canceledOrderAmount) + Number(Math.abs(orderRefundPayment[i].pay_value))).toFixed(2);
                                }
                            }
                            lodash.forEach(orderPaymentList, function (value) {
                                if ([2, 3, 7, 8, 17, 22, 24 , 26, 28].indexOf(value.payment_mode_id) != -1) { //折扣

                                    obj.discountAmount = (Number(obj.discountAmount) + Number(value.pay_value)).toFixed(2);
                                    obj.discountItems[value.payment_mode_id] = Number(value.pay_value).toFixed(2);
                                } else if ([11, 19, 25].indexOf(value.payment_mode_id) != -1) {   //退款
                                    obj.canceledOrderAmount = (Number(obj.canceledOrderAmount) + Number(value.pay_value)).toFixed(2);
                                    obj.refundsItems[value.payment_mode_id] = Math.abs(Number(value.pay_value).toFixed(2));
                                } else  {
                                    obj.incomeItems[value.payment_mode_id] = Number(value.pay_value).toFixed(2);
                                }
                            });


                            for (let key in obj.incomeItems) {
                                if ([1,2,3,4,6,7,8,10,11,13,14,15,20,21].indexOf(Number(key) == -1)) { // 除了这些全之外部都是退现金的
                                    let rs = obj.incomeItems[key], dst = Math.abs(refundMap[key]) || 0
                                    obj.incomeItems[key] = Number(rs - dst).toFixed(2)
                                    obj.incomeAmount = Number(Number(obj.incomeAmount) + Number(obj.incomeItems[key])).toFixed(2)
                                }
                            }

                            lodash.forEach(orderRefundPayment, function (item) {
                               if (item.pay_value < 0 && [1,10].indexOf(item.payment_mode_id) !== -1 && !item.result_data) {
                                   let tempValue = obj.underline[item.payment_mode_id] - Math.abs(item.pay_value);
                                   obj.underline[item.payment_mode_id]  = tempValue
                               }
                            });
                            obj.incomeItems[1] = Number(Number(obj.incomeItems[1]||0) - Number(obj.underline[1]||0)).toFixed(2);
                            obj.incomeItems[10] = Number(Number(obj .incomeItems[10]||0) - Number(obj.underline[10]||0)).toFixed(2);
                            let conditions = {
                                accountingTime: dates,
                                orderState: ['2', '10']
                            };
                            orderModel.getDayOrder(conditions, function (err, membersAndPosDiscount) {
                                if (err) return cb(err);
                                if (lodash.sumBy(membersAndPosDiscount, (o) => {
                                    return Number(o.orderPosDiscountMoney ) + Number(o.eraseMoney) + Number(o.exemptionMoney) + Number(o.grantMoney)
                                }) > 0) {
                                    obj.discountAmount = Number(obj.discountAmount) + lodash.sumBy(membersAndPosDiscount, (o) => {
                                        return Number(o.orderPosDiscountMoney ) + Number(o.eraseMoney) + Number(o.grantMoney)
                                    });
                                    obj.discountItems['pos'] = (lodash.sumBy(membersAndPosDiscount, (o) => {
                                        return Number(o.orderPosDiscountMoney) + Number(o.eraseMoney) + Number(o.exemptionMoney)
                                    })).toFixed(2).toString()

                                }
                                if (lodash.sumBy(membersAndPosDiscount, (o) => {
                                    return Number(o.memberDiscountMoney)
                                }) > 0) {
                                    obj.discountAmount = Number( obj.discountAmount) + lodash.sumBy(membersAndPosDiscount, (o) => {
                                        return Number(o.orderPosDiscountMoney)
                                    });
                                    obj.discountItems['member'] = (lodash.sumBy(membersAndPosDiscount, (o) => {
                                        return Number(o.memberDiscountMoney)
                                    })).toFixed(2).toString();
                                }
                                //支付源
                                var sql = `SELECT is_pos_pay isPosPay, Count(CASE WHEN (parent_order_id =''  or parent_order_id is null) THEN 1 END) orderCount, SUM(order_money) orderMoney FROM tb_order WHERE accounting_time = '${dates}' AND distribution_mode_id IN(1,3) AND order_state in(2,10,11) and production_status !=6 and exemption_money ==0 GROUP BY is_pos_pay`;
                                customSqlModel.getAllCustomSqlInfo(sql, function (err, paymentSource) {
                                    if (err) return result.error(next, err.toString(), msg)
                                    paymentSource.map(function (item) {
                                        if (item.isPosPay == 0) {
                                            obj.discountItems["posSettleAccounts"] = Number(item.orderMoney)
                                        } else {
                                            obj.discountItems["wechatSettleAccounts"] = Number(item.orderMoney)
                                        }
                                    });
                                });
                                item.orderPaymentList = obj;
                                cb(null, orderList);
                            });
                        })
                    })
                } else {
                    item.orderPaymentList = {
                        incomeAmount: 0,  //实收
                        incomeItems: {},
                        discountAmount: 0, //折扣
                        discountItems: {}, //折扣list
                        canceledOrderAmount: 0,   //退款金额
                        refundsItems: {},  //退款list
                    };
                    cb(null, orderList);
                }
            });
        },
        function (orderList, cb) {
            //订餐源
            var sql = `SELECT distribution_mode_id payModeId,SUM(order_money) orderMoney,SUM(order_pos_discount_money) orderPosDiscountMoney,SUM(member_discount_money) 
                        memberDiscountMoney, SUM(erase_money) eraseMoney, SUM(exemption_money) exemptionMoney, SUM(grant_money) grantMoney, COUNT(CASE WHEN (parent_order_id =''  or parent_order_id is null) THEN 1 END) orderCount 
                        FROM tb_order  WHERE distribution_mode_id in(1,3) AND accounting_time = '${dates}' AND order_state in (2,10,11) 
                        and production_status != 6 GROUP BY distribution_mode_id`;
            customSqlModel.getAllCustomSqlInfo(sql, function (err, orderingSource) { //TODO:
                if (err) result.error(next, err.toString(), msg);
                let obj = {
                    eatIn: {},
                    packaging: {},
                    eatOut: {}
                }

                orderingSource.map(function (item) {
                    if (item.orderMoney != 0) {
                        if (item.payModeId == 1) { // 堂食
                            obj.eatIn = {
                                orderCount: item.orderCount,
                                orderMoney: Number(item.orderMoney) + Number(item.orderPosDiscountMoney) + Number(item.memberDiscountMoney || 0) + Number(item.eraseMoney || 0) + Number(item.grantMoney || 0)
                            };
                        }
                        if (item.payModeId == 2) { // 外卖
                            obj.packaging = {
                                orderCount: item.orderCount,
                                orderMoney: Number(item.orderMoney) + Number(item.orderPosDiscountMoney) + Number(item.memberDiscountMoney || 0) + Number(item.memberDiscountMoney) + Number(item.eraseMoney || 0) + Number(item.grantMoney || 0)
                            };
                        }
                        if (item.payModeId == 3) { // 外带
                            obj.eatOut = {
                                orderCount: item.orderCount,
                                orderMoney: Number(item.orderMoney) + Number(item.orderPosDiscountMoney ) + Number(item.memberDiscountMoney || 0) + Number(item.memberDiscountMoney) + Number(item.eraseMoney || 0) + Number(item.grantMoney || 0)
                            };
                        }
                    }
                });
                item.orderOrderingSource = obj;
                cb(null, orderList);
            })
        },
        function (orderList, cb) {  //菜品销量
            orderItemModel.getOrderItemListById(item.orderIdAll, function (error, orderItemList) {
                if (error) return cb(error);
                let obj = {
                    saledProductAmount: lodash.sumBy(orderItemList, 'total_count') || 0,    //菜品总销量
                    saledProducts: []                                                           //菜品list
                };
                let nameType = lodash.unionBy(orderItemList, 'name');

                lodash.forEach(nameType, function (value) {
                    let orderItemListByName = lodash.filter(orderItemList, ['name', value.name]);
                    let arr = [{ productName: value.name, subtotal: lodash.sumBy(orderItemListByName, 'total_count') }];
                    lodash.forEach(orderItemListByName, function (val) {
                        arr.push({
                            product: "  " + val.article_name,
                            subtotal: val.total_count
                        })
                    });
                    obj.saledProducts.push(...arr)
                });
                item.orderItemList = obj;
                cb(null, orderItemList);
            })
        }, function (orderList, cb) {  //退菜数量
            orderItemModel.getOrderItemRefundListById(item.orderIdAll, function (error, refundList) {
                if (error) return cb(error);
                let obj = {
                    canceledProductCount: lodash.sumBy(refundList, 'refund_count') || 0,      //退菜总数量
                    canceledProducts: []                                                        //退菜list
                };
                if (refundList.length > 0) {
                    let nameType = lodash.unionBy(refundList, 'name');
                    lodash.forEach(nameType, function (value) {
                        let orderItemListByName = lodash.filter(refundList, ['name', value.name]);

                        let arr = [{
                            productName: value.name,
                            subtotal: lodash.sumBy(orderItemListByName, 'refund_count')
                        }];
                        lodash.forEach(orderItemListByName, function (val) {
                            arr.push({
                                productName: "  " + val.article_name,
                                subtotal: val.refund_count
                            })
                        });
                        obj.canceledProducts.push(...arr)
                    });
                }
                item.OrderItemRefundList = obj;
                cb(null, orderList);
            });
        },
        function (orderList, cb) {  //退菜金额及订单数
            orderModel.getOrderRefundAmountListById(item.orderIdAll, function (error, amountList) {
                if (error) return cb(error);
                let obj = {
                    canceledOrderAmount: Number(lodash.sumBy(amountList, 'total_value')).toFixed(2) || 0,
                    canceledOrderCount: amountList.length || 0,
                    canceledOrders: []
                };
                if (amountList.length > 0) {
                    lodash.forEach(amountList, function (value) {
                        obj.canceledOrders.push({
                            orderNumber: value.order_id,
                            tel: value.telephone || '-',
                            subtotal: Number(value.total_value).toFixed(2)
                        })
                    });
                }
                item.OrderRefundAmountList = obj;
                cb(null, orderList);
            })
        },
        function (orderInfo, cb) { //设置店铺信息
            shopDetailModel.getCustomShopDetailInfo('', function (error, shopDetail) {
                if (error) return cb(error);
                item.shopDetail = shopDetail;
                cb(null, orderInfo);
            });
        },
    ], function (error, results) {
        if (error) {
            callback(error)
        } else {
            let param = {};
            param.resetAurantName = item.shopDetail.name || '-';              //店名
            param.date = item.orderList.date;                            //日期
            param.totalAmount = item.orderList.totalAmount;          // 总额
            param.orderAmount = item.orderList.orderAmount;          //订单总数
            param.orderAverage = item.orderList.orderAverage;        //订单均额
            param.customerAmount = item.orderList.customerAmount;    //就餐人数
            param.customerAverage = item.orderList.customerAmount ? Number(item.orderList.totalAmount / item.orderList.customerAmount).toFixed(2) : 0;                  //人均消费
            param.incomeAmount = Number(item.orderPaymentList.incomeAmount).toFixed(2) || 0;   //实收金额
            param.incomeItems = item.orderPaymentList.incomeItems || [];    // 实收list
            param.underline = item.orderPaymentList.underline;
            param.discountAmount = Number(item.orderPaymentList.discountAmount).toFixed(2) || 0;   //折扣金额
            param.discountItems = item.orderPaymentList.discountItems;  //折扣金额 list
            // param.storedValueCount = item.chargeList.storedValueCount;      //充值单数
            // param.saledProductAmount =item.chargeList.saledProductAmount;  //充值金额
            // param.storedValueItems =item.chargeList.storedValueItems;  //充值 list
            // param.saledProductAmount =item.OrderItemList.saledProductAmount;   //菜品总销量
            // param.saledProducts =item.OrderItemList.saledProducts;  //菜品 list
            param.canceledProductCount = item.OrderItemRefundList.canceledProductCount;                  //退菜数量
            param.canceledProducts = item.OrderItemRefundList.canceledProducts;  //退菜品 list
            // param.canceledOrderAmount = item.OrderRefundAmountList.canceledOrderAmount;                  //退菜金额
            param.canceledOrderAmount = Math.abs(item.orderPaymentList.canceledOrderAmount);                  //退菜金额
            param.refundsItems = item.orderPaymentList.refundsItems;                  //退菜list
            param.canceledOrderCount = item.OrderRefundAmountList.canceledOrderCount;                  //退菜订单数
            param.canceledOrders = item.OrderRefundAmountList.canceledOrders;
            param.eatIn = item.orderList.eatIn;
            param.packaging = item.orderList.packaging;
            param.eatOut = item.orderList.eatOut;
            param.orderOrderingSource = item.orderOrderingSource;
            param.resourcePaymentList = resourcePaymentList
            param.grantAmount = item.orderList.grantAmount
            callback(null, param)
        }
    });
}

/**
 * @description 新报表
 * @param dates
 * @param callback
 */
exports.newBusiness = function(dates, callback) {
    let businessData = {
        dates: dates
    }
    async.waterfall([
        function (cb) {// 获取当天的订单
            orderModel.getOrderListByDates(dates, (err, orders) => {
                if (err) return cb(err);
                businessData.ids = orders.map(item => `'${item.id}'`);
                //  dates: dates, orderAmount: 订单总额 ,orderTotal: 订单数, orderAverage: 订单平均数, customerAmount: 就餐人数, grantMoney: 0 赠菜金额
                let obj = { orderAmount: 0, orderTotal: 0, orderAverage: 0, customerAmount: 0, grantMoney: 0 }
                if (orders && orders.length > 0) {
                    orders.map(item => {
                        obj.orderTotal = orders.length;
                        obj.customerAmount = Number(item.customer_count) + Number(obj.customerAmount);
                        obj.orderAmount = Number(obj.orderAmount) + Number(item.order_money) + Number(item.order_pos_discount_money) + Number(item.member_discount_money) + Number(item.erase_money) + Number(item.grant_money);
                        obj.orderAverage = Number(obj.orderAmount) / Number(obj.customerAmount);
                        obj.grantMoney = Number(obj.grantMoney) + Number(item.grant_money);
                    })
                }
                businessData.orderList = obj
                cb(null, businessData)
            })
        },
        function (businessData, cb) {//订餐源
            let sql = `SELECT distribution_mode_id payModeId,SUM(order_money) orderMoney,SUM(order_pos_discount_money) orderPosDiscountMoney,SUM(member_discount_money) 
                        memberDiscountMoney, SUM(erase_money) eraseMoney, SUM(exemption_money) exemptionMoney, SUM(grant_money) grantMoney, COUNT(CASE WHEN (parent_order_id =''  or parent_order_id is null) THEN 1 END) orderCount 
                        FROM tb_order  WHERE distribution_mode_id in(1,3) AND accounting_time = '${businessData.dates}' AND order_state in (2,10,11) 
                        and production_status != 6 GROUP BY distribution_mode_id`;
            customSqlModel.getAllCustomSqlInfo(sql, function (err, orderingSource) { //TODO:
                if (err) {
                    return cb(err.toString())
                }
                let obj = { eatIn: {}, packaging: {}, eatOut: {}}
                orderingSource.map(function (item) {
                    if (item.orderMoney != 0) {
                        if (item.payModeId == 1) { // 堂食
                            obj.eatIn = {
                                orderCount: item.orderCount,
                                orderMoney: Number(item.orderMoney) + Number(item.orderPosDiscountMoney) + Number(item.memberDiscountMoney || 0) + Number(item.eraseMoney || 0) + Number(item.grantMoney || 0)
                            };
                        }
                        if (item.payModeId == 2) { // 外卖
                            obj.packaging = {
                                orderCount: item.orderCount,
                                orderMoney: Number(item.orderMoney) + Number(item.orderPosDiscountMoney) + Number(item.memberDiscountMoney || 0) + Number(item.memberDiscountMoney) + Number(item.eraseMoney || 0) + Number(item.grantMoney || 0)
                            };
                        }
                        if (item.payModeId == 3) { // 外带
                            obj.eatOut = {
                                orderCount: item.orderCount,
                                orderMoney: Number(item.orderMoney) + Number(item.orderPosDiscountMoney ) + Number(item.memberDiscountMoney || 0) + Number(item.memberDiscountMoney) + Number(item.eraseMoney || 0) + Number(item.grantMoney || 0)
                            };
                        }
                    }
                });
                businessData.orderOrderingSource = obj;
                cb(null,  businessData);
            })
        },
        function (businessData, cb) {
            orderModel.getRefundPaymentListById(businessData.ids, (err, orderPaymentItems) => {
                if (err) return(err.toString());
                let obj = {
                    incomeAmount: 0,  // 实收总额
                    incomeItems: {},  // 实收 List
                    discountAmount: 0, //折扣总额
                    discountItems: {}, //折扣list
                    canceledOrderAmount: 0,//退款金额总额
                    refundsItems: {},   //退款list
                    posAndMemberDiscountItems: {},
                    underline: {
                        1: 0,
                        10: 0
                    }
                };
                orderPaymentItems.map(item => {
                    switch (item.payment_mode_id) {
                        case 1, 10: // 微信支付宝
                            item.result_data
                                ? obj.incomeItems[value.payment_mode_id] = (Number(obj.incomeItems[value.payment_mode_id]) + Number(value.pay_value)).toFixed(2)
                                : obj.underline[item.payment_mode_id] = (Number(obj.underline[item.payment_mode_id])  + item.pay_value).toFixed(2);
                            break;
                        case 2, 3, 7, 8, 17, 22, 24 , 26, 28: // 折扣金额
                            obj.discountAmount = (Number(item.discountAmount) + Number(item.pay_value)).toFixed(2);
                            obj.discountItems[item.payment_mode_id] = Number(item.pay_value).toFixed(2);
                            break;
                        case 11, 25: // 退款金额
                            obj.canceledOrderAmount = (Number(obj.canceledOrderAmount) + Number(value.pay_value)).toFixed(2);
                            obj.refundsItems[item.payment_mode_id] = Math.abs(Number(item.pay_value) + Number( obj.refundsItems[item.payment_mode_id]).toFixed(2));
                            break
                        default: // 其它支付项
                            item.pay_value > 0 ? obj.incomeItems[item.payment_mode_id] = Number(item.pay_value).toFixed(2) : '';
                    }
                })
                businessData.orderPaymentList = obj
                cb(null, businessData)
            })
        },
    ], function (error, businessData) {
        console.log("-------------", businessData)
        let param = {};
        // param.resetAurantName = item.shopDetail.name || '-';              //店名
        param.date = businessData.dates;                            //日期
        param.totalAmount = businessData.orderList.orderAmount;          // 总额
        param.orderAmount = businessData.orderList.orderTotal;          //订单总数
        param.orderAverage = businessData.orderList.orderAverage;        //订单均额
        param.customerAmount = businessData.orderList.customerAmount;    //就餐人数
        param.customerAverage = businessData.orderList.customerAmount ? Number(businessData.orderList.orderAmount / businessData.orderList.customerAmount).toFixed(2) : 0;                  //人均消费
        param.incomeAmount = Number(businessData.orderPaymentList.incomeAmount).toFixed(2) || 0;   //实收金额
        param.incomeItems = businessData.orderPaymentList.incomeItems || [];    // 实收list
        param.underline = businessData.orderPaymentList.underline;
        param.discountAmount = Number(businessData.orderPaymentList.discountAmount).toFixed(2) || 0;   //折扣金额
        param.discountItems = businessData.orderPaymentList.discountItems;  //折扣金额 list
        // param.storedValueCount = item.chargeList.storedValueCount;      //充值单数
        // param.saledProductAmount =item.chargeList.saledProductAmount;  //充值金额
        // param.storedValueItems =item.chargeList.storedValueItems;  //充值 list
        // param.saledProductAmount =item.OrderItemList.saledProductAmount;   //菜品总销量
        // param.saledProducts =item.OrderItemList.saledProducts;  //菜品 list
        // param.canceledProductCount = businessData.OrderItemRefundList.canceledProductCount;                  //退菜数量
        // param.canceledProducts = businessData.OrderItemRefundList.canceledProducts;  //退菜品 list
        // param.canceledOrderAmount = item.OrderRefundAmountList.canceledOrderAmount;                  //退菜金额
        // param.canceledOrderAmount = Math.abs(businessData.orderPaymentList.canceledOrderAmount);                  //退菜金额
        // param.refundsItems = businessData.orderPaymentList.refundsItems;                  //退菜list
        // param.canceledOrderCount = businessData.OrderRefundAmountList.canceledOrderCount;                  //退菜订单数
        // param.canceledOrders = businessData.OrderRefundAmountList.canceledOrders;
        param.eatIn = businessData.orderList.eatIn;
        param.packaging = businessData.orderList.packaging;
        param.eatOut = businessData.orderList.eatOut;
        param.orderOrderingSource = businessData.orderOrderingSource;
        // param.resourcePaymentList = resourcePaymentList
        // param.grantAmount = businessData.orderList.grantAmount
        console.log("------------", param)
        callback(null, param)
    })
}

/**
 * @desc 换 桌位
 * @param msg
 * @param callback
 */
exports.changeTableNum = function (msg, callback) {
    if (result.isEmpty(msg.orderId)) return result.error(next, "主订单编号不能为空", msg);
    if (result.isEmpty(msg.fromTableNumber)) return result.error(next, "原桌号不能为空", msg);
    if (result.isEmpty(msg.toTableNumber)) return result.error(next, "请选择新桌号", msg);
    msg.lastSyncTime = new Date().getTime();

    async.waterfall([
        function (cb) { //查询店铺模式
            shopDetailModel.getShopDetailInfo('', function (err, ben) {
                if (err) cb(err.toString());
                msg.allowFirstPay = ben.allowFirstPay;
                cb(null, msg)
            });
        },
        function (msg,cb) { //判断目标桌子是否被占用
            if (msg.allowFirstPay == 0){
                return cb(null, msg);
            } else {
                let sql = `SELECT table_state from tb_table_qrcode where table_number = ${msg.toTableNumber}`;
                customSqlModel.getOneCustomSqlInfo(sql, function (err, data) { // TODO:
                    if (err) {
                         cb(err.toString());
                    } else if (data) {
                        data.table_state == 0 ?  cb(null, msg):  cb("当前桌位被占用！");
                    } else {
                         cb("新桌位不存在！");
                    }
                });
            }
        },
        function (msg, cb) { //解除原桌位的锁定状态
            tableQrcodeMode.releaseTable(msg.fromTableNumber, function (error) {
                cb(error || null, msg);
            });
        },
        function (msg, cb) { //锁定新桌位
            if (msg.allowFirstPay == 0 )  return cb( null, msg);
            tableQrcodeMode.lockingTable(msg.toTableNumber, function (error) {
                cb(error || null, msg);
            });
        },
        function (msg, cb) { //更新订单中的桌号
            var orderInfo = {
                id: msg.orderId,
                tableNumber: msg.toTableNumber,
                lastSyncTime: msg.lastSyncTime,
                syncState: 0
            };
            //先更新主订单 在更新子订单
            orderModel.updateById(msg.orderId, orderInfo, function (err) { // TODO:
                if (err) cb(err.toString());
                //查询是否存在子订单
                let sql = `select count(parent_order_id) count from tb_order where parent_order_id = '${msg.orderId}';`;
                customSqlModel.getOneCustomSqlInfo(sql, function (err, data) { // TODO:
                    if (err) cb(err.toString());

                    if (data.count > 0) {

                        let childOrderInfoUpdate = {
                            tableNumber: msg.toTableNumber,
                            lastSyncTime: msg.lastSyncTime,
                            syncState: 0
                        };
                        let childOrderConditions = {
                            parentOrderId: msg.orderId,
                        };
                        //更新子订单 // TODO:
                        orderModel.updateByConditions(childOrderInfoUpdate, childOrderConditions, function (err) {
                            if (err) cb(err.toString());
                            cb(null);
                        });
                    }
                    cb(null);
                });
            });
        }
    ], function (err, resultData) {
        if (err) {
            callback(err)
        } else {
            webSocketClient.changeTable(msg.orderId, msg.toTableNumber, 1, msg.lastSyncTime, ()=>{})
            callback(null, resultData)
        }
    });
}

/**
 * @desc 开台
 * @param msg
 * @param callback
 */
exports.bindTable = function (msg, callback) {
    var distributionModeId = msg.distributionModeId || 1; //  默认堂食

    if (result.isEmpty(msg.tableNumber)) return callback("桌号不能为空");

    if (result.isEmpty(msg.customerCount)) return callback("就餐人数不能为空");

    if (result.isEmpty(msg.distributionModeId)) return callback("就餐模式不能为空");

    async.waterfall([
            function (cb) { // 验证桌位号是否存在
                let sql = `select * from tb_table_qrcode where table_number = '${msg.tableNumber.toString().replace(/\b(0+)/gi,"")}'`;
                customSqlModel.getOneCustomSqlInfo(sql, function (error, tableInfo) {
                    if (error) return cb('查询出错');
                    if (!tableInfo) return cb('桌位号不存在，请重新输入桌位');
                    cb(null, tableInfo)
                })
            },
            function (tableInfo, cb) { //查询店铺模式
                shopDetailModel.getShopDetailInfo('', function (err, ben) {
                    let totalService = 0;
                    if (err) return cb(err.toString());
                    msg.allowFirstPay = ben.allowFirstPay;
                    msg.serviceType        = ben.serviceType || 0; //服务费类型，0 经典版 1 升级版

                    msg.isOpenTablewareFee = ben.isOpenTablewareFee;
                    msg.tablewareFeeName   = ben.tablewareFeeName;   //餐具费名称
                    msg.tablewareFeePrice  = ben.serviceType == 1 && ben.isUseServicePrice && msg.distributionModeId == 1 && ben.isOpenTablewareFee ? ben.tablewareFeePrice * msg.customerCount : 0;  //餐具费价格

                    msg.isOpenTowelFee     = ben.isOpenTowelFee;
                    msg.towelFeeName       = ben.towelFeeName; // 纸巾费名称
                    msg.towelFeePrice      = ben.serviceType == 1 && ben.isUseServicePrice && msg.distributionModeId == 1 && ben.isOpenTowelFee ? ben.towelFeePrice * msg.customerCount : 0; // 纸巾费费价格

                    msg.isOpenSauceFee     = ben.isOpenSauceFee;
                    msg.sauceFeeName       = ben.sauceFeeName;  //酱料费名称
                    msg.sauceFeePrice      = ben.serviceType == 1 && ben.isUseServicePrice && msg.distributionModeId == 1 && ben.isOpenSauceFee ? ben.sauceFeePrice * msg.customerCount : 0; //酱料费价格

                    msg.totalService       = Number(msg.tablewareFeePrice + msg.sauceFeePrice + msg.towelFeePrice).toFixed(2);
                    msg.servicePrice       = ben.isUseServicePrice && ben.serviceType == 0 && msg.distributionModeId == 1  ? ben.servicePrice : 0
                    cb(null, msg);
                });
            },
            function (msg, cb) { //基础验证
                let sql = `SELECT count(id) orderNumber from tb_order where accounting_time=strftime('%Y-%m-%d', datetime('now','localtime')) and (parent_order_id =''  or parent_order_id is null)`;
                customSqlModel.getOneCustomSqlInfo(`${sql}`, function (error, data) {
                    if (error) return cb(error);
                    msg.orderNumber = ++(data.orderNumber);
                    cb(null, msg);
                });
            },
            function (msg, cb) {  //  暂不判断桌位状态
                if (msg.childrenOrder == 1 || msg.allowFirstPay == 0) {//判断桌子是否被占用
                    cb(null, msg);
                } else {
                    let sql = `SELECT table_state from tb_table_qrcode where table_number = ${msg.tableNumber.toString().replace(/\b(0+)/gi,"")}`;
                    customSqlModel.getOneCustomSqlInfo(`${sql}`, function (err, data) {
                        if (err) return  cb(err.toString());

                        if (data.table_state != 0  ) return cb("当前桌位被占用！")

                        if (msg.childrenOrder == 1 || msg.distributionModeId == 3 || msg.allowFirstPay == 0) return cb(null, msg); // 当是 子订单 或者 外带 或者 先付 的时候，无需锁定座位
                        customSqlModel.getOneCustomSqlInfo(`update tb_table_qrcode set table_state = 1 where table_number = ${msg.tableNumber.toString().replace(/\b(0+)/gi,"")}`,  (err)=> {// 锁定桌位
                            err ? cb(err) : cb(null,msg)
                        });

                        // data.table_state == 0 ? cb(null, msg) : cb("当前桌位被占用！");
                    });
                }
            },
            function (msg, cb) { //初始化数据
                customSqlModel.getOneCustomSqlInfo(`select * from tb_shop_detail`, function (error, shopInfo) { //  获取店铺信息
                    if (error) return cb(error.toString());
                    var orderInfo = {
                        tableNumber: msg.tableNumber ? msg.tableNumber.toString().replace(/\b(0+)/gi,"") : '',
                        customerCount: msg.customerCount || 0,
                        distributionModeId: msg.distributionModeId || 1,
                        accountingTime: dateUtil.sdfDay(),
                        serialNumber: dateUtil.getSerialNumber(),
                        remark: msg.remark || '',
                        createTime: dateUtil.timestamp(),
                        shopDetailId: generalUtil.shopId,
                        orderMode: shopInfo.shop_mode,
                        allowCancel: 0,    // 默认 1 ，允许取消
                        sauceFeeCount : msg.isOpenSauceFee ? (msg.customerCount || 0) : 0,//酱料数量
                        sauceFeePrice : msg.sauceFeePrice,//酱料价格
                        towelFeeCount : msg.isOpenTowelFee ? (msg.customerCount || 0) : 0,//纸巾数量
                        towelFeePrice  : msg.towelFeePrice,//纸巾价格
                        tablewareFeeCount : msg.isOpenTablewareFee ? (msg.customerCount || 0) : 0,//餐具数量
                        tablewareFeePrice : msg.tablewareFeePrice,//餐具价格
                        isUseNewService : msg.serviceType,
                        servicePrice: msg.childrenOrder ? 0 : msg.servicePrice * msg.customerCount || msg.totalService, //服务费
                        verCode: msg.childrenOrder ? "" : generalUtil.getRandomNumber(), // 只有主订单会自动生成 ver_code
                        orderNumber: msg.childrenOrder ? " " : msg.orderNumber, //  当天的订单数
                        grantMoney: 0
                    };
                    orderModel.create(orderInfo, function (err) {
                        if (err) {
                            return cb(err.toString());
                        } else {
                            return cb(null, orderInfo.id)
                            // if (msg.childrenOrder == 1 || distributionModeId == 3 || msg.allowFirstPay == 0) return cb(null, orderInfo.id); // 当是 子订单 或者 外带 或者 先付 的时候，无需锁定座位
                            // customSqlModel.getOneCustomSqlInfo(`update tb_table_qrcode set table_state = 1 where table_number = ${msg.tableNumber.toString().replace(/\b(0+)/gi,"")}`, function (err) {// 锁定桌位
                            //     err ? cb(err) : cb(null, orderInfo.id)
                            // });
                        }
                    });
                });
            },
            function (orderId, cb) {
                var syncOrderInfo = {orderId: orderId, syncState: 0, lastSyncTime: (new Date()).getTime()}
                orderModel.updateById(orderId, syncOrderInfo, (err, reply) => {
                    err ? cb(err) : cb(null, syncOrderInfo)
                })
            }
        ],
        function (err, resultData) {
            if (err) {
                callback(err)
            } else {
                callback(null, resultData)
            }
        });

}

/**
 * @desc 折扣（整单折扣）
 * @param msg
 * @param callback
 * */
exports.orderDiscount = function (msg, callback) {
    /*
        折扣率 真实折扣率
        折扣率 * order.order_money
        真实折扣率 * orderItem.final_price unit_price 最后一个 是总价减去前面所有的final_price (超过价格 折扣率设为一百)
        amount_with_children
    */
    if (!msg.orderId || msg.orderId.length == 0) {
        return result.error(next, "订单不能为空", msg);
    }
    if (!msg.paymentItems || msg.paymentItems.length == 0) { // 如果没有支付项 则单单是抹零或者折扣操作 不改变订单状态
        msg.paymentItems = [];
    }
    let updateData = [];
    let updateOrderPaymentData = [];
    let orderUPdate = []
    let customerId = msg.formatDiscount.customerId || null;
    let totalMoney = +msg.formatDiscount.totalMoney || 0; // 总金额
    let discountMoney = +msg.formatDiscount.discountMoney || 0; // 折扣金额
    let discountRate = +msg.formatDiscount.onDiscount.discountRate || 100; // 折扣率
    let removeMoney = +msg.formatDiscount.onDiscount.removeMoney || 0; // 不参与折扣的钱
    let onErasing = +msg.formatDiscount.onErasing.erasing || null; // 抹零
    let reduceMoney = +msg.formatDiscount.onReduceMoney.reduceMoney || null;
    let amountMoney = +msg.formatDiscount.amountMoney || 0; // 打折后需要支付的钱
    let servicePrice = 0;
    let mealFeePrice = 0;
    // 真实折扣率: (抹零或者折扣金额 / 打折后需要支付的钱)
    let realDiscountRate = (onErasing || reduceMoney) ? generalUtil.rounding(amountMoney / totalMoney * 100) : (discountRate == 100 ? null : discountRate);
    let table_number;

    let orderIdList = [];
    let lastSyncOrderInfo = {}
    msg.resultPayMents = [];
    async.auto({
        orderAndChildrenInfo: function (cb) { // 1、查找主订单 以及 未取消的子订单和兄弟订单
            let sql = `select * from tb_order where id ='${msg.orderId}' ;`;
            customSqlModel.getOneCustomSqlInfo(sql, function (err, orderInfo) {
                if (err) return cb(err);
                if (orderInfo.order_state == 2) return cb('该订单已经支付.');
                if (!orderInfo) return cb('订单不存在.');
                table_number = orderInfo.table_number;
                sql = `select * from tb_order where order_state not in (6, 9) and (id ='${msg.orderId}' or parent_order_id ='${msg.orderId}' `;
                if (orderInfo.parent_order_id)
                    sql += ` or id = '${orderInfo.parent_order_id}' or parent_order_id = '${orderInfo.parent_order_id}'`;
                sql += ')';
                customSqlModel.getAllCustomSqlInfo(sql, (err, ordersInfo) => {
                    if (err) return cb(err)
                    let orderState = false
                    for (let i = 0; i < ordersInfo.length; i++) {
                        if (ordersInfo[i].order_state < 2) {
                            orderState = true
                        }
                    }
                    if (orderState == true) {
                        orderState == false
                        return cb(err, ordersInfo)
                    } else  {
                        return result.success (next, {
                            message: '当前订单状态已变更',
                            data: null
                        })
                    }
                });
            });

        },
        selectOrderItem: ['orderAndChildrenInfo', function (reply, cb) { // 2、查找未支付订单的orderItem
            let ordersInfo = reply.orderAndChildrenInfo;
            let ids = [];
            for (let i = ordersInfo.length - 1; i >= 0; i--) {
                // 如果已经买单，折扣和抹零
                if (ordersInfo[i].order_state === 2)
                    continue
                else
                    ids.push(`'${ordersInfo[i].id}'`);
            }
            if (ids.length <= 0) {
                return cb(null, null);
            }
            let sql = `select * from tb_order_item where order_id in (${ids.toString()}) and count > 0`;
            customSqlModel.getAllCustomSqlInfo(sql, function (err, orderItems) {
                cb(err, orderItems);
            })
        }],
        updateServiceAndMealPrice: ['orderAndChildrenInfo', function (reply, cb) { // 3、更新服务费和餐盒费
            let updateOrderData = { order: [] };
            let ordersInfo = reply.orderAndChildrenInfo;
            lastSyncOrderInfo = {
                syncState: 0,
                lastSyncTime: new Date().getTime()
            }
            async.eachLimit(ordersInfo, 1, (orderInfo, e_cb) => {
                let order_update_info = {};
                if (orderInfo.order_state === orderState.HAS_PAY) {
                    return e_cb(null, null);
                }
                order_update_info.syncState = 1;
                order_update_info.last_sync_time = lastSyncOrderInfo.lastSyncTime
                order_update_info.id = orderInfo.id;
                order_update_info.originMoney = orderInfo.origin_money || orderInfo.order_money;
                order_update_info.payMode = msg.payMode || orderInfo.pay_mode;
                order_update_info.exemptionMoney = msg.payMode == 8 ? orderInfo.order_money : 0;
                if (!orderInfo.parent_order_id || orderInfo.parent_order_id === '') {
                    servicePriceDiscount(orderInfo, realDiscountRate, function (resultServicePrice) {
                        order_update_info.servicePrice      = resultServicePrice.servicePrice,
                            order_update_info.sauceFeePrice     = resultServicePrice.sauceFeePrice,
                            order_update_info.towelFeePrice     = resultServicePrice.towelFeePrice,
                            order_update_info.tablewareFeePrice = resultServicePrice.tablewareFeePrice

                        orderInfo.sauce_fee_price= resultServicePrice.sauceFeePrice,
                            orderInfo.towel_fee_price= resultServicePrice.towelFeePrice,
                            orderInfo.tableware_fee_price = resultServicePrice.tablewareFeePrice

                        servicePrice = order_update_info.servicePrice; // 记录服务费折扣
                        orderInfo.service_price = order_update_info.servicePrice;
                    })

                    order_update_info.mealFeePrice = (realDiscountRate !== null && orderInfo.meal_fee_price) ? generalUtil.rounding(orderInfo.meal_fee_price * (realDiscountRate / 100)) : orderInfo.meal_fee_price;
                    mealFeePrice = order_update_info.mealFeePrice; //记录餐盒费折扣
                    orderInfo.meal_fee_price = order_update_info.mealFeePrice;
                } else {
                    order_update_info.servicePrice = orderInfo.service_price || 0;
                    order_update_info.mealFeePrice = orderInfo.meal_fee_price || 0;
                }
                orderUPdate.push(order_update_info)
                orderModel.updateById(orderInfo.id, order_update_info, (err, reply) => {
                    return e_cb(err, null);
                })
            }, function (err) {
                return cb(err, null);
            });
        }],
        updateOrderItem: ['orderAndChildrenInfo', 'selectOrderItem', 'updateServiceAndMealPrice', function (reply, cb) { // 4、更新订单orderItem
            let updateOrderItemsData = { orderItem: [] };
            let orderItemsInfo = reply.selectOrderItem.sort((a, b)=>  a.final_price - b.final_price);
            let mainOrderId = reply.updateOrder;
            let lastOrderItem = orderItemsInfo ? orderItemsInfo.pop() : [];
            let all_final_price = servicePrice + mealFeePrice;
            async.eachLimit(orderItemsInfo, 1, function (orderItem, e_cb) {

                if (orderItem.final_price == 0 ) return e_cb();
                let new_order_item = {
                    id: orderItem.id,
                    orderId: orderItem.order_id,
                    articleId: orderItem.article_id,
                    articleName: orderItem.article_name,
                    count: orderItem.count,
                    originalPrice: orderItem.original_price,
                    no_discountPrice: orderItem.no_discount_price,
                    remark: orderItem.remark,
                    sort: orderItem.sort,
                    status: orderItem.status,
                    type: orderItem.type,
                    parentId: orderItem.parent_id || '',
                    createTime: orderItem.create_time,
                    mealItemId: orderItem.meal_item_id,
                    kitchenId: orderItem.kitchen_id,
                    recommendId: orderItem.recommend_id,
                    orginCount: orderItem.orgin_count,
                    refundCount: orderItem.refund_count,
                    mealFeeNumber: orderItem.meal_fee_number,
                    changeCount: orderItem.change_count,
                    printFailFlag: orderItem.print_fail_flag,
                    weight: orderItem.weight,
                    needRemind: orderItem.needRemind,
                    // 除最后一个菜品外单项菜品价格×真实折扣率 - 除最后一个菜品外单项菜品均分的抹零
                    noDiscountPrice: orderItem.no_discount_price || orderItem.final_price,
                    finalPrice: realDiscountRate !== null ? generalUtil.rounding(orderItem.final_price * (realDiscountRate / 100)) : orderItem.final_price,
                    unitPrice: realDiscountRate !== null ? generalUtil.rounding(orderItem.unit_price * (realDiscountRate / 100)) : orderItem.unit_price,
                    posDiscount: realDiscountRate || orderItem.pos_discount

                }
                all_final_price += new_order_item.finalPrice;
                updateOrderItemsData.orderItem.push(new_order_item);
                orderItemModel.updateById(orderItem.id, new_order_item, function (err, reply) {
                    e_cb(err, null);
                })
            }, function (err) {
                let new_order_item = {};
                // new_order_item.id = lastOrderItem ? lastOrderItem.id : '';
                new_order_item.id =  lastOrderItem ? lastOrderItem.id : '';
                new_order_item.orderId = lastOrderItem.order_id;
                new_order_item.articleId = lastOrderItem.article_id;
                new_order_item.articleName = lastOrderItem.article_name;
                new_order_item.count = lastOrderItem.count;
                new_order_item.originalPrice = lastOrderItem.original_price;
                new_order_item.no_discountPrice = lastOrderItem.no_discount_price;
                new_order_item.remark = lastOrderItem.remark;
                new_order_item.sort = lastOrderItem.sort;
                new_order_item.status = lastOrderItem.status;
                new_order_item.type = lastOrderItem.type;
                new_order_item.parentId = lastOrderItem.parent_id || '';
                new_order_item.createTime = lastOrderItem.create_time;
                new_order_item.mealItemId = lastOrderItem.meal_item_id;
                new_order_item.kitchenId = lastOrderItem.kitchen_id;
                new_order_item.recommendId = lastOrderItem.recommend_id;
                new_order_item.orginCount = lastOrderItem.orgin_count;
                new_order_item.refundCount = lastOrderItem.refund_count;
                new_order_item.mealFeeNumber = lastOrderItem.meal_fee_number;
                new_order_item.changeCount = lastOrderItem.change_count;
                new_order_item.printFailFlag = lastOrderItem.print_fail_flag;
                new_order_item.weight = lastOrderItem.weight;
                new_order_item.needRemind = lastOrderItem.needRemind;
                if (lastOrderItem && all_final_price <= 0) { // 只有一个菜品 并且 没有服务费 (前几个价格×真实折扣率 - 抹零)
                    new_order_item.noDiscountPrice = lastOrderItem.no_discount_price || lastOrderItem.final_price;
                    new_order_item.finalPrice = generalUtil.rounding(amountMoney);
                    new_order_item.unitPrice = lastOrderItem.count ? generalUtil.rounding(amountMoney / lastOrderItem.count) : 0;
                    new_order_item.posDiscount = realDiscountRate || lastOrderItem.pos_discount;
                } else if (lastOrderItem && all_final_price > 0 && amountMoney && amountMoney >= all_final_price) {
                    // 最后一个 是折扣价或者总价减去前面所有的final_price (超过所有的final_price 折扣率设为一百)
                    new_order_item.noDiscountPrice = lastOrderItem.no_discount_price || lastOrderItem.final_price;
                    new_order_item.finalPrice = generalUtil.rounding(amountMoney - all_final_price);
                    new_order_item.unitPrice = generalUtil.rounding((amountMoney - all_final_price) / lastOrderItem.count);
                    new_order_item.posDiscount = lastOrderItem.original_price == 0 ? realDiscountRate :  realDiscountRate !== null ? parseInt((new_order_item.finalPrice / lastOrderItem.original_price) * 100) : lastOrderItem.pos_discount;
                } else if (lastOrderItem) {
                    new_order_item.noDiscountPrice = lastOrderItem.no_discount_price || lastOrderItem.final_price;
                    new_order_item.posDiscount = lastOrderItem.pos_discount || 100;
                }
                updateOrderItemsData.orderItem.push(new_order_item)
                updateData.push(updateOrderItemsData);
                orderItemModel.updateById(new_order_item.id, new_order_item, function (err, reply) {
                    cb(err, null);
                })
            });
        }],
        updateOrder: ['orderAndChildrenInfo', 'selectOrderItem', 'updateServiceAndMealPrice', 'updateOrderItem', function (reply, cb) { // 3_1、更新 order
            let ordersInfo = reply.orderAndChildrenInfo;
            let mainOrderInfo;
            let amountWithChildren = 0;
            async.eachLimit(ordersInfo, 1, (order, e_cb) => {
                let sql = `select sum(final_price) sum from tb_order_item where order_id = '${order.id}' and count > 0;`;
                customSqlModel.getOneCustomSqlInfo(sql, (err, itemTotalMoney) => {
                    orderIdList.push(order.id)
                    let sum = itemTotalMoney.sum + order.service_price + order.meal_fee_price;
                    let order_update_info = {};
                    order_update_info.id = order.id;
                    order_update_info.customerId = customerId;
                    order_update_info.orderMoney = generalUtil.rounding(sum);
                    order_update_info.paymentAmount = generalUtil.rounding(sum);
                    order_update_info.posDiscount = discountRate == 100 ? order.pos_discount : discountRate;
                    order_update_info.orderPosDiscountMoney = discountRate == 100 ? order.order_pos_discount_money : generalUtil.rounding(order.order_money - sum);

                    order.order_money = generalUtil.rounding(sum);
                    order.payment_amount = generalUtil.rounding(sum);

                    if (order.parent_order_id) {
                        amountWithChildren += order.order_money;
                    } else {
                        mainOrderInfo = order;
                    }
                    orderUPdate.push(order_update_info)
                    orderModel.updateById(order.id, order_update_info, (err, reply) => {
                        e_cb(err, null);
                    });
                });
            }, (err) => {
                amountWithChildren = amountWithChildren ? generalUtil.rounding(amountWithChildren + mainOrderInfo.order_money) : amountWithChildren
                let updateMainOrder = {
                    id: mainOrderInfo.id,
                    amountWithChildren: amountWithChildren,
                    eraseMoney: onErasing || reduceMoney ? ((onErasing || 0) + (reduceMoney || 0)) + parseFloat(mainOrderInfo.erase_money) : mainOrderInfo.erase_money,
                    realEraseMoney: onErasing ? onErasing + parseFloat(mainOrderInfo.real_erase_money) : mainOrderInfo.real_erase_money,
                    reduceMoney: reduceMoney ? reduceMoney + parseFloat(mainOrderInfo.reduce_money) : mainOrderInfo.reduce_money,
                };
                // updateData.push({ order: [updateMainOrder] });
                orderUPdate.push(updateMainOrder)
                orderModel.updateById(mainOrderInfo.id, updateMainOrder, (err, reply) => {
                    console.log("0-0000000err", err)
                    cb(err, null);
                });
            });
        }],
    }, function (err, data) {
        updateData.push({ order:  orderUPdate})
        if (err) {
            // fileUtil.appendFile(`orderDiscount`, `${msg.__route__}=>【订单折扣】折扣失败：${msg.orderId},\n,${err.toString()}`);
            callback(err)
        } else {
            // synUpdateDataCb(msg, data)
            // todo 在 折扣之前本地状态需要改变
            var syncOrderInfo = {
                syncState: 0,
                lastSyncTime: new Date().getTime()
            }
            // todo 待优化
            async.eachLimit(orderIdList, 1, function (orderId) {
                orderModel.updateById(orderId, syncOrderInfo, function () {
                })
            })
            webSocketClient.syncUpdateData(JSON.stringify(updateData), syncOrderInfo.lastSyncTime, 1, 'orderPay',(err,data)=>{})
            callback(null, orderUPdate)
        }
    });
}



// 针对服务费打折 服务费 1 普通 2 升级版
var servicePriceDiscount = function (orderInfo, realDiscountRate, callback) {
    /**
     sauceFeePrice       //酱料价格
     towelFeePrice       //纸巾价格
     tablewareFeePrice   //餐具价格
     */
    let resultServicePrice = {
        sauceFeePrice: orderInfo.sauce_fee_price,
        towelFeePrice: orderInfo.towel_fee_price,
        tablewareFeePrice: orderInfo.tableware_fee_price,
        servicePrice: orderInfo.service_price
    }
    if (realDiscountRate != null && orderInfo.service_price) {
        for (var key in resultServicePrice) {
            resultServicePrice[key] =  generalUtil.rounding(resultServicePrice[key] && resultServicePrice[key] > 0 ? resultServicePrice[key] * (realDiscountRate / 100) : 0  )
        }
    }
    callback(resultServicePrice)
}


/**
 * 同步订单回调
 */
var synUpdateDataCb = function(msg, data){
    if(!data) return
    data = JSON.parse(data)
    if(data.synSuccess){
        let orderRange = "'" + data.orderIds.split(',').join("','") + "'"
        let sql = `update tb_order set sync_state = 1 where id in (${orderRange})`
        customSqlModel.getAllCustomSqlInfo(sql, (err, result) => {
            if(err) return fileUtil.appendFile(`orderLogs`, `${msg.__route__}=>【同步支付订单】本地更新同步状态出错 IDs: ${orderRange}`);
            fileUtil.appendFile(`orderLogs`, `${msg.__route__}=>【同步支付订单】本地更新同步状态成功 IDs: ${orderRange}`);
        })
    }else{
        fileUtil.appendFile(`orderLogs`, `${msg.__route__}=>【同步支付订单】更新同步状态失败 IDs: ${data.orderIds}`);
    }
}

/**
 * @desc 订单买单
 * @param msg
 * @param callback
 */
exports.payOrder = function (msg, callback) {
    if (!msg.orderId || msg.orderId.length == 0) return callback('订单id不能为空');
    let table_number;
    let lastSyncOrderInfo = {
        syncState: 0,
        lastSyncTime: new Date().getTime()
    }
    let updateData = []
    let orderList = []
    let orderPaymentItems = []
    msg.verCode = ''
    msg.resultPayMents = []
    async.waterfall([
        function (cb) { // 1.1 查找主订单 以及未取消的子订单 和 兄弟订单
            let sql = `select * from tb_order where id ='${msg.orderId}';`;
            customSqlModel.getOneCustomSqlInfo(sql, (err, orderInfo) => {
                if (err) return cb(err);
                msg.verCode = orderInfo.ver_code
                if (!orderInfo) return cb("订单不存在")
                if (orderInfo.orderState == 2) return cb('订单已经支付');
                table_number = orderInfo.table_number;
                sql = `select * from tb_order where order_state not in (6, 9) and (id ='${msg.orderId}' or parent_order_id ='${msg.orderId}' `;
                if (orderInfo.parent_order_id)
                    sql += ` or id = '${orderInfo.parent_order_id}' or parent_order_id = '${orderInfo.parent_order_id}'`;
                sql += ')';
               customSqlModel.getAllCustomSqlInfo(sql, (err, ordersInfo) => {
                    if (err) return cb(err)
                    let orderState = false
                   msg.tableNumber = ordersInfo[0].table_number
                    for (let i = 0; i < ordersInfo.length; i++) {
                        if (ordersInfo[i].order_state < 2) {
                            orderState = true
                        }
                    }
                    if (orderState == true) {
                        orderState == false
                        return cb(err, ordersInfo)
                    } else  {
                        return cb ('已买单')
                    }
                });
          })
        },
        function (orderInfo, cb) { // 1.2 更改订单状态
            let ordersInfo = orderInfo
            let order_update_info = {}
            async.eachLimit(ordersInfo, 1, (orderInfo, e_cb) => {
                if (orderInfo.order_state === orderState.HAS_PAY) return e_cb(null, null);
                order_update_info.syncState = 1;
                order_update_info.lastSyncTime = lastSyncOrderInfo.lastSyncTime;
                order_update_info.id = orderInfo.id;
                order_update_info.payMode = msg.payMode || orderInfo.pay_mode;
                order_update_info.orderState = orderState.HAS_PAY;
                order_update_info.exemptionMoney = msg.payMode == 8 ? orderInfo.order_money : 0;
                orderList.push({id : orderInfo.id, syncState : 1, lastSyncTime : lastSyncOrderInfo.lastSyncTime, payMode : msg.payMode || orderInfo.pay_mode, orderState : orderState.HAS_PAY, exemptionMoney: order_update_info.exemptionMoney || 0});
                orderModel.updateById(orderInfo.id, order_update_info, (err, reply) => {
                    return e_cb(err, null);
                })
            }, function (err) {
                return cb(err, null);
            });
        },
        function (orderInfo, cb) { // 1.3 插入支付项
            if (msg.paymentItems.length == 0 )   return cb(null, null);
            let paymentItems = msg.paymentItems;
            let orderId = msg.orderId;
            async.eachLimit(paymentItems, 1, function (payType, e_cb) {
                var item = {
                    id: generalUtil.randomUUID(),
                    orderId: orderId,
                    paymentModeId: payType.type,
                    payValue: generalUtil.rounding(payType.money),
                    remark: payMode.getPayModeName(parseInt(payType.type)) + "：" + payType.money,
                    payTime: dateUtil.timestamp(),
                    toPayId: payType.toPayId || null
                };
                orderPaymentItems.push(item);
                msg.resultPayMents.push(item);
                orderPaymentItemModel.upsert(item, function (error) {
                    e_cb(error || null);
                });
            }, function (error) {
                return cb(error, null);
            });
        },
        function (orderInfo, cb) { // 1.4 释放桌位状态
            let sql = `update tb_table_qrcode set table_state = 0 where table_number = ${table_number};`;
            customSqlModel.getOneCustomSqlInfo(sql, function (err, reply) {
                if (err) return cb(err.toString());
                msg.tableNumber = table_number;
                return cb(null, msg);
            });
        },
        function (orderInfo, cb) { // 2.0 向服务器同步订单
                async.eachLimit(orderList, 1, function (orderItem, e_cb) {// 同步之前，先将本地的订单同步状态改成未同步
                    orderModel.updateById(orderItem.id, lastSyncOrderInfo, function (err) {
                        return e_cb(err, null)
                    })
                }, function (err) {
                    if (err) {
                        cb(err)
                    } else {
                        updateData.push({ order: orderList })
                        webSocketClient.orderPay(msg.orderId, msg.payMode, orderPaymentItems, lastSyncOrderInfo.lastSyncTime, 1, function () {});
                        mqttClient.weChatPush('order', 'orderPay', msg.orderId, { // 买单
                            type: "orderPay",
                            orderId: msg.orderId,
                            payMode: msg.payMode,
                            isPosPay: 1,
                            lastSyncTime: lastSyncOrderInfo.lastSyncTime,
                            syncState: 1,
                            orderPayment: orderPaymentItems || [],
                        })
                        cb(null, null)
                    }

                })
        },
    ],
        function (error, orderInfo) {
            error ? callback(error, msg) : callback(null, msg)
        }
    )
};

/**
 * 订单采集
 * @param topic
 * @param msg
 * @param callback
 * @returns {*}
 */
exports.orderGatherBydate = function (topic,msg, callback) {

    if (!msg.date) return callback('order date is null ');
    let where = {
            accounting_time:msg.date
        };
    let content = msg.content;
    let arr = topic.split("/");

    let platform = arr[1],brand_id = arr[2],shop_id = arr[2],group = arr[4], action = arr[5],identification =arr[6] ;

    if(content){
        where = {
            $or : [
                {id : {"$like":`%${content}%`}},
                {serial_number : {"$like":`%${content}%`}},
                {parent_order_id : {"$like":`%${content}%`}},
            ]
        };
    }
    orderModel.findAllIdByConditions(where,(err,arrId)=>{
        if (err) return callback(err);
        if (arrId.length == 0) callback(`arrId  is null`);
        async.eachLimit(arrId, 1, function (item, cb) {
            async.parallel({
                tb_order: (done)=>{
                    customSqlModel.getAllCustomSqlInfo(`SELECT * from tb_order WHERE id  = '${item.id}'`, done)
                },
                tb_order_item: (done)=>{
                    customSqlModel.getAllCustomSqlInfo(`SELECT * from tb_order_item WHERE order_id  = '${item.id}'`, done)
                },
                tb_order_payment_item: (done)=>{
                    customSqlModel.getAllCustomSqlInfo(`SELECT * from tb_order_payment_item WHERE order_id  = '${item.id}'`, done)
                },
            },(error, results)=>{
                if (error) return cb(error);
                let requestData = {
                    tb_order:results.tb_order,
                    tb_order_item:results.tb_order_item,
                    tb_order_payment_item:results.tb_order_payment_item
                };
                requestUtil.admin_put(`new`,requestData,cb)
            });
        }, (err) =>{
            if(err) return callback(err);
            callback();
        });
    })
};
