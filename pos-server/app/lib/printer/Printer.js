/**
 * Created by kpeng on 2017-04-25.
 */
var EthernPort = require('./EthernPort').EthernPort;
var ESCPOS_CommandGenerator = require('./ESCPOS_CommandGenerator').ESCPOS_CommandGenerator;

Printer = function (ip, portCode, portParameter) {
    this.IP = ip;
    this.Port = null;
    switch (portCode) {
        case 'ETH':
            this.Port = new EthernPort(ip);
            if (portParameter!=null) {
                this.Port.Port = portParameter;
            }
            break;
        default:
    }

    this.CommandGenerator = ESCPOS_CommandGenerator.getInstance();
}

Printer.prototype.print = function (reportModeFile, jsData, finishedCallback) {

    if (this.Port != null) {
        var bufferCommand = this.CommandGenerator.generate(reportModeFile, jsData);
        this.Port.send(bufferCommand, finishedCallback);
    }
    else {
        return;
    }
}

Printer.prototype.openCashbox = function (finishedCallback) {
    if (this.Port != null) {
        var bufferCommand ='\x1B\x70\x00\xFF\xFF';
        this.Port.send(bufferCommand, finishedCallback);
    }
    else {
        return;
    }
}

exports.Printer = Printer;