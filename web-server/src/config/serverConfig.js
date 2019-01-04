/**
 * 全局的配置环境
 * Created by Lmx on 2017/7/3.
 */

let SERVER_HOST = null; // 请求IP
let SERVER_PORT = null; // 请求端口
let serverRoot= null;//配置IP 陈泽
let readCardServer = null  //读卡支付 IP

if (process.env.NODE_ENV === 'development') {
    SERVER_HOST = '127.0.0.1';
    serverRoot="http://op.eco.restoplus.cn";
    //readCardServer="http://139.196.106.198:8080";
    readCardServer="http://192.168.1.144:8080";
  // serverRoot="http://120.55.160.210:8380";
    // SERVER_HOST = '192.168.1.101'; // 曾祖涛
  // SERVER_HOST = '192.168.1.109'; // 郭峰
  //   SERVER_HOST = '192.168.1.104'; // lmx
    SERVER_PORT = 3050;

} else if (process.env.NODE_ENV === 'production') {
    SERVER_HOST = '127.0.0.1';
    serverRoot="http://op.eco.restoplus.cn";
    readCardServer="http://192.168.1.144:8080";
  // SERVER_HOST = '192.168.1.101';
    // SERVER_HOST = '192.168.1.109';
    // SERVER_HOST = '192.168.1.104'; // lmx
    SERVER_PORT = 3050;

}

export {
    SERVER_HOST,
    SERVER_PORT,
    serverRoot,
    readCardServer
};
