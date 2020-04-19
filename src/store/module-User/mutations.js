const mutations = {
  INIT (state, user) {
    state.name = user.name
    state.group = user.group
  },
  
  SET_AUTH (state, flag) {
    state.auth = flag
  }
}

export default mutations