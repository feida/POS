<template>
  <div class="takeout">
    <el-col :span="6" class="left">
      <!--<router-view></router-view>-->
      <p class="panel-title">客单
        <i class="el-icon-arrow-down" v-if="showDetails == false" @click="showDetails = !showDetails"></i>
        <i class="el-icon-arrow-down" v-if="showDetails == true" @click="showDetails = !showDetails"></i>
      </p>
      <div v-if="showDetails == true" class="mask-layer" :style="{ height: carTableHeight + 'px' }"></div>
      <div v-if="showDetails == true" style="position: absolute;width: 100%;">
        <el-row class="panel-content">
          订单备注：{{currentOrderInfo.remark || '无'}}
        </el-row>
      </div>

      <div :style="{ height: carTableHeight + 'px' }" style="overflow: hidden" id="order-detail-wrapper">
        <div class="order-page-wrapper">
          <div class="pre-page" @click="orderPageOperation(-1)"><span class="el-icon-caret-top" style="font-size: 26px;margin-left: 4px;"></span></div>
          <div class="next-page" @click="orderPageOperation(1)"><span class="el-icon-caret-bottom" style="font-size: 26px;margin-top: 4px;margin-left: 2px;"></span></div>
        </div>
        <!--购物车 菜品详情-->
        <div style="background-color: #FFFFFF">
          <ul class="car-title">
            <li class="car-title-item" style="width: 15%;text-align: center; text-indent: 9px;">#</li>
            <li class="car-title-item" style="width: 40%;">品名</li>
            <li class="car-title-item" style="width: 15%;">数量</li>
            <li class="car-title-item" style="width: 20%;text-align: right;">小计</li>
          </ul>

          <!--购物车 内容-->
          <ul class="car-title car-content" v-for="(article, index) in carData">
            <hr style="border:1px dashed #E0E0E0; width: 90%;">
            <div>
              <li class="car-title-item car-content-item" style="width: 15%;text-align: center;">
                {{index + 1}}
              </li>
              <li class="car-title-item car-content-item" style="width: 40%;">
                <span style="display: inline-block;width: 80%;">{{article.name}}</span>
              </li>
              <li class="car-title-item car-content-item" style="width: 15%;vertical-align: top;">{{article.quantity}}</li>
              <li class="car-title-item car-content-item" style="width: 20%;vertical-align: top;text-align: right;">¥{{formatMoney(article.price)}}</li>
            </div>
          </ul>
        </div>
      </div>

      <div class="car-footer">


        <el-row type="flex" justify="space-around" style="height: 40px;margin-top: 5px">
          <el-col :span="11">
            <el-button style="width: 100%;" @click="printKitchenTotal">打印厨打</el-button>
          </el-col>
          <el-col :span="11">
            <el-button style="width: 100%;background-color: #ffbf34;color: #ffffff;" @click="printTotal">打印总单</el-button>
          </el-col>
        </el-row>
      </div>
    </el-col>
    <el-col :span="18" >
      <order-toolbar :orderStateCount=orderStateCountObj v-on:eleme="elemeOrder" v-on:meituan="meituanOrder" v-on:baidu="baiduOrder"></order-toolbar>
      <div class="takeout-wrapper">
        <template class="takeout-wrapper">
            <el-table :data="takeOutData" id="take-content-wrapper" :style="{ height: takeOutContentHeight + 'px' }" border style="width: 100%; overflow-y: auto; border-bottom-width: 0px"  @row-click='handleRowHandle'>
              <el-table-column prop="index" label="订单编号" width="100"></el-table-column>
              <el-table-column prop="name" label="姓名" width="80"></el-table-column>
              <el-table-column prop="telephone" label="电话" width="180"></el-table-column>
              <el-table-column prop="address" label="地址"></el-table-column>
              <el-table-column prop="createTime" label="创建时间"></el-table-column>
            </el-table>
      </template>
        <div class="order-page-wrapper">
          <div class="pre-page" @click="pageOptions(-1)"><span class="el-icon-caret-top" style="font-size: 26px;margin-left: 4px;"></span></div>
          <div class="next-page" @click="pageOptions(1)"><span class="el-icon-caret-bottom" style="font-size: 26px;margin-top: 4px;margin-left: 2px;"></span></div>
        </div>
      </div>
    </el-col>
  </div>
</template>

<script>
  import orderToolbar from '../component/order-toolbar.vue';
  import {
    platformTodayList,
    platformByOrderId,
    printPlatformTotal,
    printPlatformTicket
  } from '../../../api/api'
  import bus from '../../../utils/bus'

  export default {
    name: 'takeout',
    components:{
      orderToolbar
    },
    data () {
      return {
        takeOutContentHeight: 0,
        showDetails: false,
        carTableHeight:0,
        orderStateCountObj:{},
        takeOutData: [],
        eleData: [],
        meituanData: [],
        baiduData: [],
        carData: [],
        currentOrderInfo:{},
      };
    },
    created(){
      let that = this;
      platformTodayList(function (data) {
        that.initData(data)
        that.elemeOrder();
      })
    },
    mounted(){
      this.initHeight()
      this.carTableHeight = document.body.clientHeight - 300;
    },

    beforeDestroy() {
    },

    methods:{
      // 初始化外卖展示区高度
      initHeight (){
        var contentHeight = document.body.clientHeight - 64 - 49 - 50;
        this.takeOutContentHeight = contentHeight
      },

      initData (data) {
        for(let dataItem of data) {
            let item = {
              index: dataItem.order_number,
              name: dataItem.name,
              address: dataItem.address,
              telephone: dataItem.phone,
              createTime: this.$utils.format(null, dataItem.order_create_time),
              platformOrderId: dataItem.platform_order_id,
              remark: dataItem.remark,
            };
            switch (dataItem.type) {
              case 1:
                this.eleData.push(item)
                break;
              case 2:
                this.meituanData.push(item)
                break;
              case 3:
                this.baiduData.push(item)
                break;
              default:
                break
            }
        }
      },

      elemeOrder(){
        this.takeOutData = this.eleData;
      },
      meituanOrder(){
        this.takeOutData = this.meituanData;
      },
      baiduOrder(){
        this.takeOutData = this.baiduData;
      },

      handleRowHandle(event){
        let that = this;
        let platformOrderId = event.platformOrderId;
        this.currentOrderInfo = event;
        platformByOrderId(platformOrderId,function (data) {
          that.carData = data;
        })
      },

      //========
      // 打印逻辑
      //========
      printTotal(){
        let currentPlatformOrderId = this.currentOrderInfo.platformOrderId
        printPlatformTotal(currentPlatformOrderId,function (data) {

        })
      },
      printKitchenTotal(){
        let currentPlatformOrderId = this.currentOrderInfo.platformOrderId
        printPlatformTicket(currentPlatformOrderId,function (data) {

        });
      },



      //==========
      // 功能操作区
      //==========
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

      pageOptions (operation){
        var takeContentWrapper = document.getElementById("take-content-wrapper")
        if(operation == 1){  // 下一页
          takeContentWrapper.scrollTop += takeContentWrapper.clientHeight;
        }else{  //  上一页
          takeContentWrapper.scrollTop -= takeContentWrapper.clientHeight;
        }
      },
    }
  };
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
  .takeout{
    width: 100%;
    height: 100%;
  }
  .left{
    height: 100%;
    position: relative;
    box-shadow: 0 0px 20px 0 rgba(0, 0, 0, .25), 0 0 6px 0 rgba(0, 0, 0, .04);
  }
  .right{
    height: 100%;
    padding-bottom: 110px;
  }
  .takeout-wrapper {
    padding: 0;
    margin: 0;
    width: 100%;
    height: 100%;
  }

  .panel-title {
    height: 50px;
    line-height: 50px;
    font-size: 22px;
    font-weight: bold;
    text-align: center;
    background-color: #252525;
    color: #FFFFFF;
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



  .car-table-body-tr td, th {
    border-bottom: 1px solid #dfe6ec;
  }

  .car-footer {
    width: 100%;
    position: absolute;
    bottom:0px;
    border-top: 5px solid #eee;
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
    background-color: #000;
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


  .icon {
    width: 30px;
    height: 30px;
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
  }
  .car-content-item {
    font-size: 14px;
    word-wrap: break-word;
    color: #666;
  }
  .el-table::before {
    height: 0;
  }
</style>
