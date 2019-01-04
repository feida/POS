<template>
  <div style="width: 50%;float: left;border-right: 1px dashed #e0e0e0;">
    <ul class="pay-info-details">
      <li>
        <div>
          <p>订单总额</p>
          <p style="color: #EF5350 ;font-size: 28px;">
            ¥{{orderInfo.amount_with_children > 0 ? formatMoney(orderInfo.amount_with_children + discountInfo.discountMoney + discountInfo.easyMoney) : formatMoney(orderInfo.order_money + discountInfo.discountMoney + discountInfo.easyMoney)}}
          </p>
        </div>
      </li>
      <li>
        <div>
          <p>会员折扣</p>
          <p style="font-size: 20px;">
            ¥00.00
          </p>
        </div>
      </li>
      <li>
        <div>
          <p>订单折扣</p>
          <p>¥{{formatMoney((discountInfo.discountMoney || 0))}}</p>
        </div>
      </li>
      <li>
        <div>
          <p>抹零</p>
          <p>¥{{formatMoney(discountInfo.easyMoney || 0)}}</p>
        </div>
      </li>
    </ul>
  </div>
</template>


<script>
  import {mapGetters} from 'vuex'
  import orderInfo from "../../store/modules/orderInfo";
  export default {
    // props:['formatMoney'],
    name: "topLeftArea",
    computed: {
      ...mapGetters({
        orderInfo: 'orderInfo',
        discountInfo: 'discountInfo',
        payInfo: 'payInfo',
        currentOrderInfo: 'currentOrderInfo',
        formatDiscount: 'formatDiscount'
      })
    },
    methods: {
      formatMoney(money){
        return this.$utils.formatMoney(money || 0);
      },
    },
  }
</script>

<style scoped>
</style>
