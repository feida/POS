<template>
  <div>
    <ul class="car-title car-content" v-for="(article, index) in car"  @click="checkOne(article)">
      <hr style="border:1px dashed #E0E0E0; width: 90%;">
      <div v-show="(article.type == 3 && !!article.tempRefundCount)? false: true ">
        <li class="car-title-item car-content-item" style="width: 15%;text-align: center;" v-if="article.checked">
          <svg style="width: 14px;height: 14px;" aria-hidden="true">
            <use xlink:href="#icon-duihao"></use>
          </svg>
        </li>
        <li class="car-title-item car-content-item" style="width: 15%;text-align: center;visibility: hidden" v-else>
          <svg style="width: 14px;height: 14px;" aria-hidden="true">
            <use xlink:href="#icon-duihao"></use>
          </svg>
        </li>

        <li class="car-title-item car-content-item" style="width: 40%;">
          <span style="display: inline-block;width: 80%;">{{article.name}}</span>
          <span class="car-item-plus" v-if="article.notes"> 加 </span>
        </li>
        <li class="car-title-item car-content-item" style="width: 15%;vertical-align: top;">{{article.count}}</li>
        <li class="car-title-item car-content-item" style="width: 20%;text-align: right; vertical-align: top">
          ¥{{formatMoney(article.price || 0)}}
        </li>
      </div>

      <div v-if="article.type==3 && !article.tempRefundCount" style="margin-left: 5px;"
           v-for="item in article.mealItems">
        <li class="car-title-item car-content-item" style="width: 15%;text-align: center;visibility: hidden">
        <li class="car-title-item car-content-item" style="width: 40%;">
          <span style="display: inline-block;width: 80%;">┕&nbsp;&nbsp;{{item.name}}</span>
        </li>
        <li class="car-title-item car-content-item" style="width: 15%; vertical-align: top;">{{item.count}}</li>
        <li class="car-title-item car-content-item" style="width: 20%; text-align: right; vertical-align: top">
          ¥{{formatMoney(item.price)}}
        </li>
      </div>


      <div v-show="article.tempRefundCount">
        <li class="car-title-item car-content-item" style="width: 15%;text-align: center;visibility: hidden;">
          <svg style="width: 14px;height: 14px;" aria-hidden="true">
            <use xlink:href="#icon-duihao"></use>
          </svg>
        </li>
        <li class="car-title-item car-content-item" style="width: 40%;color: #999999; ">
          <span style="display: inline-block;width: 80%;text-decoration: line-through;">{{article.name}}</span>
          <span class="car-item-refund"
                v-show="article.tempRefundCount">退</span>
        </li>
        <li class="car-title-item car-content-item"
            style="width: 15%;text-decoration: line-through;color:#999999 ;vertical-align: top;">
          {{article.tempRefundCount}}
        </li>
        <li class="car-title-item car-content-item"
            style="width: 20%;text-decoration: line-through;text-align: right; color: #999999;vertical-align: top;">
          ¥ {{formatMoney((article.tempRefundCount * article.unitPrice || 0))}}
        </li>
      </div>

      <div v-if="article.type==3 && article.tempRefundCount" style="margin-left: 5px;"
           v-for="item in article.mealItems">
        <li class="car-title-item car-content-item" style="width: 15%;text-align: center;visibility: hidden">
        <li class="car-title-item car-content-item" style="width: 40%;">
          <span
            style="display: inline-block;width: 80%;text-decoration: line-through;color:#999999 ;">┕&nbsp;&nbsp;{{item.name}}</span>
        </li>
        <li class="car-title-item car-content-item"
            style="width: 15%;vertical-align: top;text-decoration: line-through;color:#999999 ;">{{item.count}}
        </li>
        <li class="car-title-item car-content-item"
            style="width: 20%;vertical-align: top;text-decoration: line-through;color:#999999 ; text-align: right;">
          ¥{{formatMoney(item.price)}}
        </li>
      </div>
    </ul>
  </div>
</template>

<script>
  import mixin from '../../mixins/mixin'
  export default {
    mixins: [mixin],
    name: 'car-item',
    props: ['orderInfo','checkedDialogClose'],
    data() {
      return {
        car: [],
        checkedItemList: [],
      };
    },
    watch: {
      orderInfo: function (value) {
        this.initCar(value, JSON.parse(sessionStorage.getItem("shopDet")))
      },
      checkedDialogClose: function (value) {
        this.checkedItemList = []
      }
    },
    mounted() {
      this.initCar(this.orderInfo);
    },
    methods: {

      checkOne: function (item) { // 单选
        if (item.serverPrice) {
          return;
        }

        if (item.count <= 0) {
          this.$message.warning("当前所选菜品数量为0")
          return
        }

        if (typeof item.checked == 'undefined' || item.checked == false) {
          this.$set(item, "checked", true);
          if (item.status != 3) this.checkedItemList.push(item);
        } else {
          item.checked = !item.checked;
          let that = this;
          this.checkedItemList.map(function (ordItem, index) {
            if (ordItem.id == item.id) {
              that.checkedItemList == that.checkedItemList.splice(index, 1);
              that.checkAllFlag = false;
            }
          })
        }
      },
      checkAll: function (flag) {// 全选
        this.checkAllFlag = flag;
        var that = this;
        that.checkedItemList = [];
        this.car.forEach(function (item, index) {
          if (!item.serverPrice) {
            if (item.count == 0) return that.$message.warning("当前所选菜品数量有为0项，无法全选");

            if (typeof item.checked == 'undefined', that.checkAllFlag) {
              that.$set(item, "checked", that.checkAllFlag);
              if (item.status != 3) that.checkedItemList.push(item);
            } else {
              item.checked = that.checkAllFlag;
              that.checkedItemList = [];
            }
          }
        })
      },
      formatMoney(money) {
        return this.$utils.formatMoney(money || 0);
      }
    }
  };
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
  .car-item-plus {
    display: inline-block;
    width: 20px;
    height: 20px;
    text-align: center;
    vertical-align: top;
    background-color: #75C2AF;
    color: #FFFFFF;
    border-radius: 50%;
    margin-left: -4%;
  }

  .car-title {
    width: 100%;
    color: #666;
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

  .car-item-plus {
    display: inline-block;
    width: 20px;height: 20px;
    text-align: center;vertical-align: top;
    background-color: #75C2AF;color: #FFFFFF;
    border-radius:50%;margin-left: -4%;
  }
  .car-item-refund {
    display: inline-block;
    width: 20px;
    height: 20px;
    margin-left: -4%;
    text-align: center;
    vertical-align: top;
    background-color: #ef5350;
    color: #FFFFFF;
    border-radius:50%;
  }
</style>
