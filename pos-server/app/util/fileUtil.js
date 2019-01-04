/**
 * @author wxh on 2018/1/6
 * @copyright
 * @desc
 */
const path = require("path");
const fs = require("fs");
const moment = require("moment");
const request = require('request');
const shopDetail = require('../../config/shopDetail');


const serviceLogsUrl =`http://newpos.log.restoplus.cn`;

var fileUtil = module.exports;

fileUtil.log = function (fileName, content, cb) {
    fileUtil.appendFile(fileName, content, cb)
};

fileUtil.serviceInteractionLog = function (fileName, content, cb) {
    fileUtil.serviceInteractionLog(fileName, content, cb)
};

fileUtil.instructionsLog = function (fileName, content, cb) {
    fileUtil.instructionsLog(fileName, content, cb)
};
fileUtil.filterFile = function (fileName, content, cb) {
    fileUtil.filterFile(fileName, content, cb)
};

/**
 * 写入文件
 * @type {string}
 */
fileUtil.appendFile = function (fileName, content, cb) {
    if (typeof content == 'object') {
        content = JSON.stringify(content)
    }

    if (typeof cb != 'function') {
        cb = function () {
        };
    }
    let logRootPath = path.resolve() + `/logs/${moment().format('YYYY-MM-DD')}`;
    console.log(`【serverLog】- ${fileName}  \n\n    ${content && content.toString()}    \n`);
    fs.exists(logRootPath, function (exists) {
        if (!exists) {
            fs.mkdir(logRootPath, function (err) {
                if (err) return console.error(err);
            });
        }
        fs.appendFile(`${logRootPath}/info.log`, `[${moment().format('YYYY-MM-DD HH:mm:ss SSS')}] --- 【${fileName}】=> ${content && content.toString()} \n`, cb);
    });

    // let url = 'http://139.196.222.42:3000/';
    let url = `${serviceLogsUrl}/writeLog`;

    if (shopDetail.name) {

        request.post({url: url,
            form: {
                brandName: shopDetail.brandName,
                shopName: shopDetail.name,
                type: fileName,
                content: content.toString()
            }
        }, function (err, httpResponse, body) {

        });
    } else {
        let shopDetailPath = path.resolve() + "/config/shopDetail.json";
        fs.readFile(shopDetailPath, 'utf8', (err, tempShopDetail) => {
            if (err) {
                return;
            }
            if (tempShopDetail.name) {
                request.post({url: url,
                    form: {
                        brandName: tempShopDetail.brandName,
                        shopName: tempShopDetail.name,
                        type: fileName,
                        content: content.toString()
                    }
                }, function (err, httpResponse, body) {

                });
            }
        });
    }
};


/**
 * 写入文件
 * @type {string}
 */
fileUtil.filterFile = function (fileName, content, cb) {
    if (typeof content == 'object') {
        content = JSON.stringify(content)
    }

    if (typeof cb != 'function') {
        cb = function () {
        };
    }
    let logRootPath = path.resolve() + `/logs/${moment().format('YYYY-MM-DD')}`;

    fs.exists(logRootPath, function (exists) {
        if (!exists) {
            fs.mkdir(logRootPath, function (err) {
                if (err) return console.error(err);
            });
        }
        fs.appendFile(`${logRootPath}/logs.log`, `[${moment().format('YYYY-MM-DD HH:mm:ss SSS')}] --- 【${fileName}】=> ${content.toString()} \n`, cb);
    });

    // let url = 'http://139.196.222.42:3000/';
    let url = `${serviceLogsUrl}/writeFilterLogs`;

    if (shopDetail.name) {

        request.post({url: url,
            form: {
                brandName: shopDetail.brandName,
                shopName: shopDetail.name,
                type: fileName,
                content: content.toString()
            }
        }, function (err, httpResponse, body) {

        });
    } else {
        let shopDetailPath = path.resolve() + "/config/shopDetail.json";
        fs.readFile(shopDetailPath, 'utf8', (err, tempShopDetail) => {
            if (err) {
                return;
            }
            if (tempShopDetail.name) {
                request.post({url: url,
                    form: {
                        brandName: tempShopDetail.brandName,
                        shopName: tempShopDetail.name,
                        type: fileName,
                        content: content.toString()
                    }
                }, function (err, httpResponse, body) {

                });
            }
        });
    }
};




/**
 * pos行为操作日志
 * @type {string}
 */
fileUtil.posBehaviorLog = function (fileName, content, cb) {
    if (typeof content == 'object') {
        content = JSON.stringify(content)
    }

    if (typeof cb != 'function') {
        cb = function () {
        };
    }
    let logRootPath = path.resolve() + `/logs/${moment().format('YYYY-MM-DD')}`;
    fs.exists(logRootPath, function (exists) {
        if (!exists) {
            fs.mkdir(logRootPath, function (err) {
                if (err) return console.error(err);
            });
        }
        fs.appendFile(`${logRootPath}/posBehaviorLog.log`, `[${moment().format('YYYY-MM-DD HH:mm:ss SSS')}] --- 【${fileName}】=> ${content.toString()} \n`, cb);
    });
    let url = `${serviceLogsUrl}/posBehaviorLog`;
    if (shopDetail.name) {
        request.post({url: url,
            form: {
                brandName: shopDetail.brandName,
                shopName: shopDetail.name,
                type: fileName,
                content: content.toString()
            }
        }, function (err, httpResponse, body) {
        });
    } else {
        let shopDetailPath = path.resolve() + "/config/shopDetail.json";
        fs.readFile(shopDetailPath, 'utf8', (err, tempShopDetail) => {
            if (err) { return; }
            if (tempShopDetail.name) {
                request.post({url: url,
                    form: {
                        brandName: tempShopDetail.brandName,
                        shopName: tempShopDetail.name,
                        type: fileName,
                        content: content.toString()
                    }
                }, function (err, httpResponse, body) {
                });
            }
        });
    }
};


/**
 * 服务器交互日志
 * @type {string}
 */
fileUtil.serviceInteractionLog = function (fileName, content, cb) {
    if (typeof content == 'object') {
        content = JSON.stringify(content)
    }

    if (typeof cb != 'function') {
        cb = function () {
        };
    }
    let logRootPath = path.resolve() + `/logs/${moment().format('YYYY-MM-DD')}`;
    fs.exists(logRootPath, function (exists) {
        if (!exists) {
            fs.mkdir(logRootPath, function (err) {
                if (err) return console.error(err);
            });
        }
        fs.appendFile(`${logRootPath}/serviceInteractionLog.log`, `[${moment().format('YYYY-MM-DD HH:mm:ss SSS')}] --- 【${fileName}】=> ${content.toString()} \n`, cb);
    });
    let url = `${serviceLogsUrl}/serviceInteractionLog`;
    if (shopDetail.name) {
        request.post({url: url,
            form: {
                brandName: shopDetail.brandName,
                shopName: shopDetail.name,
                type: fileName,
                content: content.toString()
            }
        }, function (err, httpResponse, body) {
        });
    } else {
        let shopDetailPath = path.resolve() + "/config/shopDetail.json";
        fs.readFile(shopDetailPath, 'utf8', (err, tempShopDetail) => {
            if (err) { return; }
            if (tempShopDetail.name) {
                request.post({url: url,
                    form: {
                        brandName: tempShopDetail.brandName,
                        shopName: tempShopDetail.name,
                        type: fileName,
                        content: content.toString()
                    }
                }, function (err, httpResponse, body) {
                });
            }
        });
    }
};


/**
 * 指令日志
 * @type {string}
 */
fileUtil.instructionsLog = function (fileName, content, cb) {
    if (typeof content == 'object') {
        content = JSON.stringify(content)
    }

    if (typeof cb != 'function') {
        cb = function () {
        };
    }
    let logRootPath = path.resolve() + `/logs/${moment().format('YYYY-MM-DD')}`;
    fs.exists(logRootPath, function (exists) {
        if (!exists) {
            fs.mkdir(logRootPath, function (err) {
                if (err) return console.error(err);
            });
        }
        fs.appendFile(`${logRootPath}/instructionsLog.log`, `[${moment().format('YYYY-MM-DD HH:mm:ss SSS')}] --- 【${fileName}】=> ${content.toString()} \n`, cb);
    });
    let url = `${serviceLogsUrl}/instructionsLog`;
    if (shopDetail.name) {
        request.post({url: url,
            form: {
                brandName: shopDetail.brandName,
                shopName: shopDetail.name,
                type: fileName,
                content: content.toString()
            }
        }, function (err, httpResponse, body) {
        });
    } else {
        let shopDetailPath = path.resolve() + "/config/shopDetail.json";
        fs.readFile(shopDetailPath, 'utf8', (err, tempShopDetail) => {
            if (err) { return; }
            if (tempShopDetail.name) {
                request.post({url: url,
                    form: {
                        brandName: tempShopDetail.brandName,
                        shopName: tempShopDetail.name,
                        type: fileName,
                        content: content.toString()
                    }
                }, function (err, httpResponse, body) {
                });
            }
        });
    }
};