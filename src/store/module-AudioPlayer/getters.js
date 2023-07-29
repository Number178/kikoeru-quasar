const getters = {
  currentPlayingFile: (state) => {
    return state.queue[state.queueIndex] || {
      hash: '',
      title: '',
      workTitle: ''
    }
  },

  resumeHistroyDone: (state) => {
    return state.resumeHistroySeconds < 0
  },

  isQueueEmpty: (state) => {
    return state.queue.length == 0
  }
}

export default getters