/**
 * Created by Lmx on 2017/5/17.
 */
const customSql = require("../../../model/pos/customSql");
const customSqlModel = require("../../../model/pos/customSql");
const shopDetailModel = require("../../../model/pos/shopDetail");
const tableQrcodeMode = require("../../../model/pos/tableQrcode");
const orderMode = require("../../../model/pos/order");
const orderState = require("../../../constant/OrderState");
const result = require("../../../util/resultUtil");
const tableQrcodeState = require("../../../constant/TableQrcodeState");
const webSocketClient = require("../../../util/webSocketClient");
var async = require('async');
const orderController = require("../../../controller/pos/order");
const msgUtil = require("../../../util/msgUtil")

module.exports = function (app) {
    return new Handler(app);
}

var Handler = function (app) {
    this.app = app;
}

var handler = Handler.prototype;

/**
 * tableQrcode conn
 * @param msg
 * @param session
 * @param next
 */
handler.test = function (msg, session, next) {
    result.success(next);
}

/**
 * 获取 桌位 集合
 * @param msg
 * @param session
 * @param next
 */
handler.list = function (msg, session, next) {
    let sql = "select * from tb_table_qrcode";
    customSql.getAllCustomSqlInfo(sql, function (error, data) {
        if (error) return result.error(next, error.toString(), msg);
        result.success(next, data);
    })
};

/**
 * 分页获取 所有桌位 集合
 * @param msg
 * @param session
 * @param next
 */
handler.pageList = function (msg, session, next) {
    let condition = {};
    condition.page_skip = msg.page_skip;
    condition.page_size = msg.page_size;
    async.parallel({
        list: function (cb) {
            var sql = `select * from tb_table_qrcode  order by table_number  asc limit ${condition.page_skip},${condition.page_size}`;
            customSqlModel.getAllCustomSqlInfo(sql, function (error, data) {
                if (error) return cb(error);
                cb(null, data)
            });
        },
        count: function (cb) {
            var sql = `SELECT count(*) count from tb_table_qrcode`;
            customSqlModel.getOneCustomSqlInfo(sql, function (error, data) {
                if (error) return cb(error);
                cb(null, data.count)
            });
        },
    }, function (error, reply) {
        if (error) {
            result.error(next, error.toString(), msg)
        }
        let results = {};
        results.list = reply.list;
        results.totalPage = Math.ceil(reply.count / msg.page_size) || 1;
        results.curPage = msg.page_index;
        results.sizePage = msg.page_size;
        result.success(next, results);
    });
};


/**
 * 分页获取 所有桌位 集合
 * @param msg
 * @param session
 * @param next
 */
handler.getAllTableAndOrder = function (msg, session, next) {
    let searchCondition = '';
    if (msg.search_code) {
        searchCondition += `where table_number like '%${msg.search_code}%'`;
    }
    let condition = {};
    condition.page_skip = msg.page_skip;
    condition.page_size = msg.page_size;
    condition.distributionMode = msg.distributionMode || 1;
    async.parallel({
        list: function (cb) {
            var sql = `
            SELECT
                tableNumber.id,tableNumber.table_number,tableNumber.customer_count,
                tableNumber.table_state,tableNumber.area_id ,orders.id order_id ,
                orders.totalAmount ,
                orders.customer_count order_customer_count,
                orders.accounting_time,
                orders.order_state,
                orders.production_status,
                orders.article_count,
                orders.serial_number,
                orders.create_time,
                orders.service_price,
                orders.ver_code,
                orders.customer_id
                FROM
                    (
                        SELECT
                            *
                        FROM
                            tb_table_qrcode tq
                        ${searchCondition}  
                        ORDER BY
                            table_number ASC
                        limit ${condition.page_skip},${condition.page_size}
                    ) tableNumber
                LEFT JOIN (
                    SELECT
                        CASE
                    WHEN r.amount_with_children > 0 THEN
                        r.amount_with_children
                    ELSE
                        r.order_money
                    END totalAmount,
                        r.*
                FROM
                    (
                        SELECT
                            *
                        FROM
                            tb_order
                        WHERE
                            order_state = 1 and 
                            accounting_time
                            BETWEEN  strftime('%Y-%m-%d', datetime('now','-1 day'))  and strftime('%Y-%m-%d', datetime('now','localtime')) 
                            AND (parent_order_id IS NULL or parent_order_id ='') AND distribution_mode_id = ${condition.distributionMode}
                        ORDER BY
                            create_time DESC
                    ) r
                GROUP BY
                    r.table_number
                ) orders ON tableNumber.table_number = orders.table_number;
            `;
            customSqlModel.getAllCustomSqlInfo(sql, function (error, data) {
                if (error) return cb(error);
                cb(null, data)
            });
        },
        count: function (cb) {
            var sql = `SELECT count(*) count from tb_table_qrcode`;
            customSqlModel.getOneCustomSqlInfo(sql, function (error, data) {
                if (error) return cb(error);
                cb(null, data.count)
            });
        }
    }, function (error, reply) {
        if (error) {
            console.log(`--------`,error)
            result.error(next, error.toString(), msg)
        }
        let results = {};
        results.list = reply.list;
        results.totalPage = Math.ceil(reply.count / msg.page_size) || 1;
        results.curPage = msg.page_index;
        results.sizePage = msg.page_size;
        result.success(next, results);
    });
};

/**
 * 根据获取桌位
 * @param msg
 * @param session
 * @param next
 */
handler.listByAreaId = function (msg, session, next) {
    let condition = {};
    condition.page_skip = msg.page_skip;
    condition.page_size = msg.page_size;
    condition.area_id = msg.areaId;
    async.parallel({
        list: function (cb) {
            var sql = `select * from tb_table_qrcode  where  area_id = ${condition.area_id} order by table_number   asc  limit ${condition.page_skip},${condition.page_size}`;
            customSqlModel.getAllCustomSqlInfo(sql, function (error, data) {
                if (error) return cb(error);
                cb(null, data)
            });
        },
        count: function (cb) {
            var sql = `SELECT count(*) count from tb_table_qrcode where  area_id = ${condition.area_id}`;
            customSqlModel.getOneCustomSqlInfo(sql, function (error, data) {
                if (error) return cb(error);
                cb(null, data.count)
            });
        },
    }, function (error, reply) {
        if (error) {
            result.error(next, error.toString(), msg)
        }
        let results = {};
        results.list = reply.list;
        results.totalPage = Math.ceil(reply.count / msg.page_size) || 1;
        results.curPage = msg.page_index;
        results.sizePage = msg.page_size;
        result.success(next, results);
    });
};


/**
 * 根据获取桌位
 * @param msg
 * @param session
 * @param next
 */
handler.getAllTableAndOrderByAreaId = function (msg, session, next) {

    let searchCondition = '';
    if (msg.search_code) {
        searchCondition += ` and  table_number like '%${msg.search_code}%'`;
    }

    let condition = {};
    condition.page_skip = msg.page_skip;
    condition.page_size = msg.page_size;
    condition.area_id = msg.areaId;
    condition.distributionMode = msg.distributionMode || 1;
    async.parallel({
        list: function (cb) {
            var sql = `
            SELECT
                tableNumber.id,tableNumber.table_number,tableNumber.customer_count,
                tableNumber.table_state,tableNumber.area_id ,orders.id order_id ,
                orders.totalAmount ,
                orders.customer_count order_customer_count,
                orders.accounting_time,
                orders.order_state,
                orders.production_status,
                orders.article_count,
                orders.serial_number,
                orders.create_time,
                orders.service_price,
                orders.ver_code,
                orders.customer_id
                FROM
                    (
                        SELECT
                            *
                        FROM
                            tb_table_qrcode tq
                        where  
                            area_id = ${condition.area_id}
                            ${searchCondition}
                        ORDER BY
                            table_number ASC
                        limit ${condition.page_skip},${condition.page_size}
                    ) tableNumber
                LEFT JOIN (
                    SELECT
                        CASE
                    WHEN r.amount_with_children > 0 THEN
                        r.amount_with_children
                    ELSE
                        r.order_money
                    END totalAmount,
                        r.*
                FROM
                    (
                        SELECT
                            *
                        FROM
                            tb_order
                        WHERE
                            order_state = 1 and 
                            accounting_time
                            BETWEEN  strftime('%Y-%m-%d', datetime('now','-1 day'))  and strftime('%Y-%m-%d', datetime('now','localtime')) 
                            AND (parent_order_id IS NULL or parent_order_id ='') AND distribution_mode_id = ${condition.distributionMode}
                        ORDER BY
                            create_time DESC
                    ) r
                GROUP BY
                    r.table_number
                ) orders ON tableNumber.table_number = orders.table_number;
            `;
            customSqlModel.getAllCustomSqlInfo(sql, function (error, data) {
                if (error) return cb(error);
                cb(null, data)
            });
        },
        count: function (cb) {
            var sql = `SELECT count(*) count from tb_table_qrcode where  area_id = ${condition.area_id}`;
            customSqlModel.getOneCustomSqlInfo(sql, function (error, data) {
                if (error) return cb(error);
                cb(null, data.count)
            });
        },
    }, function (error, reply) {
        if (error) {
            result.error(next, error.toString(), msg)
        }
        let results = {};
        results.list = reply.list;
        results.totalPage = Math.ceil(reply.count / msg.page_size) || 1;
        results.curPage = msg.page_index;
        results.sizePage = msg.page_size;
        result.success(next, results);
    });
};

/**
 * 换 桌位 
 * @param msg
 * @param session
 * @param next
 */
handler.changeTableNum = function (msg, session, next) {

    orderController.changeTableNum(msg, (err, resultData) => {
        if (err) {
            result.error(next, err.toString(), msg)
        } else {
            msgUtil.pushAll('event', {
                type: 'normalOrder',
                eventType: 'changeTable',
                data: resultData,
                ignoreUser: msg.uid,
                msg: `【${msg.fromTableNumber}号】桌位换到【${msg.toTableNumber}】成功！`,
            })
            result.success(next, resultData);
        }
    })
}

// handler.changeTableNum = function (msg, session, next) {
//
//     if (result.isEmpty(msg.orderId)) return result.error(next, "主订单编号不能为空", msg);
//     if (result.isEmpty(msg.fromTableNumber)) return result.error(next, "原桌号不能为空", msg);
//     if (result.isEmpty(msg.toTableNumber)) return result.error(next, "请选择新桌号", msg);
//     msg.lastSyncTime = new Date().getTime();
//
//     async.waterfall([
//         function (cb) { //查询店铺模式
//             shopDetailModel.getShopDetailInfo('', function (err, ben) {
//                 if (err) return cb(err.toString());
//                 msg.allowFirstPay = ben.allowFirstPay;
//                 cb(null, msg)
//             });
//         },
//         function (msg,cb) { //判断目标桌子是否被占用
//             if (msg.allowFirstPay == 0){
//                 return cb(null, msg);
//             } else {
//                 let sql = `SELECT table_state from tb_table_qrcode where table_number = ${msg.toTableNumber}`;
//                 customSql.getOneCustomSqlInfo(sql, function (err, data) { // TODO:
//                     if (err) {
//                         return cb(err.toString());
//                     } else if (data) {
//                         data.table_state == 0 ?  cb(null, msg):  cb("当前桌位被占用！");
//                     } else {
//                         return cb("新桌位不存在！");
//                     }
//                 });
//             }
//         },
//         function (msg, cb) { //解除原桌位的锁定状态
//             tableQrcodeMode.releaseTable(msg.fromTableNumber, function (error) {
//                 cb(error || null, msg);
//             });
//         },
//         function (msg, cb) { //锁定新桌位
//             if (msg.allowFirstPay == 0 )  return cb( null, msg);
//             tableQrcodeMode.lockingTable(msg.toTableNumber, function (error) {
//                 cb(error || null, msg);
//             });
//         },
//         function (msg, cb) { //更新订单中的桌号
//             var orderInfo = {
//                 id: msg.orderId,
//                 tableNumber: msg.toTableNumber,
//                 lastSyncTime: msg.lastSyncTime,
//                 syncState: 0
//             };
//             //先更新主订单 在更新子订单
//             orderMode.updateById(msg.orderId, orderInfo, function (err) { // TODO:
//                 if (err) cb(err.toString());
//                 //查询是否存在子订单
//                 let sql = `select count(parent_order_id) count from tb_order where parent_order_id = '${msg.orderId}';`;
//                 customSql.getOneCustomSqlInfo(sql, function (err, data) { // TODO:
//                     if (err) cb(err.toString());
//
//                     if (data.count > 0) {
//
//                         let childOrderInfoUpdate = {
//                             tableNumber: msg.toTableNumber,
//                             lastSyncTime: msg.lastSyncTime,
//                             syncState: 0
//                         };
//                         let childOrderConditions = {
//                             parentOrderId: msg.orderId,
//                         };
//                         //更新子订单 // TODO:
//                         orderMode.updateByConditions(childOrderInfoUpdate, childOrderConditions, function (err) {
//                             if (err) cb(err.toString());
//                             cb(null);
//                         });
//                     }
//                     cb(null);
//                 });
//             });
//         }
//     ], function (err, resultData) {
//         if (err) {
//             return result.error(next, err.toString(), msg);
//         } else {
//             webSocketClient.changeTable(msg.orderId, msg.toTableNumber, 1, msg.lastSyncTime, ()=>{})
//             result.success(next, resultData);
//         }
//     });
// }

/**
 * 释放桌位
 * @param msg
 * @param session
 * @param next
 */
handler.releaseTable = function (msg, session, next) {
    var orderParam = {
        id: msg.orderId,
        order_state: orderState.CANCEL
    };
    customSql.updateSelective('tb_order', orderParam, function (error) {
        if (error) {
            result.error(next, error.toString(), msg);
            return;
        }
        let sql = `update tb_table_qrcode set table_state = 0 where table_number = ${msg.tableNumber}`;
        customSql.getAllCustomSqlInfo(sql,function (err,reply) {
            if (err) {
                result.error(next, error.toString(), msg);
                return;
            }

            // 服务器 释放桌位
            result.success(next);
        });
    });
};

/***
 * release
 */
handler.newReleaseTable = function (msg, session, next) {
    let sql = `update tb_table_qrcode set table_state = 0 where table_number = ${msg.tableNumber}`;
    customSql.getAllCustomSqlInfo(sql,function (err,reply) {
        if (err)  return result.error(next, error.toString(), msg);
        // webSocketClient.updateTableNumberState(msg.tableNumber, 0, function (data) {})
        result.success(next, null);
    });
};
