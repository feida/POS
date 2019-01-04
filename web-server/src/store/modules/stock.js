import {getArticlePriceListByArticleId, getMealByArticleId, getUnitListByArticleId} from "../../api/api";

/**
 * Created with mhkz.
 * User: 943085517@qq.com
 * Date: 2018/9/3
 * Time: 14:06
 * Desc: stock store
 */
const state = {
  stockUnitList: [],
  stockArticlePriceList: [],
  stockMealAttributionList: [],
}

const getters = {
  stockUnitList:               state => state.stockUnitList,
  stockArticlePriceList:       state => state.stockArticlePriceList,
  stockMealAttributionList:    state => state.stockMealAttributionList,
}

const actions = {
  getUnitList({ commit }, currentArticle) { // 新规格
    getUnitListByArticleId(currentArticle.id, unitList => commit('setUnit', {unitList, currentArticle}))
  },

  getArticlePrice({ commit }, currentArticle) { // 获取当前老规格规格列表
    getArticlePriceListByArticleId(currentArticle.id, articlePriceList => commit('setArticlePrice', {articlePriceList, currentArticle}))
  },

  getMeal({ commit }, currentArticle) {
    getMealByArticleId(currentArticle.id, mealAttributionList => commit('setMealAttribution', {currentArticle, mealAttributionList}))
  }
}

const mutations = {
  setUnit(state, {unitList, currentArticle}){
    state.stockUnitList = unitList;
  },
  setArticlePrice(state, {articlePriceList, currentArticle}){
    state.stockArticlePriceList = articlePriceList;
  },
  setMealAttribution(state, {mealAttributionList, currentArticle}){
    state.stockMealAttributionList = mealAttributionList;
  },
  setArticleSoldOutStatus(state, articleInfo){ //
    this.state.article.articleList.map(item => {
      if (item.id == articleInfo.id) {
        item.is_empty = 1
        item.current_working_stock = 0;
      }
    });
  },

  setArticleUpOrDown(state, articleInfo) {
    this.state.article.articleList.map(item => {
      if (item.id == articleInfo.currentArticleId) {
        item.activated = articleInfo.activated
      }
    });
  },

  setArticleEdit(state, articleInfo) {
    this.state.article.articleList.map(item => {
      if (item.id == articleInfo.id) {
          item.current_working_stock = articleInfo.count;
          item.is_empty = articleInfo.count > 0 ? 0 : 1;
      }
    });
  },

  setArticlePriceEdit(state, articleInfo) {
    this.state.article.articleList.map(item => {
      if (item.id == articleInfo.articleId) {
        item.current_working_stock = articleInfo.sumCount + item.current_working_stock;
        item.is_empty = item.current_working_stock > 0 ? 0 : 1;
      }
    });
  },
}

export default {
  state,
  getters,
  actions,
  mutations
}

