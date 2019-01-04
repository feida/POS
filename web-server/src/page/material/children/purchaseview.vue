<!--采购管理-->
<template>
  <div>
    <el-col style="border-bottom: 5px solid #eee;">
      <router-link class="activeLink" type="button" to="/material/purchase">
        查看采购单
      </router-link>
    </el-col>

    <el-col style="height: 100%">
      <div class="mainView">
        <el-col style="height: 100%;width: 100%">
          <el-col :span="7">
            <div class="tabconter">
              <div class="tablist">
                <table class="imagetable">
                  <tr>
                    <th>名称</th>
                    <th>规格</th>
                    <th>报价</th>
                    <th>数量</th>
                  </tr>
                  <tr class="nowTable" v-for="item in shopCart" @click="choiceItem(item)" :class="{'active': currentArticle.id == item.id}">
                    <td>{{item.materialName}}</td>
                    <td>{{item.measureUnit}}{{item.unitName}}/{{item.specName}}</td>
                    <td>￥{{item.purchasePrice}}</td>
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
              <div class="flex-container" style="padding: 15px;border-bottom: none;">
                <el-button class="flex-btn" @click="clearShopCart">取消</el-button>
                <el-button type="primary" class="flex-btn" @click="subtotal">生成采购单</el-button>
              </div>
            </div>
          </el-col>
          <el-col :span="17">
            <el-col>
              <ul class="topNav">
                <li v-for="item in aboutData" class="rmat-btn" :class="{'active': currentOne.id == item.id}" @click="changeOneList(item)">{{item.name}}</li>
              </ul>
            </el-col>
            <el-col :span="20">
              <div class="maincontner">
                <ul class="lists">
                  <li v-for="item in currentThreeList" :class="{'active': currentArticle.id == item.id}" class="datalistcontner" @click="changeListNumber(item)">
                    <div class="itemlist">{{item.materialName}}</div>
                    <div style="text-align: center;width: 100%">
                      <div class="itemlist" >{{item.measureUnit}}{{item.unitName}}/{{item.specName}}</div>
                      <div class="itemlist">￥{{item.purchasePrice}}</div>
                    </div>
                    <span class="shopCartCount">
                      <i class="art-count" v-if="item.number>0">{{item.number}}</i>
                      <i class="art-count" :class="{artCount:item.number == 0}" v-if="item.number == 0"></i>
                    </span>
                  </li>
                </ul>
              </div>
            </el-col>
            <el-col :span="4">
              <ul class="rgtNav">
                <li v-for="item in currentTwoList" class="rgtbar-btn" :class="{'active': currentTwo.id == item.id}" @click="changeTwoList(item)">{{item.name}}</li>
              </ul>
            </el-col>
          </el-col>
        </el-col>
      </div>

      <el-dialog
        title="采购单"
        :visible.sync="dialogVisible"
        style="width: 1700px;margin-left:-340px">
        <ul class="listconter">
          <li>
            <span>采购单名称:</span>
            <span>{{postData.orderName}}</span>
          </li>
          <li>
            <span>供应商:</span>
            <span>{{offerSupplier}}</span>
          </li>
          <li>
            <span>联系人:</span>
            <span>{{contacts}}</span>
          </li>
          <li>
            <span>原料种类:</span>
            <span>{{this.shopCart.length}}</span>
          </li>
          <li>
            <span>原料数量:</span>
            <span>{{totalCount}}</span>
          </li>
          <li>
            <span>原料总价:</span>
            <span>￥{{totalPrice}}</span>
          </li>
        </ul>
        <el-table
          :data="shopCart"
          style="width: 100%;"
          border
          height="250">
          <el-table-column
            label="一级类别"
            min-width="90"
            align="center"
            prop="categoryOneName">
          </el-table-column>
          <el-table-column
            label="二级类别"
            min-width="90"
            align="center"
            prop="categoryTwoName">
          </el-table-column>
          <el-table-column
            label="品牌名"
            min-width="90"
            align="center"
            prop="categoryThirdName">
          </el-table-column>
          <el-table-column
            label="材料名"
            min-width="90"
            align="center"
            prop="materialName">
          </el-table-column>
          <el-table-column
            label="规格"
            min-width="90"
            align="center"
            prop="specifications">
          </el-table-column>
          <el-table-column
            label="产地"
            min-width="100"
            align="center"
            prop="cityName">
          </el-table-column>
          <el-table-column
            label="报价"
            min-width="70"
            align="center"
            prop="purchasePrice">
          </el-table-column>
          <el-table-column
            label="采购数量"
            min-width="70"
            align="center"
            prop="number">
          </el-table-column>
        </el-table>

        <span slot="footer" class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="dialogVisible = false;openUrl();">提交审核</el-button>
        </span>
      </el-dialog>
    </el-col>
  </div>
</template>

<script>
  import { addpurchaseApi } from 'api/api';
  import { listdata,supplierdata } from 'api/urlConfig';
  import Vue from 'vue';
  import jquery from 'jquery';

  export default {
    name: 'purchase',
    data() {
      return {
        centerDialogVisible:true, //选择报价单
        offerSupplier:'',//供货商接收
        contacts:'',//联系人参数接收
        superPriceId:'',//采购单名称参数接收
        offerSupplierId:'', //供货商ID参数接收
        currentPage: 1,  //当前页码
        pagesize: 10,//默认每页数据量
        dialogVisible: false,
        shopIp:"",
        brandIp:"",
        shopDetailId:{},
        articleList:[],
        currentOne:null,
        currentTwo:null,
        currentTwoList:[],
        currentThreeList:[],
        aboutData:[],
        currentArticle:{},
        docData:[],
        postData:{
          "supplierId": "",
          "supPriceHeadId": null,
          "shopDetailId": null,
          "shopName": "",
          "orderName": "",
          "orderCode": "",
          "orderStatus": "",
          "createrId": null,
          "createrName": "",
          "gmtCreate": 0,
          "gmtModified": null,
          "auditTime": null,
          "auditName": "",
          "updaterId": null,
          "updaterName": null,
          "note": "",
          "isDelete": null,
          "tax": null,
          "totalAmount": 0,
          "expectTime": 0,
          "payStatus": null,
          "pmsDetailId": null,
          "pmsHeaderId": 0,
          "pmsHeaderCode": null,
          "supPriceDetailId": null,
          "purchaseMoney": 0,
          "purchaseTaxMoney": 0,
          "purchaseRealMoney": 0,
          "purchaseRealTaxMoney": 0,
          "receivedMoney": 0,
          "receivedTaxMoney": 0,
          "purchasePrice": 0,
          "orderDetailStatus": "",
          "materialId": null,
          "planQty": null,
          "actQty": 0,
          "orderDetailPayStatus": null,
          "unitId": null,
          "unitName": "",
          "specName": "",
          "specId": null,
          "topEmail": "",
          "topMobile": "",
          "topContact": "",
          "supName": "",
          "categoryOneName": "",
          "categoryThirdName": "",
          "categoryTwoName": "",
          "cityName": "",
          "materialName": "",
          "districtName": "",
          "materialCode": "",
          "measureUnit": 0,
          "provinceName": "",
          "materialType": "",
          "docPmsPoDetailDos": []
        }
      };
    },
    computed: {
      shopCart(){
        let list = [];
        this.articleList.forEach(function (food) {
          if(food.number){
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
      this.superPriceId = this.$route.query.superPriceId;
      this.offerSupplier = this.$route.query.offerSupplier;
      this.contacts = this.$route.query.contacts;
      //this.getDate = new Date(this.$route.query.date).format("yyyy-MM-dd hh:mm");
      this.postData.orderName = this.$route.query.orderName;
      this.postData.createrName = this.$route.query.contacts;
      this.getShopDetails();
      this.initialization();
    },
    methods: {
      getShopDetails() {
        let that=this;
        that.shopDetail =  sessionStorage.getItem("shopDet");
        that.shopDetailId= jquery.parseJSON(that.shopDetail);
        that.shopIp=that.shopDetailId.id;
        that.brandIp=that.shopDetailId.brand_id;
      },
      initialization(){
        let that = this;
        that.$axios({
          method:"get",
          url:listdata+'?shopId='+that.shopIp+"&supPriceId="+that.superPriceId,
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

          that.currentOne=that.aboutData[0];
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
          //购物车菜品
          that.aboutData.forEach(function(one){
            if(one.twoList!=null){
              one.twoList.forEach(function(two){
                if(two.threeList!=null){
                  two.threeList.forEach(function(three){
                    if(three.materialList!=null){
                      three.materialList.forEach(function (article) {
                        let temp = article;
                        temp.specifications = article.measureUnit+article.unitName+"/"+article.specName;
                        temp.cityName = temp.provinceName+temp.cityName+temp.districtName;
                        that.articleList.push(temp);
                        console.log(that.articleList);
                      })
                    }
                  })
                }
              })
            }
          })
        });
      },
      choiceItem(item){
        this.currentArticle = item;
      },
      addNumber(){
        let that = this;
        this.shopCart.forEach(function(a){
          if(a.id == that.currentArticle.id){
            a.number++;
          }
        })
        this.postData.docPmsPoDetailDos.forEach(function (a) {
          if(a.materialId == that.currentArticle.id){
            a.planQty++;
            a.actQty++;
          }
        })
      },
      cutNumber(){
        let that = this;
        this.shopCart.forEach(function (a) {
          if(a.id == that.currentArticle.id){
            a.number--;
          }
        })
        for(let i=0;i<this.postData.docPmsPoDetailDos.length;i++){
          if(this.postData.docPmsPoDetailDos[i].materialId == that.currentArticle.id){
            this.postData.docPmsPoDetailDos[i].planQty--;
            this.postData.docPmsPoDetailDos[i].actQty--;
            if(this.postData.docPmsPoDetailDos[i].planQty == 0){
              that.postData.docPmsPoDetailDos.splice(i,1);
            }
          }
        }
      },
      handleDelete(){
        let that = this;
        this.shopCart.forEach(function (a) {
          if(a.id == that.currentArticle.id){
            a.number=0;
          }
        })
        for(let i=0;i<this.postData.docPmsPoDetailDos.length;i++){
          if(this.postData.docPmsPoDetailDos[i].materialId == that.currentArticle.id){
            that.postData.docPmsPoDetailDos.splice(i,1);
          }
        }
      },
      handleEdit() {

      },
      clearShopCart(){
        this.shopCart.forEach(function (a) {
          a.number=0;
        })
        this.postData.docPmsPoDetailDos = [];
      },
      changeListNumber(item){
        this.currentArticle = item;
        if(item.number==0){
          item.number++;
          let docPmsPoDetail = new Object();
          docPmsPoDetail.purchaseMoney = item.purchasePrice;
          docPmsPoDetail.orderDetailStatus = item.orderDetailStatus;
          docPmsPoDetail.materialId = item.id;
          docPmsPoDetail.planQty = item.number;
          docPmsPoDetail.actQty = item.number;
          docPmsPoDetail.unitId = item.unitId;
          docPmsPoDetail.unitName = item.unitName;
          docPmsPoDetail.specName = item.specName;
          docPmsPoDetail.specId = item.specId;
          docPmsPoDetail.categoryOneName = item.categoryOneName;
          docPmsPoDetail.categoryThirdName = item.categoryThirdName;
          docPmsPoDetail.categoryTwoName = item.categoryTwoName;
          docPmsPoDetail.cityName = item.cityName;
          docPmsPoDetail.materialName = item.materialName;
          docPmsPoDetail.districtName = item.districtName;
          docPmsPoDetail.materialCode = item.materialCode;
          docPmsPoDetail.measureUnit = item.measureUnit;
          docPmsPoDetail.provinceName = item.provinceName;
          docPmsPoDetail.materialType = item.materialType;
          this.postData.docPmsPoDetailDos.push(docPmsPoDetail);
          console.log(JSON.stringify(this.postData.docPmsPoDetailDos));
        }else{
          item.number++;
          this.postData.docPmsPoDetailDos.forEach(function (a) {
            if(a.materialId == item.id){
              a.planQty++;
              a.actQty++;
            }
          })
          console.log(JSON.stringify(this.postData.docPmsPoDetailDos));
        }
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
      formatData(){
        this.postData.supPriceHeadId=this.superPriceId;
        this.postData.supplierId = this.$route.query.offerSupplierId;
        this.postData.shopDetailId=this.shopIp;
        this.postData.shopName="";
        this.postData.orderStatus=11;
        this.postData.auditName="";
        this.postData.totalAmount=this.totalPrice;
      },
      openUrl(){
        let that=this;
        this.formatData();
        addpurchaseApi.addpurchase(that.postData).then((response)=>{
          if(response.success){
            that.successmge();
            that.$router.push({ path: '/material/purchase'});
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
      subtotal(){
        this.dialogVisible = true;
      },
      //每页显示数据量变更
      handleSizeChange(val) {
        let that=this;
        that.pagesize = val;
        that.loadData(that.criteria, that.currentPage, that.pagesize);
      },
      handleCurrentChange(val) {
        this.currentRow = val;
      },
      setCurrent(row) {
        this.$refs.table.setCurrentRow(row);
      },
      confirmEdit(row) {
        row.edit = false
        row.originalTitle = row.title
      }
    }
  };
</script>
<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

  div{
    display: inline-block;
  }
  .newbtn{
    width: 100%;
    border-top: 1px solid #ccc;
  }
  .newbtnlist{
    width: 40%;
    background-color: #5babe6;
    color: #fff;
    height: 35px;
    border-radius: 3px;
    margin-top: 20px;
    margin-left: 12px;
  }
  .itemlist{
    display: inline-block;
    width: 100%;
    text-align: center;
    margin-top: 8px;
  }
  .contersize{
    font-size: 24px;
  }
  .iptsizes{
    width: 168px;
    margin-left: 7px;
  }
  .optsize{
    width: 65%;
    margin-left: 10px;
  }
  .timeipt{
    width: 100%;
    margin-left: 2px;
  }
  .formcenter{
    height: 100%;
    width: 100%;
    background-color: #fff;
  }
  .maincontner{
    width: 100%;
    height:840px;
    margin-top: 5px;
    margin-left: 5px;
    background-color: #fff;
  }
  .tablist{
    width: 100%;
    height: 60%;
    position: relative;
    overflow: scroll;
    padding: 5px;
    border-bottom: 1px solid #ccc;
  }
  .rgtNav{
    width: 99.5%;
    height: 840px;
    margin-top: 5px;
    margin-left: 10px;
    background-color: #fff;
  }
  .formrow{
    margin:5px;
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
  .rmat-btn:hover{
    cursor: pointer;
  }
  .rgtbar-btn{
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
  .rgtbar-btn:hover{
    cursor: pointer;
  }
  .tabconter{
    width: 100%;
    height: 730px;
    background-color: #fff;
  }
  .active{
    color: #fff;
    background-color: #5babe6;
  }
  .actcheck{
    border-color:#5babe6;
    color: #5babe6;
  }
  .activeLink{
    width: 120px;
    height: 50px;
    line-height: 50px;
    display: inline-block;
    text-align: center;
    font-size: 16px;
    margin: 10px;
    border: 1px solid #ccc;
    border-radius: 5px;
    color: #fff;
    background-color: #5babe6;
  }
  .mainView{
    background-color: #eee;
  }
  .active:hover{
    cursor: pointer;
  }
  .dialogcontner{
    width: 100%;
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

  table.imagetable {
    color:#333333;
    width: 100%;
    border-color: #ccc;
    border-collapse: collapse;
  }
  table.imagetable th {
    border-width: 1px;
    width: 25%;
    padding: 5px;
    border-style: solid;
    border-color: #ccc;
  }
  table.imagetable td {
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
    display: -webkit-flex;
    display: flex;
    -webkit-justify-content: space-between;
    justify-content: space-between;
    width: 100%;
    background-color: #fff;
    border-bottom: 1px solid #ccc;
  }
  .flex-container .flex-btn {
    width: 45%;
  }
  .datalistcontner{
    width: 17%;
    height: 85px;
    float: left;
    border: 1px solid #ccc;
    display: inline-block;
    list-style: none;
    margin: 10px;
    border-radius: 5px;
    font-size: 14px;
    position: relative;
  }
  .datalistcontner .art-count {
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
  ::-webkit-scrollbar {display:none}
</style>
