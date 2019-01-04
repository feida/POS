const posSqlite = require('../../dao/sqlite/pos').client;
const shopTvConfig = posSqlite.model('tb_shop_tv_config');
const async = require('async');

/**
 * @desc
 * */
exports.getShopTvConfigInfo = function (callback) {
    shopTvConfig.findOne().then(function (result) {
        return callback(null, result);
    }).catch(function (err) {
        return callback(err);
    });
};
