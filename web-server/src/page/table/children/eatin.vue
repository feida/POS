<template>
  <div class="eatin" v-loading.fullscreen.lock="fullscreenLoading">
    <el-col :span="7" class="left">
      <router-view></router-view>
    </el-col>
    <el-col :span="17" class="right">
      <pagination  style="right: 18%"></pagination>
      <order-toolbar v-if="shopModel == 2 || shopModel == 7" :callCount=callCount v-on:all="allOrder(true, true)" v-on:pay="payOrder" v-on:wait="waitOrder"></order-toolbar>
      <order-toolbar  v-else :orderStateCount=orderStateCountObj v-on:all="allOrder(true, true)" v-on:pay="payOrder" v-on:wait="waitOrder" v-on:nopay="noPayOrder" v-on:paying="payingOrder"></order-toolbar>
      <el-row class="table-wrapper" style="padding: 0px;margin: 0px;">
        <el-col :span="(this.shopModel == 2 || this.shopModel == 7) ? 24 : 20" class="table-info" id="tableInfo" style="padding: 0px;margin: 0px;">
          <el-row >
            <template>
              <tableItem :tableAndOrderList="tableAndOrderList" :currentTable.sync="currentTable"></tableItem>
            </template>
          </el-row>
        </el-col>
        <!--右边区域-->
        <el-col  :span="4" class="area-wrapper" id="areaList" v-if="this.shopModel !=2 && this.shopModel !=7">
          <ul class="area-list">
            <li @click="choseAllTable(null)">
              <el-button class="area-item" :class="{'btn-active' : currentAreaId == null}">全部</el-button>
            </li>
            <li v-for="(area, key) in areaList" :key="key" @click="choseTableArea(area)" v-show="currentOrderType == 'all'">
              <el-button class="area-item" :class="{'btn-active' : currentAreaId == area.id}">{{area.name}}</el-button>
            </li>
          </ul>
          <ul class="pageButton">
            <li>
              <el-button class="page-button-item" style="border: 1px solid #666"  @click="getPages(0)" :class="selectCurrentPages == 0 ? 'pageButtonActive' : ''">
                上一页
              </el-button>
            </li>

            <li>
              <el-button class="page-button-item " @click="getPages(1)" style="border: 1px solid #666" :class="selectCurrentPages == 1 ? 'pageButtonActive' : ''">
                下一页
              </el-button>
            </li>

          </ul>
        </el-col>
      </el-row>

      <!--  底部订单操作栏 -->
      <bottomToolbar style="position: absolute; bottom:0;left: 0;" v-on:call="callNumber()" v-on:order="toOrderPage()" v-on:pay="toPayPage()" v-on:change="openChangeTableDialog()" v-on:refund="changeOrder()" v-on:cancel="canCelOrder()" v-on:check="checkedWeight()"  v-on:rush="rushOrder()" v-on:grant="grantOrder()"></bottomToolbar>

      <el-dialog :title="'当前桌号：' + currentTable.table_number + '号'" :visible.sync="changeTableDialog.show" :close-on-click-modal="false">
        <el-row>
          <el-col :span="24">
            <div class="grid-content bg-purple">
              <el-input readonly v-model="changeTableDialog.newTableNum" placeholder="请输入桌号"></el-input>
            </div>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="8" v-for="i in 9" :key="i">
            <el-button class="btn-number" @click="changeTableKeyBoard(i)">{{i}}</el-button>
          </el-col>
          <el-col :span="8">
            <el-button class="btn-number" @click="changeTableKeyBoard(0)">0</el-button>
          </el-col>
          <el-col :span="8">
            <el-button class="btn-number" @click="changeTableKeyBoard('cleaAll')">清零</el-button>
          </el-col>
          <el-col :span="8">
            <el-button class="btn-number" @click="changeTableKeyBoard('x')"><span class="iconfont icon-backspace" style="font-size: 28px"></span></el-button>
          </el-col>
        </el-row>
        <div slot="footer" style="text-align: center">
          <el-button @click="changeTableDialog.show = false">取 消</el-button>
          <el-button type="primary" @click="changeTable">确 定</el-button>
        </div>
      </el-dialog>
    </el-col>
    <not-print-order></not-print-order>
  </div>
</template>

<script>
  import bus from '../../../utils/bus'
  import orderToolbar from '../component/order-toolbar.vue';
  import bottomToolbar from '../component/bottom-toolbar.vue';
  import notPrintOrder from '../component/local-not-print-order.vue';
  import tableItem from '../../../components/table/table-Item';
  import pagination from '../../../components/basic/pagination';
  import { mapGetters, mapActions } from 'vuex'
  import {
    callNumber,
    changeTable,
    orderStateCount,
    releaseTable,
    waitCallOrderList,
    hasCallOrderList,
    waitCallTPOrderList,
    hasCallTPOrderList,
    cancelOrder,
    getOrderInfoTest,
    waitCallTPAndhasCallTPOrderCount,
    selectOrderDiscount,
    getOrderDetail,
    syncOrderInfoById,
    syncAllOrderById
  } from 'api/api';
  export default {
    name: 'eatin',
    components:{
      orderToolbar,
      notPrintOrder,
      bottomToolbar,
      tableItem,
      pagination
    },
    data () {
      return {
        fullscreenLoading: false,
        isPayOrder: true,  // 如果全是 已完成的订单，则禁用 底部 按钮栏
        areaMap: {},
        currentAreaId: null,
        orderStateCountObj:{},
        selectCurrentPages:"3",
        tableMap: {},
        tableMapKeyOfNum: {}, // table map key 为 桌号
        tables: [],
        currentTable: {},
        changeTableDialog: {
          show: false,
          newTableNum: ""
        },

        tableSort: true,
        currentPage: '',

        shopModel: '',

        tvOrderList: [],
        callCount: {
          waitCallCount: 0,
          hasCalledCount: 0,
        },
        refreshCount: 0,
        isActiveButton: '',
        currentOrderType: "wait",  // wait：待叫号  ； called：已叫号
        shopDet: {},
        page_index: 1,
        totalPage: 0,
        curPage: 0,
        clientWidth: 0,
        tableTotalPage: 0,
        tableNumber: '',
        searchKey: "",
        syncOrderIfo: ''
      };
    },
    watch: {
    },
    computed: {
      ...mapGetters({
        areaList: 'areaList',
        tableAndOrderList: 'tableAndOrderList',
        orderInfo: 'orderInfo',
        pageInfo: 'pageInfo'
      })
    },
    created: function () {
      this.shopDet = JSON.parse(sessionStorage.getItem("shopDet"));
      this.shopModel = this.shopDet.shop_mode;
      this.getOrderStateCount()
    },
    mounted(){
      var that = this;
      this.initTableAndOrderList();
      this.startEventListen();
      this.getClientWidth();
    },
    beforeDestroy () {
      this.removeEventListen();
    },
    methods:{

      initTableAndOrderList (){
        this.currentOrderType = this.$route.query.orderType;
        if (this.currentOrderType == 'undefined') this.currentOrderType = 'all'
        if(this.shopModel == 2 || this.shopModel == 7) {
          if(this.currentOrderType == 'all') {
            this.$router.push('/tvorder?orderType=all');
          } else if (this.currentOrderType == 'wait') {

          }
        } else {
          this.$store.dispatch('getAreaList')
          let pageIndex = sessionStorage.getItem("pageIndex") || this.pageInfo.pageIndex;
          this.$store.dispatch('getAllTableAndOrderList', pageIndex, 20)
        };
      },

      getClientWidth() {
          this.clientWidth = document.getElementById("tableInfo").clientWidth;
      },

      choseAllTable (){
        this.currentAreaId = null
        var Obj = {distributionModeId: 1, pageIndex:  this.pageInfo.pageIndex, searchKey: this.searchKey}
        this.$store.dispatch('getAllTableAndOrderList', Obj)
      },
      choseTableArea(area){
        this.$router.push('/table/eatin?orderType=all')
        this.currentAreaId = area.id;
        this.$store.dispatch('getAllTableAndOrderByAreaId', area.id)
      },
      allOrder (){  // 全部 是以 桌位 为基准
        if (this.shopModel == 2 || this.shopModel == 7) {
          this.$router.push('/tvorder?orderType=all');
        } else {
          var Obj = {distributionModeId: 1, pageIndex:  this.pageInfo.pageIndex, searchKey: this.searchKey}
          this.$store.dispatch('getAllTableAndOrderList', Obj)
          this.$router.push("/table/eatin"+"?orderType=all");
        }
        this.currentOrderType = 'all'
        this.getOrderStateCount();
      },
      payOrder (){  // 支付订单 是以 订单为基准
        if (this.shopModel == 2 || this.shopModel == 7) {
          var Obj = {pageIndex: this.pageIndex, searchKey: this.searchKey, tableNumber: this.tableNumber};
          this.$store.dispatch('getHasCallTPOrderList',Obj);
        } else {
          var Obj = {distributionModeId: 1, pageIndex: this.page_index, searchKey: this.searchKey, tableNumber: this.tableNumber}
          this.$store.dispatch('getPayOrder', Obj);
        }
        this.$router.push("/table/eatin"+"?orderType=payOrder");
        this.currentOrderType = 'payOrder'
        this.getOrderStateCount();
      },
      waitOrder (){   //  待下单  是以 订单为基准
        if (this.shopModel == 2 || this.shopModel == 7) {
            var Obj = {pageIndex: this.pageIndex, searchKey: this.searchKey, tableNumber: this.tableNumber};
            this.$store.dispatch('getWaitCallTPOrderList', Obj)
        } else {
          var Obj = {distributionModeId: 1, pageIndex: this.page_index, searchKey: this.searchKey, tableNumber: this.tableNumber}
          this.$store.dispatch('getWaitOrderList', Obj)
        }
        this.$router.push("/table/eatin"+"?orderType=waitOrder");
        this.currentOrderType = 'waitOrder'
        this.getOrderStateCount();
      },
      noPayOrder (){    //  未支付 是以 订单为基准
        var Obj = {distributionModeId: 1, pageIndex: this.page_index, searchKey: this.searchKey, tableNumber: this.tableNumber}
        this.$store.dispatch('getNoPayOrderList', Obj)
        this.$router.push("/table/eatin"+"?orderType=noPayOrder");
        this.currentOrderType = 'noPayOrder'
        this.getOrderStateCount();
      },
      payingOrder (){   //  付款中 是以 订单为基准
        var Obj = {distributionModeId: 1, pageIndex: this.page_index, searchKey: this.searchKey, tableNumber: this.tableNumber}
        this.$store.dispatch('getPayingOrderList', Obj)
        this.$router.push("/table/eatin"+"?orderType=payingOrder");
        this.currentOrderType = 'payingOrder'
        this.getOrderStateCount();
      },

      getPages (pageNumbers){
        this.currentPage = pageNumbers;
        this.selectCurrentPages = pageNumbers;
        var tableInfo = document.getElementById("tableInfo");
        tableInfo.scrollTop += ( pageNumbers ? tableInfo.clientHeight : - tableInfo.clientHeight);
      },
      getTimeDiff(date){  //  得到相差的分钟值
        var currentDate = new Date().getTime();
        var diff = currentDate - date;
        var m = parseInt(diff / (1000*60));
        if(diff <= 0){
          return "刚刚";
        }else if(m == 0){
          return parseInt(diff / (1000)) + " 秒";
        }else if(m < 60){
          return m + " 分钟";
        }else{
          return parseInt(m / 60) + " 小时" ;
        }
      },
      tableCardClass(order){
        var cardClass = [];
        if(order){
          if(order.production_status === 0){  //  待下单
            cardClass.push("table-card-wait-order");
          }else if(order.order_state === 1 && (order.pay_mode === 3 || order.pay_mode === 4)){ //  付款中
            cardClass.push("table-card-paying");
          }else if(order.order_state === 1){  //  未支付
            cardClass.push("table-card-no-pay");
          }else{  //  已支付
            cardClass.push("table-card-pay-order");
          }
        }
        return cardClass;
      },
      toOrderPage(){
        if (this.shopModel == 2 || this.shopModel == 7) {
        } else {
          let orderId = this.$route.params.orderId;
          this.$router.push('/order/' + orderId);
        }
      },
      toPayPage(){
        let that = this
        let orderId = this.$route.params.orderId
        getOrderInfoTest(orderId, function (orderInfo) {
          if(orderInfo.need_confirm_order_item == 0) {
            that.$router.push('/pay/' + orderId);
          } else {
            orderInfo.orderItemList.map( item =>{
              if(item.needRemind == 1 && item.type == 8) {
                return that.$message.warning(`【${item.articleName}】 需要后厨确认后方可买单`)
              }
            })
          }
        })
      },
      releaseTable(){
        var orderId = this.currentTable.order_id;
        var tableNumber = this.currentTable.table_number;
        releaseTable(orderId, tableNumber, ()=>{
          this.getOrderStateCount();
          this.$socket.updateTableState(tableNumber, true);
          this.$message("取消成功~");
          this.allOrder(false);
        });
      },
      canCelOrder(){
        let cancelTitle = (this.shopModel == 2 || this.shopModel == 7) ? "取餐码" : "桌位";
        let that = this;
        this.$confirm(`是否要取消   ${cancelTitle}   为  【${this.currentTable.table_number}】 的订单吗？`, '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'info'
        }).then(() => {
          var orderId = this.currentTable.order_id;
          if((this.shopModel != 2 && this.shopModel != 7) && this.currentTable.production_status == 0){ //  待下单
            this.releaseTable();
          }else {
            cancelOrder(orderId, function () {
              that.getOrderStateCount();
              that.$socket.posCancelOrder(orderId);
              that.$message("取消成功~");
              that.allOrder();
            })
          }
        }).catch(() => {
        });
      },
      changeTable(){
        let uid = sessionStorage.getItem("uid")
        sessionStorage.setItem("lastBindUid",uid)
        let tableInfo = {
          orderId: this.currentTable.order_id ,
          fromTableNumber : this.currentTable.table_number,
          toTableNumber: this.changeTableDialog.newTableNum,
          uid: uid
        };
        changeTable(tableInfo, (data)=> {
          this.$message("换桌成功",data);
          this.changeTableDialog.show = false;
          this.$router.push('/table/eatin/' + tableInfo.toTableNumber + "/" + tableInfo.orderId+'orderType='+this.currentOrderType);
          this.allOrder();
        });
      },
      openChangeTableDialog(){
        this.changeTableDialog.show = true;
        this.changeTableDialog.newTableNum = "";
      },
      changeTableKeyBoard(number){
        var reg = /^[0-9]*[0-9][0-9]*$/g
        if(reg.exec(number)){
          this.changeTableDialog.newTableNum += number.toString()
        }
        if(number == "cleaAll") {
          this.changeTableDialog.newTableNum = "";
        }
        if(number == 'x') {
          if (this.changeTableDialog.newTableNum.length > 0) {
            let count = this.changeTableDialog.newTableNum;
            this.changeTableDialog.newTableNum = count.substring(0, count.length - 1);
          }
        }
      },
      getOrderStateCount(){
        let that = this;
        if (this.shopModel == 2 || this.shopModel == 7) {
          waitCallTPAndhasCallTPOrderCount(function (data) {
            that.callCount.waitCallCount = data.waitCallTPOrderCount;
            that.callCount.hasCalledCount = data.hasCallTPOrderCount;
          })
        } else {
          orderStateCount(1, (data)=>{
            this.orderStateCountObj = data;
          })
        }
      },
      cardActiveClass (table){
        if(table.order){
          return {'table-card-active' : (this.currentTable.id + (this.currentTable.order ? this.currentTable.order.id : "")) == (table.id + table.order.id)};
        }else{
          return {'table-card-active' : this.currentTable.id == table.id};
        }
      },
      startEventListen() {
        let that = this;
        bus.$on("tv-web-socket-call-order",function () { // tv发来叫号订单
          setTimeout(function (data) {
            that.getOrderStateCount();
          },50)
        });
        bus.$on("wsNewOrder", (data)=> { // 微信发来新订单
          this.getOrderStateCount();
          this.$store.commit("setTvOrderList", data)
          this.searchTable()
        });
        bus.$on("wsPayOrder", ()=>{ // 微信发来支付订单
          this.getOrderStateCount();
        });
        bus.$on("wsCancelOrder", ()=>{ // 取消订单
          this.getOrderStateCount();
        });
        bus.$on("refundOrder",  msgInfo => this.$store.commit('refundOrder', msgInfo));
        bus.$on('searchKey',function(searchKey){
          if (searchKey.indexOf("'") !== -1 || searchKey.indexOf("’") !== -1) return;
          setTimeout(function () {
            if((that.shopModel == 2 || that.shopModel == 7) || (that.shopModel == 6 && that.shopDet.allow_first_pay == 0)){  // 先付
              that.searchKey = searchKey
              that.tableNumber = searchKey
            }else if(that.shopModel == 6 && that.shopDet.allow_after_pay == 0){  // 后付 结算单
              that.tableNumber = searchKey
            }
            that.searchTable(searchKey);
          }, 50)
        });
        bus.$on("hasChanged", function (item) {
          that.getOrderStateCount();
          this.searchTable()
        });
        bus.$on("normalOrder", result => {
          // let lastBindUid = sessionStorage.getItem("lastBindUid")
          // if (lastBindUid != result.ignoreUser) {
            this.$notify.success(result.msg)
            // sessionStorage.removeItem('lastBindUid')
          // }

          let pageIndex = sessionStorage.getItem("pageIndex") || this.pageInfo.pageIndex;
          //let Obj = {distributionModeId: 1, pageIndex: this.pageIndex, searchKey: this.searchKey, tableNumber: this.tableNumber}
          //console.log('Obj1111',Obj)
          //this.$store.dispatch('getAllTableAndOrderList', Obj)
          this.getOrderStateCount();
          this.searchTable()
        })
      },
      removeEventListen() {
        // 清除注册的监听事件  避免重复注册，重复触发
        bus.$off("hasChange")
        bus.$off("wsNewOrder");
        bus.$off("wsPayOrder");
        bus.$off("wsCancelOrder");
        bus.$off("tv-web-socket-call-order");
        bus.$off("weightSuccess");
        bus.$off("bindTable");
        bus.$off("refundOrder");
        bus.$off("searchKey");
        bus.$off("normalOrder")
      },
      formatMoney(money){
        return this.$utils.formatMoney(money);
      },
      changeOrder(){
        let that = this;
        selectOrderDiscount(this.$route.params.orderId, function (discountInfo) {
          if(discountInfo.orderPosDiscountMoney > 0){
            that.$message.warning(`【折扣：￥${discountInfo.orderPosDiscountMoney}】主订单或者子订单进行过折扣操作，暂不允许退菜！`);
            return;
          }
          if(discountInfo.eraseMoney > 0){
            that.$message.warning(`【抹零：￥${discountInfo.eraseMoney}】主订单或者子订单进行过抹零操作，暂不允许退菜！`);
            return;
          }
          bus.$emit("changeOrder","isChange");
        });
      },
      callNumber() {
        callNumber(this.currentTable.id, ()=>{
          this.getOrderStateCount();
          this.$store.commit("setCallNumber", this.currentTable)
          this.$tvSocket.callNumber(this.currentTable.serial_number);
        });
      },
      searchTable(searchKey) {
        let orderType = this.$route.params.orderType
       if(this.$route.path.indexOf("table/eatin") != -1 && this.currentOrderType == "payOrder"){
          this.payOrder();
        }else if(this.$route.path.indexOf("table/eatin") != -1 && this.currentOrderType == "waitOrder") {
          this.waitOrder()
        }else if(this.$route.path.indexOf("table/eatin") != -1 && this.currentOrderType == "noPayOrder") {
          this.noPayOrder()
        }else if(this.$route.path.indexOf("table/eatin") != -1 && this.currentOrderType == "payingOrder") {
          this.payingOrder()
        } else {
         var Obj = {distributionModeId: 1, pageIndex:  1, searchKey: searchKey}
         console.log("Obj", Obj)
         this.$store.dispatch('getAllTableAndOrderList', Obj)
       }
      },
      checkedWeight (){
        bus.$emit("checkedWeight","checkedWeight");
      },
      rushOrder (){
        bus.$emit("rushOrder","rushOrder");
      },
      grantOrder (){
        bus.$emit("grantOrder","grantOrder");
      },
      },
  };
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
  .eatin{
    width: 100%;
    height: 100%;
  }
  .left{
    height: 100%;
    position: relative;
    background-color: #fff;
    box-shadow: 0 0px 20px 0 rgba(0, 0, 0, .25), 0 0 6px 0 rgba(0, 0, 0, .04);
  }
  .right{
    height: 100%;
    padding-bottom: 110px;
    position: relative;
  }
  /*  table   begin   */
  .table-wrapper {
    height: 100%;
    background-color: #eee;
  }
  .table-info {
    height: 100%;
    overflow-y: auto;
    overflow-x: hidden;
    margin-top: 5px;
    padding: 5px;
  }
  .table-card {
    height: 17vh;
    /*width: 88px;*/
    /*margin-bottom: 5px;*/
    /*margin-top: 5px;*/
    cursor: pointer;
  }
  .table-card-active {
    box-shadow:-1px  0 #ffbf34, 0 -1px 0 #ffbf34, 0 1px 0 #ffbf34, 1px 0 0 #ffbf34;
    border: 1px solid #ffbf34;
    color: #ffbf34;
  }
  .table-card-pay-order {
    position: absolute;
    top: 0px;
    right: 0px;
    width: 0;
    height: 0;
    width:15px;
    height: 15px;
    background:green;
    border-radius: 50%;
    /*border-top: 50px solid #26bb02;*/
    /*border-left: 30px solid transparent;*/
  }
  .table-card-no-pay {
    position: absolute;
    top: 0px;
    right: 0px;
    width: 0;
    height: 0;
    width:15px;
    height: 15px;
    background: #ef5350;
    border-radius: 50%;
    /*border-top: 50px solid #bb0202;*/
    /*border-left: 30px solid transparent;*/
  }
  .table-card-paying{
    position: absolute;
    top: 0px;
    right: 0px;
    width: 0;
    height: 0;
    width:15px;
    height: 15px;
    background: #ffbf34;;
    border-radius: 50%;
    /*border-top: 50px solid #F7BA2A;*/
    /*border-left: 30px solid transparent;*/
  }
  .table-card-wait-order {
    position: absolute;
    top: 0px;
    right: 0px;
    width: 0;
    height: 0;
    width:15px;
    height: 15px;
    background: #025ebb;;
    border-radius: 50%;
    /*border-top: 50px solid #025ebb;*/
    /*border-left: 30px solid transparent;*/
  }

  .table-number {
    width: 100%;
    /*font-size: 4vh;*/
    font-size: 34px;
    /*font-weight: bold;*/
    text-align: center;
  }
  .detail {
    text-align: center;
  }
  /*  table   end   */

  /*  area  bagin   */
  .area-wrapper {
    height: 100%;
    background-color: #FFFFFF;
    /*border: 2px solid #F2F2F2;*/
    overflow-y: hidden;
    overflow-x: hidden;
    text-align: center;
    position: absolute;
    right: 0;
    padding-bottom: 60px;
  }
  .area-list{
    height: 350px;
    overflow-y: auto
  }
  .area-item {
    width: 100%;
    /*margin-top: 5px;
    margin-bottom: 10px;*/
    /*height: 40px;*/
    padding: 5px;
    padding-top: 15px;
    padding-bottom: 15px;
    font-size: 18px;
    line-height: 20px;
    white-space: normal;
    position: relative;
    border: none;
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
  .area-wrapper .btn-active{
    color: #333 !important;
    background-color: #eee;
    border-radius: 0 !important;
    border: none;
    border-left: 5px solid #ffbf34 !important;
  }
  .area-wrapper button {
    border:none;
    color: #333;
    font-size: 18px;
    padding: 10px 10px;
  }
  .area-wrapper button:hover {
    border-color: #ffbf34;
    color: #333;
  }
  .pageButton {
    width: 100%;
    position: absolute;
    left: 0;
    bottom: 0;

  }
  /*  area  end   */

  .btn-number{
    width:100%;
    height:50px;
    margin-top: 15px;
    background-color: #f6f6f6;
    font-size:22px;
    font-weight: bold;
  }

  /*  滚动条   begin   */
  #tableInfo{
    overflow-y:scroll;
  }
  #tableInfo::-webkit-scrollbar {/*滚动条整体样式*/
    width: 4px;     /*高宽分别对应横竖滚动条的尺寸*/
    height: 4px;
  }
  #tableInfo::-webkit-scrollbar-thumb {/*滚动条里面小方块*/
    border-radius: 5px;
    -webkit-box-shadow: inset 0 0 5px rgba(0,0,0,0.2);
    background: rgba(0,0,0,0.2);
    /*background: rgba(0,0,0,0.5);*/
  }
  #tableInfo::-webkit-scrollbar-track {/*滚动条里面轨道*/
    -webkit-box-shadow: inset 0 0 5px rgba(0,0,0,0.2);
    border-radius: 0;
    background: rgba(0,0,0,0.1);
  }
  /*  滚动条   end*/

  .pageButtonActive{
    background-color: #ffbf34;
    color: #fff!important;
    border: none!important;
  }

  button:disabled{
    border:1px solid #DDD;
    background-color:#eef1f6;
    color: #bfcbd9;
  }

  .el-badge__content.is-fixed {
    top: 8px;
    right: 15px;
    z-index: 9999;
  }
  .el-badge__content {
    height: 20px;
    line-height: 20px;
  }
  .order-page-wrapper{
    position: absolute;
    top:35%;
    right: 30px;
    z-index: 10;
  }
  .order-page-wrapper-nomal {
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
</style>
