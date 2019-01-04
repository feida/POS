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
     * @desc 菜品出餐厨房表
     * */
    sqlite.models.TbArticleKitchen = sqlite.define('tb_article_kitchen', {
        id                   : {type: Sequelize.TEXT,    primaryKey: true },         //id
        articleId           : {type: Sequelize.TEXT,    field:"article_id"},        //关联 tb_article 表 id 字段
        kitchenId           : {type: Sequelize.TEXT,    field:"kitchen_id"},        //关联 tb_kitchen 表 id 字段
    }, {
        freezeTableName: true, //默认为false，当为false时，如果你数据库中已有表a的话，sequelize会修改你的表名，后缀加个s
        timestamps:false
    });

    return sqlite;
};