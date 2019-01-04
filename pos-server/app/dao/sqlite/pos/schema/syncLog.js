/**
 * @author wxh on 2017/10/31
 * @copyright
 * @desc
 */

const Sequelize = require('sequelize');

exports.define = function (sqlite) {
	if (!sqlite.models) {
        sqlite.models = {}
	}
    /**
     * @desc 数据同步日志表
     * */
    sqlite.models.TbSyncLog = sqlite.define('tb_sync_log', {
        id                  : {type: Sequelize.TEXT,    primaryKey: true },         //id
        name                : {type: Sequelize.TEXT,    field:"name"},              //用户名
        log                 : {type: Sequelize.TEXT,    field:"log"},               //同步信息
        syncTime            : {type: Sequelize.TEXT,    field:"sync_time"},         //同步时间
        state               : {type: Sequelize.INTEGER, field:"state"},             //同步状态
        remark              : {type: Sequelize.INTEGER, field:"remark"},            //同步备注
    }, {
        freezeTableName: true, //默认为false，当为false时，如果你数据库中已有表a的话，sequelize会修改你的表名，后缀加个s
        timestamps:false
    });

	return sqlite;
};