<!--盘点管理-->
<template>
  <div>
    <el-row style="border-bottom: 5px solid #eee;">
      <el-col>
        <el-button class="activeLink" type="primary" @click="showStorageView">新增入库单</el-button>
      </el-col>
    </el-row>

    <el-col style="padding: 5px;">
      <el-table
        :data="storageList"
        height="550"
        border>
        <el-table-column
          label="入库单号"
          align="center"
          min-width="70"
          prop="orderCode">
        </el-table-column>
        <el-table-column
          label="入库单名"
          min-width="70"
          align="center"
          prop="orderName">
        </el-table-column>
        <el-table-column
          label="入库时间"
          align="center"
          min-width="85"
          prop="gmtCreate">
        </el-table-column>
        <el-table-column
          label="操作人"
          align="center"
          min-width="85"
          prop="createrName">
        </el-table-column>
        <el-table-column
          label="审核人"
          align="center"
          min-width="85"
          prop="auditName">
        </el-table-column>
        <el-table-column
          label="供应商名称"
          min-width="75"
          align="center"
          prop="supName">
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

    <el-dialog
      title="新增入库单"
      :visible.sync="centerDialogVisible"
      width="30%"
      center>
      <el-col style="margin-bottom: 15px;">
        <span class="text-title">供应商名称<i style="color:red">*</i></span>
        <el-select v-model="offerObj.supName" placeholder="请选择供应商" @change="changeSupplier">
          <el-option
            v-for="item in formRowOne"
            :key="item.supName"
            :value="item.supName">
          </el-option>
        </el-select>
      </el-col>
      <el-col style="margin-bottom: 15px;">
        <span class="text-title">采购单<i style="color:red">*</i></span>
        <el-select v-model="offerObj.pmsOrderName" placeholder="请选择采购单" @change="changePrice">
          <el-option
            v-for="item in nowSupplierList"
            :key="item.pmsOrderName"
            :label="item.pmsOrderName"
            :value="item.pmsOrderName">
          </el-option>
        </el-select>
      </el-col>
      <el-col style="margin-bottom: 15px;">
        <span class="text-title">联系人<i style="color:red">*</i></span>
        <el-select v-model="offerObj.topContact" placeholder="请选择联系人">
          <el-option
            v-for="item in nowSupplierList"
            :key="item.topContact"
            :label="item.topContact"
            :value="item.topContact">
          </el-option>
        </el-select>
      </el-col>
      <el-col style="margin-bottom: 15px;">
        <span class="text-title">入库单名称<i style="color:red">*</i></span>
        <el-input v-model="offerObj.orderName" placeholder="请输入入库单名称" style="width: 50%;"></el-input>
      </el-col>
      <el-col style="margin-bottom: 15px;">
        <span class="text-title">操作人</span>
        <el-input placeholder="请输入内容" v-model="offerObj.createrName" style="width: 50%;"></el-input>
      </el-col>
      <div slot="footer" class="dialog-footer">
        <el-button @click="backToPurchase">取消</el-button>
        <el-button type="primary" @click="choiceArticle">选择原料</el-button>
      </div>
    </el-dialog>

    <!--查看详情弹窗  -->
    <el-dialog
      title="入库单"
      style="width: 1700px;margin-left:-340px"
      :visible.sync="dialogVisible">
      <ul class="listContent">
        <li>
          <span>入库单号:</span>
          <span>{{storageNum}}</span>
        </li>
        <li>
          <span>入库时间:</span>
          <span>{{storageTime}}</span>
        </li>
        <li>
          <span>供应商:</span>
          <span>{{storageSupply}}</span>
        </li>
        <li>
          <span>物料种类:</span>
          <span>{{storageType}}</span>
        </li>
        <li>
          <span>联系人:</span>
          <span>{{storagePeople}}</span>
        </li>
      </ul>
      <el-table
        :data="scopeRowList"
        height="300"
        border>
        <el-table-column
          label="类型"
          prop="materialType"
          align="center"
          width="75">
        </el-table-column>
        <el-table-column
          label="一级类别"
          prop="categoryOneName"
          align="center"
          width="75">
        </el-table-column>
        <el-table-column
          label="二级类别"
          prop="categoryTwoName"
          align="center"
          width="75">
        </el-table-column>
        <el-table-column
          label="品牌名"
          prop="categoryThirdName"
          align="center"
          width="75">
        </el-table-column>
        <el-table-column
          label="材料名"
          prop="materialName"
          align="center"
          width="75">
        </el-table-column>
        <el-table-column
          label="规格"
          prop="specifications"
          align="center"
          width="70">
        </el-table-column>
        <el-table-column
          label="产地"
          prop="cityName"
          align="center"
          min-width="100">
        </el-table-column>
        <el-table-column
          label="采购数量"
          prop="planQty"
          align="center"
          width="75">
        </el-table-column>
        <el-table-column
          label="入库数量"
          prop="actQty"
          align="center"
          width="75">
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
  import { addstoragesdata,stoplierdata } from 'api/urlConfig'
  import {formatDate} from '../../../utils/generalUtil';
  import jquery from 'jquery';

  export default {
    name: 'inventory',
    data() {
      return {
        shopId:'',
        storageList:[],
        scopeRowList:[],
        dialogVisible:false,
        centerDialogVisible:false,
        storageNum:"",
        storageTime:"",
        storagePeople:"",
        storageSupply:"",
        storageType:"",
        formRowOne:[],
        nowSupplierList:[],
        offerObj:{
          supplierId: "",   //供应商ID
          supName: "",      //供应商名称
          pmsHeadId: "",    //采购单ID
          pmsOrderName:"",  //采购单名称
          topContact: "",   //联系人
          createrName: "",   //操作人
          orderName: "",   //入库单名称
        }
      }
    },
    created(){
      let that = this;
      this.getShopDetails();
      this.$axios({
        method:"get",
        url:addstoragesdata+'?shopId='+that.shopId,
        responseType:'json',
      }).then(function(response){
        that.storageList=response.data.data;
        that.storageList.forEach(function (date) {
          date.gmtCreate = that.formatDate(date.gmtCreate);
          date.docStkInPlanDetailDoList.forEach(function (type) {
            type.cityName = type.provinceName+type.cityName+type.districtName;
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
      formatDate(date) {
        return formatDate(new Date(parseInt(date)), 'yyyy-MM-dd hh:mm:ss');
      },
      changeSupplier(){
        let that = this;
        for(let i=0;i<that.formRowOne.length;i++){
          if(that.formRowOne[i].supName == that.offerObj.supName){
            that.offerObj.supplierId = that.formRowOne[i].supplierId;
            that.offerObj.supName = that.formRowOne[i].supName;
            that.offerObj.pmsHeadId = that.formRowOne[i].supplierAndPmsHeadDos[0].pmsHeadId;
            that.offerObj.pmsOrderName = that.formRowOne[i].supplierAndPmsHeadDos[0].pmsOrderName;
            that.offerObj.topContact = that.formRowOne[i].supplierAndPmsHeadDos[0].topContact;
            that.nowSupplierList = that.formRowOne[i].supplierAndPmsHeadDos;
          }
        }
      },
      changePrice(){
        let that = this;
        if(that.nowSupplierList.length>1){
          for(let i=0;i<that.nowSupplierList.length;i++){
            if(that.nowSupplierList[i].pmsOrderName == that.offerObj.pmsOrderName){
              that.offerObj.pmsHeadId = that.nowSupplierList[i].pmsHeadId;
              that.offerObj.topContact = that.nowSupplierList[i].topContact;
              console.log(that.offerObj.pmsHeadId);
            }
          }
        }
      },
      backToPurchase(){
        this.centerDialogVisible = false;
      },
      choiceArticle(){
        if(this.offerObj.orderName==""){
          this.$message({
            message: '请输入库单名称',
            type: 'error'
          });
          return
        }
        this.$router.push({ path: '/material/storageview', query:{
          supplierId: this.offerObj.supplierId,   //供应商ID
          supName: this.offerObj.supName,         //供应商名称
          pmsHeadId: this.offerObj.pmsHeadId,     //采购单ID
          topContact: this.offerObj.topContact,   //联系人
          createrName: this.offerObj.createrName,   //操作人
          orderName: this.offerObj.orderName,   //入库单名称
        }});
        console.log(JSON.stringify(this.offerObj));
      },
      getShopDetails(){
        let that=this;
        let shopDetail =  sessionStorage.getItem("shopDet");
        let shopDetailId= jquery.parseJSON(shopDetail);
        that.shopId=shopDetailId.id;
      },
      showStorageView(){
        let that = this;
        this.centerDialogVisible = true;
        this.$axios({
          method:"get",
          url:stoplierdata+'?shopId='+that.shopId,
          responseType:'json',
        }).then(function(response){
          that.formRowOne=response.data.data;
          console.log(JSON.stringify(that.formRowOne));
          that.offerObj.supplierId = that.formRowOne[0].supplierId;
          that.offerObj.supName = that.formRowOne[0].supName;
          that.offerObj.pmsHeadId = that.formRowOne[0].supplierAndPmsHeadDos[0].pmsHeadId;
          that.offerObj.pmsOrderName = that.formRowOne[0].supplierAndPmsHeadDos[0].pmsOrderName;
          that.offerObj.topContact = that.formRowOne[0].supplierAndPmsHeadDos[0].topContact;
          that.nowSupplierList = that.formRowOne[0].supplierAndPmsHeadDos;
        });
      },
      showScopeRow(row){
        this.storageNum=row.orderCode;
        this.storagePeople=row.topContact;
        this.storageTime=this.formatDate(row.gmtCreate);
        this.storageType=row.size;
        this.storageSupply=row.supName;
        this.scopeRowList=row.docStkInPlanDetailDoList;
        this.scopeRowList.forEach(function (type) {
          type.specifications = row.measureUnit+row.unitName+"/"+row.specName;
        })
//        this.scopeRowList.forEach(function (obj) {
//          obj.reduceCount = obj.theoryStockCount - obj.actStockCount;
//        })
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
  .listContent{
    font-size: 16px;
    width: 80%;
    margin: auto;
  }
  .listContent li{
    width: 50%;
    float: left;
    margin-bottom: 10px;
  }
  .text-title {
    color: #999;
    margin-right: 10px;
  }
</style>
