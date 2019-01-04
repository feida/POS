/**
 * @author wxh on 2018/6/22
 * @copyright
 * @desc
 */

const posSqlite = require('../../dao/sqlite/pos').client;

/**
 * 根据厨房组ID 查找厨房
 * @param kitchenGroupId
 * @param callback
 */

exports.getKitchenByKitchenGroupId = function (kitchenGroupId, callback) {
    posSqlite.query(`
        SELECT kgd.kitchen_group_id,kgd.kitchen_id,k.begin_time,k.end_time,k.sort from tb_kitchen_group_detail kgd
        LEFT JOIN tb_kitchen k on k.id  = kgd.kitchen_id
        where kgd.kitchen_group_id = ? and k.status = 0  order by k.sort asc;
        `,
        { replacements: [kitchenGroupId], type: posSqlite.QueryTypes.SELECT }
    ).then(function (results) {
        return callback(null, results);
    }).catch(function (err) {
        return callback(err);
    });
};