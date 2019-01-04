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
     * @desc 查询厨房组和厨房
     * */
    sqlite.models.TbKitchenGroupDetail= sqlite.define('tb_kitchen_group_detail', {
        id                      :{ type: Sequelize.TEXT,    primaryKey: true },     //id
        kitchenId              : {type: Sequelize.TEXT,    field:"kitchen_id"},          //厨房id
        kitchenGroupId         : {type: Sequelize.TEXT,    field:"kitchen_group_id",defaultValue:''},      // 厨房组id
    }, {
        freezeTableName: true, //默认为false，当为false时，如果你数据库中已有表a的话，sequelize会修改你的表名，后缀加个s
        timestamps:false
    });

	return sqlite;
};