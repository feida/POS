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
     * @desc 电视配置信息
     * */
    sqlite.models.TbShopTvConfig = sqlite.define('tb_shop_tv_config', {
        id                  : {type: Sequelize.INTEGER,     primaryKey: true },             //id
        shopDetailId        : {type: Sequelize.TEXT,        field:"shop_detail_id"},        //店铺ID
        brandId             : {type: Sequelize.TEXT,        field:"brand_id"},              //品牌ID
        readyBackColor      : {type: Sequelize.TEXT,        field:"ready_back_color"},      //准备中背景颜色
        takeMealBackColor   : {type: Sequelize.TEXT,        field:"take_meal_back_color"},  //请取餐底色
        callBackColor       : {type: Sequelize.TEXT,        field:"call_back_color"},       //当前叫号底色
        tvBackground        : {type: Sequelize.TEXT,        field:"tv_background"},         //电视背景图片
        numberColor         : {type: Sequelize.TEXT,        field:"number_color"},          //数字的颜色
        callNumberColor     : {type: Sequelize.TEXT,        field:"call_number_color"},     //当前叫号的颜色
        text                : {type: Sequelize.TEXT,        field:"text"},                  //(请留意您的取餐信息)文本信息
        labelColor          : {type: Sequelize.TEXT,        field:"label_color"},           //准备中 请取餐  当前叫号  标签上的字体颜色

    }, {
        freezeTableName: true, //默认为false，当为false时，如果你数据库中已有表a的话，sequelize会修改你的表名，后缀加个s
        timestamps:false
    });

    return sqlite;
};