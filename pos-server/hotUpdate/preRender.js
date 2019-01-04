/**
 * Created with mhkz.
 * User: 943085517@qq.com
 * Date: 2018/9/10
 * Time: 11:09
 *
 */
document.write("<link rel='stylesheet' href='update.css'>");
var progressPercent = 0;
function preRender () {
    // var bodyContainer = document.createElement('div');
    var bodyContainer = document.querySelector(".container");
    bodyContainer.innerHTML = `
    <div style="height: 530px;width: 500px; margin: 142px auto 0px auto; background: #fff;position: relative">
      <div style="position: absolute;left: 0;top: 0;background: url('../assets/update_bg.png') no-repeat;background-size: 100%;height: 530px;width: 500px;">
        <!--<img src="../assets/logo.jpg" alt="resto-logo" style="height: 86px;width: 86px;">-->
        <div class="content">
            <div class="version-list">
             
            </div>
            <div class="button-confirm" id="confirm-update">
               <span >确定更新</span>
            </div>
        </div>
      </div>
        
    </div>
    <div class="right-info">欢迎使用Resto+餐饮管理系统</div> 
    `
    // document.body.appendChild(bodyContainer);
}

function progress() {
    // var progress = document.querySelector(".content");
    var bodyContainer = document.querySelector(".container");
    bodyContainer.innerHTML = `
    <div class="progress">
      <div class="loading">
        <img src="../assets/update_load.gif" alt="resto-logo" style="height: 400px;width: 400px;">
        <span class="load_num"></span>
      </div>
        <!--<div class="progress-bar">-->
            <!--<div class="progress-shadow"></div>-->
        <!--</div>-->
        <div class="show-update-text"></div>
    </div>
    `
}

function setProgress (progressWidth, text) {
    // var random = Math.ceil(Math.random() * 10);
    // progressPercent += progressWidth || random;
    // if (progressPercent > 100) progressPercent = 100;

    //var st = document.querySelector('.progress-bar');
    // st.style.width = `${progressWidth}%`;
    var load_num = document.querySelector('.load_num');
    load_num.innerHTML = `${progressWidth}%`;
    var showText = document.querySelector(".show-update-text");
    //showText.innerHTML = `${progressWidth}%\n${text}`;
    showText.innerHTML = `${text}`;
}

var sleep = function (delay) {
    var start = (new Date()).getTime();
    while ((new Date()).getTime() - start < delay) {
        continue;
    }
}