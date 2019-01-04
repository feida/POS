<template>
  <el-row style="height: 100%; background-color: #eee;" class="pay">
    <!--  左侧订单详情   -->
    <el-col :span="7" class="left-wrapper" >
      <div v-if="orderInfo.id" style="background-color: #eee">
        <CarDetail :orderInfo="orderInfo" :shopModel="shopModel"></CarDetail>
        <div :style="{ height: carTableHeight + 'px' }" style="overflow-y: hidden;background-color: #FFFFFF; margin-top: 5px;" id="order-detail-wrapper" >
          <div class="order-page-wrapper" id="order-page-wrapper">
            <div class="pre-page" @click="orderPageOperation(-1)"><span class="el-icon-caret-top" style="font-size: 26px;margin-left: 2px;"></span></div>
            <div class="next-page" @click="orderPageOperation(1)"><span class="el-icon-caret-bottom" style="font-size: 26px;margin-top: 4px;margin-left: 2px;"></span></div>
          </div>
          <!--购物车 菜品详情-->
          <payCar :shopDetail="shopDet" :orderInfo="orderInfo"></payCar>
        </div>
      </div>

      <div class="car-footer">
        <el-row>
          <el-col :span="24" class="operate-item">
            <div>
              合计: <font color="red">{{!!orderInfo.count_with_child ? orderInfo.count_with_child : orderInfo.article_count}}</font> 项
            </div>
            <div>
              总计: <font color="red">￥{{ formatMoney(orderInfo.amount_with_children || orderInfo.order_money) }}</font>
            </div>
          </el-col>
        </el-row>


        <el-row type="flex" justify="space-around" style="height: 45px;margin-top: 5px">
          <el-col :span="12" style="text-align: center;">
            <el-button class="pay-btn-style"  @click="skipIndex" v-if="shopDet.allow_after_pay == 0 && orderInfo.distribution_mode_id == 1">返回</el-button>
            <el-button class="pay-btn-style"  @click="cancel" v-if="shopDet.allow_after_pay == 0 && orderInfo.distribution_mode_id == 3">取消</el-button>
            <el-button class="pay-btn-style" @click="cancel" v-if="shopDet.allow_first_pay == 0">取消</el-button>
          </el-col>
          <el-col :span="12" style="text-align: center;">
            <el-button class="pay-btn-style" style="background-color: #ffbf34;color: #ffffff;"  @click="confirmPay"   v-loading.fullscreen.lock="loading" element-loading-text="结算中..." v-if="shopDet.allow_first_pay == 0 && orderInfo.order_state <2">结账下单</el-button>
            <el-button class="pay-btn-style" style="background-color: #ffbf34;color: #ffffff;"  @click="confirmPay"   v-loading.fullscreen.lock="loading" element-loading-text="结算中..." v-if="shopDet.allow_first_pay == 0 && orderInfo.order_state>=2">结&nbsp;&nbsp;&nbsp;&nbsp;账</el-button>
            <el-button class="pay-btn-style" style="background-color: #ffbf34;color: #ffffff;"  @click="confirmPay" v-loading.fullscreen.lock="loading" element-loading-text="结算中..." v-if="shopDet.allow_after_pay == 0">结&nbsp;&nbsp;&nbsp;&nbsp;账</el-button>
          </el-col>
        </el-row>
      </div>
    </el-col>

    <!--  支付方式   -->
    <el-col :span="17" class="right-wrapper">
      <el-row class="pay-wrapper">
        <el-col :span="20" class="pay-info" id="payInfo">
          <el-row>
            <!-- 折扣显示区 -->
            <topLeftArea :formatMoney="formatMoney"></topLeftArea>
            <!-- 支付显示区 -->
            <topRightArea></topRightArea>
          </el-row>

          <!--支付方式展示区域-->
          <el-row class="pay-show-wrapper">
            <el-col :span="10" style="background-color: #fff;">
              <hasPayArea></hasPayArea>
            </el-col>
            <!--键盘区域-->
            <el-col :span="14" style="height: 100%; background-color: #eee;border-left: 12px solid #eee;">
              <keyBoard></keyBoard>
            </el-col>
          </el-row>

          <el-row class="bottom-btn-wrap">
            <el-col :span="24" class="operate-footer">
              <el-button size="large" class="operate-footer-button" @click="orderDiscount()">折扣</el-button>
              <!--<el-button size="large" class="operate-footer-button" @click="onErasing()" :disabled="false">抹零</el-button>-->
              <el-button size="large" class="operate-footer-button" @click="$store.commit('initonErasing')" :disabled="false">抹零</el-button>
              <el-button size="large" class="operate-footer-button" @click="printPreOrder()" :disabled="false">打印预结单</el-button>

              <!--<el-button class="operate-footer-button" @click="continueOrder()" v-if="shopDet.allow_first_pay == 0"  :disabled="false">继续点餐</el-button>-->
              <el-button size="large" class="operate-footer-button" @click="resumeDiscount()" :disabled="(orderPayType.length ) > 0 ? true : false" v-if="shopDet.allow_after_pay == 0">恢复原价</el-button>
              <el-button size="large" class="operate-footer-button" v-if="orderInfo.customer_id && orderInfo.customer_id != 0 " @click="getAccountMoney()">余额</el-button>

            </el-col>
          </el-row>
        </el-col>

        <!-- 右边区域 -->
        <el-col :span="4" class="pay-type-wrapper">
          <payType></payType>
        </el-col>
      </el-row>
    </el-col>
    <!-- 折扣 -->
    <discountPay></discountPay>
    <!-- 扫码支付弹窗-->
    <el-dialog title="扫码支付 " :visible.sync="scanPay.dialogVisible" :close-on-click-modal="false" width="30%" :before-close="cancelScanPay" center>
      <template>
        <el-row>
          <el-col :span="24"><h2>还需支付：￥{{formatMoney(this.currentPayType.money )}}</h2></el-col>
        </el-row>
        <el-row>
          <el-col :span="24">
            <h2 style="margin: 15px 0;">支付方式：</h2>
          </el-col>
        </el-row>
        <el-row>

          <el-col :span="24" v-if="scanPay.currentType.id == 1">
            <el-col :span="8" :offset="8">
              <div style="margin: 15px 20px;padding:20px 0;text-align: center">
                <div>
                  <svg class="icon" aria-hidden="true" style="width: 60px; height: 60px;">
                    <use :xlink:href=icon[1]></use>
                  </svg>
                </div>
                <div style="font-size: 22px;">微信支付</div>
              </div>
            </el-col>
          </el-col>

          <el-col :span="24" v-if="scanPay.currentType.id == 10">
            <div style="margin: 15px 20px;padding:20px 0;text-align: center">
              <div>
                <svg class="icon" aria-hidden="true" style="width: 60px; height: 60px;">
                  <use :xlink:href=icon[10]></use>
                </svg>
              </div>
              <div style="font-size: 22px;">支付宝</div>
            </div>
          </el-col>
          <el-col :span="24" v-if="this.scanPay.currentType.id == 2">
            <div style="margin: 15px 20px;padding:20px 0;text-align: center">
              <div>
                <svg class="icon" aria-hidden="true" style="width: 60px; height: 60px;">
                  <use :xlink:href=icon[2]></use>
                </svg>
              </div>
              <div style="font-size: 22px;">R+支付</div>
            </div>
          </el-col>
          <div style="text-align: center;"  class="scan-paying" v-if="scanPay.paying == true">
            <img src="../../assets/payload.gif" alt="" style="margin-top: 15px;">
            <div style="color: #FFFFFF;text-align: center;font-size: 22px;">
              订单支付中
            </div>
          </div>
          <div style="text-align: center;"  class="scan-paying" v-if="scanPay.failed == true">
            <img src="../../assets/failed.png" alt="" style="margin-top: 15px;">
          </div>
        </el-row>
        <el-row>
          <el-col :span="24">
            <el-input v-model="scanPay.scanValue" @keyup.enter.native="getScanValue($event)"
                      :disabled = "isPaying"
                      :autofocus="autoFocus" placeholder="请扫码顾客支付二维码"  v-focus id="scanPayInput"></el-input>
          </el-col>
        </el-row>
      </template>
      <span slot="footer" class="dialog-footer">
        <el-button v-if="this.scanPay.currentType.id == 10 && shopModel != 7" @click="localAlipay()">选择线下支付宝支付</el-button>
        <el-button v-if="this.scanPay.currentType.id == 1 && shopModel != 7" @click="localAlipay()">选择线下微信支付</el-button>

        <el-button v-if="this.scanPay.currentType.id == 2" @click="readCardpay()" :disabled = "isReadCardPay">{{isReadCardPay ? '支付中' : '读卡支付'}}</el-button>

        <el-button  @click="cancelScanPay">取 消</el-button>
      </span>
    </el-dialog>
  </el-row>
</template>

<script>
  import {getOrderDetail,
    payOrder,
    getPaymentSelectByOrderId,
    updateRemoteOrderPaymode,
    updateOrderSyncState,
    getNoPayChildrenOrderList,
    printTotal,
    printKitchenTotal,
    printOrder,
    getOrderItemByOrderId,
    platformPayOrder,
    getBatchInsertPayment,
    cancelOrder,
    getOrderInfoTest,
    getOrderFullInfoWithChildren,
    resumeDiscount,
    getNewKitchenTemplate,
    readCard,
    readCardPayMent,
    updateOrderStateAndMoney,
    insertPayment,
    openCashbox,
    verificationOfOrders,
    emqttOnline
  } from 'api/api';
  import {formatDate} from '../../utils/generalUtil';
  import bus from '../../utils/bus'
  import payMode from '../../utils/payMode'
  import CarDetail from '../../components/basic/car-detail'
  import keyBoard from '../../components/pay/keyBoard'
  import payType from '../../components/pay/payType'
  import payCar from '../../components/pay/payCar'
  import hasPayArea from '../../components/pay/hasPayArea'
  import topLeftArea from '../../components/pay/topLeftArea'
  import topRightArea from '../../components/pay/topRightArea'
  import discountPay from '../../components/pay/discountPay'
  import {mapGetters} from 'vuex'
  export default {
    name: 'pay',
    components: {CarDetail, payType, payCar, keyBoard, hasPayArea, topLeftArea, topRightArea, discountPay},
    data() {
      return {
        maskHeight: 0, // 遮罩层的高度
        panelTitleHeight: 0, // 客单的高度
        confirmOrderPay: 0, // 微信银行卡或者现金支付本地需要支付的
        cardMoney: 0,
        reMoney: 0,
        coupanPay: 0 ,// 优惠券
        orderPaymentMap:{},
        showDetails: false,
        needPay:0,
        carTableHeight: 0,
        payTableHeight: 0,
        orderId: null,
        totalMoney: '',
        payType: {},
        payProgress: 0,     // 支付金额 进度
        oddChange: 0,     // 找零
        payMode: 1, //  支付方式：  微信支付/支付宝支付 > 银联 > 现金 > 大众点评 > 积分
        shopDet: {},
        shopModel: '',
        customerInfo:{},
        // onErasingDialogVisible: false,
        discountTitle: '',
        selectDiscountActive: '',
        labelPosition: 'left',
        tempNeedPay: 0,
        tempDiscountMoney: '0',
        selectDiscountString:'',
        newNumber:'',
        autoFocus: true,
        regNumber: '',
        scanInput: false,
        isCloseScanDialog: true,
        isRepeatScan: true,

        isPaying: false,

        loading:false,
        isLocalAlipay: false,
        wechatInfo: {},
        remindMoney: 0, // 剩余需要支付的
        showMoney: {
          earsMoney: 0,
        },
        // paymentItems:[],
        occupyValue: 0,
        customerId:'',
        isReadCardPay : false,
        timeDifference : 500,
        isClickAccount: false,
        wsConnect: false,
      };
    },
    watch: {
      orderPayType: {
        handler: function (newVal) {
          this.$store.commit('setPayTypeChange')
        },
        deep: true
      },
      orderInfo: {
        handler: function (newVal) {
        },
        deep: true
      },
      currentOrderInfo: {
        handler: function (newVal) {
          this.$store.commit("setPayInfo", newVal)


          this.$store.commit("setPayTypeChange")

          // this.$store.commit("setCustomerId", newVal.customer_id||null)
        },
        deep: true
      },
      scanPay: {
        handler: function (newVal) {
          if (!newVal.dialogVisible) return;
          this.$nextTick(()=>{
            document.getElementById("scanPayInput").children[0].focus();
          });
        },
        deep: true
      },
      payInfo: {
        handler: function (newVal) {
        },
        deep: true
      }
    },
    created () {
      this.shopDet = JSON.parse(sessionStorage.getItem("shopDet"));
      this.shopModel = this.shopDet.shop_mode;
      this.$store.commit('setFormatDiscount');
      this.$store.commit('setShopDetail', this.shopDet)
      this.$store.commit('setOrderPayType')
      this.initWsConnect()
    },
    computed: {
      ...mapGetters({
        orderPayType: 'orderPayType',
        orderInfo: 'orderInfo',
        currentPayType: 'currentPayType',
        payInfo: 'payInfo',
        scanPay: 'scanPay',
        formatDiscount: 'formatDiscount',
        currentOrderInfo: 'currentOrderInfo',
        icon: 'icon',
        paymentItems: 'paymentItems'
      })
    },

    directives: {
      focus: {
        update: function (el, {value}) {
          if (value) {
            el.focus()
          }
        }
      }
    },

    mounted() {
      this.orderId = this.$route.params.orderId;
      this.initOrder();
      this.initHeight();
      bus.$on("wsNewOrder", (data)=> {
        console.log("%c 微信推来新订单", "background-color: green;");
        this.initOrder(this.orderId);
      })
      bus.$on("padCreatedOrder", (result) => {
        this.$message.success(result.message)
        getOrderDetail(this.$route.params.orderId,  (data) =>{
          this.initOrder();
        })
      })
      bus.$on("normalOrder", resultData => {
        let orderId = this.$route.params.orderId;
        if (orderId == resultData.data) {
          this.$notify.success(resultData.msg);
          this.$store.commit("setOrderInfo", this.orderInfo)
          this.$store.dispatch('getOrderItemlistByOrderId', orderId);
          this.initOrder();
        }
      })
      bus.$on("getUserBalance", () => {
        setTimeout(() => {
          this.getUserBalance();
        }, 500)
      })
    },
    beforeDestroy () {
      bus.$off("wsNewOrder");
      bus.$off("getUserBalance");
      bus.$off("padCreatedOrder")
      bus.$off("normalOrder")
    },
    methods: {
      initWsConnect(){
        emqttOnline( (websocketOnline) => {
          console.log('emqttOnline',websocketOnline)
          this.wsConnect = websocketOnline;
        })
      },
      initOrder() {
        let currentOrderId = this.$route.query.suborderId || this.orderId;
        if (this.shopModel == 6 && this.shopDet.allow_after_pay == 0) {
          currentOrderId = this.orderId
        }
        this.$store.commit('setOrderId', this.orderId);
        this.$store.commit('setCurrentOrderId', currentOrderId)
        this.$store.dispatch('getOrderDetail', this.orderId)
        this.$store.dispatch('getCurrentOrderDetail', currentOrderId);
        this.$store.dispatch('getDiscountInfo', currentOrderId);
        this.$store.dispatch('getPaymentSelectByOrderId', currentOrderId)
        setTimeout(() => {
          this.getUserBalance();
        }, 500)
      },

      // 获取用户余额
      getUserBalance(){
        let toPayIdList = [];
        this.orderPayType.map(item => {
          if (item.type == 2 || item.type == 3) {
            toPayIdList.push(item.toPayId);
          }
        })
        if (toPayIdList && toPayIdList.length > 0) return;
        if(this.orderInfo.data_origin == 0) return;
        let currentOrderId = this.$route.query.suborderId || this.orderId;
        this.$socket.getAccountInfo(currentOrderId,  (result) => {
          let wechatInfo = JSON.parse(result);
          if ((this.currentOrderInfo.pay_mode == 3 || this.currentOrderInfo.pay_mode == 4)) return;
          if(wechatInfo.paymentItem) {
            var paymentItem = JSON.parse(wechatInfo.paymentItem)
          }
          // this.paymentItems = [];
          if (paymentItem && paymentItem.payValue > 0 && toPayIdList.indexOf(`${paymentItem.toPayId}`) == -1) {
            this.paymentItems.push(paymentItem);
            this.orderPayType.push({
              toPayId: paymentItem.toPayId,
              type:3,
              icon: "#icon-youhuiquan",
              money: wechatInfo.useCouponValue,
              isOccupation: true
            });
            this.occupyValue = wechatInfo.useCouponValue || 0
          }
          if(wechatInfo.accountPayValue > 0 && toPayIdList.indexOf(`${wechatInfo.accountId}`) == -1) {
            this.orderPayType.push({
              toPayId: wechatInfo.accountId,
              type:2,
              icon: "#icon-yue",
              money: wechatInfo.accountPayValue
            })
          }
          if(wechatInfo.couponValue > 0 && toPayIdList.indexOf(`${wechatInfo.couponId}`) == -1) {
            this.orderPayType.push({
              toPayId:wechatInfo.couponId,
              type:3,
              icon: "#icon-youhuiquan",
              money:wechatInfo.couponValue
            })
          }
        }, function (error) {
          //  请求出错时的回调
          // console.log(error);
        });
      },

      formatDate(date) {
        return formatDate(new Date(parseInt(date)), 'yyyy-MM-dd hh:mm:ss');
      },

      cancel() {
        let that = this;
        let cancleOrderId = this.$route.query.suborderId || this.orderId;
        this.$confirm('是否取消支付？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(() => {
          cancelOrder(cancleOrderId, function () {
            that.$socket.posCancelOrder(cancleOrderId);
            if (that.shopModel == 2 || that.shopModel == 7) {
              that.$router.push('/tvorder?payConfirm=true&orderType=all');
            } else {
              that.$router.push('/table?payConfirm=true&orderType=all');
            }
          });
        }).catch(() => {
        });
      },

      skipIndex() { // 如果是后付模式
        let cancleOrderId = this.$route.query.suborderId
        if(this.orderInfo.order_state == 2 && cancleOrderId) {
          let that = this;
          this.$confirm('是否取消支付？', '提示', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }).then(() => {
            cancelOrder(cancleOrderId, function () {
              that.$socket.posCancelOrder(cancleOrderId);
              that.$router.push('/table?payConfirm=true&orderType=all');
            });
          }).catch(() => {
          });
        } else {
          this.$router.push("/table?payConfirm=false&orderType=all");
        }
      },

      getOrderPayMode (orderPaymentItem) {
        for (var i = 0; i < orderPaymentItem.length; i++) {
          let item = orderPaymentItem[i];
          var orderPayMode = {1:1, 5: 3, 10: 2, 12: 4, 2: 0, 26: 8, 27: 9, 28: 10};
          return orderPayMode[item.type];
        }
      },

      confirmPay() {
        let that = this;
        if(that.orderPayType.length <= 0 ) return that.$message.warning('请选择支付项');
        let hasPay = 0

        this.orderPayType.map(item=>{
          hasPay += item.money
        })
        if (Number(this.payInfo.remainMoney).toFixed(2) > 0) {
          return that.$message.warning(`剩余 【${this.formatMoney(this.payInfo.amountMoney)}】 元需要支付才能买单`);
        }

        let xianjinStaus = this.orderPayType.filter(item => item.type==12 );
        if (xianjinStaus.length>0){
          openCashbox(result => {})
        }

        this.loading = true;
        let data = this.orderInfo;
        if((data.pay_mode == 3 || data.pay_mode == 4) && data.order_state == 1){// 本地 Pos 确认微信端发起的 现金支付或银联支付
          let orderPayMode = {
            id: data.id,
            is_pos_pay: 1, // 即使这里是微信端发起的支付请求，但是是pos端确认的所以仍然认为是pos端结算
            order_state: 2
          };
          updateRemoteOrderPaymode(orderPayMode, function () {
            //  先付情况下，确认支付后  打印厨打
            if(that.shopDet.allow_first_pay == 0){
              // printKitchenTotal(that.orderId,1, 0);
              // 判断是否开启多动线 enable_duo_dong_xian 0 是开启
              if (that.shopDet.enable_duo_dong_xian) {
                printKitchenTotal(that.orderId, 1, null, null, null, function (data) {});
              } else {
                getNewKitchenTemplate(that.orderId, 1, null, null, null, function (data) {})
              }
            }
            that.$socket.confirmOrder(data.id);
            that.$router.push('/table?payConfirm=true&orderType=all');
            bus.$emit("refresh-turnover");
          });
        } else {
          // 如果支付项中有现金支付，则把支付项中所有的金额相加 然后比较是否超出应付金额，如果超出应付金额，则现金支付项需要改成剩余需要支付的钱
          this.verifiCashMoney();
          let formatOrderId = that.$route.query.suborderId || that.orderId;
          setTimeout(() => { that.loading = false; }, 15 * 3000)
          let isScanPay = false;
          let servicePrice = that.orderInfo.service_price;
          let orderPayMode = that.getOrderPayMode(that.orderPayType);
          if (that.orderPayType.length > 1) orderPayMode = 99;
          this.formatDiscount.customerId = this.orderInfo.customer_id;
          var list = that.orderPayType.filter( item => {
            return !item.isOccupation;
          })
          console.log('navigator.onLine',navigator.onLine)
          //if (navigator.onLine) {
          if (this.wsConnect) {
            let verInfo = {
              orderId: this.orderInfo.id,
              type: ''
            }
            verificationOfOrders(verInfo, function (result) {
              let data = JSON.parse(result);
              if (data && data.success) {
                var verInfo = {
                  orderId: that.orderInfo.id,
                  type: 1,
                }
                verificationOfOrders(verInfo, (result) =>{
                  let data = JSON.parse(result);
                  if(data && data.success) {
                    payOrder(formatOrderId, list, orderPayMode||0, that.formatDiscount, isScanPay, servicePrice, function (payResult) {
                      console.log('payResult',payResult)
                      if(!payResult.success && payResult.message) {
                        that.loading = false;
                        let id = that.$route.params.orderId;
                        if (that.shopModel == 2 || that.shopModel == 7) {
                          sessionStorage.setItem("pay-last-orderId", id)
                          that.$router.push("/table/eatin?type=wait&payConfirm=true&orderType=all")
                        } else {
                          that.$router.push('/table?payConfirm=true&orderType=all');
                        }
                        that.$message(payResult.message);
                        return;
                      }
                      if(that.paymentItems && that.paymentItems.length > 0) {
                        getBatchInsertPayment(that.paymentItems, function () { //将占用的优惠券插入本地
                          that.paymentItems = [];
                        });
                      }
                      getPaymentSelectByOrderId(that.orderId, function (orderPayments) {
                        // bus.$emit("refresh-turnover");
                        if(that.shopDet.shop_mode == 2 || that.shopDet.shop_mode == 7){  //  如果是电视叫号模式则 给电视端发消息
                          that.$tvSocket.newOrder(data);
                        }
                      });
                      that.printTotalOrder();
                      that.loading = false;
                      that.$message.success('支付完成~');
                      let id = that.$route.params.orderId;
                      if (that.shopModel == 2 || that.shopModel == 7) {
                        sessionStorage.setItem("pay-last-orderId", id)
                        that.$router.push("/table/eatin?type=wait&payConfirm=true&orderType=all")
                      } else {
                        that.$router.push('/table?payConfirm=true&orderType=all');
                      }
                    });
                  } else {
                    that.loading = false;
                    that.$message.warning(data.message)
                    setTimeout(()=>{
                      that.$router.push(`/table/eatin/detail/${that.orderInfo.id}`)
                    },3 * 1000)
                  }
                })
              } else {
                that.loading = false;
                that.$message.warning(data.message)
                setTimeout(()=>{
                  that.$router.push(`/table/eatin/detail/${that.orderInfo.id}`)
                },3 * 1000)
              }
            })
          } else {
            payOrder(formatOrderId, list, orderPayMode||0, that.formatDiscount, isScanPay, servicePrice, function (payResult) {
              if(that.paymentItems && that.paymentItems.length > 0) {
                getBatchInsertPayment(that.paymentItems, function () { //将占用的优惠券插入本地
                  that.paymentItems = [];
                });
              }
              getPaymentSelectByOrderId(that.orderId, function (orderPayments) {
                bus.$emit("refresh-turnover");
                if(that.shopDet.shop_mode == 2 || that.shopDet.shop_mode == 7){  //  如果是电视叫号模式则 给电视端发消息
                  that.$tvSocket.newOrder(data);
                }
              });
              that.loading = false;
              that.printTotalOrder();
              that.$message.success('支付完成~');
              let id = that.$route.params.orderId;
              if (that.shopModel == 2 || that.shopModel == 7) {
                sessionStorage.setItem("pay-last-orderId", id)
                that.$router.push("/table/eatin?type=wait&payConfirm=true&orderType=all")
              } else {
                that.$router.push('/table?payConfirm=true&orderType=all');
              }
            });
          }
        }
      },

      verifiCashMoney() {
        let money = 0;
        let totalMoney = 0
        let cashMoney = 0;
        for (var item of this.orderPayType) {
          totalMoney += +item.money
          if (item.type != 12) money += +(item.money)
        }

        cashMoney = Math.abs(this.payInfo.totalMoney - money);

        if (this.orderPayType.length == 1 && this.orderPayType[0].type == 12 && this.orderPayType[0].money != 0) this.orderPayType[0].money = this.currentOrderInfo.amount_with_children || this.currentOrderInfo.order_money;

        if (totalMoney > this.payInfo.totalMoney) {
          for (var item of this.orderPayType)
            if (item.type == 12) item.money = cashMoney
        }
      },
      printTotalOrder(){
        let that = this;
        let suborderId = this.$route.query.suborderId || null;
        let printOrderId = suborderId || this.orderId;
        if(this.shopModel == 2 || this.shopModel == 7 || (this.shopModel == 6 && this.shopDet.allow_first_pay == 0)){  // 先付
          if(this.shopDet.auto_print_total == 0){
            printTotal(printOrderId,1);
          }

          // 判断是否开启多动线 enable_duo_dong_xian 0 是开启
          if (this.shopDet.enable_duo_dong_xian) {
            printKitchenTotal(printOrderId, 1, null, null, null, function (data) {});
          } else {
            getNewKitchenTemplate(printOrderId, 1, null, null, null, function (data) {})
          }

          printOrder(printOrderId, function () {
            that.$socket.printSuccess(printOrderId);
          });
        }else if(this.shopModel == 6 && this.shopDet.allow_after_pay == 0){  // 后付 结算单
          printTotal(printOrderId,1,3);
          suborderId && printKitchenTotal(suborderId,1, null, null, null, () => {
            this.$socket.printSuccess(printOrderId);
          });
          if(this.orderInfo.distribution_mode_id == 3){ //  如果是后付外带，则打印厨打
            printKitchenTotal(printOrderId,1, null, null, null, null);
            //  修改打印状态
            printOrder(printOrderId, function () {
              that.$socket.printSuccess(printOrderId);
            });
          }
        }
      },
      orderPageOperation (operation) {
        var orderDetailWrapper = document.getElementById("order-detail-wrapper");
        if(operation == 1){  // 下一页
          orderDetailWrapper.scrollTop += orderDetailWrapper.clientHeight;
        }else{  //  上一页
          orderDetailWrapper.scrollTop -= orderDetailWrapper.clientHeight;
        }
      },
      formatMoney(money){
        return this.$utils.formatMoney(money || 0);
      },

      //=============================
      //======== 整单折扣区开始 ========
      //=============================
      orderDiscount() {
        this.$store.commit('initDiscount');
      },
      //=============================
      //======== 整单折扣区结束 ========
      //=============================

      //=============================
      //======== 扫码支付 =============
      //==============================
      cancelScanPay(){
        if(this.scanPay.paying == true) {
          this.$message.warning("订单支付中，请勿取消支付");
          return;
        }
        this.$store.commit("setSelectPayType", null)
        this.scanPay.dialogVisible = false;
        this.scanPay.paying = false; // 关闭弹窗
        this.scanPay.dialogVisible = false;
        this.scanInput = true;
        this.scanPay.scanValue = ''; // 清空二维码接受框
        this.isRepeatScan = true;
      },

      localAlipay(){
        this.isLocalAlipay = true;
        this.scanPay.dialogVisible = false;
        this.scanPay.paying = false; // 关闭弹窗
        this.scanPay.dialogVisible = false;
        this.scanInput = true;
        this.scanPay.scanValue = ''; // 清空二维码接受框
        this.isRepeatScan = true;
      },
      readCardpay(){  //读卡支付
        this.isReadCardPay = true
        let that = this
        readCard(function (result) {
          let cardId = result.card_id
          //let cardId = '4050106314829953'
          //let cardId = '8660386805806882'
          let readCardData = {
            shopId: sessionStorage.getItem("shopId"),
            brandId: sessionStorage.getItem("brandId"),
            authCode: cardId,
            totalAmount: that.payInfo.remainMoney,
            orderId: that.$route.query.suborderId || that.orderId
          };
          readCardPayMent.restoPay(readCardData).then((response)=>{
            if(response.stateCode == 200){
              let paymentItems = response.data.paymentItems
              let customerId = response.data.customerId
              let paymentMode = response.data.paymentMode
              let orderMoney = response.data.orderMoney
              let paymentAmount = response.data.paymentAmount
              let orderPosDiscountMoney = response.data.orderPosDiscountMoney
              let posDiscount = response.data.posDiscount
              let order = {
                id: that.$route.query.suborderId || that.orderId,
                stallName: that.shopDet.name,
                originalAmount: that.needPay,
                reductionAmount: response.data.reductionAmount,
                paymentAmount: response.data.paymentAmount,
                orderMoney: response.data.orderMoney,
                articleCount: !!that.orderInfo.count_with_child ? that.orderInfo.count_with_child : that.orderInfo.article_count,
                remark:that.orderInfo.remark,
                customerId: response.data.customerId,
                shopDetailId: sessionStorage.getItem("shopId"),
                brandId: sessionStorage.getItem("brandId"),
                distributionModeId: that.orderInfo.distribution_mode_id,
                verCode:that.orderInfo.ver_code,
                orderMode: that.shopModel,
                servicePrice:that.orderInfo.service_price,
                baseMoney: that.orderInfo.order_money,
                posDiscount: response.data.posDiscount,
                orderPosDiscountMoney:response.data.orderPosDiscountMoney,
                mealFeePrice: that.orderInfo.meal_fee_price,
                baseMealAllCount:that.orderInfo.meal_all_number,
                operatorId: sessionStorage.getItem("userId"),
              }
              let orderItemsList = []
              that.orderInfo.order_item_list.map((v,i) => {
                let orderItems = {
                  articleName: v.article_name,
                  count: v.count,
                  originalPrice: v.original_price,
                  unitPrice: v.unit_price,
                  baseUnitPrice: v.unit_price,
                  finalPrice: v.final_price,
                  remark: v.remark,
                  orderId: that.$route.query.suborderId || that.orderId,
                  articleId: v.article_id,
                  id: v.id,
                  type: v.type,
                  orginCount: v.orgin_count,
                  mealFeeNumber: v.meal_fee_number,
                  customerId: response.data.customerId,
                  weight: v.weight
                }
                orderItemsList.push(orderItems)
              })

              let orderData = {
                order: order,
                orderItems:orderItemsList
              }
              readCardPayMent.saveOrder(orderData).then((response) => {
                if(response.stateCode == 200){
                  let payMentData = {
                    orderId: that.$route.query.suborderId || that.orderId,
                    code: cardId
                  }
                  readCardPayMent.savePayment(payMentData).then((response)=>{
                    if(response.stateCode == 200){
                      let id = that.$route.query.suborderId || that.orderId;
                      let changeSatusData = {
                        orderId: id,
                        state: 2,
                        actualMoney: orderMoney,
                        orderPosDiscountMoney: orderPosDiscountMoney,
                        posDiscount: posDiscount,
                        payMode: paymentMode
                      }
                      that.formatDiscount.customerId = customerId
                      that.formatDiscount.onDiscount.discountRate = posDiscount
                      that.formatDiscount.onDiscount.realDiscountRate = posDiscount
                      that.formatDiscount.amountMoney = paymentAmount
                      that.formatDiscount.discountMoney = orderPosDiscountMoney
                      payOrder(that.$route.query.suborderId || that.orderId, '', '', that.formatDiscount, false, that.orderInfo.service_price,  (result) => {

                      })
                      updateOrderStateAndMoney(changeSatusData,function (result) {
                        that.printTotalOrder();
                        that.$message.success('支付完成~');
                        let id = that.$route.params.orderId;
                        sessionStorage.setItem("pay-last-orderId", id)
                        sessionStorage.removeItem("earsMoney")
                        that.$router.push("/table/eatin?type=wait&payConfirm=true")
                      })
                      let tempPayment = []
                      paymentItems.map((v,i) => {
                        let tempItem = {
                          type: v.paymentModeId,
                          id: v.id,
                          payValue: v.payValue,
                          payTime: v.payTime,
                          toPayId: v.toPayId
                        }
                        tempPayment.push(tempItem)
                      })
                      let data ={
                        orderId: id,
                        paymentItems: tempPayment
                      }
                      insertPayment(data,function(result){
                        console.log('插入数据')
                      })
                      that.isReadCardPay = false
                      that.scanPay.dialogVisible = false;
                    }else{
                      that.$message.error(response.message);
                      that.isReadCardPay = false
                    }
                  }).catch((error)=>{
                    that.isReadCardPay = false
                    that.$message.error('支付异常');
                  })
                }else{
                  that.$message.error(response.message);
                  that.isReadCardPay = false
                }
              }).catch((error)=>{
                that.isReadCardPay = false
                that.$message.error('支付异常');
              })
            }else{
              that.$message.error(response.message);
              that.isReadCardPay = false
            }
          }).catch((error)=>{
            that.isReadCardPay = false
            that.scanPay.dialogVisible = false;
            that.$message.error('支付异常');
          })
        })
        setTimeout(() => {
          this.isReadCardPay = false
        },6000)
      },
      getScanValue(){
        if(this.scanPay.paying == true) {
          return this.$message("正在支付中，请勿重复扫码")
        }
        let that = this;
        let scanPayValue = this.scanPay.scanValue;
        if(!(/^[1][3,4,5,7,8][0-9]{9}$/.test(scanPayValue)) && this.currentPayType.id == 2) {
          this.$message.warning("手机号码格式错误，请从新扫描或输入");
          return;
        }
        this.hideScanValue(scanPayValue);
        this.scanData(scanPayValue, function (scanData) {
          that.paymentFailed();
          that.remoteScanData(scanData, function (data) { // 第一步 项远程发起支付请求
            that.customerId = data.customerId;
            data = JSON.parse(data);
            that.formatDiscount.customerId =  data.customerId || that.orderInfo.customer_id || '';
            if(data.isPolling) { // 第二步，是否需要轮询
              //构建支付请求时未返回成功，3秒后调用查询支付进度接口
              let confirmScanData = {
                shopId: scanData.shopId,
                brandId: scanData.brandId,
                order: scanData.order,
                customerId: data.customerId || '',
                outTradeNo : data.outTradeNo,//注：微信或支付宝后台生成的订单号
                paymentAmount : that.payInfo.amountMoney,
              };
              setTimeout(function () {
                that.selectPaymentProgress(confirmScanData, data)
              }, that.timeDifference);
            }else if (data.success && !data.isPolling){
              //构建支付请求时已支付成功，插入本地支付项
              that.scanCodePayment(data);
            } else if ( !data.success && !data.isPolling) { // 查询失败
              that.scanPayError(data.message);
              return;
            }
          });
        })
      },
      selectPaymentProgress : function (confirmScanData, data) {
        var that = this;
        if(that.timeDifference > 5000) {
          //todo 验证，轮询超过30s时，调用关闭接口，支付失败， 本地数据不变
          that.scanPayError("支付超时，正在撤销支付");
          that.$socket.revocationOfOrder(confirmScanData.outTradeNo, that.getOrderPayType(), function (result) {
            result = JSON.parse(result);
            if(result.success){
              that.$message("撤销支付成功，请重新发起支付");
            }else{
              that.$message.error(result.message);
            }
          });
          return;
        }
        that.isPollingScanPay(confirmScanData, function (data) {
          data = JSON.parse(data);
          if(data.success && !data.isPolling) { // 成功
            // 插入支付项，插入本地数据，调用打印，发出支付成功通知，跳转页面
            that.scanCodePayment(data);
          }  else if (!data.success && !data.isPolling) {
            that.scanPayError(data.message);
          } else{
            that.timeDifference = that.timeDifference + 500;
            setTimeout(function () {
              that.selectPaymentProgress(confirmScanData, data)
            }, that.timeDifference);
          }
        });
      },
      scanCodePayment : function (data) {
        var that = this;
        //构建支付请求时已支付成功，插入本地支付项
        that.scanPaySuccess(data.payMentInfo, function () {
          bus.$emit("scanPaySuccess")
          that.printTotalOrder();      // 打印
          if (that.shopModel == 2 || that.shopModel == 7) {
            that.$tvSocket.newOrder(that.orderInfo); // 将新生成的订单推送给电视端
            that.$router.push("/table/eatin?type=wait&payConfirm=true&orderType=all")
          } else {
            that.$router.push('/table?payConfirm=true&orderType=all');

          }
          that.scanPayError(null);
        });
      },
      scanPayError : function (errorMsg) {
        this.isPaying = false;
        this.scanPay.paying = false; // 关闭弹窗
        this.scanPay.dialogVisible = false;
        this.scanInput = true;
        this.scanPay.scanValue = ''; // 清空二维码接受框
        this.isRepeatScan = true;
        if (errorMsg) {
          this.$message.error(errorMsg);
        }
      },
      // 格式化扫码支付数据
      scanData: function (authCode, cb) {
        let payMode = 0, that = this;
        if(this.currentPayType.id == 1) {
          payMode  = 1; // 微信支付
        } else if (this.currentPayType.id == 10) {
          payMode  = 2; // 支付宝支付
        }else if(this.currentPayType.id == 2) {
          payMode  = 0; // 余额支付
        }
        let id = that.$route.query.suborderId || that.orderId;
        let orderPaymentList = [];

        let hasPayMonet = 0
        that.orderPayType.map(function (item) {
          if(item.type == 2 && item.toPayId) {
            orderPaymentList.push({toPayId: item.toPayId, paymentModeId: 2, payValue: item.money})
          }
          if(item.type == 3 && item.toPayId && !item.isOccupation) {
            orderPaymentList.push({toPayId: item.toPayId, paymentModeId: 3, payValue: item.money})
          }
        })
        let scanData = {
          shopId: sessionStorage.getItem("shopId"),
          brandId: sessionStorage.getItem("brandId"),
          authCode: authCode,
          order:{
            id: id,
            payMode: payMode,
            orderPaymentItems: orderPaymentList || [],
          }
        };
        cb(scanData);
      },

      // 将获取到的码给隐藏掉
      hideScanValue: function (scanValue) {
        this.scanPay.paying = true;
        let q = scanValue.substring(4);
        let h = scanValue.substring(scanValue.length - 4);
        let ss = ("************************").substring(0,(scanValue.substring(4).length -4) )
        this.scanPay.scanValue = this.scanPay.scanValue.replace(q,ss) + h
        if(this.scanPay.paying = true) {
          this.isPaying = true
        }
      },

      // 轮询，如果成功 确认支付
      isPollingScanPay: function (confirmPayData,cb) {
        this.$socket.isPollingScanPay(confirmPayData, cb)
      },
      getOrderPayType : function () {
        let convertPaytype  = 0;
        if(this.currentPayType.id == 1) {
          convertPaytype  = 1; // 微信支付
        } else if (this.currentPayType.id == 10) {
          convertPaytype  = 2; // 支付宝支付
        }else if(this.currentPayType.id == 2) {
          convertPaytype  = 3; // R+支付
        }
        return convertPaytype;
      },
      // 扫码支付 第一次请求
      remoteScanData: function (scanData, cb) {
        let brandId       = scanData.brandId;
        let shopId        = scanData.shopId;
        let authCode      = scanData.authCode;
        let paymentAmount = this.payInfo.amountMoney;
        let payType       = this.getOrderPayType();
        let orderId = scanData.order.id;
          this.$socket.scanPay(brandId, shopId, authCode, paymentAmount, payType, orderId, cb)
      },

      // 扫码支付成功
      scanPaySuccess: function (payMentInfo ,cb) {
        let that = this;
        let isScanPay = true;
        // 更新本地订单
        let payMode = 0;
        if(this.currentPayType.id == 1) {
          payMode  = 1; // 微信支付
        } else if (this.currentPayType.id == 10) {
          payMode  = 2; // 支付宝支付
        }else if(this.currentPayType.id == 2) {
          payMode  = 0; // 余额支付
        };
        let id = this.$route.query.suborderId || this.orderId;
        let servicePrice = this.orderInfo.service_price;
        if (this.orderPayType.length > 0) payMode = 99
        var list = that.orderPayType.filter( item => {
          return !item.isOccupation;
        })
        payOrder(id, list, payMode,that.formatDiscount, isScanPay, servicePrice,  function (payResult) {
          if(that.paymentItems && that.paymentItems.length > 0) payMentInfo.push(that.paymentItems[0])
          getBatchInsertPayment(payMentInfo,function (result) { //插入本地支付项
            cb();
          });
        })
      },

      // 无论支付成功或者失败，40s之后都要关闭弹窗
      paymentFailed: function () {
        let that = this;
        setTimeout(function () {
          that.scanPay.paying = false; // 关闭弹窗
          that.scanPay.dialogVisible = false;
          that.scanInput = true;
          that.scanPay.scanValue = ''; // 清空二维码接受框
          that.isRepeatScan = true;
        }, 40 * 1000)
      },
      initHeight () {
        this.carTableHeight = document.body.clientHeight - 300;
        this.payTableHeight = document.body.clientHeight - 470;
      },

      continueOrder() { // 继续点餐
        let id = this.$route.params.orderId;
        let suborderId = this.$route.query.suborderId || null
        this.$router.push('/order/'+ id+ '?' + (suborderId ? "suborderId=" + suborderId + '&' : "") + 'addArticle=true')
      },

      printPreOrder() { // 打印预结单
        let that = this;
        let suborderId = this.$route.query.suborderId || null;
        let printOrderId = suborderId || this.orderId;
        if(this.shopModel == 2 || this.shopModel == 7 || (this.shopModel == 6 && this.shopDet.allow_first_pay == 0)){  // 先付
          if(this.shopDet.auto_print_total == 0){
            printTotal(printOrderId, 2);
          }
          printOrder(printOrderId, function () {});
        }else if(this.shopModel == 6 && this.shopDet.allow_after_pay == 0){  // 后付
          printTotal(printOrderId, 2);
          if(this.orderInfo.distribution_mode_id == 3){ //  如果是后付外带
            printTotal(printOrderId, 2);
          }
        }
      },

      resumeDiscount () {
        resumeDiscount(this.orderId, ()=> {
          this.$store.dispatch('getCurrentOrderDetail', this.orderId)
          this.$store.dispatch('getDiscountInfo', this.orderId)
        })
      },

      //获取账户余额
      getAccountMoney() {
        let that = this
        if(that.isClickAccount) return;
        that.isClickAccount = true;
        let toPayIdList = [];
        this.orderPayType.map(item => {
          if (item.type == 2) {
            toPayIdList.push(item.toPayId);
          }
        })
        if (toPayIdList && toPayIdList.length > 0) {
          that.isClickAccount = false;
          that.$message.warning("已添加余额支付项");
          return;
        }
        //if(!this.orderInfo.customer_id) return;
        let brandId = sessionStorage.getItem("brandId")
        let shopId = sessionStorage.getItem("shopId")
        let customerId = this.orderInfo.customer_id
        let money = this.currentPayType.money

        that.$socket.getOverage(brandId, shopId, customerId, money, function (result) {
          result = JSON.parse(result);
          console.log('result',result)
          that.isClickAccount = false;
          if( result.accountPayValue > 0) {
            that.orderPayType.push({
              toPayId: result.accountId,
              type: 2,
              icon: "#icon-yue",
              money: result.accountPayValue
            })
          } else {
            that.$message.warning("余额为0");
          }


        });
      }
    }
  };
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
  .left-wrapper{
    height: 100%;
    position: relative;
    background-color: #FFFFFF;
    box-shadow: 0 0px 20px 0 rgba(0, 0, 0, .25), 0 0 6px 0 rgba(0, 0, 0, .04);

  }

  .panel-title {
    height: 50px;
    line-height: 50px;
    font-size: 22px;
    font-weight: bold;
    text-align: center;
    background-color: #252525;
    color: #FFFFFF;
    /*border-bottom: 5px solid #F2F2F2;*/
    /*margin-bottom: 10px;*/
  }

  .panel-content {

    height: 40px;
    line-height: 40px;
    font-size: 14px;
    color: black;
    padding-left: 5px;
    padding-bottom: 2em;
    border-bottom: 3px dashed transparent;
    background: linear-gradient(white,white) padding-box,
    repeating-linear-gradient(-45deg,#ccc 0, #ccc 0.25em,white 0,white 0.75em);
  }

  .car-total {
    height: 50px;
    line-height: 50px;
    border-top: 5px solid #F2F2F2;
    font-size: 22px;
    font-weight: bold;
    text-align: center;
  }

  .right-wrapper {
    height: 100%;
    /*border-left: 6px solid #eee;*/
  }

  .pay-wrapper {
    height: 100%;
    /*padding-bottom: 50px;*/
  }

  .pay-left-bottom {
    position: absolute;
    bottom:0px;
  }
  .pay-left-item{
    padding-left: 10px;
    height: 30px;
    line-height: 20px;
    border-bottom: 2px dashed darkgrey;
  }
  .pay-left-item-button{
    height: 50px;
    /*line-height: 40px;*/
    margin-left: 30px;
  }
  .pay-info {
    height: 100%;
    overflow-y: hidden;
    overflow-x: hidden;
    /*margin-top: 10px;*/
    padding: 10px;
    padding-top: 0px;
  }

  .pay-type-wrapper {
    height: 100%;
    margin-top: 5px;
    background-color: #FFFFFF;
    overflow-y: hidden;
    overflow-x: hidden;
    text-align: center;
  }

  /*.pay-type-item {*/
  /*width: 100%;*/
  /*!*margin-top: 5px;*!*/
  /*!*margin-bottom: 10px;*!*/
  /*padding: 10px 15px;*/
  /*line-height: 20px;*/
  /*white-space: normal;*/
  /*position: relative;*/
  /*border: none;*/
  /*}*/

  /*.pay-type-info-item {*/
    /*!*margin-top: 32px;*!*/
    /*width: 33%;*/
    /*height: 110px;*/
  /*}*/

  .pay-type-item-details {
    /*border: 1px solid black;*/
    text-align: center;
    width: 90%;
    margin:0px;
    margin-top: 5px;
    padding:0;
  }

  .bottom-tool {
    position: absolute;
    bottom: 0px;
    width: 100%;
    height: 50px;
    line-height: 50px;
    padding-left: 10px;
    border-top: 1px solid #d1dbe5;
    box-shadow: 0 -2px 4px 0 rgba(0, 0, 0, .12), 0 0 6px 0 rgba(0, 0, 0, .04);
    background-color: #FFFFFF;
  }

  .key-board-panel {
    margin-bottom: 10px;
  }



  /*    购物车 table 样式    begin   */
  .car-table {
    width: 100%;
    font-size: 14px;
  }

  .car-table-title-tr {
    background-color: #eef1f6;
    height: 40px
  }

  .car-table-body-tr {
    text-align: center;
    height: 40px;
    cursor: pointer;
  }

  .car-table-body-tr td, th {
    border-bottom: 1px solid #dfe6ec;
  }

  .car-table-body-package-tr {
    text-align: center;
    height: 40px;
    background-color: #FFFFFF;
  }

  .pay-img{
    width:25px;
    height:25px;
  }

  .car-footer {
    /*width: 100%;*/
    /*position: absolute;*/
    /*bottom:0px;*/
    /*border-top: 5px solid #eee;*/
    position: absolute;
    bottom:0px;
    width: 100%;
    background-color: #FFFFFF;
    border-top: 8px solid #f5f5f5;
  }
  .operate-item {
    display: flex;
    justify-content: space-between;
    height: 47px;
    line-height: 47px;
    padding: 0px 20px;
    border-bottom:1px dashed #dfdfdf;
    color: #666;
    font-size: 16px;
  }



  .confirm-state{
    padding: 1em;
    border: 2px dashed transparent;
    background: linear-gradient(white,white) padding-box,
    repeating-linear-gradient(-45deg,#ccc 0, #ccc 0.25em,white 0,white 0.75em);
  }
  /*    购物车 table 样式    end   */


  /*  订单详情 翻页 begin*/
  .order-page-wrapper{
    position: absolute;
    top:35%;
    right: 30px;
    z-index: 10;
  }
  .order-page-wrapper > .pre-page{
    display: flex;
    justify-content: center;
    align-items: center;
    width: 50px;
    height: 50px;
    background-color: #000000;
    color: #FFF;
    border-radius:50%;
    margin-bottom: 50px;
    cursor: pointer;
    opacity: 0.6;
  }
  .order-page-wrapper > .next-page{
    display: flex;
    justify-content: center;
    align-items: center;
    width: 50px;
    height: 50px;
    background-color: #000000;
    color: #FFF;
    border-radius:50%;
    cursor: pointer;
    opacity: 0.6;
  }
  /*  订单详情 翻页 end*/

  /** 订单详情  滚动条  begin  **/
  #order-detail-wrapper::-webkit-scrollbar {
    width: 4px;
    height: 4px;
  }
  #order-detail-wrapper::-webkit-scrollbar-thumb {
    border-radius: 5px;
    -webkit-box-shadow: inset 0 0 5px rgba(0,0,0,0.2);
    background: rgba(0,0,0,0.2);
  }
  #order-detail-wrapper::-webkit-scrollbar-track {
    -webkit-box-shadow: inset 0 0 5px rgba(0,0,0,0.2);
    border-radius: 0;
    background: rgba(0,0,0,0.1);
  }
  /** 订单详情  滚动条  end  **/
  .panel-title {
    height: 50px;
    line-height: 50px;
    font-size: 20px;
    font-weight: bold;
    text-align: center;
    background-color: #FFFFFF;
    color: #333333;
    border-bottom: 5px solid #F2F2F2;
    margin-bottom: 10px;
  }
  /* 遮罩层 */
  .mask-layer {
    /*height:100%;*/
    width:100%;
    position: absolute;
    background-color: black;
    opacity: 0.5;

  }
  .el-button--primary {
    background-color: #EEE;;
    color: #000;
    border: none;
    border-radius: 0px;
    border-left: 5px solid #ffbf34;
  }

  /*.select-pay-type {*/
  /*background-color: #EEE;;*/
  /*color: #000;*/
  /*border: none;*/
  /*border-radius: 0px;*/
  /*border-left: 5px solid #ffbf34;*/
  /*}*/
  .pay-info-details {
    height: 40%;
    border-radius: 5px;
    background-color: #FFFFFF;
  }
  .pay-info-details > li {
    height: 25%;
  }
  .pay-info-details > li > div {
    height: 45px;
    line-height: 45px;
    margin-top: 5px;

    font-size: 20px;
    font-weight: bold;
    color: #666;
    text-indent: 10px;
  }

  .pay-info-details > li > div > p:nth-of-type(1){
    display: inline-block;
    height: 100%;
    color:#666;
  }
  .pay-info-details > li > div > p:nth-of-type(2){
    float: right;
    margin-right: 20px;
    height: 100%;
    color:#999;
  }
  .pay-show-wrapper {
    margin-top: 10px;
    /*height: 55%;*/
  }

  /*.icon {*/
  /*width: 40px;*/
  /*height: 40px;*/
  /*vertical-align: -0.15em;*/
  /*fill: currentColor;*/
  /*overflow: hidden;*/
  /*}*/


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
  .bottom-btn-wrap {
    width: 81%;
    height: 50px;
    position: absolute;
    bottom: 0;
  }
  .operate-footer {
    background-color: #FFFFFF;
    height: 45px;
    line-height: 50px;

  }
  .operate-footer-button{
    background-color: #000;
    height: 40px;
    font-size: 18px;
    color: #fff;
    border-radius: 5px;
  }
  .discount-package-item {
    border:1px solid black;
    height: 40px;
    line-height:40px;
    font-size: 18px;
    text-align: center;
    margin: 15px;
  }


  .btn-number{
    width:90%;
    height:60px;
    margin:5px;
    background-color: #FFFFFF;
    font-size:22px;
    font-weight: bold;
  }
  .scan-paying{
    position: absolute;
    border-radius:14px;
    left:30%;
    background-color: black;
    opacity: 0.5;
    width:200px;
    height:200px;
    z-index: 999;
  }

  .details-item {
    margin-top: 8px;
    font-size: 14px;
    word-wrap: break-word;
    color: #666;
  }
  .details-button {
    border: 1px solid black;
    color: black;
    background-color: #fff;
  }

  .details-button-active {
    border: none;
    background-color: #ffbf34;
    color: #FFFFFF;
  }
  .pay-btn-style {
    width: 70%;
    font-size: 18px;
  }


  .add-article {
    display: inline-block;
    width: 20px;height: 20px;
    text-align: center;vertical-align: top;
    background-color: #75C2AF;color: #FFFFFF;
    border-radius:50%;margin-left: -4%;
  }
</style>

