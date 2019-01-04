<!--原料库存-->
<template>
    <el-table
      :data="filterDataList"
      style="width: 100%"
      height="550">
      <el-table-column
        label="一级类别"
        prop="categoryOneName"
        align="center">
      </el-table-column>
      <el-table-column
        label="二级类别"
        prop="categoryTwoName"
        align="center">
      </el-table-column>
      <el-table-column
        label="品牌名"
        prop="categoryThirdName"
        align="center">
      </el-table-column>
      <el-table-column
        label="材料名"
        prop="materialName"
        align="center">
      </el-table-column>
      <el-table-column
        label="规格"
        prop="specifications"
        align="center">
      </el-table-column>
      <el-table-column
        label="产地"
        prop="cityName"
        align="center">
      </el-table-column>
      <el-table-column
        label="当前库存"
        prop="actStockCount"
        align="center">
      </el-table-column>
      <!--<el-table-column-->
        <!--label="预警库存"-->
        <!--prop="alertStockCount"-->
        <!--align="center">-->
      <!--</el-table-column>-->
    </el-table>
</template>

<script>
  import { rawmaterialdata } from 'api/urlConfig'
  import bus from "../../../utils/bus"
  import jquery from 'jquery';

  export default {
    name: 'rawmaterial',
    data() {
      return {
        aboutData:[],
        shopId:"",
        shopDetailshopid:{},
        brandip:"",
        searchText:""
      };
    },
    created(){
      let shopDetailshopid= jquery.parseJSON(sessionStorage.getItem("shopDet"));
      this.shopId=shopDetailshopid.id;
      this.brandip=shopDetailshopid.brand_id;
      console.log("shopId",this.shopId);
      this.getList();
    },
    mounted(){
      let that = this;
      bus.$on('searchKey',function (searchKey) {
        that.searchText = searchKey.toLowerCase();
        console.log("------搜索的内容为",that.searchText);
      })
    },
    computed:{
      filterDataList:function(){
        let searchKey = this.searchText;
        if(searchKey != null){
          return this.aboutData.filter(function(product) {
            return Object.keys(product.initials).some(function() {
              return String(product.initials).indexOf(searchKey) >  -1;
            })
          })
        }
      }
    },
    methods: {
      getList(){
        let that=this;
        this.$axios({
          method:"get",
          url:rawmaterialdata+'?shopId='+that.shopId,
          responseType:'json',
        }).then(function(response){
          that.aboutData = response.data.data;
          that.aboutData.forEach(function(temp){
            temp.specifications = temp.measureUnit+temp.unitName+"/"+temp.specName;
            temp.cityName = temp.provinceName+temp.cityName+temp.districtName;
          })
        });
      },
    }
  }

</script>
<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
  .topNav{
    width: 100%;
    height: 90px;
    float: right;
    background-color: #fff;
    border-bottom: 5px solid #eee;
  }
  .boxView{
    width: 100%;
    height: 100%;
    /*margin-top: 95px;*/
    background-color: #fff;
  }
  nav {
    width: 99%;
    margin:0 auto;
    height:100%;
  }
  .rmat-btn{
    display: inline-block;
    width: 80px;
    height: 45px;
    text-align: center;
    background-color: #fff;
    font-size: 16px;
    color: #000;
    line-height: 45px;
    border: 1px solid #ccc;
    margin-left: 10px;
    border-radius: 5px;
    margin-top: 23px;
  }
  .rmat-btn:hover{
    cursor: pointer;
  }
  .active{
    display: inline-block;
    width: 80px;
    height: 45px;
    text-align: center;
    background-color: #fff;
    font-size: 16px;
    color: #000;
    line-height: 45px;
    border: 1px solid #ccc;
    margin-left: 10px;
    border-radius: 5px;
    margin-top: 23px;
    color: #fff;
    background-color: #5babe6;
  }
</style>
