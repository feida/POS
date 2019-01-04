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
     * @desc 菜品老规格属性子项（详情）表
     * */
    sqlite.models.TbArticleUnit = sqlite.define('tb_article_unit', {
        id                  : {type: Sequelize.INTEGER,    primaryKey: true },         //id
        name                : {type: Sequelize.TEXT,    field:"name"},              //类型名称
        tbArticleAttrId     : {type: Sequelize.TEXT,    field:"tb_article_attr_id"},//菜品老规格属性 关联 tb_article_attr 表 id 字段
        sort                : {type: Sequelize.INTEGER, field:"sort"},              //排序
    }, {
        freezeTableName: true, //默认为false，当为false时，如果你数据库中已有表a的话，sequelize会修改你的表名，后缀加个s
        timestamps:false
    });

	return sqlite;
};