<!--盘点管理-->
<template>
  <div>
    <el-row style="border-bottom: 5px solid #eee;">
      <el-col>
        <el-button class="activeLink" type="primary" @click="showInventoryView">新增盘点单</el-button>
      </el-col>
    </el-row>

    <el-col style="padding: 5px;">
      <el-table
        :data="inventoryList"
        height="550"
        border>
        <el-table-column
          label="盘点单号"
          align="center"
          min-width="70"
          prop="orderCode">
        </el-table-column>
        <el-table-column
          label="盘点单名"
          min-width="70"
          align="center"
          prop="orderName">
        </el-table-column>
        <el-table-column
          label="盘点时间"
          align="center"
          min-width="85"
          prop="publishedTime">
        </el-table-column>
        <el-table-column
          label="操作人"
          align="center"
          min-width="85"
          prop="createrName">
        </el-table-column>
        <el-table-column
          label="审核人"
          min-width="75"
          align="center"
          prop="auditName">
        </el-table-column>
        <el-table-column
          label="种类"
          min-width="75"
          align="center"
          prop="size">
        </el-table-column>
        <el-table-column
          label="状态"
          min-width="75"
          align="center"
          prop="orderStatusShow">
        </el-table-column>
        <el-table-column
          label="操作"
          min-width="80"
          align="center">
          <template slot-scope="scope">
            <el-button type="primary" @click="dialogVisible = true;showScopeRow(scope.row)">查看</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-col>

    <!--查看详情弹窗  -->
    <el-dialog
      title="盘点单"
      style="width: 1700px;margin-left:-340px"
      :visible.sync="dialogVisible">
      <ul class="listconter">
        <li>
          <span>盘点单号:</span>
          <span>{{inventoryNum}}</span>
        </li>
        <li>
          <span>盘点时间:</span>
          <span>{{inventoryTime}}</span>
        </li>
        <li>
          <span>操作人:</span>
          <span>{{inventoryPeople}}</span>
        </li>
        <li>
          <span>原料种类:</span>
          <span>{{inventoryType}}</span>
        </li>
      </ul>
      <el-table
        :data="scopeRowList"
        height="300"
        border>
        <el-table-column
          label="类型"
          align="center"
          prop="materialType"
          min-width="75">
        </el-table-column>
        <el-table-column
          label="一级类别"
          align="center"
          prop="categoryOneName"
          min-width="75">
        </el-table-column>
        <el-table-column
          label="二级类别"
          align="center"
          prop="categoryTwoName"
          min-width="85">
        </el-table-column>
        <el-table-column
          label="品牌名"
          align="center"
          prop="materialId"
          min-width="85">
        </el-table-column>
        <el-table-column
          label="材料名"
          align="center"
          min-width="85"
          prop="materialName">
        </el-table-column>
        <el-table-column
          label="规格"
          align="center"
          prop="specifications"
          min-width="90">
        </el-table-column>
        <el-table-column
          label="产地"
          align="center"
          prop="cityName"
          min-width="70">
        </el-table-column>
        <el-table-column
          label="理论库存"
          align="center"
          prop="theoryStockCount"
          min-width="75">
        </el-table-column>
        <el-table-column
          label="盘点数量"
          align="center"
          prop="actStockCount"
          min-width="75">
        </el-table-column>
        <el-table-column
          label="盘盈盘亏"
          align="center"
          prop="reduceCount"
          min-width="75">
        </el-table-column>
      </el-table>

      <span slot="footer" class="dialog-footer">
        <el-button @click="dialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="dialogVisible = false">确 定</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
  import { inventorydata } from 'api/urlConfig'
  import jquery from 'jquery';

  export default {
    name: 'inventory',
    data() {
      return {
        shopId:'',
        inventoryList:[],
        scopeRowList:[],
        dialogVisible:false,
        inventoryNum:"",
        inventoryTime:"",
        inventoryPeople:"",
        inventoryType:"",
        inventoryCount:""
      };
    },
    mounted() {

    },
    created() {
      let that = this;
      this.getShopDetails();
      this.$axios({
        method:"get",
        url:inventorydata+'?shopId='+that.shopId,
        responseType:'json',
      }).then(function(response){
        that.inventoryList=response.data.data;
        that.inventoryList.forEach(function (date) {
          date.publishedTime = new Date(date.publishedTime).format("yyyy-MM-dd hh:mm");
          date.stockCountDetailList.forEach(function (type) {
            type.specifications = type.measureUnit+type.unitName+"/"+type.specName;
            if(type.materialType == "INGREDIENTS"){
              type.materialType = "主料";
            }else if(type.materialType == "ACCESSORIES"){
              type.materialType = "辅料";
            }else if(type.materialType == "SEASONING"){
              type.materialType = "配料";
            }else{
              type.materialType = "物料";
            }
          })
        })
      })
    },
    methods: {
      getShopDetails() {
        let that=this;
        let shopDetail =  sessionStorage.getItem("shopDet");
        let shopDetailId= jquery.parseJSON(shopDetail);
        that.shopId=shopDetailId.id;
      },
      showInventoryView(){
        this.$router.push({ path: '/material/inventoryView'});
      },
      showScopeRow(row){
        this.inventoryNum=row.orderCode;
        this.inventoryPeople=row.createrName;
        this.inventoryTime=row.publishedTime;
        this.inventoryType=row.size;
        this.scopeRowList=row.stockCountDetailList;
        this.scopeRowList.forEach(function (obj) {
          obj.reduceCount = obj.theoryStockCount - obj.actStockCount;
        })
      }
    }
  }
</script>

<style scoped>
  .activeLink{
    width: 120px;
    height: 50px;
    display: inline-block;
    text-align: center;
    font-size: 16px;
    margin: 10px;
    border: 1px solid #ccc;
    border-radius: 5px;
    color: #fff;
    background-color: #5babe6;
  }
  .text-padding {
    margin-bottom: 10px;
  }
  .listconter{
    font-size: 16px;
    width: 80%;
    margin: auto;
  }
  .listconter li{
    width: 50%;
    float: left;
    margin-bottom: 10px;
  }
</style>
