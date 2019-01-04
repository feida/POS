/**
 * @author wxh on 2017/11/13
 * @copyright
 * @desc
 */
import lodash from 'lodash';




function install(Vue) {
  Vue.prototype.$lodash = lodash;
}

if (typeof window !== 'undefined' && window.Vue) {
  install(window.Vue);
}

export default {
  install : install
}
