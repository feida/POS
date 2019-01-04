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
     * @desc 用户表
     * */
    sqlite.models.TbUser = sqlite.define('tb_user', {
        id                  : {type: Sequelize.TEXT,    primaryKey: true },         //id
        username            : {type: Sequelize.TEXT,    field:"name"},              //用户名
        password            : {type: Sequelize.TEXT,    field:"pwd"},               //登录密码
        shopDetailId        : {type: Sequelize.TEXT,    field:"shop_detail_id"},    //店铺ID
        brandId             : {type: Sequelize.TEXT,    field:"brand_id"},          //品牌ID
        superPwd             : {type: Sequelize.TEXT,    field:"super_pwd"},          //
        state               : {type: Sequelize.INTEGER,    field:"state"},          // 1启动 0 删除
    }, {
        freezeTableName: true, //默认为false，当为false时，如果你数据库中已有表a的话，sequelize会修改你的表名，后缀加个s
        timestamps:false
    });

	return sqlite;
};