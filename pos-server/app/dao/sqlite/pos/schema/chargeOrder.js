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
     * @desc 用户充值记录
     * */
    sqlite.models.TbChargeOrder = sqlite.define('tb_charge_order', {
        id                  : {type: Sequelize.TEXT,    primaryKey: true },        //id
        chargeMoney         : {type: Sequelize.INTEGER,    field: 'charge_money'},
        rewardMoney         : {type: Sequelize.INTEGER,    field: 'reward_money'},
        orderState          : {type: Sequelize.INTEGER,    field: 'order_state'},
        createTime          : {type: Sequelize.TEXT,    field: 'create_time'},
        finishTime          : {type: Sequelize.TEXT,    field: 'finish_time'},
        customerId          : {type: Sequelize.TEXT,    field: 'customer_id'},
        brandId             : {type: Sequelize.TEXT,    field: 'brand_id'},
        shopDetailId        : {type: Sequelize.TEXT,    field: 'shop_detail_id'},
        chargeBalance       : {type: Sequelize.INTEGER,    field: 'charge_balance'},
        rewardBalance       : {type: Sequelize.INTEGER,    field: 'reward_balance'},
        totalBalance         : {type: Sequelize.INTEGER,    field: 'total_balance'},
        numberDayNow        : {type: Sequelize.INTEGER,    field: 'number_day_now'},
        arrivalAmount      : {type: Sequelize.INTEGER,    field: 'arrival_amount'},
        endAmount           : {type: Sequelize.INTEGER,    field: 'end_amount'},
        type                : {type: Sequelize.INTEGER,    field: 'type'},
        chargeSettingId   : {type: Sequelize.TEXT,    field: 'charge_setting_id'},
    }, {
        freezeTableName: true, //默认为false，当为false时，如果你数据库中已有表a的话，sequelize会修改你的表名，后缀加个s
        timestamps:false   //默认为true，它会为你的表添加两个额外的字段“createdAt”、"updatedAt"。
    });

	return sqlite;
};