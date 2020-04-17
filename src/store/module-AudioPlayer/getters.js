const getters = {
  currentPlayingHash: (state) => {
    return state.queue[state.queueIndex]
    ? state.queue[state.queueIndex].hash
    : null
  },

  currentPlayingTitle: (state) => {
    return state.queue[state.queueIndex]
    ? state.queue[state.queueIndex].title
    : null
  }
}

export default getters