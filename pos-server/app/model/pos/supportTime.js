/**
 * @author wxh on 2018/1/9
 * @copyright
 * @desc
 */

const posSqlite = require('../../dao/sqlite/pos').client;
const supportTime = posSqlite.model('tb_support_time');

const async = require('async');

/**
 * 新增数据
 * @param content
 * @param callback
 */
exports.save = function(content, callback) {
    supportTime.build(content).save().then(function (result) {
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
    supportTime.update(update, {where: {id}}).then(function (result) {
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
    supportTime.findOne({ where:{id} }).then(function (result) {
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
    supportTime.findAll({
        where:conditions
    }).then(function (result) {
        callback(null, result);
    }).catch(function (err) {
        callback(err);
    });
};

/**
 *
 * @param article_id
 * @param callback
 */
exports.selectByArticleId = function (article_id, distribution_mode_id,callback) {
    let support = distribution_mode_id == 1 ? 'support_tangshi':'support_waidai';  // 1 堂吃  3 外带
    posSqlite.query(`select a.article_type ,ak.kitchen_id ,p.id printer_id,p.name,p.ip,p.port ,p.ticket_type from tb_article_kitchen  ak LEFT JOIN tb_kitchen  k on   ak.kitchen_id= k.id LEFT JOIN tb_printer  p on   k.printer_id= p.id LEFT JOIN tb_article  a on   ak.article_id= a.id where ak.article_id =  substr(?,1,32)   and p.${support} = 1 `,
        { replacements: [article_id],type: posSqlite.QueryTypes.SELECT }
    ).then(function(results) {
        return callback(null,  results);
    }).catch(function (err) {
        return callback(err);
    });
};