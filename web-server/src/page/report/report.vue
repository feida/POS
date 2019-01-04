<template>
  <el-row class="report">
    <el-col :span="21" class="report-view">
      <router-view></router-view>
    </el-col>
    <el-col :span="3" class="report-menu">
      <ul class="menu-wrapper">
        <router-link tag="li" to="/report/business" class="menu-item">
          营业数据
        </router-link>
        <router-link tag="li" to="/report/sales" class="menu-item">
          菜品销量
        </router-link>
        <!--<router-link tag="li" to="/report/recharge" class="menu-item">-->
          <!--充值数据-->
        <!--</router-link>-->
        <!--<router-link tag="li" to="/report/satisfaction" class="menu-item">-->
          <!--客户满意度-->
        <!--</router-link>-->
        <!--<li class="menu-item" @click="coming">-->
          <!--菜品销量-->
        <!--</li>-->
        <!--<li class="menu-item" @click="coming">-->
          <!--充值数据-->
        <!--</li>-->
        <!--<li class="menu-item" @click="coming">-->
          <!--客户满意度-->
        <!--</li>-->
      </ul>
    </el-col>
  </el-row>
</template>

<script>
  export default {
    name: 'report',
    data () {
      return {};
    },
    methods: {
      coming: function () {
        this.$message({
          message: "暂未开放~",
          duration: 1000,
          showClose: true
        });
      }
    }
  };
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
  .report{
    height: 100%;
    width: 100%;
  }
  .report-view{
    height: 100%;
  }
  .report-menu{
    height: 100%;
    border-left: 2px solid #EAEAEA;
  }
  .menu-wrapper{
    height: 100%;
    text-align: center;
    color: #666;
    font-size: 20px;
    font-weight: bold;
  }
  .menu-item{
    line-height: 55px;
    height: 55px;
    border-bottom: 2px solid #E9E9E9;
    cursor: pointer;
  }
  .item-selected{
    background-color: #eee;
    color: #333;
    border-left: 2px solid #FFBF34;
  }
  .router-link-active{
    background-color: #eee;
    color: #333;
    border-left: 5px solid #FFBF34;
  }
</style>
