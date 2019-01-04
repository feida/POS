<template>
  <!-- 外带模式 -->
  <div class="table-wrapper">
    <div class="table-item" :style="{width: (clientWidth - 63 ) / 5  + 'px'}" :class="cardActiveClass(table)"
         v-for="(table, index) in tableAndOrderList" :key="index"  @click="choseTable(table)">
      <div :class="tableCardClass(table)" v-if="table.id"></div>
      <p class="table-number">{{table.table_number || '未知'}}</p>
      <div class="detail" v-if="table.id">
        <p><strong>{{table.order_customer_count || '-'}} / {{table.customer_count}}</strong> </p>
        <p v-if="table.production_status == 0">待下单</p>
        <!--<p v-else>¥{{ formatMoney(table.totalAmount || 0) }}</p>-->
        <p>{{getTimeDiff(table.create_time)}}</p>
      </div>
      <div class="detail" v-else>
        <h1 style="margin-top: 21px;">空</h1>
      </div>
    </div>
  </div>
</template>

<script>
  import {mapGetters} from 'vuex'
  export default {
    name: "package-item",
    props: ['tableAndOrderList'],
    data() {
      return {
        clientWidth: 0,
        currentTable: {},
        shopModel: 6
      };
    },
    created() {
      this.shopDet = JSON.parse(sessionStorage.getItem("shopDet"));
      this.shopModel = this.shopDet.shop_mode;
    },
    mounted() {
      this.clientWidth = document.getElementById("tableInfo").clientWidth;
    },
    watch: {
      tableAndOrderList: function (params) {
        this.autoChoseTable()
      },
      currentTable: function(newValue, oldValue) {
        this.$emit('update:currentTable', newValue)
      }
    },
    beforeDestroy() {
    },
    methods: {
      formatMoney(money){
        return this.$utils.formatMoney(money);
      },
      choseTable (table) {
        this.currentTable = table;
        let orderType = this.$route.query.orderType;
       if(table.id){
          this.$router.push(`/table/packaging/detail/${table.id}?tableNumber=${table.table_number}&orderType=${orderType}`);
        }else{
          this.$router.push(`/table/packaging/console/${table.table_number}?orderType=${orderType}`);
        }
      },
      cardActiveClass (table){
        if(table.id){
          return {'table-card-active' : (this.currentTable.id + (this.currentTable.id ? this.currentTable.id : "")) == (table.id + table.id)};
        }else{
          return {'table-card-active' : this.currentTable.id == table.id};
        }
      },
      tableCardClass (table){
        var cardClass = [];
        if(table.id){
          if(table.production_status === 0){  //  待下单
            cardClass.push("table-card-wait-order");
          }else if(table.order_state === 1 && (table.pay_mode === 3 || table.pay_mode === 4)){ //  付款中
            cardClass.push("table-card-paying");
          }else if(table.order_state === 1){  //  未支付
            cardClass.push("table-card-no-pay");
          }else{  //  已支付
            cardClass.push("table-card-pay-order");
          }
        }
        return cardClass;
      },

      autoChoseTable(){  // 自动定位桌号
        var tableNumber = this.$route.params.tableNumber;
        var orderId = this.$route.params.orderId;

        if(tableNumber){
          var tables = this.tableAndOrderList.map(item=>item).filter(item => item.table_number == tableNumber)
          if(tables && tables.length > 0) {
            this.choseTable(tables[0]);
          } else {
            this.choseTable(this.tableAndOrderList[0]);
          }
        }else if(orderId && orderId!='undefined'){
          //  路由参数中添加 tableNumber 查询参数，在这里直接定位到桌位，然后自动选择。
          var _num = this.$route.query.tableNumber;
          if(_num && _num != "undefined"){
            var tables = this.tableAndOrderList.map(item=>item).filter(item => item.table_number == _num)
            if(tables && tables.length > 0) {
              this.choseTable(tables[0]);
            } else {
              this.choseTable(this.tableAndOrderList[0])
            }
          }else{

            this.$router.push("/table/packaging/detail/" + orderId + '?orderType=all');
          }
        }else{
          if(this.tableAndOrderList && this.tableAndOrderList.length > 0){
            this.choseTable(this.tableAndOrderList[0]);
          }else{
            this.$router.push("/table/packaging?orderType=all");
          }
        }
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
    }
  }
</script>

<style scoped>
  .table-wrapper {
    display: flex;
    justify-content: start;
    flex-wrap: wrap
  }
  .table-item {
    background-color: #FFFFFF;
    margin-left: 10px;
    margin-top: 5px;
    text-align: center;
    position: relative;
    height: 17vh;
    /*width: 88px;*/
    /*margin-bottom: 5px;*/
    /*margin-top: 5px;*/
    cursor: pointer;
  }

  .table-number {
    width: 100%;
    /*font-size: 4vh;*/
    font-size: 34px;
    /*font-weight: bold;*/
    text-align: center;
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
  .detail {
    text-align: center;
  }
</style>
