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
     * @desc 订单退菜备注表
     * */
    sqlite.models.TbOrderRefundRemark = sqlite.define('tb_order_refund_remark', {
        id                              : {type: Sequelize.INTEGER,    primaryKey: true },         //id
        type                            : {type: Sequelize.INTEGER, field: "type"}, // 1 退菜备注， 2 赠菜备注
        articleId                      : {type: Sequelize.TEXT,    field:"article_id"},
        orderId                        : {type: Sequelize.TEXT,    field:"order_id"},
        refundRemarkId                : {type: Sequelize.TEXT,    field:"refund_remark_id"},
        refundRemark                   : {type: Sequelize.TEXT,    field:"refund_remark"},
        remarkSupply                    : {type: Sequelize.TEXT,    field:"remark_supply"},
        refundCount                     : {type: Sequelize.INTEGER,    field:"refund_count"},
        createTime                      : {type: Sequelize.TEXT,    field:"create_time"},
        shopId                          : {type: Sequelize.TEXT,    field:"shop_id"},
        brandId                            : {type: Sequelize.TEXT,    field:"brand_id"},
        dataSyncId                      : {type: Sequelize.TEXT,    field:"data_sync_id"},

    }, {
        freezeTableName: true, //默认为false，当为false时，如果你数据库中已有表a的话，sequelize会修改你的表名，后缀加个s
        timestamps:false
    });

	return sqlite;
};