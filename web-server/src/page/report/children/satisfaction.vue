<template>
  <el-row class="satisfaction">
    <el-row class="tool-bar">
      <el-col :span="10" class="tool-title">
        <h2>Resto+ 测试店铺</h2>
      </el-col>
      <el-col :span="14" class="tool-content">
        <el-date-picker
          v-model="reportDate"
          align="right"
          type="date"
          placeholder="选择日期"
          :picker-options="pickerOptions">
        </el-date-picker>
        <el-button type="primary" class="tool-search-btn" style=" background-color: #FFBF34;border:none;">查询</el-button>
      </el-col>
    </el-row>
    <el-row class="satisfaction-info">
      <el-col :span="12">
        <el-row>
          <el-col :span="12">
            <p class="satisfaction-item"><strong>今日店铺评分：</strong> 98.34分</p>
          </el-col>
          <el-col :span="12">
            <p class="satisfaction-item"><strong>本旬店铺评分：</strong> 98.34分</p>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <p class="satisfaction-item"><strong>今日品论总数：</strong> 45条</p>
          </el-col>
          <el-col :span="12">
            <p class="satisfaction-item"><strong>本旬评论总数：</strong> 85条</p>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <p class="satisfaction-item"><strong style="color: red">今日好评总数：</strong> 45条</p>
          </el-col>
          <el-col :span="12">
            <p class="satisfaction-item"><strong style="color: red">本旬好评总数：</strong> 85条</p>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <p class="satisfaction-item"><strong style="color: red">今日差评总数：</strong> 45条</p>
          </el-col>
          <el-col :span="12">
            <p class="satisfaction-item"><strong style="color: red">本旬差评总数：</strong> 85条</p>
          </el-col>
        </el-row>
      </el-col>
      <el-col :span="12" class="satisfaction-evaluate">
          <img src="../../../assets/smile.png" class="satisfaction-img"/>
      </el-col>
    </el-row>
    <el-row class="commentTable" :style="{ height: commentTableHeight + 'px' }">
      <el-table
        :data="commentList"
        style="width: 100%">
        <el-table-column
          type="index"
          label="NO."
          width="70">
        </el-table-column>
        <el-table-column
          prop="createTime"
          label="评论时间">
        </el-table-column>
        <el-table-column
          prop="phoneNumber"
          label="用户手机号"
          width="130">
        </el-table-column>
        <el-table-column
          prop="nickname"
          label="微信昵称"
          width="100">
        </el-table-column>
        <el-table-column
          prop="level"
          label="星级"
          width="100">
        </el-table-column>
        <el-table-column
          prop="content"
          label="评价内容"
          width="120">
        </el-table-column>
        <el-table-column
          prop="id"
          label="查看详情">
          <template slot-scope="scope">
            <el-button size="small"
              @click="commentDetail(scope.row.id)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-row>
    <el-row class="preview-bar">
      <el-col :span="18">
        <p class="preview-info">当前页差评数：8条，总计 16 条</p>
      </el-col>
      <el-col :span="6" class="recharge-page">
        <i class="iconfont icon-arrow-left page-left" ></i>
        <span >1 / 3</span>
        <i class="iconfont icon-arrow-right page-right"></i>
      </el-col>
    </el-row>
  </el-row>
</template>

<script>
  export default {
    name: 'satisfaction',
    data () {
      return {
        pickerOptions: {
          shortcuts: [{
            text: '今天',
            onClick(picker) {
              picker.$emit('pick', new Date());
            }
          }, {
            text: '昨天',
            onClick(picker) {
              const date = new Date();
              date.setTime(date.getTime() - 3600 * 1000 * 24);
              picker.$emit('pick', date);
            }
          }, {
            text: '一周前',
            onClick(picker) {
              const date = new Date();
              date.setTime(date.getTime() - 3600 * 1000 * 24 * 7);
              picker.$emit('pick', date);
            }
          }]
        },
        reportDate : '',
        commentList: [
          {
            id: '04asdf64a6sdf4a6sfd4asf6asd4f',
            createTime : '2017-08-29 11:13:23',
            phoneNumber: '17671111590',
            nickname: 'Pos',
            level: 3000,
            content: 500
          },
          {
            id: '04asdf64a6sdf4a6sfd4asf6asd4f',
            createTime : '2017-08-29 11:13:23',
            phoneNumber: '17671111590',
            nickname: 'Pos',
            level: 3000,
            content: 500
          },
          {
            id: '04asdf64a6sdf4a6sfd4asf6asd4f',
            createTime : '2017-08-29 11:13:23',
            phoneNumber: '17671111590',
            nickname: 'Pos',
            level: 3000,
            content: 500
          }
        ],
        commentTableHeight : 0
      };
    },
    mounted : function () {
      this.commentTableHeight = document.body.clientHeight - 372;
    },
    methods: {
      commentDetail (id){
        this.$message(id);
      }
    }
  };
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
  .satisfaction{
    height: 100%;
    width: 100%;
  }
  .tool-bar{
    height: 60px;
    line-height: 60px;
    font-weight: bold;
    border-bottom: 2px solid #E9E9E9;
  }
  .tool-title{
    padding-left: 20px;
  }
  .tool-search-btn{
    margin-left: 30px;
  }
  .el-button--primary{
    background-color: #FFBF34;
    border-color: #FFBF34;
    padding: 10px 30px;
  }
  .el-button--small{
    background-color : #FFBF34;
    border-color: #FFBF34;
    padding: 7px 30px;
    color: #FFFFFF;
  }
  .satisfaction-info{
    padding: 10px 20px;
    background-color: #E9E9E9;
  }
  .satisfaction-item{
    height: 30px;
    line-height: 30px;
    font-size: 16px;
  }
  .satisfaction-evaluate{
    text-align: right;
    padding-right: 30px;
    padding-top: 20px;
  }
  .satisfaction-img{
    height: 80px;
    width: 80px;
  }
  .commentTable{
    margin-top: 20px;
  }
  .preview-bar{
    /*height: 30px;*/
    /*border: 1px solid red;*/
    border-top: 2px solid #E9E9E9;
  }
  .preview-info{
    height: 50px;
    line-height: 50px;
    font-size: 20px;
    font-weight: bold;
    padding-left: 20px;
  }
  .recharge-page{
    height: 50px;
    line-height: 50px;
    font-size: 40px;
  }
  .page-left{
    font-size: 40px;
    cursor: pointer;
  }
  .page-right{
    font-size: 40px;
    cursor:pointer;
  }
</style>
