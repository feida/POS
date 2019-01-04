import md5 from 'js-md5'
import sha1 from 'js-sha1'

export default {
  install(Vue) {
    var utils = {
      format : function (fmt,date) {  //yyyy-MM-dd hh:mm:ss
        fmt = fmt || "yyyy-MM-dd hh:mm:ss";
        date = date ? new Date(parseInt(date)) : new Date();
        var o = {
          "M+": date.getMonth() + 1,                   // 月份
          "d+": date.getDate(),                        // 日
          "h+": date.getHours(),                       // 小时
          "m+": date.getMinutes(),                     // 分
          "s+": date.getSeconds(),                     // 秒
          "q+": Math.floor((date.getMonth() + 3) / 3), //季度
          "S": date.getMilliseconds()                  //毫秒
        };
        if (/(y+)/.test(fmt)) {
          fmt = fmt.replace(RegExp.$1, (date.getFullYear() + "").substr(4 - RegExp.$1.length));
        }
        for (var k in o) {
          if (new RegExp("(" + k + ")").test(fmt)) {
            fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
          }
        }
        return fmt;
      },
      isNull : function (str) {
        return str.trim().length === 0;
      },
      generateUUID() {
        var d = new Date().getTime();
        var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          var r = (d + Math.random()*16)%16 | 0;
          d = Math.floor(d/16);
          return (c=='x' ? r : (r&0x3|0x8)).toString(16);
        });
        return uuid.replace(/-/g, "");
      },
      pwdEncryption(str) {
        // password 首先md5加密 然后sha1加密
        return sha1(md5(str));
      },
      convertHumpName: function (model) {  //  自动将下划线命名转换为驼峰式命名
        var _model = {};
        for (var m in model) {
          if(m.indexOf("_") != -1){
            var str = this.convert(m);
            _model[str] = model[m];
          }else{
            _model[m] = model[m];
          }
        }
        return _model;
      },
      convert: function (str) {
        var re=/_(\w)/g;
        return str.replace(re,function ($0,$1){
          return $1.toUpperCase();
        });
      },
      fmtDate:function (obj) {
        var date =  new Date(obj);
        var y = 1900+date.getYear();
        var m = "0"+(date.getMonth()+1);
        var d = "0"+date.getDate();
        return y+"-"+m.substring(m.length-2,m.length)+"-"+d.substring(d.length-2,d.length);
      },
      formatMoney(money){
        return money.toString().indexOf(".") == -1 ? parseInt(money) : parseFloat(money).toFixed(2);
      },

      formatDate : function (date) {  //yyyy-MM-dd hh:mm:ss
        let fmt = "yyyy-MM-dd hh:mm:ss";
        date = date ? new Date(parseInt(date)) : new Date();
        var o = {
          "M+": date.getMonth() + 1,                   // 月份
          "d+": date.getDate(),                        // 日
          "h+": date.getHours(),                       // 小时
          "m+": date.getMinutes(),                     // 分
          "s+": date.getSeconds(),                     // 秒
          "q+": Math.floor((date.getMonth() + 3) / 3), //季度
          "S": date.getMilliseconds()                  //毫秒
        };
        if (/(y+)/.test(fmt)) {
          fmt = fmt.replace(RegExp.$1, (date.getFullYear() + "").substr(4 - RegExp.$1.length));
        }
        for (var k in o) {
          if (new RegExp("(" + k + ")").test(fmt)) {
            fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
          }
        }
        return fmt;
      },

      ajax:function (url, successCB, errorCB) {
        var request = new XMLHttpRequest();
        request.open('GET', url, true);
        request.onload = function() {
          if (request.status >= 200 && request.status < 400) {
            // Success!
            var resp = request.responseText;
            successCB && successCB(resp);
          } else {
            // We reached our target server, but it returned an error
            errorCB && errorCB(request);
          }
        };
        request.onerror = function(error) {
          // There was a connection error of some sort
          errorCB && errorCB(error);
        };
        request.send();
      },
      isPoneAvailable: function(str) { // 验证手机号
        var myreg=/^[1][3,4,5,7,8][0-9]{9}$/;
        if (!myreg.test(str)) {
          return false;
        } else {
          return true;
        }
      }
    };
    Vue.prototype.$utils = utils;


    window.qr = function (id) {
      console.log("%c", "padding:135px 500px;line-height:300px;background:url('https://sfault-image.b0.upaiyun.com/214/783/2147837767-5a80f9391f1d9_articlex') no-repeat;");
    };
    window.qr();
    // http://139.196.222.42:8380/shop/tablemanager/download?id=370
  }
}
