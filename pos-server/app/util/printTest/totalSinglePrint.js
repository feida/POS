/**
 * @author wxh on 2017/11/28
 * @copyright
 * @desc
 */
const print = require('./print');
class TotalSinglePrintPrint extends Print {

    constructor(host, port) {
        super(host, port);
    }

    print(item) {
        let self = this;
        let device= self.device();
        let printer= self.printer(device);
        let obj = {};
        obj.table           = item.table;                   //店面
        obj.address         = item.address;                 //地址
        obj.describe        = item.describe;                //描述
        obj.seatDetails     = item.seatStatus;              //堂吃or 外带
        obj.seatNumber      = item.seatNumber;              //座位号
        obj.seatHolders     = item.seatHolders;             //座位人数
        obj.serialNumber    = item.serialNumber;            //编号
        obj.tradingCode     = item.tradingCode;             //交易流水号
        obj.orderTime       = item.orderTime;               //下单时间及打印次数
        obj.articleList     = item.articleList;             //菜品列表 arr
        obj.articleNum      = item.articleNum;             //菜品总量
        obj.articleTotal    = item.articleTotal;             //菜品总计

        device.open(function () {
            printer
                .align('ct')
                .print('\x1d\x21\x11')
                .text(`${obj.table}`)
                .size(1, 1)
                .feed(1)
                .text(`${obj.address}`)
                .feed(1)
                .text(`${obj.describe}`)
                .feed(1)
                .align('lt')
                .print('\x1d\x21\x11')
                .text(`${obj.seatDetails}`)
                .size(1, 1)
                .text(`${self.tradingCode(obj.tradingCode)}`)
                .text(`${self.segmentingLine()}`)
                .text(`${self.article()}`)
                .text(`${self.segmentingLine()}`)
                .text(`${self.articleList}`)
                .text(`${self.segmentingLine()}`)
                .feed(1)
                .text(`${self.segmentingLine()}`)
                .text(`${self.total(obj.articleNum,obj.articleTotal)}`)
                .text(`${self.segmentingLine()}`)
                .cut()
                .close()
        });
    }
}

exports.TotalSinglePrintPrint = global.TotalSinglePrintPrint = TotalSinglePrintPrint;