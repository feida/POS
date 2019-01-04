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
     * @desc 推荐餐品表
     * */
    sqlite.models.TbPrinter = sqlite.define('tb_recommend', {
        id                  : {type: Sequelize.TEXT,    primaryKey: true },         //id
        name                : {type: Sequelize.TEXT,    field:"name"},              //推荐餐品名称
        count                : {type: Sequelize.INTEGER,    field:"count"},              //推荐餐品数量
        isUsed              : {type: Sequelize.INTEGER,    field:"is_used"},              //0：启用 / 1：停用
        sort                : {type: Sequelize.INTEGER,    field:"sort"},              //排序字段
        createTime           : {type: Sequelize.TEXT,    field:"create_time"},              //创建时间
        printType           : {type: Sequelize.INTEGER,    field:"print_type"},              //出单类型 0分单出 1整单出
        kitchenId           : {type: Sequelize.TEXT,    field:"kitchen_id"},              //出餐厨房
        choiceType           : {type: Sequelize.INTEGER,    field:"choice_type"},              //是否必选 0-任选 1-必选
    }, {
        freezeTableName: true, //默认为false，当为false时，如果你数据库中已有表a的话，sequelize会修改你的表名，后缀加个s
        timestamps:false
    });
	return sqlite;
};