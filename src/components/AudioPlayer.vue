<template>
  <q-slide-transition>
    <q-card square v-show="currentPlayingFile.hash && !hide" class="fixed-bottom-right z-top  bg-white audio-player" @mousewheel.prevent @touchmove.prevent>
      <div class="bg-dark column justify-center albumart">
        <q-img :src="coverUrl" :ratio="4/3" />
        <q-btn dense round size="md" color="white" text-color="dark" icon="keyboard_arrow_down" @click="toggleHide()" class="absolute-top-left q-ma-sm" />
      </div>

      <div class="row items-center q-mx-sm" style="height: 40px">
        <div class="col-auto">{{formatSeconds(currentTime)}}</div>
        <AudioElement class="col" />
        <div class="col-auto">{{formatSeconds(duration)}}</div>
      </div>

      <q-item style="height: 55px; padding: 0px 15px;" class="text-center non-selectable">
        <q-item-section>
          <q-item-label lines="2" class="text-bold">{{ currentPlayingFile.name }}</q-item-label>
          <q-item-label caption lines="1">{{ currentPlayingFile.subtitle }}</q-item-label>
        </q-item-section>
      </q-item>

      <div class="row justify-around" style="height: 65px">
        <q-btn flat dense size="md" icon="queue_music" style="width: 55px" class="col-auto" />
        <q-btn flat dense size="lg" icon="skip_previous" @click="previousTrack()" style="width: 55px" class="col-auto" />
        <q-btn flat dense size="28px" :icon="playingIcon" @click="togglePlaying()" style="width: 65px" class="col-auto" />
        <q-btn flat dense size="lg" icon="skip_next" @click="nextTrack()" style="width: 55px" class="col-auto" />
        <q-btn flat dense size="md" :icon="playModeIcon" @click="changePlayMode()" style="width: 55px" class="col-auto" />
      </div>

      <div class="row items-center q-mx-lg" style="height: 50px">
        <q-icon name="volume_down" size="sm" class="col-auto" />
        <vue-slider 
          v-model="volume"
          :min="0"
          :max="1"
          :interval="0.01"
          :dragOnClick="true"
          :contained="true"
          tooltip="none"
          class="col"
        />
        <q-icon name="volume_up" size="sm" class="col-auto" />
      </div>
    </q-card>
  </q-slide-transition>
</template>

<script>
import AudioElement from 'components/AudioElement'
import { mapGetters } from 'vuex'

export default {
  name: 'AudioPlayer',

  components: {
    AudioElement
  },

  computed: {
    coverUrl () {
      // 从 LocalStorage 中读取 token
      const token = this.$q.localStorage.getItem('jwt-token') || ''
      const hash = this.currentPlayingFile.hash
      return hash ? `/api/cover/${hash.substring(0, hash.indexOf('/'))}?token=${token}` : ""
    },

    hide () {
      return this.$store.state.AudioPlayer.hide
    },

    currentTime () {
      return this.$store.state.AudioPlayer.currentTime
    },

    duration () {
      return this.$store.state.AudioPlayer.duration
    },

    volume: {
      get () {
        return this.$store.state.AudioPlayer.volume
      },
      set (val) {
        this.$store.commit('AudioPlayer/SET_VOLUME', val)
      }
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
      currentPlayingFile: 'AudioPlayer/currentPlayingFile'
    })
  },

  methods: {
    toggleHide () {
      this.$store.commit('AudioPlayer/TOGGLE_HIDE')
    },

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


<style lang="scss" scoped>
  .audio-player {
    // 宽度 > $breakpoint-sm-min
    @media (min-width: $breakpoint-sm-min) {
      width: 330px;
      margin: 0px 10px 10px 0px;
    }
    // 宽度 < $breakpoint-xs-max (599px)
    @media (max-width: $breakpoint-xs-max) {
      width: 100%;
      height: 100%;
    }
  }

  .albumart {
    // 宽度 < $breakpoint-xs-max (599px)
    @media (max-width: $breakpoint-xs-max) {
      width: 100%;
      height: calc(100% - 230px);
    }
  }
</style>
