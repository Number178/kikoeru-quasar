const getters = {
  currentlyPlayingHash: (state) => {
    return state.queue[state.queueIndex]
    ? state.queue[state.queueIndex].hash
    : null
  },

  currentlyPlayingTitle: (state) => {
    return state.queue[state.queueIndex]
    ? state.queue[state.queueIndex].title
    : null
  }
}

export default getters