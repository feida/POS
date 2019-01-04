<template>
  <el-row style="height: 100%;">
    <!--  左侧订单详情   -->
    <el-col :span="3" class="left-wrapper" >
      <ul>
        <template v-for="(item,index) in tablist">
          <router-link tag="li" type="button" :to="item.urls" class="matl-btn"  :class="{'active': index === isActive}" @click.native ="tmarkActive(index)">
            {{item.name}}
          </router-link>
        </template>
      </ul>
    </el-col>
    <!--  主内容   -->
    <el-col :span="21" class="right-wrapper">
      <router-view></router-view>
    </el-col>
  </el-row>
</template>

<script>

  import jquery from 'jquery';
  export default {
    name: 'material',
    data() {
      return {
        index:'',
        isActive: 0,
        tablist:[
          {name:'原料库存',urls: '/material/rawmaterial'},
          {name:'采购管理',urls: '/material/purchase'},
          {name:'入库管理',urls: '/material/storage'},
          {name:'盘点管理',urls: '/material/inventory'}
          ]
      };
    },
    mounted() {

    },
    created() {

    },
    methods: {
      tmarkActive(index){
        this.isActive=index;
      }
    }
  }
</script>

<style scoped>
  .left-wrapper{
    height: 100%;
    position: relative;
    background-color: #FFFFFF;
    border-right: 5px solid #eee;
    box-sizing: border-box;
  }
  .right-wrapper {
    height: 100%;
    position: relative;
  }
  .matl-btn{
    width: 80%;
    height: 60px;
    border:1px solid #5babe6 ;
    margin:20px auto;
    font-size: 18px;
    text-align: center;
    line-height: 60px;
    border-radius: 5px;
    color: #5babe6;
  }
  .matl-btn:hover{
    cursor: pointer;
  }
  .active {
    color: #fff;
    background-color: #5babe6;
  }

</style>
