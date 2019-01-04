<template>
  <div id="app">
    <router-view></router-view>
  </div>
</template>

<script>
export default {
  name: 'app'
};
</script>

<style>
@import './style/common.css';
html,
body {
  height: 100%;
  width: 100%;
  overflow-y: hidden;
  overflow-x: hidden;
  /*  禁止文本被选中   */
  -moz-user-select: none;
  /*火狐*/
  -webkit-user-select: none;
  /*webkit浏览器*/
  -ms-user-select: none;
  /*IE10*/
  -khtml-user-select: none;
  /*早期浏览器*/
  user-select: none;
}

#app {
  height: 100%;
  width: 100%;
}

</style>
