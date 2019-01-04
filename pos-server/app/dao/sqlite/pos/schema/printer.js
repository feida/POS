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
     * @desc 打印机表
     * */
    sqlite.models.TbPrinter = sqlite.define('tb_printer', {
        id                  : {type: Sequelize.TEXT,    primaryKey: true },         //id
        name                : {type: Sequelize.TEXT,    field:"name"},              //打印机名称
        ip                  : {type: Sequelize.TEXT,    field:"ip"},                //打印机IP
        port                : {type: Sequelize.TEXT,    field:"port"},              //打印机端口
        printType           : {type: Sequelize.TEXT,    field:"print_type"},        //打印机类型
        ticketType          : {type: Sequelize.TEXT,    field:"ticket_type"},       //小票类型   --1：厨房2：前台3：打包
        range               : {type: Sequelize.TEXT,    field:"range"},             //打印机范围 --0：小票1：贴纸
        receiveMoney        : {type: Sequelize.TEXT,    field:"receive_money"},     //关联钱箱   --0：前台1：区域
        shopDetailId        : {type: Sequelize.TEXT,    field:"shop_detail_id"},    //店铺ID     --0：否 1：是
        billOfAccount       : {type: Sequelize.INTEGER,    field:"bill_of_account",defaultValue: 0},    //出结账单    --0：否 1：是
        billOfConsumption   : {type: Sequelize.INTEGER,    field:"bill_of_consumption",defaultValue: 0},    //出消费账单     --0：否 1：是
        supportTangshi      : {type: Sequelize.INTEGER, field:"support_tangshi",defaultValue: 1},   //堂食开关 0：关  1：开
        supportWaidai       : {type: Sequelize.INTEGER, field:"support_waidai",defaultValue: 1},    //外带开关 0：关  1：开
        supportWaimai       : {type: Sequelize.INTEGER, field:"support_waimai",defaultValue: 1},    //外卖开关 0：关  1：开
        state                : {type: Sequelize.INTEGER, field:"state",defaultValue: 1},    //打印机开关 0：关  1：开
        spareIp              : {type: Sequelize.TEXT, field:"spare_ip"},    //备用打印机ip
    }, {
        freezeTableName: true, //默认为false，当为false时，如果你数据库中已有表a的话，sequelize会修改你的表名，后缀加个s
        timestamps:false
    });
	return sqlite;
};