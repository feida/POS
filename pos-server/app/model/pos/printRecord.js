/**
 * @author wxh on 2018/1/9
 * @copyright
 * @desc
 */

const posSqlite = require('../../dao/sqlite/pos').client;
const printRecord = posSqlite.model('tb_print_record');

const async = require('async');

/**
 * 新增或者修改数据
 * @param content
 * @param callback
 */
exports.upsert = function (content, callback) {
    if (typeof callback != 'function') {
        callback = function () { };
    }
    printRecord.upsert(content).then(function (result) {
        return callback(null, result);
    }).catch(function (err) {
        return callback(err);
    });
};

/**
 * 获取表总记录算
 * @param callback
 */
exports.count = function (callback) {
    printRecord.count().then(function (result) {
        return callback(null, result);
    }).catch(function (err) {
        return callback(err);
    });
};

/**
 * 获取所有数据
 * @param callback
 */
exports.findAll = function (callback) {
    printRecord.findAll({raw:true}).then(function (result) {
        return callback(null, result);
    }).catch(function (err) {
        return callback(err);
    });
};

/**
 * 删除数据
 * @param callback
 */
exports.destroyByTableName = function (condition,callback) {
    printRecord.destroy({
        where:condition
    }).then(function (result) {
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
exports.findOneInfoAndDestroyById= function (id, callback) {
    printRecord.findOne({ where: { id }, raw:true }).then(function (resultOne) {
        printRecord.destroy({
            where:{ id }
        }).then(function (result) {
            callback(null, resultOne);
        }).catch(function (err) {
            return callback(err);
        });
    }).catch(function (err) {
        callback(err);
    });
};

/**
 * 根据id 删除记录
 * @param id
 * @param callback
 */
exports.deletePrintRecordById= function (id, callback) {
    printRecord.destroy({
        where:{ id }
    }).then(function (result) {
        callback(null, result);
    }).catch(function (err) {
        return callback(err);
    });
};


/**
 * 根据条件查询并分页
 * @param param
 * @param callback
 */
exports.getPrintRecord= function (param, where, callback) {

    printRecord.findAndCountAll({
        where,
        'limit': param.page_size,
        'offset': param.page_skip,
    }).then(function (result) {
        callback(null, result);
    }).catch(function (err) {
        callback(err);
    });
};
