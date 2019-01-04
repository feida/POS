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
     * @desc 需要更新的表
     * */
    sqlite.models.TbUser = sqlite.define('tb_change_table', {
        tableName          : {type: Sequelize.TEXT,  field:"table_name",   primaryKey: true },
        tablePath          : {type: Sequelize.TEXT,   field:"table_path" },         //获取表数据的地址
        updateType         : {type: Sequelize.TEXT,   field:"update_type" },         //更新类型
    }, {
        freezeTableName: true, //默认为false，当为false时，如果你数据库中已有表a的话，sequelize会修改你的表名，后缀加个s
        timestamps:false
    });

	return sqlite;
};