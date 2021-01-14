import Vue from 'vue'
import Vuex from 'vuex'

import AudioPlayer from './module-AudioPlayer'
import User from './module-User'

Vue.use(Vuex)

/*
 * If not building with SSR mode, you can
 * directly export the Store instantiation;
 *
 * The function below can be async too; either use
 * async/await or return a Promise which resolves
 * with the Store instance.
 */

export default function (/* { ssrContext } */) {
  const Store = new Vuex.Store({
    modules: {
      AudioPlayer,
      User
    },

    // enable strict mode (adds overhead!)
    // for dev mode only
    // eslint-disable-next-line
    strict: process.env.DEV
  })

  return Store
}
