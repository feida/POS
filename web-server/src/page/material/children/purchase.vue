<!--采购管理-->
<template>
  <div>
    <el-row style="border-bottom: 5px solid #eee;">
      <el-col :span="13">
        <el-button class="actives" type="primary" @click="showOfferDialog">新增采购单</el-button>
      </el-col>
    </el-row>

    <el-col style="padding: 5px;">
      <el-col class="boxView">
        <el-table
          :data="aboutData"
          height="550"
          border>
          <el-table-column
            label="单号"
            align="center"
            min-width="70"
            prop="orderCode">
          </el-table-column>
          <el-table-column
            label="单名"
            min-width="70"
            align="center"
            prop="orderName">
          </el-table-column>
          <el-table-column
            label="采购时间"
            align="center"
            min-width="85"
            prop="gmtCreate">
          </el-table-column>
          <el-table-column
            label="操作人"
            min-width="75"
            align="center"
            prop="createrName">
          </el-table-column>
          <el-table-column
            label="供应商名"
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
            label="总价"
            min-width="75"
            align="center"
            prop="totalAmount">
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
              <el-button type="primary" @click="dialogVisible = true;subtotle(scope.row)">查看</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-col>

      <el-dialog
        title="采购单"
        :visible.sync="dialogVisible"
        style="width: 1700px;margin-left:-340px"
        center>
        <div style="font-size: 16px;">
          <ul class="listconter">
            <li>
              <span>采购单号:</span>
              <span>{{purchase}}</span>
            </li>
            <li>
              <span>采购时间:</span>
              <span>{{pickerdata}}</span>
            </li>
            <li>
              <span>供应商:</span>
              <span>{{purchasevalue}}</span>
            </li>
            <li>
              <span>联系人:</span>
              <span>{{quotationvalue}}</span>
            </li>
            <li>
              <span>原料种类:</span>
              <span>{{category}}</span>
            </li>
          </ul>
          <div>
            <el-table
              :data="alldatalist"
              style="width: 100%;margin-top: 20px"
              border
              height="250">
              <el-table-column
                label="类型"
                align="center"
                prop="materialType">
              </el-table-column>
              <el-table-column
                label="一级类别"
                align="center"
                prop="categoryOneName">
              </el-table-column>
              <el-table-column
                label="二级类别"
                align="center"
                prop="categoryTwoName">
              </el-table-column>
              <el-table-column
                label="品牌名"
                align="center"
                prop="categoryThirdName">
              </el-table-column>
              <el-table-column
                label="材料名"
                align="center"
                prop="materialName">
              </el-table-column>
              <el-table-column
                label="规格"
                align="center"
                prop="specifications">
              </el-table-column>
              <el-table-column
                label="产地"
                align="center"
                prop="cityName">
              </el-table-column>
              <el-table-column
                label="报价"
                align="center"
                prop="purchaseMoney">
              </el-table-column>
              <el-table-column
                label="采购数量"
                align="center"
                prop="planQty">
              </el-table-column>
            </el-table>
          </div>
        </div>
        <span slot="footer" class="dialog-footer">
          <el-button type="primary" @click="dialogVisible = false">确定</el-button>
        </span>
      </el-dialog>

      <el-dialog
        title="新增采购单"
        :visible.sync="centerDialogVisible"
        width="30%"
        center>
        <el-col style="margin-bottom: 15px;">
          <span class="text-title">供应商<i style="color:red">*</i></span>
          <el-select v-model="offerObj.offerSupplier" placeholder="请选择供应商" @change="changeSupplier">
            <el-option
              v-for="item in formRowOne"
              :key="item.supName"
              :label="item.supName"
              :value="item.supName">
            </el-option>
          </el-select>
        </el-col>
        <el-col style="margin-bottom: 15px;">
          <span class="text-title">报价单<i style="color:red">*</i></span>
          <el-select v-model="offerObj.offerName" placeholder="请选择报价单" @change="changePrice">
            <el-option
              v-for="item in nowSupplierList"
              :key="item.priceName"
              :value="item.priceName">
            </el-option>
          </el-select>
        </el-col>
        <el-col style="margin-bottom: 15px;">
          <span class="text-title">联系人<i style="color:red">*</i></span>
          <el-select v-model="offerObj.contacts" placeholder="请选择联系人">
            <el-option
              v-for="item in nowSupplierList"
              :key="item.topContact"
              :value="item.topContact">
            </el-option>
          </el-select>
        </el-col>
        <el-col style="margin-bottom: 15px;">
          <span class="text-title">采购单名称<i style="color:red">*</i></span>
          <el-input v-model="offerObj.orderName" placeholder="请输入采购单名称" style="width: 50%;"></el-input>
        </el-col>
        <el-col style="margin-bottom: 15px;">
          <span class="text-title">操作人</span>
          <el-input placeholder="请输入内容" v-model="offerObj.operator" style="width: 50%;"></el-input>
        </el-col>
        <el-col style="margin-bottom: 15px;">
          <span class="text-title">预送达时间</span>
          <el-date-picker v-model="offerObj.date" type="date" placeholder="选择日期" format="yyyy-MM-dd"></el-date-picker>
        </el-col>
        <div slot="footer" class="dialog-footer">
          <el-button @click="backToPurchase">取消</el-button>
          <el-button type="primary" @click="choiceArticle">选择原料</el-button>
        </div>
      </el-dialog>
    </el-col>
  </div>
</template>

<script>
  import { purchaselist,supplierdata } from 'api/urlConfig'
  import Vue from 'vue';
  import jquery from 'jquery';
  export default {
    name: 'purchase',
    data() {
      return {
        alldatalist:{},
        purchase:'',//单号
        purchasevalue:'',//供货商
        purchasedata:'',//报价单
        quotationvalue:'',//联系人
        pickerdata:'',//送达时间
        category:'',//原料种类
        aboutData:[],//请求数据
        offerObj:{
          offerSupplier:'',     //供货商名称
          offerSupplierId:'',   //供货商ID
          superPriceId:'',    //报价单传参ID
          offerName:'',     //报价单内容
          contacts:'',     //联系人名称
          operator:'',     //操作人名称
          orderName:'',   //采购单名称
        },
        centerDialogVisible:false,
        dialogVisible: false,
        shopip:"",
        brandip:"",
        shopDetailshopid:{},
        formRowOne:[],
        nowSupplierList:[]
      };
    },
    mounted(){

    },
    created() {
      this.getShopDetails();
      this.getlists();
    },
    methods: {
      choiceArticle(){
        if(this.offerObj.orderName==""){
          this.$message({
            message: '请输入采购单名称',
            type: 'error'
          });
          return
        }
        this.$router.push({ path: '/material/purchaseview', query:{
          superPriceId: this.offerObj.superPriceId,
          offerSupplier: this.offerObj.offerSupplier,
          offerSupplierId: this.offerObj.offerSupplierId,
          contacts: this.offerObj.contacts,
          operator: this.offerObj.operator,
          orderName: this.offerObj.orderName,
        }});
        console.log(JSON.stringify(this.offerObj));
      },
      changeSupplier(){
        let that = this;
        for(let i=0;i<that.formRowOne.length;i++){
          if(that.formRowOne[i].supName == that.offerObj.offerSupplier){
            that.offerObj.offerSupplier = that.formRowOne[i].supName;
            that.offerObj.offerSupplierId = that.formRowOne[i].supplierId;
            that.offerObj.superPriceId = that.formRowOne[i].supplierAndSupPriceList[0].supPriceId;
            that.offerObj.offerName = that.formRowOne[i].supplierAndSupPriceList[0].priceName;
            that.offerObj.contacts = that.formRowOne[i].supplierAndSupPriceList[0].topContact;
            that.nowSupplierList = that.formRowOne[i].supplierAndSupPriceList;
          }
        }
      },
      changePrice(){
        let that = this;
        if(that.nowSupplierList.length>1){
          for(let i=0;i<that.nowSupplierList.length;i++){
            if(that.nowSupplierList[i].priceName == that.offerObj.offerName){
              that.offerObj.superPriceId = that.nowSupplierList[i].supPriceId;
              that.offerObj.offerName = that.nowSupplierList[i].priceName;
              that.offerObj.contacts = that.nowSupplierList[i].topContact;
            }
          }
        }
      },
      getShopDetails() {
        let that=this;
        that.shopDetail =  sessionStorage.getItem("shopDet");
        that.shopDetailshopid= jquery.parseJSON(that.shopDetail);
        that.shopId=that.shopDetailshopid.id;
      },
      showOfferDialog(){
        let that = this;
        this.centerDialogVisible = true;
        this.$axios({
          method:"get",
          url:supplierdata+'?shopId='+that.shopId,
          responseType:'json',
        }).then(function(response){
          that.formRowOne=response.data.data;
          console.log(JSON.stringify(that.formRowOne));
          that.offerObj.offerSupplier = that.formRowOne[0].supName;
          that.offerObj.offerSupplierId = that.formRowOne[0].supplierId;
          that.offerObj.superPriceId = that.formRowOne[0].supplierAndSupPriceList[0].supPriceId;
          that.offerObj.offerName = that.formRowOne[0].supplierAndSupPriceList[0].priceName;
          that.offerObj.contacts = that.formRowOne[0].supplierAndSupPriceList[0].topContact;
          that.nowSupplierList = that.formRowOne[0].supplierAndSupPriceList;
        });
      },
      backToPurchase(){
        this.centerDialogVisible = false;
      },
      getlists(){
        let that=this;
        this.$axios({
          method:"get",
          url:purchaselist+'?shopId='+that.shopId,
          responseType:'json',
        }).then(function(response){
          that.aboutData=response.data.data;
          that.aboutData.forEach(function (date) {
            date.gmtCreate = new Date(date.gmtCreate).format("yyyy-MM-dd hh:mm");
            date.expectTime = new Date(date.expectTime).format("yyyy-MM-dd hh:mm");
            date.docPmsPoDetailDos.forEach(function (type) {
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
      subtotle(row){
        this.purchase=row.orderCode;
        this.pickerdata=row.gmtCreate;
        this.purchasevalue=row.supName;
        this.category=row.size;
        this.quotationvalue=row.topContact;
        this.alldatalist=row.docPmsPoDetailDos;
        this.alldatalist.forEach(function (type) {
          type.specifications = row.measureUnit+row.unitName+"/"+row.specName;
        })
      }
    }
  }
</script>

<style scoped>
  .actives{
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
  .text-title {
    color: #999;
    margin-right: 10px;
  }
  .listconter{
    width: 80%;
    margin: auto;
  }
  .listconter li{
    width: 50%;
    float: left;
    margin-bottom: 10px;
  }
</style>
