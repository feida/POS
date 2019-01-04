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
     * @desc 桌位表
     * */
    sqlite.models.TbTableQrcode = sqlite.define('tb_table_qrcode', {
        id                  : {type: Sequelize.TEXT,    primaryKey: true },         //id
        tableNumber         : {type: Sequelize.INTEGER,    field:"table_number"},      //桌号
        customerCount       : {type: Sequelize.INTEGER, field:"customer_count"},    //就餐人数
        tableState          : {type: Sequelize.INTEGER, field:"table_state",defaultValue: 0},       //桌位状态（用于管理桌位是否空闲，使用和预定等状态） --0：空闲1：使用2：预定
        areaId              : {type: Sequelize.TEXT, field:"area_id"},           //区域ID 关联 tb_area 表 id 字段
        tablePass           : {type: Sequelize.TEXT, field:"table_pass"},           //加密内容
        shopDetailId        : {type: Sequelize.TEXT,    field:"shop_detail_id"},    //店铺ID
    }, {
        freezeTableName: true, //默认为false，当为false时，如果你数据库中已有表a的话，sequelize会修改你的表名，后缀加个s
        timestamps:false
    });

	return sqlite;
};