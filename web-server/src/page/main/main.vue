<template>
  <div class="main-page" @click.native="closeKeyBoard($event)">
    <appHeader></appHeader>
    <div class="content">
      <router-view></router-view>
      <smallkeyboard></smallkeyboard>
      <fattykeyboard></fattykeyboard>
    </div>
    <appFooter></appFooter>
  </div>
</template>

<script>
  import appHeader from 'components/header/header.vue';
  import appFooter from 'components/footer/footer.vue';
  import smallkeyboard from '../../components/keyboard/smallkeyboard';
  import fattykeyboard from '../../components/keyboard/fattykeyboard'
  import bus from '../../utils/bus'
  export default {
    name: 'main-page',
    components: {
      appHeader,
      appFooter,
      smallkeyboard,
      fattykeyboard
    },
    data () {
      return {};
    },
    mounted(){
      window.addEventListener("click",function (even) {
        var name = even.target.name;
        var data_name = even.target.dataset.name || ''
        var nodeName =  even.target.nodeName;
        var data = even.target.getAttribute("data");
          /*if(data == 'fattykeyboard') {
            bus.$emit('show-keyboard', 'refundCommand');
            bus.$emit('show-keyboard', 'closeBusiness');
            return;
          }*/
          if(nodeName == 'KBD') {
            bus.$emit('show-keyboard','KBD');
          } else if(data == 'fattykeyboard'){
            bus.$emit('show-keyboard','FKBD');
          }else if(data_name){
            bus.$emit('show-keyboard',data_name);
          }else {
            bus.$emit('show-keyboard', name);
          }
      });

    },
    methods:{
    }
  };
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
  .main-page{
    width: 100%;
    height: 100%;
  }
  .content{
    position: absolute;
    top: 64px;
    bottom: 49px;
    left: 0;
    right: 0;
    margin: 0 auto;
    /*z-index: -1;*/
  }
</style>
