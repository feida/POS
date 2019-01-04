#resto-pos  2.0  离线版

>   项目原型：https://run.mockplus.cn/g8LMEUN7DTCq0HQo/index.html

## 开发环境

- NwJs        ：v0.14.7  ____    Download URL：https://dl.nwjs.io/v0.14.7/nwjs-sdk-v0.14.7-win-ia32.zip
- node        ：v5.0.0 -- v5.12.0  ____    以 NwJs 的内置 NodeJs  版本为界
- JavaScript  ：ES5

## 注意事项

- 项目中所有通过 npm 管理的 模块 不必提交，个人开发的私有模块除外
- 初始化 npm 模块后，如果生成  package-lock.json 文件，可以不必提交
- /pos-server/logs/  目录下所有日志不必提交
- 开发编辑器中自带的配置文件   不可提交    （如 /.idea  /vscode 等目录下的所有文件）


## 项目文档
- [表结构](https://doc.oschina.net/resto-pos-table)
- [打包教程](https://doc.oschina.net/nwjs-pack)


## 启动说明

1. pos-server 目录下  pomelo start
2. web-server 目录下  npm run dev

## NWJS 环境下启动说明
```
1. resto-pos/pos-server/node_modules/pomelo/lib/util/appUtil.js  文件
    224行修改：
        // var mainPos = 1;
        // [lmx]
        var mainPos = args.length <= 1 ? 0:1;
    eg: ![][http://git.oschina.net/resto/resto-pos/blob/master/shared/appUtil.png]

2.  resto-pos/pos-server/node_modules/pomelo/lib/master/starter.js  文件
    10行后插入
        var path = require("path");
    eg: ![][git.oschina.net/resto/resto-pos/blob/master/shared/starter_1.png]
    190行后插入：
        options[0] = path.join(pomelo.app.getBase(), "posServer.js");
    eg: ![][git.oschina.net/resto/resto-pos/blob/master/shared/starter_2.png]
```

## 项目启动流程
1、自动更改订单状态（已确认，是否已过加菜时间）
2、同步订单
3、同步库存
branch develop 177
- 解决优惠券问题