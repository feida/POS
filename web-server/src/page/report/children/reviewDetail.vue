<template>
  <div>
    <el-dialog title="现金审核付款明细"  :visible.sync="reviewModal" size="large"  :close-on-click-modal="false" :before-close="closeReviewDialog" id="reviewDialog">
      <div style="width:70%;">
          <el-table :data="tableData"
                    class="tb-edit"
                    border
                    style="width: 100%"
                    height="500"
                    highlight-current-row
                    @row-click="handleCurrentChange"
          >
            <el-table-column prop="sort" label="序号"  align="center">
              <template slot-scope="scope">
                <span>{{scope.row.sort}}</span>
              </template>
            </el-table-column>
            <el-table-column prop="name" label="项目" width="180" align="center">
              <template slot-scope="scope">
                <span>{{scope.row.name}}</span>
              </template>
            </el-table-column>
            <el-table-column prop="money" label="上报金额" align="center">
              <template slot-scope="scope">
                <span>{{scope.row.money}}</span>
              </template>
            </el-table-column>
            <el-table-column prop="auditMoney" label="复合金额" align="center">
              <template slot-scope="scope" >
                <div v-if="scope.row.editStatus" style="background: #eee;">
                  <el-input size="small"  v-model="number" placeholder="请输入内容"   @focus="focus(scope.$index, scope.row)" @change="handleEdit(scope.$index, scope.row)"></el-input> <span>{{scope.row.auditMoney}}</span>
                </div>
                <div v-else>
                  <span :style="(scope.row.paymentModeId == 33  && compareMoney != formerMoney) ? 'color: red;' : ''">{{scope.row.auditMoney}}</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="operator" label="更新人" align="center">
              <template slot-scope="scope">
                <span>{{scope.row.operator}}</span>
              </template>
            </el-table-column>
            <el-table-column prop="createTime" label="更新时间" align="center">
              <template slot-scope="scope">
                <span>{{scope.row.createTime}}</span>
              </template>
            </el-table-column>
          </el-table>

        <span slot="footer" class="dialog-footer">
        <div style="width: 100%;margin-top: 20px;text-align: center;">
          <el-button  @click="closeReviewDialog()">取 消</el-button>
          &nbsp;&nbsp;&nbsp;&nbsp;
          <el-button :style="compareMoney != formerMoney ? 'background-color: #ccc;color: rgb(255, 255, 255);' : 'background-color: #000;color: rgb(255, 255, 255);'" @click="saveChange">结店</el-button>
        </div>
      </span>
      </div>
      <div style="width: 30%;height: 400px; position: absolute;right: 0;bottom: 0">
        <el-col :span="24">
          <!--<el-form ref="form" :model="currentPayType" :label-position="'left'" label-width="55px">-->
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
          <!--</el-form>-->
        </el-col>
      </div>
    </el-dialog>
    <el-dialog title="查询现金审核付款明细"  :visible.sync="findReviewModal" size="large"  :close-on-click-modal="false" :before-close="closeReviewDialog1">
      <div style="width:100%;">
        <el-col :span="24" class="tool-content" style="margin-bottom: 30px;">
          <el-date-picker
            v-model="findReportDate"
            align="right"
            type="date"
            :clearable = false
            placeholder="选择日期"
            :editable = "false"
          >
          </el-date-picker>
          <el-button type="primary" class="tool-search-btn" style="background-color: #FFBF34;border: none;" @click="find()">查询</el-button>
          <el-button type="primary" class="tool-search-btn" style="background-color: #FFBF34;border: none;" @click="print()">打印</el-button>
        </el-col>
        <el-table :data="findTableData"
                  class="tb-edit"
                  border
                  style="width: 100%"
                  height="500"
                  highlight-current-row
        >
          <!--<el-table-column prop="sort" label="序号"  align="center">
            <template slot-scope="scope">
              <span>{{scope.row.sort}}</span>
            </template>
          </el-table-column>-->
          <el-table-column prop="name" label="项目" width="180" align="center">
            <template slot-scope="scope">
              <span>{{scope.row.name}}</span>
            </template>
          </el-table-column>
          <el-table-column prop="money" label="上报金额" align="center">
            <template slot-scope="scope">
              <span>{{scope.row.money}}</span>
            </template>
          </el-table-column>
          <el-table-column prop="auditMoney" label="复合金额" align="center">
            <template slot-scope="scope" >
              <span>{{scope.row.auditMoney}}</span>
            </template>
          </el-table-column>
          <el-table-column prop="operator" label="更新人" align="center">
            <template slot-scope="scope">
              <span>{{scope.row.operator}}</span>
            </template>
          </el-table-column>
          <el-table-column prop="createTime" label="更新时间" align="center">
            <template slot-scope="scope">
              <span>{{scope.row.createTime}}</span>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-dialog>
  </div>
</template>

<script>
  import { findAllPaymentList,checkSuccess, checkReport, checkPrint,getLeftSyncOrder, syncAll, } from 'api/api';
  import bus from  '../../../utils/bus'
  export default {
    name: 'reviewDetail',
    data () {
      return {
        keyBoard: {1: [1, 2, 3, '←'], 2: [4, 5, 6, '清空'], 3: [7, 8, 9, '确定'], 4: [0, '00', '.']},
        number:0,
        index: null,
        reviewModal: false,
        reportDate: new Date(),
        tableData:[],
        tempTableData:[],
        totalMoney:0,
        diffMoney:0,
        compareMoney:0,
        formerMoney:0,
        findReviewModal: false,
        findReportDate: new Date(),
        findTableData: [],
      };
    },
    computed : {

    },
    created: function(){
      let that = this
      //console.log('props',this.date)
    },
    mounted : function () {

    },
    beforeDestroy () {
    },
    methods: {
      closeReviewDialog() {
        this.reviewModal = false
      },
      closeReviewDialog1() {
        this.findReviewModal = false
      },
      open(){
        let that = this;
        findAllPaymentList(this.$utils.fmtDate(this.reportDate), (result) => {
          if(result) {
            that.tableData = result
            that.tempTableData = [].concat(JSON.parse(JSON.stringify(result)));
            that.reviewModal = true
          } else {
            this.$message.error('查询失败');
          }
          console.log('result',result)
        })
      },
      handleCurrentChange(row, event, column) {
        console.log('row',row)
        this.index = row.sort - 1
        if(row.auditMoney > 0) {
          this.number = row.auditMoney
        } else {
          this.number = ''
        }
      },
      handleEdit(index, row) {
      },

      focus(e,i) {
        this.index = e
        if(i.auditMoney > 0) {
          this.number = i.auditMoney
        } else {
          this.number = ''
        }
      },
      saveChange(){
        let that = this;
        let flag = false
        if(this.compareMoney != this.formerMoney) return
        this.$confirm('是否确定要进行结店？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(() => {
          let username =  sessionStorage.getItem("username");
          let data = [].concat(JSON.parse(JSON.stringify(this.tableData)));
          data.map((v,i) => {
            if(Number(this.tempTableData[i].auditMoney != Number(v.auditMoney))){
              flag = true
            }
          });
          if(flag) {
            data.map((v,i) => {
              v.operator = username
            });
          }
          getLeftSyncOrder(that.$utils.fmtDate(new Date()), (result) => {
            var syncDataList = result;
            if(navigator.onLine){
              syncAll(syncDataList, function (result) {
                let prams = {
                  date: that.$utils.fmtDate(new Date()),
                  operator: username,
                  paymentList: data
                }
                checkReport(prams, (res) => {
                  if(res.success && res.syncSuccess) {
                    //console.log('result111',result)
                    let dailyLogId = res.dailyLogId
                    that.$socket.posCheckOut(username,dailyLogId,function () {

                    })
                    that.$alert('审核成功 已结店', '提示', {
                      confirmButtonText: '确定',
                      type: 'success'
                    }).then(() => {
                      that.closeReviewDialog()
                      that.findReviewModal = true
                      that.findTableData = data
                    }).catch(() => {
                    });
                  }  else if(res.success && !res.syncSuccess) {
                    that.$alert('审核成功 已结店', '提示', {
                      confirmButtonText: '确定',
                      type: 'success'
                    }).then(() => {
                      that.$message.warning("短信发送失败");
                      that.closeReviewDialog()
                      that.findReviewModal = true
                      that.findTableData = data
                    }).catch(() => {
                    });
                  }else {
                    that.$alert('审核失败 已重新结店', '提示', {
                      confirmButtonText: '确定',
                      type: 'error'
                    }).then(() => {

                    }).catch(() => {
                    });
                  }
                })

              })
            }else{
              let prams = {
                date: that.$utils.fmtDate(new Date()),
                operator: username,
                paymentList: data
              }
              checkReport(prams, (res) => {
                if(res.success ) {
                  that.$alert('审核成功 已结店', '提示', {
                    confirmButtonText: '确定',
                    type: 'success'
                  }).then(() => {
                    that.$message.warning("暂无网络，无法发送结店短信!");
                    that.closeReviewDialog()
                    that.findReviewModal = true
                    that.findTableData = data
                  }).catch(() => {
                  });
                } else {
                  that.$alert('网络繁忙，请稍后重试', '提示', {
                    confirmButtonText: '确定',
                    type: 'error'
                  }).then(() => {

                  }).catch(() => {
                  });
                }
              })

            }
          })

        }).catch(() => {
        });
      },

      find(){
        let that = this
        checkSuccess(this.$utils.fmtDate(this.findReportDate), (result) => {
          if(result.success && result.data.length > 0) {
            that.findTableData = result.data
          } else if(result.success && result.data.length == 0) {
            that.findTableData = result.data
            this.$message('暂无数据');
          }else {
            this.$message.error('网络繁忙，请稍后重试');
          }
          console.log('result',result)
        })
      },

      keyBoardHandler(key) {
        if (typeof key === 'number') {
          if(((this.number.length > 0) && this.number.indexOf('.') != -1) || this.number == '' || Number(this.number) > 0 ) {
            this.number += String(key);
          }
        } else {
          switch (key) {
            case '00':
              if ( this.number.length > 0) {
                this.number += key;
              }
              break;
            case '.':
              if (this.number !== '' && this.number.indexOf('.') === -1) {
                this.number += key;
              }
              break;
            case '←':
               if (this.number.toString().length > 0) {
                 let count = this.number.toString();
                 this.number = count.substring(0, count.length - 1);
               }
              break;
            case '清空':
              this.number = '';
              break;
            case '确定':
              if(this.number == '') {
                this.number = 0
              }
              if(this.tableData[this.index] && this.tableData[this.index].editStatus) {
                this.tableData[this.index].auditMoney = this.number
              }
              let a = 0
              let b = 0
              this.tableData.map((item,i) => {
                a += Number(Number(item.auditMoney).toFixed(2))
                this.totalMoney = Number(a.toFixed(2))
                if(item.paymentModeId == 33){
                  this.formerMoney = Number(Number(item.auditMoney).toFixed(2))
                }

                if(item.paymentModeId == 31 || item.paymentModeId == 32 || item.paymentModeId == 33 || item.paymentModeId == 34 || item.paymentModeId == 35 || item.paymentModeId == 36 || item.paymentModeId == 37 || item.paymentModeId == 38){
                  b += Number(Number(item.auditMoney).toFixed(2))
                  this.diffMoney = Number(b.toFixed(2))
                }
              })
              this.compareMoney = this.accSub(this.totalMoney,this.diffMoney)

                console.log(' this.totalMoney 全部相加总额', this.totalMoney)
                console.log(' this.diffMoney 被减6项之和', this.diffMoney)
                console.log(' this.compareMoney 减后总额', this.compareMoney)
          }
        }
      },
      accSub(arg1, arg2) {
        if (isNaN(arg1)) {
          arg1 = 0;
        }
        if (isNaN(arg2)) {
          arg2 = 0;
        }
        arg1 = Number(arg1);
        arg2 = Number(arg2);

        var r1, r2, m, n;
        try {
          r1 = arg1.toString().split(".")[1].length;
        }
        catch (e) {
          r1 = 0;
        }
        try {
          r2 = arg2.toString().split(".")[1].length;
        }
        catch (e) {
          r2 = 0;
        }
        m = Math.pow(10, Math.max(r1, r2)); //last modify by deeka //动态控制精度长度
        n = (r1 >= r2) ? r1 : r2;
        return ((arg1 * m - arg2 * m) / m).toFixed(n);
      },
      print(){
        let that = this
        let data = {
          printDate: this.$utils.fmtDate(this.findReportDate),
          operator: sessionStorage.getItem("username")
        }


        checkPrint(data, (result) => {
          if(result.success) {
            // this.$message.success('打印成功');
          } else {
            // this.$message.error('打印失败');
          }
        })
        this.myPrint()
      },
      myPrint(){
        var newWindow=window.open("打印窗口","_blank");
        var shopName = JSON.parse(sessionStorage.getItem('shopDet'))
        var dataList = this.findTableData;
        var paymentList = []
        let i = 1;
        dataList.map((item, index) => {
          if (item.money > 0 || item.auditMoney > 0) {
            paymentList.push({
              sort: i++,
              name: item.name,
              money: item.money,
              auditMoney: item.auditMoney,
              operator: item.operator,
              createTime: item.createTime
            })
          }
        })

        var rootNode = document.createElement('div')


        var titleNode = document.createElement('h2');
        titleNode.innerHTML = `<h2>现金审核明细</h2><span>${shopName.brand_name}-${shopName.name}</span>
                 <p>---------------------------------------------------------------------------</p>`
       rootNode.appendChild(titleNode)
       setTimeout(() => {
         var divNode = document.createElement('div')
         var divString = `
         <table border='2' width='800' cellpadding='5' cellspacing='0'>
                    <tr>
                        <td>序号</td>
                        <td>项目</td>
                        <td>上报金额</td>
                        <td>复核金额</td>
                        <td>更新人</td>
                        <td>更新时间</td>
                    </tr>
         `

         var containerString = ``
         paymentList.map((item,index) => {
           if (item.auditMoney > 0 || item.money > 0) {
             containerString  = containerString + `
            <tr>
                   <td>${item.sort}</td>
                   <td>${item.name}</td>
                   <td>${item.money}</td>
                   <td>${item.auditMoney}</td>
                   <td>${item.operator}</td>
                   <td>${item.createTime}</td>
            </tr>
            `
           }
         })
         divString = divString + containerString
           divString = divString + `
          </table>
         `

           divNode.innerHTML = divString
           newWindow.document.write(rootNode.innerHTML);
           newWindow.document.write(divNode.innerHTML);
           newWindow.document.close();
           newWindow.print();
           newWindow.close();
         })
      }
    }

  };
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

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
    background-color: #000000;
    color: #FFF;
    border-radius:50%;
    cursor: pointer;
    opacity: 0.6;
  }

  #reviewDialog {
    text-align: center;
  }
  #reviewDialog > .el-dialog {
    width: 90%;
  }
  .tb-edit .el-input {
    display: none
  }
  .tb-edit .current-row .el-input {
    display: block
  }
  .tb-edit .current-row .el-input+span {
    display: none
  }

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
    /*background: #fff;*/
    background: rgb(0,149,200);
    /*border: 1px solid #c4c4c4;*/
    color: #fff;
    border-radius: 4px;
    width: 100%;
    height: 65px;
    font-size: 26px;
    font-weight: bold;
  }
</style>
