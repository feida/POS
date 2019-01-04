/**
 * Created by kpeng on 2017-04-24.
 */
var fs = require('fs');
var DOMParser = require('xmldom').DOMParser;
var HashTable = require('./HashTable').HashTable;

(function () {
    CommandSet = function (cmdFile) {
        var commands = load(cmdFile);

        this.getCommand = function (cmdName) {
            var cmdValue = commands.getValue(cmdName);
            var buffer = new Buffer(cmdValue.length);
            for (var i=0; i<cmdValue.length; i++) {
                buffer[i] = cmdValue[i] & 0xff;
            }
            return buffer;
        }

        this.concatCommand = function (buffer, cmdName) {
            return Buffer.concat([buffer, this.getCommand(cmdName)]);
        }
    }

    var load = function (cmdFile) {
        var commands = new HashTable();

        var xmlCommand = fs.readFileSync(cmdFile, 'utf8');
        var xmldocCommand = new DOMParser().parseFromString(xmlCommand, 'text/xml');
        var cmdSetList = xmldocCommand.getElementsByTagName('CommandSet');
        for (var i = 0; i < cmdSetList.length; i++) {
            if (cmdSetList[i].attributes.getNamedItem('Name').nodeValue==='ESCPOS') {
                var cmdList = cmdSetList[i].getElementsByTagName('Command');
                for (var j = 0; j < cmdList.length; j++) {
                    var cmdName; // = cmdList[j].getElementsByTagName('Name').item(0).textContent;
                    var cmdValue = [];
                    var cmdNodes = cmdList[j].childNodes;
                    for(var k = 0, n = 0; k < cmdNodes.length; k++) {
                        if (cmdNodes[k].tagName==='Name') {
                            cmdName = cmdNodes[k].textContent;
                        }
                        if (cmdNodes[k].tagName==='Value' || cmdNodes[k].tagName==='Parameter') {
                            var ch = cmdNodes[k].textContent;
                            cmdValue[n++] = parseInt(ch);
                        }
                    }
                    commands.add(cmdName, cmdValue);
                }
            }
        }

        return commands;
    }

    ESCPOS_CommandSet = new CommandSet('./config/CS_ESCPOS.xml');
})();

exports.ESCPOS_CommandSet = ESCPOS_CommandSet;