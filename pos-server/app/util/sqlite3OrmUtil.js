module.exports.formatParam = function (model, checkNull) {
    checkNull = checkNull || false;
    var _model = {};
    for (var m in model) {
        if (!checkNull && (model[m] === null || model[m] === "")) {
            continue;
        }
        _model[m] = model[m];
    }
    return _model;
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
        sql += ":" + attr + ", ";
    }
    sql = sql.substring(0, sql.length - 2);
    sql += ")";
    return sql;
};

module.exports.generateUpdateSelectiveSql = function (tableName, tableId, param) {
    var sql = "update " + tableName + " set ";
    for (var attr in param) {
        if (attr == tableId) {
            continue;
        }
        if (param[attr] === null || param[attr] === "") {
            continue;
        }
        sql += attr + " = :" + attr + ", ";
    }
    sql = sql.substring(0, sql.length - 2);
    sql += " where " + tableId + " = :" + tableId;
    return sql;
}

module.exports.generateUpdateSelectiveConditionSql = function (tableName, condition, param) {
    var sql = "update " + tableName + " set ";
    for (var attr in param) {
        if (param[attr] === null || param[attr] === "") {
            continue;
        }
        sql += attr + " = :" + attr + ", ";
    }
    sql = sql.substring(0, sql.length - 2);
    sql += " where ";
    for (var attr in condition) {
        if (param[attr] === null || param[attr] === "") {
            continue;
        }
        sql += attr + " = :" + attr + " and ";
    }
    sql = sql.substring(0, sql.length - 5);
    return sql;
}

