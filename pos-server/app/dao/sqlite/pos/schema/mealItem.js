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
     * @desc 套餐属性子项表
     * */
    sqlite.models.TbMealItem = sqlite.define('tb_meal_item', {
        id                      :{ type: Sequelize.INTEGER,    primaryKey: true },         //id
        name                    :{ type: Sequelize.TEXT,    field:"name"},              //子项名称
        articleName             :{ type: Sequelize.TEXT,    field:"article_name"},      //菜品名称
        articleId               :{ type: Sequelize.TEXT,    field:"article_id"},        //菜品ID    关联 tb_article 表 id 字段
        priceDif                :{ type: Sequelize.INTEGER,    field:"price_dif"},         //子项差价
        mealAttrId              :{ type: Sequelize.TEXT, field:"meal_attr_id"},      //套餐属性ID    关联 tb_meal_attr 表  id  字段
        isDefault               :{ type: Sequelize.INTEGER, field:"is_default"},        //是否为默认 0：否  1：是
        kitchenId               :{ type: Sequelize.TEXT, field:"kitchen_id"},        //关联厨房  关联 tb_kitchen 表 id 字段
        sort                    :{ type: Sequelize.INTEGER, field:"sort"},              //排序
    }, {
        freezeTableName: true, //默认为false，当为false时，如果你数据库中已有表a的话，sequelize会修改你的表名，后缀加个s
        timestamps:false
    });

	return sqlite;
};