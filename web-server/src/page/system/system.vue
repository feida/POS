<template>
  <el-row class="system">
    <el-row :gutter="20">
      <el-col :span="12">
        <el-card class="box-card">
          <div slot="header" class="clearfix">
            <h2>系统设置</h2>
          </div>
          <el-form label-width="120px">
            <!--<el-form-item label="重新激活：">-->
              <!--<el-button type="text" @click="cleanActivationKey">激活页面</el-button>-->
            <!--</el-form-item>-->

            <!--  服务器端 未打印状态订单  -->
            <server-not-print-order></server-not-print-order>
            <kitchen></kitchen>
          </el-form>
        </el-card>
      </el-col>
      <el-col :span="12"><div class="grid-content bg-purple"></div></el-col>
    </el-row>
  </el-row>
</template>

<script>
  import {
    cleanActivationKey
  } from 'api/api';

  import serverNotPrintOrder from '../table/component/server-not-print-order';
  import kitchen from './kitchen'

  export default {
    name: 'system',
    components:{  serverNotPrintOrder, kitchen },
    data () {
      return {
      };
    },
    created(){

    },
    mounted(){
    },
    methods:{
      cleanActivationKey: function(){
        cleanActivationKey(function(){
          console.log("成功");
        })
      }
    }
  };
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
</style>
