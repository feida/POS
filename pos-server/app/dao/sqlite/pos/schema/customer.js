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
     * @desc 微信用户表
     * */
    sqlite.models.tbCustomer = sqlite.define('tb_customer', {
        id              : {type: Sequelize.TEXT,    primaryKey: true },        //id
        wechatId       : {type: Sequelize.TEXT,    field: 'wechat_id'},
        nickname       : {type: Sequelize.TEXT ,field: 'nickname'},
        telephone       : {type: Sequelize.TEXT ,   field: 'telephone'},
        sex             : {type: Sequelize.INTEGER ,   field: 'sex'},
    }, {
        freezeTableName: true, //默认为false，当为false时，如果你数据库中已有表a的话，sequelize会修改你的表名，后缀加个s
        timestamps:false   //默认为true，它会为你的表添加两个额外的字段“createdAt”、"updatedAt"。
    });

	return sqlite;
};