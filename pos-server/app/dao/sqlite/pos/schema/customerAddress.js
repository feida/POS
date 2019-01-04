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
     * @desc 用户地址
     * */
    sqlite.models.tbCustomer = sqlite.define('tb_customer_address', {
        id              : {type: Sequelize.TEXT,    primaryKey: true },        //id
        name            : {type: Sequelize.TEXT,    field: 'name'},
        sex             : {type: Sequelize.INTEGER ,   field: 'sex'},
        address            : {type: Sequelize.TEXT ,   field: 'address'},
        addressReality   : {type: Sequelize.TEXT ,   field: 'address_reality'},
        customerId      : {type: Sequelize.TEXT ,   field: 'customer_id'},
        state             : {type: Sequelize.INTEGER ,   field: 'state',defaultValue: 1},
        mobileNo             : {type: Sequelize.INTEGER ,   field: 'mobile_no'},
    }, {
        freezeTableName: true, //默认为false，当为false时，如果你数据库中已有表a的话，sequelize会修改你的表名，后缀加个s
        timestamps:false   //默认为true，它会为你的表添加两个额外的字段“createdAt”、"updatedAt"。
    });

	return sqlite;
};