<template>
  <el-row class="recharge">
    <el-row class="tool-bar">
      <el-col :span="10" class="tool-title">
        <h2>Resto+ 测试店铺</h2>
      </el-col>
      <el-col :span="14" class="tool-content">
        <el-date-picker
          v-model="reportDate"
          align="right"
          type="date"
          placeholder="选择日期"
          :picker-options="pickerOptions">
        </el-date-picker>
        <el-button type="primary" class="tool-search-btn" style=" background-color: #FFBF34; border: none;">查询</el-button>
      </el-col>
    </el-row>
    <el-row class="recharge-data" :style="{ height: rechargeDataHeight + 'px' }">
      <el-table
        :data="rechargeList"
        style="width: 100%">
        <el-table-column
          type="index"
          label="NO."
          width="70">
        </el-table-column>
        <el-table-column
          prop="createTime"
          label="充值时间">
        </el-table-column>
        <el-table-column
          prop="phoneNumber"
          label="充值手机号"
          width="130">
        </el-table-column>
        <el-table-column
          prop="rechargeWays"
          label="充值途径"
          width="100">
        </el-table-column>
        <el-table-column
          prop="rechargeAmount"
          label="充值金额"
          width="100">
        </el-table-column>
        <el-table-column
          prop="giftAmount"
          label="充值赠送金额"
          width="120">
        </el-table-column>
        <el-table-column
          prop="receivedAmount"
          label="到账总金额"
          width="110">
        </el-table-column>
        <el-table-column
          prop="residualAmount"
          label="未到账金额"
          width="110">
        </el-table-column>
      </el-table>
    </el-row>
    <el-row class="preview-bar">
      <el-col :span="6">
        <p class="preview-info">充值总金额：50000</p>
      </el-col>
      <el-col :span="6">
        <p class="preview-info">充值笔数：13</p>
      </el-col>
      <el-col :span="6">
        <p class="preview-info">充值用户数量：5</p>
      </el-col>
      <el-col :span="6" class="recharge-page">
          <i class="iconfont icon-arrow-left page-left" ></i>
          <span >1 / 3</span>
          <i class="iconfont icon-arrow-right page-right"></i>
      </el-col>
    </el-row>
  </el-row>
</template>

<script>
  export default {
    name: 'recharge',
    data () {
      return {
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
        reportDate : '',
        rechargeList: [
          {
            createTime : '2017-08-29 11:13:23',
            phoneNumber: '17671111590',
            rechargeWays: 'Pos',
            rechargeAmount: 3000,
            giftAmount: 500,
            receivedAmount: 2000,
            residualAmount: 1500
          },
          {
            createTime : '2017-08-29 11:13:23',
            phoneNumber: '13627626221',
            rechargeWays: '手机',
            rechargeAmount: 3000,
            giftAmount: 500,
            receivedAmount: 2000,
            residualAmount: 1500
          },
          {
            createTime : '2017-08-29 11:13:23',
            phoneNumber: '17671111590',
            rechargeWays: 'Pos',
            rechargeAmount: 3000,
            giftAmount: 500,
            receivedAmount: 2000,
            residualAmount: 1500
          }
        ],
        rechargeDataHeight : 0
      };
    },
    mounted : function () {
      this.rechargeDataHeight = document.body.clientHeight - 212;
    },
    methods: {

    }
  };
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
  .recharge{
    height: 100%;
    width: 100%;
  }
  .tool-bar{
    height: 60px;
    line-height: 60px;
    font-weight: bold;
    border-bottom: 2px solid #E9E9E9;
  }
  .tool-title{
    padding-left: 20px;
  }
  .tool-search-btn{
    margin-left: 30px;
    background-color: #FFBF34;
  }
  .el-button--primary{
    background-color : #ef5350;
    border-color: #ef5350;
    padding: 10px 30px;
  }
  .recharge-data{
    /*padding: 0px 20px;*/
  }
  .preview-bar{
    /*height: 30px;*/
    /*border: 1px solid red;*/
    border-top: 2px solid #E9E9E9;
  }
  .preview-info{
    height: 50px;
    line-height: 50px;
    font-size: 20px;
    font-weight: bold;
  }
  .recharge-page{
    height: 50px;
    line-height: 50px;
    font-size: 40px;
  }
  .page-left{
    font-size: 40px;
    cursor: pointer;
  }
  .page-right{
    font-size: 40px;
    cursor:pointer;
  }
</style>
