  <template>
  <el-row class="header">
    <nav>
        <ul>
          <router-link to="/system" class="tool-btn">
            <img :src="shopDet.brand_logo" alt="logo" v-if="shopDet.brand_logo"  style="border-radius: 50%;" class="logo">
            <img src="../../assets/shaolei_img/logo.jpg" alt="logo" class="logo"  v-else>
          </router-link>
          <router-link tag="li" to="" class="tool-btn" :class="{'active':index =='update'}" style="position: relative" @click.native="headerButton('update')">
            更新数据
            <sup class="el-badge__content is-fixed" v-if="wsServerDataChangeCount>0">{{wsServerDataChangeCount}}</sup>
          </router-link>
          <router-link v-if="shopModel == 2 || shopModel == 7" tag="li" to="/tvorder" class="tool-btn" :class="{'active':index =='table'}" @click.native="headerButton('table')">点餐</router-link>
          <router-link v-else tag="li" :to="{path:'/table/eatin',query:{orderType:'all'}}" class="tool-btn" :class="{'active':index =='table'}" @click.native="headerButton('table')">点餐</router-link>
          <router-link tag="li" to="/stock" class="tool-btn" :class="{'active':index =='stock'}" @click.native ="headerButton('stock')">库存管理</router-link>
          <router-link tag="li" to="/report" class="tool-btn" :class="{'active':index =='report'}" @click.native="headerButton('report')">今日数据</router-link>
          <router-link tag="li" to="/material" class="tool-btn" :class="{'active':index =='material'}" @click.native="headerButton('material')" v-if="shopDet.is_open_scm">原料管理</router-link>
          <input  class=" input" id="in-search" type="text" placeholder="请输入内容"
                  autocomplete="off"
                  readonly onfocus="this.removeAttribute('readonly');"
                  @click="headerButton('search')" v-model="searchValue" data-name="search-input">
          <i class="el-icon-close clear-search" v-if="searchValue !=='' "  @click="clearSearchValue()"> </i>
          <span class="jiange"> </span>
          <router-link tag="li" to="" class="tool-btn opencashbox" v-if="ifCashbox == true"  @click.native="openPassword()">
            <img src="../../assets/cashbox.png" alt="">
          </router-link>
          <router-link tag="li" to="" class="tool-btn refresh" :class="{'':index =='refresh'}" @click.native="headerButton('refresh')">
            <img src="../../assets/header_img/symbols-refresh.png" alt="">
          </router-link>
          <li to="" class="tool-btn logout" :class="{'':index =='refresh'}" @click="logout">
            <img src="../../assets/header_img/symbols-guanji.png" alt="">
          </li>
        </ul>
        <el-col>
        </el-col>
    </nav>
    <el-dialog title="Resto+" :visible.sync="syncDatabaseDialog" :close-on-click-modal="false">
      <span>确定要同步数据吗？中途会有 一分钟 左右不能进行操作！</span><br/>
      <span style="color: red">请不要在高峰时段，进行数据更新操作！可能造成POS不稳定！！！</span>
      <span slot="footer" class="dialog-footer">
        <el-button @click="syncDatabaseDialog = false">取 消</el-button>
        <el-button type="primary" @click="syncDatabase">确 定</el-button>
      </span>
    </el-dialog>

    <el-dialog title="身份验证" center :visible.sync="closeBusinessModal"  width="30%" :close-on-click-modal="false" :before-close="closeBusinessDialog" id="businessDialog">
      <div>
        <template>
          <div style="margin-top: 10px;">
            <h3 style="font-weight: bold;margin-left: 5px;display: inline-block;width: 20%;">请输入口令</h3>
            <input type="password"
                   autocomplete="new-password"
                   readonly onfocus="this.removeAttribute('readonly');"
                   style="display: inline-block; border:1px solid grey; height: 30px;border-radius: 5px;width: 50%;"
                   data-name="closeBusiness"
                   v-model="closeBusinessPassword" @click="focus()">

          </div>
        </template>

        <span slot="footer" class="dialog-footer">
        <div style="width: 100%;margin-top: 20px;text-align: center;">
          <el-button  @click="closeBusinessDialog()">取 消</el-button>
          &nbsp;&nbsp;&nbsp;&nbsp;
          <el-button style="background-color: #000;color: rgb(255, 255, 255);" @click="saveChange">确 定</el-button>
        </div>
      </span>
      </div>
    </el-dialog>
  </el-row>
</template>

<script>
  import bus from  '../../utils/bus'
  import ElButton from "../../../node_modules/element-ui/packages/button/src/button.vue";
  import {websocketOnline, syncDatabase, joinChannel,systemLog, logout,getWeight,getWeightNode,getOpenCatty ,openCashbox,findCashbox, onloadChrome} from '../../api/api'
  import keyboard from "../../page/stock/components/keyboard.vue"
  export default {
    components: {ElButton, keyboard},
    data() {
      return {
        index:'',
        isActive: false,
        currentInput: false,
        name: 'header',
        urls: '',
        syncDatabaseDialog: false,
        loadingObj : {},
        wsServerDataChangeCount: 0,
        searchValue: '',
        shopModel: '',
        shopDet: {},
        closeBusinessModal : false,
        ifCashbox : false,
        closeBusinessPassword: '',   //结店口令
        timer: Date
      };
    },
    created() {
      window.onload = function(){
        onloadChrome(false, ()  => {})
        systemLog("onload",  `onload -- ${sessionStorage.getItem("userId")}` );

        sessionStorage.getItem("userId");
        window.localStorage["chromeClose"] = window.localStorage["chromeClose"] + "onload"
      }
      window.onbeforeunload =function() {
        onloadChrome(true, ()  => {})
      }
      window.onunload  = function() {
        systemLog("onunload",  `onunload -- ${sessionStorage.getItem("userId")}` );
        // this.timer =

        // window.localStorage["chromeClose"] = window.localStorage["chromeClose"] + "onunload"
      }
      this.shopDet = JSON.parse(sessionStorage.getItem("shopDet"));
      this.shopModel = this.shopDet.shop_mode;
      this.removeEventListen();
      // sessionStorage.setItem("getFoodWeight-refresh-status", true);

      findCashbox ((result) =>{
        console.log(`---result---`,result)
        if(result.length > 0){
          this.ifCashbox = true;
        }
      });

      if (this.shopModel == 7){
        getOpenCatty ((result) =>{
          if (result.status){
            sessionStorage.setItem("getFoodWeight-status", true);
            this.getFoodWeight();
          }
        })
      }
    },

    mounted() {
      let that = this;
      this.getKey();
      var path = this.$router.history.current.path;
      var pathString = path.split('/').splice(1,1).toString();
      this.headerButton(pathString);

      setTimeout(function () {
        that.dataChange();
      },1000);
      this.serverDateChange();
      this.startEventListen();
      this.connectTv();
      this.closeClient();
    },
    beforeDestroy () {
      this.removeEventListen();
    },
    methods: {
      startEventListen() {
        let that = this;
        //  搜索事件监听
        bus.$on("searchKey", (val)=>{
          document.getElementById('in-search').focus();
          this.searchValue = val;
        });
        //  更新数据监听
        console.log("appControl 注册更新监听 success");
        bus.$on('syncDatabase', (data)=>{
          if(this.loadingObj.instance){
            this.loadingObj.instance.$data.text = "数据更新中：" + data.schedule  + "%";
          }
        });
        bus.$on('syncDatabaseError', ()=>{
          if(this.loadingObj.instance){
            this.loadingObj.close();
            this.$notify.error({
              title: "Resto+",
              message: "数据同步可能出了点问题。。。请稍后再试",
            });
          }
        });
        bus.$on('syncDatabaseSuccess', ()=>{
          if(this.loadingObj.instance){
            localStorage.removeItem("wsServerDataChangeCount");
            this.wsServerDataChangeCount = 0;
            this.loadingObj.close();
            this.$notify.success({
              title: "Resto+",
              message: "更新成功！",
            });
            this.$alert('更新成功~请重新登录，加载新数据', 'Resto+', {
              confirmButtonText: '确定',
              callback: action => {
                logout(function () {
                  that.$router.push('/login');
                });
              }
            });
          }
        });
        bus.$on('cancelOrder', (orderInfo) => {
          if (this.shopModel == 2 || this.shopModel == 7) {
            this.$tvSocket.removeNumber(orderInfo)
          }
        })
        bus.$on("scanPaySuccess", () => {
          this.$notify({title: "Resto+",message: "扫码支付成功", type: "success",duration: 3000});
        })
        bus.$on('close-business', function (value) {
          that.closeBusinessPassword = value;
        });
      },
      removeEventListen() {
        bus.$off("searchKey");
        bus.$off("syncDatabase");
        bus.$off("syncDatabaseError");
        bus.$off("syncDatabaseSuccess");
        bus.$off('wsServerDataChange');
        bus.$off("scanPaySuccess");
        bus.$off("close-business");
      },
      updateSuccess() {
        // 数据更新成功的提示
        this.$alert('数据更新成功，确定返回', '数据更新成功', {
          confirmButtonText: '确定',
        });
      },

      // 数据更新失败
      updateError() {
        this.$confirm('更新失败，重新更新点击确定?', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(() => {
          this.$message({
            type: 'info',
            message: '重新更新!'
          });
        }).catch(() => {
          this.$message({
            type: 'info',
            message: '取消更新'
          });
        });
      },
      headerButton(type){
        this.index = type;
        if (type == 'update') return this.syncDatabaseDialog = true;
        if (type == 'serach') {
             this.currentInput = "true";
             return bus.$emit("show-keyboard",this.currentInput)
        }
        if (type == 'refresh') return this.getRefresh();
      },
      opencashbox() {
        console.log("---打开钱箱");
        openCashbox(result => {
          console.log(result)
        })
      },
      logout(){
        this.$confirm('确定要退出吗？', '提示', {confirmButtonText: '确定', cancelButtonText: '取消', type: 'info'})
          .then(() => {
            logout( () => {
              window.sessionStorage.clear();
              this.$message.success('已退出登录~');
              this.$router.push('/login');
            })
        }).catch(() => {});
      },

      //-----------------
      //      搜索 start
      //-----------------
      getKey(searchKey) {

        var that = this;

        document.onkeydown = function () {
          var oEvent = window.event;
          if (oEvent.keyCode == 70 && event.ctrlKey) {
            document.getElementById('in-search').focus()
            that.currentInput = "true";
          }
        }
        var matchSearch;
        var  search=function(searchKey){
          searchKey = searchKey
          bus.$emit("searchKey", searchKey);
        };
        document.getElementById('in-search').onkeydown=function(){
          var self=this;
          clearTimeout(search);
          matchSearch = setTimeout(function(){
            that.searchValue = self.value
            search(self.value);
          },200);
        };
      },
      clearSearchValue(){
         // 这里将监听到的值派发出去
         document.getElementById("in-search").value = '';
         this.searchValue = '';
         bus.$emit("searchKey", '')
         bus.$emit("clearValue","清除")
      },
      //-----------------
      //      搜索 end
      //-----------------

      // 监测数据变化，如果有变化提示用户数据更新
      dataChange(){
        if(localStorage.getItem('change') == 'hasChange'){
          var upd = document.getElementsByClassName("refresh");
          console.log("发生了变化")
          var newspan = document.createElement('span');
          newspan.innerHTML = " 新";
          upd.style.color = "red";
        }
      },
      // 更新数据
      syncDatabase(){
        this.loadingObj = {
          begin : true,
          instance : this.$loading({ fullscreen: true, text:"数据更新中...一会就好" }),
          close : function () {
            this.instance && this.instance.close();
            this.begin = false;
          }
        };
        this.syncDatabaseDialog = false;
        window.pomelo.notify("pos.systemHandler.syncDatabase");

        setTimeout( () => {
          if(this.loadingObj.begin){
            this.loadingObj.close();
            this.$notify.error({
              title: "Resto+",
              message: "数据同步超时。。。请稍后再试",
            });
          }
        }, 90000); // 80s 超时时间
      },
      serverDateChange(){
        this.wsServerDataChangeCount = localStorage.getItem("wsServerDataChangeCount") || 0;
        bus.$on('wsServerDataChange', ()=>{
          this.wsServerDataChangeCount ++ ;
          localStorage.setItem("wsServerDataChangeCount", this.wsServerDataChangeCount.toString());
        });
      },

      // 刷新
      getRefresh(){
        var path = this.$router.history.current.path;
        window.location.reload(path);
        systemLog("手动刷新", null);
      },
      getFoodWeight(){
        var that = this;

        // getWeightNode("",(resultlut)=> {
        getWeight((resultlut)=> {
          console.log('称重',resultlut);
          if (sessionStorage.getItem("getFoodWeight-status")){
            that.getFoodWeight();
          }
          if (resultlut.error) {
            return false
          }
          if(resultlut.unit == 'kg' ){
            sessionStorage.setItem("weight", resultlut.weight * 2);
          }else {
            sessionStorage.setItem("weight", resultlut.weight / 500);
          }
        });
      },
      connectTv(){
        let shopModel = sessionStorage.getItem("shopModel")
        if(shopModel == 2) {
          let tvIp = sessionStorage.getItem("tvIp") || null;
          if (tvIp == null || tvIp.length == 0) {
            return this.$notify({
              title: 'Resto+',
              message: '当前店铺未设置 电视端 IP 地址',
              type: 'warning'
            });
          }
          this.$tvSocket.init(this, tvIp)
        }
      },


      closeClient: function () {
        window.onunload = function(){ // 如果浏览器关闭，则需要断开 websocket 连接， 如果是刷新，则不需要操作

          // logout( () => {
          //   systemLog("onunload",  `onunload -- ${sessionStorage.getItem("userId")}` );
          //   window.sessionStorage.clear();
          //
          //   this.$message.success('已退出登录~');
          //   this.$router.push('/login');
          //
          // });
        }
      },

      openPassword(){
        this.closeBusinessPassword = "";
        this.closeBusinessModal = true;
      },


      closeBusinessDialog() {
        this.closeBusinessModal = false;
        this.closeBusinessPassword = ''
      },
      focus() {
        this.closeBusinessPassword = "";
      },
      saveChange(){
        let that = this;
        var superPwd = JSON.parse(sessionStorage.getItem("superPwd"));
        var inputSuperPwd = this.$utils.pwdEncryption(this.closeBusinessPassword);
        if(inputSuperPwd == '') {
          this.$message.warning('身份口令不能为空');
          return;
        }
        if(inputSuperPwd != superPwd) {
          this.$message.error('身份口令错误');
          return;
        }

        this.closeBusinessModal = false;
        this.closeBusinessPassword = ''
        this.opencashbox()
      },

    }
  };
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
  .up-data{
    position: absolute;
    top:10px;
    left: 100px;
    height: 40px;
    line-height: 20px;
  }
  .header {
    position: absolute;
    height: 64px;
    width: 100%;
    line-height: 60px;
    background-color: #2f2f2f;
  }

  nav {
    width: 99%;
    margin:0 auto;
    height:100%;
  }


  .logo-wrapper {
    height: 100%;
  }

  .logo {
    width: 40px;
    height: 40px;
    position: absolute;
    left: 11px;
    top:15px;
    border-radius: 50%;
  }

  .tool-bar {
    text-align: left;
  }

  .tool-btn {
    display: inline-block;
    font-weight: bold;
    padding-left: 20px;
    padding-right: 20px;
    line-height: 64px;
    text-align: center;
    /*margin-left: 1%;*/
    margin-left: 10px;
    font-size: 18px;
    color: #fff;
  }
  .tool-btn:hover{
    cursor: pointer;
  }
  .input {
    /*position: absolute;*/
    width: 140px;
    height: 36px;
    border-radius: 5px;
    margin-left: 20px;
    padding-left: 5px;
    top: 14px;
    /*right: 200px;*/
    color: #999;
    background-color: #fff;
    font-size: 16px;
  }

  .active {
    color: #fff;
    background-color: #000;
    height: 64px;
    border-bottom: 5px solid #FFBF34;
  }
  .opencashbox {
    background-color: #2f2f2f;
    height: 100%;
    position: absolute;
    right: 160px;
    color: #fff;
  }
  .opencashbox > img {
    display: inline-block;
    vertical-align: middle;
    width:30px;
    height: 30px;
  }
  .refresh {
    background-color: #2f2f2f;
    height: 100%;
    position: absolute;
    right: 80px;
    color: #fff;
  }
  .refresh > img {
    display: inline-block;
    vertical-align: middle;
    width:30px;
    height: 30px;
  }
  .jiange{
    display: inline-block;
    position: absolute;
    top:22px;
    right: 70px;
    height: 20px;
    width:2px;
    background-color: #FFFFFF;
    z-index: 99999;
  }
  .logout {
    background-color: #2f2f2f;;
    height: 100%;
    position: absolute;
    right: 0px;
    color: #fff;
  }
  .logout > img {
    display: inline-block;
    vertical-align: middle;
    width:30px;
    height: 30px;
  }
  .el-badge__content.is-fixed {
    top: 10px;
    right: 15px;
  }

  .el-badge__content {
    border-color: black;
    height: 20px;
    line-height: 20px;
  }

  .clear-search {
    color: #252525;
    /*position: absolute;*/
    top:25px;
    margin-left: -30px;
    z-index: 1999;
    cursor: pointer;
  }

</style>
