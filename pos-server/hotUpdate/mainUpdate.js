/**
 * Created with mhkz.
 * User: 943085517@qq.com
 * Date: 2018/9/7
 * Time: 10:35
 *
 */
const exec = require('child_process').exec;
const path = require('path');
var rootPath = path.resolve();
const unzip = require('unzip')
var fs = require('fs');

const pkg = require(rootPath + '/package');
document.write("<script type='text/javascript' src='initdb.js'></script>");
const updater = require('node-webkit-updater');
const upd = new updater(pkg);
var percentProgress = 0;
var backCount = 0;

const init = function () {

    async.waterfall([
        function (cb) { // 获取版本信息
            checkVersion( versionInfo =>{
                cb(null, versionInfo)
            })
        },
        function (versionInfo, cb) { // 历史版本对照
            if (!versionInfo) return cb(versionInfo);
            compareVersion(versionInfo, pkg, function (sql, verMsg) {
                versionInfo.sqlList = sql;
                versionInfo.verMsg = verMsg;
                cb(null, versionInfo)
            })
        },
        function (versionInfo, cb) {
            var verMsg = versionInfo.verMsg;
            insetHtml('version-list', verMsg, versionInfo);
            cb(null, versionInfo)
        },
        function (versionInfo, cb) { // 1 确定更新
            setTimeout(()=>{
                appRestart()
            }, 3 * 60 * 1000)
            var confirmUpdateBtn = document.querySelector('#confirm-update');
            confirmUpdateBtn.addEventListener('click', function () { // 25% progress is needed
                progress();
                percentProgress = (percentProgress + 0.01).toFixed(2);
                setProgress(percentProgress, "准备备份原始文件，请稍后...")
                sleep(1000)
                percentProgress = (Number(percentProgress) + 0.01).toFixed(2);
                setProgress(percentProgress, "正在备份原始文件，请稍后...")
                sleep(1000)
                backFile(function (fileFolder) {
                    versionInfo.fileFolder = fileFolder;
                    cb(null, versionInfo)
                })
            })
        },
        function (versionInfo, cb) { //2 下载 40%
            percentProgress = (30 + Math.random() + Math.random() * 10).toFixed(2)
            setProgress(percentProgress, "准备下载更新文件，请稍后...")
            sleep(Math.ceil(Math.random() * 3 * 1000))
            percentProgress = (Number(percentProgress) + Math.random() + Math.random() * 10).toFixed(2)
            if (percentProgress > 40)  percentProgress = 40
            setProgress(percentProgress, "正在下载更新文件，请稍后...")
            cb(null, versionInfo)
        },
        function (versionInfo,cb) { //3 下载文件 50%
            upd.download(function (error, filename) {
                percentProgress = (40 + Math.random() + Math.random() * 10).toFixed(2)
                setProgress(percentProgress, "文件下载完成，准备复制文件...")
                sleep(Math.ceil(Math.random() * 3 * 1000))
                percentProgress = (Number(percentProgress) + Math.random() + Math.random() * 10).toFixed(2)
                percentProgress > 50 ? 50 : percentProgress
                setProgress(percentProgress, "正在复制文件，请稍后...")
                versionInfo.filenamePath = filename;
                cb(null, versionInfo)
            }, versionInfo.manifest)
        },
        function (versionInfo, cb) { //4 复制文件 60%
            percentProgress = (60 + Math.random() + Math.random() * 10).toFixed(2)
            setProgress(percentProgress, "文件复制完成，准备解压文件...")
            sleep(500)
            percentProgress = (Number(percentProgress) + Math.random() + Math.random() * 10).toFixed(2)
            percentProgress > 60 ? 60 : percentProgress
            setProgress(percentProgress, "正在解压文件，请稍后...")
            var filename = versionInfo.filenamePath;
            var command = `copy ${filename} ${path.resolve()}`;
            copyFile(command, function (error) {
                cb(null, versionInfo)
            })
        },
        function (versionInfo, cb) { //5 解压文件 70%
            unUpdateZip(versionInfo, function () {
                percentProgress = (60 + Math.random() + Math.random() * 10).toFixed(2)
                setProgress(percentProgress, "解压文价完成，准备删除临时文件...")
                sleep(Math.ceil(Math.random() * 3 * 1000))
                percentProgress = (Number(percentProgress) + Math.random() + Math.random() * 10).toFixed(2)
                percentProgress > 70 ? 70 : percentProgress
                setProgress(percentProgress, "正在删除临时文件，请稍后...")
                cb(null, versionInfo)
            })
        },
        function (versionInfo, cb) { //6 删除文件 80%
            var filePath = versionInfo.filenamePath.split("\\");
            var filename = filePath[filePath.length-1]
            var command = `del ${path.resolve()}\\${filename}`
            deleteUpdapp(command, function (error) {
                percentProgress = (70 + Math.random() + Math.random() * 10).toFixed(2)
                setProgress(percentProgress, "临时文件删除成功，准备更新数据库...")
                sleep(Math.ceil(Math.random() * 3 * 1000))
                percentProgress = (Number(percentProgress)  + Math.random() * 10).toFixed(2)
                percentProgress > 80 ? 80 : percentProgress;
                setProgress(percentProgress, "正在更新数据库，请稍后...")
                cb(null, versionInfo)
            })
        },
        function (versionInfo, cb) { //7 更新数据库 90%
            var sqlList = versionInfo.sqlList;
            updateInsert(sqlList, function (error) {
                // if (error) return cb("数据库更新失败，准备恢复历史数据，请稍后", versionInfo)

                var setTime = setInterval(function () {
                    percentProgress = (Number(percentProgress) + Math.random() + Math.random() * 10).toFixed(2)
                    if (percentProgress < 90) {
                        setProgress(percentProgress, "数据库更新中")
                    } else {
                        clearInterval(setTime)
                        percentProgress = 90;
                        setProgress(percentProgress, "数据库更新成功, 准备删除备份文件")
                        return cb(error || null, versionInfo)
                    }
                    sleep(Math.ceil(Math.random() * 1 * 1000))
                },10)
            })
        }
    ], function (error, versionInfo) { //8 重启应用 100
        if (error) { //  restore backed up file
            setProgress(null, error)
            recoverBackFileFolder(versionInfo.fileFolder, function () {
                deleteBackFile(versionInfo.fileFolder, function () {
                    setProgress(100, '恢复完成，准备重启 NewPos');
                    console.log("恢复 newPos")
                    appRestart()
                })
            })
        } else {
            deleteBackFile(versionInfo.fileFolder, function () {
                setProgress(100, '准备重启 NewPos');
                console.log("重启pos")
                appRestart()
            })
        }
    })
}

/**
 * @desc Check for updated version
 * @param cb
 */
var checkVersion = function (cb) {
    upd.checkNewVersion(function(error, newVersionExists, manifest) {
        if (error) return cb(error);
        return cb({newVersionExists, manifest})
    });
}


/**
 * @desc  Insert html string to update.html
 * @param className
 * @param versionInfo
 */
var insetHtml = function (className, verMsg, versionInfo) {
    var version = versionInfo.manifest.version;
    var verMsg = verMsg || [];
    if (verMsg && verMsg.length <= 0) return;
    var el = document.querySelector(`.${className}`)
    var elstring = `<h5>当前版本: ${pkg.version}</h5>`
    elstring += `<h5>待更新版本: ${version}</h5>
    <div class="auto">`

    for (var i =0; i < verMsg.length; i++) {
        elstring += `<span>${verMsg[i]}</span>`
    }

    elstring += `</div>`
    el.innerHTML = elstring
}

var copyFile = function (command, cb) {
    exec(command, function (error, stdout, stderr) {
        if (error) cb(error);
        cb();
    });
}

/**
 * @desc  unzip
 * @param cb
 */
var unUpdateZip = function (versionInfo, cb) {
    var filePath = versionInfo.filenamePath.split("\\");
    var filename = filePath[filePath.length-1]
    fs.createReadStream(`${path.resolve()}\\${filename}`)
        .pipe(unzip.Extract({ path: `${path.resolve()}`}))
        .on('finish', function (error) {
            cb();
        })
}

/**
 * @param delete source file
 * @param command
 * @param cb
 */
var deleteUpdapp = function (command, cb) {
    exec(command, function (error, stdout, stderr) {
        if (error) cb(error);
        cb();
    });
}


/**
 * @desc If the update is completed an there is no error, restart application
 */
var appRestart = function () {
    var child,
        child_process = require("child_process"),
        gui = require('nw.gui'),
        win = gui.Window.get();
    if (process.platform == "darwin") {
        child = child_process.spawn("open", ["-n", "-a", process.execPath.match(/^([^\0]+?\.app)\//)[1]], {detached: true});
    } else {
        child = child_process.spawn(process.execPath, [], {detached: true});
    }
    child.unref();
    win.hide();
    gui.App.quit();
};

/**
 * @desc compare version
 */
var compareVersion = function (remoteVersion, localVersion, cb) {
    var remoteVersionInfo = remoteVersion.manifest.localVersion.versionInfo;
    // var localVersionInfo = localVersion.historyVersionInfo.versionInfo;
    var localVersionInfo = localVersion.localVersion.versionInfo;
    var sql = [];
    var verMsg = [];
    var mergeInfo = remoteVersionInfo.filter(item => {
        let la = localVersionInfo.map(v => v.id);
        return !la.includes(item.id);
    })
    for (let  i= 0; i < mergeInfo.length; i++) {
        var item = mergeInfo[i];
        if (item.addField.isAddField) {
            for (let j = 0; j< item.addField.field.length; j++) {
                sql.push(item.addField.field[j])
            }
        }
        for (let k = 0; k < item.versionDescription.length; k++) {
            verMsg.push(item.versionDescription[k])
        }
    }
    cb(sql, verMsg);
}

var backFile = function (cb ) {
    var data= new Date();
    var fileFolder = `${data.getFullYear()}${data.getMonth()+1}${data.getDate()}${data.getHours()}${data.getMinutes()}${data.getSeconds()}`
    var command = `md ${rootPath}\\..\\${fileFolder} && xcopy ${rootPath}\\app\\*.* ${rootPath}\\..\\${fileFolder} /s /h /c /e /y`
    var exe = exec(command, {
        encoding: 'utf8',
        timeout: 0, /*子进程最长执行时间 */
        maxBuffer: 5000 * 1024,  /*stdout和stderr的最大长度*/
        killSignal: 'SIGTERM',
        cwd: null,
        env: null
    },function (error, stdout, stderr) {
        if (error) cb(error);
        cb(fileFolder, stdout);
    });
    exe.stdout.on("data", function (data) {
        backCount ++
        // 11336 file count
        if (percentProgress < 2 && backCount < 1000) {
            percentProgress = (Number(percentProgress) + 0.01).toFixed(2)
        } else if (backCount >= 1000 && backCount < 2000) {
            percentProgress = percentProgress
        } else if (backCount >= 2000 && backCount < 5000 && percentProgress < 7) {
            percentProgress = (Number(percentProgress) + 0.01).toFixed(2)
        } else if (backCount >= 5000 && backCount < 6000) {
            percentProgress = percentProgress
        } else if (backCount >= 6000 && backCount < 9000 && percentProgress < 11) {
            percentProgress = (Number(percentProgress) + 0.01).toFixed(2)
        } else if (backCount >= 9000 && backCount < 10000) {
            percentProgress = percentProgress
        } else if (backCount >= 10000 && backCount < 11000 && percentProgress < 20) {
            percentProgress = (Number(percentProgress) + 0.01).toFixed(2)
        } else if (percentProgress <= 25 ) {
            percentProgress = (Number(percentProgress) + 0.01).toFixed(2)
        } else {
            percentProgress = 25
        }
        setProgress(percentProgress, `正在备份原始文件${data}`)
    })
}

var recoverBackFileFolder = function (fileFolder, cb) {
    var command = `xcopy ${rootPath}\\..\\${fileFolder}\\*.* ${rootPath}  /s /h /c /e /y`
    var exe = exec(command, {
        encoding: 'utf8',
        timeout: 0, /*子进程最长执行时间 */
        maxBuffer: 5000 * 1024,  /*stdout和stderr的最大长度*/
        killSignal: 'SIGTERM',
        cwd: null,
        env: null
    },function (error, stdout, stderr) {
        if (error) cb(error);
        cb(fileFolder, stdout);
    });

    exe.stdout.on('data', function (data) {
        if (percentProgress < 91 && backCount < 1000) {
            percentProgress = (Number(percentProgress) + 0.01).toFixed(2)
        } else if (backCount >= 1000 && backCount < 2000) {
            percentProgress = percentProgress
        } else if (backCount >= 2000 && backCount < 5000 && percentProgress < 92) {
            percentProgress = (Number(percentProgress) + 0.01).toFixed(2)
        } else if (backCount >= 5000 && backCount < 6000) {
            percentProgress = percentProgress
        } else if (backCount >= 6000 && backCount < 9000 && percentProgress < 93) {
            percentProgress = (Number(percentProgress) + 0.01).toFixed(2)
        } else if (backCount >= 9000 && backCount < 10000) {
            percentProgress = percentProgress
        } else if (backCount >= 10000 && backCount < 11000 && percentProgress < 94) {
            percentProgress = (Number(percentProgress) + 0.01).toFixed(2)
        } else if (percentProgress <= 95 ) {
            percentProgress = (Number(percentProgress) + 0.01).toFixed(2)
        } else {
            percentProgress = 95
        }
        setProgress(percentProgress, `正在恢复备份文件${data}`)
    })

}

var deleteBackFile =  function (fileFolder, cb) {
    var command = `rd ${rootPath}\\..\\${fileFolder} /s /q`
    var exe = exec(command, {
        encoding: 'utf8',
        timeout: 0, /*子进程最长执行时间 */
        maxBuffer: 5000 * 1024,  /*stdout和stderr的最大长度*/
        killSignal: 'SIGTERM',
        cwd: null,
        env: null
    },function (error, stdout, stderr) {
        if (error) cb(error);
        cb(fileFolder, stdout);
    });

    exe.stdout.on('data', function (data) {
        if (percentProgress < 91 && backCount < 1000) {
            percentProgress = (Number(percentProgress) + 0.01).toFixed(2)
        } else if (backCount >= 1000 && backCount < 2000) {
            percentProgress = percentProgress
        } else if (backCount >= 2000 && backCount < 5000 && percentProgress < 92) {
            percentProgress = (Number(percentProgress) + 0.01).toFixed(2)
        } else if (backCount >= 5000 && backCount < 6000) {
            percentProgress = percentProgress
        } else if (backCount >= 6000 && backCount < 9000 && percentProgress < 93) {
            percentProgress = (Number(percentProgress) + 0.01).toFixed(2)
        } else if (backCount >= 9000 && backCount < 10000) {
            percentProgress = percentProgress
        } else if (backCount >= 10000 && backCount < 11000 && percentProgress < 94) {
            percentProgress = (Number(percentProgress) + 0.01).toFixed(2)
        } else if (percentProgress <= 95 ) {
            percentProgress = (Number(percentProgress) + 0.01).toFixed(2)
        } else {
            percentProgress = 95
        }
        setProgress(percentProgress, `正在恢复备份文件${data}`)
    })

}
