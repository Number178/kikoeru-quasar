<template>
  <div>

    <!-- 播放器 -->
    <div>
      <q-card 
        class="fixed-bottom-right box-shadow audio-player" 
        @mousewheel.prevent 
        @touchmove.prevent
        color="primary"
        :class="{showStyle: showAudioPlayer, hideStyle: !showAudioPlayer}"
      >
        <!--背景-->
        <div class="bg-img-blur" :style="{'background-image': `url(${coverUrl})`}"></div>

        <!-- 音声封面 -->
        <div class="row items-center albumart" @dblclick="openWorkDetail()" style="padding: 10px">
          <q-img contain class="rounded-borders box-shadow" transition="fade" :src="coverUrl" :ratio="4/3" />
          <q-btn dense round size="md" color="white" text-color="dark" icon="keyboard_arrow_down" @click="toggleHide()" class="absolute-top-left q-ma-sm" />
          <q-btn dense round size="md" color="white" text-color="dark" icon="more_vert" class="absolute-top-right q-ma-sm">
            <q-menu anchor="bottom right" self="top right">
              <q-item clickable v-ripple @click="hideSeekButton = !hideSeekButton">
                <q-item-section avatar>
                  <q-icon :name="hideSeekButton ? 'done' : ''" />
                </q-item-section>

                <q-item-section>
                  隐藏封面按钮
                </q-item-section>
              </q-item>
              
              <q-item clickable v-ripple @click="toggleSwapSeekButton">
                <q-item-section avatar>
                  <q-icon :name="swapSeekButton ? 'done' : ''" />
                </q-item-section>
                <q-item-section>
                  交换进度按钮与切换按钮
                </q-item-section>
              </q-item>
              
              <q-item clickable v-ripple @click="openWorkDetail()" v-close-popup>
                <q-item-section avatar>
                  <!-- placeholder -->
                </q-item-section>
                <q-item-section>
                  打开作品详情（或双击封面）
                </q-item-section>
              </q-item>
              
              <q-item clickable v-ripple @click="toggleEnableVisualizer">
                <q-item-section avatar>
                  <q-icon :name="enableVisualizer ? 'done' : ''" />
                </q-item-section>
                <q-item-section>
                  开启音频可视化（需要刷新页面）
                </q-item-section>
              </q-item>

              <q-item :disable="isAndroid" clickable v-ripple @click="setPIPLyrics">
                <q-item-section avatar>
                  <q-icon :name="enablePIPLyrics ? 'done' : ''" />
                </q-item-section>
                <q-item-section>
                  {{ isAndroid ? "尚不支持Android桌面歌词" : "打开桌面歌词" }}
                </q-item-section>
              </q-item>
            </q-menu>
          </q-btn>
          <div class="row absolute q-pl-md q-pr-md col-12 justify-between">
            <q-btn v-if="!hideSeekButton" round size="lg" color="white" text-color="dark" style="opacity: 0.8" @click="swapSeekButton ? previousTrack() : rewind(true)" :icon="swapSeekButton ? 'skip_previous': rewindIcon" />
            <q-btn v-if="!hideSeekButton" round size="lg" color="white" text-color="dark" style="opacity: 0.8" @click="swapSeekButton ? nextTrack() : forward(true)" :icon="swapSeekButton ? 'skip_next' : forwardIcon" />
          </div>
        </div>

        <!-- 进度条控件 -->
        <div class="row items-center q-mx-sm q-my-sm" style="height: 40px;">
          <div class="col-auto z-top">{{ formatSeconds(currentTime) }}</div>
          <AudioElement class="col" />
          <div class="col-auto z-top">{{ formatSeconds(duration) }}</div>
        </div>

        <!-- Place holder for iOS -->
        <div style="height: 5px" v-if="$q.platform.is.ios" />

        <q-item style="height: 55px; padding: 0px 15px;" class="text-center non-selectable">
          <q-item-section>
            <q-item-label class="text-bold">{{ currentPlayingFile.title }}</q-item-label>
            <q-item-label caption lines="1">{{ currentPlayingFile.workTitle }}</q-item-label>
          </q-item-section>
        </q-item>

        <!-- Place holder for iOS -->
        <div  style="height: 10px" v-if="$q.platform.is.ios" />

        <!-- 播放按钮控件 -->
        <div class="row justify-around" style="height: 65px">
          <q-btn flat dense class="col-auto" size="md"   icon="queue_music" @click="showCurrentPlayList = !showCurrentPlayList" style="width: 55px" />
          <q-btn flat dense class="col-auto" size="lg"   :icon="swapSeekButton ? rewindIcon : 'skip_previous'" @click="swapSeekButton ? rewind(true) : previousTrack()" style="width: 55px" />
          <q-btn flat dense class="col-auto" size="28px" :icon="playingIcon" @click="togglePlaying()" style="width: 65px" />
          <q-btn flat dense class="col-auto" size="lg"   :icon="swapSeekButton ? forwardIcon : 'skip_next'" @click="swapSeekButton ? forward(true) : nextTrack()" style="width: 55px" />
          <q-btn flat dense class="col-auto" size="md"   :icon="playModeIcon" @click="changePlayMode()" style="width: 55px" />
        </div>

        <!-- 音量控件 -->
        <!-- HTML5 volume in iOS is read-only -->
        <div class="row items-center q-mx-lg" style="height: 50px" v-if="!$q.platform.is.ios">
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
    </div>

    <!-- 当前播放列表 -->
    <q-dialog v-model="showCurrentPlayList">
      <q-card class="current-play-list">
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
              style="padding: 0px 10px;"
              @click="onClickTrack(index)"
            >
              <q-item-section side v-show="editCurrentPlayList">
                <q-icon name="clear" :color="queueIndex === index ? 'white' : 'red'" @click="removeFromQueue(index)" />
              </q-item-section>

              <q-item-section avatar>
                <q-img transition="fade" :src="samCoverUrl(track.hash)" style="height: 38px; width: 38px" class="rounded-borders" />
              </q-item-section>

              <q-item-section>
                <q-item-label>{{ track.title }}</q-item-label>
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
import { mapState, mapGetters, mapMutations } from 'vuex'

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
      queueCopy: [],
      hideSeekButton: false,
      isAndroid: navigator.userAgent.toLowerCase().indexOf('android') > -1,
      histroyCheckIntervalId: -1,
      latestUpdatedHistory: null, // 记录最近一次更新的历史记录，防止反复对同一个播放历史进行远程数据更新
    }
  },

  mounted () {
    if (this.$q.localStorage.has('hideSeekButton')) {
      this.hideSeekButton = this.$q.localStorage.getItem('hideSeekButton')
    }
    this.histroyCheckIntervalId = setInterval(() => {
      this.onUpdatePlayingStatus()
    }, 60 * 1000) // 每隔一段时间更新一次播放记录
  },

  beforeDestroy() {
    clearInterval(this.histroyCheckIntervalId)

    // 原本是想要在关闭窗口时，更新最后一次播放历史
    // 但是实际测试下来，关闭窗口时根本没有来得及发送最后一次更新消息，于是放弃这个方案
    // this.onUpdatePlayingStatus()
  },

  watch: {
    queue (val) {
      this.queueCopy = val.concat()
      // 在删除最后一个 track 时关闭当前播放列表
      if (this.queueCopy.length === 0) {
        this.showCurrentPlayList = false
      } else {
        // 播放列表发生变化，且更新后不为空的情况下
        // 更新播放历史
        this.onUpdatePlayingStatus()
      }
    },

    queueIndex() {
      // 当前播放序号发生变化时更新历史
      this.onUpdatePlayingStatus()
    },

    showCurrentPlayList (flag) {
      // 关闭当前播放列表后，重置 editCurrentPlayList 状态为 false
      if (flag === false) {
        this.editCurrentPlayList = false
      }
    },

    hideSeekButton (option) {
      this.$q.localStorage.set('hideSeekButton', option)
    },

    playing() {
      this.onUpdatePlayingStatus()
    },

    // 监听 前进、后退 进度条时间，
    // 当 ***SeekMode 变为false，表明进度条跳转已经完成
    rewindSeekMode(v) {
      if (!v) {
        // 当用户前进后退时，currentTime可能并没有立即从audio元素中反馈到vue状态里，
        // 因此这里需要延迟一小会，等待audio前进后退之后的更新时间抵达vue的currentTime状态，
        // 然后再去更新播放历史
        setTimeout(() => {
          this.onUpdatePlayingStatus()
        }, 100) 
      }
    },
    forwardSeekMode(v) {
      if (!v) {
        // 当用户前进后退时，currentTime可能并没有立即从audio元素中反馈到vue状态里，
        // 因此这里需要延迟一小会，等待audio前进后退之后的更新时间抵达vue的currentTime状态，
        // 然后再去更新播放历史
        setTimeout(() => {
          this.onUpdatePlayingStatus()
        }, 100)
      }
    },
    currentTime() {
      if (!this.playing) {
        // 暂停状态下切换时间，也更新播放历史
        this.onUpdatePlayingStatus()
      }
    }
  },

  computed: {
    showAudioPlayer () {
      return this.currentPlayingFile.hash && !this.hide;
    },

    coverUrl () {
      // 从 LocalStorage 中读取 token
      const token = this.$q.localStorage.getItem('jwt-token') || ''
      const hash = this.currentPlayingFile.hash
      return hash ? `/api/cover/${hash.split('/')[0]}?token=${token}` : ""
    },

    workDetailUrl () {
      const hash = this.currentPlayingFile.hash
      return hash ? `/work/${hash.split('/')[0]}` : ""
    },

    volume: {
      get () {
        return this.$store.state.AudioPlayer.volume
      },
      set (val) {
        this.SET_VOLUME(val)
      }
    },

    queue: {
      get () {
        return this.$store.state.AudioPlayer.queue
      },
      set () {}
    },

    playModeIcon () {
      switch (this.playMode.name) {
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
      return this.playing ? "pause" : "play_arrow"
    },

    rewindIcon () {
      switch (this.rewindSeekTime) {
        case 5:
          return 'replay_5'
        case 10:
          return 'replay_10'
        case 30:
          return 'replay_30'
        default:
          return 'replay_5'
      }
    },

    forwardIcon () {
      switch (this.forwardSeekTime) {
        case 5:
          return 'forward_5'
        case 10:
          return 'forward_10'
        case 30:
          return 'forward_30'
        default:
          return 'forward_5'
      }
    },

    ...mapState('AudioPlayer', [
      'playing',
      'hide',
      'currentTime',
      'duration',
      'queueIndex',
      'playMode',
      'rewindSeekTime',
      'forwardSeekTime',
      'swapSeekButton',
      'enableVisualizer',
      'enablePIPLyrics',
      'playWorkId',
      'rewindSeekMode',
      'forwardSeekMode'
    ]),
    
    ...mapGetters('AudioPlayer', [
      'currentPlayingFile',
      'resumeHistroyDone',
    ])
  },

  methods: {
    ...mapMutations('AudioPlayer', {
      toggleHide: 'TOGGLE_HIDE',
      togglePlaying: 'TOGGLE_PLAYING',
      nextTrack: 'NEXT_TRACK',
      previousTrack: 'PREVIOUS_TRACK',
      changePlayMode: 'CHANGE_PLAY_MODE',
      setVolume: 'SET_VOLUME',
      rewind: 'SET_REWIND_SEEK_MODE',
      forward: 'SET_FORWARD_SEEK_MODE',
      toggleSwapSeekButton: 'TOGGLE_SWAP_SEEK_BUTTON',
      toggleEnableVisualizer: 'TOGGLE_ENABLE_VISUALIZER',
      setEnablePIPLyrics: 'SET_ENABLE_PIP_LYRICS',
    }),
    ...mapMutations('AudioPlayer', [
      'SET_TRACK',
      'SET_QUEUE',
      'REMOVE_FROM_QUEUE',
      'EMPTY_QUEUE',
      'SET_VOLUME',
    ]),

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
        this.SET_TRACK(index)
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
   
      this.SET_QUEUE({
        queue: this.queueCopy.concat(),
        index: index,
        resetPlaying: false
      })
    },

    removeFromQueue (index) {
      this.REMOVE_FROM_QUEUE(index)
    },

    emptyQueue () {
      this.EMPTY_QUEUE()
    },

    openWorkDetail () {
      if (this.workDetailUrl && this.$route.path !== this.workDetailUrl) {
        this.$router.push(this.workDetailUrl)
      }
      if (this.$q.screen.lt.sm) {
          this.toggleHide()
      }
    },

    setPIPLyrics() {
      if (!this.enablePIPLyrics) {
        this.$q.notify({message: "创建桌面歌词组件中，请稍等...", timeout: 500})
      }
      this.setEnablePIPLyrics(!this.enablePIPLyrics)
    },
    
    // return true if two history updated on (onUpdatePlayingStatus) is same
    isSameTwoHistory(ha, hb) {
      // 如果有任意一个是null，则认为两者不一样
      if (!(ha && hb)) return false;
      
      if (ha.work_id != hb.work_id) return false;
      if (ha.state.seconds != hb.state.seconds) return false;
      if (ha.state.index != hb.state.index) return false;
      if (ha.state.queue.length != hb.state.queue.length) return false;
      for (let i = 0; i < ha.state.queue.length; ++i) {
        if (ha.state.queue[i].hash != hb.state.queue[i].hash) return false;
      }
      return true;
    },
    
    onUpdatePlayingStatus() {
      // 当前播放列表为空，禁止记录播放历史
      if (this.queueCopy.length <= 0) return;

      // 尚处于恢复历史记录的阶段，为了避免此时将空状态写入远程服务器覆盖有效状态，跳过本次历史更新
      if (!this.resumeHistroyDone) {
        console.log("尚处于恢复历史记录的状态，跳过本次历史更新")
        return
      }

      const data = {
        "work_id": this.playWorkId,
        "state": {
          queue: this.queueCopy,
          index: this.queueIndex,
          seconds: this.currentTime,
        }
      }

      // 检查最近一次的历史更新记录，如果两次数据不变，则无需更新记录
      if (this.isSameTwoHistory(this.latestUpdatedHistory, data)) {
        console.log("播放状态未变，跳过服务器历史更新")
        return
      }

      this.$axios.put('/api/histroy', data)
        .then((_) => {
          console.log("更新播放状态成功")
          this.latestUpdatedHistory = data;
        })
        .catch((err) => {
          console.error(err.response.data.error)
        })
    },
  }
}
</script>


<style lang="scss" scoped>
  .box-shadow {
    box-shadow: black 0px 0px 8px;
  }

  .audio-player {
    // 宽度 > $breakpoint-sm-min
    @media (min-width: $breakpoint-sm-min) {
      width: 330px;
      margin: 0px 10px 10px 0px;
      border-radius: 8px;
    }
    // 宽度 < $breakpoint-xs-max (599px)
    @media (max-width: $breakpoint-xs-max) {
      width: 100%;
      height: 100%;
      border-radius: 0;
    }

    transition: 0.5s;
    overflow: hidden;
  }

  .bg-img-blur {
    left: 0;
    right: 0;
    bottom: 0;
    top: 0;
    position: absolute;
    transform: scale(1.5);
    background-position: 50% 50%;
    background-size: contain;
    
    filter: blur(30px) brightness(0.7); // blur bigger than 80 will cause safari wrong render result
  }

  .hideStyle {
    transform: translateY(200%);
  }

  .showStyle {
    transform: translateY(0);
  }

  .albumart {
    // 宽度 < $breakpoint-xs-max (599px)
    @media (max-width: $breakpoint-xs-max) {
      width: 100%;
      height: calc(100% - 230px);
    }
  }

  .current-play-list {
    max-height: 500px;

    // 宽度 > $breakpoint-xs-max
    @media (min-width: $breakpoint-xs-max) {
      width: 450px;
    }
    // 宽度 < $breakpoint-xs-max (599px)
    @media (max-width: $breakpoint-xs-max) {
      min-width: 280px;
    }
  }
</style>
