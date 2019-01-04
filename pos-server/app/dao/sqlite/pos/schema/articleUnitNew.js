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
     * @desc 菜品新规格属性关联表
     * */
    sqlite.models.TbArticleUnitNew = sqlite.define('tb_article_unit_new', {
        id                      : {type: Sequelize.TEXT,    primaryKey: true },    //id
        articleId               : {type: Sequelize.TEXT,    field:"article_id"},   //菜品ID   关联 tb_article 表 id 字段
        unitId                  : {type: Sequelize.TEXT,    field:"unit_id"},      //新规格属性ID 关联 tb_unit 表 id 字段
        choiceType              : {type: Sequelize.INTEGER, field:"choice_type"},  // 选择类型 0：单选  1：多选
        isUsed                  : {type: Sequelize.INTEGER, field:"is_used"},      //是否启用 0：未启用  1：启用
    }, {
        freezeTableName: true, //默认为false，当为false时，如果你数据库中已有表a的话，sequelize会修改你的表名，后缀加个s
        timestamps:false
    });

	return sqlite;
};