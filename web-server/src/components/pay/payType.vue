<template>
  <ul>
    <li v-for="(type , key) in payType" @click=" selectPayType(key)">
      <div class="pay-type-item" :class="(currentPayType.id == key)  ? 'select-pay-type' : ''">
        <svg class="icon" aria-hidden="true"><use :xlink:href=icon[key]></use></svg>
        <p>{{type}}</p>
      </div>
    </li>
  </ul>
</template>

<script>
  import {mapGetters} from 'vuex'
  export default {
    name: "payType",
    data(){
      return {
        icon: { // icon 支付项展示图标
          1:'#icon-wechatpay',
          10:'#icon-zhifubao',
          12:'#icon-xianjin',
          5:'#icon-yinlian',
          16:"#icon-xinmeida1",
          17:'#icon-chongzhi2',
          2: '#icon-chongzhi2',
          3: '#icon-youhuiquan',
          26: '#icon-miandan',
          27: "#icon-tuangou",
          28: "#icon-daijinquan"
        },
      }
    },
    created(){
      this.$store.commit('setShopValidPayMode');
    },
    computed: {
      ...mapGetters({
        payType: 'payType',
        currentPayType: 'currentPayType'
      }),
    },
    methods: {
      selectPayType: function (key) {
        this.$store.commit("setSelectPayType", key)
      }
    },
  }
</script>

<style scoped>
  .pay-type-item {
    width: 100%;
    padding: 10px 15px;
    line-height: 20px;
    white-space: normal;
    position: relative;
    border: none;
  }
  .select-pay-type {
    background-color: #EEE;;
    color: #000;
    border: none;
    border-radius: 0px;
    border-left: 5px solid #ffbf34;
  }
  .icon {
    width: 35px;
    height: 35px;
    vertical-align: -0.15em;
    fill: currentColor;
    overflow: hidden;
  }
</style>
