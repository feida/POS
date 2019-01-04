/**
 * @author wxh on 2018/1/9
 * @copyright
 * @desc
 */

const posSqlite = require('../../dao/sqlite/pos').client;
const articleKitchen = posSqlite.model('tb_article_kitchen');

const async = require('async');

/**
 * 新增数据
 * @param content
 * @param callback
 */
exports.save = function (content, callback) {
    articleKitchen.build(content).save().then(function (result) {
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
    articleKitchen.update(update, { where: { id } }).then(function (result) {
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
    articleKitchen.findOne({ where: { id } }).then(function (result) {
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
    articleKitchen.findAll({
        where: conditions
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
exports.selectByArticleId = function (article_id, distribution_mode_id, callback) {
    let support = distribution_mode_id == 1 ? 'support_tangshi' : 'support_waidai';  // 1 堂吃  3 外带
    posSqlite.query(`select a.article_type ,ak.kitchen_id ,p.id printer_id,p.name,p.ip,p.port ,p.ticket_type from tb_article_kitchen  ak LEFT JOIN tb_kitchen  k on   ak.kitchen_id= k.id LEFT JOIN tb_printer  p on   k.printer_id= p.id LEFT JOIN tb_article  a on   ak.article_id= a.id where ak.article_id =  substr(?,1,32)   and p.${support} = 1 `,
        { replacements: [article_id], type: posSqlite.QueryTypes.SELECT }
    ).then(function (results) {
        return callback(null, results);
    }).catch(function (err) {
        return callback(err);
    });
};

/**
 *
 * @param virtual_id
 * @param callback
 */
exports.getVirtualKitchenByVirtualId = function (virtual_id, distribution_mode_id, callback) {
    let support = distribution_mode_id == 1 ? 'support_tangshi' : 'support_waidai';  // 1 堂吃  3 外带
    let sql = `SELECT  vp.name, k.name kutchenName,p.print_type,p.ticket_type,p.port,p.ip, k.id kitchen_id,p.id printer_id from tb_virtual_products vp
				left JOIN tb_virtual_products_kitchen vpk on vpk.virtual_id = vp.id
				left JOIN tb_kitchen k on k.id = vpk.kitchen_id
				left JOIN tb_printer p on p.id = k.printer_id
				WHERE vp.id= ? and p.${support} = 1`;
    posSqlite.query(`${sql}`,
        { replacements: [virtual_id], type: posSqlite.QueryTypes.SELECT }
    ).then(function (results) {
        return callback(null, results);
    }).catch(function (err) {
        return callback(err);
    });
};

/**
 *  获取推荐菜品的厨房
 * @param recommend_id
 * @param distribution_mode_id
 * @param callback
 */
exports.getRecommendKitchenByRecommendId = function (recommend_id,distribution_mode_id, callback) {
    let support = distribution_mode_id == 1 ? 'support_tangshi' : 'support_waidai';  // 1 堂吃  3 外带
    let sql = `SELECT r.print_type recommend_print_type,p.print_type,p.ticket_type,p.port,p.ip, k.id kitchen_id,p.id printer_id from tb_recommend r
            left JOIN tb_kitchen k on r.kitchen_id= k.id
            left JOIN tb_printer p on p.id = k.printer_id
            WHERE r.id = ? and p.${support} = 1;
            `;
    // let sql = `SELECT r.print_type recommend_print_type,p.print_type,p.ticket_type,p.port,p.ip, k.id kitchen_id,p.id printer_id from tb_recommend_article ra
    //         LEFT JOIN tb_recommend r on r.id = ra.recommend_id
    //         left JOIN tb_kitchen k on k.id = r.kitchen_id
    //         left JOIN tb_printer p on p.id = k.printer_id
    //         WHERE ra.article_id = ? and ra.recommend_id = ? and p.${support} = 1;`;
    posSqlite.query(`${sql}`,
        { replacements: [recommend_id], type: posSqlite.QueryTypes.SELECT }
    ).then(function (results) {
        return callback(null, results);
    }).catch(function (err) {
        return callback(err);
    });
};


/**
 * 查询厨房组
 * @param cb
 */
exports.queryKitchenGroup = function (cb) {
    posSqlite.query(`
    select * from tb_kitchen_group kg
    where kg.status = 0
    `, { type: posSqlite.QueryTypes.SELECT }
    ).then(results => {
        return cb(null, results)
    }).catch(err => {
        return cb(err)
    })
}

/**
 * 查询厨房组内厨房
 */
exports.queryKitchens = function (kitchen_group_id, cb) {
    posSqlite.query(`
    select 
    gd.kitchen_id,
    k.name,
    k.shop_detail_id
    from tb_kitchen_group_detail gd
    inner join tb_kitchen  k  on  k.id = gd.kitchen_id
    where gd.kitchen_group_id = ?
    order by k.sort asc
    `, { replacements: [kitchen_group_id], type: posSqlite.QueryTypes.SELECT }
    ).then(results => {
        cb(null, results)
    }).catch(err => {
        cb(err)
    })
}

/**
 * 查询菜品所属厨房组
 */
exports.queryKitchenGroupByArticleId = function (article_id, cb) {
    posSqlite.query(`
    select kitchen_group_id 
    from tb_article_kitchen_printer ag
    where ag.article_id = ?
    `, { replacements: [article_id], type: posSqlite.QueryTypes.SELECT }
    ).then(results => {
        if (!results || results.length < 1) {
            return cb(null, [])
        }
        cb(null, results)
    }).catch(err => {
        cb(err)
    })
}

/**
 * 查询厨房是否在线
 */
exports.queryKitchenIsOnline = function (kitchen_id, cb) {
    posSqlite.query(`
    select 
    id,
    begin_time,
    end_time,
    status
    from tb_kitchen
    where id = ? 
   `, { replacements: [kitchen_id], type: posSqlite.QueryTypes.SELECT }
    ).then(results => {
        if (!results || results.length < 1) {
            return cb('查询厨房是否在线出错')
        }
        cb(null, results[0])
    }).catch(err => {
        cb(err)
    })
}

/**
 * 查询厨房内打印机
 */
exports.queryPrintersByKitchen = function (kitchen_id, distribution_mode_id, cb) {
    let support = distribution_mode_id == 1 ? 'support_tangshi' : 'support_waidai';  // 1 堂吃  3 外带
    posSqlite.query(`
    select k.printer_id,
    p.*
    from tb_kitchen_printer k
    inner join tb_printer p on p.id = k.printer_id
    where k.kitchen_id = ? and p.${support} = 1
    `, { replacements: [kitchen_id], type: posSqlite.QueryTypes.SELECT }
    ).then(results => {
        cb(null, results)
    }).catch(err => {
        cb(err)
    })
}
