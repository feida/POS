<template>
  <div>
    <ul class="car-title">
      <li class="car-title-item" style="width: 15%;text-align: center; text-indent: 9px;">#</li>
      <li class="car-title-item" style="width: 40%;">品名</li>
      <li class="car-title-item" style="width: 15%;">数量</li>
      <li class="car-title-item" style="width: 20%;text-align:right;">小计</li>
    </ul>
    <!--购物车 内容-->
    <ul class="car-title car-content" v-for="(article, index) in car">
      <hr style="border:1px dashed #E0E0E0; width: 90%;">
      <div v-show="(article.type == 3 && !!article.tempRefundCount)? false: true ">
        <li class="car-title-item car-content-item" style="width: 15%;text-align: center;">
          {{index+1}}
        </li>
        <li class="car-title-item car-content-item" style="width: 40%;">
          <span style="display: inline-block;width: 80%;">{{article.name}}</span>
          <span class="add-article" v-if="article.notes">加
                </span>
        </li>
        <li class="car-title-item car-content-item" style="width: 15%;vertical-align: top;">{{article.count}}</li>
        <li class="car-title-item car-content-item" style="width: 20%;text-align: right; vertical-align: top">¥{{formatMoney(article.price||0)}}</li>
      </div>

      <div v-if="article.type==3 && !article.tempRefundCount" style="margin-left: 5px;" v-for="item in article.mealItems">
        <li class="car-title-item car-content-item" style="width: 15%;text-align: center;visibility: hidden">
        <li class="car-title-item car-content-item" style="width: 40%;">
          <span style="display: inline-block;width: 80%;">{{item.name}}</span>
        </li>
        <li class="car-title-item car-content-item" style="width: 15%;vertical-align: top;">{{item.count}}</li>
        <li class="car-title-item car-content-item" style="width: 20%;text-align: right; vertical-align: top">¥{{formatMoney(item.price)}}</li>
      </div>


      <div v-show="article.tempRefundCount">
        <li class="car-title-item car-content-item" style="width: 15%;text-align: center;visibility: hidden;">
          <svg style="width: 14px;height: 14px;" aria-hidden="true">
            <use xlink:href="#icon-duihao"></use>
          </svg>
        </li>
        <li class="car-title-item car-content-item" style="width: 40%;color: #999999; ">
          <span style="display: inline-block;width: 80%;text-decoration: line-through;">{{article.name}}</span>
          <span style="display: inline-block; width: 20px;height: 20px;margin-left: -4%; text-align: center;vertical-align: top;
                       background-color: #ef5350;color: #FFFFFF;border-radius:50%;" v-show="article.tempRefundCount">退</span>
        </li>
        <li class="car-title-item car-content-item" style="width: 15%;text-decoration: line-through;color:#999999 ;vertical-align: top;">{{article.tempRefundCount}}</li>
        <li class="car-title-item car-content-item" style="width: 20%;text-decoration: line-through;text-align: right; color: #999999;vertical-align: top;">¥ {{formatMoney((article.tempRefundCount * article.unitPrice || 0))}}</li>
      </div>
      <div v-show="article.tempGrantCount">
        <li class="car-title-item car-content-item" style="width: 15%;text-align: center;visibility: hidden;">
          <svg style="width: 14px;height: 14px;" aria-hidden="true">
            <use xlink:href="#icon-duihao"></use>
          </svg>
        </li>
        <li class="car-title-item car-content-item" style="width: 40%;color: #999999; ">
          <span style="display: inline-block;width: 80%;text-decoration: line-through;">{{article.name}}</span>
          <span style="display: inline-block; width: 20px;height: 20px;margin-left: -4%;
                        text-align: center;vertical-align: top;
                       background-color: #75C2AF;color: #FFFFFF;border-radius:50%;" v-show="article.tempGrantCount">赠</span>
        </li>
        <li class="car-title-item car-content-item" style="width: 15%;text-decoration: line-through;color:#999999 ;vertical-align: top;">{{article.tempGrantCount}}</li>
        <li class="car-title-item car-content-item" style="width: 20%;text-decoration: line-through;text-align: right; color: #999999;vertical-align: top;">¥ {{formatMoney((article.tempGrantCount * article.unitPrice || 0))}}</li>
      </div>

      <div v-if="article.type==3 && article.tempRefundCount" style="margin-left: 5px;" v-for="item in article.mealItems">
        <li class="car-title-item car-content-item" style="width: 15%;text-align: center;visibility: hidden">
        <li class="car-title-item car-content-item" style="width: 40%;">
          <span style="display: inline-block;width: 80%;text-decoration: line-through;color:#999999;">{{item.name}}</span>
        </li>
        <li class="car-title-item car-content-item" style="width: 15%;vertical-align: top;text-decoration: line-through;color:#999999;">{{item.count}}</li>
        <li class="car-title-item car-content-item" style="width: 20%;vertical-align: top;text-decoration: line-through;color:#999999; text-align: right;">¥{{formatMoney(item.price)}}</li>
      </div>
    </ul>
  </div>
</template>

<script>
  import { mapGetters, mapActions } from 'vuex'
  import bus from '../../utils/bus'
  export default {
    name: "payCar",
    props:['shopDetail', 'orderInfo'],
    mounted(){
      this.$store.commit("setShopDetail", this.shopDetail)
      this.$store.commit("setOrderInfo", this.orderInfo)
      let orderId = this.$route.params.orderId;
      this.$store.dispatch('getOrderItemlistByOrderId', orderId);
      bus.$on("padCreatedOrder", (result) => {
        let orderId = this.$route.params.orderId;
        this.$store.commit("setOrderInfo", this.orderInfo)
        this.$store.dispatch('getOrderItemlistByOrderId', orderId);
      })

    },
    computed: {
      ...mapGetters({
        car: 'car'
      })
    },
    methods:{
      formatMoney(money){
        return this.$utils.formatMoney(money || 0);
      },
    }
  }
</script>

<style scoped>
  .icon {
    width: 40px;
    height: 40px;
    vertical-align: -0.15em;
    fill: currentColor;
    overflow: hidden;
  }


  .car-title {
    width: 100%;
    color: #666;
  }
  .car-title .car-title-item {
    font-size: 14px;
    display: inline-block;
    padding-top: 1%;
    padding-bottom: 1%;
  }
  .car-content {
    /*border-top: dashed 1px black;*/
  }
  .car-content-item {
    font-size: 14px;
    word-wrap: break-word;
    color: #666;
  }
  .add-article {
    display: inline-block;
    width: 20px;height: 20px;
    text-align: center;vertical-align: top;
    background-color: #75C2AF;color: #FFFFFF;
    border-radius:50%;margin-left: -4%;
  }
</style>
