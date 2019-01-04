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
     * @desc 打印记录表
     * */
    sqlite.models.TbprintRecord = sqlite.define('tb_print_record', {
        id                  : {type: Sequelize.TEXT,    primaryKey: true },             //id
        serialNumber       : {type: Sequelize.TEXT,   field:"serial_number" },       //流水号
        orderTime           : {type: Sequelize.TEXT,   field:"order_time" },               //订单时间
        distributionMode  : {type: Sequelize.TEXT,   field:"distribution_mode" },               //订单方式
        tableNumber        : {type: Sequelize.TEXT,   field:"table_number" },         //座号或varCode
        ip                  : {type: Sequelize.TEXT,    field:"ip"},                    //ip
        port                : {type: Sequelize.TEXT,    field:"port"},                  //端口
        printType          : {type: Sequelize.TEXT,    field:"print_type"},             //打印机类型     // 1 小票 2 贴纸
        printTemplate      : {type: Sequelize.TEXT,    field:"print_template"},        //打印模板
        printContent       : {type: Sequelize.TEXT,    field:"print_content"},         //打印内容
        status              : {type: Sequelize.INTEGER, field:"status"},                 //打印状态       // 0 失败  1 成功
        remark              : {type: Sequelize.TEXT, field:"remark"},                     //备注
    }, {
        freezeTableName: true, //默认为false，当为false时，如果你数据库中已有表a的话，sequelize会修改你的表名，后缀加个s
        timestamps:false
    });

	return sqlite;
};