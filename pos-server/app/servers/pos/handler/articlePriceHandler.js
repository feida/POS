const result = require("../../../util/resultUtil");


const articlePriceModel = require("../../../model/pos/articlePrice");
const articleModel = require("../../../model/pos/article");
const customSqlModel = require("../../../model/pos/customSql");
const webSocketClient = require('../../../util/webSocketClient')

module.exports = function (app) {
    return new Handler(app);
}

var Handler = function (app) {
    this.app = app;
}

var handler = Handler.prototype;

/**
 * 老规格 沽清
 */
handler.articlePriceIsEmpty = function (msg, session, next) {

    //数据非空验证
    if (result.isEmpty(msg.id)) {
        return result.error(next, "老规格子项编号不能为空", msg);
    }
    if (result.isEmpty(msg.originalStock)) {
        return result.error(next, "原始数量不能为空", msg);
    }
    if (result.isEmpty(msg.articleId)) {
        return result.error(next, "老规格主项编号不能为空", msg);
    }

    //手动沽清
    var paramArticlePrice = {
        id: msg.id,
        current_working_stock: 0 //对应库存设置为0
    };
    //更新老规格子项
    articlePriceModel.updateById(msg.id, { currentWorkingStock: 0 }, function (err) {
        if (err) {
            return result.error(next, err.toString(), msg);
        } else {
            customSqlModel.getOneCustomSqlInfo(`select * from tb_article where id = '${msg.articleId}'`, function (err, article) {
                if (err) return result.error(next, err.toString(), msg);
                var articleCount = article.current_working_stock - msg.originalStock;
                var paramArticle = {
                    currentWorkingStock: articleCount > 0 ? articleCount : 0, //菜品数量不能为负数
                    isEmpty: articleCount == 0 ? 1 : 0 //菜品数量等于零 自动沽清此菜品
                };
                articleModel.updateById(article.id, paramArticle, function (err) {
                    if (err) return result.error(next, err.toString(), msg);

                    webSocketClient.articleEmpty(msg.id, () => {}) // Sold out and push it to online service
                    result.success(next, null);
                });
            });
        }
    });
}


/**
 * 编辑库存 老规格
 */
handler.articlePriceStock = function (msg, session, next) {

    //数据非空验证
    if (result.isEmpty(msg.id)) {
        return result.error(next, "老规格子项编号不能为空", msg);
    }
    if (result.isEmpty(msg.sumCount)) {
        return result.error(next, "菜品数量之和不能为空", msg);
    }
    if (result.isEmpty(msg.currentStock)) {
        return result.error(next, "菜品数量不能为空", msg);
    }
    if (result.isEmpty(msg.articleId)) {
        return result.error(next, "老规格主项编号不能为空", msg);
    }

    //老规格子项参数
    var paramArticlePrice = {
        id: msg.id,
        current_working_stock: msg.currentStock > 0 ? msg.currentStock : 0
    };
    //更新老规格子项目
    customSqlModel.updateSelective('tb_article_price', paramArticlePrice, function (err, reply) {
        if (err) return result.error(next, err.toString(), msg);
        else {
            let sql = `select id,current_working_stock from tb_article where id = '${msg.articleId}'`;
            customSqlModel.getOneCustomSqlInfo(sql, function (err, article) {
                if (err) return result.error(next, err.toString(), msg);

                //获取最新的库存
                var articleCount = article.current_working_stock + msg.sumCount;

                var paramArticle = {
                    id: article.id,
                    current_working_stock: articleCount > 0 ? articleCount : 0, //菜品数量不能为负数
                    is_empty: articleCount == 0 ? 1 : 0 //菜品数量等于零 自动沽清此菜品
                };
                //更新老规格主项
                customSqlModel.updateSelective('tb_article', paramArticle, function (err, reply) {
                    if (err) return result.error(next, err.toString(), msg);
                    result.success(next, null);
                });

            });
        }
    });
}

/**
 * 根据 菜品ID 获取 菜品老规格详情 
 * @param msg.articleId
 * @param session
 * @param next
 */
handler.getArticlePriceByArticleId = function (msg, session, next) {
    let articleId = msg.articleId;
    if (result.isEmpty(articleId)) {
        return result.error(next, "菜品ID不能为空", msg);
    }
    let sql = `select * from tb_article_price where article_id = '${articleId}';`
    customSqlModel.getAllCustomSqlInfo(sql, (err, articlePriceInfo) => {
        result.success(next, articlePriceInfo);
    })
}