const posSqlite = require('../../dao/sqlite/pos').client;
const paymentReview = posSqlite.model('tb_payment_review');
const async = require('async');
const lodash = require('lodash');
const generalUtil = require('../../util/generalUtil');
/**
 * 保存数据
 * @param content
 * @param callback
 */
exports.save = function (content, callback) {
    paymentReview.build(content).save().then(function (result) {
        return callback(null, result);
    }).catch(function (err) {
        return callback(err);
    });
};

/**
 * 创建数据
 * @param content
 * @param callback
 */
exports.create = function (content, callback) {
    content.id = generalUtil.randomUUID();
    paymentReview.build(content).save().then(function (result) {
        return callback(null, result);
    }).catch(function (err) {
        return callback(err);
    });
};

/**
 * 新增或者修改数据
 * @param content
 * @param callback
 */
exports.upsert = function (content, callback) {
    paymentReview.upsert(content).then(function (result) {
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
    paymentReview.update(update, { where: { id } }).then(function (result) {
        return callback(null, result);
    }).catch(function (err) {
        return callback(err);
    });
};

/**
 *  修改数据
 * @param update
 * @param where
 * @param callback
 */
exports.updateByConditions = function (update, where, callback) {
    paymentReview.update(update, { where: where }).then(function (result) {
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
    paymentReview.findOne({ where: { id } ,raw:true }).then(function (result) {
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
    paymentReview.findAll({
        where: conditions
    }).then(function (result) {
        callback(null, result);
    }).catch(function (err) {
        callback(err);
    });
};


/**
 * 根据id 获取信息
 * @param idArr
 * @param callback
 */
exports.findAllInfoByIdArr = function (idArr, callback) {
    paymentReview.findAll({
        where: {
            id:idArr,
            productionStatus:{
                $gte:2
            }
        } ,
        raw:true ,
        attributes: ['id'],
    }).then(function (result) {
        callback(null, result);
    }).catch(function (err) {
        callback(err);
    });
};

/**
 * @desc 根据id 查询
 * */
exports.selectById = function (id, callback) {
    paymentReview.findOne({
        where: { id }
    }).then(function (result) {
        callback(null, result);
    }).catch(function (err) {
        callback(err);
    });
};


/**
 * @desc 条件查询
 * */
exports.getDayOrder = function (conditions, callback) {
    paymentReview.findAll({
        where: conditions
    }).then(function (result) {
        callback(null, result);
    }).catch(function (err) {
        callback(err);
    });
};