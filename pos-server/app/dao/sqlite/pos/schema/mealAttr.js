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
     * @desc 套餐属性表
     * */
    sqlite.models.TbMealAttr = sqlite.define('tb_meal_attr', {
        id                      : {type: Sequelize.TEXT,    primaryKey: true },         //id
        name                    : {type: Sequelize.TEXT,    field:"name"},              //类型名称
        articleId               : {type: Sequelize.TEXT,    field:"article_id"},        //菜品ID 关联 tb_article 表 id 字段
        printSort               : {type: Sequelize.INTEGER, field:"print_sort"},        //打印排序
        choiceType              : {type: Sequelize.INTEGER, field:"choice_type"},       //选择类型 0：必选 ，具体根据 choice_count 的值来决定 必选几，不可多，不可少。1：任选,可不选
        choiceCount             : {type: Sequelize.INTEGER, field:"choice_count"},      //必选数量  选择数量
        sort                    : {type: Sequelize.INTEGER, field:"sort"},              //排序
    }, {
        freezeTableName: true, //默认为false，当为false时，如果你数据库中已有表a的话，sequelize会修改你的表名，后缀加个s
        timestamps:false
    });

	return sqlite;
};