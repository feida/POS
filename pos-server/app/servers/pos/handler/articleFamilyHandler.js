const customSql = require("../../../model/pos/customSql");
const result = require("../../../util/resultUtil");
const dateUtil = require("../../../util/dateUtil");
const generalUtil = require('../../../util/generalUtil');
const lodash = require("lodash");
const articleTypes = require('../../../constant/OrderItemType');
const async = require('async');


//-------------新添加层controller
const articleFamilyController = require("../../../controller/pos/articleFamily");

module.exports = function (app) {
    return new Handler(app);
}

var Handler = function (app) {
    this.app = app;
}

var handler = Handler.prototype;


/**
 * 查询所有菜品信息
 * @param msg
 * @param session
 * @param next
 */
handler.listArticleInfo = function (msg, session, next) { // TODO:
    let sql = "select * from tb_article_family ORDER BY sort ASC";
    customSql.getAllCustomSqlInfo(sql, (err, articleFamilyList) => {
        // articleList(function (articleList) {
        //     for (var family_i = 0; family_i < articleFamilyList.length; family_i++) {
        //         var articleFamily = articleFamilyList[family_i];
        //         articleFamily.count = 0;
        //         articleFamily.article_list = [];
        //         for (var article_i = 0; article_i < articleList.length; article_i++) {
        //             var article = articleList[article_i];
        //             if (article.article_family_id == articleFamily.id) {
        //                 article.weightPackagekList = [];
        //                 articleFamily.article_list.push(article);
        //             }
        //         }
        //     }
        //     console.log('--------------,articleFamilyList---',articleFamilyList);
            return result.success(next, articleFamilyList);
        // })
    })
}

var articleList = function (cb) {
    getSupportTimeArticleAndDiscountMap(function (articleAndDiscountMap) {
        let sql = "SELECT a.*,count(aun.id) newUnit FROM tb_article a LEFT JOIN tb_article_unit_new aun on a.id = aun.article_id where a.activated = 1 GROUP BY a.id";
        customSql.getAllCustomSqlInfo(sql, function (error, articleList) { // TODO:
            sql = "select * from tb_article_price";
            customSql.getAllCustomSqlInfo(sql, function (error, articlePriceList) { // TODO:
                mealAttrList(function (mealAttrList) {
                    for (var article_i in articleList) {
                        var article = articleList[article_i];
                        //设置 菜品供应时间和折扣
                        if (articleAndDiscountMap[article.id]) {
                            article.discount = articleAndDiscountMap[article.id].discount;
                        } else {
                            article.current_working_stock = 0;
                        }
                        //前端需要的预设属性
                        article.state = 0;
                        article.count = 0;
                        article.notSellMsg = null;// 菜品不出售信息
                        article.unitList = []; // 此字段预留给 新规格菜品的规格列表
                        if (article.article_type == 1) { //单品
                            if (result.isNotEmpty(article.has_unit)) { //老规格单品
                                var article_price_list = [];
                                for (var articlePrice_i in articlePriceList) {
                                    var articlePrice = articlePriceList[articlePrice_i];
                                    if (article.id == articlePrice.article_id) {
                                        //前端需要的预设属性
                                        articlePrice.state = 0;
                                        article_price_list.push(articlePrice);
                                    }
                                }
                                article.article_price_list = article_price_list;
                            }
                        } else if (article.article_type == 2) { //套餐
                            article.meal_attr_list = [];
                            for (var mealAttr_i in mealAttrList) {
                                var mealAttr = mealAttrList[mealAttr_i];
                                if (article.id == mealAttr.article_id) {
                                    article.meal_attr_list.push(mealAttr);
                                }
                            }
                        }
                    }
                    cb(articleList);
                })
            })
        })
    });
}

var mealAttrList = function (cb) {
    let sql = "select * from tb_meal_attr";
    customSql.getAllCustomSqlInfo(sql, function (error, mealAttrList) { // TODO:
        sql = `select a.*,b.current_working_stock from tb_meal_item  a left   join  tb_article b  on     a.article_id=b.id `;
        customSql.getAllCustomSqlInfo(sql, function (error, mealItemList) {  // TODO:
            for (var attr_i in mealAttrList) {
                var mealAttr = mealAttrList[attr_i];
                mealAttr.meal_item_list = [];
                for (var item_i in mealItemList) {
                    var mealItem = mealItemList[item_i];
                    if (mealAttr.id == mealItem.meal_attr_id) {
                        //前端需要的预设属性
                        mealItem.state = 0;
                        mealItem.activated = 1;
                        mealItem.isEmpty = 0;
                        mealAttr.meal_item_list.push(mealItem);
                    }
                }
            }
            cb && cb(mealAttrList);
        })
    })
}


//判断菜品是否在折扣范围内
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

function getSupportTimeArticleAndDiscountMap(cb) { // TODO:
    let sql = "SELECT * from tb_support_time where begin_time <= time('now', 'localtime') and end_time >= time('now', 'localtime')";
    customSql.getAllCustomSqlInfo(sql, (err, supportTimes) => {
        var supportTimeIds = [];
        for (var time of supportTimes) {
            if (dateUtil.isWeekDay(time.support_week_bin)) {
                supportTimeIds.push(time.id);
            }
        }
        sql = "SELECT a.id,st.discount from tb_support_time st LEFT JOIN tb_article_support_time ast on st.id = ast.support_time_id" +
            " LEFT JOIN tb_article a on ast.article_id = a.id ";
        if (supportTimeIds && supportTimeIds.length != 0) {
            sql += " where st.id in (" + supportTimeIds.toString() + ")";
        }
        customSql.getAllCustomSqlInfo(sql, (error, data) => {
            cb(generalUtil.listToMap(data));
        });
    });
}

/**
 * 库存 所有菜品信息
 * */
handler.listArticleStockInfo = function (msg, session, next) {
    let sql = "select * from tb_article_family ORDER BY sort ASC";
    customSql.getAllCustomSqlInfo(`${sql}`, (error, articleFamilyList) => {
        articleStockList(function (articleList) {
            for (var family_i = 0; family_i < articleFamilyList.length; family_i++) {
                var articleFamily = articleFamilyList[family_i];
                articleFamily.count = 0;
                articleFamily.article_list = [];
                for (var article_i = 0; article_i < articleList.length; article_i++) {
                    var article = articleList[article_i];
                    if (article.article_family_id == articleFamily.id) {
                        articleFamily.article_list.push(article);
                    }
                }
            }

            articleFamilyList.map(function (item) {
                item.article_list.map(function (model) {
                    //  套餐
                    if (model.article_type == 2) {
                        let arrItem = [];
                        model.meal_attr_list.map(function (m) {
                            //  必选项
                            let mustChoice = [];
                            if (m.choice_type == 0) {    //  属性必选
                                for (let item of m.meal_item_list) {
                                    if (item.current_working_stock > 0) {
                                        mustChoice.push(item.current_working_stock);
                                    }
                                }
                                if (mustChoice.length >= m.choice_count) {
                                    arrItem.push(lodash.min(mustChoice));
                                } else {
                                    arrItem.push(0);
                                }
                            }
                        });
                        model.current_working_stock = lodash.min(arrItem.length ? arrItem : [0]);
                    }
                })
            });

            result.success(next, articleFamilyList);
        });
    });
}

var articleStockList = function (cb) {
    getSupportTimeArticleAndDiscountMap(function (articleAndDiscountMap) {
        customSql.getAllCustomSqlInfo(`select * from tb_article`,function (error, articleList) {
            customSql.getAllCustomSqlInfo(`select * from tb_article_price`,function (error, articlePriceList) {
                mealAttrList(function (mealAttrList) {
                    for (var article_i in articleList) {
                        var article = articleList[article_i];
                        //设置 菜品供应时间和折扣
                        if (articleAndDiscountMap[article.id]) {
                            article.discount = articleAndDiscountMap[article.id].discount;
                        } else {
                            article.current_working_stock = 0;
                        }
                        //前端需要的预设属性
                        article.state = 0;
                        article.count = 0;
                        article.notSellMsg = null;// 菜品不出售信息
                        article.unitList = []; // 此字段预留给 新规格菜品的规格列表
                        if (article.article_type == 1) { //单品
                            if (result.isNotEmpty(article.has_unit)) { //老规格单品
                                var article_price_list = [];
                                for (var articlePrice_i in articlePriceList) {
                                    var articlePrice = articlePriceList[articlePrice_i];
                                    if (article.id == articlePrice.article_id) {
                                        //前端需要的预设属性
                                        articlePrice.state = 0;
                                        article_price_list.push(articlePrice);
                                    }
                                }
                                article.article_price_list = article_price_list;
                            }
                        } else if (article.article_type == 2) { //套餐
                            article.meal_attr_list = [];
                            for (var mealAttr_i in mealAttrList) {
                                var mealAttr = mealAttrList[mealAttr_i];
                                if (article.id == mealAttr.article_id) {
                                    article.meal_attr_list.push(mealAttr);
                                }
                            }
                        }
                    }
                    cb(articleList);
                })
            })
        })
    });
}

/**
* 获取tb_article_family列表
**/
handler.getArticleFamily = function (msg, session, next) {
    let sql = "select * from tb_article_family WHERE id in (SELECT article_family_id FROM tb_article)  ORDER BY sort ASC";
    customSql.getAllCustomSqlInfo(sql, function (err, articleFamilyList) {
        result.success(next, articleFamilyList);
    });
}

/**
 * 根据article_family_id获取菜品
 * @param msg.article_family_id
 * @param session
 * @param next 
 */
handler.getArticleByFamilyId = function (msg, session, next) {
    articleFamilyController.getArticleByFamilyId(msg,(err, reply) => {
        return err ?  result.error(next,err.toString(),msg):result.success(next,reply);
    });
   // let articleFamilyId = msg.article_family_id;
   //
   //
   //  let sql = `select * from tb_article WHERE article_family_id='${articleFamilyId}' and activated = 1 ORDER BY sort ASC`;
   //  customSql.getAllCustomSqlInfo(sql, function (err, articlesInfo) {
   //      // 单品 老规格 新规格 套餐 称重包
   //      async.eachLimit(articlesInfo, 2, function (articleInfo, e_cb) {
   //          sql = `select * from tb_support_time where id in (select support_time_id from tb_article_support_time where article_id = '${articleInfo.id}' and begin_time <= time('now', 'localtime') and end_time >= time('now', 'localtime'))`
   //          customSql.getAllCustomSqlInfo(sql, (err, supportTimeInfo) => {
   //              // !、检测折扣时间 supportTimePass
   //              articleInfo.discount = 100; // 默认100
   //              for (let i = supportTimeInfo.length - 1; i >= 0; i--) {
   //                  if (supportTimePass(supportTimeInfo[i])) {
   //                      articleInfo.discount = supportTimeInfo[i].discount
   //                  }
   //              }
   //              articleInfo.current_working_stock = supportTimeInfo.length > 0 ? articleInfo.current_working_stock : 0;
   //              // 2、菜品类型
   //              articleInfo.article_unit = articleTypes.ARTICLE; // 默认单品
   //              if (articleInfo.has_unit && articleInfo.has_unit !== '' && articleInfo.has_unit !== ' ') {//老规格
   //                  articleInfo.article_unit = articleTypes.UNITPRICE;
   //                  e_cb(null, null);
   //              } else if (articleInfo.open_catty) { // 重量包
   //                  articleInfo.article_unit = articleTypes.WEIGHT;
   //                  e_cb(null, null);
   //              } else if (articleInfo.article_type == 2) { // 套餐
   //                  articleInfo.article_unit = articleTypes.SETMEALS;
   //                  e_cb(null, null);
   //              } else { // 新规格
   //                  let sql = `select * from tb_article_unit_new where article_id = '${articleInfo.id}'`;
   //                  customSql.getOneCustomSqlInfo(sql, function (err, new_unit) {
   //                      if (new_unit) {
   //                          articleInfo.article_unit = articleTypes.UNIT_NEW;
   //                      }
   //                      e_cb(null, null);
   //                  })
   //              }
   //          })
   //      }, function (err) {
   //          console.log('----------------',articlesInfo)
   //          result.success(next, articlesInfo);
   //      });
   //  });
}

/**
 * Check the menu details according to the searchKey
 * @param msg.article_family_id
 * @param session
 * @param next
 */
handler.getArticleBySearchKey = function (msg, session, next) {
    articleFamilyController.getArticleBySearchKey(msg,(err, reply) => {
        return err ?  result.error(next,err.toString(),msg):result.success(next,reply);
    });
}