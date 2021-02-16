const mutations = {
  TOGGLE_HIDE (state) {
    state.hide = !state.hide
  },

  PLAY (state) {
    state.playing = true
  },
  PAUSE (state) {
    state.playing = false
  },
  TOGGLE_PLAYING (state) {
    state.playing = !state.playing
  },

  // Play a specific file from the queue.
  SET_TRACK: (state, index) => {
    if (index >= state.queue.length || index < 0) {
      return; // Invalid index, bail.
    }

    state.playing = true
    state.queueIndex = index
  },
  NEXT_TRACK: (state) => {
    if (state.queueIndex < state.queue.length - 1) {
      // Go to next track only if it exists.
      state.playing = true
      state.queueIndex += 1
    }
  },
  PREVIOUS_TRACK: (state) => {
    if (state.queueIndex > 0) {
      // Go to previous track only if it exists.
      state.playing = true
      state.queueIndex -= 1
    }
  },

  SET_QUEUE (state, payload) {
    state.queue = payload.queue
    state.queueIndex = payload.index

    if (payload.resetPlaying) {
      state.playing = true
    }    
  },
  EMPTY_QUEUE: (state) => {
    state.playing = false
    state.queue = []
    state.queueIndex = 0
  },
  ADD_TO_QUEUE: (state, file) => {
    state.queue.push(file)
  },
  REMOVE_FROM_QUEUE: (state, index) => {
    state.queue.splice(index, 1)

    if (index === state.queueIndex) {
      state.playing = false
      state.queueIndex = 0
    } else if (index < state.queueIndex) {
      state.queueIndex -= 1
    } 
  },


  SET_DURATION (state, second) {
    state.duration = second
  },

  SET_CURRENT_TIME (state, second) {
    state.currentTime = second
  },

  // Add a file after the current playing item in the queue.
  PLAY_NEXT: (state, file) => {
    state.queue.splice(state.queueIndex + 1, 0, file);
  },

  CHANGE_PLAY_MODE: (state) => {
    const playModes = [
      {
        id: 0,
        name: "order"
      },
      {
        id: 1,
        name: "all repeat"
      },
      {
        id: 2,
        name: "repeat once"
      },
      {
        id: 3,
        name: "shuffle"
      }
    ]
    const index = (state.playMode.id >= playModes.length - 1) ? 0 : (state.playMode.id + 1)

    state.playMode = playModes[index]
  },

  TOGGLE_MUTED: (state) => {
    state.muted = !state.muted
  },

  SET_VOLUME: (state, val) => {
    if (val < 0 || val > 1) {
      return
    }
    state.volume = val
  },
  SET_REWIND_SEEK_TIME: (state, value) => {
    state.rewindSeekTime = value
  },
  SET_FORWARD_SEEK_TIME: (state, value) => {
    state.forwardSeekTime = value
  },
  SET_REWIND_SEEK_MODE: (state, value) => {
    state.rewindSeekMode = value
  },
  SET_FORWARD_SEEK_MODE: (state, value) => {
    state.forwardSeekMode = value
  },
  SET_CURRENT_LYRIC: (state, line) => {
    state.currentLyric = line
  },
  SET_SLEEP_TIMER: (state, time) => {
    state.sleepTime = time
    state.sleepMode = true
  },

  CLEAR_SLEEP_MODE: (state) => {
    state.sleepTime = null
    state.sleepMode = false
  }
}

export default mutations