/**
 * Created by kpeng on 2017-04-25.
 */
var ESCPOS_CommandGenerator = (function () {
    //参数：传递给单例的一个参数集合
    function Singleton(args) {
        //设置args变量为接收的参数或者为空（如果没有提供的话）
        var args = args || {};

        var outputBuffer;

        var jsParameterCache;
        var joParameters;
        var joCursor;

        var flagBigFont;

        var flagBarcode;

        this.generate = function (reportModeFile, jsParameters) {
            outputBuffer = new Buffer([]);
            jsParameterCache = jsParameters;
            joCursor = null;
            flagBigFont = false;
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

            //return
            return outputBuffer;
        }

        var TreeWalk = function (element) {
            var nodeList = element.childNodes;

            for (var i=0; i < nodeList.length; i++) {
                var elmName = nodeList[i].tagName;
                var elm;
                if (elmName==null) {
                    continue;
                }
                else {
                    elm = nodeList[i];
                }

                var font;

                //before action
                switch (elmName) {
                    case 'Line':
                    case 'Lines':
                    case 'Text':
                    case 'Variable':
                        var align = elm.getAttribute('align');
                        if (align!=null && align!='') {
                            outputBuffer = CommandSet.concatCommand(outputBuffer, align);
                        }
                        font = elm.getAttribute('font');
                        if (font!=null && font!='') {
                            outputBuffer = CommandSet.concatCommand(outputBuffer, font);
                        }
                        if (font == 'FONT_A_HW') {
                            flagBigFont = true;
                        }
                        else {
                            flagBigFont = false;
                        }
                        break;
                    case 'Barcode':
                        flagBarcode = true;
                        outputBuffer = Buffer.concat([outputBuffer, new Buffer([29, 104, 100, 29, 119, 2, 29, 107, 72])]);
                        break;
                    default:
                        break;
                }

                //in action
                switch (elmName) {
                    case 'Command':
                        //outputBuffer += elm.textContent;
                        outputBuffer = CommandSet.concatCommand(outputBuffer, elm.textContent);
                        break;
                    case 'Include':
                        var includeGenerator = new Singleton();
                        var includeOutput = includeGenerator.generate(elm.textContent, jsParameterCache);
                        outputBuffer = Buffer.concat([outputBuffer, includeOutput]);
                        break;
                    case 'Pad':
                        var width = parseInt(elm.getAttribute('width'));
                        var char = elm.getAttribute('char').charCodeAt(0) & 0xff;
                        var buffer = new Buffer(width);
                        for (var j=0; j<width; j++) {
                            buffer[j] = char;
                        }
                        outputBuffer = Buffer.concat([outputBuffer, buffer]);
                        break;
                    case 'Text':
                        parseText(elm.textContent);
                        break;
                    case 'Variable':
                        parseVariable(elm);
                        break;
                    case 'Image':
                        outputBuffer = CommandSet.concatCommand(outputBuffer, 'IMAGE_NV');
                        break;
                    case 'ImageFile':
                        break;
                    case 'Lines':
                        var dataSource = elm.getAttribute('datasource');
                        var rows = eval('joParameters.'+dataSource);
                        for (var j=0; j<rows.length; j++) {
                            joCursor = rows[j];
                            TreeWalk(elm);
                        }
                        joCursor = null;
                        break;
                    case 'Line':
                    case 'Barcode':
                    default:
                        TreeWalk(elm);
                        break;
                }

                //after action
                switch (elmName) {
                    case 'Line':
                        outputBuffer = CommandSet.concatCommand(outputBuffer, 'LF');
                    case 'Barcode':
                        flagBarcode = false;
                    default:
                        break;
                }
            }
        }

        var parseText = function (text) {
            if (flagBigFont) {
                outputBuffer = Buffer.concat([outputBuffer, new Buffer([28, 33, 12])]);
            }
            var text = iconv.encode(text, "gb18030");
            if(flagBarcode) {

                outputBuffer = Buffer.concat([outputBuffer, new Buffer([text.length ])]);
            }

            outputBuffer = Buffer.concat([outputBuffer, text]);
            if (flagBigFont) {
                outputBuffer = Buffer.concat([outputBuffer, new Buffer([28, 33, 0])]);
            }
        }
        var parseBarcode = function (text) {
            var text = iconv.encode(text, "gb18030");
            outputBuffer = Buffer.concat([outputBuffer, new Buffer([29, 104, 160, 29, 119, 2, 29, 107, 72])]);
            outputBuffer = Buffer.concat([outputBuffer, text]);
        }


        var parseVariable = function (elm) {
            var varObj = getVariable(elm);
            var varString;
            if (varObj === null || typeof varObj ==='undefined') {
                varString = '';
            }
            else {
                varString = varObj.toString();
            }

            var strFormat = elm.getAttribute('format');
            var intFormat;
            if (strFormat === '' || strFormat === null) {
                intFormat = 0;
            }
            else {
                intFormat = parseInt(strFormat);
            }

            var dataType = elm.getAttribute('datatype');
            switch (dataType) {
                case 'STRING':
                    var chineseLength = 0;
                    for (var i=0; i<varString.length; i++) {
                        var char = varString.substr(i, 1);
                        if (isChineseString(char)) {
                            chineseLength++;
                        }
                    }
                    if (intFormat >0) {
                        intFormat -= chineseLength;
                    }
                    else {
                        intFormat += chineseLength;
                    }
                    varString = format(varString, intFormat);
                    parseText(varString);
                    break;
                case 'INT':
                case 'LONG':
                case 'DECIMAL':
                default:
                    varString = format(varString, intFormat);
                    outputBuffer = Buffer.concat([outputBuffer, new Buffer(varString)]);
                    break;
            }

        }
        
        var format = function (string, format) {
            var lengthFormat = Math.abs(format);
            var lengthString = string.length;
            var length = lengthFormat - lengthString;
            var bufferString = new Buffer(string);
            if (length>0) {
                var buffer = new Buffer(length);
                for (var i=0; i<length; i++) {
                    buffer[i] = ' '.charCodeAt(0) & 0xff;
                }
                if (format>0) {
                    return Buffer.concat([buffer, bufferString]);
                }
                else {
                    return Buffer.concat([bufferString, buffer]);
                }
            }
            else {
                return bufferString;
            }
        }

        var isChineseString = function(text) {
            var reg = new RegExp('^[\u4E00-\u9FA5]+$');
            return text.match(reg);
        }

        var getVariable = function (elm) {
            var varObj = null;

            var varName = elm.getAttribute('name');
            if (varName === '') {
                var value = elm.getAttribute('value');
                if (value === '') {
                    varObj = null;
                }
                else {
                    var datatype = elm.getAttribute('datatype');
                    switch (datatype) {
                        case 'STRING':
                            varObj = value;
                            break;
                        case 'INT':
                        case 'LONG':
                            varObj = parseInt(value);
                            break;
                        case 'DECIMAL':
                            varObj = parseFloat(value);
                            break;
                        default:
                            break;
                    }
                    //varObj = value;
                }
            }
            else {
                var dataSource = elm.getAttribute('datasource');
                if (dataSource === '') {
                    varObj = eval('joParameters.' + varName);
                }
                else {
                    varObj = eval('joCursor.' + varName);
                }
            }

            return varObj;
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
var CommandSet = require('./CommandSet').ESCPOS_CommandSet;

exports.ESCPOS_CommandGenerator = ESCPOS_CommandGenerator;