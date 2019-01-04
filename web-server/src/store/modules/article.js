import {
  getFamilyList,
  getArticleListByFamilyId,
  getUnitListByArticleId,
  getArticlePriceListByArticleId,
  getMealByArticleId,
} from '../../api/api'

const state = {
  familyList: [],
  articleList: [],
  currentFamily:{},
  currentArticle: {},
  articlePriceList:[],
  mustChoiceAttr: [],
  familyId: '',
  isFans: false,
  articlePriceDialog: { // 老规格最终价格 以规格品为主
    show: false,
    title: '',
    article: {},
    articlePriceList:[],
    price: null
  },
  articleUnitDialog: { // 新规格
    show: false,
    title: '',
    article: {},
    unitList: [],
    price: null,
  },
  packageDialog: {
    show: false,    // 套餐弹层
    title: '',      // 套餐标题
    article: {},    // 当前菜品
    mealAttributionList:[],
    price: null    //  套餐，价格以菜品表价格为基础(tb_article.price)，与 具体属性的差价相加(tb_meal_item.price_dif)
  },
  addCarArticle: {},
  tempAttr: [],
}

const getters = {
  addCarArticle:      state => state.addCarArticle,
  familyList:         state => state.familyList,
  articleList:        state => state.articleList,
  articlePriceList:   state => state.articlePriceList,
  articlePriceDialog: state => state.articlePriceDialog,
  articleUnitDialog:  state => state.articleUnitDialog,
  packageDialog:      state => state.packageDialog,
  mustChoiceAttr:     state => state.mustChoiceAttr,
}

const actions = {

  getFamilyList ({ commit }) {
    getFamilyList(familyList => commit('setFamilyList', familyList))
  },

  getArticleListByFamilyId({ commit }, familyId) {
    if (familyId == '' || familyId == 'undefined') familyId = '';
    getArticleListByFamilyId(familyId, articleList => commit('setArticleList', articleList))
  },

  getUnitListByArticleId({ commit }, currentArticle) { // 新规格
    getUnitListByArticleId(currentArticle.id, unitList => commit('setUnitList', {unitList, currentArticle}))
  },

  getArticlePriceListByArticleId({ commit }, currentArticle) { // 获取当前老规格规格列表
    getArticlePriceListByArticleId(currentArticle.id, articlePriceList => commit('setArticlePriceList', {articlePriceList, currentArticle}))
  },

  getMealByArticleId({ commit }, currentArticle) {
    getMealByArticleId(currentArticle.id, mealAttributionList => commit('setMealAttributionList', {currentArticle, mealAttributionList}))
  }

}

const mutations = {
  increateArticleCount (state, currentArticle) {
    currentArticle.count ++;
    state.familyList.filter(item => item.id == currentArticle.article_family_id).map(item => item.count++);
  },

  deleteArticleFromCar (state, currentArticle) {
    state.articleList.filter(item => item.id == currentArticle.id).map(item => item.count = 0)
    state.familyList.filter(item => item.id == currentArticle.articleFamilyId).map(item => item.count = 0);
  },

  addArticleToCar (state, currentArticle) {
    state.articleList.filter(item => item.id == currentArticle.id).map(item => item.count ++)
    state.familyList.filter(item => item.id == currentArticle.articleFamilyId).map(item => item.count ++);
  },

  cutArticleFromCar (state, currentArticle) {
    state.articleList.filter(item => item.id == currentArticle.id).map(item => item.count --)
    state.familyList.filter(item => item.id == currentArticle.articleFamilyId).map(item => item.count --);
  },

  changeInput (state, currentArticle, val) {
    state.articleList.filter(item => item.id == currentArticle.id).map(item => item.count = val)
    state.familyList.filter(item => item.id == currentArticle.articleFamilyId).map(item => item.count = val);
  },


  setFamilyList (state, familyList) {
    familyList.map(item => item.count = 0)
    state.familyList = familyList;
  },

  setArticleList (state, articleList) {
    articleList.map(item => {
      item.count = 0
      if(item.discount && item.discount < 100) {
        item.price = (item.price * item.discount / 100).toFixed(2);
      } else if(!state.isFans && item.fans_price) {

        item.price = item.fans_price;
      }
    })
    state.articleList = articleList;
  },

  setUnitList (state, {unitList, currentArticle}) {
    state.articleUnitDialog.show     = true; // 打开 新规格 弹窗
    state.articleUnitDialog.article  = currentArticle;
    state.articleUnitDialog.title    = currentArticle.name;
    state.articleUnitDialog.unitList = unitList
    state.articleUnitDialog.price    = currentArticle.price
    if(currentArticle.discount && currentArticle.discount < 100) {
      unitList.map(unitItem => {
        unitItem.details.map(item => {
          item.price = (item.price * currentArticle.discount / 100).toFixed(2)
        })
      })
    } else {
      unitList.map(unitItem => {
        unitItem.details.map(item => {
          if(!state.isFans && item.fans_price) {
            item.price = item.fans_price;
          }
        })
      })
    }
    unitList.map(unitItem => {
      if (unitItem.choice_type === 0) {
        unitItem.details[0].state = 1
        state.articleUnitDialog.price += unitItem.details[0].price
      }
    })
  },

  choseUnit (state, unit, detail) {
    if (unit.choice_type) { // 任选 choice_type = 1
      detail.state = !detail.state
      this.articleUnitDialog.price += (detail.state ? detail.price : -detail.price);
      return;
    }
  },
  addUnitToCar (state, isFans) { // 新规格 加入购物车
    state.addCarArticle = {}
    let price = state.articleUnitDialog.price;
    let articleName = state.articleUnitDialog.article.name;
    let unitDetails = [];
    state.articleUnitDialog.unitList.map( unit => {
      unit.details.map( detail => {
        if (detail.state) {
          unitDetails.push(detail.id);
          // price += detail.price;
          articleName += `(${detail.name})`
        }
      })
    })
    if(unitDetails && unitDetails.length <= 0) {

      return window.appControl.$message.error("请选择规格后加入购物车");
    }
    let article = {
      time: new Date().getTime(),
      id: state.articleUnitDialog.article.id,
      count: 1,
      name: articleName,
      price: price, // 这个价格其实是加过差价的价格，比如一个基础价20 小份2 中份3 大份4 那么就是 22 23 24
      type: 5,  // 新规格
      unit_details: unitDetails,
      articleFamilyId: state.articleUnitDialog.article.article_family_id,
      mealFeeNumber: state.articleUnitDialog.article.meal_fee_number,  // 餐盒费
      class: 'car-new-name',
      state: 0,  // 新加入购物车
      status: 3,

      discount: !!state.articleUnitDialog.article.discount ? state.articleUnitDialog.article.discount : 100, // 折扣
      fansPrice: !!state.articleUnitDialog.article.fans_price ? state.articleUnitDialog.article.fans_price : 0,
      isFans: isFans, // 是否开启粉丝价
    };
    this.commit('increateArticleCount', state.articleUnitDialog.article)
    state.articleUnitDialog.show = false;
    state.addCarArticle = article;
  },

  setArticlePriceList (state, {articlePriceList, currentArticle}) {
    state.articlePriceDialog.show = true;
    state.articlePriceDialog.article = currentArticle;
    state.articlePriceDialog.title = currentArticle.name;
    articlePriceList.map(item => {
      if( state.articlePriceDialog.article.discount && state.articlePriceDialog.article.discount < 100) {
        item.price = item.price * state.articlePriceDialog.article.discount / 100
      }else if(!state.isFans && item.fans_price) {
         item.price = item.fans_price
      }
      if(item.current_working_stock == 0) {
        item.isEmpty = 1;
      }
      item.checkedState = 0;
    })
    articlePriceList[0].checkedState = 1;
    state.articlePriceDialog.price = articlePriceList[0].price;
    state.articlePriceList = articlePriceList;
  },

  choseArticlePrice (state, articlePrice) {
    if(articlePrice.current_working_stock <= 0) return window.appControl.$message.error("此规格已经售罄，请选择其它规格")
    state.articlePriceList.map(item => item.checkedState = 0)
    articlePrice.checkedState = 1;
    state.articlePriceDialog.price = articlePrice.price;
    state.articlePriceDialog.articlePrice = articlePrice;
  },

  addArticlePrceToCar(state, isFans) {
    let price = state.articlePriceDialog.price;
    let articlePrice = state.articlePriceDialog.article;
    let curArt = state.articlePriceList.map(item => item).filter(item =>  item.checkedState == 1)
    let currentArticle = curArt[0];
    if(currentArticle.current_working_stock == 0) {
      state.addCarArticle = {}
      return window.appControl.$message.error("此规格已经售罄，请选择其它规格")
    }
    let article = {
      time: new Date().getTime(),
      id: articlePrice.id,
      count: 1,
      name: articlePrice.name + currentArticle.name,
      price: currentArticle.price,
      type: 2,  // 老规格
      article_prices_id: currentArticle.id,
      articleFamilyId: articlePrice.article_family_id,
      mealFeeNumber: articlePrice.meal_fee_number, //餐盒费
      class: 'car-new-name',
      state: 0,  // 新加入购物车
      status: 3,
      discount: !!articlePrice.discount ? articlePrice.discount : 100, // 折扣
      isFans: isFans, // 是否开启粉丝价
    }

    state.articlePriceDialog.show = false;
    state.addCarArticle = article;
    state.articlePriceList.map(item => item.checkedState = 0)
  },

  setMealAttributionList (state, {mealAttributionList, currentArticle}) {
    state.packageDialog.show = true;
    state.packageDialog.title = currentArticle.name;
    state.packageDialog.article = currentArticle;
    state.packageDialog.price = currentArticle.price;
    state.packageDialog.mealAttributionList = mealAttributionList;



    mealAttributionList.map (mealAttr => {
      mealAttr.mealItemsInfo.map(item => {
        if(currentArticle.discount < 100) {
          item.price = (item.price * item.discount / 100).toFixed(2)
        }else if(!state.isFans && item.fans_price){
          item.price = item.fans_price
        }
      })

      if (mealAttr.choice_type == 0) {// 必选  具体必选几。由 choice_count 决定 不可多，不可少
        mealAttr.mealItemsInfo.map ( item => {
          item.checkedState = item.is_default;
          item.original_price_dif = item.price_dif;
          state.packageDialog.price += item.is_default ? item.price_dif : 0;
        })
      }
    })
  },
  choseAttr (state, {attr, item}) {
    if (state.tempAttr != attr) {
      state.mustChoiceAttr = [];
    }
    if(attr.choice_type == 0) { // 必选 具体根据 choice_count 的值，确定 必选几 不可多，不可少。
      // 以下逻辑为：只能选中指定数量
      if (state.mustChoiceAttr.length <=0) {
        let num = 0
        let tempArr = []
        attr.mealItemsInfo.map(function (item2) {
          if (item2.checkedState) {
            state.mustChoiceAttr.push(item2)
            num ++
          }else {
            tempArr.push(item2)
          }
        })

        let dif = attr.choice_count - num
        if(tempArr.length > 0 && dif > 0) {
          for(let i = 0; i < dif; i++) {
            tempArr[i].checkedState = 1
            state.mustChoiceAttr.push(tempArr[i])
          }
        }
      }
      if(!item.checkedState) {
        if(state.mustChoiceAttr.length > 0 ) {
          let tempItem = state.mustChoiceAttr.shift();
          tempItem.checkedState = 0;
          state.packageDialog.price -= tempItem.price_dif;
        }
        state.mustChoiceAttr.push(item);
        state.packageDialog.price += item.price_dif;
        state.mustChoiceAttr.map(function (item1) {
          item1.checkedState = 1;
        })
      }
    } else if(attr.choice_type == 1){ // 任选
      item.checkedState = !item.checkedState;
      state.packageDialog.price += (item.checkedState ? item.price_dif : -item.price_dif);
    }
    state.tempAttr = attr;
  },
  addAttrToCar(state, isFans){
    state.addCarArticle = []
    let article = {
      time: new Date().getTime(),
      id: state.packageDialog.article.id,
      name: state.packageDialog.title,
      count: 1,
      price: state.packageDialog.price,
      isOpen: false,
      type: 3,
      mealItems: [],
      articleFamilyId: state.packageDialog.article.article_family_id,
      mealFeeNumber: state.packageDialog.article.meal_fee_number,
      class: 'car-new-name',
      state: 0,
      status: 3,
      discount: !!state.packageDialog.article.discount ? state.packageDialog.article.discount : 100, // 折扣
      fansPrice: !!state.packageDialog.article.fans_price ? state.packageDialog.article.fans_price : 0,
      isFans: isFans, // 是否开启粉丝价
    }
    var attrCount = 0;
    for(var i = 0; i < state.packageDialog.mealAttributionList.length; i++ ){
      attrCount = 0;
      for (var j =0; j < state.packageDialog.mealAttributionList[i].mealItemsInfo.length; j++) {
        if(state.packageDialog.mealAttributionList[i].mealItemsInfo[j].checkedState) {
          if (state.packageDialog.mealAttributionList[i].mealItemsInfo[j].current_working_stock <= 0 || state.packageDialog.mealAttributionList[i].mealItemsInfo[j].isEmpty) {
            return window.appControl.$message.warning(`${state.packageDialog.mealAttributionList[i].mealItemsInfo[j].name} 已售罄`);
          } else if (state.packageDialog.mealAttributionList[i].mealItemsInfo[j].current_working_stock.activated) {
            return window.appControl.$message.warning(`${state.packageDialog.mealAttributionList[i].mealItemsInfo[j].name} 已下架`);
          }
          attrCount ++
          article.mealItems.push({
            id: state.packageDialog.mealAttributionList[i].mealItemsInfo[j].id,
            articleId: state.packageDialog.mealAttributionList[i].mealItemsInfo[j].article_id,
            count: 1,
            name: state.packageDialog.mealAttributionList[i].mealItemsInfo[j].name,
            price: state.packageDialog.mealAttributionList[i].mealItemsInfo[j].price_dif
          })
        }
      }
      if(state.packageDialog.mealAttributionList[i].choice_type == 0 && attrCount != state.packageDialog.mealAttributionList[i].choice_count){
        return window.appControl.$message.warning(`${state.packageDialog.mealAttributionList[i].name} 必选 ${state.packageDialog.mealAttributionList[i].choice_count} 项`);
      }
    }


    if(article.mealItems.length <=0) {
      return window.appControl.$message.warning(`请选择套餐属性后加入购物车`)
    }
    state.mustChoiceAttr = []
    state.packageDialog.show = false
    state.addCarArticle = article;
  },
  isFans(state,isFans){
    state.isFans = isFans;
  },


}

export default {
  state,
  getters,
  actions,
  mutations
}
