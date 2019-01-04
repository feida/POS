const request = require("request");
const httpClientConfig = require('../dao/config/index').java_server_db;
const adminClientConfig = require('../dao/config/index').admin_server_db;
const shopDetail = require('../../config/shopDetail');

let requestUtil = module.exports;

requestUtil.post = function (route, param, cb) {
    let path = `http://${httpClientConfig.host}:${httpClientConfig.port}${httpClientConfig.path}${route}`;
    let form = {
        brandId: shopDetail.brandId,
        shopId: shopDetail.id,
    };
    for (let i in param) {
        form[i] = param[i]
    }
    request.post({
        url: path,
        form: form
    }, (error, response, body) => {
        return cb(error, body);
    })
}

requestUtil.get = function (route, param, cb) {
    let path = `http://${httpClientConfig.host}:${httpClientConfig.port}${httpClientConfig.path}${route}`;
    let form = {
        brandId: shopDetail.brandId,
        shopId: shopDetail.id,
    }
    let params = Object.assign(form, param);
    request.get({
        url: path,
        qs: params,
    }, (error, response, body) => {
        return cb(error, response && response.body || '');
    })
}


requestUtil.admin_put = function (route, param, cb) {
    let path = `http://${adminClientConfig.host}:${adminClientConfig.port}${adminClientConfig.path}${route}`;
    let form = {
        brand_id: shopDetail.brandId,
        shop_id: shopDetail.id,
    };

    for (let i in param) {
        form[i] = param[i]
    }

    request({
        url: path,
        method: "PUT",
        json: true,
        headers: {
            "content-type": "application/json",
        },
        body: form
    }, function(error, response, body) {
        return cb(error, body);
    });
};