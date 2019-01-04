/**
 * 常用工具
 * Created by Lmx on 2017/7/6.
 */

export const formatDate = function (date, fmt) {
  if (!date) {
    date = new Date();
  };
  var o = {
    'M+': date.getMonth() + 1, // 月份
    'd+': date.getDate(), // 日
    'h+': date.getHours(), // 小时
    'm+': date.getMinutes(), // 分
    's+': date.getSeconds(), // 秒
    'q+': Math.floor((date.getMonth() + 3) / 3), // 季度
    'S': date.getMilliseconds() // 毫秒
  };
  if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (date.getFullYear() + '').substr(4 - RegExp.$1.length));
  for (var k in o) {
    if (new RegExp('(' + k + ')').test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length === 1) ? (o[k]) : (('00' + o[k]).substr(('' + o[k]).length)));
  }
  return fmt;
};

/**
 * 计算时间间隔
 * @param getDate 创建的时间
 * */
export const timeD = function (getDate) {
    console.log('timeDifference',getDate)
    var differenceMinute = Math.floor(((new Date()).getTime() - getDate) / (60 * 1000)); // 算出来的是分钟
    // return `${differenceMinute}m`;
    return getDate
}
