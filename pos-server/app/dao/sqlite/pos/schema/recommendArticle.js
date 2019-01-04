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
     * @desc 打印机表
     * */
    sqlite.models.TbPrinter = sqlite.define('tb_recommend_article', {
        id                  : {type: Sequelize.TEXT,    primaryKey: true },         //id
        recommendId        : {type: Sequelize.TEXT,    field:"recommend_id"},              //推荐菜品主键id
        articleId           : {type: Sequelize.INTEGER,    field:"article_id"},              //菜品id
        maxCount            : {type: Sequelize.INTEGER,    field:"max_count"},              //最大购买数量
        price               : {type: Sequelize.REAL,    field:"price"},              //商品金额
        articleName         : {type: Sequelize.TEXT,    field:"article_name"},              //商品名称
        createTime         : {type: Sequelize.TEXT,    field:"create_time"},              //创建时间
        sort         : {type: Sequelize.INTEGER,    field:"sort"},              //
        kitchenId         : {type: Sequelize.TEXT,    field:"kitchen_id"},              //
    }, {
        freezeTableName: true, //默认为false，当为false时，如果你数据库中已有表a的话，sequelize会修改你的表名，后缀加个s
        timestamps:false
    });
	return sqlite;
};