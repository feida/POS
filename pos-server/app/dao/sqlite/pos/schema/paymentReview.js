const Sequelize = require('sequelize');

exports.define = function (sqlite) {
    if (!sqlite.models) {
        sqlite.models = {}
    }
    /**
     * @desc 结店操作记录表
     * */
    sqlite.models.tbCustomer = sqlite.define('tb_payment_review', { // 结店 复合表
        id              : { type: Sequelize.TEXT,    primaryKey: true },                // id
        dailyLogId     : { type: Sequelize.TEXT,    field:  'daily_log_id'},           // 结店id
        paymentModeId   : { type: Sequelize.INTEGER, field: "payment_mode_id"},         // 支付类型
        reportMoney     : { type: Sequelize.REAL,    field: "report_money"},            // 上报金额
        auditMoney      : { type: Sequelize.REAL,    field: 'audit_money'},             // 修改金额
        createTime      : { type: Sequelize.TEXT,    field: "create_time" },            // 修改时间
        operator        : { type: Sequelize.TEXT,    field: 'operator'}
    }, {
        freezeTableName: true, //默认为false，当为false时，如果你数据库中已有表a的话，sequelize会修改你的表名，后缀加个s
        timestamps:false   //默认为true，它会为你的表添加两个额外的字段“createdAt”、"updatedAt"。
    });

    return sqlite;
};