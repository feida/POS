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
     * @desc 外卖订单
     * */
    sqlite.models.tbPlatformOrder = sqlite.define('tb_platform_order', {
        id                      : {type: Sequelize.TEXT,    primaryKey: true },         //id
        type                    : {type: Sequelize.INTEGER, field:"type"},              //外卖平台 1：饿了么2：美团外卖 3：百度外卖
        platformOrderId         : {type: Sequelize.TEXT,    field:"platform_order_id"}, //外卖平台订单ID
        shopDetailId            : {type: Sequelize.TEXT,    field:"shop_detail_id"},    //Resot店铺ID
        originalPrice           : {type: Sequelize.REAL,    field:"original_price"},    //订单原价
        totalPrice              : {type: Sequelize.REAL,    field:"total_price"},       //订单总价（优惠后）
        address                 : {type: Sequelize.TEXT,    field:"address"},           //地址
        phone                   : {type: Sequelize.TEXT,    field:"phone"},           //手机
        name                    : {type: Sequelize.TEXT,    field:"name"},              //收货人姓名
        orderCreateTime         : {type: Sequelize.INTEGER,    field:"order_create_time"},
        payType                 : {type: Sequelize.TEXT,    field:"pay_type"},          //支付方式（在线支付，货到付款）
        remark                  : {type: Sequelize.TEXT,    field:"remark"},            //备注
        orderNumber            : {type: Sequelize.INTEGER,    field:"order_number"},            //订单号
    }, {
        freezeTableName: true, //默认为false，当为false时，如果你数据库中已有表a的话，sequelize会修改你的表名，后缀加个s
        timestamps:false
    });

	return sqlite;
};