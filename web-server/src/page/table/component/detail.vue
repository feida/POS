<template>
  <div>
    <div v-if="orderInfo.id" style="background-color: #eee">
      <div>
        <p class="panel-title">
          <span style="display: inline-block;float: left;margin-left: 20px;">
            <i class="iconfont icon-shouji" style="font-size: 22px" v-if="!!orderInfo.customer_id"></i>
            <i class="iconfont icon-computer3diannao" style="font-size: 22px" v-else></i>
          </span>
          <span>{{(shopModel == 2 || shopModel == 7) ? orderInfo.ver_code:'客单'}}</span>
          <button style="display: inline-block;border: 1px solid black; height: 30px;
            padding: 0 17px 0 17px; border-radius: 5px;float: right; margin-top: 10px; margin-right: 10px;"
                  @click="showDetails = !showDetails">
            详情
          </button>
        </p>
      </div>
      <div v-if="showDetails == true" class="mask-layer" :style="{ height: carTableHeight + 'px' }"></div>
      <div v-if="showDetails == true" style="position: absolute;width: 100%;">
        <el-row class="panel-content">
          <!--交易码/桌号-->
          <el-col :span="12">
            <strong v-if="orderInfo.distribution_mode_id==1">堂&emsp;&emsp;&emsp;吃 {{orderInfo.table_number}}</strong>
            <strong v-else="orderInfo.distribution_mode_id==3">外&emsp;&emsp;&emsp;带 {{orderInfo.table_number}}</strong>
          </el-col>
        </el-row>
        <el-row class="panel-content">
          <el-col :span="12"><strong>人&emsp;&emsp;&emsp;数：</strong>{{orderInfo.customer_count||'无'}}</el-col>
        </el-row>
        <el-row class="panel-content">
          <el-col :span="24"><strong>手&nbsp;机&nbsp;号：</strong>{{customerInfo.telephone||'无'}}</el-col>
        </el-row>
        <el-row class="panel-content">
          <el-col :span="24"><strong>交易流水号：</strong>{{orderInfo.serial_number||'无'}}</el-col>
        </el-row>
        <el-row class="panel-content">
          <el-col :span="24"><strong>订&nbsp;单&nbsp;时&nbsp;间：</strong>{{formatDate(orderInfo.create_time)||'无'}}</el-col>
        </el-row>
        <el-row class="panel-content" style="height: auto;line-height: 20px;padding: 10px 0px;">
          <el-col :span="24"><strong>订&nbsp;单&nbsp;备&nbsp;注：</strong>{{orderInfo.remark||'无'}}</el-col>
        </el-row>
      </div>

      <div :style="{ height: carTableHeight + 'px' }" style="overflow-y: hidden;background-color: #FFFFFF;" id="order-detail-wrapper" >
        <div class="order-page-wrapper" id="order-page-wrapper">
          <div class="pre-page" @click="orderPageOperation(-1)"><span class="el-icon-caret-top"></span></div>
          <div class="next-page" @click="orderPageOperation(1)"><span class="el-icon-caret-bottom"></span></div>
        </div>

        <!--购物车 菜品详情-->
        <div>


          <ul class="car-title">
            <li class="car-title-item" style="width: 15%;text-align: center; text-indent: 9px;" v-if="checkAllFlag == false" @click="checkAll(true)">全选</li>
            <li class="car-title-item" style="width: 15%; text-align: center; text-indent: 9px;" v-if="checkAllFlag == true" @click="checkAll(false)">取消</li>
            <li class="car-title-item" style="width: 40%;">品名</li>
            <li class="car-title-item" style="width: 15%;">数量</li>
            <li class="car-title-item" style="width: 20%;text-align:right;">小计</li>
          </ul>
          <!--购物车 内容-->
          <ul class="car-title car-content" v-for="(article, index) in car"  @click="checkOne(article)">
            <hr style="border:1px dashed #E0E0E0; width: 90%;">

            <div v-show="(article.type == 3 && !!article.tempRefundCount)? false: true ">
              <li class="car-title-item car-content-item" style="width: 15%;text-align: center;" v-if="article.checked">
                <svg style="width: 14px;height: 14px;" aria-hidden="true">
                  <use xlink:href="#icon-duihao"></use>
                </svg>
              </li>
              <li class="car-title-item car-content-item" style="width: 15%;text-align: center;visibility: hidden" v-else>
                <svg style="width: 14px;height: 14px;" aria-hidden="true">
                  <use xlink:href="#icon-duihao"></use>
                </svg>
              </li>

              <li class="car-title-item car-content-item" style="width: 40%;">
                <span style="display: inline-block;width: 80%;">{{article.name}}</span>
                <span style="display: inline-block;
                 width: 20px;height: 20px;
                 text-align: center;vertical-align: top;
                 background-color: #75C2AF;color: #FFFFFF;
                 border-radius:50%;margin-left: -4%;"
                      v-if="article.notes">
                        加
                </span>
              </li>
              <li class="car-title-item car-content-item" style="width: 15%;vertical-align: top;">{{article.count}}</li>
              <li class="car-title-item car-content-item" style="width: 20%;text-align: right; vertical-align: top">¥{{formatMoney(article.price)}}</li>
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
                <span
                  style="display: inline-block; width: 20px;height: 20px;margin-left: -4%;
                        text-align: center;vertical-align: top;
                       background-color: #ef5350;color: #FFFFFF;border-radius:50%;"
                  v-show="article.tempRefundCount">
                退
              </span>
              </li>
              <li class="car-title-item car-content-item" style="width: 15%;text-decoration: line-through;color:#999999 ;vertical-align: top;">{{article.tempRefundCount}}</li>
              <li class="car-title-item car-content-item" style="width: 20%;text-decoration: line-through;text-align: right; color: #999999;vertical-align: top;">¥ {{formatMoney(article.tempRefundCount * article.unitPrice)}}</li>
            </div>

            <div v-if="article.type==3 && article.tempRefundCount" style="margin-left: 5px;" v-for="item in article.mealItems">
              <li class="car-title-item car-content-item" style="width: 15%;text-align: center;visibility: hidden">
              <li class="car-title-item car-content-item" style="width: 40%;">
                <span style="display: inline-block;width: 80%;text-decoration: line-through;color:#999999 ;" >{{item.name}}</span>
              </li>
              <li class="car-title-item car-content-item" style="width: 15%;vertical-align: top;text-decoration: line-through;color:#999999 ;">{{item.count}}</li>
              <li class="car-title-item car-content-item" style="width: 20%;vertical-align: top;text-decoration: line-through;color:#999999 ; text-align: right;">¥{{formatMoney(item.price)}}</li>
            </div>
          </ul>
        </div>

        <!--<table class="car-table" cellspacing="0" cellpadding="0" border="0">-->
          <!--<thead>-->
          <!--<tr class="car-table-title-tr">-->
            <!--<th width="35px" v-if="changeOrder.isClick==true">-->
              <!--<i class="iconfont icon-aliicon" style="font-size: 30px; color:black;" v-if="checkAllFlag == true"-->
                 <!--@click="checkAll(false)"></i>-->
              <!--<i class="iconfont icon-weixuanyuanquan" style="font-size: 30px;" v-if="checkAllFlag == false"-->
                 <!--@click="checkAll(true)"></i>-->
              <!--<p>全选</p>-->
            <!--</th>-->
            <!--<th width="35px" v-else>#</th>-->
            <!--<th>菜名</th>-->
            <!--<th width="50px">数量</th>-->
            <!--<th width="50px">小计</th>-->
          <!--</tr>-->
          <!--</thead>-->
          <!--<tbody>-->
          <!--<template v-for="(article, index) in car">-->

            <!--<tr class="car-table-body-tr"-->
                <!--:class="{'car-table-body-tr-selected'-->
                    <!--:currentCarTableRow.info.time === article.time}"-->
                <!--@click="choseCarTableRow(article,index)"-->
            <!--&gt;-->

              <!--<th>-->
                    <!--<span v-if=" changeOrder.isClick == true && !article.serverPrice" @click="checkOne(article)">-->
                      <!--<i class="iconfont icon-aliicon"-->
                         <!--style="font-size: 30px; color: black;"-->
                         <!--v-if="article.checked"-->
                      <!--&gt;</i>-->
                      <!--<i class="iconfont icon-weixuanyuanquan" style="font-size: 30px;" v-else></i>-->
                    <!--</span>-->
                <!--<span v-else>{{index + 1}}</span>-->
              <!--</th>-->


              <!--<td style="padding: 0px 10px;text-align: left;">-->
                <!--<i class="have-order" style="color:#032df9;" ></i>-->
                <!--<i class="el-icon-caret-right" v-if="article.type==3 && !article.isOpen"></i>-->
                <!--<i class="el-icon-caret-bottom" v-else-if="article.type==3"></i>-->
                <!--&nbsp;{{article.name}}{{article.notes}}-->
              <!--</td>-->
              <!--<td>{{article.count}}</td>-->
              <!--<td>¥{{(article.price || 0).toFixed(2)}}</td>-->
            <!--</tr>-->
            <!--<tr class="car-table-body-package-tr" v-if="article.type == 3 && article.isOpen"-->
                <!--v-for="item in article.mealItems">-->
              <!--<td></td>-->
              <!--<td style="text-align: justify;">|_{{item.name}}</td>-->
              <!--<td>{{item.count}}</td>-->
              <!--<td></td>-->
            <!--</tr>-->
          <!--</template>-->
          <!--</tbody>-->
        <!--</table>-->
      </div>

      <div class="car-footer">
        <el-row class="order-payment">
          <el-col :span="12">
            合计:<span class="order-payment-num">{{ orderInfo.count_with_child || orderInfo.article_count }}</span> 项
          </el-col>
          <el-col :span="12">
            总计:<span class="order-payment-num">￥{{ formatMoney(orderInfo.amount_with_children || orderInfo.order_money || 0) }}</span>
          </el-col>
        </el-row>
        <hr style="border: 1px dashed #dfdfdf; width: 90%;">
        <el-row  type="flex" justify="space-around" class="order-operate-button">
          <el-col :span="12">
            <button class="operate-button operate-button-push-order" @click="printKitchenTotal">打印厨打</button>
          </el-col>
          <el-col :span="12" >
            <button class="operate-button operate-button-push-order" @click="printTotal">打印总单</button>
          </el-col>
        </el-row>

        <!--<el-row class="order-payment">-->
          <!--<el-col :span="24">-->
            <!--<span>总计：{{ orderInfo.count_with_child || orderInfo.article_count }}项／￥ {{(orderInfo.amount_with_children || orderInfo.order_money || 0 ).toFixed(2)}}</span>-->
          <!--</el-col>-->
        <!--</el-row>-->
        <!--<el-row class="order-payment">-->
          <!--<el-col :span="10">-->
            <!--应收：￥ {{(orderInfo.payOrderMoney || 0).toFixed(2)}}-->
          <!--</el-col>-->
          <!--&lt;!&ndash;付款方式的标志 第一版先不考虑&ndash;&gt;-->
          <!--<el-col :span="14" style="text-align: right;padding-right: 30px" v-if="orderInfo.state>=2">-->
            <!--&lt;!&ndash;<img src="../../../assets/wechat.png" alt="" style="height: 25px; width: 25px;margin-top: 5px" />&ndash;&gt;-->
            <!--&lt;!&ndash;<img src="../../../assets/alipay.png" alt="" style="height: 25px; width: 25px;margin-top: 5px" />&ndash;&gt;-->
            <!--&lt;!&ndash;<img src="../../assets/bankCard.png" alt="" style="height: 25px; width: 25px;margin-top: 5px" />&ndash;&gt;-->
            <!--&lt;!&ndash;<img src="../../assets/dazhongdianping.png" alt="" style="height: 25px; width: 25px;margin-top: 5px" />&ndash;&gt;-->
            <!--&lt;!&ndash;<img src="../../assets/cash.png" alt="" style="height: 25px; width: 25px;margin-top: 5px" />&ndash;&gt;-->
            <!--&lt;!&ndash;<img src="../../assets/vip.png" alt="" style="height: 25px; width: 25px;margin-top: 5px" />&ndash;&gt;-->
          <!--</el-col>-->
        <!--</el-row>-->
        <!--<el-row class="order-payment">-->
          <!--<el-col :span="12">-->
            <!--&lt;!&ndash;<span v-if="orderInfo.order_state >=2">实收：￥  {{orderInfo.amount_with_children ? orderInfo.amount_with_children.toFixed(2) : (!!orderInfo.order_money?orderInfo.order_money.toFixed(2):'')}}</span>&ndash;&gt;-->
            <!--<span v-if="orderInfo.order_state >=2">实收：￥  {{orderInfo.order_money.toFixed(2)}}</span>-->
            <!--<span v-else>实收：￥ 0</span>-->
          <!--</el-col>-->
          <!--<el-col :span="12" style="text-align: right;padding-right: 30px">-->
            <!--<strong>找零：￥ 0</strong>-->
          <!--</el-col>-->
        <!--</el-row>-->
        <!--<el-row style="text-align: center;background-color: #252525;color: #fff; opacity: 0.9;">-->
          <!--<el-col :span="6">-->
            <!--<span style="color: #032DF9;font-size: 0.7em;">●</span>已下单-->
          <!--</el-col>-->
          <!--<el-col :span="6">-->
            <!--<span style="color: #FCEC03;font-size: 0.7em;">●</span>待下单-->
          <!--</el-col>-->
          <!--<el-col :span="6">-->
            <!--<span style="color: #00FF30;font-size: 0.7em;">●</span>折扣标-->
          <!--</el-col>-->
          <!--<el-col :span="6">-->
            <!--<span style="color: #D40007;font-size: 0.8em;"><s>已退菜</s></span>-->
          <!--</el-col>-->
        <!--</el-row>-->
      </div>
    </div>
    <div v-else>
      <h2 style="text-align: center;margin-top: 50%">
        <img src="../../../assets/shaolei_img/symbols-meiyoushangpin.png" alt="">
      </h2>
    </div>

    <!-- 退菜弹窗-->
    <el-dialog title="改单／退菜" :visible.sync="changeOrder.show" size="large" :close-on-click-modal="false" :before-close="closeChangeOrderDialog" id="refundDialog">
      <div  v-loading.body="refundLoading" element-loading-text="正在请求数据 . . .">
      <template>
        <ul  class="change-order-content" style="background-color: #E2E2E2">
          <li>
            <span style="width: 40%;">菜品名称</span>
            <span style="width: 20%;">菜品单价</span>
            <span style="width: 30%">退菜数量</span>
          </li>
        </ul>
        <ul  class="change-order-content" id="change-pages" style="overflow-y: scroll;max-height: 200px;">
          <li v-for="(item,index) in changeOrderItem" >
            <div class="article-item"  style="width: 40%; line-height: 50px;">{{item.name}}</div>
            <div class="article-item" style="width: 20%;line-height: 50px">{{(item.tempPrice / item.tempCount).toFixed(2)}}</div>
            <div class="article-item" style="width: 30%; line-height: 50px;">
              <p class="control-count" @click="cutArticleCount(item)">-</p>
              &nbsp;{{item.refundCount}}&nbsp;
              <p class="control-count"  @click="addArticleCount(item)">+</p>
            </div>
          </li>
        </ul>
        <div class="refund-page-wrapper">
          <div class="pre-page" @click="changeOrderPages(-1)"><span class="el-icon-caret-top"></span></div>
          <div class="next-page" @click="changeOrderPages(1)"><span class="el-icon-caret-bottom"></span></div>
        </div>
        <!--<div style="text-align: center;height: 50px;">-->
          <!--<div style="display: inline-block; margin-top: 10px;">-->
            <!--<i class="iconfont icon-arrow-left" style="font-size: 40px;" @click="changeOrderPages(-1)"></i>-->
            <!--<span style="font-size: 30px">&emsp;</span>-->
            <!--<i class="iconfont icon-arrow-right"  style="font-size: 40px;" @click="changeOrderPages(1)"></i>-->
          <!--</div>-->
          <!--<div style="display: inline-block; margin-left: 15px;vertical-align: top;margin-top: 20px;" >-->
            <!--<div style="display: inline-block; height: 62px;line-height: 30px; vertical-align: top; font-size: 18px;">退菜口令:</div>-->
            <!--<input type="password"-->
                   <!--style="border: 1px solid black;height: 30px; width:60%; border-radius: 5px; font-size: 16px;"-->
                   <!--v-model="refundCommand"-->
                  <!--@click="focus()"-->
            <!--&gt;-->
          <!--</div>-->
        <!--</div>-->


        <!--<keyboard-->
          <!--style="position: absolute;z-index: 9999;left: -110px;"-->
          <!--v-show="currentInput"-->
          <!--:keyboard-text.sync="refundCommand" @childKey="get"-->
        <!--&gt;-->

        <!--</keyboard>-->


        <div style="margin-top: 10px; width: 60%;" v-if="refundRemarks && refundRemarks.length > 0">
          <h3 style="font-weight: bold;margin-left: 5px;display: inline-block;width: 20%;">退菜原因:</h3>
          <el-select  v-model="refundRemark" placeholder="请选择" style="width: 50%;">
            <el-option
              v-for="item in refundRemarks"
              :key="item.id"
              :label="item.name"
              :value="item.id + '_' + item.name">
            </el-option>
          </el-select>
        </div>

        <div style="margin-top: 10px; width: 60%;">
          <h3 style="font-weight: bold;margin-left: 5px;display: inline-block;width: 20%;">退菜口令:</h3>
          <input type="password"
                 autocomplete="new-password" readonly onfocus="this.removeAttribute('readonly');"
                 style="display: inline-block; border:1px solid grey; height: 30px;border-radius: 5px;width: 50%;"
                 data-name="refundCommand"
                 v-model="refundCommand" @click="focus()">

        </div>


        <div style= "margin-top: 10px; width: 80%;">
          <h3 style="font-weight: bold;margin-left: 5px;display: inline-block;width: 100%;">退款总额：&nbsp;&nbsp;&nbsp;&nbsp;¥ {{tipRefundMoney.toFixed(2)}}</h3>
          <h3 style="font-weight: bold;margin-left: 5px;display: inline-block;width: 100%;margin-top: 10px;">退款方式：&nbsp;&nbsp;&nbsp;&nbsp;¥ {{refundMoneyMessage}}</h3>
          <!--<span>退款方式：</span>-->
          <!--
            如果是改单，则所有选项不可选，如果是退菜，那么1 是否是微信端  是，再判断是否是 余额+银行卡  是 两个可以选择，2 判断是否是pos端，如果是pos端，
            只有退还现金一个选项
          -->
          <!--<el-radio class="radio" v-model="radio" label="1" :disabled="refundCashMoneyState">退还现金</el-radio>-->
          <!--<el-radio class="radio" v-model="radio" label="0" :disabled="refundRemainMoneyState">退菜余额红包</el-radio>-->
        </div>
      </template>

      <span slot="footer" class="dialog-footer">
        <div style="width: 100%;margin-top: 20px;text-align: center;">
          <el-button  @click="closeChangeOrderDialog()">取 消</el-button>
          &nbsp;&nbsp;&nbsp;&nbsp;
          <el-button @click="saveChange">确 定</el-button>
        </div>
      </span>
      </div>
    </el-dialog>
  </div>
</template>

<script>
  import {
    getOrderDetail,
    getRefundRemarkList,
    refundOrder,
    updateOrderSyncState,
    getPaymentSelectByOrderId,
    printTotal ,
    printRefundTotal,
    printKitchenTotal,
    getPaymentItemListByOrderId,
    refundOrderNew,
    getCustomerInfo
  } from 'api/api';
  import {formatDate} from '../../..//utils/generalUtil';
  import bus from  '../../../utils/bus'
  import keyboard from '../../../components/keyboard/keyboard'
  export default {
    name: 'detail',
    components:{ keyboard},
    data() {
      return {
        innerVisible: false,
        orderId: null,
        maskHeight: 0, // 遮罩层的高度
        panelTitleHeight: 0, // 客单的高度
        showDetails: false,
        totalPrice: 0,
        amountCount: 0,
        carTableHeight: 0,
        orderInfo: {},
        car: [],

        // 退菜开始需要的选项
        changeOrder: { // 退菜
          isClick: false,
          isCheck: false,
          isCheckOne: false,
          flags: false,
          currentIndex: 0,
          show: false, // 退菜弹窗显示
        },
        currentCarTableRow: {
          index: 0,
          info: {}
        },
        checkAllFlag: false,
        changeOrderItem: [],
        refundRemarks: [],
        refundCommand:'', // 退菜口令
        refundMoneyMessage:'暂无消息', // 退菜提醒，比如，退了多少钱
        refundList: [], // 退菜数组
        shopDet: {},
        shopModel:'',
        orderPaymentList: [],
        refund: {},
        localRefund: {},
        refundMoney : 0, // 退的所有的钱
        refundAllCount: 0,
        refundMealAllNumber: 0,// 退掉的总的 餐盒个数
        refundMealAllPrice: 0,  // 退掉的总的 餐盒钱数
        tipRefundMoney: 0,
        refundRemark: '',
        currentInput: false,
        radio: 0,
        refundPaymentList:[],
        refundLoading: false,
        customerInfo:{},
      };
    },
    watch: {
      '$route.params': function (params) {
        this.$message.closeAll();
        this.orderId = params.orderId || null;
        this.initOrder();
        this.closeChangeOrderDialog();
        this.getPaymentItemList(this.orderId)
      }
    },
    mounted() {
      let that = this;
      this.shopDet = JSON.parse(sessionStorage.getItem("shopDet"));
      this.shopModel = this.shopDet.shop_mode;
      this.$message.closeAll();
      // 初始化 购物车 Table 的高度
      this.carTableHeight = document.body.clientHeight - 300;
      this.orderId = this.$route.params.orderId || null;
      this.initOrder();

      this.getRefundRemarkList();
      this.getPaymentItemList(this.orderId);

      bus.$on("changeOrder", function (change) {
        if(that.changeOrderItem.length <= 0) {
          that.$message.warning("所选退菜数量为0");
          return;
        }

        that.changedOrder(0);
        that.refundCommand = "";
        that.changeOrder.show = true;
      });

      bus.$on('refund-command', function (value) {
        that.refundCommand = value;
      })
    },

    beforeDestroy () {
      bus.$off('changeOrder')
      bus.$off("refund-command")
    },

    methods: {

      get(key) {
          this.refundCommand = (key == 'del' ? this.refundCommand.substring(0, this.refundCommand.length - 1) : this.refundCommand += key);
      },
      //===============================
      //  初始化购物车
      //===============================
      initOrder() {
        let that = this;
        getOrderDetail(this.orderId, function (data) {
          if(data && data.id){
            that.orderInfo = data;
            that.initCar(that.orderInfo);
            that.getCustomerInfo(that.orderInfo.customer_id);
          }else{
            that.orderInfo = {};
          }
        });
      },
      initCar(orderInfo) {
        let orderItemMap = {};
        for (let orderItem of orderInfo.order_item_list) {
          let item = {};
          // 套餐主项
          if (orderItem.type === 3) {
            let packageItem = orderItemMap[orderItem.id];
            if (packageItem && packageItem.id) {
              orderItem.mealItems = packageItem.mealItems;
            }
          }
          // 套餐子项
          if (orderItem.type === 4) {
            let packageItem = orderItemMap[orderItem.parent_id] || {};
            packageItem.mealItems = (packageItem.mealItems || []);
            packageItem.mealItems.push({
              id: orderItem.article_id,
              count: orderItem.count,
              name: orderItem.article_name,
              price: orderItem.original_price
            });
            if (!packageItem.id) {
              packageItem.id = orderItem.parent_id;
              orderItemMap[packageItem.id] = packageItem;
            }
            continue;
          }

          item = {
            time: this.$utils.generateUUID(),
            id: orderItem.article_id,

            ownId: orderItem.id, // 新增，订单id
            orderId: orderItem.order_id, // 主订单id
            unitPrice: orderItem.unit_price, // 新增 unitPrice
            payModeId: orderItem.payment_mode_id, // 支付类型
            originCount: orderItem.orgin_count, // 原始的菜品数量

            mealFeeNumber: orderItem.meal_fee_number, // 每一项所有的餐盒数量
            mealFeeNumberOne: orderItem.meal_fee_number / orderItem.count, // 每一项的每一道菜所需要的餐盒个数
            refundChange: 0, // 这个字段用来计算每一个菜品项需要退多少餐盒

            count: orderItem.count,   // 剩余的菜品数量
            tempCount: orderItem.count,

            tempRefundCount: orderItem.refund_count,

            type: orderItem.type,
            name: orderItem.article_name,
            price: orderItem.final_price,
            tempPrice: orderItem.final_price,

            isOpen: false,
            status: orderItem.status,

            extraPrice: 0 // 新增 额外费用
          };
          if (item.type === 3) {
            item.mealItems = orderItem.mealItems;
          }
          orderItemMap[orderItem.id] = item;
        }
        this.car = [];  // 清空购物车
        // 插入购物车
        for (let key in orderItemMap) {
          // 套餐总价（加上子项差价）
          if(orderItemMap[key].type === 3){
            for(let items of orderItemMap[key].mealItems){
              if(items.count>0){
                orderItemMap[key].price += items.price;
              }
            }
          }
          this.car.push(orderItemMap[key]);
        }
        //子项订单遍历
        let chrildrenItemMap = {};
        if (orderInfo.childreorder_item_list.length > 0) {
          for (let childrenOrderItem of orderInfo.childreorder_item_list) {
            let childrenItem = {};
            // 套餐主项
            if (childrenOrderItem.type === 3) {
              let packageItem = orderItemMap[childrenOrderItem.id];
              if (packageItem && packageItem.id) {
                childrenOrderItem.mealItems = packageItem.mealItems;
              }
            }
            // 套餐子项
            if (childrenOrderItem.type === 4) {
//              let packageItem = chrildrenItemMap[childrenOrderItem.parent_id] || {};
              let packageItem = orderItemMap[childrenOrderItem.parent_id] || {};
              packageItem.mealItems = (packageItem.mealItems || []);
              packageItem.mealItems.push({
                id: childrenOrderItem.article_id,
                count: childrenOrderItem.count,
                name: childrenOrderItem.article_name,
                price: childrenOrderItem.original_price
              });

              if (!packageItem.id) {
                packageItem.id = childrenOrderItem.parent_id;
                orderItemMap[packageItem.id] = packageItem;
              }
              continue;
            }
            childrenItem = {
              time: this.$utils.generateUUID(),
              id: childrenOrderItem.article_id,

              ownId: childrenOrderItem.id, // 订单ID
              orderId: childrenOrderItem.order_id, // 主订单ID
              unitPrice: childrenOrderItem.unit_price, // 单价
              payModeId: childrenOrderItem.payment_mode_id,//
              originCount: childrenOrderItem.orgin_count,


              mealFeeNumber: childrenOrderItem.meal_fee_number, // 每一项所有的餐盒数量
              mealFeeNumberOne: childrenOrderItem.meal_fee_number / childrenOrderItem.count, // 每一项的餐盒个数
              refundChange: 0, // 这个字段用来计算每一个菜品项需要退多少餐盒

              count: childrenOrderItem.count, // 数量
              tempCount: childrenOrderItem.count, // 剩余数量

              tempRefundCount: childrenOrderItem.refund_count,

              type: childrenOrderItem.type, // 类型
              name: childrenOrderItem.article_name,
              price: childrenOrderItem.final_price,
              tempPrice: childrenOrderItem.final_price,

              isOpen: false,
              notes: '(加菜)',
              status: childrenOrderItem.status,

              extraPrice: 0 // 新增 额外费用(餐盒费，服务费等) 注意，初代版本不要求，所以是0
            };
            if (childrenItem.type === 3) {
              childrenItem.mealItems = childrenOrderItem.mealItems;
            }
            chrildrenItemMap[childrenOrderItem.id] = childrenItem;
          }
          for (let key in chrildrenItemMap) {
            if(chrildrenItemMap[key].type === 3){
              for(let items of chrildrenItemMap[key].mealItems){
                if(items.count) {
                  chrildrenItemMap[key].price += items.price;
                }
              }
            }
            this.car.push(chrildrenItemMap[key]);
          }
        }
        if(orderInfo.service_price){
          this.car.push({
            time: this.$utils.generateUUID(),
            serverPrice: true,
            count: orderInfo.customer_count,
            name: "服务费",
            price: orderInfo.service_price,
          });
        }
      },

      // getCustomerInfo
      getCustomerInfo(customerId) {
        let that = this;
        getCustomerInfo(customerId, function (customerInfo) {
          that.customerInfo = customerInfo;
        })
      },
      //===============================
      //  退菜功能
      //===============================

      // 获取支付列表
      getPaymentItemList(orderId) {
        let that = this;
        getPaymentItemListByOrderId(orderId, function (payOrderList) {
          that.orderPaymentList = payOrderList;
        });
      },

      // 关闭弹窗
      changeClose(done) {
        this.$confirm('确认关闭？')
          .then(_ => {
            done();
          })
          .catch(_ => {
          });
      },

      choseCarTableRow(article, index) {  //  展开套餐，出现单选和全选
        if(article.serverPrice){
          return;
        }
        if (article.type === 3) { // 套餐
          article.isOpen = !article.isOpen;
        }
        this.changeOrder.isClick = true;
        this.currentCarTableRow.info = article;
        this.currentCarTableRow.index = index;
      },

      checkOne: function (item) { // 单选
        if(item.serverPrice){
          return;
        }
        if(item.count <=0) {
          this.$message.warning("当前所选菜品数量为0")
          return
        }

        if (typeof item.checked == 'undefined' || item.checked==false ) {
          this.$set(item, "checked", true);
          if(item.status !=3) this.changeOrderItem.push(item);
        } else {
          item.checked = !item.checked;
          let that = this;
          this.changeOrderItem.map(function (ordItem, index) {
            if (ordItem.id == item.id) {
              that.changeOrderItem == that.changeOrderItem.splice(index, 1);
              that.checkAllFlag = false;
            }
          })
        }
      },

      checkAll: function (flag) {// 全选
        this.checkAllFlag = flag;
        var that = this;
        that.changeOrderItem = [];
        this.car.forEach(function (item, index) {
          if(!item.serverPrice){
            if (item.count == 0) {
              that.$message.warning("当前所选菜品数量有为0项，无法全选")
              return
            }

            if (typeof item.checked == 'undefined', that.checkAllFlag) {
              that.$set(item, "checked", that.checkAllFlag);
              if(item.status !=3) that.changeOrderItem.push(item);
            } else {
              item.checked = that.checkAllFlag;
              that.changeOrderItem = [];
            }
          }
        })
      },

      changedOrder() {

        if (this.changeOrderItem.length == 0) {
          this.$message("您还没选择任何菜品");
          return;
        }
        for(var item of this.changeOrderItem){
          if(item.type == 3) {
            item.mealItems.map(function (mealItem) {
              item.tempPrice += mealItem.price;
            })
          }

          item.orderId = item.orderId
          item.price = 0;
          item.currentOriginCount = 0;
          item.currentOriginPrice = item.price;
          // item.mealItems = '';
          item.count = 0;
          item.refundCount = item.tempCount;
          item.refundItemCount = item.tempCount;
          item.refundChange= item.tempCount;
          item.mealFeeNumber = 0;
          this.refundAllCount += item.refundCount;
          this.refundMoney += item.tempPrice;
          this.refundMealAllNumber += (item.mealFeeNumberOne * item.tempCount);
          this.formatRefundListItem(item)
        }
        this.saveFormatData()
      },

      // 初始化退菜 数组
      formatRefundListItem(item){
        let newItem = item;
        for (let reListItem of this.refundList) {
          if (newItem.orderId === reListItem.orderId) {
            reListItem.orderId = newItem.orderId
            reListItem.count += newItem.tempCount;
            reListItem.price += newItem.tempPrice;
            return;
          }
        }
        let reListItem = {
          orderId: newItem.orderId,
          price: newItem.tempPrice,
          count: newItem.refundCount,
        };
        this.refundList.push(reListItem)
      },

      // 退的份数减一
      cutArticleCount(item) {
        if (item.refundCount <= 1) {
          this.$message('已经减到最少了');
          return;
        }
        // 如果是套餐
        if (item.type == 3 && item.mealItems) {
          for(let mealItem of item.mealItems) {
            item.unitPrice += mealItem.price;
          }
        }

        this.formatAddRefundList(item);
        item.price +=item.unitPrice;
        item.refundChange --; // 每一项所菜品所退的个数
        item.count++; // 还剩余的菜品数量
        item.refundCount --;
        item.refundItemCount --;
        item.mealFeeNumber = item.mealFeeNumberOne * item.count;
        this.refundMoney -= item.unitPrice; // 退的所有的钱
        this.refundAllCount --;
        this.refundMealAllNumber -= item.mealFeeNumberOne;
        this.$message('减少一份');

        this.saveFormatData() //

      },

      // 格式化退菜数组 这是减菜所要调用的
      formatRefundList(item){
        let newItem = item;
        var key = true;
        while (key) {
          for (let reListItem of this.refundList) {
            if (newItem.orderId === reListItem.orderId) {
              reListItem.count --;
              reListItem.price -= newItem.unitPrice;
              key = false;
            }
          }
          let reListItem = {
            orderId: newItem.orderId,
            price: newItem.refundCount * item.unitPrice,
            count: newItem.refundCount,
          }
          if(key == true) {
            this.refundList.push(reListItem)
            key = false;
          }
        }
      },

      // 退的份数加一
      addArticleCount(item) {
        if (item.refundItemCount >= item.tempCount) {
          this.$message('退的够多了');
          return;
        } else {
          this.formatRefundList(item);
          item.price -= item.unitPrice
          item.refundChange ++; // 每一项所菜品所退的个数
          item.count --; // 还剩余的菜品数量
          item.refundCount ++;
          item.refundItemCount ++;
          item.mealFeeNumber = item.mealFeeNumberOne * item.count;
          this.refundMoney += item.unitPrice; // 退的所有的钱
          this.refundAllCount ++;
          this.refundMealAllNumber += item.mealFeeNumberOne;
          this.saveFormatData() //
          this.$message("退的份数加1");
        }
      },
      // 格式化退菜数组 这是+ 所需要调用的
      formatAddRefundList(item){
        for(var refundListItem of this.refundList) {
          if(refundListItem.orderId === item.orderId && item.type == 3) {
            refundListItem.price  -= item.unitPrice
            refundListItem.count --;
          }else if(refundListItem.orderId === item.orderId) {
            refundListItem.price  -= item.unitPrice
            refundListItem.count --;
          }
        }
      },

      // 保存退菜数据格式化
      saveFormatData() {
        let refundOrderItem = [];
        let refundItem = {};

        let localRefundOrderItem = [];
        let localRefundItem = {};

        let {meal_fee_price, is_meal_fee} = this.shopDet;
        let mealFeePriceOne = this.orderInfo.distribution_mode_id == 3 ? ( is_meal_fee ? meal_fee_price : 0) : 0;
        this.changeOrderItem.forEach(function (item) {
          refundItem = {
            id: item.ownId,
            articleId: item.id,
            orderId: item.orderId,
//            type: item.type,
            type: 1,
            count:item.refundChange,
           unitPrice: item.unitPrice,
//             unitPrice: item.tempPrice,
//             unitPrice: item.refundItemCount * item.unitPrice,
            extraPrice: item.mealFeeNumberOne * item.refundChange * mealFeePriceOne // extraPrice 这里是指退的餐盒费（外带和外卖并且开启了餐盒费才会有餐盒费）
          };
          refundOrderItem.push(refundItem);
          localRefundItem = {
            id: item.ownId,
            articleId: item.id,
            orderId: item.orderId,
            type: item.type,
            mealItems: item.mealItems, // 套餐子项
            count: item.count, // 剩余的数量
            refundCount: item.refundCount, // 退的数量
            refundItemCount: item.originCount - item.count, // 退的单个菜品总个数
            unitPrice: item.unitPrice,
            mealFeeNumber: item.count * item.mealFeeNumberOne,     // 剩余的餐盒数量(剩余的数量 * 每一项每一个所需的餐盒个数)
            refundMealFeeItemOfPrint: item.mealFeeNumberOne * item.refundCount
          };
          localRefundOrderItem.push(localRefundItem);
        });
        this.refund = {
          id: this.orderInfo.id,
          refundMoney: this.refundMoney,
          orderItems: refundOrderItem,
          orderRefundRemarks: [],
          remarkSupply: null,
          refundType: this.radio
        };
        // 需要存储在本地的字段
        this.localRefund = {
          id: this.orderInfo.id,
          refundWay: this.radio,
          orderPaymentList: this.orderPaymentList, // 支付项列表
          refundMoney: this.refundMoney || 0, // 退的，所有菜品的钱数
          refundAllCount: this.refundAllCount || 0, // 退的所有的数量
//          payModeId: this.orderInfo.customer_id == null ? 12 : this.orderInfo.pay_mode,
          payModeId: 12,
          orderItems: localRefundOrderItem,
          refundMealAllNumber: this.refundMealAllNumber,// 退掉的总的 餐盒个数
          refundMealAllPrice: this.refundMealAllNumber * mealFeePriceOne,  // 退掉的总的 餐盒钱数
          isMealFee: is_meal_fee,    // 是否开启 餐盒费 0 未开启 1 开启
          refundList: this.refundList, // 退的 菜品归类处理，同一类型归同一类
          refundRemark: this.refundRemark //  退菜 备注
        };

        this.refundTip(this.localRefund);
      },

      getRefundRemarkList(){ // 退菜原因
        var that = this;
        this.refundRemarks = [];
        getRefundRemarkList(function (data) {
          if(data){
            that.refundRemark = data[0].id + "_" + data[0].name;
            data.map(function (item) {
              that.refundRemarks.push(item);
            });
          }
        });
      },

      refundTip(refund){

        console.log(refund.refundMoney)

        var refundMoney = (refund.refundMoney + refund.refundMealAllPrice) || 0 ;

        this.tipRefundMoney = (refund.refundMoney + refund.refundMealAllPrice) || 0;

        let orderPaymentList = this.orderPaymentList;

        let phoneAlipay = 0; // 支付宝
        let phoneWechat = 0; // 微信
        let phoneRemain = 0; // 余额
        let posAdd = 0; // 现金支付

        orderPaymentList.filter( item =>{
          return item.resultData
        }).map(function (item) {
            switch (item.paymentModeId) {
              case 1:
                phoneWechat = +(phoneWechat + item.payValue).toFixed(2);
                break;
              case 10:
                phoneAlipay = +(phoneAlipay + item.payValue).toFixed(2);
                break;
              default:
                phoneRemain = +(phoneRemain + item.payValue).toFixed(2);
            }
        })

        orderPaymentList.filter(item=>{
          return !item.resultData
        }).map(function (item) {
          posAdd = +(posAdd + item.payValue).toFixed(2);
        });

        console.log("phoneAlipay"+phoneAlipay);
        console.log("phoneWechat"+phoneWechat);
        console.log("phoneRemain"+phoneRemain);
        console.log("posAdd"+posAdd);
        console.log("refundMoney"+ refundMoney);
        // phone.filter(item => {
        //   return item.paymentModeId == 1 || item.paymentModeId == 10
        // }).map(function (item) {
        //   phoneAdd += item.payValue
        //   phoneMap[item.paymentModeId] = item.payValue;
        // })
        //
        // pos.map(function (item) {
        //   posAdd += item.payValue;
        // });

        if(this.orderInfo.order_state < 2 || this.orderInfo == 9) {
          return;
        }

        //=============================
        //        优先微信和支付宝
        //=============================

        // 第一种情况， 退的时候只需要退一种支付方式
        if (phoneWechat && (phoneWechat - refundMoney) >= 0 ) { // 只退微信
          this.refundMoneyMessage = `应退微信${refundMoney.toFixed(2)}元`
          this.refundPaymentList.push({
            paymentModeId: 1,
            money: refundMoney
          })
          return;
        }

        if(phoneAlipay && (phoneAlipay - refundMoney) >= 0) { //只退支付宝
          this.refundMoneyMessage = `应退支付宝${refundMoney.toFixed(2)}元`
          this.refundPaymentList.push({
            paymentModeId: 10,
            money: refundMoney
          })
          return;
        }

        if(posAdd && (posAdd - refundMoney) >= 0) { // 只退现金
          if(!phoneWechat && !phoneAlipay) {
            this.refundMoneyMessage = `应退现金${refundMoney.toFixed(2)}元`
            this.radio = 1;
            this.refundPaymentList.push({
              paymentModeId: 19,
              money: refundMoney
            })
            return;
          }
        }

        if(phoneRemain && (phoneRemain - refundMoney) >= 0) { // 只退余额
          if(!phoneWechat && !phoneWechat) {
            this.refundMoneyMessage = `应退余额${refundMoney.toFixed(2)}元`
            this.refundPaymentList.push({
              paymentModeId: 11,
              money: refundMoney
            })
            return;
          }
        }

        // 两种退款方式 排列组合 A(4,2)
        // 情况一 微信与其它支付方式组合
        if(phoneWechat > 0 && (phoneWechat - refundMoney) < 0) {
          let remain = +(refundMoney - phoneWechat).toFixed(2);
          if(phoneAlipay - remain >= 0){ // 微信+支付宝
            this.refundMoneyMessage = `应退微信${phoneWechat.toFixed(2)}元,应退支付宝${remain.toFixed(2)}元`;
            this.refundPaymentList.push({paymentModeId: 1, money: phoneWechat})
            this.refundPaymentList.push({paymentModeId: 10, money: remain})
            return;
          }
          if(posAdd - remain >= 0){ // 微信+现金
            this.refundMoneyMessage = `应退微信${phoneWechat.toFixed(2)}元,应退现金${remain.toFixed(2)}元`;
            this.refundPaymentList.push({paymentModeId: 1, money: phoneWechat})
            this.refundPaymentList.push({paymentModeId: 19, money: remain})
            this.radio = -1;
            return;
          }
          if (phoneRemain - remain >= 0) { // 微信+余额
            this.refundMoneyMessage = `应退微信${phoneWechat.toFixed(2)}元,应退余额${remain.toFixed(2)}元`;
            this.refundPaymentList.push({paymentModeId: 1, money: phoneWechat})
            this.refundPaymentList.push({paymentModeId: 11, money: remain})
            return;
          }
        }
        // 支付宝与其它方式组合
        if(phoneAlipay > 0 && (phoneAlipay - refundMoney) < 0) {
          let remain =+(refundMoney - phoneAlipay).toFixed(2);
          if(posAdd - remain >= 0){ // 支付宝+现金
            this.refundMoneyMessage = `应退支付宝${phoneAlipay.toFixed(2)}元,应退现金${remain.toFixed(2)}元`;
            this.refundPaymentList.push({paymentModeId: 1, money: phoneAlipay})
            this.refundPaymentList.push({paymentModeId: 19, money: remain})
            this.radio = -1;
            return;
          }
          if (phoneRemain - remain >= 0) { // 支付宝 + 余额
            this.refundMoneyMessage = `应退支付宝${phoneAlipay.toFixed(2)}元,应退余额${remain.toFixed(2)}元`;
            this.refundPaymentList.push({paymentModeId: 10, money: phoneAlipay})
            this.refundPaymentList.push({paymentModeId: 11, money: remain})
            return;
          }
        }
        // 现金 + 余额
        if(posAdd > 0 &&  (posAdd - refundMoney) < 0) {
          let remain =+(refundMoney - posAdd).toFixed(2);
          if(phoneRemain - remain >=0 ) {
            this.refundMoneyMessage = `应退现金${posAdd.toFixed(2)}元,应退余额${remain.toFixed(2)}元`;
            this.refundPaymentList.push({paymentModeId: 19, money: posAdd});
            this.refundPaymentList.push({paymentModeId: 11, money: remain});
            this.radio = -1;
            return;
          }
        }

        //  三种组合 1 微信+支付宝+现金 2 微信+支付宝+余额 3 微信+现金+余额  3 支付宝+现金+余额
        if(phoneWechat > 0 && (phoneWechat - refundMoney) < 0) {
          let remain =+(refundMoney - phoneWechat).toFixed(2);
          if((phoneAlipay - remain) < 0) {
            let remainMoney = +(remain - phoneAlipay).toFixed(2);
            if(posAdd - remainMoney >=0 ) {
              this.refundMoneyMessage = `应退微信${phoneWechat.toFixed(2)}元,应退支付宝${phoneAlipay.toFixed(2)}元，应退现金${remainMoney.toFixed(2)}元`;
              this.refundPaymentList.push({paymentModeId: 1, money: phoneWechat})
              this.refundPaymentList.push({paymentModeId: 10, money: phoneAlipay})
              this.refundPaymentList.push({paymentModeId: 19, money: remainMoney})
              this.radio = -1;
              return;
            }
            if(phoneRemain - remainMoney >=0 ) {
              this.refundMoneyMessage = `应退微信${phoneWechat.toFixed(2)}元,应退支付宝${phoneAlipay.toFixed(2)}元，应退余额${remainMoney.toFixed(2)}元`;
              this.refundPaymentList.push({paymentModeId: 1, money: phoneWechat})
              this.refundPaymentList.push({paymentModeId: 10, money: phoneAlipay})
              this.refundPaymentList.push({paymentModeId: 11, money: remainMoney})
              return;
            }
          }

          if(posAdd - remain < 0) { // 现金  优惠券
            let remainMoney = +(remain - posAdd).toFixed(2);
            if(phoneRemain - remainMoney >= 0) {
              this.refundMoneyMessage = `应退微信${phoneWechat.toFixed(2)}元,应退现金${posAdd.toFixed(2)}元，应退余额${remainMoney.toFixed(2)}元`;
              this.refundPaymentList.push({paymentModeId: 1, money: phoneWechat})
              this.refundPaymentList.push({paymentModeId: 19, money: posAdd})
              this.refundPaymentList.push({paymentModeId: 11, money: remainMoney})
              this.radio = -1;
              return;
            }
          }
        }

        if(phoneAlipay > 0 && (phoneAlipay - refundMoney) < 0) {
          let remain = +(refundMoney - phoneAlipay).toFixed(2);
          if(posAdd > 0 && posAdd - remain < 0) {
            if(!phoneWechat) {
              let remainMoney = +(remain - posAdd).toFixed(2);
              this.refundMoneyMessage = `应退支付宝${phoneAlipay.toFixed(2)}元,应退现金${posAdd.toFixed(2)}元,应退余额${remainMoney.toFixed(2)}元`;
              this.refundPaymentList.push({paymentModeId: 10, money: phoneAlipay})
              this.refundPaymentList.push({paymentModeId: 19, money: posAdd})
              this.refundPaymentList.push({paymentModeId: 11, money: remainMoney})
              this.radio = -1;
              return;
            }
          }
        }

        // 四种组合 微信+支付宝+现金+余额
        if(phoneWechat > 0 && phoneWechat - refundMoney < 0) {
          let remain = +(refundMoney - phoneWechat).toFixed(2);
          if(phoneAlipay > 0 && phoneAlipay - remain <0) {
            let remainMoney = +(remain - phoneAlipay).toFixed(2);
            if(posAdd > 0 && posAdd - remainMoney < 0) {
              let remainMoneyLast = +(remainMoney - posAdd).toFixed(2)
              if(phoneRemain > 0) {
                this.refundMoneyMessage = `应退微信${phoneWechat.toFixed(2)}元，应退支付宝${phoneAlipay.toFixed(2)}元，应退现金${posAdd.toFixed(2)}元，应退余额${remainMoneyLast.toFixed(2)}元`
                this.radio = -1;
                return;
              }
            }
          }
        }

        // //========================
        // //      支付宝／微信支付
        // //========================
        // if(phone && phoneAdd > 0) { // 微信
        //   var remainMoney = phoneAdd > refundMoney ? 0 : (refundMoney - phoneAdd);
        //   var paymentModeId = phoneMap[1] ? 1 : 10;
        //   if(remainMoney && remainMoney > 0) {
        //     if(paymentModeId == 1) {
        //       var message = `应退支付宝${phoneAdd.toFixed(2)}元--应退余额${remainMoney.toFixed(2)}元，`
        //       this.refundMoneyMessage = message
        //     }else if(paymentModeId == 10) {
        //       var message = `应退微信${phoneAdd.toFixed(2)}元--应退余额${remainMoney.toFixed(2)}元，`
        //       this.refundMoneyMessage = message
        //     }
        //     return;
        //   }
        //   if(!remainMoney) {
        //     if(paymentModeId == 1) {
        //       this.refundMoneyMessage = `应退微信${refundMoney.toFixed(2)}元`
        //     } else if(paymentModeId == 10) {
        //       this.refundMoneyMessage = `应退支付宝${refundMoney.toFixed(2)}元`
        //     }
        //     return;
        //   }
        // }
        // //=====================
        // //        退现金
        // //=====================
        // if(pos && posAdd > 0) {
        //   var remainMoney = posAdd > refundMoney ? 0 : (refundMoney - posAdd);
        //   if(remainMoney && remainMoney > 0) {
        //     this.refundMoneyMessage = `应退现金${posAdd.toFixed(2)}元,应退余额${remainMoney.toFixed(2)}元`
        //     return;
        //   }
        //   if(!remainMoney) {
        //     this.refundMoneyMessage = `应退现金${refundMoney.toFixed(2)}元`
        //     return;
        //   }
        // }
        // //======================
        // //        退余额
        // //======================
        // this.refundMoneyMessage = `应退余额${refundMoney.toFixed(2)}元`
      },

      saveChange(){
        let that = this;
        var superPwd = JSON.parse(sessionStorage.getItem("superPwd")).superPwd;
        var inputSuperPwd = this.$utils.pwdEncryption(this.refundCommand);
        if(inputSuperPwd == '') {
          this.$message.warning('退菜口令不能为空');
          return;
        }
        if(inputSuperPwd != superPwd) {
          this.$message.error('退菜口令错误');
          return;
        }

        refundOrder(this.localRefund, function (data) {
          //将退菜信息推到远程服务端
          that.refund.orderRefundRemarks = data.refundList || [];
          that.refund.refundType = that.radio;
          var remoteData = {
            refund: that.refund,
            brandId:sessionStorage.getItem("brandId"),
            type: "refundOrder"
          };
          // allow_first_pay 为 0 时，为先付逻辑
          that.shopDet.allow_first_pay ? printRefundTotal(that.refund.id,1,2 ,1,that.localRefund.orderItems):printRefundTotal(that.refund.id,1,1 ,1,that.localRefund.orderItems);
          // printRefundTotal(that.refund.id,0,1,remoteData.refund.orderItems);   // 退菜总单
          printKitchenTotal(that.refund.id,1,0,1,remoteData.refund.orderItems,function (resData) {
            console.log("退菜厨打执行完成",resData)
          });   // 退菜厨打单
          that.$socket.refundOrder(remoteData.refund, function (resultData) {
            console.log("\n\n\n");
            console.log(resultData);
            let result = JSON.parse(resultData);
            if(result.success){
              console.log(JSON.parse(result.data));
            }
            console.log("\n\n\n");
            that.radio = 0; //  还原
            updateOrderSyncState(that.refund.id, function () {
              that.$message({
                showClose: true,
                message:"订单数据已同步~",
                duration: 2,
                type: 'success'
              });
              //console.warn('================================',that.orderId,remoteData.refund.orderItems)
              /**
               *  退菜打印
               *  1 orderId,主订单id
               *  2 0 正常、精简
               *  3 0 、正常、  1  退菜
               *  4 [id:"''",count:1]     订单itme id ，count ，
               */

            });
          });
          console.log('远程需要的数据', remoteData);
        });
        this.$message('退菜成功~');
        this.toTablePage(this.orderInfo);
        this.changeOrder.show = false;
      },

      recoverData(){
        this.currentInput = false; // 关闭键盘弹窗

        this.changeOrder.show         = false;
        this.changeOrder.isClick      = false;
        this.changeOrder.isCheck      = false;
        this.changeOrder.isCheckOne   = false;
        this.changeOrder.flags        = false;
        this.checkAllFlag             = false;
        this.changeOrder.currentIndex = 0;

        this.changeOrderItem          = [];

        this.refundMoney              = 0;
        this.refundAllCount           = 0;
        this.refundMealAllNumber      = 0;
        this.refundList               = [];
      },

      closeChangeOrderDialog(){ // 取消退菜
        for(var item of this.changeOrderItem){
          item.checked = false;
          item.count = item.tempCount;
          item.price = item.tempPrice;
          if(item.type == 3) {
            item.mealItems.map(function (mealItem) {
              item.tempPrice -= mealItem.price;
            })
          }
        }
        this.recoverData();
      },

      toTablePage(order){
        for(var item of this.changeOrderItem){
          item.checked = false;
        }
        this.recoverData();
        var path = this.$router.push("/table/eatin/detail/" + order.id + "?tableNumber=" +  order.table_number)
        this.$router.push("/table/eatin/detail/" + order.id + "?tableNumber=" +  order.table_number);
        bus.$emit("hasChanged",path);
        bus.$emit("refresh-turnover");
      },

      changeOrderPages(operation) {
        var changePages = document.getElementById('change-pages')
        if(operation == 1) {
          changePages.scrollTop += changePages.clientHeight;
        }
        if(operation == -1) {
          changePages.scrollTop -= changePages.clientHeight;
        }
      },

      focus() {
        this.refundCommand = "";
        this.currentInput = true;
      },

      changeInput(val) { // 退菜口令键盘相关
        this.refundCommand = val
      },

      closeKeyBoard () {// 关闭键盘
        this.currentInput = false;
      },


      // 退菜翻页
      // refundPage(operation) {
      //   var orderDetailWrapper = document.getElementById("refund-wrapper");
      //   if(operation == 1){  // 下一页
      //     orderDetailWrapper.scrollTop += orderDetailWrapper.clientHeight;
      //   }else{  //  上一页
      //     orderDetailWrapper.scrollTop -= orderDetailWrapper.clientHeight;
      //   }
      // },
      //=================================
      //退菜结束
      //=================================
      orderItemListToMap(itemList) {
        var itemMap = {};
        for(var i in itemList){
          var item = itemList[i];
          itemMap[item.id] = item;
        }
        return itemMap;
      },
      orderPageOperation (operation) {
        var orderDetailWrapper = document.getElementById("order-detail-wrapper");
        if(operation == 1){  // 下一页
          orderDetailWrapper.scrollTop += orderDetailWrapper.clientHeight;
        }else{  //  上一页
          orderDetailWrapper.scrollTop -= orderDetailWrapper.clientHeight;
        }
      },
      formatDate(date) {
        return formatDate(new Date(parseInt(date)), 'yyyy-MM-dd hh:mm:ss');
      },
      printTotal(){
        let self = this;
        // allow_first_pay 为 0 时，为先付逻辑
        self.shopDet.allow_first_pay ? printTotal(self.orderId,0, 3):printTotal(self.orderId,0);
      },
      printKitchenTotal(){
        let self = this;
        printKitchenTotal(self.orderId,0);
      },
      formatMoney(money){
        return this.$utils.formatMoney(money);
      }
    }
  };
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
  .panel-title {
    height: 50px;
    line-height: 50px;
    font-size: 22px;
    font-weight: bold;
    text-align: center;
    background-color: #FFFFFF;
    color: #666;
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

  /* 遮罩层 */
  .mask-layer {
    /*height:100%;*/
    width:100%;
    position: absolute;
    background-color: black;
    opacity: 0.3;

  }

  .car-footer{
    position: absolute;
    bottom:0px;
    width: 100%;
    background-color: #FFFFFF;
    border-top: 8px solid #f5f5f5;
  }
  .order-payment {
    font-size: 16px;
    width:100%;
    height: 40px;
    margin-left: 10px;
    line-height: 50px;
    /*padding-left: 7px;*/
    color: #666;
    /*border-bottom: 1px dashed grey;*/
  }
  .order-payment-num{
    font-size: 20px;
    color: #ef5350;
    line-height: 24px;
  }
  .order-operate-button{
    font-size: 1em;
    width:100%;
    height: 50px;
    color: #fff;
  }
  .operate-button{
    display: inline-block;
    line-height: 1;
    white-space: nowrap;
    cursor: pointer;
    /*margin: 5px 0px 0px 0px;*/
    padding: 10px 15px;
    border:none;
    background: #D8D8D8;
    border-radius: 5px;
    color: #666666;
    height: 40px;
    width: 100%;
    font-size: 16px;
    font-weight: bold;
  }
  .operate-button-push-order{
    width: 75%;
    /*padding: 3px;*/
    margin-left: 10px;
    background: #FFBF34;
    border-radius: 5px;
    color: #ffffff;
  }
  .car-total {
    height: 50px;
    line-height: 50px;
    border-top: 5px solid #F2F2F2;
    font-size: 22px;
    font-weight: bold;
    text-align: center;
  }
  /*    购物车 table 样式    begin   */
  .car-table {
    width: 100%;
    font-size: 12px;
    /*border: 1px solid #dfe6ec;*/
  }

  .car-table-title-tr {
    background-color: #eef1f6;
    height: 40px;
    font-size: 17px;
    color: #9B9B9B;
  }

  .car-table-body-tr {
    text-align: center;
    height: 40px;
    cursor: pointer;
  }

  .car-table-body-tr td, th {
    /*border-top: 1px solid #dfe6ec;*/
    border-bottom: 1px solid #dfe6ec;
  }

  .car-table-body-package-tr {
    text-align: center;
    height: 40px;
    background-color: #FFFFFF;
  }


  .car-table-body-tr-selected {
    background-color: #E5E9F2;
  }


  .car-table td {
    /*border-bottom: 1px solid #dfe6ec;*/
  }

  .have-order{
    display: inline-block;
    width:10px;
    height: 10px;
    border-radius: 50%;
    background-color: #032df9;
  }
  /*    购物车 table 样式    end   */

  /** 订单详情  滚动条  begin  **/
  #order-detail-wrapper::-webkit-scrollbar { width: 4px; height: 4px; }

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
    background-color: #000;
    color: #FFF;
    border-radius:50%;
    cursor: pointer;
    opacity: 0.6;
  }

  /* 退菜弹窗样式*/

  .refund-page-wrapper{
    position: absolute;
    top:25%;
    right: 50px;
    z-index: 10;
  }
  .refund-page-wrapper > .pre-page{
    display: flex;
    justify-content: center;
    align-items: center;
    width: 50px;
    height: 50px;
    background-color: #8492A6;
    border: 1px solid #8492A6;
    color: #FFF;
    border-radius:50%;
    margin-bottom: 50px;
    cursor: pointer;
    opacity: 0.7;
  }
  .refund-page-wrapper > .next-page{
    display: flex;
    justify-content: center;
    align-items: center;
    width: 50px;
    height: 50px;
    background-color: #8492A6;
    border: 1px solid #8492A6;
    color: #FFF;
    border-radius:50%;
    cursor: pointer;
    opacity: 0.7;
  }



  .change-order-content {
    margin: 0 auto;
    width:100%;
  }
  .change-order-content > li {
    width: 100%;
    height: 50px;
    font-size: 16px;
    font-weight: bold;
    text-align: center;
  }
  .change-order-content > li:nth-child(2n) {
    background-color: #F8F8F8;
  }
  .change-order-content > li > span{
    display: inline-block;
  }
  .change-order-content:nth-of-type(1) > li > span{
    height: 50px;
    line-height: 50px;
    font-size: 18px;
    font-weight: bold;
  }
  .change-order-content:not(:first-child) > li > span{
    height: 50px;
    line-height: 50px;
    font-size: 16px;
  }
  .article-item{
    display: inline-block;
  }
  .control-count{
    display: inline-block;
    width: 30px;
    height: 30px;
    margin-top: 2px;
    line-height: 28px;
    font-size: 25px;
    text-align: center;
    color: #fff;
    background-color: darkgray;
    border-radius: 50%;
  }

  .change-item {
    font-size: 16px;
    font-weight: bold;
    height: 40px;
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
</style>
