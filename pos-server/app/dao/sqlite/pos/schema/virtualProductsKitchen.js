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
     * @desc 虚拟餐品出餐厨房表
     * */
    sqlite.models.TbVirtualProductsKitchen = sqlite.define('tb_virtual_products_kitchen', {
        id                  : {type: Sequelize.TEXT, primaryKey: true },         //id
        virtualId           : {type: Sequelize.TEXT, field:"virtual_id"},                    //virtual_id  关联 tb_virtual_products 表 id 字段
        kitchenId           : {type: Sequelize.TEXT, field:"kitchen_id"},                    //关联 tb_kitchen 表 id 字段
    }, {
        freezeTableName: true, //默认为false，当为false时，如果你数据库中已有表a的话，sequelize会修改你的表名，后缀加个s
        timestamps:false
    });

	return sqlite;
};