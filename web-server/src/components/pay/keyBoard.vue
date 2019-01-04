<template>
  <div>
    <div>
      <input type="text" class="money-input" readonly placeholder="00.00" :disabled="(orderPayType.length >0 || currentPayType.id !=12) ? true :false" v-model="currentPayType.money">
    </div>
    <div>
    <el-col :span="24">
      <el-form ref="form" :model="currentPayType" :label-position="'left'" label-width="55px">
        <table style="width: 100%;height:100%;  border-spacing:5px 5px">
          <tr v-for="row in keyBoard">
            <td v-for="key in row" style="width: 25%; height: 100%;" :rowspan="key == '确定' ? 2:1">
              <button class="key-board" :style="key == '确定' ? 'height:138px;background-color:#ffbf34;color:#FFFFFF':''" type="button"
                      @click="keyBoardHandler(key)">
                {{key}}
              </button>
            </td>
          </tr>
        </table>
      </el-form>
    </el-col>
    </div>
  </div>
</template>

<script>
  import {mapGetters} from 'vuex'
  export default {
    name: "keyBoard",
    data(){
      return {
        keyBoard: {1: [1, 2, 3, '←'], 2: [4, 5, 6, '清空'], 3: [7, 8, 9, '确定'], 4: [0, '00', '.']},
      }
    },
    computed: {
      ...mapGetters({
        currentPayType: 'currentPayType',
        orderPayType: 'orderPayType',
      }),
      // currentPayType: function () {
      //   return this.$utils.formatMoney(this.currentPayType.money || 0);
      // }
    },
    methods:{
      keyBoardHandler(key) {
        if (typeof key === 'number') {
          this.$store.commit('calcAdd', key)
          // if(this.orderPayType.length > 0 || this.currentPayType.id != 12 ) {
          //   return;
          // }
          // this.currentPayType.money += key;
        } else {
          switch (key) {
            case '00':
              if (this.currentPayType.id == 12 || this.currentPayType.money.length > 0) {
                // this.currentPayType.money += key;
                this.$store.commit("calcAdd", key)
              }
              break;
            case '.':
              if (this.currentPayType.money !== '' && this.currentPayType.money.indexOf('.') === -1) {
                // this.currentPayType.money += key;
                this.$store.commit("calcAdd", key)
              }
              break;
            case '←':
              this.$store.commit("calcDel")
              // if (this.currentPayType.id == 12 && this.currentPayType.money.length > 0) {
              //   let count = this.currentPayType.money;
              //   this.currentPayType.money = count.substring(0, count.length - 1);
              // }
              break;
            case '清空':
              // if(this.currentPayType.id == 12) {
              //   this.currentPayType.money = '';
              // }
              this.$store.commit("calcEmpty");
              break;
            case '确定':
              if(this.cardMoney > 0)   return;

              // if(!this.scanPay.currentType.id){
              //   return this.$message.warning("请选择支付方式！");
              // }
              // if(this.currentPayType.id == 1 || this.currentPayType.id == 10 || this.currentPayType.id == 2){  //  微信支付 或 支付宝
              //
              //   if(this.currentPayType.id == 10 && this.isLocalAlipay == true) {
              //     this.isLocalAlipay = false;
              //   } else {
              //     return this.scanPay.dialogVisible = true;
              //   }
              // }
              this.$store.commit('calcConfirm')
            // let money = parseFloat(this.currentPayType.money || 0);
            // let tempMoney = 0
            // 先判断是否已存在
            // for (let type of this.orderPayType) {
            //   tempMoney += type.money
            //   if(tempMoney >= this.needPay) return;
            //   if (type.type === this.currentPayType.id) {
            //     type.money += money;
            //     this.currentPayType.money = '';
            //     return;
            //   }
            // }
            // 默认追加
            // this.orderPayType.push({
            //   type: this.currentPayType.id,
            //   name: this.payType[this.currentPayType.id],
            //   money: money,
            //   icon: this.icon[this.currentPayType.id]
            // });
            // this.currentPayType.money = +(this.currentPayType.money - money).toFixed(2)
            //  设置 payMode
            // if(this.currentPayType.id == 1 || this.currentPayType.id == 10 ){  //  微信支付 或 支付宝
            //   this.payMode = this.currentPayType.id;
            // }else if(this.payMode != 1 && this.payMode != 10 && (this.currentPayType.id == 12 || this.currentPayType.id == 5)){ //  现金 或 银行卡
            //   this.payMode = this.currentPayType.id;
            // }else{
            //   this.payMode = this.currentPayType.id;
            // }
          }
        }
      },
    },
  }
</script>

<style scoped>
  .money-input {
    border:1px solid #2f2f2f;
    margin-left: 5px;
    width: 97%;
    height: 48px;
    font-size: 30px;
    text-align: right;
    padding-right: 5px;
    background-color: #fff;
  }

  .key-board {
    display: inline-block;
    line-height: 1;
    white-space: nowrap;
    cursor: pointer;
    background: #fff;
    /*border: 1px solid #c4c4c4;*/
    color: #666;
    border-radius: 4px;
    width: 100%;
    height: 65px;
    font-size: 26px;
    font-weight: bold;
  }
</style>
