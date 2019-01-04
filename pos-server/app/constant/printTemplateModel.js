/**
 * @author wxh on 2018/1/14
 * @copyright
 * @desc
 */

/**
 * 打印模板选择
 */
var printTemplateModel = module.exports;

printTemplateModel.REPORT = './report';



/**
 * 小票总单
 * @type {number}
 */
printTemplateModel.TOTAL_TEMPLATE_48 = 'restaurant_receipt.xml';

/**
 * 小票总单-不带用户信息
 * @type {number}
 */
printTemplateModel.TOTAL_TEMPLATE_NOT_USER_INFO_48 = 'restaurant_receipt_not_user_info.xml';


/**
 * 小满小票总单
 * @type {number}
 */
printTemplateModel.TOTAL_BARCODE_FULL_TEMPLATE_48 = 'restaurant_receipt_barcode_grain_full.xml';

/**
 * 带条形小票总单
 * @type {number}
 */
printTemplateModel.TOTAL_BARCODE_TEMPLATE_48 = 'restaurant_receipt_barcode.xml';

/**
 * 带条形小票总单-不带用户信息
 * @type {number}
 */
printTemplateModel.TOTAL_BARCODE_TEMPLATE_NOT_USER_INFO_48 = 'restaurant_receipt_barcode_not_user_info.xml';

/**
 * 小票普通厨打
 * @type {number}
 */
printTemplateModel.KITCHEN_TICKET_TEMPLATE_48 = 'kitchen_ticket.xml';

/**
 * 小票普通厨打--不带用户信息
 * @type {number}
 */
printTemplateModel.KITCHEN_TICKET_TEMPLATE_NOT_USER_INFO_48 = 'kitchen_ticket_not_user_info.xml';


/**
 * 小票精简厨打
 * @type {number}
 */
printTemplateModel.KITCHEN_TICKET_LRF_TEMPLATE_48 = 'kitchen_ticket_lrf.xml';

/**
 * 条码小票普通厨打
 * @type {number}
 */
printTemplateModel.KITCHEN_TICKET_BARCODE_TEMPLATE_48 = 'kitchen_ticket_barcode.xml';


/**
 * 条码小票普通厨打--不带用户信息
 * @type {number}
 */
printTemplateModel.KITCHEN_TICKET_BARCODE_TEMPLATE_NOT_USER_INFO_48 = 'kitchen_ticket_barcode_not_user_info.xml';


/**
 * 条码小票精简厨打
 * @type {number}
 */
printTemplateModel.KITCHEN_TICKET_LRF_BARCODE_TEMPLATE_48 = 'kitchen_ticket_lrf_barcode.xml';


/**
 * 第三方小票总单
 * @type {number}
 */
printTemplateModel.PLATFORM_TOTAL_TEMPLATE_48 = 'platform_receipt.xml';

/**
 * 第三方小票厨打
 * @type {number}
 */
printTemplateModel.PLATFORM_KITCHEN_TICKET_TEMPLATE_48 = 'platform_kitchen_ticket.xml';

/**
 * 日结小票
 * @type {number}
 */
printTemplateModel.DAILY_REPORT_TEMPLATE_48 = 'daily_report.xml';


/**
 * 第三方贴纸打印机
 * @type {number}
 */
printTemplateModel.RESTAURANT_PLATFORM_LABEL = 'restaurant_platform_label.xml';


printTemplateModel.shopObj = {
    'e475f6dece0147f8ad2eb230f3d6a252': `${printTemplateModel.REPORT}/${printTemplateModel.TOTAL_BARCODE_FULL_TEMPLATE_48}`  //小满手工粉总单
};

printTemplateModel.shopObj_not_user_info = {
    'e475f6dece0147f8ad2eb230f3d6a252': `${printTemplateModel.REPORT}/${printTemplateModel.TOTAL_BARCODE_TEMPLATE_NOT_USER_INFO_48}`  //带条形小票总单-不带用户信息
};
