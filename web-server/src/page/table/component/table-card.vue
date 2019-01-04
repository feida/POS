<template>
  <el-card :body-style="{ padding: '10px',position: 'relative'}">
    <div :class="tableCardClass(table.order)" v-if="table.order"></div>
    <p class="table-number">{{table.table_number}}</p>
    <div class="detail" v-if="table.order">
      <p>{{table.order.customer_count}}/{{table.customer_count}}</p>
      <p>¥ {{ formatMoney(table.order.count_with_child || table.order.order_money) }}</p>
      <p>{{getTimeDiff(table.order.create_time)}}</p>
    </div>
    <div class="detail" v-else>
      <p>0/{{table.customer_count}}</p>
      <p>¥ 0</p>
      <p>0分钟</p>
    </div>
  </el-card>
</template>

<script>
  export default {
    name: 'tableCard',
    props: ['table'],
    data() {
      return {};
    },
    mounted() {

    },
    methods: {
      tableCardClass(order){
        var cardClass = [];
        if(order){
          if(order.production_status === 0){
            cardClass.push("table-card-wait-order");
          }else if(order.order_state === 1){
            cardClass.push("table-card-no-pay");
          }else{
            cardClass.push("table-card-pay-order");
          }
        }
        return cardClass;
      },
      formatMoney(money){
        console.log("\n\n\n");
        console.log(parseInt(money));
        console.log("\n\n\n");
        return money.toString().indexOf(".") != -1 ? parseInt(money) : parseFloat(money).toFixed(2);
      }
    }
  };
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
  .table-card {
    margin-bottom: 15px;
    cursor: pointer;
  }
  .table-card-pay-order {
    position: absolute;
    top: 0px;
    right: 0px;
    width: 0;
    height: 0;
    border-top: 50px solid #26bb02;
    border-left: 30px solid transparent;
  }
  .table-card-no-pay {
    position: absolute;
    top: 0px;
    right: 0px;
    width: 0;
    height: 0;
    border-top: 50px solid #bb0202;
    border-left: 30px solid transparent;
  }
  .table-card-wait-order {
    position: absolute;
    top: 0px;
    right: 0px;
    width: 0;
    height: 0;
    border-top: 50px solid #025ebb;
    border-left: 30px solid transparent;
  }
  .table-number {
    width: 100%;
    font-size: 4vh;
    font-weight: bold;
    text-align: center;
  }
  .detail {
    text-align: center;
  }
</style>
