<template>
  <div style="width: 50%;float: left;">
    <ul class="pay-info-details">
      <li>
        <div>
          <p>应付</p>
          <p style="color: #EF5350 ;font-size: 28px;">¥{{formatMoney(payInfo.amountMoney)}}</p>
        </div>
      </li>
      <li>
        <div>
          <p>实付</p>
          <p style="font-size: 20px;">
            ¥{{cardMoney > 0 ? formatMoney(cardMoney) : formatMoney(payInfo.actuallyPay)}}
          </p>
        </div>
      </li>
      <li>
        <div>
          <p>剩余</p>
          <p>¥{{formatMoney(payInfo.remainMoney)}}</p>
        </div>
      </li>
      <li>
        <div>
          <p>找零</p>
          <p>¥{{formatMoney(payInfo.changeMoney)}}</p>
        </div>
      </li>
    </ul>
  </div>
</template>

<script>
  import {mapGetters} from 'vuex'
  export default {
    name: "topRightArea",
    computed: {
      ...mapGetters({
        cardMoney: 'cardMoney',
        payInfo: 'payInfo'
      })
    },
    methods: {
      formatMoney(money){
        return this.$utils.formatMoney(money || 0);
      },
    }
  }
</script>

<style scoped>
</style>
