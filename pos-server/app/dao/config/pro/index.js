/**
 * @author wxh on 2017/12/25
 * @copyright
 * @desc
 */

module.exports = {
    sqlite: {
        pos: {
            host: 'sqlite/pos-pro.db',
            port: 1433,
            user: '',
            password: '',
            database: 'pos-pro.db'
        }
    },
    java_server_db: {
        "host": "pos.kc.restoplus.cn",
        "port": 80,
        "serverIp":"139.196.222.42:8680",
        "path": "/pos/LocalPosSyncData/",
        "method": "POST",
        "headers": {
            "Content-Type": "application/x-www-form-urlencoded"
        },
        "brandId" : "",
        "shopId" : ""
    },

    admin_server_db: {
        "host": "pos-admin.restoplus.cn",
        "port": 80,
        "path":"/newpos/order/info/"
    },
    mqtt: {
        newpos: {
            url: 'mqtt://emq.restoplus.cn:1883',
        }
    }
};