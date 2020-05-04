<template>
  <div>
    <!-- 播放器 -->
    <q-slide-transition>
      <q-card square v-show="currentPlayingFile.hash && !hide" class="fixed-bottom-right bg-white text-black audio-player" @mousewheel.prevent @touchmove.prevent>
        <!-- 音声封面 -->
        <div class="bg-dark column justify-center albumart">
          <q-img contain transition="fade" :src="coverUrl" :ratio="4/3" />
          <q-btn dense round size="md" color="white" text-color="dark" icon="keyboard_arrow_down" @click="toggleHide()" class="absolute-top-left q-ma-sm" />
        </div>

        <!-- 进度条控件 -->
        <div class="row items-center q-mx-sm" style="height: 40px">
          <div class="col-auto">{{ formatSeconds(currentTime) }}</div>
          <AudioElement class="col" />
          <div class="col-auto">{{ formatSeconds(duration) }}</div>
        </div>

        <q-item style="height: 55px; padding: 0px 15px;" class="text-center non-selectable">
          <q-item-section>
            <q-item-label lines="2" class="text-bold">{{ currentPlayingFile.title }}</q-item-label>
            <q-item-label caption lines="1">{{ currentPlayingFile.workTitle }}</q-item-label>
          </q-item-section>
        </q-item>

        <!-- 播放按钮控件 -->
        <div class="row justify-around" style="height: 65px">
          <q-btn flat dense size="md" icon="queue_music" @click="showCurrentPlayList = !showCurrentPlayList" style="width: 55px" class="col-auto" />
          <q-btn flat dense size="lg" icon="skip_previous" @click="previousTrack()" style="width: 55px" class="col-auto" />
          <q-btn flat dense size="28px" :icon="playingIcon" @click="togglePlaying()" style="width: 65px" class="col-auto" />
          <q-btn flat dense size="lg" icon="skip_next" @click="nextTrack()" style="width: 55px" class="col-auto" />
          <q-btn flat dense size="md" :icon="playModeIcon" @click="changePlayMode()" style="width: 55px" class="col-auto" />
        </div>

        <!-- 音量控件 -->
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

    <!-- 当前播放列表 -->
    <q-dialog v-model="showCurrentPlayList">
      <q-card style="max-height: 500px; max-width: 450px; min-width: 280px;">
        <!-- 操作当前播放列表的控制按钮 -->
        <div class="row" style="padding: 5px; height: 45px;">
          <q-btn dense round size="md" icon="edit" color="primary" @click="editCurrentPlayList = !editCurrentPlayList" style="height: 35px; width: 35px;" class="col-auto" />
          <q-btn dense round size="md" icon="save" color="teal" style="height: 35px; width: 35px;" class="col-auto q-mx-sm" />
          <q-space />
          <q-btn dense round size="md" icon="delete_forever" color="red" @click="emptyQueue()" style="height: 35px; width: 35px;" class="col-auto" />
        </div>
        
        <q-separator />

        <!-- 音频文件列表 -->
        <q-list style="max-height: 450px" class="scroll">
          <draggable
            handle=".handle"
            v-model="queueCopy"
            @change="val => onMoved(val.moved)"
          >
            <q-item
              clickable
              v-ripple
              v-for="(track, index) in queueCopy"
              :key="index"
              :active="queueIndex === index"
              active-class="text-white bg-teal"
              class="non-selectable"
              style="height: 48px; padding: 0px 10px;"
              @click="onClickTrack(index)"
            >
              <q-item-section side v-show="editCurrentPlayList">
                <q-icon name="clear" :color="queueIndex === index ? 'white' : 'red'" @click="removeFromQueue(index)" />
              </q-item-section>

              <q-item-section avatar>
                <q-img transition="fade" :src="samCoverUrl(track.hash)" style="height: 38px; width: 38px" class="rounded-borders" />
              </q-item-section>

              <q-item-section>
                <q-item-label lines="1">{{ track.title }}</q-item-label>
                <q-item-label caption lines="1">{{ track.workTitle }}</q-item-label>
              </q-item-section>

              <q-item-section side class="handle" v-show="editCurrentPlayList">
                <q-icon name="reorder" :color="queueIndex === index ? 'white' : 'dark'" />
              </q-item-section>
            </q-item>
          </draggable>
        </q-list>
      </q-card>
    </q-dialog>
  </div>
</template>

<script>
import draggable from 'vuedraggable'
import AudioElement from 'components/AudioElement'
import { mapGetters } from 'vuex'

export default {
  name: 'AudioPlayer',

  components: {
    draggable,
    AudioElement
  },

  data () {
    return {
      showCurrentPlayList: false,
      editCurrentPlayList: false,
      queueCopy: []
    }
  },

  watch: {
    queue (val) {
      this.queueCopy = val.concat()
      // 在删除最后一个 track 时关闭当前播放列表
      if (this.queueCopy.length === 0) {
        this.showCurrentPlayList = false
      }
    },

    showCurrentPlayList (flag) {
      // 关闭当前播放列表后，重置 editCurrentPlayList 状态为 false
      if (flag === false) {
        this.editCurrentPlayList = false
      }
    }
  },

  computed: {
    coverUrl () {
      // 从 LocalStorage 中读取 token
      const token = this.$q.localStorage.getItem('jwt-token') || ''
      const hash = this.currentPlayingFile.hash
      return hash ? `/api/cover/${hash.split('/')[0]}?token=${token}` : ""
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

    queue: {
      get () {
        return this.$store.state.AudioPlayer.queue
      },
      set () {}
    },

    queueIndex () {
      return this.$store.state.AudioPlayer.queueIndex
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
    },

    samCoverUrl (hash) {
      // 从 LocalStorage 中读取 token
      const token = this.$q.localStorage.getItem('jwt-token') || ''
      return hash ? `/api/cover/${hash.split('/')[0]}?type=sam&token=${token}` : ""
    },

    onClickTrack (index) {
      if (!this.editCurrentPlayList) {
        this.$store.commit('AudioPlayer/SET_TRACK', index)
        this.showCurrentPlayList = false
      }
    },

    onMoved(moved) {
      let index = null
      if (moved.oldIndex === this.queueIndex) {
        index = moved.newIndex
      } else if (moved.oldIndex < this.queueIndex && moved.newIndex >= this.queueIndex) {
        index = this.queueIndex - 1
      } else if (moved.oldIndex > this.queueIndex && moved.newIndex <= this.queueIndex) {
        index = this.queueIndex + 1
      } else {
        index = this.queueIndex
      }
   
      this.$store.commit('AudioPlayer/SET_QUEUE', {
        queue: this.queueCopy.concat(),
        index: index,
        resetPlaying: false
      })
    },

    removeFromQueue (index) {
      this.$store.commit('AudioPlayer/REMOVE_FROM_QUEUE', index)
    },

    emptyQueue () {
      this.$store.commit('AudioPlayer/EMPTY_QUEUE')
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
