<template>
  <div>
    <el-row class="business" v-loading.fullscreen.lock="fullscreenLoadingObj.show" :element-loading-text="fullscreenLoadingObj.msg">
      <el-row class="tool-bar" id="tool-bar">
        <!--<el-col :span="4" class="tool-title">
          <p>{{shopDetails.name}}</p>
        </el-col>-->
        <el-col :span="24" class="tool-content">
          <el-date-picker
            v-model="reportDate"
            align="right"
            type="date"
            placeholder="选择日期"
            :editable = "false"
            :picker-options="pickerOptions">
          </el-date-picker>
          <el-button type="primary" class="tool-search-btn" style="background-color: #FFBF34;border: none;" @click="queryData()">查询</el-button>

          <div style="float: right;margin-right: 10px;">
            <el-button type="primary" class="tool-search-btn" @click="closeBusiness('isClose')">结店</el-button>
            <el-button type="primary" class="tool-search-btn" @click="dailyReceipt">日报小票</el-button>
            <!--<el-button type="primary" class="tool-search-btn" @click="recoverStock()">恢复库存</el-button>-->
          </div>

        </el-col>
      </el-row>
      <el-row class="business-data" id="business-data"  :style="{height: dateHeight + 'px'}" style="overflow-y: hidden">
        <el-row class="data-row" v-if="businessData">
          <el-col :span="3">
            <p class="data-title">整&emsp;&emsp;体<br>营业数据</p>
          </el-col>
          <el-col :span="3" class="data-content">
            <p>营收总额</p>
            <p>￥{{ formatMoney(businessData.totalAmount)||0 }}</p>
          </el-col>
          <el-col :span="3" class="data-content">
            <p>实收金额</p>
            <p>￥{{formatMoney( businessData.incomeAmount )}}</p>
          </el-col>
          <el-col :span="3" class="data-content">
            <p>折扣金额</p>
            <p>￥{{formatMoney( businessData.discountAmount)}}</p>
          </el-col>
          <el-col :span="3" class="data-content">
            <p>退菜返还红包</p>
            <p>￥{{ Math.abs(formatMoney(businessData.refundsItems[11]||0)) }}</p>
            <!--<p>退款金额</p>-->
            <!--<p>￥{{ Math.abs(formatMoney(businessData.canceledOrderAmount))  }}</p>-->
          </el-col>
          <el-col :span="3" class="data-content">
            <p>订单总量</p>
            <p>{{formatMoney(businessData.orderAmount || 0)}}</p>
          </el-col>
          <el-col :span="3" class="data-content">
            <p>用餐人数</p>
            <p>{{formatMoney(businessData.customerAmount || 0)}}</p>
          </el-col>
          <el-col :span="3" class="data-content">
            <p>人均</p>
            <p v-if="businessData.customerAverage">￥{{ formatMoney(businessData.customerAverage) }}</p>
            <p v-else>---</p>
          </el-col>
        </el-row>

        <el-row class="data-row">
          <el-col :span="3">
            <p class="data-title">实&emsp;&emsp;收<br>金额数据</p>
          </el-col>
          <el-col :span="3" class="data-content">
            <p>微信支付</p>
            <p>￥{{formatMoney(businessData.incomeItems[1]||0)}}</p>
          </el-col>
          <el-col :span="3" class="data-content">
            <p>支付宝支付</p>
            <p>￥{{formatMoney( businessData.incomeItems[10]||0 )}}</p>
          </el-col>
          <el-col :span="3" class="data-content">
            <p>线下微信支付</p>
            <p>￥{{ Math.abs(formatMoney(businessData.underline[1]||0)) }}</p>
          </el-col>
          <el-col :span="3" class="data-content">
            <p>线下支付宝支付</p>
            <p>￥{{ formatMoney(businessData.underline[10]||0) }}</p>
          </el-col>
          <el-col :span="3" class="data-content">
            <p>充值金额支付</p>
            <p>￥{{ formatMoney(businessData.incomeItems[6])||0}}</p>
          </el-col>
          <el-col :span="3" class="data-content">
            <p>现金支付</p>
            <p>￥{{ formatMoney(businessData.incomeItems[12]||0)}}</p>
          </el-col>
          <el-col :span="3" class="data-content">
            <p>刷卡支付</p>
            <p>￥{{ formatMoney(businessData.incomeItems[5]||0) }}</p>
          </el-col>

        </el-row>
        <el-row class="data-row">
          <el-col :span="3" class="data-content">
            <p></p>
            <p></p>
          </el-col>
          <el-col :span="3" class="data-content">
            <p>闪惠支付</p>
            <p>￥{{ formatMoney( businessData.incomeItems[16]||0 ) }}</p>
          </el-col>
          <el-col :span="3" class="data-content">
            <p>团购支付</p>
            <p>￥{{formatMoney( businessData.incomeItems[27]||0 )}}</p>
          </el-col>
          <el-col :span="3" class="data-content">
            <p>实体卡充值本金</p>
            <p>￥{{formatMoney( businessData.incomeItems[23]||0 )}}</p>
          </el-col>
        </el-row>

        <el-row class="data-row">
          <el-col :span="3">
            <p class="data-title">折&emsp;&emsp;扣<br>金额数据</p>
          </el-col>
          <el-col :span="3" class="data-content">
            <p>红包支付</p>
            <p>￥{{ formatMoney(businessData.discountItems[2]||0) }}</p>
          </el-col>
          <el-col :span="3" class="data-content">
            <p>优惠券支付</p>
            <p>￥{{ formatMoney(businessData.discountItems[3]||0) }}</p>
          </el-col>
          <el-col :span="3" class="data-content">
            <p>充值赠送支付</p>
            <p>￥{{ formatMoney(businessData.discountItems[7]||0)}}</p>
          </el-col>
          <el-col :span="3" class="data-content">
            <p>等位红包支付</p>
            <p>￥{{ formatMoney(businessData.discountItems[8]||0)}}</p>
          </el-col>
          <el-col :span="3" class="data-content">
            <p>POS端折扣</p>
            <p>￥{{ formatMoney( businessData.discountItems["pos"]||0) }}</p>
          </el-col>
          <el-col :span="3" class="data-content">
            <p>会员折扣</p>
            <p>￥{{ formatMoney(businessData.discountItems["member"] || 0) }}</p>
          </el-col>
          <el-col :span="3" class="data-content">
            <p>会员积分支付</p>
            <p>￥{{ formatMoney(businessData.discountItems[17]||0) }}</p>
          </el-col>
        </el-row>
        <el-row class="data-row">
          <el-col :span="3" class="data-content">
            <p></p>
            <p></p>
          </el-col>
          <el-col :span="3" class="data-content">
            <p>实体卡充值赠送</p>
            <p>￥{{ formatMoney(businessData.discountItems[24]||0) }}</p>
          </el-col>
          <!--<el-col :span="3" class="data-content">-->
          <!--<p>实体卡折扣</p>-->
          <!--<p>￥{{ formatMoney(businessData.discountItems[22]||0) }}</p>-->
          <!--</el-col>-->
          <el-col :span="3" class="data-content">
            <p>代金券支付</p>
            <p>￥{{ formatMoney(businessData.discountItems[28]||0) }}</p>
          </el-col>
          <el-col :span="3" class="data-content">
            <p>赠菜金额</p>
            <p>￥{{ formatMoney(businessData.grantAmount || 0) }}</p>
          </el-col>
        </el-row>

        <el-row class="data-row">
          <el-col :span="3">
            <p class="data-title">退&emsp;&emsp;菜<br>金额数据</p>
          </el-col>
          <el-col :span="3" class="data-content">
            <p>现金退款</p>
            <p>￥{{ Math.abs(formatMoney(businessData.refundsItems[12]||0)) }}</p>
          </el-col>
          <!--<el-col :span="3" class="data-content">-->
            <!--<p>退菜返还红包</p>-->
            <!--<p>￥{{ Math.abs(formatMoney(businessData.refundsItems[11]||0)) }}</p>-->
          <!--</el-col>-->
          <el-col :span="3" class="data-content">
            <p>实体卡退款</p>
            <p>￥{{ formatMoney(businessData.refundsItems[25]||0) }}</p>
          </el-col>

        </el-row>
        <!--<el-row class="data-row">-->
        <!--<el-col :span="3">-->
        <!--<p class="data-title">pos&nbsp;端<br>结&emsp;算</p>-->
        <!--</el-col>-->
        <!--<el-col :span="3" class="data-content">-->
        <!--<p>结算总金额</p>-->
        <!--<p>￥{{ formatMoney(posClose)}}</p>-->
        <!--</el-col>-->
        <!--</el-row>-->
        <!--<el-row class="data-row">-->
        <!--<el-col :span="3">-->
        <!--<p class="data-title">顾&nbsp;&nbsp;客&nbsp;&nbsp;手<br>机端结算</p>-->
        <!--</el-col>-->

        <!--<el-col :span="3" class="data-content">-->
        <!--<p>结算总金额</p>-->
        <!--<p>￥{{ formatMoney(phoneClose) }}</p>-->
        <!--</el-col>-->
        <!--</el-row>-->
        <el-row class="data-row">
          <el-col :span="3">
            <p class="data-title" style="line-height: 79px;">堂食订单</p>
          </el-col>
          <el-col :span="3" class="data-content">
            <p>结算订单数</p>
            <p>{{formatMoney(businessData.orderOrderingSource.eatIn.orderCount || 0)}}</p>
          </el-col>
          <el-col :span="3" class="data-content">
            <p>结算总金额</p>
            <p>￥{{formatMoney(businessData.orderOrderingSource.eatIn.orderMoney || 0)}}</p>
          </el-col>
          <!--<el-col :span="3" class="data-content">-->
          <!--<p>交易占比</p>-->
          <!--<p v-if="businessData.orderOrderingSource.eatIn">{{ 0 }}%</p>-->
          <!--<p v-else>-</p>-->
          <!--</el-col>-->
        </el-row>
        <el-row class="data-row" v-if="businessData.orderOrderingSource">
          <el-col :span="3">
            <p class="data-title" style="line-height: 79px;">外带订单</p>
          </el-col>
          <el-col :span="3" class="data-content">
            <p>结算订单数</p>
            <p>{{formatMoney(businessData.orderOrderingSource.eatOut.orderCount || 0)}}</p>
          </el-col>
          <el-col :span="3" class="data-content">
            <p>结算总金额</p>
            <p>￥{{formatMoney(businessData.orderOrderingSource.eatOut.orderMoney || 0)}}</p>
          </el-col>
          <!--<el-col :span="3" class="data-content">-->
          <!--<p>交易占比</p>-->
          <!--<p v-if="businessData.orderOrderingSource.eatOut">{{ 0 }}%</p>-->
          <!--<p v-else>-</p>-->
          <!--</el-col>-->
        </el-row>
      </el-row>
      <div class="order-page-wrapper">
        <div class="pre-page" @click="pageOptions(-1)"><span class="el-icon-caret-top" style="font-size: 26px;margin-left: 4px;"></span></div>
        <div class="next-page" @click="pageOptions(1)"><span class="el-icon-caret-bottom" style="font-size: 26px;margin-top: 4px;margin-left: 2px;"></span></div>
      </div>
    </el-row>
    <el-dialog title="身份验证" center :visible.sync="closeBusinessModal"  width="30%" :close-on-click-modal="false" :before-close="closeBusinessDialog" id="businessDialog">
      <div>
        <template>
          <div style="margin-top: 10px;">
            <h3 style="font-weight: bold;margin-left: 5px;display: inline-block;width: 20%;">请输入口令</h3>
            <input type="password"
                   autocomplete="off"
                   readonly onfocus="this.removeAttribute('readonly');"
                   style="display: inline-block; border:1px solid grey; height: 30px;border-radius: 5px;width: 50%;"
                   data-name="closeBusiness"
                   v-model="closeBusinessPassword" @click="focus()">

          </div>
        </template>

        <span slot="footer" class="dialog-footer">
        <div style="width: 100%;margin-top: 20px;text-align: center;">
          <el-button  @click="closeBusinessDialog()">取 消</el-button>
          &nbsp;&nbsp;&nbsp;&nbsp;
          <el-button style="background-color: #000;color: rgb(255, 255, 255);" @click="saveChange">确 定</el-button>
        </div>
      </span>
      </div>
    </el-dialog>
    <reviewDetail  ref="reviewDetail"></reviewDetail>
  </div>


</template>

<script>
  import { businessData ,recoveryArticle ,closeBusiness ,printStoreReport, getLeftSyncOrder, syncAll,isOpenPaymentReview} from 'api/api';
  import {shopDetail} from "../../../api/api";
  import bus from  '../../../utils/bus'
  import reviewDetail from  './reviewDetail.vue'
  export default {
    name: 'business',
    components: {
      reviewDetail,
    },
    data () {
      return {
        shopDetails:{},
        pickerOptions: {
          shortcuts: [{
            text: '今天',
            onClick(picker) {
              picker.$emit('pick', new Date());
            }
          }, {
            text: '昨天',
            onClick(picker) {
              const date = new Date();
              date.setTime(date.getTime() - 3600 * 1000 * 24);
              picker.$emit('pick', date);
            }
          }, {
            text: '一周前',
            onClick(picker) {
              const date = new Date();
              date.setTime(date.getTime() - 3600 * 1000 * 24 * 7);
              picker.$emit('pick', date);
            }
          }]
        },
        reportDate : new Date(),
        businessData : {
          incomeItems: {},
          underline: {},
          discountItems: {},
          refundsItems : {},
          orderOrderingSource:{
            eatIn: {},
            eatOut: {},
            packaging: {}
          }
        },
        orderPaymentMap : {},
        orderPosDiscountMoney:0,  // pos端折扣金额
        memberDiscountMoney:0,    // 会员折扣金额（微信端）
        closedBusiness:'open',
        fullscreenLoadingObj: {
          show: false,
          msg: "正在结店，请稍候 . . ."
        },
        dateHeight :0,
        totalMoney:0,
        posClose: 0,
        phoneClose: 0,
        selectDate: new Date(),

        closeBusinessModal: false,
        closeBusinessPassword: '',   //结店口令


      };
    },
    computed : {
      // actualMoney : function () {
      //   let m = this.orderPaymentMap;
      //   let actualMoney = Number(m[1]||0) + Number(m[12]||0) + Number(m[5]||0) + Number(m[16]||0) + Number(m[10]||0) + Number(m[6]||0);
      //   return this.$utils.formatMoney(actualMoney || 0);
      // },
      // discountMoney : function () {
      //   let that = this;
      //   let m = this.orderPaymentMap;
      //   let discountMoney = Number(m[2]||0) + Number(m[3]||0) + Number(m[7]||0) + Number(m[8]||0) + Number(m[15]||0) + Number(m[17]||0) + (+that.orderPosDiscountMoney ||0)+ (+that.memberDiscountMoney ||0) ;
      //   return this.$utils.formatMoney(discountMoney || 0);
      // },
      // refundAllMoney : function () {
      //   let m = this.orderPaymentMap;
      //   let refundAllMoney = Number(m[19]||0) + Number(m[11]||0);
      //   return this.$utils.formatMoney(refundAllMoney || 0);
      // },
    },
    created: function(){
      console.log('this.reportDate',this.reportDate)
      let that = this
      businessData(this.$utils.fmtDate(this.reportDate), function (data) {
        that.businessData = data;
        that.posClose =  (+data.discountItems["pos"] || 0 ) + (+data.discountItems["posSettleAccounts"] || 0)// pos端折扣 + pos结算
        that.phoneClose = (+data.discountItems["member"] || 0)  + (+data.discountItems["wechatSettleAccounts"] || 0) // phone端折扣 + 手机结算
      })
    },
    mounted : function () {
      var that = this;
      var toolbarHeight = document.getElementById("tool-bar").clientHeight;
      var bodyHeight = document.body.clientHeight - 100 - toolbarHeight;
      this.dateHeight = bodyHeight;
      this.shopDetails = JSON.parse(sessionStorage.getItem('shopDet'));

      bus.$on('close-business', function (value) {
        that.closeBusinessPassword = value;
      });

    },
    beforeDestroy () {
      bus.$off("close-business")
    },
    methods: {
      queryData() {
        let that = this
        // this.selectDate = this.reportDate();
        businessData(this.$utils.fmtDate(this.reportDate), function (data) {
          that.businessData = data;
          that.posClose =  (+data.discountItems["pos"] || 0 ) + (+data.discountItems["posSettleAccounts"] || 0)// pos端折扣 + pos结算
          that.phoneClose = (+data.discountItems["member"] || 0)  + (+data.discountItems["wechatSettleAccounts"] || 0) // phone端折扣 + 手机结算
        })
      },



      closeBusiness(param) {
        var self = this;
        isOpenPaymentReview((result) => {
          console.log('result',result)
          if(result && result.openAudit == 1) {
            self.closeBusinessModal = true;
          } else if (result && result.openAudit == 0){
            console.log("selectDate", this.$utils.fmtDate(this.reportDate))
            getLeftSyncOrder(this.$utils.fmtDate(this.reportDate), (result) => {
              var syncDataList = result;
              this.$confirm('确定要进行结店操作？', '提示', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
              }).then(() => {
                if(navigator.onLine){
                  syncAll(syncDataList, function (result) {
                    self.showLoading();
                    self.$socket.posCheckOut('', '', function () {
                      self.$message("结店成功");
                      self.closedBusiness = param;
                      self.closeLoading();
                    })
                  })
                }else{
                  self.$message.warning("暂无网络，无法发送结店短信!");
                  self.closeLoading();
                }
              }).catch(() => {
                self.closeLoading();
              });
            })
          }
        })

        // this.$confirm('确定要进行结店操作？', '提示', {
        //   confirmButtonText: '确定',
        //   cancelButtonText: '取消',
        //   type: 'warning'
        // }).then(() => {
        //   if(navigator.onLine){
        //     self.showLoading();
        //     self.$socket.posCheckOut(function () {
        //       self.$message("结店成功");
        //       self.closedBusiness = param;
        //       self.closeLoading();
        //     })
        //   }else{
        //     self.$message.warning("暂无网络，无法发送结店短信!");
        //   }
        // }).catch(() => {});
      },
      dailyReceipt() {
        let self = this;
        printStoreReport(self.$utils.fmtDate(this.reportDate),function (data) {
          if(data){
            self.$message("发送日报小票"); // 回调成功后调用
            console.log("发送日报小票");
          }else {
            self.$message("发送日报小票失败"); // 失败
            console.log("发送日报小票失败");
          }
        })
      },
      recoverStock() {
        var self = this ;
        this.$confirm('确定要恢复菜品原始库存？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(() => {
          recoveryArticle(function (data) {
            if(data){
              self.$message("恢复库存失败");
              console.log("恢复库存失败");
            }else {
              self.$message("恢复库存成功");
              console.log("恢复库存");
            }
          })
        }).catch(() => {});
      },
      showLoading(){
        this.fullscreenLoadingObj.show = true;
        setTimeout( ()=> {
          if(this.fullscreenLoadingObj.show){
            this.closeLoading();
            this.$message.error("网络繁忙，请稍后重试~~~");
          }
        }, 5000);// 5 秒之后如果还没有成功， loading 页面自动关闭
      },
      closeLoading(){
        this.fullscreenLoadingObj.show = false;
      },
      pageOptions (operation){
        var businessData = document.getElementById("business-data")
        if(operation == 1){  // 下一页
          businessData.scrollTop += businessData.clientHeight;
        }else{  //  上一页
          businessData.scrollTop -= businessData.clientHeight;
        }
      },
      formatMoney(money){
        return this.$utils.formatMoney(money || 0);
      },


      closeBusinessDialog() {
        this.closeBusinessModal = false;
        this.closeBusinessPassword = ''
      },
      focus() {
        this.closeBusinessPassword = "";
      },

      saveChange(){
        let that = this;
        var superPwd = JSON.parse(sessionStorage.getItem("superPwd"));
        var inputSuperPwd = this.$utils.pwdEncryption(this.closeBusinessPassword);
        if(inputSuperPwd == '') {
          this.$message.warning('身份口令不能为空');
          return;
        }
        if(inputSuperPwd != superPwd) {
          this.$message.error('身份口令错误');
          return;
        }

        this.closeBusinessModal = false;
        this.closeBusinessPassword = ''
        this.$refs.reviewDetail.open();

      },

    },
  };
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
  .business{
    height: 100%;
    width: 100%;
  }
  .tool-bar{
    padding-left: 20px;
    height: 60px;
    line-height: 60px;
    font-weight: bold;
    border-bottom: 2px solid #E9E9E9;
  }
  .tool-title{
    padding-left: 20px;
  }
  .tool-search-btn{
    margin-left: 5px;
    font-size: 16px;
  }
  .el-button--primary{
    /*background-color : #000 ;*/
    /*border-color: #000;*/
    background-color: #ffbf34;
    color: #fff!important;
    border: none;
    padding: 10px 30px;
  }
  .business-data{
    width: 100%;
  }
  .data-row{
    height: 80px;
    border-bottom: 2px solid #E9E9E9;
  }
  .data-title{
    /*line-height: 79px;*/
    line-height: 38px;
    font-size: 16px;
    font-weight: bold;
    padding-left: 20px;
  }
  .data-content{
    height: 40px;
    line-height: 40px;
    text-align: center;
  }


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
    background-color: #000;
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

  #businessDialog {
    text-align: center;
  }
</style>
