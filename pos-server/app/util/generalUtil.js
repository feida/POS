/**
 * 系统通用工具类
 * Created by Lmx on 2017/5/26.
 */
var uuidV4 = require('uuid/v4');
// var httpClientConfig = require('../../config/httpClientConfig');
//  var httpClientConfig = require('../dao/config/index').java_server_db;
var httpClientConfig = require('../../config/shopDetail');

var generalUtil = module.exports;

/**
 * 店铺ID
 * @type {string}
 */
generalUtil.shopId = httpClientConfig.id;

/**
 * 品牌ID
 * @type {string}
 */
generalUtil.brandId = httpClientConfig.brandId;

/**
 * 生成随机ID
 * @returns {*}
 */
generalUtil.randomUUID = function () {
    // var uuid = ;
    //去除 符号 -
    return uuidV4().replace(/-/g, "");
};

/**
 * 将 list数组 转为 map对象
 * @param list
 * @returns {{}}
 */
generalUtil.listToMap = function (list, key) {
    var map = {};
    for (var item of list) {
        map[key || item.id] = item;
    }
    return map;
};

/**
 * 生成随机数
 * @param num   几位随机数，默认为 5 位
 */
generalUtil.getRandomNumber = function (num = 5) {
    var str = "";
    for (var i = 0; i < num; i++) {
        str += Math.floor(Math.random() * 10);
    }
    return str;
};

/**
 * 将下划线命名转换为驼峰式命名
 * @param model
 */
generalUtil.convertHumpName = function (model) {
    var _model = {};
    for (var m in model) {
        if (m.indexOf("_") != -1) {
            var str = this.convert(m);
            _model[str] = model[m];
        } else {
            _model[m] = model[m];
        }
    }
    return _model;
};

generalUtil.convert = function (str) {
    var re = /_(\w)/g;
    return str.replace(re, function ($0, $1) {
        return $1.toUpperCase();
    });
};

/**
 * 去除字符串最后点小数点
 * 由于服务器返回的时间戳为 Long 型，转换时默认会加 .0  eg：1510107440000.0
 * @param str
 */
generalUtil.formatServerTime = function (str) {
    str = str.toString();
    if (str.indexOf(".") != -1) {
        return str.substring(0, str.lastIndexOf("."));
    } else {
        return str;
    }
};

generalUtil.isEmpty = function (str) {
    return str == null || "" == generalUtil.trim(str.toString());
};

generalUtil.isNotEmpty = function (str) {
    return !generalUtil.isEmpty(str);
};

generalUtil.trim = function (str) {
    return str.replace(/(^\s*)|(\s*$)/g, '');
};


/**
 * 统一四舍五入方法
 * @param num
 * @returns {number}
 */
generalUtil.rounding = function (num) {
    // return Math.round(num * 100) / 100;

    let n = (Math.round(num * 100) / 100).toFixed(2);

    return parseFloat(n.substring(0, n.indexOf(".") + 3));
};

