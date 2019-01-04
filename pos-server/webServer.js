/**
 * Created by Lmx on 2017/7/14.
 */
var express = require('express');
var path = require("path");
// const fs = require('fs')
var appWeb = express();
// const requestUtil = require("../pos-server/app/util/requestUtil");
var __dirname = path.resolve();

appWeb.configure(function(){
    appWeb.use(express.methodOverride());
    appWeb.use(express.bodyParser());
    appWeb.use(appWeb.router);
    appWeb.set('view engine', 'jade');
    appWeb.set('views', __dirname + '/public');
    appWeb.set('view options', {layout: false});
    appWeb.set('basepath',__dirname + '/public');
});

appWeb.configure('development', function(){
    appWeb.use(express.static(__dirname + '/public'));
    appWeb.use(express.static(__dirname + '/app/dao/sqlite/pos'));
    appWeb.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

appWeb.configure('production', function(){
    var oneYear = 31557600000;
    appWeb.use(express.static(__dirname + '/public', { maxAge: oneYear }));
    appWeb.use(express.errorHandler());
});

console.log("Web server has started.\nPlease log on http://127.0.0.1:3001/index.html");

appWeb.listen(3001);

//如果存在数据 跳转到登陆界面
var base = path.resolve();
var httpClientConfig = require(base + '/app/dao/config/index.js').java_server_db;
httpClientConfig.key ?   window.location.href = "http://127.0.0.1:3001/#/login" : ""

// try {
//     requestUtil.post('/selectPackageUrl', {
//         brandId: '1d7442eb21734c96beeb67d4bdb2232d'
//     },(err, resultData) => {
//         if (err) return
//         readFile(resultData, (err, resultData) => {
//             fs.writeFile('./package.json', JSON.stringify(resultData), (err) => {
//                 if (err) return
//             })
//         })
//
//     })
// } catch (e) {
//     return
// }
// var readFile = function (data, callback) {
//    try {
//        data = JSON.parse(data)
//        let manifest = data.data.downloadAddress;
//        fs.readFile('./package.json', (err, resultData) => {
//            if (err) return;
//            let packageJson  = JSON.parse(resultData.toString());
//            packageJson.manifestUrl = manifest;
//            return callback(err, packageJson);
//        })
//    } catch (e) {
//        return callback("出错")
//    }
//
// }
//
// const pkg = require('./package');
// const updater = require('node-webkit-updater');
// const upd = new updater(pkg);
//
// upd.checkNewVersion(function(error, newVersionExists, manifest) {
//     console.log("newVersionExists", newVersionExists)
//     if (error || !newVersionExists) {
//         httpClientConfig.key ?   window.location.href = "http://127.0.0.1:3001/#/login" : ""
//     } else {
//         httpClientConfig.key ?   window.location.href = `./hotUpdate/update.html` : ""
//     }
// });
