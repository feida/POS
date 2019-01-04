<template>
    <el-row  v-if="shopModel == 2 || shopModel == 7 " class="order-toolbar">

      <div class="order-state" v-if="isTakeout">
        <el-button :class="takeoutClass['eleme']" @click="choseTakeOutType('eleme')">饿 了 么</el-button>
        <el-button size="large" :class="takeoutClass['meituan']" @click="choseTakeOutType('meituan')">美团外卖</el-button>
        <el-button size="large" :class="takeoutClass['baidu']" @click="choseTakeOutType('baidu')">百度外卖</el-button>
      </div>

      <div class="order-state" v-else>
        <el-button :class="stateClass['all']" @click="choseOrderState('all')">
          点单
        </el-button>
        <el-button :class="stateClass['wait']" @click="choseOrderState('wait')">
          待叫号
          <sup class="el-badge__content is-fixed" v-if="callCount && callCount.waitCallCount && callCount.waitCallCount > 0">{{callCount.waitCallCount}}</sup>
        </el-button>
        <el-button :class="stateClass['pay']" @click="choseOrderState('pay')">
          已完成
          <sup class="el-badge__content is-fixed" v-if="callCount && callCount.hasCalledCount>0">{{callCount.hasCalledCount}}</sup>
        </el-button>
      </div>

      <div class="order-mode" style="float: right;">
        <el-badge :value="0" class="item">
          <el-button size="large" :class="modeActiveClass('takeout')" @click="switchPage('/table/takeout')">外卖</el-button>
        </el-badge>
        <el-badge :value="0" class="item">
          <el-button size="large" :class="modeActiveClass('eatin')" @click="switchPage('/table/eatin')">堂食/外带</el-button>
        </el-badge>
      </div>
    </el-row>
    <el-row class="order-toolbar" v-else>
      <div class="order-state" v-if="isTakeout">
        <el-button :class="takeoutClass['eleme']" @click="choseTakeOutType('eleme')">饿 了 么</el-button>
        <el-button size="large" :class="takeoutClass['meituan']" @click="choseTakeOutType('meituan')">美团外卖</el-button>
        <el-button size="large" :class="takeoutClass['baidu']" @click="choseTakeOutType('baidu')">百度外卖</el-button>
      </div>
      <div class="order-state" v-else>
        <el-button :class="stateClass['all']" @click="choseOrderState('all')">
          全部座位
        </el-button>
        <el-button :class="stateClass['pay']" @click="choseOrderState('pay')"
                   :disabled="orderStateCount.payOrderCount >0 ? false : true">
          已支付
          <sup class="el-badge__content is-fixed" v-if="orderStateCount.payOrderCount">{{orderStateCount.payOrderCount}}</sup>
        </el-button>
        <el-button :class="stateClass['wait']" @click="choseOrderState('wait')"
                   :disabled=" orderStateCount.waitOrderCount > 0 ? false : true ">
          待下单
          <sup class="el-badge__content is-fixed" v-if="orderStateCount.waitOrderCount">{{orderStateCount.waitOrderCount}}</sup>
        </el-button>

        <el-button :class="stateClass['nopay']" @click="choseOrderState('nopay')"
                   :disabled="orderStateCount.noPayOrderCount > 0 ? false : true">
          未支付
          <sup class="el-badge__content is-fixed" v-if="orderStateCount.noPayOrderCount">{{orderStateCount.noPayOrderCount}}</sup>
        </el-button>

        <el-button :class="stateClass['paying']" @click="choseOrderState('paying')"
                   :disabled="orderStateCount.payingOrderCount > 0 ? false : true ">
          付款中
          <sup class="el-badge__content is-fixed" v-if="orderStateCount.payingOrderCount">{{orderStateCount.payingOrderCount}}</sup>
        </el-button>
      </div>
      <div class="order-mode" style="float: right;">
        <el-badge :value="0" class="item">
          <el-button size="large" :class="modeActiveClass('takeout')" @click="switchPage('/table/takeout')">外卖</el-button>
        </el-badge>
        <el-badge :value="0" class="item">
          <el-button size="large" :class="modeActiveClass('packaging')" @click="switchPage('/table/packaging')">外带</el-button>
        </el-badge>
        <el-badge :value="0" class="item">
          <el-button size="large" :class="modeActiveClass('eatin')" @click="switchPage('/table/eatin')">堂食</el-button>
        </el-badge>
      </div>
    </el-row>
</template>

<script>
  import bus from '../../../utils/bus'
  export default {
    name: 'order-toolbar',
    props: ['callCount','orderStateCount',],
    data () {
      return {
        isTakeout: false,
        currentOrderState : "all",
        currentTakeoutType : "eleme",
        shopDet:{},
        shopModel: '',
        switchActive: false,
      };
    },
    created() {
      this.shopDet = JSON.parse(sessionStorage.getItem("shopDet"));
      this.shopModel = this.shopDet.shop_mode;
    },
    mounted(){
      var currentPath = this.$route.path;
      if(currentPath == "/table/takeout"){
        this.isTakeout = true;
      }
      if(this.$route.query && this.$route.query.type){
        let name = this.$route.query.type;
        this.currentOrderState = name;
        this.$emit(name);
      }
//      console.log("\n\n\n  toolber");
//      console.log(currentPath.indexOf("/table/eatin") != -1);
//      console.log(this.$route.query.tableNumber);
//      if(currentPath.indexOf("/table/eatin") != -1 && this.$route.query.tableNumber){ //  当前路径包含桌位时，触发自动选择方法。
//        console.log("\n\n\n\n  自动触发  ");
////        this.$emit("auto");
//      }else{
//        this.$emit(this.isTakeout ? this.currentTakeoutType : this.currentOrderState);
//      }
    },
    computed : {
      takeoutClass (){
        return {
          eleme : this.currentTakeoutType == "eleme" ? "takeout-type-active" : "",
          meituan : this.currentTakeoutType == "meituan" ? "takeout-type-active" : "",
          baidu : this.currentTakeoutType == "baidu" ? "takeout-type-active" : "",
          shopModel: '',
        }
      },
      stateClass (){
        return {
          all : this.currentOrderState == "all" ? "order-state-active" : "",
          pay : this.currentOrderState == "pay" ? "order-state-active" : "",
          wait : this.currentOrderState == "wait" ? "order-state-active" : "",
          nopay : this.currentOrderState == "nopay" ? "order-state-active" : "",
          paying : this.currentOrderState == "paying" ? "order-state-active" : "",
        }
      }
    },
    methods: {
      choseTakeOutType (type){
        this.currentTakeoutType = type;
        this.$emit(type);
      },
      choseOrderState (name){
        if(this.shopModel == 2 || this.shopModel == 7) {
            if(name == "all") {
              this.$router.push('/tvorder');
            }
            if(name == "wait") {
              this.$router.push("/table/eatin?type=wait")
            }
            if(name == "pay") {
              this.$router.push("/table/eatin?type=pay")
            }
        }
        this.currentOrderState = name;
        this.$emit(name);
      },
      modeActiveClass (name){
        return this.$route.path.indexOf("/table/" + name) != -1 ? "order-mode-active" : null;
      },
      switchPage (path){
        this.switchActive = true;
        if(this.$route.path.indexOf(path) != -1){
          this.choseOrderState(path);
        }else{
          if(this.shopModel == 2 || this.shopModel == 7) {
            let currentRoute = path.indexOf("/table/eatin") != -1;
            if(currentRoute) {
              this.$router.push("/table/eatin?type=wait");
            } else {
              this.$router.push("/table/takeout");
            }
          } else {
            this.$router.push(path + '?orderType=all');
          }
        }
      }
    }
  };
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
  .order-toolbar {
    height: 50px;
    width: 100%;
    line-height: 45px;
    padding-left: 5px;
    background-color: #ffffff;
    border-bottom: 1px solid #d1dbe5;
    box-shadow: 0 2px 4px 0 rgba(0, 0, 0, .12), 0 0 6px 0 rgba(0, 0, 0, .04);
  }
  .order-state{
    float: left;
  }
  .order-state button{
    position: relative;
    margin-left: 13px;
    padding: 10px 10px;
    font-size: 16px;
    border: 1px solid black;
    color: #333333;
    background-color: #f5f5f5;
  }
  .order-state-active{
    background-color: #ffbf34 !important;
    color: #fff !important;
    border-radius: 5px;
    border:none !important;
  }
  .takeout-type-active{
    background-color: #ffbf34 !important;
    color: #FFFFFF!important;
    border: none !important;
  }
  .order-mode {
    text-align: right;
    padding-right: 10px;
  }
  .order-mode button:hover {
    border-color: #FFFFFF;
    color: #333;
  }
  .order-mode-active{
    color: #FFFFFF !important;
    /*border:none;*/
    background-color: #ffbf34;
    border-color: #ffbf34;
  }
  .el-badge__content.is-fixed {
    top: 8px;
    right: 12px;
  }
  .el-badge__content {
    height: 20px;
    line-height: 20px;
    z-index: 10;
  }
  button:disabled{
    border:1px solid #DDD;
    background-color:#eef1f6;
    color: #bfcbd9;
  }
</style>
