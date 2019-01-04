/**
 * @author wxh on 2017/11/1
 * @copyright
 * @desc
 */

const http = require('http');
const toString = require('querystring');

var httpClient = module.exports;


function Deploy(obj) {
    this.host = obj.host;
    this.port = obj.port;
    this.method = obj.method;
    this.headers = obj.headers;
    this.brandId = obj.brandId;
    this.shopId = obj.shopId;
}

var baseRequest = function (httpClientConfig, param, successCB, errorCB) {
    var req = http.request(httpClientConfig, function (res) {
        res.setEncoding('utf-8');
        var result = "";
        res.on('data', function (data) {
            result += data;
        }).on('end', function () {
            if (result) {
                result = JSON.parse(result || {});
                if (result.success) {
                    successCB && successCB(result.data);
                } else {
                    console.log("\n【Response Error】\n");
                    console.log(result.message);
                }
            } else {
                console.error("\n\n --------------\nservers is error ...");
                console.error(result);
                console.error(httpClientConfig, param);
                console.error("\n\n ");
            }
        }).on('error', function (err) {
            console.log(err);
            console.log("\n【Request Error】\n");
            console.log(err);
            errorCB && errorCB();
        });
    });
    // param = Object.assign({}, param, {
    //     brandId: httpClientConfig.brandId,
    //     shopId: httpClientConfig.shopId
    // });
    param = {
        brandId: httpClientConfig.brandId,
        shopId: httpClientConfig.shopId
    };
    req.write(toString.stringify(param));
    req.end();

}

httpClient.post = function (httpClientConfig, param, successCB, errorCB) {
    baseRequest(httpClientConfig, param, successCB, errorCB)
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