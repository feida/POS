/**
 * Created by Lmx on 2017/6/15.
 */
const http = require('http');
const toString = require('querystring');
// const httpClientConfig = require('../../config/httpClientConfig')
const httpClientConfig = require('../dao/config/index').java_server_db;

var httpClient = module.exports;
var baseRequest = function (httpClientConfig, param, successCB, errorCB) {
    var req = http.request(httpClientConfig, function (res) {
        res.setEncoding('utf-8');
        var result = "";
        res.on('data', function (data) {
            result += data;
        }).on('end', function () {
            if (result) {
                try {
                    result = JSON.parse(result || {});
                    if (result.success) {
                        successCB && successCB(result.data);
                    } else {
                        console.log("\n【Response Error】\n");
                        console.log(result.message);
                    }
                } catch (e) {
                    console.log(result);
                    console.log("result is error ...");
                    console.log(e);
                }
            } else {
                console.log("servers is error ...");
                // errorCB && errorCB();
            }
        }).on('error', function (err) {
            console.log(err);
            console.log("\n【Request Error】\n");
            console.log(err);
            errorCB && errorCB();
        });
    });
    param = Object.assign({}, param, {
        brandId: httpClientConfig.brandId,
        shopId: httpClientConfig.shopId
    });
    // param = {
    //     brandId: httpClientConfig.brandId,
    //     shopId: httpClientConfig.shopId
    // };
    req.write(toString.stringify(param));
    req.end();

}

httpClient.post = function (url, param, successCB, errorCB) {
    // httpClientConfig.path = "/pos/LocalPosSyncData/" + url;
    // baseRequest(httpClientConfig, param, successCB, errorCB)

    let obj = new Deploy(httpClientConfig);
    obj.path = "/pos/LocalPosSyncData/" + url;
    baseRequest(obj, param, successCB, errorCB);
}

httpClient.get = function (url, param, successCB, errorCB) {
    httpClientConfig.method = "GET";
    baseRequest(httpClientConfig, url, param, successCB, errorCB)
}

httpClient.upload = function (url, param, successCB, errorCB) {
    // httpClientConfig.path = "/pos/LocalPosSyncData/" + url;
    // httpClientConfig.headers = {
    //     "Content-Type": "application/json"
    // }
    // var req = http.request(httpClientConfig, function (res) {
    //     res.setEncoding('utf-8');
    //     var result = "";
    //     res.on('data', function (data) {
    //         result += data;
    //     }).on('end', function () {
    //         console.log("----");
    //         console.log(result);
    //     }).on('error', function (err) {
    //         console.log(err);
    //     });
    // });
    // console.log(toString.stringify(param));
    // req.write(JSON.stringify(param));
    // req.end();


    httpClientConfig.path = "/pos/LocalPosSyncData/" + url;
    httpClientConfig.headers = {
        "Content-Type": "application/json"
    }

    var req = http.request(httpClientConfig, function (res) {
        res.setEncoding('utf-8');
        var result = "";
        res.on('data', function (data) {
            result += data;
        }).on('end', function () {
            result = JSON.parse(result || {});
            if (result.success) {
                successCB && successCB(result.data);
            } else {
                console.log("\n【Response Error】\n");
                console.log(result.message);
            }
        }).on('error', function (err) {
            console.log(err);
            console.log("\n【Request Error】\n");
            console.log(err);
            errorCB && errorCB();
        });
    });
    param = Object.assign({}, param, {
        brandId: httpClientConfig.brandId,
        shopId: httpClientConfig.shopId
    });
    req.write(JSON.stringify(param));
    req.end();
}

httpClient.network = function (onlinecb, offlinecb) {
    var url = "http://" + httpClientConfig.host + ":" + httpClientConfig.port + "/pos/LocalPosSyncData/shopDetail";
    try {
        http.get(url, (res) => {
            if (res.statusCode === 200) {
                onlinecb && onlinecb();
            } else {
                offlinecb && offlinecb();
            }
        }).on('error', (e) => {
            offlinecb && offlinecb();
        });
    } catch (error) {
        offlinecb && offlinecb();
    }
}

function Deploy(obj) {
    this.host = obj.host;
    this.port = obj.port;
    this.method = obj.method;
    this.headers = obj.headers;
    this.brandId = obj.brandId;
    this.shopId = obj.shopId;
}