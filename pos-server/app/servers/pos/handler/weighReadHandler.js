const result = require("../../../util/resultUtil");
const request = require('request');
const moment = require('moment');
const exec = require('child_process').exec;
const path = require('path');
// const SerialPort = require("serialport");

module.exports = function (app) {
    return new Handler(app);
}

var Handler = function (app) {
    this.app = app;
}

var handler = Handler.prototype;


handler.getWeight = function (msg, session, next) {
    let command = `java -jar ${path.resolve()}\\app\\jar\\sensor.jar COM1`;
    exec(command, function (error, stdout, stderr) {
        if (error)  return result.error(next, '称重失败', msg);
        stdout = JSON.parse(stdout);
        if (stdout.status != 0 || !stdout.msg) {
            return result.success(next, {error: true})
            //return result.error(next, '称重失败', msg);
        }
        result.success(next, {
            stdout:stdout,
            weightStatus :stdout.msg.split(",")[0] ,
            unit:stdout.msg.split(",")[3],
            weight:stdout.msg.split(",")[2] ,
            status:stdout.status,
        });
    });
};

handler.getWeightNode = function (msg, session, next) {
    // let port =  msg.port || "COM1";
    // let num = 0 ,item ="";
    // var serialPort = new SerialPort(`${port}`, {
    //         baudRate: 9600,  //波特率
    //         dataBits: 8,    //数据位
    //         parity: 'none',   //奇偶校验
    //         stopBits: 1,   //停止位
    //         flowControl: false
    //     },(error)=> {
    //         if (error) return result.error(next, error.toString(), msg)
    //     });
    // setTimeout(()=>{
    //     serialPort.close();
    //     return result.error(next, `${port}串口不对`, msg)
    // },500);
    // serialPort.on( "data", (data)=> {
    //     item +=data;
    //     num++;
    //     if(num == 2 ){
    //         let result = item.toString("utf8");
    //         var weight = result.substring(4,10);
    //         var status = result.substring(2,3);
    //         var unit = result.substring(10,12).replace(/(^\s*)/g, "");
    //         console.log(`result=${result},status=${status},weight=${weight},danwei=${kg}`)
    //         item = "";
    //         num = 0;
    //         serialPort.close();
    //         result.success(next, {
    //             weightStatus :status,
    //             unit:unit,
    //             weight:weight ,
    //         });
    //     }
    // });
};