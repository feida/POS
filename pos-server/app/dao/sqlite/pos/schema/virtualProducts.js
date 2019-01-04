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
     * @desc 虚拟餐品表
     * */
    sqlite.models.TbVirtualProducts = sqlite.define('tb_virtual_products', {
        id                  : {type: Sequelize.TEXT,    primaryKey: true },         //id
        name                : {type: Sequelize.TEXT,    field:"name"},              //虚拟餐品名称
        isUsed              : {type: Sequelize.INTEGER, field:"is_used"},           //是否启用  0：启用  1：不启用
        createTime          : {type: Sequelize.TEXT,    field:"create_time"},       //创建时间
        shopDetailId        : {type: Sequelize.TEXT,    field:"shop_detail_id"},    //店铺ID
    }, {
        freezeTableName: true, //默认为false，当为false时，如果你数据库中已有表a的话，sequelize会修改你的表名，后缀加个s
        timestamps:false
    });

	return sqlite;
};