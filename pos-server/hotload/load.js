const path = require('path')
const fs = require('fs-extra')
const request = require('request')
const unzip = require('unzip')

const { log } = require('../app/util/fileUtil')
const appDir = process.cwd()
const packName = 'RestoPlus'
const tmpdir = path.join(appDir, '../tmp')
const unzippath = path.join(tmpdir, packName)
const zippath = unzippath + '.zip'

exports.upgrade = upgrade

/**
 * 更新版本
 */
function upgrade(config) {
    return downLoad(config.downloadAddress)
        .then((downpath) => {
            return unzipPack(downpath, tmpdir)
        })
        .then(() => {
            return backup()
        })
        // .then(() => {
        //     return update()
        // })
        // .then(() => {
        //     return clean()
        // })
}

/**
 * 全量更新
 */
function cover(origin, dest) {
    return fs.emptyDir(dest)
        .then(() => {
            return fs.copy(origin, dest)
        })
        .then(() => {
            log('热更新','更新完成')
        })
}

/**
 * 增量更新
 */
function update() {
    return fs.copy(unzippath, appDir).then(() => {
        log('热更新','替换完成')
    })
}

/**
 * 清理
 */
function clean() {
    return fs.remove(tmpdir).then(() => {
        log('热更新','清理完成')
    })
}

/**
 * 下载
 */
function downLoad(downpath) {
    return new Promise((resolve, reject) => {
        fs.ensureFileSync(zippath)
        request(downpath)
            .on('end', () => {
                log('热更新','下载完成')
                resolve(zippath)
            })
            .on('error', err => {
                log('热更新',err)
                reject(err)
            })
            .pipe(fs.createWriteStream(zippath))
    })
}

/**
 * 解压
 */
function unzipPack(zippath, unzippath) {
    return new Promise((resolve, reject) => {
        // const stat = fs.statSync(zippath)
        // let count = 0
        fs.createReadStream(zippath)
            .on('close', () => {
                log('热更新','解压完成')
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
            fs.copySync(path.join(appDir, 'app/dao/'), path.join(unzippath, 'app/dao/'))
            fs.copySync(path.join(appDir, 'logs/'), path.join(unzippath, 'logs/'))
            log('热更新','备份完成')
            resolve()
        } catch (error) {
            reject(error)
        }
    })
}
