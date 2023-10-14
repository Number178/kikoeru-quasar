import { LocalStorage } from 'quasar'
import getters from './getters'
import { SWAP_SEEK_BUTTON_KEY, ENABLE_VISUALIZER_KEY, ENABLE_PIP_LYRICS, ENABLE_VIDEO_SOURCE_KEY } from './state'

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

    const workId = payload.workId
    // 设置workId，然后配置封面，从浏览器本地Storage查找是否曾经手动配置过封面，
    // 如果没有则使用默认的封面路径
    if (workId !== state.playWorkId) {
      const localStorageName = `visual_cover_${workId}`
      let coverUrl = LocalStorage.getItem(localStorageName)
      if (!coverUrl) {
        const hash = getters.currentPlayingFile(state).hash
        coverUrl = `/api/cover/${hash.split('/')[0]}`
      }
      state.visualPlayerCoverUrl = coverUrl
    }
    state.playWorkId = workId
    if (Object.prototype.hasOwnProperty.call(payload, "resumeHistroySeconds")) {
      state.resumeHistroySeconds = payload.resumeHistroySeconds
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
  SET_HAS_LYRIC: (state, value) => {
    state.hasLyric = value;
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
  },

  SET_VISUAL_PLAYER_COVER_URL: (state, value) => {
    const localStorageName = `visual_cover_${state.playWorkId}`
    state.visualPlayerCoverUrl = value
    LocalStorage.set(localStorageName, state.visualPlayerCoverUrl)
  },

  // SET_AUDIO_ELEMENT: (state, value) => {
  //   state.audioElement = value
  // }
  
  TOGGLE_SWAP_SEEK_BUTTON: (state) => {
    state.swapSeekButton = !state.swapSeekButton
    LocalStorage.set(SWAP_SEEK_BUTTON_KEY, state.swapSeekButton)
  },

  TOGGLE_ENABLE_VISUALIZER: (state) => {
    state.enableVisualizer = !state.enableVisualizer
    LocalStorage.set(ENABLE_VISUALIZER_KEY, state.enableVisualizer)
  },

  SET_AUDIO_ANALYSER: (state, value) => {
    state.audioAnalyser = value;
  },

  SET_ENABLE_PIP_LYRICS: (state, value) => {
    state.enablePIPLyrics = value
    LocalStorage.set(ENABLE_PIP_LYRICS, state.enablePIPLyrics)
  },

  SET_RESUME_HISTROY_SECONDS: (state, value) => {
    state.resumeHistroySeconds = value
  },

  RESUME_HISTROY_SECONDS_DONE: (state) => {
    state.resumeHistroySeconds = -1
  },

  TOGGLE_ENABLE_VIDEO_SOURCE: (state) => {
    state.enableVideoSource = !state.enableVideoSource
    LocalStorage.set(ENABLE_VIDEO_SOURCE_KEY, state.enableVideoSource)
  },

  SET_ENABLE_VIDEO_SOURCE_PIP: (state, value) => {
    state.enableVideoSourcePIP = value
  },
}

export default mutations