/**
 * @author wxh on 2018/1/9
 * @copyright
 * @desc
 */

const posSqlite = require('../../dao/sqlite/pos').client;
const article = posSqlite.model('tb_article');
const async = require('async');

/**
 * 新增数据
 * @param content
 * @param callback
 */
exports.save = function (content, callback) {
    article.build(content).save().then(function (result) {
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
    article.update(update, { where: { id } }).then(function (result) {
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
    article.findOne({ where: { id }, raw:true }).then(function (result) {
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
    article.findAll({
        where: conditions,
        raw:true
    }).then(function (result) {
        callback(null, result);
    }).catch(function (err) {
        callback(err);
    });
};

/**
 * 批量更新库存
 * @param dataList
 * @param callback
 */

exports.batchUpdateCurrentStock = function (dataList, callback) {
    async.eachLimit(dataList, 1, function (item, cb) {
        article.update({
            currentWorkingStock: item.currentWorkingStock
        }, { where: { id: item.id } }).then(function (result) {
            return cb(null, result);
        }).catch(function (err) {
            return cb(err)
        });
    }, function (err) {
        if (err) return callback(err);
        callback();
    });
};
