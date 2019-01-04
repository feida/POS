<template>
 <div>
   <!--选择折扣弹窗-->
   <el-dialog title="折扣方案" :visible.sync="discountPackage.centerDialogVisible" width="30%" center>
     <template>
       <ul style="margin:0 auto;width: 60%;">
         <li class="discount-package-item" v-for="(item ,index) in discountPackage.discountType" :class = "discountPackage.selectDiscountActive == index ? 'discount-package-item-activate':''" @click="$store.commit('selectDiscountScheme', {index, item})">
           {{item}}
         </li>
       </ul>
     </template>
     <span slot="footer" class="dialog-footer">
        <el-button @click="discountPackage.centerDialogVisible = false">取 消</el-button>
        <el-button style="background-color: #000;color: #fff;" @click = "$store.commit('confirmFreeOrder')" v-if="discountPackage.selectDiscountActive == 2">确定</el-button>
        <el-button style="background-color: #000;color: #fff;" @click = "$store.commit('confirmDiscountSchema')" v-else>下一步</el-button>
      </span>
   </el-dialog>

    <!-- 折扣弹窗-->
   <el-dialog :title="discountPackage.discountTitle" :visible.sync="schemaDialog.onDiscountDialog"  size="large"  center>
     <template>
       <el-row>
         <el-col :span = '12' >
           <el-form label-position="left" label-width="180px" :model="formatDiscount">
             <div  v-if="discountPackage.selectDiscountActive == 0">
               <el-form-item label="折扣率" class="pay_el-form-item__label">
                 <el-input class="discount-input" id="select-input-discount"
                           readonly
                           v-model="formatDiscount.onDiscount.discountRate" :autofocus="autoFocus"
                           @focus="selectInput('select-input-discount')"></el-input>
                 <p style="color: #999;font-size: 22px;">(80为8折，100为不打折)</p>
               </el-form-item>
               <el-form-item label="不参与折扣金额" class="pay_el-form-item__label">
                 <el-input style="text-align: right" class="not-discount-input" id="select-input-remove" readonly
                           v-model="formatDiscount.onDiscount.removeMoney" @focus="selectInput('select-input-remove')">
                 </el-input>
               </el-form-item>
             </div>
             <div v-else-if="discountPackage.selectDiscountActive == 1">
               <el-form-item label="优惠金额" class="pay_el-form-item__label">
                 <el-input style="text-align: right" class="not-discount-input" id="select-input-reduce"
                           readonly :autofocus="autoFocus" v-model="formatDiscount.onReduceMoney.reduceMoney"
                           @focus="selectInput('select-input-reduce')"></el-input>
                 <p style="color: #999;font-size: 22px;">(输入订单优惠金额)</p>
               </el-form-item>
             </div>
             <el-form-item label="订单总额:" class="pay_el-form-item__label">
               <p>{{formatMoney(formatDiscount.totalMoney)}}元</p>
             </el-form-item>
             <el-form-item label="优惠金额:" class="pay_el-form-item__label">
               <p>{{formatMoney(formatDiscount.discountMoney)}}元</p>
             </el-form-item>
             <el-form-item label="应收金额:" class="pay_el-form-item__label">
               <p>{{formatMoney(formatDiscount.amountMoney)}}元</p>
             </el-form-item>
           </el-form>
         </el-col>
         <el-col :span="9" :offset="1">
           <el-col :span="8" v-for="i in 9" :key="i">
             <el-button class="btn-number" @click="dialogKeyBoard(i)">{{i}}</el-button>
           </el-col>
           <el-col :span="8">
             <el-button class="btn-number" @click="dialogKeyBoard('.')">.</el-button>
           </el-col>
           <el-col :span="8">
             <el-button class="btn-number" @click="dialogKeyBoard('0')">0</el-button>
           </el-col>
           <el-col :span="8">
             <el-button class="btn-number" @click="dialogKeyBoard('←')">←</el-button>
           </el-col>
         </el-col>
       </el-row>
     </template>
     <span slot="footer" class="dialog-footer">
        <el-button @click="$store.commit('lastStep')">上一步</el-button>
        <el-button @click = "saveDiscount()">保存</el-button>
      </span>
   </el-dialog>

    <!--抹零弹窗-->
   <el-dialog :title="discountPackage.discountTitle" :visible.sync="schemaDialog.onErasingDialog"  size="large" center>
     <template>
       <el-row>
         <el-col :span = '12' >
           <el-form label-position="left" label-width="180px" :model="formatDiscount">
             <div>
               <el-form-item label="抹零金额" class="pay_el-form-item__label">
                 <el-input style="text-align: right" readonly class="not-discount-input" id="select-input-eras" :autofocus="autoFocus" v-model="formatDiscount.onErasing.erasing"
                           @focus="selectInput('select-input-eras')">
                 </el-input>
                 <p style="color: #999;font-size: 22px;">(输入订单抹零金额)</p>
               </el-form-item>
             </div>
             <el-form-item label="订单总额:" class="pay_el-form-item__label">
               <p>{{formatMoney(formatDiscount.totalMoney)}}元</p>
             </el-form-item>
             <el-form-item label="优惠金额:" class="pay_el-form-item__label">
               <p>{{formatMoney(formatDiscount.onErasing.erasing)}}元</p>
             </el-form-item>
             <el-form-item label="应收金额:" class="pay_el-form-item__label">
               <p>{{formatMoney(formatDiscount.amountMoney )}}元</p>
             </el-form-item>
           </el-form>
         </el-col>

         <el-col :span="9" :offset="1">
           <el-col :span="8" v-for="i in 9" :key="i">
             <el-button class="btn-number" @click="dialogKeyBoard(i)">{{i}}</el-button>
           </el-col>
           <el-col :span="8">
             <el-button class="btn-number" @click="dialogKeyBoard('.')">.</el-button>
           </el-col>
           <el-col :span="8">
             <el-button class="btn-number" @click="dialogKeyBoard('0')">0</el-button>
           </el-col>
           <el-col :span="8">
             <el-button class="btn-number" @click="dialogKeyBoard('←')">←</el-button>
           </el-col>
         </el-col>
       </el-row>
     </template>
     <span slot="footer" class="dialog-footer">
        <el-button @click="$store.commit('setFormatDiscount')">取消</el-button>
        <el-button style="background-color: #000;color: #fff;" @click = "saveDiscount">保存</el-button>
      </span>
   </el-dialog>
 </div>
</template>

<script>
  import {mapGetters} from 'vuex'
  import bus from '../../utils/bus'
  import {
    verificationOfOrders
  } from '../../api/api'
  export default {
    name: "discountPay",
    data(){
      return {
        regNumber: '0',
        flag: true
      }
    },
    computed: {
      ...mapGetters({
        orderInfo: 'orderInfo',
        discountPackage: 'discountPackage',
        formatDiscount: 'formatDiscount',
        schemaDialog: 'schemaDialog',
        autoFocus: 'autoFocus',
        currentOrderInfo: 'currentOrderInfo',
        payInfo: 'payInfo'
      })
    },
    directives: {
      focus: {
        update: function (el, {value}) {
          if (value) {
            el.focus()
          }
        }
      }
    },
    watch:{
      schemaDialog: {
        handler: function (newVal) {
          if (newVal.onDiscountDialog) {
            var select = Number(this.discountPackage.selectDiscountActive);
            if (select == 0) {
              this.$nextTick(()=>{
                document.getElementById("select-input-discount").children[0].focus();
              });
            } else if (select == 1) {
              this.$nextTick(()=>{
                document.getElementById("select-input-reduce").children[0].focus();
              });

            }

          }
          if (newVal.onErasingDialog) {
            this.$nextTick(()=>{
              document.getElementById("select-input-eras").children[0].focus();
            });
          }
        },
        deep: true
      },
    },
    methods:{
      formatMoney(money){
        return this.$utils.formatMoney(money || 0);
      },

      selectInput(str) { // 选择输入框
        this.selectDiscountString = str;
      },

      dialogKeyBoard(number){
        if(number == "←") {
          if(this.selectDiscountString == "select-input-discount") { // 折扣
            let disCount = ""+(this.formatDiscount.onDiscount.discountRate).length;
            document.getElementById("select-input-discount").children[0].focus();
            this.formatDiscount.onDiscount.discountRate = this.regNumber.substring(0,disCount - 1);
          }else if (this.selectDiscountString == "select-input-remove") { // 不打折
            document.getElementById("select-input-remove").children[0].focus();
            let remCount = this.formatDiscount.onDiscount.removeMoney.length;
            this.formatDiscount.onDiscount.removeMoney = this.formatDiscount.onDiscount.removeMoney.substring(0,remCount - 1);
          }else if(this.selectDiscountString == "select-input-reduce") { // 按金额优惠
            document.getElementById("select-input-reduce").children[0].focus();
            let redCount = this.formatDiscount.onReduceMoney.reduceMoney.length
            this.formatDiscount.onReduceMoney.reduceMoney = this.formatDiscount.onReduceMoney.reduceMoney.toString().substring(0,redCount - 1);
          }else if(this.selectDiscountString == "select-input-eras") { // 抹零
            document.getElementById("select-input-eras").children[0].focus();
            let redCount = this.formatDiscount.onErasing.erasing.length;
            this.formatDiscount.onErasing.erasing = this.formatDiscount.onErasing.erasing.toString().substring(0, redCount - 1);
            if (this.formatDiscount.onErasing.erasing == 0 || this.formatDiscount.onErasing.erasing == '0') this.formatDiscount.onErasing.erasing = '0'
          }
        } else {
          if (this.selectDiscountString == "select-input-discount") { // 折扣输入
            this.regNumber =  this.formatDiscount.onDiscount.discountRate || "";
            if(this.regNumber == 100) {
              this.regNumber = '';
            }
            this.regNumber += number.toString()
            if (/^[0-9]{1,2}$/.test(this.regNumber)) {
              this.formatDiscount.onDiscount.discountRate = this.regNumber;
            } else {
              return this.$message.warning("折扣必须为100之内的正整数");
            }
          } else if (this.selectDiscountString == "select-input-remove") { // 不参与打折金额
            document.getElementById("select-input-remove").children[0].focus();
            this.regNumber = this.formatDiscount.onDiscount.removeMoney || "";

            if ((this.regNumber == 0 || this.regNumber == '0') && number !== '.' && this.regNumber.indexOf(".") === -1) {
              this.regNumber = ''
            }
            this.regNumber += '' + number;
            if(/^\d*\.{0,1}\d{0,2}$/.test(+(this.regNumber))) {
              if(+(this.regNumber) <= +(this.formatDiscount.totalMoney)){
                this.formatDiscount.onDiscount.removeMoney = this.regNumber;
              } else if(+(this.regNumber) > +(this.formatDiscount.totalMoney)) {
                return this.$message("最大不能超过总金额")
              }
            } else {
              return this.$message("只能为纯数字，并且小数点为两位1")
            }
          }else if(this.selectDiscountString == "select-input-reduce") { // 优惠金额
            document.getElementById("select-input-reduce").children[0].focus();
            this.regNumber = this.formatDiscount.onReduceMoney.reduceMoney.toString() ;
            if ((this.regNumber == 0 || this.regNumber == '0') && number !== '.' && this.regNumber.indexOf(".") === -1) {
              this.regNumber = ''
            }else if(this.regNumber == "" && number == "."){
              return this.formatDiscount.onReduceMoney.reduceMoney = "0.";
            }
            this.regNumber += '' + number;
            if(/^\d*\.{0,1}\d{0,2}$/.test(this.regNumber)) {
              if(+(this.regNumber) <= +(this.payInfo.amountMoney)){
                this.formatDiscount.onReduceMoney.reduceMoney = this.regNumber //.substring(0, this.regNumber.indexOf(".") + 3);
              } else{
                return this.$message("最大不能超过总金额")
              }
            } else {
              return this.$message("只能为纯数字，并且小数点为两位xx")
            }
          } else if (this.selectDiscountString == "select-input-eras" ) { // 抹零
            document.getElementById("select-input-eras").children[0].focus();
            this.regNumber = this.formatDiscount.onErasing.erasing || "";
            if ((this.regNumber == 0 || this.regNumber == '0') && number !== '.' && this.regNumber.indexOf(".") === -1) {
              this.regNumber = ''
            }
            this.regNumber += number.toString();
            if(/^\d*\.{0,1}\d{0,2}$/.test(this.regNumber)) {
              if(this.regNumber <= +(this.currentOrderInfo.amount_with_children || this.currentOrderInfo.order_money)){
                this.formatDiscount.onErasing.erasing = this.regNumber;
              } else {
                return this.$message("最大不能超过总金额")
              }
            } else {
              return this.$message("只能为纯数字，并且小数点为两位")
            }
          }
        }
        this.calcDiscountMoney();
      },
      calcDiscountMoney () {
        // 第一步 不参与折扣的钱 this.formatDiscount.onDiscount.removeMoney
        // 第二步 参与打折的钱 = 订单总额 - 不参与折扣的钱
        let tempMoney = Number(this.formatDiscount.onDiscount.removeMoney).toFixed(2) > 0 ? (Number(this.payInfo.amountMoney) - Number(this.formatDiscount.onDiscount.removeMoney).toFixed(2)).toFixed(2):
          (Number(this.payInfo.amountMoney)).toFixed(2)
        // 第三步 打折后应付的钱 = 参与打折的钱 x 折扣率 + 不参与折扣的钱 - 按金额优惠的钱 - 抹零的钱
        this.formatDiscount.amountMoney = (Number(tempMoney) * Number(this.formatDiscount.onDiscount.discountRate || 100).toFixed(2) / 100
          + Number(this.formatDiscount.onDiscount.removeMoney) - Number(this.formatDiscount.onReduceMoney.reduceMoney)
          - Number(this.formatDiscount.onErasing.erasing)).toFixed(2);
        // 第四步 打折的钱 = 订单总额 - 打折后应付的钱
        this.formatDiscount.discountMoney = +this.formatDiscount.totalMoney - +this.formatDiscount.amountMoney;
        // 第五步 真实折扣率 = 打折后应付的钱 / 订单总额 * 100
        this.formatDiscount.onDiscount.realDiscountRate = +this.formatDiscount.amountMoney / +this.formatDiscount.totalMoney * 100;

      },

      saveDiscount() {
        let that = this;
        if(!this.flag) return
        this.flag = false
        //this.formatDiscount.onDiscount.discountRate = 100
        //this.formatDiscount.discountMoney = 0
        if (navigator.onLine) {
          let verInfo = {
            orderId: this.orderInfo.id,
            type: ''
          }
          verificationOfOrders(verInfo, function (result) {
            let data = JSON.parse(result);
            if (data.success) {
              var verInfo = {
                orderId: that.orderInfo.id,
                type: 1,
              }
              verificationOfOrders(verInfo, (result) =>{
                let data = JSON.parse(result);
                if(data.success) {
                  that.$store.commit('saveDiscountScheama');
                  bus.$emit("getUserBalance")
                  that.formatDiscount.onDiscount.discountRate = 100
                  that.formatDiscount.discountMoney = 0
                  setTimeout(()=>{
                    that.flag = true
                  },1000)
                } else {
                  that.$message.warning(data.message)
                  that.formatDiscount.onDiscount.discountRate = 100
                  that.formatDiscount.discountMoney = 0
                  setTimeout(()=>{
                    that.flag = true
                  },1000)
                }
              })
            } else {
              that.$message.warning(data.message)
              that.formatDiscount.onDiscount.discountRate = 100
              that.formatDiscount.discountMoney = 0
              setTimeout(()=>{
                that.flag = true
              },1000)
            }
          })
        } else {
          this.$store.commit('saveDiscountScheama');
          bus.$emit("getUserBalance")
          setTimeout(()=>{
            that.flag = true
          },1000)
        }
      }
    }
  }
</script>

<style scoped>
  .discount-package-item-activate {
    border:none;
    background-color:  rgb(255, 191, 52);
    border: 2px solid rgb(255, 191, 52);
    color: rgb(255, 255, 255);
  }
  .discount-package-item {
    border:1px solid black;
    height: 40px;
    line-height:40px;
    font-size: 18px;
    text-align: center;
    margin: 15px;
  }
  .pay_el-form-item__label * {
    font-size: 20px !important;
    text-align: right!important;
  }

  .discount-input {
    font-size: 22px;
    height:40px;
    text-align: right;
  }
  .discount-input::after {
    display:inline-block;
    position: absolute;
    right:1px;
    content:'%';
    font-size: 22px;
    color: #999;
  }
  .not-discount-input:after {
    display:inline-block;
    position: absolute;
    right:1px;
    content:'元';
    font-size: 22px;
    color: #999;
  }


  .btn-number{
    width:90%;
    height:60px;
    margin:5px;
    background-color: #FFFFFF;
    font-size:22px;
    font-weight: bold;
  }
</style>
