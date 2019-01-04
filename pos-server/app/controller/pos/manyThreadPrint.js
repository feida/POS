/**
 * @author wxh on 2018/6/4
 * @copyright
 * @desc
 */
const result = require("../../util/resultUtil");
const dateUtil = require("../../util/dateUtil");
const generalUtil = require("../../util/generalUtil");
const { log } = require("../../util/fileUtil");
const httpClient = require("../../util/httpClient");

const async = require("async");
const lodash = require("lodash");
const moment = require("moment");

const orderModel = require("../../model/pos/order");
const articleModel = require("../../model/pos/article");
const orderItemModel = require("../../model/pos/orderItem");
const printerModel = require("../../model/pos/printer");
const printerServiceModel = require("../../model/printer-connector/printerService");
const shopDetailModel = require("../../model/pos/shopDetail");
const articleKitchenModel = require("../../model/pos/articleKitchen");
const kitchenGroupDetailModel = require("../../model/pos/kitchenGroupDetail");
const articleKitchenPrinterModel = require("../../model/pos/articleKitchenPrinter");
const kitchenPrinterModel = require("../../model/pos/kitchenPrinter");
const printTemplateModel = require("../../constant/printTemplateModel");


//  厨打打印次数
let printKitchenExecuteNumber = {};

// 历史厨房组、厨房记录
let kitchenAllocation = [];
/**
 * 动线厨打
 * @param msg
 * @param callback
 * @returns {*}
 */
exports.printNewKitchen = function (msg, callback) {

    let orderId = msg.orderId;

    let autoPrint = msg.autoPrint || 0;   // 1; 自动 0 手动
    let totalType = msg.totalType || 1;   // 1=先付， 2=后付消费、3= 后付结算
    let refund = msg.refund || 0;   // 0 不退菜   or  1 退菜
    let orderItemArr = msg.orderItemArr || [];    //退菜对象    orderItemArr:[ {id:"'df0a6deb982b4e57a894ce57f68211c4'",count:2}]
    if (result.isEmpty(orderId)) return callback("请输入订单ID");

    log('多动线厨房打印第一步', `【发起厨房打印】【${autoPrint ? '自动打印' : '手动打印'} 】 orderId：${orderId},refund:${refund},${refund ? "orderItemArr:" + JSON.stringify(orderItemArr) : []}`);

    if (refund != 0) {
        if (typeof orderItemArr != 'object' || orderItemArr.length == 0) {
            return callback && callback("请输入退菜ID");
        } else {
            lodash.forEach(orderItemArr, function (val) {
                lodash.assign(val, { id: "'" + val.id + "'" });
            });
        }
    }

    async.waterfall([
        function (cb) { //关联订单信息
            orderModel.getReceiptsById(orderId, function (error, orderInfo) {
                if (error) return cb(error);
                if (refund == 0) {
                    orderModel.mayThreadByOrderId(orderId, function (error, orderItems) {
                        if (error) return cb(error || '未找到需要打印的菜品');
                        var orderItems = lodash.filter(orderItems, function (o) { return o.orgin_count != o.refund_count; });
                        printerModel.getArticleSort(orderItems, function (e) {
                            orderInfo.orderItems = e;
                            if (!orderInfo.parent_order_id) return cb(null, orderInfo);
                            // 如果存在 父订单，则订单数量 显示 父订单的值
                            orderModel.getReceiptsById(orderInfo.parent_order_id, function (error, parentOrderInfo) {
                                if (error) return cb(error);
                                orderInfo.parentOrderInfo = parentOrderInfo;
                                cb(null, orderInfo);
                            })
                        });
                    });
                } else {
                    orderModel.mayThreadRefundByOrderIds(orderItemArr, function (error, orderItemsReslut) {
                        if (error) return cb(error);
                        let orderItems = [];
                        lodash.forEach(orderItemsReslut, function (val) {
                            let s1 = lodash.find(orderItemArr, function (o) { return o.id == `'${val.id}'` || o.id == `'${val.parent_id}'` });
                            lodash.assign(val, { count: s1.count });
                            orderItems.push(val);
                        });
                        printerModel.getArticleSort(orderItems, function (e) {
                            orderInfo.orderItems = e;
                            if (!orderInfo.parent_order_id) return cb(null, orderInfo);
                            // 如果存在 父订单，则 订单数量 显示 父订单的值
                            orderModel.getReceiptsById(orderInfo.parent_order_id, function (error, parentOrderInfo) {
                                orderInfo.parentOrderInfo = parentOrderInfo;
                                cb(null, orderInfo);
                            })
                        });
                    });
                }
            });
        },
        function (orderInfo, cb) { //获取店铺设置信息
            shopDetailModel.getShopDetailFindOne(function (error, shopDetail) {
                if (error) return cb(error);
                orderInfo.shopDetail = shopDetail;
                cb(null, orderInfo);
            });
        },
        function (orderInfo, cb) { //查询用户信息
            if (!orderInfo.customer_id || orderInfo.customer_id == 0 || orderInfo.customer_id == 'undefined') return cb(null, orderInfo);
            httpClient.network(function () {
                httpClient.post("getCustomerConsumeInfo", { customerId: orderInfo.customer_id }, function (consumeInfo) {
                    orderInfo.consumeInfo = consumeInfo;
                    return cb(null, orderInfo);
                }, function () {
                    return cb(null, orderInfo);
                });
            }, function () {
                return cb(null, orderInfo);
            })
        },
        function (orderInfo, cb) { //厨房分单
            let articleItemsArr = [];
            // console.log('==========orderInfo.orderItems=========',orderInfo.orderItems)
            async.each(orderInfo.orderItems, (item, ab)=> {
                if (!item.kitchen_group_id || item.kitchenGroupStatus == 1){
                    if (item.article_type == 1 )   return ab();
                    articleItemsArr.push(item);
                    return ab();
                }
                let itemKa = lodash.find(kitchenAllocation, (o)=> {  return o.kitchen_group_id ==item.kitchen_group_id;});
                if (!itemKa) kitchenAllocation.push({ kitchen_group_id:item.kitchen_group_id,kitchenUse:[]});

                kitchenGroupDetailModel.getKitchenByKitchenGroupId(item.kitchen_group_id, (err,rely)=> {
                    if (err)   return ab(err);
                    var rely = lodash.filter(rely, function (o) {
                        if (o.begin_time && o.end_time){
                            let currentDate = `${moment().format('YYYY-MM-DD')}`;
                            if (dateUtil.isBetween(`${currentDate} ${o.begin_time}`,`${currentDate} ${o.end_time}`)) return o ;
                        }
                    });
                    let obj = Object.assign({}, item);
                    obj.kitchens = rely;
                    let i = 0;
                    async.whilst(() => {
                            return i < +item.count;
                        }, (ef) => {
                            obj.count = 1;
                            obj.final_price = item.final_price / item.count
                            let itme = Object.assign({}, obj);
                            articleItemsArr.push(itme);
                            i++;
                            setTimeout(ef, 0);
                        }, (err) => {
                            if (err) return ab(err);
                            ab()
                        }
                    );
                });
            }, (err) => {
                orderInfo.orderItems = articleItemsArr;
                return cb(err,orderInfo);
            })
        }
    ], function (err, resultData) {
        console.log('-----------------',err)
        if (err) return callback(err);

        async.eachLimit(resultData.orderItems,1,(item, cb)=> {
            if (item.kitchens.length == 0) return cb();
            let t2 = lodash.find(kitchenAllocation, (o)=> {  return o.kitchen_group_id ==item.kitchen_group_id;});
            if (t2){
                async.eachLimit(item.kitchens, 1, (resly, eb)=> {
                    if (t2.kitchenUse.length < item.kitchens.length){
                        if (t2.kitchenUse.indexOf(resly.kitchen_id) == -1){
                            item.kitchenId = resly.kitchen_id;
                            t2.kitchenUse.push(resly.kitchen_id);
                            return eb('停止1');
                        }else {
                            return eb()
                        }
                    }else if (t2.kitchenUse.length == item.kitchens.length){
                        if (!lodash.find(item.kitchens, (o)=> {return o.kitchen_id ==t2.kitchenUse[0]})){
                            t2.kitchenUse.push(resly.kitchen_id);
                            item.kitchenId = resly.kitchen_id;
                            t2.kitchenUse.splice(0,1);
                            return eb()
                        }else {
                            item.kitchenId = t2.kitchenUse[0];
                            t2.kitchenUse.push(t2.kitchenUse.shift());
                            return eb('停止3');
                        }
                    }else {
                        let objKitchenUse = Object.assign([], t2.kitchenUse);
                        async.eachLimit(objKitchenUse, 1, (itemh, ad)=> {
                            if (!lodash.find(item.kitchens, (o)=> {return o.kitchen_id ==itemh})){
                                t2.kitchenUse.splice(0,1);
                                return ad()
                            }else {
                                item.kitchenId = t2.kitchenUse[0];
                                t2.kitchenUse.push(t2.kitchenUse.shift());
                                return ad('停止3');
                            }
                        },(err)=>{
                            return eb(err);
                        });
                    }
                },(err)=>{
                    cb()
                });
            }else {
                cb()
            }
        },(err)=>{
            if (err) return callback(err);
            resultData.orderItems = lodash.filter(resultData.orderItems, function(o) {
                if (o.kitchens.length>0){
                    return o;
                }
            });

            async.eachLimit(resultData.orderItems,1,(resly, eb)=> {
                async.parallel({
                    kitchenPrinter: (done)=> {
                        kitchenPrinterModel.getPrinterInfoByKitchenId(resly.kitchenId,resultData.distribution_mode_id,(err, ben)=>{
                            return  done(err, ben)
                        });
                    },
                    mealArticleName:  (done)=> {
                        if (resly.mealArticleId){
                            articleModel.findOneInfoById(resly.mealArticleId,(err,benB)=>{
                                return done(err,benB)
                            });
                        }else {
                           return done(null, null)
                        }
                    },
                },  (error, results)=> {
                    if (error)  return eb(error);
                    resly.printerArr = results.kitchenPrinter;

                    resly.mealArticleName = results.mealArticleName? results.mealArticleName.name : results.mealArticleName;
                    return eb()

                });
            },(err)=>{
                if (err) return callback(err);
                let param = {};
                let CUSTOMER_SATISFACTION = (resultData.consumeInfo && resultData.consumeInfo.CUSTOMER_SATISFACTION) || 0;
                param.RESTAURANT_TEL = `${resultData.shopDetail.phone}`;      //电话
                param.DISTRIBUTION_MODE = refund != 0 ? '退菜' : (resultData.distribution_mode_id == 1 ? resultData.parent_order_id ? '堂吃(加)' : '堂吃' : '外带');
                param.TABLE_NUMBER = resultData.shopDetail.shopMode == 2 || resultData.shopDetail.shopMode == 7 ? resultData.ver_code : resultData.table_number;
                let orderNumber = ((resultData.parentOrderInfo && resultData.parentOrderInfo.order_number) || resultData.order_number || '999').toString();//订单号
                param.ORDER_NUMBER = orderNumber.length == 1 ? `00${orderNumber}` : orderNumber.length == 2 ? `0${orderNumber}` : orderNumber;      //订单号//桌号
                param.ORDER_ID = resultData.serial_number;                         //交易流水号
                param.BARCODE = resultData.serial_number.substring(8, 18);                         //条形码
                param.DATETIME = `${moment(+resultData.create_time).format('YYYY-MM-DD HH:mm:ss')}`;           //订单时间
                param.ORIGINAL_AMOUNT = resultData.original_amount;                  //原价
                param.CUSTOMER_SATISFACTION = "★★★★★☆☆☆☆☆".slice(5 - CUSTOMER_SATISFACTION, 10 - CUSTOMER_SATISFACTION);            //客户上次评分分数           //客户上次评分分数
                param.CUSTOMER_SATISFACTION_DEGREE = (resultData.consumeInfo && resultData.consumeInfo.CUSTOMER_SATISFACTION_DEGREE) || 0;     //客户平均评分分数
                param.CUSTOMER_PROPERTY = (resultData.consumeInfo && resultData.consumeInfo.CUSTOMER_PROPERTY) || '-';                //客服余额
                param.MEMO = resultData.remark || '-';//备注
                param.PRINTTEMPLATE = `${printTemplateModel.REPORT}/${printTemplateModel.KITCHEN_TICKET_BARCODE_TEMPLATE_48}`;
                // 打印控制
                printerModel.getTotalTemplate(param, function (data) {
                    let  receiptsResults = [];      //小票需要打印的内容
                    let  stickerResults = [];       //贴纸需要打印的内容
                    async.eachLimit(resultData.orderItems,1,(resly, eb)=> {
                        if (resly.printerArr.length == 0 )  return eb();

                        async.eachLimit(resly.printerArr,1,(printerResly, df)=> {
                            if (printerResly.ticket_type == 0){
                                if (resly.mealArticleName){
                                    data.ITEMS = [
                                        {'ARTICLE_COUNT': resly.count, 'ARTICLE_NAME': resly.mealArticleName},
                                        {'ARTICLE_COUNT': resly.count, 'ARTICLE_NAME': '|_' + resly.article_name}
                                    ];
                                }else {
                                    data.ITEMS = [
                                        {'ARTICLE_COUNT': resly.count, 'ARTICLE_NAME':resly.article_name}
                                    ];
                                }
                                data.ip = printerResly.ip;
                                data.port = printerResly.port;
                                let parentData = Object.assign({}, data);
                                receiptsResults.push(parentData);
                                return df()
                            }else {
                                let lbObj = {
                                    ORDER_ID :resultData.serial_number,
                                    ip: printerResly.ip,
                                    port: printerResly.port,
                                    CODE: `${resultData.shopDetail.shopMode == 2 || resultData.shopDetail.shopMode == 7 ? resultData.ver_code : resultData.table_number}`,
                                    ARTICLE_NAME: printerModel.getArticleNameAndSPEC(resly).ARTICLE_NAME,
                                    ARTICLE_COUNT: resly.count,
                                    ARTICLE_PRICE: printerModel.getArticleNameAndSPEC(resly).ARTICLE_PRICE,
                                    SPEC: printerModel.getArticleNameAndSPEC(resly).SPEC,
                                    RESTAURANT_NAME: `${resultData.shopDetail.name}`,
                                    DISTRIBUTION_MODE: refund != 0 ? '退菜' : (resultData.distribution_mode_id == 1 ? resultData.parent_order_id ? '堂吃(加)' : '堂吃' : '外带'),
                                    CUSTOMER_TEL: `${resultData.shopDetail.phone}`,
                                    PRINTTEMPLATE: `./report/restaurant_label.xml`,
                                    DATETIME: `${moment(+resultData.create_time).format('YYYY-MM-DD HH:mm:ss')}`
                                };
                                let parentData = Object.assign({}, lbObj);
                                stickerResults.push(parentData);
                                return df()
                            }
                        },(err)=>{
                            return eb(err);
                        });
                    },(err)=>{
                       if (err) return callback(err);
                        async.parallel({
                            receiptsResults:  (done)=> {      //小票内容
                                let prList = [];
                                if (receiptsResults.length == 0 )  return done(null,prList);
                                async.eachLimit(receiptsResults,1,  (item, ab)=> {
                                    printerServiceModel.receiptsPrint(item.ip, item.port, param.PRINTTEMPLATE, item, function (err, ben) {
                                        log(`厨房打印==>`, `【小票打印厨打${err ? "失败error==>"+err : "成功==>"+ben}】 订单ID：${orderId},流水号:${param.ORDER_ID},『${JSON.stringify(param)}』\n【打印数据】:${JSON.stringify(data.ITEMS)}`);

                                        err ? prList.push({article:JSON.stringify(item.ITEMS),result:err}) : prList.push({article:JSON.stringify(item.ITEMS),result:ben});
                                        ab()
                                    });
                                },(err)=>{
                                    done(null,prList);
                                });
                            },
                            stickerResults:  (done) =>{     //贴纸内容
                                let lbList = [];
                                if (stickerResults.length == 0 )  return done(null,lbList);
                                let numBer = 1;
                                let numTotal = stickerResults.length;
                                async.eachLimit(stickerResults, 1, (item, ab)=> {
                                    item.ARTICLE_NUMBER= `${numBer}/${numTotal}`;
                                    printerServiceModel.stickersPrint(item.ip, item.port, item.PRINTTEMPLATE, item, function (err, ben) {
                                        numBer++;
                                        log(`贴纸打印==>`, `【贴纸打印厨打${err ? "失败error==>"+err : "成功==>"+ben}】：『${orderId}』, 『refund:${refund}』,『${refund ? "orderItemArr:" + JSON.stringify(orderItemArr) : []}』,\n 『${JSON.stringify(item)}』`);
                                        err ? lbList.push({article:JSON.stringify(item.ITEMS),result:err}) : lbList.push({article:JSON.stringify(item.ITEMS),result:ben});

                                        ab()
                                    })
                                },(err)=>{
                                    done(null,lbList);
                                });
                            },
                        }, function (error, results) {
                            if (error) return callback(error);
                                console.log('打印机结果集:',results);
                                log(`厨房打印分配记录==>${orderId}`, `${JSON.stringify(kitchenAllocation)}`);
                                log(`打印机结果集==>${orderId}`, `${JSON.stringify(results)}`);
                                return callback(null,results);
                        });
                    })
                });
            })
        });
    });
};
