<template>
  <el-row style="height: 100%;">
    <!--  左侧订单详情   -->
    <el-col :span="7" class="left-wrapper" style="padding: 0;margin: 0;">
      <div>
        <el-row type="flex" class="row-bg" justify="space-around">
          <el-col :span="9">
            <el-button  size="large" :class="order.distributionModeId == 1 ? 'base-btn-active' :'base-btn'"
                       @click="choiceMode(1)">堂食
            </el-button>
          </el-col>
          <el-col :span="9">
            <el-button  size="large" :class="order.distributionModeId == 3 ? 'base-btn-active' :'base-btn'"
                       @click="choiceMode(3)">外带
            </el-button>
          </el-col>
        </el-row>

        <div style="overflow: hidden" :style="{ height: carTableHeight + 'px' }" id="order-detail-wrapper">
          <div class="order-page-wrapper">
            <div class="pre-page" @click="orderPageOperation(-1)"><span class="el-icon-caret-top" style="font-size: 26px;margin-left: 4px;"></span></div>
            <div class="next-page" @click="orderPageOperation(1)"><span class="el-icon-caret-bottom" style="font-size: 26px;margin-top: 4px;margin-left: 2px;"></span></div>
          </div>
          <div style="background-color: #FFFFFF">
            <ul class="car-title">
              <li class="car-title-item" style="width: 15%; text-align: center; text-indent: 9px;">选项</li>
              <li class="car-title-item" style="width: 40%;">品名</li>
              <li class="car-title-item" style="width: 15%;">数量</li>
              <li class="car-title-item" style="width: 20%;text-align:right;">小计</li>
            </ul>
            <!--购物车 内容-->
            <ul class="car-title car-content" v-for="(article, index) in car"  @click="checkOne(article, index)">
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
                  <span style = "display: inline-block; width: 20px;height: 20px;text-align: center;vertical-align: top; background-color: #75C2AF;color: #FFFFFF;border-radius:50%;margin-left: -4%" v-if="article.notes">加</span>
                  <span
                    style="display: inline-block; width: 20px;height: 20px;
                      text-align: center;vertical-align: top;
                       background-color: #75C2AF;color: #FFFFFF;border-radius:50%;margin-left: -4%" v-if="article.status== 3 "> 新 </span>
                </li>
                <li class="car-title-item car-content-item" style="width: 15%;vertical-align: top;text-align: -webkit-left;">
                  <input  style="border: 1px solid black;text-align: center; width: 30px;" type="text"
                          readonly
                          v-model="article.count"
                          :class="(!isEditArticle && article.checked == true)? '' :'hidden-dom'"
                          @blur="focusState = false" v-focus="focusState">
                  <span style="text-align: left;" :class="(!isEditArticle && article.checked == true)? 'hidden-dom' :''">{{article.count}}</span>
                </li>
                <li class="car-title-item car-content-item" style="width: 20%;vertical-align: top;text-align: right;">¥{{formatMoney(article.price)}}</li>
              </div>

              <div v-if="article.type==3 && !article.tempRefundCount" style="margin-left: 5px;" v-for="item in article.mealItems">
                <li class="car-title-item car-content-item" style="width: 15%;text-align: center;visibility: hidden">
                <li class="car-title-item car-content-item" style="width: 40%;">
                  <span style="display: inline-block;width: 80%;">┕&emsp;{{item.name}}</span>
                </li>
                <li class="car-title-item car-content-item" style="width: 15%;vertical-align: top;">{{item.count}}</li>
                <li class="car-title-item car-content-item" style="width: 20%;vertical-align: top;text-align: right;">¥{{formatMoney(item.price)}}</li>
              </div>


              <!-- 退菜显示区 -->
              <div v-show="article.tempRefundCount">
                <li class="car-title-item car-content-item" style="width: 15%;text-align: center;visibility: hidden;">
                  <svg style="width: 14px;height: 14px;" aria-hidden="true">
                    <use xlink:href="#icon-duihao"></use>
                  </svg>
                </li>
                <li class="car-title-item car-content-item" style="width: 40%;color: #999999; ">
                  <span style="display: inline-block;width: 80%;text-decoration: line-through;">{{article.name}}</span>
                  <span
                    style="display: inline-block; width: 20px;height: 20px;
                      text-align: center;vertical-align: top;
                       background-color: #ef5350;color: #FFFFFF;border-radius:50%;margin: -4%;"
                    v-show="article.tempRefundCount">退</span>
                </li>
                <li class="car-title-item car-content-item" style="width: 15%;text-decoration: line-through;color:#999999 ;vertical-align: top;">{{article.tempRefundCount}}</li>
                <li class="car-title-item car-content-item" style="width: 20%;text-decoration: line-through; color: #999999;vertical-align: top;text-align: right;">¥ {{formatMoney(article.tempRefundCount * article.unitPrice)}}</li>
              </div>

              <div v-if="article.type==3 && article.tempRefundCount" style="margin-left: 5px;" v-for="item in article.mealItems">
                <li class="car-title-item car-content-item" style="width: 15%;text-align: center;visibility: hidden">
                <li class="car-title-item car-content-item" style="width: 40%;">
                  <span style="display: inline-block;width: 80%;text-decoration: line-through;color:#999999 ;" >┕&emsp;{{item.name}}</span>
                </li>
                <li class="car-title-item car-content-item" style="width: 15%;vertical-align: top;text-decoration: line-through;color:#999999 ;">{{item.count}}</li>
                <li class="car-title-item car-content-item" style="width: 20%;vertical-align: top;text-decoration: line-through;color:#999999 ;text-align: right;">¥{{formatMoney(item.price)}}</li>
              </div>
            </ul>
          </div>
        </div>

        <div class="car-footer">
          <el-row  type="flex" justify="space-around" class="order-operate-button">
            <el-col :span="5" >
              <button class="operate-article-button" style="padding: 0;" v-if="isEditArticle == true" @click="editArticle(currentCarTableRow)">编辑</button>
              <button class="operate-article-button" style="padding: 0;" v-else @click="saveArticle(currentCarTableRow)">保存</button>
            </el-col>
            <el-col :span="5" >
              <button class="operate-article-button" style="padding: 0;" @click="deleteArticle(currentCarTableRow)">删除</button>
            </el-col>
            <el-col :span="5" >
              <button class="operate-article-button" @click="addArticle(currentCarTableRow)">+</button>
            </el-col>
            <el-col :span="5" >
              <button class="operate-article-button" @click="cutArticle(currentCarTableRow)">-</button>
            </el-col>
          </el-row>

          <el-row class="order-payment" v-show="isUseServicePrice">
            <el-col :span="24"> 服务费：¥{{orderInfo.service_price}} </el-col>
          </el-row>

          <el-row class="order-payment">
            <el-col :span="10">
              菜品：<span class="order-payment-num">{{totalCount}}</span> 项
            </el-col>
            <el-col :span="14">
              总计：<span class="order-payment-num">¥ {{ formatMoney(totalPrice) }}</span>
            </el-col>
          </el-row>
          <el-row v-if="shopModel == 2 || shopModel == 7" style="text-align: center;" type="flex" justify="space-around" class="order-operate-button">
            <el-col :span="23" >
              <button class="operate-button operate-button-push-order" @click="checkedOrder"
                      v-if="shopDet.allow_first_pay == 0 || orderInfo.distribution_mode_id == 3"
                      v-loading.fullscreen.lock="loading" element-loading-text="下单中...">结算</button>
              <button class="operate-button operate-button-push-order" @click="checkedOrder" v-else>下单</button>
            </el-col>
          </el-row>
          <el-row v-else style="text-align: center;" type="flex" justify="space-around" class="order-operate-button">
            <el-col :span="8" >
              <button class="operate-button" @click="goBack">返回</button>
            </el-col>
            <el-col :span="8" >
              <button class="operate-button operate-button-push-order" @click="checkedOrder" v-if="shopDet.allow_first_pay == 0 || orderInfo.distribution_mode_id == 3">结算</button>
              <button class="operate-button operate-button-push-order" @click="checkedOrder" v-else>下单</button>
            </el-col>
          </el-row>
        </div>
      </div>
    </el-col>

    <!--  右侧菜品信息   -->
    <el-col :span="17" class="right-wrapper">
      <order-toolbar v-if="shopModel == 2 || shopModel == 7" :callCount=callCount v-on:all="allOrder(true, true)" v-on:pay="payOrder" v-on:wait="waitOrder"></order-toolbar>
      <el-row class="article-wrapper">
        <el-col :span="21" class="article-info" id="articleInfo">
          <el-row :gutter="5" style="height: 100%">
            <div class="article-page-wrapper">
              <div class="pre-page" @click="articlePageOperation(-1)"><span class="el-icon-caret-top" style="font-size: 26px;margin-left: 4px;"></span></div>
              <div class="next-page" @click="articlePageOperation(1)"><span class="el-icon-caret-bottom" style="font-size: 26px;margin-top: 4px;margin-left: 2px;"></span></div>
            </div>

            <el-col :sm="6" :md="5" class="article-card" style="padding: 0" @click.native="choseArticle(article)"
                    v-for="article in articleList" :key="article.id"
                    v-if="article.activated != 0">
              <el-card :body-style="{ padding: '0px',height:'100%'}" style="position: relative">
                <sup class="el-badge__content is-fixed" v-if="article.count > 0">{{article.count}}</sup>
                <div class="title-wrapper">
                  <p class="article-name">
                    {{article.name.substring(0,2)}}
                  </p>
                </div>
                <div style="text-align: center;background: #f5f5f5;height: 44%;display: flex;align-items: center;justify-content: center;flex-direction: column">
                  <div>
                    <p style="font-size: 14px;text-align: center;color: #666;">
                      {{article.name.length > 7 ? article.name.substr(0,7)+'...': article.name}}
                    </p>
                    <p style="font-size: 14px; color: red;text-align: center; font-weight: bold" v-if="article.current_working_stock  <= 0">已售罄</p>
                    <p style="font-size: 14px; color: #666;text-align: center;"  v-else>¥{{formatMoney(article.open_catty==1? article.catty_money:article.price)}}</p>
                  </div>
                </div>
              </el-card>
            </el-col>

          </el-row>
        </el-col>

        <el-col :span="3" class="family-wrapper">
          <ul :style="{ height: familyWrapperHeight + 'px' }" style="overflow: hidden" id="familyWrapper">
            <li v-for="(family, index) in familyList" @click="currentFamily (family.id)">
              <el-button size="large" class="family-item" :class="currentFamilyId == family.id ? 'family-item-active' : ''">
                <sup class="el-badge__content is-fixed family-badge" v-if="family.count > 0">{{family.count}}</sup>
                {{family.name}}
              </el-button>
            </li>
          </ul>
          <ul class="pageButton" id="pageButton">
            <li v-for="(item,index) in pageButtonList">
              <el-button size="large" class=" page-button-item" :class="selectCurrentPages == index ? 'pageButtonActive' : ''"
                         @click="familyPages(index)">{{item}}
              </el-button>
            </li>
          </ul>
        </el-col>
      </el-row>
    </el-col>
    <!--  套餐弹框   begin  -->
    <el-dialog :visible.sync="packageDialog.show" size="large" :close-on-click-modal="false" class="el-dialog__wrap">
      <div class="dialog-title-warp">
        <el-tag>套餐</el-tag>
        <span slot="title" class="dialog-title">&emsp;{{packageDialog.title}}</span>
      </div>
      <div class="dialog-content scrollbar" id="attrWrapper">
        <ul v-for="mealAttr in packageDialog.mealAttributionList" :key="mealAttr.id">
          <li>
            <span class="packate-title">{{mealAttr.name}}</span>
            <div class="package-content-wrap">
              <div :class="item.checkedState?'package-item-click':''" v-for="item in mealAttr.mealItemsInfo" class="package-items" @click="choseAttr(mealAttr,item)" :key="item.id">
                <sup class="el-badge__content is-fixed not-sell" v-if="!item.activated">已下架</sup>
                <sup class="el-badge__content is-fixed not-sell" v-else-if="item.isEmpty||item.current_working_stock<=0">已售罄</sup>
                {{item.name}}<br>
                <p v-if="item.price_dif > 0">￥{{item.price_dif}}</p>
                <br v-else>
              </div>
            </div>
          </li>
        </ul>
      </div>


      <div class="order-page-wrapper" v-if="packageDialog.mealAttributionList.length > 2 ">
        <div class="pre-page" @click="combanPage(-1)"><span class="el-icon-caret-top" style="font-size: 26px;margin-left: 4px;"></span></div>
        <div class="next-page" @click="combanPage(1)"><span class="el-icon-caret-bottom" style="font-size: 26px;margin-top: 4px;margin-left: 2px;"></span></div>
      </div>

      <span slot="footer">
          <span style="float: left;font-size: 30px">
           ￥<font color="red">{{packageDialog.price}}</font>
          </span>
          <el-button @click="packageDialog.show = false">取 消</el-button>
          <el-button type="primary" @click="addPackageToCar(packageDialog.article)" :disabled="addCar">确 定</el-button>
        </span>
    </el-dialog>
    <!--  套餐弹框   end  -->

    <!--  老规格弹框   begin  -->
    <el-dialog :visible.sync="articlePriceDialog.show" size="large" :close-on-click-modal="false" class="el-dialog__wrap">
      <div class="dialog-title-warp">
        <el-tag>老规格</el-tag>
        <span slot="title" class="dialog-title">&emsp;{{articlePriceDialog.title}}</span>
      </div>
      <div class="dialog-content scrollbar" id="articlePriceWrapper">
        <ul>
          <li>
            <div class="package-content-wrap">
              <div v-for="articlePrice in articlePriceList" :key="articlePrice.id"
                   :class="articlePrice.checkedState?'package-item-click':''"
                   class="package-items"
                   @click="choseArticlePriceItem(articlePrice)">
                <sup class="el-badge__content is-fixed not-sell" v-if="articlePrice.isEmpty">已售罄</sup>
                {{articlePriceDialog.article.name + articlePrice.name}}<br>
                <p v-if="articlePrice.price > 0">￥{{ $utils.formatMoney(articlePrice.price)}}</p>
                <br v-else>
              </div>
            </div>
          </li>
        </ul>
      </div>
      <span slot="footer">
          <span style="float: left;font-size: 30px">
            ￥<font color="red">{{articlePriceDialog.price}}</font>
          </span>
          <el-button @click="articlePriceDialog.show = false">取 消</el-button>
          <el-button type="primary" @click="addArticlePriceToCar(articlePriceDialog.article)" :disabled="addCar">确 定</el-button>
        </span>
    </el-dialog>
    <!--  老规格弹框   end  -->

    <!--  新规格弹框   begin  -->
    <el-dialog :visible.sync="articleUnitDialog.show" size="large" :close-on-click-modal="false" class="el-dialog__wrap">
      <div class="dialog-title-warp">
        <el-tag>新规格</el-tag>
        <span slot="title" class="dialog-title">&emsp;{{articleUnitDialog.title}}</span>
      </div>
      <div class="dialog-content scrollbar" id="articleUnitWrapper">
        <ul v-for="unit in articleUnitDialog.unitList" :key="unit.id">
          <li>
            <span class="packate-title">{{unit.name}}</span>
            <div class="package-content-wrap">
                <span :class="detail.state ? 'package-item-click':''"
                      v-for="detail in unit.details"
                      :key="detail.id"
                      class="package-items"
                      @click="choseUnit(unit, detail)">
                     {{detail.name}}<br>
                  <p v-if="detail.price > 0">￥{{ $utils.formatMoney(detail.price)}}</p>
                  <br v-else>
                </span>
            </div>
          </li>
        </ul>
      </div>
      <span slot="footer">
          <span style="float: left;font-size: 30px">
            ￥<font color="red">{{articleUnitDialog.price}}</font>
          </span>
          <el-button @click="articleUnitDialog.show = false">取 消</el-button>
          <el-button type="primary" @click="addArticleUnitToCar(articleUnitDialog.article)" :disabled="addCar">确 定</el-button>
        </span>
    </el-dialog>
    <!--  新规格弹框   end  -->

    <!--  称重包   begin  -->
    <el-dialog :visible.sync="articleWeightPackageDialog.show" size="large" :close-on-click-modal="false" class="el-dialog__wrap">
      <div class="dialog-title-warp">
        <el-tag>重量包</el-tag>
        <span slot="title" class="dialog-title">&emsp;{{articleWeightPackageDialog.title}}</span>
      </div>
      <div class="dialog-content scrollbar" >
        <ul v-if="shopModel != 7" v-for="weightPackagekList in articleWeightPackageDialog.article.weightPackagekList" :key="weightPackagekList.id">
          <li>
            <span class="packate-title">{{ articleWeightPackageDialog.name}}</span>
            <div class="package-content-wrap">
                <span :class="detail.state ? 'package-item-click':''"
                      v-for="detail in weightPackagekList.list"
                      :key="detail.id"
                      class="package-items"
                      @click="choiceWeightPackage(weightPackagekList.list, detail)">
                     {{detail.name}}<br>
                </span>
            </div>
          </li>
        </ul>
        <!--<div v-if="shopModel == 7" style="display: flex;flex-direction: row; padding: 30px 0;">

            <el-col :span="20">
              <el-input style="margin-right: 20px;" v-model="weight" :autofocus= "true" placeholder="请称重" clearable @change="(value) => change(value, articleWeightPackageDialog.article)"></el-input>
            </el-col>
            <el-col :span="2" style=" text-align: center;">
              <span style=" font-size: 16px;line-height: 34px;">斤(单位)</span>

            </el-col>
            &lt;!&ndash;<el-col :span="2">
              <el-button type="primary" @click="getFoodWeight()">获取重量</el-button>
            </el-col>&ndash;&gt;

        </div>-->
      </div>
      <span slot="footer">
          <span style="float: left;font-size: 30px">￥<font color="red">{{formatMoney(articleWeightPackageDialog.price)}}</font></span>
          <el-button  @click="testClick()">取 消</el-button>
          <el-button type="primary" @click=" shopModel == 7 ? addArticleWeightPackageToCar1(articleWeightPackageDialog.article) : addArticleWeightPackageToCar(articleWeightPackageDialog.article)" :disabled="addCar">确 定</el-button>
        </span>
    </el-dialog>
    <!--  称重包   end  -->
  </el-row>
</template>

<script>
  import {getOrderDetail, getUnitList, pushOrder, printOrder, printKitchenTotal, printTotal, getWeightPackageLIst, waitCallTPAndhasCallTPOrderCount,updateOrderSyncState, syncOrderInfoById , getWeight} from 'api/api';
  import {formatDate} from '../../../utils/generalUtil';
  import bus from '../../../utils/bus'
  import mixin from '../../../mixins/mixin'
  import orderToolbar from '../../../page/table/component/order-toolbar';
  import localNotPrintOrder from '../../table/component/local-not-print-order';
  import { mapGetters, mapActions } from 'vuex'

  export default {
    name: 'tvOrder',
    mixins:[mixin],
    components: {orderToolbar, localNotPrintOrder},
    data() {
      return {
        weight:'',
        isEditArticle: true,
        editArticleInfo: {},
        currentIndex:null,
        focusState:true, // 是否聚焦

        keyboardShow:false, // 是否显示键盘
        tempCurrentCarRowPrice:0,

        radio: null,
        orderPaymentList: [], // 订单支付项列表
        refundCashMoneyState: false, // 退菜现金返还
        refundRemainMoneyState: false, // 退菜红包返还
        isFans: false, // 是否开启粉丝价 0 粉丝价 1 原价
        refundCommand:'', // 退菜口令
        isUseServicePrice: true, //是否开启服务费
        showDetails: false,
        hasChangeOrderItem: [],
        changeOrderItem: [],
        changeCount: 0,
        refundMoney: 0, //退的总钱数
        refundAllCount: 0, //退的总个数
        refundOrderList: 0, // 退掉的数组封装
        itemId: '',
        refundList:[],
        mealFeeNumber: 0, // 每一项菜品中所需要的餐盒的数量
        mealAllNumber: 0, // 总的餐盒的数量
        checkAllFlag: false,
        delFlag: false,
        refundMealAllNumber: 0,// 退掉的总的 餐盒个数
        refundMealAllPrice: 0,  // 退掉的总的 餐盒钱数
        isMealFee: false,
        orderLength: '',
        orderId: '',
        pageLoading: false,
        orderInfo: {},
        carTableHeight: 0,
        familyMap: {},
        currentFamilyId: '',
        articleMap: {},
        car: [],
        checkBox:{},
        selectPageButton: 0,
        currentCarTableRow: {
          index: null,
          info: {}
        },
        changeOrder: {
          isClick: false,
          isCheck: false,
          isCheckOne: false,
          flags: false,
          currentIndex: 0
        },
        pageButtonList: ['上一页', '下一页'],
        totalCount: 0,
        totalPrice: 0,
        articleWeightPackageDialog: {
          show: false,    // 称重包弹层
          title: '',      // 规格标题
          article: {},    // 当前菜品
          price: null    //  新规格，价格以菜品表价格为基础(tb_article.price)，与 具体属性的差价相加(tb_article_unit_detail.price)
        },

        changeOrderDialog: {
          show: false,
        },
        page: {
          pageIndex: 0,
          contentHeight: 0,//一共的高度
          onePageHeight: 0,//每一页的高度
          pageSize: 0,//页数
          allPageContentList: {},//所有的内容
          onePageContentList: {}//每一页展示的内容
        },
        attrWrapperScroll: null,
        tableOrder: {
          afterPay: 0,
          distributionModeId: 0,
          tableNumber: 0,
          customerCount: 0,
          remark: '加菜'
        },
        familyWrapperHeight: 0,
        selectCurrentPages: 2,
        dialogVisible: false,
        refundRemarks: [],
        refundRemark: null,
        weixinPaymentMap:{},
        posPaymentMap:{},
        refundMoneyMessage:'暂无消息', // 退菜提醒，比如，退了多少钱
        refund: {},
        localRefund: {},
        shopDet: {},
        shopModel:'',
        mustChoiceAttr: [],
        loading:false,
        curentArticlePricleDialog: {},
        countDown: '',
        order: {
          afterPay: true,           // 默认为稍后支付
          distributionModeId: 1,    // 订单的就餐模式  （堂食或者外带）
          tableNumber: null,        // 桌号
          customerCount: "",      // 就餐人数
          remark: null,           // 订单备注
        },
        callCount: {
          waitCallCount: 0,
          hasCalledCount: 0,
        },
        addCar: false,
        timer: null,
        tips:'',
      };
    },
    watch: {
      car: {
        handler: function (car) {
          this.totalCount = 0;
          this.totalPrice = 0;
          for (let item of car) {
            if(item.count > 0) {
              this.totalCount += Number.parseInt(item.count);
              this.totalPrice += +(this.formatMoney(item.price));
            };
          }
          if (car.length > 0 && !this.currentCarTableRow.info.id) {
            this.currentCarTableRow.index = null;
            this.currentCarTableRow.info = [];
          }
        },
        deep: true
      },
      familyList: function(val) {
        this.$store.dispatch('getArticleListByFamilyId', val[0].id || '');
        this.currentFamilyId = this.familyList[0].id
      },
      articlePriceDialog: function (val) {
        console.log("articlePriceDialog", val)
      },
      articleUnitDialog: function (val) {
        console.log("单品 新规格", val)
      },
      packageDialog: function (val) {
        console.log("套餐", val)
      },
      articleWeightPackageDialog: {
        handler(newName, oldName) {
          /*console.log('重量',newName,oldName)
          if(newName.show && this.shopModel == 7){
            this.getFoodWeight()

          } else if(!newName.show && this.shopModel == 7) {
            this.tips = ''
          }*/
        },
        // 代表在wacth里声明了firstName这个方法之后立即先去执行handler方法
        deep:true

      }
    },
    computed: {
      ...mapGetters({
        addCarArticle: 'addCarArticle',
        familyList: 'familyList',
        articleList: 'articleList',
        unitList: 'unitList',
        articlePriceList: 'articlePriceList',
        articlePriceDialog: 'articlePriceDialog',
        articleUnitDialog: 'articleUnitDialog',
        packageDialog: 'packageDialog'
      })
    },
    created () {
      this.$store.dispatch('getFamilyList');
      this.shopDet = JSON.parse(sessionStorage.getItem("shopDet"));
      this.shopModel = this.shopDet.shop_mode;

      if(this.shopDet.shop_mode == 7){
        this.weight = sessionStorage.getItem("weight")
      }
    },

    mounted() {
      let that = this;
      // 初始化 购物车 Table 的高度
      this.carTableHeight = document.body.clientHeight - 300;
      this.familyWrapperHeight = document.body.clientHeight - 130 - document.getElementById("pageButton").offsetHeight;
      // this.getFamilyList();
      // 是否开启粉丝价
      this.isFans = this.isFansPrice();
      this.isUseService();
      this.getOrderStateCount();
      this.$store.commit('isFans', this.isFans);
      bus.$on("keyText", function (keyText) {
        that.changeInput(keyText)
      })

      bus.$on("freshCar", msgInfo => {
        getOrderDetail(this.$route.params.orderId,  (data) =>{
          if (data.table_number == msgInfo.params.table_number) {
            this.$notify.success(`${msgInfo.params.table_number}号桌 下单成功`)
          }
        })
      })

      bus.$on("normalOrder", resultData => {
        let orderId = this.$route.params.orderId
        this.$notify.success(`${resultData.msg}`)
        if (orderId ) {
          getOrderDetail(this.$route.params.orderId, data => {
            if (this.$route.params.orderId == resultData.data) {
              this.initOrder();
              this.initCar(data,that.shopDet)
            }
          })
        }
      })
      bus.$on("wsNewOrder",() => {
        this.getOrderStateCount();
      })
    },

    beforeDestroy () {
      bus.$off('keyText')
      bus.$off('freshCar')
      bus.$off('wsNewOrder')
      bus.$off('normalOrder')
    },
    directives: {
      // 自动获取焦点
      focus: {
        update: function (el, {value}) {
          if (value) {
            el.focus()
          }
        }
      }
    },
    methods: {
      testClick(){
      this.articleWeightPackageDialog.show = false;
      },

      change(value,article){
        console.log('articleList',this.articleList)
        this.weight = value
        this.articleWeightPackageDialog.price = (article.catty_money) * value;
      },
      // 是否开启粉丝价
      isFansPrice() {
        var fansState = this.shopDet.pos_plus_type;
        return fansState;
      },
      // 是否开启服务费
      isUseService(){
        this.isUseServicePrice = this.shopDet.is_use_service_price;
      },

      getOrderStateCount(){
        let that = this;
        if (this.shopModel == 2 || this.shopModel == 7) {
          waitCallTPAndhasCallTPOrderCount(function (data) {
            that.callCount.waitCallCount = data.waitCallTPOrderCount;
            that.callCount.hasCalledCount = data.hasCallTPOrderCount;
          })
        }
      },

      currentFamily(familyId){
        this.currentFamilyId = familyId;
        this.$store.dispatch('getArticleListByFamilyId', familyId || '');
      },

      // 选择就餐模式
      choiceMode(modeId){
        this.order.distributionModeId = modeId;
      },

      choseArticle(currentArticle) { // 选择菜品
        if(currentArticle.count >= currentArticle.current_working_stock) {
          return this.$message.warning(`${currentArticle.name} 超出库存。`)
        }
        if (currentArticle.article_type === 1) {
          if (currentArticle.article_unit == 2) {  // 老规格
            this.openArticlePriceDialog(currentArticle);
          } else if (currentArticle.article_unit == 5) { // 新规格
            this.openArticleUnitDialog(currentArticle);
          } else if (currentArticle.open_catty == 1) {
            if(this.orderInfo.order_state >= 2) return this.$message.warning("当前订单无法选择重量包")
            this.openArticleWeightPackageDialog(currentArticle)
          } else { // 普通单品
            this.addSingleArticleToCar(currentArticle);
          }
        } else {
          this.openPackageDialog(currentArticle);
        }
      },

      /**
       *  单击此函数 选择菜品 展开套餐 出现选中框
       * */
      choseCarTableRow(article, index) {
        if (article.type === 3) { // 套餐
          article.isOpen = !article.isOpen;
        }
        this.currentCarTableRow.info = article;
        this.currentCarTableRow.index = index;
        this.tempCurrentCarRowPrice = this.currentCarTableRow.info.price;
        if(article.status == 3) {
          this.keyboardShow = true;
        }
        if(article.status != 3) {
          this.changeOrder.isClick = true;
        }
      },

      //===================
      // 编辑菜品开始
      //===================
      saveArticle(val) {
        if(this.editArticleInfo.article.count == 0) {
          return this.$message.warning("当前菜品数量不能编辑为0")
        }
        if(this.editArticleInfo.article.checked == true) {
          this.focusState = false
          this.isEditArticle = !this.isEditArticle;
          this.currentIndex = this.isEditArticle.index;
          this.editArticleInfo.article.checked == false;
        }
        this.keyboardShow = false;
      },

      deleteArticle(row) {
        var that = this;
        this.$confirm('是否删除', row.info.name || '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(() => {
          for(let index in that.car) {
            let item = that.car[index];
            if( item.status == 3 && item.checked == true) {
              that.car.splice(index, 1)
              that.$store.commit("deleteArticleFromCar", item)
            }
          }
        }).catch(() => {
        });
      },

      addArticle(row) {
        let articleType = this.editArticleInfo.article.type
        if (articleType == 8 || articleType == 2 || articleType == 5 || articleType == 3) {
          return this.$message.warning(`${this.editArticleInfo.article.name} 无法直接累加`);
        }
        if (this.editArticleInfo.article.checked) {
          this.focusState = true
          for (let index in this.car) {
            let item = this.car[index];
            if (item.status == 3 && item.checked == true) {
              item.count++;
              item.price = this.editArticleInfo.price * item.count
              this.$store.commit('addArticleToCar', item)
            }
          }

        }
      },

      cutArticle(row) {
        for (let index in this.car) {
          let item = this.car[index];
          if(item.status == 3 && item.checked == true) {
            if(item.count <= 1) return this.$message.warning("菜品数量无法继续减少，请选择删除操作");
            this.$store.commit('cutArticleFromCar', item)
            item.count --;
            item.price = this.editArticleInfo.price * item.count
          }
        }
      },

      // 键盘事件
      changeInput (val) {
        if(val == "") {
          val = 0
        }
        for (let index in this.car) {
          let item = this.car[index];
          if(item.checked == true && item.status == 3) {
            this.$store.commit("changeInput", item, val)
            item.count = +val;
            item.price = this.editArticleInfo.price * val;
          }
        }
      },

      //===================
      // 编辑菜品结束
      //===================


      /**
       * 单选
       * */
      checkOne: function (item,index) {
        let that = this;
        if(item.status !== 3) return;
        this.$set(item, "checked", !item.checked);
        this.$set(that.checkBox, "checked", false);
        if(!item.checked ){
          that.checkBox={};
        }else {
          if(item == that.checkBox ){
            that.checkBox={};
          }else {
            that.editArticleInfo = {
              index: index,
              price: item.price!=0 ? item.price/item.count: item.price,
              article: item,
            }
            that.checkBox=item;
          }
        }
      },

      /**
       * 全选
       * */
      checkAll: function (flag) {
        this.checkAllFlag = flag;
        var that = this
        that.changeOrderItem = [];
        this.car.forEach(function (item, index) {
          if (typeof item.checked == 'undefined', that.checkAllFlag) {
            that.$set(item, "checked", that.checkAllFlag);
            if(item.status !=3) that.changeOrderItem.push(item);
          } else {
            item.checked = that.checkAllFlag;
            that.changeOrderItem = [];
          }
        })
      },




      removeCarTableRow() {  // 移除购物车菜品
        let currentArticle = this.currentCarTableRow.info;
        this.$confirm('是否删除 ' + currentArticle.name + ' ？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(() => {
          this.familyMap[currentArticle.articleFamilyId].count -= currentArticle.count;
          this.articleMap[currentArticle.id].count = 0;
          this.car.splice(this.currentCarTableRow.index, 1);
          this.currentCarTableRow.info = {};
          this.$message.success('已移除~');
        }).catch(() => {
        });
      },

      editArticle() { // 编辑购物车中菜品信息
        let articleType = this.editArticleInfo.article.type;
        if (articleType == 8 || articleType == 2 || articleType == 5 || articleType == 3) {
          return this.$message.warning(`${this.editArticleInfo.article.name} 无法直接编辑`);
        }
        if(this.editArticleInfo.article.checked) {
          this.focusState = true
          this.isEditArticle = !this.isEditArticle;
          this.currentIndex = this.isEditArticle.index;
          setTimeout(function () {
            bus.$emit("show-keyboard","editArticleCount")
          },1)
        }
      },



      // 添加普通单品到购物车
      addSingleArticleToCar(currentArticle) {  // 添加 普通单品 到购物车
        this.$store.commit('increateArticleCount', currentArticle)
        for (let item of this.car) {  // 如果购物车存在  则直接 +1
          if (currentArticle.id === item.id && item.state === 0) {
            item.count++;
            item.price += parseFloat(currentArticle.price);
            return;
          }
        }
        let item = {
          time: new Date().getTime(),   // 用于区别购物车的菜品
          id: currentArticle.id,
          count: 1,
          type: 1,
          name: currentArticle.name,
          price: parseFloat(currentArticle.price), // 如果开启了粉丝价，并且没有折扣（ discount = 100 取粉丝价，），有折扣，原价*折扣价 ，没有开启粉丝价，原价*折扣价

          articleFamilyId: currentArticle.article_family_id,
          mealFeeNumber: currentArticle.meal_fee_number, // 餐盒费
          class: 'car-new-name',
          state: 0,  // 新加入购物车
          status: 3,

          discount: !!currentArticle.discount ? currentArticle.discount : 100, // 折扣价

          isFans: this.isFans, // 是否开启粉丝价
          fansPrice: parseFloat(!!currentArticle.fans_price ? currentArticle.fans_price : 0)
        };
        this.car.push(item);
      },

      openArticlePriceDialog(currentArticle) { // 打开老规格弹框
        this.$store.dispatch('getArticlePriceListByArticleId', currentArticle);
      },

      choseArticlePriceItem(articlePrice) { // 选择 菜品的老规格
        this.$store.commit('choseArticlePrice', articlePrice)
      },

      //  老规格添加购物车
      addArticlePriceToCar(currentArticle) { //  老规格 添加到购物车
        this.addCar = true
        setTimeout(()=>{ this.addCar = false }, 500)
        this.$store.commit("addArticlePrceToCar",  this.isFans)
        // if(this.addCarArticle.count == undefined || this.addCarArticle.count <=0){
        //   return;
        // }
        if(this.addCarArticle.articleFamilyId){
          this.car.push(this.addCarArticle);
          this.$store.commit('increateArticleCount', currentArticle)
        }

      },

      openArticleUnitDialog(currentArticle) { // 打开新规格弹框
        this.$store.dispatch('getUnitListByArticleId', currentArticle);
      },

      choseUnit(unit, detail) { // 选择 新规格
        if (unit.choice_type) { // 任选  choice_type = 1
          detail.state = !detail.state;
          this.articleUnitDialog.price += (detail.state ? detail.price : -detail.price);
        } else if (!unit.choice_type) { // 单选 choice_type = 0
          if (!detail.state) { // 当前是 未选中状态  ，如果是选中状态，则不做操作
            for (let detail of unit.details) {
              if (detail.state == 1) {
                this.articleUnitDialog.price -= detail.price
              }
              detail.state = 0;
            }
            detail.state = 1;
            this.articleUnitDialog.price = +this.articleUnitDialog.price + (+detail.price);
          } else {
            this.$message.warning('【' + unit.name + '】 至少选择 1 项 ~');
          }
        }
      },


      // 新规格添加购物车
      addArticleUnitToCar(currentArticle) { // 新规格  添加到购物车
        this.addCar = true;
        setTimeout(()=>{ this.addCar = false }, 1000)
        if(currentArticle.current_working_stock <=0) {
          this.$message("当前菜品库存不足");
        }
        this.$store.commit('addUnitToCar', this.isFans)
        this.car.push(this.addCarArticle);
      },
      /*getFoodWeight(){
        var that = this;
        getWeight((resultlut)=> {
          if (resultlut.error) {
            that.tips = ''
              if (that.articleWeightPackageDialog.show) {  that.getFoodWeight() }
            return false
          }
          if (that.articleWeightPackageDialog.show) {
            if (resultlut.weightStatus == 'S' && that.tips != '重量稳定') {
              that.tips = '重量稳定'
              that.$message("重量稳定");
            }else if (resultlut.weightStatus == 'F' && that.tips != '重量溢出或没有开机归零'){
              that.tips = '重量溢出或没有开机归零'
              that.$message.warning("重量溢出或没有开机归零")
            }else if(resultlut.weightStatus == 'U' && that.tips != '重量不稳定'){
              that.tips = '重量不稳定'
              that.$message.warning("重量不稳定")
            }
          }

          if(resultlut.unit == 'kg' ){
            that.weight = resultlut.weight * 2;
            that.articleWeightPackageDialog.price = (that.articleWeightPackageDialog.article.catty_money) * that.weight;
          }else {
            that.weight = resultlut.weight * 500;
            that.articleWeightPackageDialog.price = (that.articleWeightPackageDialog.article.catty_money) * that.weight;
          }
            if (that.articleWeightPackageDialog.show) {  that.getFoodWeight() }
        });
      },*/

      getFoodWeight(){
        var that = this;
        getWeight((resultlut)=> {
          console.log('称重',resultlut);
          if (resultlut.error) {
            that.getFoodWeight();
            return false
          }

          if(resultlut.unit == 'kg' ){
            that.weight = resultlut.weight * 2;
            //that.articleWeightPackageDialog.price = (that.articleWeightPackageDialog.article.catty_money) * that.weight;
          }else {
            that.weight = resultlut.weight * 500;
            //that.articleWeightPackageDialog.price = (that.articleWeightPackageDialog.article.catty_money) * that.weight;
          }
          that.getFoodWeight()
        });
      },

      // 打开 称重包弹窗
      openArticleWeightPackageDialog(currentArticle) { // 打开重量包弹窗
        console.log("打开重量包弹窗---", currentArticle)

        var that = this;
        if (this.shopModel == 7) {
          //that.weight = '';
          //this.articleWeightPackageDialog.price = 0;
          //that.articleWeightPackageDialog.show = true;
          //that.articleWeightPackageDialog.title = currentArticle.name;
          //that.articleWeightPackageDialog.article = currentArticle;
          this.articleWeightPackageDialog.price = (currentArticle.catty_money) * sessionStorage.getItem("weight");
          this.addArticleWeightPackageToCar1(currentArticle)
        } else {
          getWeightPackageLIst(currentArticle.id, function (weightPackagekList) {
            that.articleWeightPackageDialog.show = true;
            that.articleWeightPackageDialog.title = currentArticle.name;
            let weight = 0

            for (let unit of weightPackagekList) {
              for(let temp of unit.list){
                temp.state = 0;
              }
              unit.list[0].state = 1;
              that.articleWeightPackageDialog.tempName = unit.name;
              that.articleWeightPackageDialog.name = `${unit.name}(${unit.list[0].name})`
              weight = unit.list[0].weight;
            }
            console.log(currentArticle.weightPackagekList);
            currentArticle.weightPackagekList = weightPackagekList;
            that.articleWeightPackageDialog.article = currentArticle;
            that.articleWeightPackageDialog.tempPrice = currentArticle.catty_money;
            that.articleWeightPackageDialog.price = that.articleWeightPackageDialog.tempPrice * weight;
          });
        }

      },
      // 选择称重包
      choiceWeightPackage(weightPackagekList, detail) { // 选择 新规格
        for(let temp of weightPackagekList){
          temp.state = 0;
        }
        detail.state = 1;
        this.articleWeightPackageDialog.name = `${this.articleWeightPackageDialog.tempName}(${detail.name})`
        this.articleWeightPackageDialog.price = this.articleWeightPackageDialog.tempPrice * detail.weight;
      },


      addArticleWeightPackageToCar(currentArticle) { // 称重包  添加到购物车
        this.addCar = true
        setTimeout(()=>{ this.addCar = false }, 500)
        let price = this.articleWeightPackageDialog.tempPrice;
        let articleName = currentArticle.name;
        let weight_package_detail_id = '';
        let weight = 0
        for (let unit of currentArticle.weightPackagekList) {
          for (let detail of unit.list) {
            if (detail.state) {
              weight_package_detail_id = detail.id;
              price *= detail.weight;
              articleName += '(' + detail.name + ')';
              weight = detail.weight;
            }
          }
        }
        let article = {
          time: new Date().getTime(),
          id: currentArticle.id,
          weight_package_detail_id: weight_package_detail_id,
          count: 1,
          name: articleName,
          price: price , //
          type: 8,  //
          articleFamilyId: currentArticle.article_family_id,
          mealFeeNumber: currentArticle.meal_fee_number||0,  // 餐盒费
          class: 'car-new-name',
          state: 0,  // 新加入购物车
          status: 3,
          open_catty: 1,
          weight: weight,

          discount: !!currentArticle.discount ? currentArticle.discount : 100, // 折扣
          fansPrice: !!currentArticle.fans_price ? currentArticle.fans_price : 0,
          isFans: this.isFans, // 是否开启粉丝价
        };
        this.car.push(article);
        this.$store.commit('increateArticleCount', currentArticle)

        this.articleWeightPackageDialog.show = false;
      },
      addArticleWeightPackageToCar1(currentArticle) { // 称重  添加到购物车
        this.weight = sessionStorage.getItem("weight");
        console.log('重量',this.weight);
        if(this.weight == '' || this.weight < 0) {
          return this.$message.warning("请先称重菜品！");
        }
        //currentArticle.count++;
        let name = `${currentArticle.name}(${this.weight}斤)`
        let article = {
          time: new Date().getTime(),
          id: currentArticle.id,
          weight_package_detail_id: '',
          count: 1,
          name: name,
          price: this.formatMoney(this.articleWeightPackageDialog.price), //
          type: 8,  //
          articleFamilyId: currentArticle.article_family_id,
          mealFeeNumber: 0,  // 餐盒费
          class: 'car-new-name',
          state: 0,  // 新加入购物车
          status: 3,
          open_catty: 1,
          weight: this.weight,

          discount: !!currentArticle.discount ? currentArticle.discount : 100, // 折扣
          fansPrice: !!currentArticle.fans_price ? currentArticle.fans_price : 0,
          isFans: this.isFans, // 是否开启粉丝价
        };
        console.log("article", article)
        this.car.push(article);
        this.$store.commit('increateArticleCount', currentArticle)
        this.articleWeightPackageDialog.show = false;
      },


      openPackageDialog(currentArticle) { // 打开套餐弹框
        this.$store.dispatch('getMealByArticleId', currentArticle)
      },

      choseAttr(attr, item) {  // 选择套餐属性
        this.$store.commit('choseAttr', {attr, item})
      },

      // 套餐 加入购物车
      addPackageToCar(currentArticle) {
        this.addCar = true
        setTimeout(()=>{ this.addCar = false }, 500)
        this.$store.commit('addAttrToCar', this.isFans)
        // if(this.addCarArticle.count == undefined || this.addCarArticle.count <=0){
        //   return;
        // }
        if( this.addCarArticle.articleFamilyId){
          this.car.push(this.addCarArticle);
          this.$store.commit('increateArticleCount', currentArticle)
        }

      },

      formatDate(date) {
        return formatDate(new Date(parseInt(date)), 'yyyy-MM-dd hh:mm:ss');
      },
      goBack() {
        if (this.car.length) {
          this.$confirm('购物车新增的餐品将会被  清空  ，确定返回么?', '提示', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }).then(() => {
            this.$router.go(-1);
          }).catch(() => {
          });
        } else {
          this.$router.go(-1);
        }
      },
      checkedOrder(toPayOrder){
        let that = this;
        setTimeout(() => {
          this.loading = false
        }, 15 * 1000);
        let orderItem = [];
        for (let item of this.car) {
          if (item.state === 0) {
            orderItem.push(item);
          }
        }
        if(orderItem.length == 0) return this.$message.warning("请先添加菜品~");
        this.pushOrder(toPayOrder)
      },
      pushOrder() {  // 下单
        let that = this;
        let orderItem = [];
        // 如果是外带模式，则有餐盒费 否则，餐盒费为0
        let {meal_fee_price, is_meal_fee} = this.shopDet;
        let mealFeePriceOne = this.order.distributionModeId == 3 ? ( is_meal_fee ? meal_fee_price : 0) : 0;
        for (let item of this.car) {
          if (item.state === 0) {
            this.mealAllNumber += item.mealFeeNumber * item.count;
            item.mealFeeNumber = this.order.distributionModeId == 3 ? ( is_meal_fee ? item.mealFeeNumber * item.count : 0) : 0
            if(item.count == 0) {
              return  this.$message.warning(`【 ${item.name }】 最少为 1 份`)
            }
            orderItem.push(item);
          }
        }
        this.mealAllNumber = this.order.distributionModeId == 3 ? ( is_meal_fee ? this.mealAllNumber : 0) : 0;
        let pushOrderInfo = {
          masterOrderId: null,
          childrenOrderId: null,
          orderItems: orderItem,
          mealFeePrice: mealFeePriceOne * this.mealAllNumber,
          mealAllNumber: this.mealAllNumber,
          distributionModeId: this.order.distributionModeId,
          customerId: 0
        }
          if (orderItem.length === 0) {
            this.$message.error('请添加菜品')
            return;
          }
          this.tableOrder.childrenOrder = 1;
          pushOrder(pushOrderInfo, function (orderId) {//父id，子Id,订单菜品项
            // 下单之后，再将数据远程推送到云端`
            that.pushOrderSuccess(null, orderId);
          });

      },

      pushOrderSuccess(order, orderId){
        // 先付 || 外带  ==>  直接跳转支付页面
        this.$router.push("/pay/" + orderId);
        bus.$emit("refresh-turnover");
      },
      toTablePage(order){
        this.$router.push("/table/eatin/detail/" + order.id + "?tableNumber=" +  order.table_number+'&orderType=all');
      },

      familyPages(pageNumbers) {
        this.selectCurrentPages = pageNumbers;
        var articleInfo = document.getElementById("familyWrapper");
        switch (pageNumbers) {
          case 0:
            articleInfo.scrollTop -= articleInfo.clientHeight;
            break;
          case 1:
            articleInfo.scrollTop += articleInfo.clientHeight;
            break;
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
      articlePageOperation (operation) {
        var articleWrapper = document.getElementById("articleInfo");
        if(operation == 1){  // 下一页
          articleWrapper.scrollTop += articleWrapper.clientHeight;
        }else{  //  上一页
          articleWrapper.scrollTop -= articleWrapper.clientHeight;
        }
      },

      // 套餐弹窗翻页
      combanPage(operation) {
        var orderDetailWrapper = document.getElementById("attrWrapper");
        if(operation == 1){  // 下一页
          orderDetailWrapper.scrollTop += orderDetailWrapper.clientHeight;
        }else{  //  上一页
          orderDetailWrapper.scrollTop -= orderDetailWrapper.clientHeight;
        }
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

      printOrderBtn(){
        console.log(this.$route.params.orderId);
        printOrder(this.$route.params.orderId);
      },
      printKitchenBtn(){
        printKitchenTotal(this.$route.params.orderId,1, 0 , null,null,()=>{
          this.$notify.success({ message: '打印成功！', duration: 1500  });
        });
      },
      printTotalOrder(orderId){
        let that = this;
        if(this.shopDet.auto_print_total == 0){
          printTotal(orderId,1,2);
        }
        printKitchenTotal(orderId, 1,null, null, null, function () {});
        printOrder(orderId, function () {
          setTimeout(function () {
            //  1.5秒后，发送打印指令，防止出现，订单未插入，无法更改状态的问题
            that.$socket.printSuccess(orderId);
          }, 1500);
        });
      },
      formatMoney(money){
        return this.$utils.formatMoney(money || 0);
      },

      allOrder() {
      },
      payOrder() {

      },
      waitOrder() {

      }
    }
  }
  ;
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
  .left-wrapper {
    height: 100%;
    position: relative;
    z-index: 1;
    background-color: #FFFFFF;
    box-shadow: 0 0px 20px 0 rgba(0, 0, 0, .25), 0 0 6px 0 rgba(0, 0, 0, .04);
  }
  .car-footer{
    position: absolute;
    bottom:0px;
    width: 100%;
    border-top: 8px solid #f5f5f5;
  }
  .order-payment {
    font-size: 1em;
    width:100%;
    height: 40px;
    line-height: 40px;
    padding-left: 7px;
    color: black;
    border-bottom: 1px dashed grey;
  }
  .order-payment-num{
    font-size: 20px;
    color: #ef5350;
    line-height: 24px;
  }

  .operate-article-button {
    display: inline-block;
    line-height: 1;
    white-space: nowrap;
    cursor: pointer;
    margin: 5px 0px 0px 0px;
    padding: 10px 15px;
    border:none;
    border-radius: 5px;
    color: #666666;
    height: 40px;
    width: 100%;
    font-size: 16px;
    font-weight: bold;
    border: 1px solid black;
    background-color: #FFFFFF;
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
    margin: 5px 0px 0px 0px;
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
    background: #FFBF34;
    border-radius: 5px;
    color: #ffffff;
  }
  .right-wrapper {
    height: 100%;
    background-color: #F6F6F6;
    /*border-left: 5px solid #F2F2F2;*/
  }

  .article-wrapper {
    height: 100%;
    /*padding-bottom: 50px;*/
    background-color: #eeeeee;
  }

  .article-info {
    height: 100%;
    overflow-y: auto;
    /*overflow-x: hidden;*/
    /*margin-top: 10px;*/
    padding: 10px;
  }
  .el-col-21 {
    width: 85.5%;
  }
  .el-col-3 {
    width: 14.5%;
  }

  /** 菜品信息  滚动条  begin  **/
  /*#familyWrapper{*/
  /*overflow-y:scroll;*/
  /*}*/
  /*#familyWrapper::-webkit-scrollbar {!*滚动条整体样式*!*/
  /*width: 2px;     !*高宽分别对应横竖滚动条的尺寸*!*/
  /*height: 2px;*/
  /*}*/
  /*#familyWrapper::-webkit-scrollbar-thumb {!*滚动条里面小方块*!*/
  /*border-radius: 5px;*/
  /*-webkit-box-shadow: inset 0 0 5px rgba(0,0,0,0.2);*/
  /*background: rgba(0,0,0,0.2);*/
  /*}*/
  /*#familyWrapper::-webkit-scrollbar-track {!*滚动条里面轨道*!*/
  /*-webkit-box-shadow: inset 0 0 5px rgba(0,0,0,0.2);*/
  /*border-radius: 0;*/
  /*background: rgba(0,0,0,0.1);*/
  /*}*/
  /** 菜品信息  滚动条  end  **/

  .family-wrapper {
    height: 100%;
    /*border: 5px solid #F2F2F2;*/
    overflow-y: auto;
    /*overflow-x: hidden;*/
    background-color: #FFFFFF;
    text-align: center;
    position: relative;
  }

  .family-item {
    width: 100%;
    /*margin-top: 5px;*/
    /*margin-bottom: 10px;*/
    padding: 5px;
    padding-top: 15px;
    padding-bottom: 15px;
    font-size: 18px;
    line-height: 20px;
    white-space: normal;
    position: relative;
    border: none;
  }
  .family-item-active {
    background: #EEEEEE;
    border-left: 5px solid #ffbf34!important;
    border: none;
    color: #333333;;
    border-radius: 0;
  }
  .pageButton {
    width: 100%;
    bottom: 0px;
    position: absolute;
    bottom: 55px;
  }
  .page-button-item {
    width: 80%;
    /*background-color: #FFBF34;*/
    text-align: center;
    margin-bottom: 10px;
    padding-left: 15px;
    color: #1f2d3d;
    border: 1px solid #666;
  }
  .pageButtonActive{
    background-color: #ffbf34;
    color: #fff!important;
    border: none!important;
  }
  .bottom-tool {
    position: absolute;
    bottom: 0px;
    width: 100%;
    height: 60px;
    line-height: 60px;
    padding-left: 10px;
    /*border-top: 1px solid #d1dbe5;*/
    /*box-shadow: 0 -2px 4px 0 rgba(0, 0, 0, .12), 0 0 6px 0 rgba(0, 0, 0, .04);*/
    background-color: #F6F6F6;
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
    background: linear-gradient(white, white) padding-box,
    repeating-linear-gradient(-45deg, #ccc 0, #ccc 0.25em, white 0, white 0.75em);
  }

  /* 遮罩层 */
  .mask-layer {
    /*height:100%;*/
    width: 100%;
    position: absolute;
    background-color: black;
    opacity: 0.5;

  }

  .car-total {
    height: 50px;
    line-height: 50px;
    border-top: 5px solid #F2F2F2;
    font-size: 22px;
    font-weight: bold;
    text-align: center;
  }

  .article-card {
    margin-bottom: 7px;
    /*width: 119px;*/
    width: 19%;
    height: 32%;
    margin-right: 1%;
    cursor: pointer;
  }
  .article-card > .el-card {
    height: 100%;
  }
  .title-wrapper {
    display: flex;
    justify-content: center;
    align-items: center;
    /*height: 85px;*/
    height: 56%;
  }

  .article-name {
    /*width: 100%;*/
    font-size: 32px;
    text-align: center;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 3;
    overflow: hidden;
  }

  .article-count {
    position: relative;
    top: 0px;
    right: 0px;
  }

  .el-badge__content.is-fixed {
    top: 15px;
    right: 28px;
  }

  .el-badge__content {
    height: 20px;
    line-height: 20px;
  }

  .family-badge {
    top: 8px !important;
    right: 20px !important;
  }
  .dialog-title-warp {
    height: 48px;
    line-height: 48px;
    text-align: center;
  }

  .dialog-title {
    font-family: "SourceHanSansCN-Medium";
    font-size: 22px;
    color:#666;
    font-weight: bold;
    vertical-align: middle;
  }

  .dialog-content {
    max-height: 400px;
    overflow-y: auto;
    margin:0px 20px;
    background-color: #eee;
    padding: 0px 20px;
  }
  .dialog-content::-webkit-scrollbar {display:none}
  .dialog-dashed{
    padding: 1em;
    border-top: 2px dashed transparent;
    background: linear-gradient(white,white) padding-box,
    repeating-linear-gradient(-45deg,#ccc 0, #ccc 0.25em,white 0,white 0.75em);
    margin-bottom: 10px;
  }
  /*     滚动条   begin     */

  .scrollbar::-webkit-scrollbar {
    /*    定义滚动条宽高及背景，宽高分别对应横竖滚动条的尺寸   */
    width: 10px;
    height: 10px;
  }

  .scrollbar::-webkit-scrollbar-track {
    /*    定义滚动条的轨道，内阴影及圆角   */
    background-color: #C0CCDA;
    /*border-radius:6px;*/
  }

  .scrollbar::-webkit-scrollbar-thumb {
    /*  定义滑块，内阴影及圆角   */
    background-color: #475669;
    /*border-radius:6px;*/
  }

  /*     滚动条   end     */

  /*    购物车 table 样式    begin   */

  .car-table {
    width: 100%;
    font-size: 14px;
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

  .car-push-name {
    color: #20A0FF;
  }

  .car-remove-name {
    color: #FF4949;
  }

  .car-new-name {
    /*color: #13CE66;*/
    color: black;
  }

  .car-table-body-tr td,
  th {
    /*border-top: 1px solid #dfe6ec;*/
    border-bottom: 1px dashed #dfe6ec;
  }

  .car-table-body-tr-selected {
    background-color: #E5E9F2;
  }

  .car-table-body-package-tr {
    text-align: center;
    height: 40px;
    background-color: #FFFFFF;
  }

  /*.car-table-body-package-tr td:last-child{*/

  /*border-bottom: 1px solid #dfe6ec;*/

  /*}*/

  .car-table td {
    /*border-bottom: 1px solid #dfe6ec;*/
  }

  /*    购物车 table 样式    end   */

  /*加减样式*/

  .count-article {
    width: 30px;
    height: 30px;
    line-height: 30px;
    color: #fff;
    border-radius: 50%;
    background-color: #58B7FF;
    display: inline-block;
  }

  .red-circle {
    position: absolute;
    top: 15px;
    left: 0;
    width: 10px;
    height: 10px;
    background: red;
    -webkit-border-radius: 50%;
    border-radius: 50%;
  }

  .blue-circle {
    position: absolute;
    top: 15px;
    left: 0;
    width: 10px;
    height: 10px;
    background: #032EFF;
    -webkit-border-radius: 50%;
    border-radius: 50%;
  }

  .yellow-circle {
    position: absolute;
    top: 15px;
    left: 0;
    width: 10px;
    height: 10px;
    background: #ff4d51;
    -webkit-border-radius: 50%;
    border-radius: 50%;
  }


  /** 订单详情  滚动条  begin  **/
  /*#order-detail-wrapper::-webkit-scrollbar {*/
  /*width: 4px;*/
  /*height: 4px;*/
  /*}*/
  /*#order-detail-wrapper::-webkit-scrollbar-thumb {*/
  /*border-radius: 5px;*/
  /*-webkit-box-shadow: inset 0 0 5px rgba(0,0,0,0.2);*/
  /*background: rgba(0,0,0,0.2);*/
  /*}*/
  /*#order-detail-wrapper::-webkit-scrollbar-track {*/
  /*-webkit-box-shadow: inset 0 0 5px rgba(0,0,0,0.2);*/
  /*border-radius: 0;*/
  /*background: rgba(0,0,0,0.1);*/
  /*}*/
  /** 订单详情  滚动条  end  **/

  .el-button--primary {
    background-color: #000 !important;
    color: #fff!important;
    border: none;
  }

  /** 菜品信息 滚动条  **/
  #articleInfo{
    overflow-y:scroll;
  }
  #articleInfo::-webkit-scrollbar {/*滚动条整体样式*/
    width: 4px;     /*高宽分别对应横竖滚动条的尺寸*/
    height: 4px;
  }
  #articleInfo::-webkit-scrollbar-thumb {/*滚动条里面小方块*/
    border-radius: 5px;
    -webkit-box-shadow: inset 0 0 5px rgba(0,0,0,0.2);
    background: rgba(0,0,0,0.2);
  }
  #articleInfo::-webkit-scrollbar-track {/*滚动条里面轨道*/
    -webkit-box-shadow: inset 0 0 5px rgba(0,0,0,0.2);
    border-radius: 0;
    background: rgba(0,0,0,0.1);
  }
  /** 菜品信息 滚动条  **/

  .pageButton {
    width: 90%;
    /*position: absolute;*/
    margin-top: 20px;
  }

  .re-food-tag {
    display: inline-block;
    height: 40px;
    line-height: 40px;
    padding-left: 20px;
    padding-right: 20px;
    background-color: darkgrey;
    border-radius: 5px;
  }
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

  .article-page-wrapper{
    position: fixed;
    top:37%;
    right: 118px;
    z-index: 10;
  }
  .article-page-wrapper > .pre-page{
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
  .article-page-wrapper > .next-page{
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

  .change-order-content {
    margin: 0 auto;
    width:100%;
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

  .packate-title {
    display: inline-block;
    /*margin: 0 0 5px 3px;*/
    margin-top: 20px;
    font-size: 18px;
    color: #666;
  }
  .package-content-wrap{
    width:100%;
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: flex-start;
    align-items: center;
  }
  .package-items {
    height: 84px;
    /*line-height: 84px;*/
    font-size: 1.1em;
    text-align: center;
    margin:15px 10px 10px 3px;
    padding:0px 20px;
    border-radius: 5px;
    color: #666;
    background-color: #fff;
    cursor: pointer;
    position: relative;
    padding-top: 20px;
  }
  .not-sell{
    top: 0px !important;
    right: 20px !important;
    z-index: 10;
  }
  .package-item-click{
    color: #ffbf34;
    /*background-color: #ffbf34;*/
    border: 1px solid #ffbf34;
  }

  .refund-command {
    border: 1px solid black;
    /*width: 200px;*/
  }



  .car-title {
    width: 100%;
    color: #666;
    vertical-align: middle;
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

  .hidden-dom{
    display: none;
  }

  .base-btn{
    width: 100%;
    margin-top: 5px;
    border-radius: 5px;
    border: 1px solid black;
    color: #333333;
    background-color: #FFFFFF;
  }
  .base-btn-active{
    width: 100%;
    margin-top: 5px;
    border-radius: 5px;
    border: none;
    color: #fff;
    background-color: #FFBF34;
  }
  .el-dialog__wrap >>> .el-dialog__body {
    padding: 0px;
  }
  .el-dialog__wrap  >>> .el-dialog__header {
    padding: 0px;
  }

  .el-dialog__wrap  >>> .el-dialog__headerbtn {
    position: absolute;
    top: 15px;
    right: 15px;
  }
</style>
