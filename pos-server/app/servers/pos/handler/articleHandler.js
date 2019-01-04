
const moment = require('moment');
const async = require('async');
const customSql = require("../../../model/pos/customSql");
const articleModel = require('../../../model/pos/article');
const articlePriceModel = require('../../../model/pos/articlePrice');
const result = require("../../../util/resultUtil");
const fileUtil = require("../../../util/fileUtil");
const webSocketClient = require("../../../util/webSocketClient")

module.exports = function (app) {
    return new Handler(app);
}

var Handler = function (app) {
    this.app = app;
}

var handler = Handler.prototype;

/**
 * 上下架
 */
handler.articleUpOrDown = function (msg, session, next) {

    //数据非空验证
    if (result.isEmpty(msg.id)) {
        result.error(next, "菜品编号不能为空", msg);
    }
    if (result.isEmpty(msg.activated)) {
        result.error(next, "上下架标识不能为空", msg);
    }

    //上下架参数
    var param = {
        activated: msg.activated
    };

    //手动上下架
    articleModel.updateById(msg.id, param, function (err) { // TODO:
        fileUtil.appendFile(`本地库存${param.activated ? '上架' : '下架'}${err ? '失败' : '成功'}`, `${msg.__route__}=>${err ? JSON.stringify(err.toString()) : null},${JSON.stringify(param)}`);
        if (err) result.error(next, err.toString(), msg);

        webSocketClient.articleActivated(msg.id, msg.activated, () => {}); // push article activated to online service

        result.success(next, null);
    });
}

/**
 * 沽清
 */
handler.articleIsEmpty = function (msg, session, next) {
    //数据非空验证
    if (result.isEmpty(msg.id)) {
        return result.error(next, "菜品编号不能为空", msg);
    }
    if (result.isEmpty(msg.empty)) {
        return result.error(next, "沽清标识不能为空", msg);
    }

    //手动沽清
    var paramArticle = {
        isEmpty: msg.empty,
        currentWorkingStock: 0 //对应库存设置为0
    };
    //沽清
    articleModel.updateById(msg.id, paramArticle, function (err) { // TODO:
        if (err) return result.error(next, err.toString(), msg);
        else {
            //判断对否为老规格
            if (msg.hasArticlePrice) {
                let paramArticlePrice = {
                    currentWorkingStock: 0 //对应库存设置为0
                };
                //更新老规格
                articlePriceModel.updateById(msg.id, paramArticlePrice, function (err) {
                    fileUtil.appendFile(`本地库存沽清${err ? '失败' : '成功'}`, `${msg.__route__}=>${err ? JSON.stringify(err.toString()) : null},${JSON.stringify(paramArticlePrice)}`);
                    if (err) return result.error(next, err.toString(), msg);
                    result.success(next, null);
                });
            }
            result.success(next, null);
        }
    });
}


/**
 * 编辑库存 
 */
handler.articleStock = function (msg, session, next) {
    //数据非空验证

    if (result.isEmpty(msg.id)) {
        result.error(next, "菜品编号不能为空", msg);
        return;
    }
    if (result.isEmpty(msg.currentStock)) {
        result.error(next, "当前库存不能为空", msg);
        return;
    }

    //库存参数
    var paramArticle = {
        currentWorkingStock: msg.currentStock > 0 ? msg.currentStock : 0,
        isEmpty: msg.currentStock <= 0 ? 1 : 0
    };
    //手动修改库存
    articleModel.updateById(msg.id, paramArticle, (err) => {  // TODO:
        fileUtil.appendFile(`本地库存编辑${err ? '失败' : '成功'}`, `${msg.__route__}=>${err ? JSON.stringify(err.toString()) : null},${JSON.stringify(paramArticle)}`);
        if (err) return result.error(next, err.toString(), msg);

        // webSocketClient.editStock(msg.id, msg.currentStock, () => {})
        result.success(next);
    });
}

/**
 * 批量更新库存
 * @param msg
 * @param session
 * @param next
 */
handler.batchUpdateCurrentStock = function (msg, session, next) { // TODO:
    fileUtil.appendFile(`准备批量更新库存`, `${JSON.stringify(msg.dataList)}`);
    if (msg.dataList && msg.dataList.length > 0) {
        let sql = "";
        async.eachLimit(msg.dataList, 1, function (item, callback) {
            if (item.currentWorkingStock == 0) {
                sql = `update tb_article set current_working_stock = 0, is_empty = 1  where id = '${item.id}'`;
            } else {
                sql = `update tb_article set current_working_stock = ${item.currentWorkingStock}, is_empty = 0 where id = '${item.id}'`;
            }
            customSql.getOneCustomSqlInfo(sql, function (error, data) {
                callback && callback(error, data);
            })
        }, function (error, data) {
            fileUtil.appendFile(`批量更新库存${error ? '失败' : '成功'}`, `${msg.__route__}=>${error ? JSON.stringify(err.toString()) : "更新成功：" + msg.dataList.length}`);
            if (error) return result.error(next, error.toString(), msg);
            result.success(next, data);
        });
    } else {
        fileUtil.appendFile(`批量更新库存完成，此店铺的菜品数量为 0 `);
        result.success(next);
    }
}

/**
 * 恢复库存
 * @param msg
 * @param session
 * @param next
 */
handler.recoveryArticle = function (msg, session, next) {
    var sql = "";
    if (`${moment().format('d')}` == (5 || 6)) {
        sql = "update tb_article set  current_working_stock= stock_weekend ,is_empty = 0 WHERE activated = 1";
    } else {
        sql = "update tb_article set  current_working_stock= stock_working_day ,is_empty = 0 WHERE activated = 1";
    }
    customSql.getOneCustomSqlInfo(sql, function (err) {
        fileUtil.appendFile(`恢复库存${err ? '失败' : '成功'}`, `${msg.__route__}=>${err ? JSON.stringify(err.toString()) : null}`);
        if (err) result.error(next, err.toString(), msg);
        result.success(next, null);
    })
}


/**
 * 获取是否有称重菜品
 * @param msg
 * @param session
 * @param next
 */
handler.getOpenCatty= function (msg, session, next) {
    articleModel.findAllInfoByConditions({},(err,relv)=>{
        if (err) result.error(next, err.toString(), msg);
        let obj = {
            status:false
        };
        if (relv.length == 0 )  return result.success(next, obj);
       let item =  relv.filter((item) =>  item.openCatty ==1);
        if (item.length == 0) {
            return result.success(next, obj);
        }else {
            obj.status = true;
            return result.success(next, obj);
        }
    })
}


