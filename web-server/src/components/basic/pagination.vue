<!-- 堂食 外带 分页按钮组件 -->
<template>
  <!--<div  class="order-page-wrapper" style="right: 10%;">
    <div class="pre-page" @click="pagination(-1)"><span class="el-icon-caret-top"></span></div>
    <div class="next-page" @click="pagination(1)"><span class="el-icon-caret-bottom"></span></div>
  </div>-->
  <div class="order-page-wrapper" style="right: 10%;" v-if="pageInfo.totalPage > 1">
    <div class="pre-page" @click="pagination(-1)"><span class="el-icon-caret-top" style="font-size: 26px;margin-left: 4px;"></span></div>
    <div class="next-page" @click="pagination(1)"><span class="el-icon-caret-bottom" style="font-size: 26px;margin-top: 4px;margin-left: 2px;"></span></div>
  </div>
</template>

<script>
    import {mapGetters, mapActions, mapMutations} from 'vuex'
    export default {
      name: "pagination",
      data() {
        return {
          pageIndex: 1,
          pageSize: 20,
          currentPage: 1,
          shopModel: 0,
        }
      },
      computed: {
        ...mapGetters({
          pageInfo: 'pageInfo'
        })
      },
      mounted() {

      },
      created() {
        this.shopDet = JSON.parse(sessionStorage.getItem("shopDet"));
        this.shopModel = this.shopDet.shop_mode;
      },
      methods: {
        pagination(page){
          let orderType = this.$route.query.orderType;
          var path = this.$route.path;
          this.toPages(path, orderType);
          if(page == -1) {
            this.pageIndex = this.pageInfo.currentPage - 1;
            if(this.pageIndex < 1) {
              this.pageIndex = 1
              return this.$message.warning("当前已经是第一页")
            }
            this.getPages(path, orderType)
          }
          if(page == 1) {
            this.pageIndex = this.pageInfo.currentPage + 1;
            if(this.pageIndex > this.pageInfo.totalPage) {
              this.pageIndex -= 1;
              return this.$message.warning("当前已经是最后一页")
            }
            this.getPages(path, orderType)
          }
        },
        getPages(path, orderType) {
          var page = {pageIndex: this.pageIndex}
          this.$store.commit('setPageIndex',page)
          sessionStorage.setItem("pageIndex", this.pageIndex)
          let ObjT = {distributionModeId: 1, pageIndex: this.pageIndex, searchKey : '' , tableNumber: ''}
          let ObjP = {distributionModeId: 3, pageIndex: this.pageIndex, searchKey : '' , tableNumber: '', pageSize: 20}
          if(orderType == 'all') {
            if(path.indexOf('packaging') != -1) {
              this.$store.dispatch('getWaitAndNoPayOrderList', ObjP);
            } else if (this.shopModel == 2 || this.shopModel == 7) {

            } else {
              this.$store.dispatch('getAllTableAndOrderList', ObjT);
            }
          }
          if(orderType == 'payOrder') {
            if(path.indexOf('packaging') != -1) {
              this.$store.dispatch('getPayOrder', ObjP);
            } else if (this.shopModel == 2 || this.shopModel == 7) {
              this.$store.dispatch('getHasCallTPOrderList', ObjT);
            } else {
              this.$store.dispatch('getPayOrder', ObjT);
            }
          }
          if(orderType == 'waitOrder') {
            if(path.indexOf('packaging') != -1) {
              this.$store.dispatch('getWaitOrderList', ObjP);
            } else if (this.shopModel == 2 || this.shopModel == 7) {
              console.log("电视叫号 翻页");
              this.$store.dispatch('getWaitCallTPOrderList', ObjT)
            } else {
              console.log("普通 翻页")
              this.$store.dispatch('getWaitOrderList', ObjT);
            }
          }
          if(orderType == 'noPayOrder') {
            if(path.indexOf('packaging') != -1) {
              this.$store.dispatch('getNoPayOrderList', ObjP);
            } else {
              this.$store.dispatch('getNoPayOrderList', ObjT);
            }
          }
          if(orderType == 'payingOrder') {
            if(path.indexOf('packaging') != -1) {
              this.$store.dispatch('getPayingOrderList', ObjP);
            } else {
              this.$store.dispatch('getPayingOrderList', ObjT);
            }
          }
        },

        toPages(path, orderType) {
          if (orderType == 'undefined') orderType = 'all'
          if(orderType == 'all') {
            if(path.indexOf('packaging') != -1) {
              this.$router.push('/table/packaging?orderType=all')
            } else {
              this.$router.push('/table/eatin?orderType=all')
            }
          }else if(orderType == 'payOrder') {
            if(path.indexOf('packaging') != -1) {
              this.$router.push('/table/packaging?orderType=payOrder')
            } else {
              this.$router.push('/table/eatin?orderType=payOrder')
            }
          }else if(orderType == 'waitOrder') {
            if(path.indexOf('packaging') != -1) {
              this.$router.push('/table/packaging?orderType=waitOrder')
            } else {
              this.$router.push('/table/eatin?orderType=waitOrder')
            }
          }else if(orderType == 'noPayOrder'){
            if(path.indexOf('packaging') != -1) {
              this.$router.push('/table/packaging?orderType=noPayOrder')
            } else {
              this.$router.push('/table/eatin?orderType=noPayOrder')
            }
          } else if(orderType == 'payingOrder') {
            if(path.indexOf('packaging') != -1) {
              this.$router.push('/table/packaging?orderType=payingOrder')
            } else {
              this.$router.push('/table/eatin?orderType=payingOrder')
            }
          }
        }
      }
    }

</script>

<style scoped>
  .order-page-wrapper{
    position: absolute;
    top:35%;
    right: 30px;
    z-index: 10;
  }
  .order-page-wrapper-nomal {
    position: absolute;
    top:35%;
    right: 30px;
    z-index: 10;
  }
  .order-page-wrapper > .pre-page{
    display: flex;
    justify-content: center;
    align-items: center;
    width: 50px;
    height: 50px;
    background-color: #000000;
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
    background-color: #000000;
    color: #FFF;
    border-radius:50%;
    cursor: pointer;
    opacity: 0.6;
  }
</style>
