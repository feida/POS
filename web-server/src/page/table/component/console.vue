<template>
  <div class="order-panel">
    <el-button v-if="openOrder" type="success" size="large" class="open-order-btn">开单</el-button>
    <div v-else>
      <el-row type="flex" class="row-bg" justify="space-around">
        <el-col :span="9">
          <el-button :type="order.distributionModeId == 1?'primary':''" size="large" class="base-btn"
                     @click="choiceMode(1)">堂食
          </el-button>
        </el-col>
        <el-col :span="9">
          <el-button :type="order.distributionModeId == 3?'primary':''" size="large" class="base-btn"
                     @click="choiceMode(3)">外带
          </el-button>
        </el-col>
      </el-row>

      <el-form ref="form" :model="order" :label-position="'left'" label-width="60px" style="padding: 10px 15px 10px 15px; height: 100%">
       <span style="display: inline-block; width: 27%;"> 桌位号：</span> <input style="font-size: 14px; width: 70%;" :disabled="true" class="inputValue" v-model="order.tableNumber"  @focus="select(1)">
        <div style="height: 10px;"></div>
        <span style="display: inline-block; width: 27%;">人&emsp;数：</span> <input style="font-size: 14px;width: 70%;" class="inputValue" v-model="order.customerCount" @focus="select(2)" pattern="[0-9]">
        <el-row  style="margin-top: 5px;">
          <el-col :span="6" >
            <el-row v-for="i in 4" v-bind:key="i" style="margin-top: 2px;">
              <button class="key-board" type="button" @click="keyBoardCharAt(i)">
                {{String.fromCharCode(i+64)}}
              </button>
            </el-row>
          </el-col>
          <el-col :span="18">
            <el-col :span="8" v-for="x in keyBoard" :key="x" style="padding:1px;">
              <el-row>
                <button class="key-board" type="button" @click="keyBoardNumber(x)">{{x}}</button>
              </el-row>
            </el-col>
            <el-col :span="8"  style="padding:1px;">
              <el-row>
                <button class="key-board" type="button" @click="clearAll" style="font-size: 18px;">清空</button>
              </el-row>
            </el-col>
            <el-col :span="8"  style="padding:1px;">
              <el-row>
                <button class="key-board" type="button" @click="backspace" style="font-size: 18px;">删除</button>
              </el-row>
            </el-col>
            <el-col :span="8"  style="padding:1px;">
              <el-row>
                <button class="key-board" type="button" @click="keyBoardNumber(0)">0</button>
              </el-row>
            </el-col>
          </el-col>
        </el-row>


        <div style="font-weight: bold; margin-top: 10px; " v-if="notesTags && notesTags.length > 0">
          <div style="display: inline-block; height: 30px; line-height: 30px;width:16%; vertical-align: top" >备注:</div>
          <div style="display: inline-block; border: 1px solid black; height: 30px; width: 81%; border-radius: 5px;">{{notes}}</div>
        </div>

        <el-row ype="flex" justify="space-around">
          <el-col  :span="8"  v-for="item in notesTags" :key="item.id" style="margin-top: 15px;">
              <p class="remark-option" size="small" :class="{'order-flavor-select': item.show }"  @click="getNotes(item)">{{item.remark_name}}</p>
          </el-col>
        </el-row>

        <el-row class="console-button">
          <el-col :span="24" style="padding-left: 20px;padding-right: 20px;">
            <el-button class="form-btn " type="primary" @click="bindTable">开台</el-button>

          </el-col>
        </el-row>

        <el-dialog
          title="提示"
            :visible.sync="dialogVisible"
            width="30%"
            :before-close="handleClose">
          <span>是否需要释放桌位</span>
          <span slot="footer" class="dialog-footer">
            <el-button @click="dialogVisible = false">取 消</el-button>
            <el-button type="primary" @click="release">确 定</el-button>
          </span>
        </el-dialog>

      </el-form>
    </div>
  </div>
</template>

<script>
  import {bindTable, shopDetail ,getOrderRemarkList, systemLog, syncOrderInfoById, wsChangeTable, newReleaseTable} from 'api/api';
  import ElButton from "../../../../node_modules/element-ui/packages/button/src/button.vue";
  import bus from '../../../utils/bus'
  export default {
    components: {ElButton},
    name: 'console',
    data () {
      return {
        num: null,
        openOrder: false,
        tagType:1,
        notes:"",
        notesTags:[],         //标签内容
        order: {
          afterPay: true,           // 默认为稍后支付
          distributionModeId: 1,    // 订单的就餐模式  （堂食或者外带）
          tableNumber: null,        // 桌号
          customerCount: "",      // 就餐人数
          remark: null,           // 订单备注
          servicePrice: 0
        },
        keyBoard: 9,
        dialogVisible: false,
        isBindTable: false
      };
    },
    watch: {
      '$route.params': function (params) {
        this.switchTable(params.tableNumber);
      },
      order: {
        handler: function (val) {
          let that = this;
          let reg = /[0-9]+$/;
          if(val.customerCount == ""){
            return;
          }
          if(reg.test(val.customerCount) == false){
            that.order.customerCount = val.customerCount.substring(0,val.customerCount.length-1)
            that.simpleMsg("人数只能为数字")
          }
          if(val.customerCount.length>2) {
            that.order.customerCount = val.customerCount.substring(0,val.customerCount.length-1)
            that.simpleMsg("超最大人数上限")
          }
        },
        deep: true
      }
    },
    created () {

      this.switchTable(this.$route.params.tableNumber);
      this.getTgs(this.tagType);
    },
    mounted(){
      bus.$on('bindError', () => {
        this.dialogVisible = true;
      })
    },
    beforeDestroy () {
      bus.$off('bindError')
    },
    methods: {
      release() {
        console.log("当前桌位", this.order.tableNumber)
        newReleaseTable(this.order.tableNumber, () => {
          this.dialogVisible = false;
        })
      },
      handleClose(done) {
        this.$confirm('确认关闭？')
          .then(_ => {
            done();
          })
          .catch(_ => {});
      },
      switchTable(tableNumber){
        if(tableNumber){
          this.order.tableNumber = tableNumber;
          this.$message.closeAll();
          this.simpleMsg('当前桌位：' + this.order.tableNumber);
        }else{
          this.$message({
            type: 'error',
            showClose: true,
            message: "请输入有效桌位~"
          });
        }
      },
      select(num){
       this.num = num;
      },
      keyBoardNumber (number) {
        if(this.order.customerCount.length >= 2){
          this.simpleMsg("已达人数上限");
          return ;
        }
        this.num == '1' ? (this.order.tableNumber += number) : (this.order.customerCount += number)
      },
      keyBoardCharAt (i){
        this.num == '1' ? this.order.tableNumber = String.fromCharCode(i+64) : this.simpleMsg('请输入有效数字')
      },
      backspace () {
        if(this.num == '1') {
          if (this.order.tableNumber.length > 0) {
            let count = this.order.tableNumber;
            this.order.tableNumber = count.substring(0, count.length - 1);
          }
        }else {
          if (this.order.customerCount.length > 0) {
            let count = this.order.customerCount;
            this.order.customerCount = count.substring(0, count.length - 1);
          }
        }
      },
      clearAll(){
        this.num == "1" ? this.order.tableNumber = '':this.order.customerCount = ''
      },

      getNotes(val){
        val.show = !val.show;
        var self = this;
        if(self.notes.split(",").indexOf(val.remark_name) ==-1 ){
          if((self.notes.replace(/(^\s*)|(\s*$)/g, "")).length>0){
            self.notes +=","+val.remark_name;
          }else {
            self.notes +=val.remark_name;
          }
        }else {
          var arr = self.notes.split(",");
          var index = arr.indexOf(val.remark_name);
          if(index >-1){
            arr.splice(index, 1);
          }
          self.notes = arr.join(",");
        }
      },
      getTgs(){
        var self = this;

        getOrderRemarkList((data)=>{
          if(data){
            let i = 0
            self.notesTags = data.filter(function(item){
              i ++;
              if (i > 9 )  return;
              return !!item.remark_name;
            });
          }
        });

      },
      /*******选择就餐模式*********/
      choiceMode(modeId){
        this.order.distributionModeId = modeId;
      },
      bindTable () {
        if(this.isBindTable) return
        this.isBindTable = true
        var that = this;
        let shopDet = JSON.parse(sessionStorage.getItem('shopDet'));
        let { is_use_service_price, service_price } = shopDet;
        if (this.order.distributionModeId == 1) { // 堂食 模式 考虑服务费
          this.order.servicePrice = (!!is_use_service_price) ?  service_price.toFixed(2) : 0; //如果开启服务费，则将服务费传入进去，否则传入0
        }
        this.order.remark = this.notes;
        let uid = sessionStorage.getItem("uid")
        sessionStorage.setItem("lastBindUid",uid)
        bindTable(this.order,uid, function (orderId) {
          console.log('orderId',orderId)
          that.isBindTable = false
          if(orderId.message) {
            that.$message.error(orderId.message);
            return
          }
          var orderInfo = {
            orderId: orderId,
            syncState: 0,
            lastSyncTime: (new Date()).getTime()
          }
          syncOrderInfoById(orderInfo)
          // wsChangeTable(that.order.tableNumber, false, orderId) // 换桌信息到服务器
          // that.$socket.updateTableState(that.order.tableNumber, false, orderId);
          that.$router.push('/order/' + orderId);
        });
      },
      simpleMsg(msg){
        this.$message({
          showClose: true,
          duration: 1000,
          message: msg
        });
      }
    }
  };
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
  .order-panel {
    height: 100%;
    background-color: #F3F3F3;
    border-right: 1px solid #d1dbe5;
  }

  .base-btn{
    width: 100%;
    margin-top: 5px;
    border-radius: 5px;

    border: 1px solid black;
    color: #333333;
    background-color: #f5f5f5;
  }

  /*.base-btn:hover{*/
    /*border-color: #CCB96B;*/
    /*color: #CCB96B;*/
  /*}*/

  .el-button--primary{
    color: #FFFFFF;
    font-size: 18px;
    background-color: #ffbf34;
    border:none;
  }

  .panel-title {
    height: 50px;
    line-height: 50px;
    font-size: 20px;
    font-weight: bold;
    text-align: center;
    /*background-color: #FFFFFF;*/
    /*border-bottom: 5px solid #F2F2F2;*/
    margin-bottom: 10px;
  }

  .open-order-btn {
    padding: 16px 25px;
    border-radius: 0px;
    margin-top: 180%;
  }

  .distribution-btn {
    width: 100%;
    border-radius: 0;
  }

  .key-board-panel {
    margin-bottom: 10px;
  }

  .key-board {
    display: inline-block;
    line-height: 1;
    white-space: nowrap;
    cursor: pointer;
    background: #fff;
    /*border: 1px solid #c4c4c4;*/
    color: #1f2d3d;
    border-radius: 10px;
    width: 95%;
    height: 50px;
    /*margin-left: 5px;*/
    margin-bottom: 5px;
    font-size: 24px;
    /*font-weight: bold;*/
    box-shadow: 2px 0px 4px rgba(0, 0, 0, .12);
  }

  .remark-option {
    height: 32px;
    line-height: 32px;
    color: #666;
    font-size: 14px;
    text-align: center;

    box-sizing: border-box;
    border: 1px solid #D5D5D5;
    border-radius: 5px;
  }

  .console-button{
    position: absolute;
    width: 100%;
    left: 0;
    bottom: 12px;
  }
  .form-btn {
    width: 100%;
    height: 40px;
    border-radius: 5px;
    font-size: 18px;
    font-weight: bold;

  }

  .icon-backspace {
    font-size: 32px;
  }

  .el-input__inner{
     border:none !important;
   }

  .order-flavor{
    height: 28px;
    line-height: 28px;
    padding:0 10px;
    /*width: 80px;*/
    font-size: 0.735rem;
    text-align: center;

    border-radius: 5px;
    /*color: #CCB96B;*/
    color: #aaa;
    background-color: #F3F3F3;
    border-color: #aaa;
    cursor: pointer;
    margin-top: 10px;
  }

  .order-flavor-select{
    background-color: #212121;
    color: #FFFFFF;
  }

  .inputValue {
    text-align: center;
    outline:none;
    /*border-bottom:1px solid grey;*/
    /*background-color: transparent;*/
    border: 1px solid black;
    border-radius: 5px;
    height:30px;

  }

</style>
