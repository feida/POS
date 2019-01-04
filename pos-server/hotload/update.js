const path = require('path')
const fs = require('fs-extra')
const child_process = require('child_process')

const { log } = require('../app/util/fileUtil')
const appDir = process.cwd()
const packName = 'RestoPlus'
const tmpdir = path.join(appDir, '../tmp')
const unzippath = path.join(tmpdir, packName)
const zippath = unzippath + '.zip'

setTimeout(() => {
    try {
        update()
    } catch (error) {
        log('热更新', '更新失败' + error.toString())
    }
}, 2000)

function update() {
    fs.copySync(path.join(appDir, 'app/dao/'), path.join(unzippath, 'app/dao/'))
    fs.copySync(path.join(appDir, 'logs/'), path.join(unzippath, 'logs/'))
    log('热更新', '备份完成')

    fs.copySync(unzippath, appDir)
    log('热更新', '替换完成完成')

    fs.removeSync(tmpdir)
    log('热更新', '清空临时目录')

    const child = child_process.spawn(process.execPath, [], { detached: true })
    child.unref()
}


