/**
 * 数据同步
 *
 * 【加载数据】：所有数据已服务器为准，不加载 订单表(tb_order)，订单项表(tb_order_item)和订单支付项表(tb_order_payment_item)  这三张表的数据
 *
 * 【上传数据】：只包含 订单表，订单项表和订单支付项表 这三张表的数据
 *
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
const unitDao = require("../dao/unitDao");
const unitDetailDao = require("../dao/unitDetailDao");
const articleSupportTimeDao = require("../dao/articleSupportTimeDao");
const supportTimeDao = require("../dao/supportTimeDao");

const async = require('async');

var syncDataUtil = module.exports;


console.time("【lmx】 sync Data");
var timeBegin = new Date().getTime();
var timeEnd = null;


//区域列表
syncDataUtil.areaList = function () {
    console.time("areaList");
    httpClient.post("areaList", null, function (data) {
        areaDao.initServerData(data, function () {
            console.timeEnd("areaList");
            console.log("success ...  insert ：" + data.length + "\n");
            syncDataUtil.articleList();
        })
    })
};
// syncDataUtil.areaList();

//菜品列表
syncDataUtil.articleList = function () {
    console.time("articleList");
    httpClient.post("articleList", null, function (data) {
        articleDao.initServerData(data, function () {
            console.timeEnd("articleList");
            console.log("success ...  insert ：" + data.length + "\n");
            syncDataUtil.articleAttrList();
        })
    })
};

//菜品规格
syncDataUtil.articleAttrList = function () {
    console.time("articleAttrList");
    httpClient.post("articleAttrList", null, function (data) {
        articleAttrDao.initServerData(data, function () {
            console.timeEnd("articleAttrList");
            console.log("success ...  insert ：" + data.length + "\n");
            syncDataUtil.articleFamilyList();
        })
    })
};
// syncDataUtil.articleAttrList();

//菜品分类
syncDataUtil.articleFamilyList = function () {
    console.time("articleFamilyList");
    httpClient.post("articleFamilyList", null, function (data) {
        articleFamilyDao.initServerData(data, function () {
            console.timeEnd("articleFamilyList");
            console.log("success ...  insert ：" + data.length + "\n");
            syncDataUtil.articleKitchenList();
        })
    })
};
// syncDataUtil.articleFamilyList();

//菜品出单厨房
syncDataUtil.articleKitchenList = function () {
    console.time("articleKitchenList");
    httpClient.post("articleKitchenList", null, function (data) {
        articleKitchenDao.initServerData(data, function () {
            console.timeEnd("articleKitchenList");
            console.log("success ...  insert ：" + data.length + "\n");
            syncDataUtil.articlePriceList();
        })
    })
}
// syncDataUtil.articleKitchenList();

//菜品规格
syncDataUtil.articlePriceList = function () {
    console.time("articlePriceList");
    httpClient.post("articlePriceList", null, function (data) {
        articlePriceDao.initServerData(data, function () {
            console.timeEnd("articlePriceList");
            console.log("success ...  insert ：" + data.length + "\n");
            syncDataUtil.articleUnitList();
        })
    })
}
// syncDataUtil.articlePriceList();

//菜品规格
syncDataUtil.articleUnitList = function () {
    console.time("articleUnitList");
    httpClient.post("articleUnitList", null, function (data) {
        articleUnitDao.initServerData(data, function () {
            console.timeEnd("articleUnitList");
            console.log("success ...  insert ：" + data.length + "\n");
            syncDataUtil.articleUnitDetailList();
        })
    })
}
// syncDataUtil.articleUnitList();

//菜品新规格属性子项
syncDataUtil.articleUnitDetailList = function () {
    console.time("articleUnitDetailList");
    httpClient.post("articleUnitDetailList", null, function (data) {
        articleUnitDetailDao.initServerData(data, function () {
            console.timeEnd("articleUnitDetailList");
            console.log("success ...  insert ：" + data.length + "\n");
            syncDataUtil.articleUnitNewList();
        })
    })
}
// syncDataUtil.articleUnitDetailList();

//菜品新规格属性
syncDataUtil.articleUnitNewList = function () {
    console.time("articleUnitNewList");
    httpClient.post("articleUnitNewList", null, function (data) {
        articleUnitNewDao.initServerData(data, function () {
            console.timeEnd("articleUnitNewList");
            console.log("success ...  insert ：" + data.length + "\n");
            syncDataUtil.kitchenList();
        })
    })
};
// syncDataUtil.articleUnitNewList();

//厨房列表
syncDataUtil.kitchenList = function () {
    console.time("kitchenList");
    httpClient.post("kitchenList", null, function (data) {
        kitchenDao.initServerData(data, function () {
            console.timeEnd("kitchenList");
            console.log("success ...  insert ：" + data.length + "\n");
            syncDataUtil.mealAttrList();
        })
    })
};
// syncDataUtil.kitchenList();

//套餐属性列表
syncDataUtil.mealAttrList = function () {
    console.time("mealAttrList");
    httpClient.post("mealAttrList", null, function (data) {
        mealAttrDao.initServerData(data, function () {
            console.timeEnd("mealAttrList");
            console.log("success ...  insert ：" + data.length + "\n");
            syncDataUtil.mealItemList();
        })
    })
};
// syncDataUtil.mealAttrList();

//套餐属性子项表
syncDataUtil.mealItemList = function () {
    console.time("mealItemList");
    httpClient.post("mealItemList", null, function (data) {
        mealItemDao.initServerData(data, function () {
            console.timeEnd("mealItemList");
            console.log("success ...  insert ：" + data.length + "\n");
            syncDataUtil.printerList();
        })
    })
};
// syncDataUtil.mealItemList();

//打印机列表
syncDataUtil.printerList = function () {
    console.time("printerList");
    httpClient.post("printerList", null, function (data) {
        printerDao.initServerData(data, function () {
            console.timeEnd("printerList");
            console.log("success ...  insert ：" + data.length + "\n");
            syncDataUtil.shopDetail();
        })
    })
};
// syncDataUtil.printerList();

//店铺详情
syncDataUtil.shopDetail = function () {
    console.time("shopDetail");
    httpClient.post("shopDetail", null, function (data) {
        shopDetailDao.initServerData(data, function () {
            console.timeEnd("shopDetail");
            // console.log(data);
            console.log("success ...  insert ：" + data.length + "\n");
            syncDataUtil.tableQrcodeList();
        })
    })
};
// syncDataUtil.shopDetail();

//桌位列表              桌位可能未绑定 区域
syncDataUtil.tableQrcodeList = function () {
    console.time("tableQrcodeList");
    httpClient.post("tableQrcodeList", null, function (data) {
        tableQrcodeDao.initServerData(data, function () {
            console.timeEnd("tableQrcodeList");
            console.log("success ...  insert ：" + data.length + "\n");
            syncDataUtil.unitList();
        })
    })
};
// syncDataUtil.tableQrcodeList();

//菜品新规格属性表
syncDataUtil.unitList = function () {
    console.time("unitList");
    httpClient.post("unitList", null, function (data) {
        unitDao.initServerData(data, function () {
            console.timeEnd("unitList");
            console.log("success ...  insert ：" + data.length + "\n");
            syncDataUtil.unitDetailList();
        });
    });
};
// syncDataUtil.unitList();

//菜品新规格属性子项表
syncDataUtil.unitDetailList = function () {
    console.time("unitDetailList");
    httpClient.post("unitDetailList", null, function (data) {
        unitDetailDao.initServerData(data, function () {
            console.timeEnd("unitDetailList");
            console.log("success ...  insert ：" + data.length + "\n");
            syncDataUtil.supportTimeList();
        });
    })
};

//供应时间表
syncDataUtil.supportTimeList = function () {
    console.time("supportTimeList");
    httpClient.post("supportTime", null, function(data) {
        supportTimeDao.batchInitSupportTime(data, function() {
            console.log("\n" + "success ...  insert ：" + data.length);
            console.timeEnd("supportTimeList");
            syncDataUtil.articleSupportTimeList();
        });
    });
};
// syncDataUtil.supportTimeList();

//菜品供应时间表
syncDataUtil.articleSupportTimeList = function () {
    console.time("articleSupportTimeList");
    httpClient.post("articleSupport", null, function(data) {
        articleSupportTimeDao.batchInitArticleSupportTime(data, function() {
            console.log("\n" + "success ...  insert ：" + data.length);
            console.timeEnd("articleSupportTimeList");

            console.log("\n\n");
            timeEnd = new Date().getTime();
            console.log("总共用时：" + (timeEnd - timeBegin) / 1000 + " s");
            console.timeEnd("【lmx】 sync Data");
        });
    });
};
// syncDataUtil.articleSupportTimeList();


// syncDataUtil.areaList();


// syncDataUtil.areaList();
// syncDataUtil.articleList();
// syncDataUtil.articleAttrList();
// syncDataUtil.articleFamilyList();
// syncDataUtil.articleKitchenList();
// syncDataUtil.articlePriceList();
// syncDataUtil.articleUnitDetailList();
// syncDataUtil.articleUnitNewList();
// syncDataUtil.kitchenList();
// syncDataUtil.mealAttrList();
// syncDataUtil.mealItemList();
// syncDataUtil.printerList();
// syncDataUtil.shopDetail();
// syncDataUtil.tableQrcodeList();
// syncDataUtil.unitList();
// syncDataUtil.unitDetailList();



// function step1(resolve, reject) {
//     console.time("areaList");
//     httpClient.post("areaList", null, function (data) {
//         areaDao.initServerData(data, function () {
//             console.timeEnd("areaList");
//             resolve("areaList success ...");
//         })
//     });
// }
//
// function step2(resolve, reject) {
//     console.time("articleList");
//     httpClient.post("articleList", null, function (data) {
//         articleDao.initServerData(data, function () {
//             console.timeEnd("articleList");
//             resolve("articleList success ...");
//         })
//     });
// }
//
// function step3(resolve, reject) {
//     console.time("articleAttrList");
//     httpClient.post("articleAttrList", null, function (data) {
//         articleAttrDao.initServerData(data, function () {
//             console.timeEnd("articleAttrList");
//             resolve("articleAttrList success ...");
//         })
//     });
// }
//
//
// new Promise(step1).then(function(val){
//     console.info(val);
//     return new Promise(step2);
// }).then(function(val){
//     console.info(val);
//     return new Promise(step3);
// }).then(function(val){
//     console.info(val);
//     return val;
// }).then(function(val){
//     console.info(val);
//     return val;
// });

