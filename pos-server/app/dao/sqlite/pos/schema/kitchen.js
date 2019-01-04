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
     * @desc 出餐厨房表
     * */
    sqlite.models.TbKitchen = sqlite.define('tb_kitchen', {
        id                      :{ type: Sequelize.TEXT,    primaryKey: true },     //id
        name                    : {type: Sequelize.TEXT,    field:"name"},          //厨房名称
        remark                  : {type: Sequelize.TEXT,    field:"remark",defaultValue:''},        //备注
        printerId               : {type: Sequelize.TEXT, field:"printer_id"},    //打印机IP 关联 tb_printer 表 id 字段
        shopDetailId            : {type: Sequelize.TEXT,    field:"shop_detail_id"},//店铺ID
        sort                     : {type: Sequelize.INTEGER,    field:"sort",defaultValue : 1},//排序
        beginTime               : {type: Sequelize.TEXT,    field:"begin_time" ,defaultValue:'09:00'},//开始时间 16:09:08
        endTime                 : {type: Sequelize.TEXT,    field:"end_time",defaultValue:'23:00'},  //结束时间 23:09:08
        status                 : {type: Sequelize.INTEGER,    field:"status",defaultValue: 0},  //厨房开关  0：启用  1：未启用
    }, {
        freezeTableName: true, //默认为false，当为false时，如果你数据库中已有表a的话，sequelize会修改你的表名，后缀加个s
        timestamps:false
    });

	return sqlite;
};