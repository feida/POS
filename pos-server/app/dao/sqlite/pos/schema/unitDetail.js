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
     * @desc 菜品新规格属性子项表
     * */
    sqlite.models.TbUnitDetail = sqlite.define('tb_unit_detail', {
        id                  : {type: Sequelize.TEXT,    primaryKey: true },         //id
        name                : {type: Sequelize.TEXT,    field:"name"},              //类型名称
        isUsed              : {type: Sequelize.INTEGER, field:"is_used"},           //是否启用 0：未启用 1：启用
        unitId              : {type: Sequelize.TEXT,    field:"unit_id"},           //新规格属性 关联 tb_unit 表 id
        sort                : {type: Sequelize.INTEGER, field:"sort"},              //排序
    }, {
        freezeTableName: true, //默认为false，当为false时，如果你数据库中已有表a的话，sequelize会修改你的表名，后缀加个s
        timestamps:false
    });

	return sqlite;
};