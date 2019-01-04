<template>
  <div class="login" v-loading.fullscreen.lock="fullscreenLoadingObj.show"
       :element-loading-text="fullscreenLoadingObj.msg">
    <div class="loading-wrap" v-show="loadWrap">
      <img src="../../assets/loading.gif" class="loading">
    </div>
    <div class="login-wrap" v-show="!loadWrap">
      <el-row>
        <el-col :span="24">
          <el-row>
            <el-col :span="12" :offset="6" class="logo-container">
              <div class="header-logo" @click="closeKeyboard">
                <img :src="shopInfo.brand_logo" alt="logo" v-if="isOnLine && shopInfo.brand_logo" class="logo">
                <img src="../../assets/shaolei_img/logo.jpg" alt="logo" class="logo" v-else>
              </div>
            </el-col>
            <el-col :span="12" :offset="6" class="login-container">
              <div class="input-container">
                <div style="padding-top: 85px; padding-left: 40px;">
                    <span class="username-img-container">
                      <img src="../../assets/shaolei_img/zhanghao@2x.png" alt="账号图片">
                    </span>
                  <input type="text" class="base-input" placeholder="请输入账户"
                         autocomplete="off"
                         readonly onfocus="this.removeAttribute('readonly');"
                         v-model="username" @focus="selectInput('username')">
                </div>

                <div class="password-container">
                    <span class="username-img-container">
                      <img src="../../assets/shaolei_img/mima@2x.png" alt="密码图片">
                    </span>
                  <input class="base-input" placeholder="请输入密码" v-model="password" type='password'
                         autocomplete="off"
                         readonly onfocus="this.removeAttribute('readonly');"
                         ref="password" @focus="selectInput('password')" @keyup.enter="login()">
                </div>
                <div class="remember-password">
                  <i class="icon-font icon-iconfontgouxuan remember-info"></i>
                  <span>记住密码</span>
                </div>
                <div class="login-btn" @click="login()">
                  登录
                </div>
              </div>
            </el-col>
            <el-col :span="24" style="margin-top: -65px;" v-show="showKeyboard">
              <keyboard :keyboard-text.sync="username" @childKey="get" class="key-board"></keyboard>
            </el-col>
          </el-row>
          <div class="avatar-container">
            <div class="avatar-drop-down" @click="displayAvatars()">
              <i class="iconfont " :class="displayAvatar? 'icon-arrow-right' : 'icon-arrow-left'"></i>
              <span>{{displayAvatar == false? '切换账号': '收起账号'}}</span>
            </div>
            <div class="user-item" v-for="user in userList" @click="choiceAccount(user)" v-if="displayAvatar == true">
              <img class="user-item-avatar" :src="shopInfo.brand_logo" alt="logo"
                   v-if="isOnLine && shopInfo.brand_logo">
              <img alt="logo" src="../../assets/shaolei_img/logo.jpg" class="user-item-avatar" v-else>
              <span class="user-item-span" :class="{'user-item-online': user.online}">{{user.name}}</span>
            </div>
          </div>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="12" :offset="6" class="version-wrap">
          <p>版本号:V{{version}} | 上海餐加企业管理咨询有限公司</p>
          <p>技术服务热线：400-805-1711</p>
        </el-col>

        <el-dialog itle="提示" :visible.sync="versionLogDialog" size="tiny" :before-close="closeVersionLog">
          <ul>
            <li>
              <h2>版本号：1.5.5</h2>
            </li>
          </ul>
          <span slot="footer" class="dialog-footer">
            <el-button @click="versionLogDialog = false">取 消</el-button>
            <el-button type="primary" @click="versionLogDialog = false">确 定</el-button>
          </span>
        </el-dialog>
      </el-row>
    </div>
  </div>
</template>

<script>
  import {
    login,
    getUserList,
    getShopDetailInfo,
    getNotSyncOrderIds,
    systemLog,
    getVersions,
    getWeight
  } from '../../api/api';
  import keyboard from "../../components/keyboard/keyboard.vue";
  import bus from '../../utils/bus';


  export default {
    components: {keyboard},
    name: 'login',
    data() {
      return {
        fullscreenLoadingObj: {show: false, msg: "正在更新数据 ..."},
        loadWrap: true,
        checked: true,
        username: '',
        password: '',
        inputState: '',
        userList: [],
        keyBoradState: 'username',
        versionLog: false,
        shopInfo: {},
        version: '',
        isOnLine: navigator.onLine,
        displayAvatar: true,
        showKeyboard: false,
        versionLogDialog: false,
      };
    },
    mounted() {
      let that = this;
      this.getShopDetail();
      this.getVersions();
      this.getUserList();
      bus.$on("wsServerClose", function () {
        that.fullscreenLoadingObj.show = false;
      });
    },
    beforeDestroy() {
      this.removeEventListen();
    },
    methods: {
      displayAvatars() {
        this.displayAvatar = !this.displayAvatar;
      },
      getShopDetail() {
        getShopDetailInfo((data) => this.shopInfo = data)
      },
      getVersions() {
        getVersions((data) =>  this.version = data.version)
      },
      get(key) {
        if (this.inputState == 'username') {
          this.username = (key == 'del' ? this.username.substring(0, this.username.length - 1) : this.username += key);
        }
        if (this.inputState == 'password') {
          this.password = (key == 'del' ? this.password.substring(0, this.password.length - 1) : this.password += key);
        }
      },
      selectInput(inputState) {
        this.inputState = inputState;
        this.showKeyboard = true;
      },
      closeKeyboard() {
        this.showKeyboard = false;
      },
      getUserList() {// 加载用户列表，并默认选择第一账号
        getUserList( userList => {
          this.userList = userList || [];
          if (this.userList.length > 0) {
            let lastLoginUserId = localStorage.getItem("lastLoginUserId");
            setTimeout( () => {
              if (!lastLoginUserId) return this.choiceAccount(userList[0]);
              for(let user of this.userList){
                if(user.id == lastLoginUserId)  return this.choiceAccount(user);
              };
              this.choiceAccount(userList[0]);
            }, 100);
          }
          this.loadWrap = false;
        },  error => {
          this.loadWrap = false;
          this.$message.error(error.toString());
        })
      },
      choiceAccount(user) {
        this.username = user.name;
        var input = this.$refs.password;
        input.value = "";
        input.focus();
      },

      getVersionLog () {
        this.versionLogDialog = true;
      },
      closeVersionLog(done) {
        this.$confirm('确认关闭？')
          .then(_ => {
            done();
          })
          .catch(_ => {});
      },

      login(kick) {

        if (this.$utils.isNull(this.username)) return this.$message.error('请输入用户名！');
        if (this.$utils.isNull(this.password))  return this.$message.error('请输入密码！');

        var that = this;
        this.fullscreenLoadingObj.show = true;
        sessionStorage.setItem("uid", this.userList.map(item => item).filter(item => item.name == this.username)[0].id)
        login(this.username, this.$utils.pwdEncryption(this.password), kick , function (result) {
          // 将基础信息存入 session
          sessionStorage.setItem("username", that.username);

          sessionStorage.setItem("tvIp", result.shop_info.tv_ip);
          sessionStorage.setItem("userId", result.id);
          sessionStorage.setItem("brandId", result.brand_id);
          sessionStorage.setItem("shopId", result.shop_detail_id);
          sessionStorage.setItem("shopDet", JSON.stringify(result.shop_info));
          sessionStorage.setItem("superPwd", JSON.stringify(result.super_pwd));
          localStorage.setItem("lastLoginUserId", result.id);

          // 多终端 第一个人登陆，更新数据
          if (navigator.onLine && result.onlineNumber == 1) return that.syncArticleStock();
          that.toTable();

        }, function (errMsg) {
          that.fullscreenLoadingObj.show = false;
          that.$message.error(errMsg);
          if(errMsg === "用户已经登录"){
            that.$confirm(`【${that.username}】已登录，登录后，对方将下线！`, '提示', {confirmButtonText: '强制登录',cancelButtonText: '取消',type: 'warning'})
              .then(() => {
              systemLog("强制登陆", "当前登陆账号", that.username);
              that.login(true);
            }).catch(() => {
            });
          }
        });
      },
      syncArticleStock(syncOrderInfo) {
        let that = this;
        window.pomelo.notify("pos.webSocketHandler.syncArticleStock");

        bus.$on("syncArticleStockProgress", (progress) => {
          this.fullscreenLoadingObj.msg = "正在同步库存 ...  " + progress + "%";
        });

        bus.$on("syncArticleStockError", (errorMsg) => {
          this.fullscreenLoadingObj.show = false;
          this.$notify({ title: "Resto+", message: errorMsg,type: "error", duration: 2500});
          this.toTable();
        });

        bus.$on("syncArticleStockSuccess", () => {
          this.fullscreenLoadingObj.show = false;
          this.$notify({title: "Resto+",message: "菜品库存更新成功", type: "success",duration: 2500});
          this.toTable();
        });
      },

      toTable() {
        this.fullscreenLoadingObj.show = false;
        this.$message({ showClose: true, message: '登录成功', type: 'success', duration: 2000});
        this.shopkeeperModel()
      },

      shopkeeperModel() {
        var shopModel = JSON.parse(sessionStorage.getItem("shopDet")).shop_mode;
        let diningMode = {
          1: '/table/eatin',
          2: '/tvorder?notPrintOrder=true&orderType=all',
          3: '/table/eatin?notPrintOrder=true&orderType=all',
          5: '/table/eatin?notPrintOrder=true&orderType=all',
          6: '/table/eatin?notPrintOrder=true&orderType=all',
          7: '/tvorder?notPrintOrder=true&orderType=all'
        }
        if (shopModel == null || shopModel == 'undefined' || shopModel == undefined) return this.$message('未知店铺模式：' + shopModel);
        if (shopModel == 2) sessionStorage.setItem("shopModel", 2);
        if (shopModel == 7) {
          sessionStorage.setItem("shopModel", 7);
          // sessionStorage.setItem("getFoodWeight-status", true);
          // this.getFoodWeight()
        }
        return this.$router.push(diningMode[shopModel]);
      },
      // getFoodWeight(){
      //   var that = this;
      //   getWeight((resultlut)=> {
      //     console.log('称重',resultlut);
      //     if (sessionStorage.getItem("getFoodWeight-status")){
      //       that.getFoodWeight();
      //     }
      //     if (resultlut.error) {
      //       return false
      //     }
      //     if(resultlut.unit == 'kg' ){
      //       sessionStorage.setItem("weight", resultlut.weight * 2);
      //     }else {
      //       sessionStorage.setItem("weight", resultlut.weight / 500);
      //     }
      //   });
      // },
      download() {
        //  下载最新版本
        window.open('http://139.196.222.42:8580/resto-pos.exe')
      },

      removeEventListen() {
        bus.$off("pomeloInitSuccess")
        bus.$off("syncArticleStockProgress");
        bus.$off("syncArticleStockSuccess");
        bus.$off("syncOrderInfoProgress");
        bus.$off("syncOrderInfoSuccess");
        bus.$off("wsServerClose");
      }
    }
  };
</script>
<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
  .login {
    background-color: #f5f5f5;
    height: 3000px;
  }

  .login-wrap {
    background-color: #f5f5f5;
  }

  .logo-container {
    margin-top: 65px;
  }

  .header-logo {
    width: 80px;
    height: 80px;
    margin: 0 auto;
  }

  .logo {
    width: 80px;
    height: 80px;
    margin: 0 auto;
    position: absolute;
    border-radius: 50%;
  }

  .login-container {
    margin-top: -40px;
  }

  .input-container {
    width: 380px;
    height: 342px;
    margin: 0 auto;
    background-color: #FFFFFF;
  }

  .user-item-avatar {
    width: 23px;
    height: 23px;
    border-radius: 50%;
    position: absolute;
    left: 13px;
    margin-top: 10px;
  }

  .user-item-span {
    display: inline-block;
  }
  .user-item-online {
    color: #13CE66;
  }

  .avatar-drop-down {
    width: 195px;
    height: 41px;
    line-height: 41px;
    text-align: left;
    text-indent: 20px;
    margin-top: 30px;
    background-color: black;
    border-radius: 20px 0 0 20px;
  }

  .base-input {
    width: 300px;
    height: 40px;
    border: 1px solid #000;
    border-radius: 2px;

    outline: none;

    font-size: 18px;
    text-indent: 45px;
    color: #2f2f2f;
  }

  input:-webkit-autofill {
    -webkit-box-shadow: 0 0 0px 1000px white inset;
  }

  .username-img-container {
    position: absolute;
    display: inline-block;
    width: 40px;
    height: 40px;
    background-color: black;
  }

  .username-img-container img {
    width: 18px;
    height: 20px;
    margin-left: 11px;
    margin-top: 11px;
  }

  .password-container {
    margin-top: 10px;
    padding-left: 40px;
  }

  .remember-password {
    height: 30px;
    line-height: 30px;
    visibility: hidden;
  }

  .remember-info {
    font-size: 28px;
    width: 28px;
    height: 28px;
    position: absolute;
    display: inline-block;
  }

  .remember-password > span {
    display: inline-block;
    margin-left: 28px;
  }

  .login-btn {
    height: 50px;
    width: 300px;
    background-color: #212121;
    border-radius: 4px;
    color: #FFFFFF;
    font-size: 22px;
    line-height: 50px;
    text-align: center;
    cursor: pointer;
    margin-left: 40px;
  }

  .key-board {
    color: #fff;
    text-align: center;
    margin: 0 auto;
    font-family: Verdana, Sans-Serif;
  }

  .version-wrap {
    text-align: center;
    color: #999;
    text-align: center;
    position: fixed;
    bottom: 0;
    padding-bottom: 10px
  }

  .version-wrap > p {
    font-size: 8px;
  }

  .loading-wrap {
    margin-top: 15%;
    text-align: center;
    background-color: #FFFFFF;
    height: 100%;
  }

  .avatar-container {
    position: absolute;
    top: 25px;
    right: 0px;
    color: #FFFFFF;
  }

  .user-item {
    width: 195px;
    height: 41px;
    line-height: 41px;
    text-align: left;
    text-indent: 20px;
    margin-top: 10px;
    background-color: black;
    border-radius: 8px 0 0 8px;
    position: relative;
  }
</style>
