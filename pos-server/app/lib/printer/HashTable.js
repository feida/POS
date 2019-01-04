/**
 * Created by kpeng on 2017-04-24.
 */
function HashTable() {
    this.size = 0;
    this.entry = new Object();
}

HashTable.prototype = {
    add : function (key, value) {
        if (!this.containsKey(key)) {
            this.size++;
        }
        this.entry[key] = value;
    },
    getValue : function (key) {
        return this.containsKey(key) ? this.entry[key] : null;
    },
    remove : function (key) {
        if (this.containsKey(key) && (delete this.entry[key])) {
            this.size--;
        }
    },
    containsKey : function (key) {
        return (key in this.entry);
    },
    containsValue : function (value) {
        for (var prop in this.entry) {
            if (this.entry[prop] == value) {
                return true;
            }
        }
        return false;
    },
    getValues : function () {
        var values = new Array();
        for (var prop in this.entry) {
            values.push(this.entry[prop]);
        }
        return values;
    },
    getKeys : function () {
        var keys = new Array();
        for (var prop in this.entry) {
            keys.push(prop);
        }
        return keys;
    },
    getSize : function () {
        return this.size;
    },
    clear : function () {
        this.size = 0;
        this.entry = new Object();
    }
}

exports.HashTable = HashTable;
