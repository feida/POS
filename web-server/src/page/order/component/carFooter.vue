<template>
  <div class="car-footer">
    <el-row type="flex" justify="space-between" class="order-operate-button"
            style="margin-left: 18px;margin-right: 18px;">
      <el-col :span="5">
        <button class="operate-article-button" style="padding: 0;" v-if="isEditArticle == true" @click="editArticle(currentCarTableRow)">编辑
        </button>
        <button class="operate-article-button" style="padding: 0;" v-else @click="saveArticle(currentCarTableRow)">保存
        </button>
      </el-col>
      <el-col :span="5">
        <button class="operate-article-button" style="padding: 0;" @click="deleteArticle(currentCarTableRow)">删除
        </button>
      </el-col>
      <el-col :span="5">
        <button class="operate-article-button" @click="addArticle(currentCarTableRow)">+</button>
      </el-col>
      <el-col :span="5">
        <button class="operate-article-button" @click="cutArticle(currentCarTableRow)">-</button>
      </el-col>
    </el-row>

    <el-row class="order-payment">
      <el-col :span="10">
        菜品：<span class="order-payment-num">{{totalCount}}</span> 项
      </el-col>
      <el-col :span="14">
        总计：<span class="order-payment-num">¥ {{ formatMoney(totalPrice) }}</span>
      </el-col>
    </el-row>
    <el-row style="text-align: center;" type="flex" justify="space-around" class="order-operate-button">
      <el-col :span="12" style="text-align: center;">
        <el-button style="width: 70%;" class="operate-button" @click="cancel"
                   v-if="orderInfo.distribution_mode_id == 3">取消
        </el-button>
        <el-button style="width: 70%;" class="operate-button" @click="goBack" v-else>返回</el-button>
      </el-col>
      <el-col :span="12" style="text-align: center;">
        <el-button style="width: 70%;" class="operate-button operate-button-push-order" @click="checkedOrder"
                   :disabled="countDown>0" v-if="shopDet.allow_first_pay == 0 || orderInfo.distribution_mode_id == 3">
          结算{{countDown}}
        </el-button>
        <el-button style="width: 70%;" class="operate-button operate-button-push-order" @click="checkedOrder"
                   :disabled="countDown>0" v-else>下单
        </el-button>
      </el-col>
    </el-row>
  </div>
</template>

<script>
  export default {
    name: "carFooter",
    data() {
      return {
        isEditArticle: true,
        editArticleInfo: {},
        currentIndex:null,
        focusState:true, // 是否聚焦

        keyboardShow:false, // 是否显示键盘
        tempCurrentCarRowPrice:0,

        radio: null,
        orderPaymentList: [], // 订单支付项列表
        refundCashMoneyState: false, // 退菜现金返还
        refundRemainMoneyState: false, // 退菜红包返还
        isFans: false, // 是否开启粉丝价 0 粉丝价 1 原价
        refundCommand:'', // 退菜口令
        isUseServicePrice: true, //是否开启服务费
        showDetails: false,
        hasChangeOrderItem: [],
        changeOrderItem: [],
        changeCount: 0,
        refundMoney: 0, //退的总钱数
        refundAllCount: 0, //退的总个数
        refundOrderList: 0, // 退掉的数组封装
        itemId: '',
        refundList:[],
        mealFeeNumber: 0, // 每一项菜品中所需要的餐盒的数量
        mealAllNumber: 0, // 总的餐盒的数量
        checkAllFlag: false,
        delFlag: false,
        refundMealAllNumber: 0,// 退掉的总的 餐盒个数
        refundMealAllPrice: 0,  // 退掉的总的 餐盒钱数
        isMealFee: false,
        orderLength: '',
        orderId: '',
        pageLoading: false,
        orderInfo: {},
        carTableHeight: 0,
        familyMap: {},
        currentFamilyId: '',
        articleMap: {},
        car: [],
        checkBox:{},
        selectPageButton: 0,
        currentCarTableRow: {
          index: null,
          info: {}
        },
        changeOrder: {
          isClick: false,
          isCheck: false,
          isCheckOne: false,
          flags: false,
          currentIndex: 0
        },
        pageButtonList: ['上一页', '下一页'],
        totalCount: 0,
        totalPrice: 0,
        articleWeightPackageDialog: {
          show: false,    // 称重包弹层
          title: '',      // 规格标题
          article: {},    // 当前菜品
          price: null    //  新规格，价格以菜品表价格为基础(tb_article.price)，与 具体属性的差价相加(tb_article_unit_detail.price)
        },

        changeOrderDialog: {
          show: false,
        },
        page: {
          pageIndex: 0,
          contentHeight: 0,//一共的高度
          onePageHeight: 0,//每一页的高度
          pageSize: 0,//页数
          allPageContentList: {},//所有的内容
          onePageContentList: {}//每一页展示的内容
        },
        attrWrapperScroll: null,
        tableOrder: {
          afterPay: 0,
          distributionModeId: 0,
          tableNumber: 0,
          customerCount: 0,
          remark: '加菜'
        },
        familyWrapperHeight: 0,
        selectCurrentPages: 2,
        dialogVisible: false,
        refundRemarks: [],
        refundRemark: null,
        weixinPaymentMap:{},
        posPaymentMap:{},
        refundMoneyMessage:'暂无消息', // 退菜提醒，比如，退了多少钱
        refund: {},
        localRefund: {},
        shopDet: {},
        shopModel:'',
        mustChoiceAttr: [],
        loading:false,
        curentArticlePricleDialog: {},
        countDown: '',
        addCar: false,
      };
    },
    methods: {
      saveArticle: function() {
        if(this.editArticleInfo.article.count == 0) {
          return this.$message.warning("当前菜品数量不能编辑为0")
        }
        if(this.editArticleInfo.article.checked == true) {
          this.focusState = false
          this.isEditArticle = !this.isEditArticle;
          this.currentIndex = this.isEditArticle.index;
          this.editArticleInfo.article.checked == false;
        }
        this.keyboardShow = false;
      },

      deleteArticle: function(row) {
        var that = this;
        this.$confirm('是否删除', row.info.name || '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(() => {
          for(let index in that.car) {
            let item = that.car[index];
            if( item.status == 3 && item.checked == true) {
              that.car.splice(index, 1)
              that.$store.commit("deleteArticleFromCar", item)
            }
          }
        }).catch(() => {
        });
      },

      addArticle: function() {
        let articleType = this.editArticleInfo.article.type
        if (articleType == 8 || articleType == 2 || articleType == 5 || articleType == 3) {
          return this.$message.warning(`${this.editArticleInfo.article.name} 无法直接累加`);
        }
        if (this.editArticleInfo.article.checked) {
          this.focusState = true
          for (let index in this.car) {
            let item = this.car[index];
            if (item.status == 3 && item.checked == true) {
              item.count++;
              item.price = this.editArticleInfo.price * item.count
              this.$store.commit('addArticleToCar', item)
            }
          }

        }
      },

      cutArticle: function() {
        for (let index in this.car) {
          let item = this.car[index];
          if(item.status == 3 && item.checked == true) {
            if(item.count <= 1) return this.$message.warning("菜品数量无法继续减少，请选择删除操作");
            this.$store.commit('cutArticleFromCar', item)
            item.count --;
            item.price = this.editArticleInfo.price * item.count
          }
        }
      },

      editArticle:function() { // 编辑购物车中菜品信息
        let articleType = this.editArticleInfo.article.type;
        if (articleType == 8 || articleType == 2 || articleType == 5 || articleType == 3) {
          return this.$message.warning(`${this.editArticleInfo.article.name} 无法直接编辑`);
        }
        if(this.editArticleInfo.article.checked) {
          this.focusState = true
          this.isEditArticle = !this.isEditArticle;
          this.currentIndex = this.isEditArticle.index;
          setTimeout(function () {
            bus.$emit("show-keyboard","editArticleCount")
          },1)
        }
      },

      // 键盘事件
      changeInput: function (val) {
        if(val == "") {
          val = 0
        }
        for (let index in this.car) {
          let item = this.car[index];
          if(item.checked == true && item.status == 3) {
            // let family = this.familyMap[item.articleFamilyId]
            // let article = this.articleMap[item.id]
            // family.count = Math.floor(val);
            // article.count = Math.floor(val);
            this.$store.commit("changeInput", item, val)
            item.count = +val;
            item.price = this.editArticleInfo.price * val;
            // if (val > article.current_working_stock) {
            //   return this.$message.warning(`【 ${article.name }】 最多能买 ${article.current_working_stock} 份`)
            // }
            // if (val == 0) {
            //   return this.$message.warning(`最少为一份`);
            // }
          }
        }
      },

      formatMoney: function(money){
        return this.$utils.formatMoney(money || 0);
      },

      goBack: function() {
          if (this.car.length && this.car) return this.$router.go(-1)
          this.$confirm('购物车新增的餐品将会被  清空  ，确定返回么?', '提示', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
          }).then(() => {  this.$router.go(-1) }).catch(() => {})
      },

      checkedOrder: function(toPayOrder){
        let that = this;
        let orderItem = [];
        for (let item of this.car) {
          if (item.state === 0) orderItem.push(item);
        }
        if(orderItem.length == 0) return this.$message.warning("请先添加菜品~");
        that.pushOrder(toPayOrder)
        that.countDown = 8;
        setInterval(() => {
          that.countDown -= 1
          if (that.countDown <= 0) {
            return that.countDown = '';
          }
        }, 1000)
      },

    },
  }
</script>

<style scoped>
  .left-wrapper {
    height: 100%;
    position: relative;
    z-index: 1;
    background-color: #FFFFFF;
    box-shadow: 0 0px 20px 0 rgba(0, 0, 0, .25), 0 0 6px 0 rgba(0, 0, 0, .04);
  }
  .car-footer{
    position: absolute;
    bottom:0px;
    width: 100%;
    border-top: 5px solid #eee;
    /*margin-top: 5px;*/
    background-color: #fff;
  }
  .order-payment {
    font-size: 1em;
    /*width:100%;*/
    height: 40px;
    line-height: 40px;
    /*padding-left: 7px;*/
    color: black;
    border-bottom: 1px dashed grey;
    margin-left: 18px;
    margin-right: 18px;
  }
  .order-payment-num{
    font-size: 20px;
    color: #ef5350;
    line-height: 24px;
  }

  .operate-article-button {
    display: inline-block;
    line-height: 1;
    white-space: nowrap;
    cursor: pointer;
    margin: 5px 0px 0px 0px;
    padding: 10px 15px;
    border:none;
    border-radius: 5px;
    color: #666666;
    background-color: #FFFFFF;
    height: 40px;
    width: 100%;
    font-size: 16px;
    font-weight: bold;
    border: 1px solid black;
  }

  .order-operate-button{
    font-size: 1em;
    /*width:100%;*/
    height: 50px;
    color: #fff;

  }
  .operate-button{
    display: inline-block;
    line-height: 1;
    white-space: nowrap;
    cursor: pointer;
    margin: 5px 0px 0px 0px;
    padding: 10px 15px;
    border:1px solid black;
    background: #FFFFFF;
    border-radius: 5px;
    color: #666666;
    height: 40px;
    width: 90px;
    font-size: 16px;
    font-weight: bold;
  }
  .operate-button-push-order{
    background: #FFBF34;
    border-radius: 5px;
    border: none;
    color: #ffffff;
  }
  .right-wrapper {
    height: 100%;
    background-color: #F6F6F6;
    /*border-left: 5px solid #F2F2F2;*/
  }

  .article-wrapper {
    height: 100%;
    /*padding-bottom: 50px;*/
    background-color: #eeeeee;
  }

  .article-info {
    height: 100%;
    overflow-y: auto;
    /*overflow-x: hidden;*/
    /*margin-top: 10px;*/
    padding: 10px;
  }

  /** 菜品信息  滚动条  begin  **/
  /*#familyWrapper{*/
  /*overflow-y:scroll;*/
  /*}*/
  /*#familyWrapper::-webkit-scrollbar {!*滚动条整体样式*!*/
  /*width: 2px;     !*高宽分别对应横竖滚动条的尺寸*!*/
  /*height: 2px;*/
  /*}*/
  /*#familyWrapper::-webkit-scrollbar-thumb {!*滚动条里面小方块*!*/
  /*border-radius: 5px;*/
  /*-webkit-box-shadow: inset 0 0 5px rgba(0,0,0,0.2);*/
  /*background: rgba(0,0,0,0.2);*/
  /*}*/
  /*#familyWrapper::-webkit-scrollbar-track {!*滚动条里面轨道*!*/
  /*-webkit-box-shadow: inset 0 0 5px rgba(0,0,0,0.2);*/
  /*border-radius: 0;*/
  /*background: rgba(0,0,0,0.1);*/
  /*}*/
  /** 菜品信息  滚动条  end  **/

  .family-wrapper {
    height: 100%;
    /*border: 5px solid #F2F2F2;*/
    overflow-y: auto;
    /*overflow-x: hidden;*/
    background-color: #FFFFFF;
    text-align: center;
    position: relative;
  }

  .family-item {
    width: 100%;
    /*margin-tops: 5px;*/
    /*margin-bottom: 10px;*/
    padding: 5px;
    padding-top: 15px;
    padding-bottom: 15px;
    font-size: 18px;
    line-height: 20px;
    white-space: normal;
    position: relative;
    border: none;
  }
  .family-item-active {
    background: #EEEEEE;
    border-left: 5px solid #ffbf34!important;
    border: none;
    color: #333333;;
    border-radius: 0;
  }
  .pageButton {
    width: 100%;
    bottom: 0px;
    position: absolute;
    bottom: 55px;
  }
  .page-button-item {
    width: 80%;
    /*background-color: #FFBF34;*/
    text-align: center;
    margin-bottom: 10px;
    padding-left: 15px;
    color: #1f2d3d;
    border: 1px solid #666;
  }
  .pageButtonActive{
    background-color: #ffbf34;
    color: #fff!important;
    border: none!important;
  }
  .bottom-tool {
    position: absolute;
    bottom: 0px;
    width: 100%;
    height: 60px;
    line-height: 60px;
    padding-left: 10px;
    /*border-top: 1px solid #d1dbe5;*/
    /*box-shadow: 0 -2px 4px 0 rgba(0, 0, 0, .12), 0 0 6px 0 rgba(0, 0, 0, .04);*/
    background-color: #F6F6F6;
  }

  .panel-title {
    height: 50px;
    line-height: 50px;
    font-size: 20px;
    font-weight: bold;
    text-align: center;
    background-color: #FFFFFF;
    color: #333333;
    border-bottom: 5px solid #F2F2F2;
    margin-bottom: 10px;
  }
  .panel-content {

    height: 40px;
    line-height: 40px;
    font-size: 14px;
    color: black;
    padding-left: 5px;
    padding-bottom: 2em;
    border-bottom: 3px dashed transparent;
    background: linear-gradient(white, white) padding-box,
    repeating-linear-gradient(-45deg, #ccc 0, #ccc 0.25em, white 0, white 0.75em);
  }

  /* 遮罩层 */
  .mask-layer {
    /*height:100%;*/
    width: 100%;
    position: absolute;
    background-color: black;
    opacity: 0.5;

  }

  .car-total {
    height: 50px;
    line-height: 50px;
    border-top: 5px solid #F2F2F2;
    font-size: 22px;
    font-weight: bold;
    text-align: center;
  }

  .article-card {
    margin-bottom: 7px;
    width: 119px;
    cursor: pointer;
  }

  .title-wrapper {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 80px;
  }
  .el-col-21 {
    width: 85.5%;
  }
  .el-col-3 {
    width: 14.5%;
  }

  .article-name {
    /*width: 100%;*/
    font-size: 32px;
    text-align: center;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 3;
    overflow: hidden;
  }

  .article-count {
    position: relative;
    top: 0px;
    right: 0px;
  }

  .el-badge__content.is-fixed {
    top: 10px;
    right: 20px;
  }

  .el-badge__content {
    height: 20px;
    line-height: 20px;
  }

  .family-badge {
    top: 10px !important;
    right: 20px !important;
  }

  .dialog-title-warp {
    height: 48px;
    line-height: 48px;
    text-align: center;
  }

  .dialog-title {
    font-family: "SourceHanSansCN-Medium";
    font-size: 22px;
    color:#666;
    font-weight: bold;
    vertical-align: middle;
  }

  .dialog-content {
    max-height: 400px;
    overflow-y: auto;
    margin:0px 20px;
    background-color: #eee;
    padding: 0px 20px;
  }
  .dialog-content::-webkit-scrollbar {display:none}
  .dialog-dashed{
    padding: 1em;
    border-top: 2px dashed transparent;
    background: linear-gradient(white,white) padding-box,
    repeating-linear-gradient(-45deg,#ccc 0, #ccc 0.25em,white 0,white 0.75em);
    margin-bottom: 10px;
  }
  /*     滚动条   begin     */

  .scrollbar::-webkit-scrollbar {
    /*    定义滚动条宽高及背景，宽高分别对应横竖滚动条的尺寸   */
    width: 10px;
    height: 10px;
  }

  .scrollbar::-webkit-scrollbar-track {
    /*    定义滚动条的轨道，内阴影及圆角   */
    background-color: #C0CCDA;
    /*border-radius:6px;*/
  }

  .scrollbar::-webkit-scrollbar-thumb {
    /*  定义滑块，内阴影及圆角   */
    background-color: #475669;
    /*border-radius:6px;*/
  }

  /*     滚动条   end     */

  /*    购物车 table 样式    begin   */

  .car-table {
    width: 100%;
    font-size: 14px;
    /*border: 1px solid #dfe6ec;*/
  }

  .car-table-title-tr {
    background-color: #eef1f6;
    height: 40px;
    font-size: 17px;
    color: #9B9B9B;
  }

  .car-table-body-tr {
    text-align: center;
    height: 40px;
    cursor: pointer;
  }

  .car-push-name {
    color: #20A0FF;
  }

  .car-remove-name {
    color: #FF4949;
  }

  .car-new-name {
    /*color: #13CE66;*/
    color: black;
  }

  .car-table-body-tr td,
  th {
    /*border-top: 1px solid #dfe6ec;*/
    border-bottom: 1px dashed #dfe6ec;
  }

  .car-table-body-tr-selected {
    background-color: #E5E9F2;
  }

  .car-table-body-package-tr {
    text-align: center;
    height: 40px;
    background-color: #FFFFFF;
  }

  /*.car-table-body-package-tr td:last-child{*/

  /*border-bottom: 1px solid #dfe6ec;*/

  /*}*/

  .car-table td {
    /*border-bottom: 1px solid #dfe6ec;*/
  }

  /*    购物车 table 样式    end   */

  /*加减样式*/

  .count-article {
    width: 30px;
    height: 30px;
    line-height: 30px;
    color: #fff;
    border-radius: 50%;
    background-color: #58B7FF;
    display: inline-block;
  }

  .red-circle {
    position: absolute;
    top: 15px;
    left: 0;
    width: 10px;
    height: 10px;
    background: red;
    -webkit-border-radius: 50%;
    border-radius: 50%;
  }

  .blue-circle {
    position: absolute;
    top: 15px;
    left: 0;
    width: 10px;
    height: 10px;
    background: #032EFF;
    -webkit-border-radius: 50%;
    border-radius: 50%;
  }

  .yellow-circle {
    position: absolute;
    top: 15px;
    left: 0;
    width: 10px;
    height: 10px;
    background: #ff4d51;
    -webkit-border-radius: 50%;
    border-radius: 50%;
  }


  /** 订单详情  滚动条  begin  **/
  /*#order-detail-wrapper::-webkit-scrollbar {*/
  /*width: 4px;*/
  /*height: 4px;*/
  /*}*/
  /*#order-detail-wrapper::-webkit-scrollbar-thumb {*/
  /*border-radius: 5px;*/
  /*-webkit-box-shadow: inset 0 0 5px rgba(0,0,0,0.2);*/
  /*background: rgba(0,0,0,0.2);*/
  /*}*/
  /*#order-detail-wrapper::-webkit-scrollbar-track {*/
  /*-webkit-box-shadow: inset 0 0 5px rgba(0,0,0,0.2);*/
  /*border-radius: 0;*/
  /*background: rgba(0,0,0,0.1);*/
  /*}*/
  /** 订单详情  滚动条  end  **/

  .el-button--primary {
    background-color: #000 !important;
    color: #fff!important;
    border: none;
  }

  /** 菜品信息 滚动条  **/
  #articleInfo{
    overflow-y:scroll;
  }
  #articleInfo::-webkit-scrollbar {/*滚动条整体样式*/
    width: 4px;     /*高宽分别对应横竖滚动条的尺寸*/
    height: 4px;
  }
  #articleInfo::-webkit-scrollbar-thumb {/*滚动条里面小方块*/
    border-radius: 5px;
    -webkit-box-shadow: inset 0 0 5px rgba(0,0,0,0.2);
    background: rgba(0,0,0,0.2);
  }
  #articleInfo::-webkit-scrollbar-track {/*滚动条里面轨道*/
    -webkit-box-shadow: inset 0 0 5px rgba(0,0,0,0.2);
    border-radius: 0;
    background: rgba(0,0,0,0.1);
  }
  /** 菜品信息 滚动条  **/

  .pageButton {
    width: 100%;
    /*margin-top: 140px;*/
    position: absolute;
    bottom: 0;
  }

  .re-food-tag {
    display: inline-block;
    height: 40px;
    line-height: 40px;
    padding-left: 20px;
    padding-right: 20px;
    background-color: darkgrey;
    border-radius: 5px;
  }
  .order-page-wrapper{
    position: absolute;
    top:30%;
    right: 30px;
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

  .article-page-wrapper{
    position: fixed;
    top:37%;
    right: 118px;
    z-index: 10;
  }
  .article-page-wrapper > .pre-page{
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
  .article-page-wrapper > .next-page{
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

  .change-order-content {
    margin: 0 auto;
    width:100%;
    text-align: center;
  }
  .change-order-content > li:nth-child(2n) {
    background-color: #F8F8F8;
  }
  .change-order-content > li > span{
    display: inline-block;
  }
  .change-order-content:nth-of-type(1) > li > span{
    height: 50px;
    line-height: 50px;
    font-size: 18px;
    font-weight: bold;
  }
  .change-order-content:not(:first-child) > li > span{
    height: 50px;
    line-height: 50px;
    font-size: 16px;
  }

  .packate-title {
    display: inline-block;
    /*margin: 0 0 5px 3px;*/
    margin-top: 20px;
    font-size: 18px;
    color: #666;
  }
  .package-content-wrap{
    width:100%;
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: flex-start;
    align-items: center;
  }
  .package-items {
    height: 84px;
    /*line-height: 84px;*/
    font-size: 1.1em;
    text-align: center;
    margin:15px 10px 10px 3px;
    padding:0px 20px;
    border-radius: 5px;
    color: #666;
    background-color: #fff;
    cursor: pointer;
    position: relative;
    padding-top: 20px;

  }
  .webpackPackage-items {
    font-size: 1.1em;
    font-weight: bolder;
    text-align: center;
    margin:15px 10px 15px 3px;
    padding:5px 20px;
    border-radius: 10px;
    color: #757575;
    background-color: #f6f6f6;
    cursor: pointer;
    /*position: relative;*/
  }

  .not-sell{
    top: 0px !important;
    right: 20px !important;
    z-index: 10;
  }
  .package-item-click{
    color: #ffbf34;
    /*background-color: #ffbf34;*/
    border: 1px solid #ffbf34;
  }

  .refund-command {
    border: 1px solid black;
    /*width: 200px;*/
  }


  .car-title {
    width: 100%;
    color: #666;
    vertical-align: middle;
  }
  .car-title .car-title-item {
    font-size: 14px;
    display: inline-block;
    padding-top: 1%;
    padding-bottom: 1%;
  }
  .car-content {
    /*border-top: dashed 1px black;*/
  }
  .car-content-item {
    font-size: 14px;
    word-wrap: break-word;
    color: #666;
  }

  .hidden-dom{
    display: none;
  }
  .details-item {
    margin-top: 8px;
    font-size: 14px;
    word-wrap: break-word;
    color: #666;
  }
  .details-button {
    border: 1px solid black;
    color: black;
  }

  .details-button-active {
    border: none;
    background-color: #ffbf34;
    color: #FFFFFF;
  }
  /** 地方反复反反复复  **/
  .el-dialog__wrap >>> .el-dialog__body {
    padding: 0px;
  }
  .el-dialog__wrap  >>> .el-dialog__header {
    padding: 0px;
  }

  .el-dialog__wrap  >>> .el-dialog__headerbtn {
    position: absolute;
    top: 15px;
    right: 15px;
  }
</style>
