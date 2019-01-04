/**
 * Created by Lmx on 2017/5/22.
 * http://www.cnblogs.com/zhangpengshou/archive/2012/07/19/2599053.html
 */
var dateUtil = module.exports;
const moment = require("moment");

var sdfDay = "yyyy-MM-dd";
var sdfTime = "yyyy-MM-dd HH:mm:ss";

dateUtil.formatDateTime = function (fmt) {
    var date = new Date();
    var year = date.getFullYear();
    var month = date.getMonth()+1;
    var day = date.getDate();
    var hour = date.getHours();
    var minute = date.getMinutes();
    var second = date.getSeconds();
    if (month >= 1 && month <= 9) {
        month = "0" + month;
    }
    if (day >= 0 && day <= 9) {
        day = "0" + day;
    }
    return year+'-'+month+'-'+day+' ' + hour + ':'+minute+':'+second
}


dateUtil.format = function (fmt) {
    var date = new Date();
    var o = {
        "M+": date.getMonth() + 1, //月份
        "d+": date.getDate(), //日
        "h+": date.getHours(), //小时
        "m+": date.getMinutes(), //分
        "s+": date.getSeconds(), //秒
        "q+": Math.floor((date.getMonth() + 3) / 3), //季度
        "S": date.getMilliseconds() //毫秒
    };
    if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (date.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o)
        if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    return fmt;
};

dateUtil.sdfDay = function () {
    return dateUtil.format(sdfDay);
};

dateUtil.sdfTime = function () {
    return dateUtil.format(sdfTime);
};

dateUtil.timestamp = function () {
    return new Date().getTime().toString();
};

dateUtil.isWeekDay = function (weekBin) {
    var supportDay = [
        ["1", 1 << 0],			//	1   周一
        ["2", 1 << 1],			//	2   周二
        ["3", 1 << 2],			//	4   周三
        ["4", 1 << 3],			//	8   周四
        ["5", 1 << 4],			//	16  周五
        ["6", 1 << 5],			//	32  周六
        ["0", 1 << 6],			//	64  周日
    ];

    var arr = [];
    for (var i = 0; i < supportDay.length; i++) {
        var day = supportDay[i];
        if (weekBin & day[1]) {
            arr.push(day[0]);
        }
    }
    var week = new Date().getDay();
    return arr.toString().indexOf(week) != -1;
};

/**
 * 获取流水号，js 生成的为 17 为，在后面固定追加一位 0
 * 与服务器生成的流水号长度保持一致
 */
dateUtil.getSerialNumber = function () {
    let serialNumber = (this.format("yyyyMMddhhmmssS") + '00000').slice(0, 18);
    return serialNumber;
};
dateUtil.compare = function (startDate,endDate,currentDate) {
    let a1 = +startDate.split(":")[0],a2 = +endDate.split(":")[0],a3 = +currentDate.split(":")[0];
    let s1 = +startDate.split(":")[1],s2 = +endDate.split(":")[1],s3 = +currentDate.split(":")[1];
    if(a3 >a1  && a3 <a2){return true;
    }else if (a3 <a1  || a3 > a2){return false;
    }else {
        if (a3 == a1 && a3 == a2) {
            return s3 >=s1 && s3 <=s2 ? true:false
        }else if (a3 == a1){
            return s3 >=s1  ? true:false
        }else {
            return s3 <=s2  ? true:false
        }
    }
};


dateUtil.isBetween = function (startDate,endDate) {
    return moment().isBetween(startDate, endDate)
};