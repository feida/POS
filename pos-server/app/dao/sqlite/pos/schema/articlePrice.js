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
     * @desc 菜品老规格详情表
     * */
    sqlite.models.TbArticlePrice = sqlite.define('tb_article_price', {
        id                      : {type: Sequelize.TEXT,    primaryKey: true },         //id (articleId + @unit_id 示例：0427606e9e754b8b90db28064dea375e@103)
        unitIds                 : {type: Sequelize.TEXT,    field:"unit_ids"},          //unit_id 关联 tb_article_unit 表 id 字段
        name                    : {type: Sequelize.TEXT,    field:"name"},              //类型名称
        price                   : {type: Sequelize.INTEGER,    field:"price"},             //价格
        fansPrice               : {type: Sequelize.INTEGER,    field:"fans_price"},        //粉丝价格
        articleId              : {type: Sequelize.TEXT,    field:"article_id"},       //菜品ID 关联 tb_article 表 id 字段
        stockWorkingDay         : {type: Sequelize.INTEGER, field:"stock_working_day"}, //工作日库存
        stockWeekend            : {type: Sequelize.INTEGER, field:"stock_weekend"},     //周末库存
        currentWorkingStock     : {type: Sequelize.INTEGER, field:"current_working_stock"},//当前库存
        shopDetailId            : {type: Sequelize.TEXT,    field:"shop_detail_id"},     //店铺ID
        sort                    : {type: Sequelize.INTEGER, field:"sort"},               //排序
        emptyRemark             : {type: Sequelize.TEXT,    field:"empty_remark"},       //清洁备注
    }, {
        freezeTableName: true, //默认为false，当为false时，如果你数据库中已有表a的话，sequelize会修改你的表名，后缀加个s
        timestamps:false
    });

	return sqlite;
};