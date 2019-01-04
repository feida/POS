/**
 * @author wxh on 2018/6/20
 * @copyright
 * @desc
 */
const result = require("../../util/resultUtil");
const dateUtil = require("../../util/dateUtil");
const generalUtil = require("../../util/generalUtil");
const { log } = require("../../util/fileUtil");
const async = require("async");
const lodash = require("lodash");
const moment = require("moment");

const customSqlModel = require("../../model/pos/customSql");
const shopDetailModel = require("../../model/pos/shopDetail");

/**
 * 根据article_family_id获取菜品及库存
 * @param msg
 * @param callback
 * @returns {*}
 */
exports.getArticleByFamilyId = function (msg, callback) {
    let articleFamilyId = msg.article_family_id;
    if (!articleFamilyId)  return callback("缺少 article_family_id 参数~");

    async.parallel({
        articlesInfo:(cb)=> {
            /**
             * st.begin_time,st.end_time,st.support_week_bin,st.discount,a.id,a.name,a.article_family_id,a.price,a.fans_price,a.article_type,a.has_unit,a.is_empty, a.current_working_stock,a.meal_fee_number,a.weight_package_id,a.open_catty,a.catty_money  from tb_article a
             LEFT JOIN tb_article_support_time  ast on ast.article_id = a.id
             LEFT JOIN tb_support_time  st on st.id = ast.support_time_id
             WHERE article_family_id='${articleFamilyId}' and activated = 1 ORDER BY a.sort ASC
             * @type {string}
             */
            let sql = `
                select st.begin_time,st.end_time,st.support_week_bin,st.discount,a.id,a.name,a.article_family_id,a.price,a.fans_price,a.article_type,a.has_unit,a.is_empty,
                a.current_working_stock,a.meal_fee_number,a.weight_package_id,a.open_catty,a.catty_money, a.activated, a.initials,
                CASE
                    WHEN (a.has_unit != ' ' and a.has_unit is not null)
                    THEN
                        '2' 
                    ELSE
                        (CASE WHEN (SELECT id from tb_article_unit_new where article_id =  a.id) is not null THEN '5' ELSE	'' END)
                    END article_unit
                from tb_article a
                LEFT JOIN tb_article_support_time  ast on ast.article_id = a.id 
                LEFT JOIN tb_support_time  st on st.id = ast.support_time_id
                WHERE article_family_id='${articleFamilyId}' ORDER BY a.sort ASC`;
            customSqlModel.getAllCustomSqlInfo(sql,  (err, articlesInfo)=> {
                if (err) return cb(err);
                cb(null,articlesInfo)
            });
        },
        shopDetail: (cb)=> {
            shopDetailModel.getShopDetailFindOne((err, shopDetail)=> {
                if (err) return cb(err);
                cb(null, shopDetail);
            });
        },
    },function(error, results){
        if (error) return callback(error);
        let resultObj = [];
        async.eachLimit(results.articlesInfo, 1,  function(articleInfo, e_cb){
            if (!articleInfo.begin_time || !articleInfo.end_time || !articleInfo.support_week_bin) {
                articleInfo.current_working_stock = 0;
                let resultItem = lodash.find(resultObj, (o)=> {  return o.id ==articleInfo.id;});
                if (resultItem == undefined){ resultObj.push(articleInfo); }
                return e_cb()
            }
            let begin_time = `${moment().format('YYYY-MM-DD')} ${articleInfo.begin_time}`;
            let end_time = `${moment().format('YYYY-MM-DD')} ${articleInfo.end_time}`;
            if (dateUtil.isWeekDay(articleInfo.support_week_bin) && dateUtil.isBetween(begin_time,end_time)){
                if (results.shopDetail.posPlusType == 0){
                    if (articleInfo.fans_price){
                        articleInfo.fans_price = +(articleInfo.fans_price * articleInfo.discount * 0.01).toFixed(2);
                    }
                    let resultItem = lodash.find(resultObj, (o)=> {  return o.id ==articleInfo.id;});
                    if (resultItem == undefined){
                        resultObj.push(articleInfo);
                    }else {
                        if (resultItem.current_working_stock<articleInfo.current_working_stock){
                            resultItem.current_working_stock = articleInfo.current_working_stock;
                            resultItem.begin_time = articleInfo.begin_time;
                            resultItem.end_time = articleInfo.end_time;
                            resultItem.support_week_bin = articleInfo.support_week_bin;
                            resultItem.discount = articleInfo.discount;
                            resultItem.fans_price = (+articleInfo.fans_price).toFixed(2);
                        }
                    }
                    return e_cb()
                }else {
                    let resultItem = lodash.find(resultObj, (o)=> {  return o.id ==articleInfo.id;});
                    if (resultItem == undefined){
                        resultObj.push(articleInfo);
                    }else {
                        if (resultItem.current_working_stock<articleInfo.current_working_stock){
                            resultItem.current_working_stock = articleInfo.current_working_stock;
                            resultItem.begin_time = articleInfo.begin_time;
                            resultItem.end_time = articleInfo.end_time;
                            resultItem.support_week_bin = articleInfo.support_week_bin;
                            resultItem.discount = articleInfo.discount;
                        }
                    }
                    return e_cb()
                }
            }else {
                articleInfo.current_working_stock = 0;
                let resultItem = lodash.find(resultObj, (o)=> {  return o.id ==articleInfo.id;});
                if (resultItem == undefined){ resultObj.push(articleInfo); }
                return e_cb()
            }
        }, (err) => {
            if (err) return callback(err);
            return callback(null,resultObj)
        });
    });
};

/**
 * 根据article_family_id获取菜品及库存
 * @param msg
 * @param callback
 * @returns {*}
 */
exports.getArticleBySearchKey = function (msg, callback) {
    let searchKey = msg.searchKey;
    // if (!articleFamilyId)  return callback("缺少 article_family_id 参数~");

    async.parallel({
        articlesInfo:(cb)=> {
            /**
             * st.begin_time,st.end_time,st.support_week_bin,st.discount,a.id,a.name,a.article_family_id,a.price,a.fans_price,a.article_type,a.has_unit,a.is_empty, a.current_working_stock,a.meal_fee_number,a.weight_package_id,a.open_catty,a.catty_money  from tb_article a
             LEFT JOIN tb_article_support_time  ast on ast.article_id = a.id
             LEFT JOIN tb_support_time  st on st.id = ast.support_time_id
             WHERE article_family_id='${articleFamilyId}' and activated = 1 ORDER BY a.sort ASC
             * @type {string}
             */
            let sql = `
                select st.begin_time,st.end_time,st.support_week_bin,st.discount,a.id,a.name,a.article_family_id,a.price,a.fans_price,a.article_type,a.has_unit,a.is_empty,
                a.current_working_stock,a.meal_fee_number,a.weight_package_id,a.open_catty,a.catty_money, a.activated, a.initials,
                CASE
                    WHEN (a.has_unit != ' ' and a.has_unit is not null)
                    THEN
                        '2' 
                    ELSE
                        (CASE WHEN (SELECT id from tb_article_unit_new where article_id =  a.id) is not null THEN '5' ELSE	'' END)
                    END article_unit
                from tb_article a
                LEFT JOIN tb_article_support_time  ast on ast.article_id = a.id 
                LEFT JOIN tb_support_time  st on st.id = ast.support_time_id
                WHERE initials like '%${searchKey}%' or a.name like '%${searchKey}%' ORDER BY a.sort ASC`;
            customSqlModel.getAllCustomSqlInfo(sql,  (err, articlesInfo)=> {
                if (err) return cb(err);
                cb(null,articlesInfo)
            });
        },
        shopDetail: (cb)=> {
            shopDetailModel.getShopDetailFindOne((err, shopDetail)=> {
                if (err) return cb(err);
                cb(null, shopDetail);
            });
        },
    },function(error, results){
        if (error) return callback(error);
        let resultObj = [];
        async.eachLimit(results.articlesInfo, 1,  function(articleInfo, e_cb){
            if (!articleInfo.begin_time || !articleInfo.end_time || !articleInfo.support_week_bin) {
                articleInfo.current_working_stock = 0;
                let resultItem = lodash.find(resultObj, (o)=> {  return o.id ==articleInfo.id;});
                if (resultItem == undefined){ resultObj.push(articleInfo); }
                return e_cb()
            }
            let begin_time = `${moment().format('YYYY-MM-DD')} ${articleInfo.begin_time}`;
            let end_time = `${moment().format('YYYY-MM-DD')} ${articleInfo.end_time}`;
            if (dateUtil.isWeekDay(articleInfo.support_week_bin) && dateUtil.isBetween(begin_time,end_time)){
                if (results.shopDetail.posPlusType == 0){
                    if (articleInfo.fans_price){
                        articleInfo.fans_price = +(articleInfo.fans_price * articleInfo.discount * 0.01).toFixed(2);
                    }
                    let resultItem = lodash.find(resultObj, (o)=> {  return o.id ==articleInfo.id;});
                    if (resultItem == undefined){
                        resultObj.push(articleInfo);
                    }else {
                        if (resultItem.current_working_stock<articleInfo.current_working_stock){
                            resultItem.current_working_stock = articleInfo.current_working_stock;
                            resultItem.begin_time = articleInfo.begin_time;
                            resultItem.end_time = articleInfo.end_time;
                            resultItem.support_week_bin = articleInfo.support_week_bin;
                            resultItem.discount = articleInfo.discount;
                            resultItem.fans_price = (+articleInfo.fans_price).toFixed(2);
                        }
                    }
                    return e_cb()
                }else {
                    let resultItem = lodash.find(resultObj, (o)=> {  return o.id ==articleInfo.id;});
                    if (resultItem == undefined){
                        resultObj.push(articleInfo);
                    }else {
                        if (resultItem.current_working_stock<articleInfo.current_working_stock){
                            resultItem.current_working_stock = articleInfo.current_working_stock;
                            resultItem.begin_time = articleInfo.begin_time;
                            resultItem.end_time = articleInfo.end_time;
                            resultItem.support_week_bin = articleInfo.support_week_bin;
                            resultItem.discount = articleInfo.discount;
                        }
                    }
                    return e_cb()
                }
            }else {
                articleInfo.current_working_stock = 0;
                let resultItem = lodash.find(resultObj, (o)=> {  return o.id ==articleInfo.id;});
                if (resultItem == undefined){ resultObj.push(articleInfo); }
                return e_cb()
            }
        }, (err) => {
            if (err) return callback(err);
            return callback(null,resultObj)
        });
    });
};