/**
 *  数据同步
 *
 * 【加载数据】：所有数据已服务器为准，不加载 订单表(tb_order)，订单项表(tb_order_item)和订单支付项表(tb_order_payment_item)  这三张表的数据
 *
 * 【上传数据】：只包含 订单表，订单项表和订单支付项表 这三张表的数据
 *
 *  测试
 * Created by Lmx on 2017/6/15.
 */
const httpClient = require("./httpClient");
const areaDao = require("../dao/areaDao");
const articleDao = require("../dao/articleDao");
const articleAttrDao = require("../dao/articleAttrDao");
const articleFamilyDao = require("../dao/articleFamilyDao");
const articleKitchenDao = require("../dao/articleKitchenDao");
const articlePriceDao = require("../dao/articlePriceDao");
const articleUnitDetailDao = require("../dao/articleUnitDetailDao");
const articleUnitDao = require("../dao/articleUnitDao");
const articleUnitNewDao = require("../dao/articleUnitNewDao");
const kitchenDao = require("../dao/kitchenDao");
const mealAttrDao = require("../dao/mealAttrDao");
const mealItemDao = require("../dao/mealItemDao");
const printerDao = require("../dao/printerDao");
const shopDetailDao = require("../dao/shopDetailDao");
const tableQrcodeDao = require("../dao/tableQrcodeDao");
const unitDetailDao = require("../dao/unitDetailDao");
const unitDao = require("../dao/unitDao");
const userDao = require("../dao/userDao");
const articleSupportTimeDao = require("../dao/articleSupportTimeDao");
const supportTimeDao = require("../dao/supportTimeDao");
const orderRemarkDao = require("../dao/orderRemarkDao");
const refundRemarkDao = require("../dao/refundRemarkDao");
const brandSettingDao = require("../dao/brandSettingDao");
const orderRefundRemarkDao = require("../dao/orderRefundRemarkDao");

var syncDataUtil = module.exports;

var async = require('async');

console.time("【lmx】 sync Data");
var timeBegin = new Date().getTime();
var timeEnd = null;

syncDataUtil.allData = function(callback) {
    async.waterfall([
        function(cb) {
            console.time("areaList");
            httpClient.post("areaList", null, function(data) {
                areaDao.initServerData(data, function() {
                    console.log("\n" + "success ...  insert ：" + data.length);
                    console.timeEnd("areaList");
                    cb(null);
                });
            });
        },
        function(cb) {
            console.time("articleList");
            httpClient.post("articleList", null, function(data) {
                articleDao.initServerData(data, function() {
                    console.log("\n" + "success ...  insert ：" + data.length);
                    console.timeEnd("articleList");
                    cb(null);
                });
            });

        },
        function(cb) {
            console.time("articleAttrList");
            httpClient.post("articleAttrList", null, function(data) {
                articleAttrDao.initServerData(data, function() {
                    console.log("\n" + "success ...  insert ：" + data.length);
                    console.timeEnd("articleAttrList");
                    cb(null);
                });
            });
        },
        function(cb) {
            console.time("articleFamilyList");
            httpClient.post("articleFamilyList", null, function(data) {
                articleFamilyDao.initServerData(data, function() {
                    console.log("\n" + "success ...  insert ：" + data.length);
                    console.timeEnd("articleFamilyList");
                    cb(null);
                });
            });
        },
        function(cb) {
            console.time("articleKitchenList");
            httpClient.post("articleKitchenList", null, function(data) {
                articleKitchenDao.initServerData(data, function() {
                    console.log("\n" + "success ...  insert ：" + data.length);
                    console.timeEnd("articleKitchenList");
                    cb(null);
                });
            });
        },
        function(cb) {
            console.time("articlePriceList");
            httpClient.post("articlePriceList", null, function(data) {
                articlePriceDao.initServerData(data, function() {
                    console.log("\n" + "success ...  insert ：" + data.length);
                    console.timeEnd("articlePriceList");
                    cb(null);
                });
            });
        },
        function(cb) {
            console.time("articleSupportTimeList");
            httpClient.post("articleSupport", null, function(data) {
                articleSupportTimeDao.batchInitArticleSupportTime(data, function() {
                    console.log("\n" + "success ...  insert ：" + data.length);
                    console.timeEnd("articleSupportTimeList");
                    cb(null);
                });
            });
        },
        function(cb) {
            console.time("articleUnitList");
            httpClient.post("articleUnitList", null, function(data) {
                articleUnitDao.initServerData(data, function() {
                    console.log("\n" + "success ...  insert ：" + data.length);
                    console.timeEnd("articleUnitList");
                    cb(null);
                });
            });
        },
        function(cb) {
            console.time("articleUnitDetailList");
            httpClient.post("articleUnitDetailList", null, function(data) {
                articleUnitDetailDao.initServerData(data, function() {
                    console.log("\n" + "success ...  insert ：" + data.length);
                    console.timeEnd("articleUnitDetailList");
                    cb(null);
                });
            });
        },
        function(cb) {
            console.time("articleUnitNewList");
            httpClient.post("articleUnitNewList", null, function(data) {
                articleUnitNewDao.initServerData(data, function() {
                    console.log("\n" + "success ...  insert ：" + data.length);
                    console.timeEnd("articleUnitNewList");
                    cb(null);
                });
            });
        },
        function(cb) {
            console.time("kitchenList");
            httpClient.post("kitchenList", null, function(data) {
                kitchenDao.initServerData(data, function() {
                    console.log("\n" + "success ...  insert ：" + data.length);
                    console.timeEnd("kitchenList");
                    cb(null);
                });
            });
        },
        function(cb) {
            console.time("mealAttrList");
            httpClient.post("mealAttrList", null, function(data) {
                mealAttrDao.initServerData(data, function() {
                    console.log("\n" + "success ...  insert ：" + data.length);
                    console.timeEnd("mealAttrList");
                    cb(null);
                });
            });
        },
        function(cb) {
            console.time("mealItemList");
            httpClient.post("mealItemList", null, function(data) {
                mealItemDao.initServerData(data, function() {
                    console.log("\n" + "success ...  insert ：" + data.length);
                    console.timeEnd("mealItemList");
                    cb(null);
                });
            });
        },
        function(cb) {
            console.time("printerList");
            httpClient.post("printerList", null, function(data) {
                printerDao.initServerData(data, function() {
                    console.log("\n" + "success ...  insert ：" + data.length);
                    console.timeEnd("printerList");
                    cb(null);
                });
            });
        },
        function(cb) {
            console.time("shopDetail");
            httpClient.post("shopDetail", null, function(data) {
                shopDetailDao.initServerData(data, function() {
                    console.log("\n" + "success ...  insert ：" + data.length);
                    console.timeEnd("shopDetail");
                    cb(null);
                });
            });
        },
        function(cb) {
            console.time("supportTimeList");
            httpClient.post("supportTime", null, function(data) {
                supportTimeDao.batchInitSupportTime(data, function() {
                    console.log("\n" + "success ...  insert ：" + data.length);
                    console.timeEnd("supportTimeList");
                    cb(null);
                });
            });
        },
        function(cb) {
            console.time("tableQrcodeList");
            httpClient.post("tableQrcodeList", null, function(data) {
                tableQrcodeDao.initServerData(data, function() {
                    console.log("\n" + "success ...  insert ：" + data.length);
                    console.timeEnd("tableQrcodeList");
                    cb(null);
                });
            });
        },
        function(cb) {
            console.time("unitList");
            httpClient.post("unitList", null, function(data) {
                unitDao.initServerData(data, function() {
                    console.log("\n" + "success ...  insert ：" + data.length);
                    console.timeEnd("unitList");
                    cb(null);
                });
            });
        },
        function(cb) {
            console.time("unitDetailList");
            httpClient.post("unitDetailList", null, function(data) {
                unitDetailDao.initServerData(data, function() {
                    console.log("\n" + "success ...  insert ：" + data.length);
                    console.timeEnd("unitDetailList");
                    cb(null);
                });
            });
        },
        function(cb) {
            console.time("brandUserList");
            httpClient.post("brandUserList", null, function(data) {
                userDao.initServerData(data, function() {
                    console.log("\n" + "success ...  insert ：" + data.length);
                    console.timeEnd("brandUserList");
                    cb(null);
                });
            });
        },
        function(cb) {
            console.time("orderRemarkList");
            httpClient.post("orderRemarkList", null, function(data = []) {
                orderRemarkDao.initServerData(data, function() {
                    console.log("\n" + "success ...  insert ：" + data.length || 0);
                    console.timeEnd("orderRemarkList");
                    cb(null);
                });
            });
        },
        function(cb) {
            console.time("refundRemarkList");
            httpClient.post("refundRemarkList", null, function(data) {
                refundRemarkDao.initServerData(data, function() {
                    console.log("\n" + "success ...  insert ：" + data.length || 0);
                    console.timeEnd("refundRemarkList");
                    cb(null);
                });
            });
        },
        function(cb) {
            console.time("brandSetting");
            httpClient.post("getBrandSetting", null, function(data) {
                brandSettingDao.initServerData(data, function() {
                    console.log("\n" + "success ...  insert ：" + data.length || 0);
                    console.timeEnd("brandSetting");
                    cb(null);
                });
            });
        },
        // function(cb) {  //  --end
        //     console.time("orderRefundRemarkList");
        //     httpClient.post("orderRefundRemarkList", null, function(data) {
        //         orderRefundRemarkDao.initServerData(data, function() {
        //             console.log("\n" + "success ...  insert ：" + data.length || 0);
        //             console.timeEnd("orderRefundRemarkList");
        //             cb(null);
        //         });
        //     });
        // },
    ], function(err) {
        if (err) {
            console.log(err);
        }
        console.log("\n\n");
        timeEnd = new Date().getTime();
        console.timeEnd("【lmx】 sync Data");
        console.log("总共用时：" + (timeEnd - timeBegin) / 1000 + " s");
        callback && callback();
    });
};
// 同步 sync _lmx
// http://139.196.222.42:8580/pos/LocalPosSyncData/checkKey?key=1000001495791301
// node app/util/syncDataUtil.js
// syncDataUtil.allData();


//区域列表
syncDataUtil.areaList = function() {
    return new Promise(function(resolve, reject) {
        console.time("areaList");
        httpClient.post("areaList", null, function(data) {
            areaDao.initServerData(data, function() {
                console.timeEnd("areaList");
                console.log("\n" + "success ...  insert ：" + data.length);
                resolve(true);
            });
        });
    });
};

//菜品列表
syncDataUtil.articleList = function() {
    return new Promise(function(resolve, reject) {
        console.time("articleList");
        httpClient.post("articleList", null, function(data) {
            articleDao.initServerData(data, function() {
                console.timeEnd("articleList");
                console.log("\n" + "success ...  insert ：" + data.length);
                resolve(data.length);
            });
        });
    });
};

//菜品规格
syncDataUtil.articleAttrList = function() {
    return new Promise(function(resolve, reject) {
        console.time("articleAttrList");
        httpClient.post("articleAttrList", null, function(data) {
            articleAttrDao.initServerData(data, function() {
                console.timeEnd("articleAttrList");
                console.log("\n" + "success ...  insert ：" + data.length);
                resolve(data.length);
            });
        });
    });
};

//菜品分类
syncDataUtil.articleFamilyList = function() {
    return new Promise(function(resolve, reject) {
        console.time("articleFamilyList");
        httpClient.post("articleFamilyList", null, function(data) {
            articleFamilyDao.initServerData(data, function() {
                console.timeEnd("articleFamilyList");
                console.log("\n" + "success ...  insert ：" + data.length);
                resolve(data.length);
            })
        });
    });
};

//菜品出单厨房
syncDataUtil.articleKitchenList = function() {
    return new Promise(function(resolve, reject) {
        console.time("articleKitchenList");
        httpClient.post("articleKitchenList", null, function(data) {
            articleKitchenDao.initServerData(data, function() {
                console.log("\n" + "success ...  insert ：" + data.length);
                console.timeEnd("articleKitchenList");
                resolve(data.length);
            });
        });
    });
};

//菜品规格
syncDataUtil.articlePriceList = function() {
    return new Promise(function(resolve, reject) {
        console.time("articlePriceList");
        httpClient.post("articlePriceList", null, function(data) {
            articlePriceDao.initServerData(data, function() {
                console.log("\n" + "success ...  insert ：" + data.length);
                console.timeEnd("articlePriceList");
                resolve(data.length);
            });
        });
    });
};

//菜品规格
syncDataUtil.articleUnitList = function() {
    return new Promise(function(resolve, reject) {
        console.time("articleUnitList");
        httpClient.post("articleUnitList", null, function(data) {
            articleUnitDao.initServerData(data, function() {
                console.log("\n" + "success ...  insert ：" + data.length);
                console.timeEnd("articleUnitList");
                resolve(data.length);
            });
        });
    });
};

//菜品新规格属性子项
syncDataUtil.articleUnitDetailList = function() {
    return new Promise(function(resolve, reject) {
        console.time("articleUnitDetailList");
        httpClient.post("articleUnitDetailList", null, function(data) {
            articleUnitDetailDao.initServerData(data, function() {
                console.log("Length：" + data.length);
                console.timeEnd("articleUnitDetailList");
                resolve(data.length);
            });
        });
    });
};

//菜品新规格属性
syncDataUtil.articleUnitNewList = function() {
    return new Promise(function(resolve, reject) {
        console.time("articleUnitNewList");
        httpClient.post("articleUnitNewList", null, function(data) {
            articleUnitNewDao.initServerData(data, function() {
                console.log("Length：" + data.length);
                console.timeEnd("articleUnitNewList");
                resolve(data.length);
            });
        });
    });
};

//厨房列表
syncDataUtil.kitchenList = function() {
    return new Promise(function(resolve, reject) {
        console.time("kitchenList");
        httpClient.post("kitchenList", null, function(data) {
            kitchenDao.initServerData(data, function() {
                console.log("Length：" + data.length);
                console.timeEnd("kitchenList");
                resolve(data.length);
            });
        });
    });
};

//套餐属性列表
syncDataUtil.mealAttrList = function() {
    return new Promise(function(resolve, reject) {
        console.time("mealAttrList");
        httpClient.post("mealAttrList", null, function(data) {
            mealAttrDao.initServerData(data, function() {
                console.log("Length：" + data.length);
                console.timeEnd("mealAttrList");
                resolve(data.length);
            });
        });
    });
};

//套餐属性子项表
syncDataUtil.mealItemList = function() {
    return new Promise(function(resolve, reject) {
        console.time("mealItemList");
        httpClient.post("mealItemList", null, function(data) {
            mealItemDao.initServerData(data, function() {
                console.log("Length：" + data.length);
                console.timeEnd("mealItemList");
                resolve(data.length);
            });
        });
    });
};

//打印机列表
syncDataUtil.printerList = function() {
    return new Promise(function(resolve, reject) {
        console.time("printerList");
        httpClient.post("printerList", null, function(data) {
            printerDao.initServerData(data, function() {
                console.log("Length：" + data.length);
                console.timeEnd("printerList");
                resolve(data.length);
            });
        });
    });
};

//店铺详情
syncDataUtil.shopDetail = function() {
    return new Promise(function(resolve, reject) {
        console.time("shopDetail");
        httpClient.post("shopDetail", null, function(data) {
            shopDetailDao.initServerData(data, function() {
                console.log("init shopDetail success ... ");
                console.timeEnd("shopDetail");
                resolve(data ? 1 : 0);
            });
        });
    });
};

//桌位列表              桌位可能未绑定 区域
syncDataUtil.tableQrcodeList = function() {
    return new Promise(function(resolve, reject) {
        console.time("tableQrcodeList");
        httpClient.post("tableQrcodeList", null, function(data) {
            tableQrcodeDao.initServerData(data, function() {
                console.log("Length：" + data.length);
                console.timeEnd("tableQrcodeList");
                resolve(data.length);
            })
        })
    });
};

//菜品新规格属性表
syncDataUtil.unitList = function() {
    return new Promise(function(resolve, reject) {
        console.time("unitList");
        httpClient.post("unitList", null, function(data) {
            unitDao.initServerData(data, function() {
                console.log("Length：" + data.length);
                console.timeEnd("unitList");
                resolve(data.length);
            })
        })
    })
};

//菜品新规格属性子项表
syncDataUtil.unitDetailList = function() {
    return new Promise(function(resolve, reject) {
        console.time("unitDetailList");
        httpClient.post("unitDetailList", null, function(data) {
            unitDetailDao.initServerData(data, function() {
                console.log("Length：" + data.length);
                console.timeEnd("unitDetailList");
                resolve(data.length);
            });
        })
    })
};

//管理员用户数据
syncDataUtil.brandUserList = function() {
    return new Promise(function(resolve, reject) {
        console.time("brandUserList");
        httpClient.post("brandUserList", null, function(data) {
            userDao.initServerData(data, function() {
                console.log("Length：" + data.length);
                console.timeEnd("brandUserList");
                resolve(true,data.length);
            });
        })
    })
};

//菜品和供应时间关联关系
syncDataUtil.articleSupportTimeList = function() {
    return new Promise(function(resolve, reject) {
        console.time("articleSupportTimeList");
        httpClient.post("articleSupport", null, function(data) {
            articleSupportTimeDao.batchInitArticleSupportTime(data, function() {
                console.log("Length：" + data.length);
                console.timeEnd("articleSupportTimeList");
                resolve(true);
            });
        })
    })
};

//菜品供应时间
syncDataUtil.supportTimeList = function() {
    return new Promise(function(resolve, reject) {
        console.time("supportTimeList");
        httpClient.post("supportTime", null, function(data) {
            supportTimeDao.batchInitSupportTime(data, function() {
                console.log("Length：" + data.length);
                console.timeEnd("supportTimeList");
                resolve(true);
            });
        })
    })
};

//订单备注
syncDataUtil.orderRemarkList = function() {
    return new Promise(function(resolve, reject) {
        console.time("orderRemarkList");
        httpClient.post("orderRemarkList", null, function(data = []) {
            orderRemarkDao.initServerData(data, function() {
                console.log("Length：" + data.length);
                console.timeEnd("orderRemarkList");
                resolve(true);
            });
        })
    })
};

//退菜备注
syncDataUtil.refundRemarkList = function() {
    return new Promise(function(resolve, reject) {
        console.time("refundRemarkList");
        httpClient.post("refundRemarkList", null, function(data) {
            refundRemarkDao.initServerData(data, function() {
                console.log("Length：" + data.length);
                console.timeEnd("refundRemarkList");
                resolve(true);
            });
        })
    })
};

//退菜备注
syncDataUtil.getBrandSetting = function() {
    return new Promise(function(resolve, reject) {
        console.time("getBrandSetting");
        httpClient.post("getBrandSetting", null, function(data) {
            brandSettingDao.initServerData(data, function() {
                console.log("Length：" + data.length);
                console.timeEnd("getBrandSetting");
                resolve(true);
            });
        })
    })
};



// // 上传订单数据
// syncDataUtil.pushOrderList = function() {
//     return new Promise(function(resolve, reject) {
//         console.time("pushOrderList");
//         var param = {
//             orderList: [{
//                 id: "111",
//                 table_number: 202,
//                 customer_count: 5
//             }]
//         };
//         httpClient.post("pushOrderList", param, function(data) {
//             console.log("Length：" + data.length);
//             console.timeEnd("brandUserList");
//             resolve(true);
//         })
//     })
// };


// console.time("totalTime");
// syncDataUtil.areaList().then(function (val) {
//     console.log("areaList：" + val);
//     return syncDataUtil.articleList();
// }).then(function (val) {
//     console.log("articleList：" + val);
//     return syncDataUtil.articleAttrList();
// }).then(function (val) {
//     console.log("articleAttrList：" + val);
//     return syncDataUtil.articleFamilyList();
// }).then(function (val) {
//     console.log("articleFamilyList：" + val);
//     return syncDataUtil.articleKitchenList();
// }).then(function (val) {
//     console.log("articleKitchenList：" + val);
//     return syncDataUtil.articlePriceList();
// }).then(function (val) {
//     console.log("articlePriceList：" + val);
//     return syncDataUtil.articleUnitList();
// }).then(function (val) {
//     console.log("articleUnitList：" + val);
//     return syncDataUtil.articleUnitDetailList();
// }).then(function (val) {
//     console.log("articleUnitDetailList：" + val);
//     return syncDataUtil.articleUnitNewList();
// }).then(function (val) {
//     console.log("articleUnitNewList：" + val);
//     return syncDataUtil.kitchenList();
// }).then(function (val) {
//     console.log("kitchenList：" + val);
//     return syncDataUtil.mealAttrList();
// }).then(function (val) {
//     console.log("mealAttrList：" + val);
//     return syncDataUtil.mealItemList();
// }).then(function (val) {
//     console.log("mealItemList：" + val);
//     return syncDataUtil.printerList();
// }).then(function (val) {
//     console.log("printerList：" + val);
//     return syncDataUtil.shopDetail();
// }).then(function (val) {
//     console.log("shopDetail：" + val);
//     return syncDataUtil.tableQrcodeList();
// }).then(function (val) {
//     console.log("tableQrcodeList：" + val);
//     return syncDataUtil.unitList();
// }).then(function (val) {
//     console.log("unitList：" + val);
//     return syncDataUtil.unitDetailList();
// }).then(function (val) {
//     console.log("unitDetailList：" + val);
//     return syncDataUtil.brandUserList();
// }).then(function (val) {
//     console.log("brandUserList：" + val);
//     console.log("\n\n");
//     console.timeEnd("totalTime");
//     // return syncDataUtil;
// }).catch(function (err) {
//     console.log(err);
// });


// console.time("pushOrderList");

// orderDao.selectNotUploadOrder(function(data) {
//     var param = {
//         orderList: data
//     };
//     httpClient.upload("pushOrderList", param, function(data) {
//         console.log(data);
//         console.timeEnd("pushOrderList");
//     });
// });