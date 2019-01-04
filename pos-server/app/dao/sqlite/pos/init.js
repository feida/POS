const async = require('async');

const config = require('../../config/index');
const initData = require('./initData');
const sqlite = require('../../sqlite/pos/index').client;
const request = require('request');
const fs = require('fs');
const path = require('path');

const readline = require('readline');

var timeBegin = 0;
var timeEnd = null;

const rl = readline.createInterface(process.stdin, process.stdout);

const minimist = require('minimist');
const args = minimist(process.argv.slice(2));
const boxConfigPath = '../../config/box/index.js';

const setWebSocketAddress = function (webSocketAddress, cb) {
    let jsPath = path.resolve() + "/../../../../public/static/js";
    console.warn(jsPath);
    fs.readdirSync(jsPath).forEach(function (fileName) {
        if (fileName.match("^app.*.js$")) {
            var filePath = path.join(jsPath, fileName);
            fs.readFile(filePath, 'utf8', (err, file) => {
                if (err) {
                    console.log("read websocket File error：" + err.toString());
                    return;
                }
                file = file.replace("ws://139.196.222.42:8680", "ws://" + webSocketAddress);
                fs.writeFile(filePath, file, (err) => {
                    if (err) {
                        console.log("update websocket File error：" + err.toString());
                        return;
                    }
                    console.log("ws：" + webSocketAddress);
                    cb();
                });
            });
        }
    });
};

if (args.init == 'yes') {
    if (args.env == 'box') { // 预先box激活码激活
        if (config.java_server_db && config.java_server_db.key && config.java_server_db.host) { // 非第一次激活
            let serverIp = config.java_server_db.serverIp;
            process.exit(0);
            // setWebSocketAddress(serverIp, function () {
            //     process.exit(0);
            // });
        } else { // 第一次激活需要输入激活码
            rl.question('Please enter the activation code:##', (answer) => { // 1、输入激活码
                if (answer.length != 16) {
                    console.warn(`Activation code##：${answer}，error`);
                    rl.close();
                } else {
                    async.waterfall([
                        function (cb) {// 2、检验激活码
                            let option = {
                                url: `http://${config.java_server_db.host}:${config.java_server_db.port}${config.java_server_db.path}checkKey`,
                                method: config.java_server_db.method,
                                json: true,
                                headers: config.java_server_db.headers,
                                form: {
                                    "key": answer
                                }
                            };
                            request(option, function (error, response, body) {
                                if (error) {
                                    console.warn("server exception");
                                    rl.close();
                                }
                                if (!error && response.statusCode == 200) {
                                    if (!body.success) {
                                        console.warn(body.message);
                                        rl.close();
                                    } else { // 验证正确
                                        option.url = `http://${config.java_server_db.host}:${config.java_server_db.port}${config.java_server_db.path}getServerAddress`;
                                        option.form.brandId = body.data.brandId;
                                        option.form.shopId = body.data.shopId;
                                        config.java_server_db.brandId = body.data.brandId; // config brandId
                                        config.java_server_db.shopId = body.data.shopId; // config shopId
                                        config.java_server_db.key = answer; // config key
                                        cb(null, option)
                                    }
                                }
                            });
                        },
                        function (option, cb) { // 2、请求新服务器地址写入文件
                            request(option, function (error, response, body) { //3、获取服务器地址
                                if (error) {
                                    console.warn("server exception");
                                    rl.close();
                                }
                                if (!error && response.statusCode == 200) {
                                    if (!body.success) {
                                        console.warn(body.message);
                                        rl.close();
                                    } else {
                                        config.java_server_db.host = formatServerAddress(body.data.posWebUrl); // config host
                                        config.java_server_db.port = formatServerAddressPort(body.data.posWebUrl); // config host
                                        config.java_server_db.serverIp = body.data.serverIp;
                                        config.java_server_db.updateTime = Date.now().toString(); // config updateTime
                                        var updateConfig = JSON.stringify(config);
                                        fs.writeFileSync(boxConfigPath, "module.exports =" + updateConfig);
                                        cb(null, config)
                                    }
                                }
                            })
                        },
                        function (config, cb) { // 4、初始化数据库
                            sqlite.sync({ force: true }).then(function (err) {
                                console.log('init sqlite success');
                                init(function () {
                                    console.warn('init database data success');
                                    cb(null, config)
                                });
                            });
                        },
                        // function (config, cb) { // 5、更新前端服务器地址
                        //     let serverIp = config.java_server_db.serverIp
                        //     setWebSocketAddress(serverIp, function () {
                        //         cb(null, config)
                        //     })
                        // }
                    ], function (err, result) {
                        console.log('done'); // 5、完成
                        rl.close();
                    })

                }
            });
        }
    } else { // 不用box激活码直接 初始化数据库
        sqlite.sync({ force: true }).then(function (err) {
            console.log('init sqlite success');
            init(function () {
                console.warn('init database data success');
                process.exit(0);
            });
        });
    }
}else {
    sqlite.sync({ force: true }).then(function (err) {
        console.log('init sqlite success');
        process.exit(0);
    });
}

const formatServerAddress = function (url) {
    return url.substring(url.indexOf("//") + 2, url.lastIndexOf(":"));
}

const formatServerAddressPort = function (url) {
    return url.substring(url.lastIndexOf(":") + 1, url.lastIndexOf("/"));
}

const init = function (callback) {
    timeBegin = new Date().getTime();
    async.parallel({
        InitArea: function (cb) {
            initData.InitArea(cb)                //区域表--tb_area
        },
        InitArticle: function (cb) {
            initData.InitArticle(cb)             //菜品表——tb_article
        },
        InitArticleAttr: function (cb) {
            initData.InitArticleAttr(cb)         //菜品老规格属性表——tb_article_attr
        },
        InitArticleFamily: function (cb) {
            initData.InitArticleFamily(cb)       //菜品老规格属性表——tb_article_attr
        },
        InitArticleKitchen: function (cb) {
            initData.InitArticleKitchen(cb)      //菜品出餐厨房表——tb_article_kitchen
        },
        InitArticlePrice: function (cb) {
            initData.InitArticlePrice(cb)        //菜品老规格详情表——tb_article_price
        },
        InitArticleSupportTime: function (cb) {
            initData.InitArticleSupportTime(cb)  //菜品供应时间表——tb_article_support_time
        },
        InitArticleUnit: function (cb) {
            initData.InitArticleUnit(cb)         //菜品老规格属性子项（详情）表——tb_article_unit
        },
        InitArticleUnitDetail: function (cb) {
            initData.InitArticleUnitDetail(cb)   //菜品新规格属性子项关联表——tb_article_unit_detail
        },
        InitArticleUnitNew: function (cb) {
            initData.InitArticleUnitNew(cb)      //菜品新规格属性关联表——tb_article_unit_new
        },
        InitKitchen: function (cb) {
            initData.InitKitchen(cb)             //出餐厨房--tb_kitchen
        },
        InitMealAttr: function (cb) {
            initData.InitMealAttr(cb)            //套餐属性表——tb_meal_attr
        },
        InitMealItem: function (cb) {
            initData.InitMealItem(cb)            //套餐属性子项表——tb_meal_item
        },
        InitPrinter: function (cb) {
            initData.InitPrinter(cb)             //打印机表--tb_printer
        },
        InitShopDetail: function (cb) {
            initData.InitShopDetail(cb)          //店铺详情表——tb_shop_detail
        },
        InitSupportTime: function (cb) {
            initData.InitSupportTime(cb)         //供应时间表——tb_support_time
        },
        InitTableQrcode: function (cb) {
            initData.InitTableQrcode(cb)         //桌位表--tb_table_qrcode
        },
        InitUnit: function (cb) {
            initData.InitUnit(cb)                //菜品新规格属性表——tb_unit
        },
        InitUnitDetail: function (cb) {
            initData.InitUnitDetail(cb)          //菜品新规格属性子项表——tb_unit_detail
        },
        InitUser: function (cb) {
            initData.InitUser(cb)                //用户表——tb_user
        },
        InitOrderRemark: function (cb) {
            initData.InitOrderRemark(cb)        //订单备注表——tb_order_remark
        },
        InitRefundRemark: function (cb) {
            initData.InitRefundRemark(cb)        //退菜备注表——tb_refund_remark
        },
        InitBrandSetting: function (cb) {       //品牌设置表——tb_brand_setting
            initData.InitBrandSetting(cb)
        },
        InitShopTvConfig: function (cb) {       //电视配置信息——tb_shop_tv_config
            initData.InitShopTvConfig(cb)
        },
        InitWeightPackage: function (cb) {          //重量包——tb_weight_package
            initData.InitWeightPackage(cb)
        },
        InitWeightPackageDetail: function (cb) {    //重量包详情——tb_weight_package_detail
            initData.InitWeightPackageDetail(cb)
        },
        InitVirtualProductsList: function (cb) {          //获取虚拟餐包——tb_virtual_products
            initData.InitVirtualProductsList(cb)
        },
        InitVirtualProductsKitchenList: function (cb) {     //获取虚拟餐包厨房信息——tb_virtual_products_kitchen
            initData.InitVirtualProductsKitchenList(cb)
        },
        InitSelectKitchenAndPrinterList: function (cb) {   //双动线查询厨房和打印机——tb_kitchen_printer
            initData.InitSelectKitchenAndPrinterList(cb)
        },
        InitSelectArticleAndKitchenGroupList: function (cb) {   //查询菜品和厨房组——tb_article_kitchen_printer
            initData.InitSelectArticleAndKitchenGroupList(cb)
        },
        InitSelectKitchenGroupAndKitchenList: function (cb) {   //查询菜品和厨房组——tb_kitchen_group_detail
            initData.InitSelectKitchenGroupAndKitchenList(cb)
        },
        InitSelectKitchenGroupList: function (cb) {             //查询厨房组——tb_kitchen_group
            initData.InitSelectKitchenGroupList(cb)
        },
        InitSelectRecommendList: function (cb) {             //推荐餐品表——tb_recommend
            initData.InitSelectRecommendList(cb)
        },
        InitSelectRecommendArticleList: function (cb) {             //推荐餐品关联菜品表——tb_recommend_article
            initData.InitSelectRecommendArticleList(cb)
        },
        // InitDailyLogOperation: function (cb) {             //结店操作
        //     initData.InitDailyLogOperation(cb)
        // },
        // InitPaymentReview: function (cb) {             //结店修改项
        //     initData.InitPaymentReview(cb)
        // }
    }, function (err, results) {
        if (err) {
            return console.error(err.stack);
        }
        timeEnd = new Date().getTime();
        console.log("total time：" + (timeEnd - timeBegin) / 1000 + " s");
        callback()
    });
}

