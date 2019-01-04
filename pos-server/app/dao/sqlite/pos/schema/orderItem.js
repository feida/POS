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
     * @desc 订单项表
     * */
    sqlite.models.TbOrderItem = sqlite.define('tb_order_item', {
        id: { type: Sequelize.TEXT, primaryKey: true },         //id
        orderId: { type: Sequelize.TEXT, field: "order_id" },          //订单ID  关联 tb_order 表 id 字段
        articleId: { type: Sequelize.TEXT, field: "article_id" },        //菜品_id 关联 tb_article 表 id 字段
        articleName: { type: Sequelize.TEXT, field: "article_name" },      //菜品名称
        count: { type: Sequelize.INTEGER, field: "count" },             //订单项数量
        originalPrice: { type: Sequelize.INTEGER, field: "original_price" },    //原价
        noDiscountPrice: { type: Sequelize.INTEGER, field: "no_discount_price" },    //打折前原价
        unitPrice: { type: Sequelize.INTEGER, field: "unit_price" },        //单价（和数量参与计算的价格）
        finalPrice: { type: Sequelize.INTEGER, field: "final_price" },       //最终计算价格（数量 X单价）
        remark: { type: Sequelize.TEXT, field: "remark" },            //备注
        sort: { type: Sequelize.INTEGER, field: "sort" },              //订单排序
        status: { type: Sequelize.INTEGER, field: "status" },            //菜品状态  -- 1：已下单 2：已退菜  3：加菜
        type: { type: Sequelize.INTEGER, field: "type" },              //订单项类型 --1：单品 2：老规格 3：套餐 4：套餐子品 5：新规格 6：推荐餐包 7:称重菜品
        parentId: { type: Sequelize.TEXT, field: "parent_id" },         //父订单ID   -- 当  type = 4 （套餐子品）时， parent_id 表示关联的父项，关联  tb_order_item 表 id 字段。当 type != 4 时，默认为 null
        createTime: { type: Sequelize.TEXT, field: "create_time" },       //创建时间
        mealItemId: { type: Sequelize.TEXT, field: "meal_item_id" },      //套餐子项id  -- 当  type = 4 （套餐子品）时， meal_item_id 表示此项具体的套餐子品ID，关联  tb_meal_item表 id 字段。当 type != 4 时，默认为 null
        kitchenId: { type: Sequelize.TEXT, field: "kitchen_id" },        //出餐厨房  关联 tb_kitchen 表 id 字段
        recommendId: { type: Sequelize.TEXT, field: "recommend_id" },      //推荐餐包  关联 tb_recommend 表 id 字段 ，具体实现的是 推荐餐品的功能，暂时不做。（当前Pos2.0项目，未创建此表）
        orginCount: { type: Sequelize.INTEGER, field: "orgin_count" },       //原始数量
        refundCount: { type: Sequelize.INTEGER, field: "refund_count" },      //退菜数量
        grantCount: { type: Sequelize.INTEGER, field: "grant_count",defaultValue: 0 },      //赠菜数量
        mealFeeNumber: { type: Sequelize.INTEGER, field: "meal_fee_number" },   //餐盒数量
        changeCount: { type: Sequelize.INTEGER, field: "change_count" },      //pos端修改未完成订单菜品数量的值
        printFailFlag: { type: Sequelize.INTEGER, field: "print_fail_flag" },   //0-未打印 1-打印异常 2-异常修正 3打印正常
        posDiscount: { type: Sequelize.INTEGER, field: "pos_discount", defaultValue: 100 },   //  保存pos端折扣率 (计算后的实际折扣率)
        weight: { type: Sequelize.FLOAT, field: "weight", defaultValue: 0 },   // 菜品重量
        needRemind: { type: Sequelize.INTEGER, field: "need_remind", defaultValue: false },   // 是否需要提醒
    }, {
            indexes: [{
                name: 'item_id',
                unique: true,
                fields: ['id']
            }, {
                name: 'order_id',
                fields: ['order_id']
            }],
            freezeTableName: true, //默认为false，当为false时，如果你数据库中已有表a的话，sequelize会修改你的表名，后缀加个s
            timestamps: false
        });

    return sqlite;
};