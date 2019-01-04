<template>
  <el-row>
    <el-col :span="14" class="order-state">
      <el-badge :value="0" class="item">
        <el-button size="large">全部</el-button>
      </el-badge>
      <el-badge :value="0" class="item">
        <el-button size="large">已支付</el-button>
      </el-badge>
      <el-badge :value="0" class="item">
        <el-button size="large">待下单</el-button>
      </el-badge>
      <el-badge :value="6" class="item">
        <el-button size="large">未支付</el-button>
      </el-badge>
    </el-col>
    <el-col :span="10" class="order-mode">
      <el-button size="large">外带</el-button>
      <el-button size="large">外卖</el-button>
      <el-button size="large">堂食</el-button>
    </el-col>
  </el-row>
</template>

<script>
  export default {
    name: 'order-toolbar',
    data () {
      return {};
    },
    methods: {}
  };
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
  .order-state{

  }
  .el-row{
    height: 50px;
    border-bottom: 1px solid #d1dbe5;
    box-shadow: 0 2px 4px 0 rgba(0,0,0,.12),0 0 6px 0 rgba(0,0,0,.04);
  }
  .order-mode{
    text-align: right;
  }
  .el-button--large{
    padding: 16px 19px;
    border-radius: 0px;
  }
  .el-badge__content{
    z-index: 10;
    background-color: #13CE66;
  }
</style>
