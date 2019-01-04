const Sequelize = require('sequelize');

exports.define = function (sqlite) {
  if (!sqlite.models) {
    sqlite.models = {}
  }
  /**
   * @desc 重量包详情表
   * */
  sqlite.models.TbArea = sqlite.define('tb_weight_package_detail', {
    id: { type: Sequelize.TEXT, primaryKey: true },                 //id
    name: { type: Sequelize.TEXT, field: 'name' },                     //名称
    sort: { type: Sequelize.INTEGER, field: 'sort' },                  //排序
    createTime: { type: Sequelize.TEXT, field: 'create_time' },              //创建时间
    isUsed: { type: Sequelize.BOOLEAN, field: 'is_used' },               //是否使用
    weight: { type: Sequelize.INTEGER, field: 'weight' },         //重量
    weightPackageId: { type: Sequelize.TEXT, field: 'weight_package_id' },        //重量包ID
  }, {
      freezeTableName: true, //默认为false，当为false时，如果你数据库中已有表a的话，sequelize会修改你的表名，后缀加个s
      timestamps: false   //默认为true，它会为你的表添加两个额外的字段“createdAt”、"updatedAt"。
    });

  return sqlite;
};