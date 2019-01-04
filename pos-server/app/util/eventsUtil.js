const events = require("events");
let eventsUtil = module.exports;
let wsEvent = null;

eventsUtil.wsEvent = function () {
    if(!wsEvent){
        wsEvent = new events.EventEmitter();
    }
    return wsEvent;
};