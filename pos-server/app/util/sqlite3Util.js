/**
 * Created by Lmx on 2017/5/15.
 */
var sqlite3 = require('sqlite3').verbose();
var path = require("path");
const fs = require("fs");

const fileUtil = require("../../app/util/fileUtil");

var minimist = require('minimist');
var args = minimist(process.argv.slice(2));

let npm_lifecycle_event = process.env.npm_lifecycle_event;
let env = args.env;

let NODE_ENV = !npm_lifecycle_event ? env : (npm_lifecycle_event.indexOf('dev') < 0 || npm_lifecycle_event.indexOf('box') < 0) ? 'box' : env;


NODE_ENV = NODE_ENV ? NODE_ENV.toLowerCase() : 'pro';

if (NODE_ENV != 'pro' && NODE_ENV != 'box') {
    throw new Error('NODE_ENV must be "box" or "pro"');
}
var dbName = `app/dao/sqlite/pos/pos-${NODE_ENV}.db`;

console.log("dbName==", dbName);


var db = null;


module.exports.getDB = function () {
    if (db == null) {
        db = new sqlite3.Database(path.resolve() + '\/' + dbName);
        fileUtil.appendFile(`sqlitePath`, `${JSON.stringify(db)}`);
    }
    return db;
};

module.exports.close = function () {
    if (db != null) {
        db.close();
    }
};

module.exports.formatParam = function (model, checkNull) {
    checkNull = checkNull || false;
    var _model = {};
    for (var m in model) {
        if (!checkNull && (model[m] === null || model[m] === "")) {
            continue;
        }
        _model['$' + m] = model[m];
    }
    return _model;
}

module.exports.generateInsertSelectiveSql = function (tableName, tableId, param) {
    var sql = "insert into " + tableName + "(" + tableId + " ,";
    for (var attr in param) {
        if (param[attr] === null || param[attr] === "") {
            continue;
        }
        sql += attr + ", ";
    }
    sql = sql.substring(0, sql.length - 2);
    sql += ") values($" + tableId + ", ";
    for (var attr in param) {
        if (param[attr] === null || param[attr] === "") {
            continue;
        }
        sql += "$" + attr + ", ";
    }
    sql = sql.substring(0, sql.length - 2);
    sql += ")";
    return sql;
}

module.exports.generateInsertSelectiveSqlById = function (tableName, param) {
    var sql = "insert into " + tableName + "(";
    for (var attr in param) {
        if (param[attr] === null || param[attr] === "") {
            continue;
        }
        sql += attr + ", ";
    }
    sql = sql.substring(0, sql.length - 2);
    sql += ") values(";
    for (var attr in param) {
        if (param[attr] === null || param[attr] === "") {
            continue;
        }
        sql += "$" + attr + ", ";
    }
    sql = sql.substring(0, sql.length - 2);
    sql += ")";
    return sql;
}

module.exports.generateUpdateSelectiveSql = function (tableName, tableId, param) {
    var sql = "update " + tableName + " set ";
    for (var attr in param) {
        if (attr == tableId) {
            continue;
        }
        if (param[attr] === null || param[attr] === "") {
            continue;
        }
        sql += attr + " = $" + attr + ", ";
    }
    sql = sql.substring(0, sql.length - 2);
    sql += " where " + tableId + " = $" + tableId;
    return sql;
}