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
     * @desc 外卖订单详情
     * */
    sqlite.models.TbPlatformOrderDetail = sqlite.define('tb_platform_order_detail',
        {
            id                      : {type: Sequelize.TEXT,    primaryKey: true },         //id
            platformOrderId         : { type: Sequelize.TEXT, field:"platform_order_id"}, //外卖平台ID    关联 tb_platform_order 表 platform_order_id 字
            // platformOrderId         : {
            // type: Sequelize.TEXT, field:"platform_order_id", references: {  model: 'tb_platform_order',  key: 'platform_order_id'}}, //外卖平台ID    关联 tb_platform_order 表 platform_order_id 字段
            name                    : {type: Sequelize.TEXT,    field:"name"},              //菜品名称（用于匹配Resto+菜品）
            price                   : {type: Sequelize.REAL,    field:"price"},             //菜品原价
            quantity                : {type: Sequelize.INTEGER, field:"quantity"},          //数量
            showName                : {type: Sequelize.TEXT,    field:"show_name"},         //小票显示的菜品名称（菜品名称+（规格or属性））
         },
        {
            freezeTableName: true, //默认为false，当为false时，如果你数据库中已有表a的话，sequelize会修改你的表名，后缀加个s
            timestamps:false
        });

	return sqlite;
};