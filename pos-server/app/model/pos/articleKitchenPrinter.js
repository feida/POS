/**
 * @author wxh on 2018/1/9
 * @copyright
 * @desc
 */

const posSqlite = require('../../dao/sqlite/pos').client;
const articleKitchenPrinter = posSqlite.model('tb_article_kitchen_printer');

const async = require('async');

/**
 * 新增数据
 * @param content
 * @param callback
 */
exports.save = function(content, callback) {
    articleKitchenPrinter.build(content).save().then(function (result) {
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
    articleKitchenPrinter.update(update, {where: {id}}).then(function (result) {
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
    articleKitchenPrinter.findOne({ where:{id} }).then(function (result) {
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
    articleKitchenPrinter.findAll({
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
    posSqlite.query(`
    SELECT akp.*,k.name kName, k.begin_time,k.end_time,k.status,p.name pName,p.ip,p.port,p.ticket_type from  tb_article_kitchen_printer  akp
    LEFT JOIN tb_kitchen  k on   k.id = akp.kitchen_id
    LEFT JOIN tb_printer  p on   p.id = akp.printer_id
    where article_id = substr(?,1,32) and k.status = 0 and p.${support} = 1`,
        { replacements: [article_id],type: posSqlite.QueryTypes.SELECT }
    ).then(function(results) {
        return callback(null,  results);
    }).catch(function (err) {
        return callback(err);
    });
};
