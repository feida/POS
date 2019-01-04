/**
 * @author wxh on 2018/1/2
 * @copyright
 * @desc
 */
const async = require('async');
const uuidV4 = require('uuid/v4');
let config = require('../../config/index');

const minimist = require('minimist');
const args = minimist(process.argv.slice(2));
let NODE_ENV = process.env.npm_lifecycle_event != 'dev' && process.env.npm_lifecycle_event ? args.env : process.env.npm_lifecycle_event;

NODE_ENV = NODE_ENV ? NODE_ENV.toLowerCase() : 'pro';

const sqlite = require('../../sqlite/pos/index').client;
const fs = require("fs");
const path = require("path");
const fileUtil = require("../../../util/fileUtil");
const httpClient = require("../../../lib/http/httpClient");
var timeBegin = new Date().getTime();
var timeEnd = null;
var syncDataUtil = module.exports;


function Deploy(obj) {
    this.host = obj.host;
    this.port = obj.port;
    this.path = `/pos/LocalPosSyncData/`;
    this.method = obj.method;
    this.headers = obj.headers;
    this.brandId = obj.brandId;
    this.shopId = obj.shopId;
}


syncDataUtil.InitTable = function (callback) {
    sqlite.sync({force: true}).then(function (err) {
        NODE_ENV == 'pro' ? fileUtil.appendFile(`sqlite`, `init sqlite success`) : '';
        console.log('init sqlite success');
        callback(null)
    });
};


syncDataUtil.InitArea = function (callback) {
    let obj = new Deploy(config.java_server_db);
    obj.path = obj.path + "areaList";
    httpClient.post(obj, null, function (data = []) {
        NODE_ENV == 'pro' ? fileUtil.appendFile(`更新数据,请求服务端路径${obj.path}`, `${JSON.stringify(data)}`) : '';
        if (data && data.length < 0) return callback()
        const area = sqlite.model('tb_area');
        area.sync({force: true}).then(function () {
            async.eachLimit(data, 1, function (item, cb) {
                area.build(item).save().then(function (result) {
                    cb()
                })
            }, function (err, result) {
                NODE_ENV == 'pro' ? fileUtil.appendFile(`tb_area 更新${err ? '失败' : '成功'}`, ` ${err ? JSON.stringify(err.toString()) : 'init tb_area success'}`) : '';
                console.log('init tb_area success');
                if (err) return console.error(err.stack);
                callback();
            });
        });
    }, function (err) {
        NODE_ENV == 'pro' ? fileUtil.appendFile(`更新数据,请求服务端路径${obj.path}`, `${JSON.stringify(data)}`) : ''
    });
};

syncDataUtil.InitArticle = function (callback) {
    let obj = new Deploy(config.java_server_db);
    obj.path = obj.path + "articleList";
    httpClient.post(obj, null, function (data = []) {
        NODE_ENV == 'pro' ? fileUtil.appendFile(`更新数据,请求服务端路径${obj.path}`, `${JSON.stringify(data)}`) : ''
        if (data && data.length < 0) return callback()
        const article = sqlite.model('tb_article');
        article.sync({force: true}).then(function () {
            async.eachLimit(data, 1, function (item, cb) {
                article.build(item).save().then(function (result) {
                    cb()
                })
            }, function (err, result) {
                NODE_ENV == 'pro' ? fileUtil.appendFile(`更新${err ? '失败' : '成功'} tb_article`, ` ${err ? JSON.stringify(err.toString()) : 'init tb_article success'}`) : ''
                console.log('init tb_article success');
                if (err) return console.error(err.stack);

                callback();
            });
        });

    }, function (err) {

    });

};

syncDataUtil.InitArticleAttr = function (callback) {
    let obj = new Deploy(config.java_server_db);
    obj.path = obj.path + "articleAttrList";
    httpClient.post(obj, null, function (data = []) {
        NODE_ENV == 'pro' ? fileUtil.appendFile(`更新数据,请求服务端路径${obj.path}`, `${JSON.stringify(data)}`) : ''
        if (data && data.length < 0) return callback()
        const articleAttr = sqlite.model('tb_article_attr');
        articleAttr.sync({force: true}).then(function () {

            async.eachLimit(data, 1, function (item, cb) {
                articleAttr.build(item).save().then(function (result) {
                    cb()
                })
            }, function (err, result) {
                NODE_ENV == 'pro' ? fileUtil.appendFile(`更新${err ? '失败' : '成功'} tb_article_attr`, ` ${err ? JSON.stringify(err.toString()) : 'init tb_article_attr success'}`) : '';
                console.log('init tb_article_attr success');
                if (err) return console.error(err.stack);
                callback();
            });
        });
    }, function (err) {
        NODE_ENV == 'pro' ? fileUtil.appendFile(`更新数据,请求服务端路径${obj.path}`, `${JSON.stringify(data)}`) : ''
    });
};

syncDataUtil.InitArticleFamily = function (callback) {
    let obj = new Deploy(config.java_server_db);
    obj.path = obj.path + "articleFamilyList";
    httpClient.post(obj, null, function (data = []) {
        NODE_ENV == 'pro' ? fileUtil.appendFile(`更新数据,请求服务端路径${obj.path}`, `${JSON.stringify(data)}`) : ''
        if (data && data.length < 0) return callback()
        const articleFamily = sqlite.model('tb_article_family');
        articleFamily.sync({force: true}).then(function () {
            async.eachLimit(data, 1, function (item, cb) {
                item.sort = item.peference;
                articleFamily.build(item).save().then(function (result) {
                    cb()
                })
            }, function (err, result) {
                NODE_ENV == 'pro' ? fileUtil.appendFile(`更新${err ? '失败' : '成功'} tb_article_family`, ` ${err ? JSON.stringify(err.toString()) : 'init tb_article_family success'}`) : '';
                if (err) return console.error(err.stack);
                console.log('init tb_article_family success');
                callback();
            });
        });
    }, function (err) {
        NODE_ENV == 'pro' ? fileUtil.appendFile(`更新数据,请求服务端路径${obj.path}`, `${JSON.stringify(data)}`) : ''
    });
};

syncDataUtil.InitArticleKitchen = function (callback) {
    let obj = new Deploy(config.java_server_db);
    obj.path = obj.path + "articleKitchenList";
    httpClient.post(obj, null, function (data = []) {
        NODE_ENV == 'pro' ? fileUtil.appendFile(`更新数据,请求服务端路径${obj.path}`, `${JSON.stringify(data)}`) : ''
        if (data && data.length < 0) return callback()
        const articleKitchen = sqlite.model('tb_article_kitchen');
        articleKitchen.sync({force: true}).then(function () {
            async.eachLimit(data, 1, function (item, cb) {
                item.id = uuidV4().replace(/-/g, "");
                articleKitchen.build(item).save().then(function (result) {
                    cb()
                })
            }, function (err, result) {
                NODE_ENV == 'pro' ? fileUtil.appendFile(`更新${err ? '失败' : '成功'} tb_article_kitchen`, ` ${err ? JSON.stringify(err.toString()) : 'init tb_article_kitchen success'}`) : '';
                if (err) return console.error(err.stack);
                console.log('init tb_article_kitchen success');
                callback();
            });
        });
    }, function (err) {
        NODE_ENV == 'pro' ? fileUtil.appendFile(`更新数据,请求服务端路径${obj.path}`, `${JSON.stringify(data)}`) : ''
    });
};

syncDataUtil.InitArticlePrice = function (callback) {
    let obj = new Deploy(config.java_server_db);
    obj.path = obj.path + "articlePriceList";
    httpClient.post(obj, null, function (data = []) {
        NODE_ENV == 'pro' ? fileUtil.appendFile(`更新数据,请求服务端路径${obj.path}`, `${JSON.stringify(data)}`) : ''
        if (data && data.length < 0) return callback()
        const articlePrice = sqlite.model('tb_article_price');
        articlePrice.sync({force: true}).then(function () {
            async.eachLimit(data, 1, function (item, cb) {
                item.shopDetailId = obj.shopId;
                articlePrice.build(item).save().then(function (result) {
                    cb()
                })
            }, function (err, result) {
                NODE_ENV == 'pro' ? fileUtil.appendFile(`更新${err ? '失败' : '成功'} tb_article_price`, ` ${err ? JSON.stringify(err.toString()) : 'init tb_article_price success'}`) : '';
                if (err) return console.error(err.stack);
                console.log('init tb_article_price success');
                callback();
            });
        });
    }, function (err) {
        NODE_ENV == 'pro' ? fileUtil.appendFile(`更新数据,请求服务端路径${obj.path}`, `${JSON.stringify(data)}`) : ''
    });
};

syncDataUtil.InitArticleSupportTime = function (callback) {
    let obj = new Deploy(config.java_server_db);
    obj.path = obj.path + "articleSupport";
    httpClient.post(obj, null, function (data = []) {
        NODE_ENV == 'pro' ? fileUtil.appendFile(`更新数据,请求服务端路径${obj.path}`, `${JSON.stringify(data)}`) : ''
        if (data && data.length < 0) return callback()
        const articleSupportTime = sqlite.model('tb_article_support_time');
        articleSupportTime.sync({force: true}).then(function () {
            async.eachLimit(data, 1, function (item, cb) {
                item.id = uuidV4().replace(/-/g, "");
                articleSupportTime.build(item).save().then(function (result) {
                    cb()
                })
            }, function (err, result) {
                NODE_ENV == 'pro' ? fileUtil.appendFile(`更新${err ? '失败' : '成功'} tb_article_support_time`, ` ${err ? JSON.stringify(err.toString()) : 'init tb_article_support_time success'}`) : '';
                if (err) return console.error(err.stack);
                console.log('init tb_article_support_time success');
                callback();
            });
        });
    }, function (err) {
        NODE_ENV == 'pro' ? fileUtil.appendFile(`更新数据,请求服务端路径${obj.path}`, `${JSON.stringify(data)}`) : ''
    });
};

syncDataUtil.InitArticleUnit = function (callback) {
    let obj = new Deploy(config.java_server_db);
    obj.path = obj.path + "articleUnitList";
    httpClient.post(obj, null, function (data = []) {
        NODE_ENV == 'pro' ? fileUtil.appendFile(`更新数据,请求服务端路径${obj.path}`, `${JSON.stringify(data)}`) : ''
        if (data && data.length < 0) return callback()
        const articleUnit = sqlite.model('tb_article_unit');
        articleUnit.sync({force: true}).then(function () {
            async.eachLimit(data, 1, function (item, cb) {
                articleUnit.build(item).save().then(function (result) {
                    cb()
                })
            }, function (err, result) {
                NODE_ENV == 'pro' ? fileUtil.appendFile(`更新${err ? '失败' : '成功'} tb_article_unit`, ` ${err ? JSON.stringify(err.toString()) : 'init tb_article_unit success'}`) : '';
                if (err) return console.error(err.stack);
                console.log('init tb_article_unit success');
                callback();
            });
        });

    }, function (err) {
        NODE_ENV == 'pro' ? fileUtil.appendFile(`更新数据,请求服务端路径${obj.path}`, `${JSON.stringify(data)}`) : ''
    });

};

syncDataUtil.InitArticleUnitDetail = function (callback) {
    let obj = new Deploy(config.java_server_db);
    obj.path = obj.path + "articleUnitDetailList";
    httpClient.post(obj, null, function (data = []) {
        NODE_ENV == 'pro' ? fileUtil.appendFile(`更新数据,请求服务端路径${obj.path}`, `${JSON.stringify(data)}`) : ''
        if (data && data.length < 0) return callback()
        const articleUnitDetail = sqlite.model('tb_article_unit_detail');
        articleUnitDetail.sync({force: true}).then(function () {
            async.eachLimit(data, 1, function (item, cb) {
                articleUnitDetail.build(item).save().then(function (result) {
                    cb()
                })
            }, function (err, result) {
                NODE_ENV == 'pro' ? fileUtil.appendFile(`更新${err ? '失败' : '成功'} tb_article_unit_detail`, ` ${err ? JSON.stringify(err.toString()) : 'init tb_article_unit_detail success'}`) : '';
                if (err) return console.error(err.stack);
                console.log('init tb_article_unit_detail success');
                callback();
            });
        });
    }, function (err) {
        NODE_ENV == 'pro' ? fileUtil.appendFile(`更新数据,请求服务端路径${obj.path}`, `${JSON.stringify(data)}`) : ''
    });
};

syncDataUtil.InitArticleUnitNew = function (callback) {
    let obj = new Deploy(config.java_server_db);
    obj.path = obj.path + "articleUnitNewList";
    httpClient.post(obj, null, function (data = []) {
        NODE_ENV == 'pro' ? fileUtil.appendFile(`更新数据,请求服务端路径${obj.path}`, `${JSON.stringify(data)}`) : ''
        if (data && data.length < 0) return callback()
        const articleUnitNew = sqlite.model('tb_article_unit_new');
        articleUnitNew.sync({force: true}).then(function () {
            async.eachLimit(data, 1, function (item, cb) {
                articleUnitNew.build(item).save().then(function (result) {
                    cb()
                })
            }, function (err, result) {
                NODE_ENV == 'pro' ? fileUtil.appendFile(`更新${err ? '失败' : '成功'} tb_article_unit_new`, ` ${err ? JSON.stringify(err.toString()) : 'init tb_article_unit_new success'}`) : '';
                if (err) return console.error(err.stack);
                console.log('init tb_article_unit_new success');
                callback();
            });
        });
    }, function (err) {
        NODE_ENV == 'pro' ? fileUtil.appendFile(`更新数据,请求服务端路径${obj.path}`, `${JSON.stringify(data)}`) : ''
    });
};

syncDataUtil.InitKitchen = function (callback) {
    let obj = new Deploy(config.java_server_db);
    obj.path = obj.path + "kitchenList";
    httpClient.post(obj, null, function (data = []) {
        NODE_ENV == 'pro' ? fileUtil.appendFile(`更新数据,请求服务端路径${obj.path}`, `${JSON.stringify(data)}`) : ''
        if (data && data.length < 0) return callback()
        const kitchen = sqlite.model('tb_kitchen');
        kitchen.sync({force: true}).then(function () {
            async.eachLimit(data, 1, function (item, cb) {
                kitchen.build(item).save().then(function (result) {
                    cb()
                })
            }, function (err, result) {
                NODE_ENV == 'pro' ? fileUtil.appendFile(`更新${err ? '失败' : '成功'} tb_kitchen`, ` ${err ? JSON.stringify(err.toString()) : 'init tb_kitchen success'}`) : '';
                if (err) return console.error(err.stack);
                console.log('init tb_kitchen success');
                callback();
            });
        });
    }, function (err) {
        NODE_ENV == 'pro' ? fileUtil.appendFile(`更新数据,请求服务端路径${obj.path}`, `${JSON.stringify(data)}`) : ''
    });
};

syncDataUtil.InitMealAttr = function (callback) {
    let obj = new Deploy(config.java_server_db);
    obj.path = obj.path + "mealAttrList";
    httpClient.post(obj, null, function (data = []) {
        NODE_ENV == 'pro' ? fileUtil.appendFile(`更新数据,请求服务端路径${obj.path}`, `${JSON.stringify(data)}`) : ''
        if (data && data.length < 0) return callback()
        const mealAttr = sqlite.model('tb_meal_attr');
        mealAttr.sync({force: true}).then(function () {
            async.eachLimit(data, 1, function (item, cb) {
                mealAttr.build(item).save().then(function (result) {
                    cb()
                })
            }, function (err, result) {
                NODE_ENV == 'pro' ? fileUtil.appendFile(`更新${err ? '失败' : '成功'} tb_meal_attr`, ` ${err ? JSON.stringify(err.toString()) : 'init tb_meal_attr success'}`) : '';
                if (err) return console.error(err.stack);
                console.log('init tb_meal_attr success');
                callback();
            });
        });
    }, function (err) {
        NODE_ENV == 'pro' ? fileUtil.appendFile(`更新数据,请求服务端路径${obj.path}`, `${JSON.stringify(data)}`) : ''
    });
};

syncDataUtil.InitMealItem = function (callback) {
    let obj = new Deploy(config.java_server_db);
    obj.path = obj.path + "mealItemList";
    httpClient.post(obj, null, function (data = []) {
        NODE_ENV == 'pro' ? fileUtil.appendFile(`更新数据,请求服务端路径${obj.path}`, `${JSON.stringify(data)}`) : ''
        if (data && data.length < 0) return callback()
        const mealItem = sqlite.model('tb_meal_item');
        mealItem.sync({force: true}).then(function () {
            async.eachLimit(data, 1, function (item, cb) {
                mealItem.build(item).save().then(function (result) {
                    cb()
                })
            }, function (err, result) {
                NODE_ENV == 'pro' ? fileUtil.appendFile(`更新${err ? '失败' : '成功'} tb_meal_item`, ` ${err ? JSON.stringify(err.toString()) : 'init tb_meal_item success'}`) : '';
                if (err) return console.error(err.stack);
                console.log('init tb_meal_item success');
                callback();
            });
        });
    }, function (err) {
        NODE_ENV == 'pro' ? fileUtil.appendFile(`更新数据,请求服务端路径${obj.path}`, `${JSON.stringify(data)}`) : ''
    });
};

syncDataUtil.InitPrinter = function (callback) {
    let obj = new Deploy(config.java_server_db);
    obj.path = obj.path + "printerList";
    httpClient.post(obj, null, function (data = []) {
        NODE_ENV == 'pro' ? fileUtil.appendFile(`更新数据,请求服务端路径${obj.path}`, `${JSON.stringify(data)}`) : ''
        if (data && data.length < 0) return callback()

        const printer = sqlite.model('tb_printer');
        printer.sync({force: true}).then(function () {
            async.eachLimit(data, 1, function (item, cb) {
                printer.build(item).save().then(function (result) {
                    cb()
                })
            }, function (err, result) {
                NODE_ENV == 'pro' ? fileUtil.appendFile(`更新${err ? '失败' : '成功'} tb_printer`, ` ${err ? JSON.stringify(err.toString()) : 'init tb_printer success'}`) : '';
                if (err) return console.error(err.stack);
                console.log('init tb_printer success');
                callback();
            });
        });
    }, function (err) {
        NODE_ENV == 'pro' ? fileUtil.appendFile(`更新数据,请求服务端路径${obj.path}`, `${JSON.stringify(data)}`) : ''
    });
};

syncDataUtil.InitShopDetail = function (callback) {

    const shopDetail = sqlite.model('tb_shop_detail');
    let obj = new Deploy(config.java_server_db);
    obj.path = obj.path + "shopDetail";
    httpClient.post(obj, null, function (data) {
        NODE_ENV == 'pro' ? fileUtil.appendFile(`更新数据,请求服务端路径${obj.path}`, `${JSON.stringify(data)}`) : ''
        if (data && data.length < 0) return callback()
        shopDetail.sync({force: true}).then(function () {
            data.payType = data.allowFirstPay;
            shopDetail.build(data).save().then(function (result) {
                //  记录到 配置文件中   用于记录日志      开发环境 暂不记录日志
                if (path.resolve().indexOf("app/dao/sqlite/") == -1 && path.resolve().indexOf("app\\dao\\sqlite\\") == -1) {
                    let shopDetailPath = path.resolve() + "/config/shopDetail.json";
                    fs.writeFile(shopDetailPath, JSON.stringify(data), (err) => {
                        if (err) {
                            console.log('同步数据 写入 shopDetail  失败  \n\n' + shopDetailPath + "\n\n" + err.toString());
                        }
                    });
                } else {
                    let shopDetailPath = "../../../../config/shopDetail.json";
                    fs.writeFile(shopDetailPath, JSON.stringify(data), (err) => {
                        if (err) {
                            console.log('同步数据 写入 shopDetail  失败  \n\n' + shopDetailPath + "\n\n" + err.toString());
                        }
                    });
                }
                console.log('init tb_shop_detail success');
                callback();
            });
        });
    }, function (err) {
        NODE_ENV == 'pro' ? fileUtil.appendFile(`更新数据,请求服务端路径${obj.path}`, `${JSON.stringify(data)}`) : ''
    });
};

syncDataUtil.InitSupportTime = function (callback) {
    let obj = new Deploy(config.java_server_db);
    obj.path = obj.path + "supportTime";
    httpClient.post(obj, null, function (data = []) {
        NODE_ENV == 'pro' ? fileUtil.appendFile(`更新数据,请求服务端路径${obj.path}`, `${JSON.stringify(data)}`) : ''
        if (data && data.length < 0) return callback()
        const supportTime = sqlite.model('tb_support_time');
        supportTime.sync({force: true}).then(function () {
            async.eachLimit(data, 1, function (item, cb) {
                item.beginTime = formatHour(item.beginTime);
                item.endTime = formatHour(item.endTime);
                supportTime.build(item).save().then(function (result) {
                    cb()
                })
            }, function (err, result) {
                NODE_ENV == 'pro' ? fileUtil.appendFile(`更新${err ? '失败' : '成功'} tb_support_time`, ` ${err ? JSON.stringify(err.toString()) : 'init tb_support_time success'}`) : '';
                if (err) return console.error(err.stack);
                console.log('init tb_support_time success');
                callback();
            });
        });
    }, function (err) {
        NODE_ENV == 'pro' ? fileUtil.appendFile(`更新数据,请求服务端路径${obj.path}`, `${JSON.stringify(data)}`) : ''
    });
};

syncDataUtil.InitTableQrcode = function (callback) {
    let obj = new Deploy(config.java_server_db);
    obj.path = obj.path + "tableQrcodeList";
    httpClient.post(obj, null, function (data = []) {
        NODE_ENV == 'pro' ? fileUtil.appendFile(`更新数据,请求服务端路径${obj.path}`, `${JSON.stringify(data)}`) : ''
        if (data && data.length < 0) return callback()
        const tableQrcode = sqlite.model('tb_table_qrcode');
        tableQrcode.sync({force: true}).then(function () {
            async.eachLimit(data, 1, function (item, cb) {
                tableQrcode.build(item).save().then(function (result) {
                    cb()
                })
            }, function (err, result) {
                NODE_ENV == 'pro' ? fileUtil.appendFile(`更新${err ? '失败' : '成功'} tb_table_qrcode`, ` ${err ? JSON.stringify(err.toString()) : 'init tb_table_qrcode success'}`) : ''
                if (err) return console.error(err.stack);
                console.log('init tb_table_qrcode success');
                callback();
            });
        });
    }, function (err) {
        NODE_ENV == 'pro' ? fileUtil.appendFile(`更新数据,请求服务端路径${obj.path}`, `${JSON.stringify(data)}`) : ''
    });
};

syncDataUtil.InitUnit = function (callback) {
    let obj = new Deploy(config.java_server_db);
    obj.path = obj.path + "unitList";
    httpClient.post(obj, null, function (data = []) {
        NODE_ENV == 'pro' ? fileUtil.appendFile(`更新数据,请求服务端路径${obj.path}`, `${JSON.stringify(data)}`) : ''
        if (data && data.length < 0) return callback()
        const unit = sqlite.model('tb_unit');
        unit.sync({force: true}).then(function () {
            async.eachLimit(data, 1, function (item, cb) {
                unit.build(item).save().then(function (result) {
                    cb()
                })
            }, function (err, result) {
                NODE_ENV == 'pro' ? fileUtil.appendFile(`更新${err ? '失败' : '成功'} tb_unit`, ` ${err ? JSON.stringify(err.toString()) : 'init tb_unit success'}`) : ''
                if (err) return console.error(err.stack);
                console.log('init tb_unit success');
                callback();
            });
        });
    }, function (err) {
        NODE_ENV == 'pro' ? fileUtil.appendFile(`更新数据,请求服务端路径${obj.path}`, `${JSON.stringify(data)}`) : ''
    });
};

syncDataUtil.InitUnitDetail = function (callback) {
    let obj = new Deploy(config.java_server_db);
    obj.path = obj.path + "unitDetailList";
    httpClient.post(obj, null, function (data = []) {
        NODE_ENV == 'pro' ? fileUtil.appendFile(`更新数据,请求服务端路径${obj.path}`, `${JSON.stringify(data)}`) : ''
        if (data && data.length < 0) return callback()
        const unitDetail = sqlite.model('tb_unit_detail');
        unitDetail.sync({force: true}).then(function () {
            async.eachLimit(data, 1, function (item, cb) {
                unitDetail.build(item).save().then(function (result) {
                    cb()
                })
            }, function (err, result) {
                NODE_ENV == 'pro' ? fileUtil.appendFile(`更新${err ? '失败' : '成功'} tb_unit_detail`, ` ${err ? JSON.stringify(err.toString()) : 'init tb_unit_detail success'}`) : '';
                if (err) return console.error(err.stack);
                console.log('init tb_unit_detail success');
                callback();
            });
        });
    }, function (err) {
        NODE_ENV == 'pro' ? fileUtil.appendFile(`更新数据,请求服务端路径${obj.path}`, `${JSON.stringify(data)}`) : ''
    });
};

syncDataUtil.InitUser = function (callback) {
    let obj = new Deploy(config.java_server_db);
    obj.path = obj.path + "brandUserList";
    httpClient.post(obj, null, function (data = []) {
        NODE_ENV == 'pro' ? fileUtil.appendFile(`更新数据,请求服务端路径${obj.path}`, `${JSON.stringify(data)}`) : ''
        if (data && data.length < 0) return callback()
        const user = sqlite.model('tb_user');
        user.sync({force: true}).then(function () {
            async.eachLimit(data, 1, function (item, cb) {
                if (item.state == 0) return cb();
                user.build(item).save().then(function (result) {
                    cb()
                })
            }, function (err, result) {
                NODE_ENV == 'pro' ? fileUtil.appendFile(`更新${err ? '失败' : '成功'} tb_user`, ` ${err ? JSON.stringify(err.toString()) : 'init tb_user success'}`) : '';
                if (err) return console.error(err.stack);
                console.log('init tb_user success');
                callback();
            });
        });
    }, function (err) {
        NODE_ENV == 'pro' ? fileUtil.appendFile(`更新数据,请求服务端路径${obj.path}`, `${JSON.stringify(data)}`) : ''
    });
};

syncDataUtil.InitOrderRemark = function (callback) {
    let obj = new Deploy(config.java_server_db);
    obj.path = obj.path + "orderRemarkList";
    httpClient.post(obj, null, function (data = []) {
        NODE_ENV == 'pro' ? fileUtil.appendFile(`更新数据,请求服务端路径${obj.path}`, `${JSON.stringify(data)}`) : ''
        if (data && data.length < 0) return callback()
        const orderRemark = sqlite.model('tb_order_remark');
        orderRemark.sync({force: true}).then(function () {
            async.eachLimit(data, 1, function (item, cb) {
                orderRemark.build(item).save().then(function (result) {
                    cb()
                })
            }, function (err, result) {
                NODE_ENV == 'pro' ? fileUtil.appendFile(`更新${err ? '失败' : '成功'} tb_order_remark`, ` ${err ? JSON.stringify(err.toString()) : 'init tb_order_remark success'}`) : '';
                if (err) return console.error(err.stack);
                console.log('init tb_order_remark success');
                callback();
            });
        });
    }, function (err) {
        NODE_ENV == 'pro' ? fileUtil.appendFile(`更新数据,请求服务端路径${obj.path}`, `${JSON.stringify(data)}`) : ''
    });
};

syncDataUtil.InitRefundRemark = function (callback) {
    let obj = new Deploy(config.java_server_db);
    obj.path = obj.path + "refundRemarkList";
    httpClient.post(obj, null, function (data = []) {
        NODE_ENV == 'pro' ? fileUtil.appendFile(`更新数据,请求服务端路径${obj.path}`, `${JSON.stringify(data)}`) : ''
        if (data && data.length < 0) return callback()
        const refundRemark = sqlite.model('tb_refund_remark');
        refundRemark.sync({force: true}).then(function () {
            async.eachLimit(data, 1, function (item, cb) {
                refundRemark.build(item).save().then(function (result) {
                    cb()
                })
            }, function (err, result) {
                NODE_ENV == 'pro' ? fileUtil.appendFile(`更新${err ? '失败' : '成功'} tb_refund_remark`, ` ${err ? JSON.stringify(err.toString()) : 'init tb_refund_remark success'}`) : '';
                if (err) return console.error(err.stack);
                console.log('init tb_refund_remark success');
                callback();
            });
        });
    }, function (err) {
        NODE_ENV == 'pro' ? fileUtil.appendFile(`更新数据,请求服务端路径${obj.path}`, `${JSON.stringify(data)}`) : ''
    });
};

syncDataUtil.InitBrandSetting = function (callback) {
    let obj = new Deploy(config.java_server_db);
    obj.path = obj.path + "getBrandSetting";
    httpClient.post(obj, null, function (data) {
        NODE_ENV == 'pro' ? fileUtil.appendFile(`更新数据,请求服务端路径${obj.path}`, `${JSON.stringify(data)}`) : ''
        if (data && data.length < 0) return callback();
        const brandSetting = sqlite.model('tb_brand_setting');
        brandSetting.sync({force: true}).then(function () {
            brandSetting.build(data).save().then(function (result) {
                NODE_ENV == 'pro' ? fileUtil.appendFile(`更新${data ? '成功' : '失败'} tb_brand_setting`, `init tb_brand_setting success`) : '';
                console.log('init tb_brand_setting success');
                callback();
            })
        });
    }, function (err) {
        NODE_ENV == 'pro' ? fileUtil.appendFile(`更新数据,请求服务端路径${obj.path}`, `${JSON.stringify(data)}`) : ''
    });
};

syncDataUtil.InitShopTvConfig = function (callback) {
    let obj = new Deploy(config.java_server_db);
    obj.path = obj.path + "getShopTvConfig";
    httpClient.post(obj, null, function (data = {}) {
        NODE_ENV == 'pro' ? fileUtil.appendFile(`更新数据,请求服务端路径${obj.path}`, `${JSON.stringify(data)}`) : ''
        if (data && data.length < 0) return callback();
        const shopTvConfig = sqlite.model('tb_shop_tv_config');
        shopTvConfig.sync({force: true}).then(function () {

            shopTvConfig.build(data).save().then(function (result) {
                NODE_ENV == 'pro' ? fileUtil.appendFile(`更新${data ? '成功' : '失败'} shop_tv_config`, `init shop_tv_config success`) : '';
                console.log('init shop_tv_config success');
                callback();
            })
        });
    }, function (err) {
        NODE_ENV == 'pro' ? fileUtil.appendFile(`更新数据,请求服务端路径${obj.path}`, `${JSON.stringify(data)}`) : ''
    });
};

syncDataUtil.InitWeightPackage = function (callback) {
    let obj = new Deploy(config.java_server_db);
    obj.path = obj.path + "weightPackageList";
    httpClient.post(obj, null, function (data) {
        NODE_ENV == 'pro' ? fileUtil.appendFile(`更新数据,请求服务端路径${obj.path}`, `${JSON.stringify(data)}`) : ''
        if (data && data.length < 0) return callback();
        const weightPackage = sqlite.model('tb_weight_package');
        weightPackage.sync({force: true}).then(function () {
            async.eachLimit(data, 1, function (item, cb) {
                weightPackage.build(item).save().then(function (result) {
                    cb()
                })
            }, function (err, result) {
                NODE_ENV == 'pro' ? fileUtil.appendFile(`更新${err ? '失败' : '成功'} tb_weight_package`, ` ${err ? JSON.stringify(err.toString()) : 'init tb_weight_package success'}`) : '';
                if (err) return console.error(err.stack);
                callback();
            });
        });
    }, function (err) {
        NODE_ENV == 'pro' ? fileUtil.appendFile(`更新数据,请求服务端路径${obj.path}`, `${JSON.stringify(data)}`) : ''
    });
};

syncDataUtil.InitWeightPackageDetail = function (callback) {
    let obj = new Deploy(config.java_server_db);
    obj.path = obj.path + "weightPackageDetailList";
    httpClient.post(obj, null, function (data = []) {
        NODE_ENV == 'pro' ? fileUtil.appendFile(`更新数据,请求服务端路径${obj.path}`, `${JSON.stringify(data)}`) : ''
        if (data && data.length < 0) return callback();
        const weightPackageDetail = sqlite.model('tb_weight_package_detail');
        weightPackageDetail.sync({force: true}).then(function () {
            async.eachLimit(data, 1, function (item, cb) {
                weightPackageDetail.build(item).save().then(function (result) {
                    cb()
                })
            }, function (err, result) {
                NODE_ENV == 'pro' ? fileUtil.appendFile(`更新${err ? '失败' : '成功'} tb_weight_package_detail`, `init tb_weight_package_detail success`) : '';
                console.log('init tb_weight_package_detail success');
                callback();
            })
        });
    }, function (err) {
        NODE_ENV == 'pro' ? fileUtil.appendFile(`更新数据,请求服务端路径${obj.path}`, `${JSON.stringify(data)}`) : ''
    });
};

syncDataUtil.InitVirtualProductsList = function (callback) {
    let obj = new Deploy(config.java_server_db);
    obj.path = obj.path + "virtualProductsList";
    httpClient.post(obj, null, function (data = []) {
        NODE_ENV == 'pro' ? fileUtil.appendFile(`更新数据,请求服务端路径${obj.path}`, `${JSON.stringify(data)}`) : ''
        if (data && data.length < 0) return callback();
        const virtualProducts = sqlite.model('tb_virtual_products');
        virtualProducts.sync({force: true}).then(function () {
            async.eachLimit(data, 1, function (item, cb) {
                virtualProducts.build(item).save().then(function (result) {
                    cb()
                })
            }, function (err, result) {
                NODE_ENV == 'pro' ? fileUtil.appendFile(`更新${err ? '失败' : '成功'} tb_virtual_products`, `init tb_virtual_products success`) : '';
                console.log('init tb_virtual_products success');
                callback();
            })
        });
    }, function (err) {
        NODE_ENV == 'pro' ? fileUtil.appendFile(`更新数据,请求服务端路径${obj.path}`, `${JSON.stringify(data)}`) : ''
    });
};

syncDataUtil.InitVirtualProductsKitchenList = function (callback) {
    let obj = new Deploy(config.java_server_db);
    obj.path = obj.path + "virtualProductsKitchenList";
    httpClient.post(obj, null, function (data = []) {
        NODE_ENV == 'pro' ? fileUtil.appendFile(`更新数据,请求服务端路径${obj.path}`, `${JSON.stringify(data)}`) : ''
        if (data && data.length < 0) return callback();
        const virtualProductsKitchen = sqlite.model('tb_virtual_products_kitchen');
        virtualProductsKitchen.sync({force: true}).then(function () {
            async.eachLimit(data, 1, function (item, cb) {
                item.id = uuidV4().replace(/-/g, "");
                virtualProductsKitchen.build(item).save().then(function (result) {
                    cb()
                })
            }, function (err, result) {
                NODE_ENV == 'pro' ? fileUtil.appendFile(`更新${err ? '失败' : '成功'} tb_virtual_products_kitchen`, `init tb_virtual_products_kitchen success`) : '';
                console.log('init tb_virtual_products_kitchen success');
                callback();
            })
        });
    }, function (err) {
        NODE_ENV == 'pro' ? fileUtil.appendFile(`更新数据,请求服务端路径${obj.path}`, `${JSON.stringify(data)}`) : ''
    });
};


syncDataUtil.InitSelectKitchenAndPrinterList = function (callback) {
    let obj = new Deploy(config.java_server_db);
    obj.path = obj.path + "selectKitchenAndPrinterList";
    httpClient.post(obj, null, function (data = []) {
        NODE_ENV == 'pro' ? fileUtil.appendFile(`更新数据,请求服务端路径${obj.path}`, `${JSON.stringify(data)}`) : ''
        if (data && data.length < 0) return callback();
        const kitchenAndPrinter = sqlite.model('tb_kitchen_printer');
        kitchenAndPrinter.sync({force: true}).then(function () {
            async.eachLimit(data, 1, function (item, cb) {
                kitchenAndPrinter.build(item).save().then(function (result) {
                    cb()
                })
            }, function (err, result) {
                NODE_ENV == 'pro' ? fileUtil.appendFile(`更新${err ? '失败' : '成功'} tb_kitchen_printer`, `init tb_kitchen_printer success`) : '';
                console.log('init tb_kitchen_printer success');
                callback();
            })
        });
    }, function (err) {
        NODE_ENV == 'pro' ? fileUtil.appendFile(`更新数据,请求服务端路径${obj.path}`, `${JSON.stringify(data)}`) : ''
    });
};


syncDataUtil.InitSelectArticleAndKitchenGroupList = function (callback) {
    let obj = new Deploy(config.java_server_db);
    obj.path = obj.path + "selectArticleAndkitchenGroup";
    httpClient.post(obj, null, function (data = []) {
        NODE_ENV == 'pro' ? fileUtil.appendFile(`更新数据,请求服务端路径${obj.path}`, `${JSON.stringify(data)}`) : ''
        if (data && data.length < 0) return callback();
        const articleKitchenPrinter = sqlite.model('tb_article_kitchen_printer');
        articleKitchenPrinter.sync({force: true}).then(function () {
            async.eachLimit(data, 1, function (item, cb) {
                articleKitchenPrinter.build(item).save().then(function (result) {
                    cb()
                })
            }, function (err, result) {
                NODE_ENV == 'pro' ? fileUtil.appendFile(`更新${err ? '失败' : '成功'} tb_article_kitchen_printer`, `init tb_article_kitchen_printer success`) : '';
                console.log('init tb_article_kitchen_printer success');
                callback();
            })
        });
    }, function (err) {
        NODE_ENV == 'pro' ? fileUtil.appendFile(`更新数据,请求服务端路径${obj.path}`, `${JSON.stringify(data)}`) : ''
    });
};

syncDataUtil.InitSelectKitchenGroupAndKitchenList = function (callback) {
    let obj = new Deploy(config.java_server_db);
    obj.path = obj.path + "selectKitchenGroupAndKitchen";
    httpClient.post(obj, null, function (data = []) {
        NODE_ENV == 'pro' ? fileUtil.appendFile(`更新数据,请求服务端路径${obj.path}`, `${JSON.stringify(data)}`) : ''
        if (data && data.length < 0) return callback();
        const kitchenGroupDetail = sqlite.model('tb_kitchen_group_detail');
        kitchenGroupDetail.sync({force: true}).then(function () {
            async.eachLimit(data, 1, function (item, cb) {
                kitchenGroupDetail.build(item).save().then(function (result) {
                    cb()
                })
            }, function (err, result) {
                NODE_ENV == 'pro' ? fileUtil.appendFile(`更新${err ? '失败' : '成功'} tb_kitchen_group_detail`, `init tb_kitchen_group_detail success`) : '';
                console.log('init tb_kitchen_group_detail success');
                callback();
            })
        });
    }, function (err) {
        NODE_ENV == 'pro' ? fileUtil.appendFile(`更新数据,请求服务端路径${obj.path}`, `${JSON.stringify(data)}`) : ''
    });
};


syncDataUtil.InitSelectKitchenGroupList = function (callback) {
    let obj = new Deploy(config.java_server_db);
    obj.path = obj.path + "selectKitchenGroup";
    httpClient.post(obj, null, function (data = []) {
        NODE_ENV == 'pro' ? fileUtil.appendFile(`更新数据,请求服务端路径${obj.path}`, `${JSON.stringify(data)}`) : ''
        if (data && data.length < 0) return callback();
        const kitchenGroup = sqlite.model('tb_kitchen_group');
        kitchenGroup.sync({force: true}).then(function () {
            async.eachLimit(data, 1, function (item, cb) {
                kitchenGroup.build(item).save().then(function (result) {
                    cb()
                })
            }, function (err, result) {
                NODE_ENV == 'pro' ? fileUtil.appendFile(`更新${err ? '失败' : '成功'} tb_kitchen_group`, `init tb_kitchen_group success`) : '';
                console.log('init tb_kitchen_group success');
                callback();
            })
        });
    }, function (err) {
        NODE_ENV == 'pro' ? fileUtil.appendFile(`更新数据,请求服务端路径${obj.path}`, `${JSON.stringify(data)}`) : ''
    });
};


syncDataUtil.InitSelectRecommendList = function (callback) {
    let obj = new Deploy(config.java_server_db);
    obj.path = obj.path + "selectRecommend";
    httpClient.post(obj, null, function (data = []) {
        NODE_ENV == 'pro' ? fileUtil.appendFile(`更新数据,请求服务端路径${obj.path}`, `${JSON.stringify(data)}`) : ''
        if (data && data.length < 0) return callback();
        const recommend = sqlite.model('tb_recommend');
        recommend.sync({force: true}).then(function () {
            async.eachLimit(data, 1, function (item, cb) {
                item.isUsed = item.isUsed ? 1 : 0;
                item.choiceType = item.choiceType ? 1 : 0;
                item.printType = item.printType ? 1 : 0;
                recommend.build(item).save().then(function (result) {
                    cb()
                })
            }, function (err, result) {
                NODE_ENV == 'pro' ? fileUtil.appendFile(`更新${err ? '失败' : '成功'} tb_recommend`, `init tb_recommend success`) : '';
                console.log('init tb_recommend success');
                callback();
            })
        });
    }, function (err) {
        NODE_ENV == 'pro' ? fileUtil.appendFile(`更新数据,请求服务端路径${obj.path}`, `${JSON.stringify(data)}`) : ''
    });
};

syncDataUtil.InitSelectRecommendArticleList = function (callback) {
    let obj = new Deploy(config.java_server_db);
    obj.path = obj.path + "selectRecommendArticle";
    httpClient.post(obj, null, function (data = []) {
        NODE_ENV == 'pro' ? fileUtil.appendFile(`更新数据,请求服务端路径${obj.path}`, `${JSON.stringify(data)}`) : ''
        if (data && data.length < 0) return callback();
        const recommendArticle = sqlite.model('tb_recommend_article');
        recommendArticle.sync({force: true}).then(function () {
            async.eachLimit(data, 1, function (item, cb) {
                recommendArticle.build(item).save().then(function (result) {
                    cb()
                })
            }, function (err, result) {
                NODE_ENV == 'pro' ? fileUtil.appendFile(`更新${err ? '失败' : '成功'} tb_recommend_article`, `init tb_recommend_article success`) : '';
                console.log('init tb_recommend_article success');
                callback();
            })
        });
    }, function (err) {
        NODE_ENV == 'pro' ? fileUtil.appendFile(`更新数据,请求服务端路径${obj.path}`, `${JSON.stringify(data)}`) : ''
    });
};

syncDataUtil.InitDailyLogOperation = function (callback) {
    let obj = new Deploy(config.java_server_db);
    obj.path = obj.path + "dailyLogOperation";
    const dailyLogOperation = sqlite.model('tb_daily_log_operation');
    httpClient.post(obj, null, function (data = []) {
        NODE_ENV == 'pro' ? fileUtil.appendFile(`更新数据,请求服务端路径${obj.path}`, `${JSON.stringify(data)}`) : ''
        if (data && data.length < 0) return callback();
        dailyLogOperation.sync({force: true}).then(function () {

            async.eachLimit(data, 1, function (item, cb) {
                dailyLogOperation.build(item).save().then(function (result) {
                    cb()
                })
            }, function (err, result) {
                NODE_ENV == 'pro' ? fileUtil.appendFile(`更新${err ? '失败' : '成功'} dailyLogOperation`, `init dailyLogOperation success`) : '';
                console.log('init dailyLogOperation success');
                callback();
            })
        });
    },function (err) {
        NODE_ENV == 'pro' ? fileUtil.appendFile(`更新数据,请求服务端路径${obj.path}`, `${JSON.stringify(data)}`) : ''
    });
    callback();
};

syncDataUtil.InitPaymentReview = function (callback) {
    let obj = new Deploy(config.java_server_db);
    obj.path = obj.path + "paymentReview";
    const paymentReview = sqlite.model('tb_payment_review');
    httpClient.post(obj, null, function (data = []) {
        NODE_ENV == 'pro' ? fileUtil.appendFile(`更新数据,请求服务端路径${obj.path}`, `${JSON.stringify(data)}`) : ''
        if (data && data.length < 0) return callback();
        paymentReview.sync({force: true}).then(function () {
            async.eachLimit(data, 1, function (item, cb) {
                paymentReview.build(item).save().then(function (result) {
                    cb()
                })
            }, function (err, result) {
                NODE_ENV == 'pro' ? fileUtil.appendFile(`更新${err ? '失败' : '成功'} paymentReview`, `init paymentReview success`) : '';
                console.log('init paymentReview success');
                callback();
            })
        });
    }, function (err) {
        NODE_ENV == 'pro' ? fileUtil.appendFile(`更新数据,请求服务端路径${obj.path}`, `${JSON.stringify(data)}`) : ''
    });
    callback();
};


syncDataUtil.allData = function (tableState, callback) {
    let that = this;
    if (tableState == 1) {
        delete require.cache[require.resolve('../../config/pro/index')];
        config = require('../../config/pro/index');
    }
    async.waterfall([
        function (cb) {
            tableState ? that.InitTable(cb) : cb(null)
        },
        function (cb) {
            that.InitArea(cb)                //区域表--tb_area
        },
        function (cb) {
            that.InitArticle(cb)             //菜品表——tb_article
        },
        function (cb) {
            that.InitArticleAttr(cb)         //菜品老规格属性表——tb_article_attr
        },
        function (cb) {
            that.InitArticleFamily(cb)       //菜品老规格属性表——tb_article_attr
        },
        function (cb) {
            that.InitArticleKitchen(cb)      //菜品出餐厨房表——tb_article_kitchen
        },
        function (cb) {
            that.InitArticlePrice(cb)        //菜品老规格详情表——tb_article_price
        },
        function (cb) {
            that.InitArticleSupportTime(cb)  //菜品供应时间表——tb_article_support_time
        },
        function (cb) {
            that.InitArticleUnit(cb)         //菜品老规格属性子项（详情）表——tb_article_unit
        },
        function (cb) {
            that.InitArticleUnitDetail(cb)   //菜品新规格属性子项关联表——tb_article_unit_detail
        },
        function (cb) {
            that.InitArticleUnitNew(cb)      //菜品新规格属性关联表——tb_article_unit_new
        },
        function (cb) {
            that.InitKitchen(cb)             //出餐厨房--tb_kitchen
        },
        function (cb) {
            that.InitMealAttr(cb)            //套餐属性表——tb_meal_attr
        },
        function (cb) {
            that.InitMealItem(cb)            //套餐属性子项表——tb_meal_item
        },
        function (cb) {
            that.InitPrinter(cb)             //打印机表--tb_printer
        },
        function (cb) {
            that.InitShopDetail(cb)          //店铺详情表——tb_shop_detail
        },
        function (cb) {
            that.InitSupportTime(cb)         //供应时间表——tb_support_time
        },
        function (cb) {
            that.InitTableQrcode(cb)         //桌位表--tb_table_qrcode
        },
        function (cb) {
            that.InitUnit(cb)                //菜品新规格属性表——tb_unit
        },
        function (cb) {
            that.InitUnitDetail(cb)          //菜品新规格属性子项表——tb_unit_detail
        },
        function (cb) {
            that.InitUser(cb)                //用户表——tb_user
        },
        function (cb) {
            that.InitOrderRemark(cb)        //订单备注表——tb_order_remark
        },
        function (cb) {
            that.InitRefundRemark(cb)        //退菜备注表——tb_refund_remark
        },
        function (cb) {
            that.InitBrandSetting(cb)
        },
        function (cb) {
            that.InitShopTvConfig(cb)
        },
        function (cb) {
            that.InitWeightPackage(cb)   //重量包
        },
        function (cb) {
            that.InitWeightPackageDetail(cb)     //重量包详情
        },
        function (cb) {
            that.InitVirtualProductsList(cb)     //获取虚拟餐包
        },
        function (cb) {
            that.InitVirtualProductsKitchenList(cb)     //获取虚拟餐包厨房信息
        },
        function (cb) {
            that.InitSelectKitchenAndPrinterList(cb)     //查询厨房和打印机
        },
        function (cb) {
            that.InitSelectArticleAndKitchenGroupList(cb)     //查询菜品和厨房和打印机
        },
        function (cb) {
            that.InitSelectKitchenGroupAndKitchenList(cb)     //查询厨房组和厨房
        },
        function (cb) {
            that.InitSelectKitchenGroupList(cb)     //  查询厨房组列表
        },
        function (cb) {
            that.InitSelectRecommendList(cb)      //推荐餐品表——tb_recommend
        },
        // function (cb) {
        //     that.InitDailyLogOperation(cb)     //结店日志——tb_daily_log_operation
        // },
        // function (cb) {
        //     that.InitPaymentReview(cb)     // 结店修改项——tb_payment_review
        // }
    ], function (err, result) {
        NODE_ENV == 'pro' ? fileUtil.appendFile(`激活${err ? '失败' : '成功'}`, `${err ? JSON.stringify(err.toString()) : null}`) : '';
        if (err) {
            return console.error(err.stack);
        }
        timeEnd = new Date().getTime();
        console.log("总共用时：" + (timeEnd - timeBegin) / 1000 + " s");
        callback && callback();
    });
}


/**
 * 格式化 小时 ： 8:30:15  --->  08:30:15
 * @param date
 * @returns {*}
 */
var formatHour = function (date) {
    var hour = date.split(":")[0];
    if (hour.length == 1) {
        date = (0 + date)
    }
    return date;
};

syncDataUtil.updateTableData = function (param, callback) {
    const area = sqlite.model(param.tableName);
    area.sync({force: true}).then(function () {
        let obj = new Deploy(config.java_server_db);
        obj.path = `${obj.path}${param.tablePath}`;
        httpClient.post(obj, null, function (data = []) {
            if (Array.prototype.isPrototypeOf(data)) {
                async.eachLimit(data, 1, function (item, cb) {
                    area.build(item).save().then(function (result) {
                        cb()
                    })
                }, function (err, result) {
                    NODE_ENV == 'pro' ? fileUtil.appendFile(`${param.tableName} 更新${err ? '失败' : '成功'}`, ` ${err ? JSON.stringify(err.toString()) : 'init' + param.tableName + 'success'}`) : '';
                    if (err) return console.error(err.stack);
                    callback();
                });
            } else {
                area.build(data).save().then(function (result) {
                    NODE_ENV == 'pro' ? fileUtil.appendFile(`${param.tableName} 更新成功`, `init + ${param.tableName} success `) : ''
                    callback();
                }).catch(function (error) {
                    NODE_ENV == 'pro' ? fileUtil.appendFile(`${param.tableName} 更新失败`, `error: ${JSON.stringify(error)} `) : ''
                    callback();
                })
            }

        });
    });
};
