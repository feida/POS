/**
 * Created by kpeng on 2018-01-14.
 */
var EthernPort = require('./EthernPort').EthernPort;
var LabelPrinter_CommandGenerator = require('./LabelPrinter_CommandGenerator').LabelPrinter_CommandGenerator;

LabelPrinter = function (ip, portCode, portParameter) {
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

    this.CommandGenerator = LabelPrinter_CommandGenerator.getInstance();
}

LabelPrinter.prototype.print = function (reportModeFile, jsData, finishedCallback) {
    if (this.Port != null) {

        var bufferCommand = this.CommandGenerator.generate(reportModeFile, jsData);
        this.Port.send(bufferCommand, finishedCallback);
    }
    else {
        return;
    }
}

exports.LabelPrinter = LabelPrinter;
