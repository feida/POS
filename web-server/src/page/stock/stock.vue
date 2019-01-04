<template>
  <!--<el-row style="height: 100%;" v-loading.fullscreen.lock="pageLoading" element-loading-text="正在初始化 . . ."> </el-row>-->
  <el-row class="stock" v-loading.fullscreen.lock="fullscreenLoadingObj.show"
          :element-loading-text="fullscreenLoadingObj.msg">
    <el-row class="tool-bar">
      <el-col :span="8" class="bar-title">
        <p style="width: 100px;margin: 0 auto;">餐品详情</p>
      </el-col>
      <el-col :span="16" class="bar-content">
        <!--<span class="content-info">菜品剩余总量：{{total_current_working_stock}}</span>-->
        <el-button :class="choiceStockCode == null ? 'bar-btn-all':'bar-btn-offline'" @click="choiceStockCode = null">全&nbsp;&nbsp;部</el-button>
        <el-button :class="choiceStockCode == 1 ? 'bar-btn-all':'bar-btn-offline'" @click="choiceStockCode = 1" style="width: 77px;">已下架</el-button>
        <el-button :class="choiceStockCode == 2 ? 'bar-btn-all':'bar-btn-offline'" @click="choiceStockCode = 2" style="width: 77px;">已沽清</el-button>
      </el-col>
    </el-row>
    <el-row class="stock-content">
      <el-col :span="8" class="article-preview">
        <el-row class="article-detail-wrapper" id="articleDetailWrapper">
          <!--套餐-->
          <el-col :span="24" v-if="articleType(currentArticle) == 'PACKAGE_ARTICLE'">
            <h2 class="article-package-title">{{currentArticle.name}}</h2>
            <div v-for="item in stockMealAttributionList" class="article-package-meal-list">
              <p class="article-package-meal-attr" v-if="item.choice_type == 0">
                {{item.name}}&nbsp;&nbsp;（必选{{item.choice_count}}）
              </p>
              <p class="article-package-meal-attr" v-else>
                {{item.name}}&nbsp;&nbsp;（任选）
              </p>
              <el-row class="article-package-meal-item" v-for="attr in item.mealItemsInfo" :key="attr.id">
                <el-col :span="20"><span class="meal-item-style">{{attr.name}}</span></el-col>
                <el-col :span="4"><span class="meal-item-style">{{attr.current_working_stock}}</span></el-col>
              </el-row>
            </div>
          </el-col>
          <!--单品 老规格-->
          <el-col :span="24" v-else-if="articleType(currentArticle) == 'OLD_UNIT_PRICE'">
            <template v-if="stockArticlePriceList.length > 0">
              <p class="article-package-title">规格组合数：{{stockArticlePriceList.length}}</p>
              <el-row v-for="(item,index) in stockArticlePriceList" class="article-price-item" :key="item.id">
                <el-col :span="8" class="article-price-item-title">
                  <span>{{item.name}}</span>&nbsp;&nbsp;
                  <el-input class="stock-edit-input" name="stock-input" v-model="item.current_working_stock"
                            v-if="editStock == true && item.id == currentIndex">

                  </el-input>
                  <label v-else>{{item.current_working_stock}}</label>
                </el-col>
                <el-col :span="16" class="article-price-item-btns">
                  <el-button v-if="item.current_working_stock <= 0" type="danger">
                    已沽清
                  </el-button>
                  <el-button class="gray-btn" @click="articlePriceEmpty(item)" v-else>
                    沽&nbsp;&nbsp;清
                  </el-button>
                  <el-button :class="(editStock == true && item.id == currentIndex) ? 'green-btn' : 'gray-btn'" @click="getArticlePriceStock(item)" name = "stock-input">
                    {{(editStock == true && item.id == currentIndex) ? '保存' : '编辑'}}
                  </el-button>
                </el-col>
              </el-row>
            </template>
            <div v-else class="article-content">暂无规格</div>
          </el-col>
          <!--单品 新规格-->
          <el-col :span="24" v-else-if="currentArticle.article_type === 1 && !!currentArticle.unit_id">
            <h2 class="article-package-title">红烧牛肉面</h2>
            <div class="article-unit-item">
              <p>
                味道
              </p>
              <span class="attr-tag">甜</span>
              <span class="attr-tag">辣</span>
            </div>
          </el-col>
          <!--普通 单品-->
          <el-col :span="24" v-else>
            <div v-if="currentIndex" class="article-content" style="overflow: hidden;">
              <img src="../../assets/shaolei_img/symbols-meiyoushangpin.png" alt="">
              <div style="font-size: 18px;">点击右侧菜品查看详情哦</div>
            </div>
            <div v-else class="article-content">
              <img src="../../assets/shaolei_img/symbols-meiyoushangpin.png" alt="">
              <div style="font-size: 18px;">点击右侧菜品查看详情哦</div>
            </div>
          </el-col>
        </el-row>
        <div class="page-tool" style="text-align: center; margin-right: 0;" v-if="articleDetailPage.totalPage > 1">
          <div class="pre-page" @click="detailPage(0)">
            <i class=" el-icon-caret-left" ></i>
          </div>
          <span style="font-size: 30px;color: #666;">{{articleDetailPage.currentPage}} / {{articleDetailPage.totalPage}}</span>
          <div class="next-page" @click="detailPage(1)">
            <i class="el-icon-caret-right" ></i>
          </div>
        </div>
      </el-col>
      <el-col :span="13" class="show-article">
        <div id="articleWrapper">
          <!-- 全部库存 -->
          <div v-if="searchKey!=''">
            <el-row class="show-article-list" :class="(article.id == currentIndex) ? 'select-article' : ((article.activated == 0) ? 'sold-out' : '')" v-for="(article,index) in articleList" :key="index"
                    v-if="choiceStockCode == null" @click.native="choseArticle(article)">
              <el-col :span="2">
                <el-tag>{{getArticleType(article)}}</el-tag>
              </el-col>


              <el-col :span="8" :class="(index==currentIndex) ? 'select-article-font': 'noSelect-article-font'">{{article.name}}</el-col>
              <el-col :span="4" class="article-item-stock">
                <el-input class="stock-edit-input" v-model="articleStock.newStock=article.current_working_stock" name="stock-input" v-if="editStock == true && article.id == currentIndex"></el-input>
                <label :class="(index==currentIndex) ? 'select-article-font': 'noSelect-article-font'" v-else>{{article.current_working_stock}}</label>
              </el-col>


              <el-col :span="10" style="text-align: right; padding-right: 10px;">
                <el-button v-if="!(article.article_type==2 || article.has_unit !== ' ')" :disabled="(article.article_type == 2 || article.has_unit !== ' ')"
                           :class="(editStock == true && article.id == currentIndex) ? 'green-btn' : 'gray-btn'"
                           @click.stop="getArticleStock(article, $event)">
                  {{(editStock == true && article.id == currentIndex) ? '保存' : '编辑'}}
                </el-button>


                <el-button :disabled="article.article_type==2 || article.has_unit !== ' '" v-if="article.is_empty" type="danger">
                  已沽清
                </el-button>
                <el-button class="gray-btn" :disabled="article.article_type==2 || article.has_unit !== ' '" v-else
                           @click="getArticleIsEmpty(article.id,article.is_empty,article.has_unit)">
                  沽&nbsp;&nbsp;清
                </el-button>
                <el-button
                  :class="article.activated == 1 ? 'gray-btn': 's-btn'"
                  @click="getArticleUpOrDown(article.id, article.activated)">
                  {{article.activated == 0 ? '上架' : '下架'}}
                </el-button>
                <el-button v-if="article.article_type == 2 && !article.is_empty" @click="setSaleState(article)">{{saleState}}</el-button>
              </el-col>
            </el-row>
          </div>


          <div v-else>
            <el-row class="show-article-list"
                    :class="(article.id == currentIndex) ? 'select-article' : ((article.activated == 0) ? 'sold-out' : '')"
                    v-for="(article, index) in articleList" :key="article.id"
                    v-if="choiceStockCode == null"
                    @click.native="choseArticle(article)">
              <el-col :span="2">
                <el-tag>{{getArticleType(article)}}</el-tag>
              </el-col>


              <el-col :span="8" :class="(index==currentIndex) ? 'select-article-font': 'noSelect-article-font'">{{article.name}}</el-col>
              <el-col :span="4" class="article-item-stock">
                <el-input class="stock-edit-input" v-model="articleStock.newStock=article.current_working_stock" name="stock-input" v-if="editStock == true && article.id == currentIndex"></el-input>
                <label :class="(index==currentIndex) ? 'select-article-font': 'noSelect-article-font'" v-else>{{article.current_working_stock}}</label>
              </el-col>


              <el-col :span="10" style="text-align: right; padding-right: 10px;">
                <el-button v-if="!(article.article_type==2 || article.has_unit !== ' ')" :disabled="(article.article_type==2 || article.has_unit !== ' ')"
                           :class="(editStock == true && article.id == currentIndex) ? 'green-btn' : 'gray-btn'"
                           @click.stop="getArticleStock(article, $event)">
                  {{(editStock == true && article.id == currentIndex) ? '保存' : '编辑'}}
                </el-button>


                <el-button :disabled="article.article_type==2||article.has_unit !== ' '" v-if="article.is_empty" type="danger">
                  已沽清
                </el-button>
                <el-button class="gray-btn" :disabled="article.article_type==2||article.has_unit !== ' '" v-else
                           @click="getArticleIsEmpty(article.id,article.is_empty,article.has_unit)">
                  沽&nbsp;&nbsp;清
                </el-button>
                <el-button
                  :class="article.activated == 1 ? 'gray-btn': 's-btn'"
                  @click="getArticleUpOrDown(article.id, article.activated)">
                  {{article.activated == 0 ? '上架' : '下架'}}
                </el-button>
                <el-button v-if="article.article_type == 2 && !article.is_empty" @click="setSaleState(article)">{{saleState}}</el-button>
              </el-col>


            </el-row>
          </div>
          <!-- 已下架库存 -->
          <el-row class="show-article-list" :class="{'select-article' : article.id == currentIndex }" v-for="(article,index) in articleList" :key="article.id"
                  v-if="choiceStockCode == 1 && article.activated == 0" @click.native="choseArticle(article)">
            <el-col :span="2">
              <el-tag>{{getArticleType(article)}}</el-tag>

            </el-col>
            <el-col :span="8" :class="(index==currentIndex) ? 'select-article-font': 'noSelect-article-font'">{{article.name}}</el-col>
            <el-col :span="4" class="article-item-stock">
              <el-input class="stock-edit-input" v-model="articleStock.newStock=article.current_working_stock" name="stock-input" v-if="editStock == true && article.id == currentIndex"></el-input>
              <label :class="(index==currentIndex) ? 'select-article-font': 'noSelect-article-font'" v-else>{{article.current_working_stock}}</label>
            </el-col>
            <el-col :span="10">
              <el-button :disabled="(article.article_type==2|| article.has_unit !== ' ')"
                         :class="(editStock == true && article.id == currentIndex) ? 'green-btn' : 'gray-btn'"
                         @click.stop="getArticleStock(article,$event)">
                {{(editStock == true && article.id == currentIndex) ? '保存' : '编辑'}}
              </el-button>
              <el-button :disabled="article.article_type==2||article.has_unit !== ' '" v-if="article.is_empty" type="danger">
                已沽清
              </el-button>
              <el-button class="gray-btn" :disabled="article.article_type==2||article.has_unit !== ' '" v-else
                         @click="getArticleIsEmpty(article.id,article.is_empty,article.has_unit)">
                沽&nbsp;&nbsp;清
              </el-button>
              <el-button
                :class="article.activated==1 ? 'gray-btn': 's-btn'"
                @click="getArticleUpOrDown(article.id, article.activated)">
                {{article.activated == 0 ? '上架' : '下架'}}
              </el-button>
            </el-col>
          </el-row>

          <!-- 已沽清库存 -->
          <el-row class="show-article-list" :class="{'select-article' : article.id == currentIndex }" v-for="(article,index) in articleList" :key="article.id"
                  v-if="choiceStockCode == 2 && article.is_empty" @click.native="choseArticle(article)">
            <el-col :span="2">
              <el-tag>{{getArticleType(article)}}</el-tag>
            </el-col>
            <el-col :span="8" :class="(index==currentIndex) ? 'select-article-font': 'noSelect-article-font'">{{article.name}}</el-col>
            <el-col :span="4" class="article-item-stock">
              <el-input class="stock-edit-input" v-model="articleStock.newStock = article.current_working_stock" name="stock-input" v-if="editStock == true && article.id == currentIndex"></el-input>
              <label :class="(index==currentIndex) ? 'select-article-font': 'noSelect-article-font'" v-else>{{article.current_working_stock}}</label>
            </el-col>
            <el-col :span="10">
              <el-button :disabled="(article.article_type==2|| article.has_unit !== ' ')"
                         :class="(editStock == true && article.id == currentIndex) ? 'green-btn' : 'gray-btn'"
                         @click.stop="getArticleStock(article,$event)">
                {{(editStock == true && article.id == currentIndex) ? '保存' : '编辑'}}
              </el-button>
              <el-button :disabled="article.article_type==2||article.has_unit !== ' '" v-if="article.is_empty" type="danger">
                已沽清
              </el-button>
              <el-button class="gray-btn" :disabled="article.article_type==2||article.has_unit !== ' '" v-else
                         @click="getArticleIsEmpty(article.id,article.is_empty,article.has_unit)">
                沽&nbsp;&nbsp;清
              </el-button>
              <el-button
                :class="article.activated==1 ? 'gray-btn': 's-btn'"
                @click="getArticleUpOrDown(article.id,article.activated)">
                {{article.activated == 0 ? '上架' : '下架'}}
              </el-button>
            </el-col>
          </el-row>
        </div>
        <div class="page-tool" >
          <!--<el-button style="vertical-align: center; background-color: black;color: #999; float: left; margin-left: 10px; margin: 5px;" @click="syncAllArticleStock()">-->
          <!--同步库存-->
          <!--</el-button>-->
          <div class="pre-page" @click="articlePages(0)">
            <i class=" el-icon-caret-left" ></i>
          </div>
          <span style="font-size: 30px;color: #666;">{{articlePage.currentPage}} / {{articlePage.totalPage}}</span>
          <div class="next-page" @click="articlePages(1)">
            <i class="el-icon-caret-right" ></i>
          </div>
        </div>
      </el-col>
      <el-col :span="3" class="family-wrapper">
        <ul :style="{ height: familyWrapperHeight + 'px' }" style="overflow-y: hidden" id="familyWrapper">
          <li v-for="family in familyList" @click="setFamilyId(family.id)">
            <el-button size="large" class="family-item" :type="currentFamilyId == family.id ? 'primary' : ''">
              {{family.name}}
            </el-button>
          </li>
        </ul>
        <ul class="pageButton">
          <li v-for="(item,index) in pageButtonList">
            <el-button size="large" class=" page-button-item"
                       :class="selectCurrentPages == index ? 'page-button-item-active' : ''"
                       @click="familyPages(index)">{{item}}
            </el-button>
          </li>
        </ul>
      </el-col>
    </el-row>
    <!--<keyboard :show="currentInput ? true : false" @change="changeInput" @close="closeKeyBoard"></keyboard>-->
  </el-row>

</template>

<script>
  import {
    listArticleInfo,
    getUnitList,
    getArticleUpOrDown,
    getArticleIsEmpty,
    getArticlePriceIsEmpty,
    getArticleStock,
    getArticlePriceStock,
    listArticleStockInfo,
    getMealByArticleId,
    getArticleBySearchKey
  } from 'api/api';
  import bus  from "../../utils/bus"
  import {formatDate} from '../../utils/generalUtil';
  import mixin from '../../mixins/mixin'
  import keyboard from './components/keyboard.vue';
  import { mapGetters, mapActions } from 'vuex';
  export default {
    name: 'order',
    mixins: [mixin],
    components : {
      keyboard
    },
    data() {
      return {
        choiceStockCode: null, // 这个用来控制 全部 已下架 已售罄 页面展示
        shopInfo: {},
        clickButtonState: {
          outOfStock: '手动沽清'
        },
        articlePriceIsEmpty: {//老规格子项手动沽清

        },
        state: 'true',
        currentId: '',
        editStock: false,//编辑库存
        articleStock: {//库存参数
          oldStock: 0,
          newStock: 0
        },
        articlePriceStock: {//老规格 库存编辑
          oldStock: 0,
          newStock: 0
        },
        currentArticle: {},
        currentIndex: 0,
        pageLoading: false,
        // familyList: [],
        familyMap: {},
        currentFamilyId: null,
        total_current_working_stock:0,
        articleMap: {},
        currentFamily: null,
        selectPageButton: 0,
        articleShelf: {},//上下架
        outOfStock: {},//沽清
        page: {
          pageIndex: 0,
          contentHeight: 0,//一共的高度
          onePageHeight: 0,//每一页的高度
          pageSize: 0,//页数
          allPageContentList: {},//所有的内容
          onePageContentList: {}//每一页展示的内容
        },
        attrWrapperScroll: null,
        pageButtonList: ['上一页', '下一页'],
        selectCurrentPages: '2',
        familyWrapperHeight: 0,
        articlePage: {
          currentPage: 1,
          totalPage: 1
        },
        articleDetailPage: {
          currentPage: 1,
          totalPage: 1
        },
        currentInput : null,
        searchKey: '',
        tempCount: 0,
        tempArticle: {},
        allArticleList: [],

        fullscreenLoadingObj: {show: false, msg: "正在更新数据 ..."},
        saleState: '可售'
      };
    },
    computed: {
      ...mapGetters({
        addCarArticle: 'addCarArticle',
        familyList: 'familyList',
        articleList: 'articleList',
        unitList: 'unitList',
        articlePriceList: 'articlePriceList',
        articlePriceDialog: 'articlePriceDialog',
        articleUnitDialog: 'articleUnitDialog',
        packageDialog: 'packageDialog',
        stockUnitList: 'stockUnitList',
        stockArticlePriceList: 'stockArticlePriceList',
        stockMealAttributionList: 'stockMealAttributionList'
      })
    },
    created () {
      this.$store.dispatch('getFamilyList');
    },
    mounted() {
      let that = this
      // this.getFamilyList();
      this.familyWrapperHeight = document.body.clientHeight - 280;

      let shopData = JSON.parse(sessionStorage.getItem('shopDet'));
      this.shopInfo = shopData;
      bus.$on('searchKey',function (searchKey) {
        if (searchKey.indexOf("'") !== -1 || searchKey.indexOf("’") !== -1) return;
        console.log("searchKey", searchKey)
        that.searchKey = searchKey.toLowerCase();
        getArticleBySearchKey(that.searchKey, (result) => {
          that.$store.commit('setArticleList', result);
        })
      })
      bus.$on('stockText',function (value) {
        that.tempArticle.current_working_stock = value;
      })
    },
    beforeDestroy(){
      bus.$off("searchKey");
      bus.$off("stockText");
      bus.$off("syncArticleStockProgress");
      bus.$off("syncArticleStockError");
      bus.$off("syncArticleStockSuccess");
    },
    watch: {
      currentFamily: function () {
        this.currentIndex = null;
        this.currentArticle = {};
        this.$nextTick(function () {
          var articleWrapper = document.getElementById("articleWrapper");
          this.articlePage.currentPage = 1;
          this.articlePage.totalPage = Math.ceil(articleWrapper.scrollHeight / articleWrapper.clientHeight);
        });
      },

      familyList: function(val) {
        this.$store.dispatch('getArticleListByFamilyId', val[0].id || '');
        this.currentFamilyId = this.familyList[0].id
      },
    },

    methods: {

      setFamilyId (familyId) {
        this.currentFamilyId = familyId
        this.$store.dispatch('getArticleListByFamilyId', familyId || '');
      },
      // 同步库存
      syncAllArticleStock() {
        this.fullscreenLoadingObj.show = true;
        window.pomelo.notify("pos.webSocketHandler.syncArticleStock");
        bus.$on("syncArticleStockProgress", (progress) => {
          this.fullscreenLoadingObj.msg = "正在同步库存 ...  " + progress + "%";
        });
        bus.$on("syncArticleStockError", (errorMsg) => {
          this.fullscreenLoadingObj.show = false;
          this.$notify({
            title: "Resto+",
            message: errorMsg,
            type: "error",
            duration: 2500,
          });
        });
        bus.$on("syncArticleStockSuccess", () => {
          this.fullscreenLoadingObj.show = false;
          this.$notify({
            title: "Resto+",
            message: "菜品库存更新成功",
            type: "success",
            duration: 2500,
          });
        });
        setTimeout(()=>{this.fullscreenLoadingObj.show = false},120 * 1000)
      },

      choseArticle(currentArticle) { // 选择菜品
        if (this.editStock) return
        this.currentInput = null;// 清空当前选中的文本，并关闭虚拟键盘
        this.currentIndex = currentArticle.id;
        this.currentArticle = currentArticle;
        if (currentArticle.article_type === 1) {
          if (currentArticle.article_unit == 2) {  // 老规格
            this.$store.dispatch('getArticlePrice', currentArticle);
          } else if (currentArticle.article_unit == 5) { // 新规格

          } else if (currentArticle.open_catty == 1) {

          } else { // 普通单品

          }
        } else {
          this.$store.dispatch('getMeal', currentArticle)
        }


        this.$nextTick(function () {
          var articleDetailWrapper = document.getElementById("articleDetailWrapper");
          this.articleDetailPage.currentPage = 1;
          this.articleDetailPage.totalPage = Math.ceil(articleDetailWrapper.scrollHeight / articleDetailWrapper.clientHeight);
        })
      },

      getArticleUpOrDown(currentArticleId, activated) {
        this.articleShelf.currentArticleId = currentArticleId;
        this.articleShelf.activated = activated == true ? 0 : 1;
        getArticleUpOrDown(this.articleShelf,  () => {
          this.$store.commit('setArticleUpOrDown',  this.articleShelf)
          this.$message('操作成功~');
        })
      },

      // 沽清
      getArticleIsEmpty(id, empty, hasUnit) {
        this.outOfStock.id = id;
        this.outOfStock.empty = 1;
        this.outOfStock.hasArticlePrice = (hasUnit == "" || null) ? 0 : 1;
        this.$socket.articleEmpty(id, (result) => {
          getArticleIsEmpty(this.outOfStock,  (data) => {
            this.$store.commit('setArticleSoldOutStatus', this.outOfStock)
            this.$message('沽清成功~');
          })
        });

      },

      // 单品老规格沽清
      articlePriceEmpty(item) {
        var id = item.id,articleId = item.article_id, currentWorkingStock = item.current_working_stock;
        this.articlePriceIsEmpty = {
          id: id,
          articleId: articleId,
          originalStock: currentWorkingStock
        };
        getArticlePriceIsEmpty(this.articlePriceIsEmpty,  data => {
          // this.hasChangeStateForEvery();
          this.$message('沽清成功~');
          item.current_working_stock = 0 ;
        })
        // this.$socket.articleEmpty(id, (result) =>{
        //   getArticlePriceIsEmpty(this.articlePriceIsEmpty, function (data) {
        //     that.hasChangeStateForEvery();
        //     that.$message('沽清成功~');
        //     item.current_working_stock = 0 ;
        //   })
        // });
      },

      //编辑库存
      getArticleStock(article, ev) {
//        ev.cancelBubble = false;
        this.tempArticle = article;
        this.currentIndex = article.id;
        this.editStock = !this.editStock;

        if(this.editStock){
          //选中当前对象，调出虚拟键盘
          bus.$emit("show-keyboard","stock-input")
          this.currentInput = article;
          this.articleStock.oldStock = this.currentInput.current_working_stock;
        }

        let that = this;
        if (!this.editStock) {  // 保存操作
          bus.$emit("show-keyboard","")
          bus.$emit("clearValue",false)
          // 数据验证
          if(!/^([1-9]\d*|[0]{1,1})$/.test(this.articleStock.newStock)){
            this.$message.error('库存不能小于 0 ');
            article.current_working_stock = this.articleStock.oldStock;
            return;
          }
          //  本地更改
          this.articleStock = {
            id: article.id,
            count: this.articleStock.newStock
          };
          getArticleStock(this.articleStock,function (data) {
            that.$message('编辑成功~');
            // that.hasChangeStateForEvery();
            that.currentInput = null;
            that.$store.commit("setArticleEdit", that.articleStock)
            // 推送至远程  库存编辑 老规格不能右边编辑库存，子项可以
            // var remoteDate = {
            //   type: "edit",
            //   id: article.id, //菜品id
            //   count: that.articleStock.count, //编辑的数量
            // };
            that.$socket.editStock(article.id, that.articleStock.count);
          })
        }
      },
      // 老规格 库存编辑
      getArticlePriceStock(articlePrice) {
        this.tempArticle = articlePrice;
        this.editStock = !this.editStock;
        this.currentIndex = articlePrice.id;

        if (this.editStock) { //  编辑
          bus.$emit("show-keyboard","stock-input")
          this.articlePriceStock.oldStock = articlePrice.current_working_stock;
          this.currentInput = articlePrice;
        }
        if (!this.editStock) {  //  保存
          // 数据验证
          if(!/^([1-9]\d*|[0]{1,1})$/.test(articlePrice.current_working_stock)){
            this.$message.error('库存不能小于 0 ');
            articlePrice.current_working_stock = this.articlePriceStock.oldStock;
            return;
          }
          //格式化 数据类型
          articlePrice.current_working_stock = parseInt(articlePrice.current_working_stock);
          // 封装数据
          this.articlePriceStock.newStock = articlePrice.current_working_stock;
          this.articlePriceStock.id = articlePrice.id;
          this.articlePriceStock.articleId = articlePrice.article_id;
          this.articlePriceStock.sumCount = this.articlePriceStock.newStock - this.articlePriceStock.oldStock;

          //本地数据 老规格，编辑库存
          let that = this;
          getArticlePriceStock(this.articlePriceStock, function (data) {
            that.$message('编辑成功~');
            that.currentInput = null;
            that.$store.commit("setArticlePriceEdit", that.articlePriceStock)
            that.$socket.editStock(articlePrice.id, that.articlePriceStock.newStock);
          })
        }
      },

      setSaleState (article) {
        getMealByArticleId(article.id, mealAttributionList => {
          let mealList = mealAttributionList
          mealList = mealList.filter(attrList => attrList.choice_type == 0);
          let minNumber = 0;

          minNumber = mealList[0].mealItemsInfo[0].current_working_stock;
          mealList.map(attrList => {
            attrList.mealItemsInfo.map(item => {
              if (minNumber == 0) minNumber = item.current_working_stock;
              if (item.current_working_stock < minNumber && item.current_working_stock != 0) minNumber = item.current_working_stock;
            })
          })
          console.log("将空间的开发阶段",article.id, minNumber)
          this.$socket.editStock(article.id, minNumber)
        })


      },

      //  菜品分页
      articlePages(pageNumbers) {
        var articleWrapper = document.getElementById("articleWrapper");
        switch (pageNumbers) {
          case 0:     // 上一页
            this.articlePage.currentPage > 1 && --this.articlePage.currentPage;
            articleWrapper.scrollTop -= articleWrapper.clientHeight;
            break;
          case 1:     //  下一页
            this.articlePage.currentPage < this.articlePage.totalPage && ++this.articlePage.currentPage;
            articleWrapper.scrollTop += articleWrapper.clientHeight;
            break;
        }
      },

      //菜品分类分页
      familyPages(pageNumbers) {
        this.selectCurrentPages = pageNumbers;
        var articleInfo = document.getElementById("familyWrapper");
        switch (pageNumbers) {
          case 0:
            articleInfo.scrollTop -= articleInfo.clientHeight;
            break;
          case 1:
            articleInfo.scrollTop += articleInfo.clientHeight;
            break;
        }
      },

      //菜品详情分页
      detailPage(pageNumbers) {
        var articleDetailWrapper = document.getElementById("articleDetailWrapper");
        switch (pageNumbers) {
          case 0:     // 上一页
            this.articleDetailPage.currentPage > 1 && --this.articleDetailPage.currentPage;
            articleDetailWrapper.scrollTop -= articleDetailWrapper.clientHeight;
            break;
          case 1:     //  下一页
            this.articleDetailPage.currentPage < this.articleDetailPage.totalPage && ++this.articleDetailPage.currentPage;
            articleDetailWrapper.scrollTop += articleDetailWrapper.clientHeight;
            break;
        }
      },
      //去掉所有空格
      Trim(str, is_global) {
        var result;
        result = str.replace(/(^\s+)|(\s+$)/g, "");
        if (is_global.toLowerCase() == "g") {
          result = result.replace(/\s/g, "");
        }
        return result;
      },
      changeInput (val) {
        this.currentInput.current_working_stock = val;
      },
      closeKeyBoard (){
        this.editStock = false;
        this.currentInput.current_working_stock = this.articlePriceStock.oldStock;
        this.currentInput = null;
      }
    }
  }
  ;
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
  .el-col-3 {
    width: 9.5%;
  }
  .el-col-13 {
    width: 57.16669%;
  }
  .el-button+.el-button{
    width:70px;
  }
  .stock{
    height: 100%;
  }
  .tool-bar{
    height: 60px;
    line-height: 60px;
    background-color: #ffffff;
  }
  .bar-title{
    padding-left: 10px;
    font-size: 22px;
    font-weight: bold
  }
  .bar-content{
    padding-left: 10px;
    font-size: 22px;
    font-weight: bold;
    text-align: right;
    border-left: 4px solid #eee;
    padding-right: 15px
  }
  .content-info{
    color: #757575;
    margin-right: 30px;
    font-weight: bold;
    font-size: 20px;
  }
  .bar-btn-offline{
    font-family: 'SourceHanSansCN-Medium';
    font-size: 16px;
    font-weight: bold;
    background-color: #fff;
    border: 1px solid #333;
    color: #333;
    border-radius: 5px
  }
  .bar-btn-all{
    font-family: 'SourceHanSansCN-Medium';
    font-size: 16px;
    font-weight: bold;
    background-color: #FFBF34;
    /*border: none;*/
    color: #FFFFFF;
    border-radius: 5px
  }
  .bar-btn-empty{
    font-size: 20px;
    font-weight: bold;
    background-color: #e5545c;
    border-color: #e5545c;
    color: #FFFFFF;
    border-radius: 10px
  }
  .stock-content{
    border-top: 4px solid #eee;
    background-color: #FFFFFF;
    height: 100%
  }
  .article-preview{
    height: 100%;
    padding-bottom: 113px;
    background-color: #FFF
  }
  .article-detail-wrapper{
    overflow-y: auto;
    height: 100%;
  }
  .article-package-title{
    margin-left: 10px;
    font-size: 24px;
    margin-top: 10px;
  }
  .article-package-meal-list{
    margin:0 20px;
    border-bottom: 1px dashed #E0E0E0;
  }
  .article-package-meal-attr{
    height: 44px;
    line-height: 44px;
    font-size: 18px;
    color: #666;
    text-align: center;
  }
  .article-package-meal-item{
    height: 40px;
    line-height: 40px;
  }
  .meal-item-style {
    font-size: 16px;
    color: #666;
  }
  .article-price-item{
    margin: 10px;
    border-bottom: 1px solid #C5C5C5;
    padding-bottom: 10px;
  }
  .article-price-item-title{
    height: 36px;
    line-height: 36px;
  }
  .article-price-item-btns{
    text-align: right;
    padding-right: 5px;
  }
  .stock-edit-input{
    display: inline-block;
    width: 60px;
  }
  .article-unit-item{
    padding-left: 10px;
    border-bottom: 1px solid #C5C5C5;
    padding-bottom: 10px
  }
  .article-unit-item > p {
    height: 50px;
    line-height: 50px;
    margin-top: 10px;
    font-weight: bold;
    font-size: 20px
  }
  .page-tool{
    height: 53px;
    line-height: 53px;
    font-size: 30px;
    text-align: right;
    margin-right: 10px;
  }
  .page-tool > i{
    /*font-size: 40px;*/
  }
  .page-tool > span{
    font-size: 30px;
  }
  .family-wrapper {
    height: 100%;
    margin-left: -1px;
    margin-top: 1px;
    /*border: 5px solid #F2F2F2;*/
    overflow-y: hidden;
    overflow-x: hidden;
    text-align: center;
    position: relative;
  }
  .family-item {
    width: 100%;
    /*margin-top: 5px;*/
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
  .page-button-item {
    width: 80%;
    /*background-color: #FFBF34;*/
    text-align: center;
    margin-bottom: 10px;
    padding-left: 15px;
    color: #1f2d3d;
    border: 1px solid #666;
  }

  .page-button-item-active {
    background-color: #ffbf34 ;
    color: #fff;
    border: none;
  }
  /*.family-item:hover {*/
  /*border-color: #CCB96B;*/
  /*color: #CCB96B;*/
  /*}*/
  .show-article {
    border-left: 4px solid #eee;
    padding-bottom: 113px;
    height: 100%;
  }
  .show-article-list {
    width: 100%;
    padding: 0px 5px;
    line-height: 60px;
    cursor: pointer;
    border-bottom: 3px solid #eee;
  }
  .article-item-stock{
    /*padding-right: 10px;*/
    /*margin-left: -5px;*/
    /*margin-right: 5px;*/
  }
  #articleWrapper{
    overflow-y: scroll;
    height: 100%;
  }
  .meal-attr {
    font-size: 18px;
    font-weight: bold;
    margin: 10px;
  }

  .meal-attr-list {
    /*display: inline-block;*/
    padding-left: 40px;
  }

  .select-article {
    background-color: #f4f5f9;
  }
  .select-article-font {
    color: #333;
    font-weight: bold;
  }
  .noSelect-article-font {
    color: #666;
    /*font-weight: bold;*/
  }
  .sold-out {
    background-color: #eee;
  }

  hr {
    width: 90%;
    margin-left: 0px;
    height: 1px;
    color: #e7e7e7;
  }

  .article-button {
    font-family: 宋体;
    background-color: #c5c5c5;
  }

  .article-content {
    color: #999999;
    /*font-size: 50px;*/
    font-weight: bold;
    text-align: center;
    margin-top: 35%;
  }
  .article-content > img {
    width: 200px;
    height: 200px;
  }
  .show-xiajia {
    background-color: #53B3E5 !important;
    color: #fff;
    border: none;
  }

  .gray-btn {
    /*color: #000000;*/
    /*background-color: #C5C5C5;*/
    color: #666;
    border: 1px solid #666;
    background-color: #fff;
  }

  .gray-btn:hover {
    color: #000000;
    background-color: #C5C5C5;
    border-color: #646464;
  }

  .s-btn {
    color: #FFFFFF;
    background-color: black;
    border-color: black;
  }


  .green-btn {
    color: #FFFFFF;
    /*background-color: #13ce66;*/
    background-color: #FFBF34;
  }

  .green:hover {
    color: #FFFFFF;
    background-color: #13ce66;
    border-color: #13ce66;
  }

  .el-button--primary {
    color: #333333;
    border-left: 5px solid #FFBF34;
    background-color: #EEEEEE ;
    border-radius: 0px;
  }
  .family-item-active {
    background: #EEEEEE;
    border-left: 5px solid #ffbf34!important;
    border: none;
    color: #333333;;
    border-radius: 0;
  }


  /** 菜品信息  滚动条  begin  **/
  #articleWrapper{
    overflow-y:scroll;
  }
  #articleWrapper::-webkit-scrollbar {/*滚动条整体样式*/
    width: 4px;     /*高宽分别对应横竖滚动条的尺寸*/
    height: 4px;
  }
  #articleWrapper::-webkit-scrollbar-thumb {/*滚动条里面小方块*/
    border-radius: 5px;
    -webkit-box-shadow: inset 0 0 5px rgba(0,0,0,0.2);
    background: rgba(0,0,0,0.2);
  }
  #articleWrapper::-webkit-scrollbar-track {/*滚动条里面轨道*/
    -webkit-box-shadow: inset 0 0 5px rgba(0,0,0,0.2);
    border-radius: 0;
    background: rgba(0,0,0,0.1);
  }
  /** 菜品信息  滚动条  end  **/


  /** 菜品分类  滚动条  begin  **/
  #familyWrapper{
    overflow-y:scroll;
  }
  #familyWrapper::-webkit-scrollbar {/*滚动条整体样式*/
    width: 4px;     /*高宽分别对应横竖滚动条的尺寸*/
    height: 4px;
  }
  #familyWrapper::-webkit-scrollbar-thumb {/*滚动条里面小方块*/
    border-radius: 5px;
    -webkit-box-shadow: inset 0 0 5px rgba(0,0,0,0.2);
    background: rgba(0,0,0,0.2);
  }
  #familyWrapper::-webkit-scrollbar-track {/*滚动条里面轨道*/
    -webkit-box-shadow: inset 0 0 5px rgba(0,0,0,0.2);
    border-radius: 0;
    background: rgba(0,0,0,0.1);
  }
  /** 菜品分类  滚动条  end  **/

  .pageButton {
    width: 100%;
    /*margin-top: 140px;*/
    position: absolute;
    bottom: 55px;
  }

  .attr-tag {
    background-color: #E7E7E7;
    display: inline-block;
    padding: 2px 25px;
    height: 30px;
    line-height: 22px;
    font-size: 18px;
    color: #000;
    border-radius: 154px;
    box-sizing: border-box;
    border: 1px solid transparent;
    white-space: nowrap;
  }

  .el-button {
    padding: 10px 10px;
  }

  .pre-page{
    display: inline-block;
    width: 45px;
    height: 45px;
    color: #666;
    border-radius:50%;
    border: 1px solid #666;
    text-align: center;
    cursor: pointer;
  }
  .pre-page i{
    line-height: 45px;
    display: block;
    margin-left: -4px;
  }
  .next-page{
    display: inline-block;
    width: 45px;
    height: 45px;
    color: #666;
    border-radius:50%;
    border: 1px solid #666;
    text-align: center;
    cursor: pointer;
  }
  .next-page i{
    line-height: 45px;
    display: block;
    margin-left: 4px;
  }
</style>
