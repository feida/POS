/**
 * @author wxh on 2017/11/28
 * @copyright
 * @desc
 */
const escpos = require('escpos');
// const Mock = require('mockjs');
class Print {

    segmentingLine (){
        return `------------------------------------------------`
    }

    article(){
        return `${this.getByteComplement('餐品名称',32)}${this.getByteComplement('数量',6,1,2)}${this.getByteComplement('小计',10,1,2)}`
    }

    constructor(host, port) {
        this.host = host;
        this.port = port || '9100';

    }

    device(){
        return new escpos.Network(this.host, this.port);
    }
    printer(device){
        return new escpos.Printer(device);
    }

    getByteComplement(val,num,times,seat){
        var num = num || 45 ;
        var times = times || 1 ;
        var seat = seat || 1 ;
        var len = 0;
        for (var i = 0; i < val.length; i++) {
            var a = val.charAt(i);
            if (a.match(/[^\x00-\xff]/ig) != null) {
                len += 2;
            }
            else {
                len += 1;
            }
        }
        if(times != 1) {
            num = num/times;
        }
        for(var y=0;y<(num-len);y++){
            if(seat == 1){
                val+=" ";
            }else {
                val = " " + val;
            }
        }
        return val;
    }
    ordinary(obj){
        let self = this;
        let m1 = `${self.getByteComplement(obj.articleName,30)}`;
        let m2 = `${self.getByteComplement(obj.articleNumber.toString(),8,1,2)}`;
        let m3 = `${self.getByteComplement(obj.articleSubtotal.toString(),10,1,2)}`;
        let mm = `${m1}${m2}${m3}`;
        return mm;
    }
    package(obj){
        let self = this;
        let m1 = `|_${self.getByteComplement(obj.articleName,28)}`;
        let m2 = `${self.getByteComplement(obj.articleNumber.toString(),8,1,2)}`;
        let m3 = `${self.getByteComplement(obj.articleSubtotal.toString(),10,1,2)}`;
        let mm = `${m1}${m2}${m3}`;
        return mm;
    }

    seatDetails(seatStatus,seatNumber,seatHolders,serialNumber){
        let self = this;
        var  seatStatus = seatStatus;
        var  seatNumber = `桌号${seatNumber}`;
        var  seatHolders = `${seatHolders}人`;
        var  serialNumber = serialNumber;
        return `${self.getByteComplement(seatStatus,12,2)}${self.getByteComplement(seatNumber,16,2)}${self.getByteComplement(seatHolders,14,2)}${self.getByteComplement(serialNumber,1)}`
    }

    tradingCode(serialNumber){
        return `交易流水号：${serialNumber}`
    }

    orderTime(time,num){
        let self = this;
        var mun = num || null;
        if(mun){
            time = `下单时间:${time}`;
            num = `打印${num}次`;
            return `${self.getByteComplement(time,38)}${self.getByteComplement(num,10,1,2)}`;
        }else {
            return `下单时间：${time}`;
        }
    }
    // 总计
    total(num,sum){
        let self = this;
        return `${self.getByteComplement('总计',30)}${self.getByteComplement(num.toString(),8,1,2)}${self.getByteComplement(sum.toString(),10,1,2)}`
    }
    // 折扣

    discount(discount){
        let self = this;
        return `${self.getByteComplement('折扣',38)}${self.getByteComplement(discount.toString(),10,1,2)}`
    }


    // print() {
    //     let self = this;
    //     let device= self.device();
    //     let printer= self.printer(device);
    //     device.open(function () {
    //         printer
    //             .align('ct')
    //             .print('\x1d\x21\x00')
    //             // .size(1, 1)
    //             .text(`${self.segmentingLine()}`)
    //             .text(`${self.article()}`)
    //             .text(`${self.segmentingLine()}`)
    //             .text(`${self.ordinary()}${self.package()}${self.package()}${self.ordinary()}${self.ordinary()}${self.ordinary()}${self.package()}${self.package()}`)
    //             .feed(1)
    //             .cut()
    //             .close()
    //     });
    // }
}


exports.Print = global.Print = Print;
