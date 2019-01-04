<template>
  <div id="keyboard" v-show="show">
    <div id="main">
      <div id="bar">数字键盘，拖拽移动<span @click="close">X</span></div>
      <el-row id="content">
        <el-col :span="8" v-for="key in keyNum" class="key-wrapper" :key="key">
          <el-button class="key" @click="keydown(key)">{{key}}</el-button>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script>
  import bus from '../../../utils/bus'
  export default {
    name: 'keyboard',
    props : ['show'],
    data () {
      return {
        keyNum : ['7','8','9','4','5','6','1','2','3','0','退格','清空'],
        newInputVal : '',
      };
    },
    watch : {
      show : function (newVal) {
        newVal && (this.newInputVal = '');
      }
    },
    mounted : function () {
      let that = this;
      this.initDrag();
      bus.$on("clearValue", function (clearValue) {
        that.newInputVal = "";
      })
    },
    methods: {
      keydown (key) {
        console.log(key);
        if("退格" == key){
          this.newInputVal = this.newInputVal.substring(0, this.newInputVal.length - 1)
        }else if("清空" == key){
          this.newInputVal = "";
        }else{
          this.newInputVal += key;
        }
        this.change();
      },
      close (){
        this.newInputVal = '';
        this.$emit('close');
      },
      change () {
        this.$emit('change',this.newInputVal);
      },
      initDrag (){
        document.getElementById("keyboard").style.left = document.body.clientWidth - 270 + "px";
        document.getElementById("keyboard").style.top = document.body.clientHeight - 395 + "px";
        var target = document.getElementById("keyboard");
        var bar = document.getElementById("bar");
        var params = {
          left: 0,
          top: 0,
          currentX: 0,
          currentY: 0,
          flag: false,
          getCss (o,key){
            return o.currentStyle? o.currentStyle[key] : document.defaultView.getComputedStyle(o,false)[key];
          }
        };
        if(params.getCss(target, "left") !== "auto"){
          params.left = params.getCss(target, "left");
        }
        if(params.getCss(target, "top") !== "auto"){
          params.top = params.getCss(target, "top");
        }
        //o是移动对象
        bar.onmousedown = function(event){
          params.flag = true;
          if(!event){
            event = window.event;
            //防止IE文字选中
            bar.onselectstart = function(){
              return false;
            }
          }
          var e = event;
          params.currentX = e.clientX;
          params.currentY = e.clientY;
        };
        document.onmouseup = function(){
          params.flag = false;
          if(params.getCss(target, "left") !== "auto"){
            params.left = params.getCss(target, "left");
          }
          if(params.getCss(target, "top") !== "auto"){
            params.top = params.getCss(target, "top");
          }
        };
        document.onmousemove = function(event){
          var e = event ? event: window.event;
          if(params.flag){
            var nowX = e.clientX, nowY = e.clientY;
            var disX = nowX - params.currentX, disY = nowY - params.currentY;
            target.style.left = parseInt(params.left) + disX + "px";
            target.style.top = parseInt(params.top) + disY + "px";
            if (event.preventDefault) {
              event.preventDefault();
            }
            return false;
          }
        }
      }
    }
  };
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
  .keyboard{
    height: 300px;
    width: 500px;
    background-color: #EEEEEE;
  }
  #keyboard{
    position:absolute;
    left:0px;
    top:0px;
    padding:5px;
    background:#f0f3f9;
    font-size:12px;
    -moz-box-shadow:2px 2px 4px #666666;
    -webkit-box-shadow:2px 2px 4px #666666;
  }
  #main{
    border:1px solid #a0b3d6;
    background:white;
  }
  #bar{
    line-height:24px;
    background:#beceeb;
    border-bottom:1px solid #a0b3d6;
    padding-left:5px;
    cursor:move;
  }
  #bar > span{
    float: right;
    cursor: pointer;
    width: 30px;
    background-color: aliceblue;
    text-align: center;
  }
  #content{
    width:250px;
    height:250px;
    padding:10px 5px;
  }
  .key-wrapper{
    text-align: center;
    line-height: 60px;
  }
  .key{
    width: 80%;
  }
</style>
