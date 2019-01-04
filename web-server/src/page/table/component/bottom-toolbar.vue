<template>
  <el-row class="bottomToolbar"
      v-if="bottomToolBtns.callNumberBtn || bottomToolBtns.orderBtn || bottomToolBtns.payBtn || bottomToolBtns.payBtn || bottomToolBtns.changeOrderBtn || bottomToolBtns.changeTableBtn || bottomToolBtns.rushBtn || bottomToolBtns.checkedWeightBtn || bottomToolBtns.canCelBtn"
  >
    <!--<el-col :span="21">-->
      <el-button size="large" class="bottomToolbarBtn" @click="operation('call')" v-if="(shopModel == 2 || shopModel == 7) && bottomToolBtns.callNumberBtn"
                 :disabled="!bottomToolBtns.callNumberBtn">叫号
      </el-button>
      <el-button size="large" class="bottomToolbarBtn" @click="operation('order')" v-if="(shopModel != 2 && shopModel != 7) && bottomToolBtns.orderBtn"
                 :disabled="!bottomToolBtns.orderBtn">点餐
      </el-button>
      <el-button size="large" class="bottomToolbarBtn" @click="operation('pay')" v-if="(shopModel != 2 && shopModel != 7) && bottomToolBtns.payBtn"
                 :disabled="!bottomToolBtns.payBtn">买单
      </el-button>
      <el-button size="large" class="bottomToolbarBtn" @click="operation('refund')" v-if="bottomToolBtns.changeOrderBtn"
                 :disabled="!bottomToolBtns.changeOrderBtn">退菜
      </el-button>
      <el-button size="large" class="bottomToolbarBtn" @click="operation('change')" v-if="(shopModel != 2 && shopModel != 7) && bottomToolBtns.changeTableBtn"
                 :disabled="!bottomToolBtns.changeTableBtn">换桌
      </el-button>
      <el-button size="large" class="bottomToolbarBtn" @click="operation('rush')" v-if="(shopModel != 2 && shopModel != 7) && bottomToolBtns.rushBtn"
                 :disabled="!bottomToolBtns.rushBtn">催菜
      </el-button>
      <el-button size="large" class="bottomToolbarBtn" @click="operation('check')" v-if="(shopModel != 2 && shopModel != 7) && bottomToolBtns.checkedWeightBtn"
                 :disabled="!bottomToolBtns.checkedWeightBtn">核重
      </el-button>
    <el-button size="large" class="bottomToolbarBtn" @click="operation('grant')" v-if="(shopModel != 2 && shopModel != 7) && bottomToolBtns.grantBtn"
               :disabled="!bottomToolBtns.grantBtn">赠菜
    </el-button>
      <el-button size="large" class="bottomToolbarBtn" @click="operation('cancel')" v-if="(shopModel != 2 && shopModel != 7) && bottomToolBtns.canCelBtn"
                 :disabled="!bottomToolBtns.canCelBtn">取消
      </el-button>
    <!--</el-col>-->
  </el-row>
</template>

<script>
  import bus from '../../../utils/bus'
  import {getOrderInfoTest} from 'api/api';

  /**
   * todo  后续优化
   * 操作事件，可对应更改为 even bus 事件传递，更为方便
   * 不同状态的对应操作按钮：https://sfault-image.b0.upaiyun.com/999/127/999127784-5acf13819be67_articlex
   * lmx
   */
  export default {
    name: 'bottomToolbar',
    data() {
      return {
        shopDet: {},
        shopModel: '',
        bottomToolBtns: {
          callNumberBtn: false,
          orderBtn: false,
          payBtn: false,
          changeTableBtn: false,
          changeOrderBtn: false,
          canCelBtn: false,
          rushBtn: false,
          grantBtn: false
        }
      };
    },
    watch: {
      "$route.params": {
        handler: function ({orderId}) {
          setTimeout(() => {
            this.changeOrder(orderId);
          },500)
        },
        deep: true
      }
    },
    mounted() {
      this.shopDet = JSON.parse(sessionStorage.getItem("shopDet"));
      this.shopModel = this.shopDet.shop_mode;
      setTimeout(()=>{
        this.changeOrder(this.$route.params.orderId);
      },500)
      bus.$on("weightSuccess", ()=>{
        this.changeOrder(this.$route.params.orderId);
      });

      bus.$on("normalOrder", result => {
        if(result && result.data){
          if(result.data == this.$route.params.orderId){
            this.bottomToolBtns.canCelBtn = false
          }
        }

      })
    },
    beforeDestroy () {
      bus.$off("weightSuccess");
      bus.$off("normalOrder");
    },
    methods: {
      changeOrder(orderId){
        this.bottomToolBtns = {
          callNumberBtn: false,
          orderBtn: false,
          payBtn: false,
          changeTableBtn: false,
          changeOrderBtn: false,
          canCelBtn: false,
          checkedWeightBtn: false,
          rushBtn: false
        };
        if (!orderId) {
          return;
        }
        let that = this;
        getOrderInfoTest(orderId, function (orderInfo) {
            let count = 0;
            for (var item of orderInfo.orderItemList) {
              count += item.count
            }
            bus.$emit('articleCount', count)
            let orderState = orderInfo.order_state;
            let productionStatus = orderInfo.production_status;
            let payMode = orderInfo.pay_mode;
            let orderPayMode = orderInfo.pay_mode == 3 || orderInfo.pay_mode == 4;
            if (that.shopModel == 2 || that.shopModel == 7) {
              //  电视叫号
              that.bottomToolBtns = {
                callNumberBtn: productionStatus == 2 || productionStatus == 3,        //  待叫号 || 已叫号
                changeOrderBtn: productionStatus == 2 || productionStatus == 3,       //  待叫号 || 已叫号
                // payBtn: orderState == 1 && (payMode == 3 || payMode == 4),         //  付款中
                // canCelBtn: orderState == 1 && (payMode == 3 || payMode == 4)       //  付款中
              };
            } else if (that.shopModel == 6) {                 //  大BOSS
              if (that.shopDet.allow_first_pay == 0) {        //  先付
                that.bottomToolBtns = {
                  // orderBtn: (productionStatus == 0 || productionStatus == 2),                                                       //  待下单 || 已支付
                  orderBtn: productionStatus == 0 || (productionStatus == 2 && !orderPayMode) || (productionStatus == 2 && orderState == 2),                                                       //  待下单 || 已支付
                  payBtn: productionStatus != 0 && (orderState == 1 || (orderState == 1 && (payMode == 3 || payMode == 4))),      //  !待下单 && 未支付 || 付款中
                  //changeTableBtn: productionStatus == 2 || (orderState == 1 && (payMode == 3 || payMode == 4)),                   //  已消费 || 付款中
                  //changeOrderBtn: productionStatus == 2, //  已消费
                  changeTableBtn: orderState == 2,                   //  已消费 || 付款中
                  changeOrderBtn: orderState == 2,
                  canCelBtn: productionStatus != 2,                                                                               //  待下单 || 未支付 || 付款中
                  rushBtn: productionStatus == 2,
                };
              } else if (that.shopDet.allow_after_pay == 0) {  //  后付
                that.bottomToolBtns = {
                  orderBtn: (orderState == 0 || orderState == 1) && (payMode != 3 && payMode != 4),                               //  待下单 || 未支付  ；#3536 2018年4月24日 今日接到需求，后付款模式如果已支付则暂时不支持加菜
                  payBtn: productionStatus != 0 && (orderState == 1 || (orderState == 1 && (payMode == 3 || payMode == 4))) && count > 0 || productionStatus != 0 && (orderState == 1 || (orderState == 1 && (payMode == 3 || payMode == 4))) && orderInfo.grant_money > 0 && count == 0,      //  未支付 || 付款中
                  // changeTableBtn: orderState == 1 || productionStatus == 2,                                                       //  未支付 || 已消费
                  changeTableBtn: orderState == 1,                                                       //  未支付 || 已消费
                  changeOrderBtn: productionStatus != 0 &&(orderState == 1 || productionStatus == 2),                             //  已消费
                  canCelBtn: productionStatus != 2,                                                                               //  待下单 || 未支付 || 付款中
                  checkedWeightBtn: orderInfo.need_confirm_order_item,                                                             //  只要订单未核重，则都可以
                  rushBtn: productionStatus != 0 &&(orderState == 1 || productionStatus == 2),
                  //grantBtn: productionStatus != 0 &&(orderState < 2 || productionStatus == 2),
                  grantBtn: orderState != 2,
                };
              }
            }
            //  外带情况下 不允许加菜，换桌，取消订单操作
            if(that.$route.path.indexOf("/table/packaging") != -1){
              that.bottomToolBtns.orderBtn = orderState == 1;
              that.bottomToolBtns.changeTableBtn = false;
              that.bottomToolBtns.canCelBtn = false;
            }
        });
      },
      operation(type) {
        console.log(type);
        this.$emit(type);
      }
    }
  };
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
  .bottomToolbar {
    bottom: 0px;
    width: 100%;
    height: 60px;
    line-height: 60px;
    padding-left: 10px;
    background-color: #fff;
  }

  .bottomToolbarBtn {
    background-color: #000;
    width: 80px;
    height: 40px;
    font-size: 18px;
    color: #fff;
    border-radius: 5px;
  }

  button:disabled {
    border: 1px solid #DDD;
    background-color: #eef1f6;
    color: #bfcbd9;
  }
</style>
