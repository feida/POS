<template>
  <el-row class="not-print-order">
    <el-form-item label="订单：">
      <el-button type="text" @click="_exceptionOrderList">获取服务器待下单列表</el-button>
    </el-form-item>
    <el-dialog :title="'检测到服务器有  【' + notPrintOrderNumber + '】  条未打印订单'" size="large" :visible.sync="dialogVisible">
      <el-table :data="orderList" :border="true" height="300" v-loading.body="loading" v-if="orderList.length > 0">
        <el-table-column label="类别">
          <template slot-scope="scope">
            <el-tag v-if="!scope.row.parentOrderId" type="primary">主订单</el-tag>
            <el-tag v-else>加菜</el-tag>
          </template>
        </el-table-column>
        <el-table-column v-if="shopDet.shop_mode == 2 || shopDet.shop_mode == 7" property="ver_code" label="取餐码" width="100"></el-table-column>
        <el-table-column v-else property="tableNumber" label="桌号" width="80"></el-table-column>
        <el-table-column property="customer.telephone" label="手机号" width="130"></el-table-column>
        <el-table-column label="菜品总数">
          <template slot-scope="scope">
            {{ scope.row.countWithChild || scope.row.articleCount }}
          </template>
        </el-table-column>
        <el-table-column label="订单金额">
          <template slot-scope="scope">
            ￥ {{ scope.row.amountWithChildren || scope.row.orderMoney }}
          </template>
        </el-table-column>
        <el-table-column label="下单时间" width="180">
          <template slot-scope="scope">
            {{ formatTime(scope.row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120">
          <template slot-scope="scope">
            <el-button type="success" v-if="scope.row.productionStatus == 1" style="width: 100%" @click="prePrintOrder(scope.row)" :loading="scope.row.isPrinting">{{ scope.row.isPrinting ? "打印中" : "打印" }}</el-button>
            <el-button v-if="scope.row.productionStatus == 2" style="width: 100%">已打印</el-button>
          </template>
        </el-table-column>
      </el-table>
      <span slot="footer" class="dialog-footer">
        <el-button @click="dialogVisible = false" v-if="notPrintOrderNumber > 0">暂不处理</el-button>
        <el-button type="primary" @click="printAll">{{printAllBtn}}</el-button>
      </span>
    </el-dialog>
  </el-row>
</template>

<script>

  import {getOrderDetail, getNotPrintOrderList, printTotal, printKitchenTotal, printOrder, updateOrderSyncState,
    getInsertByOrderId, getBatchInsertOrderItem, getBatchInsertPayment, insertSelectiveByCustomerId, insertSelectiveByCustomerAddressId,
    deleteOrderRelationInfo} from 'api/api';

  export default {
    name: 'server-not-print-order',
    props:[
      'refresh'
    ],
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
    watch:{
      orderList: function (orderList) {
        if(orderList && orderList.length > 0){
          this.dialogVisible = true;
          this.loading = false;
        }else {
          this.dialogVisible = false;
        }
      }
    },
    created() {
      this.shopDet = JSON.parse(sessionStorage.getItem("shopDet"));
      //  todo  暂时放在这里，下面有个格式话时间方法需要使用，以后移除； lmx 2018年4月17日 14:38:59
      Date.prototype.format = function (fmt) {
        var o = {
          "M+": this.getMonth() + 1,                   // 月份
          "d+": this.getDate(),                        // 日
          "h+": this.getHours(),                       // 小时
          "m+": this.getMinutes(),                     // 分
          "s+": this.getSeconds(),                     // 秒
          "q+": Math.floor((this.getMonth() + 3) / 3), //季度
          "S": this.getMilliseconds()                  //毫秒
        };
        if (/(y+)/.test(fmt)) {
          fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
        }
        for (var k in o) {
          if (new RegExp("(" + k + ")").test(fmt)) {
            fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
          }
        }
        return fmt;
      }
    },
    methods: {
      _exceptionOrderList: function () {
        let that = this;
        this.orderList = [];
        this.loading = true;
        this.$socket.exceptionOrderList(function (data) {
          if(data == "[]"){
            that.$message("暂无待下单状态的订单！");
            return;
          }
          let orderList = JSON.parse(data);
          for(let order of orderList){
            let temp = JSON.parse(order);
            temp.isPrinting = false;
            console.log(temp);
            that.orderList.push(temp);
          }
          that.notPrintOrderNumber = orderList.length;
          that.printAllBtn = "打印全部 (" + that.notPrintOrderNumber + ")";
        })
      },
      printAll: function () {
        for (let order of this.orderList){
          //  只打印  未打印过的订单
          if(order.productionStatus == 1){
            this.prePrintOrder(order);
          }
        }
        this.dialogVisible = false
      },
      prePrintOrder: function (order) {
        console.log(order.id);
        let that = this;
        let orderId = order.id;
        order.isPrinting = true;
        //  先删除，再重新插入
        deleteOrderRelationInfo(orderId, function () {
          that.insertOrder(order);
        });
        // getOrderDetail(orderId, function (orderInfo) {
        //   //  本地存在此订单
        //   if(orderInfo && orderInfo.id){
        //     that._printOrder(order);
        //   }else{  //  本地不存在此订单
        //     that.insertOrder(order);
        //   }
        // });
      },
      insertOrder: function (order) {
        let that = this;
        let orderItem = this.orderModel(order);
        getInsertByOrderId(orderItem, ()=>{ //  插入 tb_order 表
          //  如果有菜品项目或者加菜，调用此方法
          if(order.orderItem) {
            getBatchInsertOrderItem(order.orderItem, function () {
              //  如果有支付项信息 插入支付项
              if(order.orderPayment) {
                getBatchInsertPayment(order.orderPayment, function () {
                  that._printOrder(order);
                });
              }else{
                that._printOrder(order);
              }
            });
          }
          //  插入微信用户
          if(order.customer) {
            var customerInfo = this.customerModel(order.customer);
            insertSelectiveByCustomerId(customerInfo,function () {
            });
          }

          //  插入微信用户地址详情
          if(order.customerAddress) {
            var customerAdd = customerAddressModel(order.customerAddress)
            insertSelectiveByCustomerAddressId(customerAdd,function () {
            });
          }
        });
      },
      orderModel: function (entity) {
        return {
          id: entity.id,
          table_number: entity.tableNumber,
          customer_count: entity.customerCount,
          accounting_time: new Date(entity.accountingTime).format("yyyy-MM-dd"),
          order_state: entity.orderState,
          production_status: entity.productionStatus,
          original_amount: entity.originalAmount,
          order_money: entity.orderMoney,
          article_count: entity.articleCount,
          serial_number: entity.serialNumber,
          allow_cancel: entity.allowCancel,
          closed: entity.closed,
          create_time: this.formatServerTime(entity.createTime),
          print_order_time: this.formatServerTime(entity.printOrderTime),
          remark: entity.remark,
          distribution_mode_id: entity.distributionModeId,
          amount_with_children: entity.amountWithChildren,
          payment_amount: entity.paymentAmount,
          parent_order_id: entity.parentOrderId,
          service_price: entity.servicePrice,
          shop_detail_id: entity.shopDetailId,
          pay_type: entity.payType,
          customer_id: entity.customerId,
          allow_continue_order: entity.allowContinueOrder,
          customer_address_id: entity.customerAddressId,
          pay_mode: entity.payMode,
          ver_code: entity.verCode,
          meal_fee_price: entity.mealFeePrice / entity.mealAllNumber,
          meal_all_number: entity.mealAllNumber,
          data_origin: 1, //  默认数据源为服务器
          sync_state: 1, //  默认为 已同步
          last_sync_time: new Date().getTime(),
        };
      },
      customerModel: function (entity) {
        return {
          id: entity.id,
          wechat_id: entity.wechatId,
          nickname: entity.nickname,
          telephone: entity.telephone,
          sex: entity.sex
        }
      },
      formatServerTime: function (str) {
        str = str.toString();
        if(str.indexOf(".") != -1){
          return str.substring(0,str.lastIndexOf("."));
        }else {
          return str;
        }
      },
      _printOrder: function (order) {
        console.log("打印订单：" + order.id);
        let orderId = order.id;
        console.log(this.shopDet);
        if (this.shopDet.auto_print_total == 0) {
          if(this.shopDet.shop_mode  == 6 && this.shopDet.allow_after_pay == 0){
            printTotal(orderId,1, 2, function () {
              console.log("\n\n总单打印成功\n\n");
            });
          }else {
            printTotal(orderId,1, 1, function () {
              console.log("\n\n总单打印成功\n\n");
            });
          }
        }
        printKitchenTotal(orderId,1, null, null, null, function () {
          console.log("\n\n厨打打印成功\n\n");
        });
        this.syncServerPrintState(order);
      },
      syncServerPrintState: function (order) {
        let that = this;
        let orderId = order.id;
        printOrder(orderId, function () {
          that.$socket.printSuccess(orderId, function () {
            updateOrderSyncState(orderId);
            order.productionStatus = 2;
            --that.notPrintOrderNumber;
            that.printAllBtn = "打印剩余 (" + that.notPrintOrderNumber + ")";
            if(that.notPrintOrderNumber == 0){
              that.printAllBtn = "关  闭";
            }
            that.printSuccessNotify(order);
          });
        });
      },
      printSuccessNotify: function (order) {
        let msgType = (this.shopDet.shop_mode == 2 || this.shopDet.shop_mode == 7) ? "取餐码" : "桌位";
        this.$notify({
          title: 'Resto+',
          message: `【${msgType}】${order.tableNumber}，打印成功！`,
          type: 'success'
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
