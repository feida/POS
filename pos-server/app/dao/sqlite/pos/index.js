/**
 * @author wxh on 2017/10/27
 * @copyright
 * @desc
 */

const Sequelize = require('sequelize');
const path = require('path');
const config = require('../../config/index');

const fileUtil = require("../../../util/fileUtil");

const POS_CONFIG = config.sqlite.pos;

// fileUtil.appendFile(`sqlitePath`,`path:${path.resolve(__dirname) + "/" + POS_CONFIG.database},${JSON.stringify(config.sqlite)}\n`);

const sequelize = new Sequelize(POS_CONFIG.database, POS_CONFIG.user, POS_CONFIG.password, {
    host: path.resolve(__dirname) + "/" + POS_CONFIG.database,
    port: POS_CONFIG.port,
    dialect: 'sqlite',
    pool: {
        max: 5,
        min: 0,
        idle: 10000
    },
    // logging: console.log,
    logging: false,
    queueLimit: 0,
    waitForConnection: true,
    dialectOptions: {
        charset: 'utf8'
    }
});


const brand = require('./schema/brand');
const brandSetting = require('./schema/brandSetting');
const chargeOrder = require('./schema/chargeOrder');
const customer = require('./schema/customer');
const customerAddress = require('./schema/customerAddress');
const printer = require('./schema/printer');
const shopDetail = require('./schema/shopDetail');
const user = require('./schema/user');
const kitchen = require('./schema/kitchen');
const area = require('./schema/area');
const tableQrcode = require('./schema/tableQrcode');
const order = require('./schema/order');
const orderItem = require('./schema/orderItem');
const article = require('./schema/article');
const articleFamily = require('./schema/articleFamily');
const articleKitchen = require('./schema/articleKitchen');
const articleUnit = require('./schema/articleUnit');
const articleAttr = require('./schema/articleAttr');
const articlePrice = require('./schema/articlePrice');
const articleUnitDetail = require('./schema/articleUnitDetail');
const articleUnitNew = require('./schema/articleUnitNew');
const mealAttr = require('./schema/mealAttr');
const mealItem = require('./schema/mealItem');
const orderPaymentItem = require('./schema/orderPaymentItem');
const orderRefundRemark = require('./schema/orderRefundRemark');
const orderRemark = require('./schema/orderRemark');
const platformOrder = require('./schema/platformOrder');
const platformOrderDetail = require('./schema/platformOrderDetail');
const platformOrderExtra = require('./schema/platformOrderExtra');
const refundRemark = require('./schema/refundRemark');
const syncLog = require('./schema/syncLog');
const unit = require('./schema/unit');
const unitDetail = require('./schema/unitDetail');
const virtualProducts = require('./schema/virtualProducts');
const virtualProductsKitchen = require('./schema/virtualProductsKitchen');
const supportTime = require('./schema/supportTime');
const articleSupportTime = require('./schema/articleSupportTime');
const shopTvConfig = require('./schema/shopTvConfig');
const weightPackage = require('./schema/weightPackage');
const weightPackageDetail = require('./schema/weightPackageDetail');
const kitchenPrinter = require('./schema/kitchenPrinter');
const articleKitchenPrinter = require('./schema/articleKitchenPrinter');
const kitchenPrinterRecord = require('./schema/kitchenPrinterRecord');
const kitchenGroup = require('./schema/kitchenGroup');
const kitchenGroupDetail = require('./schema/kitchenGroupDetail');
const changeTable = require('./schema/changeTable');
const printRecord = require('./schema/printRecord');
const recommend = require('./schema/recommend');
const recommendArticle = require('./schema/recommendArticle');
const dailyLogOperation = require('./schema/dailyLogOperation');
const paymentReview = require('./schema/paymentReview');

brand.define(sequelize);
brandSetting.define(sequelize);
chargeOrder.define(sequelize);
customer.define(sequelize);
customerAddress.define(sequelize);
printer.define(sequelize);
shopDetail.define(sequelize);
user.define(sequelize);
kitchen.define(sequelize);
area.define(sequelize);
tableQrcode.define(sequelize);
order.define(sequelize);
orderItem.define(sequelize);
article.define(sequelize);
articleFamily.define(sequelize);
articleKitchen.define(sequelize);
articleUnit.define(sequelize);
articleAttr.define(sequelize);
articlePrice.define(sequelize);
articleUnitDetail.define(sequelize);
articleUnitNew.define(sequelize);
mealAttr.define(sequelize);
mealItem.define(sequelize);
orderPaymentItem.define(sequelize);
orderRefundRemark.define(sequelize);
orderRemark.define(sequelize);
platformOrder.define(sequelize);
platformOrderDetail.define(sequelize);
platformOrderExtra.define(sequelize);
refundRemark.define(sequelize);
syncLog.define(sequelize);
unit.define(sequelize);
unitDetail.define(sequelize);
virtualProducts.define(sequelize);
virtualProductsKitchen.define(sequelize);
supportTime.define(sequelize);
articleSupportTime.define(sequelize);
shopTvConfig.define(sequelize);
weightPackage.define(sequelize);
weightPackageDetail.define(sequelize);
kitchenPrinter.define(sequelize);
articleKitchenPrinter.define(sequelize);
kitchenPrinterRecord.define(sequelize);
kitchenGroup.define(sequelize);
kitchenGroupDetail.define(sequelize);
changeTable.define(sequelize);
printRecord.define(sequelize);
recommend.define(sequelize);
recommendArticle.define(sequelize);
dailyLogOperation.define(sequelize);
paymentReview.define(sequelize);

exports.client = sequelize;
exports.Sequelize = sequelize;


// sequelize.sync({ force: true }).then(function (err) {
// 	console.log('init sqlite success');
// });
