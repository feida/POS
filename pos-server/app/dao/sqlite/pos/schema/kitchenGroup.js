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
     * @desc 查询厨房组
     * */
    sqlite.models.TbKitchenGroupDetail= sqlite.define('tb_kitchen_group', {
        id                      :{ type: Sequelize.TEXT,    primaryKey: true },     //id
        name                    : {type: Sequelize.TEXT,    field:"name"},          //厨房组名称
        status                    : {type: Sequelize.INTEGER,    field:"status"},  // 0:开启  1:未开启
    }, {
        freezeTableName: true, //默认为false，当为false时，如果你数据库中已有表a的话，sequelize会修改你的表名，后缀加个s
        timestamps:false
    });

	return sqlite;
};