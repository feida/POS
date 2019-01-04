var path = require("path");
var pomelo = require('pomelo');
const paramFIlter = require('./app/lib/fiter/paramFIlter');
const fileUtil = require("./app/util/fileUtil");
var WSClient = require('./app/components/WSClient');

//设置项目的跟路径
var opts = {
    base : path.resolve()
};
/**
 * Init app for client.
 */
var app = pomelo.createApp(opts);
app.set('name', 'resto-pos');

app.configure('production|development', function () {

    app.filter(paramFIlter());

    app.set('connectorConfig',
        {
            connector: pomelo.connectors.hybridconnector,
            heartbeat: 3,
            useDict: true,
            useProtobuf: true
        });
});


// app configuration
app.configure('production|development', 'connector', function(){
  app.set('connectorConfig',
    {
      connector : pomelo.connectors.hybridconnector,
      useProtobuf : true
    });
    fileUtil.appendFile('system',`Pos 启动成功  connector `);
});

app.configure('production|development', 'pos', function(){
    app.set('connectorConfig',
        {
            connector : pomelo.connectors.hybridconnector,
            useProtobuf : true
        });
    fileUtil.appendFile('system',`Pos 启动成功  pos `);
});

// app.configure('production|development', 'printer-connector', function(){
//     app.set('connectorConfig',
//         {
//             connector : pomelo.connectors.hybridconnector,
//             useProtobuf : true
//         });
//     fileUtil.appendFile('system',`Pos 启动成功  printer-connector `);
// });

app.configure('production|development', 'pos', function() {
    app.load(WSClient, {interval: 5000});
});


// start app
app.start();

process.on('uncaughtException', function (err) {
  console.error(' Caught exception: ' + err.stack);
  fileUtil.appendFile('system',`【全局异常】\n${err.stack.toString()}\n${JSON.stringify(err)}`);
});