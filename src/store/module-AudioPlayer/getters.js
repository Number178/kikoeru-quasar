const getters = {
  currentPlayingFile: (state) => {
    return state.queue[state.queueIndex] || {
      hash: '',
      title: '',
      workTitle: ''
    }
  },

  isCurrentPlayingFileVideo: (state) => {
    const title = (state.queue[state.queueIndex] || {title: ''}).title;
    return title.endsWith("mp4");
  },

  resumeHistroyDone: (state) => {
    return state.resumeHistroySeconds < 0
  },

  isQueueEmpty: (state) => {
    return state.queue.length == 0
  },
}

export default getters