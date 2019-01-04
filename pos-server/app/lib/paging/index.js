/**
 * @author wxh on 2017/11/3
 * @copyright
 * @desc
 */


module.exports.init = function (msg) {
    msg.page_size = msg.page_size ? ~~msg.page_size : 20;
    msg.page_index = msg.page_index ? ~~msg.page_index : 1;

    if (msg.page_index < 1) {
        msg.page_index = 1;
    }

    if (msg.page_size < 1) {
        msg.page_size = 1;
    }

    if (msg.page_size > 50) {
        msg.page_size = 50;
    }

    msg.page_skip = msg.page_size * (msg.page_index - 1);
    return msg;
};