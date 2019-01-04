const dateUtil = require("../../../util/dateUtil")
const result = require("../../../util/resultUtil")
const customSqlModel = require("../../../model/pos/customSql");
const async = require('async');

module.exports = function (app) {
    return new Handler(app);
}

var Handler = function (app) {
    this.app = app;
}

var handler = Handler.prototype;

/**
 * 根据 菜品ID 获取 套餐详情 
 * @param msg.articleId
 * @param session
 * @param next 
 */
handler.getMealByArticleId = function (msg, session, next) {
    let articleId = msg.articleId;
    if (result.isEmpty(articleId)) {
        return result.error(next, "菜品ID不能为空", msg);
    }
    let sql = `select * from tb_meal_attr where article_id = '${articleId}';`
    let mealInfoRes = [];
    customSqlModel.getAllCustomSqlInfo(sql, (err, mealAttrsInfo) => { //1、获取套餐类型
        async.eachLimit(mealAttrsInfo, 1, function (mealAttrInfo, e_cb) {
            let tmp = mealAttrInfo;
            sql = `select tb_meal_item.* ,tb_article.current_working_stock ,tb_article.activated,tb_article.virtual_id  from tb_meal_item,tb_article 
                        where tb_meal_item.meal_attr_id='${mealAttrInfo.id}' and  tb_meal_item.article_id = tb_article.id and tb_article.activated = 1;`
            customSqlModel.getAllCustomSqlInfo(sql, (err, mealItemsInfo) => { //2、获取套餐子品
                if (mealItemsInfo <= 0) {
                    return e_cb(err, null);
                }
                tmp.mealItemsInfo = mealItemsInfo;
                for (let i = 0; i < tmp.mealItemsInfo.length; i++) {
                    tmp.mealItemsInfo[i].checkedState = 0;
                }
                tmp.discount = 100; // 默认100
                sql = `select * from tb_support_time where id in (select support_time_id from tb_article_support_time where article_id = '${mealAttrInfo.article_id}' and begin_time <= time('now', 'localtime') and end_time >= time('now', 'localtime'))`
                customSqlModel.getAllCustomSqlInfo(sql, (err, supportTimeInfo) => {
                    // 3、检测套餐属性折扣时间 supportTimePass
                    for (let i = 0; i < supportTimeInfo.length; i++) {
                        if (supportTimePass(supportTimeInfo[i])) {
                            tmp.discount = supportTimeInfo[i].discount
                        }
                    }
                    if (supportTimeInfo.length <= 0) { // 超出供应时间库存为0
                        tmp.current_working_stock = 0;
                    }
                    async.eachLimit(tmp.mealItemsInfo, 1, (mealItem, ee_cb) => {
                        sql = `select * from tb_support_time where id in (select support_time_id from tb_article_support_time where article_id = '${mealItem.article_id}' and begin_time <= time('now', 'localtime') and end_time >= time('now', 'localtime'))`
                        customSqlModel.getAllCustomSqlInfo(sql, (err, mealItemSupportTimeInfo) => { //3、获取套餐属性供应时间
                            mealItem.discount = 100; // 默认100
                            for (let i = 0; i < mealItemSupportTimeInfo.length; i++) {
                                if (supportTimePass(mealItemSupportTimeInfo[i])) {
                                    mealItem.discount = mealItemSupportTimeInfo[i].discount
                                }
                            }
                            if (mealItemSupportTimeInfo.length <= 0) {
                                mealItem.current_working_stock = 0;
                            }
                            ee_cb(err)
                        })
                    }, (err) => {
                        mealInfoRes.push(tmp);
                        e_cb(err, null);
                    });
                });
            });
        }, function (err) {
            result.success(next, mealInfoRes);
        });
    })
}

function supportTimePass(supportTimeItem) {
    var week = new Date().getDay() - 1;

    var today = dateUtil.sdfDay().toString();
    //开始时间
    var beginTime = today + ' ' + supportTimeItem.begin_time.toString();

    //结束时间
    var endTime = today + ' ' + supportTimeItem.end_time.toString();

    //转成时间戳 判断下单时间是否在折扣时间内
    var time = (1 << week & supportTimeItem.support_week_bin) > 0 && Date.parse(beginTime) <= Number(dateUtil.timestamp) <= Date.parse(endTime);

    return time;
}