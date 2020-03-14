<template>
  <div>
    <q-img
      :src="coverUrl"
      transition="jump-up"
      style="max-height: 300px;"     
    >
      <div class="column fit" style="padding:2px;">
        <!-- 控件 -->
        <div class="col full-width q-mb-sm">
          <div class="row fit">
            <!-- 音量控件 -->
            <div class="col-auto self-end">
              <div class="column items-center">
                <div class="col">
                  <vue-slider
                    v-model="volume"
                    :min="0"
                    :max="1"
                    :interval="0.01"
                    direction="btt"
                    :height="80"
                    :drag-on-click="true"
                    tooltip="none"
                    :contained="true"
                    @dragging="(value) => {setVolume(value)}"
                  />
                </div>

                <div class="col-auto">
                  <q-btn
                    flat
                    size="md"
                    :icon="volumeIcon"
                    @click="toggleMuted()"
                    class="q-ma-none"
                  />
                </div>
              </div>           
            </div>

            <!-- 播放控件 -->
            <div class="col self-center">
            
              <div class="column items-center">
                <div class="row">
                  <q-btn flat size="lg" icon="fast_rewind" @click="previousTrack()" class=""/>
                  <q-btn flat size="lg" :icon="playingIcon" @click="togglePlaying()" class=""/>
                  <q-btn flat size="lg" icon="fast_forward" @click="nextTrack()" class=""/>
                </div>
              </div>
              
            </div>

            <!-- 切换播放模式控件 -->
            <div class="col-auto self-end">
              <q-btn 
                size="md"
                flat
                :icon="playModeIcon"
                @click="changePlayMode()"
                class="q-ma-none"
              />
            </div>

          </div>
        </div>

        <!-- 播放进度条 -->
        <div class="col-auto full-width	q-mb-sm">
          <div class="row">
            <div class="col-auto">
              {{ formatSeconds(progress / 100 * duration) }}
            </div>
            
            <div class="col q-mx-xs">
              <vue-slider 
                v-model="progress"
                :min="0"
                :max="100"
                :interval="0.1"
                :tooltip-formatter="(value) => formatSeconds(value / 100 * duration)"
                :drag-on-click="true"
                :lazy="true"
                :contained="true"
                class=" "
              >
                <vue-slider
                  disabled
                  v-model="buffered"
                  :min="0"
                  :max="100"
                  :interval="0.1"
                  :contained="true"
                  :tooltip="'none'"
                  :dotStyle="{ display: 'none' }"
                  class="absolute-center"
                />
              </vue-slider>
            </div>

            <div class="col-auto">
              {{ formatSeconds(duration) }}
            </div>
          </div>  
        </div>
      </div>
    </q-img>
    
    <WorkQueue :queue="playQueue" :editable="true" />
  </div>
</template>

<script>
import WorkQueue from 'components/WorkQueue'
import { mapGetters } from 'vuex'

export default {
  name: 'Player',

  components: {
    WorkQueue,
  },

  created () {
    if (!this.currentlyPlayingHash) {
      this.$router.push('/')
    }
  },

  watch: {
    'currentlyPlayingHash': function (newHash, oldHash) {
      if (!newHash) {
        this.$router.push('/')
      }
    }
  },

  computed: {
    coverUrl () {
      const hash = this.currentlyPlayingHash
      return hash ? `/api/cover/${hash.substring(0, hash.indexOf('/'))}` : ""
    },

    duration () {
      return this.$store.state.AudioPlayer.duration
    },

    progress: {
      get () {
        return this.$store.state.AudioPlayer.progress
      },
      
      set (val) {
        this.$store.commit('AudioPlayer/SEEK', val)
      }
    },

    buffered () {
      return this.$store.state.AudioPlayer.buffered
    },

    volume: {
      get () {
        return this.$store.state.AudioPlayer.volume
      },
      set (val) {}
    },

    playQueue () {
      return this.$store.state.AudioPlayer.queue
    },

    playModeIcon () {
      switch (this.$store.state.AudioPlayer.playMode.name) {
        case "all repeat":
          return "repeat"
        case "repeat once":
          return "repeat_one"
        case "shuffle":
          return "shuffle"
        default:
          return "playlist_play"
      }
    },

    playingIcon () {
      return this.$store.state.AudioPlayer.playing ? "pause" : "play_arrow"
    },

    volumeIcon () {
      if (this.$store.state.AudioPlayer.muted) {
        return "volume_off"  
      } else {
        if (this.volume === 0) {
          return "volume_off"
        } else if (this.volume > 0 && this.volume <= 0.3) {
          return "volume_mute"
        } else if (this.volume > 0.3 && this.volume <= 0.7) {
          return "volume_down"
        } else if (this.volume > 0.7 && this.volume <= 1) {
          return "volume_up"
        }  
      }
    },

    ...mapGetters({
      currentlyPlayingHash: 'AudioPlayer/currentlyPlayingHash'
    })
  },

  methods: {
    togglePlaying () {
      this.$store.commit('AudioPlayer/TOGGLE_PLAYING')
    },

    nextTrack () {
      this.$store.commit('AudioPlayer/NEXT_TRACK')
    },

    previousTrack () {
      this.$store.commit('AudioPlayer/PREVIOUS_TRACK')
    },

    changePlayMode () {
      this.$store.commit('AudioPlayer/CHANGE_PLAY_MODE')
    },

    setVolume (val) {
      this.$store.commit('AudioPlayer/SET_VOLUME', val)
    },

    toggleMuted () {
      if (this.volume) {
        this.$store.commit('AudioPlayer/TOGGLE_MUTED')
      }
    },

    formatSeconds (seconds) {
      let h = Math.floor(seconds / 3600) < 10
        ? '0' + Math.floor(seconds / 3600)
        : Math.floor(seconds / 3600)

      let m = Math.floor((seconds / 60 % 60)) < 10
        ? '0' + Math.floor((seconds / 60 % 60))
        : Math.floor((seconds / 60 % 60))

      let s = Math.floor((seconds % 60)) < 10
        ? '0' + Math.floor((seconds % 60))
        : Math.floor((seconds % 60))

      return h === "00"
        ? m + ":" + s
        : h + ":" + m + ":" + s
    }
  }
  
}
</script>
