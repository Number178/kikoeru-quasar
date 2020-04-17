import Vue from 'vue'
import axios from 'axios'
import { LocalStorage } from 'quasar'

// 为每次请求带上 token
axios.interceptors.request.use(
  config => {
    const token = LocalStorage.getItem('jwt-token')  
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  err => {
    return Promise.reject(err)
  }
);

Vue.prototype.$axios = axios
