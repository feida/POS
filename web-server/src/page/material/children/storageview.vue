<!--盘点管理-->
<template>
  <el-row>
    <el-col style="border-bottom: 5px solid #eee;">
      <router-link class="activeLink" type="button" to="/material/storage">
        返回
      </router-link>
      <a class="activeLink" type="button" @click="subtotal" style="float: right;">
        生成入库单
      </a>
    </el-col>

    <el-col style="height: 100%;padding: 10px;">
      <el-table
        :data="articleList"
        border
        style="width: 100%;">
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
          prop="provinceName">
        </el-table-column>
        <el-table-column
          label="采购数量"
          align="center"
          prop="planQty">
        </el-table-column>
        <el-table-column
          label="入库数量"
          align="center"
          prop="number"
          width="100">
          <template slot-scope="scope">
            <span v-if="scope.row.checked == false">{{scope.row.number}}</span>
            <el-input v-if="scope.row.checked == true" v-model="scope.row.number" style="width: 50px;" name="edit-input"></el-input>
          </template>
        </el-table-column>
        <el-table-column
          label="差异"
          align="center"
          prop="difference">
        </el-table-column>
        <el-table-column
          label="入库操作"
          align="center">
          <template slot-scope="scope">
            <el-button v-if="!editState && scope.row.checked == false" type="primary" @click="editNumber(scope.row)">编辑</el-button>
            <el-button v-if="editState && scope.row.checked == true" type="success" @click="saveNumber(scope.row)">保存</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-dialog
        title="入库单"
        :visible.sync="dialogVisible"
        style="width: 1700px;margin-left:-340px">
        <div class="dialogcontner">
          <ul class="listconter">
            <li>
              <span>入库单名称:</span>
              <span>{{postData.orderName}}</span>
            </li>
            <li>
              <span>供应商:</span>
              <span>{{postData.supName}}</span>
            </li>
            <li>
              <span>联系人:</span>
              <span>{{postData.topContact}}</span>
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
            border
            height="250">
            <el-table-column
              label="类型"
              align="center"
              prop="materialType"
              width="75">
            </el-table-column>
            <el-table-column
              label="一级类别"
              align="center"
              prop="categoryOneName"
              width="75">
            </el-table-column>
            <el-table-column
              label="二级类别"
              align="center"
              prop="categoryTwoName"
              width="75">
            </el-table-column>
            <el-table-column
              label="品牌名"
              align="center"
              prop="categoryThirdName"
              width="75">
            </el-table-column>
            <el-table-column
              label="材料名"
              align="center"
              prop="materialName"
              width="75">
            </el-table-column>
            <el-table-column
              label="规格"
              align="center"
              width="90"
              prop="specifications">
            </el-table-column>
            <el-table-column
              label="产地"
              align="center"
              prop="provinceName"
              min-width="80">
            </el-table-column>
            <!--<el-table-column-->
              <!--label="报价"-->
              <!--align="center"-->
              <!--prop="purchaseMoney"-->
              <!--width="75">-->
            <!--</el-table-column>-->
            <el-table-column
              label="采购数量"
              align="center"
              prop="planQty"
              width="75">
            </el-table-column>
            <el-table-column
              label="入库数量"
              align="center"
              prop="number"
              width="70">
            </el-table-column>
          </el-table>
        </div>
        <span slot="footer" class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="dialogVisible = false;openUrl();">提交审核</el-button>
        </span>
      </el-dialog>

    </el-col>
  </el-row>
</template>

<script>
  import { addstoragesApi } from 'api/api';
  import { listdata } from 'api/urlConfig';
  import jquery from 'jquery';
  import bus from '../../../utils/bus'
  import smallKeyBoard from '../../../components/keyboard/smallkeyboard'

  export default {
    name: 'purchase',
    components: {smallKeyBoard},
    data() {
      return {
        editState:false,
        centerDialogVisible:true, //选择报价单
        currentPage: 1,  //当前页码
        pagesize: 10,//默认每页数据量
        dialogVisible: false,
        shopIp:"",
        brandIp:"",
        shopDetailId:{},
        articleList:[],
        aboutData:[],
        currentArticle:{},
        docData:[],
        postData:{
          "shopDetailId":"",
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
          "docStkInPlanDetailDoList": []
        }
      };
    },
    computed: {
      shopCart(){
        let list = [];
        this.articleList.forEach(function (food) {
          if(food.number>0){
            list.push(food);
          }
        })
        return list;
      },
      totalPrice:function() {
        let total = 0;
        this.articleList.forEach(function(food){
          if (food.number) {
            total += food.purchaseMoney * food.number;
          }
        })
        return total;
      },
      totalCount:function() {
        let count = 0;
        this.articleList.forEach(function(food){
          if (food.number) {
            count += parseInt(food.number);
            food.difference = food.planQty-food.number;
          }
        })
        return count;
      }
    },
    created(){
      this.postData.supplierId=this.$route.query.supplierId;
      this.postData.supName = this.$route.query.supName;
      this.postData.pmsHeaderId = this.$route.query.pmsHeadId;
      this.postData.orderName = this.$route.query.orderName;
      this.postData.topContact = this.$route.query.topContact;
      this.postData.createrName = this.$route.query.createrName;
      this.postData.shopName="";
      this.postData.orderStatus=11;
      this.postData.auditName="";
      this.postData.totalAmount=this.totalPrice;
      this.getShopDetails();
      this.initialization();
      let that = this;
      bus.$on("edit-input",function (data) {
        that.currentArticle.number = data;
        console.log(data);
      })
    },
    methods: {
      editNumber(item){
        let that = this;
        this.currentArticle = item;
        this.editState = true;
        item.checked = !item.checked;
        console.log(JSON.stringify(item.checked));
        setTimeout(function () {
          bus.$emit("show-keyboard","edit-input");
        },)
      },
      saveNumber(item){
        let that = this;
        this.currentArticle = item;
        this.editState = false;
        item.checked = !item.checked;
        console.log(JSON.stringify(item.checked));
        bus.$emit("show-keyboard","clearText")
      },
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
          url:listdata+'?shopId='+that.shopIp+"&pmsHeadId="+that.postData.pmsHeaderId,
          responseType:'json',
        }).then(function(response){
          that.aboutData=response.data.data;
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
                        temp.number = article.planQty;
                        temp.difference = article.planQty-article.number;
                        temp.checked = false;
                        if(temp.materialType == "INGREDIENTS"){
                          temp.materialType = "主料";
                        }else if(temp.materialType == "ACCESSORIES"){
                          temp.materialType = "辅料";
                        }else if(temp.materialType == "SEASONING"){
                          temp.materialType = "配料";
                        }else{
                          temp.materialType = "物料";
                        }
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
      changeListNumber(item){
        this.currentArticle = item;
        console.log(JSON.stringify(item));
        if(item.number==0){
          item.number++;
          let docPmsPoDetail = new Object();
          docPmsPoDetail.purchaseMoney = item.purchaseMoney;
          docPmsPoDetail.orderDetailStatus = item.orderDetailStatus;
          docPmsPoDetail.materialId = item.id;
          docPmsPoDetail.planQty = item.planQty;
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
          this.postData.docStkInPlanDetailDoList.push(docPmsPoDetail);
        }else{
          item.number++;
          this.postData.docStkInPlanDetailDoList.forEach(function (a) {
            if(a.materialId == item.id){
              a.actQty++;
            }
          })
        }
      },
      formatData(){
        this.postData.shopDetailId = this.shopIp;
      },
      openUrl(){
        let that=this;
        this.articleList.forEach(function (food) {
          if(food.number>0){
            let docPmsPoDetail = new Object();
            docPmsPoDetail.purchaseMoney = food.purchaseMoney;
            docPmsPoDetail.orderDetailStatus = food.orderDetailStatus;
            docPmsPoDetail.materialId = food.id;
            docPmsPoDetail.planQty = food.planQty;
            docPmsPoDetail.actQty = food.number;
            docPmsPoDetail.unitId = food.unitId;
            docPmsPoDetail.unitName = food.unitName;
            docPmsPoDetail.specName = food.specName;
            docPmsPoDetail.specId = food.specId;
            docPmsPoDetail.categoryOneName = food.categoryOneName;
            docPmsPoDetail.categoryThirdName = food.categoryThirdName;
            docPmsPoDetail.categoryTwoName = food.categoryTwoName;
            docPmsPoDetail.cityName = food.cityName;
            docPmsPoDetail.materialName = food.materialName;
            docPmsPoDetail.districtName = food.districtName;
            docPmsPoDetail.materialCode = food.materialCode;
            docPmsPoDetail.measureUnit = food.measureUnit;
            docPmsPoDetail.provinceName = food.provinceName;
            docPmsPoDetail.materialType = food.materialType;
            that.postData.docStkInPlanDetailDoList.push(docPmsPoDetail);
          }
        })
        this.formatData();
        addstoragesApi.addstorages(that.postData).then((response)=>{
          if(response.success){
            that.successmge();
            that.$router.push({ path: '/material/storage'});
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
        let that = this;
        this.articleList.forEach(function (food) {
          if(food.number == 0){
            that.$message({
              message: '入库数量不能为空!',
              type: 'error'
            });
          }else{
            that.dialogVisible = true;
          }
        })
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

<style scoped>
  .hidden-dom {
    display: none;
  }
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
    margin: auto;
    font-size: 16px;
  }
  .listconter li{
    width: 50%;
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

