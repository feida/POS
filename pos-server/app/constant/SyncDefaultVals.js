/**
 * 订单同步必备字段及默认值
 */
exports.order = {
    order_state: 2,
    production_status: 2,
    original_amount: 0,
    reduction_amount: 0,
    payment_amount: 0,
    order_money: 0,
    serial_number: '',
    article_count: 0,
    allow_cancel: 0,
    allow_appraise: 0,
    closed: 0,
    customer_id: '',
    shop_detail_id: '',
    distribution_mode_id: 1,
    ver_code: '',
    order_mode: '',
    brand_id: '',
    amount_with_children: 0,
    allow_continue_order: 0,
    sauce_fee_price: 0,
    towel_fee_price: 0,
    tableware_fee_price: 0,
    is_use_new_service: 0,
    data_origin: 0,
    order_pos_discount_money: 0,
    member_discount_money: 0,
    exemption_money: 0
}

/**
 * 订单项必备字段及默认值
 */
exports.orderitem = {
    article_name: '',
    count: 0,
    original_price: 0,
    unit_price: 0,
    final_price: 0,
    sort: 0,
    status: 1,
    order_id: '',
    article_id: '',
    type: 1
}

/**
 * 支付想象必备及默认值
 */
exports.payment = {
    pay_time: Date.now(),
    pay_value: 0,
    payment_mode_id: 2,
    order_id: ''
}

/**
 * 退菜标注项
 */
exports.refunds = {

}
