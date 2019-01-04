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
     * @desc 数据更新通知表
     * */
    sqlite.models.TbUnitDetail = sqlite.define('tb_data_notify', {
        id                  : {type: Sequelize.TEXT,    primaryKey: true },         //id
        tableName          : {type: Sequelize.TEXT,    field:"table_name"},       //表名称
        dataId             : {type: Sequelize.TEXT,   field:"data_id"},         //数据id
        type                : {type: Sequelize.TEXT,    field:"type"},           //数据操作方式  -- delete ->删除 modify -> 更新
        isNumber           : {type: Sequelize.INTEGER,    field:"is_number",defaultValue: 1}   //通知总和
    }, {
        freezeTableName: true, //默认为false，当为false时，如果你数据库中已有表a的话，sequelize会修改你的表名，后缀加个s
        timestamps:false
    });

	return sqlite;
};