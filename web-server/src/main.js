// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue';
import ElementUI from 'element-ui';
import 'element-ui/lib/theme-default/index.css';

import './style/pos-icon/iconfont.css';
import './style/pos-icon/iconfont';

//请求插件
import axios from 'axios';
import jsonpAdapter from 'axios-jsonp';

import $ from 'jquery'
// import VueHotkey from 'v-hotkey';    // 全局快捷键
import App from './App';
import router from './router';

import websocketUtil from "./utils/websocketUtil";
import tvWebsocket from "./utils/tvWebsocket"
import vueUtils from "./utils/vue-utils";
import bus from "./utils/bus";

import Properties from './properties';

// vuex
import store from './store/index'


Vue.config.productionTip = true;

Vue.prototype.$axios = axios;

Vue.use(ElementUI);
// Vue.use(vueWebsocket,"ws://139.196.222.42:8680/pos/orderServer");
Vue.use(websocketUtil);
Vue.use(tvWebsocket);
Vue.use(vueUtils);
Vue.use(Properties);
// Vue.use(connect);
/* eslint-disable no-new */
window.appControl = new Vue({
  el: '#app',
  router,
  store,
  template: '<App/>',
  components: {
    App
  },
  created(){
    window.appControl = this;

  },
  beforeDestroy() {
    bus.$off("kickUser");
  },
  mounted(){
    let that = this;
    let userId = sessionStorage.getItem("userId");
    if(userId && this.$route.path != "/login"){
      setTimeout(function () {
        window.pomelo.notify("connector.entryHandler.reconnection", { userId: userId });
      }, 1500);
    }
    bus.$on("kickUser", function () {
      if(that.$route.path != "/login"){
        that.$router.push('/login');
        that.$message("账号已在别的客户端登录！");
      }
    });
  }
});
