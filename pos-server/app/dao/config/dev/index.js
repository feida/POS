/**
 * @author wxh on 2017/12/25
 * @copyright
 * @desc
 */

module.exports = {
    sqlite: {
        pos: {
            host: 'sqlite/pos-box.db',
            port: 1433,
            user: '',
            password: '',
            database: 'pos-box.db'
        }
    },

    admin_server_db: {
        "host": "pos-admin.restoplus.cn",
        "port": 80,
        "path":"/newpos/order/info/"
    },
    java_server_db: {

        /**
         * 线上
         */
        // "host":"pos.eco.restoplus.cn",
        // "port":"80",
        // "serverIp":"139.196.252.181:8680",

        /**
         * 生态
         */
        "host": "pos.ecosystem.restoplus.cn",
        "port": 80,
        "serverIp": "socket.ecosystem.restoplus.cn:80",

        /**
         * 预生产
         */
        // "host":"pos.preproduction.restoplus.cn",
        // "port":"80",
        // "serverIp":"socket.preproduction.restoplus.cn:80",

        /**
         * 空间
         */
        // "host":"pos.space.restoplus.cn",
        // "port":"80",
        // "serverIp":"socket.space.restoplus.cn:80",
        "path": "/pos/LocalPosSyncData/",
        "method": "POST",
        "headers": {
            "Content-Type": "application/x-www-form-urlencoded"
        },
        //  餐加生态-先付后付
        // "brandId": "2f83afee7a0e4822a6729145dd53af33",
        // "shopId": "8565844c69b94b0dbde38b0861df62c8",

        //  餐加生态（混合）
        "brandId": "2f83afee7a0e4822a6729145dd53af33",
        "shopId": "b6e1477b7aa245c7baebdec81ad3eda6",

        //  餐加生态(电视叫号)
        // "brandId": "2f83afee7a0e4822a6729145dd53af33",
        // "shopId": "097091c36ee94f0fb6b4828bb2f6d16b",

        // "brandId": "2f83afee7a0e4822a6729145dd53af33",
        // "shopId": "bcca2e640d5547ce98235105536e9fd2",

        //  餐加生态M（电视叫号）
        // "brandId": "2f83afee7a0e4822a6729145dd53af33",
        // "shopId": "38cc560b421d4bde8b5a5ebf1055737a",

        // test update
        // "brandId": "2f83afee7a0e4822a6729145dd53af33",
        // "shopId": "3a3fd682d4df4450971b0015ce9de9fc",

        //  餐加生态M（辉总测试店铺）
        // "brandId": "2f83afee7a0e4822a6729145dd53af33",
        // "shopId": "d2ff1bbb8c6f4fd8adb3949f76f8c1b6",

        //  有乐拉面 （原罗亮别动）
        // "brandId":"2f83afee7a0e4822a6729145dd53af33",
        // "shopId":"460fade710cd4234b1f32de55ad0b320"

        // 洪森先付
        // "brandId": "2f83afee7a0e4822a6729145dd53af33",
        // "shopId": "0a5c40ccb8d14b949c5d5893686ab7c9"
        //

        // 洪森先付 TV
        // "brandId": "2f83afee7a0e4822a6729145dd53af33",
        // "shopId": "da79f7ccd28d4225bee383a7f0940f82"

        //今天不打烊
        // "brandId": "2f83afee7a0e4822a6729145dd53af33",
        // "shopId": "63325014c50b4b16a81e50b3623f8d96"

        //重庆火锅-测试
        // "brandId": "2f83afee7a0e4822a6729145dd53af33",
        // "shopId": "097091c36ee94f0fb6b4828bb2f6d16b"


        //===============================================
        // 空间

        //----空间店铺
        // "brandId":"31946c940e194311b117e3fff5327215",
        // "shopId":"f48a0a35e0be4dd8aaeb7cf727603958"

        //  测试店铺 电视叫号
        // "brandId":"31946c940e194311b117e3fff5327215",
        // "shopId":"31164cebcc4b422685e8d9a32db12ab8"

        // ---
        // "brandId": "8f2ca7eefda142048fafc23bcbdb40d9",
        // "shopId": "ff207225d9834ce6b749dac39574a0e4",

        //===============================================
        // 预生产

        // "brandId": "9a9ee33204344d7d89537c090181a332",
        // "shopId": "ea8a2e72b65b4a8abd32868b4c9e1b68",

        //===============================================
        // 线上
        // "brandId":"8f2ca7eefda142048fafc23bcbdb40d9",
        // "shopId":"61ee6836b2354c54a3ce2bb28de31d51"
    },
    /**
     * emq 消息服务配置
     */
    mqtt: {
        newpos: {
            url: 'mqtt://test.emq.restoplus.cn:1883',
        }
    }
};
