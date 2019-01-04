const Sequelize = require('sequelize');

exports.define = function (sqlite) {
  if (!sqlite.models) {
    sqlite.models = {}
  }
  /**
   * @desc 重量包表
   * */
  sqlite.models.TbArea = sqlite.define('tb_weight_package', {
    id              : {type: Sequelize.TEXT,    primaryKey: true },        //id
    name            : {type: Sequelize.TEXT,    field: 'name'},            //名称
    createTime      : {type: Sequelize.TEXT ,   field: 'create_time'},     //创建时间
    shopId          : {type: Sequelize.TEXT ,   field: 'shop_id'},         //店铺ID
  }, {
    freezeTableName: true, //默认为false，当为false时，如果你数据库中已有表a的话，sequelize会修改你的表名，后缀加个s
    timestamps:false   //默认为true，它会为你的表添加两个额外的字段“createdAt”、"updatedAt"。
  });

  return sqlite;
};