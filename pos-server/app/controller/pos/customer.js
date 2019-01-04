/**
 * @author wxh on 2018/11/15
 * @copyright
 * @desc
 */

const request = require('request');
const shopDetailModel = require("../../model/pos/shopDetail");

exports.getMembersStateByCustomerId = function (msg, callback) {

    shopDetailModel.getShopDetailInfo({},(err,shopInfo)=>{
        if (err) return callback(null,shopInfo);
        request({
            url: ``,
            method: "POST",
            json: true,
            headers: {
                "content-type": "application/json",
            },
            body: JSON.stringify(requestData)
        }, function(error, response, body) {
            if (!error && response.statusCode == 200) {
                console.log(body) // 请求成功的处理逻辑
            }
        });


    });

};