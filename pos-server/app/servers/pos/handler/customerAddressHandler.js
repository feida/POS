const result = require("../../../util/resultUtil");
const customSqlModel = require("../../../model/pos/customSql");

module.exports = function (app) {
    return new Handler(app);
}

var Handler = function (app) {
    this.app = app;
}

var handler = Handler.prototype;


/**
 * 写入 远程用户详情 数据
 * @param msg
 * @param session
 * @param next
 */
handler.insertSelectiveByCustomerAddressId = function (msg, session, next) {
    let customerAddress = formatCustomerAddress(msg.model);
    let sql = `select * from tb_customer_address where id = '${customerAddress.id}'`;
    customSqlModel.getOneCustomSqlInfo(sql, function (err, data) {
        // customerAddressDao.selectById(customerAddress.id, function (err, data) {
        if (err) {
            result.error(next, err.toString(), msg);
        }
        if (!!data) {
            result.success(next, "该地址已存在");
        }
        customSqlModel.insertSelective('tb_customer_address', customerAddress, function (err) {
            // customerAddressDao.insertSelectiveByCustomerAddressId(customerAddress, function (err) {
            if (error != null) {
                result.error(next, err.toString(), msg);
            }
            result.success(next);
        });
    });
}

const formatCustomerAddress = (entity) => {
    return {
        id: entity.id,
        name: entity.name,
        sex: entity.sex,
        mobile_no: entity.mobileNo,
        address: entity.address,
        address_reality: entity.realityId,
        customer_id: entity.customerId,
        state: entity.state
    }
}