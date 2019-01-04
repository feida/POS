/**
 * Created with mhkz.
 * User: 943085517@qq.com
 * Date: 2018/9/7
 * Time: 16:57
 */

const sqlite3 = require('sqlite3');
const async = require('async');
db = new sqlite3.Database(`${path.resolve()}/app/dao/sqlite/pos/pos-pro.db`);

const updateInsert =  (sqlList, cb) => {
    if (sqlList && sqlList.length <= 0) return cb();
    async.eachLimit(sqlList, 1, function (sql, in_cb) {
        db.run(sql, [], (error, result) =>{
            in_cb(error || null);
        });
    },function (err) {
        db.close();
        cb(err || null);
    })
}


