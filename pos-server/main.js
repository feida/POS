var path = require("path");
var base = path.resolve();
var httpClientConfig = require(base + '/app/dao/config/index.js').java_server_db;

const compare = require('compare-versions');

const packageInfo = require('./package.json');
const { get,post } = require('./app/util/requestUtil');
const { log } = require('./app/util/fileUtil');

const fsa = require('fs-extra');
const request = require('request');
const unzip = require('unzip');
const child_process = require("child_process");

const appDir = process.cwd();
const packName = 'RestoPlus';
const tmpdir = path.join(appDir, '../tmp');
const unzippath = path.join(tmpdir, packName);
const zippath = unzippath + '.zip';

const reg=/^[0-9]\.[0-99]{1,3}\.[0-9]{1,3}$/; //版本号格式校验
const thewin = window;

// 店铺激活判断
if (!httpClientConfig.key) {
    log('热更新', '未读到服务器设置/未激活')
} else {
    log('热更新', '已激活, 检查更新')
    // 更新逻辑
    post('versionPosBrand', {}, (err, data) => {
        if (err || !data) {
            return log('热更新', '检查更新接口出错')
        }

        log('热更新', data);

        data = JSON.parse(data);


        if (!data.success || !data.data) {
            return log('热更新', '接口返回错误')
        }


        // 版本判断逻辑
        let versionPos = data.data.versionPos;
        let brand = data.data.brand;
        let shop = data.data.store;

        if (versionPos==null && brand == null && shop == null){
            return log('热更新', '暂时未发现配置更新数据')
        }
        let versionArr = [versionPos,brand,shop].filter(x => x);
        let config = getVersion(versionArr);

        // 字段控制
        let addr = config.downloadAddress;
        if (!addr) {
            return log('热更新', '未给到更新包地址')
        }


        let updateornot = compare(config.versionNo, packageInfo.version)
        if (updateornot<=0) {
            return log('热更新', '已是最新版本')
        }
        // let update;

        // let RunTimer = function (k) {
        //     console.log("-----------",k)
        //     update = global.window.confirm(`有新版本, 是否更新版本? 倒计时: ${k}秒后将自动取消更新 `);
        //     k--;
        //     if (k >= 0) {
        //         timer = setTimeout(function () {
        //             RunTimer(k)
        //         }, 1000);
        //     }
        //     else {
        //         update = false;
        //     }
        // };
        // RunTimer(6)

        let update = global.window.confirm('有新版本, 是否更新版本?')
        if (!update) {
            return log('热更新', '用户选择不更新版本')
        }

        upgrade(config).then(() => {
            const child = child_process.fork('./hotload/update.js', [], {
                detached: true
            });
            alert("开始重启")
            child.unref();
            appQuit()
        }).catch(e => {
            log('热更新', '更新失败' + e.toString())
        })


        // if (versionPos) {
        //    if (compare(brand.versionNo, shop.versionNo) >= 0) {
        //         config = brand
        //     } else {
        //         config = shop
        //     }
        // } else if (brand.versionNo) {
        //     config = brand
        // } else if (shop.versionNo) {
        //     config = shop
        // } else {
        //     return log('热更新', '未给到更新版本号')
        // }
        //
        // log('热更新', JSON.stringify(config))
        //
        // // 字段控制
        // let addr = config.downloadAddress
        // if (!addr) {
        //     return log('热更新', '未给到更新包地址')
        // }
        //
        // let updateornot = compare(config.versionNo, packageInfo.version)
        // if (updateornot<=0) {
        //     return log('热更新', '已是最新版本')
        // }
        //
        // let update = global.window.confirm('有新版本, 是否更新版本?')
        // if (!update) {
        //     return log('热更新', '用户选择不更新版本')
        // }
        //
        // upgrade(config).then(() => {
        //     const child = child_process.fork('./hotload/update.js', [], {
        //         detached: true
        //     })
        //     child.unref()
        //     appQuit()
        // }).catch(e => {
        //     log('热更新', '更新失败' + e.toString())
        // })
    })
}


const getVersion = function (versionArr) {
    let bnb = null;
    for (var i=0;i<versionArr.length;i++){
        if (!bnb){
            if (compare (versionArr[i].versionNo,versionArr[i+1 == versionArr.length ? i :i+1].versionNo)>0){
                bnb = versionArr[i];
            }else {
                bnb =versionArr[i+1 == versionArr.length ? i :i+1];
            }
        }else {
            if (compare (bnb.versionNo,versionArr[i+1 == versionArr.length ? i :i+1].versionNo)<0){
                bnb = versionArr[i+1 == versionArr.length ? i :i+1];
            }
        }
    }
    return  bnb
};


const appQuit = function () {

    var gui = nw.require('nw.gui');
    var win = gui.Window.get(thewin);
    // gui.App.argv.
    win.hide();
    gui.App.quit();

    // var child,
    //     child_process = require("child_process"),
    //     gui = require('nw.gui'),
    //     win = gui.Window.get(thewin);
    // if (process.platform == "darwin")  {
    //     child = child_process.spawn("open", ["-n", "-a", process.execPath.match(/^([^\0]+?\.app)\//)[1]], {detached:true});
    // } else {
    //     child = child_process.spawn(process.execPath, [], {detached: true});
    // }
    // child.unref();
    // win.hide();
    // gui.App.quit();
};

/**
 * 更新版本
 */
function upgrade(config) {
    return downLoad(config.downloadAddress)
        .then((downpath) => {
            return unzipPack(downpath, tmpdir)
        })
}

/**
 * 全量更新
 */
function cover(origin, dest) {
    return fsa.emptyDir(dest)
        .then(() => {
            return fsa.copy(origin, dest)
        })
        .then(() => {
            log('热更新', '更新完成')
        })
}

/**
 * 增量更新
 */
function update() {
    return fsa.copy(unzippath, appDir).then(() => {
        log('热更新', '替换完成')
    })
}

/**
 * 清理
 */
function clean() {
    return fsa.remove(tmpdir).then(() => {
        log('热更新', '清理完成')
    })
}

/**
 * 下载
 */
function downLoad(downpath) {
    return new Promise((resolve, reject) => {
        fsa.ensureFileSync(zippath);
        request(downpath)
            .on('end', () => {
                log('热更新', '下载完成');
                resolve(zippath)
            })
            .on('error', err => {
                log('热更新', err);
                reject(err)
            })
            .pipe(fsa.createWriteStream(zippath))
    })
}

/**
 * 解压
 */
function unzipPack(zippath, unzippath) {
    return new Promise((resolve, reject) => {
        // const stat = fsa.statSync(zippath)
        // let count = 0
        fsa.createReadStream(zippath)
            .on('close', () => {
                log('热更新', '解压完成')
                resolve()
            })
            .on('err', (err) => {
                reject(err)
            })
            .pipe(unzip.Extract({
                path: unzippath
            }))
    })
}

/**
 * 备份
 */
function backup() {
    return new Promise((resolve, reject) => {
        try {
            fsa.copySync(path.join(appDir, 'app/dao/'), path.join(unzippath, 'app/dao/'))
            fsa.copySync(path.join(appDir, 'logs/'), path.join(unzippath, 'logs/'))
            log('热更新', '备份完成')
            resolve()
        } catch (error) {
            reject(error)
        }
    })
}
