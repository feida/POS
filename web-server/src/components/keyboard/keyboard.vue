<template>
  <ul class="keyboard clearfloat">
    <li v-for="key in keyList" :class="{delete: key === 'Delete', tab: key === 'Tab', capslock: key === 'Caps', enter: key === 'Enter', shift: key === 'Shift', space: key === 'Space', shifted: (key === 'Shift') && hasShifted, capsed: (key === 'Caps') && hasCapsed }" @click="clickKey(key)" style="background-color: #fff" v-text="key">
    </li>
  </ul>
</template>
<script>
export default {
  name: 'keyboard',
  data() {
    return {
      count: 0,
      keyboardText: '',
      keyList: [],
      normalKeyList: ['`', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '=', 'Delete',
        'Tab', 'q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '[', ']', '\\',
        'Caps', 'a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', "'", 'Enter',
        'Shift', 'z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/', 'Shift',
        'Space'],
      shiftedKeyList: [
        '~', '!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '_', '+', 'Delete',
        'Tab', 'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', '{', '}', '|',
        'Caps', 'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ':', '"', 'Enter',
        'Shift', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', '<', '>', '?', 'Shift',
        'Space'
      ],
      capsedKeyList: ['`', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '=', 'Delete',
        'Tab', 'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', '[', ']', '\\',
        'Caps', 'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ';', "'", 'Enter',
        'Shift', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', ',', '.', '/', 'Shift',
        'Space'],
      hasShifted: false,
      hasCapsed: false
    }
  },
  mounted: function () {
    this.keyList = this.normalKeyList;
  },
  methods: {
    send() {
      this.$emit('childKey', this.keyboardText)
      console.log(this.keyboardText)
    },
    clickKey(key) {
      switch (key) {
        case "Delete":
          // let kbt = this.keyboardText;
          this.keyboardText = 'del'
          break;
        case "Tab":
          this.keyboardText = "\t";
          break;
        case "Enter":
          this.keyboardText = "\n";
          break;
        case "Space":
          this.keyboardText = " ";
          break;
        case "Caps":
          this.hasCapsed = !this.hasCapsed;
          this.keyList = this.hasCapsed ? this.capsedKeyList : this.normalKeyList;
          this.keyboardText = '';
          break;
        case "Shift":
          this.hasShifted = !this.hasShifted;
          this.keyList = this.hasShifted ? this.shiftedKeyList : this.normalKeyList;
          this.keyboardText = ''
          break;;
        default:
          this.keyboardText = key.toString();
          break;
      }
      this.send();

      // if (this.girls) {
      //   this.keyboardText = ''
      //   this.girls == false
      // }
    },
  },
}
</script>
<style scoped>
.keyboard {
  width: 788px;
  margin: 0 auto;
  padding: 6px;
  list-style: none;
  user-select: none;
  color: #000;
  font-weight: bold;
  background-color: rgba(0,0,0,.4);
}
.clearfloat:after {
  display:block;
  clear:both;
  content:"";
  visibility:hidden;
  height:0
}
.clearfloat{
  zoom:1
}

li {
  float: left;
  margin: 2px;
  margin-left: 2px;
  /*padding:3px;*/
  width: 50px;
  height: 50px;
  line-height: 50px;
  text-align: center;
  background: #fff;
  border: 1px solid #e5e5e5;
  border-radius: 5px;
}

li:hover {
  position: relative;
  border-color: gray;
  cursor: pointer;
}

li:active {
  top: 1px;
  left: 1px;
}

.tab,
.delete {
  width: 70px;
}

.capslock {
  width: 80px;
}

.enter {
  width: 94px;
}

.shift {
  width: 114px;
}

.space {
  clear: left;
  width: 772px;
}

.shifted {
  position: relative;
  top: 1px;
  left: 1px;
  border-color: #e5e5e5;
  cursor: pointer;
}

.capsed {
  position: relative;
  top: 1px;
  left: 1px;
  border-color: #e5e5e5;
  cursor: pointer;
}
</style>
