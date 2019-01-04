<template>
  <div class="keybord" v-show = "showKeyboard">
    <kbd v-for="item of keyList" @click="getKey(item)">{{item}}</kbd>
  </div>
</template>

<script>
  import bus from '../../utils/bus'
    export default {
      name: 'smallkeyboard',
      data () {
        return {
          keyList:['1','2','3','4','5','6','7','8','9','0','清空','删除'],
          keyText: '',
          showKeyboard: false,
          difInput: ''
        };
      },

      mounted () {
        let that = this;
        bus.$on("show-keyboard",function (value) {
          if(value == "edit-input") { // 编辑框
            that.showKeyboard = true;
            that.difInput = "edit-input"
          }else if(value == "search-input") { // 搜索框
              that.showKeyboard = true;
              that.difInput = "search-input"
            } else if (value == "KBD") { // 键盘
              that.showKeyboard = true;
            } else if (value == "stock-input") { // 编辑库存
              that.showKeyboard = true;
              that.difInput = "stock-input"

            } else if(value == "editArticleCount"){ // 编辑菜品

              that.showKeyboard = true;
              that.difInput = "editArticleCount"
            } else if(value == "clearText") {
              that.keyText = ""
            } else {
              that.showKeyboard = false;
            }
        })
        bus.$on("clearValue",function (code) {
          that.keyText = ""
        })
      },

      beforeDestroy () {
        bus.$off("show-keyboard");
        bus.$off("clearValue")
      },

      methods: {
        getKey(value) {
            switch (value) {
              case "清空":
                this.keyText = "";
                break;
              case "删除":
                this.keyText = this.keyText.substring(0, this.keyText.length-1);
                break;
              default:
                this.keyText += value;
                break;
            }
            bus.$emit("keyText", this.keyText)
            if(this.difInput == "search-input") {
              bus.$emit("searchKey", this.keyText)
            } else if(this.difInput == "stock-input"){
              bus.$emit("stockText", this.keyText)
            } else if(this.difInput == "editArticleCount") {
              bus.$emit("editArticleCount", this.keyText)
            }else if(this.difInput == "edit-input"){
              bus.$emit("edit-input", this.keyText)
            }

        }
      }
    }
</script>

<style scoped>
  body {
    width: 100%;
    height: 100%;
    margin: 0px;
    padding: 0px;
    text-align: center;
    user-select: none;
  }
  .keybord {
    position: absolute;
    right: 0px;
    bottom: 0px;
    /* height: 35%;
    width: 20%; */
    height: 240px;
    width: 210px;
    border: 1px solid rgba(255, 255, 255, .8);
    font-size: 0px;
    padding: 0px;
    display: flex;
    justify-content: space-around;
    flex-wrap: wrap;
    align-items: center;
    border-radius: 5px;
     /*background: linear-gradient(60deg, rgba(158, 180, 185, 1), rgba(222, 157, 193, 1) 50%, rgba(169, 156, 173, 1) 100%);*/
    background-color: rgba(0, 0, 0, .4);
    /*background-color: #666666;*/
    /*opacity: 0.8;*/
    /* box-shadow: 0 0.05em 0.1em rgba(0, 0, 0, .5); */
  }
  .keybord>kbd {
    /* width: 20%;
    height: 20%; */
    width: 53.1px;
    height: 53.4px;
    border: 1px solid rgba(255, 255, 255, .8);
    cursor: pointer;
    border-radius: 8px;
    display: flex;
    justify-content: space-around;
    align-items: center;
     background-color: rgba(255, 255, 255, .8);
    /*background-color: #FFFFFF ;*/
    font-size: 24px;
    color: #424242;
    opacity: 1;
    margin: 1px;
     box-shadow: 0 0.2em 0.4em rgba(0, 0, 0, .5);
  }
</style>
