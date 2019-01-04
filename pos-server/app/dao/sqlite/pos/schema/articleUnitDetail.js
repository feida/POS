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
     * @desc 菜品新规格属性子项关联表
     * */
    sqlite.models.tbArticleUnitDetail = sqlite.define('tb_article_unit_detail', {
        id                      : {type: Sequelize.TEXT,    primaryKey: true },     //id
        unitDetailId            : {type: Sequelize.TEXT,    field:"unit_detail_id"},//规格详情ID 关联 tb_unit_detail 表 id 字段
        articleUnitId           : {type: Sequelize.TEXT,    field:"article_unit_id"},//菜品规格ID 关联 tb_article_unit_new 表 id 字段
        price                   : {type: Sequelize.INTEGER,    field:"price"},         //差价
        isUsed                  : {type: Sequelize.INTEGER, field:"is_used"},       //是否启用  0：未启用 1：启用
        sort                    : {type: Sequelize.INTEGER, field:"sort"},          //排序
    }, {
        freezeTableName: true, //默认为false，当为false时，如果你数据库中已有表a的话，sequelize会修改你的表名，后缀加个s
        timestamps:false
    });

	return sqlite;
};