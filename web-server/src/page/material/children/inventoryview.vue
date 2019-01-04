<!--盘点管理-->
<template>
  <div class="container">
  <div class="top_button">
    <div class="middle">
      <el-button class="activeLink" type="primary" @click="showInventory">查看盘点单</el-button>
    </div>
  </div>

  <div class="inventory_view">
    <el-col :span="7" class="input_content">
      <div class="input_height">
        <el-col style="padding: 5px;">
          <div style="color:#999;display: inline-block;">盘点单名称<span style="color:red">*</span></div>
          <el-input class="inputSize" placeholder="请输入盘点单名称" v-model="purchaseName"></el-input>
        </el-col>
        <el-col style="padding: 5px;">
          <div style="color:#999;display: inline-block;">操作人</div>
          <el-input class="inputSize" placeholder="请输入操作人" v-model="inputName"></el-input>
        </el-col>
      </div>

      <div class="cart_contain">
        <div class="cart_list">
          <table class="imageTable">
            <tr>
              <th>类别</th>
              <th>原料名</th>
              <th>规格</th>
              <th>盘点数量</th>
            </tr>
            <tr class="nowTable" v-for="item in shopCart" @click="choiceItem(item)" :class="{'active': currentArticle.id == item.id}">
              <td>{{item.categoryOneName}}</td>
              <td>{{item.materialName}}</td>
              <td>{{item.measureUnit}}{{item.unitName}}/{{item.specName}}</td>
              <td>{{item.number}}</td>
            </tr>
          </table>
        </div>
        <div class="flex-container">
          <span class="btnlist" @click="handleEdit">编辑</span>
          <span class="btnlist" @click="handleDelete">删除</span>
          <span class="btnlist" @click="addNumber">+</span>
          <span class="btnlist" @click="cutNumber">-</span>
        </div>
        <div class="flex-container" style="padding: 15px 10px;border-bottom: none;">
          <el-button class="flex-btn" @click="clearShopCart">取消</el-button>
          <el-button type="primary" class="flex-btn" @click="subtotal">生成盘点单</el-button>
        </div>
      </div>
    </el-col>

    <el-col class="input_content" style="border-right: none;" :span="17">
      <el-col>
        <ul class="topNav">
          <li v-for="item in aboutData" class="rmat-btn" :class="{'active': currentOne.id == item.id}" @click="changeOneList(item)">{{item.name}}</li>
        </ul>
      </el-col>
      <el-col :span="20" style="border-right: 5px solid #eee;position: relative;height: 100%;">
        <ul>
          <li v-for="item in currentThreeList" :class="{'active': currentArticle.id == item.id}" class="dataListContain" @click="changeListNumber(item)">
            <div class="itemList">{{item.materialName}}</div>
            <div class="itemList">{{item.measureUnit}}{{item.unitName}}/{{item.specName}}</div>
            <span class="shopCartCount">
              <i class="art-count" v-if="item.number>0">{{item.number}}</i>
              <i class="art-count" :class="{artCount:item.number == 0}" v-if="item.number == 0"></i>
            </span>
          </li>
        </ul>
      </el-col>
      <el-col :span="4">
        <ul class="right_nav">
          <li v-for="item in currentTwoList" class="right_nav_btn" :class="{'active': currentTwo.id == item.id}" @click="changeTwoList(item)">{{item.name}}</li>
        </ul>
      </el-col>
    </el-col>

    <el-dialog
      title="盘点单详情"
      :visible.sync="dialogVisible"
      style="width: 1700px;margin-left:-340px">
    <ul class="listconter">
      <li>
        <span>盘点单名称:</span>
        <span>{{purchaseName}}</span>
      </li>
      <li>
        <span>操作人:</span>
        <span>{{inputName}}</span>
      </li>
      <li>
        <span>原料种类:</span>
        <span>{{this.shopCart.length}}</span>
      </li>
      <li>
        <span>原料数量:</span>
        <span>{{totalCount}}</span>
      </li>
    </ul>

    <el-table
      :data="shopCart"
      border
      height="300">
      <el-table-column
        label="一级类别"
        width="100"
        align="center"
        prop="categoryOneName">
      </el-table-column>
      <el-table-column
        label="二级类别"
        width="100"
        align="center"
        prop="categoryTwoName">
      </el-table-column>
      <el-table-column
        label="品牌名"
        width="100"
        align="center"
        prop="categoryThirdName">
      </el-table-column>
      <el-table-column
        label="材料名"
        width="100"
        align="center"
        prop="materialName">
      </el-table-column>
      <el-table-column
        label="规格"
        width="90"
        align="center"
        prop="specifications">
      </el-table-column>
      <el-table-column
        label="产地"
        min-width="80"
        align="center"
        prop="provinceName">
      </el-table-column>
      <el-table-column
        label="盘点数量"
        width="80"
        align="center"
        prop="number">
      </el-table-column>
    </el-table>
    <span slot="footer" class="dialog-footer">
      <el-button @click="dialogVisible = false">取 消</el-button>
      <el-button type="primary" @click="dialogVisible = false;openUrl();">提交审核</el-button>
    </span>
    </el-dialog>
    </div>
  </div>
</template>

<script>

  import { addinventoryApi } from 'api/api';
  import { listdata,supplierdata } from 'api/urlConfig'
  import jquery from 'jquery';

  export default {
    data() {
      return {
        postData:{
          "shopDetailId": "",
          "orderStatus": "",
          "publishedName": "",
          "orderName": "",
          "docStockCountDetailDo": [],
          "createName":""
        },
        shopId:"",
        shopDetailshopid:{},
        brandip:"",
        aboutData:[],
        articleList:[],
        currentOne:null,
        currentTwo:null,
        currentTwoList:[],
        currentThreeList:[],
        purchaseName:'',
        inputName:'',
        dialogVisible:false,
        currentArticle:{},
        alReady:false
      };
    },
    computed: {
      shopCart(){
        let list = [];
        this.articleList.forEach(function (food) {
          if(food.state == 0){
            list.push(food);
          }
        })
        return list;
      },
      totalPrice:function() {
        let total = 0;
        this.articleList.forEach(function(food){
          if (food.number) {
            total += food.purchasePrice * food.number;
          }
        })
        return total;
      },
      totalCount:function() {
        let count = 0;
        this.articleList.forEach(function(food){
          count += food.number;
        })
        return count;
      }
    },
    created(){
      this.getShopDetails();
      let that=this;
      that.$axios({
        method:"get",
        url:listdata+'?shopId='+that.shopId,
        responseType:'json',
      }).then(function(response){
        that.aboutData=response.data.data;
        //把全部push进二级列表
        that.aboutData.forEach(function(type){
          let nowTypeArticle=new Object();
          nowTypeArticle.name="全部";
          nowTypeArticle.id=0;
          nowTypeArticle.materialList=[];
          type.twoList.unshift(nowTypeArticle);
          type.twoList.forEach(function(two){
            if(type.id == two.parentId){
              two.threeList.forEach(function(three){
                if(three.materialList!=null){
                  three.materialList.forEach(function(article){
                    nowTypeArticle.materialList.push(article);
                  })
                }
              })
            }
          });
        })
        that.currentOne=response.data.data[0];
        that.currentTwoList=that.currentOne.twoList;
        that.currentTwo=that.currentTwoList[0];
        //全部情况
        if(that.currentTwo.id == 0){
          that.currentTwo.materialList.forEach(function (article) {
            that.currentThreeList.push(article);
          })
        }else{
          that.currentTwo.threeList.forEach(function(three){
            if(three.materialList!=null){
              three.materialList.forEach(function (article) {
                that.currentThreeList.push(article);
              })
            }
          });
        }
        that.aboutData.forEach(function(one){
          if(one.twoList!=null){
            one.twoList.forEach(function(two){
              if(two.threeList!=null){
                two.threeList.forEach(function(three){
                  if(three.materialList!=null){
                    three.materialList.forEach(function (article) {
                      let temp = article;
                      temp.specifications = article.measureUnit+article.unitName+"/"+article.specName;
                      temp.provinceName = temp.provinceName+temp.cityName+temp.districtName;
                      that.articleList.push(temp);
                    })
                  }
                })
              }
            })
          }
        })
        that.alReady = true;
      })
    },
    methods: {
      changeListNumber(item){
        let that = this;
        this.currentArticle = item;
        if(item.number==0){
          item.state = 0;
          item.number++;
          let inventoryObj = new Object();
          inventoryObj.materialId=item.id;
          inventoryObj.materialType=item.materialType;
          inventoryObj.categoryOneName=item.categoryOneName;
          inventoryObj.categoryTwoName=item.categoryTwoName;
          inventoryObj.categoryThirdName=item.categoryThirdName;
          inventoryObj.materialName=item.materialName;
          inventoryObj.unitName=item.unitName;
          inventoryObj.specName=item.specName;
          inventoryObj.materialCode=item.materialCode;
          inventoryObj.measureUnit=item.measureUnit;
          inventoryObj.actStockCount=item.number;
          inventoryObj.provinceName=item.provinceName;
          inventoryObj.cityName=item.cityName;
          inventoryObj.districtName=item.districtName;
          inventoryObj.defferentReason=item.orderCode;
          that.postData.docStockCountDetailDo.push(inventoryObj);
        }else{
          item.number++;
          this.postData.docStockCountDetailDo.forEach(function(a){
            if(a.materialId == item.id){
              a.actStockCount++;
            }
          })
        }
      },
      subtotal(){
        if(this.purchaseName==""){
          this.$message({
            message: '请输入盘点单名称',
            type: 'error'
          });
          return
        }
        this.dialogVisible = true;
      },
      showInventory(){
        this.$router.push({ path: '/material/inventory'});
      },
      choiceItem(item){
        this.currentArticle = item;
      },
      addNumber(){
        let that = this;
        this.shopCart.forEach(function (a) {
          if(a.id == that.currentArticle.id){
            a.number++;
            console.log(JSON.stringify(a.state));
          }
        })
        this.postData.docStockCountDetailDo.forEach(function(a){
          if(a.materialId == that.currentArticle.id){
            a.actStockCount++;
          }
        })
      },
      cutNumber(){
        let that = this;
        this.shopCart.forEach(function (a) {
          if(a.id == that.currentArticle.id && a.number>0){
            a.number--;
          }
        })
        for(let i=0;i<this.postData.docStockCountDetailDo.length;i++){
          if(this.postData.docStockCountDetailDo[i].materialId == that.currentArticle.id && this.postData.docStockCountDetailDo[i].actStockCount>0){
            this.postData.docStockCountDetailDo[i].actStockCount--;
//            if(this.postData.docStockCountDetailDo[i].actStockCount == 0){
//              that.postData.docStockCountDetailDo.splice(i,1);
//            }
          }
        }
      },
      handleDelete(){
        let that = this;
        this.shopCart.forEach(function (a) {
          if(a.id == that.currentArticle.id){
            a.number=0;
            a.state=1;
          }
        })
        for(let i=0;i<this.postData.docStockCountDetailDo.length;i++){
          if(this.postData.docStockCountDetailDo[i].materialId == that.currentArticle.id){
            that.postData.docStockCountDetailDo.splice(i,1);
          }
        }
      },
      handleEdit(){

      },
      clearShopCart(){
        this.shopCart.forEach(function (a) {
          a.number=0;
        })
        this.postData.docStockCountDetailDo = [];
      },
      changeOneList(item){
        this.currentThreeList = [];
        this.currentOne = item;
        this.currentTwoList = item.twoList;
        this.currentTwo = item.twoList[0];
        let that = this;
        if(this.currentTwo.id == 0){
          this.currentTwo.materialList.forEach(function (article) {
            that.currentThreeList.push(article);
          })
        }else{
          this.currentTwo.threeList.forEach(function(three){
            if(three.materialList!=null){
              three.materialList.forEach(function (article) {
                that.currentThreeList.push(article);
              })
            }
          });
        }
      },
      changeTwoList(item){
        this.currentThreeList = [];
        this.currentTwo = item;
        let that = this;
        if(this.currentTwo.id == 0){
          this.currentTwo.materialList.forEach(function (article) {
            that.currentThreeList.push(article);
          })
        }else{
          this.currentTwo.threeList.forEach(function(three){
            if(three.materialList!=null){
              three.materialList.forEach(function (article) {
                that.currentThreeList.push(article);
              })
            }
          });
        }
      },
      getShopDetails() {
        let that=this;
        let shopDetail =  sessionStorage.getItem("shopDet");
        let shopDetailId= jquery.parseJSON(shopDetail);
        that.shopId=shopDetailId.id;
        that.brandip=shopDetailId.brand_id;
      },
      dataFormat(){
        this.postData.shopDetailId=this.shopId;
        this.postData.orderStatus="11";
        this.postData.publishedName="上海";
        this.postData.orderName=this.purchaseName;
        this.postData.createName=this.inputName;
      },
      openUrl(){
        let that=this;
        this.dataFormat();
        addinventoryApi.addinventory(that.postData).then((response)=>{
          if(response.success){
            that.successmge();
            that.$router.push({ path: '/material/inventory'});
          }else{
            that.errormge();
          }
        }).catch((error)=>{
          that.errormge();
        })
      },
      successmge(){
        this.$message({
          message: '创建成功',
          type: 'success'
        });
      },
      errormge(){
        this.$message({
          message: '创建失败',
          type: 'error'
        });
      },

    }
  };
</script>

<style scoped>
  .activeLink{
    width: 120px;
    height: 50px;
    display: inline-block;
    text-align: center;
    font-size: 16px;
    margin-left: 10px;
    border: 1px solid #ccc;
    border-radius: 5px;
    color: #fff;
    background-color: #5babe6;
  }
  .container {
    position: relative;
    height: 100%;
  }
  .itemList{
    display: inline-block;
    width: 100%;
    text-align: center;
    margin-top: 15px;
  }
  .inputSize{
    width: 140px;
    margin-left: 10px;
  }
  .cart_list{
    position: relative;
    height: 70%;
    overflow: scroll;
    padding: 5px;
    border-bottom: 1px solid #ccc;
  }
  .right_nav{
    margin-top: 5px;
    margin-left: 5px;
  }
  .btnlist{
    width: 45px;
    height: 40px;
    display: inline-block;
    font-size: 16px;
    list-style: none;
    border: 1px solid #5babe6;
    margin: 10px;
    text-align: center;
    line-height: 40px;
    color: #5babe6;
  }
  .iptsize{
    width: 60%;
    margin-left: 10px;
  }
  .rmat-btn{
    display: inline-block;
    width: 65px;
    height: 40px;
    text-align: center;
    background-color: #fff;
    font-size: 12px;
    color: #000;
    line-height: 40px;
    border: 1px solid #ccc;
    margin: 5px;
    border-radius: 5px;
  }
  .right_nav_btn:hover{
    cursor: pointer;
  }
  .right_nav_btn{
    display: inline-block;
    width: 80px;
    height: 30px;
    text-align: center;
    background-color: #fff;
    font-size: 12px;
    color: #000;
    line-height: 30px;
    border: 1px solid #ccc;
    margin-left: 5px;
    border-radius: 5px;
    margin-top: 10px;
  }
  .right_nav_btn:hover{
    cursor: pointer;
  }
  .active{
    color: #fff;
    background-color: #5babe6;
  }
  .mainView{
    background-color: #eee;
  }
  .active:hover{
    cursor: pointer;
  }
  table.imageTable {
    color:#333333;
    width: 100%;
    border-color: #ccc;
    border-collapse: collapse;
  }
  table.imageTable th {
    border-width: 1px;
    width: 25%;
    padding: 5px;
    border-style: solid;
    border-color: #ccc;
  }
  table.imageTable td {
    border-width: 1px;
    padding: 5px;
    width: 25%;
    text-align: center;
    border-style: solid;
    border-color: #ccc;
  }
  .nowTable.active {
    background-color: #5babe6;
    color: #fff;
  }
  .flex-container {
    position: relative;
    display: -webkit-flex;
    display: flex;
    -webkit-justify-content: space-between;
    justify-content: space-between;
    width: 100%;
    background-color: #fff;
    border-bottom: 1px solid #ccc;
  }
  .flex-container .flex-btn {
    width: 48%;
    font-size: 16px;
  }
  .dataListContain{
    width: 17%;
    height: 85px;
    float: left;
    border: 1px solid #ccc;
    display: inline-block;
    list-style: none;
    margin: 10px;
    border-radius: 5px;
    font-size: 16px;
    position: relative;
  }
  .dataListContain .art-count {
    height: 20px;
    width: 20px;
    font-size: 14px;
    border: 2px solid red;
    display: inline-block;
    border-radius: 50%;
    line-height: 20px;
    text-align: center;
    font-style: normal;
    color: #F9F5F5;
    background-color: red;
  }
  .artCount.art-count {
    height: 0px;
    width: 0px;
    border: initial;
  }
  .shopCartCount {
    position: absolute;
    top: -8px;
    right: -8px;
  }
  .text-padding {
    margin-bottom: 10px;
  }
  ::-webkit-scrollbar {display:none}

  .top_button {
    position: relative;
    height: 12%;
    width: 100%;
    border-bottom: 5px solid #eee;
    display: table;
  }
  .middle {
    vertical-align: middle;
    display:table-cell;
    width: 100%;
  }
  .inventory_view {
    position: relative;
    height: 88%;
  }
  .input_content {
    position: relative;
    height: 100%;
    border-right: 5px solid #eee;
  }
  .input_height {
    position: relative;
    height: 16%;
  }
  .cart_contain{
    position: relative;
    height: 84%;
    border-top: 5px solid #eee;
  }
  .topNav {
    border-bottom: 5px solid #eee;
  }
  .listconter{
    width: 80%;
    font-size: 16px;
    margin: auto;
  }
  .listconter li{
    width: 40%;
    float: left;
    margin-bottom: 10px;
  }
</style>
