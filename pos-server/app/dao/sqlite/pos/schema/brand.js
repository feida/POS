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
     * @desc 品牌设置表
     * */
    sqlite.models.TbBrabd = sqlite.define('tb_brand', {
        id                  :{ type: Sequelize.TEXT,    primaryKey: true },     //id
        // brandName           : {type: Sequelize.TEXT,    field:"brand_name"},    //品牌名称
        // brandLogo           : {type: Sequelize.TEXT,    field:"brand_logo"},    //品牌Logo
    }, {
        freezeTableName: true, //默认为false，当为false时，如果你数据库中已有表a的话，sequelize会修改你的表名，后缀加个s
        timestamps:false
    });

	return sqlite;
};