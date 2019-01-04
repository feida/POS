<template>
  <el-row class="not-print-order" v-if="dialogVisible">
    <el-dialog :title="'检测到本地有  【' + notPrintOrderNumber + '】  条未打印订单'" size="large" :visible.sync="dialogVisible">
      <el-table :data="orderList" :border="true" height="300" v-loading.body="loading" v-if="orderList.length > 0">
        <el-table-column label="类别">
          <template slot-scope="scope">
            <el-tag v-if="!scope.row.parent_order_id" type="primary">主订单</el-tag>
            <el-tag v-else>加菜</el-tag>
          </template>
        </el-table-column>
        <el-table-column v-if="shopDet.shop_mode == 2 || shopDet.shop_mode == 7" property="ver_code" label="取餐码" width="100"></el-table-column>
        <el-table-column v-else property="table_number" label="桌号" width="100"></el-table-column>
        <el-table-column property="telephone" label="手机号" width="130"></el-table-column>
        <el-table-column label="菜品总数">
          <template slot-scope="scope">
            {{ scope.row.count_with_child || scope.row.article_count }}
          </template>
        </el-table-column>
        <el-table-column label="订单金额">
          <template slot-scope="scope">
            ￥ {{ scope.row.amount_with_children || scope.row.order_money }}
          </template>
        </el-table-column>
        <el-table-column label="下单时间" width="200">
          <template slot-scope="scope">
            {{ formatTime(scope.row.create_time) }}
          </template>
        </el-table-column>
        <el-table-column label="操作">
          <template slot-scope="scope">
            <el-button type="success" v-if="scope.row.production_status == 1" style="width: 100%" @click="_printOrder(scope.row)">打印</el-button>
            <el-button v-if="scope.row.production_status == 2" style="width: 100%">已打印</el-button>
          </template>
        </el-table-column>
      </el-table>
      <span slot="footer" class="dialog-footer">
        <el-button @click="fixAllOrder" style="float: left">修正全部订单，且不打印</el-button>
        <el-button @click="dialogVisible = false">暂不处理</el-button>
        <el-button type="primary" @click="printAll">{{printAllBtn}}</el-button>
      </span>
    </el-dialog>
  </el-row>
</template>

<script>

  import {getNotPrintOrderList, printTotal, printKitchenTotal, printOrder, updateOrderSyncState, fixAllOrder} from 'api/api';

  export default {
    name: 'local-not-print-order',
    data() {
      return {
        loading: true,
        dialogVisible: false,
        shopDet: {},
        printAllBtn:"打印全部",
        notPrintOrderNumber: 0,
        orderList: []
      };
    },
    created() {
      this.shopDet = JSON.parse(sessionStorage.getItem("shopDet"));
      // if(this.$route.query.notPrintOrder){
      //   this._getNotPrintOrderList();
      // }
    },
    methods: {
      _getNotPrintOrderList: function () {
        getNotPrintOrderList((orderList) => {
          if(orderList && orderList.length > 0){
            this.dialogVisible = true;
            this.orderList = orderList;
            this.notPrintOrderNumber = orderList.length;
            this.printAllBtn = "打印全部 (" + this.notPrintOrderNumber + ")";
            this.loading = false;
          }
        })
      },
      printAll: function () {
        for (let order of this.orderList){
          //  只打印  未打印过的订单
          if(order.production_status == 1){
            this._printOrder(order);
          }
        }
        this.dialogVisible = false
      },
      _printOrder: function (order) {
        console.log(order.id);
        let orderId = order.id;
        if (this.shopDet.auto_print_total == 0) {
          if(this.shopDet.shop_mode  == 6 && this.shopDet.allow_after_pay == 0){
            printTotal(orderId, 2);
          }else {
            printTotal(orderId, 1);
          }
        }
        printKitchenTotal(orderId);
        this.syncServerPrintState(order);
      },
      syncServerPrintState: function (order) {
        let that = this;
        let orderId = order.id;
        printOrder(orderId, function () {
          that.$socket.printSuccess(orderId, function () {
            updateOrderSyncState(orderId);
            order.production_status = 2;
            --that.notPrintOrderNumber;
            that.printAllBtn = "打印剩余 (" + that.notPrintOrderNumber + ")";
            if(that.notPrintOrderNumber == 0){
              that.printAllBtn = "关  闭";
            }
          });
        });
      },
      fixAllOrder: function () {
        fixAllOrder(this.orderList, ()=>{
          this.dialogVisible = false;
          this.$message("修复成功~");
        });
      },
      formatTime: function (time) {
        return this.$utils.format("yyyy-MM-dd hh:mm:ss", time);
      },
    }
  };
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
  .not-print-order {

  }
  .dialog-footer{

  }
</style>
