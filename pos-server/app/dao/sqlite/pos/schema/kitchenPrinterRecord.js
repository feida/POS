/**
 * @author wxh on 2017/10/31
 * @copyright
 * @desc
 */

const Sequelize = require('sequelize');
const moment = require('moment');

exports.define = function (sqlite) {
	if (!sqlite.models) {
        sqlite.models = {}
	}
    /**
     * @desc 查询厨房和打印机
     * */
    sqlite.models.TbKitchenPrinterRecord = sqlite.define('tb_kitchen_printer_record', {
        id                   : {type: Sequelize.TEXT, primaryKey: true },         //id
        accountingTime     : { type: Sequelize.TEXT, field: "accounting_time" ,defaultValue: function () { return `${moment().format('YYYY-MM-DD')}` }},
        kitchenId           : {type: Sequelize.TEXT, field:"kitchen_id",defaultValue :''},                    //关联 tb_kitchen 表 id 字段
        kitchenName         : {type: Sequelize.TEXT, field:"kitchen_name",defaultValue :''},                    //关联 tb_kitchen 表 id 字段
        carryNumber         : {type: Sequelize.TEXT, field:"carry_number",defaultValue : 0},   //执行次数
        printerId           : {type: Sequelize.TEXT, field:"printer_id",defaultValue :''},                     //关联 tb_printer 表 id 字段  打印机id
        printerIp           : {type: Sequelize.TEXT, field:"printer_ip",defaultValue :''},                     //打印机ip
        status              : {type: Sequelize.INTEGER, field:"status",defaultValue :0},                     //当前开关 0 关、1开
    }, {
        freezeTableName: true, //默认为false，当为false时，如果你数据库中已有表a的话，sequelize会修改你的表名，后缀加个s
        timestamps:false
    });

	return sqlite;
};