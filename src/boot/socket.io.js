import Vue from 'vue'
import VueSocketIO from 'vue-socket.io'

Vue.use(new VueSocketIO({
  debug: false,
  connection: 'localhost:8888', // [调试环境使用]
  // connection: '', // [生成环境使用] 此项为空字符串时，默认将尝试连接到提供当前页面的主机
  options: {
    autoConnect: false,
    query: {
      auth_token: ''
    }
  }
}))