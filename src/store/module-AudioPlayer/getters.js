const getters = {
  currentPlayingFile: (state) => {
    return state.queue[state.queueIndex] || {
      name: null,
      subtitle: null,
      hash: null
    }
  }
}

export default getters