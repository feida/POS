const Sequelize = require('sequelize');

exports.define = function (sqlite) {
    if (!sqlite.models) {
        sqlite.models = {}
    }
    /**
     * @desc 结店操作记录表
     * */
    sqlite.models.tbCustomer = sqlite.define('tb_daily_log_operation', {
        id              : { type: Sequelize.TEXT,     primaryKey: true },        // id
        shopId          : { type: Sequelize.TEXT,     field:  'shop_id'},         // 店铺Id
        brandId         : { type: Sequelize.TEXT,     field: 'brand_id'},         // 店铺Id
        operator        : { type: Sequelize.TEXT,     field: 'operator'},        // 操作人
        closeStatus     : { type: Sequelize.INTEGER,  field: 'close_status'},    // 结店状态：0 失败， 1 成功
        createTime      : { type: Sequelize.TEXT,     field: "create_time" },    // 结店时间
    }, {
        freezeTableName: true, //默认为false，当为false时，如果你数据库中已有表a的话，sequelize会修改你的表名，后缀加个s
        timestamps:false   //默认为true，它会为你的表添加两个额外的字段“createdAt”、"updatedAt"。
    });

    return sqlite;
};