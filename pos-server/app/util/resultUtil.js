/**
 * Created by Lmx on 2017/5/16.
 */

var result = module.exports;
const fileUtil = require("./fileUtil");

/**
 * 请求成功
 * @param next
 * @param data
 * @param msg
 */
result.success = function (next, data, msg) {
    next(null, {
        code: 200,
        success: true,
        msg: msg || null,
        data: data || null
    });
}

/**
 * 请求失败
 * @param next
 * @param msg
 */
result.error = function (next, msg, param) {
    next(null, {
        code:200,
        success: false,
        msg: msg || null,
        data: null
    });
    if (param) fileUtil.appendFile(`result error`, `${param.__route__}=>\n 请求:${JSON.stringify(param)} \n 返回：${(msg || null).toString()}`, function () { });
}

/**
 * 请求成功
 * @param next
 * @param data
 * @param msg
 */
result.wsSuccess = function (data, msg) {
    return {
        success: true,
        msg: msg || null,
        data: data || null
    }
}

/**
 * 请求失败
 * @param next
 * @param msg
 */
result.wsError = function (msg) {
    return {
        success: false,
        msg: msg.toString() || null,
        data: null
    }
}

result.formatParam = function (model, checkNull) {
    var _model = {};
    for (var m in model) {
        // if(checkNull && model[m] == null){
        //     continue;
        // }
        _model['$' + m] = model[m];
    }
    return _model;
}

result.isEmpty = function (str) {
    return str == null || "" == result.trim(str.toString());
}

result.dateVerify= function (str) {
    var reg = /^[1-9]\d{3}-(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[0-1])$/;
    var regExp = new RegExp(reg);
    return !regExp.test(str);
}

result.isNotEmpty = function (str) {
    return !result.isEmpty(str);
}

result.trim = function (str) {
    return str.replace(/(^\s*)|(\s*$)/g, '');
}