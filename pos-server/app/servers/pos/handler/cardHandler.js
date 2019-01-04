const result = require("../../../util/resultUtil")
const request = require('request');
const moment = require('moment');
const exec = require('child_process').exec;
const path = require('path');

module.exports = function (app) {
    return new Handler(app);
}

var Handler = function (app) {
    this.app = app;
}

var handler = Handler.prototype;

handler.getDiscountByCardId = function (msg, session, next) {
    if (result.isEmpty(msg.card_id)) return result.error(next, "卡号不能为空", msg);
    let cardId = msg.card_id;
    request.get(`http://192.168.1.112:8080/newPosApi/cardDiscountOne?cardId=${cardId}`, (err, reply) => {
        if (err || !reply.body) return result.error(next, err.toString(), msg);
        discountInfo = JSON.parse(reply.body);
        let discount = {
            discount: 100
        }
        let now_time = new Date();
        let week = moment(now_time).day() + 1;
        let date = moment(now_time).format('YYYY-MM-DD');
        let time = now_time.getTime();
        for (let i = discountInfo.length - 1; i >= 0; i--) {
            if (week == discountInfo[i].discountWeek) { // 星期
                let begin = (new Date(date + ' ' + discountInfo[i].discountTime.split(',')[0])).getTime();
                let end = (new Date(date + ' ' + discountInfo[i].discountTime.split(',')[1])).getTime();
                if (time >= begin && time <= end) {
                    discount.discount = discountInfo[i].discount * 10;
                }
            }
        }
        result.success(next, discount);
    })
}

handler.readCard = function (msg, session, next) {
    let command = `java -jar ${path.resolve()}\\app\\jar\\card.jar`;
    exec(command, function (error, stdout, stderr) {
        if (error) {
            return result.error(next, '读卡失败', msg);
        }
        let card_id = stdout;
        if (!Number(card_id) || card_id.length != 16) {
            return result.error(next, '读卡失败', msg);
        }
        result.success(next, { card_id: card_id });
    });
}