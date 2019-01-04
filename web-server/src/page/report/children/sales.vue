<template>
  <el-row class="sales">
    <el-row class="tool-bar">
      <el-col :span="10" class="tool-title">
        <h2>{{shopDetails.name}}</h2>
      </el-col>
      <el-col :span="14" class="tool-content">
        <el-date-picker
          disabled
          v-model="reportDate"
          align="right"
          type="date"
          placeholder="选择日期"
          :picker-options="pickerOptions">
        </el-date-picker>
        <el-button type="primary" class="tool-search-btn" style=" background-color: #FFBF34; border: none;">查询</el-button>
      </el-col>
    </el-row>
    <div class="article-sales">
      <p>菜品销量：{{article.totalSales}}</p>
    </div>
    <el-row class="sales-data" :style="{ height: salesDataHeight + 'px' }">


      <el-col :span="5" class="sales-wrapper">
        <el-row class="sales-item" :class="{'sales-item-selected' : index== articleGroupIndex }" v-for="(item,index) in article.articleTypeNameAndSales"
                :key="item.id" @click.native="getArticleType(index,item)" >
          <el-col :span="20">{{item.familyName}}</el-col>
          <el-col :span="4">{{item.count}}</el-col>
        </el-row>
      </el-col>


      <!--第二纵栏-->
      <el-col :span="6" class="sales-wrapper">
        <div id="sales-wrapper-item" style="height: 490px;overflow-y: scroll;">
            <el-row class="sales-item"
                    :class="{'sales-item-selected' : index== articleNameIndex }"
                    v-for="(item,index) in article.articleName"
                    :key="item.id" @click.native="getArticleName(index,item)">
              <el-col :span="20">{{item.articleName}}</el-col>
              <el-col :span="4">{{item.count}}</el-col>
            </el-row>

            <!--<div class="order-page-wrapper">-->
              <!--<div class="pre-page" @click="orderPageOperation(-1)"><span class="el-icon-caret-top"></span></div>-->
              <!--<div class="next-page" @click="orderPageOperation(1)"><span class="el-icon-caret-bottom"></span></div>-->
            <!--</div>-->

          <div class="order-page-wrapper">
              <i class="iconfont icon-arrow-left " style="font-size: 35px;" @click="orderPageOperation(-1)"></i>
              &nbsp;&nbsp;
              <i class="iconfont icon-arrow-right" style="font-size: 35px;" @click="orderPageOperation(1)"></i>
          </div>
          </div>
      </el-col>


      <!--<el-col :span="6" class="sales-wrapper">-->
        <!--<el-row class="sales-item" :class="{'sales-item-selected' : index== articleNameIndex }" v-for="(item,index) in article.articleName" :key="item.id"-->
                <!--@click.native="getArticleName(index,item)">-->
          <!--<el-col :span="20">{{item.articleName}}</el-col>-->
          <!--<el-col :span="4">{{item.count}}</el-col>-->
        <!--</el-row>-->
      <!--</el-col>-->




      <el-col :span="6" class="sales-wrapper" v-if="article.articleType == 2">
        <el-row class="sales-item" :class="{'sales-item-selected' : index== articleTypeIndex }" v-for="(item,index) in article.articleDetails"
                :key="item.id" @click.native="getArticleDetails(index,item)" >
          <el-col :span="20">{{item.itemName}}</el-col>
          <el-col :span="4">{{item.count}}</el-col>
        </el-row>
      </el-col>

      <el-col :span="6" class="sales-wrapper" v-else-if="article.articleType == 3">
        <el-row class="sales-item" :class="{'sales-item-selected' : index== articleTypeIndex } " v-for="(item,index) in article.articleDetails"
                :key="item.id" @click.native="getArticleDetails(index,item)" >
          <el-col :span="20">{{item.itemName}}</el-col>
          <el-col :span="4">{{item.count}}</el-col>
        </el-row>
      </el-col>

      <el-col :span="6" class="sales-wrapper" v-else-if="article.articleType == 4">
        <el-row v-for="(item,index) in article.articleDetails" :key="item.id">
          <el-row class="sales-item"
                  :class="{'sales-item-selected' : index== articleTypeIndex }"
                  @click.native="getArticleDetails(index,item)">
          <el-col :span="20">
            <strong>{{item.name}}</strong>
          </el-col>
          <el-col :span="4">{{item.count}}</el-col>
        </el-row>
          <el-row class="sales-item" v-for="(item,index) in item.data" :key="item.id">
            <el-col :span="20" class="sales-item-sub">{{item.articleName}}</el-col>
            <el-col :span="4">{{item.count}}</el-col>
          </el-row>
        </el-row>


      </el-col>

      <!--<el-col :span="6" class="sales-wrapper"  v-else >-->
        <!--<el-row class="sales-item sales-item-selected">-->
          <!--<el-col :span="20">鸡肉汉堡</el-col>-->
          <!--<el-col :span="4">4</el-col>-->
        <!--</el-row>-->
      <!--</el-col>-->

      <!--<el-col :span="6" class="sales-wrapper">-->
        <!--<el-row class="sales-item-title">-->
          <!--<el-col :span="20">-->
            <!--<strong>套餐属性1</strong>-->
          <!--</el-col>-->
          <!--<el-col :span="4">20</el-col>-->
        <!--</el-row>-->
        <!--<el-row class="sales-item">-->
          <!--<el-col :span="20" class="sales-item-sub">鸡肉汉堡</el-col>-->
          <!--<el-col :span="4">20</el-col>-->
        <!--</el-row>-->
        <!--<el-row class="sales-item">-->
          <!--<el-col :span="20" class="sales-item-sub">红烧牛肉面</el-col>-->
          <!--<el-col :span="4">20</el-col>-->
        <!--</el-row>-->
        <!--<el-row class="sales-item">-->
          <!--<el-col :span="20" class="sales-item-sub">下饭菜</el-col>-->
          <!--<el-col :span="4">20</el-col>-->
        <!--</el-row>-->
        <!--<el-row class="sales-item-title">-->
          <!--<el-col :span="20">-->
            <!--<strong>套餐属性2</strong>-->
          <!--</el-col>-->
          <!--<el-col :span="4">20</el-col>-->
        <!--</el-row>-->
        <!--<el-row class="sales-item">-->
          <!--<el-col :span="20" class="sales-item-sub">鸡肉汉堡</el-col>-->
          <!--<el-col :span="4">20</el-col>-->
        <!--</el-row>-->
        <!--<el-row class="sales-item">-->
          <!--<el-col :span="20" class="sales-item-sub">红烧牛肉面</el-col>-->
          <!--<el-col :span="4">20</el-col>-->
        <!--</el-row>-->
        <!--<el-row class="sales-item">-->
          <!--<el-col :span="20" class="sales-item-sub">下饭菜</el-col>-->
          <!--<el-col :span="4">20</el-col>-->
        <!--</el-row>-->
      <!--</el-col>-->


      <!--<el-col :span="7" class="sales-detail">-->
        <!--<p class="detail-title">菜品1 （套餐）</p>-->
        <!--<p class="detail-content">30天 / 2017-8-28 18:22:12</p>-->
        <!--<br/>-->

        <!--<p class="detail-title">累计销售数量：98</p>-->
        <!--<p class="detail-content">午市累计销售数量：48</p>-->
        <!--<p class="detail-content">晚市累计销售数量：50</p>-->
        <!--<p class="detail-title">累计销售金额：980</p>-->
        <!--<p class="detail-content">午市累计销售金额：480</p>-->
        <!--<p class="detail-content">晚市累计销售金额：500</p>-->
        <!--<hr/>-->

        <!--<p class="detail-title">累计被点评次数：234</p>-->
        <!--<el-row class="detail-content">-->
          <!--<el-col :span="12">累计点赞：170</el-col>-->
          <!--<el-col :span="12">点赞占比：35%</el-col>-->
        <!--</el-row>-->
        <!--<el-row class="detail-content">-->
          <!--<el-col :span="12">累计投诉：10</el-col>-->
          <!--<el-col :span="12">投诉占比：3%</el-col>-->
        <!--</el-row>-->
        <!--<hr/>-->

        <!--<p class="detail-title">手机端累计被浏览查看次数：234</p>-->
        <!--<p class="detail-title">手机端累计不同消费总数：234</p>-->
        <!--<hr/>-->

        <!--<p class="detail-title">高频次组合购买产品</p>-->
        <!--<p class="detail-content">NO.1 下饭菜</p>-->
        <!--<p class="detail-content">NO.2 蛋炒饭</p>-->
        <!--<p class="detail-content">NO.3 菌菇粉</p>-->
      <!--</el-col>-->
    </el-row>
  </el-row>
</template>

<script>
  import { articleSales ,articleByFamilyId ,getOrderItemByArticleId } from 'api/api';
  export default {
    name: 'sales',
    data () {
      return {
        shopDetails:{},
        article:{
          totalSales:0,                 //菜品总数量
          articleTypeNameAndSales:[],   //菜品种类及总数
          articleName:[],                //菜品名称及总数
          articleType:1 ,                // 1:单品，2:老规格,3:新规格4:套餐
          articleDetails:[],             //菜品详情销量
          articlePackage:{
            packageName:'',
            packageCount:0
          }
        },
        articleGroupIndex: 0,
        articleNameIndex: 0,
        articleTypeIndex: 0 ,
        pickerOptions: {
          shortcuts: [{
            text: '今天',
            onClick(picker) {
              picker.$emit('pick', new Date());
            }
          }, {
            text: '昨天',
            onClick(picker) {
              const date = new Date();
              date.setTime(date.getTime() - 3600 * 1000 * 24);
              picker.$emit('pick', date);
            }
          }, {
            text: '一周前',
            onClick(picker) {
              const date = new Date();
              date.setTime(date.getTime() - 3600 * 1000 * 24 * 7);
              picker.$emit('pick', date);
            }
          }]
        },
        reportDate : new Date(),
        salesDataHeight: 0
      };
    },
    mounted : function () {
      var self = this;
      self.salesDataHeight = document.body.clientHeight - 210;
      self.shopDetails = JSON.parse(sessionStorage.getItem('shopDet'));

      articleSales({reportDate:self.reportDate},function (data) {
        self.article.totalSales = data.articleTotalSales.count;
        self.article.articleTypeNameAndSales = data.articleTypeNameAndSales;
        self.getArticleType(self.articleGroupIndex,data.articleTypeNameAndSales[self.articleGroupIndex]);
      });
      console.log('----');
    },
    methods: {
      getArticleType(index,data){
        var self = this;
        self.articleGroupIndex = index;
        self.articleNameIndex = 0;
        self.articleTypeIndex = 0;

        articleByFamilyId({reportDate:self.reportDate,familyId:data.article_family_id},function (data) {
            self.article.articleName = data;
            self.getArticleName(self.articleNameIndex,data[self.articleNameIndex]);
        });
      },
      getArticleName(index,data){
        var self = this;
        self.articleNameIndex = index;
        self.articleTypeIndex = 0;

        getOrderItemByArticleId({reportDate:self.reportDate,articleId:data.articleId,articleType:data.article_type},function (result) {
          self.article.articlePackage.packageCount = self.$lodash.sum(self.$lodash.map(result, 'count'));

          self.article.articleDetails = result;
          if (data.article_type === 1) { // 单品 ， 老规格， 新新规
            if (data.has_unit.length > 1) {  // 老规格
              self.article.articleType = 2;
              console.log("老规格");

            } else if (data.newUnit) { // 新规格
              self.article.articleType = 3;

              console.log("新规格");

            } else { // 普通单品
              self.article.articleType = 1;
              console.log("普通单品");
            }
          } else if (data.article_type === 2) { // 套餐

            var arr = self.$lodash.uniq(self.$lodash.map(result, 'attrName'));

            var results =[];
            arr.forEach(function (item) {
              var obj = {};
              obj['name'] = item;
              obj['data'] = self.$lodash.partition(result, ['attrName', item])[0];
              obj['count'] = self.$lodash.sum(self.$lodash.map(obj.data, 'count'));
              results.push(obj)
            });

            self.article.articleDetails = results;

            self.article.articleType = 4;
            console.log("套餐");
          } else {
            console.log("无效");
          }

        });
      },
      getArticleDetails(index,data){
        var self = this;
        self.articleTypeIndex = index;
      },

      // 第二纵栏的
      orderPageOperation (operation) {

        var salesWrapperItem = document.getElementById("sales-wrapper-item");
        console.log("operation",operation);
        console.log("orderDetailWrapper", salesWrapperItem)
        if(operation == 1){  // 下一页
          salesWrapperItem.scrollTop += salesWrapperItem.clientHeight;
        }else{  //  上一页
          salesWrapperItem.scrollTop -= salesWrapperItem.clientHeight;
        }
      },
    }
  };
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
  .sales{
    height: 100%;
    width: 100%;
  }
  .tool-bar{
    height: 60px;
    line-height: 60px;
    font-weight: bold;
    border-bottom: 2px solid #E9E9E9;
  }
  .tool-title{
    padding-left: 20px;
  }
  .tool-search-btn{
    margin-left: 30px;
    background-color: #FFBF34;
  }
  .el-button--primary{
    background-color : #ef5350;
    border-color: #ef5350;
    padding: 10px 30px;
  }
  .article-sales{
    padding-left: 20px;
    font-size: 18px;
    font-weight: bold;
    height: 50px;
    line-height: 50px;
    border-bottom: 2px solid #E9E9E9;
  }
  .sales-wrapper{
    font-weight: bold;
    /*border-right: 1px solid #E9E9E9;*/
    /*border-bottom: 1px solid #E9E9E9;*/
    height: 100%;
  }
  .sales-item{
    line-height: 40px;
    padding-left: 20px;
    /*border-bottom: 1px solid #E9E9E9;*/
  }
  .sales-item-title{
    line-height: 45px;
    padding-left: 20px;
    font-weight: bold;
    height: 45px;
  }
  .sales-item-sub{
    padding-left: 10px
  }
  .sales-item-selected{
    background-color: #DFDFDF;
    font-weight: bold;
  }
  .sales-detail{
    padding: 0px 10px;
  }
  .detail-title{
    height: 30px;
    line-height: 30px;
    font-weight: bold;
  }
  .detail-content{
    font-size: 14px;
    height: 22px;
    line-height: 22px;
  }


  .order-page-wrapper{
    position: absolute;
    bottom: 15px;

    font-size: 30px;
    left: 27%;
    z-index: 10;
  }
  .order-page-wrapper > .pre-page{
    display: flex;
    justify-content: center;
    align-items: center;
    width: 50px;
    height: 50px;
    background-color: #000;
    color: #FFF;
    border-radius:50%;
    margin-bottom: 50px;
    cursor: pointer;
    opacity: 0.6;
  }
  .order-page-wrapper > .next-page{
    display: flex;
    justify-content: center;
    align-items: center;
    width: 50px;
    height: 50px;
    background-color: #000;
    color: #FFF;
    border-radius:50%;
    cursor: pointer;
    opacity: 0.6;
  }

</style>
