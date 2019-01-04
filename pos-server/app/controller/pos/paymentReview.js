const async = require('async')
const customSqlModel = require("../../model/pos/customSql");
const lodash = require('lodash');
const orderController = require('./order')
const payMode = require("../../constant/PayMode")
const generalUtil = require("../../util/generalUtil");
const dailyLogOperation = require('../../model/pos/dailyLogOperation');
const paymentReview = require('../../model/pos/paymentReview');
const requestUtil = require("../../util/requestUtil");
const dateUtil = require("../../util/dateUtil")
const shopDetail = require('../../../config/shopDetail');
const { log ,appendFile} = require("../../util/fileUtil");

exports.findAllPaymentList = function(msg, callback) {
    let paymentList = []
    let businessData = {}
    var createTime = dateUtil.formatDateTime("yyyy-MM-dd HH:mm:ss")
    async.waterfall([
        function (cb) {
            orderController.business(msg.date, (err, reply) => {
                businessData = reply;
                paymentList.push({ // 营收总额
                    sort            : 1,
                    name            : '营收总额',
                    money           : reply.totalAmount,
                    paymentModeId   : payMode.TOTAL_AMOUNT,
                    operator        : "SYS",
                    auditMoney      : reply.totalAmount,
                    editStatus      : false,
                    createTime      : createTime
                })

                paymentList.push({ // 折扣金额
                    sort            : paymentList.length + 1,
                    name            : '折扣金额',
                    money           : reply.discountAmount,
                    paymentModeId   : payMode.EMERSION_DISCOUNT,
                    operator        : "SYS",
                    auditMoney      : reply.discountAmount,
                    editStatus      : false,
                    createTime      : createTime
                })

                paymentList.push({ // 销售净额
                    sort            : paymentList.length + 1,
                    name            : '净销售额',
                    money           : reply.incomeAmount,
                    paymentModeId   : payMode.TORAL_NET_INCOME,
                    operator        : "SYS",
                    auditMoney      : reply.incomeAmount,
                    editStatus      : false,
                    createTime      : createTime
                })

                paymentList.push({ // 退款金额
                    sort            : paymentList.length + 1,
                    name            : '退款金额',
                    money           : reply.canceledOrderAmount,
                    paymentModeId   : payMode.TOTAL_REFUND,
                    operator        : "SYS",
                    auditMoney      : reply.canceledOrderAmount,
                    editStatus      : false,
                    createTime      : createTime
                })
                cb(null, reply)
            });
        },
        function (reply, cb) {
            var pyList = reply.resourcePaymentList;
            var filterList = [13, 3, 7, 8, 17, 24, 28, 19, 25, 11, 26, 2]

            var paymentItemList = pyList.filter(item => {

                if (filterList.indexOf(item.payment_mode_id) == -1){
                    return item;
                }
            })
            for (let i =  0; i < paymentItemList.length; i++) {
                paymentList.push({ // 退款金额
                    sort            : paymentList.length + 1,
                    name            : payMode.getPaymentNameById(paymentItemList[i].payment_mode_id),
                    money           : paymentItemList[i].payment_mode_id == 12 ? businessData.incomeItems[12] : Number(paymentItemList[i].pay_value),
                    paymentModeId   : paymentItemList[i].payment_mode_id,
                    operator        : "SYS",
                    auditMoney      : paymentItemList[i].payment_mode_id == 12 ? businessData.incomeItems[12] : Number(paymentItemList[i].pay_value),
                    editStatus      : true,
                    createTime      : createTime
                })

            }
            paymentList.push({ // 门店浮出零用金
                sort            : paymentList.length + 1,
                name            : '门店浮出零用金',
                money           : 0,
                paymentModeId   : payMode.EMERSION_CASH_PAY,
                operator        : "SYS",
                auditMoney      : 0,
                editStatus      : true,
                createTime      : createTime
            })
            paymentList.push({ // 门店找出零用金
                sort            : paymentList.length + 1,
                name            : '门店浮出零找金',
                money           : 0,
                paymentModeId   : payMode.EMERSION_INCOME_PAY,
                operator        : "SYS",
                auditMoney      : 0,
                editStatus      : true,
                createTime      : createTime
            })

            paymentList.push({ // 现金合计
                sort            : paymentList.length + 1,
                name            : '现金合计',
                money           : businessData.incomeItems[12] || 0,
                paymentModeId   : payMode.CASH_AMOUNT,
                operator        : "SYS",
                auditMoney      : businessData.incomeItems[12] || 0,
                editStatus      : false,
                createTime      : createTime
            })

            paymentList.push({ // 银行卡合计
                sort            : paymentList.length + 1,
                name            : '银行卡合计',
                money           : businessData.incomeItems[5] || 0,
                paymentModeId   : payMode.BANK_CARD_TOTAL,
                operator        : "SYS",
                auditMoney      : businessData.incomeItems[5] || 0,
                editStatus      : false,
                createTime      : createTime
            })

            let otherMoney = Number(businessData.totalAmount
                - (businessData.incomeItems[12]||0)
                - (businessData.incomeItems[5]||0)).toFixed(2)
            paymentList.push({ // 其它券卡支付 除去现金和银行卡支付
                sort            : paymentList.length + 1,
                name            : '其它卡券支付',
                money           : otherMoney,
                paymentModeId   : payMode.RESTS_COUPON_TOTAL || 0,
                operator        : "SYS",
                auditMoney      :  otherMoney,
                editStatus      : false,
                createTime      : createTime
            })

            paymentList.push({ // 合计
                sort            : paymentList.length + 1,
                name            : '合计',
                money           : businessData.totalAmount || 0,
                paymentModeId   : payMode.TORTAL_MONEY,
                operator        : "SYS",
                auditMoney      : businessData.totalAmount || 0,
                editStatus      : false,
                createTime      : createTime
            })
            cb(null, paymentList);
        },
       function (paymentList, cb) {
           let sql = `SELECT id FROM tb_daily_log_operation ORDER BY create_time desc`
           customSqlModel.getAllCustomSqlInfo(sql, (error, dialyLogList) => {
               if (error) return cb(error);
               if (dialyLogList && dialyLogList.length <=0) {
                   cb(null, [])
               } else {
                   let dialyLogId = dialyLogList[0].id
                   if (error) return callback(error);
                   if (dialyLogList && dialyLogList.length <= 0) return cb(null, [])
                   let sql = `SELECT * FROM tb_payment_review WHERE daily_log_id = '${dialyLogId}'`
                   customSqlModel.getAllCustomSqlInfo(sql, (error, paymentReviewList) => {
                       if (error) return cb(error);
                       cb(null, paymentReviewList)
                   })
               }
           })
       },
        function (paymentReviewList, cb) {
            if (paymentReviewList && paymentReviewList.length <= 0) {
                cb(null, paymentList)
            } else {
                paymentReviewList.map(item => {
                    paymentList.map(paymentItem => {
                        paymentItem.money = Number(paymentItem.money).toFixed(2)
                        paymentItem.auditMoney = Number(paymentItem.auditMoney).toFixed(2)
                        if (item.payment_mode_id == paymentItem.paymentModeId) {
                            paymentItem.operator = item.operator;
                        }
                    })
                })
                cb(null, paymentList)
            }
     }
    ], function (error, paymentList) {
        if (error) {
            callback(error)
            appendFile(`paymentReview`, `${msg.__route__}=>【复合金额数据初始化失败】：,\n,${error.toString()}`);
        } else {
            appendFile(`paymentReview`, `${msg.__route__}=>【复合金额初始化成功；,\n,${JSON.stringify(paymentList)}`);
            callback(null, paymentList)
        }
    })
}

exports.checkReport = function(msg, callback) {

    var paymentList = msg.paymentList;
    var username = msg.operator;
    async.waterfall([ // 插入日志记录
        function (cb) {
            let  dailyLog = {
                id: generalUtil.randomUUID(),
                shopId: shopDetail.id,
                brandId: shopDetail.brandId,
                operator: username,
                closeStatus: 1,
                createTime: paymentList[0].createTime
            }
            dailyLogOperation.upsert(dailyLog, function (error, result) {
                cb(null, dailyLog)
            })
        },
        function (dailyLog, cb) {
            let paymentReviewList = []
            let dailogId = dailyLog.id
            async.each(paymentList, (item, e_cb) => {
                var payment = {
                   id: generalUtil.randomUUID(),
                   sort: item.sort,
                   dailyLogId: dailogId,
                   paymentModeId: item.paymentModeId,
                   reportMoney: Number(item.money).toFixed(2),
                   auditMoney: Number(item.auditMoney).toFixed(2),
                   operator: item.operator,
                   createTime: item.createTime
                };
                paymentReviewList.push(payment);
                paymentReview.upsert(payment, function (error, result) {
                    e_cb();
                })
            })
            var reply = {
                dailyLogOperation: dailyLog,
                paymentReview: paymentReviewList
            }
            cb(null, reply)
        }
    ], function (error, reply) {
        if(error) {
            appendFile(`paymentReview`, `${msg.__route__}=>【确定复核金额 失败】：,\n,${error.toString()}`);
            callback(error)
        } else {
            reply.dailyLogOperation.auditOrderItems = reply.paymentReview

            reply.dailyLogOperation.auditOrderItems.map(item => {
                item.reportMoney = item.reportMoney.toString()
                item.auditMoney = item.auditMoney.toString()
            })
            appendFile(`正在同步结店数据`, `${msg.__route__}=>【数据列表】：,\n,${JSON.stringify(reply.dailyLogOperation)}`);
            requestUtil.post('paymentReview', {
                dailyLogOperation: JSON.stringify(reply.dailyLogOperation)
            }, (err, data) => {
                appendFile(`结店同步数据`, `${msg.__route__}=> ${JSON.parse(data).success? '成功' : '失败'}：,\n,${data}`);
                callback(null, reply, data)
            });
        }
    })
}
