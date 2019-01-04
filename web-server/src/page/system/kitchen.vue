<template>

    <div>

      <h2>厨房管理</h2>
      <el-row style="border-top: 10px;">
        <el-col :span="8">序号</el-col>
        <el-col :span="8">厨房</el-col>
        <el-col :span="8">状态</el-col>
      </el-row>
      <el-row style="margin: 10px 3px">
        <template v-for="(item, index) of kitchenList">
          <el-col :span="8">{{index + 1}}</el-col>
          <el-col :span="8">{{item.name}}</el-col>
          <el-col :span="8">
            <el-switch v-model="item.status" on-color="#13ce66" off-color="#ff4949" @change="changeKitchenState(item)">
          </el-switch>
          </el-col>
        </template>
      </el-row>

    </div>
</template>

<script>
    import {getAllPrint, changeKitchenStatus} from '../../api/api'
    export default {
        name: "kitchen",
        data(){
          return {
            kitchenList: []
          }
        },
        mounted(){
          this.getAllPrint();
        },
        methods: {
          getAllPrint(){
            getAllPrint( (result) => {
              result.map(item => {
                this.kitchenList.push({
                  id: item.id,
                  name: item.name,
                  status: !item.status // 服务端定义的字段反来， 用ElementUI的switch滑块不能反着来，注意转化 0 是开启 1 是关闭
                })
              })
            })
          },

          changeKitchenState(item){
            var status = !item.status ? 1 : 0;
            var kitchenId = item.id;
            changeKitchenStatus(kitchenId, status, () => {
              this.$socket.syncKitchenStatus(kitchenId, status);
            })
          }
        }
    }
</script>

<style scoped>

</style>
