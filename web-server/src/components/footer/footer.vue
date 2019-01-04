<template>
  <el-row class="footer-page footer-layout">

    <div class="flex-bg">
      <el-col :span="2"  style="margin-left: 15px;">
        <!--<img :src="weatherInfo.imgUrl" alt="">-->
        <img src="../../assets/shaolei_img/logo.jpg" alt="">
      </el-col>
      <el-col :span="16">
        <p style="line-height: 50px;">{{currentTime}}</p>
        <!--<p style="line-height: 10px;">-->
          <!--{{weatherInfo.text}}-->
        <!--</p>-->
      </el-col>
    </div>

    <div class="flex-bg">
      <el-col :span="24">
        <span>{{shopDet.name|shopnameMathLength}}</span>
      </el-col>
    </div>

    <div class="flex-bg">
      <el-col :span="10" :offset=14>
        <div style="display: flex;">

          <div style="flex: 1; text-align: right" v-if="shopModel == 2">
            <img src="../../assets/shaolei_img/正常@2x.png" alt="" v-if="tvConnect == true">
            <img src="../../assets/shaolei_img/异常@2x.png" alt="" v-else @click="reconnectTV">
          </div>

          <div style="flex: 1; text-align: right">
              <svg class="icon" aria-hidden="true" style="width:35px; height: 35px; margin-top:10px;">
                <use :xlink:href="wsConnect ==  true ? '#icon-yunfuwuqi-lianjie1' : '#icon-yunfuwuqi-duankailianjie1'"></use>
              </svg>
          </div>

          <div style="flex: 1; text-align: right; margin-right: 15px;">
            <img v-if="exceptionPrint == false" src="../../assets/header_img/symbols-dayinji.png" @click="openDialog">
            <img v-else src="../../assets/header_img/noprint.png" @click="openDialog">
          </div>
        </div>
      </el-col>
    </div>
    <el-dialog size="large"  :visible.sync="syncDatabaseDialog" :close-on-click-modal="false" class="el-dialog__wrap">
      <div style="text-align: center;font-size: 18px; font-weight: bold;">未打印记录</div>
      <el-row style="margin-bottom: 10px; margin-left: 5%" >
        <el-col :span="4" style="margin-right: 30px;">
          <el-select v-model="value" placeholder="请选择">
            <el-option
              v-for="item in options"
              :key="item.value"
              :label="item.label"
              :value="item.value">
            </el-option>
          </el-select>
        </el-col>
        <el-col :span="8"><el-input v-model="searchData" placeholder="请输入内容"></el-input></el-col>
        <el-col :span="4"><el-button type="primary"  @click="search">搜索</el-button></el-col>
      </el-row>
      <el-table
        :data="tableData"
        style="width: 90%;margin: 0 auto;"
        height="440">
        <el-table-column
          align="center"
          prop="orderTime"
          label="日期"
          width="180">
        </el-table-column>
        <el-table-column
          align="center"
          prop="serialNumber"
          label="订单流水号"
          width="200">
        </el-table-column>
        <el-table-column
          align="center"
          prop="distributionMode"
          label="模式"
          width="120">
        </el-table-column>
        <el-table-column
          align="center"
          prop="ip"
          label="打印机ip"
          width="140">
        </el-table-column>
        <el-table-column
          align="center"
          label="菜品名称"
          width="400">
          <template slot-scope="scope">
            <el-popover trigger="hover" placement="right">
              <p>菜品名称：</p>
              <p>{{scope.row | printContent}}</p>
              <div slot="reference" class="name-wrapper">
                <span>{{scope.row | printContent1}}</span>
              </div>
            </el-popover>
          </template>
        </el-table-column>
        <el-table-column
          align="center"
          prop="printType"
          label="打印机类型"
          width="120">
          <template slot-scope="scope">
            <span >{{scope.row.printType | typeFilter1}}</span>
          </template>
        </el-table-column>
        <el-table-column
          align="center"
          prop="tableNumber"
          label="	座位号或其他"
          width="120">
        </el-table-column>
        <el-table-column  align="center" fixed="right" label="操作" width="160" class-name="small-padding fixed-width">
          <template slot-scope="scope">
            <el-button type="primary" size="small " @click="handleClick(scope.row)">打印</el-button>
            <el-button  size="small " type="danger"  @click="deleteBrand(scope.row)">跳过
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination-container" style="margin-top: 10px;margin-left: 20px;">
        <el-pagination background  @current-change="handleCurrentChange" :current-page.sync="listQuery.page_index"
                       :total="count" :page-size="listQuery.page_size" layout="total, prev, pager, next, jumper" >
        </el-pagination>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button @click="syncDatabaseDialog = false" style="margin-right: 20px;">关 闭</el-button>
      </span>
    </el-dialog>


  </el-row>

</template>

<script>
  import {getShopDetails, getOrderList, reconnectTV, websocketOnline, getPrintRecord, repeatPrintById, deletePrintRecordById, getWeather,openCashbox} from 'api/api'
  import bus from '../../utils/bus'

  //打印机类型
  const calendarTypeOptions1 = [
    { text: '小票', value: 1 },
    { text: '贴纸', value: 2 }
  ]

  const calendarTypeKeyValue1 = calendarTypeOptions1.reduce((acc, cur) => {
    acc[cur.value] = cur.text
    return acc
  }, {})
  export default {
    name: 'footer-page',
    data() {
      return {
        shopDet: {},
        weatherInfo: {
          text: "",
          imgUrl: ''
        },
        weatherImg: "",
        currentTime: '',
        netState: false,
        tvConnect: false,
        shopModel: '',
        tvConnectTime: 0,
        wsConnect: false,
        syncDatabaseDialog: false,
        tableData: [],
        listQuery: {
          page_size: 10,
          page_index: 1,
          type:'',
          content:''
        },
        count:0,
        options: [{
          value: 'serialNumber',
          label: '订单流水号'
        }, {
          value: 'tableNumber',
          label: '座位号或其他'
        }, {
          value: 'printContent',
          label: '菜品名称'
        }],
        value:'',
        searchData:'',
        exceptionPrint: false,
      };
    },
    filters: {
      typeFilter1(type) {
        return calendarTypeKeyValue1[type]
      },
      printContent(type) {
        if(type.printType == '2') {
          return JSON.parse(type.printContent).ARTICLE_NAME;
        } else if (type.printType == '1'){
          let data = JSON.parse(type.printContent).ITEMS;
          let str = ''
          data.map((v,i) => {
            let name = v.ARTICLE_NAME;
            str += name + ',';
          })

          return str;
        }
      },
      printContent1(type) {
        if(type.printType == '2') {
          return JSON.parse(type.printContent).ARTICLE_NAME;
        } else if (type.printType == '1'){
          let data = JSON.parse(type.printContent).ITEMS;
          let str = ''
          data.map((v,i) => {
            let name = v.ARTICLE_NAME;
            str += name + ',';
          })

          return str.substr(0,50) + '...';
        }
      },
      shopnameMathLength (value) {
        if(!value || value == '') return '';
        return value.length > 3 ? value.substring(0, 20) : value
      }

    },
    mounted() {
      let that = this;
      this.shopDet = JSON.parse(sessionStorage.getItem("shopDet"));
      this.shopModel = this.shopDet.shop_mode;
      this.getDate();
      this.initWsConnect();
      this.initNetworkListen();
      bus.$on("successTV", () => {
        this.tvConnect = true;
      })
      bus.$on('closeTv', () => {
        this.tvConnect = false;
      })
      bus.$on('wsOpen', (wsOpen) => {
        this.wsConnect = wsOpen;
      })
      bus.$on('exceptionPrint', (data) => {
        this.exceptionPrint = true;
      })


      setTimeout(() => {
        this.getWeather();// 每隔半个小时刷新一下天气的状况
      }, 1000)

    },
    beforeDestroy(){
      bus.$off('successTV')
      bus.$off("closeTv")

    },
    methods: {
      initWsConnect(){
        websocketOnline( (websocketOnline) => {
          this.wsConnect = websocketOnline;
        })
      },

      getWeather() {
        let that = this;
        if (!navigator.onLine) return; // 断网
        getWeather(result => {
          if (result == null) return;
          let res = JSON.parse(result)
          let weatherResult = res[0]
          that.weatherInfo.imgUrl = weatherResult.dayPictureUrl;
          that.weatherInfo.text =weatherResult.weather + ' ' + weatherResult.wind + ' ' + weatherResult.temperature
        })
      },

      getDate() {
        setInterval( ()=>{
          this.currentTime = this.$utils.format();
        },1000);
      },
      initNetworkListen: function () {
        this.netState = navigator.onLine || false;
        //  移除监听
        window.removeEventListener("online", this.evenOnLine);
        //  添加监听
        window.addEventListener("online" , this.evenOnLine);
        window.addEventListener("offline" , ()=>{
          this.netState = false;
        });
      },
      evenOnLine: function () {
        this.netState = true;
        this.getWeather();
      },



      opencashbox() {
        console.log("---打开钱箱");
        openCashbox(result => {
            console.log(result)
        })
      },
      reconnectTV() {
        if (this.tvConnectTime >0) return this.$message("请勿频繁点击")
        this.tvConnectTime = 5;
        setInterval(() => {
          this.tvConnectTime -= 1
          if (this.tvConnectTime <= 0) {
            return this.tvConnectTime = 0;
          }
        }, 1000)
        let shopModel = sessionStorage.getItem("shopModel")
        if(shopModel != 2 && shopModel !=7) return
        let tvIp = sessionStorage.getItem("tvIp") || null;
        if (tvIp == null || tvIp.length == 0) {
          return this.$notify({
            title: 'Resto+',
            message: '当前店铺未设置 电视端 IP 地址',
            type: 'warning'
          });
        }
        this.$tvSocket.init(this, tvIp)
      },

      openDialog() {
        this.exceptionPrint = false;
        this.syncDatabaseDialog = true;
        this.listQuery.type='';
        this.listQuery.content='';
        this.value='';
        this.searchData='';
        this.getList();
      },

      getList() {
        let that = this;
        getPrintRecord(that.listQuery, function (result) {
          that.tableData = result.rows
          that.count = result.count
        });
      },

      handleCurrentChange(val) {
        this.listQuery.page_index = val
        this.getList()
      },

      handleClick(row) {
        let that = this;
        let data = {
          id:row.id
        }
        repeatPrintById(data, function (result) {
          that.getList()
        },function (err) {
          that.getList()
        });
      },

      deleteBrand(row){
        let that = this;
        let data = {
          id:row.id
        }
        deletePrintRecordById(data, function (result) {
          console.log('result',result)
          that.getList()
        });
      },

      search(){
        this.listQuery.type = this.value;
        this.listQuery.content = this.searchData;
        this.getList()
      }
    },
  };
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
  .footer-page {
    /*position: fixed;*/
    position: absolute;
    font-size: 16px;
    width: 100%;
    height: 49px;
    line-height: 49px;
    background-color: #252525;
    color: #FFFFFF;
    bottom: 0;
  }

  .footer-layout {
    display: inline-block;
    display: -webkit-box;
    -webkit-box-orient: horizontal;
  }

  .flex-bg {
    height: 49px;
    -webkit-box-flex: 1.0;
    -moz-box-flex:1.0;
  }

  .weather-img img{
    width:30px;
    height: 30px;
    margin-top: 10px;
    /*margin-left: 11px;*/
  }

  .weather-info {
    border:none;
    height: 34px;
    /*background-color: red;*/
    /*margin: 0 auto;*/
    text-align: left;
    margin-left: -20px;
    font-size: 14px;
    min-width: 180px;
  }

  .shop-info {
    margin-left: -20px;
    height: 49px;
    line-height: 49px;
  }

  .order-total {
    height: 49px;
    line-height: 49px;
    font-size: 16px;
    min-width: 150px;
  }

  .printer-info {
    /* text-align: right; */
    display: flex;
    height: 49px;
    font-size: 16px;
    font-weight: bold;
    /*line-height: 49px;*/
  }

  .print_msg {
    /*width: 49px;*/
    height: 49px;
    vertical-align: top;
    margin-top: 5px;
    font-size: 18px;
    font-weight: bold;
    display: inline-block;

  }
  img{
    height: 28px;
    width: 28px;
    margin-top: 10px;
  }
  .icon {
    width: 1em; height: 1em;
    vertical-align: -0.15em;
    fill: currentColor;
    overflow: hidden;
  }

  .el-dialog__wrap >>> .el-dialog__body {
    padding: 0px;
  }
  .el-dialog__wrap  >>> .el-dialog__header {
    padding: 0px;
  }
  .el-dialog__wrap  >>> .el-dialog__footer {
    padding: 0px;
  }

  .el-dialog__wrap  >>> .el-dialog__headerbtn {
    position: absolute;
    top: 15px;
    right: 15px;
  }
</style>
