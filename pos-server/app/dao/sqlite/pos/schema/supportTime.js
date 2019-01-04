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
     * @desc 供应时间表
     * */
    sqlite.models.TbSupportTime = sqlite.define('tb_support_time', {
        id                  : {type: Sequelize.INTEGER,    primaryKey: true },         //id
        name                : {type: Sequelize.TEXT,    field:"name"},              //名称
        beginTime           : {type: Sequelize.TEXT,    field:"begin_time"},        //开始时间
        endTime             : {type: Sequelize.TEXT,    field:"end_time"},          //结束时间
        supportWeekBin      : {type: Sequelize.INTEGER, field:"support_week_bin"},//供应日期的二进制表达 共7位二进制，每一位对应周一到周日 0000001 周一 0000010 周二  0000011 周一，周二
        remark              : {type: Sequelize.TEXT,    field:"remark"},            //备注
        shopDetailId        : {type: Sequelize.TEXT, field:"shop_detail_id"},       //店铺ID
        discount            : {type: Sequelize.INTEGER, field:"discount"},          //备注
    }, {
        freezeTableName: true, //默认为false，当为false时，如果你数据库中已有表a的话，sequelize会修改你的表名，后缀加个s
        timestamps:false
    });

    return sqlite;
};