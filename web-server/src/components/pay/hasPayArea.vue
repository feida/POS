<template>
<div>
  <h3 class="pay-title">已付：</h3>
  <div  class="pay-wrap">
    <div class="pay-type-info-item" :disabled="(orderPayType.length ) > 0 ? true : false" v-for="(item,index) in orderPayType">
      <p  class="pay-type-item-details">
        <svg class="icon" aria-hidden="true">
          <use :xlink:href= item.icon></use>
        </svg>
      </p>
      <p class="pay-type-item-details">
        <span >¥{{formatMoney(item.money)}}</span>
      </p>
      <p v-if="((orderInfo.pay_mode == 3 || orderInfo.pay_mode == 4) && orderInfo.order_state < 2)">
      </p>
      <p class="pay-type-item-details" v-else  @click="deletePayType(index, item)" >
        <span class="delete-pay">移除</span>
      </p>
    </div>
  </div>
</div>
</template>

<script>
  import {mapGetters} from 'vuex';
  export default {
    name: "hasPayArea",
    data(){
      return {}
    },
    computed: {
      ...mapGetters({
        orderInfo: 'orderInfo',
        orderPayType: 'orderPayType',
        currentPayType: 'currentPayType',
        paymentItems: 'paymentItems'
      })
    },
    methods: {
      formatMoney(money){
        return this.$utils.formatMoney(money || 0);
      },
      deletePayType(index, item) {
        if (item.isOccupation != 'undefined' && item.isOccupation ) {
          this.$socket.deletePayType(item.toPayId)
          this.$store.commit("deletePaymentItems", item.toPayId)
          console.log("移除占用优惠券", this.paymentItems)
        }
        this.$store.commit('deletePayType', {index, item});
      },
    }
  }
</script>

<style scoped>
  .pay-title {
    color: #666;
    padding-left: 22px;
    height: 80px;
    line-height: 80px;
    font-weight: bold;
  }
  .pay-wrap {
    width: 100%;
    height: 262px;
    display: flex;
    justify-content: start;
    flex-wrap: wrap;
  }
  .pay-type-info-item {
    /*margin-top: 32px;*/
    width: 33%;
    height: 110px;
  }
  .icon {
  width: 40px;
  height: 40px;
  vertical-align: -0.15em;
  fill: currentColor;
  overflow: hidden;
  }

  .pay-type-item-details {
    /*border: 1px solid black;*/
    text-align: center;
    width: 90%;
    margin:0px;
    margin-top: 5px;
    padding:0;
  }
  .delete-pay {
    width: 60%;
    margin-top: 5px;
    display: inline-block;
    border: 1px solid black;
    border-radius: 5px;
    color: #666;
  }
</style>
