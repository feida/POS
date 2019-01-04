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
     * @desc 订单备注表
     * */
    sqlite.models.TbOrderRemark = sqlite.define('tb_order_remark', {
        id                      : {type: Sequelize.TEXT, primaryKey: true },    //id
        remarkName             : {type: Sequelize.TEXT, field:"remark_name"},                       //备注名称（内容）
        sort                    : {type: Sequelize.INTEGER, field:"sort"},                    //排序
        state                   : {type: Sequelize.INTEGER ,field:"state" },                    //状态  同步到 pos 端的 订单备注，都不涉及到此字段，可忽略。
        createTime             : {type: Sequelize.TEXT, field:"create_time"},                       //创建时间
        boOrderRemarkId      : {type: Sequelize.TEXT, field:"bo_order_remark_id"},                       //brand 数据库对应的 id 同步到 pos 端的 订单备注，都不涉及到此字段，可忽略。
    }, {
        freezeTableName: true, //默认为false，当为false时，如果你数据库中已有表a的话，sequelize会修改你的表名，后缀加个s
        timestamps:false
    });

	return sqlite;
};