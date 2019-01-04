/**
 * @author wxh on 2017/12/29
 * @copyright
 * @desc
 */

const posSqlite = require('../../dao/sqlite/pos').client;

const printer = posSqlite.model('tb_printer');

const async = require('async');
const lodash = require('lodash');
const PayMode = require("../../constant/PayMode");


/**
 * 新增数据
 * @param content
 * @param callback
 */
exports.save = function (content, callback) {
    printer.build(content).save().then(function (result) {
        return callback(null, result);
    }).catch(function (err) {
        return callback(err);
    });
};



/**
 * 根据Id 修改数据
 * @param id
 * @param update
 * @param callback
 */
exports.updateById = function (id, update, callback) {
    printer.update(update, { where: { id } }).then(function (result) {
        return callback(null, result);
    }).catch(function (err) {
        return callback(err);
    });
};
/**
 * 根据id 获取信息
 * @param id
 * @param callback
 */
exports.findOneInfoById = function (id, callback) {
    printer.findOne({ where: { id } }).then(function (result) {
        callback(null, result);
    }).catch(function (err) {
        callback(err);
    });
};

/**
 * 根据ip 获取备用打印机
 * @param ip
 * @param callback
 */
exports.findOneInfoByIp = function (ip, callback) {
    printer.findOne({ where: { ip },raw:true }).then(function (result) {
        callback(null, result);
    }).catch(function (err) {
        callback(err);
    });
};

/**
 * 根据条件获取信息
 * @param conditions
 * @param callback
 */
exports.findAllInfoByConditions = function (conditions, callback) {
    printer.findAll({
        where: conditions
    }).then(function (result) {
        callback(null, result);
    }).catch(function (err) {
        callback(err);
    });
};


/**
 * @desc 根据条件查询外卖打印机
 * */
exports.getPrinterByPrintType = function (conditions, callback) {
    printer.findAll({
        where: {
            printType: conditions.printType,
            range: conditions.range,
            ticketType: conditions.ticketType,
            supportWaimai: conditions.supportWaimai
        }
    }).then(function (result) {
        callback(null, result);
    }).catch(function (err) {
        callback(err);
    });
};

/**
 * @desc 获取打印机ip
 * */
exports.getPrintIP = function (callback) {
    posSqlite.query('SELECT * FROM tb_printer WHERE print_type = 2 and ticket_type = 0 and range  =0', { type: posSqlite.QueryTypes.SELECT }
    ).then(function (results) {
        return callback(null, results);
    }).catch(function (err) {
        return callback(err);
    });
};

/**
 * @desc 根据条件查询打印机
 * */
exports.selectById = function (id, callback) {
    posSqlite.query('select * from tb_printer where id = ?',
        { replacements: [id], type: posSqlite.QueryTypes.SELECT }
    ).then(function (results) {
        return callback(null, results.length ? results[0] : results);
    }).catch(function (err) {
        return callback(err);
    });
};


exports.getItemsInit = function (parameter,printOutDetails, cb) {
    let item = [];
    async.eachLimit(parameter, 1, function (value, ab) {
        let obj = {};
        if (value.parent_id != null && value.parent_id.length > 2 && value.type !=5 && value.type !=8) {
            obj.ARTICLE_NAME = "|_" + value.article_name;
            obj.ARTICLE_COUNT = value.refund_count && value.article_return == 'true' ? -value.refund_count : printOutDetails == 1 ? value.orgin_count:value.count;
            obj.ARTICLE_TOTAL = 0;
            obj.SUBTOTAL = (value.original_price * obj.ARTICLE_COUNT).toFixed(2);
            obj.TOTAL = +(value.original_price * obj.ARTICLE_COUNT).toFixed(2);
            item.push(obj);
            ab();
        } else {
            obj.ARTICLE_NAME = value.article_name;
            obj.ARTICLE_COUNT = value.refund_count && value.article_return == 'true' ? -value.refund_count : printOutDetails == 1 ? value.orgin_count:value.count;
            obj.ARTICLE_TOTAL = value.refund_count && value.article_return == 'true' ? -value.refund_count : printOutDetails == 1 ? value.orgin_count:value.count;
            obj.SUBTOTAL = (value.original_price * obj.ARTICLE_COUNT).toFixed(2);
            obj.TOTAL = +(value.original_price * obj.ARTICLE_COUNT).toFixed(2);
            item.push(obj);
            ab();
        }

    }, function (err) {
        cb(err, item);
    });
};


exports.getTotalTemplate = function (parameter, cb) {
    var ticketData = {
        'BARCODE': parameter.BARCODE,
        'ORDER_ID': parameter.ORDER_ID,
        'ORDER_NUMBER': parameter.ORDER_NUMBER,
        'ITEMS': parameter.ITEMS,
        'DISTRIBUTION_MODE': parameter.DISTRIBUTION_MODE,
        'CUSTOMER_COUNT': parameter.CUSTOMER_COUNT,
        'ORIGINAL_AMOUNT': parameter.ORIGINAL_AMOUNT,
        'RESTAURANT_ADDRESS': parameter.RESTAURANT_ADDRESS,
        'REDUCTION_AMOUNT': parameter.REDUCTION_AMOUNT,
        'RESTAURANT_TEL': parameter.RESTAURANT_TEL,
        'TABLE_NUMBER': parameter.TABLE_NUMBER,
        'PAYMENT_AMOUNT': parameter.PAYMENT_AMOUNT,
        'RESTAURANT_NAME': parameter.RESTAURANT_NAME,
        'DATETIME': parameter.DATETIME,
        'PAYMENT_ITEMS': parameter.PAYMENT_ITEMS,
        'CUSTOMER_SATISFACTION': parameter.CUSTOMER_SATISFACTION,
        'CUSTOMER_SATISFACTION_DEGREE': parameter.CUSTOMER_SATISFACTION_DEGREE,
        'CUSTOMER_PROPERTY': parameter.CUSTOMER_PROPERTY,
        'MEMO': parameter.MEMO,
        'ARTICLE_COUNT': parameter.ARTICLE_COUNT,
        'WELCOME': parameter.WELCOME

    };

    cb(ticketData);
};

exports.getPaymentItemsInit = function (parameter, cb) {
    let item = [];
    async.eachLimit(parameter, 1, function (value, ab) {
        let name = "";
        if ((value.payment_mode_id == 1 || value.payment_mode_id == 10) && value.result_data) {
            name = "线上" + PayMode.getPayModeName(value.payment_mode_id)
        } else if ((value.payment_mode_id == 1 || value.payment_mode_id == 10) && !value.result_data) {
            name = "线下" +  PayMode.getPayModeName(value.payment_mode_id)
        } else {
            name =  PayMode.getPayModeName(value.payment_mode_id)
        }
        let obj = {
            PAYMENT_MODE: name,
            SUBTOTAL: (value.pay_value).toFixed(2)
        };
        item.push(obj);
        ab();
    }, function (err) {
        cb(err, item);
    });
};

exports.getNameInit = function (name, totalType) {

    if (totalType == 2) {
        return name + '（消费清单）';
    } else if (totalType == 3) {
        return name + '（结账清单）';
    } else {
        return name;
    }

};


exports.getArticleSort = function (orderItems, cb) {
    async.waterfall([
        function (done) {
            let item = [];
            let item2 = [];
            lodash.forEach(orderItems, function (value) {
                if ((value.type == 4 ||value.type == 6) && value.parent_id && value.parent_id.length > 2) {
                    item.push(value)
                } else {
                    item2.push(value)
                }
            });
            done(null, item, item2)
        },
        function (item, item2, done) {

            let r1 = lodash.filter(item, ['article_return', 'false']);
            let r2 = lodash.filter(item, ['article_return', 'true']);

            let items = [...lodash.unionBy(r1, 'parent_id'), ...lodash.unionBy(r2, 'parent_id')];
            // console.log("==r1", item2);
            // console.log("==r2",r2);

            async.eachLimit(items, 1, function (value, ab) {
                let meal = (lodash.filter(item, { 'parent_id': value.parent_id, 'article_return': value.article_return })).reverse();
                async.eachLimit(meal, 1, function (mealValue, ad) {
                    // let sortedIndex = lodash.findIndex(item2, { 'id': value.parent_id, 'article_return': value.article_return });
                    let sortedIndex = lodash.findIndex(item2, (o)=>{
                        if (value.type == 6){
                            let pd = /\-/g.test(value.parent_id);
                            if (pd){
                                if (o.parent_id == value.parent_id && o.article_return==value.article_return) return o;
                            }else {
                                if (o.article_id == value.parent_id && o.article_return==value.article_return) return o;
                            }
                        }else {
                            if (o.id == value.parent_id && o.article_return==value.article_return) return o;
                        }
                    });
                    item2.splice(sortedIndex + 1, 0, mealValue);
                    ad()
                }, function (err) {
                    ab()
                });
            }, function (err) {
                done(null, item2)
            })
        },
    ], function (error, result) {
        return cb(result)
    });
};


/**
 * 厨打单、套餐都不拆分
 * @param item
 * @param ben
 * @param shopDetail
 * @param results
 * @param cb
 * @returns {*}
 */
exports.getNotDivideKitchenData = function (item, ben, shopDetail, results, cb) {

    item.kitchenId = ben.kitchen_id;
    item.printerId = ben.printer_id;
    item.port = ben.port;
    item.ip = ben.ip;

    let data = lodash.find(results, { 'id': item.id, 'parent_id': item.printerId });
    let obj = {
        id: item.id,
        parent_id: item.printerId,
        port: item.port,
        ip: item.ip,
        ITEMS: []
    };


    if (data) {
        if (item.type == 5 || item.type == 8 ||!item.parent_id || item.parent_id.length < 2) {
            results.ITEMS.push({ 'ARTICLE_COUNT': item.count, 'ARTICLE_NAME': item.article_name })
        }
    } else {
        if (item.type == 5 || item.type == 8 ||!item.parent_id || item.parent_id.length < 2) {
            obj.ITEMS.push({ 'ARTICLE_COUNT': item.count, 'ARTICLE_NAME': item.article_name })
            results.push(obj)
        } else {
            let band = lodash.find(results, ['id', item.parent_id]);
            if (band) {
                if (item.mealPrintSort == 1) {
                    band.ip = ben.ip;
                    band.port = ben.port;
                }
                band.ITEMS.push({ 'ARTICLE_COUNT': item.count, 'ARTICLE_NAME': '|_' + item.article_name })
            } else {
                obj.ITEMS = [{ 'ARTICLE_COUNT': item.count, 'ARTICLE_NAME': item.article_name }]
            }
        }

    }
    return cb(results);
};


/**
 * 虚拟餐包
 * @param item
 * @param ben
 * @param shopDetail
 * @param results
 * @param cb
 * @returns {*}
 */
exports.getVirtualKitchenData = function (item, ben, shopDetail, results, cb) {

    item.kitchenId = ben.kitchen_id;
    item.printerId = ben.printer_id;
    item.port = ben.port;
    item.ip = ben.ip;

    let index = lodash.findIndex(results, { 'parent_id': item.printerId });
    let obj = {
        parent_id: item.printerId,
        port: item.port,
        ip: item.ip,
        ITEMS: []
    };

    if (index >= 0) {
        results[index].ITEMS.push({ 'ARTICLE_COUNT': item.count, 'ARTICLE_NAME': item.article_name })
    } else {
        obj.ITEMS.push({ 'ARTICLE_COUNT': item.count, 'ARTICLE_NAME': item.article_name });
        results.push(obj)
    }
    return cb(results);
};


/**
 * 推荐餐包不分
 * @param item
 * @param ben
 * @param shopDetail
 * @param results
 * @param cb
 * @returns {*}
 */
exports.getRecommendKitchenData = function (item, ben, shopDetail, results, cb) {
    item.kitchenId = ben.kitchen_id;
    item.printerId = ben.printer_id;
    item.port = ben.port;
    item.ip = ben.ip;

    let index = lodash.findIndex(results, { 'parent_id': item.printerId });
    let obj = {
        parent_id: item.printerId,
        port: item.port,
        ip: item.ip,
        ITEMS: []
    };

    if (index >= 0) {
        results[index].ITEMS.push({ 'ARTICLE_COUNT': item.count, 'ARTICLE_NAME': item.article_name })
    } else {
        obj.ITEMS.push({ 'ARTICLE_COUNT': item.count, 'ARTICLE_NAME': item.article_name });
        results.push(obj)
    }
    return cb(results);
};


/**
 * 推荐餐包分
 * @param item
 * @param ben
 * @param shopDetail
 * @param results
 * @param cb
 * @returns {*}
 */
exports.getRecommendKitchenDataPart = function (item, ben, shopDetail, results, cb) {
    item.kitchenId = ben.kitchen_id;
    item.printerId = ben.printer_id;
    item.port = ben.port;
    item.ip = ben.ip;

    let index = lodash.findIndex(results, { 'parent_id': item.printerId });
    let obj = {
        parent_id: item.printerId,
        port: item.port,
        ip: item.ip,
        ITEMS: []
    };

    if (index >= 0) {
        results[index].ITEMS.push({ 'ARTICLE_COUNT': item.count, 'ARTICLE_NAME': item.article_name })
    } else {
        obj.ITEMS.push({ 'ARTICLE_COUNT': item.count, 'ARTICLE_NAME': item.article_name });
        results.push(obj)
    }
    return cb(results);
};


/**
 * 厨打分单,套餐不分
 * @param item
 * @param ben
 * @param shopDetail
 * @param results
 * @param cb
 * @returns {*}
 */
exports.getArticleSplitKitchenData = function (item, ben, shopDetail, results, cb) {
    item.kitchenId = ben.kitchen_id;
    item.printerId = ben.printer_id;
    item.port = ben.port;
    item.ip = ben.ip;
    item.ticketType = ben.ticket_type;

    let data = lodash.find(results, { 'id': item.id, 'parent_id': item.printerId });
    let obj = {
        id: item.id,
        parent_id: item.printerId,
        ip: item.ip,
        port: item.port,
        ITEMS: []
    };

    if (data) {
        if (item.type == 5 || item.type == 8 ||!item.parent_id || item.parent_id.length < 2) {
            obj.ITEMS.push({ 'ARTICLE_COUNT': 1, 'ARTICLE_NAME': item.article_name });
            for (let i = 0; i < item.count; i++) {
                results.ITEMS.push(obj)
            }
        }
    } else {
        if (item.type == 5 || item.type == 8 ||!item.parent_id || item.parent_id.length < 2) {
            obj.ITEMS.push({ 'ARTICLE_COUNT': 1, 'ARTICLE_NAME': item.article_name })
            for (let i = 0; i < item.count; i++) {
                results.push(obj);
            }
        } else {
            let band = lodash.find(results, ['id', item.parent_id]);
            if (band) {
                if (item.mealPrintSort == 1) {
                    band.ip = ben.ip;
                    band.port = ben.port;
                }
                band.ITEMS.push({ 'ARTICLE_COUNT': item.count, 'ARTICLE_NAME': '|_' + item.article_name })
            } else {
                obj.ITEMS = [{ 'ARTICLE_COUNT': 1, 'ARTICLE_NAME': item.article_name }];
            }
        }
    }
    return cb(results);
};



/**
 * 厨打单、套餐都拆分
 * @param item
 * @param ben
 * @param shopDetail
 * @param results
 * @param cb
 * @returns {*}
 */
exports.getAllSplitKitchenData = function (item, ben, shopDetail, results, cb) {
    item.kitchenId = ben.kitchen_id;
    item.printerId = ben.printer_id;
    if (!item.parent_id || item.type == 5 || item.type == 8 ) {
        if (ben) {
            item.port = ben.port;
            item.ip = ben.ip;
        } else {
            return cb(results);
        }
    }

    item.articleType = ben.article_type;

    let data = lodash.find(results, { 'id': item.id, 'parent_id': item.printerId });

    let obj = {
        id: item.id,
        parent_id: item.printerId,
        ip: item.ip,
        port: item.port,
        ITEMS: []
    };

    if (item.articleType != 2) {
        if (data) {
            if (item.type == 5 || item.type == 8|| !item.parent_id || item.parent_id.length < 2) {
                obj.ITEMS.push({ 'ARTICLE_COUNT': 1, 'ARTICLE_NAME': item.article_name });
                for (let i = 0; i < item.count; i++) {
                    results.push(obj)
                }
            }
        } else {
            if (item.type == 5 || item.type == 8 || !item.parent_id || item.parent_id.length < 2) {
                obj.ITEMS.push({ 'ARTICLE_COUNT': 1, 'ARTICLE_NAME': item.article_name });
                for (let i = 0; i < item.count; i++) {
                    results.push(obj)
                }
            } else {
                obj.ITEMS.push({ 'ARTICLE_COUNT': item.count, 'ARTICLE_NAME': '|_' + item.article_name });
                results.push(obj)

            }
        }
    }
    return cb(results);
};

/**
 * 厨打不拆、套餐都拆分
 * @param item
 * @param ben
 * @param shopDetail
 * @param results
 * @param cb
 * @returns {*}
 */
exports.getNotDivideKitchenNotMealData = function (item, ben, shopDetail, results, cb) {
    item.kitchenId = ben.kitchen_id;
    item.printerId = ben.printer_id;
    if (!item.parent_id || item.type == 5 || item.type == 8) {
        if (ben) {
            item.port = ben.port;
            item.ip = ben.ip;
        } else {
            return cb(results);
        }
    }

    item.articleType = ben.article_type;
    let data = lodash.find(results, { 'id': item.id, 'parent_id': item.printerId });

    let obj = {
        id: item.id,
        parent_id: item.printerId,
        ip: item.ip,
        port: item.port,
        ITEMS: []
    };

    if (item.articleType != 2) {
        if (data) {
            if (item.type == 5 || item.type == 8||  !item.parent_id || item.parent_id.length < 2   ) {
                obj.ITEMS.push({ 'ARTICLE_COUNT': item.count, 'ARTICLE_NAME': item.article_name });
                results.push(obj)
            }
        } else {
            if (item.type == 5 || item.type == 8|| !item.parent_id || item.parent_id.length < 2 ) {
                obj.ITEMS.push({ 'ARTICLE_COUNT': item.count, 'ARTICLE_NAME': item.article_name });
                results.push(obj)
            } else {
                obj.ITEMS.push({ 'ARTICLE_COUNT': item.count, 'ARTICLE_NAME': '|_' + item.article_name });
                results.push(obj)
            }
        }
    }
    return cb(results);
};


/**
 * 贴纸厨打单、套餐都不拆分
 * @param item
 * @param ben
 * @param shopDetail
 * @param results
 * @param cb
 * @returns {*}
 */
exports.getStickerNotDivideKitchenData = function (item, ben, shopDetail, results, cb) {

    item.kitchenId = ben.kitchen_id;
    item.printerId = ben.printer_id;
    item.port = ben.port;
    item.ip = ben.ip;
    if (item.type == 3 || item.type == 5 || item.type == 8 || (item.parent_id && item.parent_id.length > 2)) return cb(results);


    let obj = {
        id: item.id,
        port: item.port,
        ip: item.ip,
        ARTICLE_NAME: (item.article_name).replace(/\(.*?\)/g, ''),
        ARTICLE_COUNT: item.count,
        ARTICLE_PRICE: item.unit_price.toFixed(2)
    };
    // if(item.type== (2 || 1)) {
    let SPEC = item.article_name.match(/\((.+?)\)/g);
    let arr = lodash.map(SPEC, function (n) { return n.replace(/\(/, "#").replace(/\)/, "") });
    obj.SPEC = arr.toString().replace(/\,/g, " ") || "";
    // }
    results.push(obj);
    return cb(results);
};



/**
 * 厨打单、套餐都拆分
 * @param item
 * @param ben
 * @param shopDetail
 * @param results
 * @param cb
 * @returns {*}
 */
exports.getStickerAllSplitKitchenData = function (item, shopDetail, results, orderItems, ben, cb) {
    // item.kitchenId = ben.kitchen_id;
    // item.printerId = ben.printer_id;
    // item.port = ben.port;
    // item.ip =ben.ip;

    if (item.type == 4 || (item.parent_id && item.parent_id.length > 2)) {
        // _.find(orderItems, { 'age': 1, 'active': true })
        let obj = {
            id: item.id,
            port: item.port,
            ip: item.ip,
            ARTICLE_NAME: lodash.find(orderItems, { 'id': item.parent_id }).article_name,
            ARTICLE_COUNT: 1,
            ARTICLE_PRICE: '',
            // ARTICLE_PRICE:`￥`+item.unit_price.toFixed(2),
            SPEC: `|_${(item.article_name).replace(/(.*?)/g, '')}`,
        };
        results.push(obj);
    } else if (item.type == 3) {
        // _.find(orderItems, { 'age': 1, 'active': true })
        let obj = {
            id: item.id,
            port: ben.port,
            ip: ben.ip,
            ARTICLE_NAME: item.article_name,
            ARTICLE_COUNT: 1,
            ARTICLE_PRICE: item.unit_price.toFixed(2),
            SPEC: ``,
        };
        // results.push(obj);
    } else {
        for (let i = 0; i < item.count; i++) {
            let obj = {
                id: item.id,
                port: ben.port,
                ip: ben.ip,
                ARTICLE_NAME: (item.article_name).replace(/\(.*?\)/g, ''),
                ARTICLE_COUNT: 1,
                ARTICLE_PRICE: `￥` + item.unit_price.toFixed(2)
            };
            let SPEC = item.article_name.match(/\((.+?)\)/g);
            let arr = lodash.map(SPEC, function (n) { return n.replace(/\(/, "#").replace(/\)/, "") });
            obj.SPEC = arr.toString().replace(/\,/g, " ") || "";
            results.push(obj);
        }
    }

    return cb(results);
};

/**
 * 厨打不分单、套餐都拆分
 * @param item
 * @param ben
 * @param shopDetail
 * @param results
 * @param cb
 * @returns {*}
 */
exports.getStickerNotDivideKitchenNotMealData = function (item, shopDetail, results, orderItems, ben, cb) {
    // item.kitchenId = ben.kitchen_id;
    // item.printerId = ben.printer_id;
    // item.port = ben.port;
    // item.ip =ben.ip;

    if (item.type == 4 || (item.parent_id && item.parent_id.length > 2)) {
        // _.find(orderItems, { 'age': 1, 'active': true })
        let obj = {
            id: item.id,
            port: item.port,
            ip: item.ip,
            ARTICLE_NAME: lodash.find(orderItems, { 'id': item.parent_id }).article_name,
            ARTICLE_COUNT: 1,
            ARTICLE_PRICE: '',
            // ARTICLE_PRICE:`￥`+item.unit_price.toFixed(2),
            SPEC: `|_${(item.article_name).replace(/(.*?)/g, '')}`,
        };
        results.push(obj);
    } else if (item.type == 3) {
        // _.find(orderItems, { 'age': 1, 'active': true })
        let obj = {
            id: item.id,
            port: ben.port,
            ip: ben.ip,
            ARTICLE_NAME: item.article_name,
            ARTICLE_COUNT: 1,
            ARTICLE_PRICE: item.unit_price.toFixed(2),
            SPEC: ``,
        };
        // results.push(obj);
    } else {
        let obj = {
            id: item.id,
            port: ben.port,
            ip: ben.ip,
            ARTICLE_NAME: (item.article_name).replace(/\(.*?\)/g, ''),
            ARTICLE_COUNT: item.count,
            ARTICLE_PRICE: `￥` + item.unit_price.toFixed(2)
        };
        let SPEC = item.article_name.match(/\((.+?)\)/g);
        let arr = lodash.map(SPEC, function (n) { return n.replace(/\(/, "#").replace(/\)/, "") });
        obj.SPEC = arr.toString().replace(/\,/g, " ") || "";
        results.push(obj);
    }

    return cb(results);
};


/**
 * 厨打分单,套餐不分
 * @param item
 * @param ben
 * @param shopDetail
 * @param results
 * @param cb
 * @returns {*}
 */
exports.getStickerArticleSplitKitchenData = function (item, ben, shopDetail, results, cb) {

    item.kitchenId = ben.kitchen_id;
    item.printerId = ben.printer_id;
    item.port = ben.port;
    item.ip = ben.ip;
    if (item.type == 3 || item.type == 5 || item.type == 8|| (item.parent_id && item.parent_id.length > 2)) return cb(results);

    for (let i = 0; i < item.count; i++) {
        let obj = {
            id: item.id,
            port: item.port,
            ip: item.ip,
            ARTICLE_NAME: (item.article_name).replace(/\(.*?\)/g, ''),
            ARTICLE_COUNT: 1,
            ARTICLE_PRICE: item.unit_price.toFixed(2)
        };
        // if(item.type== (2 || 1)) {
        let SPEC = item.article_name.match(/\((.+?)\)/g);
        let arr = lodash.map(SPEC, function (n) { return n.replace(/\(/, "#").replace(/\)/, "") });
        obj.SPEC = arr.toString().replace(/\,/g, " ") || "";
        // }
        results.push(obj);
    }

    return cb(results);
};


/**
 * 贴纸规格品菜名拆分
 * @param article_name
 * @param cb
 * @returns {*}
 */

exports.getArticleNameAndSPEC= function (articleObj) {
    if (articleObj.type == 4 || (articleObj.parent_id && articleObj.parent_id.length > 2)) {
            let obj = {
                ARTICLE_NAME: articleObj.mealArticleName,
                ARTICLE_PRICE: '',
                SPEC: `|_${(articleObj.article_name).replace(/(.*?)/g, '')}`,
            };
        return obj;
     } else {
            let obj = {
                ARTICLE_NAME: (articleObj.article_name).replace(/\(.*?\)/g, ''),
                ARTICLE_PRICE: '',
            };
            let SPEC = articleObj.article_name.match(/\((.+?)\)/g);
            let arr = lodash.map(SPEC, function (n) { return n.replace(/\(/, "#").replace(/\)/, "") });
            obj.SPEC = arr.toString().replace(/\,/g, " ") || "";
        return obj;
    }
};
