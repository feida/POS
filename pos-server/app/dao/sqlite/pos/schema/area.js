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
     * @desc 区域表
     * */
    sqlite.models.TbArea = sqlite.define('tb_area', {
        id              : {type: Sequelize.TEXT,    primaryKey: true },        //id
        name            : {type: Sequelize.TEXT,    field: 'name'},         //区域名称
        printId         : {type: Sequelize.TEXT ,field: 'print_id'},     //关联 tb_printer 表 id 字段
        shopDetailId    : {type: Sequelize.TEXT ,   field: 'shop_detail_id'}, //店铺ID
    }, {
        freezeTableName: true, //默认为false，当为false时，如果你数据库中已有表a的话，sequelize会修改你的表名，后缀加个s
        timestamps:false   //默认为true，它会为你的表添加两个额外的字段“createdAt”、"updatedAt"。
    });

	return sqlite;
};