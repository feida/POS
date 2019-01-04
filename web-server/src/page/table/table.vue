<template>
  <el-row class="table-page">
    <router-view></router-view>
  </el-row>
</template>

<script>
  export default {
    name: 'table-page',
    data () {
      return {

      };
    },
    watch: {
      '$route.path': function (path) {
        if(path == "/table"){
          this.$router.push("/table/eatin");
        }
      },
    },
    created(){
      if(this.$route.path == "/table"){
        this.$router.push("/table/eatin");
      }
    },
    mounted(){

    },
    methods:{

    }
  };
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
  .table-page{
    width: 100%;
    height: 100%;
  }
  .left{
    height: 100%;
    position: relative;
    box-shadow: 0 0px 20px 0 rgba(0, 0, 0, .25), 0 0 6px 0 rgba(0, 0, 0, .04);
  }
  .right{
    height: 100%;
  }
</style>
