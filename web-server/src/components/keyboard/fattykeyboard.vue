<template>
    <ul id="keyboard_5xbogf8c" style="font-size: 80px; display: block;" v-show="showFattyKeyboard" data-name="哈哈">
      <li v-for="key of (keyList = CapsLock == true ? capitalKeyList : lowerCaseKeyList)" @click="getKey(key)" data="fattykeyboard">{{key}}</li>
    </ul>
</template>

<script>
  import bus from '../../utils/bus'
  export default {
    name: 'fattykeyboard',
    data () {
      return {
        keyList: [],
        lowerCaseKeyList:['1','2','3','4','5',
          '6','7','8','9','0','←','q','w','e',
          'r','t','y','u','i','o','p','','a',
          's','d','f','g','h','j','k','l','Exit','capslock',
          'z','x','c','v','b','n','m','-','/','clear'],
        capitalKeyList:['1','2','3','4','5',
          '6','7','8','9','0','←','Q','W','E',
          'R','T','Y','U','I','O','P','','A',
          'S','D','F','G','H','J','K','L','Exit','capslock',
          'Z','X','C','V','B','N','M','_','.','clear'],
        CapsLock: false,
        keyText: '',
        showFattyKeyboard: false,
        difInput: ''
      };
    },

    mounted() {
      let that = this;
      bus.$on("show-keyboard",function (value) {
        if(value == 'refundCommand') {
          that.showFattyKeyboard = true;
          that.difInput = "refundCommand"   //退菜
        } else if (value == 'closeBusiness'){
          that.showFattyKeyboard = true;
          that.difInput = "closeBusiness"   //结店身份口令
        } else if (value == 'FKBD'){
          that.showFattyKeyboard = true; // 键盘
        }else {
          that.showFattyKeyboard = false;
          that.keyText = '';
        }
      })
    },

    beforeDestroy () {
      bus.$off("show-keyboard")
    },

    methods: {
      getKey(value) {
        switch (value) {
          case 'capslock':
            this.CapsLock = !this.CapsLock;
            break;
          case '←':
            this.keyText = this.keyText.substring(0,this.keyText.length-1)
            break
          case 'clear':
            this.keyText = ''
            break;
          case 'Exit':
            this.showFattyKeyboard = false;
            break
          default :
            this.keyText += value;
        }
        //bus.$emit('refund-command',this.keyText)

        if(this.difInput == "refundCommand") {
          bus.$emit('refund-command',this.keyText)
        } else if(this.difInput == "closeBusiness"){
          bus.$emit("close-business", this.keyText)
        }
      },
    }
  }
</script>





<style scoped>
  #keyboard_5xbogf8c, #keyboard_5xbogf8c li {
    list-style: none;
    margin: 0;
    padding: 0;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
  }

  #keyboard_5xbogf8c {
    position: fixed;
    z-index: 99999;
    width: 9.30em;
    /*background: rgba(158, 180, 185, 1);*/
    /*background: -webkit-gradient(linear, 0 50%, 100% 0, from(rgba(158, 180, 185, 1)), to(rgba(169, 156, 173, 1)), color-stop(50%, rgba(222, 157, 193, 1)));*/
    /*background: linear-gradient(60deg, rgba(158, 180, 185, 1), rgba(222, 157, 193, 1) 50%, rgba(169, 156, 173, 1) 100%);*/
    background: rgba(0,0,0,.5);
    padding-left: 0.1em;
    border-radius: 0.05em;
    padding-top: 0.1em;
    box-shadow: 0 0.05em 0.1em rgba(0, 0, 0, .5);
    display: none;
    font-size: 100px;
    right: 0.05em;
    bottom: 0.05em;
    -webkit-text-size-adjust: none;
  }

  #keyboard_5xbogf8c_left {
    position: absolute;
    width: 0.2em;
    height: 0.2em;
    font-size: 1em;
    top: 0em;
    left: 0em;
    cursor: nw-resize;
  }

  #keyboard_5xbogf8c_right {
    position: absolute;
    width: 0.2em;
    height: 0.2em;
    font-size: 1em;
    top: 0em;
    right: 0em;
    cursor: ne-resize;
  }

  #keyboard_5xbogf8c ::after {
    content: "";
    display: table;
    clear: both;
  }

  #keyboard_5xbogf8c li {
    position: relative;
    font-family: arial, "Vrinda";
    width: 2.88em;
    height: 2.8em;
    line-height: 2.8em;
    background-color: #fff;
    border-radius: 0.2em;
    float: left;
    text-align: center;
    font-size: 0.25em;
    vertical-align: text-top;
    margin-right: 0.4em;
    margin-bottom: 0.4em;
    box-shadow: 0 0.2em 0.4em rgba(0, 0, 0, .5);
    cursor: pointer;
    position: relative;
    overflow: visible;
  }

  #keyboard_5xbogf8c li:active {
    box-shadow: inset 0 0.04em 0 rgba(0, 0, 0, .5);
    top: 0.08em;
  }

  #keyboard_5xbogf8c li:nth-child(11), #keyboard_5xbogf8c li:nth-child(43), #keyboard_5xbogf8c li:nth-child(22) {
    /*background: rgba(188, 188, 188, .5);*/
    font-size: 0.19em;
    width: 4.66em;
    height: 3.5em;
    line-height: 3.5em;
    border-radius: 0.25em;
    margin-right: 0.5em;
    margin-bottom: 0.5em;
    box-shadow: 0 0.25em 0.5em rgba(0, 0, 0, .5);
  }

  #keyboard_5xbogf8c li:nth-child(43) {
    width: 3.0em;
  }

  #keyboard_5xbogf8c li:nth-child(12) {
    margin-left: 0.96em;
  }

  #keyboard_5xbogf8c li:nth-child(23) {
    margin-left: 1.92em;
  }

  #keyboard_5xbogf8c li:nth-child(22) {
    width: 3.5em;
    height: 4.2em;
    /*background-color: rgba(238, 238, 238, 1);*/
    border-bottom-right-radius: 0em;
    border-bottom-left-radius: 0em;
    position: absolute;
    top: 4.8em;
    right: 0.1em;
    box-shadow: inset 0 0em 0 rgba(0, 0, 0, .5);
  }

  #keyboard_5xbogf8c li:nth-child(32) {
    width: 4.9em;
    top: 0;
    /*background-color: rgba(238, 238, 238, 1);*/
    border-top-right-radius: 0em;
    padding-left: 0.32em;
    box-shadow: inset 0 0em 0 rgba(0, 0, 0, .5);

  }

  #keyboard_5xbogf8c li:nth-child(33) {
    font-size: 0.20em;
    width: 5em;
    height: 3.5em;
    line-height: 3.5em;
    border-radius: 0.25em;
    margin-right: 0.5em;
    margin-bottom: 0.5em;
    box-shadow: 0 0.25em 0.5em rgba(0, 0, 0, .5);
  }

  #keyboard_5xbogf8c li:nth-child(41) {
    box-sizing: border-box;
    padding-top: 0.6em;
  }

  #keyboard_5xbogf8c li:nth-child(41) span {
    display: block;
    line-height: 0.6;
  }

  #keyboard_5xbogf8c li:nth-child(42) {
    box-sizing: border-box;
    padding-top: 0.6em;
  }

  #keyboard_5xbogf8c li:nth-child(42) span {
    display: block;
    line-height: 0.6;
  }
</style>
