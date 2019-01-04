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
     * @desc 菜品新规格属性表
     * */
    sqlite.models.TbUnit = sqlite.define('tb_unit', {
        id                  : {type: Sequelize.TEXT,    primaryKey: true },         //id
        name                : {type: Sequelize.TEXT,    field:"name"},              //类型名称
        shopDetailId        : {type: Sequelize.TEXT,    field:"shop_detail_id"},    //店铺ID
        sort                : {type: Sequelize.INTEGER, field:"sort"},              //排序
    }, {
        freezeTableName: true, //默认为false，当为false时，如果你数据库中已有表a的话，sequelize会修改你的表名，后缀加个s
        timestamps:false
    });

	return sqlite;
};