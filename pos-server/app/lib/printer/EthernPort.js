/**
 * Created by kpeng on 2017-04-25.
 */
var net = require('net');

EthernPort = function (ip) {
    this.Port = 9100;
    this.IP = ip;
}

EthernPort.prototype.send = function (data, next) {
    var cbMsg = 'Print commands sent to the printer [' + this.IP + ':' + this.Port +'].';
    var socket = new net.connect(this.Port, this.IP, function () {
        socket.write(data, function () {
            socket.destroy();
            if (next != null) {
                next({code:200, msg:cbMsg});
            }
        });
    });
    var waitTime = 10;
    //设置超时时间
    socket.setTimeout(1000 * waitTime);
    //监听到超时事件，断开连接
    socket.on('timeout', function(err) {
        socket.destroy();
        if (next != null) {
            next({code:500, msg:'[Printer socket error] '+ `响应超时`});
        }
    });
    socket.on('error', function(err){
        console.log('Socket error: ', err);
        socket.destroy();
        if (next != null) {
            next({code:500, msg:'[Printer socket error] '+ err});
        }
    });
}

exports.EthernPort = EthernPort;
