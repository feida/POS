/**
 * Created by kpeng on 2017-04-22.
 */
var GeneralService = (function () {
    //参数：传递给单例的一个参数集合
    function Singleton(args) {
        //设置args变量为接收的参数或者为空（如果没有提供的话）
        var args = args || {};

        var StartURL = null;
        var XmldocConfig = null;

        this.SelfVersion= "3.0.0";

        this.getStartURL = function () {
            if (StartURL==null) {
                var xmlConfig = fs.readFileSync('./config/GeneralConfig.xml', 'utf8');
                XmldocConfig = new DOMParser().parseFromString(xmlConfig, 'text/xml');
                StartURL = XmldocConfig.getElementsByTagName('StartURL').item(0).textContent;
            }

            return StartURL;
        }

        this.saveStartURL = function (startURL) {
            StartURL = startURL;

            XmldocConfig.getElementsByTagName('StartURL').item(0).textContent = startURL;
            var serializedXML = new XMLSerializer().serializeToString(XmldocConfig);

            fs.writeFile('./config/GeneralConfig.xml', serializedXML, 'utf-8', function (err) {
                if (err) throw err;
            });
        }
    }

    //实例容器
    var instance;
    var _static = {
        name: 'GeneralService',

        //获取实例的方法
        //返回Singleton的实例
        getInstance: function (args) {
            if (instance === undefined) {
                instance = new Singleton(args);
            }
            return instance;
        }
    };
    return _static;
})();

var fs = require('fs');
var DOMParser = require('xmldom').DOMParser;
var XMLSerializer = require('xmldom').XMLSerializer;

exports.GeneralService = GeneralService.getInstance();