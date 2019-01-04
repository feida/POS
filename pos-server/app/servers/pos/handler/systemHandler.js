var fs = require('fs');
var async = require('async');
const syncDataUtil = require('../../../dao/sqlite/pos/initData');
const result = require("../../../util/resultUtil");
const httpClient = require("../../../util/httpClient");
const httpClientConfig = require('../../../dao/config/index').java_server_db;
const fileUtil = require("../../../util/fileUtil");
const {log} = require("../../../util/fileUtil");
const customSqlModel = require("../../../model/pos/customSql");
const msgUtil = require("../../../util/msgUtil")


const changeTable = require("../../../controller/pos/changeTable");
module.exports = function (app) {
    return new Handler(app);
}

var Handler = function (app) {
    this.app = app;
    this.channelService = app.get('channelService');
}

var handler = Handler.prototype;


function Deploy(obj) {
    this.host = obj.host;
    this.port = obj.port;
    this.method = obj.method;
    this.headers = obj.headers;
    this.brandId = obj.brandId;
    this.shopId = obj.shopId;
}

/**
 * 清除激活的 key
 * @param msg
 * @param session
 * @param next
 */
handler.cleanActivationKey = function (msg, session, next) {
    delete httpClientConfig.key;
    delete httpClientConfig.updateTime;
    fs.writeFile('../../../../config/httpClientConfig', JSON.stringify(httpClientConfig), function () {
        result.success(next);
    });
}

/**
 * 用于主动记录 日志
 * @param msg
 * @param session
 * @param next
 */
handler.log = function (msg, session, next) {
    let type = msg.type || "system";
    let content = msg.content || "未知日志";
    fileUtil.appendFile(`${type}`, `${content}`, function () { });
    result.success(next);
};

/**
 * 执行服务器的sql指令
 * @param msg
 * @param session
 * @param next
 */
handler.serverCommand = function (msg, session, next) {

    fileUtil.instructionsLog('serverCommand', `【收到服务器指令】\n  ${JSON.stringify(msg)}\n`);
    if (msg.sql) {
        let sql = msg.sql.toLowerCase();
        if (sql.startsWith("insert") || sql.startsWith("update") || sql.startsWith("delete")) {
            customSqlModel.getOneCustomSqlInfo(sql, function (error) {
                if (error) {
                    fileUtil.instructionsLog('serverCommand', `【执行失败】${sql}\n  ${JSON.stringify(error)}\n`);
                    return result.error(next, error.toString(), msg);
                }
                result.success(next);
            })
        } else if (sql.startsWith("select")) {
            customSqlModel.getAllCustomSqlInfo(sql, function (error, data) {
                if (error) {
                    fileUtil.instructionsLog('serverCommand', `【查询失败】${sql}\n  ${JSON.stringify(error)}\n`);
                    return result.error(next, error.toString(), msg);
                }
                fileUtil.instructionsLog('serverCommand', `【查询的结果】${sql}\n  ${JSON.stringify(data)}\n`);
                result.success(next);
            })
        } else {
            fileUtil.instructionsLog('serverCommand', `【请检查sql语句】${sql}\n`);
        }
    } else {
        fileUtil.instructionsLog('serverCommand', `未输入命令~\n`);
        result.error(next, "未输入命令~", msg)
    }
};


/**
 * 服务器异常，禁止微信下单
 * @param msg
 * @param session
 * @param next
 */
handler.serverError = function (msg, session, next) {
    httpClient.post("serverError", null, function (data) {
        result.success(next);
    });
};

/**
 * 校验订单是否正在微信端发起支付
 * @param msg
 * @param session
 * @param next
 */
handler.checkInWeChatPayment = function (msg, session, next) {

};

/**
 * 同步系统数据库
 * @param msg
 * @param session
 * @param next
 */
handler.syncDatabase = function (msg, session, next) {
    var that = this;
    var channel = this.channelService.getChannel("resto-pos", false);
    var tableCount = 33;
    var currentSchedule = 0;
    console.time("totalTime");
    log('syncDatabase', `【开始更新数据】`);
    // changeTable.getAllTable(msg,function (err, rely) {
    //     if (err || rely.length == 0 ) {
    //         pushSyncDatabaseSuccessMsg(that, session.uid);
    //         next(null);
    //         return
    //     }
    //     tableCount = rely.length;
    //     async.eachLimit(rely, 1, function (item, cb) {
    //         syncDataUtil.updateTableData(item,function () {
    //             log('syncDatabase', `【${item.tableName}更新成功】--》${currentSchedule}`);
    //             currentSchedule = pushSyncDatabaseMsg(that, session.uid, currentSchedule, tableCount);
    //             changeTable.destroyByTableName(item,function (err) {
    //                 cb(err)
    //             });
    //         });
    //     },function (err) {
    //         if (err) {
    //             pushSyncDatabaseError(that, session.uid, err);
    //             return console.error(err.stack);
    //         }
    //         msgUtil.infoNotify('有用户更新数据,请更新数据保存库存一致');
    //         pushSyncDatabaseSuccessMsg(that, session.uid);
    //         next(null);
    //     });
    // });


    // async.waterfall([
    //     function (cb) {
    //         syncDataUtil.InitArea(function () {             //  1、区域表
    //             log('syncDatabase', `【区域表更新成功】--》${currentSchedule}`);
    //             currentSchedule = pushSyncDatabaseMsg(that, session.uid, currentSchedule, tableCount);
    //             cb(null)
    //         })
    //     },
    //     function (cb) {
    //         syncDataUtil.InitArticle(function () {          //  2、菜品表
    //             log('syncDatabase', `【菜品表更新成功】--》${currentSchedule}`);
    //             currentSchedule = pushSyncDatabaseMsg(that, session.uid, currentSchedule, tableCount);
    //             cb(null)
    //         })
    //     },
    //     function (cb) {
    //         syncDataUtil.InitArticleAttr(function () {      //  3、菜品老规格属性表
    //             log('syncDatabase', `【菜品老规格属性表更新成功】--》${currentSchedule}`);
    //             currentSchedule = pushSyncDatabaseMsg(that, session.uid, currentSchedule, tableCount);
    //             cb(null)
    //         })
    //     },
    //     function (cb) {
    //         syncDataUtil.InitArticleFamily(function () {    //  4、菜品分类表
    //             log('syncDatabase', `【菜品分类表更新成功】--》${currentSchedule}`);
    //             currentSchedule = pushSyncDatabaseMsg(that, session.uid, currentSchedule, tableCount);
    //             cb(null)
    //         })
    //     },
    //     function (cb) {
    //         syncDataUtil.InitArticleKitchen(function () {   //  5、菜品出餐厨房表
    //             log('syncDatabase', `【菜品出餐厨房表更新成功】--》${currentSchedule}`);
    //             currentSchedule = pushSyncDatabaseMsg(that, session.uid, currentSchedule, tableCount);
    //             cb(null)
    //         })
    //     },
    //     function (cb) {
    //         syncDataUtil.InitArticlePrice(function () {     //  6、菜品老规格详情表
    //             log('syncDatabase', `【菜品老规格详情表更新成功】--》${currentSchedule}`);
    //             currentSchedule = pushSyncDatabaseMsg(that, session.uid, currentSchedule, tableCount);
    //             cb(null)
    //         })
    //     },
    //     function (cb) {
    //         syncDataUtil.InitArticleUnit(function () {      //  7、菜品老规格属性子项（详情）表
    //             log('syncDatabase', `【菜品老规格属性子项（详情）表更新成功】--》${currentSchedule}`);
    //             currentSchedule = pushSyncDatabaseMsg(that, session.uid, currentSchedule, tableCount);
    //             cb(null)
    //         })
    //     },
    //     function (cb) {
    //         syncDataUtil.InitArticleUnitDetail(function () {//  8、菜品新规格属性子项关联表
    //             log('syncDatabase', `【菜品新规格属性子项关联表更新成功】--》${currentSchedule}`);
    //             currentSchedule = pushSyncDatabaseMsg(that, session.uid, currentSchedule, tableCount);
    //             cb(null)
    //         })
    //     },
    //     function (cb) {
    //         syncDataUtil.InitArticleUnitNew(function () {   //  9、 菜品新规格属性关联表
    //             log('syncDatabase', `【菜品新规格属性关联表更新成功】--》${currentSchedule}`);
    //             currentSchedule = pushSyncDatabaseMsg(that, session.uid, currentSchedule, tableCount);
    //             cb(null)
    //         })
    //     },
    //     function (cb) {
    //         syncDataUtil.InitKitchen(function () {          //  10、出餐厨房表
    //             log('syncDatabase', `【出餐厨房表更新成功】--》${currentSchedule}`);
    //             currentSchedule = pushSyncDatabaseMsg(that, session.uid, currentSchedule, tableCount);
    //             cb(null)
    //         })
    //     },
    //     function (cb) {
    //         syncDataUtil.InitMealAttr(function () {         //  11、套餐属性表
    //             log('syncDatabase', `【套餐属性表更新成功】--》${currentSchedule}`);
    //             currentSchedule = pushSyncDatabaseMsg(that, session.uid, currentSchedule, tableCount);
    //             cb(null)
    //         })
    //     },
    //     function (cb) {
    //         syncDataUtil.InitMealItem(function () {         //  12、套餐属性子项表
    //             log('syncDatabase', `【套餐属性子项表更新成功】--》${currentSchedule}`);
    //             currentSchedule = pushSyncDatabaseMsg(that, session.uid, currentSchedule, tableCount);
    //             cb(null)
    //         })
    //     },
    //     function (cb) {
    //         syncDataUtil.InitPrinter(function () {          //  13、打印机表
    //             log('syncDatabase', `【打印机表更新成功】--》${currentSchedule}`);
    //             currentSchedule = pushSyncDatabaseMsg(that, session.uid, currentSchedule, tableCount);
    //             cb(null)
    //         })
    //     },
    //     function (cb) {
    //         syncDataUtil.InitShopDetail(function () {       //  14、店铺详情表
    //             log('syncDatabase', `【店铺详情表更新成功】--》${currentSchedule}`);
    //             currentSchedule = pushSyncDatabaseMsg(that, session.uid, currentSchedule, tableCount);
    //             cb(null)
    //         })
    //     },
    //     function (cb) {
    //         syncDataUtil.InitTableQrcode(function () {      //  15、桌位表
    //             log('syncDatabase', `【桌位表更新成功】--》${currentSchedule}`);
    //             currentSchedule = pushSyncDatabaseMsg(that, session.uid, currentSchedule, tableCount);
    //             cb(null)
    //         })
    //     },
    //     function (cb) {
    //         syncDataUtil.InitUnit(function () {             //  16、菜品新规格属性表
    //             log('syncDatabase', `【菜品新规格属性表更新成功】--》${currentSchedule}`);
    //             currentSchedule = pushSyncDatabaseMsg(that, session.uid, currentSchedule, tableCount);
    //             cb(null)
    //         })
    //     },
    //     function (cb) {
    //         syncDataUtil.InitUnitDetail(function () {       //  17、菜品新规格属性子项表
    //             log('syncDatabase', `【菜品新规格属性子项表更新成功】--》${currentSchedule}`);
    //             currentSchedule = pushSyncDatabaseMsg(that, session.uid, currentSchedule, tableCount);
    //             cb(null)
    //         })
    //     },
    //     function (cb) {
    //         syncDataUtil.InitUser(function () {             //  18、用户表
    //             log('syncDatabase', `【用户表更新成功】--》${currentSchedule}`);
    //             currentSchedule = pushSyncDatabaseMsg(that, session.uid, currentSchedule, tableCount);
    //             cb(null)
    //         })
    //     },
    //     function (cb) {
    //         syncDataUtil.InitArticleSupportTime(function () {//  19、菜品供应时间表
    //             log('syncDatabase', `【菜品供应时间表更新成功】--》${currentSchedule}`);
    //             currentSchedule = pushSyncDatabaseMsg(that, session.uid, currentSchedule, tableCount);
    //             cb(null)
    //         })
    //     },
    //     function (cb) {
    //         syncDataUtil.InitSupportTime(function () {      //  20、供应时间表
    //             log('syncDatabase', `【供应时间表更新成功】--》${currentSchedule}`);
    //             currentSchedule = pushSyncDatabaseMsg(that, session.uid, currentSchedule, tableCount);
    //             cb(null)
    //         })
    //     },
    //     function (cb) {
    //         syncDataUtil.InitOrderRemark(function () {      //  21、订单备注
    //             log('syncDatabase', `【订单备注表更新成功】--》${currentSchedule}`);
    //             currentSchedule = pushSyncDatabaseMsg(that, session.uid, currentSchedule, tableCount);
    //             cb(null)
    //         })
    //     },
    //     function (cb) {
    //         syncDataUtil.InitRefundRemark(function () {     //  22、退菜备注
    //             log('syncDatabase', `【退菜备注表更新成功】--》${currentSchedule}`);
    //             currentSchedule = pushSyncDatabaseMsg(that, session.uid, currentSchedule, tableCount);
    //             cb(null)
    //         })
    //     },
    //     function (cb) {
    //         syncDataUtil.InitBrandSetting(function () {     //  23、品牌设置
    //             log('syncDatabase', `【品牌设置表更新成功】--》${currentSchedule}`);
    //             currentSchedule = pushSyncDatabaseMsg(that, session.uid, currentSchedule, tableCount);
    //             cb(null)
    //         })
    //     },
    //     function (cb) {
    //         syncDataUtil.InitShopTvConfig(function () {     //  24、电视设置
    //             log('syncDatabase', `【电视设置表更新成功】--》${currentSchedule}`);
    //             currentSchedule = pushSyncDatabaseMsg(that, session.uid, currentSchedule, tableCount);
    //             cb(null)
    //         })
    //     },
    //     function (cb) {
    //         syncDataUtil.InitVirtualProductsList(function () {     //  25、获取虚拟餐包
    //             log('syncDatabase', `【获取虚拟餐包表更新成功】--》${currentSchedule}`);
    //             currentSchedule = pushSyncDatabaseMsg(that, session.uid, currentSchedule, tableCount);
    //             cb(null)
    //         })
    //     },
    //     function (cb) {
    //         syncDataUtil.InitVirtualProductsKitchenList(function () {     //  26、获取虚拟餐包厨房信息
    //             log('syncDatabase', `【获取虚拟餐包厨房信息表更新成功】--》${currentSchedule}`);
    //             currentSchedule = pushSyncDatabaseMsg(that, session.uid, currentSchedule, tableCount);
    //             cb(null)
    //         })
    //     },
    //     function (cb) {
    //         syncDataUtil.InitWeightPackage(function () {     //  27、重量包
    //             log('syncDatabase', `【重量包表更新成功】--》${currentSchedule}`);
    //             currentSchedule = pushSyncDatabaseMsg(that, session.uid, currentSchedule, tableCount);
    //             cb(null)
    //         })
    //     },
    //     function (cb) {
    //         syncDataUtil.InitWeightPackageDetail(function () {     //  28、重量包详情
    //             log('syncDatabase', `【重量包详情表更新成功】--》${currentSchedule}`);
    //             currentSchedule = pushSyncDatabaseMsg(that, session.uid, currentSchedule, tableCount);
    //             cb(null)
    //         })
    //     },
    //     function (cb) {
    //         syncDataUtil.InitSelectKitchenAndPrinterList(function () {     //  29、//查询厨房和打印机
    //             log('syncDatabase', `【查询厨房和打印机表更新成功】--》${currentSchedule}`);
    //             currentSchedule = pushSyncDatabaseMsg(that, session.uid, currentSchedule, tableCount);
    //             cb(null)
    //         })
    //     },
    //     function (cb) {
    //         syncDataUtil.InitSelectArticleAndKitchenGroupList(function () {     //  30、//查询菜品和厨房和打印机
    //             log('syncDatabase', `【查询厨房和打印机表更新成功】--》${currentSchedule}`);
    //             currentSchedule = pushSyncDatabaseMsg(that, session.uid, currentSchedule, tableCount);
    //             cb(null)
    //         })
    //     },
    //     function (cb) {
    //         syncDataUtil.InitSelectKitchenGroupAndKitchenList(function () {     //  31、//查询厨房组和厨房
    //             log('syncDatabase', `【查询厨房组和厨房表更新成功】--》${currentSchedule}`);
    //             currentSchedule = pushSyncDatabaseMsg(that, session.uid, currentSchedule, tableCount);
    //             cb(null)
    //         })
    //     },
    //     function (cb) {
    //         syncDataUtil.InitSelectKitchenGroupList(function (err,data) {     //  32、//  查询厨房组列表
    //             log('syncDatabase', `【查询厨房组列表表更新成功】--》${currentSchedule}`);
    //             currentSchedule = pushSyncDatabaseMsg(that, session.uid, currentSchedule, tableCount);
    //             cb(null)
    //         })
    //     },
    //     function (cb) {
    //         syncDataUtil.InitSelectRecommendList(function (err,data) {     //  33、//  查询推荐餐品表
    //             log('syncDatabase', `【查询推荐餐品表表更新成功】--》${currentSchedule}`);
    //             currentSchedule = pushSyncDatabaseMsg(that, session.uid, currentSchedule, tableCount);
    //             cb(null)
    //         })
    //     },
    //     function (cb) {
    //         syncDataUtil.InitSelectRecommendArticleList(function (err,data) {     //  34、// 推荐餐品关联菜品表
    //             log('syncDatabase', `【查询推荐餐品关联菜品表表更新成功】--》${currentSchedule}`);
    //             currentSchedule = pushSyncDatabaseMsg(that, session.uid, currentSchedule, tableCount);
    //             cb(null)
    //         })
    //     }
    // ], function (err, result) {
    //     if (err) {
    //         pushSyncDatabaseError(that, session.uid, err);
    //         return console.error(err.stack);
    //     }
    //     msgUtil.infoNotify('有用户更新数据,请更新数据保存库存一致');
    //     pushSyncDatabaseSuccessMsg(that, session.uid);
    //     next(null);
    // });

    async.parallel({
        sync1: function(done){
            syncDataUtil.InitArea(function () {             //  1、区域表
                log('syncDatabase', `【区域表更新成功】--》${currentSchedule}`);
                currentSchedule = pushSyncDatabaseMsg(that, session.uid, currentSchedule, tableCount);
                done(null)
            })
        },
        sync2: function(done){
            syncDataUtil.InitArticle(function () {          //  2、菜品表
                log('syncDatabase', `【菜品表更新成功】--》${currentSchedule}`);
                currentSchedule = pushSyncDatabaseMsg(that, session.uid, currentSchedule, tableCount);
                done(null)
            })
        },
        sync3:function (done) {
            syncDataUtil.InitArticleAttr(function () {      //  3、菜品老规格属性表
                log('syncDatabase', `【菜品老规格属性表更新成功】--》${currentSchedule}`);
                currentSchedule = pushSyncDatabaseMsg(that, session.uid, currentSchedule, tableCount);
                done(null)
            })
        },
        sync4:function (done) {
            syncDataUtil.InitArticleFamily(function () {    //  4、菜品分类表
                log('syncDatabase', `【菜品分类表更新成功】--》${currentSchedule}`);
                currentSchedule = pushSyncDatabaseMsg(that, session.uid, currentSchedule, tableCount);
                done(null)
            })
        },
        sync5:function (done) {
            syncDataUtil.InitArticleKitchen(function () {   //  5、菜品出餐厨房表
                log('syncDatabase', `【菜品出餐厨房表更新成功】--》${currentSchedule}`);
                currentSchedule = pushSyncDatabaseMsg(that, session.uid, currentSchedule, tableCount);
                done(null)
            })
        },
        sync6:function (done) {
            syncDataUtil.InitArticlePrice(function () {     //  6、菜品老规格详情表
                log('syncDatabase', `【菜品老规格详情表更新成功】--》${currentSchedule}`);
                currentSchedule = pushSyncDatabaseMsg(that, session.uid, currentSchedule, tableCount);
                done(null)
            })
        },
        sync7:function (done) {
            syncDataUtil.InitArticleUnit(function () {      //  7、菜品老规格属性子项（详情）表
                log('syncDatabase', `【菜品老规格属性子项（详情）表更新成功】--》${currentSchedule}`);
                currentSchedule = pushSyncDatabaseMsg(that, session.uid, currentSchedule, tableCount);
                done(null)
            })
        },
        sync8:function (done) {
            syncDataUtil.InitArticleUnitDetail(function () {//  8、菜品新规格属性子项关联表
                log('syncDatabase', `【菜品新规格属性子项关联表更新成功】--》${currentSchedule}`);
                currentSchedule = pushSyncDatabaseMsg(that, session.uid, currentSchedule, tableCount);
                done(null)
            })
        },
        sync9:function (done) {
            syncDataUtil.InitArticleUnitNew(function () {   //  9、 菜品新规格属性关联表
                log('syncDatabase', `【菜品新规格属性关联表更新成功】--》${currentSchedule}`);
                currentSchedule = pushSyncDatabaseMsg(that, session.uid, currentSchedule, tableCount);
                done(null)
            })
        },
        sync10:function (done) {
            syncDataUtil.InitKitchen(function () {          //  10、出餐厨房表
                log('syncDatabase', `【出餐厨房表更新成功】--》${currentSchedule}`);

                currentSchedule = pushSyncDatabaseMsg(that, session.uid, currentSchedule, tableCount);
                done(null)
            })
        },
        sync11:function (done) {
            syncDataUtil.InitMealAttr(function () {         //  11、套餐属性表
                log('syncDatabase', `【套餐属性表更新成功】--》${currentSchedule}`);
                currentSchedule = pushSyncDatabaseMsg(that, session.uid, currentSchedule, tableCount);
                done(null)
            })
        },
        sync12:function (done) {
            syncDataUtil.InitMealItem(function () {         //  12、套餐属性子项表
                log('syncDatabase', `【套餐属性子项表更新成功】--》${currentSchedule}`);
                currentSchedule = pushSyncDatabaseMsg(that, session.uid, currentSchedule, tableCount);
                done(null)
            })
        },
        sync13:function (done) {
            syncDataUtil.InitPrinter(function () {          //  13、打印机表
                log('syncDatabase', `【打印机表更新成功】--》${currentSchedule}`);
                currentSchedule = pushSyncDatabaseMsg(that, session.uid, currentSchedule, tableCount);
                done(null)
            })
        },
        sync14:function (done) {
            syncDataUtil.InitShopDetail(function () {       //  14、店铺详情表
                log('syncDatabase', `【店铺详情表更新成功】--》${currentSchedule}`);
                currentSchedule = pushSyncDatabaseMsg(that, session.uid, currentSchedule, tableCount);
                done(null)
            })
        },
        sync15:function (done) {
            syncDataUtil.InitTableQrcode(function () {      //  15、桌位表
                log('syncDatabase', `【桌位表更新成功】--》${currentSchedule}`);
                currentSchedule = pushSyncDatabaseMsg(that, session.uid, currentSchedule, tableCount);
                done(null)
            })
        },
        sync16:function (done) {
            syncDataUtil.InitUnit(function () {             //  16、菜品新规格属性表
                log('syncDatabase', `【菜品新规格属性表更新成功】--》${currentSchedule}`);
                currentSchedule = pushSyncDatabaseMsg(that, session.uid, currentSchedule, tableCount);
                done(null)
            })
        },
        sync17:function (done) {
            syncDataUtil.InitUnitDetail(function () {       //  17、菜品新规格属性子项表
                log('syncDatabase', `【菜品新规格属性子项表更新成功】--》${currentSchedule}`);
                currentSchedule = pushSyncDatabaseMsg(that, session.uid, currentSchedule, tableCount);
                done(null)
            })
        },
        sync18:function (done) {
            syncDataUtil.InitUser(function () {             //  18、用户表
                log('syncDatabase', `【用户表更新成功】--》${currentSchedule}`);
                currentSchedule = pushSyncDatabaseMsg(that, session.uid, currentSchedule, tableCount);
                done(null)
            })
        },
        sync19:function (done) {
            syncDataUtil.InitArticleSupportTime(function () {//  19、菜品供应时间表
                log('syncDatabase', `【菜品供应时间表更新成功】--》${currentSchedule}`);
                currentSchedule = pushSyncDatabaseMsg(that, session.uid, currentSchedule, tableCount);
                done(null)
            })
        },
        sync20:function (done) {
            syncDataUtil.InitSupportTime(function () {      //  20、供应时间表
                log('syncDatabase', `【供应时间表更新成功】--》${currentSchedule}`);
                currentSchedule = pushSyncDatabaseMsg(that, session.uid, currentSchedule, tableCount);
                done(null)
            })
        },
        sync21:function (done) {
            syncDataUtil.InitOrderRemark(function () {      //  21、订单备注
                log('syncDatabase', `【订单备注表更新成功】--》${currentSchedule}`);
                currentSchedule = pushSyncDatabaseMsg(that, session.uid, currentSchedule, tableCount);
                done(null)
            })
        },
        sync22:function (done) {
            syncDataUtil.InitRefundRemark(function () {     //  22、退菜备注
                log('syncDatabase', `【退菜备注表更新成功】--》${currentSchedule}`);
                currentSchedule = pushSyncDatabaseMsg(that, session.uid, currentSchedule, tableCount);
                done(null)
            })
        },
        sync23:function (done) {
            syncDataUtil.InitBrandSetting(function () {     //  23、品牌设置
                log('syncDatabase', `【品牌设置表更新成功】--》${currentSchedule}`);
                currentSchedule = pushSyncDatabaseMsg(that, session.uid, currentSchedule, tableCount);
                done(null)
            })
        },
        sync24:function (done) {
            syncDataUtil.InitShopTvConfig(function () {     //  24、电视设置
                log('syncDatabase', `【电视设置表更新成功】--》${currentSchedule}`);
                currentSchedule = pushSyncDatabaseMsg(that, session.uid, currentSchedule, tableCount);
                done(null)
            })
        },
        sync25:function (done) {
            syncDataUtil.InitVirtualProductsList(function () {     //  25、获取虚拟餐包
                log('syncDatabase', `【获取虚拟餐包表更新成功】--》${currentSchedule}`);
                currentSchedule = pushSyncDatabaseMsg(that, session.uid, currentSchedule, tableCount);
                done(null)
            })
        },
        sync26:function (done) {
            syncDataUtil.InitVirtualProductsKitchenList(function () {     //  26、获取虚拟餐包厨房信息
                log('syncDatabase', `【获取虚拟餐包厨房信息表更新成功】--》${currentSchedule}`);
                currentSchedule = pushSyncDatabaseMsg(that, session.uid, currentSchedule, tableCount);
                done(null)
            })
        },
        sync27:function (done) {
            syncDataUtil.InitWeightPackage(function () {     //  27、重量包
                log('syncDatabase', `【重量包表更新成功】--》${currentSchedule}`);
                currentSchedule = pushSyncDatabaseMsg(that, session.uid, currentSchedule, tableCount);
                done(null)
            })
        },
        sync28:function (done) {
            syncDataUtil.InitWeightPackageDetail(function () {     //  28、重量包详情
                log('syncDatabase', `【重量包详情表更新成功】--》${currentSchedule}`);
                currentSchedule = pushSyncDatabaseMsg(that, session.uid, currentSchedule, tableCount);
                done(null)
            })
        },
        sync29:function (done) {
            syncDataUtil.InitSelectKitchenAndPrinterList(function () {     //  29、//查询厨房和打印机
                log('syncDatabase', `【查询厨房和打印机表更新成功】--》${currentSchedule}`);
                currentSchedule = pushSyncDatabaseMsg(that, session.uid, currentSchedule, tableCount);
                done(null)
            })
        },
        sync30:function (done) {
            syncDataUtil.InitSelectArticleAndKitchenGroupList(function () {     //  30、//查询菜品和厨房和打印机
                log('syncDatabase', `【查询厨房和打印机表更新成功】--》${currentSchedule}`);
                currentSchedule = pushSyncDatabaseMsg(that, session.uid, currentSchedule, tableCount);
                done(null)
            })
        },
        sync31:function (done) {
            syncDataUtil.InitSelectKitchenGroupAndKitchenList(function () {     //  31、//查询厨房组和厨房
                log('syncDatabase', `【查询厨房组和厨房表更新成功】--》${currentSchedule}`);
                currentSchedule = pushSyncDatabaseMsg(that, session.uid, currentSchedule, tableCount);
                done(null)
            })
        },
        sync32:function (done) {
            syncDataUtil.InitSelectKitchenGroupList(function (err,data) {     //  32、//  查询厨房组列表
                log('syncDatabase', `【查询厨房组列表表更新成功】--》${currentSchedule}`);
                currentSchedule = pushSyncDatabaseMsg(that, session.uid, currentSchedule, tableCount);
                done(null)
            })
        },
        sync33:function (done) {
            syncDataUtil.InitSelectRecommendList(function (err,data) {     //  33、//  查询推荐餐品表
                log('syncDatabase', `【查询推荐餐品表表更新成功】--》${currentSchedule}`);
                currentSchedule = pushSyncDatabaseMsg(that, session.uid, currentSchedule, tableCount);
                done(null)
            })
        },
        sync34:function (done) {
            syncDataUtil.InitSelectRecommendArticleList(function (err,data) {     //  34、// 推荐餐品关联菜品表
                log('syncDatabase', `【查询推荐餐品关联菜品表表更新成功】--》${currentSchedule}`);
                currentSchedule = pushSyncDatabaseMsg(that, session.uid, currentSchedule, tableCount);
                done(null)
            })
        }
    },function(err, result){
            if (err) {
                pushSyncDatabaseError(that, session.uid, err);
                return console.error(err.stack);
            }
            msgUtil.infoNotify('有用户更新数据,请更新数据保存库存一致');
            pushSyncDatabaseSuccessMsg(that, session.uid);
            next(null);
    });
};

var pushSyncDatabaseMsg = function (app, uid, currentSchedule, tableCount) {
    pushMsg(app, "syncDatabase", { schedule: parseInt(currentSchedule / tableCount * 100) }, uid);
    return ++currentSchedule;
};

var pushSyncDatabaseSuccessMsg = function (app, uid) {
    pushMsg(app, "syncDatabaseSuccess", {}, uid);
};

var pushSyncDatabaseError = function (app, uid, err) {
    pushMsg(app, "syncDatabaseError", { error: err }, uid);
};

//  单独发送至 一个特定用户
var pushMsg = function (app, route, msg, uid) {
    app.channelService.pushMessageByUids(route, msg, [{
        uid: uid,
        sid: "connector-server-1"
    }]);
};
