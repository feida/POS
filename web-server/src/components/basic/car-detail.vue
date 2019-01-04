<template>
  <div>
    <div class="detail-wrapper">
      <el-row>
        <el-col :span="8">
          <span style="display: inline-block;">
            <span v-if="orderInfo.data_origin == 1"><i class="iconfont icon-shouji" style="font-size: 28px" ></i><img  style="width: 50px; vertical-align: center;" src="../../assets/hd_vip.png" v-if="customer_status == 1"/></span>
            <i class="iconfont icon-computer3diannao" style="font-size: 28px" v-else></i>
          </span>
        </el-col>
        <el-col :span="8">
          <span style="display: inline-block; width: 68px; height: 36px; line-height: 36px; font-size: 20px; ">
            {{(shopModel == 2 || shopModel == 7) ? orderInfo.ver_code: (orderInfo.table_number||'无')}}
          </span>
        </el-col>
          <button class="detail-button" :class="showDetails == true ? 'details-button-active' : 'details-button' " @click="showDetail()">详情</button>
        <el-col :span="8">
        </el-col>
      </el-row>
    </div>
    <div  v-if="showDetails == true" style="height: 5px; background-color: #eee"></div>
    <div v-if="showDetails == true" style=" padding: 5px 18px; background-color: #FFFFFF">
      <ul style="">
        <li class=" details-item" style="display: inline-block; "  v-if="orderInfo.distribution_mode_id==1">堂吃 {{orderInfo.table_number}}</li>
        <li class=" details-item" style="display: inline-block;" v-else="orderInfo.distribution_mode_id==3">外带 {{orderInfo.table_number}}</li>
        <li class=" details-item" style="display: inline-block;float: right; ">人数:{{orderInfo.customer_count||'无'}}</li>
        <li class=" details-item">交易码:  {{orderInfo.ver_code||"无"}}</li>
        <li class=" details-item" v-for="(name, index) in detailList">{{detailList[index].name}}:{{detailList[index].value}}</li>
      </ul>
    </div>

  </div>
</template>
0
<script>
  import {getCustomerInfo, getMembersState} from '../../api/api'
  import {formatDate} from '../../utils/generalUtil'
  export default {
    name: 'car-detail',
    props:['orderInfo', 'shopModel'],
    data() {
      return {
        showDetails: false,
        customerInfo: {},
        detailList: [],
        customer_status: false
      };
    },
    watch: {
      orderInfo: {
        handler: function (orderInfo) {
          this.getCustomerInfo(orderInfo.customer_id);
          this.getMembersState(orderInfo.customer_id);
        },
        deep: true
      }
    },
    methods: {
      showDetail: function () {
        this.showDetails = !this.showDetails;
        this.getCustomerInfo(this.orderInfo.customer_id);
      },
      getCustomerInfo: function (customerId) {
        let that = this;
        this.detailList = [];
        getCustomerInfo(customerId, function (customerInfo) {
          that.detailList.push(
            {name: "手机号", "value": !!customerInfo?customerInfo.telephone: '无'},
            {name: "交易流水号", "value": that.orderInfo.serial_number || '无'},
            {name: "订单时间", "value": that.formatDate(that.orderInfo.create_time)||'无'},
            {name: "Pos端折扣", "value":'￥' + that.orderInfo.order_pos_discount_money||'0'},
            {name: "Pos抹零", "value":'￥' + that.orderInfo.erase_money ||'0'},
            {name: "订单备注", "value": that.orderInfo.remark||'无'})
        })
      },

      formatDate: function(date) {
        return formatDate(new Date(parseInt(date)), 'yyyy-MM-dd hh:mm:ss');
      },

      getMembersState: function (customerId) {
        console.log('customerId_______________',customerId)
        let that = this;
        if( customerId && customerId.length > 5) {
          getMembersState(customerId, function (customerInfo) {
            if(customerInfo) {
              that.customer_status = customerInfo.CUSTOMER_STATUS
            }
          })
        }
      },
    }
  };
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.detail-wrapper {
  text-align: center;
  height: 54px;
  line-height: 54px;
  background-color: #FFFFFF;
  padding-left: 18px;
  padding-right: 18px;
}
.details-item {
  margin-top: 8px;
  font-size: 14px;
  word-wrap: break-word;
  padding-bottom: 10px;
  color: #666;
}
.detail-button {
  width: 68px;
  height: 36px;
  font-size: 16px;
  border-radius: 5px;
  border: 1px solid #000;
  background-color: #fff;

}
.details-button-active {
  border: none;
  background-color: #ffbf34;
  color: #FFFFFF;
}
</style>
