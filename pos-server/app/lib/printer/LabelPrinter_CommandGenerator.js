/**
 * Created by kpeng on 2018-01-14.
 */
var LabelPrinter_CommandGenerator = (function () {
    //参数：传递给单例的一个参数集合
    function Singleton(args) {
        //设置args变量为接收的参数或者为空（如果没有提供的话）
        var args = args || {};

        var outputBuffer;
        var joParameters;

        var lineOutput = "";
        var lineX = "0";
        var lineY = "0";
        var lineFont = "TSS24.BF2";
        var bcHeight = "100";
        var bcShowText = "0";

        this.generate = function (reportModeFile, jsParameters) {

            outputBuffer = new Buffer([]);

            if (typeof jsParameters === 'string') {
                joParameters = JSON.parse(jsParameters);
            }
            else {
                joParameters = jsParameters;
            }

            var xmlReportMode = fs.readFileSync(reportModeFile, 'utf8');
            var xmldocReportMode = new DOMParser().parseFromString(xmlReportMode, 'text/xml');

            var root = xmldocReportMode.getElementsByTagName('Report').item(0);
            TreeWalk(root);

            return outputBuffer;
        }

        var TreeWalk = function (element) {
            var nodeList = element.childNodes;

            for (var i=0; i < nodeList.length; i++) {
                var elmName = nodeList[i].tagName;
                var elm;
                if (elmName == null) {
                    continue;
                }
                else {
                    elm = nodeList[i];
                }

                //before action
                switch (elmName) {
                    case "Page":
                        var pageWidth = elm.getAttribute('Width');
                        var pageHeight = elm.getAttribute('Height');
                        var gap = elm.getAttribute('Gap');
                        var direction = elm.getAttribute('Direction');
                        var output = "";
                        output += "SIZE " + pageWidth + "mm, " + pageHeight + "mm\r";
                        output += "GAP " + gap + " mm,0 mm\r";
                        output += "SPEED 5\r";
                        output += "DENSITY 8\r";
                        output += "DIRECTION " + direction + "\r";
                        output += "REFERENCE 0,0\r";
                        output += "CLS\r";
                        outputBuffer = Buffer.concat([outputBuffer, new Buffer(output)]);
                        break;
                    case "Line":
                    case "Multiline":
                        lineOutput = "";
                        lineX = elm.getAttribute("X");
                        lineY = elm.getAttribute("Y");
                        lineFont = elm.getAttribute("font");
                        break;
                    case "Barcode":
                        lineOutput = "";
                        lineX = elm.getAttribute("X");
                        lineY = elm.getAttribute("Y");
                        lineFont = elm.getAttribute("font");
                        bcHeight = elm.getAttribute("Height");
                        bcShowText = elm.getAttribute("showText");
                        break;
                    case "Text":
                    case "Variable":
                    default:
                        break;
                }

                //in action
                switch (elmName) {
                    case "Text":
                        lineOutput += elm.textContent;
                        break;
                    case "Variable":
                        lineOutput += parseVariable(elm);
                        break;
                    case "Page":
                    case "Line":
                    case "Multiline":
                    case "Barcode":
                    default:
                        TreeWalk(elm);
                        break;
                }

                //after action
                switch (elmName) {
                    case "Line":
                        outputText(lineOutput);
                        break;
                    case "Multiline":
                        var rows;
                        var cols;
                        var lineHeight;
                        var leftLength = lineOutput.length;
                        var Y;
                        rows = parseInt(elm.getAttribute("rows"));
                        cols = parseInt(elm.getAttribute("cols"));
                        lineHeight = parseInt(elm.getAttribute("lineHeight"));
                        Y= parseInt(lineY);
                        for (var j=0; j<rows; j++) {
                            var lineLength;
                            if (j<rows-1) {
                                lineLength = cols;
                            }
                            else {
                                lineLength = leftLength;
                            }
                            outputText(lineOutput.substr(j*cols, lineLength));
                            Y += lineHeight;
                            lineY = Y.toString();
                            leftLength -= cols;
                            if (leftLength<=0) break;
                        }
                        break;
                    case "Barcode":
                        var output = "BARCODE " + lineX + "," + lineY + ",\"" + lineFont + "\"," + bcHeight
                            + "," + bcShowText + ",0,1,1,\"" + lineOutput + "\"\r";
                        outputBuffer = Buffer.concat([outputBuffer, new Buffer(output)]);
                        break;
                    case "Page":
                        var output = "PRINT 1,1\r";
                        outputBuffer = Buffer.concat([outputBuffer, new Buffer(output)]);
                        break;
                    case "Text":
                    case "Variable":
                    default:
                        break;

                }
            }
        }

        var parseVariable = function (elm) {
            var output;

            var varName = elm.getAttribute('name');
            var varObj = eval('joParameters.' + varName);
            if (varObj != null) {
                output = varObj.toString();
            }

            return output;
        }

        var outputText = function (text) {
            var output;
            output = "TEXT " + lineX + "," + lineY + ",\"" + lineFont + "\",0,1,1,\"";
            outputBuffer = Buffer.concat([outputBuffer, new Buffer(output)]);
            outputBuffer = Buffer.concat([outputBuffer, iconv.encode(text, "gb18030")]);
            output = "\"\r";
            outputBuffer = Buffer.concat([outputBuffer, new Buffer(output)]);
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
var iconv = require('iconv-lite');
var DOMParser = require('xmldom').DOMParser;

exports.LabelPrinter_CommandGenerator = LabelPrinter_CommandGenerator;
