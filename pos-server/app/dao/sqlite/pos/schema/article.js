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
     * @desc 菜品表
     * */
    sqlite.models.TbArticle = sqlite.define('tb_article', {
        id: { type: Sequelize.TEXT, primaryKey: true },             //id
        name: { type: Sequelize.TEXT, field: 'name' },                 //类型名称
        articleFamilyId: { type: Sequelize.TEXT, field: 'article_family_id' },    //菜品类型  关联 tb_article_family 表 id 字段
        price: { type: Sequelize.INTEGER, field: 'price' },                //菜品价格
        fansPrice: { type: Sequelize.INTEGER, field: 'fans_price' },           //粉丝价格
        articleType: { type: Sequelize.INTEGER, field: 'article_type' },         //菜品类型 1：普通餐品  2：套餐餐品
        isEmpty: { type: Sequelize.INTEGER, field: 'is_empty' },             //是否沽清 0：未沽清 1：已沽清
        stockWorkingDay: { type: Sequelize.INTEGER, field: 'stock_working_day' },     //工作日库存
        stockWeekend: { type: Sequelize.INTEGER, field: 'stock_weekend' },        //周末库存
        currentWorkingStock: { type: Sequelize.INTEGER, field: 'current_working_stock' },//当前库存
        activated: { type: Sequelize.INTEGER, field: 'activated' },            //是否上架 0：下架  1：上架
        unit: { type: Sequelize.TEXT, field: 'unit' },                 //菜品单位  如：份，瓶，听 等等
        hasUnit: { type: Sequelize.TEXT, field: 'has_unit' },             //是否有老规格属性 (以字符串形式保存老规格ID，如有关联多个老规格数据，则以 " , " 分隔。 eg：124,125,126),(关联 tb_article_price 表 unit_ids 字段),(以此字段判断当前菜品是否为老规格单品，如果不是老规格单品，则此字段默认为 null)
        sort: { type: Sequelize.INTEGER, field: 'sort' },                 //排序
        elemeName: { type: Sequelize.TEXT, field: 'eleme_name' },           //饿了么名称 用于匹配第三方外卖品牌
        virtualId: { type: Sequelize.TEXT, field: 'virtual_id' },           //虚拟餐包ID
        initials: { type: Sequelize.TEXT, field: 'initials' },             //餐品首字母缩写   便于Pos端快速查询
        unitId: { type: Sequelize.TEXT, field: 'unit_id' },              //规格id  此字段已无效。。。失误失误
        shopDetailId: { type: Sequelize.TEXT, field: 'shop_detail_id' },       //店铺ID
        mealFeeNumber: { type: Sequelize.INTEGER, field: 'meal_fee_number' },      //餐盒个数
        weightPackageId: { type: Sequelize.TEXT, field: 'weight_package_id' },    //重量包id
        openCatty: { type: Sequelize.BOOLEAN, field: 'open_catty', default: false },//是否开启称斤买卖菜品
        cattyMoney: { type: Sequelize.TEXT, field: 'catty_money' }          //称斤买卖 价格 单位（500g   斤）
    }, {
            indexes: [{
                name: 'article_id',
                unique: true,
                fields: ['id']
            }],
            freezeTableName: true, //默认为false，当为false时，如果你数据库中已有表a的话，sequelize会修改你的表名，后缀加个s
            timestamps: false
        });

    return sqlite;
};