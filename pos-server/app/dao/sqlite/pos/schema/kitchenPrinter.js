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
     * @desc 查询厨房和打印机
     * */
    sqlite.models.TbKitchenPrinter = sqlite.define('tb_kitchen_printer', {
        id                  : {type: Sequelize.TEXT, primaryKey: true },         //id
        kitchenId           : {type: Sequelize.TEXT, field:"kitchen_id"},                    //关联 tb_kitchen 表 id 字段
        printerId           : {type: Sequelize.TEXT, field:"printer_id"},                    //关联 tb_printer 表 id 字段
    }, {
        freezeTableName: true, //默认为false，当为false时，如果你数据库中已有表a的话，sequelize会修改你的表名，后缀加个s
        timestamps:false
    });

	return sqlite;
};