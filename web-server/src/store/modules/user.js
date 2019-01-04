import {getUserList} from '../../api/api'

const state = {
  userList: []
}

const getters = {
  userList: state => state.userList
}

const actions = {
  getUserList ({ commit }) {
    getUserList(userList => commit('setUserList', userList))
  }
}

const mutations = {
  setUserList (state, userList) {
    state.userList = userList
  }
}

export default {
  state,
  getters,
  actions,
  mutations
}
